'use strict';

/**
 * Topic API-s (/api/../topics/..)
 */

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const { injectReplacements } = require('sequelize/lib/utils/sql');
    //const _ = app.get('lodash');
    const emailLib = app.get('email');
    const cosActivities = app.get('cosActivities');

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;

    const TopicDiscussion = models.TopicDiscussion;
    const Report = models.Report;

    const Comment = models.Comment;
    const CommentVote = models.CommentVote;
    const CommentReport = models.CommentReport;

    const DiscussionComment = models.DiscussionComment;
    const Discussion = models.Discussion;

    const topicLib = require('./topic')(app);

    const isCommentCreator = function () {
        return async function (req, res, next) {
            const userId = req.user.userId;
            const commentId = req.params.commentId;

            try {
                const comment = await Comment.findOne({
                    where: {
                        id: commentId,
                        creatorId: userId,
                        deletedAt: null
                    }
                });

                if (comment) {
                    return next('route');
                } else {
                    return res.forbidden('Insufficient permissions');
                }
            } catch (err) {
                return next(err);
            }
        };
    };

    /**
     * Create a Discussion
     */
    app.post('/api/users/:userId/topics/:topicId/discussions', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress]), async (req, res, next) => {
        const question = req.body.question;
        const deadline = req.body.deadline;
        const topicId = req.params.topicId;
        try {
            if (!question) {
                return res.badRequest('Discussion question is missing', 1);
            }

            const discussion = Discussion.build({
                question,
                deadline,
                creatorId: req.user.id
            });


            // TODO: Some of these queries can be done in parallel
            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [
                    Discussion
                ]
            });
            /* Allow only one discussion per topic*/
            if (topic.Discussions.length) return res.forbidden();
            await db
                .transaction(async function (t) {
                    discussion.topicId = topicId;
                    await discussion.save({ transaction: t });

                    await TopicDiscussion
                        .create(
                            {
                                topicId: topicId,
                                discussionId: discussion.id
                            },
                            { transaction: t }
                        );
                    await cosActivities
                        .createActivity(
                            discussion,
                            topic,
                            {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
                    if (topic.status !== Topic.STATUSES.draft) {

                        topic.status = Topic.STATUSES.ideation;

                        await cosActivities
                            .updateActivity(
                                topic,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.id,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );
                        await topic
                            .save({
                                returning: true,
                                transaction: t
                            });
                    }

                    t.afterCommit(() => {
                        const result = discussion.toJSON();
                        result.topicId = topicId;
                        return res.created(result);
                    });
                });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read a discussion
     */

    const _readDiscussion = async (req, res, next) => {
        const discussionId = req.params.discussionId;
        try {
            const discussionInfo = await db.query(`
            SELECT
                d.id,
                d.question,
                d.deadline,
                d."creatorId",
                d."createdAt",
                td."topicId",
                d."updatedAt",
                COALESCE(dc.count, 0) as "comments.count"
            FROM "Discussions" d
            JOIN "TopicDiscussions" td ON td."discussionId" = d.id
            LEFT JOIN (
                SELECT
                    "discussionId",
                    COUNT("discussionId") as count
                FROM "DiscussionComments"
                GROUP BY "discussionId"
            ) AS dc ON dc."discussionId" = d.id
            WHERE d.id = :discussionId AND d."deletedAt" IS NULL
            ;
        `, {
                replacements: {
                    discussionId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });

            if (!discussionInfo.length) {
                return res.notFound();
            }

            return res.ok(discussionInfo[0]);

        } catch (err) {
            next(err);
        }
    }

    const _readDiscussionParticipants = async (req, res, next) => {
        try {
            const discussionId = req.params.discussionId;
            const users = await db.query(`
            SELECT
                u.id,
                u.name,
                u."imageUrl",
                i."commentCount" as "comments.count",
                count(*) OVER()::integer AS "countTotal"
            FROM "Users" u
            JOIN (
                SELECT "creatorId",
                COUNT(id) as "commentCount"
                FROM "Comments" c
                JOIN "DiscussionComments" dc ON dc."commentId" = c.id
                WHERE dc."discussionId" = :discussionId
                GROUP BY "creatorId"
            ) i ON u.id = c."creatorId";
        `, {
                replacements: {
                    discussionId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
            )
            const count = users[0]?.countTotal || 0;
            users.forEach((user) => delete user.countTotal);

            return res.ok({
                count,
                rows: users
            });
        } catch (err) {
            next(err);
        }
    };

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/participants', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const discussion = await Discussion.findOne({
                where: {
                    id: req.params.discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    }
                ]
            });
            if (!discussion || discussion.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readDiscussionParticipants(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/discussions/:discussionId/participants', async (req, res, next) => {
        try {
            const discussion = await Discussion.findOne({
                where: {
                    id: req.params.discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    }
                ]
            });
            if (!discussion || discussion.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readDiscussionParticipants(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/discussions/:discussionId', async (req, res, next) => {
        try {
            const discussion = await Discussion.findOne({
                where: {
                    id: req.params.discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    }
                ]
            });
            if (!discussion || discussion.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readDiscussion(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        _readDiscussion(req, res, next);
    });

    /**
     * Update a discussion
     */
    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.inProgress]), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const discussionId = req.params.discussionId;
            let fields = ['deadline', 'question'];

            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [
                    {
                        model: Discussion,
                        where: {
                            id: discussionId
                        }
                    }
                ]
            });
            if (!topic || !topic.Discussions || !topic.Discussions.length) {
                return res.notFound();
            }

            const discussion = topic.Discussions[0];
            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        discussion[field] = req.body[field];
                });
                await cosActivities
                    .updateActivity(
                        discussion,
                        topic,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await discussion.save({
                    transaction: t
                });
                t.afterCommit(async () => {
                    const discussionInfo = await db.query(`
                        SELECT
                            d.id,
                            d.question,
                            d.deadline,
                            d."creatorId",
                            d."createdAt",
                            td."topicId",
                            d."updatedAt",
                            COALESCE(dc.count, 0) as "comments.count"
                        FROM "Discussions" d
                        JOIN "TopicDiscussions" td ON td."discussionId" = d.id
                        LEFT JOIN (
                            SELECT
                                "discussionId",
                                COUNT("discussionId") as count
                            FROM "DiscussionComments"
                            GROUP BY "discussionId"
                        ) AS dc ON dc."discussionId" = d.id
                        WHERE d.id = :discussionId AND d."deletedAt" IS NULL
                        ;
                    `, {
                        replacements: {
                            discussionId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    });

                    return res.ok(discussionInfo[0]);
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            const discussionId = req.params.discussionId;
            const discussion = await Discussion.findOne({
                where: {
                    id: discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: { id: req.params.topicId }
                    },
                ]
            });
            if (!discussion) {
                return res.notFound();
            }

            await db
                .transaction(async function (t) {
                    await cosActivities
                        .deleteActivity(discussion, discussion.Topic, {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);


                    await discussion.destroy();

                    t.afterCommit(() => {
                        return res.ok();
                    })
                });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Create Topic Comment
     */
    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), asyncMiddleware(async function (req, res) {
        let type = req.body.type;
        const parentId = req.body.parentId;
        const topicId = req.params.topicId;
        const discussionId = req.params.discussionId;
        const parentVersion = req.body.parentVersion;
        let subject = req.body.subject;
        const text = req.body.text;

        const discussion = await Discussion.findOne({
            where: {
                id: discussionId
            },
            include: [
                {
                    model: Topic,
                    where: { id: topicId }
                },
            ]
        });

        if (!discussion || !discussion.Topics.length) {
            return res.notFound();
        }
        if (discussion.deadline && new Date(discussion.deadline) < new Date()) return res.forbidden();

        const edits = [
            {
                text: text,
                subject: subject,
                createdAt: (new Date()).toISOString(),
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
            creatorId: req.user.userId,
            edits: edits
        });

        if (parentVersion) {
            comment.parentVersion = parentVersion;
        }

        await db
            .transaction(async function (t) {
                await comment.save({ transaction: t });
                //comment.edits.createdAt = JSON.stringify(comment.createdAt);
                const topic = await Topic.findOne({
                    where: {
                        id: req.params.topicId
                    },
                    transaction: t
                });

                if (parentId) {
                    const parentComment = await Comment.findOne({
                        where: {
                            id: parentId
                        },
                        transaction: t
                    });

                    if (parentComment) {
                        await cosActivities
                            .replyActivity(
                                comment,
                                parentComment,
                                topic,
                                {
                                    type: 'User',
                                    id: req.user.userId,
                                    ip: req.ip
                                }
                                , req.method + ' ' + req.path,
                                t
                            );
                    } else {
                        return res.notFound();
                    }
                } else {
                    await cosActivities
                        .createActivity(
                            comment,
                            topic,
                            {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
                }

                await DiscussionComment
                    .create(
                        {
                            discussionId: discussionId,
                            commentId: comment.id
                        },
                        {
                            transaction: t
                        }
                    );

                const c = await db.query(
                    `
                            UPDATE "Comments"
                                SET edits = jsonb_set(edits, '{0,createdAt}', to_jsonb("createdAt"))
                                WHERE id = :commentId
                                RETURNING *;
                        `,
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

                c[0][0].edits.forEach(function (edit) {
                    edit.createdAt = new Date(edit.createdAt).toJSON();
                });

                const resComment = await Comment.build(c[0][0]);
                t.afterCommit(() => {
                    const resObj = resComment.toJSON();
                    resObj.discussionId = discussionId;
                    return res.created(resObj);
                });
            });
    }));

    const topicCommentsList = async function (req, res, next) {
        const orderByValues = {
            rating: 'rating',
            popularity: 'popularity',
            date: 'date'
        };
        let userId = null;
        let orderByComments = '"createdAt" DESC';
        let orderByReplies = '"createdAt" ASC';
        let dataForModerator = '';
        let where = '';
        let types = req.query.types;
        if (types && !Array.isArray(types)) {
            types = [types];
            types = types.filter((type) => Comment.TYPES[type]);
        }

        if (types && types.length) {
            where += ` AND ct.type IN (:types) `
        }

        if (req.user) {
            userId = req.user.userId;

            if (req.user.moderator) {
                dataForModerator = `
                , 'email', u.email
                , 'phoneNumber', uc."connectionData"::jsonb->>'phoneNumber'
                `;
            }
        }

        switch (req.query.orderBy) {
            case orderByValues.rating:
                orderByComments = `votes->'up'->'count' DESC, votes->'up'->'count' ASC, "createdAt" DESC`;
                orderByReplies = `votes->'up'->'count' DESC, votes->'up'->'count' ASC, "createdAt" ASC`;
                break;
            case orderByValues.popularity:
                orderByComments = `votes->'count' DESC, "createdAt" DESC`;
                orderByReplies = `votes->'count' DESC, "createdAt" ASC`;
                break;
            default:
            // Do nothing
        }
        const commentRelationSql = injectReplacements(`
            WITH RECURSIVE commentRelations AS (
                SELECT
                    c.id,
                    c.type::text,
                    jsonb_build_object('id', c."parentId",'version',c."parentVersion") as parent,
                    c.subject,
                    c.text,
                    pg_temp.editCreatedAtToJson(c.edits) as edits,
                    jsonb_build_object('id', u.id,'name',u.name, 'imageUrl', u."imageUrl", 'company', u.company ${dataForModerator}) as creator,
                    CASE
                        WHEN c."deletedById" IS NOT NULL THEN jsonb_build_object('id', c."deletedById", 'name', dbu.name )
                        ELSE jsonb_build_object('id', c."deletedById")
                    END as "deletedBy",
                    c."deletedReasonType"::text,
                    c."deletedReasonText",
                    jsonb_build_object('id', c."deletedByReportId") as report,
                    jsonb_build_object('up', jsonb_build_object('count', COALESCE(cvu.sum, 0), 'selected', COALESCE(cvus.selected, false)), 'down', jsonb_build_object('count', COALESCE(cvd.sum, 0), 'selected', COALESCE(cvds.selected, false)), 'count', COALESCE(cvu.sum, 0) + COALESCE(cvd.sum, 0)) as votes,
                    to_char(c."createdAt" at time zone 'UTC', :dateFormat) as "createdAt",
                    to_char(c."updatedAt" at time zone 'UTC', :dateFormat) as "updatedAt",
                    to_char(c."deletedAt" at time zone 'UTC', :dateFormat) as "deletedAt",
                    0 AS depth
                    FROM "Comments" c
                    LEFT JOIN "Users" u ON (u.id = c."creatorId")
                    LEFT JOIN "UserConnections" uc ON (u.id = uc."userId" AND uc."connectionId" = 'esteid')
                    LEFT JOIN "Users" dbu ON (dbu.id = c."deletedById")
                    LEFT JOIN (
                        SELECT SUM(value), "commentId" FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId"
                    ) cvu ON (cvu."commentId" = c.id)
                    LEFT JOIN (
                        SELECT "commentId", value,  true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId"=:userId
                    ) cvus ON (cvu."commentId"= cvus."commentId")
                    LEFT JOIN (
                        SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId"
                    ) cvd ON (cvd."commentId" = c.id)
                    LEFT JOIN (
                        SELECT "commentId", true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId"=:userId
                    ) cvds ON (cvd."commentId"= cvds."commentId")
                    WHERE c.id = $1
                UNION ALL
                SELECT
                    c.id,
                    c.type::text,
                    jsonb_build_object('id', c."parentId",'version',c."parentVersion") as parent,
                    c.subject,
                    c.text,
                    pg_temp.editCreatedAtToJson(c.edits) as edits,
                    jsonb_build_object('id', u.id,'name',u.name, 'imageUrl', u."imageUrl", 'company', u.company ${dataForModerator}) as creator,
                    CASE
                        WHEN c."deletedById" IS NOT NULL THEN jsonb_build_object('id', c."deletedById", 'name', dbu.name )
                        ELSE jsonb_build_object('id', c."deletedById")
                    END as "deletedBy",
                    c."deletedReasonType"::text,
                    c."deletedReasonText",
                    jsonb_build_object('id', c."deletedByReportId") as report,
                    jsonb_build_object('up', jsonb_build_object('count', COALESCE(cvu.sum, 0), 'selected', COALESCE(cvus.selected, false)), 'down', jsonb_build_object('count', COALESCE(cvd.sum, 0), 'selected', COALESCE(cvds.selected, false)), 'count', COALESCE(cvu.sum, 0) + COALESCE(cvd.sum, 0)) as votes,
                    to_char(c."createdAt" at time zone 'UTC', :dateFormat) as "createdAt",
                    to_char(c."updatedAt" at time zone 'UTC', :dateFormat) as "updatedAt",
                    to_char(c."deletedAt" at time zone 'UTC', :dateFormat) as "deletedAt",
                    commentRelations.depth + 1
                    FROM "Comments" c
                    JOIN commentRelations ON c."parentId" = commentRelations.id AND c.id != c."parentId"
                    LEFT JOIN "Users" u ON (u.id = c."creatorId")
                    LEFT JOIN "UserConnections" uc ON (u.id = uc."userId" AND uc."connectionId" = 'esteid')
                    LEFT JOIN "Users" dbu ON (dbu.id = c."deletedById")
                    LEFT JOIN (
                        SELECT SUM(value), "commentId" FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId"
                    ) cvu ON (cvu."commentId" = c.id)
                    LEFT JOIN (
                        SELECT "commentId", value, true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId" = :userId
                    ) cvus ON (cvus."commentId" = c.id)
                    LEFT JOIN (
                        SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId"
                    ) cvd ON (cvd."commentId" = c.id)
                    LEFT JOIN (
                        SELECT "commentId", true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId" = :userId
                    ) cvds ON (cvds."commentId"= c.id)
            ),`, db.dialect, {
            userId: userId,
            dateFormat: 'YYYY-MM-DDThh24:mi:ss.msZ',
        }
        );

        const query = `
            CREATE OR REPLACE FUNCTION pg_temp.editCreatedAtToJson(jsonb)
                RETURNS jsonb
                AS $$ SELECT array_to_json(array(SELECT jsonb_build_object('subject', r.subject, 'text', r.text,'createdAt', to_char(r."createdAt" at time zone 'UTC', 'YYYY-MM-DDThh24:mi:ss.msZ'), 'type', r.type) FROM jsonb_to_recordset($1) as r(subject text, text text, "createdAt" timestamptz, type text)))::jsonb
            $$
            LANGUAGE SQL;

            CREATE OR REPLACE FUNCTION pg_temp.orderReplies(json)
                RETURNS json
                AS $$ SELECT array_to_json(array( SELECT row_to_json(r.*) FROM json_to_recordset($1)
                    AS
                    r(id uuid, type text, parent jsonb, subject text, text text, edits jsonb, creator jsonb, "deletedBy" jsonb, "deletedReasonType" text, "deletedReasonText" text, report jsonb, votes jsonb, "createdAt" text, "updatedAt" text, "deletedAt" text, replies jsonb)
                    GROUP BY r.*, r."createdAt", r.votes
                    ORDER BY ${orderByReplies}))
            $$
            LANGUAGE SQL;

            CREATE OR REPLACE FUNCTION pg_temp.getCommentTree(uuid)
                RETURNS TABLE(
                        "id" uuid,
                        type text,
                        parent jsonb,
                        subject text,
                        text text,
                        edits jsonb,
                        creator jsonb,
                        "deletedBy" jsonb,
                        "deletedReasonType" text,
                        "deletedReasonText" text,
                        report jsonb,
                        votes jsonb,
                        "createdAt" text,
                        "updatedAt" text,
                        "deletedAt" text,
                        replies jsonb)
                    AS $$

                        ${commentRelationSql}

                        maxdepth AS (
                            SELECT max(depth) maxdepth FROM commentRelations
                        ),

                        rootTree as (
                            SELECT c.* FROM
                                commentRelations c, maxdepth
                                WHERE depth = maxdepth
                            UNION ALL
                            SELECT c.* FROM
                                commentRelations c, rootTree
                                WHERE c.id = (rootTree.parent->>'id')::uuid AND rootTree.id != (rootTree.parent->>'id')::uuid
                        ),

                        commentTree AS (
                            SELECT
                                c.id,
                                c.type,
                                c.parent,
                                c.subject,
                                c.text,
                                pg_temp.editCreatedAtToJson(c.edits) as edits,
                                c.creator,
                                c."deletedBy",
                                c."deletedReasonType",
                                c."deletedReasonText",
                                c.report,
                                c.votes,
                                c."createdAt",
                                c."updatedAt",
                                c."deletedAt",
                                c.depth,
                                jsonb_build_object('count',0, 'rows', json_build_array()) replies
                                FROM commentRelations c, maxdepth
                                WHERE c.depth = maxdepth
                            UNION ALL
                            SELECT
                                (commentRelations).*,
                                jsonb_build_object('rows', pg_temp.orderReplies(array_to_json(
                                    array_cat(
                                        array_agg(commentTree)
                                        ,
                                        array(
                                            SELECT t
                                                FROM (
                                                    SELECT
                                                        l.*,
                                                        jsonb_build_object('count',0, 'rows', json_build_array()) replies
                                                    FROM commentRelations l, maxdepth
                                                        WHERE (l.parent->>'id')::uuid = (commentRelations).id
                                                        AND l.depth < maxdepth
                                                        AND l.id  NOT IN (
                                                            SELECT id FROM rootTree
                                                        )
                                                        ORDER BY l."createdAt" ASC
                                                ) r
                                            JOIN pg_temp.getCommentTree(r.id) t
                                                ON r.id = t.id
                                            ))
                                    )
                                ), 'count',
                                array_length((
                                    array_cat(
                                        array_agg(commentTree)
                                        ,
                                        array(
                                            SELECT t
                                                FROM (
                                                    SELECT
                                                        l.*
                                                    FROM commentRelations l, maxdepth
                                                        WHERE (l.parent->>'id')::uuid = (commentRelations).id
                                                        AND l.depth < maxdepth
                                                        AND l.id  NOT IN (
                                                            SELECT id FROM rootTree
                                                        )
                                                    ORDER BY l."createdAt" ASC
                                                ) r
                                            JOIN pg_temp.getCommentTree(r.id) t
                                                ON r.id = t.id
                                            ))
                                        ), 1)) replies
                    FROM (
                        SELECT commentRelations, commentTree
                            FROM commentRelations
                        JOIN commentTree
                            ON (
                                (commentTree.parent->>'id')::uuid = commentRelations.id
                                AND (commentTree.parent->>'id')::uuid != commentTree.id
                            )
                        ORDER BY commentTree."createdAt" ASC
                    ) v
                    GROUP BY v.commentRelations
                    )

                    SELECT
                        id,
                        type,
                        parent::jsonb,
                        subject,
                        text,
                        edits::jsonb,
                        creator::jsonb,
                        "deletedBy",
                        "deletedReasonType",
                        "deletedReasonText",
                        report,
                        votes::jsonb,
                        "createdAt",
                        "updatedAt",
                        "deletedAt",
                        replies::jsonb
                    FROM commentTree WHERE id = $1
                    ORDER BY ${orderByComments}
                $$
                LANGUAGE SQL;
                ;
        `;
        const selectSql = injectReplacements(`
            SELECT
                ct.id,
                ct.type,
                ct.parent,
                ct.subject,
                ct.text,
                dc."discussionId",
                ct.edits,
                ct.creator,
                ct."deletedBy",
                ct."deletedReasonType",
                ct."deletedReasonText",
                ct.report,
                ct.votes,
                ct."createdAt",
                ct."updatedAt",
                ct."deletedAt",
                ct.replies::jsonb
            FROM
                "DiscussionComments" dc
            JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
            JOIN "Comments" c ON c.id = dc."commentId" AND c.id = c."parentId"
            JOIN pg_temp.getCommentTree(dc."commentId") ct ON ct.id = ct.id
            WHERE td."topicId" = :topicId
            ${where}
            ORDER BY ${orderByComments}
            LIMIT :limit
            OFFSET :offset
        `, db.dialect,
            {
                types: types,
                topicId: req.params.topicId,
                limit: parseInt(req.query.limit, 10) || 15,
                offset: parseInt(req.query.offset, 10) || 0
            }
        );

        try {
            const commentsQuery = db
                .query(`${query} ${selectSql}`,
                    {
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );
            const commentCountQuery = db
                .query(`
                        SELECT
                            c.type,
                            COUNT(c.type)
                        FROM "DiscussionComments" dc
                        JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                        JOIN "Comments" c ON dc."commentId" = c.id
                        WHERE td."topicId" = :topicId
                        GROUP BY c.type;
                    `, {
                    replacements: {
                        topicId: req.params.topicId
                    }
                });
            const [comments, commentsCount] = await Promise.all([commentsQuery, commentCountQuery]);

            const setDiscussionId = (discussionId, reply) => {
                reply.discussionId = discussionId;
                if (reply.replies.rows.length) {
                    reply.replies.rows.forEach((r) => setDiscussionId(discussionId, r));
                }
            }
            comments.forEach((comment) => {
                const discussionId = comment.discussionId;
                comment.replies.rows.forEach((reply) => {
                    setDiscussionId(discussionId, reply);
                })
            });

            let countRes = {
                pro: 0,
                con: 0,
                poi: 0,
                reply: 0,
                total: 0
            }

            if (commentsCount.length) {
                commentsCount[0].forEach((item) => {
                    countRes[item.type] = item.count;
                });
            }
            countRes.total = countRes.pro + countRes.con + countRes.poi + countRes.reply;
            return res.ok({
                count: countRes,
                rows: comments
            });
        } catch (err) {
            console.log('ERR', err)
            return next(err);
        }
    };

    /**
     * Read (List) Topic Comments
     */
    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), topicLib.isModerator(), topicCommentsList);

    /**
     * Read (List) public Topic Comments
     */
    app.get('/api/topics/:topicId/discussions/:discussionId/comments', topicLib.hasVisibility(Topic.VISIBILITY.public), topicLib.isModerator(), topicCommentsList);

    /**
     * Delete Topic Comment
     */
    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', loginCheck(['partner']), isCommentCreator(), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, false, null, true));

    //WARNING: Don't mess up with order here! In order to use "next('route')" in the isCommentCreator, we have to have separate route definition
    //NOTE: If you have good ideas how to keep one route definition with several middlewares, feel free to share!
    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', asyncMiddleware(async function (req, res) {
        await db
            .transaction(async function (t) {
                const comment = await Comment.findOne({
                    where: {
                        id: req.params.commentId
                    },
                    include: { model: Discussion, include: [Topic] }
                });

                comment.deletedById = req.user.userId;

                await comment.save({
                    transaction: t
                });

                await cosActivities
                    .deleteActivity(
                        comment,
                        comment.Discussions[0].Topics[0],
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );
                await Comment
                    .destroy({
                        where: {
                            id: req.params.commentId
                        },
                        transaction: t
                    });
                t.afterCommit(() => res.ok());
            });
    }));

    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', loginCheck(['partner']), isCommentCreator());

    //WARNING: Don't mess up with order here! In order to use "next('route')" in the isCommentCreator, we have to have separate route definition.
    //NOTE: If you have good ideas how to keep one route definition with several middlewares, feel free to share!
    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', asyncMiddleware(async function (req, res) {
        const subject = req.body.subject;
        const text = req.body.text;
        let type = req.body.type;
        const commentId = req.params.commentId;

        const comment = await Comment.findOne({
            where: {
                id: commentId
            },
            include: { model: Discussion, include: [Topic] }
        });

        const now = (new Date()).toISOString();
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

        await db
            .transaction(async function (t) {
                const topic = comment.Discussions[0].Topics[0];
                delete comment.Topic;

                await cosActivities
                    .updateActivity(
                        comment,
                        topic,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await comment.save({
                    transaction: t
                });

                // Sequelize somehow fails to replace inside jsonb_set
                await db
                    .query(`UPDATE "Comments"
                    SET edits = jsonb_set(edits, '{${comment.edits.length - 1}, createdAt }', to_jsonb("updatedAt"))
                    WHERE id = :commentId
                    RETURNING *;
                `,
                        {
                            replacements: {
                                commentId
                            },
                            type: db.QueryTypes.UPDATE,
                            raw: true,
                            nest: true,
                            transaction: t
                        });

                t.afterCommit(() => {
                    return res.ok();
                });
            });
    }));

    const topicCommentsReportsCreate = async function (req, res, next) {
        const commentId = req.params.commentId;
        try {
            const comment = await Comment.findOne({
                where: {
                    id: commentId
                }
            });

            if (!comment) {
                return comment;
            }

            await db
                .transaction(async function (t) {
                    const report = await Report
                        .create(
                            {
                                type: req.body.type,
                                text: req.body.text,
                                creatorId: req.user.userId,
                                creatorIp: req.ip
                            },
                            {
                                transaction: t
                            }
                        );
                    await cosActivities.addActivity(
                        report,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        null,
                        comment,
                        req.method + ' ' + req.path,
                        t
                    );
                    await CommentReport
                        .create(
                            {
                                commentId: commentId,
                                reportId: report.id
                            },
                            {
                                transaction: t
                            }
                        );
                    if (!report) {
                        return res.notFound();
                    }

                    await emailLib.sendCommentReport(commentId, report)

                    t.afterCommit(() => {
                        return res.ok(report);
                    });
                });
        } catch (err) {
            return next(err);
        }
    };

    app.post(['/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/reports', '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports'], loginCheck(['partner']), topicCommentsReportsCreate);

    /**
     * Read Report
     */
    app.get(['/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId'], authTokenRestrictedUse, asyncMiddleware(async function (req, res) {
        const results = await db
            .query(
                `
                        SELECT
                            r."id",
                            r."type",
                            r."text",
                            r."createdAt",
                            c."id" as "comment.id",
                            c.subject as "comment.subject",
                            c."text" as "comment.text"
                        FROM "Reports" r
                        LEFT JOIN "CommentReports" cr ON (cr."reportId" = r.id)
                        LEFT JOIN "Comments" c ON (c.id = cr."commentId")
                        WHERE r.id = :reportId
                        AND c.id = :commentId
                        AND r."deletedAt" IS NULL
                    ;`,
                {
                    replacements: {
                        commentId: req.params.commentId,
                        reportId: req.params.reportId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        if (!results || !results.length) {
            return res.notFound();
        }

        const commentReport = results[0];

        return res.ok(commentReport);
    }));

    app.post('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, asyncMiddleware(async function (req, res) {
        const eventTokenData = req.locals.tokenDecoded;
        const type = req.body.type;

        if (!type) {
            return res.badRequest({ type: 'Property type is required' });
        }

        const commentReport = (await db
            .query(
                `
                        SELECT
                            c."id" as "comment.id",
                            c."updatedAt" as "comment.updatedAt",
                            r."id" as "report.id",
                            r."createdAt" as "report.createdAt"
                        FROM "CommentReports" cr
                        LEFT JOIN "Reports" r ON (r.id = cr."reportId")
                        LEFT JOIN "Comments" c ON (c.id = cr."commentId")
                        WHERE cr."commentId" = :commentId AND cr."reportId" = :reportId
                        AND c."deletedAt" IS NULL
                        AND r."deletedAt" IS NULL
                    ;`,
                {
                    replacements: {
                        commentId: req.params.commentId,
                        reportId: req.params.reportId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            ))[0];

        if (!commentReport) {
            return res.notFound();
        }

        let comment = commentReport.comment;
        const report = commentReport.report;

        // If Comment has been updated since the Report was made, deny moderation cause the text may have changed.
        if (comment.updatedAt.getTime() > report.createdAt.getTime()) {
            return res.badRequest('Report has become invalid cause comment has been updated after the report', 10);
        }

        comment = await Comment.findOne({
            where: {
                id: comment.id
            },
            include: { model: Discussion, include: [Topic] }
        });

        const topic = comment.Discussions[0].Topics[0];
        delete comment.dataValues.Discussions;
        comment.deletedById = eventTokenData.userId;
        comment.deletedAt = db.fn('NOW');
        comment.deletedReasonType = req.body.type;
        comment.deletedReasonText = req.body.text;
        comment.deletedByReportId = report.id;

        await db
            .transaction(async function (t) {
                await cosActivities.updateActivity(
                    comment,
                    topic,
                    {
                        type: 'Moderator',
                        id: eventTokenData.userId,
                        ip: req.ip
                    },
                    req.method + ' ' + req.path,
                    t
                );

                let c = (await Comment.update(
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
                ))[1];

                c = Comment.build(c.dataValues);

                await cosActivities
                    .deleteActivity(c, topic, {
                        type: 'Moderator',
                        id: eventTokenData.userId,
                        ip: req.ip
                    }, req.method + ' ' + req.path, t);

                t.afterCommit(() => {
                    return res.ok();
                });
            });
    }));

    /**
     * Create a Comment Vote
     */
    app.post('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/votes', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        const value = parseInt(req.body.value, 10);
        try {
            const comment = await Comment
                .findOne({
                    where: {
                        id: req.params.commentId
                    }
                });

            if (!comment) {
                return res.notFound();
            }

            await db
                .transaction(async function (t) {
                    const vote = await CommentVote
                        .findOne({
                            where: {
                                commentId: req.params.commentId,
                                creatorId: req.user.userId
                            },
                            transaction: t
                        });
                    if (vote) {
                        //User already voted
                        if (vote.value === value) { // Same value will 0 the vote...
                            vote.value = 0;
                        } else {
                            vote.value = value;
                        }
                        vote.topicId = req.params.topicId;

                        await cosActivities
                            .updateActivity(
                                vote,
                                comment,
                                {
                                    type: 'User',
                                    id: req.user.userId,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );

                        await vote.save({ transaction: t });
                    } else {
                        //User has not voted...
                        const cv = await CommentVote
                            .create({
                                commentId: req.params.commentId,
                                creatorId: req.user.userId,
                                value: req.body.value
                            }, {
                                transaction: t
                            });
                        const c = Comment.build(JSON.parse(JSON.stringify(comment)));
                        c.topicId = req.params.topicId;

                        await cosActivities
                            .createActivity(cv, c, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                    }

                    const results = await db
                        .query(
                            `
                            SELECT
                                tc."up.count",
                                tc."down.count",
                                COALESCE(cvus.selected, false) as "up.selected",
                                COALESCE(cvds.selected, false) as "down.selected"
                                FROM (
                                    SELECT
                                        dc."commentId",
                                        COALESCE(cvu.count, 0) as "up.count",
                                        COALESCE(cvd.count, 0) as "down.count"
                                    FROM "DiscussionComments" dc
                                        JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                                        LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId") cvu ON dc."commentId" = cvu."commentId"
                                        LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes"  WHERE value < 0 GROUP BY "commentId") cvd ON dc."commentId" = cvd."commentId"
                                    WHERE td."topicId" = :topicId
                                    AND dc."commentId" = :commentId
                                    GROUP BY dc."commentId", cvu.count, cvd.count
                                ) tc
                                LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (tc."commentId" = cvus."commentId")
                                LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (tc."commentId" = cvds."commentId");
                            `,
                            {
                                replacements: {
                                    topicId: req.params.topicId,
                                    commentId: req.params.commentId,
                                    userId: req.user.userId
                                },
                                type: db.QueryTypes.SELECT,
                                raw: true,
                                nest: true,
                                transaction: t
                            }
                        );

                    t.afterCommit(() => {
                        if (!results) {
                            return res.notFound();
                        }

                        return res.ok(results[0]);
                    });
                });

        } catch (err) {
            next(err);
        }
    });

    /*
     * Read (List) Topic Comment votes
     */

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/votes', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        try {
            const results = await db.query(
                `
                SELECT
                    u.name,
                    u.company,
                    u."imageUrl",
                    CAST(CASE
                        WHEN cv.value=1 Then 'up'
                        ELSE 'down' END
                    AS VARCHAR(5)) AS vote,
                    cv."createdAt",
                    cv."updatedAt"
                    FROM "CommentVotes" cv
                    LEFT JOIN "Users" u
                    ON
                        u.id = cv."creatorId"
                    WHERE cv."commentId" = :commentId
                    AND cv.value <> 0
                    ;
                `,
                {
                    replacements: {
                        commentId: req.params.commentId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                });

            return res.ok({
                rows: results,
                count: results.length
            });
        } catch (err) {
            return next(err);
        }
    });

    return {
        isCommentCreator
    }
}