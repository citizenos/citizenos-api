'use strict';

const _updateTopicUserPreferences = async function (agent, userId, topicId, preferences, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/notificationsettings'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .put(path)
        .send(preferences)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const updateTopicUserPreferences = async function (agent, userId, topicId, preferences) {
    return _updateTopicUserPreferences(agent, userId, topicId, preferences, 200);
};

const _getTopicUserNotificationSettings = async (agent, userId, topicId, expectedHttpCode) => {
    const path = '/api/users/:userId/topics/:topicId/notificationsettings'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const getTopicUserNotificationSettings = async (agent, userId, topicId) => {
    return _getTopicUserNotificationSettings(agent, userId, topicId, 200);
};

const request = require('supertest');
const app = require('../../../app');
const notifications = app.get('notifications');
const userLib = require('../lib/user')(app);
const topicLib = require('../topic');
const memberLib = require('../lib/members')(app);
const assert = require('chai').assert;
const activityLib = require('../activity');

const models = app.get('models');
const Topic = models.Topic;
const db = models.sequelize;
const TopicMemberUser = models.TopicMemberUser;
const Vote = models.Vote;

suite('Internal', function () {

    suite('Notifications', function () {

        suite('Users', function () {
            suite('Settings', function() {
                const agent = request.agent(app);
                const agent2 = request.agent(app);

                let user;
                let user2;
                let topic;
                setup( async() => {
                    user = await userLib.createUserAndLogin(agent);
                    user2 = await userLib.createUserAndLogin(agent2);
                    topic = (await topicLib.topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                });

                test('Success', async () => {
                    const initialSettings = (await getTopicUserNotificationSettings(agent, user.id, topic.id)).body.data;
                    assert.deepEqual(initialSettings, {});
                    const settings = {
                        topicId: topic.id,
                        allowNotifications: true,
                        preferences: {
                            TopicEvent: true
                        }
                    };
                    const data = (await updateTopicUserPreferences(agent, user.id, topic.id, settings)).body.data;
                    assert.deepEqual(data.preferences, settings.preferences);
                    assert.equal(data.topicId, topic.id);
                    assert.equal(data.allowNotifications, true);
                    const setSettings = (await getTopicUserNotificationSettings(agent, user.id, topic.id)).body.data;
                    assert.deepEqual(setSettings, data);
                });

                test('Success - settings set to Topic activity', async () => {
                    const topicMemberUser = {
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    };
                    await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);

                    const settings = {
                        topicId: topic.id,
                        allowNotifications: true,
                        preferences: {
                            Topic: true
                        }
                    };
                    const data = (await updateTopicUserPreferences(agent2, user2.id, topic.id, settings)).body.data;
                    assert.deepEqual(data.preferences, settings.preferences);

                    const activities = (await activityLib.activitiesRead(agent, user.id)).body.data;
                    const users = await notifications.getRelatedUsers(activities[0]);
                    assert.equal(users.length, 1);
                    assert.equal(users[0].id, user2.id);

                    await topicLib.topicCommentCreate(agent, user.id, topic.id, null, null, 'pro', 'test', 'test content');
                    const activities2 = (await activityLib.activitiesRead(agent, user.id)).body.data;
                    const users2 = await notifications.getRelatedUsers(activities2[0]);
                    assert.equal(users2.length, 0);
                });

                test('Success - settings set to TopicComment activity', async () => {
                    const topicMemberUser = {
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    };
                    await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);

                    const settings = {
                        topicId: topic.id,
                        allowNotifications: true,
                        preferences: {
                            TopicComment: true
                        }
                    };
                    const data = (await updateTopicUserPreferences(agent2, user2.id, topic.id, settings)).body.data;
                    assert.deepEqual(data.preferences, settings.preferences);

                    const activities = (await activityLib.activitiesRead(agent, user.id)).body.data;
                    const users = await notifications.getRelatedUsers(activities[0]);
                    assert.equal(users.length, 0);
                    await topicLib.topicCommentCreate(agent, user.id, topic.id, null, null, 'pro', 'test', 'test content');
                    const activities2 = (await activityLib.activitiesRead(agent, user.id)).body.data;
                    const users2 = await notifications.getRelatedUsers(activities2[0]);
                    assert.equal(users2.length, 1);
                    assert.equal(users2[0].id, user2.id);
                });

                test('Success - settings set to TopicVoteList activity', async () => {
                    const topicMemberUser = {
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    };
                    await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);

                    const settings = {
                        topicId: topic.id,
                        allowNotifications: true,
                        preferences: {
                            TopicVoteList: true
                        }
                    };
                    const data = (await updateTopicUserPreferences(agent2, user2.id, topic.id, settings)).body.data;
                    assert.deepEqual(data.preferences, settings.preferences);
                    const activities = (await activityLib.activitiesRead(agent, user.id)).body.data;
                    const users = await notifications.getRelatedUsers(activities[0]);
                    assert.equal(users.length, 0);
                    await topicLib.topicCommentCreate(agent, user.id, topic.id, null, null, 'pro', 'test', 'test content');
                    const activities2 = (await activityLib.activitiesRead(agent, user.id)).body.data;
                    const users2 = await notifications.getRelatedUsers(activities2[0]);
                    assert.equal(users2.length, 0);

                    const options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 2'
                        },
                        {
                            value: 'Option 3'
                        }
                    ];

                    const voteCreated = (await topicLib.topicVoteCreate(agent, user.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft)).body.data;

                    const voteList = [
                        {
                            optionId: voteCreated.options.rows[0].id
                        }
                    ];
                    await topicLib.topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList, null, null, null, null);

                    const act = await db.query(`SELECT * FROM "Activities" WHERE "actorId"=:userId AND data#>>'{object, 0, "@type"}' = 'VoteList' AND data#>>'{target, id}' = :topicId`, {replacements: {
                        userId: user.id,
                        topicId: topic.id
                    }});
                    const users3 = await notifications.getRelatedUsers(act[0][0]);
                    assert.equal(users3.length, 1);
                    assert.equal(users3[0].id, user2.id);
                });

            });
        });
        suite('Topics', function () {
            const agent = request.agent(app);

            let user;
            let topic;
            suiteSetup( async() => {
                user = await userLib.createUserAndLogin(agent);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, null, null)).body.data;
            });

            test('Success', async () => {
                assert.property(topic, 'id');
                assert.equal(topic.creator.id, user.id);
                assert.equal(topic.visibility, Topic.VISIBILITY.private);
                assert.equal(topic.status, Topic.STATUSES.inProgress);
                assert.property(topic, 'padUrl');
                const activities = (await activityLib.activitiesRead(agent, user.id)).body.data;
                const text = notifications.buildActivityString(activities[0]);
                assert.equal('NOTIFICATIONS.NOTIFICATION_USER_CREATE_TOPIC', text);
            });
        });

    });

});
