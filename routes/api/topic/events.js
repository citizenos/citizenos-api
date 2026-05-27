'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const cosActivities = app.get('cosActivities');

    const loginCheck = app.get('middleware.loginCheck');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');

    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicEvent = models.TopicEvent;

    const topicService = app.get('topicService');

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
};
