'use strict';

/**
 * Discussion API-s
 */

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;

    const loginCheck = app.get('middleware.loginCheck');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');

    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;
    const Discussion = models.Discussion;

    const topicService = app.get('topicService');
    const discussionService = app.get('discussionService');

    const commentsService = app.get('commentsService');
    const commentsLib = commentsService({
        parentModel: Discussion,
        parentIdParam: 'discussionId',
        joinModel: models.DiscussionComment,
        joinParentIdField: 'discussionId',
        contextName: 'Discussion',
        listByTopic: true
    });

    const isCommentCreator = commentsLib.isCommentCreator();

    /**
     * Create a Discussion
     */
    app.post('/api/users/:userId/topics/:topicId/discussions', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress]), async (req, res, next) => {
        const { question, deadline } = req.body;
        const topicId = req.params.topicId;

        if (!question) return res.badRequest('Discussion question is missing', 1);

        const actor = { type: 'User', id: req.user.id, ip: req.ip, context: req.method + ' ' + req.path };

        try {
            await db.transaction(async (t) => {
                const discussion = await discussionService.create(
                    { question, deadline, creatorId: req.user.id },
                    topicId,
                    actor,
                    t
                );
                t.afterCommit(() => {
                    const result = discussion.toJSON();
                    result.topicId = topicId;
                    return res.created(result);
                });
            });
        } catch (err) {
            if (err.statusCode === 403) return res.forbidden();
            next(err);
        }
    });

    /**
     * Read a discussion — shared handler for authenticated and public routes
     */
    const _readDiscussion = async (req, res, next) => {
        try {
            const discussion = await discussionService.getById(req.params.discussionId);
            if (!discussion) return res.notFound();
            return res.ok(discussion);
        } catch (err) {
            next(err);
        }
    };

    /**
     * Read discussion participants — shared handler
     */
    const _readDiscussionParticipants = async (req, res, next) => {
        try {
            const result = await discussionService.getParticipants(req.params.discussionId);
            return res.ok(result);
        } catch (err) {
            next(err);
        }
    };

    const _checkDiscussionVisible = async (req, res, next) => {
        try {
            const discussion = await Discussion.findOne({
                where: { id: req.params.discussionId },
                include: [{
                    model: Topic,
                    where: { id: req.params.topicId },
                    attributes: ['visibility']
                }]
            });
            if (!discussion || discussion.Topics[0].visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return next();
        } catch (err) {
            next(err);
        }
    };

    app.get('/api/topics/:topicId/discussions/:discussionId', _checkDiscussionVisible, _readDiscussion);
    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), _readDiscussion);

    app.get('/api/topics/:topicId/discussions/:discussionId/participants', _checkDiscussionVisible, _readDiscussionParticipants);
    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/participants', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), _readDiscussionParticipants);

    /**
     * Update a Discussion
     */
    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.inProgress]), async (req, res, next) => {
        const { topicId, discussionId } = req.params;
        const actor = { type: 'User', id: req.user.id, ip: req.ip, context: req.method + ' ' + req.path };

        try {
            const topic = await Topic.findOne({
                where: { id: topicId },
                include: [{ model: Discussion, where: { id: discussionId } }]
            });
            if (!topic?.Discussions?.length) return res.notFound();

            await db.transaction(async (t) => {
                await discussionService.update(topic.Discussions[0], topic, ['deadline', 'question'], req.body, actor, t);
                t.afterCommit(async () => {
                    const updated = await discussionService.getById(discussionId);
                    return res.ok(updated);
                });
            });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Delete a Discussion
     */
    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        const actor = { type: 'User', id: req.user.id, ip: req.ip, context: req.method + ' ' + req.path };

        try {
            const discussion = await Discussion.findOne({
                where: { id: req.params.discussionId },
                include: [{ model: Topic, where: { id: req.params.topicId } }]
            });
            if (!discussion) return res.notFound();

            await db.transaction(async (t) => {
                await discussionService.remove(discussion, actor, t);
                t.afterCommit(() => res.ok());
            });
        } catch (err) {
            next(err);
        }
    });

    // ─── Comment routes (delegated entirely to commentsLib) ──────────────────────

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.createComment);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), commentsLib.listComments);
    app.get('/api/topics/:topicId/discussions/:discussionId/comments', topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), commentsLib.listComments);

    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, false, null, true), commentsLib.deleteComment);

    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), commentsLib.updateComment);

    app.post(['/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/reports', '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports'], loginCheck(['partner']), commentsLib.createReport);

    app.get(['/api/topics/:topicId/comments/:commentId/reports/:reportId', '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId'], authTokenRestrictedUse, commentsLib.readReport);

    app.post('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, commentsLib.moderateReport);

    app.post('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.createVote);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.listVotes);

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/upload', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.admin, false, null, true), commentsLib.uploadCommentAttachment);

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/image/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.uploadCommentImage);

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.createCommentAttachment);

    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.updateCommentAttachment);

    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.deleteCommentAttachment);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.commentAttachmentsList);

    app.get('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments', topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.commentAttachmentsList);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.readAttachment);

    app.get('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.readAttachment);

    return { isCommentCreator };
};
