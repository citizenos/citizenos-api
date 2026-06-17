'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');

    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;

    const topicService = app.get('topicService');
    const ideationService = app.get('ideationService');

    /**
     * Idea Votes
     */
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const results = await ideationService.listIdeaVotes(req.params.ideaId);
            return res.ok({ rows: results, count: results.length });
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, { where: { visibility: Topic.VISIBILITY.public } });
            if (!topic) return res.notFound();
            
            const results = await ideationService.listIdeaVotes(req.params.ideaId);
            return res.ok({ rows: results, count: results.length });
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const results = await ideationService.createIdeaVote(req.params.ideationId, req.params.ideaId, req.params.topicId, parseInt(req.body.value, 10), req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });
            return res.ok(results);
        } catch (err) {
            next(err);
        }
    });
};
