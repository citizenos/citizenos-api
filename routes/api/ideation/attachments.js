'use strict';

const { createHash } = require('crypto');
const https = require('https');
const path = require('path');

module.exports = function (app) {
    const config = app.get('config');
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');
    const db = models.sequelize;
    const cosActivities = app.get('cosActivities');
    const cosUpload = app.get('cosUpload');

    const Ideation = models.Ideation;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;
    const Idea = models.Idea;
    const IdeaAttachment = models.IdeaAttachment;
    const Attachment = models.Attachment;

    const topicService = app.get('topicService');
    const ideationService = app.get('ideationService');

    /**
     * Attachments
     */
    const ideaAttachmentsList = async (req, res, next) => {
        try {
            const attachments = await ideationService.getAttachments(req.params.ideaId, req.query?.type);
            return res.ok({ count: attachments.length, rows: attachments });
        } catch (err) {
            next(err);
        }
    };

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return ideaAttachmentsList(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, { where: { visibility: Topic.VISIBILITY.public } });
            if (!topic) return res.forbidden();
            return ideaAttachmentsList(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    const addIdeaAttachment = async (req, res, next, type) => {
        try {
            const attachmentLimit = config.attachments.limit || 5;
            const ideation = await Ideation.findByPk(req.params.ideationId, { attributes: ['allowAnonymous'] });
            const idea = await Idea.findByPk(req.params.ideaId, { include: [Attachment] });
            const userId = req.user.userId || req.user.id;

            if (!idea) return res.badRequest('Matching idea not found', 3);
            if (!ideation.allowAnonymous && idea.authorId !== userId) return res.forbidden();
            if (idea.Attachments && idea.Attachments.length >= attachmentLimit) return res.badRequest('Idea attachment limit reached', 2);

            let data = await cosUpload.upload(req, `${req.params.topicId}_${req.params.ideaId}`);
            data.creatorId = (ideation && ideation.allowAnonymous) ? null : userId;
            if (ideation && ideation.allowAnonymous) data.sessionId = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
            data.source = Attachment.SOURCES.upload;

            await db.transaction(async (t) => {
                let attachment = await Attachment.create(data, { transaction: t });
                await IdeaAttachment.create({ ideaId: req.params.ideaId, attachmentId: attachment.id, type: type || IdeaAttachment.ATTACHMENT_TYPES.file }, { transaction: t });
                await cosActivities.createActivity(attachment, idea, { type: 'User', id: (ideation && ideation.allowAnonymous) ? null : userId, ip: req.ip }, req.method + ' ' + req.path, t);
                t.afterCommit(() => res.created(attachment.toJSON()));
            });
        } catch (err) {
            if (err.type && (err.type === 'fileSize' || err.type === 'fileType')) return res.forbidden(err.message);
            next(err);
        }
    }

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), (req, res, next) => addIdeaAttachment(req, res, next));
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/image/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), (req, res, next) => addIdeaAttachment(req, res, next, IdeaAttachment.ATTACHMENT_TYPES.image));

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async (req, res, next) => {
        const { name, type, source, size, link } = req.body;
        const attachmentLimit = config.attachments.limit || 5;
        const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
        const userId = req.user.userId || req.user.id;
        
        try {
            const ideation = await Ideation.findByPk(req.params.ideationId, { attributes: ['allowAnonymous'] });
            const idea = await Idea.findByPk(req.params.ideaId, { include: [Attachment] });

            if (!idea) return res.badRequest('Matching idea not found', 3);
            if ((ideation.allowAnonymous && idea.sessionId !== sessToken) || (!ideation.allowAnonymous && userId !== req.params.userId)) {
                return res.forbidden();
            }

            if (idea.Attachments && idea.Attachments.length >= attachmentLimit) return res.badRequest('Idea attachment limit reached', 2);
            if (source !== Attachment.SOURCES.upload && !link) return res.badRequest('Missing attachment link');
            if (!name) return res.badRequest('Missing attachment name');

            let urlObject;
            if (link) urlObject = new URL(link);

            let invalidLink = false;
            switch (source) {
                case Attachment.SOURCES.dropbox:
                    if (!['www.dropbox.com', 'dropbox.com'].includes(urlObject.hostname)) invalidLink = true;
                    break;
                case Attachment.SOURCES.googledrive:
                    if (!urlObject.hostname.endsWith('google.com')) invalidLink = true;
                    break;
                case Attachment.SOURCES.onedrive:
                    if (urlObject.hostname !== '1drv.ms') invalidLink = true;
                    break;
                default:
                    return res.badRequest('Invalid link source');
            }

            if (invalidLink) return res.badRequest('Invalid link source');

            let data = { name, type, size, source, link };
            data.creatorId = (ideation && ideation.allowAnonymous) ? null : userId;
            if (ideation && ideation.allowAnonymous) data.sessionId = sessToken;
            
            await db.transaction(async (t) => {
                let attachment = await Attachment.create(data, { transaction: t });
                await IdeaAttachment.create({ ideaId: req.params.ideaId, attachmentId: attachment.id, type: IdeaAttachment.ATTACHMENT_TYPES.file }, { transaction: t });
                await cosActivities.createActivity(attachment, idea, { type: 'User', id: (ideation && ideation.allowAnonymous) ? null : userId, ip: req.ip }, req.method + ' ' + req.path, t);
                t.afterCommit(() => res.ok(attachment.toJSON()));
            });
        } catch (err) {
            next(err);
        }
    });

    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async (req, res, next) => {
        const newName = req.body.name;
        if (!newName) return res.badRequest('Missing attachment name');

        const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
        const userId = req.user.userId || req.user.id;

        try {
            const ideation = await Ideation.findByPk(req.params.ideationId, { attributes: ['allowAnonymous'] });
            const attachment = await Attachment.findByPk(req.params.attachmentId, { include: [Idea] });

            if (!attachment?.Ideas?.length) return res.badRequest('Matching idea not found', 3);
            const idea = attachment.Ideas[0];

            if ((!ideation.allowAnonymous || idea.status === 'draft') && idea.authorId !== userId) {
                return res.forbidden();
            }
            if (ideation.allowAnonymous && idea.status !== 'draft' && idea.sessionId !== sessToken) {
                return res.forbidden();
            }

            attachment.name = newName;
            await db.transaction(async (t) => {
                await cosActivities.updateActivity(
                    attachment,
                    idea,
                    { type: 'User', id: (ideation && ideation.allowAnonymous) ? null : userId, ip: req.ip },
                    req.method + ' ' + req.path,
                    t
                );
                await attachment.save({ transaction: t });
                t.afterCommit(() => res.ok(attachment.toJSON()));
            });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Delete Idea Attachment
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
            const attachment = await Attachment.findByPk(req.params.attachmentId, { include: [Idea] });
            const ideation = await Ideation.findByPk(req.params.ideationId, { attributes: ['allowAnonymous'] });
            const userId = req.user.userId || req.user.id;

            if (!attachment?.Ideas?.length) return res.badRequest('Matching idea not found', 3);
            const idea = attachment.Ideas[0];

            if ((ideation.allowAnonymous && idea.sessionId !== sessToken) || (!ideation.allowAnonymous && userId !== req.params.userId)) {
                return res.forbidden();
            }
            if (ideation.allowAnonymous && idea.status !== 'draft' && idea.sessionId !== sessToken) {
                return res.forbidden();
            }

            await db.transaction(async (t) => {
                const link = new URL(attachment.link);
                if (attachment.source === Attachment.SOURCES.upload) {
                    await cosUpload.delete(link.pathname);
                }
                await cosActivities.deleteActivity(
                    attachment,
                    idea,
                    { type: 'User', id: (ideation && ideation.allowAnonymous) ? null : userId, ip: req.ip },
                    req.method + ' ' + req.path,
                    t
                );
                await attachment.destroy({ transaction: t });
                t.afterCommit(() => res.ok());
            });
        } catch (err) {
            next(err);
        }
    });

    const readAttachment = async (req, res, next) => {
        try {
            const attachment = await Attachment.findByPk(req.params.attachmentId);
            if (!attachment) return res.notFound();
            if (attachment.source === Attachment.SOURCES.upload && req.query.download) {
                const fileUrl = new URL(attachment.link);
                let filename = attachment.name;
                if (!filename.includes('.') || path.extname(filename) !== `.${attachment.type}`) filename += '.' + attachment.type;
                const options = { hostname: fileUrl.hostname, path: fileUrl.pathname, port: fileUrl.port };
                if (app.get('env') === 'development' || app.get('env') === 'test') options.rejectUnauthorized = false;
                https.get(options, (externalRes) => {
                    res.setHeader('content-disposition', 'attachment; filename=' + encodeURIComponent(filename));
                    externalRes.pipe(res);
                }).on('error', (err) => next(err)).end();
            } else {
                return res.ok(attachment.toJSON());
            }
        } catch (err) {
            next(err);
        }
    };

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, { where: { visibility: Topic.VISIBILITY.public } });
            if (!topic) {
                if (!req.user?.userId && !req.user?.id) return res.notFound();
                const userId = req.user.userId || req.user.id;
                const hasPermission = await topicService._hasPermission(req.params.topicId, userId, TopicMemberUser.LEVELS.read, true);
                if (!hasPermission) return res.notFound();
            }
            return readAttachment(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, { where: { visibility: Topic.VISIBILITY.public } });
            if (!topic) {
                if (!req.user?.userId && !req.user?.id) return res.notFound();
                const userId = req.user.userId || req.user.id;
                const hasPermission = await topicService._hasPermission(req.params.topicId, userId, TopicMemberUser.LEVELS.read, true);
                if (!hasPermission) return res.notFound();
            }
            return readAttachment(req, res, next);
        } catch (err) {
            next(err);
        }
    });
};
