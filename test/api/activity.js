'use strict';

const _activitiesRead = async function (agent, userId, filters, expectedHttpCode) {
    const path = '/api/users/:userId/activities'.replace(':userId', userId);

    return agent
        .get(path)
        .query(filters)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const activitiesRead = async function (agent, userId, filters) {
    return _activitiesRead(agent, userId, filters, 200);
};

const _activitiesUnreadCountRead = async function (agent, userId, expectedHttpCode) {
    const path = '/api/users/:userId/activities/unread'.replace(':userId', userId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const activitiesUnreadCountRead = async function (agent, userId) {
    return _activitiesUnreadCountRead(agent, userId, 200);
};

const _activitiesReadUnauth = async function (agent, filters, expectedHttpCode) {
    const path = '/api/activities';

    return agent
        .get(path)
        .query(filters)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const activitiesReadUnauth = async function (agent, filters) {
    return _activitiesReadUnauth(agent, filters, 200);
};

const chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
const assert = chai.assert;
const request = require('supertest');
const app = require('../../app');
const models = app.get('models');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const memberLib = require('./lib/members')(app);
const topicLib = require('./topic');

const Partner = models.Partner;
const Topic = models.Topic;
const TopicMemberUser = models.TopicMemberUser;

module.exports.activitiesRead = activitiesRead;

// API - /api/users*
suite('Users', function () {

    suiteSetup(async function () {
        await shared.syncDb();
    });

    // API - /api/users/:userId/activities*
    suite('Activities', function () {

        suite('Read', function () {
            const agent = request.agent(app);

            let user;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                await topicLib.topicCreate(agent, user.id, null, null, null, null, null);
            });

            test('Success', async function () {
                const activities = (await activitiesRead(agent, user.id, null)).body.data;
                assert.equal(activities.length, 3);
                activities.forEach((activity) => {
                    assert.notProperty(activity.data.actor, 'email');
                    assert.notProperty(activity.data.actor, 'imageUrl');
                    assert.notProperty(activity.data.actor, 'language');
                });
            });

            test('Success - filter', async function () {
                const activities = (await activitiesRead(agent, user.id, {filter: 'Topic'})).body.data;

                assert.equal(activities.length, 1);
                activities.forEach((activity) => {
                    assert.notProperty(activity.data.actor, 'email');
                    assert.notProperty(activity.data.actor, 'imageUrl');
                    assert.notProperty(activity.data.actor, 'language');
                });
            });
        });

    });
});

//API: Activities
suite('Activities', function () {
    suiteSetup(async function () {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        await shared.syncDb();
    });

    suite('Read', function () {
        const agent = request.agent(app);
        const agent2 = request.agent(app);

        let topic;
        let user;
        let user2;
        let partner;

        suiteSetup(async function () {
            user = await userLib.createUserAndLogin(agent, null, null, null);
            await topicLib.topicCreate(agent, user.id, 'public', null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null);
            topic = (await topicLib.topicCreate(agent, user.id, 'public', null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null)).body.data;
            user2 = await userLib.createUser(agent2, null, null, null);
            partner = await Partner.create({
                website: 'notimportant',
                redirectUriRegexp: 'notimportant'
            });

            await Topic.update(
                {
                    sourcePartnerId: partner.id
                },
                {
                    where: {
                        id: topic.id
                    }
                }
            );
            await memberLib.topicMemberUsersCreate(
                topic.id,
                [
                    {
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.read
                    }
                ]
            );
        });

        test('Success', async function () {
            const activities = (await activitiesReadUnauth(agent2, {sourcePartnerId: partner.id})).body.data;
            assert.equal(activities.length, 1);
            activities.forEach((activity) => {
                assert.notProperty(activity.data.actor, 'email');
                assert.notProperty(activity.data.actor, 'imageUrl');
                assert.notProperty(activity.data.actor, 'language');

                if (activity.data.object['@type'] === 'User') {
                    assert.notProperty(activity.data.object, 'email');
                    assert.notProperty(activity.data.object, 'imageUrl');
                    assert.notProperty(activity.data.object, 'language');
                } else {
                    assert.equal(activity.data.object.id, topic.id);
                    assert.equal(activity.data.object.sourcePartnerId, partner.id);
                }
            });
        });

        test('Success - filter', async function () {
            const activities = (await activitiesReadUnauth(agent2, {sourcePartnerId: partner.id, filter: ['User']})).body.data;
            assert.equal(activities.length, 0);
            activities.forEach((activity) => {
                assert.notProperty(activity.data.actor, 'email');
                assert.notProperty(activity.data.actor, 'imageUrl');
                assert.notProperty(activity.data.actor, 'language');

                if (activity.data.object['@type'] === 'User') {
                    assert.notProperty(activity.data.object, 'email');
                    assert.notProperty(activity.data.object, 'imageUrl');
                    assert.notProperty(activity.data.object, 'language');
                } else {
                    assert.equal(activity.data.object.id, topic.id);
                    assert.equal(activity.data.object.sourcePartnerId, partner.id);
                }
            });
        });

        test('Success - filter with invalid value', async function () {
            const activities = (await activitiesReadUnauth(agent2, {sourcePartnerId: partner.id, filter: ['Hello', 'Hack']})).body.data;
            assert.equal(activities.length, 1);
            activities.forEach((activity) => {
                assert.notProperty(activity.data.actor, 'email');
                assert.notProperty(activity.data.actor, 'imageUrl');
                assert.notProperty(activity.data.actor, 'language');

                if (activity.data.object['@type'] === 'User') {
                    assert.notProperty(activity.data.object, 'email');
                    assert.notProperty(activity.data.object, 'imageUrl');
                    assert.notProperty(activity.data.object, 'language');
                } else {
                    assert.equal(activity.data.object.id, topic.id);
                    assert.equal(activity.data.object.sourcePartnerId, partner.id);
                }
            });
        });

        test('Success - without partnerId', async function () {
            const activities = (await activitiesReadUnauth(agent2, null)).body.data;
            activities.forEach((activity) => {
                assert.notProperty(activity.data.actor, 'email');
                assert.notProperty(activity.data.actor, 'imageUrl');
                assert.notProperty(activity.data.actor, 'language');

                if (activity.data.object['@type'] === 'User') {
                    assert.notProperty(activity.data.object, 'email');
                    assert.notProperty(activity.data.object, 'imageUrl');
                    assert.notProperty(activity.data.object, 'language');
                }
            });

            assert.isTrue(activities.length > 0);

        });
    });

    suite('Count', function () {
        const agent = request.agent(app);
        const agent2 = request.agent(app);

        let topic;
        let user;
        let user2;
        let partner;

        suiteSetup(async function () {
            user = await userLib.createUserAndLogin(agent, null, null, null)
            await topicLib.topicCreate(agent, user.id, 'public', null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null);
            topic = (await topicLib.topicCreate(agent, user.id, 'public', null, null, '<html><head></head><body><h2>TEST2</h2></body></html>', null)).body.data;
            user2 = await (userLib.createUser(agent2, null, null, null));
            partner = await Partner
                .create({
                    website: 'notimportant',
                    redirectUriRegexp: 'notimportant'
                });

            await Topic.update(
                {
                    sourcePartnerId: partner.id
                },
                {
                    where: {
                        id: topic.id
                    }
                }
            );

            await memberLib.topicMemberUsersCreate(topic.id,[{userId: user2.id,level: TopicMemberUser.LEVELS.read}]);
        });

        test('Success - count 0 - user has never viewed activity feed', async function () {
            const count = (await activitiesUnreadCountRead (agent, {sourcePartnerId: partner.id})).body.data.count;
            assert.equal(count, 0);
        });

        test('Success', async function () {
            const activities = (await activitiesRead(agent, user.id, null)).body.data
            assert.isTrue(activities.length > 0);
            await topicLib.topicCreate(agent, user.id, 'public', null, null, '<html><head></head><body><h2>TEST3</h2></body></html>', null);

            const count = (await activitiesUnreadCountRead(agent, {sourcePartnerId: partner.id})).body.data.count;
            assert.equal(count, 1);
        });

        test('Success - user has viewed all activities', async function () {
            const activities = (await activitiesRead(agent, user.id, null)).body.data;
            assert.isTrue(activities.length > 0);
            activities.forEach(function (activity) {
                assert.notProperty(activity.data.actor, 'email');
                assert.notProperty(activity.data.actor, 'imageUrl');
                assert.notProperty(activity.data.actor, 'language');
            });

            const count = (await activitiesUnreadCountRead(agent, {sourcePartnerId: partner.id})).body.data.count;
            assert.equal(count, 0);
        });

        test('Fail - user not logged in', async function () {
            const message = (await _activitiesRead(agent2, user.id, null, 401)).body
            const expectedResult = {
                status: {
                    code: 40100,
                    message: 'Unauthorized'
                }
            };
            assert.deepEqual(message, expectedResult);
        });
    });
});
