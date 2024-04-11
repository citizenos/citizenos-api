'use strict';

const _ideationCreate = async function (agent, userId, topicId, question, deadline, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            question: question,
            deadline: deadline
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationCreate = async function (agent, userId, topicId, question, deadline) {
    return _ideationCreate(agent, userId, topicId, question, deadline, 201);
};

const _ideationRead = async function (agent, userId, topicId, ideationId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationRead = async function (agent, userId, topicId, ideationId) {
    return _ideationRead(agent, userId, topicId, ideationId, 200);
};

const _ideationReadUnauth = async function (agent, topicId, ideationId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationReadUnauth = async function (agent, topicId, ideationId) {
    return _ideationReadUnauth(agent, topicId, ideationId, 200);
};

const _ideationUpdate = async function (agent, userId, topicId, ideationId, question, deadline, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    let body = {
        deadline,
        question
    };
    if (deadline === undefined) delete body.deadline;
    if (question === undefined) delete body.question;
    return agent
        .put(path)
        .send(body)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationUpdate = async function (agent, userId, topicId, ideationId, question, deadline) {
    return _ideationUpdate(agent, userId, topicId, ideationId, question, deadline, 200);
};

const _ideationDelete = async function (agent, userId, topicId, ideationId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);
    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationDelete = async function (agent, userId, topicId, ideationId) {
    return _ideationDelete(agent, userId, topicId, ideationId, 200);
};

const _ideationIdeaCreate = async function (agent, userId, topicId, ideationId, statement, description, imageUrl, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            statement,
            description,
            imageUrl
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaCreate = async function (agent, userId, topicId, ideationId, statement, description, imageUrl) {
    return _ideationIdeaCreate(agent, userId, topicId, ideationId, statement, description, imageUrl, 201)
};

const _ideationIdeaRead = async function (agent, userId, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaRead = async function (agent, userId, topicId, ideationId, ideaId) {
    return _ideationIdeaRead(agent, userId, topicId, ideationId, ideaId, 200)
};

const _ideationIdeaReadUnauth = async function (agent, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaReadUnauth = async function (agent, topicId, ideationId, ideaId) {
    return _ideationIdeaReadUnauth(agent, topicId, ideationId, ideaId, 200)
};

const _ideationIdeaUpdate = async function (agent, userId, topicId, ideationId, ideaId, statement, description, imageUrl, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    const body = {};
    if (statement) {
        body.statement = statement;
    }
    if (description) {
        body.description = description;
    }
    if (imageUrl) {
        body.imageUrl = imageUrl;
    }
    return agent
        .put(path)
        .send(body)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaUpdate = async function (agent, userId, topicId, ideationId, ideaId, statement, description, imageUrl) {
    return _ideationIdeaUpdate(agent, userId, topicId, ideationId, ideaId, statement, description, imageUrl, 200);
};


const _ideationIdeaDelete = async function (agent, userId, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaDelete = async function (agent, userId, topicId, ideationId, ideaId) {
    return _ideationIdeaDelete(agent, userId, topicId, ideationId, ideaId, 200);
};

const _ideationIdeaList = async function (agent, userId, topicId, ideationId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaList = async function (agent, userId, topicId, ideationId) {
    return _ideationIdeaList(agent, userId, topicId, ideationId, 200);
};

const _ideationIdeaListUnauth = async function (agent, topicId, ideationId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaListUnauth = async function (agent, topicId, ideationId) {
    return _ideationIdeaListUnauth(agent, topicId, ideationId, 200);
};

module.exports.ideationCreate = ideationCreate;

const chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
chai.use(require('chai-uuid'));
const assert = chai.assert;
const request = require('supertest');
const app = require('../../app');

const models = app.get('models');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const topicLib = require('./topic');
const memberLib = require('./lib/members')(app);

const Topic = models.Topic;
const TopicMemberUser = models.TopicMemberUser;

// API - /api/users*
suite('Users', function () {

    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    // API - /api/users/:userId/topics*
    suite('Ideation', function () {

        suite('Create', function () {
            const agent = request.agent(app);
            const email = 'test_topicc_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            let user;
            let topic;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, 'TEST IDEATION')).body.data;
            });

            test('Success', async function () {
                const question = 'Test ideation?';
                const ideation = (await ideationCreate(agent, user.id, topic.id, question)).body.data;
                assert.property(ideation, 'id');
                assert.equal(ideation.creatorId, user.id);
                assert.equal(ideation.question, question);
            });

            test('Success - deadline', async function () {
                const question = 'Test ideation?';
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const ideation = (await ideationCreate(agent, user.id, topic.id, question, deadline)).body.data;
                assert.property(ideation, 'id');
                assert.equal(ideation.creatorId, user.id);
                assert.equal(ideation.question, question);
                assert.equal(new Date(ideation.deadline).getTime(), deadline.getTime());
            });

            test('Fail - Bad Request - deadline wrong format', async function () {
                const question = 'Test ideation?';
                const errors = (await _ideationCreate(agent, user.id, topic.id, question, 'TEST', 400)).body.errors;

                assert.equal(errors.deadline, 'Ideation deadline must be in the future.');
            });


            test('Fail - Bad Request - deadline is in the past', async function () {
                const question = 'Test ideation?';
                const deadlineInPast = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                const errors = (await _ideationCreate(agent, user.id, topic.id, question, deadlineInPast, 400)).body.errors;

                assert.equal(errors.deadline, 'Ideation deadline must be in the future.');
            });
        });

        suite('Read', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let ideation;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
            });


            test('Success', async function () {
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedIdeation = Object.assign({},ideation);
                expectedIdeation.ideas = { count: 0 };
                assert.deepEqual(ideationR, expectedIdeation);
            });

            test('Success - public', async function () {
                await await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation, Topic.VISIBILITY.public);
                const ideationR = (await ideationReadUnauth(request.agent(app), topic.id, ideation.id)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedIdeation = Object.assign({},ideation);
                expectedIdeation.ideas = { count: 0 };
                assert.deepEqual(ideationR, expectedIdeation);
            });

            test('Fail - Unauthorized', async function () {
                await _ideationRead(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Update', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let ideation;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
            });

            setup(async function () {
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
            });


            test('Success - question - draft topic', async function () {
                const updatedQuestion = 'Updated ideation';
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, updatedQuestion)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                ideationR.question = updatedQuestion;
                assert.notEqual(ideationUpdated.updatedAt, ideationR.updatedAt)
                ideationR.updatedAt = ideationUpdated.updatedAt;
                assert.deepEqual(ideationUpdated, ideationR);
            });

            test('Success - deadline - draft topic', async function () {
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, undefined, deadline)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                ideationR.deadline = deadline;
                assert.equal(new Date(ideationUpdated.deadline).getTime(), deadline.getTime());
                assert.equal(ideationUpdated.question, ideationR.question);
                assert.notEqual(ideationUpdated.updatedAt, ideationR.updatedAt);

            });

            test('Success - question not updated when topic status ideation', async function () {
                const updatedQuestion = 'Updated ideation';
                await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, updatedQuestion)).body.data;
                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                assert.deepEqual(ideationUpdated, ideationR);
            });

            test('Fail - deadline in the past', async function () {
                const deadline = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                const errors = (await _ideationUpdate(agent, user.id, topic.id, ideation.id, undefined, deadline, 400)).body.errors;

                assert.equal(errors.deadline, 'Ideation deadline must be in the future.');
            });

            test('Fail - Unauthorized', async function () {
                await _ideationRead(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Delete', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let ideation;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
            });


            test('Success', async function () {
                const ideationDeleted = (await ideationDelete(agent, user.id, topic.id, ideation.id)).body;
                const resExpected = { status: { code: 20000 } };
                assert.deepEqual(ideationDeleted, resExpected)

                const ideationR = (await _ideationRead(agent, user.id, topic.id, ideation.id, 404)).body;
                const resReadExpected = {
                    status:
                    {
                        code: 40400,
                        message: 'Not Found'
                    }
                };
                assert.deepEqual(ideationR, resReadExpected)
            });

            test('Fail - Unauthorized', async function () {
                await _ideationDelete(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Idea', function () {
            suite('Create', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;

                    assert.equal(idea.statement, statement);
                    assert.equal(idea.description, description);
                    assert.equal(idea.authorId, user.id);
                    assert.exists(idea, 'id');
                    assert.exists(idea, 'createdAt');
                    assert.exists(idea, 'updatedAt');
                    assert.exists(idea, 'deletedAt');
                });

                test('Fail - missing statement', async function () {
                    const description = 'This idea is just for testing';
                    const ideaRes = (await _ideationIdeaCreate(agent, user.id, topic.id, ideation.id, null, description, null, 400)).body;
                    const expectedRes = {
                        status: { code: 40000 },
                        errors: { statement: 'Idea.statement cannot be null' }
                    };

                    assert.deepEqual(ideaRes, expectedRes);
                });

                test('Fail - missing description', async function () {
                    const statement = 'This idea is just for testing';
                    const ideaRes = (await _ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, null, null, 400)).body;
                    const expectedRes = {
                        status: { code: 40000 },
                        errors: { description: 'Idea.description cannot be null' }
                    };

                    assert.deepEqual(ideaRes, expectedRes);
                });

                test('Fail - topic status not ideation', async function () {
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                    await _ideationIdeaCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST idea', 'description', null, 401);
                });

                test('Fail - Unauthorized', async function () {
                    await _ideationIdeaCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST idea', 'description', null, 401);
                });
            });

            suite('Read', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;
                    assert.deepEqual(idea, ideaR);
                });

                test('Success - public topic unauth', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;

                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);

                    const ideaRUnauth = (await ideationIdeaReadUnauth(request.agent(app), topic.id, ideation.id, idea.id)).body.data;
                    assert.deepEqual(ideaR, ideaRUnauth);
                });

                test('Success - member topic', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;
                    assert.deepEqual(idea, ideaR);
                });

                test('Fail - Unauthorized', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    await _ideationIdeaRead(request.agent(app), user.id, topic.id, ideation.id, idea.id, 401);
                });
            });

            suite('Update', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';

                    const updatedStatement = 'Test idea Update';
                    const updatedDescription = 'Updated description';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;

                    assert.equal(idea.statement, statement);
                    assert.equal(idea.description, description);
                    assert.equal(idea.authorId, user.id);
                    assert.exists(idea, 'id');
                    assert.exists(idea, 'createdAt');
                    assert.exists(idea, 'updatedAt');
                    assert.exists(idea, 'deletedAt');
                    const ideaUpdate = (await ideationIdeaUpdate(agent, user.id, topic.id, ideation.id, idea.id, updatedStatement, updatedDescription)).body.data;

                    assert.equal(ideaUpdate.statement, updatedStatement);
                    assert.equal(ideaUpdate.description, updatedDescription);
                    assert.equal(ideaUpdate.authorId, idea.authorId);
                    assert.equal(ideaUpdate.id, idea.id);
                    assert.exists(ideaUpdate.createdAt, idea.createdAt);
                    assert.notEqual(ideaUpdate.updatedAt, idea.updatedAt);
                    assert.equal(ideaUpdate.deletedAt, idea.deletedAt);
                });

                test('Fail - topic status not ideation', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                    await _ideationIdeaUpdate(request.agent(app), user.id, topic.id, ideation.id, idea.id, 'TEST idea', 'description', null, 401);
                });

                test('Fail - Unauthorized', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaUpdate(request.agent(app), user.id, topic.id, ideation.id, idea.id, 'TEST idea', 'description', null, 401);
                });
            });

            suite('Delete', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const deleteRes = (await ideationIdeaDelete(agent, user.id, topic.id, ideation.id, idea.id)).body;
                    const expectedBody = {
                        status: {
                            code: 20000
                        }
                    };
                    assert.deepEqual(deleteRes, expectedBody);
                });

                test('Fail - not author of the idea', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaDelete(agent2, user2.id, topic.id, ideation.id, idea.id, 403);
                });

                test('Fail - Unauthorized', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaDelete(request.agent(app), user.id, topic.id, ideation.id, idea.id, 401);
                });
            });

            suite('List', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const ideas = (await ideationIdeaList(agent, user.id, topic.id, ideation.id)).body.data;
                    assert.deepEqual(ideas, { count: 1, rows: [idea] });
                });

                test('Success - unauth', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const ideas = (await ideationIdeaListUnauth(request.agent(app), topic.id, ideation.id)).body.data;
                    assert.deepEqual(ideas, { count: 1, rows: [idea] });
                });

                test('Fail - Unauthorized', async function () {
                    await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST');
                    await _ideationIdeaList(request.agent(app), user.id, topic.id, ideation.id, 401);
                });
            });
        });
    });
});