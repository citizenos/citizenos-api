'use strict';

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
    const cosActivities = app.get('cosActivities');

    const cosEtherpad = app.get('cosEtherpad');

    const CosHtmlToDocx = app.get('cosHtmlToDocx');
    const https = require('https');
    const path = require('path');
    const stream = require('stream');

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const partnerParser = app.get('middleware.partnerParser');

    const cosUpload = app.get('cosUpload');

    const User = models.User;
    const Group = models.Group;
    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicMemberGroup = models.TopicMemberGroup;
    const TopicJoin = models.TopicJoin;
    const TopicReport = models.TopicReport;

    const Vote = models.Vote;

    const TopicAttachment = models.TopicAttachment;
    const Attachment = models.Attachment;
    const TopicFavourite = models.TopicFavourite;
    const UserNotificationSettings = models.UserNotificationSettings;

    const topicService = app.get('topicService');
    const voteService = app.get('voteService');

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
            , uc."connectionData"::jsonb->'phoneNumber' AS "creator.phoneNumber"
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
        if (result && result.length && result[0] && (result[0].visibility === 'public' || result[0]?.permission?.level !== TopicMemberUser.LEVELS.none)) {
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

        return topic;
    };

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

    /**
     * Create a new Topic
     */
    app.post('/api/users/:userId/topics', loginCheck(['partner']), partnerParser, async function (req, res, next) {
        try {
            const data = {
                title: req.body.title,
                visibility: req.body.visibility || Topic.VISIBILITY.private,
                status: req.body.status || Topic.STATUSES.draft,
                categories: req.body.categories,
                imageUrl: req.body.imageUrl,
                hashtag: req.body.hashtag,
                intro: req.body.intro,
                country: req.body.country,
                contact: req.body.contact,
                language: req.body.language,
                endsAt: req.body.endsAt,
                sourcePartnerObjectId: req.body.sourcePartnerObjectId,
                description: req.body.description,
                sourcePartnerId: req.locals.partner ? req.locals.partner.id : null
            };

            const activityContext = {
                ip: req.ip,
                path: req.method + ' ' + req.path
            };

            const topic = await topicService.create(data, req.user.userId, activityContext);

            const user = await User.findOne({
                where: {
                    id: req.user.userId
                },
                attributes: ['id', 'name', 'language']
            });

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

            resObject.sourcePartnerId = req.locals.partner ? req.locals.partner.id : null;
            resObject.favourite = false;
            resObject.permission = {
                level: TopicMemberUser.LEVELS.admin
            };

            const topicJoin = await TopicJoin.findOne({ where: { topicId: topic.id } });
            resObject.join = topicJoin.toJSON();

            return res.created(resObject);
        } catch (err) {
            return next(err);
        }
    });

    //Copy topic
    app.get('/api/users/:userId/topics/:topicId/duplicate', loginCheck(['partner']), partnerParser, topicService.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
        try {
            // I wish Sequelize Model.build supported "fields". This solution requires you to add a field here once new are defined in model.
            const sourceTopic = await topicService.getById(req.params.topicId);

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
            console.log('pad', topic.padUrl);
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
                for (const attachment of attachments) {
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
                }

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
            const topic = await topicService.getById(topicId);

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
            const activityContext = {
                ip: req.ip,
                path: req.method + ' ' + req.path
            };

            const fieldsAllowedToUpdate = ['title', 'categories', 'endsAt', 'hashtag', 'imageUrl', 'contact', 'country', 'language', 'intro', 'sourcePartnerObjectId'];
            if (req.locals.topic.permissions.level === TopicMemberUser.LEVELS.admin) {
                fieldsAllowedToUpdate.push('visibility');
                fieldsAllowedToUpdate.push('status');
            }

            const data = {};
            Object.keys(req.body).forEach(function (key) {
                if (fieldsAllowedToUpdate.indexOf(key) >= 0) {
                    data[key] = req.body[key];
                }
            });
            if (req.body.description) {
                data.description = req.body.description;
            }

            await topicService.update(topicId, data, req.user.userId, activityContext);
        } catch (err) {
            return next(err);
        }
    };

    app.post('/api/users/:userId/topics/:topicId/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        let topic = await topicService.getById(topicId);

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

            await topicService.update(topicId, { imageUrl: imageUrl.link }, req.user.userId, { ip: req.ip, path: req.method + ' ' + req.path });

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
            const activityContext = {
                ip: req.ip,
                path: req.method + ' ' + req.path
            };

            await topicService.destroy(req.params.topicId, req.user.userId, activityContext);

            return res.ok();
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
                     t."memberCount" as "members.users.count",
                     COALESCE(mgc.count, 0) as "members.groups.count",
                     tv."voteId" as "voteId",
                     tv."voteId" as "vote.id",
                     ti."ideationId" as "ideationId",
                     ti."ideationId" as "ideation.id",
                     ti."ideaCount" as "ideation.ideas.count",
                     COALESCE(t."lastActivityAt", t."updatedAt") as "lastActivity",
                     CASE WHEN t.status = 'voting' THEN 1
                        WHEN t.status = 'inProgress' THEN 2
                        WHEN t.status = 'followUp' THEN 3
                     ELSE 4
                     END AS "order",
                     t."commentCount" AS "comments.count",
                     count(*) OVER()::integer AS "countTotal",
                     NULL AS "comments.lastCreatedAt"
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
                GROUP BY t.id, tr.id, tr."moderatedReasonType", tr."moderatedReasonText", ti."ideationId", ti."ideaCount", tj."token", tj.level, c.id, mgc.count, tv."voteId", tmup.level, tmgp.level, tf."topicId"
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
                        COALESCE(t."lastActivityAt", t."updatedAt") as "lastActivity",
                        c.company as "creator.company",
                        t."memberCount" as "members.users.count",
                        COALESCE(mgc.count, 0) as "members.groups.count",
                        CASE WHEN t.status = 'voting' THEN 1
                            WHEN t.status = 'inProgress' THEN 2
                            WHEN t.status = 'followUp' THEN 3
                        ELSE 4
                        END AS "order",
                        tv."voteId",
                        t."commentCount" AS "comments.count",
                        NULL AS "comments.lastCreatedAt",
                        ti."ideationId" as "ideationId",
                        ti."ideationId" as "ideation.id",
                        ti."ideaCount" as "ideation.ideas.count",
                        count(*) OVER()::integer AS "countTotal"
                        ${returncolumns}
                    FROM "Topics" t
                        LEFT JOIN "Users" c ON (c.id = t."creatorId")
                        LEFT JOIN "TopicReports" tr ON (tr."topicId" = t.id AND tr."resolvedById" IS NULL AND tr."deletedAt" IS NULL)
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
                    GROUP BY t.id, tr.id, tr."moderatedReasonType", tr."moderatedReasonText", ti."ideationId", ti."ideaCount", tj."token", tj.level, c.id, mgc.count, tv."voteId"
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
            const topic = await topicService.getById(req.params.topicId);

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
                    const topicPromise = topicService.getById(topicId);

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
            const topicPromise = topicService.getById(req.params.topicId);
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
