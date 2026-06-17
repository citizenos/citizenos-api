'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const topicService = app.get('topicService');
    const groupLib = require('./group')(app);
    const activityService = app.get('activityService');
    const models = app.get('models');
    const TopicMemberUser = models.TopicMemberUser;
    const GroupMemberUser = models.GroupMemberUser;

    app.get('/api/topics/:topicId/activities', async function (req, res, next) {
        return activityService.topicActivitiesList(req, res, next, 'public');
    });

    app.get('/api/test/users/:userId/activities', function (req, res, next) {
        return res.forbidden();
    });

    app.get('/api/test/old/users/:userId/activities', function (req, res, next) {
        return res.forbidden();
    });

    app.get('/api/users/:userId/topics/:topicId/activities', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        return activityService.topicActivitiesList(req, res, next, null);
    });

    app.get('/api/topics/:topicId/activities/unread', async (req, res, next) => {
        return activityService.topicUnreadActivitiesCount(req, res, next, 'public');
    });

    app.get('/api/users/:userId/topics/:topicId/activities/unread', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        return activityService.topicUnreadActivitiesCount(req, res, next, null);
    });

    app.get('/api/users/:userId/activities/unread', loginCheck(['partner']), async function (req, res, next) {
        return activityService.userUnreadActivitiesCount(req, res, next);
    });

    app.get('/api/users/:userId/activities', loginCheck(['partner']), function (req, res, next) {
        return activityService.activitiesList(req, res, next, null);
    });

    app.get('/api/activities', function (req, res, next) {
        return activityService.activitiesList(req, res, next, 'public');
    });

    app.get('/api/groups/:groupId/activities', function (req, res, next) {
        return activityService.groupActivitiesList(req, res, next, 'public');
    });

    app.get('/api/users/:userId/groups/:groupId/activities', loginCheck(['partner']), groupLib.hasPermission(GroupMemberUser.LEVELS.read, true), function (req, res, next) {
        return activityService.groupActivitiesList(req, res, next, null);
    });

    app.get('/api/groups/:groupId/activities/unread', async (req, res, next) => {
        return activityService.groupUnreadActivitiesCount(req, res, next, 'public');
    });

    app.get('/api/users/:userId/groups/:groupId/activities/unread', loginCheck(['partner']), groupLib.hasPermission(GroupMemberUser.LEVELS.read, true), async (req, res, next) => {
        return activityService.groupUnreadActivitiesCount(req, res, next, null);
    });

};
