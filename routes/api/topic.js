'use strict';

/**
 * Topic API-s (/api/../topics/..)
 */


module.exports = function (app) {
    const config = app.get('config');
    const logger = app.get('logger');
    const models = app.get('models');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const _ = app.get('lodash');
    const validator = app.get('validator');
    const util = app.get('util');
    const urlLib = app.get('urlLib');
    const emailLib = app.get('email');
    const cosSignature = app.get('cosSignature');
    const cosActivities = app.get('cosActivities');
    const Promise = app.get('Promise');
    const sanitizeFilename = app.get('sanitizeFilename');
    const cryptoLib = app.get('cryptoLib');
    const cosEtherpad = app.get('cosEtherpad');
    const smartId = app.get('smartId');
    const mobileId = app.get('mobileId');
    const jwt = app.get('jwt');
    const cosJwt = app.get('cosJwt');
    const querystring = app.get('querystring');
    const objectEncrypter = app.get('objectEncrypter');
    const twitter = app.get('twitter');
    const hashtagCache = app.get('hashtagCache');
    const moment = app.get('moment');
    const encoder = app.get('encoder');
    const URL = require('url');
    const https = require('https');

    const loginCheck = app.get('middleware.loginCheck');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const partnerParser = app.get('middleware.partnerParser');
    const DEPRECATED = app.get('middleware.deprecated'); // CAPS for ease of spotting in the code
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const authUser = require('./auth')(app);
    const User = models.User;
    const UserConnection = models.UserConnection;
    const Group = models.Group;

    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicMemberGroup = models.TopicMemberGroup;
    const TopicReport = models.TopicReport;
    const TopicInviteUser = models.TopicInviteUser;

    const Report = models.Report;

    const Comment = models.Comment;
    const CommentVote = models.CommentVote;
    const CommentReport = models.CommentReport;

    const Vote = models.Vote;
    const VoteOption = models.VoteOption;
    const VoteUserContainer = models.VoteUserContainer;
    const VoteList = models.VoteList;
    const VoteDelegation = models.VoteDelegation;

    const TopicComment = models.TopicComment;
    const TopicEvent = models.TopicEvent;
    const TopicVote = models.TopicVote;
    const TopicAttachment = models.TopicAttachment;
    const Attachment = models.Attachment;
    const TopicPin = models.TopicPin;

    const _hasPermission = async function (topicId, userId, level, allowPublic, topicStatusesAllowed, allowSelf, partnerId) {
        const LEVELS = {
            none: 0, // Enables to override inherited permissions.
            read: 1,
            edit: 2,
            admin: 3
        };
        const minRequiredLevel = level;

        // TODO: That casting to "enum_TopicMemberUsers_level". Sequelize does not support naming enums, through inheritance I have 2 enums that are the same but with different name thus different type in PG. Feature request - https://github.com/sequelize/sequelize/issues/2577
        return db
            .query(
                'SELECT \
                    t.visibility = \'public\' AS "isPublic", \
                    t.status, \
                    COALESCE(\
                        tmup.level, \
                        tmgp.level, \
                        CASE \
                            WHEN t.visibility = \'public\' THEN \'read\' ELSE NULL \
                        END, \
                        \'none\'\
                    ) as level, \
                    COALESCE(tmup.level, tmgp.level, \'none\')::"enum_TopicMemberUsers_level" >= :level AS "hasDirectAccess", \
                    t."sourcePartnerId" \
                FROM "Topics" t \
                    LEFT JOIN ( \
                        SELECT \
                            tmu."topicId",  \
                            tmu."userId",  \
                            tmu.level::text AS level  \
                        FROM "TopicMemberUsers" tmu  \
                        WHERE tmu."deletedAt" IS NULL  \
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)  \
                    LEFT JOIN (  \
                        SELECT  \
                            tmg."topicId",  \
                            gm."userId",  \
                            MAX(tmg.level)::text AS level  \
                        FROM "TopicMemberGroups" tmg  \
                            JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId")  \
                        WHERE tmg."deletedAt" IS NULL  \
                        AND gm."deletedAt" IS NULL  \
                        GROUP BY "topicId", "userId"  \
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)  \
                WHERE t.id = :topicId \
                AND t."deletedAt" IS NULL; \
                ',
                {
                    replacements: {
                        topicId: topicId,
                        userId: userId,
                        level: level
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            )
            .then(function (result) {
                if (result && result[0]) {
                    const isPublic = result[0].isPublic;
                    const status = result[0].status;
                    const hasDirectAccess = result[0].hasDirectAccess;
                    const level = result[0].level;
                    const sourcePartnerId = result[0].sourcePartnerId;
                    if (hasDirectAccess || (allowPublic && isPublic) || allowSelf) {
                        // If Topic status is not in the allowed list, deny access.
                        if (topicStatusesAllowed && !(topicStatusesAllowed.indexOf(status) > -1)) {
                            logger.warn('Access denied to topic due to status mismatch! ', 'topicStatusesAllowed:', topicStatusesAllowed, 'status:', status);

                            return Promise.reject();
                        }

                        // Don't allow Partner to edit other Partners topics
                        if (!isPublic && partnerId && sourcePartnerId) {
                            if (partnerId !== sourcePartnerId) {
                                logger.warn('Access denied to topic due to Partner mismatch! ', 'partnerId:', partnerId, 'sourcePartnerId:', sourcePartnerId);

                                return Promise.reject();
                            }
                        }

                        if (!allowSelf && (LEVELS[minRequiredLevel] > LEVELS[level])) {
                            logger.warn('Access denied to topic due to member without permissions trying to delete user! ', 'userId:', userId);

                            return Promise.reject();
                        }

                        const authorizationResult = {
                            topic: {
                                id: topicId,
                                isPublic: isPublic,
                                sourcePartnerId: sourcePartnerId,
                                status: status,
                                permissions: {
                                    level: level,
                                    hasDirectAccess: hasDirectAccess
                                }
                            }
                        };

                        return Promise.resolve(authorizationResult);
                    } else {
                        return Promise.reject();
                    }
                } else {
                    return Promise.reject();
                }
            });
    };

    /**
     * Check if User has sufficient privileges to access the Object.
     *
     * @param {string} level One of TopicMemberUser.LEVELS
     * @param {boolean} [allowPublic=false] Allow access to Topic with "public" visibility.
     * @param {string[]} [topicStatusesAllowed=null] Allow access to Topic which is in one of the allowed statuses. IF null, then any status is OK
     * @param {boolean} [allowSelf=false] Allow access when caller does action to is own user
     *
     * @returns {Function} Express middleware function
     */
    const hasPermission = function (level, allowPublic, topicStatusesAllowed, allowSelf) {
        return function (req, res, next) {
            const userId = req.user.id;
            const partnerId = req.user.partnerId;
            const topicId = req.params.topicId;

            allowPublic = allowPublic ? allowPublic : false;

            if (req.user && req.user.moderator) {
                allowPublic = true;
            }

            topicStatusesAllowed = topicStatusesAllowed ? topicStatusesAllowed : null;
            let allowSelfDelete = allowSelf ? allowSelf : null;
            if (allowSelfDelete && req.user.id !== req.params.memberId) {
                allowSelfDelete = false;
            }

            if (topicStatusesAllowed && !Array.isArray(topicStatusesAllowed)) {
                throw new Error('topicStatusesAllowed must be an array but was ', topicStatusesAllowed);
            }

            _hasPermission(topicId, userId, level, allowPublic, topicStatusesAllowed, allowSelfDelete, partnerId)
                .then(
                    function (authorizationResult) {
                        // Add "req.locals" to store info collected from authorization for further use in the request. Might save a query or two for some use cases.
                        // Naming convention ".locals" is inspired by "res.locals" - http://expressjs.com/api.html#res.locals
                        req.locals = authorizationResult;

                        return new Promise(function (resolve) {
                            return resolve(next(null, req, res));
                        });
                    },
                    function (err) {
                        if (err) {
                            return next(err);
                        }

                        return res.forbidden('Insufficient permissions');
                    }
                )
                .catch(next);
        };
    };

    const hasVisibility = function (visibility) {
        return function (req, res, next) {
            return Topic
                .count({
                    where: {
                        id: req.params.topicId,
                        visibility: visibility
                    }
                })
                .then(function (count) {
                    if (!count) {
                        return res.notFound();
                    }
                    next();

                    return null; // NOTE: Avoids Bluebird throwing a warning about not returning a promise - http://goo.gl/rRqMUw
                })
                .catch(next);
        };
    };

    const _isModerator = function (topicId, userId) {
        return new Promise(function (resolve, reject) {
            db
                .query(
                    '\
                    SELECT \
                        t."id" as "topicId", \
                        m."userId", \
                        m."partnerId" \
                    FROM "Topics" t \
                    JOIN "Moderators" m \
                        ON (m."partnerId" = t."sourcePartnerId" OR m."partnerId" IS NULL) \
                        AND m."userId" = :userId \
                    WHERE t.id = :topicId \
                    AND t."deletedAt" IS NULL \
                    AND m."deletedAt" IS NULL \
                    ;',
                    {
                        replacements: {
                            topicId: topicId,
                            userId: userId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true
                    }
                )
                .then(function (result) {
                    if (result && result[0]) {
                        const isUserModerator = result[0].userId === userId;
                        const isTopicModerator = result[0].topicId === topicId;

                        if (isUserModerator && isTopicModerator) {
                            return resolve({isModerator: result[0].partnerId ? result[0].partnerId : true});
                        }
                    }

                    return resolve(false);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    };

    /**
     * NOTE! This does not block access in case of not being a Moderator, but only adds moderator flag to user object.
     *
     * @returns {Function} Express middleware function
     */
    const isModerator = function () {
        return function (req, res, next) {
            const topicId = req.params.topicId;
            let userId;

            if (req.user) {
                userId = req.user.id;
            }

            if (!topicId || !userId) {
                return new Promise(function (resolve) {
                    return resolve(next(null, req, res));
                });
            }

            _isModerator(topicId, userId)
                .then(
                    function (result) {
                        if (result) {
                            req.user.moderator = result.isModerator;
                        }

                        return new Promise(function (resolve) {
                            return resolve(next(null, req, res));
                        });
                    },
                    function (err) {
                        return next(err);
                    }
                )
                .catch(next);
        };
    };

    /**
     * Middleware to check for Moderator permissions. Rejects request if there are no Moderator permissions.
     *
     * @returns {Function} Express middleware function
     */
    const hasPermissionModerator = function () {
        return function (req, res, next) {
            const topicId = req.params.topicId;
            let userId;

            if (req.user) {
                userId = req.user.id;
            }

            if (!topicId || !userId) {
                return res.unauthorised();
            }

            _isModerator(topicId, userId)
                .then(function (result) {
                    if (result) {
                        req.user.moderator = result.isModerator;

                        return next(null, req, res);
                    } else {
                        return res.unauthorised();
                    }
                })
                .catch(next);
        };
    };

    const isCommentCreator = function () {
        return function (req, res, next) {
            const userId = req.user.id;
            const commentId = req.params.commentId;

            Comment
                .findOne({
                    where: {
                        id: commentId,
                        creatorId: userId,
                        deletedAt: null
                    }
                })
                .then(function (comment) {
                    if (comment) {
                        return next('route');
                    } else {
                        return res.forbidden('Insufficient permissions');
                    }
                })
                .catch(next);
        };
    };

    const getVoteResults = function (voteId, userId) {
        let includeVoted = '';
        if (userId) {
            includeVoted = ',(SELECT true FROM votes WHERE "userId" = :userId AND "optionId" = v."optionId") as "selected" ';
        }

        return db
            .query(
                ' \
                    WITH \
                        RECURSIVE delegations("voteId", "toUserId", "byUserId", depth) AS ( \
                            SELECT \
                                "voteId", \
                                "toUserId", \
                                "byUserId", \
                                1 \
                            FROM "VoteDelegations" vd \
                            WHERE vd."voteId" = :voteId \
                              AND vd."deletedAt" IS NULL \
                            \
                            UNION ALL \
                            \
                            SELECT \
                                vd."voteId", \
                                vd."toUserId", \
                                dc."byUserId", \
                                dc.depth+1 \
                            FROM delegations dc, "VoteDelegations" vd \
                            WHERE vd."byUserId" = dc."toUserId" \
                              AND vd."voteId" = dc."voteId" \
                              AND vd."deletedAt" IS NULL \
                        ), \
                        indirect_delegations("voteId", "toUserId", "byUserId", depth) AS ( \
                            SELECT DISTINCT ON("byUserId") \
                                "voteId", \
                                "toUserId", \
                                "byUserId", \
                                depth \
                            FROM delegations \
                            ORDER BY "byUserId", depth DESC \
                        ), \
                        vote_groups("voteId", "userId", "optionGroupId", "updatedAt") AS ( \
                            SELECT DISTINCT ON (vl."userId") vl."voteId", vl."userId", vli."optionGroupId", vl."updatedAt" \
                            FROM ( \
                                SELECT DISTINCT ON (vl."userId", MAX(vl."updatedAt")) \
                                vl."userId", \
                                vl."voteId", \
                                MAX(vl."updatedAt") as "updatedAt" \
                                FROM "VoteLists" vl \
                                WHERE vl."voteId" = :voteId \
                                AND vl."deletedAt" IS NULL \
                                GROUP BY vl."userId", vl."voteId" \
                                ORDER BY MAX(vl."updatedAt") DESC \
                            ) vl \
                            JOIN "VoteLists" vli \
                            ON \
                                vli."userId" = vl."userId" \
                                AND vl."voteId" = vli."voteId" \
                                AND vli."updatedAt" = vl."updatedAt" \
                            WHERE vl."voteId" = :voteId \
                                AND vl."userId" NOT IN \
                                ( \
                                    SELECT DISTINCT \
                                        uc."connectedUser" \
                                    FROM ( \
                                        SELECT \
                                            vl."userId", \
                                            vl."updatedAt" \
                                        FROM "VoteLists" vl \
                                        WHERE vl."voteId" = :voteId \
                                        AND vl."deletedAt" IS NULL \
                                        ORDER BY vl."updatedAt" DESC \
                                    ) vl \
                                    JOIN \
                                    ( \
                                        SELECT \
                                            uc."userId", \
                                            uci."userId" as "connectedUser", \
                                            uc."connectionId", \
                                            uc."connectionUserId" \
                                        FROM "UserConnections" uc \
                                        JOIN "UserConnections" uci \
                                            ON uc."connectionId" = uci."connectionId" \
                                            AND uc."connectionUserId" = uci."connectionUserId" \
                                            AND uc."userId" <> uci."userId" \
                                    ) uc ON uc."userId" = vl."userId" \
                                    JOIN ( \
                                        SELECT \
                                            vl."userId", \
                                            vl."updatedAt" \
                                            FROM "VoteLists" vl \
                                            WHERE vl."voteId" = :voteId \
                                                AND vl."deletedAt" IS NULL \
                                            ORDER BY vl."updatedAt" DESC \
                                    ) vli ON uc."connectedUser" = vli."userId" AND vli."updatedAt" < vl."updatedAt" \
                                ) \
                        ), \
                        votes("voteId", "userId", "optionId", "optionGroupId") AS ( \
                            SELECT \
                                vl."voteId", \
                                vl."userId", \
                                vl."optionId", \
                                vl."optionGroupId" \
                            FROM "VoteLists" vl \
                            JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."optionGroupId" = vg."optionGroupId") \
                            WHERE vl."voteId" =  :voteId \
                        ), \
                        votes_with_delegations("voteId", "userId", "optionId", "optionGroupId", depth) AS ( \
                            SELECT \
                                v."voteId", \
                                v."userId", \
                                v."optionId", \
                                v."optionGroupId", \
                                id."depth" \
                            FROM votes v \
                            LEFT JOIN indirect_delegations id ON (v."userId" = id."toUserId") \
                            WHERE v."userId" NOT IN (SELECT "byUserId" FROM indirect_delegations WHERE "voteId"=v."voteId") \
                        ) \
                    \
                    SELECT \
                        SUM(v."voteCount")::integer as "voteCount", \
                        v."optionId", \
                        v."voteId", \
                        vo."value" \
                        ' + includeVoted + ' \
                    FROM ( \
                        SELECT \
                            COUNT(v."optionId") + 1 as "voteCount", \
                            v."optionId", \
                            v."optionGroupId", \
                            v."voteId" \
                        FROM votes_with_delegations v \
                        WHERE v.depth IS NOT NULL \
                        GROUP BY v."optionId", v."optionGroupId", v."voteId" \
                        \
                        UNION ALL \
                        \
                        SELECT \
                            COUNT(v."optionId") as "voteCount", \
                            v."optionId", \
                            v."optionGroupId", \
                            v."voteId" \
                        FROM votes_with_delegations v \
                        WHERE v.depth IS NULL \
                        GROUP BY v."optionId", v."optionGroupId", v."voteId" \
                    ) v \
                    LEFT JOIN "VoteOptions" vo ON (v."optionId" = vo."id") \
                    GROUP BY v."optionId", v."voteId", vo."value" \
                ;',
                {
                    replacements: {
                        voteId: voteId,
                        userId: userId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );
    };

    const getBdocURL = function (params) {
        const userId = params.userId;
        const topicId = params.topicId;
        const voteId = params.voteId;
        const type = params.type;

        let path;
        const tokenPayload = {};
        const tokenOptions = {
            expiresIn: '1d'
        };

        if (type === 'user') {
            path = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user';
        }

        if (type === 'final') {
            path = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/final';
        }

        if (type === 'goverment') {
            tokenOptions.expiresIn = '30d';
            path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/final';
        }

        if (userId) {
            tokenPayload.userId = userId;
        }

        path = path
            .replace(':topicId', topicId)
            .replace(':voteId', voteId);

        const urlOptions = {
            token: cosJwt.getTokenRestrictedUse(tokenPayload, 'GET ' + path, tokenOptions)
        };

        if (type === 'goverment') {
            urlOptions.accept = 'application/x-7z-compressed';
        }

        return urlLib.getApi(path, null, urlOptions);
    };

    const getZipURL = function (params) {
        const userId = params.userId;
        const topicId = params.topicId;
        const voteId = params.voteId;
        const type = params.type;

        let path;
        const tokenPayload = {};
        const tokenOptions = {
            expiresIn: '1d'
        }

        if (type === 'final') {
            path = '/api/users/self/topics/:topicId/votes/:voteId/downloads/zip/final';
        }
        if (userId) {
            tokenPayload.userId = userId;
        }

        path = path
            .replace(':topicId', topicId)
            .replace(':voteId', voteId);

        const urlOptions = {
            token: cosJwt.getTokenRestrictedUse(tokenPayload, 'GET ' + path, tokenOptions)
        }

        urlOptions.accept = 'application/x-7z-compressed';

        return urlLib.getApi(path, null, urlOptions);
    };

    const _topicReadUnauth = function (topicId, include) {
        _syncTopicAuthors(topicId);
        let join = '';
        let returncolumns = '';

        if (include) {
            if (include.indexOf('vote') > -1) {
                join += ' \
                LEFT JOIN ( \
                            SELECT "voteId", to_json(array( \
                                SELECT CONCAT(id, \':\', value) \
                                FROM "VoteOptions" \
                                WHERE "deletedAt" IS NULL AND vo."voteId"="voteId" \
                            )) as "optionIds" \
                            FROM "VoteOptions" vo \
                            WHERE vo."deletedAt" IS NULL \
                            GROUP BY "voteId" \
                        ) AS vo ON vo."voteId"=tv."voteId" ';
                returncolumns += ' \
                , vo."optionIds" as "vote.options" \
                , tv."voteId" as "vote.id" \
                , tv."authType" as "vote.authType" \
                , tv."createdAt" as "vote.createdAt" \
                , tv."delegationIsAllowed" as "vote.delegationIsAllowed" \
                , tv."description" as "vote.description" \
                , tv."endsAt" as "vote.endsAt" \
                , tv."maxChoices" as "vote.maxChoices" \
                , tv."minChoices" as "vote.minChoices" \
                , tv."type" as "vote.type" \
                ';
            }
            if (include.indexOf('event') > -1) {
                join += '\
                    LEFT JOIN ( \
                        SELECT COUNT(events.id) as count, \
                        events."topicId" \
                        FROM "TopicEvents" events\
                        WHERE events."topicId" = :topicId \
                        AND events."deletedAt" IS NULL \
                        GROUP BY events."topicId" \
                    ) as te ON te."topicId" = t.id \
                ';
                returncolumns += ' \
                    , COALESCE(te.count, 0) AS "events.count" \
                    ';
            }
        }

        return db
            .query(
                'SELECT \
                     t.id, \
                     t.title, \
                     t.description, \
                     t.status, \
                     t.visibility, \
                     t.categories, \
                     t."endsAt", \
                     t."padUrl", \
                     t."sourcePartnerId", \
                     t."sourcePartnerObjectId", \
                     t."updatedAt", \
                     t."createdAt", \
                     t."hashtag", \
                     c.id as "creator.id", \
                     c.name as "creator.name", \
                     c.company as "creator.company", \
                     \'none\' as "permission.level", \
                     muc.count as "members.users.count", \
                     COALESCE(mgc.count, 0) as "members.groups.count", \
                     tv."voteId", \
                     tr."id" AS "report.id", \
                     tr."moderatedReasonType" AS "report.moderatedReasonType", \
                     tr."moderatedReasonText" AS "report.moderatedReasonText", \
                     au.authors \
                     ' + returncolumns + ' \
                FROM "Topics" t \
                    LEFT JOIN "Users" c ON (c.id = t."creatorId") \
                    LEFT JOIN ( \
                        SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM ( \
                            SELECT \
                                tmuu."topicId", \
                                tmuu."userId" AS "memberId" \
                            FROM "TopicMemberUsers" tmuu \
                            WHERE tmuu."deletedAt" IS NULL \
                            UNION \
                            SELECT \
                                tmg."topicId", \
                                gm."userId" AS "memberId" \
                            FROM "TopicMemberGroups" tmg \
                                LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                                JOIN "Groups" gr on gr.id = tmg."groupId" \
                            WHERE tmg."deletedAt" IS NULL \
                            AND gm."deletedAt" IS NULL \
                            AND gr."deletedAt" IS NULL \
                        ) AS tmu GROUP BY "topicId" \
                    ) AS muc ON (muc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT tmgc."topicId", count(tmgc."groupId") AS "count" \
                        FROM "TopicMemberGroups" tmgc \
                        JOIN "Groups" gc \
                            ON gc.id = tmgc."groupId" \
                        WHERE tmgc."deletedAt" IS NULL \
                        AND gc."deletedAt" IS NULL \
                        GROUP BY tmgc."topicId" \
                    ) AS mgc ON (mgc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            t.id as "topicId", \
                            json_agg(u) as authors\
                        FROM \
                        "Topics" t \
                        LEFT JOIN (SELECT id,  name FROM "Users") AS u \
                        ON \
                        u.id IN (SELECT unnest(t."authorIds")) \
                        GROUP BY t.id \
                    ) AS au ON au."topicId" = t.id \
                    LEFT JOIN ( \
                        SELECT \
                            tv."topicId", \
                            tv."voteId", \
                            v."authType", \
                            v."createdAt", \
                            v."delegationIsAllowed", \
                            v."description", \
                            v."endsAt", \
                            v."maxChoices", \
                            v."minChoices", \
                            v."type" \
                        FROM "TopicVotes" tv INNER JOIN \
                            (   \
                                SELECT \
                                    MAX("createdAt") as "createdAt", \
                                    "topicId" \
                                FROM "TopicVotes" \
                                GROUP BY "topicId" \
                            ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt") \
                        LEFT JOIN "Votes" v \
                                ON v.id = tv."voteId" \
                    ) AS tv ON (tv."topicId" = t.id) \
                    LEFT JOIN "TopicReports" tr ON (tr."topicId" = t.id AND tr."resolvedById" IS NULL AND tr."deletedAt" IS NULL) \
                    ' + join + ' \
                WHERE t.id = :topicId \
                  AND t.visibility = \'public\'\
                  AND t."deletedAt" IS NULL \
                ',
                {
                    replacements: {
                        topicId: topicId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
    };

    const _topicReadAuth = async function (topicId, include, user, partner) {
        _syncTopicAuthors(topicId);
        let join = '';
        let returncolumns = '';
        let authorColumns = ' u.id, u.name ';

        if (include && !Array.isArray(include)) {
            include = [include];
        }

        if (include) {
            if (include.indexOf('vote') > -1) {
                join += ' \
                    LEFT JOIN ( \
                                SELECT "voteId", to_json(array( \
                                    SELECT CONCAT(id, \':\', value) \
                                    FROM "VoteOptions" \
                                    WHERE "deletedAt" IS NULL AND vo."voteId"="voteId" \
                                )) as "optionIds" \
                                FROM "VoteOptions" vo \
                                WHERE vo."deletedAt" IS NULL \
                                GROUP BY "voteId" \
                            ) AS vo ON vo."voteId"=tv."voteId" ';
                returncolumns += ' \
                    , vo."optionIds" as "vote.options" \
                    , tv."voteId" as "vote.id" \
                    , tv."authType" as "vote.authType" \
                    , tv."createdAt" as "vote.createdAt" \
                    , tv."delegationIsAllowed" as "vote.delegationIsAllowed" \
                    , tv."description" as "vote.description" \
                    , tv."endsAt" as "vote.endsAt" \
                    , tv."maxChoices" as "vote.maxChoices" \
                    , tv."minChoices" as "vote.minChoices" \
                    , tv."type" as "vote.type" \
                    ';
            }

            if (include.indexOf('event') > -1) {
                join += '\
                    LEFT JOIN ( \
                        SELECT COUNT(events.id) as count, \
                        events."topicId" \
                        FROM "TopicEvents" events\
                        WHERE events."topicId" = :topicId \
                        AND events."deletedAt" IS NULL \
                        GROUP BY events."topicId" \
                    ) as te ON te."topicId" = t.id \
                ';
                returncolumns += ' \
                    , COALESCE(te.count, 0) AS "events.count" \
                    ';
            }
        }

        if (user.moderator) {
            returncolumns += ' \
            , c.email as "creator.email" \
            , uc."connectionData"::jsonb->>\'pid\' AS "creator.pid" \
            , uc."connectionData"::jsonb->\'phoneNumber\' AS "creator.phoneNumber" \
            ';

            returncolumns += ' \
            , tr."type" AS "report.type" \
            , tr."text" AS "report.text" \
            ';
            authorColumns += '\
            , u.email \
            ';
        }

        return db
            .query(
                'SELECT \
                        t.id, \
                        t.title, \
                        t.description, \
                        t.status, \
                        t.visibility, \
                        t.hashtag, \
                        CASE \
                        WHEN COALESCE(tmup.level, tmgp.level, \'none\') = \'admin\' THEN t."tokenJoin" \
                        ELSE NULL \
                        END as "tokenJoin", \
                        CASE \
                        WHEN tp."topicId" = t.id THEN true \
                        ELSE false \
                        END as "pinned", \
                        t.categories, \
                        t."endsAt", \
                        t."padUrl", \
                        t."sourcePartnerId", \
                        t."sourcePartnerObjectId", \
                        t."createdAt", \
                        t."updatedAt", \
                        c.id as "creator.id", \
                        c.name as "creator.name", \
                        c.company as "creator.company", \
                        COALESCE(\
                        tmup.level, \
                        tmgp.level, \
                        \'none\' \
                    ) as "permission.level", \
                        muc.count as "members.users.count", \
                        COALESCE(mgc.count, 0) as "members.groups.count", \
                        tv."voteId", \
                        u.id as "user.id", \
                        u.name as "user.name", \
                        u.language as "user.language", \
                        tr.id AS "report.id", \
                        tr."moderatedReasonType" AS "report.moderatedReasonType", \
                        tr."moderatedReasonText" AS "report.moderatedReasonText", \
                        au.authors \
                        ' + returncolumns + ' \
                FROM "Topics" t \
                        LEFT JOIN ( \
                        SELECT \
                            tmu."topicId", \
                            tmu."userId", \
                            tmu.level::text AS level \
                        FROM "TopicMemberUsers" tmu \
                        WHERE tmu."deletedAt" IS NULL \
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId) \
                    LEFT JOIN ( \
                        SELECT \
                            tmg."topicId", \
                            gm."userId", \
                            MAX(tmg.level)::text AS level \
                        FROM "TopicMemberGroups" tmg \
                            LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                        WHERE tmg."deletedAt" IS NULL \
                        AND gm."deletedAt" IS NULL \
                        GROUP BY "topicId", "userId" \
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId) \
                    LEFT JOIN "Users" c ON (c.id = t."creatorId") \
                    LEFT JOIN "UserConnections" uc ON (uc."userId" = t."creatorId") \
                    LEFT JOIN ( \
                        SELECT \
                            t.id AS "topicId", \
                            json_agg(u) as authors\
                        FROM \
                        "Topics" t \
                        LEFT JOIN (SELECT ' + authorColumns + ' FROM "Users" u ) u \
                        ON \
                        u.id IN (SELECT unnest(t."authorIds")) \
                        GROUP BY t.id \
                    ) AS au ON au."topicId" = t.id \
                    LEFT JOIN ( \
                        SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM ( \
                            SELECT \
                                tmuu."topicId", \
                                tmuu."userId" AS "memberId" \
                            FROM "TopicMemberUsers" tmuu \
                            WHERE tmuu."deletedAt" IS NULL \
                            UNION \
                            SELECT \
                                tmg."topicId", \
                                gm."userId" AS "memberId" \
                            FROM "TopicMemberGroups" tmg \
                                LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                                JOIN "Groups" gr ON gr.id = tmg."groupId" \
                            WHERE tmg."deletedAt" IS NULL \
                            AND gm."deletedAt" IS NULL \
                            AND gr."deletedAt" IS NULL \
                        ) AS tmu GROUP BY "topicId" \
                    ) AS muc ON (muc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT "topicId", count("groupId") AS "count" \
                        FROM "TopicMemberGroups" tmg \
                        JOIN "Groups" g ON tmg."groupId" = g.id \
                        WHERE tmg."deletedAt" IS NULL \
                        AND g."deletedAt" IS NULL \
                        GROUP BY "topicId" \
                    ) AS mgc ON (mgc."topicId" = t.id) \
                    LEFT JOIN "Users" u ON (u.id = :userId) \
                    LEFT JOIN ( \
                        SELECT \
                            tv."topicId", \
                            tv."voteId", \
                            v."authType", \
                            v."createdAt", \
                            v."delegationIsAllowed", \
                            v."description", \
                            v."endsAt", \
                            v."maxChoices", \
                            v."minChoices", \
                            v."type" \
                        FROM "TopicVotes" tv INNER JOIN \
                            (   \
                                SELECT \
                                    MAX("createdAt") as "createdAt", \
                                    "topicId" \
                                FROM "TopicVotes" \
                                GROUP BY "topicId" \
                            ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt") \
                        LEFT JOIN "Votes" v \
                                ON v.id = tv."voteId" \
                    ) AS tv ON (tv."topicId" = t.id) \
                    LEFT JOIN "TopicPins" tp ON tp."topicId" = t.id AND tp."userId" = :userId \
                    LEFT JOIN "TopicReports" tr ON (tr."topicId" = t.id AND tr."resolvedById" IS NULL AND tr."deletedAt" IS NULL) \
                    ' + join + ' \
                WHERE t.id = :topicId \
                    AND t."deletedAt" IS NULL \
                ',
                {
                    replacements: {
                        topicId: topicId,
                        userId: user.id
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (result) {
                if (result && result.length && result[0]) {
                    return result[0];
                } else {
                    logger.warn('Topic not found', topicId);
                    return Promise.reject();
                }
            })
            .then(function (topic) {
                topic.padUrl = cosEtherpad.getUserAccessUrl(topic, topic.user.id, topic.user.name, topic.user.language, partner);
                topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                if (topic.visibility === Topic.VISIBILITY.public && topic.permission.level === TopicMemberUser.LEVELS.none) {
                    topic.permission.level = TopicMemberUser.LEVELS.read;
                }
                // Remove the user info from output, was only needed for padUrl generation
                delete topic.user;

                if (include && include.indexOf('vote') > -1 && topic.vote && topic.vote.id) {

                    return getVoteResults(topic.vote.id, user.id)
                        .then(
                            function (result) {
                                const options = [];
                                let hasVoted = false;

                                topic.vote.options.forEach(function (option) {
                                    option = option.split(':');
                                    const o = {
                                        id: option[0],
                                        value: option[1]
                                    };
                                    if (result) {
                                        const res = _.find(result, {'optionId': o.id});
                                        if (res) {
                                            o.voteCount = parseInt(res.voteCount, 10);
                                            if (res.selected) {
                                                o.selected = res.selected;
                                                hasVoted = true;
                                            }
                                        }
                                    }
                                    options.push(o);
                                });

                                if (topic.vote.authType === Vote.AUTH_TYPES.hard && hasVoted) {
                                    topic.vote.downloads = {
                                        bdocVote: getBdocURL({
                                            userId: user.id,
                                            topicId: topicId,
                                            voteId: topic.vote.id,
                                            type: 'user'
                                        })
                                    };
                                }

                                topic.vote.options = {
                                    count: options.length,
                                    rows: options
                                };

                                if (!topic.report.id) {
                                    delete topic.report;
                                }

                                return topic;
                            }
                        );
                } else {
                    delete topic.vote;

                    if (!topic.report.id) {
                        delete topic.report;
                    }

                    return topic;
                }
            });
    };

    const getAllVotesResults = function (userId) {
        let where = '';
        let join = '';
        let select = '';
        if (!userId) {
            where = ' AND t.visibility = \'' + Topic.VISIBILITY.public + '\' ';
        } else {
            select = ', (SELECT true FROM pg_temp.votes(v."voteId") WHERE "userId" = :userId AND "optionId" = v."optionId") as "selected" ';
            where = 'AND COALESCE(tmup.level, tmgp.level, \'none\')::"enum_TopicMemberUsers_level" > \'none\'';
            join += 'LEFT JOIN ( \
                        SELECT \
                            tmu."topicId", \
                            tmu."userId", \
                            tmu.level::text AS level \
                        FROM "TopicMemberUsers" tmu \
                        WHERE tmu."deletedAt" IS NULL \
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId) \
                    LEFT JOIN ( \
                        SELECT \
                            tmg."topicId", \
                            gm."userId", \
                            MAX(tmg.level)::text AS level \
                        FROM "TopicMemberGroups" tmg \
                            LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                        WHERE tmg."deletedAt" IS NULL \
                        AND gm."deletedAt" IS NULL \
                        GROUP BY "topicId", "userId" \
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId) \
            ';
        }
        const query = ' \
                        CREATE OR REPLACE FUNCTION pg_temp.delegations(uuid) \
                            RETURNS TABLE("voteId" uuid, "toUserId" uuid, "byUserId" uuid, depth INT) \
                                AS $$ \
                                    WITH  RECURSIVE q ("voteId", "toUserId", "byUserId", depth) \
                                        AS \
                                            ( \
                                            SELECT \
                                                vd."voteId", \
                                                vd."toUserId", \
                                                vd."byUserId", \
                                                1 \
                                            FROM "VoteDelegations" vd \
                                            WHERE vd."voteId" = $1 \
                                              AND vd."deletedAt" IS NULL \
                                            UNION ALL \
                                            SELECT \
                                                vd."voteId", \
                                                vd."toUserId", \
                                                dc."byUserId", \
                                                dc.depth+1 \
                                            FROM q dc, "VoteDelegations" vd \
                                            WHERE vd."byUserId" = dc."toUserId" \
                                              AND vd."voteId" = dc."voteId" \
                                              AND vd."deletedAt" IS NULL \
                                            ) \
                            SELECT * FROM q; $$ \
                        LANGUAGE SQL; \
                        CREATE OR REPLACE FUNCTION pg_temp.indirect_delegations(uuid) \
                            RETURNS TABLE("voteId" uuid, "toUserId" uuid, "byUserId" uuid, depth int) \
                                AS $$ \
                                    SELECT DISTINCT ON("byUserId") \
                                        "voteId", \
                                        "toUserId", \
                                        "byUserId", \
                                        depth \
                                    FROM pg_temp.delegations($1) \
                                    ORDER BY "byUserId", depth DESC; $$ \
                            LANGUAGE SQL; \
                        CREATE OR REPLACE FUNCTION pg_temp.vote_groups(uuid) \
                            RETURNS TABLE ("voteId" uuid, "userId" uuid, "optionGroupId" character varying , "updatedAt" timestamp with time zone) \
                            AS $$ \
                            SELECT DISTINCT ON (vl."userId") vl."voteId", vl."userId", vli."optionGroupId", vl."updatedAt" \
                            FROM ( \
                                SELECT DISTINCT ON (vl."userId", MAX(vl."updatedAt")) \
                                vl."userId", \
                                vl."voteId", \
                                MAX(vl."updatedAt") as "updatedAt" \
                                FROM "VoteLists" vl \
                                WHERE vl."voteId" = $1 \
                                AND vl."deletedAt" IS NULL \
                                GROUP BY vl."userId", vl."voteId" \
                                ORDER BY MAX(vl."updatedAt") DESC \
                            ) vl \
                            JOIN "VoteLists" vli \
                            ON \
                                vli."userId" = vl."userId" \
                                AND vl."voteId" = vli."voteId" \
                                AND vli."updatedAt" = vl."updatedAt" \
                            WHERE vl."voteId" = $1 \
                                AND vl."userId" NOT IN \
                                ( \
                                    SELECT DISTINCT \
                                        uc."connectedUser" \
                                    FROM ( \
                                        SELECT \
                                            vl."userId", \
                                            vl."updatedAt" \
                                        FROM "VoteLists" vl \
                                        WHERE vl."voteId" = $1 \
                                        AND vl."deletedAt" IS NULL \
                                        ORDER BY vl."updatedAt" DESC \
                                    ) vl \
                                    JOIN \
                                    ( \
                                        SELECT \
                                            uc."userId", \
                                            uci."userId" as "connectedUser", \
                                            uc."connectionId", \
                                            uc."connectionUserId" \
                                        FROM "UserConnections" uc \
                                        JOIN "UserConnections" uci \
                                            ON uc."connectionId" = uci."connectionId" \
                                            AND uc."connectionUserId" = uci."connectionUserId" \
                                            AND uc."userId" <> uci."userId" \
                                    ) uc ON uc."userId" = vl."userId" \
                                    JOIN ( \
                                        SELECT \
                                            vl."userId", \
                                            vl."updatedAt" \
                                            FROM "VoteLists" vl \
                                            WHERE vl."voteId" = $1 \
                                                AND vl."deletedAt" IS NULL \
                                            ORDER BY vl."updatedAt" DESC \
                                    ) vli ON uc."connectedUser" = vli."userId" AND vli."updatedAt" < vl."updatedAt" \
                                ) \
                              ; $$ \
                            LANGUAGE SQL; \
                        CREATE OR REPLACE FUNCTION pg_temp.votes(uuid) \
                            RETURNS TABLE ("voteId" uuid, "userId" uuid, "optionId" uuid, "optionGroupId" character varying) \
                            AS $$ \
                                SELECT \
                                    vl."voteId", \
                                    vl."userId", \
                                    vl."optionId", \
                                    vl."optionGroupId" \
                                FROM "VoteLists" vl \
                                JOIN pg_temp.vote_groups($1) vg ON (vl."voteId" = vg."voteId" AND vl."optionGroupId" = vg."optionGroupId") \
                                WHERE vl."voteId" = $1; $$ \
                            LANGUAGE SQL; \
                        CREATE OR REPLACE FUNCTION pg_temp.votes_with_delegations(uuid) \
                            RETURNS TABLE ("voteId" uuid, "userId" uuid, "optionId" uuid, "optionGroupId" varchar(8), depth int) \
                            AS $$ \
                                SELECT \
                                    v."voteId", \
                                    v."userId", \
                                    v."optionId", \
                                    v."optionGroupId", \
                                    id."depth" \
                                FROM pg_temp.votes($1) v \
                                LEFT JOIN pg_temp.indirect_delegations($1) id ON (v."userId" = id."toUserId") \
                                WHERE v."userId" NOT IN (SELECT "byUserId" FROM pg_temp.indirect_delegations($1) WHERE "voteId"=v."voteId"); $$ \
                            LANGUAGE SQL; \
                        CREATE OR REPLACE FUNCTION pg_temp.get_vote_results (uuid) \
                            RETURNS TABLE ("voteCount" bigint, "optionId" uuid, "optionGroupId" varchar(8), "voteId" uuid) \
                            AS $$ \
                                SELECT \
                                    COUNT(v."optionId") + 1 as "voteCount", \
                                    v."optionId", \
                                    v."optionGroupId", \
                                    v."voteId" \
                                FROM pg_temp.votes_with_delegations($1) v \
                                WHERE v.depth IS NOT NULL \
                                GROUP BY v."optionId", v."optionGroupId", v."voteId" \
                                \
                                UNION ALL \
                                \
                                SELECT \
                                    COUNT(v."optionId") as "voteCount", \
                                    v."optionId", \
                                    v."optionGroupId", \
                                    v."voteId" \
                                FROM pg_temp.votes_with_delegations($1) v \
                                WHERE v.depth IS NULL \
                                GROUP BY v."optionId", v."optionGroupId", v."voteId"; $$ \
                            LANGUAGE SQL; \
                            \
                        SELECT \
                            SUM(v."voteCount") as "voteCount", \
                            v."optionId", \
                            v."voteId", \
                            vo."value" \
                            ' + select + ' \
                        FROM "Topics" t \
                        LEFT JOIN "TopicVotes" tv \
                            ON tv."topicId" = t.id AND tv."deletedAt" IS NULL\
                        LEFT JOIN pg_temp.get_vote_results(tv."voteId") v ON v."voteId" = tv."voteId" \
                        LEFT JOIN "VoteOptions" vo ON v."optionId" = vo.id \
                        ' + join + ' \
                        WHERE  t."deletedAt" IS NULL \
                        AND v."optionId" IS NOT NULL \
                        AND v."voteId" IS NOT NULL \
                        AND vo."value" IS NOT NULL \
                        ' + where + '\
                        GROUP BY v."optionId", v."voteId", vo."value" \
                    ;';

        return db
            .query(
                query,
                {
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    replacements: {
                        userId: userId
                    }
                }
            );
    };

    const _syncTopicAuthors = async function (topicId) {
        const authorIds = await cosEtherpad.getTopicPadAuthors(topicId);
        if (authorIds && authorIds.length) {
            await Topic.update({
                authorIds
            }, {
                where: {
                    id: topicId
                }
            });
        }
    };

    /**
     * Create a new Topic
     */
    app.post('/api/users/:userId/topics', loginCheck(['partner']), partnerParser, asyncMiddleware(async function (req, res) {
        // I wish Sequelize Model.build supported "fields". This solution requires you to add a field here once new are defined in model.
        let topic = Topic.build({
            visibility: req.body.visibility || Topic.VISIBILITY.private,
            creatorId: req.user.id,
            categories: req.body.categories,
            hashtag: req.body.hashtag,
            endsAt: req.body.endsAt,
            sourcePartnerObjectId: req.body.sourcePartnerObjectId,
            authorIds: [req.user.id]
        });

        topic.padUrl = cosEtherpad.getTopicPadUrl(topic.id);

        if (req.locals.partner) {
            topic.sourcePartnerId = req.locals.partner.id;
        }

        const topicDescription = req.body.description;

        const user = await User.findOne({
            where: {
                id: req.user.id
            },
            attributes: ['id', 'name', 'language']
        });

        // Create topic on Etherpad side
        await cosEtherpad.createTopic(topic.id, user.language, topicDescription);

        await db.transaction(async function (t) {
            await topic.save({transaction: t});
            await topic.addMemberUser(// Magic method by Sequelize - https://github.com/sequelize/sequelize/wiki/API-Reference-Associations#hasmanytarget-options
                user.id,
                {
                    through: {
                        level: TopicMemberUser.LEVELS.admin
                    },
                    transaction: t
                }
            );
            await cosActivities.createActivity(
                topic,
                null,
                {
                    type: 'User',
                    id: req.user.id,
                    ip: req.ip
                }
                , req.method + ' ' + req.path,
                t
            );
        });

        // Topic was created with description, force EP to sync with app database for updated title and description
        if (topicDescription) {
            topic = await cosEtherpad.syncTopicWithPad( // eslint-disable-line require-atomic-updates
                topic.id,
                req.method + ' ' + req.path,
                {
                    type: 'User',
                    id: req.user.id,
                    ip: req.ip
                }
            );
        }
        const authorIds = topic.authorIds;
        const authors = await User.findAll({
            where: {
                id: authorIds
            },
            attributes: ['id', 'name'],
            raw: true
        });

        const resObject = topic.toJSON();
        resObject.authors = authors;
        resObject.padUrl = cosEtherpad.getUserAccessUrl(topic, user.id, user.name, user.language, req.locals.partner);
        resObject.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

        if (req.locals.partner) {
            resObject.sourcePartnerId = req.locals.partner.id;
        } else {
            resObject.sourcePartnerId = null;
        }

        resObject.pinned = false;
        resObject.permission = {
            level: TopicMemberUser.LEVELS.admin
        };

        return res.created(resObject);
    }));

    /**
     * Read a Topic
     */
    app.get('/api/users/:userId/topics/:topicId', loginCheck(['partner']), partnerParser, hasPermission(TopicMemberUser.LEVELS.read, true), isModerator(), asyncMiddleware(async function (req, res) {
        const include = req.query.include;
        const topicId = req.params.topicId;
        const user = req.user;
        const partner = req.locals.partner;

        const topic = await _topicReadAuth(topicId, include, user, partner);

        if (!topic) {
            return res.notFound();
        }

        return res.ok(topic);
    }));

    app.get('/api/topics/:topicId', function (req, res, next) {
        let include = req.query.include;
        const topicId = req.params.topicId;

        if (include && !Array.isArray(include)) {
            include = [include];
        }

        _topicReadUnauth(topicId, include)
            .then(function (result) {
                if (result && result.length && result[0]) {
                    const topic = result[0];
                    topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});
                    if (include && include.indexOf('vote') > -1 && topic.vote && topic.vote.id) {
                        return getVoteResults(topic.vote.id)
                            .then(
                                function (result) {
                                    const options = [];
                                    topic.vote.options.forEach(function (option) {
                                        option = option.split(':');
                                        const o = {
                                            id: option[0],
                                            value: option[1]
                                        };
                                        if (result) {
                                            const res = _.find(result, {'optionId': o.id});
                                            if (res) {
                                                o.voteCount = res.voteCount;
                                            }
                                        }
                                        options.push(o);
                                    });
                                    topic.vote.options = {
                                        count: options.length,
                                        rows: options
                                    };

                                    if (!topic.report.id) {
                                        delete topic.report;
                                    }

                                    return res.ok(topic);
                                },
                                function (err) {
                                    logger.error(err);
                                }
                            );
                    } else {
                        delete topic.vote;

                        if (!topic.report.id) {
                            delete topic.report;
                        }

                        return res.ok(topic);
                    }
                } else {
                    return res.notFound();
                }
            })
            .catch(next);
    });

    const _topicUpdate = async function (req, res) {
        const topicId = req.params.topicId;
        const contact = req.body.contact; // TODO: This logic is specific to Rahvaalgatus.ee, with next Partner we have to make it more generic - https://trello.com/c/Sj3XRF5V/353-raa-ee-followup-email-to-riigikogu-and-token-access-to-events-api
        const statusNew = req.body.status;

        let isBackToVoting = false;
        let isSendToParliament = false;

        const topic = await Topic
            .findOne({
                where: {id: topicId},
                include: [Vote]
            });

        if (!topic) {
            res.badRequest();

            return Promise.reject();
        }

        const statuses = _.values(Topic.STATUSES);
        const vote = topic.Votes[0];
        if (statusNew && statusNew !== topic.status) {
            // The only flow that allows going back in status flow is reopening for voting
            if (statusNew === Topic.STATUSES.voting && topic.status === Topic.STATUSES.followUp) {
                if (!vote) {
                    res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew + ' when the Topic has no Vote created');

                    return Promise.reject();
                }

                // TODO: This logic is specific to Rahvaalgatus.ee, with next Partner we have to make it more generic - https://trello.com/c/Sj3XRF5V/353-raa-ee-followup-email-to-riigikogu-and-token-access-to-events-api
                // Do not allow going back to voting once the Topic has been sent to Parliament
                if (vote.authType === Vote.AUTH_TYPES.hard) {
                    await getVoteResults(vote.id)
                        .then(function (voteResults) {
                            const optionMax = _.maxBy(voteResults, 'voteCount');
                            if (optionMax && optionMax.voteCount >= config.features.sendToParliament.voteCountMin) {
                                res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew + ' when the Topic has been sent to Parliament');

                                return Promise.reject();
                            } else {
                                isBackToVoting = true;
                            }
                        });
                }

                isBackToVoting = true;
            } else if (statusNew === Topic.STATUSES.followUp && vote) { // User closes the Vote
                // TODO: This logic is specific to Rahvaalgatus.ee, with next Partner we have to make it more generic - https://trello.com/c/Sj3XRF5V/353-raa-ee-followup-email-to-riigikogu-and-token-access-to-events-api
                if (vote.authType === Vote.AUTH_TYPES.hard && contact) {
                    // TODO: Return proper field errors as for Sequelize errors
                    if (!contact.name || !contact.email || !contact.phone || !validator.isEmail(contact.email)) {
                        res.badRequest('Invalid contact info. Missing or invalid name, email or phone');

                        return Promise.reject();
                    }

                    await getVoteResults(vote.id)
                        .then(function (voteResults) {
                            const optionMax = _.maxBy(voteResults, 'voteCount');
                            if (optionMax && optionMax.voteCount >= config.features.sendToParliament.voteCountMin) {
                                isSendToParliament = true;
                            } else {
                                res.badRequest('Not enough votes to send to Parliament. Votes required - ' + config.features.sendToParliament.voteCountMin, 10);

                                return Promise.reject();
                            }
                        });
                }
            } else if (statuses.indexOf(topic.status) > statuses.indexOf(statusNew) || [Topic.STATUSES.voting].indexOf(statusNew) > -1) { // You are not allowed to go "back" in the status flow nor you are allowed to set "voting" directly, it can only be done creating a Vote.
                res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew);

                return Promise.reject();
            }
        }

        // NOTE: Description is handled separately below
        const fieldsAllowedToUpdate = ['visibility', 'status', 'categories', 'endsAt', 'hashtag', 'sourcePartnerObjectId'];

        const fieldsToUpdate = [];
        Object.keys(req.body).forEach(function (key) {
            if (fieldsAllowedToUpdate.indexOf(key) >= 0) {
                fieldsToUpdate.push(key);
            }
        });

        return db
            .transaction(function (t) {
                const promisesToResolve = [];

                const topicUpdatePromise = topic
                    .update(
                        req.body,
                        {
                            fields: fieldsToUpdate,
                            where: {
                                id: topicId
                            }
                        },
                        {
                            transaction: t
                        }
                    );

                promisesToResolve.push(topicUpdatePromise);

                const topicActivityPromise = cosActivities
                    .updateActivity(
                        topic,
                        null,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        null,
                        req.method + ' ' + req.path,
                        t
                    );

                promisesToResolve.push(topicActivityPromise);

                if (isBackToVoting) {
                    promisesToResolve.push(cosSignature.deleteFinalBdoc(topicId, vote.id));

                    const topicEventsDeletePromise = TopicEvent
                        .destroy({
                            where: {
                                topicId: topicId
                            },
                            force: true,
                            transaction: t
                        });

                    promisesToResolve.push(topicEventsDeletePromise);
                }


                if (req.body.description) {
                    const epUpdateTopicPromise = cosEtherpad
                        .updateTopic(
                            topicId,
                            req.body.description
                        );
                    promisesToResolve.push(epUpdateTopicPromise);
                }

                return Promise.all(promisesToResolve);
            })
            .then(function () {
                if (req.body.description) {
                    return cosEtherpad
                        .syncTopicWithPad(
                            topicId,
                            req.method + ' ' + req.path,
                            {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }
                        );
                } else {
                    return Promise.resolve();
                }
            })
            .then(function () {
                // TODO: This logic is specific to Rahvaalgatus.ee, with next Partner we have to make it more generic - https://trello.com/c/Sj3XRF5V/353-raa-ee-followup-email-to-riigikogu-and-token-access-to-events-api
                if (isSendToParliament) {
                    logger.info('Sending to Parliament', req.method, req.path);

                    // TODO: This should be and stay in sync with the expiry set by getBdocURL
                    const downloadTokenExpiryDays = 30;
                    const linkDownloadBdocFinalExpiryDate = new Date(new Date().getTime() + downloadTokenExpiryDays * 24 * 60 * 60 * 1000);

                    const pathAddEvent = '/api/topics/:topicId/events' // COS API url for adding events with token
                        .replace(':topicId', topicId);

                    let linkAddEvent = config.features.sendToParliament.urlPrefix + '/initiatives/:topicId/events/new'.replace(':topicId', topicId);
                    linkAddEvent += '?' + querystring.stringify({token: cosJwt.getTokenRestrictedUse({}, 'POST ' + pathAddEvent)});

                    const downloadUriBdocFinal = getBdocURL({
                        topicId: topicId,
                        voteId: vote.id,
                        type: 'goverment'
                    });

                    return emailLib.sendToParliament(topic, contact, downloadUriBdocFinal, linkDownloadBdocFinalExpiryDate, linkAddEvent);
                }

                return Promise.resolve();
            });
    };

    /**
     * Update Topic info
     */
    app.put('/api/users/:userId/topics/:topicId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.edit), function (req, res, next) {
        _topicUpdate(req, res, next)
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

    app.patch('/api/users/:userId/topics/:topicId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.edit), function (req, res, next) {
        _topicUpdate(req, res, next)
            .then(function () {
                return res.noContent();
            })
            .catch(next);
    });

    /**
     * Update Topic join token (tokenJoin)
     *
     * TODO: Should be part of PUT /topics/:topicId, but that is allowed for "edit". Token changing should only be allowed for "admin".
     *
     * @see https://trello.com/c/ezqHssSL/124-refactoring-put-tokenjoin-to-be-part-of-put-topics-topicid
     */
    app.put('/api/users/:userId/topics/:topicId/tokenJoin', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {

        return Topic
            .findOne({
                where: {
                    id: req.params.topicId
                }
            })
            .then(function (topic) {
                const tokenJoin = Topic.generateTokenJoin();
                topic.tokenJoin = tokenJoin;

                return db
                    .transaction(function (t) {
                        return cosActivities
                            .updateActivity(topic, null, {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }, null, req.method + ' ' + req.path, t)
                            .then(function () {
                                return topic
                                    .save({
                                        transaction: t
                                    });
                            });


                    })
                    .then(function () {
                        return res.ok({tokenJoin: tokenJoin});
                    });
            })
            .catch(next);
    });


    /**
     * Delete Topic
     */
    app.delete('/api/users/:userId/topics/:topicId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        Topic
            .findByPk(req.params.topicId)
            .then(function (topic) {
                if (!topic) {
                    res.notFound('No such topic found.');

                    return Promise.reject();
                }

                return db.transaction(function (t) {
                    const deleteTopicEtherpadPromise = cosEtherpad.deleteTopic(topic.id);

                    // Delete TopicMembers beforehand. Sequelize does not cascade and set "deletedAt" for related objects if "paranoid: true".
                    const deleteTopicDb = TopicMemberUser
                        .destroy({
                            where: {
                                topicId: topic.id
                            },
                            force: true,
                            transaction: t
                        }).then(function () {
                            return TopicMemberGroup
                                .destroy({
                                    where: {
                                        topicId: topic.id
                                    },
                                    force: true,
                                    transaction: t
                                });
                        })
                        .then(function () {
                            return topic
                                .destroy({
                                    transaction: t
                                });
                        }).then(function () {
                            return cosActivities.deleteActivity(topic, null, {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                        });

                    return Promise.all([deleteTopicEtherpadPromise, deleteTopicDb]);
                });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });


    /**
     * Get all Topics User belongs to
     */
    app.get('/api/users/:userId/topics', loginCheck(['partner']), function (req, res, next) {
        const userId = req.user.id;
        const partnerId = req.user.partnerId;
        let include = req.query.include;

        const visibility = req.query.visibility;
        const creatorId = req.query.creatorId;
        let statuses = req.query.statuses;
        const pinned = req.query.pinned;
        const hasVoted = req.query.hasVoted; // Filter out Topics where User has participated in the voting process.
        const showModerated = req.query.showModerated || false;
        if (statuses && !Array.isArray(statuses)) {
            statuses = [statuses];
        }

        let voteResultsPromise = false;
        let join = '';
        let returncolumns = '';

        if (!Array.isArray(include)) {
            include = [include];
        }

        if (include.indexOf('vote') > -1) {
            returncolumns += ' \
            , ( \
                SELECT to_json( \
                    array ( \
                        SELECT concat(id, \':\', value) \
                        FROM   "VoteOptions" \
                        WHERE  "deletedAt" IS NULL \
                        AND    "voteId" = tv."voteId" \
                    ) \
                ) \
            ) as "vote.options" \
            , tv."voteId" as "vote.id" \
            , tv."authType" as "vote.authType" \
            , tv."createdAt" as "vote.createdAt" \
            , tv."delegationIsAllowed" as "vote.delegationIsAllowed" \
            , tv."description" as "vote.description" \
            , tv."endsAt" as "vote.endsAt" \
            , tv."maxChoices" as "vote.maxChoices" \
            , tv."minChoices" as "vote.minChoices" \
            , tv."type" as "vote.type" \
            ';
            voteResultsPromise = getAllVotesResults(userId);
        }

        if (include.indexOf('event') > -1) {
            join += 'LEFT JOIN ( \
                        SELECT \
                            COUNT(events.id) as count, \
                            events."topicId" \
                        FROM "TopicEvents" events \
                        WHERE events."deletedAt" IS NULL \
                        GROUP BY events."topicId" \
                    ) AS te ON te."topicId" = t.id \
            ';
            returncolumns += '\
            , COALESCE(te.count, 0) AS "events.count" \
            ';
        }

        let where = ' t."deletedAt" IS NULL \
                    AND t.title IS NOT NULL \
                    AND COALESCE(tmup.level, tmgp.level, \'none\')::"enum_TopicMemberUsers_level" > \'none\' ';

        // All partners should see only Topics created by their site, but our own app sees all.
        if (partnerId) {
            where += ' AND t."sourcePartnerId" = :partnerId ';
        }

        if (visibility) {
            where += ' AND t.visibility=:visibility ';
        }

        if (statuses && statuses.length) {
            where += ' AND t.status IN (:statuses)';
        }

        if (pinned) {
            where += 'AND tp."topicId" = t.id AND tp."userId" = :userId';
        }

        if (['true', '1'].includes(hasVoted)) {
            where += 'AND EXISTS (SELECT TRUE FROM "VoteLists" vl WHERE vl."voteId" = tv."voteId" AND vl."userId" = :userId LIMIT 1)';
        } else if (['false', '0'].includes(hasVoted)) {
            where += 'AND tv."voteId" IS NOT NULL AND t.status = \'voting\'::"enum_Topics_status" AND NOT EXISTS (SELECT TRUE FROM "VoteLists" vl WHERE vl."voteId" = tv."voteId" AND vl."userId" = :userId LIMIT 1)';
        } else {
            logger.warn(`Ignored parameter "voted" as invalid value "${hasVoted}" was provided`);
        }

        if (!showModerated || showModerated == "false") {
            where += 'AND (tr."moderatedAt" IS NULL OR tr."resolvedAt" IS NOT NULL) ';
        } else {
            where += 'AND (tr."moderatedAt" IS NOT NULL AND tr."resolvedAt" IS NULL) ';
        }

        if (creatorId) {
            if (creatorId === userId) {
                where += ' AND c.id =:creatorId ';
            } else {
                return res.badRequest('No rights!');
            }
        }

        // TODO: NOT THE MOST EFFICIENT QUERY IN THE WORLD, tune it when time.
        // TODO: That casting to "enum_TopicMemberUsers_level". Sequelize does not support naming enums, through inheritance I have 2 enums that are the same but with different name thus different type in PG. Feature request - https://github.com/sequelize/sequelize/issues/2577
        const query = '\
                SELECT \
                     t.id, \
                     t.title, \
                     t.description, \
                     t.status, \
                     t.visibility, \
                     t.hashtag, \
                     CASE \
                        WHEN COALESCE(tmup.level, tmgp.level, \'none\') = \'admin\' THEN t."tokenJoin" \
                        ELSE NULL \
                     END as "tokenJoin", \
                     CASE \
                        WHEN tp."topicId" = t.id THEN true \
                        ELSE false \
                     END as "pinned", \
                     t.categories, \
                     t."sourcePartnerId", \
                     t."sourcePartnerObjectId", \
                     t."endsAt", \
                     t."createdAt", \
                     c.id as "creator.id", \
                     c.name as "creator.name", \
                     c.company as "creator.company", \
                     COALESCE(tmup.level, tmgp.level, \'none\') as "permission.level", \
                     muc.count as "members.users.count", \
                     COALESCE(mgc.count, 0) as "members.groups.count", \
                     tv."voteId" as "voteId", \
                     tv."voteId" as "vote.id", \
                     CASE WHEN t.status = \'voting\' THEN 1 \
                        WHEN t.status = \'inProgress\' THEN 2 \
                        WHEN t.status = \'followUp\' THEN 3 \
                     ELSE 4 \
                     END AS "order", \
                     COALESCE(tc.count, 0) AS "comments.count", \
                     com."createdAt" AS "comments.lastCreatedAt" \
                     ' + returncolumns + ' \
                FROM "Topics" t \
                    LEFT JOIN ( \
                        SELECT \
                            tmu."topicId", \
                            tmu."userId", \
                            tmu.level::text AS level \
                        FROM "TopicMemberUsers" tmu \
                        WHERE tmu."deletedAt" IS NULL \
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId) \
                    LEFT JOIN "TopicReports" tr ON  tr."topicId" = t.id \
                    LEFT JOIN ( \
                        SELECT \
                            tmg."topicId", \
                            gm."userId", \
                            MAX(tmg.level)::text AS level \
                        FROM "TopicMemberGroups" tmg \
                            LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                        WHERE tmg."deletedAt" IS NULL \
                        AND gm."deletedAt" IS NULL \
                        GROUP BY "topicId", "userId" \
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId) \
                    LEFT JOIN "Users" c ON (c.id = t."creatorId") \
                    LEFT JOIN ( \
                        SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM ( \
                            SELECT \
                                tmuu."topicId", \
                                tmuu."userId" AS "memberId" \
                            FROM "TopicMemberUsers" tmuu \
                            WHERE tmuu."deletedAt" IS NULL \
                            UNION \
                            SELECT \
                                tmg."topicId", \
                                gm."userId" AS "memberId" \
                            FROM "TopicMemberGroups" tmg \
                                JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                                JOIN "Groups" g ON g.id = tmg."groupId" \
                            WHERE tmg."deletedAt" IS NULL \
                            AND g."deletedAt" IS NULL \
                            AND gm."deletedAt" IS NULL \
                        ) AS tmu GROUP BY "topicId" \
                    ) AS muc ON (muc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            tmg."topicId", \
                            count(tmg."groupId") AS "count" \
                        FROM "TopicMemberGroups" tmg \
                        JOIN "Groups" g ON (g.id = tmg."groupId") \
                        WHERE tmg."deletedAt" IS NULL \
                        AND g."deletedAt" IS NULL \
                        GROUP BY tmg."topicId" \
                    ) AS mgc ON (mgc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            tv."topicId", \
                            tv."voteId", \
                            v."authType", \
                            v."createdAt", \
                            v."delegationIsAllowed", \
                            v."description", \
                            v."endsAt", \
                            v."maxChoices", \
                            v."minChoices", \
                            v."type" \
                        FROM "TopicVotes" tv INNER JOIN \
                            (   \
                                SELECT \
                                    MAX("createdAt") as "createdAt", \
                                    "topicId" \
                                FROM "TopicVotes" \
                                GROUP BY "topicId" \
                            ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt") \
                        LEFT JOIN "Votes" v \
                                ON v.id = tv."voteId" \
                    ) AS tv ON (tv."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            "topicId", \
                            COUNT(*) AS count \
                        FROM "TopicComments" \
                        GROUP BY "topicId" \
                    ) AS tc ON (tc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            tcc."topicId", \
                            MAX(tcc."createdAt") as "createdAt" \
                            FROM \
                                (SELECT \
                                    tc."topicId", \
                                    c."createdAt" \
                                FROM "TopicComments" tc \
                                JOIN "Comments" c ON c.id = tc."commentId" \
                                GROUP BY tc."topicId", c."createdAt" \
                                ORDER BY c."createdAt" DESC \
                                ) AS tcc \
                            GROUP BY tcc."topicId" \
                    ) AS com ON (com."topicId" = t.id) \
                    LEFT JOIN "TopicPins" tp ON tp."topicId" = t.id AND tp."userId" = :userId \
                    ' + join + ' \
                WHERE ' + where + ' \
                ORDER BY "pinned" DESC, "order" ASC, t."updatedAt" DESC \
            ;';

        const topicsPromise = db
            .query(
                query,
                {
                    replacements: {
                        userId: userId,
                        partnerId: partnerId,
                        visibility: visibility,
                        statuses: statuses,
                        creatorId: creatorId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        Promise
            .all([topicsPromise, voteResultsPromise])
            .then(function ([rows, voteResults]) {
                const rowCount = rows.length;

                // Sequelize returns empty array for no results.
                const result = {
                    count: rowCount,
                    rows: []
                };

                if (rowCount > 0) {
                    rows.forEach(function (topic) {
                        topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                        if (include.indexOf('vote') > -1) {
                            if (topic.vote.id) {
                                const options = [];
                                if (topic.vote.options) {
                                    topic.vote.options.forEach(function (voteOption) {
                                        const o = {};
                                        const optText = voteOption.split(':');
                                        o.id = optText[0];
                                        o.value = optText[1];
                                        let result = 0;
                                        if (voteResults) {
                                            result = _.find(voteResults, {'optionId': optText[0]});
                                            if (result) {
                                                o.voteCount = parseInt(result.voteCount, 10);
                                                if (result.selected) {
                                                    o.selected = result.selected;
                                                }
                                            }
                                        }

                                        options.push(o);
                                    });
                                }
                                topic.vote.options = {
                                    count: options.length,
                                    rows: options
                                };
                            } else {
                                delete topic.vote;
                            }
                        }
                    });
                    result.rows = rows;
                }

                return res.ok(result);
            })
            .catch(next);
    });


    /**
     * Topic list
     */
    app.get('/api/topics', function (req, res, next) {
        const limitMax = 500;
        const limitDefault = 26;
        let join = '';
        let returncolumns = '';
        let voteResultsPromise = false;
        let showModerated = req.query.showModerated || false;

        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;

        if (limit > limitMax) limit = limitDefault;

        let statuses = req.query.statuses;
        if (statuses && !Array.isArray(statuses)) {
            statuses = [statuses];
        }

        let include = req.query.include;
        if (!Array.isArray(include)) {
            include = [include];
        }

        if (include) {
            if (include.indexOf('vote') > -1) {
                returncolumns += ' \
                , ( \
                    SELECT to_json( \
                        array ( \
                            SELECT concat(id, \':\', value) \
                            FROM   "VoteOptions" \
                            WHERE  "deletedAt" IS NULL \
                            AND    "voteId" = tv."voteId" \
                        ) \
                    ) \
                ) as "vote.options" \
                , tv."voteId" as "vote.id" \
                , tv."authType" as "vote.authType" \
                , tv."createdAt" as "vote.createdAt" \
                , tv."delegationIsAllowed" as "vote.delegationIsAllowed" \
                , tv."description" as "vote.description" \
                , tv."endsAt" as "vote.endsAt" \
                , tv."maxChoices" as "vote.maxChoices" \
                , tv."minChoices" as "vote.minChoices" \
                , tv."type" as "vote.type" \
                ';
                voteResultsPromise = getAllVotesResults();
            }
            if (include.indexOf('event') > -1) {
                join += 'LEFT JOIN ( \
                            SELECT \
                                COUNT(events.id) as count, \
                                events."topicId" \
                            FROM "TopicEvents" events \
                            WHERE events."deletedAt" IS NULL \
                            GROUP BY events."topicId" \
                        ) AS te ON te."topicId" = t.id \
                ';
                returncolumns += '\
                , COALESCE(te.count, 0) AS "events.count" \
                ';
            }
        }

        let categories = req.query.categories;
        if (categories && !Array.isArray(categories)) {
            categories = [categories];
        }

        let where = ' t.visibility = \'' + Topic.VISIBILITY.public + '\' \
            AND t.title IS NOT NULL \
            AND t."deletedAt" IS NULL ';

        if (categories && categories.length) {
            where += ' AND t."categories" @> ARRAY[:categories]::VARCHAR(255)[] ';
        }

        if (!showModerated || showModerated == "false") {
            where += 'AND (tr."moderatedAt" IS NULL OR tr."resolvedAt" IS NOT NULL OR tr."deletedAt" IS NOT NULL) ';
        } else {
            where += 'AND tr."moderatedAt" IS NOT NULL AND tr."resolvedAt" IS NULL AND tr."deletedAt" IS NULL ';
        }

        if (statuses && statuses.length) {
            where += ' AND t.status IN (:statuses)';
        }

        let sourcePartnerId = req.query.sourcePartnerId;
        if (sourcePartnerId) {
            if (!Array.isArray(sourcePartnerId)) {
                sourcePartnerId = [sourcePartnerId];
            }
            where += ' AND t."sourcePartnerId" IN (:partnerId)';
        }

        const title = req.query.title;
        if (title) {
            where += ' AND t.title LIKE \'%:title%\' ';
        }

        const query = '\
                SELECT \
                    t.id, \
                    t.title, \
                    t.description, \
                    t.status, \
                    t.visibility, \
                    t.hashtag, \
                    t."tokenJoin", \
                    t.categories, \
                    t."endsAt", \
                    t."createdAt", \
                    t."sourcePartnerId", \
                    t."sourcePartnerObjectId", \
                    c.id as "creator.id", \
                    c.name as "creator.name", \
                    COALESCE(ta."lastActivity", t."updatedAt") as "lastActivity", \
                    c.company as "creator.company", \
                    muc.count as "members.users.count", \
                    COALESCE(mgc.count, 0) as "members.groups.count", \
                    CASE WHEN t.status = \'voting\' THEN 1 \
                        WHEN t.status = \'inProgress\' THEN 2 \
                        WHEN t.status = \'followUp\' THEN 3 \
                    ELSE 4 \
                    END AS "order", \
                    tv."voteId", \
                    COALESCE(tc.count, 0) AS "comments.count", \
                    COALESCE(com."createdAt", NULL) AS "comments.lastCreatedAt", \
                    count(*) OVER()::integer AS "countTotal" \
                    ' + returncolumns + ' \
                FROM "Topics" t \
                    LEFT JOIN "Users" c ON (c.id = t."creatorId") \
                    LEFT JOIN "TopicReports" tr ON tr."topicId" = t.id \
                    LEFT JOIN ( \
                        SELECT tmu."topicId", COUNT(tmu."memberId")::integer AS "count" FROM ( \
                            SELECT \
                                tmuu."topicId", \
                                tmuu."userId" AS "memberId" \
                            FROM "TopicMemberUsers" tmuu \
                            WHERE tmuu."deletedAt" IS NULL \
                            UNION \
                            SELECT \
                                tmg."topicId", \
                                gm."userId" AS "memberId" \
                            FROM "TopicMemberGroups" tmg \
                                JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                                JOIN "Groups" g ON g.id = tmg."groupId" \
                            WHERE tmg."deletedAt" IS NULL \
                            AND g."deletedAt" IS NULL \
                            AND gm."deletedAt" IS NULL \
                        ) AS tmu GROUP BY "topicId" \
                    ) AS muc ON (muc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT tmg."topicId", count(tmg."groupId")::integer AS "count" \
                        FROM "TopicMemberGroups" tmg \
                        JOIN "Groups" g \
                            ON g.id = tmg."groupId" \
                        WHERE tmg."deletedAt" IS NULL \
                        AND g."deletedAt" IS NULL \
                        GROUP BY tmg."topicId" \
                    ) AS mgc ON (mgc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            "topicId", \
                            COUNT(*)::integer AS count \
                        FROM "TopicComments" \
                        GROUP BY "topicId" \
                    ) AS tc ON (tc."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            tcc."topicId", \
                            MAX(tcc."createdAt") as "createdAt" \
                            FROM \
                                (SELECT \
                                    tc."topicId", \
                                    c."createdAt" \
                                FROM "TopicComments" tc \
                                JOIN "Comments" c ON c.id = tc."commentId" \
                                GROUP BY tc."topicId", c."createdAt" \
                                ORDER BY c."createdAt" DESC \
                                ) AS tcc \
                            GROUP BY tcc."topicId" \
                    ) AS com ON (com."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT \
                            tv."topicId", \
                            tv."voteId", \
                            v."authType", \
                            v."createdAt", \
                            v."delegationIsAllowed", \
                            v."description", \
                            v."endsAt", \
                            v."maxChoices", \
                            v."minChoices", \
                            v."type" \
                        FROM "TopicVotes" tv INNER JOIN \
                            (   \
                                SELECT \
                                    MAX("createdAt") as "createdAt", \
                                    "topicId" \
                                FROM "TopicVotes" \
                                GROUP BY "topicId" \
                            ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt") \
                        LEFT JOIN "Votes" v \
                                ON v.id = tv."voteId" \
                    ) AS tv ON (tv."topicId" = t.id) \
                    LEFT JOIN ( \
                        SELECT t.id, MAX(a."updatedAt") as "lastActivity" \
                        FROM "Topics" t JOIN "Activities" a ON ARRAY[t.id::text] <@ a."topicIds" GROUP BY t.id \
                    ) ta ON (ta.id = t.id) \
                    ' + join + ' \
                WHERE ' + where + ' \
                ORDER BY "lastActivity" DESC \
                LIMIT :limit OFFSET :offset \
            ;';

        const topicsPromise = db
            .query(
                query,
                {
                    replacements: {
                        partnerId: sourcePartnerId,
                        categories: categories,
                        statuses: statuses,
                        limit: limit,
                        offset: offset
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        Promise
            .all([topicsPromise, voteResultsPromise])
            .then(function ([topics, voteResults]) {
                if (!topics) {
                    return res.notFound();
                }

                let countTotal = 0;
                if (topics && topics.length) {
                    countTotal = topics[0].countTotal;
                    topics.forEach(function (topic) {
                        topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                        delete topic.countTotal;

                        if (include && include.indexOf('vote') > -1 && topic.vote.id) {
                            const options = [];
                            if (topic.vote.options) {
                                topic.vote.options.forEach(function (voteOption) {
                                    const o = {};
                                    const optText = voteOption.split(':');
                                    o.id = optText[0];
                                    o.value = optText[1];
                                    if (voteResults) {
                                        const result = _.find(voteResults, {'optionId': optText[0]});
                                        if (result) {
                                            o.voteCount = parseInt(result.voteCount, 10);
                                        }
                                    }
                                    options.push(o);
                                });
                            }
                            topic.vote.options = {
                                count: options.length,
                                rows: options
                            };
                        } else {
                            delete topic.vote;
                        }
                    });

                }

                // Sequelize returns empty array for no results.
                const result = {
                    countTotal: countTotal,
                    count: topics.length,
                    rows: topics
                };

                return res.ok(result);
            })
            .catch(next);

    });

    /**
     * Create new member Users to a Topic
     *
     * You can add User with e-mail or User id.
     * If e-mail does not exist, User is created in the DB with NULL password.
     *
     * @deprecated Use POST /api/users/:userId/topics/:topicId/invites/user instead
     */
    app.post('/api/users/:userId/topics/:topicId/members/users', DEPRECATED('Use invite API - https://github.com/citizenos/citizenos-fe/issues/112'), loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), partnerParser, asyncMiddleware(async function (req, res) {
        //NOTE: userId can be actual UUID or e-mail - it is comfort for the API user, but confusing in the BE code.
        const topicId = req.params.topicId;
        let members = req.body;
        if (!Array.isArray(members)) {
            members = [members];
        }

        const validEmailMembers = [];
        const validUserIdMembers = [];

        // userId can be actual UUID or e-mail, sort to relevant buckets
        _(members).forEach(function (m) {
            if (m.userId) {
                m.userId = m.userId.trim();

                // Is it an e-mail?
                if (validator.isEmail(m.userId)) {
                    validEmailMembers.push(m); // The whole member object with level
                } else if (validator.isUUID(m.userId, 4)) {
                    validUserIdMembers.push(m);
                } else {
                    logger.warn('Invalid member ID, is not UUID or email thus ignoring', req.method, req.path, m, req.body);
                }
            } else {
                logger.warn('Missing member id, ignoring', req.method, req.path, m, req.body);
            }
        });

        const validEmails = _.map(validEmailMembers, 'userId');

        // Find out which e-mails already exist
        if (validEmails.length) {
            const usersExistingEmail = await User
                .findAll({
                    where: {
                        email: {
                            [Op.iLike]: {
                                [Op.any]: validEmails
                            }
                        }
                    },
                    attributes: ['id', 'email']
                });
                _(usersExistingEmail).forEach(function (u) {
                    const member = _.find(validEmailMembers, {userId: u.email});
                    if (member) {
                        member.userId = u.id;
                        validUserIdMembers.push(member);
                        _.remove(validEmailMembers, member); // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                    }
                });
        }

        await db.transaction(async function (t) {
            let createdUsers;

            // The leftovers are e-mails for which User did not exist
            if (validEmailMembers.length) {
                const usersToCreate = [];
                _(validEmailMembers).forEach(function (m) {
                    usersToCreate.push({
                        email: m.userId,
                        language: m.language,
                        password: null,
                        name: util.emailToDisplayName(m.userId),
                        source: User.SOURCES.citizenos
                    });
                });

                createdUsers = await User.bulkCreate(usersToCreate, {transaction: t});

                const createdUsersActivitiesCreatePromises = createdUsers.map(async function (user) {
                    return cosActivities.createActivity(
                        user,
                        null,
                        {
                            type: 'System',
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );
                });

                await Promise.all(createdUsersActivitiesCreatePromises);
            }

            if (createdUsers && createdUsers.length) {
                _(createdUsers).forEach(function (u) {
                    const member = {
                        userId: u.id
                    };

                    // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                    const level = _.find(validEmailMembers, {userId: u.email}).level;
                    if (level) {
                        member.level = level;
                    }

                    validUserIdMembers.push(member);
                });
            }

            // TODO: Creates 1 DB call per Member which is not wise when thinking of performance.
            // Change once http://sequelize.readthedocs.org/en/latest/api/model/#bulkcreaterecords-options-promisearrayinstance suppors "bulkUpsert"
            const findOrCreateMembersPromises = validUserIdMembers.map(function (member) {
                member.topicId = topicId;
                member.type = 'TopicMemberUser';

                return TopicMemberUser
                    .findOrCreate({
                        where: {
                            topicId: member.topicId,
                            userId: member.userId
                        },
                        defaults: {
                            level: member.level || TopicMemberUser.LEVELS.read
                        },
                        transaction: t
                    });
            });

            const findOrCreateMembersResult = await Promise.allSettled(
                findOrCreateMembersPromises
            );

            const topic = await Topic
                .findOne({
                    where: {
                        id: topicId
                    },
                    transaction: t
                });

            const userIdsToInvite = [];
            const activityCreatePromises = findOrCreateMembersResult.map(async function (memberResult, i) {
                if (memberResult.isFulfilled()) {
                    const [member, created] = memberResult.value(); // findOrCreate returns [[instance, created=true/false]]

                    if (created && member) {
                        userIdsToInvite.push(validUserIdMembers[i].userId);
                        const user = User.build({id: member.userId});
                        user.dataValues.id = member.userId;
                        return cosActivities.addActivity( // Fire and forget!
                            user,
                            {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            },
                            null,
                            topic,
                            req.method + ' ' + req.path,
                            t
                        );
                    }
                } else {
                    logger.error('Failed to add a TopicMemberUser', validUserIdMembers[i]);
                }
            });
            await Promise.all(activityCreatePromises);

            return await emailLib.sendTopicMemberUserCreate(userIdsToInvite, req.user.id, topicId, req.locals.partner);
        });

        return res.created();
    }));


    /**
     * Get all members of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read), async function (req, res, next) {
        const response = {
            groups: {
                count: 0,
                rows: []
            },
            users: {
                count: 0,
                rows: []
            }
        };
        try {
            const groups = await db
                .query(
                    `
                    SELECT
                        g.id,
                        CASE
                            WHEN gmu.level IS NOT NULL THEN g.name
                            ELSE NULL
                        END as "name",
                        tmg.level,
                        gmu.level as "permission.level",
                        g.visibility,
                        gmuc.count as "members.users.count"
                    FROM "TopicMemberGroups" tmg
                        JOIN "Groups" g ON (tmg."groupId" = g.id)
                        JOIN (
                            SELECT
                                "groupId",
                                COUNT(*) as count
                            FROM "GroupMembers"
                            WHERE "deletedAt" IS NULL
                            GROUP BY 1
                        ) as gmuc ON (gmuc."groupId" = g.id)
                        LEFT JOIN "GroupMembers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL)
                    WHERE tmg."topicId" = :topicId
                        AND tmg."deletedAt" IS NULL
                        AND g."deletedAt" IS NULL
                    ORDER BY level DESC;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user.id
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            const users = await db
                .query(
                    `
                    SELECT
                        tm.*
                    FROM (
                        SELECT DISTINCT ON(id)
                            tm."memberId" as id,
                            tm."level",
                            tmu."level" as "levelUser",
                            u.name,
                            u.company,
                            u."imageUrl"
                        FROM "Topics" t
                        JOIN (
                            SELECT
                                tmu."topicId",
                                tmu."userId" AS "memberId",
                                tmu."level"::text,
                                1 as "priority"
                            FROM "TopicMemberUsers" tmu
                            WHERE tmu."deletedAt" IS NULL
                            UNION
                            (
                                SELECT
                                    tmg."topicId",
                                    gm."userId" AS "memberId",
                                    tmg."level"::text,
                                    2 as "priority"
                                FROM "TopicMemberGroups" tmg
                                LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId")
                                WHERE tmg."deletedAt" IS NULL
                                AND gm."deletedAt" IS NULL
                                ORDER BY tmg."level"::"enum_TopicMemberGroups_level" DESC
                            )
                        ) AS tm ON (tm."topicId" = t.id)
                        JOIN "Users" u ON (u.id = tm."memberId")
                        LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm."memberId" AND tmu."topicId" = t.id)
                        WHERE t.id = :topicId
                        ORDER BY id, tm.priority
                    ) tm
                    ORDER BY name ASC
                    ;`,
                    {
                        replacements: {
                            topicId: req.params.topicId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true
                    }
                );


            if (groups && groups.length) {
                response.groups.count = groups.length;
                response.groups.rows = groups;
            }

            if (users && users.length) {
                response.users.count = users.length;
                response.users.rows = users;
            }

            return res.ok(response);
        } catch(err) {
            return next(err);
        }
    });

    /**
     * Get all member Users of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members/users', loginCheck(['partner']), isModerator(), hasPermission(TopicMemberUser.LEVELS.read), async function (req, res, next) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        let where = '';
        if (search) {
            where = ` WHERE tm.name ILIKE :search `
        }

        let dataForModerator = '';
        if (req.user && req.user.moderator) {
            dataForModerator = `
            tm.email,
            uc."connectionData"::jsonb->>'pid' AS "pid",
            uc."connectionData"::jsonb->>'phoneNumber' AS "phoneNumber",
            `;
        }

        try {
            const users = await db
                .query(
                    `SELECT
                    tm.id,
                    tm.level,
                    tmu.level AS "levelUser",
                    tm.name,
                    tm.company,
                    tm."imageUrl",
                    ${dataForModerator}
                    json_agg(
                        json_build_object('id', tmg."groupId",
                        'name', tmg.name,
                        'level', tmg."level"
                        )
                    ) as "groups.rows",
                    count(*) OVER()::integer AS "countTotal"
                FROM (
                    SELECT DISTINCT ON(id)
                        tm."memberId" as id,
                        tm."level",
                        u.name,
                        u.company,
                        u."imageUrl",
                        u.email
                    FROM "Topics" t
                    JOIN (
                        SELECT
                            tmu."topicId",
                            tmu."userId" AS "memberId",
                            tmu."level"::text,
                            1 as "priority"
                        FROM "TopicMemberUsers" tmu
                        WHERE tmu."deletedAt" IS NULL
                        UNION
                        SELECT
                            tmg."topicId",
                            gm."userId" AS "memberId",
                            tmg."level"::text,
                            2 as "priority"
                        FROM "TopicMemberGroups" tmg
                        LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId")
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                    ) AS tm ON (tm."topicId" = t.id)
                    JOIN "Users" u ON (u.id = tm."memberId")
                    WHERE t.id = :topicId
                    ORDER BY id, tm.priority, tm."level"::"enum_TopicMemberUsers_level" DESC
                ) tm
                LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm.id AND tmu."topicId" = :topicId)
                LEFT JOIN (
                    SELECT gm."userId", tmg."groupId", tmg."topicId", tmg.level, g.name
                    FROM "GroupMembers" gm
                    LEFT JOIN "TopicMemberGroups" tmg ON tmg."groupId" = gm."groupId"
                    LEFT JOIN "Groups" g ON g.id = tmg."groupId" AND g."deletedAt" IS NULL
                    WHERE gm."deletedAt" IS NULL
                    AND tmg."deletedAt" IS NULL
                ) tmg ON tmg."topicId" = :topicId AND (tmg."userId" = tm.id)
                LEFT JOIN "GroupMembers" gmu ON (gmu."groupId" = tmg."groupId" AND gmu."userId" = :userId)
                LEFT JOIN "UserConnections" uc ON (uc."userId" = tm.id AND uc."connectionId" = 'esteid')
                ${where}
                GROUP BY tm.id, tm.level, tmu.level, tm.name, tm.company, tm."imageUrl"
                ORDER BY tm.name ASC
                LIMIT :limit
                OFFSET :offset
                ;`,
                {
                    replacements: {
                        topicId: req.params.topicId,
                        userId: req.user.id,
                        search: `%${search}%`,
                        limit,
                        offset
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            let countTotal = 0;
            if (users && users.length) {
                countTotal = users[0].countTotal;
            }
            users.forEach(function (userRow) {
                delete userRow.countTotal;

                userRow.groups.rows.forEach(function (group, index) {
                    if (group.id === null) {
                        userRow.groups.rows.splice(index,1);
                    } else if (group.level === null) {
                        group.name = null;
                    }
                });
                userRow.groups.count = userRow.groups.rows.length;
            });

            return res.ok({
                countTotal,
                count: users.length,
                rows: users
            });
        } catch(err) {
            return next(err);
        }
    });

    /**
     * Get all member Groups of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members/groups', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read), async function (req, res, next) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        let where = '';
        if (search) {
            where = `WHERE mg.name ILIKE :search`
        }

        try {
            const groups = await db
                .query(
                    `
                    SELECT mg.*,count(*) OVER()::integer AS "countTotal" FROM (
                        SELECT
                            g.id,
                            CASE
                                WHEN gmu.level IS NOT NULL THEN g.name
                                ELSE NULL
                            END as "name",
                            tmg.level,
                            gmu.level as "permission.level",
                            g.visibility,
                            gmuc.count as "members.users.count"
                        FROM "TopicMemberGroups" tmg
                            JOIN "Groups" g ON (tmg."groupId" = g.id)
                            JOIN (
                                SELECT
                                    "groupId",
                                    COUNT(*) as count
                                FROM "GroupMembers"
                                WHERE "deletedAt" IS NULL
                                GROUP BY 1
                            ) as gmuc ON (gmuc."groupId" = g.id)
                            LEFT JOIN "GroupMembers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL)
                        WHERE tmg."topicId" = :topicId
                        AND tmg."deletedAt" IS NULL
                        AND g."deletedAt" IS NULL
                        ORDER BY level DESC
                    ) mg
                    ${where}
                    LIMIT :limit
                    OFFSET :offset;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user.id,
                            search: `%${search}%`,
                            limit,
                            offset
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            let countTotal = 0;
            if (groups && groups.length) {
                countTotal = groups[0].countTotal;
            }
            groups.forEach(function (group) {
                delete group.countTotal;
            });

            return res.ok({
                countTotal,
                count: groups.length,
                rows: groups
            });
        } catch(err) {
            return next(err);
        }
    });

    const checkPermissionsForGroups = function (groupIds, userId, level) {
        if (!Array.isArray(groupIds)) {
            groupIds = [groupIds];
        }

        const LEVELS = {
            none: 0, // Enables to override inherited permissions.
            read: 1,
            edit: 2,
            admin: 3
        };

        const minRequiredLevel = level || 'read';

        return db
            .query(
                '\
                SELECT \
                    g.visibility = \'public\' AS "isPublic", \
                    gm."userId" AS "allowed", \
                    gm."userId" AS uid, \
                    gm."level" AS level, \
                    g.id \
                FROM "Groups" g \
                LEFT JOIN "GroupMembers" gm \
                    ON(gm."groupId" = g.id) \
                WHERE g.id IN (:groupIds) \
                    AND gm."userId" = :userId \
                    AND gm."deletedAt" IS NULL \
                    AND g."deletedAt" IS NULL \
                GROUP BY id, uid, level;',
                {
                    replacements: {
                        groupIds: groupIds,
                        userId: userId,
                        level: minRequiredLevel
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            )
            .then(function (result) {
                if (result && result.length) {
                    if (result.length < groupIds.length) {
                        return Promise.reject();
                    }

                    result.forEach(function (row) {
                        const blevel = row.level;

                        if (LEVELS[minRequiredLevel] > LEVELS[blevel]) {
                            logger.warn('Access denied to topic due to member without permissions trying to delete user! ', 'userId:', userId);

                            return Promise.reject();
                        }
                    });

                    return result;
                } else {
                    return Promise.reject();
                }
            });
    };

    /**
     * Create new member Groups to a Topic
     */
    app.post('/api/users/:userId/topics/:topicId/members/groups', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        let members = req.body;
        const topicId = req.params.topicId;

        if (!Array.isArray(members)) {
            members = [members];
        }

        const groupIds = [];
        members.forEach(function (member) {
            groupIds.push(member.groupId);
        });

        checkPermissionsForGroups(groupIds, req.user.id) // Checks if all groups are allowed
            .then(function (allowedGroups) {
                if (allowedGroups && allowedGroups[0]) {
                    return db
                        .transaction(function (t) {
                            return Topic
                                .findOne({
                                    where: {
                                        id: topicId
                                    },
                                    transaction: t
                                })
                                .then(function (topic) {
                                    const findOrCreateTopicMemberGroups = allowedGroups.map(function (group) {
                                        const member = _.find(members, function (o) {
                                            return o.groupId === group.id;
                                        });

                                        return TopicMemberGroup
                                            .findOrCreate({
                                                where: {
                                                    topicId: topicId,
                                                    groupId: member.groupId
                                                },
                                                defaults: {
                                                    level: member.level || TopicMemberUser.LEVELS.read
                                                },
                                                transaction: t
                                            });
                                    });

                                    const groupIdsToInvite = [];
                                    const memberGroupActivities = [];
                                    return Promise
                                        .allSettled(findOrCreateTopicMemberGroups)
                                        .each(function (inspection) {
                                            if (inspection.isFulfilled()) {
                                                var memberGroup = inspection.value()[0].toJSON();
                                                groupIdsToInvite.push(memberGroup.groupId);
                                                const groupData = _.find(allowedGroups, function (item) {
                                                    return item.id === memberGroup.groupId;
                                                });
                                                const group = Group.build(groupData);

                                                const addActivity = cosActivities.addActivity(
                                                    topic,
                                                    {
                                                        type: 'User',
                                                        id: req.user.id,
                                                        ip: req.ip
                                                    },
                                                    null,
                                                    group,
                                                    req.method + ' ' + req.path,
                                                    t
                                                );
                                                memberGroupActivities.push(addActivity);

                                            } else {
                                                logger.error('Adding Group failed', inspection.reason());
                                            }
                                        }).then(function () {
                                            return Promise
                                                    .all(memberGroupActivities)
                                                    .then(function () {
                                                        return emailLib.sendTopicMemberGroupCreate(groupIdsToInvite, req.user.id, topicId);
                                                    })
                                                    .then(function (res) {
                                                        if (res && res.errors) {
                                                            logger.error('ERRORS', res.errors);
                                                        }
                                                    });
                                        });


                                    });
                        });
                } else {
                    return Promise.reject();
                }
            })
            .then(function () {
                return res.created();
            })
            .catch(function (err) {
                if (err) {
                    logger.error('Adding Group to Topic failed', req.path, err);

                    return next(err);
                }

                return res.forbidden();
            });
    });


    /**
     * Update User membership information
     */
    app.put('/api/users/:userId/topics/:topicId/members/users/:memberId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        const newLevel = req.body.level;
        const memberId = req.params.memberId;
        const topicId = req.params.topicId;

        const promises = [];
        const userAdminFindPromise = TopicMemberUser
            .findAll({
                where: {
                    topicId: topicId,
                    level: TopicMemberUser.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            });
        promises.push(userAdminFindPromise);
        const userFindPromise = TopicMemberUser
            .findOne({
                where: {
                    topicId: topicId,
                    userId: memberId
                }
            });
        promises.push(userFindPromise);
        Promise
            .all(promises)
            .then(function (results) {
                const topicAdminMembers = results[0];
                const topicMemberUser = results[1];
                if (topicAdminMembers && topicAdminMembers.length === 1 && _.find(topicAdminMembers, {userId: memberId})) {
                    return res.badRequest('Cannot revoke admin permissions from the last admin member.');
                }

                // TODO: UPSERT - sequelize has "upsert" from new version, use that if it works - http://sequelize.readthedocs.org/en/latest/api/model/#upsert
                if (topicMemberUser) {
                    return db.transaction(function (t) {
                        topicMemberUser.level = newLevel;

                        return cosActivities
                            .updateActivity(topicMemberUser, null, {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }, null, req.method + ' ' + req.path, t)
                            .then(function () {
                                return topicMemberUser
                                    .save({
                                        transaction: t
                                    });
                            });

                    }).then(function () {
                        return res.ok();
                    }).catch(next);
                } else {
                    return TopicMemberUser
                        .create({
                            topicId: topicId,
                            userId: memberId,
                            level: newLevel
                        })
                        .then(function () {
                            return res.ok();
                        })
                        .catch(next);
                }
            })
            .catch(next);
    });


    /**
     * Update Group membership information
     */
    app.put('/api/users/:userId/topics/:topicId/members/groups/:memberId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        const newLevel = req.body.level;
        const memberId = req.params.memberId;
        const topicId = req.params.topicId;

        checkPermissionsForGroups(memberId, req.user.id)
            .then(
                function (results) {
                    if (results && results[0] && results[0].id === memberId) {
                        TopicMemberGroup
                            .findOne({
                                where: {
                                    topicId: topicId,
                                    groupId: memberId
                                }
                            })
                            .then(function (topicMemberGroup) {
                                return db
                                    .transaction(function (t) {
                                        topicMemberGroup.level = newLevel;

                                        return cosActivities
                                            .updateActivity(
                                                topicMemberGroup,
                                                null,
                                                {
                                                    type: 'User',
                                                    id: req.user.id,
                                                    ip: req.ip
                                                },
                                                null,
                                                req.method + ' ' + req.path,
                                                t
                                            )
                                            .then(function () {
                                                return topicMemberGroup.save({transaction: t});
                                            })
                                            .catch(next);
                                    });
                            })
                            .then(function () {
                                return res.ok();
                            })
                            .catch(next);
                    } else {
                        return res.forbidden();
                    }
                },
                function () {
                    return res.forbidden();
                }
            )
            .catch(next);
    });


    /**
     * Delete User membership information
     */
    app.delete('/api/users/:userId/topics/:topicId/members/users/:memberId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin, null, null, true), function (req, res, next) {
        const topicId = req.params.topicId;
        const memberId = req.params.memberId;

        TopicMemberUser
            .findAll({
                where: {
                    topicId: topicId,
                    level: TopicMemberUser.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            })
            .then(function (result) {
                // At least 1 admin member has to remain at all times..
                if (result.length === 1 && _.find(result, {userId: memberId})) {
                    res.badRequest('Cannot delete the last admin member.', 10);

                    return Promise.reject();
                }
            })
            .then(function () {
                // TODO: Used to use TopicMemberUser.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
                // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
                return db
                    .query(
                        '\
                        SELECT \
                            t.id as "Topic.id", \
                            t.title as "Topic.title", \
                            t.description as "Topic.description", \
                            t.status as "Topic.status", \
                            t.visibility as "Topic.visibility", \
                            t."tokenJoin" as "Topic.tokenJoin", \
                            t.categories as "Topic.categories", \
                            t."padUrl" as "Topic.padUrl", \
                            t."sourcePartnerId" as "Topic.sourcePartnerId", \
                            t."endsAt" as "Topic.endsAt", \
                            t.hashtag as "Topic.hashtag", \
                            t."createdAt" as "Topic.createdAt", \
                            t."updatedAt" as "Topic.updatedAt", \
                            u.id as "User.id", \
                            u.name as "User.name", \
                            u.company as "User.company", \
                            u.language as "User.language", \
                            u.email as "User.email", \
                            u."imageUrl" as "User.imageUrl" \
                        FROM \
                            "TopicMemberUsers" tmu \
                        JOIN "Topics" t \
                            ON t.id = tmu."topicId" \
                        JOIN "Users" u \
                            ON u.id = tmu."userId" \
                            WHERE \
                            tmu."userId" = :userId \
                            AND \
                            tmu."topicId" = :topicId \
                        ;',
                        {
                            replacements: {
                                topicId: topicId,
                                userId: memberId
                            },
                            type: db.QueryTypes.SELECT,
                            raw: true,
                            nest: true
                        }
                    )
                    .then(function (topicMemberUser) {
                        const topic = Topic.build(topicMemberUser.Topic);
                        const user = User.build(topicMemberUser.User);
                        topic.dataValues.id = topicId;
                        user.dataValues.id = memberId;
                        let activityPromise;

                        return db
                            .transaction(function (t) {
                                if (memberId === req.user.id) {
                                    // User leaving a Topic
                                    logger.debug('Member is leaving the Topic', {
                                        memberId: memberId,
                                        topicId: topicId
                                    });
                                    activityPromise = function () {
                                        return cosActivities
                                            .leaveActivity(topic, {
                                                type: 'User',
                                                id: req.user.id,
                                                ip: req.ip
                                            }, req.method + ' ' + req.path, t);
                                    };
                                } else {
                                    activityPromise = function () {
                                        return cosActivities
                                            .deleteActivity(user, topic, {
                                                type: 'User',
                                                id: req.user.id,
                                                ip: req.ip
                                            }, req.method + ' ' + req.path, t);
                                    };
                                }

                                return activityPromise()
                                    .then(function () {
                                        return db
                                            .query(
                                                '\
                                                DELETE FROM \
                                                    "TopicMemberUsers" \
                                                WHERE ctid IN (\
                                                    SELECT \
                                                        ctid \
                                                    FROM "TopicMemberUsers" \
                                                    WHERE "topicId" = :topicId \
                                                       AND "userId" = :userId \
                                                    LIMIT 1 \
                                                ) \
                                                ',
                                                {
                                                    replacements: {
                                                        topicId: topicId,
                                                        userId: memberId
                                                    },
                                                    type: db.QueryTypes.DELETE,
                                                    transaction: t,
                                                    raw: true
                                                }
                                            );
                                    });
                            });
                    });

            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });


    /**
     * Delete Group membership information
     */
    app.delete('/api/users/:userId/topics/:topicId/members/groups/:memberId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        const topicId = req.params.topicId;
        const memberId = req.params.memberId;

        checkPermissionsForGroups(memberId, req.user.id)
            .then(
                function (results) {
                    if (results && results[0] && results[0].id === memberId) {
                        // TODO: Used to use TopicMemberGroups.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
                        // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
                        return db
                            .query(
                                '\
                                SELECT \
                                    t.id as "Topic.id", \
                                    t.title as "Topic.title", \
                                    t.description as "Topic.description", \
                                    t.status as "Topic.status", \
                                    t.visibility as "Topic.visibility", \
                                    t."tokenJoin" as "Topic.tokenJoin", \
                                    t.categories as "Topic.categories", \
                                    t."padUrl" as "Topic.padUrl", \
                                    t."sourcePartnerId" as "Topic.sourcePartnerId", \
                                    t."endsAt" as "Topic.endsAt", \
                                    t.hashtag as "Topic.hashtag", \
                                    t."createdAt" as "Topic.createdAt", \
                                    t."updatedAt" as "Topic.updatedAt", \
                                    g.id as "Group.id", \
                                    g."parentId" as "Group.parentId", \
                                    g.name as "Group.name", \
                                    g."creatorId" as "Group.creator.id", \
                                    g.visibility as "Group.visibility" \
                                FROM \
                                    "TopicMemberGroups" tmg \
                                JOIN "Topics" t \
                                    ON t.id = tmg."topicId" \
                                JOIN "Groups" g \
                                    ON g.id = tmg."groupId" \
                                    WHERE \
                                    tmg."groupId" = :groupId \
                                    AND \
                                    tmg."topicId" = :topicId \
                                ;',
                                {
                                    replacements: {
                                        topicId: topicId,
                                        groupId: memberId
                                    },
                                    type: db.QueryTypes.SELECT,
                                    raw: true,
                                    nest: true
                                }
                            )
                            .then(function (topicMemberGroup) {
                                const topic = Topic.build(topicMemberGroup.Topic);
                                topic.dataValues.id = topicId;
                                const group = Group.build(topicMemberGroup.Group);
                                group.dataValues.id = memberId;

                                return db
                                    .transaction(function (t) {
                                        return cosActivities
                                            .deleteActivity(
                                                group,
                                                topic,
                                                {
                                                    type: 'User',
                                                    id: req.user.id,
                                                    ip: req.ip
                                                },
                                                req.method + ' ' + req.path,
                                                t
                                            )
                                            .then(function () {
                                                return db
                                                    .query(
                                                        '\
                                                        DELETE FROM \
                                                            "TopicMemberGroups" \
                                                        WHERE ctid IN (\
                                                            SELECT \
                                                                ctid \
                                                            FROM "TopicMemberGroups" \
                                                            WHERE "topicId" = :topicId \
                                                            AND "groupId" = :groupId \
                                                            LIMIT 1 \
                                                        ) \
                                                        ',
                                                        {
                                                            replacements: {
                                                                topicId: topicId,
                                                                groupId: memberId
                                                            },
                                                            type: db.QueryTypes.DELETE,
                                                            raw: true
                                                        }
                                                    );
                                            });
                                    })
                                    .then(function () {
                                        return res.ok();
                                    })
                                    .catch(next);
                            });
                    } else {
                        return res.forbidden();
                    }
                },
                function (err) {
                    logger.error(err);

                    return res.forbidden();
                }
            )
            .catch(next);

    });

    /**
     * Invite new Members to the Topic
     *
     * Does NOT add a Member automatically, but will send an invite, which has to accept in order to become a Member of the Topic
     *
     * @see /api/users/:userId/topics/:topicId/members/users "Auto accept" - Adds a Member to the Topic instantly and sends a notification to the User.
     */
    app.post('/api/users/:userId/topics/:topicId/invites/users', loginCheck(), hasPermission(TopicMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        //NOTE: userId can be actual UUID or e-mail - it is comfort for the API user, but confusing in the BE code.
        const topicId = req.params.topicId;
        const userId = req.user.id;
        let members = req.body;

        if (!Array.isArray(members)) {
            members = [members];
        }
        const inviteMessage = members[0].inviteMessage;
        const validEmailMembers = [];
        let validUserIdMembers = [];

        // userId can be actual UUID or e-mail, sort to relevant buckets
        _(members).forEach(function (m) {
            if (m.userId) {
                m.userId = m.userId.trim();

                // Is it an e-mail?
                if (validator.isEmail(m.userId)) {
                    validEmailMembers.push(m); // The whole member object with level
                } else if (validator.isUUID(m.userId, 4)) {
                    validUserIdMembers.push(m);
                } else {
                    logger.warn('Invalid member ID, is not UUID or email thus ignoring', req.method, req.path, m, req.body);
                }
            } else {
                logger.warn('Missing member id, ignoring', req.method, req.path, m, req.body);
            }
        });

        const validEmails = _.map(validEmailMembers, 'userId');
        if (validEmails.length) {
            // Find out which e-mails already exist
            const usersExistingEmail = await User
            .findAll({
                where: {
                    email: {
                        [Op.iLike]: {
                            [Op.any]: validEmails
                        }
                    }
                },
                attributes: ['id', 'email']
            });


            _(usersExistingEmail).forEach(function (u) {
                const member = _.find(validEmailMembers, {userId: u.email});
                if (member) {
                    member.userId = u.id;
                    validUserIdMembers.push(member);
                    _.remove(validEmailMembers, member); // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                }
            });
        }

        let createdInvites = await db.transaction(async function (t) {
            let createdUsers;

            // The leftovers are e-mails for which User did not exist
            if (validEmailMembers.length) {
                const usersToCreate = [];
                _(validEmailMembers).forEach(function (m) {
                    usersToCreate.push({
                        email: m.userId,
                        language: m.language,
                        password: null,
                        name: util.emailToDisplayName(m.userId),
                        source: User.SOURCES.citizenos
                    });
                });

                createdUsers = await User.bulkCreate(usersToCreate, {transaction: t});

                const createdUsersActivitiesCreatePromises = createdUsers.map(async function (user) {
                    return cosActivities.createActivity(
                        user,
                        null,
                        {
                            type: 'System',
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );
                });

                await Promise.all(createdUsersActivitiesCreatePromises);
            }

            // Go through the newly created users and add them to the validUserIdMembers list so that they get invited
            if (createdUsers && createdUsers.length) {
                _(createdUsers).forEach(function (u) {
                    const member = {
                        userId: u.id
                    };

                    // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                    const level = _.find(validEmailMembers, {userId: u.email}).level;
                    if (level) {
                        member.level = level;
                    }

                    validUserIdMembers.push(member);
                });
            }

            // Need the Topic just for the activity
            const topic = await Topic.findOne({
                where: {
                    id: topicId
                }
            });

            validUserIdMembers = validUserIdMembers.filter(function (member) {
                return member.userId !== req.user.id; // Make sure user does not invite self
            });
            const currentMembers = await TopicMemberUser.findAll({
                where: {
                    topicId: topicId
                }
            });

            const createInvitePromises = validUserIdMembers.map(async function (member) {
                const addedMember = currentMembers.find (function (cmember) {
                    return cmember.userId === member.userId;
                });
                if (addedMember) {
                    const LEVELS = {
                        none: 0, // Enables to override inherited permissions.
                        read: 1,
                        edit: 2,
                        admin: 3
                    };
                    if (addedMember.level !== member.level) {
                            if (LEVELS[member.level] > LEVELS[addedMember.level]) {
                                await addedMember.update({
                                    level: member.level
                                });

                                cosActivities
                                    .updateActivity(addedMember, null, {
                                        type: 'User',
                                        id: req.user.id,
                                        ip: req.ip
                                    }, null, req.method + ' ' + req.path, t);

                                return;
                            }

                            return;
                    } else {
                        return;
                    }
                } else {
                    const topicInvite = await TopicInviteUser.create(
                        {
                            topicId: topicId,
                            creatorId: userId,
                            userId: member.userId,
                            level: member.level
                        },
                        {
                            transaction: t
                        }
                    );

                    const userInvited = User.build({id: topicInvite.userId});
                    userInvited.dataValues.level = topicInvite.level; // FIXME: HACK? Invite event, putting level here, not sure it belongs here, but.... https://github.com/citizenos/citizenos-fe/issues/112 https://github.com/w3c/activitystreams/issues/506
                    userInvited.dataValues.inviteId = topicInvite.id; // FIXME: HACK? Invite event, pu

                    await cosActivities.inviteActivity(
                        topic,
                        userInvited,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    return topicInvite;
                }
            });

            return Promise.all(createInvitePromises);
        });

        createdInvites = createdInvites.filter(function (invite) {
            return !!invite;
        });

        for(let invite of createdInvites) {
            invite.inviteMessage = inviteMessage;
        }

        await emailLib.sendTopicMemberUserInviteCreate(createdInvites);

        if (createdInvites.length) {
            return res.created({
                count: createdInvites.length,
                rows: createdInvites
            });
        } else {
            return res.badRequest('No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.', 1);
        }
    }));

    app.get('/api/users/:userId/topics/:topicId/invites/users', loginCheck(), hasPermission(TopicMemberUser.LEVELS.read), asyncMiddleware(async function (req, res, next) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        let where = '';
        if (search) {
            where = ` AND u.name ILIKE :search `
        }

        try {
            const invites = await db
            .query(
                `SELECT
                    tiu.id,
                    tiu."creatorId",
                    tiu.level,
                    tiu."topicId",
                    tiu."userId",
                    tiu."createdAt",
                    tiu."updatedAt",
                    u.id as "user.id",
                    u.name as "user.name",
                    u."imageUrl" as "user.imageUrl",
                    count(*) OVER()::integer AS "countTotal"
                FROM "TopicInviteUsers" tiu
                JOIN "Users" u ON u.id = tiu."userId"
                WHERE tiu."topicId" = :topicId AND tiu."deletedAt" IS NULL AND tiu."createdAt" > NOW() - INTERVAL '${TopicInviteUser.VALID_DAYS}d'
                ${where}
                ORDER BY u.name ASC
                LIMIT :limit
                OFFSET :offset
                ;`,
                {
                    replacements: {
                        topicId: req.params.topicId,
                        limit,
                        offset,
                        search: `%${search}%`
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )

            if (!invites) {
                return res.notFound();
            }
            let countTotal = 0;
            if (invites.length) {
                countTotal = invites[0].countTotal;
            }

            invites.forEach(function(invite) {
                delete invite.countTotal;
            });

            return res.ok({
                countTotal,
                count: invites.length,
                rows: invites
            });
        } catch(err) {
            return next(err);
        }
    }));

    app.get(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        const invite = await TopicInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        topicId: topicId
                    },
                    paranoid: false, // return deleted!
                    include: [
                        {
                            model: Topic,
                            attributes: ['id', 'title', 'visibility', 'creatorId'],
                            as: 'topic',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'company', 'imageUrl'],
                            as: 'creator',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'email'],
                            as: 'user',
                            required: true
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "TopicInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );

        if (!invite) {
            return res.notFound();
        }

        if (invite.deletedAt) {

            let hasAccess;
            try {
                hasAccess = await _hasPermission(topicId, invite.userId, TopicMemberUser.LEVELS.read, true);
            } catch (e) {
                hasAccess = false;
            }

            if (hasAccess) {
                return res.ok(invite, 1); // Invite has already been accepted OR deleted and the person has access
            }

            return res.gone('The invite has been deleted', 1);
        }

        if (invite.dataValues.createdDaysAgo > TopicInviteUser.VALID_DAYS) {
            return res.gone(`The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`, 2);
        }

        // At this point we can already confirm users e-mail
        await User.update({emailIsVerified: true},{where: { id: invite.userId}, fields: ['emailIsVerified'], limit: 1});

        return res.ok(invite);
    }));

    app.delete(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], loginCheck(), hasPermission(TopicMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        const deletedCount = await TopicInviteUser
            .destroy(
                {
                    where: {
                        id: inviteId,
                        topicId: topicId
                    }
                }
            );

        if (!deletedCount) {
            return res.notFound('Invite not found', 1);
        }

        return res.ok();
    }));

    app.post(['/api/users/:userId/topics/:topicId/invites/users/:inviteId/accept', '/api/topics/:topicId/invites/users/:inviteId/accept'], loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.id;
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        const invite = await TopicInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        topicId: topicId
                    },
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "TopicInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );

        // Find out if the User is already a member of the Topic
        const memberUserExisting = await TopicMemberUser
            .findOne({
                where: {
                    topicId: topicId,
                    userId: userId
                }
            });

        if (invite) {
            if (invite.userId !== userId) {
                return res.forbidden();
            }

            if (memberUserExisting) {
                // User already a member, see if we need to update the level
                if (TopicMemberUser.LEVELS.indexOf(memberUserExisting.level) < TopicMemberUser.LEVELS.indexOf(invite.level)) {
                    const memberUserUpdated = await memberUserExisting.update({
                        level: invite.level
                    });
                    return res.ok(memberUserUpdated);
                } else {
                    // No level update, respond with existing member info
                    return res.ok(memberUserExisting);
                }
            } else {
                // Has the invite expired?
                if (invite.dataValues.createdDaysAgo > TopicInviteUser.VALID_DAYS) {
                    return res.gone(`The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`, 2);
                }

                // Topic needed just for the activity
                const topic = await Topic.findOne({
                    where: {
                        id: invite.topicId
                    }
                });

                const memberUserCreated = await db.transaction(async function (t) {
                    const member = await TopicMemberUser.create(
                        {
                            topicId: invite.topicId,
                            userId: invite.userId,
                            level: TopicMemberUser.LEVELS[invite.level]
                        },
                        {
                            transaction: t
                        }
                    );

                    await invite.destroy({transaction: t});

                    const user = User.build({id: member.userId});
                    user.dataValues.id = member.userId;

                    await cosActivities.acceptActivity(
                        invite,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        {
                            type: 'User',
                            id: invite.creatorId
                        },
                        topic,
                        req.method + ' ' + req.path,
                        t
                    );

                    return member;
                });

                return res.created(memberUserCreated);
            }
        } else {
            // Already a member, return that membership information
            if (memberUserExisting) {
                return res.ok(memberUserExisting);
            } else { // No invite, not a member - the User is not invited
                return res.notFound();
            }
        }
    }));

    /**
     * Join authenticated User to Topic with a given token.
     *
     * Allows sharing of private join urls for example in forums, on conference screen...
     *
     * TODO: API url is fishy.. maybe should be POST /api/topics/:joinToken/members
     */
    app.post('/api/topics/join/:tokenJoin', loginCheck(['partner']), async function (req, res, next) {
        const tokenJoin = req.params.tokenJoin;
        const userId = req.user.id;

        try {
            const topic = await Topic.findOne({
                where: {
                    tokenJoin: tokenJoin
                }
            });

            if (!topic) {
                return res.badRequest('Matching token not found', 1);
            }

            await db.transaction(async function (t) {
                const [memberUser, created] = await TopicMemberUser.findOrCreate({ // eslint-disable-line
                    where: {
                        topicId: topic.id,
                        userId: userId
                    },
                    defaults: {
                        level: TopicMemberUser.LEVELS.read
                    },
                    transaction: t
                });

                if (created) {
                    const user = await User.findOne({
                        where: {
                            id: userId
                        }
                    });

                    await cosActivities.joinActivity(
                        topic,
                        {
                            type: 'User',
                            id: user.id,
                            ip: req.ip,
                            level: TopicMemberUser.LEVELS.read
                        },
                        req.method + ' ' + req.path,
                        t
                    );
                }
            });
            const authorIds = topic.authorIds;
            const authors = await User.findAll({
                where: {
                    id: authorIds
                },
                attributes: ['id', 'name'],
                raw: true
            });

            const resObject = topic.toJSON();
            resObject.authors = authors;
            resObject.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

            return res.ok(resObject);
        } catch (err){
            next(err);
        }
    });


    /**
     * Add Topic Attachment
     */

    app.post('/api/users/:userId/topics/:topicId/attachments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.edit), async function (req, res, next) {
        const topicId = req.params.topicId;
        const name = req.body.name;
        const type = req.body.type;
        const source = req.body.source;
        const size = req.body.size;
        const link = req.body.link;

        const attachmentLimit = config.attachments.limit || 5;
        try {
            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [Attachment]
            });
            if (!topic) {
                return res.badRequest('Matching topic not found', 1);
            }
            if (topic.Attachments && topic.Attachments.length >= attachmentLimit) {
                return res.badRequest('Topic attachment limit reached', 2);
            }

            let attachment = Attachment.build({
                name: name,
                type: type,
                size: size,
                source: source,
                creatorId: req.user.id,
                link: link
            });

            await db.transaction(async function (t) {
                    attachment = await attachment.save({transaction: t});
                    await TopicAttachment.create(
                        {
                            topicId: req.params.topicId,
                            attachmentId: attachment.id
                        },
                        {
                            transaction: t
                        }
                    );
                    await cosActivities.addActivity(
                        attachment,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        null,
                        topic,
                        req.method + ' ' + req.path,
                        t
                    );

                    return res.ok(attachment.toJSON());
            });
        } catch(err) {
            next(err);
        }
    });

    app.put('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.edit), function (req, res, next) {
        const newName = req.body.name;

        const updateAttachment = {};

        if (newName) {
            updateAttachment.name = newName;
        }
        Attachment
            .findOne({
                where: {
                    id: req.params.attachmentId
                },
                include: [Topic]
            })
            .then(function (attachment) {
                attachment.name = newName;

                return db
                    .transaction(function (t) {
                        const topic = attachment.Topics[0];
                        delete attachment.Topics;

                        return cosActivities
                            .updateActivity(attachment, topic, {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }, null, req.method + ' ' + req.path, t)
                            .then(function () {
                                return attachment
                                    .save({
                                        transaction: t
                                    });
                            });
                    }).then(function () {
                        return res.ok(attachment.toJSON());
                    }).catch(next);

            })
            .catch(next);
    });

    /**
     * Delete Topic Attachment
     */
    app.delete('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.edit, false, null, true), function (req, res, next) {

        Attachment
            .findOne({
                where: {
                    id: req.params.attachmentId
                },
                include: [Topic]
            })
            .then(function (attachment) {
                db
                    .transaction(function (t) {
                        return cosActivities
                            .deleteActivity(attachment, attachment.Topics[0], {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t)
                            .then(function () {
                                return attachment
                                    .destroy({transaction: t});
                            });
                    }).then(function () {
                    return res.ok();
                })
                    .catch(next);
            });
    });

    const topicAttachmentsList = function (req, res, next) {

        db
            .query(
                ' \
                SELECT \
                    a.id, \
                    a.name, \
                    a.size, \
                    a.source, \
                    a.type, \
                    a.link, \
                    a."createdAt", \
                    c.id as "creator.id", \
                    c.name as "creator.name" \
                FROM "TopicAttachments" ta \
                JOIN "Attachments" a ON a.id = ta."attachmentId" \
                JOIN "Users" c ON c.id = a."creatorId" \
                WHERE ta."topicId" = :topicId \
                AND a."deletedAt" IS NULL \
                ; \
                ',
                {
                    replacements: {
                        topicId: req.params.topicId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (attachments) {
                return res.ok({
                    count: attachments.length,
                    rows: attachments
                });
            })
            .catch(next);
    };

    app.get('/api/users/:userId/topics/:topicId/attachments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), topicAttachmentsList);
    app.get('/api/topics/:topicId/attachments', hasVisibility(Topic.VISIBILITY.public), topicAttachmentsList);

    const readAttachment = function (req, res, next) {
        Attachment
            .findOne({
                where: {
                    id: req.params.attachmentId
                }
            })
            .then(function (attachment) {
                if (attachment && attachment.source === Attachment.SOURCES.upload && req.query.download) {
                    const fileUrl = URL.parse(attachment.link);
                    let filename = attachment.name;

                    if (filename.split('.').length <= 1) {
                        filename += '.' + attachment.type;
                    }

                    const options = {
                        hostname: fileUrl.hostname,
                        path: fileUrl.path,
                        port: fileUrl.port
                    };

                    if (app.get('env') === 'development' || app.get('env') === 'test') {
                        options.rejectUnauthorized = false;
                    }

                    https
                        .get(options, function (externalRes) {
                            res.setHeader('content-disposition', 'attachment; filename=' + encodeURIComponent(filename));
                            externalRes.pipe(res);
                        })
                        .on('error', function (err) {
                            next(err);
                        })
                        .end();
                } else {
                    res.ok(attachment.toJSON());
                }
            });
    };

    app.get('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), readAttachment);
    app.get('/api/topics/:topicId/attachments/:attachmentId', hasVisibility(Topic.VISIBILITY.public), readAttachment);

    const topicReportsCreate = async function (req, res) {
        const topicId = req.params.topicId;

        const activeReportsCount = await TopicReport
            .count({
                where: {
                    topicId: topicId,
                    resolvedById: null
                }
            });

        if (activeReportsCount) {
            return res.badRequest('Topic has already been reported. Only one active report is allowed at the time to avoid overloading the moderators', 1);
        }

        const topicReport = await db.transaction(async function (t) {
            const topicReport = await TopicReport
                .create(
                    {
                        topicId: topicId,
                        type: req.body.type,
                        text: req.body.text,
                        creatorId: req.user.id,
                        creatorIp: req.ip
                    },
                    {
                        transaction: t
                    }
                );

            await emailLib.sendTopicReport(topicReport);

            return topicReport;
        });

        return res.ok(topicReport);
    };

    /**
     * Report a Topic
     *
     * @see https://github.com/citizenos/citizenos-api/issues/5
     */
    app.post(['/api/users/:userId/topics/:topicId/reports', '/api/topics/:topicId/reports'], loginCheck(['partner']), hasVisibility(Topic.VISIBILITY.public), asyncMiddleware(topicReportsCreate));

    /**
     * Read Topic Report
     *
     * @see https://github.com/citizenos/citizenos-api/issues/5
     */
    app.get(['/api/topics/:topicId/reports/:reportId', '/api/users/:userId/topics/:topicId/reports/:reportId'], hasVisibility(Topic.VISIBILITY.public), hasPermissionModerator(), asyncMiddleware(async function (req, res) {
        const topicReports = await db
            .query(
                '\
                    SELECT \
                        tr."id", \
                        tr."type", \
                        tr."text", \
                        tr."createdAt", \
                        tr."creatorId" as "creator.id", \
                        tr."moderatedById" as "moderator.id", \
                        tr."moderatedReasonText", \
                        tr."moderatedReasonType", \
                        tr."moderatedAt", \
                        t."id" as "topic.id", \
                        t."title" as "topic.title", \
                        t."description" as "topic.description", \
                        t."updatedAt" as "topic.updatedAt" \
                    FROM "TopicReports" tr \
                    LEFT JOIN "Topics" t ON (t.id = tr."topicId") \
                    WHERE tr.id = :id \
                    AND t.id = :topicId \
                    AND tr."deletedAt" IS NULL \
                ;',
                {
                    replacements: {
                        topicId: req.params.topicId,
                        id: req.params.reportId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        const topicReport = topicReports[0];

        if (!topicReport) {
            return res.notFound();
        }

        return res.ok(topicReport);
    }));

    /**
     * Moderate a Topic - moderator approves a report, thus applying restrictions to the Topic
     */
    app.post(['/api/topics/:topicId/reports/:reportId/moderate', '/api/users/:userId/topics/:topicId/reports/:reportId/moderate'], hasVisibility(Topic.VISIBILITY.public), hasPermissionModerator(), asyncMiddleware(async function (req, res) {
        const moderatedReasonType = req.body.type; // Delete reason type which is provided in case deleted/hidden by moderator due to a user report
        const moderatedReasonText = req.body.text; // Free text with reason why the comment was deleted/hidden

        const topic = await Topic.findOne({
            where: {
                id: req.params.topicId
            }
        });

        let topicReportRead = await TopicReport.findOne({
            where: {
                id: req.params.reportId,
                topicId: req.params.topicId
            }
        });

        if (!topic || !topicReportRead) {
            return res.notFound();
        }

        if (topicReportRead.resolvedById) {
            return res.badRequest('Report has become invalid cause the report has been already resolved', 11);
        }

        if (topicReportRead.moderatedById) {
            return res.badRequest('Report has become invalid cause the report has been already moderated', 12);
        }

        let topicReportSaved = await db
            .transaction(function (t) {
                topicReportRead.moderatedById = req.user.id;
                topicReportRead.moderatedAt = db.fn('NOW');
                topicReportRead.moderatedReasonType = moderatedReasonType || ''; // HACK: If Model has "allowNull: true", it will skip all validators when value is "null"
                topicReportRead.moderatedReasonText = moderatedReasonText || ''; // HACK: If Model has "allowNull: true", it will skip all validators when value is "null"

                return topicReportRead
                    .save({
                        transaction: t,
                        returning: true
                    });
            });

        // Pass on the Topic info we loaded, don't need to load Topic again.
        await emailLib.sendTopicReportModerate(Object.assign(
            {},
            topicReportSaved.toJSON(),
            {
                topic: topic
            }
        ));

        return res.ok(topicReportSaved);
    }));

    /** Send a Topic report for review - User let's Moderators know that the violations have been corrected **/
    app.post(['/api/users/:userId/topics/:topicId/reports/:reportId/review', '/api/topics/:topicId/reports/:reportId/review'], loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const reportId = req.params.reportId;
        const text = req.body.text;

        if (!text || text.length < 10 || text.length > 4000) {
            return res.badRequest(null, 1, {text: 'Parameter "text" has to be between 10 and 4000 characters'});
        }

        const topicReport = await TopicReport.findOne({
            where: {
                topicId: topicId,
                id: reportId
            }
        });

        if (!topicReport) {
            return res.notFound('Topic report not found');
        }

        await emailLib.sendTopicReportReview(topicReport, text);

        return res.ok();
    }));

    /**
     * Resolve a Topic report - mark the Topic report as fixed, thus lifting restrictions on the Topic
     * We don't require /reports/review request to be sent to enable Moderators to act proactively
     *
     * @see https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce?argumentsPage=1
     */
    app.post(['/api/topics/:topicId/reports/:reportId/resolve', '/api/users/:userId/topics/:topicId/reports/:reportId/resolve'], hasVisibility(Topic.VISIBILITY.public), hasPermissionModerator(), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const reportId = req.params.reportId;

        const topicReport = await TopicReport
            .update(
                {
                    resolvedById: req.user.id,
                    resolvedAt: db.fn('NOW')
                },
                {
                    where: {
                        topicId: topicId,
                        id: reportId
                    },
                    returning: true
                }
            );

        await emailLib.sendTopicReportResolve(topicReport[1][0]);

        return res.ok();
    }));

    /**
     * Create Topic Comment
     */
    app.post('/api/users/:userId/topics/:topicId/comments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        let type = req.body.type;
        const parentId = req.body.parentId;
        const parentVersion = req.body.parentVersion;
        let subject = req.body.subject;
        const text = req.body.text;
        const edits = [
            {
                text: text,
                subject: subject,
                createdAt: moment().format(),
                type: type
            }
        ];

        if (parentId) {
            subject = null;
            type = Comment.TYPES.reply;
            edits[0].type = type;
        }

        let comment = Comment.build({
            type: type,
            subject: subject,
            text: text,
            parentId: parentId,
            creatorId: req.user.id,
            edits: edits
        });

        if (parentVersion) {
            comment.parentVersion = parentVersion;
        }

        db
            .transaction(function (t) {
                return comment
                    .save({transaction: t})
                    .then(function () {
                        //comment.edits.createdAt = JSON.stringify(comment.createdAt);
                        const commentCreateActivityPromise = Topic
                            .findOne({
                                where: {
                                    id: req.params.topicId
                                },
                                transaction: t
                            })
                            .then(function (topic) {
                                if (parentId) {
                                    return Comment
                                        .findOne({
                                            where: {
                                                id: parentId
                                            },
                                            transaction: t
                                        })
                                        .then(function (parentComment) {
                                            if (parentComment) {
                                                return cosActivities
                                                    .replyActivity(
                                                        comment,
                                                        parentComment,
                                                        topic,
                                                        {
                                                            type: 'User',
                                                            id: req.user.id,
                                                            ip: req.ip
                                                        }
                                                        , req.method + ' ' + req.path,
                                                        t
                                                    );
                                            }

                                            return Promise.reject(new Error(404));
                                        });
                                } else {
                                    return cosActivities
                                        .createActivity(
                                            comment,
                                            topic,
                                            {
                                                type: 'User',
                                                id: req.user.id,
                                                ip: req.ip
                                            },
                                            req.method + ' ' + req.path,
                                            t
                                        );
                                }

                            });

                        const topicCommentPromise = TopicComment
                            .create(
                                {
                                    topicId: req.params.topicId,
                                    commentId: comment.id
                                },
                                {
                                    transaction: t
                                }
                            );

                        const updateCreatedAtPromise = db
                            .query(
                                '\
                                   UPDATE "Comments" \
                                       SET edits = jsonb_set(edits, \'{0,createdAt}\', to_jsonb("createdAt")) \
                                       WHERE id = :commentId \
                                       RETURNING *; \
                                ',
                                {
                                    replacements: {
                                        commentId: comment.id
                                    },
                                    type: db.QueryTypes.UPDATE,
                                    raw: true,
                                    nest: true,
                                    transaction: t
                                }
                            );

                        return Promise.all([topicCommentPromise, updateCreatedAtPromise, commentCreateActivityPromise]);
                    });

            })
            .then(function ([tc, c]) { // eslint-disable-line
                c[0][0].edits.forEach(function (edit) {
                    edit.createdAt = new Date(edit.createdAt).toJSON();
                });

                comment = Comment.build(c[0][0]);

                return res.created(comment.toJSON());
            })
            .catch(function (err) {
                if (err.message === '404') {
                    return res.notFound();
                }
                next(err);
            });
    });

    const topicCommentsList = function (req, res, next) {
        const orderByValues = {
            rating: 'rating',
            popularity: 'popularity',
            date: 'date'
        };
        let userId = null;
        let orderByComments = '"createdAt" DESC';
        let orderByReplies = '"createdAt" ASC';
        let dataForModerator = '';
        if (req.user) {
            userId = req.user.id;

            if (req.user.moderator) {
                dataForModerator = '\
                , \'email\', u.email \
                , \'pid\', uc."connectionData"::jsonb->>\'pid\' \
                , \'phoneNumber\', uc."connectionData"::jsonb->>\'phoneNumber\' \
                ';
            }
        }

        switch (req.query.orderBy) {
            case orderByValues.rating:
                orderByComments = 'votes->\'up\'->\'count\' DESC, votes->\'up\'->\'count\' ASC, "createdAt" DESC';
                orderByReplies = 'votes->\'up\'->\'count\' DESC, votes->\'up\'->\'count\' ASC, "createdAt" ASC';
                break;
            case orderByValues.popularity:
                orderByComments = 'votes->\'count\' DESC, "createdAt" DESC';
                orderByReplies = 'votes->\'count\' DESC, "createdAt" ASC';
                break;
            default:
            // Do nothing
        }

        const query = '\
            CREATE OR REPLACE FUNCTION pg_temp.editCreatedAtToJson(jsonb) \
                RETURNS jsonb \
                AS $$ SELECT array_to_json(array(SELECT jsonb_build_object(\'subject\', r.subject, \'text\', r.text,\'createdAt\', to_char(r."createdAt" at time zone \'UTC\', :dateFormat), \'type\', r.type) FROM jsonb_to_recordset($1) as r(subject text, text text, "createdAt" timestamptz, type text)))::jsonb \
            $$ \
            LANGUAGE SQL; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.orderReplies(json) \
                RETURNS json \
                AS $$ SELECT array_to_json(array( SELECT row_to_json(r.*) FROM json_to_recordset($1) \
                    AS \
                    r(id uuid, type text, parent jsonb, subject text, text text, edits jsonb, creator jsonb, "deletedBy" jsonb, "deletedReasonType" text, "deletedReasonText" text, report jsonb, votes jsonb, "createdAt" text, "updatedAt" text, "deletedAt" text, replies jsonb) \
                    GROUP BY r.*, r."createdAt", r.votes \
                    ORDER BY ' + orderByReplies + ')) \
            $$ \
            LANGUAGE SQL; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getCommentTree(uuid) \
                RETURNS TABLE( \
                        "id" uuid, \
                        type text, \
                        parent jsonb, \
                        subject text, \
                        text text, \
                        edits jsonb, \
                        creator jsonb, \
                        "deletedBy" jsonb, \
                        "deletedReasonType" text, \
                        "deletedReasonText" text, \
                        report jsonb, \
                        votes jsonb, \
                        "createdAt" text, \
                        "updatedAt" text, \
                        "deletedAt" text, \
                        replies jsonb) \
                    AS $$ \
                        \
                        WITH RECURSIVE commentRelations AS ( \
                            SELECT \
                                c.id, \
                                c.type::text, \
                                jsonb_build_object(\'id\', c."parentId",\'version\',c."parentVersion") as parent, \
                                c.subject, \
                                c.text, \
                                pg_temp.editCreatedAtToJson(c.edits) as edits, \
                                jsonb_build_object(\'id\', u.id,\'name\',u.name, \'company\', u.company ' + dataForModerator + ') as creator, \
                                CASE \
                                    WHEN c."deletedById" IS NOT NULL THEN jsonb_build_object(\'id\', c."deletedById", \'name\', dbu.name ) \
                                    ELSE jsonb_build_object(\'id\', c."deletedById") \
                                END as "deletedBy", \
                                c."deletedReasonType"::text, \
                                c."deletedReasonText", \
                                jsonb_build_object(\'id\', c."deletedByReportId") as report, \
                                jsonb_build_object(\'up\', jsonb_build_object(\'count\', COALESCE(cvu.sum, 0), \'selected\', COALESCE(cvus.selected, false)), \'down\', jsonb_build_object(\'count\', COALESCE(cvd.sum, 0), \'selected\', COALESCE(cvds.selected, false)), \'count\', COALESCE(cvu.sum, 0) + COALESCE(cvd.sum, 0)) as votes, \
                                to_char(c."createdAt" at time zone \'UTC\', :dateFormat) as "createdAt", \
                                to_char(c."updatedAt" at time zone \'UTC\', :dateFormat) as "updatedAt", \
                                to_char(c."deletedAt" at time zone \'UTC\', :dateFormat) as "deletedAt", \
                                0 AS depth \
                                FROM "Comments" c \
                                LEFT JOIN "Users" u ON (u.id = c."creatorId") \
                                LEFT JOIN "UserConnections" uc ON (u.id = uc."userId" AND uc."connectionId" = \'esteid\') \
                                LEFT JOIN "Users" dbu ON (dbu.id = c."deletedById") \
                                LEFT JOIN ( \
                                    SELECT SUM(value), "commentId" FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId" \
                                ) cvu ON (cvu."commentId" = c.id) \
                                LEFT JOIN ( \
                                    SELECT "commentId", value,  true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId"=:userId \
                                ) cvus ON (cvu."commentId"= cvus."commentId")\
                                LEFT JOIN ( \
                                    SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId" \
                                ) cvd ON (cvd."commentId" = c.id) \
                                LEFT JOIN ( \
                                    SELECT "commentId", true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId"=:userId \
                                ) cvds ON (cvd."commentId"= cvds."commentId")\
                                WHERE c.id = $1 \
                            UNION ALL \
                            SELECT \
                                c.id, \
                                c.type::text, \
                                jsonb_build_object(\'id\', c."parentId",\'version\',c."parentVersion") as parent, \
                                c.subject, \
                                c.text, \
                                pg_temp.editCreatedAtToJson(c.edits) as edits, \
                                jsonb_build_object(\'id\', u.id,\'name\',u.name, \'company\', u.company ' + dataForModerator + ' ) as creator, \
                                CASE \
                                    WHEN c."deletedById" IS NOT NULL THEN jsonb_build_object(\'id\', c."deletedById", \'name\', dbu.name ) \
                                    ELSE jsonb_build_object(\'id\', c."deletedById") \
                                END as "deletedBy", \
                                c."deletedReasonType"::text, \
                                c."deletedReasonText", \
                                jsonb_build_object(\'id\', c."deletedByReportId") as report, \
                                jsonb_build_object(\'up\', jsonb_build_object(\'count\', COALESCE(cvu.sum, 0), \'selected\', COALESCE(cvus.selected, false)), \'down\', jsonb_build_object(\'count\', COALESCE(cvd.sum, 0), \'selected\', COALESCE(cvds.selected, false)), \'count\', COALESCE(cvu.sum, 0) + COALESCE(cvd.sum, 0)) as votes, \
                                to_char(c."createdAt" at time zone \'UTC\', :dateFormat) as "createdAt", \
                                to_char(c."updatedAt" at time zone \'UTC\', :dateFormat) as "updatedAt", \
                                to_char(c."deletedAt" at time zone \'UTC\', :dateFormat) as "deletedAt", \
                                commentRelations.depth + 1 \
                                FROM "Comments" c \
                                JOIN commentRelations ON c."parentId" = commentRelations.id AND c.id != c."parentId" \
                                LEFT JOIN "Users" u ON (u.id = c."creatorId") \
                                LEFT JOIN "UserConnections" uc ON (u.id = uc."userId" AND uc."connectionId" = \'esteid\') \
                                LEFT JOIN "Users" dbu ON (dbu.id = c."deletedById") \
                                LEFT JOIN ( \
                                    SELECT SUM(value), "commentId" FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId" \
                                ) cvu ON (cvu."commentId" = c.id) \
                                LEFT JOIN ( \
                                    SELECT "commentId", value, true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId" = :userId \
                                ) cvus ON (cvus."commentId" = c.id) \
                                LEFT JOIN ( \
                                    SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId" \
                                ) cvd ON (cvd."commentId" = c.id) \
                                LEFT JOIN ( \
                                    SELECT "commentId", true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId" = :userId \
                                ) cvds ON (cvds."commentId"= c.id)\
                        ), \
                        \
                        maxdepth AS ( \
                            SELECT max(depth) maxdepth FROM commentRelations \
                        ), \
                        \
                        rootTree as ( \
                            SELECT c.* FROM \
                                commentRelations c, maxdepth \
                                WHERE depth = maxdepth \
                            UNION ALL \
                            SELECT c.* FROM \
                                commentRelations c, rootTree \
                                WHERE c.id = (rootTree.parent->>\'id\')::uuid AND rootTree.id != (rootTree.parent->>\'id\')::uuid \
                        ), \
                        \
                        commentTree AS ( \
                            SELECT \
                                c.id, \
                                c.type, \
                                c.parent, \
                                c.subject, \
                                c.text, \
                                pg_temp.editCreatedAtToJson(c.edits) as edits, \
                                c.creator, \
                                c."deletedBy", \
                                c."deletedReasonType", \
                                c."deletedReasonText", \
                                c.report, \
                                c.votes, \
                                c."createdAt", \
                                c."updatedAt", \
                                c."deletedAt", \
                                c.depth, \
                                jsonb_build_object(\'count\',0, \'rows\', json_build_array()) replies \
                                FROM commentRelations c, maxdepth \
                                WHERE c.depth = maxdepth \
                            UNION ALL \
                            SELECT \
                                (commentRelations).*, \
                                jsonb_build_object(\'rows\', pg_temp.orderReplies(array_to_json( \
                                    array_agg(commentTree) \
                                    || \
                                    array( \
                                        SELECT t \
                                            FROM ( \
                                                SELECT \
                                                    l.*, \
                                                    jsonb_build_object(\'count\',0, \'rows\', json_build_array()) replies \
                                                FROM commentRelations l, maxdepth \
                                                    WHERE (l.parent->>\'id\')::uuid = (commentRelations).id \
                                                    AND l.depth < maxdepth \
                                                    AND l.id  NOT IN ( \
                                                        SELECT id FROM rootTree \
                                                    ) \
                                                    ORDER BY l."createdAt" ASC \
                                            ) r \
                                           JOIN pg_temp.getCommentTree(r.id) t \
                                            ON r.id = t.id \
                                        )) \
                                ), \'count\', \
                                array_length(( \
                                    array_agg(commentTree) \
                                    || \
                                    array( \
                                        SELECT t \
                                            FROM ( \
                                                SELECT \
                                                    l.* \
                                                FROM commentRelations l, maxdepth \
                                                    WHERE (l.parent->>\'id\')::uuid = (commentRelations).id \
                                                    AND l.depth < maxdepth \
                                                    AND l.id  NOT IN ( \
                                                        SELECT id FROM rootTree \
                                                    ) \
                                                ORDER BY l."createdAt" ASC \
                                            ) r \
                                           JOIN pg_temp.getCommentTree(r.id) t \
                                            ON r.id = t.id \
                                        )), 1)) replies \
                    FROM ( \
                        SELECT commentRelations, commentTree \
                            FROM commentRelations \
                        JOIN commentTree \
                            ON ( \
                                (commentTree.parent->>\'id\')::uuid = commentRelations.id \
                                AND (commentTree.parent->>\'id\')::uuid != commentTree.id \
                            ) \
                        ORDER BY commentTree."createdAt" ASC \
                    ) v \
                    GROUP BY v.commentRelations \
                    ) \
                    \
                    SELECT \
                        id, \
                        type, \
                        parent::jsonb, \
                        subject, \
                        text, \
                        edits::jsonb, \
                        creator::jsonb, \
                        "deletedBy", \
                        "deletedReasonType", \
                        "deletedReasonText", \
                        report, \
                        votes::jsonb, \
                        "createdAt", \
                        "updatedAt", \
                        "deletedAt", \
                        replies::jsonb \
                    FROM commentTree WHERE id = $1 \
                    ORDER BY ' + orderByComments + ' \
                $$ \
                LANGUAGE SQL; \
                \
                SELECT \
                    ct.id, \
                    COALESCE (ctp.count, 0) AS "countPro", \
                    COALESCE (ctc.count, 0) AS "countCon", \
                    ct.type, \
                    ct.parent, \
                    ct.subject, \
                    ct.text, \
                    ct.edits, \
                    ct.creator, \
                    ct."deletedBy", \
                    ct."deletedReasonType", \
                    ct."deletedReasonText", \
                    ct.report, \
                    ct.votes, \
                    ct."createdAt", \
                    ct."updatedAt", \
                    ct."deletedAt", \
                    ct.replies::jsonb \
                FROM \
                    "TopicComments" tc \
                    JOIN "Comments" c ON c.id = tc."commentId" AND c.id = c."parentId" \
                    JOIN pg_temp.getCommentTree(tc."commentId") ct ON ct.id = ct.id \
                    LEFT JOIN ( \
                        SELECT \
                            tc."topicId", \
                            c.type, \
                            COUNT(c.type) AS count \
                            FROM "TopicComments" tc \
                            JOIN "Comments" c ON c.id = tc."commentId" AND c.id=c."parentId" \
                            WHERE tc."topicId" = :topicId \
                            AND c.type=\'pro\' \
                            GROUP BY tc."topicId", c.type \
                    ) ctp ON ctp."topicId" = tc."topicId" \
                    LEFT JOIN ( \
                        SELECT \
                            tc."topicId", \
                            c.type, \
                            COUNT(c.type) AS count \
                            FROM "TopicComments" tc \
                            JOIN "Comments" c ON c.id = tc."commentId" AND c.id=c."parentId" \
                            WHERE tc."topicId" = :topicId \
                            AND c.type=\'con\' \
                            GROUP BY tc."topicId", c.type \
                    ) ctc ON ctc."topicId" = tc."topicId" \
                WHERE tc."topicId" = :topicId \
                ORDER BY ' + orderByComments + ' \
                LIMIT :limit \
                OFFSET :offset \
                ;\
        ';

        db
            .query(
                query,
                {
                    replacements: {
                        topicId: req.params.topicId,
                        userId: userId,
                        dateFormat: 'YYYY-MM-DDThh24:mi:ss.msZ',
                        limit: req.query.limit || 15,
                        offset: req.query.offset || 0
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (comments) {
                let countPro = 0;
                let countCon = 0;

                if (comments.length) {
                    countPro = comments[0].countPro;
                    countCon = comments[0].countCon;
                }
                comments.forEach(function (comment) {
                    delete comment.countPro;
                    delete comment.countCon;
                });

                return res.ok({
                    count: {
                        pro: countPro,
                        con: countCon,
                        total: countCon + countPro
                    },
                    rows: comments
                });
            })
            .catch(next);
    };

    /**
     * Read (List) Topic Comments
     */
    app.get('/api/users/:userId/topics/:topicId/comments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), isModerator(), topicCommentsList);

    /**
     * Read (List) public Topic Comments
     */
    app.get('/api/topics/:topicId/comments', hasVisibility(Topic.VISIBILITY.public), isModerator(), topicCommentsList);

    /**
     * Delete Topic Comment
     */
    app.delete('/api/users/:userId/topics/:topicId/comments/:commentId', loginCheck(['partner']), isCommentCreator(), hasPermission(TopicMemberUser.LEVELS.admin, false, null, true));
//WARNING: Don't mess up with order here! In order to use "next('route')" in the isCommentCreator, we have to have separate route definition
//NOTE: If you have good ideas how to keep one route definition with several middlewares, feel free to share!
    app.delete('/api/users/:userId/topics/:topicId/comments/:commentId', function (req, res, next) {
        db
            .transaction(function (t) {
                return Comment
                    .findOne({
                        where: {
                            id: req.params.commentId
                        },
                        include: [Topic]
                    })
                    .then(function (comment) {
                        comment.deletedById = req.user.id;

                        return comment
                            .save({
                                transaction: t
                            })
                            .then(function () {
                                return cosActivities
                                    .deleteActivity(
                                        comment,
                                        comment.Topics[0],
                                        {
                                            type: 'User',
                                            id: req.user.id,
                                            ip: req.ip
                                        },
                                        req.method + ' ' + req.path,
                                        t
                                    );
                            })
                            .then(function () {
                                return Comment
                                    .destroy({
                                        where: {
                                            id: req.params.commentId
                                        },
                                        transaction: t
                                    });
                            });
                    });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });


    app.put('/api/users/:userId/topics/:topicId/comments/:commentId', loginCheck(['partner']), isCommentCreator());
//WARNING: Don't mess up with order here! In order to use "next('route')" in the isCommentCreator, we have to have separate route definition.
//NOTE: If you have good ideas how to keep one route definition with several middlewares, feel free to share!
    app.put('/api/users/:userId/topics/:topicId/comments/:commentId', function (req, res, next) {
        const subject = req.body.subject;
        const text = req.body.text;
        let type = req.body.type;
        const commentId = req.params.commentId;

        Comment
            .findOne({
                where: {
                    id: commentId
                },
                include: [Topic]
            })
            .then(function (comment) {
                const now = moment().format();
                const edits = comment.edits;

                if (text === comment.text && subject === comment.subject && type === comment.type) {
                    return res.ok();
                }
                if (!type || comment.type === Comment.TYPES.reply) {
                    type = comment.type;
                }
                edits.push({
                    text: text,
                    subject: subject,
                    createdAt: now,
                    type: type
                });
                comment.set('edits', null);
                comment.set('edits', edits);
                comment.subject = subject;
                comment.text = text;
                comment.type = type;

                return db
                    .transaction(function (t) {
                        const topic = comment.Topics[0];
                        delete comment.Topic;

                        return cosActivities
                            .updateActivity(comment, topic, {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }, null, req.method + ' ' + req.path, t)
                            .then(function () {
                                return comment
                                    .save({
                                        transaction: t
                                    })
                                    .then(function () {
                                        return db
                                            .query(
                                                '\
                                                   UPDATE "Comments" \
                                                       SET edits = jsonb_set(edits, \'{:pos,createdAt}\', to_jsonb("updatedAt")) \
                                                       WHERE id = :commentId \
                                                       RETURNING *; \
                                                ',
                                                {
                                                    replacements: {
                                                        commentId: commentId,
                                                        pos: comment.edits.length - 1
                                                    },
                                                    type: db.QueryTypes.UPDATE,
                                                    raw: true,
                                                    nest: true,
                                                    transaction: t
                                                }
                                            );
                                    });
                            });
                    })
                    .then(function () {
                        return res.ok();
                    })
                    .catch(function (err) {
                        logger.error(err);
                    });
            })
            .catch(next);
    });

    const topicCommentsReportsCreate = function (req, res, next) {
        const commentId = req.params.commentId;

        return Comment
            .findOne({
                where: {
                    id: commentId
                }
            })
            .then(function (comment) {
                if (!comment) {
                    return comment;
                }

                return db
                    .transaction(function (t) {
                        return Report
                            .create(
                                {
                                    type: req.body.type,
                                    text: req.body.text,
                                    creatorId: req.user.id,
                                    creatorIp: req.ip
                                },
                                {
                                    transaction: t
                                }
                            )
                            .then(function (report) {
                                return cosActivities
                                    .addActivity(
                                        report,
                                        {
                                            type: 'User',
                                            id: req.user.id,
                                            ip: req.ip
                                        },
                                        null,
                                        comment,
                                        req.method + ' ' + req.path,
                                        t
                                    )
                                    .then(function () {
                                        return CommentReport
                                            .create(
                                                {
                                                    commentId: commentId,
                                                    reportId: report.id
                                                },
                                                {
                                                    transaction: t
                                                }
                                            )
                                            .then(function () {
                                                return report;
                                            });
                                    });
                            });
                    });
            })
            .then(function (report) {
                if (!report) {
                    return res.notFound();
                }

                return emailLib
                    .sendCommentReport(commentId, report)
                    .then(function () {
                        return res.ok(report);
                    });
            })
            .catch(next);
    };

    app.post(['/api/users/:userId/topics/:topicId/comments/:commentId/reports', '/api/topics/:topicId/comments/:commentId/reports'], loginCheck(['partner']), topicCommentsReportsCreate);


    /**
     * Read Report
     */
    app.get(['/api/topics/:topicId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/comments/:commentId/reports/:reportId'], authTokenRestrictedUse, function (req, res, next) {
        db
            .query(
                '\
                    SELECT \
                        r."id", \
                        r."type", \
                        r."text", \
                        r."createdAt", \
                        c."id" as "comment.id", \
                        c.subject as "comment.subject", \
                        c."text" as "comment.text" \
                    FROM "Reports" r \
                    LEFT JOIN "CommentReports" cr ON (cr."reportId" = r.id) \
                    LEFT JOIN "Comments" c ON (c.id = cr."commentId") \
                    WHERE r.id = :reportId \
                    AND c.id = :commentId \
                    AND r."deletedAt" IS NULL \
                ;',
                {
                    replacements: {
                        commentId: req.params.commentId,
                        reportId: req.params.reportId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (results) {
                if (!results || !results.length) {
                    return res.notFound();
                }

                const commentReport = results[0];

                return res.ok(commentReport);
            })
            .catch(next);
    });

    app.post('/api/topics/:topicId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, function (req, res, next) {
        const eventTokenData = req.locals.tokenDecoded;
        const type = req.body.type;

        if (!type) {
            return res.badRequest({type: 'Property type is required'});
        }

        db
            .query(
                '\
                    SELECT \
                        c."id" as "comment.id", \
                        c."updatedAt" as "comment.updatedAt", \
                        r."id" as "report.id", \
                        r."createdAt" as "report.createdAt" \
                    FROM "CommentReports" cr \
                    LEFT JOIN "Reports" r ON (r.id = cr."reportId") \
                    LEFT JOIN "Comments" c ON (c.id = cr."commentId") \
                    WHERE cr."commentId" = :commentId AND cr."reportId" = :reportId \
                    AND c."deletedAt" IS NULL \
                    AND r."deletedAt" IS NULL \
                ;',
                {
                    replacements: {
                        commentId: req.params.commentId,
                        reportId: req.params.reportId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (results) {
                const commentReport = results[0];

                if (!commentReport) {
                    return res.notFound();
                }

                const comment = commentReport.comment;
                const report = commentReport.report;

                // If Comment has been updated since the Report was made, deny moderation cause the text may have changed.
                if (comment.updatedAt.getTime() > report.createdAt.getTime()) {
                    return res.badRequest('Report has become invalid cause comment has been updated after the report', 10);
                }

                return Comment
                    .findOne({
                        where: {
                            id: comment.id
                        },
                        include: [Topic]
                    })
                    .then(function (comment) {
                        const topic = comment.dataValues.Topics[0];
                        delete comment.dataValues.Topics;
                        comment.deletedById = eventTokenData.userId;
                        comment.deletedAt = db.fn('NOW');
                        comment.deletedReasonType = req.body.type;
                        comment.deletedReasonText = req.body.text;
                        comment.deletedByReportId = report.id;

                        return db
                            .transaction(function (t) {
                                return cosActivities
                                    .updateActivity(comment, topic, {
                                        type: 'Moderator',
                                        id: eventTokenData.userId,
                                        ip: req.ip
                                    }, null, req.method + ' ' + req.path, t)
                                    .then(function () {
                                        return Comment
                                            .update(
                                                {
                                                    deletedById: eventTokenData.userId,
                                                    deletedAt: db.fn('NOW'),
                                                    deletedReasonType: req.body.type,
                                                    deletedReasonText: req.body.text,
                                                    deletedByReportId: report.id
                                                },
                                                {
                                                    where: {
                                                        id: comment.id
                                                    },
                                                    returning: true
                                                },
                                                {
                                                    transaction: t
                                                }
                                            )
                                            .then(function ([updated, comment]) { // eslint-disable-line
                                                comment = Comment.build(comment.dataValues);

                                                return cosActivities
                                                    .deleteActivity(comment, topic, {
                                                        type: 'Moderator',
                                                        id: eventTokenData.userId,
                                                        ip: req.ip
                                                    }, req.method + ' ' + req.path, t);
                                            });
                                    });
                            });
                    })
                    .then(function () {
                        return res.ok();
                    });
            })
            .catch(next);
    });

    const topicMentionsList = function (req, res, next) {
        let hashtag = null;
        let queryurl = 'search/tweets';


        if (req.query && req.query.test === 'error') { // For testing purposes
            queryurl = 'serch/tweets';
        }

        db
            .query(
                ' \
                SELECT \
                    t.hashtag \
                FROM "Topics" t \
                WHERE t."id" = :topicId \
                AND t."deletedAt" IS NULL \
                AND t.hashtag IS NOT NULL \
                ',
                {
                    replacements: {
                        topicId: req.params.topicId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (results) {
                if (!results.length) {
                    res.badRequest('Topic has no hashtag defined', 1);

                    return Promise.reject();
                }

                hashtag = results[0].hashtag;

                return hashtagCache.get(hashtag);
            })
            .then(function (mentions) {
                if (!mentions || (mentions.createdAt && (Math.floor(new Date() - new Date(mentions.createdAt)) / (1000 * 60) >= 15))) {

                    return twitter.getAsync(queryurl, {
                        q: '"#' + hashtag + '"',
                        count: 20
                    }).then(function (res) {
                        return [res];
                    });
                } else {
                    logger.info('Serving mentions from cache', req.method, req.path, req.user);

                    return [{cache: mentions}];
                }
            })
            .catch(function (err) {
                if (err.twitterReply) {
                    logger.error('Twitter error', req.method, req.path, req.user, err);

                    return [hashtagCache.get(hashtag)];
                }

                return Promise.reject(err);
            })
            .then(function ([data]) {
                const mentions = [];
                if (data && data.statuses) {
                    logger.info('Twitter response', req.method, req.path, req.user, data.statuses.length);
                    _.forEach(data.statuses, function (m) {
                        let mTimeStamp = moment(m.created_at, 'ddd MMM DD HH:mm:ss ZZ YYYY');
                        mTimeStamp = mTimeStamp.format();

                        const status = {
                            id: m.id,
                            text: encoder.decode(m.text),
                            creator: {
                                name: m.user.name || m.user.screen_name,
                                profileUrl: 'https://twitter.com/' + m.user.screen_name,
                                profilePictureUrl: m.user.profile_image_url_https
                            },
                            createdAt: mTimeStamp,
                            sourceId: 'TWITTER',
                            sourceUrl: 'https://twitter.com/' + m.user.screen_name + '/status/' + m.id
                        };

                        mentions.push(status);
                    });

                    const cachedMentions = {
                        count: mentions.length,
                        rows: mentions,
                        createdAt: moment().format(),
                        hashtag: hashtag
                    };

                    return hashtagCache.set(hashtag, cachedMentions);
                } else if (data && data.cache) {
                    return data.cache;
                } else {
                    res.internalServerError();

                    return Promise.reject();
                }

            })
            .then(function (cachedmentions) {
                return res.ok(cachedmentions);
            })
            .catch(next);
    };


    /**
     * Read (List) Topic Mentions
     */
    app.get('/api/users/:userId/topics/:topicId/mentions', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), topicMentionsList);


    /**
     * Read (List) public Topic Mentions
     */
    app.get('/api/topics/:topicId/mentions', hasVisibility(Topic.VISIBILITY.public), topicMentionsList);

    /*
     * Read (List) Topic Comment votes
     */

    app.get('/api/users/:userId/topics/:topicId/comments/:commentId/votes', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {

        return db
            .query(
                '\
                SELECT \
                    u.name, \
                    u.company, \
                    u."imageUrl", \
                    CAST(CASE \
                        WHEN cv.value=1 Then \'up\' \
                        ELSE \'down\' END \
                    AS VARCHAR(5)) AS vote, \
                    cv."createdAt", \
                    cv."updatedAt" \
                    FROM "CommentVotes" cv \
                    LEFT JOIN "Users" u \
                    ON \
                        u.id = cv."creatorId" \
                    WHERE cv."commentId" = :commentId \
                    AND cv.value <> 0 \
                    ; \
                ',
                {
                    replacements: {
                        commentId: req.params.commentId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                })
                .then(function (results) {
                    return res.ok({rows: results, count: results.length});
                })
                .catch(next);
    });

    /**
     * Create a Comment Vote
     */
    app.post('/api/topics/:topicId/comments/:commentId/votes', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        const value = parseInt(req.body.value, 10);

        Comment
            .findOne({
                where: {
                    id: req.params.commentId
                }
            })
            .then(function (comment) {
                if (!comment) {
                    return comment;
                }

                return db
                    .transaction(function (t) {
                        return CommentVote
                            .findOne({
                                where: {
                                    commentId: req.params.commentId,
                                    creatorId: req.user.id
                                },
                                transaction: t
                            })
                            .then(function (vote) {
                                if (vote) {
                                    //User already voted
                                    if (vote.value === value) { // Same value will 0 the vote...
                                        vote.value = 0;
                                    } else {
                                        vote.value = value;
                                    }
                                    vote.topicId = req.params.topicId;

                                    return cosActivities
                                        .updateActivity(vote, comment, {
                                            type: 'User',
                                            id: req.user.id,
                                            ip: req.ip
                                        }, null, req.method + ' ' + req.path, t)
                                        .then(function () {
                                            return vote.save({transaction: t});
                                        });
                                } else {
                                    //User has not voted...
                                    return CommentVote
                                        .create({
                                            commentId: req.params.commentId,
                                            creatorId: req.user.id,
                                            value: req.body.value
                                        }, {
                                            transaction: t
                                        })
                                        .then(function (cv) {
                                            const c = _.cloneDeep(comment);
                                            c.topicId = req.params.topicId;
                                            return cosActivities
                                                .createActivity(cv, c, {
                                                    type: 'User',
                                                    id: req.user.id,
                                                    ip: req.ip
                                                }, req.method + ' ' + req.path, t);
                                        });
                                }
                            })
                            .catch(next);
                    })
                    .then(function () {
                        return db
                            .query(
                                ' \
                                SELECT \
                                    tc."up.count", \
                                    tc."down.count", \
                                    COALESCE(cvus.selected, false) as "up.selected", \
                                    COALESCE(cvds.selected, false) as "down.selected" \
                                    FROM ( \
                                        SELECT  \
                                            tc."commentId", \
                                            COALESCE(SUM(cvu.value), 0) as "up.count", \
                                            COALESCE(ABS(SUM(cvd.value)), 0) as "down.count" \
                                        FROM "TopicComments" tc \
                                            LEFT JOIN "CommentVotes" cvu ON (tc."commentId" = cvu."commentId" AND cvu.value > 0) \
                                            LEFT JOIN "CommentVotes" cvd ON (tc."commentId" = cvd."commentId" AND cvd.value < 0) \
                                        WHERE tc."topicId" = :topicId \
                                        AND tc."commentId" = :commentId \
                                        GROUP BY tc."commentId" \
                                    ) tc \
                                    LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (tc."commentId" = cvus."commentId") \
                                    LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (tc."commentId" = cvds."commentId") \
                                ',
                                {
                                    replacements: {
                                        topicId: req.params.topicId,
                                        commentId: req.params.commentId,
                                        userId: req.user.id
                                    },
                                    type: db.QueryTypes.SELECT,
                                    raw: true,
                                    nest: true
                                }
                            );
                    });
            })
            .then(function (results) {
                if (!results) {
                    return res.notFound();
                }

                return res.ok(results[0]);
            })
            .catch(next);
    });


    /**
     * Create a Vote
     */
    app.post('/api/users/:userId/topics/:topicId/votes', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.inProgress]), function (req, res, next) {
        const voteOptions = req.body.options;

        if (!voteOptions || !Array.isArray(voteOptions) || voteOptions.length < 2) {
            return res.badRequest('At least 2 vote options are required', 1);
        }

        const authType = req.body.authType || Vote.AUTH_TYPES.soft;
        const delegationIsAllowed = req.body.delegationIsAllowed || false;

        // We cannot allow too similar options, otherwise the options are not distinguishable in the signed file
        if (authType === Vote.AUTH_TYPES.hard) {
            const voteOptionValues = _.map(voteOptions, 'value').map(function (value) {
                return sanitizeFilename(value).toLowerCase();
            });

            const uniqueValues = _.uniq(voteOptionValues);
            if (uniqueValues.length !== voteOptions.length) {
                return res.badRequest('Vote options are too similar', 2);
            }

            const reservedPrefix = VoteOption.RESERVED_PREFIX;
            uniqueValues.forEach(function (value) {
                if (value.substr(0, 2) === reservedPrefix) {
                    return res.badRequest('Vote option not allowed due to usage of reserved prefix "' + reservedPrefix + '"', 4);
                }
            });
        }


        if (authType === Vote.AUTH_TYPES.hard && delegationIsAllowed) {
            return res.badRequest('Delegation is not allowed for authType "' + authType + '"', 3);
        }

        const vote = Vote.build({
            minChoices: req.body.minChoices || 1,
            maxChoices: req.body.maxChoices || 1,
            delegationIsAllowed: req.body.delegationIsAllowed || false,
            endsAt: req.body.endsAt,
            description: req.body.description,
            type: req.body.type || Vote.TYPES.regular,
            authType: authType
        });


        // TODO: Some of these queries can be done in parallel
        return Topic
            .findOne({
                where: {
                    id: req.params.topicId
                }
            })
            .then(function (topic) {
                return db
                    .transaction(function (t) {
                        let voteOptionsCreated;

                        return cosActivities
                            .createActivity(
                                vote,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.id,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            )
                            .then(function () {
                                return vote
                                    .save({transaction: t});
                            })
                            .then(function () {
                                const voteOptionPromises = [];
                                _(voteOptions).forEach(function (o) {
                                    o.voteId = vote.id;
                                    const vopt = VoteOption.build(o);
                                    voteOptionPromises.push(vopt.validate());
                                });

                                return Promise
                                    .all(voteOptionPromises)
                                    .then(function () {
                                        return VoteOption
                                            .bulkCreate(
                                                voteOptions,
                                                {
                                                    fields: ['id', 'voteId', 'value'], // Deny updating other fields like "updatedAt", "createdAt"...
                                                    returning: true,
                                                    transaction: t
                                                }
                                            );
                                    });
                            })
                            .then(function (options) {
                                voteOptionsCreated = options;

                                return cosActivities
                                    .createActivity(
                                        voteOptionsCreated,
                                        null,
                                        {
                                            type: 'User',
                                            id: req.user.id,
                                            ip: req.ip
                                        },
                                        req.method + ' ' + req.path,
                                        t
                                    )
                                    .then(function () {
                                        return TopicVote
                                            .create(
                                                {
                                                    topicId: req.params.topicId,
                                                    voteId: vote.id
                                                },
                                                {transaction: t}
                                            ).then(function () {
                                                return cosActivities
                                                    .createActivity(
                                                        vote,
                                                        topic,
                                                        {
                                                            type: 'User',
                                                            id: req.user.id,
                                                            ip: req.ip
                                                        },
                                                        req.method + ' ' + req.path,
                                                        t
                                                    );
                                            });
                                    });
                            })
                            .then(function () {
                                topic.status = Topic.STATUSES.voting;

                                return cosActivities
                                    .updateActivity(topic, null, {
                                        type: 'User',
                                        id: req.user.id,
                                        ip: req.ip
                                    }, null, req.method + ' ' + req.path, t)
                                    .then(function () {
                                        return topic
                                            .save({
                                                returning: true,
                                                transaction: t
                                            });
                                    });

                            })
                            .then(function (topic) {
                                vote.dataValues.VoteOptions = [];
                                voteOptionsCreated.forEach(function (option) {
                                    vote.dataValues.VoteOptions.push(option.dataValues);
                                });

                                return cosSignature.createVoteFiles(topic, vote, voteOptionsCreated, t);
                            });
                    });
            })
            .then(function () {
                return res.created(vote.toJSON());
            })
            .catch(next);
    });


    /**
     * Read a Vote
     */
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;
        const userId = req.user.id;
        try {
            const voteInfo = await Vote
                .findOne({
                    where: {id: voteId},
                    include: [
                        {
                            model: Topic,
                            where: {id: topicId}
                        },
                        VoteOption,
                        {
                            model: VoteDelegation,
                            where: {
                                voteId: voteId,
                                byUserId: userId
                            },
                            attributes: ['id'],
                            required: false,
                            include: [
                                {
                                    model: User
                                }
                            ]
                        }
                    ]
                });

            const voteResults = await db
                .query(`
                    WITH
                    RECURSIVE delegations("voteId", "toUserId", "byUserId", depth) AS (
                        SELECT
                                "voteId",
                                "toUserId",
                                "byUserId",
                                    1
                                FROM "VoteDelegations" vd
                                WHERE vd."voteId" = :voteId
                                    AND vd."deletedAt" IS NULL

                                UNION ALL

                                SELECT
                                    vd."voteId",
                                    vd."toUserId",
                                    dc."byUserId",
                                    dc.depth+1
                                FROM delegations dc, "VoteDelegations" vd
                                WHERE vd."byUserId" = dc."toUserId"
                                    AND vd."voteId" = dc."voteId"
                                    AND vd."deletedAt" IS NULL
                            ),
                            indirect_delegations("voteId", "toUserId", "byUserId", depth) AS (
                                SELECT DISTINCT ON("byUserId")
                                    "voteId",
                                    "toUserId",
                                    "byUserId",
                                    depth
                                FROM delegations
                                ORDER BY "byUserId", depth DESC
                            ),
                            vote_groups("voteId", "userId", "optionGroupId", "updatedAt") AS (
                                SELECT DISTINCT ON (vl."userId") vl."voteId", vl."userId", vli."optionGroupId", vl."updatedAt"
                                FROM (
                                    SELECT DISTINCT ON (vl."userId", MAX(vl."updatedAt"))
                                    vl."userId",
                                    vl."voteId",
                                    MAX(vl."updatedAt") as "updatedAt"
                                    FROM "VoteLists" vl
                                    WHERE vl."voteId" = :voteId
                                    AND vl."deletedAt" IS NULL
                                    GROUP BY vl."userId", vl."voteId"
                                    ORDER BY MAX(vl."updatedAt") DESC
                                ) vl
                                JOIN "VoteLists" vli
                                ON
                                    vli."userId" = vl."userId"
                                    AND vl."voteId" = vli."voteId"
                                    AND vli."updatedAt" = vl."updatedAt"
                                WHERE vl."voteId" = :voteId
                                    AND vl."userId" NOT IN
                                    (
                                        SELECT DISTINCT
                                            uc."connectedUser"
                                        FROM (
                                            SELECT
                                                vl."userId",
                                                vl."updatedAt"
                                            FROM "VoteLists" vl
                                            WHERE vl."voteId" = :voteId
                                            AND vl."deletedAt" IS NULL
                                            ORDER BY vl."updatedAt" DESC
                                        ) vl
                                        JOIN
                                        (
                                            SELECT
                                                uc."userId",
                                                uci."userId" as "connectedUser",
                                                uc."connectionId",
                                                uc."connectionUserId"
                                            FROM "UserConnections" uc
                                            JOIN "UserConnections" uci
                                                ON uc."connectionId" = uci."connectionId"
                                                AND uc."connectionUserId" = uci."connectionUserId"
                                                AND uc."userId" <> uci."userId"
                                        ) uc ON uc."userId" = vl."userId"
                                        JOIN (
                                            SELECT
                                                vl."userId",
                                                vl."updatedAt"
                                                FROM "VoteLists" vl
                                                WHERE vl."voteId" = :voteId
                                                    AND vl."deletedAt" IS NULL
                                                ORDER BY vl."updatedAt" DESC
                                        ) vli ON uc."connectedUser" = vli."userId" AND vli."updatedAt" < vl."updatedAt"
                                    )
                            ),
                            votes("voteId", "userId", "optionId", "optionGroupId") AS (
                                SELECT
                                    vl."voteId",
                                    vl."userId",
                                    vl."optionId",
                                    vl."optionGroupId"
                                FROM "VoteLists" vl
                                JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."optionGroupId" = vg."optionGroupId")
                                WHERE vl."voteId" =  :voteId
                            ),
                            votes_with_delegations("voteId", "userId", "optionId", "optionGroupId", depth) AS (
                                SELECT
                                    v."voteId",
                                    v."userId",
                                    v."optionId",
                                    v."optionGroupId",
                                    id."depth"
                                FROM votes v
                                LEFT JOIN indirect_delegations id ON (v."userId" = id."toUserId")
                                WHERE v."userId" NOT IN (SELECT "byUserId" FROM indirect_delegations WHERE "voteId"=v."voteId")
                            )

                        SELECT
                            SUM(v."voteCount") as "voteCount",
                            v."optionId",
                            v."voteId",
                            vo."value",
                            (SELECT true FROM votes WHERE "userId" = :userId AND "optionId" = v."optionId") as "selected"
                        FROM (
                            SELECT
                                COUNT(v."optionId") + 1 as "voteCount",
                                v."optionId",
                                v."optionGroupId",
                                v."voteId"
                            FROM votes_with_delegations v
                            WHERE v.depth IS NOT NULL
                            GROUP BY v."optionId", v."optionGroupId", v."voteId"

                            UNION ALL

                            SELECT
                                COUNT(v."optionId") as "voteCount",
                                v."optionId",
                                v."optionGroupId",
                                v."voteId"
                            FROM votes_with_delegations v
                            WHERE v.depth IS NULL
                            GROUP BY v."optionId", v."optionGroupId", v."voteId"
                        ) v
                        LEFT JOIN "VoteOptions" vo ON (v."optionId" = vo."id")
                        GROUP BY v."optionId", v."voteId", vo."value"
                ;`,
                    {
                        replacements: {
                            voteId: voteId,
                            userId: userId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true
                    }
                );
            if (!voteInfo) {
                return res.notFound();
            }

            let hasVoted = false;
            if (voteResults) {
                voteInfo.dataValues.VoteOptions.forEach(function (option) {
                    const result = _.find(voteResults, {optionId: option.id});

                    if (result) {
                        option.dataValues.voteCount = parseInt(result.voteCount, 10); //TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                        if (result.selected) {
                            option.dataValues.selected = result.selected; //TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                            hasVoted = true;
                        }
                    }
                });
            }

            // TODO: Contains duplicate code with GET /status AND /sign
            if (hasVoted && voteInfo.authType === Vote.AUTH_TYPES.hard) {
                voteInfo.dataValues.downloads = {
                    bdocVote: getBdocURL({
                        userId: userId,
                        topicId: topicId,
                        voteId: voteId,
                        type: 'user'
                    })
                };
            }

            if (req.locals.topic.permissions.level === TopicMemberUser.LEVELS.admin && [Topic.STATUSES.followUp, Topic.STATUSES.closed].indexOf(req.locals.topic.status) > -1) {
                if (!voteInfo.dataValues.downloads) {
                    voteInfo.dataValues.downloads = {};
                }
                const voteFinalURLParams = {
                    userId: userId,
                    topicId: topicId,
                    voteId: voteId,
                    type: 'final'
                };
                if (voteInfo.authType === Vote.AUTH_TYPES.hard) {
                    voteInfo.dataValues.downloads.bdocFinal = getBdocURL(voteFinalURLParams);
                } else {
                    voteInfo.dataValues.downloads.zipFinal = getZipURL(voteFinalURLParams);
                }
            }

            return res.ok(voteInfo);
        } catch(e) {
            return next(e);
        }
    });

    /**
     * Update a Vote
     */
    app.put('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        // Make sure the Vote is actually related to the Topic through which the permission was granted.
        const fields = ['endsAt'];

        Topic
            .findOne({
                where: {
                    id: topicId
                },
                include: [
                    {
                        model: Vote,
                        where: {
                            id: voteId
                        }
                    }
                ]
            })
            .then(function (topic) {
                if (!topic || !topic.Votes || !topic.Votes.length) {
                    res.notFound();

                    return Promise.reject();
                }

                const vote = topic.Votes[0];

                return db.transaction(function (t) {
                    fields.forEach(function (field) {
                        vote[field] = req.body[field];
                    });

                    return cosActivities
                        .updateActivity(
                            vote,
                            topic,
                            {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            },
                            null,
                            req.method + ' ' + req.path,
                            t
                        )
                        .then(function () {
                            return vote
                                .save({
                                    transaction: t
                                });
                        });

                });
            })
            .then(function (vote) {
                return res.ok(vote.toJSON());
            })
            .catch(next);
    });

    /**
     * Read a public Topics Vote
     */
    app.get('/api/topics/:topicId/votes/:voteId', hasVisibility(Topic.VISIBILITY.public), function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        // TODO: Can be done in 1 query.
        const voteInfoPromise = Vote
            .findOne({
                where: {id: voteId},
                include: [
                    {
                        model: Topic,
                        where: {id: topicId}
                    },
                    VoteOption
                ]
            });

        const voteResultsPromise = getVoteResults(voteId);

        Promise
            .all([voteInfoPromise, voteResultsPromise])
            .then(function ([voteInfo, voteResults]) {
                if (!voteInfo) {
                    return res.notFound();
                }

                if (voteResults) {
                    _(voteInfo.dataValues.VoteOptions).forEach(function (option) {
                        const result = _.find(voteResults, {optionId: option.id});
                        if (result) {
                            option.dataValues.voteCount = parseInt(result.voteCount, 10); //TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                            if (result.selected) {
                                option.dataValues.selected = result.selected; //TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                            }
                        }
                    });
                }

                return res.ok(voteInfo);
            })
            .catch(next);
    });

    const handleTopicVotePreconditions = async function (req, res) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        let voteOptions = req.body.options;
        let isSingelOption = false;

       const vote = await Vote
            .findOne({
                where: {id: voteId},
                include: [
                    {
                        model: Topic,
                        where: {id: topicId}
                    },
                    {
                        model: VoteOption,
                        where: {id: _.map(voteOptions, 'optionId')},
                        required: false
                    }
                ]
            });

        if (!vote) {
            res.notFound();

            return Promise.reject();
        }

        if (vote.endsAt && new Date() > vote.endsAt) {
            res.badRequest('The Vote has ended.');

            return Promise.reject();
        }

        const singleOptions = _.filter(vote.VoteOptions, function (option) {
            const optVal = option.value.toLowerCase();

            return optVal === 'neutral' || optVal === 'veto';
        });
        if (singleOptions.length) {
            for(let i=0; i<voteOptions.length; i++) {
                const isOption = _.find(singleOptions, function (opt) {
                    return opt.id === voteOptions[i].optionId;
                });

                if (isOption) {
                    isSingelOption = true;
                    req.body.options = [{optionId: isOption.id}];
                }
            }
        }

        if (!isSingelOption && (!voteOptions || !Array.isArray(voteOptions) || voteOptions.length > vote.maxChoices || voteOptions.length < vote.minChoices)) {
            res.badRequest('The options must be an array of minimum :minChoices and maximum :maxChoices options.'
                .replace(':minChoices', vote.minChoices)
                .replace(':maxChoices', vote.maxChoices));

            return Promise.reject();
        }

        return vote;
    };

    const handleTopicVoteSoft = function (vote, req, res) {
        const voteId = vote.id;
        const userId = req.user.id;
        const topicId = req.params.topicId;

        const voteOptions = req.body.options;
        const target = vote.toJSON();
        target['@type'] = 'Vote';

        return db
            .transaction(function (t) {
                // Store vote options
                const optionGroupId = Math.random().toString(36).substring(2, 10);

                _(voteOptions).forEach(function (o) {
                    o.voteId = voteId;
                    o.userId = userId;
                    o.optionGroupId = optionGroupId;
                });

                const voteListCreatePromise = VoteList
                    .bulkCreate(
                        voteOptions,
                        {
                            fields: ['optionId', 'voteId', 'userId', 'optionGroupId'],
                            transaction: t
                        }
                    )
                    .then(function (voteList) {
                        return Topic
                            .findOne({
                                where: {
                                    id: topicId
                                },
                                transaction: t
                            })
                            .then(function (topic) {
                                const vl = [];
                                let tc = _.cloneDeep(topic.dataValues);
                                tc.description = null;
                                tc = Topic.build(tc);

                                voteList.forEach(function (el, key) {
                                    delete el.dataValues.optionId;
                                    delete el.dataValues.optionGroupId;
                                    el = VoteList.build(el.dataValues);
                                    vl[key] = el;
                                });

                                return cosActivities
                                    .createActivity(
                                        vl,
                                        tc,
                                        {
                                            type: 'User',
                                            id: req.user.id,
                                            ip: req.ip
                                        },
                                        req.method + ' ' + req.path,
                                        t
                                    )
                                    .then(function () {
                                        return voteList;
                                    });
                            });


                    });

                // Delete delegation if you are voting
                const voteDelegationDestroyPromise = VoteDelegation
                    .destroy({
                        where: {
                            voteId: voteId,
                            byUserId: userId
                        },
                        force: true,
                        transaction: t
                    });

                return Promise.join(voteListCreatePromise, voteDelegationDestroyPromise);
            })
            .then(function () {
                return res.ok();
            });
    };

    const _checkAuthenticatedUser = async function (userId, personalInfo, transaction) {
        const userConnection = await UserConnection.findOne({
            where: {
                connectionId: {
                    [Op.in]: [
                        UserConnection.CONNECTION_IDS.esteid,
                        UserConnection.CONNECTION_IDS.smartid
                    ]
                },
                userId: userId
            },
            transaction
        });

        if (userConnection) {
            let personId = personalInfo.pid;
            let connectionUserId = userConnection.connectionUserId;
            if (personalInfo.pid.indexOf('PNO') > -1) {
                personId = personId.split('-')[1];
            }
            const country = (personalInfo.country || personalInfo.countryCode);
            const idPattern = `PNO${country}-${personId}`;
            if (connectionUserId.indexOf('PNO') > -1) {
                connectionUserId = connectionUserId.split('-')[1];
            }
            if (!userConnection.connectionData || (userConnection.connectionData.country || userConnection.connectionData.countryCode)) {
                if (userConnection.connectionUserId !== idPattern) {
                    throw new Error('User account already connected to another PID.');
                }
            }
            const conCountry = (userConnection.connectionData.country || userConnection.connectionData.countryCode)
            const connectionUserPattern = `PNO${conCountry}-${connectionUserId}`;
            if (connectionUserPattern !== idPattern) {
                throw new Error('User account already connected to another PID.');
            }
        }
    };

    const handleTopicVoteHard = async function (vote, req, res) {
        try {
            const voteId = vote.id;
            let userId = req.user ? req.user.id : null;

            //idCard
            const certificate = req.body.certificate;
            //mID
            const pid = req.body.pid;
            const phoneNumber = req.body.phoneNumber;
            //smart-ID
            const countryCode = req.body.countryCode;
            let personalInfo;
            let signingMethod;

            if (!certificate && !(pid && (phoneNumber || countryCode))) {
                return res.badRequest('Vote with hard authentication requires users certificate when signing with ID card OR phoneNumber+pid when signing with mID', 9);
            }
            let certificateInfo;
            let smartIdcertificate;
            let mobileIdCertificate;
            let certFormat = 'base64'
            if (pid && countryCode) {
                signingMethod = Vote.SIGNING_METHODS.smartId;
                smartIdcertificate = await smartId.getUserCertificate(pid, countryCode);
                certificateInfo = {
                    certificate: smartIdcertificate,
                    format: 'pem'
                };
            } else if (certificate) {
                signingMethod = Vote.SIGNING_METHODS.idCard;
                await mobileId.validateCert(certificate, 'hex');
                certificateInfo = {
                    certificate: certificate,
                    format: 'der'
                }
                certFormat = 'hex';
            } else {
                signingMethod = Vote.SIGNING_METHODS.mid;
                mobileIdCertificate = await mobileId.getUserCertificate(pid, phoneNumber);
                certificateInfo = {
                    certificate: mobileIdCertificate,
                    format: 'pem'
                };
            }
            if (signingMethod === Vote.SIGNING_METHODS.smartId) {
                personalInfo = await smartId.getCertUserData(certificateInfo.certificate);
                if (personalInfo.pid.indexOf(pid) - 1) {
                    personalInfo.pid = pid;
                }
            } else {
                personalInfo = await mobileId.getCertUserData(certificateInfo.certificate, certFormat);
                if (signingMethod === Vote.SIGNING_METHODS.mid) {
                    personalInfo.phoneNumber = phoneNumber;
                }
            }
            let signInitResponse, token, sessionDataEncrypted;
            await db.transaction(async function (t) { // One big transaction, we don't want created User data to lay around in DB if the process failed.
                // Authenticated User
                if (userId) {
                    await _checkAuthenticatedUser(userId, personalInfo, t);
                } else { // Un-authenticated User, find or create one.
                    const user = (await authUser.getUserByPersonalId(personalInfo, UserConnection.CONNECTION_IDS.esteid, req, t))[0];
                    userId = user.id;
                }

                switch (signingMethod) {
                    case Vote.SIGNING_METHODS.idCard:
                        signInitResponse = await cosSignature.signInitIdCard(voteId, userId, vote.VoteOptions, certificate, t);
                        break;
                    case Vote.SIGNING_METHODS.smartId:
                        signInitResponse = await cosSignature.signInitSmartId(voteId, userId, vote.VoteOptions, personalInfo.pid, countryCode, smartIdcertificate, t);
                        break;
                    case Vote.SIGNING_METHODS.mid:
                        signInitResponse = await cosSignature.signInitMobile(voteId, userId, vote.VoteOptions, personalInfo.pid, personalInfo.phoneNumber, mobileIdCertificate, t);
                        break;
                    default:
                        throw new Error('Invalid signing method ' + signingMethod);
                }
            });
                        // Check that the personal ID is not related to another User account. We don't want Users signing Votes from different accounts.

            let sessionData = {
                voteOptions: vote.VoteOptions,
                signingMethod,
                userId: userId, // Required for un-authenticated signing.
                voteId: voteId // saves one run of "handleTopicVotePreconditions" in the /sign
            }

            if (signInitResponse.sessionId) {
                sessionData.sessionId = signInitResponse.sessionId,
                sessionData.sessionHash = signInitResponse.sessionHash,
                sessionData.personalInfo = signInitResponse.personalInfo,
                sessionData.signatureId = signInitResponse.signatureId;
            } else {
                switch (signInitResponse.statusCode) {
                    case 0:
                        // Common to MID and ID-card signing
                        sessionData.personalInfo = personalInfo;
                        sessionData.signableHash = signInitResponse.signableHash;
                        sessionData.signatureId = signInitResponse.signatureId;
                        break;
                    case 101:
                        return res.badRequest('Invalid input parameters.', 20);
                    case 301:
                        return res.badRequest('User is not a Mobile-ID client. Please double check phone number and/or id code.', 21);
                    case 302:
                        return res.badRequest('User certificates are revoked or suspended.', 22);
                    case 303:
                        return res.badRequest('User certificate is not activated.', 23);
                    case 304:
                        return res.badRequest('User certificate is suspended.', 24);
                    case 305:
                        return res.badRequest('User certificate is expired.', 25);
                    default:
                        logger.error('Unhandled DDS status code', signInitResponse.statusCode);
                        return res.internalServerError();
                }
            }

            // Send JWT with state and expect it back in /sign /status - https://trello.com/c/ZDN2WomW/287-bug-id-card-signing-does-not-work-for-some-users
            // Wrapping sessionDataEncrypted in object, otherwise jwt.sign "expiresIn" will not work - https://github.com/auth0/node-jsonwebtoken/issues/166
            sessionDataEncrypted = {sessionDataEncrypted: objectEncrypter(config.session.secret).encrypt(sessionData)};
            token = jwt.sign(sessionDataEncrypted, config.session.privateKey, {
                expiresIn: '5m',
                algorithm: config.session.algorithm
            });

            if (signingMethod === Vote.SIGNING_METHODS.idCard) {
                return res.ok({
                    signedInfoDigest: signInitResponse.signableHash,
                    signedInfoHashType: cryptoLib.getHashType(signInitResponse.signableHash),
                    token: token
                }, 1);
            } else {
                return res.ok({
                    challengeID: signInitResponse.challengeID,
                    token: token
                }, 1);
            }

        } catch(error) {
            switch (error.message) {
                case 'Personal ID already connected to another user account.':
                    return res.badRequest(error.message, 30)
                case 'User account already connected to another PID.':
                    return res.badRequest(error.message, 31);
                case 'Invalid signature':
                    return res.badRequest(error.message, 32);
                case 'Invalid certificate issuer':
                    return res.badRequest(error.message, 33);
                case 'Certificate not active':
                    return res.badRequest(error.message, 34);
                case 'phoneNumber must contain of + and numbers(8-30)':
                    return res.badRequest(error.message, 21);
                case 'nationalIdentityNumber must contain of 11 digits':
                    return res.badRequest(error.message, 22);
                case 'Bad Request':
                    return res.badRequest();
                case 'Not Found':
                    return res.notFound();
            }

            throw error;
        }
    };

    /**
     * Vote
     *
     * IF Vote authType===hard then starts Vote signing process. Vote won't be counted before signing is finalized by calling POST /api/users/:userId/topics/:topicId/votes/:voteId/sign or Mobiil-ID signing is completed (GET /api/users/:userId/topics/:topicId/votes/:voteId/status)
     *
     * TODO: Should simplify all of this routes code. It's a mess cause I decided to keep one endpoint for all of the voting. Maybe it's a better idea to move authType===hard to separate endpont
     * TODO: create an alias /api/topics/:topicId/votes/:voteId for un-authenticated signing? I's weird to call /users/self when user has not logged in...
     */
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.voting]), function (req, res, next) {
        handleTopicVotePreconditions(req, res)
            .then(function (vote) {
                if (vote.authType === Vote.AUTH_TYPES.soft) {
                    return handleTopicVoteSoft(vote, req, res);
                } else {
                    return handleTopicVoteHard(vote, req, res);
                }
            })
            .catch(function (err) {
                if (err) {
                    return next(err);
                }
                // Ignore, headers are supposed to be sent before, not sure it's the right way to do things tho. I guess we should reject Promise with some error which then convertss to HTTP response?
            });
    });


    const handleTopicVoteSign = async function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        const token = req.body.token;
        const signatureValue = req.body.signatureValue;

        if (!token) {
            logger.warn('Missing requried parameter "token"', req.ip, req.path, req.headers);

            return res.badRequest('Missing required parameter "token"');
        }

        if (!signatureValue) {
            return res.badRequest('Missing signature', 1);
        }

        let tokenData;
        let idSignFlowData;

        try {
            tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
            idSignFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                return res.unauthorised('JWT token has expired');
            } else {
                logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                return res.unauthorised('Invalid JWT token');
            }
        }

        const userId = req.user ? req.user.id : idSignFlowData.userId; // Auth has User in session, but un-authenticated in idSignFlowData

        // POST /votes/:voteId checks that Vote belongs to Topic using "handleTopicVotePreconditions". It sets it in the sign flow data so we would not have to call "handleTopicVotePreconditions" again.
        if (voteId !== idSignFlowData.voteId) {
            logger.warn('Invalid token provider for vote.', voteId, idSignFlowData.voteId);

            return res.badRequest('Invalid token for the vote');
        }

        try {
            await db.transaction(async function (t) {
                // Store vote options
                const voteOptions = idSignFlowData.voteOptions;

                const optionGroupId = Math.random().toString(36).substring(2, 10);

                _(voteOptions).forEach(function (o) {
                    o.voteId = voteId;
                    o.userId = userId;
                    o.optionGroupId = optionGroupId;
                    o.optionId = o.optionId || o.id;
                });

                if (req.user) {
                    await _checkAuthenticatedUser(userId, idSignFlowData.personalInfo, t);
                }

                const voteList = await VoteList
                    .bulkCreate(
                        voteOptions,
                        {
                            fields: ['optionId', 'voteId', 'userId', 'optionGroupId'],
                            transaction: t
                        }
                    );
                const topic = await Topic.findOne({
                    where: {
                        id: topicId
                    },
                    transaction: t
                });
                const vl = [];
                let tc = _.cloneDeep(topic.dataValues);
                tc.description = null;
                tc = Topic.build(tc);

                voteList.forEach(function (el, key) {
                    delete el.dataValues.optionId;
                    delete el.dataValues.optionGroupId;
                    el = VoteList.build(el.dataValues);
                    vl[key] = el;
                });

                const actor = {
                    type: 'User',
                    ip: req.ip
                };
                if (userId) {
                    actor.id = userId;
                }

                await cosActivities.createActivity(vl, tc, actor, req.method + ' ' + req.path, t);

                // Delete delegation if you are voting - TODO: why is this here? You cannot delegate when authType === 'hard'
                await VoteDelegation
                    .destroy({
                        where: {
                            voteId: voteId,
                            byUserId: userId
                        },
                        force: true,
                        transaction: t
                    });

                let connectionUserId = idSignFlowData.personalInfo.pid;
                if (connectionUserId.indexOf('PNO') === -1) {
                    const country = (idSignFlowData.personalInfo.country || idSignFlowData.personalInfo.countryCode);
                    connectionUserId = `PNO${country}-${connectionUserId}`;
                }

                await UserConnection.upsert(
                    {
                        userId: userId,
                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                        connectionUserId,
                        connectionData: idSignFlowData.personalInfo
                    },
                    {
                        transaction: t
                    }
                );

                const optionIds = voteOptions.map(function (elem) {
                    return elem.optionId
                });

                const voteOptionsResult = await VoteOption.findAll({
                    where: {
                        id: optionIds,
                        voteId: voteId
                    }
                });
                const signedDocument = await cosSignature.signUserBdoc(
                    idSignFlowData.voteId,
                    idSignFlowData.userId,
                    voteOptionsResult,
                    idSignFlowData.signableHash,
                    idSignFlowData.signatureId,
                    Buffer.from(signatureValue,'hex').toString('base64')
                );
                await VoteUserContainer.upsert(
                    {
                        userId: userId,
                        voteId: voteId,
                        container: signedDocument.signedDocData
                    },
                    {
                        transaction: t
                    }
                );
            });

            return res.ok({
                bdocUri: getBdocURL({
                    userId: userId,
                    topicId: topicId,
                    voteId: voteId,
                    type: 'user'
                })
            });
        } catch(e) {
            switch (e.message) {
                case 'Personal ID already connected to another user account.':
                    return res.badRequest(e.message, 30)
                case 'User account already connected to another PID.':
                    return res.badRequest(e.message, 31);
            }
            return next(e);
        }
    };

    /**
     * Sign a Vote
     *
     * Complete the ID-card signing flow started by calling POST /api/users/:userId/topics/:topicId/votes/:voteId
     */
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId/sign', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.voting]), handleTopicVoteSign);


    const handleTopicVoteStatus = async function (req, res) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        const token = req.query.token;
        const timeoutMs = req.query.timeoutMs || 5000;

        if (!token) {
            logger.warn('Missing requried parameter "token"', req.ip, req.path, req.headers);

            return res.badRequest('Missing required parameter "token"');
        }

        let tokenData;
        let idSignFlowData;

        try {
            tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
            idSignFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                return res.unauthorised('JWT token has expired');
            } else {
                logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                return res.unauthorised('Invalid JWT token');
            }
        }

        const userId = req.user ? req.user.id : idSignFlowData.userId;

        try {
            let signedDocInfo;
            if (idSignFlowData.signingMethod === Vote.SIGNING_METHODS.smartId) {
                signedDocInfo = await cosSignature.getSmartIdSignedDoc(idSignFlowData.sessionId, idSignFlowData.sessionHash, idSignFlowData.signatureId, idSignFlowData.voteId, idSignFlowData.userId, idSignFlowData.voteOptions, timeoutMs);
            } else {
                signedDocInfo = await cosSignature.getMobileIdSignedDoc(idSignFlowData.sessionId, idSignFlowData.sessionHash, idSignFlowData.signatureId, idSignFlowData.voteId, idSignFlowData.userId, idSignFlowData.voteOptions, timeoutMs);
            }

            await db.transaction(async function (t) {
                // Store vote options
                const voteOptions = idSignFlowData.voteOptions;
                const optionGroupId = Math.random().toString(36).substring(2, 10);

                _(voteOptions).forEach(function (o) {
                    if (!o.optionId && o.id) {
                        o.optionId = o.id;
                    }
                    o.voteId = voteId;
                    o.userId = userId;
                    o.optionGroupId = optionGroupId;
                });

                // Authenticated User signing, check the user connection
                if (req.user) {
                    await _checkAuthenticatedUser(userId, idSignFlowData.personalInfo, t)
                }

                const voteList = await VoteList
                            .bulkCreate(
                                voteOptions,
                                {
                                    fields: ['optionId', 'voteId', 'userId', 'optionGroupId'],
                                    transaction: t
                                }
                            );
                const topic = await Topic.findOne({
                    where: {
                        id: topicId
                    },
                    transaction: t
                });
                const vl = [];
                let tc = _.cloneDeep(topic.dataValues);
                tc.description = null;
                tc = Topic.build(tc);

                voteList.forEach(function (el, key) {
                    delete el.dataValues.optionId;
                    delete el.dataValues.optionGroupId;
                    el = VoteList.build(el.dataValues);
                    vl[key] = el;
                });
                const actor = {
                    type: 'User',
                    ip: req.ip
                };
                if (userId) {
                    actor.id = userId;
                }

                await cosActivities.createActivity(vl, tc, actor, req.method + ' ' + req.path, t);

                let connectionUserId = idSignFlowData.personalInfo.pid;
                if (connectionUserId.indexOf('PNO') === -1) {
                    const country = (idSignFlowData.personalInfo.country || idSignFlowData.personalInfo.countryCode);
                    connectionUserId = `PNO${country}-${connectionUserId}`;
                }

                await UserConnection.upsert(
                    {
                        userId: userId,
                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                        connectionUserId,
                        connectionData: idSignFlowData.personalInfo // When starting signing with Mobile-ID we have no full name, thus we need to fetch and update
                    },
                    {
                        transaction: t
                    }
                );
                // Delete delegation if you are voting - TODO: why is this here? You cannot delegate for authType === 'hard' anyway
                await VoteDelegation.destroy({
                    where: {
                        voteId: voteId,
                        byUserId: userId
                    },
                    force: true,
                    transaction: t
                });

                await VoteUserContainer.upsert(
                    {
                        userId: userId,
                        voteId: voteId,
                        container: signedDocInfo.signedDocData
                    },
                    {
                        transaction: t,
                        logging: false
                    }
                );

                if (!req.user) {
                    // When starting signing with Mobile-ID we have no full name, thus we need to fetch and update
                    await User
                        .update(
                            {
                                name: db.fn('initcap', idSignFlowData.personalInfo.firstName + ' ' + idSignFlowData.personalInfo.lastName)
                            },
                            {
                                where: {
                                    id: userId,
                                    name: null
                                },
                                limit: 1, // SAFETY
                                transaction: t
                            }
                        );
                }
            });

            return res.ok(
                'Signing has been completed',
                2,
                {
                    bdocUri: getBdocURL({
                        userId: userId,
                        topicId: topicId,
                        voteId: voteId,
                        type: 'user'
                    })
                }
            );
        } catch (err) {
            let statusCode;
            if (err.result && err.result.endResult) {
                statusCode = err.result.endResult;
            } else if (err.result && !err.result.endResult) {
                statusCode = err.result;
            } else {
                statusCode = err.state;
            }
            switch (err.message) {
                case 'Personal ID already connected to another user account.':
                    return res.badRequest(err.message, 30);
                case 'User account already connected to another PID.':
                    return res.badRequest(err.message, 31);
            }
            switch (statusCode) {
                case 'RUNNING':
                    return res.ok('Signing in progress', 1);
                case 'USER_CANCELLED':
                    return res.badRequest('User has cancelled the signing process', 10);
                case 'USER_REFUSED':
                    return res.badRequest('User has cancelled the signing process', 10);
                case 'SIGNATURE_HASH_MISMATCH':
                    return res.badRequest('Signature is not valid', 12);
                case 'NOT_MID_CLIENT':
                    return res.badRequest('Mobile-ID functionality of the phone is not yet ready', 13);
                case 'PHONE_ABSENT':
                    return res.badRequest('Delivery of the message was not successful, mobile phone is probably switched off or out of coverage;', 14);
                case 'DELIVERY_ERROR':
                    return res.badRequest('Other error when sending message (phone is incapable of receiving the message, error in messaging server etc.)', 15);
                case 'SIM_ERROR':
                    return res.badRequest('SIM application error.', 16);
                case 'TIMEOUT':
                    logger.error('There was a timeout, i.e. end user did not confirm or refuse the operation within maximum time frame allowed (can change, around two minutes).', statusCode);
                    return res.badRequest('There was a timeout, i.e. end user did not confirm or refuse the operation within maximum time frame allowed (can change, around two minutes).', 10);
                default:
                    logger.error('Unknown status code when trying to sign with mobile', statusCode, err);
                    return res.internalServerError();
            }
        }
    };

    /**
     * Get Vote signing status
     *
     * Initially designed only for Mobile-ID signing. The signing is to be started by calling POST /api/users/:userId/topics/:topicId/votes/:voteId.
     */
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId/status', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.voting]), handleTopicVoteStatus);


    /**
     * Vote (Un-authenticated)
     *
     * Un-authenticated, which means only authType===hard is supported.
     * Vote authType===hard then starts Vote signing process. Vote won't be counted before signing is finalized by calling POST /api/topics/:topicId/votes/:voteId/sign or Mobiil-ID signing is completed (GET /api/topics/:topicId/votes/:voteId/status)
     */
    app.post('/api/topics/:topicId/votes/:voteId', function (req, res, next) {
        handleTopicVotePreconditions(req, res)
            .then(function (vote) {
                // Deny calling for non-public Topics
                if (vote.Topics[0].visibility !== Topic.VISIBILITY.public) {
                    res.unauthorised();

                    return Promise.reject();
                }

                if (vote.authType === Vote.AUTH_TYPES.soft) {
                    logger.warn('Un-authenticated Voting is not supported for Votes with authType === soft.');
                    res.badRequest('Un-authenticated Voting is not supported for Votes with authType === soft.');

                    return Promise.reject();
                } else {
                    return handleTopicVoteHard(vote, req, res);
                }
            })
            .catch(next);
    });


    /**
     * Sign a Vote (Un-authenticated).
     *
     * Complete the ID-card signing flow started by calling POST /api/topics/:topicId/votes/:voteId
     *
     * NOTE: NO authorization checks as there are checks on the init (POST /api/topics/:topicId/votes/:voteId) and you cannot have required data for this endpoint without calling the init.
     */
    app.post('/api/topics/:topicId/votes/:voteId/sign', handleTopicVoteSign);


    /**
     * Get Vote signing status (Un-authenticated)
     *
     * Initially designed only for Mobile-ID signing. The signing is to be started by calling POST /api/topics/:topicId/votes/:voteId.
     *
     * NOTE: NO authorization checks as there are checks on the init (POST /api/topics/:topicId/votes/:voteId) and you cannot have required data for this endpoint without calling the init.
     */
    app.get('/api/topics/:topicId/votes/:voteId/status', handleTopicVoteStatus);


    /**
     * Download Users vote BDOC container
     *
     * TODO: Deprecate /api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/user
     */
    app.get(['/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/user', '/api/topics/:topicId/votes/:voteId/downloads/bdocs/user'], authTokenRestrictedUse, function (req, res, next) {
        const voteId = req.params.voteId;
        const downloadTokenData = req.locals.tokenDecoded;
        const userId = downloadTokenData.userId;

        //TODO: Make use of streaming once Sequelize supports it - https://github.com/sequelize/sequelize/issues/2454
        VoteUserContainer
            .findOne({
                where: {
                    userId: userId,
                    voteId: voteId
                }
            })
            .then(function (voteUserContainer) {
                if (!voteUserContainer) {
                    res.notFound();

                    return Promise.reject();
                }

                const container = voteUserContainer.dataValues.container;

                res.set('Content-disposition', 'attachment; filename=vote.bdoc');
                res.set('Content-type', 'application/vnd.etsi.asic-e+zip');
                res.send(container);
            })
            .catch(next);
    });

    const topicDownloadBdocFinal = async function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;
        const include = req.query.include;
        let finalDocStream;
        try {
            const topic = await Topic
                .findOne({
                    where: {
                        id: topicId
                    },
                    include: [
                        {
                            model: Vote,
                            where: {
                                id: voteId,
                                authType: Vote.AUTH_TYPES.hard
                            }
                        }
                    ]
                });
            const vote = topic.Votes[0];

            // TODO: Once we implement the the "endDate>now -> followUp" we can remove Topic.STATUSES.voting check
            if ((vote.endsAt && vote.endsAt.getTime() > new Date().getTime() && topic.status === Topic.STATUSES.voting) || topic.status === Topic.STATUSES.voting) {
                res.badRequest('The Vote has not ended.');

                return Promise.reject();
            }

            if (req.query.accept === 'application/x-7z-compressed') {
                res.set('Content-disposition', 'attachment; filename=final.7z');
                res.set('Content-type', 'application/x-7z-compressed');

                finalDocStream = await cosSignature.getFinalBdoc(topicId, voteId, include, true);
            } else {
                res.set('Content-disposition', 'attachment; filename=final.bdoc');
                res.set('Content-type', 'application/vnd.etsi.asic-e+zip');
                finalDocStream = await cosSignature.getFinalBdoc(topicId, voteId, include);
            }

            return finalDocStream.pipe(res);
        } catch (e) {
            next(e);
        }
    };

    /**
     * Download final vote Zip container
     */

    const topicDownloadZipFinal = function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        Topic
            .findOne({
                where: {
                    id: topicId
                },
                include: [
                    {
                        model: Vote,
                        where: {
                            id: voteId,
                            authType: Vote.AUTH_TYPES.soft
                        }
                    }
                ]
            })
            .then(function (topic) {
                const vote = topic.Votes[0];

                // TODO: Once we implement the the "endDate>now -> followUp" we can remove Topic.STATUSES.voting check
                if ((vote.endsAt && vote.endsAt.getTime() > new Date().getTime() && topic.status === Topic.STATUSES.voting) || topic.status === Topic.STATUSES.voting) {
                    res.badRequest('The Vote has not ended.');

                    return Promise.reject();
                }

                res.set('Content-disposition', 'attachment; filename=final.zip');
                res.set('Content-type', 'application/zip');

                return cosSignature.getFinalZip(topicId, voteId, true);
            })
            .then(function (finalDocStream) {
                return finalDocStream.pipe(res);
            })
            .catch(next);
    };

    /**
     * Download final vote BDOC container
     *
     * TODO: Get rid of this endpoint usage in favor of the one below
     *
     * @deprecated Use GET /api/topics/:topicId/votes/:voteId/downloads/bdocs/final instead
     */
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/final', authTokenRestrictedUse, topicDownloadBdocFinal);
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId/downloads/zip/final', authTokenRestrictedUse, topicDownloadZipFinal);


    /**
     * Download final vote BDOC container
     */
    app.get('/api/topics/:topicId/votes/:voteId/downloads/bdocs/final', authTokenRestrictedUse, topicDownloadBdocFinal);
    app.get('/api/topics/:topicId/votes/:voteId/downloads/zip/final', authTokenRestrictedUse, topicDownloadZipFinal);


    /**
     * Delegate a Vote
     */
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId/delegations', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.voting]), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        const toUserId = req.body.userId;

        if (req.user.id === toUserId) {
            return res.badRequest('Cannot delegate to self.', 1);
        }

        let hasAccess;
        try {
            hasAccess = await _hasPermission(topicId, toUserId, TopicMemberUser.LEVELS.read, false, null, null, req.user.partnerId);
        } catch (e) {
            hasAccess = false;
        }

        if (!hasAccess) {
            return res.badRequest('Cannot delegate Vote to User who does not have access to this Topic.', 2);
        }

        const vote = await Vote
            .findOne({
                where: {id: voteId},
                include: [
                    {
                        model: Topic,
                        where: {id: topicId}
                    }
                ]
            });

        if (!vote) {
            return res.notFound();
        }

        if (vote.endsAt && new Date() > vote.endsAt) {
            return res.badRequest('The Vote has ended.');
        }

        await db
            .transaction(async function (t) {
                let result;

                try {
                    result = await db
                        .query(
                            ' \
                            WITH \
                                RECURSIVE delegation_chains("voteId", "toUserId", "byUserId", depth) AS ( \
                                    SELECT \
                                        "voteId", \
                                        "toUserId", \
                                        "byUserId", \
                                        1 \
                                    FROM "VoteDelegations" vd \
                                    WHERE vd."voteId" = :voteId \
                                        AND vd."byUserId" = :toUserId \
                                        AND vd."deletedAt" IS NULL \
                                    \
                                    UNION ALL \
                                    \
                                    SELECT \
                                        vd."voteId", \
                                        vd."toUserId", \
                                        dc."byUserId", \
                                        dc.depth + 1 \
                                    FROM delegation_chains dc, "VoteDelegations" vd \
                                    WHERE vd."voteId" = dc."voteId" \
                                        AND vd."byUserId" = dc."toUserId" \
                                        AND vd."deletedAt" IS NULL \
                                ), \
                                cyclicDelegation AS ( \
                                    SELECT \
                                        0 \
                                    FROM delegation_chains \
                                    WHERE "byUserId" = :toUserId \
                                        AND "toUserId" = :byUserId \
                                    LIMIT 1 \
                                ), \
                                upsert AS ( \
                                    UPDATE "VoteDelegations" \
                                    SET "toUserId" = :toUserId, \
                                        "updatedAt" = CURRENT_TIMESTAMP \
                                    WHERE "voteId" = :voteId \
                                    AND "byUserId" = :byUserId \
                                    AND 1 = 1 / COALESCE((SELECT * FROM cyclicDelegation), 1) \
                                    AND "deletedAt" IS NULL \
                                    RETURNING * \
                                ) \
                            INSERT INTO "VoteDelegations" ("voteId", "toUserId", "byUserId", "createdAt", "updatedAt") \
                                SELECT :voteId, :toUserId, :byUserId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP \
                                WHERE NOT EXISTS (SELECT * FROM upsert) \
                                    AND 1 = 1 / COALESCE((SELECT * FROM cyclicDelegation), 1) \
                            RETURNING * \
                            ',
                            {
                                replacements: {
                                    voteId: voteId,
                                    toUserId: toUserId,
                                    byUserId: req.user.id
                                },
                                raw: true,
                                transaction: t
                            }
                        );
                } catch (err) {
                    // HACK: Forcing division by zero when cyclic delegation is detected. Cannot use result check as both update and cyclic return [].
                    if (err.parent.code === '22012') {
                        // Cyclic delegation detected.
                        return res.badRequest('Sorry, you cannot delegate your vote to this person.');
                    }

                    // Don't hide other errors
                    throw err;
                }

                const delegation = VoteDelegation.build(result[0][0]);

                await cosActivities
                    .createActivity(
                        delegation,
                        vote,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );
            });

        return res.ok();
    }));


    /**
     * Delete Vote delegation
     */
    app.delete('/api/users/:userId/topics/:topicId/votes/:voteId/delegations', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.voting]), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;
        const userId = req.user.id;

        const vote = await Vote
            .findOne({
                where: {id: voteId},
                include: [
                    {
                        model: Topic,
                        where: {id: topicId}
                    }
                ]
            });

        if (!vote) {
            return res.notFound('Vote was not found for given topic', 1);
        }

        if (vote.endsAt && new Date() > vote.endsAt) {
            return res.badRequest('The Vote has ended.', 1);
        }

        const voteDelegation = await VoteDelegation
            .findOne({
                where: {
                    voteId: voteId,
                    byUserId: userId
                }
            });

        if (!voteDelegation) {
            return res.notFound('Delegation was not found', 2);
        }

        await db
            .transaction(async function (t) {
                await cosActivities
                    .deleteActivity(
                        voteDelegation,
                        vote,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await voteDelegation
                    .destroy({
                        force: true,
                        transaction: t
                    });
            });

        return res.ok();
    }));

    const topicEventsCreate = function (req, res, next) {
        const topicId = req.params.topicId;

        return Topic
            .findOne({
                where: {
                    id: topicId
                }
            })
            .then(function (topic) {
                return db
                    .transaction(function (t) {
                        return TopicEvent
                            .create(
                                {
                                    topicId: topicId,
                                    subject: req.body.subject,
                                    text: req.body.text
                                },
                                {
                                    transaction: t
                                }
                            )
                            .then(function (event) {
                                const actor = {
                                    type: 'User',
                                    ip: req.ip
                                };

                                if (req.user && req.user.id) {
                                    actor.id = req.user.id;
                                }

                                return cosActivities
                                    .createActivity(
                                        event,
                                        topic,
                                        actor,
                                        req.method + ' ' + req.path,
                                        t
                                    )
                                    .then(function () {
                                        return event;
                                    });
                            });
                    }).then(function (event) {
                        return res.created(event.toJSON());
                    });
            })
            .catch(next);

    };

    /** Create an Event **/
    app.post('/api/users/:userId/topics/:topicId/events', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.followUp, Topic.STATUSES.closed]), topicEventsCreate);


    /**
     * Create an Event with a token issued to a 3rd party
     */
    app.post('/api/topics/:topicId/events', authTokenRestrictedUse, topicEventsCreate);


    const topicEventsList = function (req, res, next) {
        const topicId = req.params.topicId;

        TopicEvent
            .findAll({
                where: {
                    topicId: topicId
                },
                order: [['createdAt', 'DESC']]
            })
            .then(function (events) {
                return res.ok({
                    count: events.length,
                    rows: events
                });
            })
            .catch(next);
    };


    /** List Events **/
    app.get('/api/users/:userId/topics/:topicId/events', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.followUp, Topic.STATUSES.closed]), topicEventsList);


    /**
     * Read (List) public Topic Events
     */
    app.get('/api/topics/:topicId/events', hasVisibility(Topic.VISIBILITY.public), topicEventsList);


    /**
     * Delete event
     */
    app.delete('/api/users/:userId/topics/:topicId/events/:eventId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.followUp]), function (req, res, next) {
        const topicId = req.params.topicId;
        const eventId = req.params.eventId;

        TopicEvent
            .findOne({
                where: {
                    id: eventId,
                    topicId: topicId
                },
                include: [Topic]
            })
            .then(function (event) {
                return db
                    .transaction(function (t) {
                        return cosActivities
                            .deleteActivity(event, event.Topic, {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t)
                            .then(function () {
                                return TopicEvent
                                    .destroy({
                                        where: {
                                            id: eventId,
                                            topicId: topicId
                                        },
                                        transaction: t
                                    });
                            });
                    });

            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

    app.post('/api/users/:userId/topics/:topicId/pin', loginCheck(['partner']), function (req, res, next) {
        const userId = req.user.id;
        const topicId = req.params.topicId;

        return db
            .transaction(function (t) {
                return TopicPin
                    .findOrCreate({
                        where: {
                            topicId: topicId,
                            userId: userId
                        },
                        transaction: t
                    })
                    .then(function ([topicPin, created]) {
                        if (created) {
                            return Topic
                                .findOne({
                                    where: {
                                        id: topicId
                                    }
                                })
                                .then(function (topic) {
                                    topic.description = null;

                                    return cosActivities
                                        .addActivity(
                                            topic,
                                            {
                                                type: 'User',
                                                id: userId,
                                                ip: req.ip
                                            },
                                            null,
                                            topicPin,
                                            req.method + ' ' + req.path,
                                            t
                                        );
                                });
                        }
                    });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

    app.delete('/api/users/:userId/topics/:topicId/pin', loginCheck(['partner']), function (req, res, next) {
        const userId = req.user.id;
        const topicId = req.params.topicId;

        TopicPin
            .findOne({
                where: {
                    userId: userId,
                    topicId: topicId
                }
            })
            .then(function (topicPin) {
                if (topicPin) {
                    return db
                        .transaction(function (t) {
                            return Topic
                                .findOne({
                                    where: {
                                        id: topicId
                                    }
                                })
                                .then(function (topic) {
                                    topic.description = null;

                                    return cosActivities
                                        .deleteActivity(
                                            topicPin,
                                            topic,
                                            {
                                                type: 'User',
                                                id: req.user.id,
                                                ip: req.ip
                                            },
                                            req.method + ' ' + req.path,
                                            t
                                        )
                                        .then(function () {
                                            return TopicPin
                                                .destroy({
                                                    where: {
                                                        userId: userId,
                                                        topicId: topicId
                                                    },
                                                    transaction: t
                                                });
                                        });
                                });
                        });
                }
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

    return {
        hasPermission: hasPermission
    };
}
;
