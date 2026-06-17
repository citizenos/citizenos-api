'use strict';

const { createHash } = require('crypto');

module.exports = function (app) {
    const config = app.get('config');
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');

    const Ideation = models.Ideation;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;

    const topicService = app.get('topicService');
    const ideationService = app.get('ideationService');

    /**
     * Create an Idea
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
            const data = {
                statement: req.body.statement,
                description: req.body.description,
                imageUrl: req.body.imageUrl,
                demographics: req.body.demographics,
                status: req.body.status || 'draft'
            };

            const idea = await ideationService.createIdea(req.params.ideationId, req.params.topicId, data, req.user.userId || req.user.id, sessToken, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });

            return res.created(idea);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read Ideas (Internal helper)
     */
    const _readIdeationIdeas = async (req, res, next) => {
        const userId = req.user?.userId || req.user?.id;
        const filters = {
            search: req.query.search,
            limit: req.query.limit,
            offset: req.query.offset,
            orderBy: req.query.orderBy,
            order: req.query.order,
            authorId: req.query.authorId,
            favourite: req.query.favourite,
            folderId: req.query.folderId,
            showModerated: req.query.showModerated,
            demographicsFilter: req.query.demographics ? JSON.parse(req.query.demographics) : null,
            status: req.query.status,
            enrich: !req.params.userId // If user is NOT provided in URL, it's the main public list
        };
        
        if (req.path.endsWith('/ideas') && !req.query.folderId) filters.enrich = true;

        try {
            const result = await ideationService.listIdeas(req.params.ideationId, filters, userId);
            return res.ok(result);
        } catch (err) {
            next(err);
        }
    }

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationIdeas(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId } }]
            });
            if (!topic || !topic.Ideations?.length || topic.visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeationIdeas(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read an Idea (Internal helper)
     */
    const _readIdeationIdea = async (req, res, next) => {
        try {
            const userId = req.user?.userId || req.user?.id;
            const idea = await ideationService.getIdeaById(req.params.ideaId, req.params.ideationId, userId, req.query.folderId, null, true);
            if (!idea) return res.notFound();
            return res.ok(idea);
        } catch (err) {
            next(err);
        }
    }

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationIdea(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId } }]
            });
            if (!topic || !topic.Ideations?.length || topic.visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeationIdea(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Update an Idea
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
            const fieldsAllowed = ['statement', 'description', 'imageUrl', 'status', 'demographics'];
            const data = {};
            fieldsAllowed.forEach((field) => {
                if (req.body[field] !== undefined && req.body[field] !== null) {
                    data[field] = req.body[field];
                }
            });

            const idea = await ideationService.updateIdea(req.params.ideaId, req.params.ideationId, req.params.topicId, data, req.user.userId || req.user.id, sessToken, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });

            return res.ok(idea);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Delete an Idea
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read), async (req, res, next) => {
        try {
            const sessToken = createHash('sha256').update(req.cookies[config.session.name]).digest('base64');
            await ideationService.deleteIdea(req.params.ideaId, req.params.ideationId, req.params.topicId, req.user.userId || req.user.id, sessToken, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });
            return res.ok();
        } catch (err) {
            next(err);
        }
    });

    /**
     * Idea Favourites
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/favourite', loginCheck(['partner']), async (req, res, next) => {
        try {
            await ideationService.favouriteIdea(req.params.ideaId, req.user.userId || req.user.id);
            return res.ok();
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/favourite', loginCheck(['partner']), async (req, res, next) => {
        try {
            await ideationService.unfavouriteIdea(req.params.ideaId, req.user.userId || req.user.id);
            return res.ok();
        } catch (err) {
            next(err);
        }
    });
};
