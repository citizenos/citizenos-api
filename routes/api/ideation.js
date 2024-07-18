'use strict';



module.exports = function (app) {
    const logger = app.get('logger');
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');
    const cosActivities = app.get('cosActivities');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const emailLib = app.get('email');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const { injectReplacements } = require('sequelize/lib/utils/sql');


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

    const topicLib = require('./topic')(app);
    const discussionLib = require('./discussion')(app);
    /**
     * Create an Ideation
     */
    app.post('/api/users/:userId/topics/:topicId/ideations', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft]), async (req, res, next) => {
        const question = req.body.question;
        const deadline = req.body.deadline;
        const topicId = req.params.topicId;
        try {
            if (!question) {
                return res.badRequest('Ideation question is missing', 1);
            }

            const ideation = Ideation.build({
                question,
                deadline,
                creatorId: req.user.id
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
                    FROM "Ideas" i WHERE "ideationId" = :ideationId
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

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/participants', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
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

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        _readIdeation(req, res, next);
    });

    /**
     * Update an Ideation
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const ideationId = req.params.ideationId;
            let fields = ['deadline', 'question'];

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
            if (!topic || !topic.Ideations || !topic.Ideations.length) {
                return res.notFound();
            }
            if (topic.status === Topic.STATUSES.draft) {
                fields = fields.concat(['question']);
            }
            const ideation = topic.Ideations[0];
            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        ideation[field] = req.body[field];
                });
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

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
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
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.ideation]), async (req, res, next) => {
        const ideationId = req.params.ideationId;
        const topicId = req.params.topicId;
        const statement = req.body.statement;
        const description = req.body.description;
        const imageUrl = req.body.imageUrl;
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

            if (!ideation || !ideation.Topics.length) {
                return res.notFound();
            }
            if (ideation.deadline && new Date(ideation.deadline) < new Date()) return res.forbidden();
            await db
                .transaction(async function (t) {
                    const idea = Idea.build({
                        authorId: req.user.id,
                        statement,
                        description,
                        imageUrl,
                        ideationId
                    });
                    idea.topicId = topicId;
                    await idea.save({ transaction: t });

                    await cosActivities
                        .createActivity(
                            idea,
                            ideation,
                            {
                                type: 'User',
                                id: req.user.id,
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
                                    required: true
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
                INNER JOIN "Users" AS "author" ON "Idea"."authorId" = "author"."id"
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
            if (!ideation || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationIdea(req, res, next);

        } catch (err) {
            next(err);
        }
    })
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationIdea(req, res, next);
    });

    /**
     * Update an Idea
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const ideationId = req.params.ideationId;
            const ideaId = req.params.ideaId;
            let fields = ['statement', 'description', 'imageUrl'];

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
            if (idea.authorId !== req.user.id) return res.forbidden();

            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        idea[field] = req.body[field];
                });
                idea.topicId = topicId;
                await cosActivities
                    .updateActivity(
                        idea,
                        null,
                        {
                            type: 'User',
                            id: req.user.id,
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

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read), async (req, res, next) => {
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
        const limit = req.query.limit || 8;
        const offset = req.query.offset || 0;
        const orderBy = req.query.orderBy;
        const order = (req.query.order?.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
        const authorId = req.query.authorId;
        const favourite = req.query.favourite;
        const folderId = req.query.folderId;
        const showModerated = req.query.showModerated || false;
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
                INNER JOIN "Users" AS "author" ON "Idea"."authorId" = "author"."id"
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
                    userId: req.user?.id || req.user?.userId,
                    ideationId,
                    authorId,
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
            ideas.forEach((idea) => delete idea.countTotal);

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

            if (!ideation || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationIdeas(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationIdeas(req, res, next);
    });

    /*Folders*/

    /**
     * Create a folder
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null), async (req, res, next) => {
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

            if (!ideation || !ideation.Topics.length) {
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
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
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
            if (!ideation || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
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
            if (!ideation || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
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
            if (!ideation || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationFolder(req, res, next);

        } catch (err) {
            next(err);
        }
    })
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationFolder(req, res, next);
    });

    /* Add ideas to folder*/
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
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
        if (!ideation || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
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
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas/:ideaId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
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
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null), async (req, res, next) => {
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

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
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

            if (!ideation || !ideation.Ideas.length || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
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

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
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

            if (!ideation || !ideation.Ideas.length || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
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

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
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

        if (!ideation || !ideation.Ideas.length || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
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

            if (!ideation || !ideation.Topics.length || ideation.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            return _readIdeationFolders(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationFolders(req, res, next);
    });

    /*
     * Read (List) Idea votes
     */

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
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
                const authorizationResult = await topicLib._hasPermission(topicId, userId, TopicMemberUser.LEVELS.read, true);
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
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.ideation]), async function (req, res, next) {
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

    /**
     * Create Idea Comment
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            let type = req.body.type || Comment.TYPES.reply;
            const parentId = req.body.parentId;
            const topicId = req.params.topicId;
            const parentVersion = req.body.parentVersion;
            let subject = req.body.subject;
            const text = req.body.text;
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
                    const idea = await Idea.findOne({
                        where: {
                            id: req.params.ideaId
                        },
                        paranoid: false,
                        transaction: t
                    });
                    if (idea.deletedAt) {
                        return res.forbidden();
                    }
                    idea.topicId = topicId;
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
                                    idea,
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
                                idea,
                                {
                                    type: 'User',
                                    id: req.user.userId,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );
                    }

                    await IdeaComment
                        .create(
                            {
                                ideaId: req.params.ideaId,
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
                        return res.created(resComment.toJSON());
                    });
                });
        } catch (err) {
            next(err);
        }
    });

    const ideaCommentsList = async function (req, res, next) {
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
            where += ` AND ic.type IN (:types) `
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
                "IdeaComments" ic
            JOIN "Comments" c ON c.id = ic."commentId" AND c.id = c."parentId"
            JOIN pg_temp.getCommentTree(ic."commentId") ct ON ct.id = ct.id
            WHERE ic."ideaId" = :ideaId
            ${where}
            ORDER BY ${orderByComments}
            LIMIT :limit
            OFFSET :offset
        `, db.dialect,
            {
                types: types,
                ideaId: req.params.ideaId,
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
                        FROM "IdeaComments" ic
                        JOIN "Comments" c ON ic."commentId" = c.id
                        WHERE ic."ideaId" = :ideaId
                        GROUP BY c.type;
                    `, {
                    replacements: {
                        ideaId: req.params.ideaId
                    }
                });
            const [comments, commentsCount] = await Promise.all([commentsQuery, commentCountQuery]);
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
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), topicLib.isModerator(), ideaCommentsList);

    /**
     * Read (List) public Topic Comments
     */
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', topicLib.hasVisibility(Topic.VISIBILITY.public), topicLib.isModerator(), ideaCommentsList);

    /**
     * Delete Topic Comment
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', loginCheck(['partner']), discussionLib.isCommentCreator(), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, false, null, true));

    //WARNING: Don't mess up with order here! In order to use "next('route')" in the isCommentCreator, we have to have separate route definition
    //NOTE: If you have good ideas how to keep one route definition with several middlewares, feel free to share!
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            await db
                .transaction(async function (t) {
                    const comment = await Comment.findOne({
                        where: {
                            id: req.params.commentId
                        },
                        include: [Idea]
                    });

                    comment.deletedById = req.user.userId;

                    await comment.save({
                        transaction: t
                    });
                    comment.topicId = topicId;
                    await cosActivities
                        .deleteActivity(
                            comment,
                            comment.Ideas[0],
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
        } catch (err) {
            next(err)
        }
    });

    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', loginCheck(['partner']), discussionLib.isCommentCreator());

    //WARNING: Don't mess up with order here! In order to use "next('route')" in the isCommentCreator, we have to have separate route definition.
    //NOTE: If you have good ideas how to keep one route definition with several middlewares, feel free to share!
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', async (req, res, next) => {
        try {
            const subject = req.body.subject;
            const text = req.body.text;
            let type = req.body.type;
            const commentId = req.params.commentId;
            const topicId = req.params.topicId;

            const comment = await Comment.findOne({
                where: {
                    id: commentId
                },
                include: [Idea]
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
                    const idea = comment.Ideas[0];
                    delete comment.Idea;
                    idea.topicId = topicId;
                    await cosActivities
                        .updateActivity(
                            comment,
                            idea,
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
        } catch (err) {
            next(err);
        }
    });

    const ideaCommentsReportsCreate = async function (req, res, next) {
        const commentId = req.params.commentId;
        const topicId = req.params.topicId;
        try {
            const comment = await Comment.findOne({
                where: {
                    id: commentId
                }
            });

            const idea = await Idea.findOne({
                where: {
                    id: req.params.ideaId
                }
            })
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
                    report.topicId = topicId;
                    await cosActivities.addActivity(
                        report,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        idea,
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

                    await emailLib.sendIdeaCommentReport(commentId, report)

                    t.afterCommit(() => {
                        return res.ok(report);
                    });
                });
        } catch (err) {
            return next(err);
        }
    };

    app.post(['/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports', '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports'], loginCheck(['partner']), ideaCommentsReportsCreate);

    /**
     * Read Idea reply Report
     */
    app.get(['/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId'], authTokenRestrictedUse, async (req, res, next) => {
        try {
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
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
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
                include: [Idea]
            });

            const idea = comment.dataValues.Ideas[0];
            delete comment.dataValues.Idea;
            comment.deletedById = eventTokenData.userId;
            comment.deletedAt = db.fn('NOW');
            comment.deletedReasonType = req.body.type;
            comment.deletedReasonText = req.body.text;
            comment.deletedByReportId = report.id;

            idea.topicId = topicId;
            await db
                .transaction(async function (t) {
                    await cosActivities.updateActivity(
                        comment,
                        idea,
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
                        .deleteActivity(c, idea, {
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

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
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

    /**
     * Create a Comment Vote
     */
    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        const value = parseInt(req.body.value, 10);

        try {
            const comment = await Comment
                .findOne({
                    where: {
                        id: req.params.commentId
                    }
                });
            const idea = await Idea
                .findOne({
                    where: {
                        id: req.params.ideaId
                    }
                });
            if (!comment || !idea) {
                return res.notFound();
            }

            await db
                .transaction(async function (t) {
                    idea.topicId = req.params.topicId;
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
                                idea,
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

                        await cosActivities
                            .createActivity(cv, idea, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                    }

                    const results = await db
                        .query(
                            `
                            SELECT
                                ic."up.count",
                                ic."down.count",
                                COALESCE(cvus.selected, false) as "up.selected",
                                COALESCE(cvds.selected, false) as "down.selected"
                                FROM (
                                    SELECT
                                        ic."commentId",
                                        COALESCE(cvu.count, 0) as "up.count",
                                        COALESCE(cvd.count, 0) as "down.count"
                                    FROM "IdeaComments" ic
                                        LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes" WHERE value > 0 GROUP BY "commentId") cvu ON ic."commentId" = cvu."commentId"
                                        LEFT JOIN ( SELECT "commentId", COUNT(value) as count FROM "CommentVotes"  WHERE value < 0 GROUP BY "commentId") cvd ON ic."commentId" = cvd."commentId"
                                    WHERE ic."ideaId" = :ideaId
                                    AND ic."commentId" = :commentId
                                    GROUP BY ic."commentId", cvu.count, cvd.count
                                ) ic
                                LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (ic."commentId" = cvus."commentId")
                                LEFT JOIN (SELECT "commentId", "creatorId", value, true AS selected FROM "CommentVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (ic."commentId" = cvds."commentId");
                            `,
                            {
                                replacements: {
                                    ideaId: req.params.ideaId,
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

}