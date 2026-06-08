'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');
    const db = models.sequelize;

    const Ideation = models.Ideation;
    const Idea = models.Idea;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;

    const topicService = app.get('topicService');
    const ideationService = app.get('ideationService');

    /**
     * Create a folder
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null), async (req, res, next) => {
        try {
            const data = { name: req.body.name, description: req.body.description };
            const folder = await ideationService.createFolder(req.params.ideationId, req.params.topicId, data, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });
            return res.created(folder.toJSON());
        } catch (err) {
            next(err);
        }
    });

    /**
     * List folders (Internal helper)
     */
    const _readIdeationFolders = async (req, res, next) => {
        try {
            const filters = { limit: req.query.limit, offset: req.query.offset, ideaId: req.params.ideaId };
            const result = await ideationService.listFolders(req.params.ideationId, filters);
            return res.ok(result);
        } catch (err) {
            next(err);
        }
    }

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationFolders(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/folders', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId } }]
            });
            if (!topic || !topic.Ideations?.length || topic.visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeationFolders(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read a folder
     */
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const folder = await ideationService.getFolderById(req.params.folderId, req.params.ideationId, req.params.topicId);
            if (!folder) return res.notFound();

            const userId = req.user?.userId || req.user?.id;
            const ideas = await ideationService.listIdeas(req.params.ideationId, { folderId: req.params.folderId, limit: req.query.limit, offset: req.query.offset, enrich: false, keepSessionId: true, order: req.query.order || 'ASC' }, userId);
            const resFolder = folder.toJSON();
            resFolder.ideas = ideas;

            return res.ok(resFolder);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/folders/:folderId', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, { where: { visibility: Topic.VISIBILITY.public } });
            if (!topic) return res.notFound();
            
            const ideation = await ideationService.getById(req.params.ideationId);
            if (!ideation) return res.notFound();

            const folder = await ideationService.getFolderById(req.params.folderId, req.params.ideationId, req.params.topicId);
            if (!folder) return res.notFound();

            const ideas = await ideationService.listIdeas(req.params.ideationId, { folderId: req.params.folderId, limit: req.query.limit, offset: req.query.offset, enrich: false, keepSessionId: true, order: req.query.order || 'ASC' });
            const resFolder = folder.toJSON();
            resFolder.ideas = ideas;

            return res.ok(resFolder);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const userId = req.user?.userId || req.user?.id;
            const result = await ideationService.listIdeas(req.params.ideationId, { folderId: req.params.folderId, limit: req.query.limit, offset: req.query.offset, enrich: false, keepSessionId: true, order: req.query.order || 'ASC' }, userId);
            return res.ok(result);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, { where: { visibility: Topic.VISIBILITY.public } });
            if (!topic) return res.notFound();

            const result = await ideationService.listIdeas(req.params.ideationId, { folderId: req.params.folderId, limit: req.query.limit, offset: req.query.offset, enrich: false, keepSessionId: true, order: req.query.order || 'ASC' });
            return res.ok(result);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Add ideas to folder
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            let ideas = req.body;
            if (!Array.isArray(ideas)) ideas = [ideas];
            const ideaIds = ideas.map((idea) => idea.id || idea.ideaId);

            await ideationService.addIdeasToFolder(req.params.folderId, req.params.ideationId, req.params.topicId, ideaIds, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });

            return res.created();
        } catch (err) {
            next(err);
        }
    });

    /**
     * Delete Idea from folder
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas/:ideaId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            await ideationService.deleteIdeaFromFolder(req.params.ideaId, req.params.folderId, req.params.topicId, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });
            return res.ok();
        } catch (err) {
            next(err);
        }
    });

    /**
     * Update a folder
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null), async (req, res, next) => {
        try {
            const data = {};
            ['name', 'description'].forEach((field) => {
                if (req.body[field] !== undefined && req.body[field] !== null) {
                    data[field] = req.body[field];
                }
            });
            const folder = await ideationService.updateFolder(req.params.folderId, req.params.ideationId, req.params.topicId, data, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });
            return res.ok(folder);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Delete a folder
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            await ideationService.deleteFolder(req.params.folderId, req.params.ideationId, req.params.topicId, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });
            return res.ok();
        } catch (err) {
            next(err);
        }
    });

    /**
     * List folders an idea belongs to
     */
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationFolders(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId }, include: [{ model: Idea, where: { id: req.params.ideaId }, paranoid: false }] }]
            });
            if (!topic || !topic.Ideations?.length || !topic.Ideations[0].Ideas?.length || topic.visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeationFolders(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Add idea to multiple folders
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/folders', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            let folders = req.body;
            if (!Array.isArray(folders)) folders = [folders];
            const folderIds = folders.map((f) => f.id || f.folderId);
            const userId = req.user.userId || req.user.id;

            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId }, include: [{ model: Idea, where: { id: req.params.ideaId } }] }]
            });
            if (!topic || !topic.Ideations?.length || !topic.Ideations[0].Ideas?.length || topic.visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }

            await db.transaction(async (t) => {
                for (const folderId of folderIds) {
                    await ideationService.addIdeasToFolder(folderId, req.params.ideationId, req.params.topicId, [req.params.ideaId], userId, {
                        ip: req.ip,
                        path: req.method + ' ' + req.path
                    }, t);
                }
            });

            return res.created();
        } catch (err) {
            next(err);
        }
    });
};
