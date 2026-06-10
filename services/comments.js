'use strict';

module.exports = function (app) {
    const config = app.get('config');
    const models = app.get('models');
    const db = models.sequelize;
    const { injectReplacements } = require('sequelize/lib/utils/sql');
    const emailLib = app.get('email');
    const cosActivities = app.get('cosActivities');
    const cosUpload = app.get('cosUpload');
    const https = require('https');
    const path = require('path');

    const Topic = models.Topic;
    const Comment = models.Comment;
    const CommentVote = models.CommentVote;
    const Report = models.Report;
    const CommentReport = models.CommentReport;
    const Attachment = models.Attachment;
    const CommentAttachment = models.CommentAttachment;
    const User = models.User;

    // commentsService is registered before topicService alphabetically, so app.get('topicService') is not yet available at factory time
    const topicService = () => app.get('topicService');

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
                    return next();
                } else {
                    return res.forbidden('Insufficient permissions');
                }
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                return next(err);
            }
        };
    };

    /**
     * Create a generalized comments service factory.
     * contextOptions is expected to have:
     * - parentModel (e.g. models.Discussion or models.Idea)
     * - parentIdParam (e.g. 'discussionId' or 'ideaId')
     * - joinModel (e.g. models.DiscussionComment or models.IdeaComment)
     * - joinParentIdField (e.g. 'discussionId' or 'ideaId')
     * - contextName (e.g. 'Discussion' or 'Idea')
     * - topicRelationModel (e.g. models.TopicDiscussion, optional)
     * - listByTopic (boolean) if true, lists comments by topicId (Discussion style), else by parentId (Idea style)
     */
    return function (contextOptions) {
        const {
            parentModel,
            parentIdParam,
            joinModel,
            joinParentIdField,
            contextName,
            listByTopic
        } = contextOptions;

        const createComment = async function (req, res) {
            let type = req.body.type;
            const parentId = req.body.parentId;
            const topicId = req.params.topicId;
            const contextParentId = req.params[parentIdParam];
            const parentVersion = req.body.parentVersion;
            let subject = req.body.subject;
            const text = req.body.text;

            try {
                let parentInstance;
                if (contextName === 'Discussion') {
                    parentInstance = await parentModel.findOne({
                        where: {
                            id: contextParentId
                        },
                        include: [
                            {
                                model: Topic,
                                where: { id: topicId }
                            }
                        ]
                    });

                    if (!parentInstance || !parentInstance.Topics.length) {
                        return res.notFound();
                    }
                } else if (contextName === 'Idea') {
                    parentInstance = await parentModel.findOne({
                        where: {
                            id: contextParentId
                        }
                    });

                    if (!parentInstance) {
                        return res.notFound();
                    }

                    const ideation = await models.Ideation.findOne({
                        where: {
                            id: req.params.ideationId
                        }
                    });

                    if (ideation && (ideation.disableReplies || ideation.allowAnonymous)) {
                        return res.forbidden('Replies are disabled for this ideation', 40300);
                    }
                }
                if (parentInstance.deadline && new Date(parentInstance.deadline) < new Date()) return res.forbidden();

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
                    creatorId: req.user.userId || req.user.id,
                    edits: edits
                });

                if (parentVersion) {
                    comment.parentVersion = parentVersion;
                }

                await db.transaction(async function (t) {
                    await comment.save({ transaction: t });
                    const topic = await Topic.findOne({
                        where: {
                            id: topicId
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
                            await cosActivities.replyActivity(
                                comment,
                                parentComment,
                                topic,
                                {
                                    type: 'User',
                                    id: req.user.userId || req.user.id,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );
                        } else {
                            throw new Error('NotFound');
                        }
                    } else {
                        await cosActivities.createActivity(
                            comment,
                            topic,
                            {
                                type: 'User',
                                id: req.user.userId || req.user.id,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
                    }

                    await topicService().addUserAsMember(req.user.userId || req.user.id, topic.id, t);

                    const joinCreateData = {
                        commentId: comment.id
                    };
                    joinCreateData[joinParentIdField] = contextParentId;

                    await joinModel.create(joinCreateData, { transaction: t });

                    await Topic.increment('commentCount', {
                        where: { id: topicId },
                        transaction: t
                    });

                    // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                    const c = await db.query(
                        `
                                UPDATE "Comments"
                                    SET edits = jsonb_set(edits, '{0,createdAt}', to_jsonb("createdAt"))
                                    WHERE id = :commentId
                                    RETURNING *;
                            `,
                        {
                            replacements: { commentId: comment.id },
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
                    const creator = await User.findOne({
                        where: { id: req.user.userId || req.user.id },
                        attributes: ['id', 'imageUrl', 'name']
                    });

                    t.afterCommit(() => {
                        const resObj = resComment.toJSON();
                        resObj.creator = creator.toJSON();
                        resObj[joinParentIdField] = contextParentId;
                        resObj.replies = { rows: [], count: 0 };
                        resObj.votes = { up: { count: 0, selected: false }, down: { count: 0, selected: false }, count: 0 };
                        return res.created(resObj);
                    });
                });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                if (err.message === 'NotFound') return res.notFound();
                throw err;
            }
        };

        const listComments = async function (req, res, next) {
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
                userId = req.user.userId || req.user.id || null;
                if (req.user.moderator) {
                    dataForModerator = `
                        , 'email', u.email
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
                        jsonb_build_object('id', u.id,'name',u.name, 'imageUrl', u."imageUrl" ${dataForModerator}) as creator,
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
                            SELECT "commentId", value, true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId"=:userId
                        ) cvus ON (c.id = cvus."commentId")
                        LEFT JOIN (
                            SELECT SUM(ABS(value)), "commentId" FROM "CommentVotes" WHERE value < 0 GROUP BY "commentId"
                        ) cvd ON (cvd."commentId" = c.id)
                        LEFT JOIN (
                            SELECT "commentId", true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId"=:userId
                        ) cvds ON (c.id = cvds."commentId")
                        WHERE c.id = $1
                    UNION ALL
                    SELECT
                        c.id,
                        c.type::text,
                        jsonb_build_object('id', c."parentId",'version',c."parentVersion") as parent,
                        c.subject,
                        c.text,
                        pg_temp.editCreatedAtToJson(c.edits) as edits,
                        jsonb_build_object('id', u.id,'name',u.name, 'imageUrl', u."imageUrl" ${dataForModerator}) as creator,
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
                        ) cvds ON (cvds."commentId" = c.id)
                ),`, db.dialect, {
                userId: userId,
                dateFormat: 'YYYY-MM-DDThh24:mi:ss.msZ',
            });

            const queryTemplate = `
                CREATE OR REPLACE FUNCTION pg_temp.editCreatedAtToJson(jsonb)
                    RETURNS jsonb
                    AS $$ SELECT array_to_json(array(SELECT jsonb_build_object('subject', r.subject, 'text', r.text,'createdAt', to_char(r."createdAt" at time zone 'UTC', 'YYYY-MM-DDThh24:mi:ss.msZ'), 'type', r.type) FROM jsonb_to_recordset($1) as r(subject text, text text, "createdAt" timestamptz, type text)))::jsonb
                $$ LANGUAGE SQL;

                CREATE OR REPLACE FUNCTION pg_temp.orderReplies(json)
                    RETURNS json
                    AS $$ SELECT array_to_json(array( SELECT row_to_json(r.*) FROM json_to_recordset($1)
                        AS
                        r(id uuid, type text, parent jsonb, subject text, text text, edits jsonb, creator jsonb, "deletedBy" jsonb, "deletedReasonType" text, "deletedReasonText" text, report jsonb, votes jsonb, "createdAt" text, "updatedAt" text, "deletedAt" text, replies jsonb)
                        GROUP BY r.*, r."createdAt", r.votes
                        ORDER BY ${orderByReplies}))
                $$ LANGUAGE SQL;

                CREATE OR REPLACE FUNCTION pg_temp.getCommentTree(uuid)
                    RETURNS TABLE(
                            "id" uuid, type text, parent jsonb, subject text, text text, edits jsonb, creator jsonb, "deletedBy" jsonb, "deletedReasonType" text, "deletedReasonText" text, report jsonb, votes jsonb, "createdAt" text, "updatedAt" text, "deletedAt" text, replies jsonb)
                        AS $$
                            ${commentRelationSql}
                            maxdepth AS ( SELECT max(depth) maxdepth FROM commentRelations ),
                            rootTree as (
                                SELECT c.* FROM commentRelations c, maxdepth WHERE depth = maxdepth
                                UNION ALL
                                SELECT c.* FROM commentRelations c, rootTree WHERE c.id = (rootTree.parent->>'id')::uuid AND rootTree.id != (rootTree.parent->>'id')::uuid
                            ),
                            commentTree AS (
                                SELECT c.id, c.type, c.parent, c.subject, c.text, pg_temp.editCreatedAtToJson(c.edits) as edits, c.creator, c."deletedBy", c."deletedReasonType", c."deletedReasonText", c.report, c.votes, c."createdAt", c."updatedAt", c."deletedAt", c.depth, jsonb_build_object('count',0, 'rows', json_build_array()) replies
                                    FROM commentRelations c, maxdepth WHERE c.depth = maxdepth
                                UNION ALL
                                SELECT (commentRelations).*, jsonb_build_object('rows', pg_temp.orderReplies(array_to_json(array_cat(array_agg(commentTree), array(SELECT t FROM (SELECT l.*, jsonb_build_object('count',0, 'rows', json_build_array()) replies FROM commentRelations l, maxdepth WHERE (l.parent->>'id')::uuid = (commentRelations).id AND l.depth < maxdepth AND l.id NOT IN (SELECT id FROM rootTree) ORDER BY l."createdAt" ASC) r JOIN pg_temp.getCommentTree(r.id) t ON r.id = t.id)))), 'count', array_length((array_cat(array_agg(commentTree), array(SELECT t FROM (SELECT l.* FROM commentRelations l, maxdepth WHERE (l.parent->>'id')::uuid = (commentRelations).id AND l.depth < maxdepth AND l.id NOT IN (SELECT id FROM rootTree) ORDER BY l."createdAt" ASC) r JOIN pg_temp.getCommentTree(r.id) t ON r.id = t.id))), 1)) replies
                        FROM (
                            SELECT commentRelations, commentTree FROM commentRelations
                            JOIN commentTree ON ((commentTree.parent->>'id')::uuid = commentRelations.id AND (commentTree.parent->>'id')::uuid != commentTree.id)
                            ORDER BY commentTree."createdAt" ASC
                        ) v GROUP BY v.commentRelations )
                        SELECT id, type, parent::jsonb, subject, text, edits::jsonb, creator::jsonb, "deletedBy", "deletedReasonType", "deletedReasonText", report, votes::jsonb, "createdAt", "updatedAt", "deletedAt", replies::jsonb
                        FROM commentTree WHERE id = $1 ORDER BY ${orderByComments}
                    $$ LANGUAGE SQL;
            `;

            let selectSql = '';
            let countSql = '';
            const tableName = joinModel.tableName;

            if (listByTopic) {
                // Specific for Discussions
                selectSql = injectReplacements(`
                    SELECT ct.id, ct.type, ct.parent, ct.subject, ct.text, jm."${joinParentIdField}", ct.edits, ct.creator, ct."deletedBy", ct."deletedReasonType", ct."deletedReasonText", ct.report, ct.votes, ct."createdAt", ct."updatedAt", ct."deletedAt", ct.replies::jsonb
                    FROM "${tableName}" jm
                    JOIN "TopicDiscussions" td ON td."discussionId" = jm."discussionId"
                    JOIN "Comments" c ON c.id = jm."commentId" AND c.id = c."parentId"
                    JOIN pg_temp.getCommentTree(jm."commentId") ct ON ct.id = ct.id
                    WHERE td."topicId" = :topicId
                    ${where}
                    ORDER BY ${orderByComments}
                    LIMIT :limit OFFSET :offset
                `, db.dialect, {
                    types: types, topicId: req.params.topicId, limit: parseInt(req.query.limit, 10) || 15, offset: parseInt(req.query.offset, 10) || 0
                });
                countSql = `
                    SELECT c.type, COUNT(c.type)
                    FROM "${tableName}" jm
                    JOIN "TopicDiscussions" td ON td."discussionId" = jm."discussionId"
                    JOIN "Comments" c ON jm."commentId" = c.id
                    WHERE td."topicId" = :topicId
                    GROUP BY c.type;
                `;
            } else {
                // Specific for Ideas
                selectSql = injectReplacements(`
                    SELECT ct.id, ct.type, ct.parent, ct.subject, ct.text, jm."${joinParentIdField}" AS "${joinParentIdField}", ct.edits, ct.creator, ct."deletedBy", ct."deletedReasonType", ct."deletedReasonText", ct.report, ct.votes, ct."createdAt", ct."updatedAt", ct."deletedAt", ct.replies::jsonb
                    FROM "${tableName}" jm
                    JOIN "Comments" c ON c.id = jm."commentId" AND c.id = c."parentId"
                    JOIN pg_temp.getCommentTree(jm."commentId") ct ON ct.id = ct.id
                    WHERE jm."${joinParentIdField}" = :parentId
                    ${where}
                    ORDER BY ${orderByComments}
                    LIMIT :limit OFFSET :offset
                `, db.dialect, {
                    types: types, parentId: req.params[parentIdParam], limit: parseInt(req.query.limit, 10) || 15, offset: parseInt(req.query.offset, 10) || 0, userId: userId
                });
                countSql = `
                    SELECT c.type, COUNT(c.type)
                    FROM "${tableName}" jm
                    JOIN "Comments" c ON jm."commentId" = c.id
                    WHERE jm."${joinParentIdField}" = :parentId
                    GROUP BY c.type;
                `;
            }

            try {
                // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                const commentsQuery = db.query(`${queryTemplate} ${selectSql}`, { type: db.QueryTypes.SELECT, raw: true, nest: true });
                const countReplacements = listByTopic ? { topicId: req.params.topicId } : { parentId: req.params[parentIdParam] };
                // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                const commentCountQuery = db.query(countSql, { replacements: countReplacements });

                const [comments, commentsCount] = await Promise.all([commentsQuery, commentCountQuery]);

                if (joinParentIdField) {
                    const setJoinId = (jId, reply) => {
                        reply[joinParentIdField] = jId;
                        if (reply.replies.rows.length) {
                            reply.replies.rows.forEach((r) => setJoinId(jId, r));
                        }
                    };
                    comments.forEach((comment) => {
                        const jId = comment[joinParentIdField];
                        comment.replies.rows.forEach((reply) => setJoinId(jId, reply));
                    });
                }

                let countRes = { pro: 0, con: 0, poi: 0, reply: 0, total: 0 };
                if (commentsCount.length) {
                    commentsCount[0].forEach((item) => {
                        countRes[item.type] = item.count;
                    });
                }
                countRes.total = countRes.pro + countRes.con + countRes.poi + countRes.reply;
                return res.ok({ count: countRes, rows: comments });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                console.error("ListComments Error:", err);
                return next(err);
            }
        };

        const deleteComment = async function (req, res, next) {
            try {
                await db.transaction(async function (t) {
                    const includeOpt = [];
                    if (parentModel.name === 'Discussion') {
                        includeOpt.push({ model: parentModel, include: [Topic] });
                    }

                    const comment = await Comment.findOne({
                        where: { id: req.params.commentId },
                        include: includeOpt
                    });

                    let topicConfig;
                    if (parentModel.name === 'Discussion') {
                        topicConfig = comment.Discussions[0].Topics[0];
                    } else { // Ideas context
                        topicConfig = await Topic.findOne({ where: { id: req.params.topicId } });
                    }

                    comment.deletedById = req.user.userId || req.user.id;
                    await comment.save({ transaction: t });

                    await cosActivities.deleteActivity(
                        comment,
                        topicConfig,
                        { type: 'User', id: req.user.userId || req.user.id, ip: req.ip },
                        req.method + ' ' + req.path,
                        t
                    );

                    await Comment.destroy({
                        where: { id: req.params.commentId },
                        transaction: t
                    });

                    t.afterCommit(() => res.ok());
                });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                return next(err);
            }
        };

        const updateComment = async function (req, res, next) {
            const subject = req.body.subject;
            const text = req.body.text;
            let type = req.body.type;
            const commentId = req.params.commentId;

            try {
                const includeOpt = [];
                if (parentModel.name === 'Discussion') {
                    includeOpt.push({ model: parentModel, include: [Topic] });
                }

                const comment = await Comment.findOne({
                    where: { id: commentId },
                    include: includeOpt
                });

                const now = (new Date()).toISOString();
                const edits = comment.edits;

                if (text === comment.text && subject === comment.subject && type === comment.type) {
                    return res.ok();
                }
                if (!type || comment.type === Comment.TYPES.reply) {
                    type = comment.type;
                }
                edits.push({ text: text, subject: subject, createdAt: now, type: type });
                comment.set('edits', null);
                comment.set('edits', edits);
                comment.subject = subject;
                comment.text = text;
                comment.type = type;

                await db.transaction(async function (t) {
                    let topicConfig;
                    if (parentModel.name === 'Discussion') {
                        topicConfig = comment.Discussions[0].Topics[0];
                        delete comment.Topic;
                    } else {
                        topicConfig = await Topic.findOne({ where: { id: req.params.topicId } });
                    }

                    await cosActivities.updateActivity(
                        comment,
                        topicConfig,
                        { type: 'User', id: req.user.userId || req.user.id, ip: req.ip },
                        req.method + ' ' + req.path,
                        t
                    );

                    await comment.save({ transaction: t });

                    // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                    await db.query(`UPDATE "Comments" SET edits = jsonb_set(edits, '{${comment.edits.length - 1}, createdAt }', to_jsonb("updatedAt")) WHERE id = :commentId RETURNING *;`,
                        {
                            replacements: { commentId },
                            type: db.QueryTypes.UPDATE,
                            raw: true,
                            nest: true,
                            transaction: t
                        }
                    );

                    t.afterCommit(() => res.ok());
                });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                return next(err);
            }
        };

        const createReport = async function (req, res, next) {
            const commentId = req.params.commentId;
            try {
                const comment = await Comment.findOne({ where: { id: commentId } });
                if (!comment) return res.notFound(); // Wait, in original code it returned comment but here it's 404

                await db.transaction(async function (t) {
                    const report = await Report.create(
                        { type: req.body.type, text: req.body.text, creatorId: req.user.userId || req.user.id, creatorIp: req.ip },
                        { transaction: t }
                    );
                    await cosActivities.addActivity(
                        report,
                        { type: 'User', id: req.user.userId || req.user.id, ip: req.ip },
                        null,
                        comment,
                        req.method + ' ' + req.path,
                        t
                    );
                    await CommentReport.create(
                        { commentId: commentId, reportId: report.id },
                        { transaction: t }
                    );

                    if (parentModel.name === 'Idea') {
                        await emailLib.sendIdeaCommentReport(commentId, report);
                    } else {
                        await emailLib.sendCommentReport(commentId, report);
                    }

                    t.afterCommit(() => res.ok(report));
                });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                return next(err);
            }
        };

        const readReport = async function (req, res, next) {
            try {
                // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                const results = await db.query(
                    `
                            SELECT r."id", r."type", r."text", r."createdAt", c."id" as "comment.id", c.subject as "comment.subject", c."text" as "comment.text"
                            FROM "Reports" r
                            LEFT JOIN "CommentReports" cr ON (cr."reportId" = r.id)
                            LEFT JOIN "Comments" c ON (c.id = cr."commentId")
                            WHERE r.id = :reportId AND c.id = :commentId AND r."deletedAt" IS NULL
                        ;`,
                    {
                        replacements: { commentId: req.params.commentId, reportId: req.params.reportId },
                        type: db.QueryTypes.SELECT, raw: true, nest: true
                    }
                );
                if (!results || !results.length) return res.notFound();
                return res.ok(results[0]);
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                return next(err);
            }
        };

        const moderateReport = async function (req, res, next) {
            const eventTokenData = req.locals.tokenDecoded;
            const type = req.body.type;
            if (!type) return res.badRequest({ type: 'Property type is required' });

            try {
                // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                const commentReport = (await db.query(
                    `
                            SELECT c."id" as "comment.id", c."updatedAt" as "comment.updatedAt", r."id" as "report.id", r."createdAt" as "report.createdAt"
                            FROM "CommentReports" cr
                            LEFT JOIN "Reports" r ON (r.id = cr."reportId")
                            LEFT JOIN "Comments" c ON (c.id = cr."commentId")
                            WHERE cr."commentId" = :commentId AND cr."reportId" = :reportId AND c."deletedAt" IS NULL AND r."deletedAt" IS NULL
                        ;`,
                    {
                        replacements: { commentId: req.params.commentId, reportId: req.params.reportId },
                        type: db.QueryTypes.SELECT, raw: true, nest: true
                    }
                ))[0];

                if (!commentReport) return res.notFound();

                let comment = commentReport.comment;
                const report = commentReport.report;

                if (comment.updatedAt.getTime() > report.createdAt.getTime()) {
                    return res.badRequest('Report has become invalid cause comment has been updated after the report', 10);
                }

                const includeOpt = [];
                if (parentModel.name === 'Discussion') {
                    includeOpt.push({ model: parentModel, include: [Topic] });
                }

                comment = await Comment.findOne({
                    where: { id: comment.id },
                    include: includeOpt
                });

                let topicConfig;
                if (parentModel.name === 'Discussion') {
                    topicConfig = comment.Discussions[0].Topics[0];
                    delete comment.dataValues.Discussions;
                } else {
                    topicConfig = await Topic.findOne({ where: { id: req.params.topicId } });
                }

                comment.deletedById = eventTokenData.userId;
                comment.deletedAt = db.fn('NOW');
                comment.deletedReasonType = req.body.type;
                comment.deletedReasonText = req.body.text;
                comment.deletedByReportId = report.id;

                await db.transaction(async function (t) {
                    await cosActivities.updateActivity(
                        comment,
                        topicConfig,
                        { type: 'Moderator', id: eventTokenData.userId, ip: req.ip },
                        req.method + ' ' + req.path,
                        t
                    );

                    let c = (await Comment.update(
                        { deletedById: eventTokenData.userId, deletedAt: db.fn('NOW'), deletedReasonType: req.body.type, deletedReasonText: req.body.text, deletedByReportId: report.id },
                        { where: { id: comment.id }, returning: true, transaction: t }
                    ))[1];

                    c = Comment.build(c.dataValues);

                    await cosActivities.deleteActivity(c, topicConfig, { type: 'Moderator', id: eventTokenData.userId, ip: req.ip }, req.method + ' ' + req.path, t);

                    t.afterCommit(() => res.ok());
                });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                return next(err);
            }
        };

        const createVote = async function (req, res, next) {
            const value = parseInt(req.body.value, 10);
            try {
                const comment = await Comment.findOne({ where: { id: req.params.commentId } });
                if (!comment) return res.notFound();

                await db.transaction(async function (t) {
                    const vote = await CommentVote.findOne({
                        where: { commentId: req.params.commentId, creatorId: req.user.userId || req.user.id },
                        transaction: t
                    });

                    await topicService().addUserAsMember(req.user.userId, req.params.topicId, t);

                    if (vote) {
                        vote.value = (vote.value === value) ? 0 : value;
                        vote.topicId = req.params.topicId;

                        await cosActivities.updateActivity(
                            vote, comment, { type: 'User', id: req.user.userId || req.user.id, ip: req.ip }, req.method + ' ' + req.path, t
                        );
                        await vote.save({ transaction: t });
                    } else {
                        const cv = await CommentVote.create(
                            { commentId: req.params.commentId, creatorId: req.user.userId || req.user.id, value: req.body.value },
                            { transaction: t }
                        );
                        const c = Comment.build(JSON.parse(JSON.stringify(comment)));
                        c.topicId = req.params.topicId;

                        await cosActivities.createActivity(
                            cv, c, { type: 'User', id: req.user.userId || req.user.id, ip: req.ip }, req.method + ' ' + req.path, t
                        );
                    }

                    const tableName = joinModel.tableName;
                    let tcSelect = '';
                    if (listByTopic) {
                        tcSelect = `
                            SELECT dc."commentId", COALESCE(cvu.count, 0) as "up.count", COALESCE(cvd.count, 0) as "down.count"
                            FROM "${tableName}" dc
                            JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                            LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId") cvu ON dc."commentId" = cvu."commentId"
                            LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes"  WHERE value < 0 GROUP BY "commentId") cvd ON dc."commentId" = cvd."commentId"
                            WHERE td."topicId" = :topicId AND dc."commentId" = :commentId
                            GROUP BY dc."commentId", cvu.count, cvd.count
                        `;
                    } else {
                        tcSelect = `
                            SELECT dc."commentId", COALESCE(cvu.count, 0) as "up.count", COALESCE(cvd.count, 0) as "down.count"
                            FROM "${tableName}" dc
                            LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId") cvu ON dc."commentId" = cvu."commentId"
                            LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes"  WHERE value < 0 GROUP BY "commentId") cvd ON dc."commentId" = cvd."commentId"
                            WHERE dc."${joinParentIdField}" = :parentId AND dc."commentId" = :commentId
                            GROUP BY dc."commentId", cvu.count, cvd.count
                        `;
                    }

                    // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                    const results = await db.query(
                        `
                        SELECT tc."up.count", tc."down.count", COALESCE(cvus.selected, false) as "up.selected", COALESCE(cvds.selected, false) as "down.selected"
                        FROM ( ${tcSelect} ) tc
                        LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (tc."commentId" = cvus."commentId")
                        LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (tc."commentId" = cvds."commentId");
                        `,
                        {
                            replacements: listByTopic ? { topicId: req.params.topicId, commentId: req.params.commentId, userId: req.user.userId } : { parentId: req.params[parentIdParam], commentId: req.params.commentId, userId: req.user.userId },
                            type: db.QueryTypes.SELECT, raw: true, nest: true, transaction: t
                        }
                    );

                    t.afterCommit(() => {
                        if (!results || !results.length) return res.notFound();
                        return res.ok(results[0]);
                    });
                });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                console.error("CreateVote Error:", err);
                return next(err);
            }
        };

        const listVotes = async function (req, res, next) {
            try {
                // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
                const results = await db.query(`
                    SELECT u.name, u."imageUrl", CAST(CASE WHEN cv.value=1 Then 'up' ELSE 'down' END AS VARCHAR(5)) AS vote, cv."createdAt", cv."updatedAt"
                    FROM "CommentVotes" cv
                    LEFT JOIN "Users" u ON u.id = cv."creatorId"
                    WHERE cv."commentId" = :commentId AND cv.value <> 0;
                `, {
                    replacements: { commentId: req.params.commentId },
                    type: db.QueryTypes.SELECT, raw: true, nest: true
                });
                return res.ok({ rows: results, count: results.length });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                console.error("ListVotes Error:", err);
                return next(err);
            }
        };

        const addCommentAttachment = async (req, res, next, type) => {
            const attachmentLimit = config.attachments.limit || 5;
            const topicId = req.params.topicId;
            const commentId = req.params.commentId;
            try {
                const comment = await Comment.findOne({ where: { id: commentId }, include: [Attachment] });
                if (!comment) return res.badRequest('Matching Argument not found', 3);
                if (comment.Attachments && comment.Attachments.length >= attachmentLimit) return res.badRequest('Argument attachment limit reached', 2);

                let data = await cosUpload.upload(req, `${topicId}_${commentId}`);
                data.creatorId = req.user.userId;
                let attachment = Attachment.build(data);

                await db.transaction(async function (t) {
                    attachment = await attachment.save({ transaction: t });
                    await CommentAttachment.create(
                        { commentId: req.params.commentId, attachmentId: attachment.id, type: type || CommentAttachment.ATTACHMENT_TYPES.file },
                        { transaction: t }
                    );
                    await cosActivities.addActivity(attachment, { type: 'User', id: req.user.userId, ip: req.ip }, null, comment, req.method + ' ' + req.path, t);
                    t.afterCommit(() => res.created(attachment.toJSON()));
                });
            } catch (err) {
                console.error("COMMENTS ERROR:", err);
                if (err.type && (err.type === 'fileSize' || err.type === 'fileType')) return res.forbidden(err.message);
                return next(err);
            }
        };

        const uploadCommentAttachment = async function (req, res, next) { return addCommentAttachment(req, res, next); };
        const uploadCommentImage = async function (req, res, next) { return addCommentAttachment(req, res, next, CommentAttachment.ATTACHMENT_TYPES.image); };

        const createCommentAttachment = async function (req, res, next) {
            const commentId = req.params.commentId;
            const { name, type, source, size, link } = req.body;
            const attachmentLimit = config.attachments.limit || 5;
            if (source !== Attachment.SOURCES.upload && !link) return res.badRequest('Missing attachment link');
            if (!name) return res.badRequest('Missing attachment name');

            try {
                const comment = await Comment.findOne({ where: { id: commentId }, include: [Attachment] });
                if (!comment) return res.badRequest('Matching argument not found', 3);
                if (comment.Attachments && comment.Attachments.length >= attachmentLimit) return res.badRequest('Argument attachment limit reached', 2);

                let invalidLink = false, urlObject;
                if (link) urlObject = new URL(link);
                switch (source) {
                    case Attachment.SOURCES.dropbox: if (!['www.dropbox.com', 'dropbox.com'].includes(urlObject.hostname)) invalidLink = true; break;
                    case Attachment.SOURCES.googledrive: if (urlObject.hostname.split('.').splice(-2).join('.') !== 'google.com') invalidLink = true; break;
                    case Attachment.SOURCES.onedrive: if (urlObject.hostname !== '1drv.ms') invalidLink = true; break;
                    default: return res.badRequest('Invalid link source');
                }
                if (invalidLink) return res.badRequest('Invalid link source');

                let attachment = Attachment.build({ name, type, size, source, creatorId: req.user.userId, link });
                await db.transaction(async function (t) {
                    attachment = await attachment.save({ transaction: t });
                    await CommentAttachment.create({ commentId: commentId, attachmentId: attachment.id, type: CommentAttachment.ATTACHMENT_TYPES.file }, { transaction: t });
                    await cosActivities.addActivity(attachment, { type: 'User', id: req.user.userId, ip: req.ip }, null, comment, req.method + ' ' + req.path, t);
                    t.afterCommit(() => res.ok(attachment.toJSON()));
                });
            } catch (err) { console.error("COMMENTS ERROR:", err); return next(err); }
        };

        const updateCommentAttachment = async function (req, res, next) {
            const newName = req.body.name;
            if (!newName) return res.badRequest('Missing attachment name');
            try {
                const attachment = await Attachment.findOne({ where: { id: req.params.attachmentId }, include: [Comment] });
                attachment.name = newName;
                await db.transaction(async function (t) {
                    const comment = attachment.Comments[0]; delete attachment.Comments;
                    await cosActivities.updateActivity(attachment, comment, { type: 'User', id: req.user.userId, ip: req.ip }, req.method + ' ' + req.path, t);
                    await attachment.save({ transaction: t });
                    t.afterCommit(() => res.ok(attachment.toJSON()));
                });
            } catch (err) { console.error("COMMENTS ERROR:", err); return next(err); }
        };

        const deleteCommentAttachment = async function (req, res, next) {
            try {
                const attachment = await Attachment.findOne({ where: { id: req.params.attachmentId }, include: [Comment] });
                await db.transaction(async function (t) {
                    if (attachment.source === Attachment.SOURCES.upload) {
                        const link = new URL(attachment.link);
                        await cosUpload.delete(link.pathname);
                    }
                    await cosActivities.deleteActivity(attachment, attachment.Comments[0], { type: 'User', id: req.user.userId, ip: req.ip }, req.method + ' ' + req.path, t);
                    await attachment.destroy({ transaction: t });
                    t.afterCommit(() => res.ok());
                });
            } catch (err) { console.error("COMMENTS ERROR:", err); return next(err); }
        };

        const getCommentAttachments = async (commentId, type) => {
            // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
            return await db.query(`
                SELECT a.id, a.name, a.size, a.source, a.type, a.link, a."createdAt", c.id as "creator.id", c.name as "creator.name"
                FROM "CommentAttachments" ca
                JOIN "Attachments" a ON a.id = ca."attachmentId"
                JOIN "Users" c ON c.id = a."creatorId"
                WHERE ca."commentId" = :commentId AND ca.type=:type AND a."deletedAt" IS NULL;`,
                { replacements: { commentId: commentId, type: type || CommentAttachment.ATTACHMENT_TYPES.file }, type: db.QueryTypes.SELECT, raw: true, nest: true }
            );
        };

        const commentAttachmentsList = async function (req, res, next) {
            try {
                const attachments = await getCommentAttachments(req.params.commentId, req.query?.type);
                return res.ok({ count: attachments.length, rows: attachments });
            } catch (err) { console.error("COMMENTS ERROR:", err); return next(err); }
        };

        const readAttachment = async function (req, res, next) {
            try {
                const attachment = await Attachment.findOne({ where: { id: req.params.attachmentId } });
                if (attachment && attachment.source === Attachment.SOURCES.upload && req.query.download) {
                    const fileUrl = new URL(attachment.link);
                    let filename = attachment.name;
                    if (filename.split('.').length <= 1 || path.extname(filename) !== `.${attachment.type}`) {
                        filename += '.' + attachment.type;
                    }
                    const options = { hostname: fileUrl.hostname, path: fileUrl.pathname, port: fileUrl.port };
                    if (app.get('env') === 'development' || app.get('env') === 'test') options.rejectUnauthorized = false;
                    https.get(options, function (externalRes) {
                        res.setHeader('content-disposition', 'attachment; filename=' + encodeURIComponent(filename));
                        externalRes.pipe(res);
                    }).on('error', function (err) { return next(err); }).end();
                } else return res.ok(attachment.toJSON());
            } catch (err) { console.error("COMMENTS ERROR:", err); return next(err); }
        };

        return {
            isCommentCreator,
            createComment,
            listComments,
            deleteComment,
            updateComment,
            createReport,
            readReport,
            moderateReport,
            createVote,
            listVotes,
            uploadCommentAttachment,
            uploadCommentImage,
            createCommentAttachment,
            updateCommentAttachment,
            deleteCommentAttachment,
            commentAttachmentsList,
            readAttachment
        };
    };
};
