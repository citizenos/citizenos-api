'use strict';

module.exports = function (app) {
    const config = app.get('config');
    const models = app.get('models');
    const db = models.sequelize;
    const cosActivities = app.get('cosActivities');
    const https = require('https');
    const path = require('path');

    const loginCheck = app.get('middleware.loginCheck');
    const cosUpload = app.get('cosUpload');

    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicAttachment = models.TopicAttachment;
    const Attachment = models.Attachment;

    const topicService = app.get('topicService');

    /**
     * Add Topic Attachment
     */
    app.post('/api/users/:userId/topics/:topicId/attachments/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.edit, false, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const attachmentLimit = config.attachments.limit || 5;
        const topicId = req.params.topicId;
        try {
            const topic = await topicService.getById(topicId, null, {
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
            const topic = await topicService.getById(topicId, null, {
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
};
