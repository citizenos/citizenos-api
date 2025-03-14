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
    const validator = app.get('validator');
    const util = app.get('util');
    const urlLib = app.get('urlLib');
    const emailLib = app.get('email');
    const cosSignature = app.get('cosSignature');
    const cosActivities = app.get('cosActivities');

    const cosEtherpad = app.get('cosEtherpad');

    const CosHtmlToDocx = app.get('cosHtmlToDocx');
    const https = require('https');
    const path = require('path');
    const stream = require('stream');
    const fs = require('fs');

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const partnerParser = app.get('middleware.partnerParser');
    const speedLimiter = app.get('speedLimiter');
    const rateLimiter = app.get('rateLimiter');
    const cosUpload = app.get('cosUpload');

    const User = models.User;
    const UserConnection = models.UserConnection;
    const Group = models.Group;
    const Topic = models.Topic;
    const Discussion = models.Discussion;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicMemberGroup = models.TopicMemberGroup;
    const TopicJoin = models.TopicJoin;
    const TopicReport = models.TopicReport;
    const TopicInviteUser = models.TopicInviteUser;

    const Vote = models.Vote;


    const TopicEvent = models.TopicEvent;

    const TopicAttachment = models.TopicAttachment;
    const Attachment = models.Attachment;
    const TopicFavourite = models.TopicFavourite;
    const UserNotificationSettings = models.UserNotificationSettings;

    const Ideation = models.Ideation;
    const topicService = require('../../services/topic')(app);
    const voteService = require('../../services/vote')(app);

    const _topicReadUnauth = async function (topicId, include) {
        await topicService.syncTopicAuthors(topicId); // TODO: On every public topic read we sync authors with EP, can we do better?

        let join = '';
        let returncolumns = '';
        if (include) {
            if (include.indexOf('ideation') > -1) {
                returncolumns += `
                    , ti."question" as "ideation.question"
                    , ti."deadline" as "ideation.deadline"
                    , ti."creatorId" as "ideation.creatorId"
                    , ti."createdAt" as "ideation.createdAt"
                `;
            }
            if (include.indexOf('vote') > -1) {
                join += `
                LEFT JOIN (
                    SELECT "voteId", to_json(array(
                        SELECT CONCAT(id, ':', value, ':', "ideaId")
                        FROM "VoteOptions"
                        WHERE "deletedAt" IS NULL AND vo."voteId"="voteId"
                    )) as "optionIds"
                    FROM "VoteOptions" vo
                    WHERE vo."deletedAt" IS NULL
                    GROUP BY "voteId"
                ) AS vo ON vo."voteId"=tv."voteId" `;

                returncolumns += `
                    , vo."optionIds" as "vote.options"
                    , tv."voteId" as "vote.id"
                    , tv."authType" as "vote.authType"
                    , tv."createdAt" as "vote.createdAt"
                    , tv."delegationIsAllowed" as "vote.delegationIsAllowed"
                    , tv."description" as "vote.description"
                    , tv."endsAt" as "vote.endsAt"
                    , tv."reminderSent" AS "vote.reminderSent"
                    , tv."reminderTime" AS "vote.reminderTime"
                    , tv."maxChoices" as "vote.maxChoices"
                    , tv."minChoices" as "vote.minChoices"
                    , tv."type" as "vote.type"
                    , tv."autoClose" as "vote.autoClose"
                `;
            }
            if (include.indexOf('event') > -1) {
                join += `
                    LEFT JOIN (
                        SELECT COUNT(events.id) as count,
                        events."topicId"
                        FROM "TopicEvents" events
                        WHERE events."topicId" = :topicId
                        AND events."deletedAt" IS NULL
                        GROUP BY events."topicId"
                    ) as te ON te."topicId" = t.id
                    `;
                returncolumns += `
                    , COALESCE(te.count, 0) AS "events.count"
                    `;
            }
        }

        const [topic] = await db
            .query(
                `SELECT
                     t.id,
                     t.title,
                     t.intro,
                     t.description,
                     t.status,
                     t.visibility,
                     t.categories,
                     t.contact,
                     t.country,
                     t."imageUrl",
                     t.language,
                     t."endsAt",
                     t."padUrl",
                     t."sourcePartnerId",
                     t."sourcePartnerObjectId",
                     t."updatedAt",
                     t."createdAt",
                     t."hashtag",
                     c.id as "creator.id",
                     c.name as "creator.name",
                     c.company as "creator.company",
                     'none' as "permission.level",
                     muc.count as "members.users.count",
                     COALESCE(mgc.count, 0) as "members.groups.count",
                     tv."voteId",
                     td."discussionId",
                     ti."ideationId",
                     tr."id" AS "report.id",
                     tr."moderatedReasonType" AS "report.moderatedReasonType",
                     tr."moderatedReasonText" AS "report.moderatedReasonText",
                     au.authors
                     ${returncolumns}
                FROM "Topics" t
                    LEFT JOIN "Users" c ON (c.id = t."creatorId")
                    LEFT JOIN (
                        SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM (
                            SELECT
                                tmuu."topicId",
                                tmuu."userId" AS "memberId"
                            FROM "TopicMemberUsers" tmuu
                            WHERE tmuu."deletedAt" IS NULL
                            UNION
                            SELECT
                                tmg."topicId",
                                gm."userId" AS "memberId"
                            FROM "TopicMemberGroups" tmg
                                LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                                JOIN "Groups" gr on gr.id = tmg."groupId"
                            WHERE tmg."deletedAt" IS NULL
                            AND gm."deletedAt" IS NULL
                            AND gr."deletedAt" IS NULL
                        ) AS tmu GROUP BY "topicId"
                    ) AS muc ON (muc."topicId" = t.id)
                    LEFT JOIN (
                        SELECT tmgc."topicId", count(tmgc."groupId") AS "count"
                        FROM "TopicMemberGroups" tmgc
                        JOIN "Groups" gc
                            ON gc.id = tmgc."groupId"
                        WHERE tmgc."deletedAt" IS NULL
                        AND gc."deletedAt" IS NULL
                        GROUP BY tmgc."topicId"
                    ) AS mgc ON (mgc."topicId" = t.id)
                    LEFT JOIN (
                        SELECT
                            t.id as "topicId",
                            json_agg(u) as authors
                        FROM
                        "Topics" t
                        LEFT JOIN (SELECT id,  name FROM "Users") AS u
                        ON
                        u.id IN (SELECT unnest(t."authorIds"))
                        GROUP BY t.id
                    ) AS au ON au."topicId" = t.id
                    LEFT JOIN (
                        SELECT
                            tv."topicId",
                            tv."voteId",
                            v."authType",
                            v."createdAt",
                            v."delegationIsAllowed",
                            v."description",
                            v."endsAt",
                            v."reminderSent",
                            v."reminderTime",
                            v."maxChoices",
                            v."minChoices",
                            v."type",
                            v."autoClose"
                        FROM "TopicVotes" tv INNER JOIN
                            (
                                SELECT
                                    MAX("createdAt") as "createdAt",
                                    "topicId"
                                FROM "TopicVotes"
                                GROUP BY "topicId"
                            ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt")
                        LEFT JOIN "Votes" v
                                ON v.id = tv."voteId"
                    ) AS tv ON (tv."topicId" = t.id)
                    LEFT JOIN "TopicDiscussions" td ON td."topicId"=t.id
                    LEFT JOIN (
                        SELECT
                            ti."topicId",
                            ti."ideationId",
                            i."createdAt",
                            i."deadline",
                            i."creatorId"
                        FROM "TopicIdeations" ti INNER JOIN
                            (
                                SELECT
                                    MAX("createdAt") as "createdAt",
                                    "topicId"
                                FROM "TopicIdeations"
                                GROUP BY "topicId"
                            ) AS _ti ON (_ti."topicId" = ti."topicId" AND _ti."createdAt" = ti."createdAt")
                        LEFT JOIN "Ideations" i
                                ON i.id = ti."ideationId"
                    ) AS ti ON (ti."topicId" = t.id)
                    LEFT JOIN "TopicReports" tr ON (tr."topicId" = t.id AND tr."resolvedById" IS NULL AND tr."deletedAt" IS NULL)
                    ${join}
                WHERE t.id = :topicId
                  AND t.visibility = 'public'
                  AND t."deletedAt" IS NULL
                  `,
                {
                    replacements: {
                        topicId: topicId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        if (!topic || (topic.visibility !== 'public' && topic.permission.level === TopicMemberUser.LEVELS.none)) {
            return;
        }

        topic.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });
        try {
            topic.revision = (await cosEtherpad.topicPadRevisions(topicId)).revisions;
        } catch {
            logger.error('Failed to get topic pad revisions');
            topic.revision = [];
        }
        if (include && include.indexOf('vote') > -1 && topic.vote?.id) {
            const voteResults = await voteService.getVoteResults(topic.vote.id);
            const options = [];

            topic.vote.options.forEach((option) => {
                option = option.split(':');
                const o = {
                    id: option[0],
                    value: option[1],
                    ideaId: option[2] || null
                };
                if (voteResults?.length) {
                    const res = voteResults.find(opt => opt.optionId === o.id);
                    if (res) {
                        o.voteCount = res.voteCount;
                    }
                }
                options.push(o);
            });

            if (voteResults?.length) {
                topic.vote.votersCount = voteResults[0].votersCount;
            }

            topic.vote.options = {
                count: options.length,
                rows: options
            };

            if (!topic.report.id) {
                delete topic.report;
            }
        } else {
            delete topic.vote;

            if (!topic.report.id) {
                delete topic.report;
            }
        }

        return topic;
    };

    const _topicReadAuth = async function (topicId, include, user, partner) {
        await topicService.syncTopicAuthors(topicId);

        let join = '';
        let returncolumns = '';
        let authorColumns = ' u.id, u.name ';

        if (include && !Array.isArray(include)) {
            include = [include];
        }

        if (include) {
            if (include.indexOf('ideation') > -1) {
                returncolumns += `
                    , ti."question" as "ideation.question"
                    , ti."deadline" as "ideation.deadline"
                    , ti."creatorId" as "ideation.creatorId"
                    , ti."createdAt" as "ideation.createdAt"
                `;
            }
            if (include.indexOf('vote') > -1) {
                join += `
                    LEFT JOIN (
                        SELECT "voteId", to_json(array(
                            SELECT CONCAT(id, ':', value, ':', "ideaId")
                            FROM "VoteOptions"
                            WHERE "deletedAt" IS NULL AND vo."voteId"="voteId"
                        )) as "optionIds"
                        FROM "VoteOptions" vo
                        WHERE vo."deletedAt" IS NULL
                        GROUP BY "voteId"
                    ) AS vo ON vo."voteId"=tv."voteId" `;
                returncolumns += `
                    , vo."optionIds" as "vote.options"
                    , tv."voteId" as "vote.id"
                    , tv."authType" as "vote.authType"
                    , tv."createdAt" as "vote.createdAt"
                    , tv."reminderSent" AS "vote.reminderSent"
                    , tv."reminderTime" AS "vote.reminderTime"
                    , tv."delegationIsAllowed" as "vote.delegationIsAllowed"
                    , tv."description" as "vote.description"
                    , tv."endsAt" as "vote.endsAt"
                    , tv."maxChoices" as "vote.maxChoices"
                    , tv."minChoices" as "vote.minChoices"
                    , tv."type" as "vote.type"
                    , tv."autoClose" as "vote.autoClose"
                    `;
            }

            if (include.indexOf('event') > -1) {
                join += `
                    LEFT JOIN (
                        SELECT COUNT(events.id) as count,
                        events."topicId"
                        FROM "TopicEvents" events
                        WHERE events."topicId" = :topicId
                        AND events."deletedAt" IS NULL
                        GROUP BY events."topicId"
                    ) as te ON te."topicId" = t.id
                `;
                returncolumns += `
                    , COALESCE(te.count, 0) AS "events.count"
                `;
            }
        }

        if (user.moderator) {
            returncolumns += `
            , c.email as "creator.email"
            , uc."connectionData" AS "creator.connectionData"
            `;

            returncolumns += `
            , tr."type" AS "report.type"
            , tr."text" AS "report.text"
            `;
            authorColumns += `
            , u.email
            `;
        }

        const result = await db.query(
            `SELECT
                    t.id,
                    t.title,
                    t.description,
                    t.intro,
                    t.status,
                    t.visibility,
                    t."imageUrl",
                    t.hashtag,
                    t.country,
                    t.contact,
                    t.language,
                    tj.token as "join.token",
                    tj.level as "join.level",
                    CASE
                    WHEN tf."topicId" = t.id THEN true
                    ELSE false
                    END as "favourite",
                    t.categories,
                    t."endsAt",
                    t."padUrl",
                    t."sourcePartnerId",
                    t."sourcePartnerObjectId",
                    t."createdAt",
                    t."updatedAt",
                    c.id as "creator.id",
                    c.name as "creator.name",
                    c.company as "creator.company",
                    COALESCE(
                        tmup.level,
                        tmgp.level,
                            'none'
                    ) as "permission.level",
                    muc.count as "members.users.count",
                    COALESCE(mgc.count, 0) as "members.groups.count",
                    tv."voteId",
                    td."discussionId",
                    ti."ideationId",
                    u.id as "user.id",
                    u.name as "user.name",
                    u.language as "user.language",
                    tr.id AS "report.id",
                    tr."moderatedReasonType" AS "report.moderatedReasonType",
                    tr."moderatedReasonText" AS "report.moderatedReasonText",
                    au.authors
                    ${returncolumns}
                FROM "Topics" t
                    LEFT JOIN (
                    SELECT
                        tmu."topicId",
                        tmu."userId",
                        tmu.level::text AS level
                    FROM "TopicMemberUsers" tmu
                    WHERE tmu."deletedAt" IS NULL
                ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                LEFT JOIN (
                    SELECT
                        tmg."topicId",
                        gm."userId",
                        CASE WHEN t.status= 'draft' AND MAX(tmg.level) < 'edit' THEN 'none'
                        ELSE MAX(tmg.level)::text END AS level
                    FROM "TopicMemberGroups" tmg
                        LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        JOIN "Topics" t ON t.id=tmg."topicId"
                    WHERE tmg."deletedAt" IS NULL
                    AND gm."deletedAt" IS NULL
                    GROUP BY "topicId", "userId", t.status
                ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
                LEFT JOIN "Users" c ON (c.id = t."creatorId")
                LEFT JOIN "UserConnections" uc ON (uc."userId" = t."creatorId")
                LEFT JOIN (
                    SELECT
                        t.id AS "topicId",
                        json_agg(u) as authors
                    FROM
                    "Topics" t
                    LEFT JOIN (SELECT ${authorColumns} FROM "Users" u ) u
                    ON
                    u.id IN (SELECT unnest(t."authorIds"))
                    GROUP BY t.id
                ) AS au ON au."topicId" = t.id
                LEFT JOIN (
                    SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM (
                        SELECT
                            tmuu."topicId",
                            tmuu."userId" AS "memberId"
                        FROM "TopicMemberUsers" tmuu
                        WHERE tmuu."deletedAt" IS NULL
                        UNION
                        SELECT
                            tmg."topicId",
                            gm."userId" AS "memberId"
                        FROM "TopicMemberGroups" tmg
                            LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                            JOIN "Groups" gr ON gr.id = tmg."groupId"
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                        AND gr."deletedAt" IS NULL
                    ) AS tmu GROUP BY "topicId"
                ) AS muc ON (muc."topicId" = t.id)
                LEFT JOIN (
                    SELECT "topicId", count("groupId") AS "count"
                    FROM "TopicMemberGroups" tmg
                    JOIN "Groups" g ON tmg."groupId" = g.id
                    WHERE tmg."deletedAt" IS NULL
                    AND g."deletedAt" IS NULL
                    GROUP BY "topicId"
                ) AS mgc ON (mgc."topicId" = t.id)
                LEFT JOIN "Users" u ON (u.id = :userId)
                LEFT JOIN (
                    SELECT
                        tv."topicId",
                        tv."voteId",
                        v."authType",
                        v."createdAt",
                        v."delegationIsAllowed",
                        v."description",
                        v."endsAt",
                        v."maxChoices",
                        v."minChoices",
                        v."reminderSent",
                        v."reminderTime",
                        v."type",
                        v."autoClose"
                    FROM "TopicVotes" tv INNER JOIN
                        (
                            SELECT
                                MAX("createdAt") as "createdAt",
                                "topicId"
                            FROM "TopicVotes"
                            GROUP BY "topicId"
                        ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt")
                    LEFT JOIN "Votes" v
                            ON v.id = tv."voteId"
                ) AS tv ON (tv."topicId" = t.id)
                LEFT JOIN (
						SELECT
							ti."topicId",
							ti."ideationId",
							i."createdAt",
							i."deadline",
							i."creatorId",
							COALESCE(id."ideaCount", 0) as "ideaCount"
						FROM "TopicIdeations" ti INNER JOIN
							(
								SELECT
									MAX("createdAt") as "createdAt",
									"topicId"
								FROM "TopicIdeations"
								GROUP BY "topicId"
							) AS _ti ON (_ti."topicId" = ti."topicId" AND _ti."createdAt" = ti."createdAt")
						LEFT JOIN "Ideations" i
								ON i.id = ti."ideationId"
                        LEFT JOIN (
                            SELECT "ideationId",
                            COUNT("ideationId") as "ideaCount"
                            FROM "Ideas"
                            GROUP BY "ideationId"
                        ) id ON ti."ideationId" = id."ideationId"
				) AS ti ON (ti."topicId" = t.id)
                LEFT JOIN "TopicDiscussions" td ON td."topicId" = t.id
                LEFT JOIN "TopicFavourites" tf ON tf."topicId" = t.id AND tf."userId" = :userId
                LEFT JOIN "TopicReports" tr ON (tr."topicId" = t.id AND tr."resolvedById" IS NULL AND tr."deletedAt" IS NULL)
                LEFT JOIN "TopicJoins" tj ON (tj."topicId" = t.id AND tj."deletedAt" IS NULL)
                ${join}
            WHERE t.id = :topicId
                AND t."deletedAt" IS NULL
            `,
            {
                replacements: {
                    topicId: topicId,
                    userId: user.id
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
        );
        let topic;
        if (result?.length && result[0] && (result[0].visibility === 'public' || result[0]?.permission?.level !== TopicMemberUser.LEVELS.none)) {
            topic = result[0];
        } else {
            logger.warn('Topic not found', topicId);
            return;
        }
        topic.padUrl = cosEtherpad.getUserAccessUrl(topic, topic.user.id, topic.user.name, topic.user.language, partner);
        topic.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });

        if (topic.permission.level !== TopicMemberUser.LEVELS.admin) {
            topic.join.token = null;
            topic.join.level = null;
        }
        // Remove the user info from output, was only needed for padUrl generation
        delete topic.user;

        if (include && include.indexOf('vote') > -1 && topic.vote && topic.vote.id) {

            const voteResult = await voteService.getVoteResults(topic.vote.id, user.id);
            const options = [];
            let hasVoted = false;

            topic.vote.options.forEach((option) => {
                option = option.split(':');
                const o = {
                    id: option[0],
                    value: option[1],
                    ideaId: option[2] || null
                };
                if (voteResult) {
                    const res = voteResult.find(opt => opt.optionId === o.id);
                    if (res) {
                        const count = parseInt(res.voteCount, 10);
                        if (count) {
                            o.voteCount = count;
                        }
                        if (res.selected) {
                            o.selected = res.selected;
                            hasVoted = true;
                        }
                    }
                }
                options.push(o);
            });

            if (voteResult && voteResult.length) {
                topic.vote.votersCount = voteResult[0].votersCount;
            }

            if (topic.vote.authType === Vote.AUTH_TYPES.hard && hasVoted) {
                topic.vote.downloads = {
                    bdocVote: voteService.getBdocURL({
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
        } else {
            delete topic.vote;
        }

        if (!topic.report.id) {
            delete topic.report;
        }

        if (topic.creator.email) {
            topic.creator.email = cryptoLib.privateDecrypt(topic.creator.email);
        }
        if (topic.creator.connectionData) {
            const data = cryptoLib.privateDecrypt(topic.creator.connectionData);
            if (data.phoneNumber) {
                topic.creator.phoneNumber = data.phoneNumber;
            }
            delete topic.creator.connectionData;
        }

        return topic;
    };

    /**
     * Create a new Topic
     */
    app.post('/api/users/:userId/topics', loginCheck(['partner']), partnerParser, async function (req, res, next) {
        try {
            // I wish Sequelize Model.build supported "fields". This solution requires you to add a field here once new are defined in model.
            let topic = Topic.build({
                title: req.body.title,
                visibility: req.body.visibility || Topic.VISIBILITY.private,
                status: req.body.status || Topic.STATUSES.draft,
                creatorId: req.user.userId,
                categories: req.body.categories,
                imageUrl: req.body.imageUrl,
                hashtag: req.body.hashtag,
                intro: req.body.intro,
                country: req.body.country,
                contact: req.body.contact,
                language: req.body.language,
                endsAt: req.body.endsAt,
                sourcePartnerObjectId: req.body.sourcePartnerObjectId,
                authorIds: [req.user.userId]
            });

            topic.padUrl = cosEtherpad.getTopicPadUrl(topic.id);

            if (req.locals.partner) {
                topic.sourcePartnerId = req.locals.partner.id;
            }

            const topicDescription = req.body.description;

            const user = await User.findOne({
                where: {
                    id: req.user.userId
                },
                attributes: ['id', 'name', 'language']
            });

            // Create topic on Etherpad side
            await cosEtherpad.createTopic(topic.id, user.language, topicDescription);

            let topicJoin;

            await db.transaction(async function (t) {
                await topic.save({ transaction: t });
                const topicJoinPromise = TopicJoin.create(
                    {
                        topicId: topic.id
                    },
                    {
                        transaction: t
                    }
                );

                const memberUserPromise = topic.addMemberUser(// Magic method by Sequelize - https://github.com/sequelize/sequelize/wiki/API-Reference-Associations#hasmanytarget-options
                    user.id,
                    {
                        through: {
                            level: TopicMemberUser.LEVELS.admin
                        },
                        transaction: t
                    }
                );

                const activityPromise = cosActivities.createActivity(
                    topic,
                    null,
                    {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    }
                    , req.method + ' ' + req.path,
                    t
                );
                [topicJoin] = await Promise.all([topicJoinPromise, memberUserPromise, activityPromise]);
                t.afterCommit(async () => {
                    topic = await cosEtherpad.syncTopicWithPad(
                        topic.id,
                        req.method + ' ' + req.path,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        }
                    );
                    const authors = await User.findAll({
                        where: {
                            id: topic.authorIds
                        },
                        attributes: ['id', 'name'],
                        raw: true
                    });

                    const resObject = topic.toJSON();
                    resObject.authors = authors;
                    resObject.padUrl = cosEtherpad.getUserAccessUrl(topic, user.id, user.name, user.language, req.locals.partner);
                    resObject.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });

                    if (req.locals.partner) {
                        resObject.sourcePartnerId = req.locals.partner.id;
                    } else {
                        resObject.sourcePartnerId = null;
                    }

                    resObject.favourite = false;
                    resObject.permission = {
                        level: TopicMemberUser.LEVELS.admin
                    };

                    resObject.join = topicJoin.toJSON();

                    return res.created(resObject);
                });
            });
        } catch (err) {
            return next(err);
        }
    });

    //Copy topic
    app.get('/api/users/:userId/topics/:topicId/duplicate', loginCheck(['partner']), partnerParser, topicService.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
        try {
            // I wish Sequelize Model.build supported "fields". This solution requires you to add a field here once new are defined in model.
            const sourceTopic = await Topic.findOne({
                where: {
                    id: req.params.topicId
                }
            });

            let topic = Topic.build({
                title: sourceTopic.title,
                imageUrl: sourceTopic.imageUrl,
                intro: sourceTopic.intro,
                language: sourceTopic.language,
                country: sourceTopic.country,
                visibility: Topic.VISIBILITY.private,
                creatorId: req.user.userId,
                authorIds: [req.user.userId]
            });

            topic.padUrl = cosEtherpad.getTopicPadUrl(topic.id);

            if (req.locals.partner) {
                topic.sourcePartnerId = req.locals.partner.id;
            }

            const user = await User.findOne({
                where: {
                    id: req.user.userId
                },
                attributes: ['id', 'name', 'language']
            });

            await db.transaction(async function (t) {
                await cosEtherpad.createPadCopy(req.params.topicId, topic.id);
                await topic.save({ transaction: t });
                await topic.addMemberUser(// Magic method by Sequelize - https://github.com/sequelize/sequelize/wiki/API-Reference-Associations#hasmanytarget-options
                    user.id,
                    {
                        through: {
                            level: TopicMemberUser.LEVELS.admin
                        },
                        transaction: t
                    }
                );

                const attachments = await getTopicAttachments(req.params.topicId);
                const topicJoin = await TopicJoin.create(
                    {
                        topicId: topic.id
                    },
                    {
                        transaction: t
                    }
                );
                attachments.forEach(async (attachment) => {
                    const attachmentClone = await Attachment.create(
                        {
                            name: attachment.name,
                            size: attachment.size,
                            source: attachment.source,
                            type: attachment.type,
                            link: attachment.link,
                            creatorId: attachment.creator.id
                        },
                        {
                            transaction: t
                        }
                    );

                    await TopicAttachment.create(
                        {
                            topicId: topic.id,
                            attachmentId: attachmentClone.id
                        },
                        {
                            transaction: t
                        }
                    );
                });

                await cosActivities.createActivity(
                    topic,
                    null,
                    {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    }
                    , req.method + ' ' + req.path,
                    t
                );

                t.afterCommit(async () => {
                    topic = await cosEtherpad.syncTopicWithPad(
                        topic.id,
                        req.method + ' ' + req.path,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        }
                    );
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
                    resObject.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });

                    if (req.locals.partner) {
                        resObject.sourcePartnerId = req.locals.partner.id;
                    } else {
                        resObject.sourcePartnerId = null;
                    }

                    resObject.favourite = false;
                    resObject.permission = {
                        level: TopicMemberUser.LEVELS.admin
                    };
                    resObject.join = topicJoin;
                    return res.created(resObject);
                });
            });
        } catch (err) {
            return next(err);
        }

    });
    app.get('/api/users/:userId/topics/count', loginCheck(['partner']), async function (req, res, next) {
        try {
            const userId = req.user.userId;
            const partnerId = req.user.partnerId;
            let where = ` t."deletedAt" IS NULL
                    AND t.title IS NOT NULL
                    AND COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" > 'none' `;

            // All partners should see only Topics created by their site, but our own app sees all.
            if (partnerId) {
                where += ` AND t."sourcePartnerId" = :partnerId `;
            }
            const query = `
                SELECT
                    COUNT(t.id),
                    t.status
                FROM "Topics" t
                    LEFT JOIN (
                        SELECT
                            tmu."topicId",
                            tmu."userId",
                            tmu.level::text AS level
                        FROM "TopicMemberUsers" tmu
                        WHERE tmu."deletedAt" IS NULL
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                    LEFT JOIN (
                        SELECT
                            tmg."topicId",
                            gm."userId",
                            MAX(tmg.level)::text AS level
                        FROM "TopicMemberGroups" tmg
                            LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                        GROUP BY "topicId", "userId"
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
                WHERE ${where}
                GROUP BY t.status
            ;`;

            const rows = await db
                .query(
                    query,
                    {
                        replacements: {
                            userId: userId,
                            partnerId: partnerId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );
            const finalResults = {}
            Object.keys(Topic.STATUSES).forEach((status) => {
                const item = rows.find(i => i.status === status);
                finalResults[status] = item?.count || 0;
            });

            return res.ok(finalResults);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read a Topic
     */
    app.get('/api/users/:userId/topics/:topicId', loginCheck(['partner']), partnerParser, topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), async function (req, res, next) {
        try {
            const include = req.query.include;
            const topicId = req.params.topicId;
            const user = req.user;
            const partner = req.locals.partner;
            try {
                await cosEtherpad.syncTopicWithPad(topicId);
            } catch (err) {
                logger.error('Failed to sync topic with pad', err);
            }
            const topic = await _topicReadAuth(topicId, include, user, partner);
            try {
                const revision = await cosEtherpad.topicPadRevisions(topicId);
                topic.revision = revision.revisions;
            } catch (err) {
                topic.revision = [];
                logger.error('Failed to get topic pad revisions', err);
            }
            if (!topic) {
                return res.notFound();
            }

            return res.ok(topic);
        } catch (err) {
            console.log(err);
            return next(err);
        }
    });

    app.get('/api/users/self/topics/:topicId/description', loginCheck(['partner']), partnerParser, topicService.hasPermission(TopicMemberUser.LEVELS.edit, true), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const rev = req.query.rev;
            const description = await cosEtherpad.readPadTopic(topicId, rev);
            const revision = await cosEtherpad.topicPadRevisions(topicId);
            res.ok({
                id: topicId,
                description,
                revision: revision.revisions
            });

        } catch (err) {
            next(err);
        }
    });

    app.post('/api/users/self/topics/:topicId/revert', partnerParser, topicService.hasPermission(TopicMemberUser.LEVELS.edit, true), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const rev = req.body.rev;
            const result = await cosEtherpad.restoreRevision(topicId, rev);
            res.ok(result);

        } catch (err) {
            next(err);
        }
    })

    app.get('/api/topics/:topicId', async function (req, res, next) {
        let include = req.query.include;
        const topicId = req.params.topicId;

        if (include && !Array.isArray(include)) {
            include = [include];
        }
        try {
            await cosEtherpad.syncTopicWithPad(topicId);
        } catch (err) {
            logger.error('Failed to sync topic with pad', err);
        }

        try {
            const topic = await _topicReadUnauth(topicId, include);

            if (!topic) {
                return res.notFound();
            }

            return res.ok(topic);
        } catch (err) {
            return next(err);
        }
    });

    app.get('/api/topics/:topicId/download', async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            //     const FILE_CREATE_MODE = '0760';
            const destinationDir = `/tmp/${topicId}`;
            //  await fs.mkdir(destinationDir, FILE_CREATE_MODE);
            const topic = await Topic.findOne({
                where: {
                    id: topicId
                }
            });

            const filePath = `${destinationDir} / ${topicId}.docx`;

            const doc = new CosHtmlToDocx(topic.description, topic.title, topic.intro, filePath);

            const docxBuffer = await doc.processHTML();
            const readStream = new stream.PassThrough();
            readStream.end(docxBuffer);

            res.set('Content-disposition', `attachment; filename=${topicId}.docx`);
            res.set('Content-Type', 'text/plain');

            readStream.pipe(res);
        } catch (err) {
            return next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/inlinecomments', loginCheck(['partner']), async (req, res, next) => {
        const topicId = req.params.topicId;
        const user = req.user;

        try {
            const commentRequest = await cosEtherpad.getTopicInlineComments(topicId, user.id, user.name);
            const replyRequest = await cosEtherpad.getTopicInlineCommentReplies(topicId, user.id, user.name);
            const replies = Object.values(replyRequest.replies);
            const result = commentRequest.comments;
            replies.forEach(function (reply) {
                if (!result[reply.commentId]) return;
                if (!result[reply.commentId].replies) {
                    result[reply.commentId].replies = [];
                }
                result[reply.commentId].replies.push(reply);
            });

            return res.ok(result);
        } catch (err) {
            return next(err);
        }
    });

    const _topicUpdate = async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const statusNew = req.body.status;

            let isBackToVoting = false;

            const topic = await Topic
                .findOne({
                    where: { id: topicId },
                    include: [Vote, Ideation, Discussion]
                });

            if (!topic) {
                return res.badRequest();
            }

            const statuses = Object.values(Topic.STATUSES);
            const vote = topic.Votes[0];
            const ideation = topic.Ideations[0];
            const discussion = topic.Discussions[0];
            if (statusNew && statusNew !== topic.status && topic.status !== Topic.STATUSES.draft) {
                // The only flow that allows going back in status flow is reopening for voting
                if (statusNew === Topic.STATUSES.voting) {
                    if (!vote) {
                        return res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew + ' when the Topic has no Vote created');
                    }
                    if (topic.status === Topic.STATUSES.followUp)
                        isBackToVoting = true;
                } else if (statusNew === Topic.STATUSES.indeation) {
                    if (!ideation) {
                        return res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew + ' when the Topic has no Ideation created');
                    }
                } else if (statusNew === Topic.STATUSES.inProgress) {
                    if (!discussion) {
                        return res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew + ' when the Topic has no Discussion created');
                    }
                }

                else if (statuses.indexOf(topic.status) > statuses.indexOf(statusNew) || [Topic.STATUSES.voting].indexOf(statusNew) > -1) { // You are not allowed to go "back" in the status flow nor you are allowed to set "voting" directly, it can only be done creating a Vote.
                    return res.badRequest('Invalid status flow. Cannot change Topic status from ' + topic.status + ' to ' + statusNew);
                }
            }

            if (Object.keys(req.body).indexOf('imageUrl') > -1 && !req.body.imageUrl && topic.imageUrl) {
                const currentImageURL = new URL(topic.imageUrl);
                //FIXME: No delete from DB?
                if (config.storage?.type.toLowerCase() === 's3' && currentImageURL.href.indexOf(`https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/users/${req.user.id}`) === 0) {
                    await cosUpload.delete(currentImageURL.pathname)
                } else if (config.storage?.type.toLowerCase() === 'local' && currentImageURL.hostname === (new URL(config.url.api)).hostname) {
                    const appDir = __dirname.replace('/routes/api', '/public/uploads/topics');
                    const baseFolder = config.storage.baseFolder || appDir;

                    fs.unlinkSync(`${baseFolder}/${path.parse(currentImageURL.pathname).base}`);
                }
            }

            // NOTE: Description is handled separately below
            const fieldsAllowedToUpdate = ['title', 'categories', 'endsAt', 'hashtag', 'imageUrl', 'contact', 'country', 'language', 'intro', 'sourcePartnerObjectId'];
            if (req.locals.topic.permissions.level === TopicMemberUser.LEVELS.admin) {
                fieldsAllowedToUpdate.push('visibility');
                fieldsAllowedToUpdate.push('status');
            }

            Object.keys(req.body).forEach(function (key) {
                if (fieldsAllowedToUpdate.indexOf(key) >= 0) {
                    topic.set(key, req.body[key]);
                }
            });
            const promisesList = [];
            await db
                .transaction(async function (t) {
                    if (req.body.description) {
                        if (topic.status === Topic.STATUSES.inProgress || topic.status === Topic.STATUSES.draft || topic.status === Topic.STATUSES.ideation) {
                            promisesList.push(cosEtherpad
                                .updateTopic(
                                    topicId,
                                    req.body.description
                                ));
                        } else {
                            return res.badRequest(`Cannot update Topic content when status ${topic.status}`);
                        }
                    }

                    promisesList.push(cosActivities
                        .updateActivity(
                            topic,
                            null,
                            {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        ));

                    promisesList.push(topic.save({ transaction: t }));

                    if (isBackToVoting) {
                        promisesList.push(cosSignature.deleteFinalBdoc(topicId, vote.id));

                        promisesList.push(TopicEvent
                            .destroy({
                                where: {
                                    topicId: topicId
                                },
                                force: true,
                                transaction: t
                            }));
                    }
                    await Promise.all(promisesList);
                });
            if (req.body.description && (topic.status === Topic.STATUSES.inProgress || topic.status === Topic.STATUSES.draft || topic.status === Topic.STATUSES.ideation)) {
                await cosEtherpad
                    .syncTopicWithPad(
                        topicId,
                        req.method + ' ' + req.path,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        null,
                        true
                    );
            }
        } catch (err) {
            return next(err);
        }
    };

    app.post('/api/users/:userId/topics/:topicId/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        let topic = await Topic.findOne({
            where: {
                id: topicId
            }
        });

        if (topic) {
            let imageUrl;

            try {
                imageUrl = await cosUpload.upload(req, 'topics', topicId);
            } catch (err) {
                if (err.type && (err.type === 'fileSize' || err.type === 'fileType')) {
                    return res.forbidden(err.message);
                } else {
                    throw err;
                }
            }

            await Topic.update(
                {
                    imageUrl: imageUrl.link
                },
                {
                    where: {
                        id: topicId
                    },
                    limit: 1,
                    returning: true
                }
            );

            return res.created(imageUrl);
        } else {
            res.forbidden();
        }
    }));

    /**
     * Update Topic info
     */
    app.put('/api/users/:userId/topics/:topicId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        try {
            await _topicUpdate(req, res, next);

            return res.ok();
        } catch (err) {
            next(err);
        }
    });

    app.patch('/api/users/:userId/topics/:topicId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        try {
            await _topicUpdate(req, res, next);

            return res.noContent();
        } catch (err) {
            next(err);
        }
    });

    /**
     * Update (regenerate) Topic join token (TopicJoin) with a level
     *
     * PUT as there is one TopicJoin for each Topic. Always overwrites previous.
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/311
     */
    app.put('/api/users/:userId/topics/:topicId/join', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const level = req.body.level;
        if (!Object.values(TopicJoin.LEVELS).includes(level)) {
            return res.badRequest('Invalid value for property "level". Possible values are ' + Object.values(TopicJoin.LEVELS) + '.', 1);
        }
        const topicJoin = await TopicJoin.findOne({
            where: {
                topicId: topicId
            }
        });

        topicJoin.token = TopicJoin.generateToken();
        topicJoin.level = level;

        await db
            .transaction(async (t) => {
                await cosActivities
                    .updateActivity(
                        topicJoin,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await topicJoin.save({ transaction: t });
                t.afterCommit(() => {
                    return res.ok(topicJoin);
                });
            });
    }));

    /**
     * Update level of an existing token WITHOUT regenerating the token
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/311
     */
    app.put('/api/users/:userId/topics/:topicId/join/:token', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const token = req.params.token;
        const level = req.body.level;

        if (!Object.values(TopicJoin.LEVELS).includes(level)) {
            return res.badRequest('Invalid value for property "level". Possible values are ' + Object.values(TopicJoin.LEVELS) + '.', 1);
        }

        const topicJoin = await TopicJoin.findOne({
            where: {
                topicId: topicId,
                token: token
            }
        });

        if (!topicJoin) {
            return res.notFound('Nothing found for topicId and token combination.');
        }

        topicJoin.level = level;

        await db
            .transaction(async function (t) {
                await cosActivities
                    .updateActivity(
                        topicJoin,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await topicJoin.save({ transaction: t });
                t.afterCommit(() => {
                    return res.ok(topicJoin);
                });
            });
    }));


    /**
     * Delete Topic
     */
    app.delete('/api/users/:userId/topics/:topicId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
        try {
            const topic = await Topic.findByPk(req.params.topicId);
            if (!topic) {
                return res.notFound('No such topic found.');
            }

            await db.transaction(async function (t) {
                try {
                    await cosEtherpad.deleteTopic(topic.id);
                } catch (err) {
                    if (!err.message || err.message !== 'padID does not exist') {
                        throw err;
                    }
                }

                // Delete TopicMembers beforehand. Sequelize does not cascade and set "deletedAt" for related objects if "paranoid: true".
                await TopicMemberUser.destroy({
                    where: {
                        topicId: topic.id
                    },
                    force: true,
                    transaction: t
                });

                await TopicMemberGroup.destroy({
                    where: {
                        topicId: topic.id
                    },
                    force: true,
                    transaction: t
                });

                await topic.destroy({
                    transaction: t
                });

                await cosActivities.deleteActivity(topic, null, {
                    type: 'User',
                    id: req.user.userId,
                    ip: req.ip
                }, req.method + ' ' + req.path, t);

                t.afterCommit(() => {
                    return res.ok();
                });
            });
        } catch (err) {
            return next(err);
        }
    });


    /**
     * Get all Topics User belongs to
     */
    app.get('/api/users/:userId/topics', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const partnerId = req.user.partnerId;
        const limitDefault = 26;
        const limitMax = 500;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;

        if (limit > limitMax) limit = limitDefault;


        let include = req.query.include;

        const visibility = req.query.visibility;
        const creatorId = req.query.creatorId;
        let statuses = req.query.statuses;
        const favourite = req.query.favourite;
        const country = req.query.country;
        const language = req.query.language;
        const hasVoted = req.query.hasVoted; // Filter out Topics where User has participated in the voting process.
        const showModerated = req.query.showModerated || false;
        if (statuses && !Array.isArray(statuses)) {
            statuses = [statuses];
        }

        let voteResults = false;
        let join = '';
        let returncolumns = '';

        if (!Array.isArray(include)) {
            include = [include];
        }

        let groupBy = '';
        if (include.indexOf('vote') > -1) {
            returncolumns += `
            , (
                SELECT to_json(
                    array (
                        SELECT concat(id, ':', value, ':', "ideaId")
                        FROM   "VoteOptions"
                        WHERE  "deletedAt" IS NULL
                        AND    "voteId" = tv."voteId"
                    )
                )
            ) as "vote.options"
            , tv."voteId" as "vote.id"
            , tv."authType" as "vote.authType"
            , tv."autoClose" as "vote.autoClose"
            , tv."createdAt" as "vote.createdAt"
            , tv."delegationIsAllowed" as "vote.delegationIsAllowed"
            , tv."description" as "vote.description"
            , tv."endsAt" as "vote.endsAt"
            , tv."reminderSent" as "vote.reminderSent"
            , tv."reminderTime" as "vote.reminderTime"
            , tv."maxChoices" as "vote.maxChoices"
            , tv."minChoices" as "vote.minChoices"
            , tv."type" as "vote.type"
            `;
            voteResults = voteService.getAllVotesResults(userId);
            groupBy += `, tv."authType", tv."createdAt", tv."delegationIsAllowed", tv."description", tv."endsAt", tv."reminderSent", tv."reminderTime", tv."maxChoices", tv."minChoices", tv."type", tv."autoClose"`;
        }

        if (include.indexOf('event') > -1) {
            join += ` LEFT JOIN (
                        SELECT
                            COUNT(events.id) as count,
                            events."topicId"
                        FROM "TopicEvents" events
                        WHERE events."deletedAt" IS NULL
                        GROUP BY events."topicId"
                    ) AS te ON te."topicId" = t.id
            `;
            returncolumns += `
            , COALESCE(te.count, 0) AS "events.count"
            `;
            groupBy += `, te.count`;
        }

        let where = ` t."deletedAt" IS NULL
                    AND t.title IS NOT NULL
                    AND COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" > 'none' `;

        let categories = req.query.categories;
        if (categories && !Array.isArray(categories)) {
            categories = [categories];
        }

        if (categories && categories.length) {
            where += `AND t."categories" @> ARRAY[:categories]::VARCHAR(255)[] `;
        }
        // All partners should see only Topics created by their site, but our own app sees all.
        if (partnerId) {
            where += ` AND t."sourcePartnerId" = :partnerId `;
        }

        if (visibility) {
            where += ` AND t.visibility=:visibility `;
        }

        if (statuses && statuses.length) {
            where += ` AND t.status IN (:statuses) `;
        }

        if (favourite) {
            where += ` AND tf."topicId" = t.id AND tf."userId" = :userId`;
        }

        if (country) {
            where += ` AND t.country ILIKE :country `;
        }

        if (language) {
            where += ` AND t.language ILIKE :language `;
        }

        if (['true', '1'].includes(hasVoted)) {
            where += ` AND EXISTS (SELECT TRUE FROM "VoteLists" vl WHERE vl."voteId" = tv."voteId" AND vl."userId" = :userId LIMIT 1)`;
        } else if (['false', '0'].includes(hasVoted)) {
            where += ` AND tv."voteId" IS NOT NULL AND t.status = 'voting'::"enum_Topics_status" AND (tv."endsAt" IS NULL OR tv."endsAt" > NOW()) AND NOT EXISTS (SELECT TRUE FROM "VoteLists" vl WHERE vl."voteId" = tv."voteId" AND vl."userId" = :userId LIMIT 1)`;
        } else {
            logger.warn(`Ignored parameter "voted" as invalid value "${hasVoted}" was provided`);
        }

        if (!showModerated || showModerated == "false") {
            where += ` AND (tr."moderatedAt" IS NULL OR tr."resolvedAt" IS NOT NULL) `;
        } else {
            where += ` AND (tr."moderatedAt" IS NOT NULL AND tr."resolvedAt" IS NULL) `;
            returncolumns += `
            ,tr.id AS "report.id"
            ,tr."moderatedReasonType" AS "report.moderatedReasonType"
            ,tr."moderatedReasonText" AS "report.moderatedReasonText"
            `;
        }

        if (creatorId) {
            if (creatorId === userId) {
                where += ` AND c.id =:creatorId `;
            } else {
                return res.badRequest('No rights!');
            }
        }

        let title = req.query.title || req.query.search;
        if (title) {
            title = `%${title}%`;
            where += ` AND t.title ILIKE :title `;
        }

        const orderBy = req.query.orderBy;
        let order = (req.query.order?.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
        let orderSql = ` ORDER BY `;
        //  ORDER BY "favourite" DESC, "order" ASC, t."updatedAt" DESC
        if (orderBy) {
            switch (orderBy) {
                /* case 'activityTime':
                     orderSql += ` ta.latest  ${order} `;
                     groupBy += `, ta.latest`;
                     break;
                 case 'activityCount':
                     orderSql += ` ta.count  ${order} `;
                     groupBy += `, ta.count`;
                     break;*/
                case 'membersCount':
                    orderSql += ` muc.count ${order} `;
                    break;
                case 'created':
                    orderSql += ` t."createdAt" ${order} `;
                    break;
                default:
                    orderSql += ` "t."updatedAt" DESC `;
            }
        } else {
            orderSql += ` t."updatedAt" DESC `;
        }

        // TODO: NOT THE MOST EFFICIENT QUERY IN THE WORLD, tune it when time.
        // TODO: That casting to "enum_TopicMemberUsers_level". Sequelize does not support naming enums, through inheritance I have 2 enums that are the same but with different name thus different type in PG. Feature request - https://github.com/sequelize/sequelize/issues/2577
        const query = `
                SELECT
                     t.id,
                     t.title,
                     t.description,
                     t.status,
                     t.visibility,
                     t.hashtag,
                     t."imageUrl",
                     t.contact,
                     t.intro,
                     t.country,
                     t.language,
                     CASE
                     WHEN COALESCE(tmup.level, tmgp.level, 'none') = 'admin' THEN tj.token
                     ELSE NULL
                     END as "join.token",
                     CASE
                     WHEN COALESCE(tmup.level, tmgp.level, 'none') = 'admin' THEN tj.level
                     ELSE NULL
                     END as "join.level",
                     CASE
                        WHEN tf."topicId" = t.id THEN true
                        ELSE false
                     END as "favourite",
                     t.categories,
                     t."sourcePartnerId",
                     t."sourcePartnerObjectId",
                     t."endsAt",
                     t."createdAt",
                     t."updatedAt",
                     c.id as "creator.id",
                     c.name as "creator.name",
                     c.company as "creator.company",
                     COALESCE(tmup.level, tmgp.level, 'none') as "permission.level",
                     muc.count as "members.users.count",
                     COALESCE(mgc.count, 0) as "members.groups.count",
                     tv."voteId" as "voteId",
                     tv."voteId" as "vote.id",
                     ti."ideationId" as "ideationId",
                     ti."ideationId" as "ideation.id",
                     ti."ideaCount" as "ideation.ideas.count",
                     COALESCE(MAX(a."updatedAt"), t."updatedAt") as "lastActivity",
                     CASE WHEN t.status = 'voting' THEN 1
                        WHEN t.status = 'inProgress' THEN 2
                        WHEN t.status = 'followUp' THEN 3
                     ELSE 4
                     END AS "order",
                     COALESCE(tc.count, 0) AS "comments.count",
                     count(*) OVER()::integer AS "countTotal",
                     com."createdAt" AS "comments.lastCreatedAt"
                    ${returncolumns}
                FROM "Topics" t
                    LEFT JOIN (
                        SELECT
                            tmu."topicId",
                            tmu."userId",
                            tmu.level::text AS level
                        FROM "TopicMemberUsers" tmu
                        WHERE tmu."deletedAt" IS NULL
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                    LEFT JOIN "TopicReports" tr ON (tr."topicId" = t.id AND tr."resolvedById" IS NULL AND tr."deletedAt" IS NULL)
                    LEFT JOIN (
                        SELECT
                            tmg."topicId",
                            gm."userId",
                            MAX(tmg.level)::text AS level
                        FROM "TopicMemberGroups" tmg
                            LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                        GROUP BY "topicId", "userId"
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
                    LEFT JOIN "Users" c ON (c.id = t."creatorId")
                    LEFT JOIN (
                        SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM (
                            SELECT
                                tmuu."topicId",
                                tmuu."userId" AS "memberId"
                            FROM "TopicMemberUsers" tmuu
                            WHERE tmuu."deletedAt" IS NULL
                            UNION
                            SELECT
                                tmg."topicId",
                                gm."userId" AS "memberId"
                            FROM "TopicMemberGroups" tmg
                                JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                                JOIN "Groups" g ON g.id = tmg."groupId"
                            WHERE tmg."deletedAt" IS NULL
                            AND g."deletedAt" IS NULL
                            AND gm."deletedAt" IS NULL
                        ) AS tmu GROUP BY "topicId"
                    ) AS muc ON (muc."topicId" = t.id)
                    LEFT JOIN (
                        SELECT
                            tmg."topicId",
                            count(tmg."groupId") AS "count"
                        FROM "TopicMemberGroups" tmg
                        JOIN "Groups" g ON (g.id = tmg."groupId")
                        WHERE tmg."deletedAt" IS NULL
                        AND g."deletedAt" IS NULL
                        GROUP BY tmg."topicId"
                    ) AS mgc ON (mgc."topicId" = t.id)
                    LEFT JOIN (
                        SELECT
                            tv."topicId",
                            tv."voteId",
                            v."authType",
                            v."createdAt",
                            v."delegationIsAllowed",
                            v."description",
                            v."endsAt",
                            v."reminderSent",
                            v."reminderTime",
                            v."maxChoices",
                            v."minChoices",
                            v."type",
                            v."autoClose"
                        FROM "TopicVotes" tv INNER JOIN
                            (
                                SELECT
                                    MAX("createdAt") as "createdAt",
                                    "topicId"
                                FROM "TopicVotes"
                                GROUP BY "topicId"
                            ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt")
                        LEFT JOIN "Votes" v
                                ON v.id = tv."voteId"
                    ) AS tv ON (tv."topicId" = t.id)
                    LEFT JOIN (
                        SELECT
                            "topicId",
                            COUNT(*) AS count
                        FROM "DiscussionComments" dc
                        JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                        GROUP BY "topicId"
                    ) AS tc ON (tc."topicId" = t.id)
                    LEFT JOIN (
                        SELECT
                            tcc."topicId",
                            MAX(tcc."createdAt") as "createdAt"
                            FROM
                                (SELECT
                                    td."topicId",
                                    c."createdAt"
                                FROM "DiscussionComments" dc
                                JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                                JOIN "Comments" c ON c.id = dc."commentId"
                                GROUP BY td."topicId", c."createdAt"
                                ORDER BY c."createdAt" DESC
                                ) AS tcc
                            GROUP BY tcc."topicId"
                    ) AS com ON (com."topicId" = t.id)
                    LEFT JOIN "Activities" a ON ARRAY[t.id::text] <@ a."topicIds"
                    LEFT JOIN (
						SELECT
							ti."topicId",
							ti."ideationId",
							i."createdAt",
							i."deadline",
							i."creatorId",
							COALESCE(id."ideaCount", 0) as "ideaCount"
						FROM "TopicIdeations" ti INNER JOIN
							(
								SELECT
									MAX("createdAt") as "createdAt",
									"topicId"
								FROM "TopicIdeations"
								GROUP BY "topicId"
							) AS _ti ON (_ti."topicId" = ti."topicId" AND _ti."createdAt" = ti."createdAt")
						LEFT JOIN "Ideations" i
								ON i.id = ti."ideationId"
                        LEFT JOIN (
                            SELECT "ideationId",
                            COUNT("ideationId") as "ideaCount"
                            FROM "Ideas"
                            GROUP BY "ideationId"
                        ) id ON ti."ideationId" = id."ideationId"
				    ) AS ti ON (ti."topicId" = t.id)
                    LEFT JOIN "TopicFavourites" tf ON (tf."topicId" = t.id AND tf."userId" = :userId)
                    LEFT JOIN "TopicJoins" tj ON (tj."topicId" = t.id AND tj."deletedAt" IS NULL)
                    ${join}
                WHERE ${where}
                GROUP BY t.id, tr.id, tr."moderatedReasonType", tr."moderatedReasonText", ti."ideationId", ti."ideaCount", tj."token", tj.level, c.id, muc.count, mgc.count, tv."voteId", tc.count, com."createdAt", tmup.level, tmgp.level, tf."topicId"
                ${groupBy}
                ${orderSql}
                OFFSET :offset LIMIT :limit
            ;`;

        try {
            let rows;
            const rowsquery = db
                .query(
                    query,
                    {
                        replacements: {
                            categories: categories,
                            userId: userId,
                            partnerId: partnerId,
                            visibility: visibility,
                            statuses: statuses,
                            creatorId: creatorId,
                            title: title,
                            language: language,
                            country: country,
                            offset: offset,
                            limit: limit
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );
            [rows, voteResults] = await Promise.all([rowsquery, voteResults]);
            const rowCount = rows.length;

            // Sequelize returns empty array for no results.
            const result = {
                count: rowCount,
                countTotal: rowCount,
                rows: []
            };

            if (rowCount > 0) {
                rows.forEach((topic) => {
                    result.countTotal = topic.countTotal;
                    delete topic.countTotal;
                    topic.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });

                    if (include.indexOf('vote') > -1) {
                        if (topic.vote.id) {
                            const options = [];
                            if (topic.vote.options) {
                                topic.vote.options.forEach(function (voteOption) {
                                    const o = {};
                                    const optText = voteOption.split(':');
                                    o.id = optText[0];
                                    o.value = optText[1];
                                    o.ideaId = optText[2] || null;
                                    let result = 0;
                                    if (voteResults && voteResults.length) {
                                        result = voteResults.find(opt => opt.optionId === optText[0]);
                                        if (result) {
                                            o.voteCount = parseInt(result.voteCount, 10);
                                            if (result.selected) {
                                                o.selected = result.selected;
                                            }
                                        }
                                        topic.vote.votersCount = voteResults[0].votersCount;
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
        } catch (e) {
            return next(e);
        }
    });

    /**
     * Topic list
     */
    app.get('/api/topics', async function (req, res, next) {
        try {
            const limitMax = 500;
            const limitDefault = 26;
            let join = '';
            let groupBy = '';
            let returncolumns = '';
            let voteResults = false;
            let showModerated = req.query.showModerated || false;
            let country = req.query.country;
            let language = req.query.language;

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
                    returncolumns += `
                    , (
                        SELECT to_json(
                            array (
                                SELECT concat(id, ':', value, ':', "ideaId")
                                FROM   "VoteOptions"
                                WHERE  "deletedAt" IS NULL
                                AND    "voteId" = tv."voteId"
                            )
                        )
                    ) as "vote.options"
                    , tv."voteId" as "vote.id"
                    , tv."authType" as "vote.authType"
                    , tv."createdAt" as "vote.createdAt"
                    , tv."autoClose" as "vote.autoClose"
                    , tv."delegationIsAllowed" as "vote.delegationIsAllowed"
                    , tv."description" as "vote.description"
                    , tv."endsAt" as "vote.endsAt"
                    , tv."maxChoices" as "vote.maxChoices"
                    , tv."minChoices" as "vote.minChoices"
                    , tv."type" as "vote.type"
                    `;
                    groupBy += `,tv."authType", tv."createdAt", tv."delegationIsAllowed", tv."description", tv."endsAt", tv."maxChoices", tv."minChoices", tv."type", tv."autoClose" `;
                    voteResults = voteService.getAllVotesResults();
                }
                if (include.indexOf('event') > -1) {
                    join += `LEFT JOIN (
                                SELECT
                                    COUNT(events.id) as count,
                                    events."topicId"
                                FROM "TopicEvents" events
                                WHERE events."deletedAt" IS NULL
                                GROUP BY events."topicId"
                            ) AS te ON te."topicId" = t.id
                    `;
                    returncolumns += `
                    , COALESCE(te.count, 0) AS "events.count"
                    `;
                    groupBy += `,te."count" `;
                }
            }

            let categories = req.query.categories;
            if (categories && !Array.isArray(categories)) {
                categories = [categories];
            }

            let where = ` t.visibility = '${Topic.VISIBILITY.public}'
                AND t.title IS NOT NULL
                AND t.status !='${Topic.STATUSES.draft}'
                AND t."deletedAt" IS NULL `;

            if (categories && categories.length) {
                where += ' AND t."categories" @> ARRAY[:categories]::VARCHAR(255)[] ';
            }

            if (!showModerated || showModerated == "false") {
                where += 'AND (tr."moderatedAt" IS NULL OR tr."resolvedAt" IS NOT NULL OR tr."deletedAt" IS NOT NULL) ';
            } else {
                where += 'AND tr."moderatedAt" IS NOT NULL AND tr."resolvedAt" IS NULL AND tr."deletedAt" IS NULL ';
                returncolumns += `
                ,tr.id AS "report.id"
                ,tr."moderatedReasonType" AS "report.moderatedReasonType"
                ,tr."moderatedReasonText" AS "report.moderatedReasonText"
                `;
            }

            if (statuses && statuses.length) {
                where += ' AND t.status IN (:statuses)';
            }

            if (country) {
                where += ` AND t.country ILIKE :country `;
            }

            if (language) {
                where += ` AND t.language ILIKE :language `;
            }

            let sourcePartnerId = req.query.sourcePartnerId;
            if (sourcePartnerId) {
                if (!Array.isArray(sourcePartnerId)) {
                    sourcePartnerId = [sourcePartnerId];
                }
                where += ' AND t."sourcePartnerId" IN (:partnerId)';
            }

            let title = req.query.title || req.query.search;
            if (title) {
                title = `%${title}%`;
                where += ` AND t.title ILIKE :title `;
            }

            const query = `
                    SELECT
                        t.id,
                        t.title,
                        t.description,
                        t.status,
                        t.visibility,
                        t.hashtag,
                        tj."token" AS "join.token",
                        tj."level" AS "join.level",
                        t.categories,
                        t."endsAt",
                        t.contact,
                        t.country,
                        t.language,
                        t.intro,
                        t."imageUrl",
                        t."createdAt",
                        t."updatedAt",
                        t."sourcePartnerId",
                        t."sourcePartnerObjectId",
                        c.id as "creator.id",
                        c.name as "creator.name",
                        COALESCE(MAX(a."updatedAt"), t."updatedAt") as "lastActivity",
                        c.company as "creator.company",
                        muc.count as "members.users.count",
                        COALESCE(mgc.count, 0) as "members.groups.count",
                        CASE WHEN t.status = 'voting' THEN 1
                            WHEN t.status = 'inProgress' THEN 2
                            WHEN t.status = 'followUp' THEN 3
                        ELSE 4
                        END AS "order",
                        tv."voteId",
                        COALESCE(tc.count, 0) AS "comments.count",
                        COALESCE(com."createdAt", NULL) AS "comments.lastCreatedAt",
                        ti."ideationId" as "ideationId",
                        ti."ideationId" as "ideation.id",
                        ti."ideaCount" as "ideation.ideas.count",
                        count(*) OVER()::integer AS "countTotal"
                        ${returncolumns}
                    FROM "Topics" t
                        LEFT JOIN "Users" c ON (c.id = t."creatorId")
                        LEFT JOIN "TopicReports" tr ON (tr."topicId" = t.id AND tr."resolvedById" IS NULL AND tr."deletedAt" IS NULL)
                        LEFT JOIN (
                            SELECT tmu."topicId", COUNT(tmu."memberId")::integer AS "count" FROM (
                                SELECT
                                    tmuu."topicId",
                                    tmuu."userId" AS "memberId"
                                FROM "TopicMemberUsers" tmuu
                                WHERE tmuu."deletedAt" IS NULL
                                UNION
                                SELECT
                                    tmg."topicId",
                                    gm."userId" AS "memberId"
                                FROM "TopicMemberGroups" tmg
                                    JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                                    JOIN "Groups" g ON g.id = tmg."groupId"
                                WHERE tmg."deletedAt" IS NULL
                                AND g."deletedAt" IS NULL
                                AND gm."deletedAt" IS NULL
                            ) AS tmu GROUP BY "topicId"
                        ) AS muc ON (muc."topicId" = t.id)
                        LEFT JOIN (
                            SELECT tmg."topicId", count(tmg."groupId")::integer AS "count"
                            FROM "TopicMemberGroups" tmg
                            JOIN "Groups" g
                                ON g.id = tmg."groupId"
                            WHERE tmg."deletedAt" IS NULL
                            AND g."deletedAt" IS NULL
                            GROUP BY tmg."topicId"
                        ) AS mgc ON (mgc."topicId" = t.id)
                        LEFT JOIN (
                            SELECT
                                "topicId",
                                COUNT(*) AS count
                            FROM "DiscussionComments" dc
                            JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                            GROUP BY "topicId"
                        ) AS tc ON (tc."topicId" = t.id)
                        LEFT JOIN (
                            SELECT
                                tcc."topicId",
                                MAX(tcc."createdAt") as "createdAt"
                                FROM
                                    (SELECT
                                        td."topicId",
                                        c."createdAt"
                                    FROM "DiscussionComments" dc
                                    JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                                    JOIN "Comments" c ON c.id = dc."commentId"
                                    GROUP BY td."topicId", c."createdAt"
                                    ORDER BY c."createdAt" DESC
                                    ) AS tcc
                                GROUP BY tcc."topicId"
                        ) AS com ON (com."topicId" = t.id)
                        LEFT JOIN (
                            SELECT
                                tv."topicId",
                                tv."voteId",
                                v."authType",
                                v."createdAt",
                                v."delegationIsAllowed",
                                v."description",
                                v."endsAt",
                                v."maxChoices",
                                v."minChoices",
                                v."type",
                                v."autoClose"
                            FROM "TopicVotes" tv INNER JOIN
                                (
                                    SELECT
                                        MAX("createdAt") as "createdAt",
                                        "topicId"
                                    FROM "TopicVotes"
                                    GROUP BY "topicId"
                                ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt")
                            LEFT JOIN "Votes" v
                                    ON v.id = tv."voteId"
                        ) AS tv ON (tv."topicId" = t.id)
                        LEFT JOIN "Activities" a ON ARRAY[t.id::text] <@ a."topicIds"
                        LEFT JOIN (
                            SELECT
                                ti."topicId",
                                ti."ideationId",
                                i."createdAt",
                                i."deadline",
                                i."creatorId",
                                COALESCE(id."ideaCount", 0) as "ideaCount"
                            FROM "TopicIdeations" ti INNER JOIN
                                (
                                    SELECT
                                        MAX("createdAt") as "createdAt",
                                        "topicId"
                                    FROM "TopicIdeations"
                                    GROUP BY "topicId"
                                ) AS _ti ON (_ti."topicId" = ti."topicId" AND _ti."createdAt" = ti."createdAt")
                            LEFT JOIN "Ideations" i
                                    ON i.id = ti."ideationId"
                            LEFT JOIN (
                                SELECT "ideationId",
                                COUNT("ideationId") as "ideaCount"
                                FROM "Ideas"
                                GROUP BY "ideationId"
                            ) id ON ti."ideationId" = id."ideationId"
                        ) AS ti ON (ti."topicId" = t.id)
                        LEFT JOIN "TopicJoins" tj ON (tj."topicId" = t.id AND tj."deletedAt" IS NULL)
                        ${join}
                    WHERE ${where}
                    GROUP BY t.id, tr.id, tr."moderatedReasonType", tr."moderatedReasonText", ti."ideationId", ti."ideaCount", tj."token", tj.level, c.id, muc.count, mgc.count, tv."voteId", tc.count, com."createdAt"
                    ${groupBy}
                    ORDER BY "lastActivity" DESC
                    LIMIT :limit OFFSET :offset
                ;`;
            let topics;
            const topicsquery = db
                .query(
                    query,
                    {
                        replacements: {
                            partnerId: sourcePartnerId,
                            categories: categories,
                            statuses: statuses,
                            limit: limit,
                            title: title,
                            offset: offset,
                            country: country,
                            language: language
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );
            [topics, voteResults] = await Promise.all([topicsquery, voteResults]);
            if (!topics) {
                return res.notFound();
            }

            let countTotal = 0;
            if (topics && topics.length) {
                countTotal = topics[0].countTotal;
                topics.forEach(function (topic) {
                    topic.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });

                    delete topic.countTotal;

                    if (include && include.indexOf('vote') > -1 && topic.vote.id) {
                        const options = [];
                        if (topic.vote.options) {
                            topic.vote.options.forEach(function (voteOption) {
                                const o = {};
                                const optText = voteOption.split(':');
                                o.id = optText[0];
                                o.value = optText[1];
                                o.ideaId = optText[2];
                                if (voteResults && voteResults.length) {
                                    const result = voteResults.find(opt => opt.optionId === optText[0]);
                                    if (result) {
                                        o.voteCount = parseInt(result.voteCount, 10);
                                    }
                                    topic.vote.votersCount = voteResults[0].votersCount;
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
        } catch (e) {
            return next(e);
        }
    });

    /**
     * Get all members of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read), async function (req, res, next) {
        try {
            const showExtraUserInfo = req.user?.moderator;
            const response = await topicService.getAllTopicMembers(req.params.topicId, req.user.userId, showExtraUserInfo);

            return res.ok(response);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Get all member Users of the Topic
     */

    /**
     * Get all member Users of the Topic
     */
    const _topicMemberUsers = async (req, res, next) => {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;
        const order = req.query.orderBy;
        let sortOrder = req.query.order || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.trim().toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` tm.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` tm."level"::"enum_TopicMemberUsers_level" ${sortOrder} `;
                    break;
                default:
                    sortSql += ` tm.name ASC `
            }
        } else {
            sortSql += ` tm.name ASC `;
        }

        let where = '';
        if (search) {
            where = ` WHERE tm.name ILIKE :search OR tm.email ILIKE :search `
        }

        let dataForModeratorAndAdmin = '';
        let groupForAdmin = '';
        if (req.user?.moderator) {
            dataForModeratorAndAdmin = `
            tm.email,
            `;
            groupForAdmin = `, uc."connectionData"::jsonb `;
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
                    ${dataForModeratorAndAdmin}
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
                        LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
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
                    FROM "GroupMemberUsers" gm
                    LEFT JOIN "TopicMemberGroups" tmg ON tmg."groupId" = gm."groupId"
                    LEFT JOIN "Groups" g ON g.id = tmg."groupId" AND g."deletedAt" IS NULL
                    WHERE gm."deletedAt" IS NULL
                    AND tmg."deletedAt" IS NULL
                ) tmg ON tmg."topicId" = :topicId AND (tmg."userId" = tm.id)
                ${where}
                GROUP BY tm.id, tm.level, tmu.level, tm.name, tm.company, tm."imageUrl", tm.email ${groupForAdmin}
                ${sortSql}
                LIMIT :limit
                OFFSET :offset
                ;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user?.userId,
                            search: '%' + search + '%',
                            limit,
                            offset
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                )
            let countTotal = 0;
            if (users?.length) {
                countTotal = users[0].countTotal;
            }
            users.forEach(function (userRow) {
                delete userRow.countTotal;

                userRow.groups.rows.forEach(function (group, index) {
                    if (group.id === null) {
                        userRow.groups.rows.splice(index, 1);
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
        } catch (err) {
            return next(err);
        }
    }
    app.get('/api/topics/:topicId/members/users', async function (req, res, next) {
        const topic = await Topic.findOne({
            where: {
                id: req.params.topicId,
                visibility: Topic.VISIBILITY.public
            }
        })
        if (topic) {
            return _topicMemberUsers(req, res, next);
        }
        return res.notFound();
    });

    app.get('/api/users/:userId/topics/:topicId/members/users', loginCheck(['partner']), topicService.isModerator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        return _topicMemberUsers(req, res, next);
    });

    /**
     * Get all member Groups of the Topic
     */
    app.get('/api/topics/:topicId/members/groups', async function (req, res, next) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;
        const order = req.query.order;
        let sortOrder = req.query.sortOrder || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` mg.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` mg."level"::"enum_TopicMemberGroups_level" ${sortOrder} `;
                    break;
                case 'members.users.count':
                    sortSql += ` mg."members.users.count" ${sortOrder} `;
                    break;
                default:
                    sortSql = ` `
            }
        } else {
            sortSql = ` `;
        }

        let where = '';
        if (search) {
            where = `WHERE mg.name ILIKE :search`
        }
        let userLevelField = '';
        let userLevelJoin = '';
        if (req.user?.id) {
            userLevelField = ` gmu.level as "permission.level", `,
                userLevelJoin = ` LEFT JOIN "GroupMemberUsers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL) `;
        }
        try {
            const groups = await db
                .query(
                    `
                    SELECT mg.*,count(*) OVER()::integer AS "countTotal" FROM (
                        SELECT
                            g.id,
                            g.name,
                            g."createdAt",
                            g."updatedAt",
                            tmg.level,
                            ${userLevelField}
                            g.visibility,
                            gmuc.count as "members.users.count"
                        FROM "TopicMemberGroups" tmg
                            JOIN "Groups" g ON (tmg."groupId" = g.id)
                            JOIN (
                                SELECT
                                    "groupId",
                                    COUNT(*) as count
                                FROM "GroupMemberUsers"
                                WHERE "deletedAt" IS NULL
                                GROUP BY 1
                            ) as gmuc ON (gmuc."groupId" = g.id)
                            ${userLevelJoin}
                        WHERE tmg."topicId" = :topicId AND g."visibility" = 'public'
                        AND tmg."deletedAt" IS NULL
                        AND g."deletedAt" IS NULL
                        ORDER BY level DESC
                    ) mg
                    ${where}
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user?.userId,
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
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Get all member Groups of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members/groups', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;
        const order = req.query.order;
        let sortOrder = req.query.sortOrder || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` mg.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` mg."level"::"enum_TopicMemberGroups_level" ${sortOrder} `;
                    break;
                case 'members.users.count':
                    sortSql += ` mg."members.users.count" ${sortOrder} `;
                    break;
                default:
                    sortSql = ` `
            }
        } else {
            sortSql = ` `;
        }

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
                            g.name,
                            g."createdAt",
                            g."updatedAt",
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
                                FROM "GroupMemberUsers"
                                WHERE "deletedAt" IS NULL
                                GROUP BY 1
                            ) as gmuc ON (gmuc."groupId" = g.id)
                            LEFT JOIN "GroupMemberUsers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL)
                        WHERE tmg."topicId" = :topicId
                        AND tmg."deletedAt" IS NULL
                        AND g."deletedAt" IS NULL
                        ORDER BY level DESC
                    ) mg
                    ${where}
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user.userId,
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
        } catch (err) {
            return next(err);
        }
    });

    const checkPermissionsForGroups = async function (groupIds, userId, level) {
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

        const result = await db
            .query(
                `
                SELECT
                    g.visibility = 'public' AS "isPublic",
                    gm."userId" AS "allowed",
                    gm."userId" AS uid,
                    gm."level" AS level,
                    g.id
                FROM "Groups" g
                LEFT JOIN "GroupMemberUsers" gm
                    ON(gm."groupId" = g.id)
                WHERE g.id IN (:groupIds)
                    AND gm."userId" = :userId
                    AND gm."deletedAt" IS NULL
                    AND g."deletedAt" IS NULL
                GROUP BY id, uid, level;`,
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

        if (result && result.length) {
            if (result.length < groupIds.length) {
                return Promise.reject();
            }
            const checked = [];
            result.forEach((row) => {
                checked.push(
                    new Promise((reject, resolve) => {
                        const blevel = row.level;
                        if (LEVELS[minRequiredLevel] > LEVELS[blevel] && row.isPublic === true) {
                            logger.warn('Access denied to topic due to member without permissions trying to delete user! ', 'userId:', userId);

                            throw new Error('Access denied');
                        }
                        resolve();
                    })
                );
            });
            await Promise.all(checked)
                .catch((err) => {
                    if (err) {
                        return Promise.reject(err);
                    }
                });

            return result;
        } else {
            return Promise.reject();
        }
    };

    /**
     * Create new member Groups to a Topic
     */
    app.post('/api/users/:userId/topics/:topicId/members/groups', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        let members = req.body;
        const topicId = req.params.topicId;

        if (!Array.isArray(members)) {
            members = [members];
        }

        const groupIds = [];
        members.forEach(function (member) {
            groupIds.push(member.groupId);
        });
        try {
            const allowedGroups = await checkPermissionsForGroups(groupIds, req.user.userId, 'admin'); // Checks if all groups are allowed
            if (allowedGroups && allowedGroups[0]) {
                await db.transaction(async function (t) {

                    const topic = await Topic.findOne({
                        where: {
                            id: topicId
                        },
                        transaction: t
                    });
                    const excisitingMembers = await TopicMemberGroup.findAll({
                        where: {
                            topicId: topicId,
                            groupId: {
                                [Op.in]: groupIds
                            }
                        }
                    });
                    const findOrCreateTopicMemberGroups = allowedGroups.map(function (group) {
                        const member = members.find(o => o.groupId === group.id);

                        return TopicMemberGroup
                            .upsert({
                                topicId: topicId,
                                groupId: member.groupId,
                                level: member.level || TopicMemberUser.LEVELS.read
                            },
                                { transaction: t }
                            );
                    });

                    const groupIdsToInvite = [];
                    const memberGroupActivities = [];
                    const results = await Promise.allSettled(findOrCreateTopicMemberGroups);
                    results.forEach((inspection) => {
                        const member = inspection.value[0];
                        if (inspection.status === 'fulfilled') {
                            const exists = excisitingMembers.find((item) => {
                                return item.groupId === member.groupId
                            });
                            const memberGroup = member.toJSON();
                            if (!exists) {
                                groupIdsToInvite.push(memberGroup.groupId);
                                const groupData = allowedGroups.find(item => item.id === memberGroup.groupId);
                                const group = Group.build(groupData);

                                const addActivity = cosActivities.addActivity(
                                    topic,
                                    {
                                        type: 'User',
                                        id: req.user.userId,
                                        ip: req.ip
                                    },
                                    null,
                                    group,
                                    req.method + ' ' + req.path,
                                    t
                                );
                                memberGroupActivities.push(addActivity);
                            }
                        } else {
                            logger.error('Adding Group failed', inspection.reason());
                        }
                    });
                    await Promise.all(memberGroupActivities);
                    const emailResult = await emailLib.sendTopicMemberGroupCreate(groupIdsToInvite, req.user.userId, topicId);
                    if (emailResult && emailResult.errors) {
                        logger.error('ERRORS', emailResult.errors);
                    }

                    t.afterCommit(() => {
                        return res.created();
                    });
                });
            } else {
                return res.forbidden();
            }

        } catch (err) {
            if (err) {
                if (err.message === 'Access denied') {
                    return res.forbidden();
                }
                logger.error('Adding Group to Topic failed', req.path, err);

                return next(err);
            }

            return res.forbidden();
        }
    });


    /**
     * Update User membership information
     */
    app.put('/api/users/:userId/topics/:topicId/members/users/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const newLevel = req.body.level;
        const memberId = req.params.memberId;
        const topicId = req.params.topicId;

        try {
            const topicAdminMembers = await TopicMemberUser
                .findAll({
                    where: {
                        topicId: topicId,
                        level: TopicMemberUser.LEVELS.admin
                    },
                    attributes: ['userId'],
                    raw: true
                });
            const topicMemberUser = await TopicMemberUser.findOne({
                where: {
                    topicId: topicId,
                    userId: memberId
                }
            });

            if (topicAdminMembers && topicAdminMembers.length === 1 && topicAdminMembers.find(m => m.userId === memberId)) {
                return res.badRequest('Cannot revoke admin permissions from the last admin member.');
            }

            // TODO: UPSERT - sequelize has "upsert" from new version, use that if it works - http://sequelize.readthedocs.org/en/latest/api/model/#upsert
            if (topicMemberUser) {
                await db.transaction(async function (t) {
                    topicMemberUser.level = newLevel;

                    await cosActivities.updateActivity(
                        topicMemberUser,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    await topicMemberUser.save({
                        transaction: t
                    });

                    t.afterCommit(() => {
                        return res.ok();
                    });
                });
            } else {
                await TopicMemberUser.create({
                    topicId: topicId,
                    userId: memberId,
                    level: newLevel
                });
                return res.ok();
            }
        } catch (e) {
            return next(e);
        }
    });


    /**
     * Update Group membership information
     */
    app.put('/api/users/:userId/topics/:topicId/members/groups/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const newLevel = req.body.level;
        const memberId = req.params.memberId;
        const topicId = req.params.topicId;

        try {
            let results;
            try {
                results = await checkPermissionsForGroups(memberId, req.user.userId);
            } catch (err) {
                logger.debug(err)
                return res.forbidden();
            }

            if (results && results[0] && results[0].id === memberId) {
                const topicMemberGroup = await TopicMemberGroup.findOne({
                    where: {
                        topicId: topicId,
                        groupId: memberId
                    }
                });

                await db.transaction(async function (t) {
                    topicMemberGroup.level = newLevel;

                    await cosActivities.updateActivity(
                        topicMemberGroup,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    await topicMemberGroup.save({ transaction: t });

                    t.afterCommit(() => res.ok());
                });
            } else {
                return res.forbidden();
            }

        } catch (err) {
            return next(err);
        }
    });


    /**
     * Delete User membership information
     */
    app.delete('/api/users/:userId/topics/:topicId/members/users/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, null, true), async function (req, res, next) {
        const topicId = req.params.topicId;
        const memberId = req.params.memberId;
        try {
            const result = await TopicMemberUser.findAll({
                where: {
                    topicId: topicId,
                    level: TopicMemberUser.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            });

            // At least 1 admin member has to remain at all times..
            if (result.length === 1 && result.find(r => r.userId === memberId)) {
                return res.badRequest('Cannot delete the last admin member.', 10);
            }
            // TODO: Used to use TopicMemberUser.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
            // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
            const topicMemberUser = await db
                .query(
                    `SELECT
                        t.id as "Topic.id",
                        t.title as "Topic.title",
                        t.description as "Topic.description",
                        t.status as "Topic.status",
                        t.visibility as "Topic.visibility",
                        tj."token" as "Topic.join.token",
                        tj."level" as "Topic.join.level",
                        t.categories as "Topic.categories",
                        t."padUrl" as "Topic.padUrl",
                        t."sourcePartnerId" as "Topic.sourcePartnerId",
                        t."endsAt" as "Topic.endsAt",
                        t.hashtag as "Topic.hashtag",
                        t."createdAt" as "Topic.createdAt",
                        t."updatedAt" as "Topic.updatedAt",
                        u.id as "User.id",
                        u.name as "User.name",
                        u.company as "User.company",
                        u.language as "User.language",
                        u.email as "User.email",
                        u."imageUrl" as "User.imageUrl"
                    FROM
                        "TopicMemberUsers" tmu
                    JOIN "Topics" t
                        ON t.id = tmu."topicId"
                    JOIN "TopicJoins" tj
                        ON (tj."topicId" = t.id AND tj."deletedAt" IS NULL)
                    JOIN "Users" u
                        ON u.id = tmu."userId"
                        WHERE
                        tmu."userId" = :userId
                        AND
                        tmu."topicId" = :topicId
                    ;`,
                    {
                        replacements: {
                            topicId: topicId,
                            userId: memberId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            const topic = Topic.build(topicMemberUser.Topic);
            if (topic.status === Topic.STATUSES.closed && req.user.userId !== memberId) {
                return res.forbidden();
            }
            const user = User.build(topicMemberUser.User);
            topic.dataValues.id = topicId;
            user.dataValues.id = memberId;

            await db
                .transaction(async function (t) {
                    if (memberId === req.user.userId) {
                        // User leaving a Topic
                        logger.debug('Member is leaving the Topic', {
                            memberId: memberId,
                            topicId: topicId
                        });
                        await cosActivities
                            .leaveActivity(topic, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                    } else {
                        await cosActivities
                            .deleteActivity(user, topic, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                    }

                    await db
                        .query(
                            `
                            DELETE FROM
                                "TopicMemberUsers"
                            WHERE ctid IN (
                                SELECT
                                    ctid
                                FROM "TopicMemberUsers"
                                WHERE "topicId" = :topicId
                                    AND "userId" = :userId
                                LIMIT 1
                            )
                            `,
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
                    t.afterCommit(() => {
                        return res.ok();
                    });
                });
        } catch (err) {
            return next(err);
        }
    });


    /**
     * Delete Group membership information
     */
    app.delete('/api/users/:userId/topics/:topicId/members/groups/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
        const topicId = req.params.topicId;
        const memberId = req.params.memberId;

        try {
            let results;
            try {
                results = await checkPermissionsForGroups(memberId, req.user.userId);
            } catch (err) {
                logger.error(err);

                return res.forbidden();
            }

            if (results && results[0] && results[0].id === memberId) {
                // TODO: Used to use TopicMemberGroups.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
                // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
                const topicMemberGroup = await db
                    .query(
                        `
                        SELECT
                            t.id as "Topic.id",
                            t.title as "Topic.title",
                            t.description as "Topic.description",
                            t.status as "Topic.status",
                            t.visibility as "Topic.visibility",
                            t.intro as "Topic.intro",
                            t.country as "Topic.country",
                            t.language as "Topic.language",
                            t.contact as "Topic.contact",
                            tj."token" as "Topic.join.token",
                            tj."level" as "Topic.join.level",
                            t.categories as "Topic.categories",
                            t."padUrl" as "Topic.padUrl",
                            t."sourcePartnerId" as "Topic.sourcePartnerId",
                            t."endsAt" as "Topic.endsAt",
                            t.hashtag as "Topic.hashtag",
                            t."createdAt" as "Topic.createdAt",
                            t."updatedAt" as "Topic.updatedAt",
                            g.id as "Group.id",
                            g."parentId" as "Group.parentId",
                            g.name as "Group.name",
                            g."creatorId" as "Group.creator.id",
                            g.visibility as "Group.visibility",
                            g.contact as "Group.contact",
                            g.country as "Group.country",
                            g.language as "Group.language",
                            g.rules as "Group.rules"
                        FROM
                            "TopicMemberGroups" tmg
                        JOIN "Topics" t
                            ON t.id = tmg."topicId"
                        JOIN "TopicJoins" tj
                            ON (tj."topicId" = t.id AND tj."deletedAt" IS NULL)
                        JOIN "Groups" g
                            ON g.id = tmg."groupId"
                            WHERE
                            tmg."groupId" = :groupId
                            AND
                            tmg."topicId" = :topicId
                        ;`,
                        {
                            replacements: {
                                topicId: topicId,
                                groupId: memberId
                            },
                            type: db.QueryTypes.SELECT,
                            raw: true,
                            nest: true
                        }
                    );
                const topic = Topic.build(topicMemberGroup.Topic);
                topic.dataValues.id = topicId;
                const group = Group.build(topicMemberGroup.Group);
                group.dataValues.id = memberId;

                await db.transaction(async function (t) {
                    await cosActivities.deleteActivity(
                        group,
                        topic,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    await db
                        .query(
                            `
                                DELETE FROM
                                    "TopicMemberGroups"
                                WHERE ctid IN (
                                    SELECT
                                        ctid
                                    FROM "TopicMemberGroups"
                                    WHERE "topicId" = :topicId
                                    AND "groupId" = :groupId
                                    LIMIT 1
                                )
                                `,
                            {
                                replacements: {
                                    topicId: topicId,
                                    groupId: memberId
                                },
                                type: db.QueryTypes.DELETE,
                                raw: true
                            }
                        );
                    t.afterCommit(() => res.ok());
                });
            } else {
                return res.forbidden();
            }

        } catch (err) {
            return next(err);
        }

    });

    /**
     * Invite new Members to the Topic
     *
     * Does NOT add a Member automatically, but will send an invite, which has to accept in order to become a Member of the Topic
     *
     * @see /api/users/:userId/topics/:topicId/members/users "Auto accept" - Adds a Member to the Topic instantly and sends a notification to the User.
     */
    app.post('/api/users/:userId/topics/:topicId/invites/users', loginCheck(), topicService.hasPermission(TopicMemberUser.LEVELS.admin, false, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), rateLimiter(5, false), speedLimiter(1, false), async function (req, res) {
        //NOTE: userId can be actual UUID or e-mail - it is comfort for the API user, but confusing in the BE code.
       try {
        const topicId = req.params.topicId;
        const userId = req.user.userId;
        let members = req.body;
        const MAX_LENGTH = 50;

        if (!Array.isArray(members)) {
            members = [members];
        }

        if (members.length > MAX_LENGTH) {
            return res.badRequest("Maximum user limit reached");
        }

        const inviteMessage = members[0].inviteMessage;
        const validEmailMembers = [];
        let validUserIdMembers = [];
        asyncMiddleware
        // userId can be actual UUID or e-mail, sort to relevant buckets
        members.forEach((m) => {
            if (m.userId) {
                m.userId = m.userId.trim();
                // Is it an e-mail?
                if (validator.isEmail(m.userId)) {
                    m.userId = m.userId.toLowerCase(); // https://github.com/citizenos/citizenos-api/issues/234
                    validEmailMembers.push(m); // The whole member object with level
                } else if (validator.isUUID(m.userId)) {
                    validUserIdMembers.push(m);
                } else {
                    logger.warn('Invalid member ID, is not UUID or email thus ignoring', req.method, req.path, m, req.body);
                }
            } else {
                logger.warn('Missing member id, ignoring', req.method, req.path, m, req.body);
            }
        });

        const validEmails = validEmailMembers.map(m => m.userId);
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

            usersExistingEmail.forEach((u) => {
                const member = validEmailMembers.find(m => {
                    return m.userId === u.email
                });
                if (member) {
                    const index = validEmailMembers.findIndex(m => m.userId === u.email);
                    member.userId = u.id;
                    validUserIdMembers.push(member);
                    validEmailMembers.splice(index, 1) // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                }
            });
        }
        await db.transaction(async function (t) {
            let createdUsers;

            // The leftovers are e-mails for which User did not exist
            if (validEmailMembers.length) {
                const usersToCreate = [];
                validEmailMembers.forEach((m) => {
                    usersToCreate.push({
                        email: m.userId,
                        language: m.language,
                        password: null,
                        name: util.emailToDisplayName(m.userId),
                        source: User.SOURCES.citizenos
                    });
                });

                createdUsers = await User.bulkCreate(usersToCreate);
                asyncMiddleware
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
                createdUsers.forEach((u) => {
                    const member = {
                        userId: u.id
                    };asyncMiddleware
                    // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                    const level = validEmailMembers.find(m => m.userId === u.email).level;
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
                return member.userId !== req.user.userId; // Make sure user does not invite self
            });
            const currentMembers = await TopicMemberUser.findAll({
                where: {
                    topicId: topicId
                }
            });asyncMiddleware
            const createInvitePromises = validUserIdMembers.map(async function (member) {
                const addedMember = currentMembers.find(cmember => cmember.userId === member.userId );

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

                            cosActivities.updateActivity(
                                addedMember,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.userId,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );

                            return;
                        }

                        return;
                    } else {
                        return;
                    }
                } else {
                    const deletedCount = await TopicInviteUser
                        .destroy(
                            {
                                where: {
                                    userId: member.userId,
                                    topicId: topicId
                                },
                                transaction: t
                            }
                        );
                    logger.info(`Removed ${deletedCount} invites`);
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

                    const userInvited = User.build({ id: topicInvite.userId });
                    userInvited.dataValues.level = topicInvite.level; // FIXME: HACK? Invite event, putting level here, not sure it belongs here, but.... https://github.com/citizenos/citizenos-fe/issues/112 https://github.com/w3c/activitystreams/issues/506
                    userInvited.dataValues.inviteId = topicInvite.id; // FIXME: HACK? Invite event, pu

                    await cosActivities.inviteActivity(
                        topic,
                        userInvited,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    return topicInvite;
                }
            });

            let createdInvites = await Promise.all(createInvitePromises);

            createdInvites = createdInvites.filter(function (invite) {
                return !!invite;
            });

            for (let invite of createdInvites) {
                invite.inviteMessage = inviteMessage;
            }

            t.afterCommit(async () => {
                if (createdInvites.length) {
                    await emailLib.sendTopicMemberUserInviteCreate(createdInvites);
                    return res.created({
                        count: createdInvites.length,
                        rows: createdInvites
                    });
                } else {
                    return res.badRequest('No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.', 1);
                }
            });
        });
    } catch (err) {
        if (err.errors) {
            let resErrors = {};
            Object.keys(err.errors).forEach(key => {
                resErrors[err.errors[key].path] = err.errors[key].message;
            });
            return res.badRequest(resErrors);
        } else {
            logger.error('Error creating user:', err);
            return res.internalServerError(err);
        }
    }
    });

    app.get('/api/users/:userId/topics/:topicId/invites/users', loginCheck(), asyncMiddleware(async function (req, res) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        const topicId = req.params.topicId;
        const userId = req.user.userId;
        const permissions = await topicService._hasPermission(topicId, userId, TopicMemberUser.LEVELS.read, true);

        let where = '';
        if (search) {
            where = ` AND u.name ILIKE :search `
        }

        const order = req.query.order;
        let sortOrder = req.query.sortOrder || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` u.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` tiu."level"::"enum_TopicInviteUsers_level" ${sortOrder} `;
                    break;
                default:
                    sortSql += ` u.name ASC `
            }
        } else {
            sortSql += ` u.name ASC `;
        }

        let dataForTopicAdmin = '';
        if (permissions && permissions.topic.permissions.level === TopicMemberUser.LEVELS.admin) {
            dataForTopicAdmin = `
            u.email as "user.email",
            `;
        }

        // User is not member and can only get own result
        if (!permissions) {
            where = ` AND tiu."userId" = :userId `;
        }

        const invites = await db
            .query(
                `SELECT
                        tiu.id,
                        tiu."creatorId",
                        tiu.level,
                        tiu."topicId",
                        tiu."userId",
                        tiu."expiresAt",
                        tiu."createdAt",
                        tiu."updatedAt",
                        u.id as "user.id",
                        u.name as "user.name",
                        u."imageUrl" as "user.imageUrl",
                        ${dataForTopicAdmin}
                        count(*) OVER()::integer AS "countTotal"
                    FROM "TopicInviteUsers" tiu
                    JOIN "Users" u ON u.id = tiu."userId"
                    LEFT JOIN "UserConnections" uc ON (uc."userId" = tiu."userId" AND uc."connectionId" = 'esteid')
                    WHERE tiu."topicId" = :topicId AND tiu."deletedAt" IS NULL AND tiu."expiresAt" > NOW()
                    ${where}
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset
                    ;`,
                {
                    replacements: {
                        topicId,
                        limit,
                        offset,
                        userId,
                        search: `%${search}%`
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        if (!invites) {
            return res.notFound();
        }

        let countTotal = 0;

        if (invites.length) {
            countTotal = invites[0].countTotal;
        } else if (!permissions) {
            return res.forbidden('Insufficient permissions');
        }

        invites.forEach(function (invite) {
            if (invite.user.email) {
                invite.user.email = invite.user.email.replace(/^(.).*(?=@)/, '$1*****');
            }
            delete invite.countTotal;
        });

        return res.ok({
            countTotal,
            count: invites.length,
            rows: invites
        });
    }));

    app.get(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        const invite = await TopicInviteUser
            .findOne({
                where: {
                    id: inviteId,
                    topicId: topicId
                },
                paranoid: false,
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'title', 'visibility', 'creatorId', 'imageUrl', 'intro', 'description'],
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
                        attributes: ['id', 'email', 'password', 'source'],
                        as: 'user',
                        required: true,
                        include: [UserConnection]
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
            });

        if (!invite) {
            return res.notFound();
        }
        const hasAccess = await topicService._hasPermission(topicId, invite.userId, TopicMemberUser.LEVELS.read, true);

        if (hasAccess) {
            return res.ok(invite, 1); // Invite has already been accepted OR deleted and the person has access
        }

        const invites = await TopicInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        topicId: topicId
                    },
                    include: [
                        {
                            model: Topic,
                            attributes: ['id', 'title', 'visibility', 'creatorId', 'imageUrl', 'intro', 'description'],
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
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
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

        const levels = Object.keys(TopicMemberUser.LEVELS);
        const finalInvites = invites.filter((invite) => {
            if (invite.expiresAt > Date.now() && invite.deletedAt === null) {
                return invite;
            }
        }).sort((a, b) => {
            if (levels.indexOf(a.level) < levels.indexOf(b.level)) return 1;
            if (levels.indexOf(a.level) > levels.indexOf(b.level)) return -1;
            if (levels.indexOf(a.level) === levels.indexOf(b.level)) return 0;
        });

        if (!finalInvites.length) {
            if (invite.deletedAt) {
                return res.gone('The invite has been deleted', 1);
            }


            if (invite.expiresAt < Date.now()) {
                return res.gone(`The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`, 2);
            }
        }

        // At this point we can already confirm users e-mail
        await User
            .update(
                {
                    emailIsVerified: true
                },
                {
                    where: { id: invite.userId },
                    fields: ['emailIsVerified'],
                    limit: 1
                }
            );

        // User has not been registered by a person but was created by the system on invite - https://github.com/citizenos/citizenos-fe/issues/773
        if (!invite.user.password && invite.user.source === User.SOURCES.citizenos && !invite.user.UserConnections.length) {
            return res.ok(finalInvites[0], 2);
        }

        return res.ok(finalInvites[0], 0);
    }));

    app.put(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], loginCheck(), topicService.hasPermission(TopicMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const newLevel = req.body.level;
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        if (!(TopicMemberUser.LEVELS[newLevel])) {
            return res.badRequest(`Invalid level "${newLevel}"`)
        }

        const topicMemberUser = await TopicInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        topicId: topicId
                    }
                }
            );

        if (topicMemberUser) {
            await db.transaction(async function (t) {
                topicMemberUser.level = newLevel;

                await cosActivities.updateActivity(
                    topicMemberUser,
                    null,
                    {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    },
                    req.method + ' ' + req.path,
                    t
                );

                await topicMemberUser.save({
                    transaction: t
                });

                t.afterCommit(() => {
                    return res.ok();
                });
            });
        } else {
            return res.notFound();
        }
    }));

    app.delete(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], loginCheck(), topicService.hasPermission(TopicMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;
        const invite = await TopicInviteUser.findOne({
            where: {
                id: inviteId
            },
            paranoid: false
        });

        if (!invite) {
            return res.notFound('Invite not found', 1);
        }

        const deletedCount = await TopicInviteUser
            .destroy(
                {
                    where: {
                        userId: invite.userId,
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
        const userId = req.user.userId;
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
                    },
                    paranoid: false
                }
            );

        if (invite && invite.userId !== userId) {
            return res.forbidden();
        }
        const invites = await TopicInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        topicId: topicId
                    },
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
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
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
        const levelsArray = Object.values(TopicMemberUser.LEVELS);
        const finalInvites = invites.filter((invite) => {
            if (invite.expiresAt > Date.now() && invite.deletedAt === null) {
                return invite;
            }
        }).sort((a, b) => {
            if (levelsArray.indexOf(a.level) < levelsArray.indexOf(b.level)) return 1;
            if (levelsArray.indexOf(a.level) > levelsArray.indexOf(b.level)) return -1;
            if (levelsArray.indexOf(a.level) === levelsArray.indexOf(b.level)) return 0;
        });
        const memberUserExisting = await TopicMemberUser
            .findOne({
                where: {
                    topicId: topicId,
                    userId: userId
                }
            });
        if (memberUserExisting) {
            // User already a member, see if we need to update the level
            if (finalInvites.length && levelsArray.indexOf(memberUserExisting.level) < levelsArray.indexOf(finalInvites[0].level)) {
                const memberUserUpdated = await memberUserExisting.update({
                    level: invite.level
                });
                return res.ok(memberUserUpdated);
            } else {
                // No level update, respond with existing member info
                return res.ok(memberUserExisting);
            }
        }

        if (!finalInvites.length) {
            // Find out if the User is already a member of the Topic
            if (invite.expiresAt < Date.now()) {
                return res.gone(`The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`, 2);
            }
            return res.notFound();
        }

        const finalInvite = finalInvites[0];
        // Has the invite expired?


        // Topic needed just for the activity
        const topic = await Topic.findOne({
            where: {
                id: finalInvite.topicId
            }
        });

        await db.transaction(async function (t) {
            const member = await TopicMemberUser.create(
                {
                    topicId: finalInvite.topicId,
                    userId: finalInvite.userId,
                    level: TopicMemberUser.LEVELS[finalInvite.level]
                },
                {
                    transaction: t
                }
            );

            await TopicInviteUser.destroy({
                where: {
                    topicId: finalInvite.topicId,
                    userId: finalInvite.userId
                },
                transaction: t
            });

            const user = User.build({ id: member.userId });
            user.dataValues.id = member.userId;

            await cosActivities.acceptActivity(
                finalInvite,
                {
                    type: 'User',
                    id: req.user.userId,
                    ip: req.ip
                },
                {
                    type: 'User',
                    id: finalInvite.creatorId
                },
                topic,
                req.method + ' ' + req.path,
                t
            );
            t.afterCommit(() => {
                return res.created(member);
            });
        });
    }));

    /**
     * Get PUBLIC Topic information for given token.
     * Returns 404 for PRIVATE Topic even if it exists.
     */
    app.get('/api/topics/join/:token', async function (req, res) {
        const token = req.params.token;
        const user = req.user;
        const topicJoin = await TopicJoin.findOne({
            where: {
                token: token
            }
        });

        if (!topicJoin) {
            return res.notFound();
        }
        let topicMember;
        if (user) {
            topicMember = await db.query(`
            SELECT
            COALESCE(
                tmup.level,
                tmgp.level,
                    'none'
            ) as "level"
            FROM "Topics" t
                LEFT JOIN (
                SELECT
                    tmu."topicId",
                    tmu."userId",
                    tmu.level::text AS level
                FROM "TopicMemberUsers" tmu
                WHERE tmu."deletedAt" IS NULL
            ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
            LEFT JOIN (
                SELECT
                    tmg."topicId",
                    gm."userId",
                    MAX(tmg.level)::text AS level
                FROM "TopicMemberGroups" tmg
                    LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                WHERE tmg."deletedAt" IS NULL
                AND gm."deletedAt" IS NULL
                GROUP BY "topicId", "userId"
            ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
            WHERE t.id = :topicId
            `, {
                replacements: {
                    topicId: topicJoin.topicId,
                    userId: user.id
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });
        }
        let topic = await Topic.findOne({
            where: {
                id: topicJoin.topicId
            },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'company', 'imageUrl'],
                    as: 'creator',
                    required: true
                },
            ],
            attributes: ['id', 'visibility', 'title', 'intro', 'description', 'imageUrl', 'visibility']
        });

        if (!topic) {
            return res.notFound();
        }
        topic = topic.toJSON();
        if (topicMember && topicMember.length) {
            topic.permission = { level: topicMember[0].level };
        }

        return res.ok(topic);
    });


    /**
     * Join authenticated User to Topic with a given token.
     *
     * Allows sharing of private join urls for example in forums, on conference screen...
     */
    app.post('/api/topics/join/:token', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const token = req.params.token;
        const userId = req.user.userId;

        const topicJoin = await TopicJoin.findOne({
            where: {
                token: token
            }
        });

        if (!topicJoin) {
            return res.badRequest('Matching token not found', 1);
        }

        const topic = await Topic.findOne({
            where: {
                id: topicJoin.topicId
            }
        });

        await db.transaction(async function (t) {
            const [memberUser, created] = await TopicMemberUser.findOrCreate({//eslint-disable-line
                where: {
                    topicId: topic.id,
                    userId: userId
                },
                defaults: {
                    level: topicJoin.level
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
                        level: topicJoin.level
                    },
                    req.method + ' ' + req.path,
                    t
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
            resObject.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });
            t.afterCommit(() => {
                return res.ok(resObject);
            });
        });
    }));

    /**
     * Join authenticated User to Topic with a given token.
     *
     * Allows sharing of private join urls for example in forums, on conference screen...
     */
    app.post('/api/users/:userId/topics/:topicId/join', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;

        const topic = await Topic.findOne({
            where: {
                id: req.params.topicId,
                visibility: Topic.VISIBILITY.public
            }
        });

        if (!topic) {
            return res.badRequest('Topic not found', 1);
        }



        await db.transaction(async function (t) {
            const [memberUser, created] = await TopicMemberUser.findOrCreate({//eslint-disable-line
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
            resObject.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });
            t.afterCommit(() => {
                return res.ok(resObject);
            });
        });
    }));

    /**
     * Add Topic Attachment
     */
    app.post('/api/users/:userId/topics/:topicId/attachments/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, false, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const attachmentLimit = config.attachments.limit || 5;
        const topicId = req.params.topicId;
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

            let data = await cosUpload.upload(req, topicId);
            data.creatorId = req.user.id;
            let attachment = Attachment.build(data);

            await db.transaction(async function (t) {
                attachment = await attachment.save({ transaction: t });
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

                t.afterCommit(() => {
                    return res.created(attachment.toJSON());
                });
            });
        } catch (err) {
            if (err.type && (err.type === 'fileSize' || err.type === 'fileType')) {
                return res.forbidden(err.message)
            }
            next(err);
        }
    });

    app.post('/api/users/:userId/topics/:topicId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, false, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const topicId = req.params.topicId;
        const name = req.body.name;
        const type = req.body.type;
        const source = req.body.source;
        const size = req.body.size;
        let link = req.body.link;
        const attachmentLimit = config.attachments.limit || 5;
        if (source !== Attachment.SOURCES.upload && !link) {
            return res.badRequest('Missing attachment link');
        }
        if (!name) {
            return res.badRequest('Missing attachment name');
        }

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
            let urlObject;
            if (link) {
                urlObject = new URL(link);
            }

            let invalidLink = false;
            switch (source) {
                case Attachment.SOURCES.dropbox:
                    if (['www.dropbox.com', 'dropbox.com'].indexOf(urlObject.hostname) === -1) {
                        invalidLink = true;
                    }
                    break;
                case Attachment.SOURCES.googledrive:
                    if (urlObject.hostname.split('.').splice(-2).join('.') !== 'google.com') {
                        invalidLink = true;
                    }
                    break;
                case Attachment.SOURCES.onedrive:
                    if (urlObject.hostname !== '1drv.ms') {
                        invalidLink = true;
                    }
                    break;
                default:
                    return res.badRequest('Invalid link source');
            }

            if (invalidLink) {
                return res.badRequest('Invalid link source');
            }

            let attachment = Attachment.build({
                name: name,
                type: type,
                size: size,
                source: source,
                creatorId: req.user.userId,
                link: link
            });

            await db.transaction(async function (t) {
                attachment = await attachment.save({ transaction: t });
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
                        id: req.user.userId,
                        ip: req.ip
                    },
                    null,
                    topic,
                    req.method + ' ' + req.path,
                    t
                );

                t.afterCommit(() => {
                    return res.ok(attachment.toJSON());
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.put('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, false, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const newName = req.body.name;

        if (!newName) {
            return res.badRequest('Missing attachment name');
        }

        try {
            const attachment = await Attachment
                .findOne({
                    where: {
                        id: req.params.attachmentId
                    },
                    include: [Topic]
                });

            attachment.name = newName;

            await db
                .transaction(async function (t) {
                    const topic = attachment.Topics[0];
                    delete attachment.Topics;

                    await cosActivities.updateActivity(
                        attachment,
                        topic,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    await attachment.save({
                        transaction: t
                    });

                    t.afterCommit(() => {
                        return res.ok(attachment.toJSON());
                    });
                });
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Delete Topic Attachment
     */
    app.delete('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, false, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp], true), async function (req, res, next) {
        try {
            const attachment = await Attachment.findOne({
                where: {
                    id: req.params.attachmentId
                },
                include: [Topic]
            });

            await db
                .transaction(async function (t) {
                    const link = new URL(attachment.link);
                    if (attachment.source === Attachment.SOURCES.upload) {
                        await cosUpload.delete(link.pathname);
                    }
                    await cosActivities.deleteActivity(attachment, attachment.Topics[0], {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    }, req.method + ' ' + req.path, t);

                    await attachment.destroy({ transaction: t });

                    t.afterCommit(() => {
                        return res.ok();
                    });
                })
        } catch (err) {
            return next(err);
        }
    });

    const getTopicAttachments = async (topicId) => {
        return await db
            .query(
                `
                SELECT
                    a.id,
                    a.name,
                    a.size,
                    a.source,
                    a.type,
                    a.link,
                    a."createdAt",
                    c.id as "creator.id",
                    c.name as "creator.name"
                FROM "TopicAttachments" ta
                JOIN "Attachments" a ON a.id = ta."attachmentId"
                JOIN "Users" c ON c.id = a."creatorId"
                WHERE ta."topicId" = :topicId
                AND a."deletedAt" IS NULL
                ;
                `,
                {
                    replacements: {
                        topicId: topicId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
    }
    const topicAttachmentsList = async function (req, res, next) {
        try {
            const attachments = await getTopicAttachments(req.params.topicId);

            return res.ok({
                count: attachments.length,
                rows: attachments
            });
        } catch (err) {
            return next(err);
        }
    };

    app.get('/api/users/:userId/topics/:topicId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicAttachmentsList);
    app.get('/api/topics/:topicId/attachments', topicService.hasVisibility(Topic.VISIBILITY.public), topicAttachmentsList);

    const readAttachment = async function (req, res, next) {
        try {
            const attachment = await Attachment
                .findOne({
                    where: {
                        id: req.params.attachmentId
                    }
                });

            if (attachment && attachment.source === Attachment.SOURCES.upload && req.query.download) {
                const fileUrl = new URL(attachment.link);
                let filename = attachment.name;

                if (filename.split('.').length <= 1 || path.extname(filename) !== `.${attachment.type}`) {
                    filename += '.' + attachment.type;
                }

                const options = {
                    hostname: fileUrl.hostname,
                    path: fileUrl.pathname,
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
                        return next(err);
                    })
                    .end();
            } else {
                return res.ok(attachment.toJSON());
            }
        } catch (err) {
            return next(err);
        }
    };

    app.get('/api/users/:userId/topics/:topicId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), readAttachment);
    app.get('/api/topics/:topicId/attachments/:attachmentId', topicService.hasVisibility(Topic.VISIBILITY.public), readAttachment);

    const topicReportsCreate = async function (req, res, next) {
        try {
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

            await db.transaction(async function (t) {
                const topicReport = await TopicReport
                    .create(
                        {
                            topicId: topicId,
                            type: req.body.type,
                            text: req.body.text,
                            creatorId: req.user.userId,
                            creatorIp: req.ip
                        },
                        {
                            transaction: t
                        }
                    );

                await emailLib.sendTopicReport(topicReport);

                t.afterCommit(() => {
                    return res.ok(topicReport);
                })
            });
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Report a Topic
     *
     * @see https://github.com/citizenos/citizenos-api/issues/5
     */
    app.post(['/api/users/:userId/topics/:topicId/reports', '/api/topics/:topicId/reports'], loginCheck(['partner']), topicService.hasVisibility(Topic.VISIBILITY.public), topicReportsCreate);

    /**
     * Read Topic Report
     *
     * @see https://github.com/citizenos/citizenos-api/issues/5
     */
    app.get(['/api/topics/:topicId/reports/:reportId', '/api/users/:userId/topics/:topicId/reports/:reportId'], topicService.hasVisibility(Topic.VISIBILITY.public), topicService.hasPermissionModerator(), async function (req, res, next) {
        try {
            const topicReports = await db
                .query(
                    `
                        SELECT
                            tr."id",
                            tr."type",
                            tr."text",
                            tr."createdAt",
                            tr."creatorId" as "creator.id",
                            tr."moderatedById" as "moderator.id",
                            tr."moderatedReasonText",
                            tr."moderatedReasonType",
                            tr."moderatedAt",
                            t."id" as "topic.id",
                            t."title" as "topic.title",
                            t."description" as "topic.description",
                            t."updatedAt" as "topic.updatedAt"
                        FROM "TopicReports" tr
                        LEFT JOIN "Topics" t ON (t.id = tr."topicId")
                        WHERE tr.id = :id
                        AND t.id = :topicId
                        AND tr."deletedAt" IS NULL
                    ;`,
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
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Moderate a Topic - moderator approves a report, thus applying restrictions to the Topic
     */
    app.post(['/api/topics/:topicId/reports/:reportId/moderate', '/api/users/:userId/topics/:topicId/reports/:reportId/moderate'], topicService.hasVisibility(Topic.VISIBILITY.public), topicService.hasPermissionModerator(), async function (req, res, next) {
        const moderatedReasonType = req.body.type; // Delete reason type which is provided in case deleted/hidden by moderator due to a user report
        const moderatedReasonText = req.body.text; // Free text with reason why the comment was deleted/hidden
        try {
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

            await db
                .transaction(async function (t) {
                    topicReportRead.moderatedById = req.user.userId;
                    topicReportRead.moderatedAt = db.fn('NOW');
                    topicReportRead.moderatedReasonType = moderatedReasonType || ''; // HACK: If Model has "allowNull: true", it will skip all validators when value is "null"
                    topicReportRead.moderatedReasonText = moderatedReasonText || ''; // HACK: If Model has "allowNull: true", it will skip all validators when value is "null"
                    let topicReportSaved = await topicReportRead
                        .save({
                            transaction: t,
                            returning: true
                        });

                    // Pass on the Topic info we loaded, don't need to load Topic again.
                    await emailLib.sendTopicReportModerate(Object.assign(
                        {},
                        topicReportSaved.toJSON(),
                        {
                            topic: topic
                        }
                    ));

                    t.afterCommit(() => {
                        return res.ok(topicReportSaved);
                    });
                });
        } catch (err) {
            return next(err);
        }
    });

    /** Send a Topic report for review - User let's Moderators know that the violations have been corrected **/
    app.post(['/api/users/:userId/topics/:topicId/reports/:reportId/review', '/api/topics/:topicId/reports/:reportId/review'], loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read), async function (req, res, next) {
        const topicId = req.params.topicId;
        const reportId = req.params.reportId;
        const text = req.body.text;
        try {
            if (!text || text.length < 10 || text.length > 4000) {
                return res.badRequest(null, 1, { text: 'Parameter "text" has to be between 10 and 4000 characters' });
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
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Resolve a Topic report - mark the Topic report as fixed, thus lifting restrictions on the Topic
     * We don't require /reports/review request to be sent to enable Moderators to act proactively
     *
     * @see https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce?argumentsPage=1
     */
    app.post(['/api/topics/:topicId/reports/:reportId/resolve', '/api/users/:userId/topics/:topicId/reports/:reportId/resolve'], topicService.hasVisibility(Topic.VISIBILITY.public), topicService.hasPermissionModerator(), async function (req, res, next) {
        const topicId = req.params.topicId;
        const reportId = req.params.reportId;
        try {
            const topicReport = await TopicReport
                .update(
                    {
                        resolvedById: req.user.userId,
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
        } catch (err) {
            return next(err);
        }
    });



    const topicMentionsList = async function (req, res) {
        return res.ok();
        /*  let hashtag = null;
          let queryurl = 'search/tweets';
          let data;

          if (req.query && req.query.test === 'error') { // For testing purposes
              queryurl = 'serch/tweets';
          }
          try {
              const results = await db.query(
                  `
                  SELECT
                      t.hashtag
                  FROM "Topics" t
                  WHERE t."id" = :topicId
                  AND t."deletedAt" IS NULL
                  AND t.hashtag IS NOT NULL
                  `,
                  {
                      replacements: {
                          topicId: req.params.topicId
                      },
                      type: db.QueryTypes.SELECT,
                      raw: true,
                      nest: true
                  }
              )
              if (!results.length) {
                  return res.badRequest('Topic has no hashtag defined', 1);
              }

              hashtag = results[0].hashtag;

              const mentions = await hashtagCache.get(hashtag);
              if (!mentions || (mentions.createdAt && (Math.floor(new Date() - new Date(mentions.createdAt)) / (1000 * 60) >= 15))) {
                  data = await twitter.getAsync(queryurl, {
                      q: '"#' + hashtag + '"',
                      count: 20
                  });
              } else {
                  logger.info('Serving mentions from cache', req.method, req.path, req.user);

                  return res.ok(mentions);
              }

              const allMentions = [];
              if (data && data.statuses) {
                  logger.info('Twitter response', req.method, req.path, req.user, data.statuses.length);
                  data.statuses.forEach(function (m) {
                      let mTimeStamp = new Date(Date.parse(m.created_at)).toISOString();

                      const status = {
                          id: m.id,
                          text: decode(m.text),
                          creator: {
                              name: m.user.name || m.user.screen_name,
                              profileUrl: 'https://twitter.com/' + m.user.screen_name,
                              profilePictureUrl: m.user.profile_image_url_https
                          },
                          createdAt: mTimeStamp,
                          sourceId: 'TWITTER',
                          sourceUrl: 'https://twitter.com/' + m.user.screen_name + '/status/' + m.id
                      };

                      allMentions.push(status);
                  });

                  const cachedMentions = {
                      count: allMentions.length,
                      rows: allMentions,
                      createdAt: (new Date()).toISOString(),
                      hashtag: hashtag
                  };

                  await hashtagCache.set(hashtag, cachedMentions);

                  return res.ok(cachedMentions);
              } else {
                  return res.internalServerError();
              }
          } catch (err) {
              if (err.twitterReply) {
                  logger.error('Twitter error', req.method, req.path, req.user, err);
                  const cachedMentions = await hashtagCache.get(hashtag);
                  if (!cachedMentions) {
                      return res.internalServerError();
                  }

                  return res.ok(cachedMentions);
              }

              return next(err);
          }*/
    };


    /**
     * Read (List) Topic Mentions
     */
    app.get('/api/users/:userId/topics/:topicId/mentions', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicMentionsList);


    /**
     * Read (List) public Topic Mentions
     */
    app.get('/api/topics/:topicId/mentions', topicService.hasVisibility(Topic.VISIBILITY.public), topicMentionsList);

    const topicEventsCreate = async function (req, res, next) {
        const topicId = req.params.topicId;
        try {
            const topic = await Topic
                .findOne({
                    where: {
                        id: topicId
                    }
                });
            if (topic.status === Topic.STATUSES.closed) {
                return res.forbidden();
            }

            await db
                .transaction(async function (t) {
                    const event = await TopicEvent
                        .create(
                            {
                                topicId: topicId,
                                subject: req.body.subject,
                                text: req.body.text
                            },
                            {
                                transaction: t
                            }
                        );
                    const actor = {
                        type: 'User',
                        ip: req.ip
                    };

                    if (req.user && req.user.userId) {
                        actor.id = req.user.userId;
                    }

                    await cosActivities
                        .createActivity(
                            event,
                            topic,
                            actor,
                            req.method + ' ' + req.path,
                            t
                        );
                    t.afterCommit(() => {
                        return res.created(event.toJSON());
                    });
                });
        } catch (err) {
            return next(err);
        }

    };

    /** Create an Event **/
    app.post('/api/users/:userId/topics/:topicId/events', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.followUp]), topicEventsCreate);


    /** Update an Event*/

    app.put('/api/users/:userId/topics/:topicId/events/:eventId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.followUp]), async (req, res, next) => {
        const topicId = req.params.topicId;
        const eventId = req.params.eventId;
        try {
            const topic = await Topic
                .findOne({
                    where: {
                        id: topicId
                    }
                });
            if (topic.status === Topic.STATUSES.closed) {
                return res.forbidden();
            }
            const event = await TopicEvent.findOne({
                where: {
                    id: eventId,
                    topicId: topicId,
                }
            });
            if (!event) {
                return res.notFound();
            }
            await db
                .transaction(async function (t) {
                    event.set({
                        subject: req.body.subject,
                        text: req.body.text
                    });

                    await cosActivities
                        .updateActivity(event, topic, {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);

                    await event.save({ transaction: t });

                    t.afterCommit(() => {
                        return res.ok(event.toJSON());
                    });
                });
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Create an Event with a token issued to a 3rd party
     */
    app.post('/api/topics/:topicId/events', authTokenRestrictedUse, topicEventsCreate);


    const topicEventsList = async function (req, res, next) {
        const topicId = req.params.topicId;
        try {
            const events = await TopicEvent
                .findAll({
                    where: {
                        topicId: topicId
                    },
                    order: [['createdAt', 'DESC']]
                });

            return res.ok({
                count: events.length,
                rows: events
            });
        } catch (err) {
            return next(err);
        }
    };


    /** List Events **/
    app.get('/api/users/:userId/topics/:topicId/events', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.followUp, Topic.STATUSES.closed]), topicEventsList);


    /**
     * Read (List) public Topic Events
     */
    app.get('/api/topics/:topicId/events', topicService.hasVisibility(Topic.VISIBILITY.public), topicEventsList);


    /**
     * Delete event
     */
    app.delete('/api/users/:userId/topics/:topicId/events/:eventId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.followUp]), async function (req, res, next) {
        const topicId = req.params.topicId;
        const eventId = req.params.eventId;
        try {
            const event = await TopicEvent.findOne({
                where: {
                    id: eventId,
                    topicId: topicId
                },
                include: [Topic]
            });

            await db
                .transaction(async function (t) {
                    await cosActivities
                        .deleteActivity(event, event.Topic, {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);

                    await TopicEvent.destroy({
                        where: {
                            id: eventId,
                            topicId: topicId
                        },
                        transaction: t
                    });

                    t.afterCommit(() => {
                        return res.ok();
                    })
                });
        } catch (err) {
            return next(err);
        }
    });

    app.post('/api/users/:userId/topics/:topicId/favourite', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const topicId = req.params.topicId;

        try {
            await db
                .transaction(async function (t) {
                    await TopicFavourite.findOrCreate({
                        where: {
                            topicId: topicId,
                            userId: userId
                        },
                        transaction: t
                    });

                    t.afterCommit(() => {
                        return res.ok();
                    })
                });
        } catch (err) {
            return next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/favourite', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const topicId = req.params.topicId;

        try {
            const topicFavourite = await TopicFavourite.findOne({
                where: {
                    userId: userId,
                    topicId: topicId
                }
            });

            if (topicFavourite) {
                await db
                    .transaction(async function (t) {
                        await TopicFavourite.destroy({
                            where: {
                                userId: userId,
                                topicId: topicId
                            },
                            transaction: t
                        });

                        t.afterCommit(() => {
                            return res.ok();
                        });
                    });
            }
        } catch (err) {
            return next(err);
        }
    });

    /**
    * Get User preferences LIST
    */
    app.get('/api/users/:userId/notificationsettings/topics', loginCheck(), async function (req, res, next) {
        try {
            const order = req.query.orderBy;
            let sortOrder = req.query.order || 'ASC';

            if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
                sortOrder = 'ASC';
            }
            let sortSql = ` ORDER BY `;
            if (order) {
                switch (order) {
                    case 'title':
                        sortSql += ` t.title ${sortOrder} `;
                        break;
                    default:
                        sortSql += ` t.title ASC `
                }
            } else {
                sortSql = ``;
            }
            const limitDefault = 10;
            const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
            let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
            const partnerId = req.user.partnerId;

            let title = req.query.search;
            let where = `t."deletedAt" IS NULL
                        AND t.title IS NOT NULL
                        AND COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" > 'none' `;
            if (title) {
                title = `%${req.query.search}%`;
                where += ` AND t.title ILIKE :title `;
            }

            // All partners should see only Topics created by their site, but our own app sees all.
            if (partnerId) {
                where += ` AND t."sourcePartnerId" = :partnerId `;
            }

            const query = `
                    SELECT
                         t.id AS "topicId",
                         t.title,
                         t."sourcePartnerId",
                         t."sourcePartnerObjectId",
                         usn."allowNotifications",
                         usn."preferences",
                         count(*) OVER()::integer AS "countTotal"
                    FROM "Topics" t
                    LEFT JOIN (
                        SELECT
                            tmu."topicId",
                            tmu."userId",
                            tmu.level::text AS level
                        FROM "TopicMemberUsers" tmu
                        WHERE tmu."deletedAt" IS NULL
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                    LEFT JOIN (
                        SELECT
                            tmg."topicId",
                            gm."userId",
                            MAX(tmg.level)::text AS level
                        FROM "TopicMemberGroups" tmg
                            LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                        GROUP BY "topicId", "userId"
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
                    LEFT JOIN "UserNotificationSettings" usn ON usn."userId" = :userId AND usn."topicId" = t.id
                    WHERE ${where}
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset
                ;`
            const userSettings = await db
                .query(
                    query,
                    {
                        replacements: {
                            userId: req.user.id,
                            title: title,
                            partnerId,
                            offset,
                            limit
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );
            let result = {
                count: 0,
                rows: []
            };
            if (userSettings.length) {
                result = {
                    count: userSettings[0].countTotal,
                    rows: userSettings
                };

            }

            return res.ok(result);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Get User Topic preferences
    */
    app.get('/api/users/:userId/topics/:topicId/notificationsettings', loginCheck(), asyncMiddleware(async function (req, res) {
        const userSettings = await UserNotificationSettings.findOne({
            where: {
                userId: req.user.id,
                topicId: req.params.topicId
            }
        });

        return res.ok(userSettings || {});
    }));

    /**
     * Set User preferences
    */
    app.put('/api/users/:userId/topics/:topicId/notificationsettings', loginCheck(), async function (req, res) {
        const settings = req.body;
        const allowedFields = ['topicId', 'allowNotifications', 'preferences'];
        const finalSettings = {};
        const topicId = req.params.topicId;
        const userId = req.user.id;

        Object.keys(settings).forEach((key) => {
            if (allowedFields.indexOf(key) > -1) finalSettings[key] = settings[key];
        });
        finalSettings.userId = userId;
        finalSettings.topicId = topicId;
        try {
            await db
                .transaction(async function (t) {
                    const topicPromise = Topic.findOne({
                        where: {
                            id: topicId
                        }
                    });

                    await topicService.addUserAsMember(userId, topicId, t);

                    const userSettingsPromise = UserNotificationSettings.findOne({
                        where: {
                            userId,
                            topicId
                        }
                    });
                    let [userSettings, topic] = await Promise.all([userSettingsPromise, topicPromise]);
                    if (!userSettings) {
                        const savedSettings = await UserNotificationSettings.create(
                            finalSettings,
                            {
                                transaction: t
                            }
                        );
                        await cosActivities
                            .createActivity(savedSettings, topic, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                        userSettings = savedSettings;
                    } else {
                        userSettings.set(finalSettings);

                        await cosActivities
                            .updateActivity(userSettings, topic, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);

                        await userSettings.save({ transaction: t });
                    }
                    t.afterCommit(() => {
                        return res.ok(userSettings);
                    });
                });
        } catch (err) {
            console.log(err);
        }
    });

    /**
     * Delete User Topic preferences
    */
    app.delete('/api/users/:userId/topics/:topicId/notificationsettings', loginCheck(), asyncMiddleware(async function (req, res, next) {
        try {
            const topicPromise = Topic.findOne({
                where: {
                    id: req.params.topicId
                }
            });
            const userSettingsPromise = UserNotificationSettings.findOne({
                where: {
                    userId: req.user.id,
                    topicId: req.params.topicId
                }
            });
            let [userSettings, topic] = await Promise.all([userSettingsPromise, topicPromise]);

            await UserNotificationSettings.destroy({
                where: {
                    userId: req.user.id,
                    topicId: req.params.topicId
                },
                force: true
            });
            if (userSettings && topic) {
                await cosActivities.deleteActivity(userSettings, topic, {
                    type: 'User',
                    id: req.user.userId,
                    ip: req.ip
                }, req.method + ' ' + req.path,);
            }

            return res.ok();
        } catch (err) {
            return next(err);
        }
    }));
};
