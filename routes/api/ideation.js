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
                                id: req.user.userId,
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
                                id: req.user.userId,
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
                                    id: req.user.userId,
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
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
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
                    FROM "IdeationIdeas"
                    GROUP BY "ideationId"
                ) AS ii ON ii."ideationId" = i.id
                WHERE i.id = :ideationId AND i."deletedAt" IS NULL
                ;
            `,{
                replacements: {
                    ideationId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });

            if (!ideationInfo) {
                return res.notFound();
            }

            return res.ok(ideationInfo[0]);

        } catch (err) {
            next(err);
        }
    });

    /**
     * Update an Ideation
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const ideationId = req.params.ideationId;
            console.log(ideationId)
            // Make sure the Vote is actually related to the Topic through which the permission was granted.
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
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await ideation.save({
                    transaction: t
                });
                t.afterCommit(async () => {
                    const ideationInfo = await Ideation
                        .findOne({
                            where: { id: ideationId },
                            attributes: {
                                include: [[db.fn("COUNT", db.col("Ideas.id")), "ideas.count"]]
                            },
                            include: [
                                {
                                    model: Topic,
                                    where: { id: topicId }
                                },
                                {
                                    model: Idea, attributes: []
                                }
                            ]
                        });

                    return res.ok(ideationInfo);
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const ideation = Ideation.findOne({
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
                            id: req.user.userId,
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
}