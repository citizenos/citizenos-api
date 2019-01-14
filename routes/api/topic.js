'use strict';

/**
 * Topic API-s (/api/../topics/..)
 */


module.exports = function (app) {
    var config = app.get('config');
    var logger = app.get('logger');
    var models = app.get('models');
    var db = models.sequelize;
    var _ = app.get('lodash');
    var validator = app.get('validator');
    var util = app.get('util');
    var urlLib = app.get('urlLib');
    var emailLib = app.get('email');
    var cosBdoc = app.get('cosBdoc');
    var cosActivities = app.get('cosActivities');
    var Promise = app.get('Promise');
    var sanitizeFilename = app.get('sanitizeFilename');
    var cryptoLib = app.get('cryptoLib');
    var cosEtherpad = app.get('cosEtherpad');
    var jwt = app.get('jwt');
    var cosJwt = app.get('cosJwt');
    var querystring = app.get('querystring');
    var objectEncrypter = app.get('objectEncrypter');
    var twitter = app.get('twitter');
    var hashtagCache = app.get('hashtagCache');
    var moment = app.get('moment');
    var encoder = app.get('encoder');
    var URL = require('url');
    var https = require('https');

    var loginCheck = app.get('middleware.loginCheck');
    var authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    var partnerParser = app.get('middleware.partnerParser');

    var User = models.User;
    var UserConnection = models.UserConnection;
    var Group = models.Group;

    var Topic = models.Topic;
    var TopicMemberUser = models.TopicMemberUser;
    var TopicMemberGroup = models.TopicMemberGroup;
    var TopicReport = models.TopicReport;

    var Report = models.Report;

    var Comment = models.Comment;
    var CommentVote = models.CommentVote;
    var CommentReport = models.CommentReport;

    var Vote = models.Vote;
    var VoteOption = models.VoteOption;
    var VoteUserContainer = models.VoteUserContainer;
    var VoteList = models.VoteList;
    var VoteDelegation = models.VoteDelegation;

    var TopicComment = models.TopicComment;
    var TopicEvent = models.TopicEvent;
    var TopicVote = models.TopicVote;
    var TopicAttachment = models.TopicAttachment;
    var Attachment = models.Attachment;
    var TopicPin = models.TopicPin;

    var _hasPermission = function (topicId, userId, level, allowPublic, topicStatusesAllowed, allowSelf, partnerId) {
        var LEVELS = {
            none: 0, // Enables to override inherited permissions.
            read: 1,
            edit: 2,
            admin: 3
        };
        var minRequiredLevel = level;

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
                    var isPublic = result[0].isPublic;
                    var status = result[0].status;
                    var hasDirectAccess = result[0].hasDirectAccess;
                    var level = result[0].level;
                    var sourcePartnerId = result[0].sourcePartnerId;
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

                        var authorizationResult = {
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
    var hasPermission = function (level, allowPublic, topicStatusesAllowed, allowSelf) {
        return function (req, res, next) {
            var userId = req.user.id;
            var partnerId = req.user.partnerId;
            var topicId = req.params.topicId;

            allowPublic = allowPublic ? allowPublic : false;

            if (req.user && req.user.moderator) {
                allowPublic = true;
            }

            topicStatusesAllowed = topicStatusesAllowed ? topicStatusesAllowed : null;
            var allowSelfDelete = allowSelf ? allowSelf : null;
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

    var hasVisibility = function (visiblity) {
        return function (req, res, next) {
            return Topic
                .count({
                    where: {
                        id: req.params.topicId,
                        visibility: visiblity
                    }
                })
                .then(function (count) {
                    if (!count) {
                        return res.notFound();
                    }
                    next();
                })
                .catch(next);
        };
    };

    var _isModerator = function (topicId, userId) {
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
                        var isUserModerator = result[0].userId === userId;
                        var isTopicModerator = result[0].topicId === topicId;

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

    var isModerator = function () {
        return function (req, res, next) {
            var topicId = req.params.topicId;
            var userId;

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

    var isCommentCreator = function () {
        return function (req, res, next) {
            var userId = req.user.id;
            var commentId = req.params.commentId;

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

    var getVoteResults = function (voteId, userId) {
        var includeVoted = '';
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
                            SELECT DISTINCT ON("voteId","userId") \
                                vl."voteId", \
                                vl."userId", \
                                vl."optionGroupId", \
                                vl."updatedAt" \
                            FROM "VoteLists" vl \
                            WHERE vl."voteId" = :voteId \
                              AND vl."deletedAt" IS NULL \
                            ORDER BY "voteId", "userId", "createdAt" DESC, "optionGroupId" ASC \
                        ), \
                        votes("voteId", "userId", "optionId", "optionGroupId") AS ( \
                            SELECT \
                                vl."voteId", \
                                vl."userId", \
                                vl."optionId", \
                                vl."optionGroupId" \
                            FROM "VoteLists" vl \
                            JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."userId" = vg."userId" AND vl."optionGroupId" = vg."optionGroupId") \
                            WHERE vl."voteId" =  :voteId \
                        ), \
                        votes_with_delegations("voteId", "userId", "optionId", depth) AS ( \
                            SELECT \
                                v."voteId", \
                                v."userId", \
                                v."optionId", \
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
                            v."voteId" \
                        FROM votes_with_delegations v \
                        WHERE v.depth IS NOT NULL \
                        GROUP BY v."optionId", v."voteId" \
                        \
                        UNION ALL \
                        \
                        SELECT \
                            COUNT(v."optionId") as "voteCount", \
                            v."optionId", \
                            v."voteId" \
                        FROM votes_with_delegations v \
                        WHERE v.depth IS NULL \
                        GROUP BY v."optionId", v."voteId" \
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

    var getBdocURL = function (params) {
        var userId = params.userId;
        var topicId = params.topicId;
        var voteId = params.voteId;
        var type = params.type;

        var path;
        var tokenPayload = {};
        var tokenOptions = {
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

        var urlOptions = {
            token: cosJwt.getTokenRestrictedUse(tokenPayload, 'GET ' + path, tokenOptions)
        };

        if (type === 'goverment') {
            urlOptions.accept = 'application/x-7z-compressed';
        }

        return urlLib.getApi(path, null, urlOptions);
    };

    var getZipURL = function (params) {
        var userId = params.userId;
        var topicId = params.topicId;
        var voteId = params.voteId;
        var type = params.type;

        var expiresIn = '1d';
        var signOptions = {};

        if (type === 'final') {
            signOptions.path = '/api/users/self/topics/:topicId/votes/:voteId/downloads/zip/final';
        }
        if (userId) {
            signOptions.userId = userId;
        }

        signOptions.path = signOptions.path
            .replace(':topicId', topicId)
            .replace(':voteId', voteId);
        var urlOptions = {};

        urlOptions.token = jwt.sign(signOptions, config.session.privateKey, {
            expiresIn: expiresIn,
            algorithm: config.session.algorithm
        });
        urlOptions.accept = 'application/x-7z-compressed';

        return urlLib.getApi(signOptions.path, null, urlOptions);
    };

    var readTopicUnauth = function (topicId, include) {
        var join = '';
        var returncolumns = '';

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
                     tv."voteId" \
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

    var getAllVotesResults = function (userId) {
        var where = '';
        var join = '';
        var select = '';
        if (!userId) {
            where = ' AND t.visibility = \'' + Topic.VISIBILITY.public + '\' ';
        } else {
            select = ', v."optionId" = (SELECT "optionId" FROM "VoteLists" WHERE "userId" = :userId AND "voteId" = v."voteId" ORDER BY "createdAt" DESC LIMIT 1) as "selected" ';
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
        var query = ' \
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
                                SELECT DISTINCT ON("voteId","userId") \
                                    vl."voteId", \
                                    vl."userId", \
                                    vl."optionGroupId", \
                                    vl."updatedAt" \
                                FROM "VoteLists" vl \
                                WHERE vl."voteId" = $1 \
                                  AND vl."deletedAt" IS NULL \
                                ORDER BY "voteId", "userId", "createdAt" DESC, "optionGroupId" ASC; $$ \
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
                                JOIN pg_temp.vote_groups($1) vg ON (vl."voteId" = vg."voteId" AND vl."userId" = vg."userId" AND vl."optionGroupId" = vg."optionGroupId") \
                                WHERE vl."voteId" = $1; $$ \
                            LANGUAGE SQL; \
                        CREATE OR REPLACE FUNCTION pg_temp.votes_with_delegations(uuid) \
                            RETURNS TABLE ("voteId" uuid, "userId" uuid, "optionId" uuid, depth int) \
                            AS $$ \
                                SELECT \
                                    v."voteId", \
                                    v."userId", \
                                    v."optionId", \
                                    id."depth" \
                                FROM pg_temp.votes($1) v \
                                LEFT JOIN pg_temp.indirect_delegations($1) id ON (v."userId" = id."toUserId") \
                                WHERE v."userId" NOT IN (SELECT "byUserId" FROM pg_temp.indirect_delegations($1) WHERE "voteId"=v."voteId"); $$ \
                            LANGUAGE SQL; \
                        CREATE OR REPLACE FUNCTION pg_temp.get_vote_results (uuid) \
                            RETURNS TABLE ("voteCount" bigint, "optionId" uuid, "voteId" uuid) \
                            AS $$ \
                                SELECT \
                                    COUNT(v."optionId") + 1 as "voteCount", \
                                    v."optionId", \
                                    v."voteId" \
                                FROM pg_temp.votes_with_delegations($1) v \
                                WHERE v.depth IS NOT NULL \
                                GROUP BY v."optionId", v."voteId" \
                                \
                                UNION ALL \
                                \
                                SELECT \
                                    COUNT(v."optionId") as "voteCount", \
                                    v."optionId", \
                                    v."voteId" \
                                FROM pg_temp.votes_with_delegations($1) v \
                                WHERE v.depth IS NULL \
                                GROUP BY v."optionId", v."voteId"; $$ \
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
                        GROUP BY v."optionId",v."voteId", vo."value" \
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

    /**
     * Create a new Topic
     */
    app.post('/api/users/:userId/topics', loginCheck(['partner']), partnerParser, function (req, res, next) {
        // I wish Sequelize Model.build supported "fields". This solution requires you to add a field here once new are defined in model.
        var topic = Topic.build({
            visibility: req.body.visibility || Topic.VISIBILITY.private,
            creatorId: req.user.id,
            categories: req.body.categories,
            hashtag: req.body.hashtag,
            endsAt: req.body.endsAt,
            sourcePartnerObjectId: req.body.sourcePartnerObjectId
        });

        if (req.locals.partner) {
            topic.sourcePartnerId = req.locals.partner.id;
        }

        var topicDescription = req.body.description;
        var user;

        User
            .findOne({
                where: {
                    id: req.user.id
                },
                attributes: ['id', 'name', 'language']
            })
            .then(function (u) {
                user = u;

                return cosEtherpad.createTopic(topic.id, user.language, topicDescription);
            })
            .then(function () {
                topic.padUrl = cosEtherpad.getTopicPadUrl(topic.id);

                return db
                    .transaction(function (t) {
                        return topic
                            .save({transaction: t})
                            .then(function () {

                                // The creator is also the first member
                                return topic
                                    .addMemberUser(// Magic method by Sequelize - https://github.com/sequelize/sequelize/wiki/API-Reference-Associations#hasmanytarget-options
                                        user.id,
                                        {
                                            through: {
                                                level: TopicMemberUser.LEVELS.admin
                                            },
                                            transaction: t
                                        }
                                    )
                                    .then(function () {
                                        return cosActivities
                                            .createActivity(
                                                topic,
                                                null,
                                                {
                                                    type: 'User',
                                                    id: req.user.id
                                                }
                                                , req.method + ' ' + req.path,
                                                t
                                            );
                                    });
                            });
                    });
            })
            .then(function () {
                // Sync Topic with Etherpad only when description was actually set.
                if (topicDescription) {
                    return cosEtherpad
                        .syncTopicWithPad(
                            topic.id,
                            req.method + ' ' + req.path,
                            {
                                type: 'User',
                                id: req.user.id
                            }
                        );
                } else {
                    return Promise.resolve();
                }
            })
            .then(function () {
                var level = TopicMemberUser.LEVELS.admin;

                topic.padUrl = cosEtherpad.getUserAccessUrl(topic, user.id, user.name, user.language, req.locals.partner);

                var resObject = topic.toJSON();
                resObject.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                if (req.locals.partner) {
                    resObject.sourcePartnerId = req.locals.partner.id;
                } else {
                    resObject.sourcePartnerId = null;
                }

                resObject.pinned = false;
                resObject.permission = { // TODO: should be plural?
                    level: level
                };

                return res.created(resObject);
            })
            .catch(next);
    });

    /**
     * Read a Topic
     */
    app.get('/api/users/:userId/topics/:topicId', loginCheck(['partner']), partnerParser, hasPermission(TopicMemberUser.LEVELS.read, true), isModerator(), function (req, res, next) {
        var include = req.query.include;
        var join = '';
        var returncolumns = '';
        var topicId = req.params.topicId;

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

        if (req.user.moderator) {
            returncolumns += ' \
            , c.email as "creator.email" \
            , uc."connectionData"::jsonb->>\'pid\' AS "creator.pid" \
            , uc."connectionData"::jsonb->\'phoneNumber\' AS "creator.phoneNumber" \
            ';
        }

        db
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
                        u.language as "user.language" \
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
                    ' + join + ' \
                WHERE t.id = :topicId \
                    AND t."deletedAt" IS NULL \
                ',
                {
                    replacements: {
                        topicId: topicId,
                        userId: req.user.id
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
                    res.notFound();

                    return Promise.reject();
                }
            })
            .then(function (topic) {
                topic.padUrl = cosEtherpad.getUserAccessUrl(topic, topic.user.id, topic.user.name, topic.user.language, req.locals.partner);
                topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                if (topic.visibility === Topic.VISIBILITY.public && topic.permission.level === TopicMemberUser.LEVELS.none) {
                    topic.permission.level = TopicMemberUser.LEVELS.read;
                }
                // Remove the user info from output, was only needed for padUrl generation
                delete topic.user;

                if (include && include.indexOf('vote') > -1 && topic.vote && topic.vote.id) {

                    return getVoteResults(topic.vote.id, req.user.id)
                        .then(
                            function (result) {
                                var options = [];
                                topic.vote.options.forEach(function (option) {
                                    option = option.split(':');
                                    var o = {
                                        id: option[0],
                                        value: option[1]
                                    };
                                    if (result) {
                                        var res = _.find(result, {'optionId': o.id});
                                        if (res) {
                                            o.voteCount = parseInt(res.voteCount, 10);
                                            if (res.selected) {
                                                o.selected = res.selected;
                                                topic.vote.downloads = {
                                                    bdocVote: getBdocURL({
                                                        userId: req.user.id,
                                                        topicId: topicId,
                                                        voteId: topic.vote.id,
                                                        type: 'user'
                                                    })
                                                };
                                            }
                                        }
                                    }
                                    options.push(o);
                                });
                                topic.vote.options = {
                                    count: options.length,
                                    rows: options
                                };

                                return res.ok(topic);
                            },
                            function (err) {
                                logger.error('ERROR', err);
                            }
                        );
                } else {
                    delete topic.vote;

                    return res.ok(topic);
                }
            })
            .catch(next);
    });

    app.get('/api/topics/:topicId', function (req, res, next) {
        var include = req.query.include;
        var topicId = req.params.topicId;

        if (include && !Array.isArray(include)) {
            include = [include];
        }

        readTopicUnauth(topicId, include)
            .then(function (result) {
                if (result && result.length && result[0]) {
                    var topic = result[0];
                    topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});
                    if (include && include.indexOf('vote') > -1 && topic.vote && topic.vote.id) {
                        return getVoteResults(topic.vote.id)
                            .then(
                                function (result) {
                                    var options = [];
                                    topic.vote.options.forEach(function (option) {
                                        option = option.split(':');
                                        var o = {
                                            id: option[0],
                                            value: option[1]
                                        };
                                        if (result) {
                                            var res = _.find(result, {'optionId': o.id});
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

                                    return res.ok(topic);
                                },
                                function (err) {
                                    logger.error(err);
                                }
                            );
                    } else {
                        delete topic.vote;

                        return res.ok(topic);
                    }
                } else {
                    return res.notFound();
                }
            })
            .catch(next);
    });

    var _topicUpdate = function (req, res) {
        var topicId = req.params.topicId;
        var contact = req.body.contact; // TODO: This logic is specific to Rahvaalgatus.ee, with next Partner we have to make it more generic - https://trello.com/c/Sj3XRF5V/353-raa-ee-followup-email-to-riigikogu-and-token-access-to-events-api
        var statusNew = req.body.status;

        var isBackToVoting = false;
        var isSendToParliament = false;

        return Topic
            .findOne({
                where: {id: topicId},
                include: [Vote]
            })
            .then(function (topic) {
                if (!topic) {
                    res.badRequest();

                    return Promise.reject();
                }

                var statuses = _.values(Topic.STATUSES);

                if (statusNew && statusNew !== topic.status) {
                    var vote = topic.Votes[0];

                    // The only flow that allows going back in status flow is reopening for voting
                    if (statusNew === Topic.STATUSES.voting && topic.status === Topic.STATUSES.followUp) {
                        if (!vote) {
                            res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew + ' when the Topic has no Vote created');

                            return Promise.reject();
                        }

                        // TODO: This logic is specific to Rahvaalgatus.ee, with next Partner we have to make it more generic - https://trello.com/c/Sj3XRF5V/353-raa-ee-followup-email-to-riigikogu-and-token-access-to-events-api
                        // Do not allow going back to voting once the Topic has been sent to Parliament
                        if (vote.authType === Vote.AUTH_TYPES.hard) {
                            return getVoteResults(vote.id)
                                .then(function (voteResults) {
                                    var optionMax = _.maxBy(voteResults, 'voteCount');
                                    if (optionMax && optionMax.voteCount >= config.features.sendToParliament.voteCountMin) {
                                        res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew + ' when the Topic has been sent to Parliament');

                                        return Promise.reject();
                                    } else {
                                        isBackToVoting = true;

                                        return Promise.resolve([topic, vote]);
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

                            return getVoteResults(vote.id)
                                .then(function (voteResults) {
                                    var optionMax = _.maxBy(voteResults, 'voteCount');
                                    if (optionMax && optionMax.voteCount >= config.features.sendToParliament.voteCountMin) {
                                        isSendToParliament = true;

                                        return Promise.resolve([topic, vote]);
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

                return Promise.resolve([topic, vote]);
            })
            .spread(function (topic, vote) {
                // NOTE: Description is handled separately below
                var fieldsAllowedToUpdate = ['visibility', 'status', 'categories', 'endsAt', 'hashtag', 'sourcePartnerObjectId'];

                var fieldsToUpdate = [];
                Object.keys(req.body).forEach(function (key) {
                    if (fieldsAllowedToUpdate.indexOf(key) >= 0) {
                        fieldsToUpdate.push(key);
                    }
                });

                return db
                    .transaction(function (t) {
                        var promisesToResolve = [];

                        var topicActivityPromise = cosActivities
                            .updateActivity(
                                topic,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                null,
                                req.method + ' ' + req.path,
                                t
                            );

                        promisesToResolve.push(topicActivityPromise);

                        var topicUpdatePromise = topic
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

                        if (isBackToVoting) {
                            promisesToResolve.push(cosBdoc.deleteFinalBdoc(topicId, vote.id));

                            var topicEventsDeletePromise = TopicEvent
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
                            var epUpdateTopicPromise = cosEtherpad
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
                                        id: req.user.id
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
                            var downloadTokenExpiryDays = 30;
                            var linkDownloadBdocFinalExpiryDate = new Date(new Date().getTime() + downloadTokenExpiryDays * 24 * 60 * 60 * 1000);

                            var pathAddEvent = '/api/topics/:topicId/events' // COS API url for adding events with token
                                .replace(':topicId', topicId);

                            var linkAddEvent = config.features.sendToParliament.urlPrefix + '/initiatives/:topicId/events/new'.replace(':topicId', topicId);
                            linkAddEvent += '?' + querystring.stringify({token: cosJwt.getTokenRestrictedUse({}, 'POST ' + pathAddEvent)});

                            var downloadUriBdocFinal = getBdocURL({
                                topicId: topicId,
                                voteId: vote.id,
                                type: 'goverment'
                            });

                            return emailLib.sendToParliament(topic, contact, downloadUriBdocFinal, linkDownloadBdocFinalExpiryDate, linkAddEvent);
                        }

                        return Promise.resolve();
                    });
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
                var tokenJoin = Topic.generateTokenJoin();
                topic.tokenJoin = tokenJoin;

                return db
                    .transaction(function (t) {
                        return cosActivities
                            .updateActivity(topic, null, {
                                type: 'User',
                                id: req.user.id
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
            .findById(req.params.topicId)
            .then(function (topic) {
                if (!topic) {
                    res.notFound('No such topic found.');

                    return Promise.reject();
                }

                return db.transaction(function (t) {
                    var deleteTopicEtherpadPromise = cosEtherpad.deleteTopic(topic.id);

                    // Delete TopicMembers beforehand. Sequelize does not cascade and set "deletedAt" for related objects if "paranoid: true".
                    var deleteTopicDb = TopicMemberUser
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
                                id: req.user.id
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
        var userId = req.user.id;
        var partnerId = req.user.partnerId;
        var include = req.query.include;

        var visibility = req.query.visibility;
        var creatorId = req.query.creatorId;
        var statuses = req.query.statuses;
        var pinned = req.query.pinned;
        if (statuses && !Array.isArray(statuses)) {
            statuses = [statuses];
        }

        var voteResultsPromise = false;
        var join = '';
        var returncolumns = '';

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

        var where = ' t."deletedAt" IS NULL \
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

        if (creatorId) {
            if (creatorId === userId) {
                where += ' AND c.id =:creatorId ';
            } else {
                res.badRequest('No rights!');
            }
        }

        // TODO: NOT THE MOST EFFICIENT QUERY IN THE WORLD, tune it when time.
        // TODO: That casting to "enum_TopicMemberUsers_level". Sequelize does not support naming enums, through inheritance I have 2 enums that are the same but with different name thus different type in PG. Feature request - https://github.com/sequelize/sequelize/issues/2577
        var query = '\
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

        var topicsPromise = db
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
            .spread(function (rows, voteResults) {
                var rowCount = rows.length;

                // Sequelize returns empty array for no results.
                var result = {
                    count: rowCount,
                    rows: []
                };

                if (rowCount > 0) {
                    rows.forEach(function (topic) {
                        topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                        if (include.indexOf('vote') > -1) {
                            if (topic.vote.id) {
                                var options = [];
                                if (topic.vote.options) {
                                    topic.vote.options.forEach(function (voteOption) {
                                        var o = {};
                                        var optText = voteOption.split(':');
                                        o.id = optText[0];
                                        o.value = optText[1];
                                        var result = 0;
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
        var limitMax = 500;
        var limitDefault = 26;
        var join = '';
        var returncolumns = '';
        var voteResultsPromise = false;

        var offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        var limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;

        if (limit > limitMax) limit = limitDefault;

        var statuses = req.query.statuses;
        if (statuses && !Array.isArray(statuses)) {
            statuses = [statuses];
        }

        var include = req.query.include;
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

        var categories = req.query.categories;
        if (categories && !Array.isArray(categories)) {
            categories = [categories];
        }

        var where = ' t.visibility = \'' + Topic.VISIBILITY.public + '\' \
            AND t.title IS NOT NULL \
            AND t."deletedAt" IS NULL ';

        if (categories && categories.length) {
            where += ' AND t."categories" @> ARRAY[:categories]::VARCHAR(255)[] ';
        }

        if (statuses && statuses.length) {
            where += ' AND t.status IN (:statuses)';
        }

        var sourcePartnerId = req.query.sourcePartnerId;
        if (sourcePartnerId) {
            if (!Array.isArray(sourcePartnerId)) {
                sourcePartnerId = [sourcePartnerId];
            }
            where += ' AND t."sourcePartnerId" IN (:partnerId)';
        }

        var title = req.query.title;
        if (title) {
            where += ' AND t.title LIKE \'%:title%\' ';
        }

        var query = '\
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
                    ' + join + ' \
                WHERE ' + where + ' \
                ORDER BY "order" ASC, t."updatedAt" DESC \
                LIMIT :limit OFFSET :offset \
            ;';

        var topicsPromise = db
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
            .spread(function (topics, voteResults) {
                if (!topics) {
                    return res.notFound();
                }

                var countTotal = 0;
                if (topics && topics.length) {
                    countTotal = topics[0].countTotal;
                    topics.forEach(function (topic) {
                        topic.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                        delete topic.countTotal;

                        if (include && include.indexOf('vote') > -1 && topic.vote.id) {
                            var options = [];
                            if (topic.vote.options) {
                                topic.vote.options.forEach(function (voteOption) {
                                    var o = {};
                                    var optText = voteOption.split(':');
                                    o.id = optText[0];
                                    o.value = optText[1];
                                    if (voteResults) {
                                        var result = _.find(voteResults, {'optionId': optText[0]});
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
                var result = {
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
     */
    app.post('/api/users/:userId/topics/:topicId/members/users', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), partnerParser, function (req, res, next) {
        //NOTE: userId can be actual UUID or e-mail - it is comfort for the API user, but confusing in the BE code.

        var members = req.body;
        var topicId = req.params.topicId;

        var validEmailMembers = [];
        var validUserIdMembers = [];

        if (!Array.isArray(members)) {
            members = [members];
        }

        // TODO: not the best design that userId can be UUID4 or email. Should use separate properties {userId, email}...
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

        var validEmails = _.map(validEmailMembers, 'userId');
        // Find out which e-mails already exist

        return User
            .findAll({
                where: {email: validEmails},
                attributes: ['id', 'email']
            })
            .then(function (users) {
                // These e-mails already exist and the ID-s can be added to validUserIdMembers
                _(users).forEach(function (u) {
                    var member = _.find(validEmailMembers, {userId: u.email});
                    if (member) {
                        member.userId = u.id;
                        validUserIdMembers.push(member);
                        _.remove(validEmailMembers, member); // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                    }
                });

                // The leftovers are e-mails for which User did not exist
                if (validEmailMembers.length) {
                    var usersToCreate = [];
                    _(validEmailMembers).forEach(function (m) {
                        usersToCreate.push({
                            email: m.userId,
                            language: m.language,
                            password: null,
                            name: util.emailToDisplayName(m.userId),
                            source: User.SOURCES.citizenos
                        });
                    });

                    return db.transaction(function (t) {
                        return User
                            .bulkCreate(usersToCreate, {transaction: t})
                            .then(function (users) {
                                var userCreateActivityPromises = [];
                                users.forEach(function (u) {
                                    userCreateActivityPromises.push(cosActivities.createActivity(u, null, {type: 'System'}, req.method + ' ' + req.path, t));
                                });

                                return Promise.all(userCreateActivityPromises)
                                    .then(function () {
                                        return users;
                                    });
                            });
                    }).catch(function (err) {
                        logger.error(err);
                    });
                } else {
                    return null;
                }
            })
            .then(function (createdUsers) {
                if (createdUsers && createdUsers.length) {
                    _(createdUsers).forEach(function (u) {
                        var member = {
                            userId: u.id
                        };

                        // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                        var level = _.find(validEmailMembers, {userId: u.email}).level;
                        if (level) {
                            member.level = level;
                        }

                        validUserIdMembers.push(member);
                    });
                }

                // TODO: Creates 1 DB call per Member which is not wise when thinking of performance.
                // Change once http://sequelize.readthedocs.org/en/latest/api/model/#bulkcreaterecords-options-promisearrayinstance suppors "bulkUpsert"
                var findOrCreatePromises = validUserIdMembers.map(function (member) {
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
                            }
                        });
                });

                return Promise
                    .all(findOrCreatePromises.map(function (promise) {
                        return promise.reflect();
                    }))
                    .then(function (results) {
                        return Topic
                            .findOne({
                                where: {
                                    id: topicId
                                }
                            })
                            .then(function (topic) {
                                var userIdsToInvite = [];
                                results.forEach(function (result, i) {
                                    if (result.isFulfilled()) {
                                        var value = result.value(); // findOrCreate returns [instance, created=true/false]

                                        if (value && value[1]) {
                                            userIdsToInvite.push(validUserIdMembers[i].userId);
                                            var user = User.build({id: value[0].userId});
                                            user.dataValues.id = value[0].userId;
                                            cosActivities.addActivity(user, {
                                                type: 'User',
                                                id: req.user.id
                                            }, null, topic, req.method + ' ' + req.path);
                                        }
                                    } else {
                                        logger.error('Failed to add a TopicMemberUser', validUserIdMembers[i]);
                                    }
                                });

                                return emailLib.sendTopicInvite(userIdsToInvite, req.user.id, topicId, req.locals.partner);
                            });
                    })
                    .then(function () {
                        return res.created();
                    });
            })
            .catch(next);
    });


    /**
     * Get all members of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read), function (req, res, next) {
        var response = {
            groups: {
                count: 0,
                rows: []
            },
            users: {
                count: 0,
                rows: []
            }
        };

        var groupsPromise = db
            .query(
                '\
                SELECT \
                    g.id, \
                    CASE \
                        WHEN gmu.level IS NOT NULL THEN g.name \
                        ELSE NULL \
                    END as "name", \
                    tmg.level, \
                    gmu.level as "permission.level", \
                    g.visibility, \
                    gmuc.count as "members.users.count" \
                FROM "TopicMemberGroups" tmg \
                    JOIN "Groups" g ON (tmg."groupId" = g.id) \
                    JOIN ( \
                        SELECT \
                            "groupId", \
                            COUNT(*) as count \
                        FROM "GroupMembers" \
                        WHERE "deletedAt" IS NULL \
                        GROUP BY 1 \
                    ) as gmuc ON (gmuc."groupId" = g.id) \
                    LEFT JOIN "GroupMembers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL) \
                WHERE tmg."topicId" = :topicId \
                    AND tmg."deletedAt" IS NULL \
                    AND g."deletedAt" IS NULL \
                ORDER BY level DESC;',
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

        var usersPromise = db
            .query(
                '\
                SELECT \
                    tm.* \
                FROM ( \
                    SELECT DISTINCT ON(id) \
                        tm."memberId" as id, \
                        tm."level", \
                        tmu."level" as "levelUser", \
                        u.name, \
                        u.company,\
                        u."imageUrl" \
                    FROM "Topics" t \
                    JOIN ( \
                        SELECT \
                            tmu."topicId", \
                            tmu."userId" AS "memberId", \
                            tmu."level"::text, \
                            1 as "priority" \
                        FROM "TopicMemberUsers" tmu \
                        WHERE tmu."deletedAt" IS NULL \
                        UNION \
                        ( \
                            SELECT \
                                tmg."topicId", \
                                gm."userId" AS "memberId", \
                                tmg."level"::text, \
                                2 as "priority" \
                            FROM "TopicMemberGroups" tmg \
                            LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                            WHERE tmg."deletedAt" IS NULL \
                            AND gm."deletedAt" IS NULL \
                            ORDER BY tmg."level"::"enum_TopicMemberGroups_level" DESC \
                        ) \
                    ) AS tm ON (tm."topicId" = t.id) \
                    JOIN "Users" u ON (u.id = tm."memberId") \
                    LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm."memberId" AND tmu."topicId" = t.id) \
                    WHERE t.id = :topicId \
                    ORDER BY id, tm.priority \
                ) tm \
                ORDER BY name ASC \
                ;',
                {
                    replacements: {
                        topicId: req.params.topicId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );

        Promise
            .all([groupsPromise, usersPromise])
            .then(function (results) {
                var groups = results[0];
                var users = results[1];

                if (groups && groups.length) {
                    response.groups.count = groups.length;
                    response.groups.rows = groups;
                }

                if (users && users.length) {
                    response.users.count = users.length;
                    response.users.rows = users;
                }

                return res.ok(response);
            })
            .catch(next);
    });

    /**
     * Get all member Users of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members/users', loginCheck(['partner']), isModerator(), hasPermission(TopicMemberUser.LEVELS.read), function (req, res, next) {
        var dataForModerator = '';
        if (req.user && req.user.moderator) {
            dataForModerator = '\
            tm.email, \
            uc."connectionData"::jsonb->>\'pid\' AS "pid", \
            uc."connectionData"::jsonb->>\'phoneNumber\' AS "phoneNumber", \
            ';
        }

        db
            .query(
                '\
                SELECT \
                    tm.id, \
                    tm.level, \
                    tmu.level AS "levelUser", \
                    tm.name, \
                    tm.company, \
                    tm."imageUrl", \
                    ' + dataForModerator + ' \
                    tmg."groupId" as "group.id", \
                    CASE \
                        WHEN gmu.level IS NOT NULL THEN g.name \
                        ELSE NULL \
                    END as "group.name", \
                    tmg."level"::text as "group.level" \
                FROM ( \
                    SELECT DISTINCT ON(id) \
                        tm."memberId" as id, \
                        tm."level", \
                        u.name, \
                        u.company,\
                        u."imageUrl", \
                        u.email \
                    FROM "Topics" t \
                    JOIN ( \
                        SELECT \
                            tmu."topicId", \
                            tmu."userId" AS "memberId", \
                            tmu."level"::text, \
                            1 as "priority" \
                        FROM "TopicMemberUsers" tmu \
                        WHERE tmu."deletedAt" IS NULL \
                        UNION \
                        SELECT \
                            tmg."topicId", \
                            gm."userId" AS "memberId", \
                            tmg."level"::text, \
                            2 as "priority" \
                        FROM "TopicMemberGroups" tmg \
                        LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                        WHERE tmg."deletedAt" IS NULL \
                        AND gm."deletedAt" IS NULL \
                    ) AS tm ON (tm."topicId" = t.id) \
                    JOIN "Users" u ON (u.id = tm."memberId") \
                    WHERE t.id = :topicId \
                    ORDER BY id, tm.priority, tm."level"::"enum_TopicMemberUsers_level" DESC \
                ) tm \
                LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm.id AND tmu."topicId" = :topicId) \
                LEFT JOIN "GroupMembers" gm ON (gm."userId" = tm.id) \
                LEFT JOIN "TopicMemberGroups" tmg ON tmg."topicId" = :topicId AND tmg."groupId" = gm."groupId" \
                LEFT JOIN "Groups" g ON g.id = tmg."groupId" \
                LEFT JOIN "GroupMembers" gmu ON (gmu."groupId" = tmg."groupId" AND gmu."userId" = :userId) \
                LEFT JOIN "UserConnections" uc ON (uc."userId" = tm.id AND uc."connectionId" = \'esteid\') \
                WHERE tmg."deletedAt" IS NULL \
                AND gm."deletedAt" IS NULL \
                AND g."deletedAt" IS NULL \
                ORDER BY tm.name ASC \
                ;',
                {
                    replacements: {
                        topicId: req.params.topicId,
                        userId: req.user.id
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (usersGroups) {
                var users = [];
                usersGroups.forEach(function (userRow) {
                    var user = _.find(users, function (o) {
                        return o.id === userRow.id;
                    });

                    if (!user) {
                        user = userRow;
                        user.groups = {
                            count: 0,
                            rows: []
                        };

                        if (userRow.group.id) {
                            user.groups.rows.push(userRow.group);
                            user.groups.count++;
                        }

                        delete user.group;
                        users.push(user);
                    } else if (userRow.group.id) {
                        user.groups.rows.push(userRow.group);
                        user.groups.count++;
                    }
                });

                return res.ok({
                    count: users.length,
                    rows: users
                });
            })
            .catch(next);
    });

    /**
     * Get all member Groups of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members/groups', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read), function (req, res, next) {
        db
            .query(
                '\
                SELECT \
                    g.id, \
                    CASE \
                        WHEN gmu.level IS NOT NULL THEN g.name \
                        ELSE NULL \
                    END as "name", \
                    tmg.level, \
                    gmu.level as "permission.level", \
                    g.visibility, \
                    gmuc.count as "members.users.count" \
                FROM "TopicMemberGroups" tmg \
                    JOIN "Groups" g ON (tmg."groupId" = g.id) \
                    JOIN ( \
                        SELECT \
                            "groupId", \
                            COUNT(*) as count \
                        FROM "GroupMembers" \
                        WHERE "deletedAt" IS NULL \
                        GROUP BY 1 \
                    ) as gmuc ON (gmuc."groupId" = g.id) \
                    LEFT JOIN "GroupMembers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL) \
                WHERE tmg."topicId" = :topicId \
                   AND tmg."deletedAt" IS NULL \
                   AND g."deletedAt" IS NULL \
                ORDER BY level DESC;',
                {
                    replacements: {
                        topicId: req.params.topicId,
                        userId: req.user.id
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (groups) {
                return res.ok({
                    count: groups.length,
                    rows: groups
                });
            })
            .catch(next);
    });

    var checkPermissionsForGroups = function (groupIds, userId, level) {
        if (!Array.isArray(groupIds)) {
            groupIds = [groupIds];
        }

        var LEVELS = {
            none: 0, // Enables to override inherited permissions.
            read: 1,
            edit: 2,
            admin: 3
        };

        var minRequiredLevel = level || 'read';

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
                        var blevel = row.level;

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
        var members = req.body;
        var topicId = req.params.topicId;

        if (!Array.isArray(members)) {
            members = [members];
        }

        var groupIds = [];
        members.forEach(function (member) {
            groupIds.push(member.groupId);
        });

        checkPermissionsForGroups(groupIds, req.user.id) // Checks if all groups are allowed
            .then(function (allowedGroups) {
                if (allowedGroups && allowedGroups[0]) {
                    return db
                        .transaction(function (t) {
                            var findOrCreateTopicMemberGroups = allowedGroups.map(function (group) {
                                var member = _.find(members, function (o) {
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

                            return Promise
                                .all(findOrCreateTopicMemberGroups)
                                .then(function (memberGroups) {
                                    return Topic
                                        .findOne({
                                            where: {
                                                id: topicId
                                            },
                                            transaction: t
                                        })
                                        .then(function (topic) {
                                            var groupIdsToInvite = [];
                                            var memberGroupActivities = [];

                                            memberGroups.forEach(function (memberGroup, i) {
                                                groupIdsToInvite.push(members[i].groupId);
                                                var groupData = _.find(allowedGroups, function (item) {
                                                    return item.id === members[i].groupId;
                                                });
                                                var group = Group.build(groupData);

                                                var addActivity = cosActivities.addActivity(
                                                    topic,
                                                    {
                                                        type: 'User',
                                                        id: req.user.id
                                                    },
                                                    null,
                                                    group,
                                                    req.method + ' ' + req.path,
                                                    t
                                                );
                                                memberGroupActivities.push(addActivity);
                                            });

                                            return Promise
                                                .all(memberGroupActivities)
                                                .then(function () {
                                                    return emailLib.sendTopicGroupInvite(groupIdsToInvite, req.user.id, topicId);
                                                });
                                        });
                                });
                        });
                } else {
                    return Promise.reject();
                }
            })
            .then(
                function () {
                    return res.created();
                },
                function (err) {
                    logger.error(err);

                    return res.forbidden();
                }
            )
            .catch(next);
    });


    /**
     * Update User membership information
     */
    app.put('/api/users/:userId/topics/:topicId/members/users/:memberId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        var newLevel = req.body.level;
        var memberId = req.params.memberId;
        var topicId = req.params.topicId;

        var promises = [];
        var userAdminFindPromise = TopicMemberUser
            .findAll({
                where: {
                    topicId: topicId,
                    level: TopicMemberUser.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            });
        promises.push(userAdminFindPromise);
        var userFindPromise = TopicMemberUser
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
                var topicAdminMembers = results[0];
                var topicMemberUser = results[1];
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
                                id: req.user.id
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
        var newLevel = req.body.level;
        var memberId = req.params.memberId;
        var topicId = req.params.topicId;

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
                                                    id: req.user.id
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
        var topicId = req.params.topicId;
        var memberId = req.params.memberId;

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
                        var topic = Topic.build(topicMemberUser.Topic);
                        var user = User.build(topicMemberUser.User);
                        topic.dataValues.id = topicId;
                        user.dataValues.id = memberId;
                        var activityPromise;

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
                                                id: req.user.id
                                            }, req.method + ' ' + req.path, t);
                                    };
                                } else {
                                    activityPromise = function () {
                                        return cosActivities
                                            .deleteActivity(user, topic, {
                                                type: 'User',
                                                id: req.user.id
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
        var topicId = req.params.topicId;
        var memberId = req.params.memberId;

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
                                var topic = Topic.build(topicMemberGroup.Topic);
                                topic.dataValues.id = topicId;
                                var group = Group.build(topicMemberGroup.Group);
                                group.dataValues.id = memberId;

                                return db
                                    .transaction(function (t) {
                                        return cosActivities
                                            .deleteActivity(
                                                group,
                                                topic,
                                                {
                                                    type: 'User',
                                                    id: req.user.id
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
     * Join authenticated User to Topic with a given token.
     *
     * Allows sharing of private join urls for example in forums, on conference screen...
     *
     * TODO: API url is fishy.. maybe should be POST /api/topics/:joinToken/members
     */
    app.post('/api/topics/join/:tokenJoin', loginCheck(['partner']), function (req, res, next) {
        var tokenJoin = req.params.tokenJoin;
        var userId = req.user.id;

        Topic
            .findOne({
                where: {
                    tokenJoin: tokenJoin
                }
            })
            .then(function (topic) {
                if (!topic) {
                    return res.badRequest('Matching token not found', 1);
                }

                return db.transaction(function (t) {
                    return TopicMemberUser
                        .findOrCreate({
                            where: {
                                topicId: topic.id,
                                userId: userId
                            },
                            defaults: {
                                level: TopicMemberUser.LEVELS.read
                            },
                            transaction: t
                        })
                        .spread(function (memberUser, created) {
                            if (created) {
                                return User
                                    .findOne({
                                        where: {
                                            id: userId
                                        }
                                    })
                                    .then(function (user) {
                                        return cosActivities
                                            .joinActivity(
                                                topic,
                                                {
                                                    type: 'User',
                                                    id: user.id,
                                                    level: TopicMemberUser.LEVELS.read
                                                },
                                                req.method + ' ' + req.path,
                                                t
                                            );
                                    });
                            } else {
                                return memberUser;
                            }
                        });
                }).then(function () {
                    var resObject = topic.toJSON();
                    resObject.url = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

                    return res.ok(resObject);
                });
            })
            .catch(next);
    });


    /**
     * Add Topic Attachment
     */

    app.post('/api/users/:userId/topics/:topicId/attachments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.edit), function (req, res, next) {
        var topicId = req.params.topicId;
        var name = req.body.name;
        var type = req.body.type;
        var source = req.body.source;
        var size = req.body.size;
        var link = req.body.link;

        var attachmentLimit = 5;

        Topic
            .findOne({
                where: {
                    id: topicId
                },
                include: [Attachment]
            })
            .then(function (topic) {
                if (!topic) {
                    return res.badRequest('Matching topic not found', 1);
                }
                if (topic.Attachments && topic.Attachments.length >= attachmentLimit) {
                    return res.badRequest('Topic attachment limit reached', 2);
                }

                var attachment = Attachment.build({
                    name: name,
                    type: type,
                    size: size,
                    source: source,
                    creatorId: req.user.id,
                    link: link
                });

                return db
                    .transaction(function (t) {
                        return attachment
                            .save({transaction: t})
                            .then(function (attachment) {
                                return TopicAttachment
                                    .create(
                                        {
                                            topicId: req.params.topicId,
                                            attachmentId: attachment.id
                                        },
                                        {
                                            transaction: t
                                        }
                                    )
                                    .then(function () {
                                        return cosActivities
                                            .addActivity(
                                                attachment,
                                                {
                                                    type: 'User',
                                                    id: req.user.id
                                                },
                                                null,
                                                topic,
                                                req.method + ' ' + req.path,
                                                t
                                            );
                                    });
                            });
                    })
                    .then(function () {
                        return res.ok(attachment.toJSON());
                    });
            })
            .catch(next);
    });

    app.put('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.edit), function (req, res, next) {
        var newName = req.body.name;

        var updateAttachment = {};

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
                        var topic = attachment.Topics[0];
                        delete attachment.Topics;

                        return cosActivities
                            .updateActivity(attachment, topic, {
                                type: 'User',
                                id: req.user.id
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
                                id: req.user.id
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

    var topicAttachmentsList = function (req, res, next) {

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

    var readAttachment = function (req, res, next) {


        Attachment
            .findOne({
                where: {
                    id: req.params.attachmentId
                }
            })
            .then(function (attachment) {
                if (attachment && attachment.source === Attachment.SOURCES.upload && req.query.download) {
                    var fileUrl = URL.parse(attachment.link);
                    var filename = attachment.name;

                    if (filename.split('.').length <= 1) {
                        filename += '.' + attachment.type;
                    }

                    var options = {
                        hostname: fileUrl.hostname,
                        path: fileUrl.path,
                        port: fileUrl.port
                    };

                    if (app.get('env') === 'development' || app.get('env') === 'test') {
                        options.rejectUnauthorized = false;
                    }

                    https.get(options, function (externalRes) {
                        res.setHeader('content-disposition', 'attachment; filename=' + filename);
                        externalRes.pipe(res);
                    }).on('error', function (err) {
                        next(err);
                    }).end();
                } else {
                    res.ok(attachment.toJSON());
                }
            });
    };

    app.get('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), readAttachment);
    app.get('/api/topics/:topicId/attachments/:attachmentId', hasVisibility(Topic.VISIBILITY.public), readAttachment);

    var topicReportsCreate = function (req, res, next) {
        var topicId = req.params.topicId;

        db
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
                        // FIXME: Topic report create activity!
                        return TopicReport
                            .create(
                                {
                                    topicId: topicId,
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
            })
            .then(function (report) {
                //FIXME: Send TopicReport e-mail - emailLib.sendCommentReport(commentId, report); // Fire and forget

                return res.ok(report);
            })
            .catch(next);
    };

    app.post(['/api/users/:userId/topics/:topicId/reports', '/api/topics/:topicId/reports'], loginCheck(['partner']), topicReportsCreate);

    /**
     * Read Topic Report
     */
    app.get(['/api/topics/:topicId/reports/:reportId', '/api/users/:userId/topics/:topicId/reports/:reportId'], function (req, res, next) {
        //FIXME Implement
        return res.notImplemented();
    });

    /**
     * Moderate a Topic
     */
    app.post('/api/topics/:topicId/reports/:reportId/moderate', function (req, res, next) {
        var reportType = req.body.type; // Delete reason type which is provided in case deleted/hidden by moderator due to a user report
        var reportText = req.body.text; // Free text with reason why the comment was deleted/hidden

        // FIXME: Implement
        return res.notImplemented();
    });

    /**
     * Create Topic Comment
     */
    app.post('/api/users/:userId/topics/:topicId/comments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        var type = req.body.type;
        var parentId = req.body.parentId;
        var parentVersion = req.body.parentVersion;
        var subject = req.body.subject;
        var text = req.body.text;
        var edits = [
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

        var comment = Comment.build({
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
                        var commentCreateActivityPromise = Topic
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
                                                            id: req.user.id
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
                                                id: req.user.id
                                            },
                                            req.method + ' ' + req.path,
                                            t
                                        );
                                }

                            });

                        var topicCommentPromise = TopicComment
                            .create(
                                {
                                    topicId: req.params.topicId,
                                    commentId: comment.id
                                },
                                {
                                    transaction: t
                                }
                            );

                        var updateCreatedAtPromise = db
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
            .spread(function (tc, c) {
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

    var topicCommentsList = function (req, res, next) {
        var orderByValues = {
            rating: 'rating',
            popularity: 'popularity',
            date: 'date'
        };

        var orderByComments = '"createdAt" DESC';
        var orderByReplies = '"createdAt" ASC';
        var dataForModerator = '';
        if (req.user && req.user.moderator) {
            dataForModerator = ' \
            u.email AS "creator.email", \
            uc."connectionData"::jsonb->>\'pid\' as "creator.pid", \
            uc."connectionData"::jsonb->>\'phoneNumber\' as "creator.phoneNumber", \
            ';
        }

        switch (req.query.orderBy) {
            case orderByValues.rating:
                orderByComments = '"votes.up.count" DESC, "votes.up.count" ASC, "createdAt" DESC';
                orderByReplies = '"votes.up.count" DESC, "votes.up.count" ASC, "createdAt" ASC';
                break;
            case orderByValues.popularity:
                orderByComments = '"votes.count" DESC, "createdAt" DESC';
                orderByReplies = '"votes.count" DESC, "createdAt" ASC';
                break;
            default:
            // Do nothing
        }

        db
            .query(
                ' \
                WITH topicComments AS ( \
                    SELECT \
                        c.id, \
                        c.type, \
                        c.subject, \
                        c.text, \
                        c.edits, \
                        c."createdAt", \
                        c."deletedAt", \
                        c."parentId" AS "parent.id", \
                        c."parentVersion" AS "parent.version", \
                        u.id as "creator.id", \
                        u.name as "creator.name", \
                        ' + dataForModerator + ' \
                        u.company as "creator.company", \
                        COALESCE(cvu.sum, 0) as "votes.up.count", \
                        COALESCE(cvd.sum, 0) as "votes.down.count", \
                        COALESCE(cvu.sum, 0) + COALESCE(cvd.sum, 0) as "votes.count" \
                    FROM "TopicComments" tc \
                        LEFT JOIN "Comments" c ON (c.id = tc."commentId") \
                        LEFT JOIN "Users" u ON (u.id = c."creatorId") \
                        LEFT JOIN "UserConnections" uc ON (uc."userId" = u.id AND uc."connectionId" = \'esteid\') \
                        LEFT JOIN ( \
                            SELECT SUM(value), "commentId" FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId" \
                        ) cvu ON (cvu."commentId" = c.id) \
                        LEFT JOIN ( \
                            SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId" \
                        ) cvd ON (cvd."commentId" = c.id) \
                    WHERE tc."topicId" = :topicId \
                    AND uc."deletedAt" IS NULL \
                    AND c."deletedAt" IS NULL \
                ) \
                ( \
                    SELECT \
                        * \
                    FROM topicComments \
                    WHERE "parent.id" = id \
                    ORDER BY ' + orderByComments + ' \
                ) \
                UNION ALL \
                ( \
                    SELECT \
                        * \
                    FROM topicComments \
                    WHERE "parent.id" !=id \
                    ORDER BY ' + orderByReplies + ' \
                ) \
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
            .then(function (comments) {
                var parentComments = _.filter(comments, function (c) {
                    return c.parent.id === c.id;
                });
                _.forEach(parentComments, function (p) {
                    var replies = _.filter(comments, function (r) {
                        return r.parent.id === p.id && r.id !== r.parent.id;
                    });

                    p.replies = {
                        count: replies.length,
                        rows: replies
                    };
                });

                return res.ok({
                    count: parentComments.length,
                    rows: parentComments
                });
            })
            .catch(next);
    };

    var topicCommentsList2 = function (req, res, next) {
        var orderByValues = {
            rating: 'rating',
            popularity: 'popularity',
            date: 'date'
        };

        var orderByComments = '"createdAt" DESC';
        var orderByReplies = '"createdAt" ASC';
        var dataForModerator = '';
        if (req.user && req.user.moderator) {
            dataForModerator = '\
            , \'email\', u.email \
            , \'pid\', uc."connectionData"::jsonb->>\'pid\' \
            , \'phoneNumber\', uc."connectionData"::jsonb->>\'phoneNumber\' \
            ';
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

        var query = '\
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
                                jsonb_build_object(\'up\', jsonb_build_object(\'count\', COALESCE(cvu.sum, 0)), \'down\', jsonb_build_object(\'count\', COALESCE(cvd.sum, 0)), \'count\', COALESCE(cvu.sum, 0) + COALESCE(cvd.sum, 0)) as votes, \
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
                                    SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId" \
                                ) cvd ON (cvd."commentId" = c.id) \
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
                                jsonb_build_object(\'up\', jsonb_build_object(\'count\', COALESCE(cvu.sum, 0)), \'down\', jsonb_build_object(\'count\', COALESCE(cvd.sum, 0)), \'count\', COALESCE(cvu.sum, 0) + COALESCE(cvd.sum, 0)) as votes, \
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
                                    SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId" \
                                ) cvd ON (cvd."commentId" = c.id) \
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
                WHERE tc."topicId" = :topicId \
                ORDER BY ' + orderByComments + ' \
                ;\
        ';

        db
            .query(
                query,
                {
                    replacements: {
                        topicId: req.params.topicId,
                        dateFormat: 'YYYY-MM-DDThh24:mi:ss.msZ'

                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (comments) {
                return res.ok({
                    count: comments.length,
                    rows: comments
                });
            })
            .catch(next);
    };

    /**
     * Read (List) Topic Comments
     */
    app.get('/api/users/:userId/topics/:topicId/comments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), isModerator(), topicCommentsList);
    app.get('/api/v2/users/:userId/topics/:topicId/comments', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), isModerator(), topicCommentsList2);


    /**
     * Read (List) public Topic Comments
     */
    app.get('/api/topics/:topicId/comments', hasVisibility(Topic.VISIBILITY.public), isModerator(), topicCommentsList);
    app.get('/api/v2/topics/:topicId/comments', hasVisibility(Topic.VISIBILITY.public), isModerator(), topicCommentsList2);

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
                                            id: req.user.id
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
        var subject = req.body.subject;
        var text = req.body.text;
        var type = req.body.type;
        var commentId = req.params.commentId;

        Comment
            .findOne({
                where: {
                    id: commentId
                },
                include: [Topic]
            })
            .then(function (comment) {
                var now = moment().format();
                var edits = comment.edits;

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
                comment.edits = edits;
                comment.subject = subject;
                comment.text = text;
                comment.type = type;

                return db
                    .transaction(function (t) {
                        var topic = comment.Topics[0];
                        delete comment.Topic;

                        return cosActivities
                            .updateActivity(comment, topic, {
                                type: 'User',
                                id: req.user.id
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

    var topicCommentsReportsCreate = function (req, res, next) {
        var commentId = req.params.commentId;

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
                                    .addActivity(report, {
                                        type: 'User',
                                        id: req.user.id
                                    }, null, comment, req.method + ' ' + req.path, t)
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
                var commentReport = results[0];

                return res.ok(commentReport);
            })
            .catch(next);
    });

    app.post('/api/topics/:topicId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, function (req, res, next) {
        var eventTokenData = req.locals.tokenDecoded;
        var type = req.body.type;

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
                var commentReport = results[0];

                if (!commentReport) {
                    return res.notFound();
                }

                var comment = commentReport.comment;
                var report = commentReport.report;

                // If Comment has been updated since the Report was made, deny moderation cause the text may have changed.
                if (comment.updatedAt.getTime() > report.createdAt.getTime()) {
                    return res.badRequest('Report has become invalid cause comment has been updated after the report', 10);
                }

                Comment
                    .findOne({
                        where: {
                            id: comment.id
                        },
                        include: [Topic]
                    })
                    .then(function (comment) {
                        var topic = comment.dataValues.Topics[0];
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
                                        id: eventTokenData.userId
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
                                            .spread(function (updated, comment) {
                                                comment = Comment.build(comment.dataValues);

                                                return cosActivities
                                                    .deleteActivity(comment, topic, {
                                                        type: 'Moderator',
                                                        id: eventTokenData.userId
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

    var topicMentionsList = function (req, res, next) {
        var hashtag = null;
        var queryurl = 'search/tweets';


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
            .error(function (err) {
                if (err.twitterReply) {
                    logger.error('Twitter error', req.method, req.path, req.user, err);

                    return [hashtagCache.get(hashtag)];
                }

                return Promise.reject(err);
            })
            .spread(function (data) {
                var mentions = [];
                if (data && data.statuses) {
                    logger.info('Twitter response', req.method, req.path, req.user, data.statuses.length);
                    _.forEach(data.statuses, function (m) {
                        var mTimeStamp = moment(m.created_at, 'ddd MMM DD HH:mm:ss ZZ YYYY');
                        mTimeStamp = mTimeStamp.format();

                        var status = {
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

                    var cachedMentions = {
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

    /**
     * Create a Comment Vote
     */
    app.post('/api/topics/:topicId/comments/:commentId/votes', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        var value = parseInt(req.body.value, 10);

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

                                    return cosActivities
                                        .updateActivity(vote, comment, {
                                            type: 'User',
                                            id: req.user.id
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
                                            return cosActivities
                                                .createActivity(cv, comment, {
                                                    type: 'User',
                                                    id: req.user.id
                                                }, req.method + ' ' + req.params, t);
                                        });
                                }
                            })
                            .catch(next);
                    })
                    .then(function () {
                        return db
                            .query(
                                ' \
                                SELECT  \
                                    COALESCE(SUM(cvu.value), 0) as "up.count", \
                                    COALESCE(ABS(SUM(cvd.value)), 0) as "down.count" \
                                FROM "TopicComments" tc \
                                    LEFT JOIN "CommentVotes" cvu ON (tc."commentId" = cvu."commentId" AND cvu.value > 0) \
                                    LEFT JOIN "CommentVotes" cvd ON (tc."commentId" = cvd."commentId" AND cvd.value < 0) \
                                WHERE tc."topicId" = :topicId \
                                  AND tc."commentId" = :commentId \
                                ',
                                {
                                    replacements: {
                                        topicId: req.params.topicId,
                                        commentId: req.params.commentId
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
        var voteOptions = req.body.options;

        if (!voteOptions || !Array.isArray(voteOptions) || voteOptions.length < 2) {
            return res.badRequest('At least 2 vote options are required', 1);
        }

        var authType = req.body.authType || Vote.AUTH_TYPES.soft;
        var delegationIsAllowed = req.body.delegationIsAllowed || false;

        // We cannot allow too similar options, otherwise the options are not distinguishable in the signed file
        if (authType === Vote.AUTH_TYPES.hard) {
            var voteOptionValues = _.map(voteOptions, 'value').map(function (value) {
                return sanitizeFilename(value).toLowerCase();
            });

            var uniqueValues = _.uniq(voteOptionValues);
            if (uniqueValues.length !== voteOptions.length) {
                return res.badRequest('Vote options are too similar', 2);
            }

            var reservedPrefix = VoteOption.RESERVED_PREFIX;
            uniqueValues.forEach(function (value) {
                if (value.substr(0, 2) === reservedPrefix) {
                    return res.badRequest('Vote option not allowed due to usage of reserved prefix "' + reservedPrefix + '"', 4);
                }
            });
        }


        if (authType === Vote.AUTH_TYPES.hard && delegationIsAllowed) {
            return res.badRequest('Delegation is not allowed for authType "' + authType + '"', 3);
        }

        var vote = Vote.build({
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
                        var voteOptionsCreated;

                        return cosActivities
                            .createActivity(
                                vote,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                req.method + ' ' + req.path,
                                t
                            )
                            .then(function () {
                                return vote
                                    .save({transaction: t});
                            })
                            .then(function () {
                                var voteOptionPromises = [];
                                _(voteOptions).forEach(function (o) {
                                    o.voteId = vote.id;
                                    var vopt = VoteOption.build(o);
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
                                            id: req.user.id
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
                                                            id: req.user.id
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
                                        id: req.user.id
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

                                return cosBdoc.createVoteFiles(topic, vote, voteOptionsCreated, t);
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
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;
        var userId = req.user.id;

        var voteInfoPromise = Vote
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
                            byUserId: req.user.id
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

        var voteResultsPromise = db
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
                                SELECT DISTINCT ON("voteId","userId") \
                                    vl."voteId", \
                                    vl."userId", \
                                    vl."optionGroupId", \
                                    vl."updatedAt" \
                                FROM "VoteLists" vl \
                                WHERE vl."voteId" = :voteId \
                                  AND vl."deletedAt" IS NULL \
                                ORDER BY "voteId", "userId", "createdAt" DESC, "optionGroupId" ASC \
                            ), \
                            votes("voteId", "userId", "optionId", "optionGroupId") AS ( \
                                SELECT \
                                    vl."voteId", \
                                    vl."userId", \
                                    vl."optionId", \
                                    vl."optionGroupId" \
                                FROM "VoteLists" vl \
                                JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."userId" = vg."userId" AND vl."optionGroupId" = vg."optionGroupId") \
                                WHERE vl."voteId" =  :voteId \
                            ), \
                            votes_with_delegations("voteId", "userId", "optionId", depth) AS ( \
                                SELECT \
                                    v."voteId", \
                                    v."userId", \
                                    v."optionId", \
                                    id."depth" \
                                FROM votes v \
                                LEFT JOIN indirect_delegations id ON (v."userId" = id."toUserId") \
                                WHERE v."userId" NOT IN (SELECT "byUserId" FROM indirect_delegations WHERE "voteId"=v."voteId") \
                            ) \
                        \
                        SELECT \
                            SUM(v."voteCount") as "voteCount", \
                            v."optionId", \
                            v."voteId", \
                            vo."value", \
                            (SELECT true FROM votes WHERE "userId" = :userId AND "optionId" = v."optionId") as "selected" \
                        FROM ( \
                            SELECT \
                                COUNT(v."optionId") + 1 as "voteCount", \
                                v."optionId", \
                                v."voteId" \
                            FROM votes_with_delegations v \
                            WHERE v.depth IS NOT NULL \
                            GROUP BY v."optionId", v."voteId" \
                            \
                            UNION ALL \
                            \
                            SELECT \
                                COUNT(v."optionId") as "voteCount", \
                                v."optionId", \
                                v."voteId" \
                            FROM votes_with_delegations v \
                            WHERE v.depth IS NULL \
                            GROUP BY v."optionId", v."voteId" \
                        ) v \
                        LEFT JOIN "VoteOptions" vo ON (v."optionId" = vo."id") \
                        GROUP BY v."optionId", v."voteId", vo."value" \
                ;',
                {
                    replacements: {
                        voteId: voteId,
                        userId: req.user.id
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );

        Promise
            .all([voteInfoPromise, voteResultsPromise])
            .spread(function (voteInfo, voteResults) {
                if (!voteInfo) {
                    return res.notFound();
                }

                var hasVoted = false;
                if (voteResults) {
                    voteInfo.dataValues.VoteOptions.forEach(function (option) {
                        var result = _.find(voteResults, {optionId: option.id});

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
                    var voteFinalURLParams = {
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
            })
            .catch(next);
    });

    /**
     * Update a Vote
     */
    app.put('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.admin), function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

        // Make sure the Vote is actually related to the Topic through which the permission was granted.
        var fields = ['endsAt'];

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

                var vote = topic.Votes[0];

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
                                id: req.user.id
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
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

        // TODO: Can be done in 1 query.
        var voteInfoPromise = Vote
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

        var voteResultsPromise = getVoteResults(voteId);

        Promise
            .all([voteInfoPromise, voteResultsPromise])
            .spread(function (voteInfo, voteResults) {
                if (!voteInfo) {
                    return res.notFound();
                }

                if (voteResults) {
                    _(voteInfo.dataValues.VoteOptions).forEach(function (option) {
                        var result = _.find(voteResults, {optionId: option.id});
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

    var handleTopicVotePreconditions = function (req, res) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

        var voteOptions = req.body.options;

        return Vote
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
            })
            .then(function (vote) {
                if (!vote) {
                    res.notFound();

                    return Promise.reject();
                }

                if (vote.endsAt && new Date() > vote.endsAt) {
                    res.badRequest('The Vote has ended.');

                    return Promise.reject();
                }

                if (!voteOptions || !Array.isArray(voteOptions) || voteOptions.length > vote.maxChoices || voteOptions.length < vote.minChoices) {
                    res.badRequest('The options must be an array of minimum :minChoices and maximum :maxChoices options.'
                        .replace(':minChoices', vote.minChoices)
                        .replace(':maxChoices', vote.maxChoices));

                    return Promise.reject();
                }

                return vote;
            });
    };

    var handleTopicVoteSoft = function (vote, req, res) {
        var voteId = vote.id;
        var userId = req.user.id;
        var topicId = req.params.topicId;

        var voteOptions = req.body.options;
        var target = vote.toJSON();
        target['@type'] = 'Vote';

        return db
            .transaction(function (t) {
                // Store vote options
                var optionGroupId = Math.random().toString(36).substring(2, 10);

                _(voteOptions).forEach(function (o) {
                    o.voteId = voteId;
                    o.userId = userId;
                    o.optionGroupId = optionGroupId;
                });

                var voteListCreatePromise = VoteList
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
                                var vl = [];
                                var tc = _.cloneDeep(topic.dataValues);
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
                                            id: req.user.id
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
                var voteDelegationDestroyPromise = VoteDelegation
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

    var handleTopicVoteHard = function (vote, req, res) {
        var voteId = vote.id;
        var topicId = req.params.topicId;
        var userId = req.user ? req.user.id : null;

        var voteOptions = req.body.options;

        //idCard
        var certificate = req.body.certificate;
        //mID
        var pid = req.body.pid;
        var phoneNumber = req.body.phoneNumber;

        var personalInfo;
        var signingMethod;

        if (!certificate && !(pid && phoneNumber)) {
            res.badRequest('Vote with hard authentication requires users certificate when signing with ID card OR phoneNumber+pid when signing with mID', 9);

            return Promise.reject();
        }

        var getCertificatePromise;

        if (certificate) {
            signingMethod = Vote.SIGNING_METHODS.idCard;
            getCertificatePromise = Promise.resolve({
                certificate: certificate,
                format: 'der'
            });
        } else {
            signingMethod = Vote.SIGNING_METHODS.mid;
            getCertificatePromise = cosBdoc
                .getMobileCertificate(pid, phoneNumber, 'sign')
                .then(function (certInfo) {
                    switch (certInfo.statusCode) {
                        case 0:
                            return {
                                certificate: certInfo.sign,
                                format: 'pem'
                            };
                        case 101:
                            res.badRequest('Invalid input parameters.', 20);

                            return Promise.reject();
                        case 301:
                            res.badRequest('User is not a Mobile-ID client. Please double check phone number and/or id code.', 21);

                            return Promise.reject();
                        case 302:
                            res.badRequest('User certificates are revoked or suspended.', 22);

                            return Promise.reject();
                        default:
                            logger.error('Unhandled DDS status code', certInfo.statusCode);
                            res.internalServerError();

                            return Promise.reject();
                    }
                });
        }

        var personalInfoPromise = getCertificatePromise
            .then(function (certificateInfo) {
                return cosBdoc
                    .getPersonalInfoFromCertificate(certificateInfo.certificate, certificateInfo.format)
                    .spread(function (status, personalInfoFromCertificate) {
                        switch (status) { //GOOD, UNKNOWN, EXPIRED, SUSPENDED, REVOKED
                            case 'GOOD':
                                personalInfo = personalInfoFromCertificate;
                                if (signingMethod === Vote.SIGNING_METHODS.mid) {
                                    personalInfo.phoneNumber = phoneNumber;
                                }

                                return;
                            case 'SUSPENDED':
                                res.badRequest('User certificate is suspended.', 24);

                                return Promise.reject();
                            case 'UNKNOWN':
                                res.badRequest('Unknown user certificate.', 26);

                                return Promise.reject();
                            case 'EXPIRED':
                            case 'REVOKED':
                                res.badRequest('User certificates are revoked or suspended.', 22);

                                return Promise.reject();
                            default:
                                logger.error('Unexpected certificate status from DDS', status);
                                res.internalServerError();

                                return Promise.reject();
                        }
                    });
            });

        return db
            .transaction(function (t) { // One big transaction, we don't want created User data to lay around in DB if the process failed.
                return personalInfoPromise
                    .then(function () {
                        var promisesToResolve = [];
                        // Authenticated User
                        if (userId) {
                            var anotherUserConnectionPromise = UserConnection
                                .findOne({
                                    where: {
                                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                                        connectionUserId: personalInfo.pid
                                    },
                                    transaction: t
                                })
                                .then(function (userConnection) {
                                    if (userConnection && userConnection.userId !== userId) {
                                        res.badRequest('Personal ID already connected to another user account.', 30);

                                        return Promise.reject();
                                    }
                                });

                            var userConnectionPromise = UserConnection
                                .findOne({
                                    where: {
                                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                                        userId: userId
                                    },
                                    transaction: t
                                })
                                .then(function (userConnection) {
                                    if (userConnection && userConnection.connectionUserId !== personalInfo.pid) {
                                        res.badRequest('User account already connected to another PID.', 31);

                                        return Promise.reject();
                                    }
                                });

                            promisesToResolve.push(anotherUserConnectionPromise, userConnectionPromise);
                        } else { // Un-authenticated User, find or create one.
                            // TODO: DUPLICATE CODE, also used in /api/auth/id
                            var userPromise = UserConnection
                                .findOne({
                                    where: {
                                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                                        connectionUserId: personalInfo.pid
                                    },
                                    include: [User],
                                    transaction: t
                                })
                                .then(function (userConnectionInfo) {
                                    if (!userConnectionInfo) {
                                        return User
                                            .create(
                                                {
                                                    name: db.fn('initcap', personalInfo.firstName + ' ' + personalInfo.lastName),
                                                    source: User.SOURCES.citizenos
                                                },
                                                {
                                                    transaction: t
                                                }
                                            )
                                            .then(function (user) {
                                                cosActivities
                                                    .createActivity(user, null, {type: 'System'}, req.method + ' ' + req.path, t)
                                                    .then(function () {
                                                        return UserConnection
                                                            .create(
                                                                {
                                                                    userId: user.id,
                                                                    connectionId: UserConnection.CONNECTION_IDS.esteid,
                                                                    connectionUserId: personalInfo.pid,
                                                                    connectionData: personalInfo
                                                                },
                                                                {
                                                                    transaction: t
                                                                }
                                                            )
                                                            .then(function () {
                                                                userId = user.id;
                                                            });
                                                    });
                                            });
                                    } else { // User existed before
                                        userId = userConnectionInfo.User.id;
                                    }
                                });

                            promisesToResolve.push(userPromise);
                        }

                        // Check that the personal ID is not related to another User account. We don't want Users signing Votes from different accounts.
                        return Promise
                            .all(promisesToResolve)
                            .then(function () {
                                switch (signingMethod) {
                                    case Vote.SIGNING_METHODS.idCard:
                                        return cosBdoc.signInitIdCard(topicId, voteId, userId, vote.VoteOptions, certificate, t);
                                    case Vote.SIGNING_METHODS.mid:
                                        return cosBdoc.signInitMobile(topicId, voteId, userId, vote.VoteOptions, personalInfo.pid, personalInfo.phoneNumber, t);
                                    default:
                                        throw new Error('Invalid signing method ' + signingMethod);
                                }
                            });
                    })
                    .then(function (signInitResponse) {
                        switch (signInitResponse.statusCode) {
                            case 0:
                                // Common to MID and ID-card signing
                                var sessionData = {
                                    sesscode: signInitResponse.sesscode,
                                    voteOptions: voteOptions,
                                    personalInfo: personalInfo,
                                    userId: userId, // Required for un-authenticated signing.
                                    voteId: voteId // saves one run of "handleTopicVotePreconditions" in the /sign
                                };

                                // ID card
                                if (signInitResponse.signatureId) {
                                    sessionData.signatureId = signInitResponse.signatureId;
                                }

                                // Send JWT with state and expect it back in /sign /status - https://trello.com/c/ZDN2WomW/287-bug-id-card-signing-does-not-work-for-some-users
                                // Wrapping sessionDataEncrypted in object, otherwise jwt.sign "expiresIn" will not work - https://github.com/auth0/node-jsonwebtoken/issues/166
                                var sessionDataEncrypted = {sessionDataEncrypted: objectEncrypter(config.session.secret).encrypt(sessionData)};
                                var token = jwt.sign(sessionDataEncrypted, config.session.privateKey, {
                                    expiresIn: '5m',
                                    algorithm: config.session.algorithm
                                });

                                if (signingMethod === Vote.SIGNING_METHODS.idCard) {
                                    return res.ok({
                                        signedInfoDigest: signInitResponse.signedInfoDigest,
                                        signedInfoHashType: cryptoLib.getHashType(signInitResponse.signedInfoDigest),
                                        token: token
                                    }, 1);
                                } else {
                                    return res.ok({
                                        challengeID: signInitResponse.challengeID,
                                        token: token
                                    }, 1);
                                }
                            case 101:
                                res.badRequest('Invalid input parameters.', 20);

                                return Promise.reject();
                            case 301:
                                res.badRequest('User is not a Mobile-ID client. Please double check phone number and/or id code.', 21);

                                return Promise.reject();
                            case 302:
                                res.badRequest('User certificates are revoked or suspended.', 22);

                                return Promise.reject();
                            case 303:
                                res.badRequest('User certificate is not activated.', 23);

                                return Promise.reject();
                            case 304:
                                res.badRequest('User certificate is suspended.', 24);

                                return Promise.reject();
                            case 305:
                                res.badRequest('User certificate is expired.', 25);

                                return Promise.reject();
                            default:
                                logger.error('Unhandled DDS status code', signInitResponse.statusCode);
                                res.internalServerError();

                                return Promise.reject();
                        }
                    });
            });
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
            .catch(next);
    });


    var handleTopicVoteSign = function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

        var token = req.body.token;
        var signatureValue = req.body.signatureValue;

        if (!token) {
            logger.warn('Missing requried parameter "token"', req.ip, req.path, req.headers);

            return res.badRequest('Missing required parameter "token"');
        }

        if (!signatureValue) {
            return res.badRequest('Missing signature', 1);
        }

        var tokenData;
        var idSignFlowData;

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

        var userId = req.user ? req.user.id : idSignFlowData.userId; // Auth has User in session, but un-authenticated in idSignFlowData

        // POST /votes/:voteId checks that Vote belongs to Topic using "handleTopicVotePreconditions". It sets it in the sign flow data so we would not have to call "handleTopicVotePreconditions" again.
        if (voteId !== idSignFlowData.voteId) {
            logger.warn('Invalid token provider for vote.', voteId, idSignFlowData.voteId);

            return res.badRequest('Invalid token for the vote');
        }

        return db
            .transaction(function (t) {
                // Store vote options
                var voteOptions = idSignFlowData.voteOptions;

                var optionGroupId = Math.random().toString(36).substring(2, 10);

                var promisesToResolve = [];

                _(voteOptions).forEach(function (o) {
                    o.voteId = voteId;
                    o.userId = userId;
                    o.optionGroupId = optionGroupId;
                });

                // Authenticated User signing, check the user connection
                if (req.user) {
                    var anotherUserConnectionPromise = UserConnection
                        .findOne({
                            where: {
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: idSignFlowData.personalInfo.pid
                            },
                            transaction: t
                        })
                        .then(function (userConnection) {
                            if (userConnection && userConnection.userId !== userId) {
                                res.badRequest('Personal ID already connected to another user account.', 30);

                                return Promise.reject();
                            }
                        });

                    var userConnectionPromise = UserConnection
                        .findOne({
                            where: {
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                userId: userId
                            },
                            transaction: t
                        })
                        .then(function (userConnection) {
                            if (userConnection && userConnection.connectionUserId !== idSignFlowData.personalInfo.pid) {
                                res.badRequest('User account already connected to another PID.', 31);

                                return Promise.reject();
                            }
                        });

                    promisesToResolve.push(anotherUserConnectionPromise, userConnectionPromise);
                }

                var voteListCreatePromise = VoteList
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
                                var vl = [];
                                var tc = _.cloneDeep(topic.dataValues);
                                tc.description = null;
                                tc = Topic.build(tc);

                                voteList.forEach(function (el, key) {
                                    delete el.dataValues.optionId;
                                    delete el.dataValues.optionGroupId;
                                    el = VoteList.build(el.dataValues);
                                    vl[key] = el;
                                });

                                var actor = {type: 'User'};
                                if (userId) {
                                    actor.id = userId;
                                }

                                return cosActivities
                                    .createActivity(
                                        vl,
                                        tc,
                                        actor,
                                        req.method + ' ' + req.path,
                                        t
                                    )
                                    .then(function () {
                                        return voteList;
                                    });
                            });

                    });

                // Delete delegation if you are voting - TODO: why is this here? You cannot delegate when authType === 'hard'
                var voteDelegationDestroyPromise = VoteDelegation
                    .destroy({
                        where: {
                            voteId: voteId,
                            byUserId: userId
                        },
                        force: true,
                        transaction: t
                    });

                var userConnectionAddPromise = UserConnection
                    .upsert(
                        {
                            userId: userId,
                            connectionId: UserConnection.CONNECTION_IDS.esteid,
                            connectionUserId: idSignFlowData.personalInfo.pid,
                            connectionData: idSignFlowData.personalInfo
                        },
                        {
                            transaction: t
                        }
                    );

                var signUserBdocPromise = cosBdoc
                    .signUserBdoc(idSignFlowData.sesscode, idSignFlowData.signatureId, signatureValue)
                    .then(function (signedDocument) {
                        return VoteUserContainer
                            .upsert(
                                {
                                    userId: userId,
                                    voteId: voteId,
                                    container: signedDocument
                                },
                                {
                                    transaction: t
                                }
                            );
                    });

                promisesToResolve.push(voteListCreatePromise, voteDelegationDestroyPromise, userConnectionAddPromise, signUserBdocPromise);

                return Promise.all(promisesToResolve);
            })
            .spread(function () {
                return res.ok({
                    bdocUri: getBdocURL({
                        userId: userId,
                        topicId: topicId,
                        voteId: voteId,
                        type: 'user'
                    })
                });
            })
            .catch(next);
    };

    /**
     * Sign a Vote
     *
     * Complete the ID-card signing flow started by calling POST /api/users/:userId/topics/:topicId/votes/:voteId
     */
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId/sign', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.voting]), handleTopicVoteSign);


    var handleTopicVoteStatus = function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

        var token = req.query.token;

        if (!token) {
            logger.warn('Missing requried parameter "token"', req.ip, req.path, req.headers);

            return res.badRequest('Missing required parameter "token"');
        }

        var tokenData;
        var idSignFlowData;

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


        var userId = req.user ? req.user.id : idSignFlowData.userId;

        cosBdoc
            .getMobileSignedDoc(idSignFlowData.sesscode)
            .then(function (signedDocInfo) {
                return db
                    .transaction(function (t) {
                        // Store vote options
                        var voteOptions = idSignFlowData.voteOptions;

                        var optionGroupId = Math.random().toString(36).substring(2, 10);

                        var promisesToResolve = [];

                        _(voteOptions).forEach(function (o) {
                            o.voteId = voteId;
                            o.userId = userId;
                            o.optionGroupId = optionGroupId;
                        });

                        // Authenticated User signing, check the user connection
                        if (req.user) {
                            var anotherUserConnectionPromise = UserConnection
                                .findOne({
                                    where: {
                                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                                        connectionUserId: idSignFlowData.personalInfo.pid
                                    },
                                    transaction: t
                                })
                                .then(function (userConnection) {
                                    if (userConnection && userConnection.userId !== userId) {
                                        res.badRequest('Personal ID already connected to another user account.', 30);

                                        return Promise.reject();
                                    }
                                });

                            var userConnectionPromise = UserConnection
                                .findOne({
                                    where: {
                                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                                        userId: userId
                                    },
                                    transaction: t
                                })
                                .then(function (userConnection) {
                                    if (userConnection && userConnection.connectionUserId !== idSignFlowData.personalInfo.pid) {
                                        res.badRequest('User account already connected to another PID.', 31);

                                        return Promise.reject();
                                    }
                                });

                            promisesToResolve.push(anotherUserConnectionPromise, userConnectionPromise);
                        }

                        var voteListCreatePromise = VoteList
                            .bulkCreate(
                                voteOptions,
                                {
                                    fields: ['optionId', 'voteId', 'userId', 'optionGroupId'],
                                    transaction: t
                                }
                            ).then(function (voteList) {
                                return Topic
                                    .findOne({
                                        where: {
                                            id: topicId
                                        },
                                        transaction: t
                                    })
                                    .then(function (topic) {
                                        var vl = [];
                                        var tc = _.cloneDeep(topic.dataValues);
                                        tc.description = null;
                                        tc = Topic.build(tc);

                                        voteList.forEach(function (el, key) {
                                            delete el.dataValues.optionId;
                                            delete el.dataValues.optionGroupId;
                                            el = VoteList.build(el.dataValues);
                                            vl[key] = el;
                                        });
                                        var actor = {type: 'User'};
                                        if (userId) {
                                            actor.id = userId;
                                        }

                                        return cosActivities
                                            .createActivity(
                                                vl,
                                                tc,
                                                actor,
                                                req.method + ' ' + req.path,
                                                t
                                            )
                                            .then(function () {
                                                return voteList;
                                            });
                                    });

                            });

                        // Delete delegation if you are voting - TODO: why is this here? You cannot delegate for authType === 'hard' anyway
                        var voteDelegationDestroyPromise = VoteDelegation
                            .destroy({
                                where: {
                                    voteId: voteId,
                                    byUserId: userId
                                },
                                force: true,
                                transaction: t
                            });

                        var userConnectionAddPromise = UserConnection
                            .upsert(
                                {
                                    userId: userId,
                                    connectionId: UserConnection.CONNECTION_IDS.esteid,
                                    connectionUserId: idSignFlowData.personalInfo.pid,
                                    connectionData: _.merge(idSignFlowData.personalInfo, signedDocInfo.signerInfo) // When starting signing with Mobile-ID we have no full name, thus we need to fetch and update
                                },
                                {
                                    transaction: t
                                }
                            );

                        var voteUserContainerPromise = VoteUserContainer
                            .upsert(
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
                            var userNameUpdatePromise = User
                                .update(
                                    {
                                        name: db.fn('initcap', signedDocInfo.signerInfo.firstName + ' ' + signedDocInfo.signerInfo.lastName)
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

                            promisesToResolve.push(userNameUpdatePromise);
                        }

                        promisesToResolve.push(voteListCreatePromise, voteDelegationDestroyPromise, userConnectionAddPromise, voteUserContainerPromise);

                        return Promise.all(promisesToResolve);
                    });
            }, function (statusCode) {
                switch (statusCode) {
                    case 'OUTSTANDING_TRANSACTION':
                        res.ok('Signing in progress', 1);

                        return Promise.reject();
                    case 'USER_CANCEL':
                        res.badRequest('User has cancelled the signing process', 10);

                        return Promise.reject();
                    case 'EXPIRED_TRANSACTION':
                        res.badRequest('The transaction has expired', 11);

                        return Promise.reject();
                    case 'NOT_VALID':
                        res.badRequest('Signature is not valid', 12);

                        return Promise.reject();
                    case 'MID_NOT_READY':
                        res.badRequest('Mobile-ID functionality of the phone is not yet ready', 13);

                        return Promise.reject();
                    case 'PHONE_ABSENT':
                        res.badRequest('Delivery of the message was not successful, mobile phone is probably switched off or out of coverage;', 14);

                        return Promise.reject();
                    case 'SENDING_ERROR':
                        res.badRequest('Other error when sending message (phone is incapable of receiving the message, error in messaging server etc.)', 15);

                        return Promise.reject();
                    case 'SIM_ERROR':
                        res.badRequest('SIM application error.', 16);

                        return Promise.reject();
                    case 'REVOKED_CERTIFICATE':
                        res.badRequest('Certificate has been revoked', 17);

                        return Promise.reject();
                    case 'INTERNAL_ERROR':
                        logger.error('Unknown error when trying to sign with mobile', statusCode);
                        res.internalServerError('DigiDocService error', 1);

                        return Promise.reject();
                    default:
                        logger.error('Unknown status code when trying to sign with mobile', statusCode);
                        res.internalServerError();

                        return Promise.reject();
                }
            })
            .then(function () {
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
            }, _.noop)
            .error(next);
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
    app.get(['/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/user', '/api/topics/:topicId/votes/:voteId/downloads/bdocs/user'], function (req, res, next) {
        var voteId = req.params.voteId;
        var token = req.query.token;

        if (!token) {
            return res.badRequest('Missing required parameter "token"');
        }

        var downloadTokenData;

        try {
            downloadTokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                return res.unauthorised('JWT token has expired');
            } else {
                logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                return res.unauthorised('Invalid JWT token');
            }
        }

        var userId = downloadTokenData.userId;

        if (req.path !== downloadTokenData.path) {
            logger.warn('Invalid token used to access path', req.path, '. Token was issued for path', downloadTokenData.path);

            return res.unauthorised('Invalid JWT token');
        }

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

                var container = voteUserContainer.dataValues.container;
                delete voteUserContainer.dataValues.container;
                var actor = {type: 'User'};
                if (req.user && req.user.id) {
                    actor.id = req.user.id;
                }

                return cosActivities
                    .viewActivity(
                        voteUserContainer,
                        actor,
                        req.method + ' ' + req.path
                    )
                    .then(function () {
                        res.set('Content-disposition', 'attachment; filename=vote.bdoc');
                        res.set('Content-type', 'application/vnd.etsi.asic-e+zip');
                        res.send(container);
                    });

            })
            .catch(next);
    });

    var topicDownloadBdocFinal = function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

        var token = req.query.token;

        if (!token) {
            return res.badRequest('Missing required parameter "token"');
        }

        try {
            var downloadTokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                return res.unauthorised('JWT token has expired');
            } else {
                logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                return res.unauthorised('Invalid JWT token');
            }
        }

        if (req.path !== downloadTokenData.path) {
            logger.warn('Invalid token used to access path', req.path, '. Token was issued for path', downloadTokenData.path);

            return res.unauthorised('Invalid JWT token');
        }

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
                            authType: Vote.AUTH_TYPES.hard
                        }
                    }
                ]
            })
            .then(function (topic) {
                var vote = topic.Votes[0];

                // TODO: Once we implement the the "endDate>now -> followUp" we can remove Topic.STATUSES.voting check
                if ((vote.endsAt && vote.endsAt.getTime() > new Date().getTime() && topic.status === Topic.STATUSES.voting) || topic.status === Topic.STATUSES.voting) {
                    res.badRequest('The Vote has not ended.');

                    return Promise.reject();
                }

                if (req.query.accept === 'application/x-7z-compressed') {
                    res.set('Content-disposition', 'attachment; filename=final.7z');
                    res.set('Content-type', 'application/x-7z-compressed');

                    return cosBdoc.getFinalBdoc(topicId, voteId, true);
                } else {
                    res.set('Content-disposition', 'attachment; filename=final.bdoc');
                    res.set('Content-type', 'application/vnd.etsi.asic-e+zip');

                    return cosBdoc.getFinalBdoc(topicId, voteId);
                }
            })
            .then(function (finalDocStream) {
                return finalDocStream.pipe(res);
            })
            .catch(next);
    };

    /**
     * Download final vote Zip container
     */

    var topicDownloadZipFinal = function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

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
                var vote = topic.Votes[0];

                // TODO: Once we implement the the "endDate>now -> followUp" we can remove Topic.STATUSES.voting check
                if ((vote.endsAt && vote.endsAt.getTime() > new Date().getTime() && topic.status === Topic.STATUSES.voting) || topic.status === Topic.STATUSES.voting) {
                    res.badRequest('The Vote has not ended.');

                    return Promise.reject();
                }

                res.set('Content-disposition', 'attachment; filename=final.zip');
                res.set('Content-type', 'application/zip');

                return cosBdoc.getFinalZip(topicId, voteId, true);
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
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId/delegations', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.voting]), function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;

        var toUserId = req.body.userId;

        if (req.user.id === toUserId) {
            return res.badRequest('Cannot delegate to self.');
        }

        return _hasPermission(topicId, toUserId, TopicMemberUser.LEVELS.read, false, null, null, req.user.partnerId)
            .then(
                function () {
                    return Vote
                        .findOne({
                            where: {id: voteId},
                            include: [
                                {
                                    model: Topic,
                                    where: {id: topicId}
                                }
                            ]
                        })
                        .then(function (vote) {
                            if (!vote) {
                                res.notFound();

                                return Promise.reject();
                            }

                            if (vote.endsAt && new Date() > vote.endsAt) {
                                res.badRequest('The Vote has ended.');

                                return Promise.reject();
                            }

                            return db
                                .transaction(function (t) {
                                    return db
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
                                        )
                                        .then(
                                            function (result) {
                                                var delegation = VoteDelegation.build(result[0][0]);

                                                return cosActivities
                                                    .createActivity(
                                                        delegation,
                                                        vote,
                                                        {
                                                            type: 'User',
                                                            id: req.user.id
                                                        },
                                                        req.method + ' ' + req.path,
                                                        t
                                                    );
                                            },
                                            function (err) {
                                                // HACK: Forcing division by zero when cyclic delegation is detected. Cannot use result check as both update and cyclic return [].
                                                if (err.parent.code === '22012') {
                                                    // Cyclic delegation detected.
                                                    return res.badRequest('Sorry, you cannot delegate your vote to this person.');
                                                }
                                                // Don't hide other errors
                                                throw err;
                                            }
                                        );
                                });
                        });
                },
                function (err) {
                    if (err) {
                        return next(err);
                    }

                    return res.badRequest('Cannot delegate Vote to User who does not have access to this Topic.');
                }
            )
            .then(function () {
                return res.ok();
            })
            .catch(function (err) {
                next(err);
            });
    });


    /**
     * Delete Vote delegation
     */
    app.delete('/api/users/:userId/topics/:topicId/votes/:voteId/delegations', loginCheck(['partner']), hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.voting]), function (req, res, next) {
        var topicId = req.params.topicId;
        var voteId = req.params.voteId;
        var userId = req.user.id;

        Vote
            .findOne({
                where: {id: voteId},
                include: [
                    {
                        model: Topic,
                        where: {id: topicId}
                    }
                ]
            })
            .then(function (vote) {
                if (vote.endsAt && new Date() > vote.endsAt) {
                    res.badRequest('The Vote has ended.');

                    return Promise.reject();
                } else {
                    return vote;
                }
            })
            .then(function (vote) {
                return VoteDelegation
                    .findOne({
                        where: {
                            voteId: voteId,
                            byUserId: userId
                        }
                    })
                    .then(function (delegation) {
                        return db
                            .transaction(function (t) {
                                return cosActivities
                                    .deleteActivity(
                                        delegation,
                                        vote,
                                        {
                                            type: 'User',
                                            id: req.user.id
                                        },
                                        req.method + ' ' + req.path,
                                        t
                                    )
                                    .then(function () {
                                        return delegation
                                            .destroy({
                                                force: true,
                                                transaction: t
                                            });
                                    });
                            });
                    });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

    var topicEventsCreate = function (req, res, next) {
        var topicId = req.params.topicId;

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
                                var actor = {type: 'User'};

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


    var topicEventsList = function (req, res, next) {
        var topicId = req.params.topicId;

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
        var topicId = req.params.topicId;
        var eventId = req.params.eventId;

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
                                id: req.user.id
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
        var userId = req.user.id;
        var topicId = req.params.topicId;

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
                    .spread(function (topicPin, created) {
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
                                                id: userId
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
        var userId = req.user.id;
        var topicId = req.params.topicId;

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
                                                id: req.user.id
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
};
