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

const _ideationUpdate = async function (agent, userId, topicId, ideationId, question, deadline, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .put(path)
        .send({
            question,
            deadline
        })
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationUpdate = async function (agent, userId, topicId, ideationId, question, deadline) {
    return _ideationUpdate(agent, userId, topicId, ideationId, question, deadline, 200);
};

module.exports.ideationCreate = ideationCreate;

const chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
chai.use(require('chai-uuid'));
const assert = chai.assert;
const request = require('supertest');
const app = require('../../app');

const config = app.get('config');
const models = app.get('models');
const db = models.sequelize;
const _ = app.get('lodash');
const cosUtil = app.get('util');
const fs = app.get('fs');
const SevenZip = app.get('SevenZip');
const etherpadClient = app.get('etherpadClient');
const cosEtherpad = app.get('cosEtherpad');
const jwt = app.get('jwt');
const crypto = require('crypto');
const cosJwt = app.get('cosJwt');
const moment = app.get('moment');
const validator = app.get('validator');
const uuid = app.get('uuid');
const path = require('path');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const topicLib = require('./topic');
const memberLib = require('./lib/members')(app);
const groupLib = require('./group');
const authLib = require('./auth');
const activityLib = require('./activity');

const Partner = models.Partner;

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
                const expectedIdeation = _.cloneDeep(ideation);
                expectedIdeation.ideas = {count: 0};
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
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
            });


            test('Success - question - draft topic', async function () {
                const updatedQuestion = 'Updated ideation';
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, updatedQuestion)).body.data;

                console.log(ideationUpdated.question)
                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedIdeation = _.cloneDeep(ideation);
                expectedIdeation.question = updatedQuestion;
                expectedIdeation.ideas = {count: 0};
                assert.deepEqual(ideationUpdated, expectedIdeation);
            });

            test('Fail - question - topic status ideation', async function () {
                const updatedQuestion = 'Updated ideation';
                await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, updatedQuestion)).body.data;
                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedIdeation = _.cloneDeep(ideation);
                expectedIdeation.ideas = {count: 0};
                assert.deepEqual(ideationUpdated, expectedIdeation);
            });

            test('Fail - Unauthorized', async function () {
                await _ideationRead(request.agent(app), user.id, topic.id, null, 401);
            });
        });
    });
});