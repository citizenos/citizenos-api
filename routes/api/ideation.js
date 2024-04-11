'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');
    const cosActivities = app.get('cosActivities');

    const db = models.sequelize;

    const Ideation = models.Ideation;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;
    const Idea = models.Idea;
    const TopicIdeation = models.TopicIdeation;
    const topicLib = require('./topic')(app);

    /**
     * Create an Ideation
     */
    app.post('/api/users/:userId/topics/:topicId/ideations', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft]), async (req, res, next) => {
        const question = req.body.question;
        const deadline = req.body.deadline;
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

                    await cosActivities
                        .createActivity(
                            ideation,
                            null,
                            {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
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
                    COALESCE(ii.count, 0) as "ideas.count"
                FROM "Ideations" i
                LEFT JOIN (
                    SELECT
                        "ideationId",
                        COUNT("ideationId") as count
                    FROM "Ideas"
                    GROUP BY "ideationId"
                ) AS ii ON ii."ideationId" = i.id
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
            let fields = ['deadline'];

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
                            COALESCE(ii.count, 0) as "ideas.count"
                        FROM "Ideations" i
                        LEFT JOIN (
                            SELECT
                                "ideationId",
                                COUNT("ideationId") as count
                            FROM "Ideas"
                            GROUP BY "ideationId"
                        ) AS ii ON ii."ideationId" = i.id
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
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.ideation]), async (req, res, next) => {
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

            await db
                .transaction(async function (t) {
                    const idea = Idea.build({
                        authorId: req.user.id,
                        statement,
                        description,
                        imageUrl,
                        ideationId
                    });

                    await cosActivities
                        .createActivity(
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

                    t.afterCommit(() => {
                        return res.created(idea.toJSON());
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
        const ideaId = req.params.ideaId;
        try {
            const idea = await Idea.findOne({
                where: {
                    id: ideaId
                }
            })

            if (!idea) {
                return res.notFound();
            }

            return res.ok(idea);

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

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
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
        const limit = req.params.limit || 8;
        const offset = req.params.offset || 0;

        try {
            const ideas = await Idea.findAndCountAll ({
                where: {
                    ideationId: ideationId
                },
                limit: limit,
                offset: offset
            });

            return res.ok(ideas);

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
}