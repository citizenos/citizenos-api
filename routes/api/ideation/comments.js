'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');

    const Idea = models.Idea;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;
    const IdeaComment = models.IdeaComment;

    const topicService = app.get('topicService');
    const commentsService = app.get('commentsService');

    const commentsLib = commentsService({
        parentModel: Idea,
        parentIdParam: 'ideaId',
        joinModel: IdeaComment,
        joinParentIdField: 'ideaId',
        contextName: 'Idea',
        listByTopic: false
    });

    /**
     * Idea Comments
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.createComment);
    
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), async (req, res, next) => {
        return commentsLib.listComments(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, { where: { visibility: Topic.VISIBILITY.public } });
            if (!topic) return res.forbidden();
            return commentsLib.listComments(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, false, null, true), commentsLib.deleteComment);
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), commentsLib.updateComment);

    /**
     * Idea Comment Votes
     */
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', commentsLib.listVotes);
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', commentsLib.listVotes);

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', loginCheck(['partner']), commentsLib.createVote);
    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes', commentsLib.createVote);

    /**
     * Idea Comment Attachments
     */
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), commentsLib.uploadCommentAttachment);
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/image/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), commentsLib.uploadCommentImage);
    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), commentsLib.createCommentAttachment);
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), commentsLib.updateCommentAttachment);
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.ideation]), commentsLib.deleteCommentAttachment);

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments', commentsLib.commentAttachmentsList);
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments', commentsLib.commentAttachmentsList);

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments/:attachmentId', commentsLib.readAttachment);
    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/attachments/:attachmentId', commentsLib.readAttachment);
};
