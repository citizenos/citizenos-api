'use strict';

const { capitalizeFirstLetter } = require('../../libs/util');

function flattenArrayValues(obj) {
    const result = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (Array.isArray(value)) {
            value.forEach((v, idx) => {
                result[`${key}_${idx}`] = v;
            });
        } else {
            result[key] = value;
        }
    });
    return result;
}

module.exports = function (app) {
    const config = app.get('config');
    const logger = app.get('logger');
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');
    const cosActivities = app.get('cosActivities');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const { createHash } = require('crypto');
    const emailLib = app.get('email');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const { injectReplacements } = require('sequelize/lib/utils/sql');
    const QueryStream = app.get('QueryStream');
    const fastCsv = app.get('fastCsv');
    const cosUpload = app.get('cosUpload');
    const https = require('https');
    const path = require('path');

    const Ideation = models.Ideation;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;
    const Idea = models.Idea;
    const User = models.User;
    const TopicIdeation = models.TopicIdeation;
    const Folder = models.Folder;
    const FolderIdea = models.FolderIdea;
    const IdeaVote = models.IdeaVote;
    const IdeaFavourite = models.IdeaFavourite;
    const Comment = models.Comment;
    const IdeaComment = models.IdeaComment;
    const Report = models.Report;
    const CommentReport = models.CommentReport;
    const CommentVote = models.CommentVote;
    const IdeaReport = models.IdeaReport;
    const IdeaAttachment = models.IdeaAttachment;
    const Attachment = models.Attachment;
    const topicService = require('../../services/topic')(app);

    const commentsService = require('../../services/comments')(app);
    const commentsLib = commentsService({
        parentModel: Idea,
        parentIdParam: 'ideaId',
        joinModel: IdeaComment,
        joinParentIdField: 'ideaId',
        contextName: 'Idea',
        listByTopic: false
    });
    /**
     * Create an Ideation
     */
    app.post('/api/users/:userId/topics/:topicId/ideations', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft]), async (req, res, next) => {
        const question = req.body.question;
        const deadline = req.body.deadline;
        const topicId = req.params.topicId;
        const allowAnonymous = req.body.allowAnonymous || false;
        const disableReplies = (allowAnonymous) ? true : (req.body.disableReplies || false);

        try {
            if (!question) {
                return res.badRequest('Ideation question is missing', 1);
            }

            const ideation = Ideation.build({
                question,
                deadline,
                creatorId: req.user.id,
                allowAnonymous,
                disableReplies,
                template: req.body.template,
                demographicsConfig: req.body.demographicsConfig,
            });

            // TODO: Some of these queries can be done in parallel
            const topic = await Topic.findOne({
                where: {
                    id: req.params.topicId
                }
            });

            await db
                .transaction(async function (t) {
                    ideation.topicId = topicId;
                    await ideation.save({ transaction: t });

                    await TopicIdeation
                        .create(
                            {
                                topicId: req.params.topicId,
                                ideationId: ideation.id
                            },
                            { transaction: t }
                        );
                    await cosActivities
                        .createActivity(
                            ideation,
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
                        return res.created(ideation.toJSON());
                    });
                });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read an Ideation
     */

    const _readIdeation = async (req, res, next) => {
        const ideationId = req.params.ideationId;
        try {
            const ideationInfo = await db.query(`
                SELECT
                    i.id,
                    i.question,
                    i.deadline,
                    i."disableReplies",
                    i."creatorId",
                    i."createdAt",
                    i."updatedAt",
                    i."allowAnonymous",
                    i."template",
                    i."demographicsConfig",
                    COALESCE(ii.count, 0) as "ideas.count",
                    COALESCE(fi.count, 0) as "folders.count"
                FROM "Ideations" i
                LEFT JOIN (
                    SELECT
                        "ideationId",
                        "status",
                        COUNT("ideationId") as count
                    FROM "Ideas"
                    GROUP BY "ideationId", "status"
                    HAVING "status" != 'draft'
                ) AS ii ON ii."ideationId" = i.id
                LEFT JOIN (
                    SELECT
                        "ideationId",
                        COUNT("ideationId") as count
                    FROM "Folders"
                    WHERE "deletedAt" IS NULL
                    GROUP BY "ideationId"
                ) AS fi ON fi."ideationId" = i.id
                WHERE i.id = :ideationId AND i."deletedAt" IS NULL
                ;
            `, {
                replacements: {
                    ideationId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });

            if (!ideationInfo.length) {
                return res.notFound();
            }

            return res.ok(ideationInfo[0]);

        } catch (err) {
            next(err);
        }
    }

    const _readIdeationParticipants = async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const users = await db.query(`
                SELECT
                    u.id,
                    u.name,
                    u."imageUrl",
                    i."ideaCount" as "ideas.count",
                    count(*) OVER()::integer AS "countTotal"
                FROM "Users" u
                JOIN (
                    SELECT "authorId",
                    COUNT(id) as "ideaCount"
                    FROM "Ideas" i WHERE "ideationId" = :ideationId AND "status" != 'draft'
                    GROUP BY "authorId"
                ) i ON u.id = i."authorId";
            `, {
                replacements: {
                    ideationId
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

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/participants', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
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
            if (!ideation || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeationParticipants(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/participants', async (req, res, next) => {
        try {
            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
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
            if (!ideation || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeationParticipants(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/ideations/:ideationId', async (req, res, next) => {
        try {
            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
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
            if (!ideation || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeation(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/download', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const connectionManager = db.connectionManager;
            const connection = await connectionManager.getConnection();

            const query = new QueryStream(
                `
                SELECT
                    u.name as "User",
                    i."createdAt"::date as "Date",
                    to_char(i."createdAt", 'HH24:MI') as "Time",
                    i.statement as "Idea heading",
                    i.description as "Idea",
                    i.demographics as "Demographics",
                    i.status as "Status",
                    iv."count" as "Likes",
                    f.folders as "Folders"
                FROM "Ideas" i
                LEFT JOIN "Users" u ON u.id = i."authorId"
                LEFT JOIN (
                    SELECT
                        ii."ideaId",
                        ii."count"
                        FROM (
                            SELECT
                            i.id AS "ideaId",
                                COALESCE(cvu.count, 0) as "count"
                            FROM "Ideas" i
                                LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                            WHERE i."ideationId" = $1
                            GROUP BY i.id, cvu.count
                        ) ii
                ) iv ON iv."ideaId" = i.id
                LEFT JOIN (
					SELECT
						fi."ideaId",
						array_agg(f.name) as folders
					FROM  "FolderIdeas" fi
					JOIN "Folders" f ON f.id = fi."folderId"
					GROUP BY fi."ideaId"
				) f ON f."ideaId" = i.id
                WHERE i."ideationId" = $1 AND i."status" != 'draft'
                ;`,
                [ideationId]
            );

            const stream = connection.query(query);

            const csvStream = fastCsv.format({
                headers: true,
                rowDelimiter: '\r\n'
            });

            stream.on('data', function (ideaResult) {
                const demographics = ideaResult.Demographics || {};

                delete ideaResult.Demographics;
                delete ideaResult.Status;
                const parsedDemographics = Object.keys(demographics).reduce((acc, key) => ({
                    ...acc,
                    [capitalizeFirstLetter(key)]: demographics[key]
                }), {})

                const csvData = {
                    ...ideaResult,
                    ...parsedDemographics
                };

                csvStream.write(csvData);
            });

            stream.on('error', function (err) {
                logger.error('Generating ideation CSV FAILED', err);
                csvStream.end();
                connectionManager.releaseConnection(connection);
            });

            stream.on('end', function () {
                logger.debug('Generating ideation CSV succeeded');

                csvStream.end();
                connectionManager.releaseConnection(connection);
            });

            res.set('Content-disposition', `attachment; filename=Ideas export.csv`);
            res.set('Content-Type', 'text/csv');

            csvStream.pipe(res);
        } catch (err) {
            next(err);
        }

    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        _readIdeation(req, res, next);
    });

    /**
     * Update an Ideation
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const ideationId = req.params.ideationId;
            let fields = ['deadline', 'disableReplies', 'template', 'question', 'demographicsConfig'];

            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [
                    {
                        model: Ideation,
                        where: {
                            id: ideationId
                        }
                    }
                ]
            });
            if (!topic?.Ideations?.length) {
                return res.notFound();
            }
            if (topic.status === Topic.STATUSES.draft) {
                fields = fields.concat(['question', 'allowAnonymous']);
            }
            const ideation = topic.Ideations[0];
            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        ideation[field] = req.body[field];
                });
                if (!ideation.disableReplies) {
                    ideation.disableReplies = false;
                }
                if (ideation.allowAnonymous) {
                    ideation.disableReplies = true;
                }
                await cosActivities
                    .updateActivity(
                        ideation,
                        topic,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await ideation.save({
                    transaction: t
                });
                t.afterCommit(async () => {
                    const ideationInfo = await db.query(`
                    SELECT
                        i.id,
                        i.question,
                        i.deadline,
                        i."disableReplies",
                        i."allowAnonymous",
                        i."template",
                        i."demographicsConfig",
                        i."creatorId",
                        i."createdAt",
                        i."updatedAt",
                        COALESCE(ii.count, 0) as "ideas.count",
                        COALESCE(fi.count, 0) as "folders.count"
                    FROM "Ideations" i
                    LEFT JOIN (
                        SELECT
                            "ideationId",
                            COUNT("ideationId") as count
                        FROM "Ideas"
                        GROUP BY "ideationId"
                    ) AS ii ON ii."ideationId" = i.id
                    LEFT JOIN (
                        SELECT
                            "ideationId",
                            COUNT("ideationId") as count
                        FROM "Folders"
                        WHERE "deletedAt" IS NULL
                        GROUP BY "ideationId"
                    ) AS fi ON fi."ideationId" = i.id
                    WHERE i.id = :ideationId AND i."deletedAt" IS NULL
                    ;
                    `, {
                        replacements: {
                            ideationId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    });

                    return res.ok(ideationInfo[0]);
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: { id: req.params.topicId }
                    },
                ]
            });
            if (!ideation) {
                return res.notFound();
            }

            await db
                .transaction(async function (t) {
                    await cosActivities
                        .deleteActivity(ideation, ideation.Topic, {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);


                    await ideation.destroy();

                    t.afterCommit(() => {
                        return res.ok();
                    })
                });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Create an Idea
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.ideation]), async (req, res, next) => {
        const ideationId = req.params.ideationId;
        const topicId = req.params.topicId;
        const statement = req.body.statement;
        const description = req.body.description;
        const imageUrl = req.body.imageUrl;
        let demographics = req.body.demographics;
        const status = req.body.status || 'draft';

        if (status === 'draft') {
            demographics = null
        }
        try {

            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: { id: topicId }
                    },
                ]
            });

            if (!ideation?.Topics?.length) {
                return res.notFound();
            }
            if (ideation.deadline && new Date(ideation.deadline) < new Date()) return res.forbidden();

            await db
                .transaction(async function (t) {

                    await topicService.addUserAsMember(req.user.id, topicId, t);

                    const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');

                    const idea = Idea.build({
                        authorId: (ideation.allowAnonymous && status !== 'draft') ? null : req.user.id,
                        sessionId: (ideation.allowAnonymous && status !== 'draft') ? sessToken : null,
                        statement,
                        description,
                        imageUrl,
                        ideationId,
                        demographics,
                        status
                    });
                    idea.topicId = topicId;
                    await idea.save({ transaction: t });

                    await cosActivities
                        .createActivity(
                            idea,
                            ideation,
                            {
                                type: 'User',
                                id: (ideation.allowAnonymous) ? null : req.user.id,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );

                    t.afterCommit(async () => {
                        const ideaR = await Idea.findOne({
                            where: {
                                id: idea.id
                            },
                            include: [
                                {
                                    model: User,
                                    attributes: ['id', 'name', 'email', 'imageUrl'],
                                    as: 'author',
                                    required: false
                                }
                            ]
                        });

                        return res.created(ideaR);
                    });
                });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read an Idea
     */

    const _readIdeationIdea = async (req, res, next) => {
        const ideationId = req.params.ideationId;
        const ideaId = req.params.ideaId
        const authorId = req.query.authorId;
        const folderId = req.query.folderId;
        let joinSql = `
        LEFT JOIN (
            SELECT
                ii."ideaId",
                ii."up.count",
                ii."down.count"
                FROM (
                    SELECT
                    i.id AS "ideaId",
                        COALESCE(cvu.count, 0) as "up.count",
                        COALESCE(cvd.count, 0) as "down.count"
                    FROM "Ideas" i
                        LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                        LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                    WHERE i."ideationId" = :ideationId
                    GROUP BY i.id, cvu.count, cvd.count
                ) ii
        ) iv ON iv."ideaId" = "Idea".id
        `;
        let where = ` WHERE "Idea"."ideationId" = :ideationId AND "Idea".id = :ideaId`;
        let returncolumns = ``;

        if (req.user?.id || req.user?.userId) {
            joinSql = `
            LEFT JOIN "IdeaFavourites" if ON (if."ideaId" = "Idea".id AND if."userId" = :userId)
            LEFT JOIN (
                SELECT
                    ii."ideaId",
                    ii."up.count",
                    ii."down.count",
                    COALESCE(cvus.selected, false) as "up.selected",
                    COALESCE(cvds.selected, false) as "down.selected"
                    FROM (
                        SELECT
                        i.id AS "ideaId",
                            COALESCE(cvu.count, 0) as "up.count",
                            COALESCE(cvd.count, 0) as "down.count"
                        FROM "Ideas" i
                            LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                            LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                        WHERE i."ideationId" = :ideationId
                        GROUP BY i.id, cvu.count, cvd.count
                    ) ii
                    LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (ii."ideaId" = cvus."ideaId")
                    LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (ii."ideaId" = cvds."ideaId")
            ) iv ON iv."ideaId" = "Idea".id
            `;
            returncolumns += `

            iv."up.selected" as "votes.up.selected",
            iv."down.selected" as "votes.down.selected",
            CASE
                WHEN if."ideaId" = "Idea".id THEN true
                ELSE false
            END as "favourite",
            `;
        }
        if (folderId) {
            joinSql += ` JOIN "FolderIdeas" fi ON fi."ideaId" = "Idea".id AND fi."folderId" = :folderId `
        }
        try {
            const idea = await db.query(`
            SELECT
                "Idea"."id",
                "Idea"."ideationId",
                "Idea"."statement",
                "Idea"."description",
                "Idea"."createdAt",
                "Idea"."imageUrl",
                "Idea"."status",
                "Idea"."updatedAt",
                "Idea"."deletedAt",
                "author"."id" AS "author.id",
                "author"."name" AS "author.name",
                "author"."email" AS "author.email",
                "author"."imageUrl" AS "author.imageUrl",
                iv."up.count" as "votes.up.count",
                iv."down.count" as "votes.down.count",
                CASE
                    WHEN "Idea"."deletedById" IS NOT NULL THEN jsonb_build_object('id', "Idea"."deletedById", 'name', dbu.name )
                    ELSE jsonb_build_object('id', "Idea"."deletedById")
                END as "deletedBy",
                "Idea"."deletedReasonType"::text,
                "Idea"."deletedReasonText",
                jsonb_build_object('id', "Idea"."deletedByReportId") as report,
                ${returncolumns}
                COALESCE(ic.count, 0) AS "replies.count"
                FROM "Ideas" AS "Idea"
                LEFT JOIN "Users" AS "author" ON "Idea"."authorId" = "author"."id"
                LEFT JOIN "Users" dbu ON (dbu.id = "Idea"."deletedById")
                LEFT JOIN (
                    SELECT
                        "ideaId",
                        COUNT(*) AS count
                    FROM "IdeaComments"
                    GROUP BY "ideaId"
                ) AS ic ON (ic."ideaId" = "Idea".id)
                ${joinSql}
                ${where}
                ;
            `, {
                replacements: {
                    userId: req.user?.id || req.user?.userId,
                    ideationId,
                    authorId,
                    ideaId,
                    folderId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });

            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
                },
                attributes: ['allowAnonymous']
            });
            if (ideation.allowAnonymous) {
                delete idea[0].author;
            }
            return res.ok(idea[0]);

        } catch (err) {
            next(err);
        }
    }
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId', async (req, res, next) => {
        try {
            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
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
            if (!ideation?.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationIdea(req, res, next);

        } catch (err) {
            next(err);
        }
    })
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationIdea(req, res, next);
    });

    /**
     * Update an Idea
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const ideationId = req.params.ideationId;
            const ideaId = req.params.ideaId;
            const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');

            let fields = ['statement', 'description', 'imageUrl', 'status', 'demographics'];

            const idea = await Idea.findOne({
                where: {
                    id: ideaId
                },
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['id', 'name', 'imageUrl', 'email']
                    },
                    {
                        model: Ideation,
                        where: {
                            id: ideationId
                        },
                        include: [
                            {
                                model: Topic,
                                where: {
                                    id: topicId
                                }
                            }
                        ]
                    }
                ]
            });
            const ideation = idea.Ideation;
            if (!ideation || ideation.Topics.length === 0) {
                res.forbidden();
            }
            if (!idea) {
                return res.notFound();
            }

            if ((!ideation.allowAnonymous && idea.authorId !== req.user.id) || (ideation.allowAnonymous && idea.status !== 'draft' && idea.sessionId !== sessToken)) return res.forbidden();

            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        idea[field] = req.body[field];
                });


                if (ideation.allowAnonymous && idea.status !== 'draft') {
                    idea.authorId = null;
                    idea.sessionId = sessToken;
                }

                const activityIdea = Idea.build(idea);
                if (idea.status === 'draft') {
                    delete idea.demographics;
                }

                delete activityIdea.demographics;
                idea.topicId = topicId;
                await cosActivities
                    .updateActivity(
                        activityIdea,
                        null,
                        {
                            type: 'User',
                            id: (ideation.allowAnonymous) ? null : req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await idea.save({
                    transaction: t
                });
                t.afterCommit(async () => {
                    return res.ok(idea);
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read), async (req, res, next) => {
        try {
            const ideaId = req.params.ideaId;
            const ideationId = req.params.ideationId;
            const topicId = req.params.topicId;
            const idea = await Idea.findOne({
                where: {
                    id: ideaId
                },
                include: [
                    {
                        model: Ideation,
                        where: {
                            id: ideationId
                        },
                        include: [
                            {
                                model: Topic,
                                where: {
                                    id: topicId
                                }
                            }
                        ]
                    }
                ]
            });
            const ideation = idea.Ideation;
            if (!ideation || ideation.Topics.length === 0) {
                res.forbidden();
            }

            if (idea.authorId !== req.user.id) {
                return res.forbidden();
            }

            await db
                .transaction(async function (t) {
                    idea.deletedById = req.user.userId || req.user.id;
                    idea.topicId = topicId;
                    await idea.save();
                    await cosActivities
                        .deleteActivity(idea, ideation, {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);


                    await idea.destroy();

                    t.afterCommit(() => {
                        return res.ok();
                    });
                });
        } catch (err) {
            next(err);
        }
    });
    /**
        * Read Ideas
    */

    const _readIdeationIdeas = async (req, res, next) => {
        const ideationId = req.params.ideationId;
        const search = req.query.search;
        const limit = req.query.limit || 8;
        const offset = req.query.offset || 0;
        const orderBy = req.query.orderBy;
        const order = (req.query.order?.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
        const authorId = req.query.authorId;
        const favourite = req.query.favourite;
        const folderId = req.query.folderId;
        const showModerated = req.query.showModerated || false;
        const demographicsFilter = req.query.demographics ? JSON.parse(req.query.demographics) : null;
        let status = req.query.status || null;
        if (!req.user?.id || !req.user?.userId) {
            status = 'published';
        }
        let groupBySql = ``;
        let joinSql = `
        LEFT JOIN (
            SELECT
                ii."ideaId",
                ii."up.count",
                ii."down.count"
                FROM (
                    SELECT
                    i.id AS "ideaId",
                        COALESCE(cvu.count, 0) as "up.count",
                        COALESCE(cvd.count, 0) as "down.count"
                    FROM "Ideas" i
                        LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                        LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                    WHERE i."ideationId" = :ideationId
                    GROUP BY i.id, cvu.count, cvd.count
                ) ii
        ) iv ON iv."ideaId" = "Idea".id
        `;
        let where = ` WHERE "Idea"."ideationId" = :ideationId `;
        let returncolumns = ``;
        if (authorId) {
            where += ` AND "Idea"."authorId" = :authorId `;
        }
        if (search) {
            where += ` AND (
                "Idea"."statement" ILIKE '%' || :search || '%' OR
                "Idea"."description" ILIKE '%' || :search || '%'
            ) `;
        }
        if (status) {
            if (status === 'draft') {
                where += ` AND "Idea"."status" = :status `;
                where += ` AND "Idea"."authorId" = :userId `;
            } else {
                where += ` AND "Idea"."status" = 'published' `;
            }
        } else {
            where += ` AND ("Idea"."status" = 'published' OR "Idea"."status" = 'draft' AND "Idea"."authorId"=:userId) `;
        }
        if (demographicsFilter) {
            const conditions = [];
            const demoReplacements = {};
            Object.keys(demographicsFilter).forEach(key => {
                const filterValue = demographicsFilter[key];
                if (Array.isArray(filterValue)) {
                    const subConditions = [];
                    filterValue.forEach((val, idx) => {
                        const paramName = `demographics_${key}_${idx}`;
                        if (typeof val === 'string' && val.toLowerCase() === 'other') {
                            subConditions.push(`("Idea".demographics ->> '${key}') ILIKE '%' || :${paramName} || '%'`);
                        } else {
                            subConditions.push(`"Idea".demographics ->> '${key}' = :${paramName}`);
                        }
                        demoReplacements[paramName] = val;
                    });
                    if (subConditions.length) {
                        conditions.push('(' + subConditions.join(' OR ') + ')');
                    }
                } else {
                    const paramName = `demographics_${key}`;
                    if (typeof filterValue === 'string' && filterValue.toLowerCase() === 'other') {
                        conditions.push(`("Idea".demographics ->> '${key}') ILIKE '%' || :${paramName} || '%'`);
                    } else {
                        conditions.push(`"Idea".demographics ->> '${key}' = :${paramName}`);
                    }
                    demoReplacements[paramName] = filterValue;
                }
            });

            if (conditions.length) {
                where += ' AND ' + conditions.join(' AND ');
            }
        }
        let orderSql = ' iv."up.count" DESC, "replies.count" DESC, "Idea"."createdAt" DESC ';
        if (!showModerated || showModerated == "false") {
            where += ` AND "Idea"."deletedAt" IS NULL `;
        } else {
            where += ` AND "Idea"."deletedAt" IS NOT NULL `;
        }
        if (orderBy) {
            switch (orderBy) {
                case 'recent':
                    orderSql = ` "Idea"."createdAt" ${order}`
                    break;
                case 'likes':
                    orderSql = ` iv."up.count" ${order}`
                    break;
                case 'replies':
                    orderSql = ` "replies.count" ${order}`
                    break;
            }
        }
        if (req.user?.id || req.user?.userId) {
            joinSql = `
            LEFT JOIN "IdeaFavourites" if ON (if."ideaId" = "Idea".id AND if."userId" = :userId)
            LEFT JOIN (
                SELECT
                    ii."ideaId",
                    ii."up.count",
                    ii."down.count",
                    COALESCE(cvus.selected, false) as "up.selected",
                    COALESCE(cvds.selected, false) as "down.selected"
                    FROM (
                        SELECT
                        i.id AS "ideaId",
                            COALESCE(cvu.count, 0) as "up.count",
                            COALESCE(cvd.count, 0) as "down.count"
                        FROM "Ideas" i
                            LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                            LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                        WHERE i."ideationId" = :ideationId
                        GROUP BY i.id, cvu.count, cvd.count
                    ) ii
                    LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (ii."ideaId" = cvus."ideaId")
                    LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (ii."ideaId" = cvds."ideaId")
            ) iv ON iv."ideaId" = "Idea".id
            `;
            returncolumns += `

            iv."up.selected" as "votes.up.selected",
            iv."down.selected" as "votes.down.selected",
            CASE
                WHEN if."ideaId" = "Idea".id THEN true
                ELSE false
            END as "favourite",
            `;
            groupBySql += `, if."ideaId" , iv."up.selected", iv."down.selected"`;
            if (favourite) {
                where += ` AND if."ideaId" IS NOT NULL `;
            }
        }
        if (folderId) {
            joinSql += ` JOIN "FolderIdeas" fi ON fi."ideaId" = "Idea".id AND fi."folderId" = :folderId `
        }
        try {
            const ideas = await db.query(`
            SELECT
                "Idea"."id",
                "Idea"."ideationId",
                "Idea"."statement",
                "Idea"."description",
                "Idea"."createdAt",
                "Idea"."imageUrl",
                "Idea"."status",
                "Idea"."updatedAt",
                "Idea"."deletedAt",
                "author"."id" AS "author.id",
                "author"."name" AS "author.name",
                "author"."email" AS "author.email",
                "author"."imageUrl" AS "author.imageUrl",
                count(*) OVER()::integer AS "countTotal",
                iv."up.count" as "votes.up.count",
                iv."down.count" as "votes.down.count",
                CASE
                    WHEN "Idea"."deletedById" IS NOT NULL THEN jsonb_build_object('id', "Idea"."deletedById", 'name', dbu.name )
                    ELSE jsonb_build_object('id', "Idea"."deletedById")
                END as "deletedBy",
                "Idea"."deletedReasonType"::text,
                "Idea"."deletedReasonText",
                jsonb_build_object('id', "Idea"."deletedByReportId") as report,
                ${returncolumns}
                COALESCE(ic.count, 0) AS "replies.count"
                FROM "Ideas" AS "Idea"
                LEFT JOIN "Users" AS "author" ON "Idea"."authorId" = "author"."id"
                LEFT JOIN "Users" dbu ON (dbu.id = "Idea"."deletedById")
                LEFT JOIN (
                    SELECT
                        "ideaId",
                        COUNT(*) AS count
                    FROM "IdeaComments"
                    GROUP BY "ideaId"
                ) AS ic ON (ic."ideaId" = "Idea".id)
                ${joinSql}
                ${where}
                GROUP BY "Idea"."id", author.id, dbu.name, iv."up.count", iv."down.count", ic."count" ${groupBySql}
                ORDER BY ${orderSql}
                OFFSET :offset
                LIMIT :limit
                ;
            `, {
                replacements: {
                    search,
                    userId: req.user?.id || req.user?.userId,
                    ideationId,
                    authorId,
                    ...(demographicsFilter?.age && flattenArrayValues({ demographics_age: demographicsFilter.age })),
                    demographics_gender: demographicsFilter?.gender,
                    demographics_residence: demographicsFilter?.residence,
                    status,
                    favourite,
                    folderId,
                    limit,
                    offset
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });

            const count = ideas[0]?.countTotal || 0;

            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
                },
                attributes: ['allowAnonymous']
            });

            ideas.forEach((idea) => {
                if (!idea.author.id || (ideation.allowAnonymous && idea.status !== 'draft')) {
                    delete idea.author;
                }
                delete idea.countTotal
            });

            return res.ok({
                count,
                rows: ideas
            });

        } catch (err) {
            next(err);
        }
    }
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas', async (req, res, next) => {
        try {
            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    },
                    {
                        model: User,
                        attributes: ['id', 'name', 'email', 'imageUrl'],
                        as: 'creator',
                        required: true
                    }
                ]
            });

            if (!ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationIdeas(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationIdeas(req, res, next);
    });

    /*Folders*/

    /**
     * Create a folder
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null), async (req, res, next) => {
        const ideationId = req.params.ideationId;
        const topicId = req.params.topicId;
        const name = req.body.name;
        const description = req.body.description;
        try {

            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: { id: topicId }
                    },
                ]
            });

            if (!ideation?.Topics?.length) {
                return res.notFound();
            }

            await db
                .transaction(async function (t) {
                    const folder = Folder.build({
                        creatorId: req.user.id,
                        name,
                        description,
                        ideationId
                    });
                    folder.topicId = topicId;
                    await folder.save({ transaction: t });

                    await cosActivities
                        .createActivity(
                            folder,
                            ideation,
                            {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );

                    t.afterCommit(() => {
                        return res.created(folder.toJSON());
                    });
                });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read a folder
     */
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        const folderId = req.params.folderId;
        const offset = req.query.offset || 0;
        const limit = req.query.limit || 8;
        try {
            const ideationId = req.params.ideationId;
            const topicId = req.params.topicId;
            if (!ideationId || !topicId) return res.badRequest();

            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: topicId
                        },
                        attributes: ['visibility']
                    },
                ]
            });
            if (!ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            try {
                const folder = await Folder.findOne({
                    where: {
                        id: folderId
                    }
                })
                const ideas = await Idea.findAndCountAll({
                    where: {
                        ideationId: req.params.ideationId
                    },
                    include: [
                        {
                            model: User,
                            as: 'author',
                            attributes: ['id', 'name', 'email', 'imageUrl']
                        },
                        {
                            model: Folder,
                            where: { id: folderId },
                            attributes: []
                        },
                    ],
                    offset,
                    limit
                })
                const resFolder = folder.toJSON();
                resFolder.ideas = ideas;

                return res.ok(resFolder);

            } catch (err) {
                next(err);
            }

        } catch (err) {
            next(err);
        }
    })

    app.get('/api/topics/:topicId/ideations/:ideationId/folders/:folderId', async (req, res, next) => {
        const folderId = req.params.folderId;
        const offset = req.query.offset || 0;
        const limit = req.query.limit || 8;
        try {
            const ideationId = req.params.ideationId;
            const topicId = req.params.topicId;
            if (!ideationId || !topicId) return res.badRequest();

            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: topicId
                        },
                        attributes: ['visibility']
                    },
                ]
            });
            if (!ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            try {
                const folder = await Folder.findOne({
                    where: {
                        id: folderId
                    }
                })
                const ideas = await Idea.findAndCountAll({
                    where: {
                        ideationId: req.params.ideationId
                    },
                    include: [
                        {
                            model: User,
                            as: 'author',
                            attributes: ['id', 'name', 'email', 'imageUrl']
                        },
                        {
                            model: Folder,
                            where: { id: folderId },
                            attributes: []
                        },
                    ],
                    offset,
                    limit
                })
                const resFolder = folder.toJSON();
                resFolder.ideas = ideas;

                return res.ok(resFolder);

            } catch (err) {
                next(err);
            }

        } catch (err) {
            next(err);
        }
    })

    const _readIdeationFolder = async (req, res, next) => {
        const folderId = req.params.folderId;
        const offset = req.query.offset || 0;
        const limit = req.query.limit || 8;

        try {
            const ideas = await Idea.findAndCountAll({
                where: {
                    ideationId: req.params.ideationId
                },
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['id', 'name', 'email', 'imageUrl']
                    },
                    {
                        model: Folder,
                        where: { id: folderId },
                        attributes: []
                    },
                ],
                offset,
                limit
            })

            return res.ok(ideas);

        } catch (err) {
            next(err);
        }
    }
    app.get('/api/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const topicId = req.params.topicId;
            if (!ideationId || !topicId) return res.badRequest();

            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: topicId
                        },
                        attributes: ['visibility']
                    },
                ]
            });
            if (!ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationFolder(req, res, next);

        } catch (err) {
            next(err);
        }
    })
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationFolder(req, res, next);
    });

    /* Add ideas to folder*/
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        let ideas = req.body;
        const topicId = req.params.topicId;
        const ideationId = req.params.ideationId;
        const folderId = req.params.folderId;

        if (!Array.isArray(ideas)) {
            ideas = [ideas];
        }
        const ideaIds = [];
        ideas.forEach((idea) => ideaIds.push(idea.id || idea.ideaId));
        const ideation = await Ideation.findOne({
            where: {
                id: ideationId
            },
            include: [
                {
                    model: Topic,
                    where: {
                        id: topicId
                    },
                    attributes: ['visibility']
                }
            ]
        });
        if (!ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
            return res.notFound();
        }

        try {
            if (ideaIds.length) {
                await db.transaction(async function (t) {
                    const excisitingItems = await FolderIdea.findAll({
                        where: {
                            folderId: folderId,
                            ideaId: {
                                [Op.in]: ideaIds
                            }
                        }
                    });
                    const findOrCreateFolderIdeas = ideas.map((idea) => {
                        return FolderIdea
                            .upsert({
                                folderId: folderId,
                                ideaId: idea.id || idea.ideaId
                            },
                                { transaction: t }
                            );
                    });

                    const folderIdeaActivities = [];
                    const results = await Promise.allSettled(findOrCreateFolderIdeas);
                    results.forEach((inspection) => {
                        if (inspection.status === 'fulfilled') {
                            const folderIdea = inspection.value[0];
                            const exists = excisitingItems.find((item) => {
                                return item.ideaId === folderIdea.ideaId
                            });
                            const folderIdeaItem = folderIdea.toJSON();
                            if (!exists) {
                                const folderData = ideaIds.find((item) => {
                                    return item.id === folderIdeaItem.ideaId;
                                });
                                const folder = Folder.build(folderData);
                                folder.topicId = topicId;
                                const addActivity = cosActivities.addActivity(
                                    folderIdea,
                                    {
                                        type: 'User',
                                        id: req.user.userId,
                                        ip: req.ip
                                    },
                                    null,
                                    folder,
                                    req.method + ' ' + req.path,
                                    t
                                );
                                folderIdeaActivities.push(addActivity);
                            }
                        } else {
                            logger.error('Adding Idea failed', inspection.reason);
                        }
                    });
                    await Promise.all(folderIdeaActivities);

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
                logger.error('Adding Idea to Folder failed', req.path, err);

                return next(err);
            }

            return res.forbidden();
        }
    });

    /**
    * Delete Idea from folder
    */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
        const folderId = req.params.folderId;
        const ideaId = req.params.ideaId;
        const topicId = req.params.topicId;
        try {
            const idea = await Idea.findOne({
                where: {
                    id: ideaId
                },
                include: [
                    {
                        model: Folder,
                        where: {
                            id: folderId
                        }
                    }
                ]
            });
            const folder = idea.Folders[0];
            const folderIdea = folder.FolderIdea;
            await db.transaction(async function (t) {
                idea.topicId = topicId;
                await cosActivities.deleteActivity(
                    idea,
                    folder,
                    {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    },
                    req.method + ' ' + req.path,
                    t
                );

                await folderIdea.destroy({ paranoid: false });

                t.afterCommit(() => res.ok());
            });

        } catch (err) {
            return next(err);
        }

    });

    /**
     * Update a folder
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const ideationId = req.params.ideationId;
            const folderId = req.params.folderId;
            let fields = ['name', 'description'];

            const folder = await Folder.findOne({
                where: {
                    id: folderId
                },
                include: [
                    {
                        model: Ideation,
                        where: {
                            id: ideationId
                        },
                        include: [
                            {
                                model: Topic,
                                where: {
                                    id: topicId
                                }
                            }
                        ]
                    }
                ]
            });
            const ideation = folder.Ideation;
            if (!ideation || ideation.Topics.length === 0) {
                res.forbidden();
            }
            if (!folder) {
                return res.notFound();
            }
            if (folder.creatorId !== req.user.id) return res.forbidden();

            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        folder[field] = req.body[field];
                });
                folder.topicId = topicId;
                await cosActivities
                    .updateActivity(
                        folder,
                        null,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await folder.save({
                    transaction: t
                });
                t.afterCommit(async () => {
                    return res.ok(folder);
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            const folderId = req.params.folderId;
            const ideationId = req.params.ideationId;
            const topicId = req.params.topicId;
            const folder = await Folder.findOne({
                where: {
                    id: folderId
                },
                include: [
                    {
                        model: Ideation,
                        where: {
                            id: ideationId
                        },
                        include: [
                            {
                                model: Topic,
                                where: {
                                    id: topicId
                                }
                            }
                        ]
                    }
                ]
            });
            const ideation = folder.Ideation;
            if (!ideation || ideation.Topics.length === 0) {
                res.forbidden();
            }

            if (folder.creatorId !== req.user.id) {
                return res.forbidden();
            }

            await db
                .transaction(async function (t) {
                    folder.topicId = topicId;
                    await cosActivities
                        .deleteActivity(folder, ideation, {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);

                    await folder.destroy();

                    t.afterCommit(() => {
                        return res.ok();
                    });
                });
        } catch (err) {
            next(err);
        }
    });
    /**
        * Read Ideas
    */

    const _readIdeationFolders = async (req, res, next) => {
        const ideationId = req.params.ideationId;
        const limit = req.query.limit || 8;
        const offset = req.query.offset || 0;
        try {
            const folders = await db.query(`
            SELECT
                f.id,
                f."ideationId",
                u.id as "creator.id",
                u.name as "creator.name",
                u."imageUrl" AS "creator.imageUrl",
                f.name,
                f.description,
                f."createdAt",
                f."updatedAt",
                COALESCE(fi.count, 0) as "ideas.count",
                count(*) OVER()::integer AS "countTotal"
                FROM "Folders" f
                JOIN "Users" u ON u.id = f."creatorId"
                LEFT JOIN (
                    SELECT "folderId", COUNT(*) FROM "FolderIdeas" GROUP BY "folderId"
                ) fi ON fi."folderId" = f.id
                WHERE f."ideationId" = :ideationId AND f."deletedAt" IS NULL
                LIMIT :limit
                OFFSET :offset;
            `, {
                replacements: {
                    ideationId: ideationId,
                    limit,
                    offset
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });
            const count = folders[0]?.countTotal || 0;
            folders.forEach((folder) => delete folder.countTotal);

            return res.ok({
                count,
                rows: folders
            });

        } catch (err) {
            next(err);
        }
    }
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const ideaId = req.params.ideaId;
            const limit = req.query.limit || 8;
            const offset = req.query.offset || 0;

            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    },
                    {
                        model: Idea,
                        paranoid: false,
                        where: {
                            id: ideaId
                        }
                    }
                ]
            });

            if (!ideation?.Ideas?.length || !ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            const folders = await db.query(`
            SELECT
                f.id,
                f."ideationId",
                u.id as "creator.id",
                u.name as "creator.name",
                u."imageUrl" AS "creator.imageUrl",
                f.name,
                f.description,
                f."createdAt",
                f."updatedAt",
                COALESCE(fi.count, 0) as "ideas.count",
                count(*) OVER()::integer AS "countTotal"
                FROM "FolderIdeas" fis
                JOIN "Folders" f ON fis."folderId" = f.id
                JOIN "Users" u ON u.id = f."creatorId"
                LEFT JOIN (
                    SELECT "folderId", COUNT(*) FROM "FolderIdeas" GROUP BY "folderId"
                ) fi ON fi."folderId" = f.id
                WHERE fis."ideaId" = :ideaId AND f."ideationId" = :ideationId AND f."deletedAt" IS NULL
                LIMIT :limit
                OFFSET :offset;
            `, {
                replacements: {
                    ideationId: ideationId,
                    ideaId,
                    limit,
                    offset
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });
            const count = folders[0]?.countTotal || 0;
            folders.forEach((folder) => delete folder.countTotal);

            return res.ok({
                count,
                rows: folders
            });
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const ideaId = req.params.ideaId;

            const ideation = await Ideation.findOne({
                where: {
                    id: ideationId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    },
                    {
                        model: Idea,
                        paranoid: false,
                        where: {
                            id: ideaId
                        }
                    }
                ]
            });

            if (!ideation?.Ideas?.length || !ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            const folders = await db.query(`
            SELECT
                f.id,
                f."ideationId",
                u.id as "creator.id",
                u.name as "creator.name",
                u."imageUrl" AS "creator.imageUrl",
                f.name,
                f.description,
                f."createdAt",
                f."updatedAt",
                COALESCE(fi.count, 0) as "ideas.count",
                count(*) OVER()::integer AS "countTotal"
                FROM "FolderIdeas" fis
                JOIN "Folders" f ON fis."folderId" = f.id
                JOIN "Users" u ON u.id = f."creatorId"
                LEFT JOIN (
                    SELECT "folderId", COUNT(*) FROM "FolderIdeas" GROUP BY "folderId"
                ) fi ON fi."folderId" = f.id
                WHERE fis."ideaId" = :ideaId AND f."ideationId" = :ideationId AND f."deletedAt" IS NULL;
            `, {
                replacements: {
                    ideationId: ideationId,
                    ideaId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });
            const count = folders[0]?.countTotal || 0;
            folders.forEach((folder) => delete folder.countTotal);

            return res.ok({
                count,
                rows: folders
            });
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        let folders = req.body;
        const topicId = req.params.topicId;
        const ideationId = req.params.ideationId;
        const ideaId = req.params.ideaId;

        if (!Array.isArray(folders)) {
            folders = [folders];
        }
        const folderIds = [];
        folders.forEach((folder) => folderIds.push(folder.id || folder.folderId));
        const ideation = await Ideation.findOne({
            where: {
                id: ideationId
            },
            include: [
                {
                    model: Topic,
                    where: {
                        id: topicId
                    },
                    attributes: ['visibility']
                },
                {
                    model: Idea,
                    where: {
                        id: ideaId
                    }
                }
            ]
        });

        if (!ideation?.Ideas?.length || !ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
            return res.notFound();
        }

        try {
            if (folderIds.length) {
                await db.transaction(async function (t) {
                    const excisitingItems = await FolderIdea.findAll({
                        where: {
                            ideaId: ideaId,
                            folderId: {
                                [Op.in]: folderIds
                            }
                        }
                    });
                    const findOrCreateFolderIdeas = folders.map((folder) => {
                        return FolderIdea
                            .upsert({
                                ideaId: ideaId,
                                folderId: folder.id || folder.folderId
                            },
                                { transaction: t }
                            );
                    });

                    const folderIdeaActivities = [];
                    const results = await Promise.allSettled(findOrCreateFolderIdeas);
                    results.forEach((inspection) => {
                        if (inspection.status === 'fulfilled') {
                            const folderIdea = inspection.value[0];
                            const exists = excisitingItems.find((item) => {
                                return item.ideaId === folderIdea.ideaId
                            });
                            const folderIdeaItem = folderIdea.toJSON();
                            if (!exists) {
                                const folderData = folderIds.find((item) => {
                                    return item.id === folderIdeaItem.folderId;
                                });
                                const folder = Folder.build(folderData);
                                folder.topicId = topicId;
                                const addActivity = cosActivities.addActivity(
                                    folderIdea,
                                    {
                                        type: 'User',
                                        id: req.user.userId,
                                        ip: req.ip
                                    },
                                    null,
                                    folder,
                                    req.method + ' ' + req.path,
                                    t
                                );
                                folderIdeaActivities.push(addActivity);
                            }
                        } else {
                            logger.error('Adding Idea failed', inspection.reason);
                        }
                    });
                    await Promise.all(folderIdeaActivities);

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
                logger.error('Adding Idea to Folder failed', req.path, err);

                return next(err);
            }

            return res.forbidden();
        }
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/folders', async (req, res, next) => {
        try {
            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
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

            if (!ideation?.Topics?.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationFolders(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationFolders(req, res, next);
    });

    /*
     * Read (List) Idea votes
     */

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        try {
            const results = await db.query(
                `
                SELECT
                    u.name,
                    u.company,
                    u."imageUrl",
                    CAST(CASE
                        WHEN iv.value=1 Then 'up'
                        ELSE 'down' END
                    AS VARCHAR(5)) AS vote,
                    iv."createdAt",
                    iv."updatedAt"
                    FROM "IdeaVotes" iv
                    LEFT JOIN "Users" u
                    ON
                        u.id = iv."creatorId"
                    WHERE iv."ideaId" = :ideaId
                    AND iv.value <> 0
                    ;
                `,
                {
                    replacements: {
                        ideaId: req.params.ideaId
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

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const userId = req.user?.id;
            if (userId) {
                const authorizationResult = await topicService._hasPermission(topicId, userId, TopicMemberUser.LEVELS.read, true);
                // Add "req.locals" to store info collected from authorization for further use in the request. Might save a query or two for some use cases.
                // Naming convention ".locals" is inspired by "res.locals" - http://expressjs.com/api.html#res.locals
                if (!authorizationResult) {
                    return res.forbidden();
                }
            } else {
                const topic = await Topic.findOne({
                    where: {
                        id: topicId,
                        visibility: Topic.VISIBILITY.public
                    }
                })
                if (!topic) {
                    return res.forbidden();
                }
            }
            const results = await db.query(
                `
                SELECT
                    u.name,
                    u.company,
                    u."imageUrl",
                    CAST(CASE
                        WHEN iv.value=1 Then 'up'
                        ELSE 'down' END
                    AS VARCHAR(5)) AS vote,
                    iv."createdAt",
                    iv."updatedAt"
                    FROM "IdeaVotes" iv
                    LEFT JOIN "Users" u
                    ON
                        u.id = iv."creatorId"
                    WHERE iv."ideaId" = :ideaId
                    AND iv.value <> 0
                    ;
                `,
                {
                    replacements: {
                        ideaId: req.params.ideaId
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

    /**
     * Create an idea Vote
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.ideation]), async function (req, res, next) {
        const value = parseInt(req.body.value, 10);
        const topicId = req.params.topicId;
        try {
            const idea = await Idea
                .findOne({
                    where: {
                        id: req.params.ideaId
                    }
                });

            if (!idea) {
                return res.notFound();
            }

            await db
                .transaction(async function (t) {
                    await topicService.addUserAsMember(req.user.id, topicId, t);

                    const vote = await IdeaVote
                        .findOne({
                            where: {
                                ideaId: req.params.ideaId,
                                creatorId: req.user.id || req.user.userId
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
                        vote.topicId = topicId;
                        if (vote.value === 0) {
                            await cosActivities
                                .deleteActivity(
                                    vote,
                                    idea,
                                    {
                                        type: 'User',
                                        id: req.user.userId,
                                        ip: req.ip
                                    },
                                    req.method + ' ' + req.path,
                                    t
                                );

                            await vote.destroy({ force: true });
                        } else {
                            await vote.save({
                                transaction: t
                            });
                        }

                    } else {
                        //User has not voted...
                        const iv = await IdeaVote
                            .create({
                                ideaId: req.params.ideaId,
                                creatorId: req.user.userId,
                                value: req.body.value
                            }, {
                                transaction: t
                            });
                        const i = Idea.build(Object.assign({}, idea));
                        iv.topicId = topicId;
                        await cosActivities
                            .createActivity(iv, i, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                    }

                    const results = await db
                        .query(
                            `
                            SELECT
                            ii."up.count",
                            ii."down.count",
                                COALESCE(cvus.selected, false) as "up.selected",
                                COALESCE(cvds.selected, false) as "down.selected"
                                FROM (
                                    SELECT
                                    i.id AS "ideaId",
                                        COALESCE(cvu.count, 0) as "up.count",
                                        COALESCE(cvd.count, 0) as "down.count"
                                    FROM "Ideas" i
                                        LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                                        LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                                    WHERE i."ideationId" = :ideationId
                                    AND i.id = :ideaId
                                    GROUP BY i.id, cvu.count, cvd.count
                                ) ii
                                LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (ii."ideaId" = cvus."ideaId")
                                LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (ii."ideaId" = cvds."ideaId");
                            `,
                            {
                                replacements: {
                                    ideationId: req.params.ideationId,
                                    ideaId: req.params.ideaId,
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
    /**
     * Add idea to favourites
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/favourite', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const ideaId = req.params.ideaId;

        try {
            await db
                .transaction(async function (t) {
                    await IdeaFavourite.findOrCreate({
                        where: {
                            ideaId: ideaId,
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
    /**
     * Remove idea from favourites
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/favourite', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const ideaId = req.params.ideaId;

        try {
            const topicFavourite = await IdeaFavourite.findOne({
                where: {
                    userId: userId,
                    ideaId: ideaId
                }
            });

            if (topicFavourite) {
                await db
                    .transaction(async function (t) {
                        await IdeaFavourite.destroy({
                            where: {
                                userId: userId,
                                ideaId: ideaId
                            },
                            force: true,
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

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.createComment);

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), commentsLib.listComments);
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), commentsLib.listComments);

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, false, null, true), commentsLib.deleteComment);

    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), commentsLib.updateComment);

    const ideaReportsCreate = async function (req, res, next) {
        const ideaId = req.params.ideaId;
        const topicId = req.params.topicId;
        try {
            const idea = await Idea.findOne({
                where: {
                    id: ideaId
                }
            });

            if (!idea) {
                return idea;
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
                    idea.topicId = topicId;
                    await cosActivities.addActivity(
                        report,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        null,
                        idea,
                        req.method + ' ' + req.path,
                        t
                    );
                    await IdeaReport
                        .create(
                            {
                                ideaId: ideaId,
                                reportId: report.id
                            },
                            {
                                transaction: t
                            }
                        );
                    if (!report) {
                        return res.notFound();
                    }

                    await emailLib.sendIdeaReport(idea.id, report)

                    t.afterCommit(() => {
                        return res.ok(report);
                    });
                });
        } catch (err) {
            return next(err);
        }
    };

    app.post(['/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports', '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports'], loginCheck(['partner']), ideaReportsCreate);

    /**
     * Read Idea Report
     */
    app.get(['/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId', '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId'], authTokenRestrictedUse, async (req, res, next) => {
        try {
            const results = await db
                .query(
                    `
                        SELECT
                            r."id",
                            r."type",
                            r."text",
                            r."createdAt",
                            i."id" as "idea.id",
                            i."statement" as "idea.statement",
                            i."description" as "idea.description"
                        FROM "Reports" r
                        LEFT JOIN "IdeaReports" ir ON (ir."reportId" = r.id)
                        LEFT JOIN "Ideas" i ON (i.id = ir."ideaId")
                        WHERE r.id = :reportId
                        AND i.id = :ideaId
                        AND r."deletedAt" IS NULL
                    ;`,
                    {
                        replacements: {
                            ideaId: req.params.ideaId,
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

            const ideaReport = results[0];

            return res.ok(ideaReport);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate', authTokenRestrictedUse, async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const eventTokenData = req.locals.tokenDecoded;
            const type = req.body.type;

            if (!type) {
                return res.badRequest({ type: 'Property type is required' });
            }

            const ideaReport = (await db
                .query(
                    `
                        SELECT
                            i."id" as "idea.id",
                            i."updatedAt" as "idea.updatedAt",
                            r."id" as "report.id",
                            r."createdAt" as "report.createdAt"
                        FROM "IdeaReports" ir
                        LEFT JOIN "Reports" r ON (r.id = ir."reportId")
                        LEFT JOIN "Ideas" i ON (i.id = ir."ideaId")
                        WHERE ir."ideaId" = :ideaId AND ir."reportId" = :reportId
                        AND i."deletedAt" IS NULL
                        AND r."deletedAt" IS NULL
                    ;`,
                    {
                        replacements: {
                            ideaId: req.params.ideaId,
                            reportId: req.params.reportId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                ))[0];

            if (!ideaReport) {
                return res.notFound();
            }

            let idea = ideaReport.idea;
            const report = ideaReport.report;

            // If Idea has been updated since the Report was made, deny moderation cause the text may have changed.
            if (idea.updatedAt.getTime() > report.createdAt.getTime()) {
                return res.badRequest('Report has become invalid cause idea has been updated after the report', 10);
            }

            idea = await Idea.findOne({
                where: {
                    id: idea.id
                }
            });
            idea.topicId = topicId;
            idea.deletedById = eventTokenData.userId;
            idea.deletedAt = db.fn('NOW');
            idea.deletedReasonType = req.body.type;
            idea.deletedReasonText = req.body.text;
            idea.deletedByReportId = report.id;

            await db
                .transaction(async function (t) {
                    await cosActivities.updateActivity(
                        idea,
                        null,
                        {
                            type: 'Moderator',
                            id: eventTokenData.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    let i = (await Idea.update(
                        {
                            deletedById: eventTokenData.userId,
                            deletedAt: db.fn('NOW'),
                            deletedReasonType: req.body.type,
                            deletedReasonText: req.body.text,
                            deletedByReportId: report.id
                        },
                        {
                            where: {
                                id: idea.id
                            },
                            returning: true
                        },
                        {
                            transaction: t
                        }
                    ))[1];

                    i = Idea.build(i.dataValues);
                    i.topicId = topicId;
                    await cosActivities
                        .deleteActivity(i, idea, {
                            type: 'Moderator',
                            id: eventTokenData.userId,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);

                    t.afterCommit(() => {
                        return res.ok();
                    });
                });
        } catch (err) {
            next(err);
        }
    });
    app.post(['/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports', '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports'], loginCheck(['partner']), commentsLib.createReport);

    app.get(['/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId'], authTokenRestrictedUse, commentsLib.readReport);

    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, commentsLib.moderateReport);

    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.createVote);

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.listVotes);

    /**
   * Add Idea Attachment
   */
    const addIdeaAttachment = async (req, res, next, type) => {
        const attachmentLimit = config.attachments.limit || 5;
        const topicId = req.params.topicId;
        const ideaId = req.params.ideaId;
        const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');

        try {

            const ideation = await Ideation.findOne({
                where: {
                    id: req.params.ideationId
                },
                attributes: ['allowAnonymous']
            });
            const idea = await Idea.findOne({
                where: {
                    id: ideaId
                },
                include: [Attachment]
            });

            if (!ideation.allowAnonymous && idea.authorId !== req.user.id) {
                return res.forbidden();
            }
            if (!idea) {
                return res.badRequest('Matching idea not found', 3);
            }
            if (idea.Attachments && idea.Attachments.length >= attachmentLimit) {
                return res.badRequest('Idea attachment limit reached', 2);
            }

            let data = await cosUpload.upload(req, `${topicId}_${ideaId}`);
            if (!ideation.allowAnonymous) {
                data.creatorId = req.user.id;
            } else {
                data.creatorId = null;
                data.sessionId = sessToken;
            }
            data.source = Attachment.SOURCES.upload;
            let attachment = Attachment.build(data);
            await db.transaction(async function (t) {
                attachment = await attachment.save({ transaction: t });
                await IdeaAttachment.create(
                    {
                        ideaId: req.params.ideaId,
                        attachmentId: attachment.id,
                        type: type || IdeaAttachment.ATTACHMENT_TYPES.file
                    },
                    {
                        transaction: t
                    }
                );
                await cosActivities.addActivity(
                    attachment,
                    {
                        type: 'User',
                        id: (ideation.allowAnonymous) ? null : req.user.id,
                        ip: req.ip
                    },
                    null,
                    idea,
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
    }
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async function (req, res, next) {
        return addIdeaAttachment(req, res, next);
    });

    /**
   * Add image to idea
   */

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/image/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async function (req, res, next) {
        return addIdeaAttachment(req, res, next, IdeaAttachment.ATTACHMENT_TYPES.image);
    });


    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async function (req, res, next) {
        const ideaId = req.params.ideaId;
        const name = req.body.name;
        const type = req.body.type;
        const source = req.body.source;
        const size = req.body.size;
        let link = req.body.link;
        const attachmentLimit = config.attachments.limit || 5;
        const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
        const ideationPromise = Ideation.findOne({
            where: {
                id: req.params.ideationId
            },
            attributes: ['allowAnonymous']
        });

        const ideaPromise = Idea.findOne({
            where: {
                id: ideaId
            },
            include: [Attachment]
        });
        const [ideation, idea] = await Promise.all([ideationPromise, ideaPromise]);

        if ((ideation.allowAnonymous && idea.sessionId !== sessToken) || (!ideation.allowAnonymous && req.user.id !== req.params.userId)) {
            return res.forbidden();
        }



        if (!idea) {
            return res.badRequest('Matching idea not found', 3);
        }
        if (idea.Attachments && idea.Attachments.length >= attachmentLimit) {
            return res.badRequest('Idea attachment limit reached', 2);
        }

        if (source !== Attachment.SOURCES.upload && !link) {
            return res.badRequest('Missing attachment link');
        }
        if (!name) {
            return res.badRequest('Missing attachment name');
        }

        try {
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
                creatorId: (ideation.allowAnonymous) ? null : req.user.userId,
                link: link
            });

            await db.transaction(async function (t) {
                attachment = await attachment.save({ transaction: t });
                await IdeaAttachment.create(
                    {
                        ideaId: ideaId,
                        attachmentId: attachment.id,
                        type: IdeaAttachment.ATTACHMENT_TYPES.file
                    },
                    {
                        transaction: t
                    }
                );
                await cosActivities.addActivity(
                    attachment,
                    {
                        type: 'User',
                        id: (ideation.allowAnonymous) ? null : req.user.userId,
                        ip: req.ip
                    },
                    null,
                    idea,
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

    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async function (req, res, next) {
        const newName = req.body.name;

        if (!newName) {
            return res.badRequest('Missing attachment name');
        }

        const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');

        try {
            const ideationPromise = Ideation.findOne({
                where: {
                    id: req.params.ideationId
                },
                attributes: ['allowAnonymous']
            });
            const attachmentPromise = Attachment
                .findOne({
                    where: {
                        id: req.params.attachmentId
                    },
                    include: [Idea]
                });
            const [ideation, attachment] = await Promise.all([ideationPromise, attachmentPromise]);

            const idea = attachment.Ideas[0];

            if ((!ideation.allowAnonymous || idea.status === 'draft') && idea.authorId !== req.user.id) {
                return res.forbidden();
            }
            if (ideation.allowAnonymous && idea.status !== 'draft' && idea.sessionId !== sessToken) {
                return res.forbidden();
            }

            if (!idea) {
                return res.badRequest('Matching idea not found', 3);
            }
            attachment.name = newName;

            await db
                .transaction(async function (t) {
                    const idea = attachment.Ideas[0];
                    delete attachment.Ideas;

                    await cosActivities.updateActivity(
                        attachment,
                        idea,
                        {
                            type: 'User',
                            id: (ideation.allowAnonymous) ? null : req.user.userId,
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
     * Delete Idea Attachment
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async function (req, res, next) {
        try {
            const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
            const attachmentPromise = Attachment.findOne({
                where: {
                    id: req.params.attachmentId
                },
                include: [Idea]
            });
            const ideationPromise = Ideation.findOne({
                where: {
                    id: req.params.ideationId
                },
                attributes: ['allowAnonymous']
            });
            const [attachment, ideation] = await Promise.all([attachmentPromise, ideationPromise]);
            const idea = attachment.Ideas[0];

            const user = await User.findOne({
                where: {
                    id: req.user.userId
                }
            });

            if ((ideation.allowAnonymous && idea.sessionId !== sessToken) || (!ideation.allowAnonymous && req.user.id !== user.id)) {
                return res.forbidden();
            }
            if (ideation.allowAnonymous && idea.status !== 'draft' && idea.sessionId !== sessToken) {
                return res.forbidden();
            }

            if (!idea) {
                return res.badRequest('Matching idea not found', 3);
            }

            await db
                .transaction(async function (t) {
                    const link = new URL(attachment.link);
                    if (attachment.source === Attachment.SOURCES.upload) {
                        await cosUpload.delete(link.pathname);
                    }
                    await cosActivities.deleteActivity(attachment, attachment.Ideas[0], {
                        type: 'User',
                        id: (ideation.allowAnonymous) ? null : req.user.userId,
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

    const getIdeaAttachments = async (ideaId, type) => {
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
                FROM "IdeaAttachments" ia
                JOIN "Attachments" a ON a.id = ia."attachmentId"
                LEFT JOIN "Users" c ON c.id = a."creatorId"
                WHERE ia."ideaId" = :ideaId AND ia.type=:type
                AND a."deletedAt" IS NULL
                ;
                `,
                {
                    replacements: {
                        ideaId: ideaId,
                        type: type || IdeaAttachment.ATTACHMENT_TYPES.file
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
    }
    const ideaAttachmentsList = async function (req, res, next) {
        try {
            const attachments = await getIdeaAttachments(req.params.ideaId, req.query?.type);

            return res.ok({
                count: attachments.length,
                rows: attachments
            });
        } catch (err) {
            return next(err);
        }
    };

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), ideaAttachmentsList);
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments', topicService.hasVisibility(Topic.VISIBILITY.public), ideaAttachmentsList);

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

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), readAttachment);
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', topicService.hasVisibility(Topic.VISIBILITY.public), readAttachment);

}
