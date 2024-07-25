
const _discussionCreate = async function (agent, userId, topicId, question, deadline, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions'
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

const discussionCreate = async function (agent, userId, topicId, question, deadline) {
    return _discussionCreate(agent, userId, topicId, question, deadline, 201);
};

const _discussionRead = async function (agent, userId, topicId, discussionId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions/:discussionId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const discussionRead = async function (agent, userId, topicId, discussionId) {
    return _discussionRead(agent, userId, topicId, discussionId, 200);
};

const _discussionReadUnauth = async function (agent, topicId, discussionId, expectedHttpCode) {
    const path = '/api/topics/:topicId/discussions/:discussionId'
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const discussionReadUnauth = async function (agent, topicId, discussionId) {
    return _discussionReadUnauth(agent, topicId, discussionId, 200);
};

const _discussionUpdate = async function (agent, userId, topicId, discussionId, question, deadline, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions/:discussionId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId);

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

const discussionUpdate = async function (agent, userId, topicId, discussionId, question, deadline) {
    return _discussionUpdate(agent, userId, topicId, discussionId, question, deadline, 200);
};

const _discussionDelete = async function (agent, userId, topicId, discussionId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions/:discussionId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId);
    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const discussionDelete = async function (agent, userId, topicId, discussionId) {
    return _discussionDelete(agent, userId, topicId, discussionId, 200);
};

const _topicCommentCreate = async function (agent, userId, topicId, discussionId, parentId, parentVersion, type, subject, text, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            type: type,
            subject: subject,
            text: text,
            parentId: parentId,
            parentVersion: parentVersion
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
}

const topicCommentCreate = async function (agent, userId, topicId, discussionId, parentId, parentVersion, type, subject, text) {
    return _topicCommentCreate(agent, userId, topicId, discussionId, parentId, parentVersion, type, subject, text, 201);
};

const _topicCommentEdit = async function (agent, userId, topicId, discussionId, commentId, subject, text, type, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId)
        .replace(':commentId', commentId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            subject: subject,
            text: text,
            type: type
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentEdit = async function (agent, userId, topicId, discussionId, commentId, subject, text, type) {
    return _topicCommentEdit(agent, userId, topicId, discussionId, commentId, subject, text, type, 200);
};

const _topicCommentList = async function (agent, userId, topicId, discussionId, orderBy, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId);

    return agent
        .get(path)
        .query({ orderBy: orderBy })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentList = async function (agent, userId, topicId, discussionId, orderBy) {
    return _topicCommentList(agent, userId, topicId, discussionId, orderBy, 200);
};

const _topicCommentListUnauth = async function (agent, topicId, discussionId, orderBy, expectedHttpCode) {
    const path = '/api/topics/:topicId/discussions/:discussionId/comments'
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .query({ orderBy: orderBy })
        .expect('Content-Type', /json/);
};

const topicCommentListUnauth = async function (agent, topicId, discussionId, orderBy) {
    return _topicCommentListUnauth(agent, topicId, discussionId, orderBy, 200);
};

const _topicCommentDelete = async function (agent, userId, topicId, discussionId, commentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId)
        .replace(':commentId', commentId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentDelete = async function (agent, userId, topicId, discussionId, commentId) {
    return _topicCommentDelete(agent, userId, topicId, discussionId, commentId, 200);
};

const _topicCommentReportCreate = async function (agent, topicId, discussionId, commentId, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports'
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId)
        .replace(':commentId', commentId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            type: type,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentReportCreate = async function (agent, topicId, discussionId, commentId, type, text) {
    return _topicCommentReportCreate(agent, topicId, discussionId, commentId, type, text, 200);
};

const _topicCommentReportRead = async function (agent, topicId, discussionId, commentId, reportId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId'
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId)
        .replace(':commentId', commentId)
        .replace(':reportId', reportId);

    return agent
        .get(path)
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentReportRead = async function (agent, topicId, discussionId, commentId, reportId, token) {
    return _topicCommentReportRead(agent, topicId, discussionId, commentId, reportId, token, 200);
};

const _topicCommentReportModerate = async function (agent, topicId, discussionId, commentId, reportId, token, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId/moderate'
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId)
        .replace(':commentId', commentId)
        .replace(':reportId', reportId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send({
            type: type,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentReportModerate = async function (agent, topicId, discussionId, commentId, reportId, token, type, text) {
    return _topicCommentReportModerate(agent, topicId, discussionId, commentId, reportId, token, type, text, 200);
};


const _topicCommentVotesCreate = async function (agent, topicId, discussionId, commentId, value, expectedHttpCode) {
    const path = '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/votes'
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId)
        .replace(':commentId', commentId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({ value: value })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentVotesCreate = async function (agent, topicId, discussionId, commentId, value) {
    return _topicCommentVotesCreate(agent, topicId, discussionId, commentId, value, 200);
};

const _topicCommentVotesList = async function (agent, userId, topicId, discussionId, commentId, expectedHttpCode) {
    let path = '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/votes'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':discussionId', discussionId)
        .replace(':commentId', commentId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};


const topicCommentVotesList = async function (agent, userId, topicId, discussionId, commentId) {
    return _topicCommentVotesList(agent, userId, topicId, discussionId, commentId, 200);
};

module.exports.discussionCreate = discussionCreate;
module.exports.topicCommentCreate = topicCommentCreate;

const chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
chai.use(require('chai-uuid'));
const assert = chai.assert;
const request = require('supertest');
const app = require('../../app');
const config = app.get('config');

const models = app.get('models');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const topicLib = require('./topic');

const jwt = app.get('jwt');
const cosJwt = app.get('cosJwt');
const validator = app.get('validator');

const Topic = models.Topic;
const Comment = models.Comment;
const Partner = models.Partner;
const Moderator = models.Moderator;
const Report = models.Report;

// API - /api/users*
suite('Users', function () {

    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    // API - /api/users/:userId/topics*
    suite('Discussion', function () {

        suite('Create', function () {
            const agent = request.agent(app);
            const email = 'test_topicc_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            let user;
            let topic;

            setup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, 'TEST DISCUSSION')).body.data;
            });

            test('Success', async function () {
                const question = 'Test discussion?';
                const discussion = (await discussionCreate(agent, user.id, topic.id, question)).body.data;
                assert.property(discussion, 'id');
                assert.equal(discussion.creatorId, user.id);
                assert.equal(discussion.question, question);
            });

            test('Success - deadline', async function () {
                const question = 'Test discussion?';
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const discussion = (await discussionCreate(agent, user.id, topic.id, question, deadline)).body.data;
                assert.property(discussion, 'id');
                assert.equal(discussion.creatorId, user.id);
                assert.equal(discussion.question, question);
                assert.equal(new Date(discussion.deadline).getTime(), deadline.getTime());
            });

            test('Fail - Bad Request - deadline wrong format', async function () {
                const question = 'Test discussion?';
                const errors = (await _discussionCreate(agent, user.id, topic.id, question, 'TEST', 400)).body.errors;

                assert.equal(errors.deadline, 'Discussion deadline must be in the future.');
            });


            test('Fail - Bad Request - deadline is in the past', async function () {
                const question = 'Test discussion?';
                const deadlineInPast = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                const errors = (await _discussionCreate(agent, user.id, topic.id, question, deadlineInPast, 400)).body.errors;

                assert.equal(errors.deadline, 'Discussion deadline must be in the future.');
            });
        });

        suite('Read', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let discussion;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                discussion = (await discussionCreate(agent, user.id, topic.id, 'TEST discussion')).body.data;
            });


            test('Success', async function () {
                const discussionR = (await discussionRead(agent, user.id, topic.id, discussion.id)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedDiscussion = Object.assign({}, discussion);
                expectedDiscussion.comments = { count: 0 };
                assert.deepEqual(discussionR, expectedDiscussion);
            });

            test('Success - public', async function () {
                await await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.discussion, Topic.VISIBILITY.public);
                const discussionR = (await discussionReadUnauth(request.agent(app), topic.id, discussion.id)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedDiscussion = Object.assign({}, discussion);
                expectedDiscussion.comments = { count: 0 };
                assert.deepEqual(discussionR, expectedDiscussion);
            });

            test('Fail - Unauthorized', async function () {
                await _discussionRead(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Update', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let discussion;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
            });

            setup(async function () {
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                discussion = (await discussionCreate(agent, user.id, topic.id, 'TEST discussion')).body.data;
            });


            test('Success - question - draft topic', async function () {
                const updatedQuestion = 'Updated discussion';
                const discussionR = (await discussionRead(agent, user.id, topic.id, discussion.id)).body.data;
                const discussionUpdated = (await discussionUpdate(agent, user.id, topic.id, discussion.id, updatedQuestion)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                discussionR.question = updatedQuestion;
                assert.notEqual(discussionUpdated.updatedAt, discussionR.updatedAt)
                discussionR.updatedAt = discussionUpdated.updatedAt;
                assert.deepEqual(discussionUpdated, discussionR);
            });

            test('Success - deadline - draft topic', async function () {
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const discussionR = (await discussionRead(agent, user.id, topic.id, discussion.id)).body.data;
                const discussionUpdated = (await discussionUpdate(agent, user.id, topic.id, discussion.id, undefined, deadline)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                discussionR.deadline = deadline;
                assert.equal(new Date(discussionUpdated.deadline).getTime(), deadline.getTime());
                assert.equal(discussionUpdated.question, discussionR.question);
                assert.notEqual(discussionUpdated.updatedAt, discussionR.updatedAt);

            });

            test('Success - question - status inProgress', async function () {
                const updatedQuestion = 'Updated discussion';
                await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                const discussionR = (await discussionRead(agent, user.id, topic.id, discussion.id)).body.data;
                const discussionUpdated = (await discussionUpdate(agent, user.id, topic.id, discussion.id, updatedQuestion)).body.data;
                discussionR.question = updatedQuestion;
                assert.notEqual(discussionUpdated.updatedAt, discussionR.updatedAt)
                discussionR.updatedAt = discussionUpdated.updatedAt;
                assert.deepEqual(discussionUpdated, discussionR);
            });

            test('Fail - deadline in the past', async function () {
                const deadline = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                const errors = (await _discussionUpdate(agent, user.id, topic.id, discussion.id, undefined, deadline, 400)).body.errors;

                assert.equal(errors.deadline, 'Discussion deadline must be in the future.');
            });

            test('Fail - Unauthorized', async function () {
                await _discussionRead(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Delete', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let discussion;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                discussion = (await discussionCreate(agent, user.id, topic.id, 'TEST discussion')).body.data;
            });


            test('Success', async function () {
                const discussionDeleted = (await discussionDelete(agent, user.id, topic.id, discussion.id)).body;
                const resExpected = { status: { code: 20000 } };
                assert.deepEqual(discussionDeleted, resExpected)

                const discussionR = (await _discussionRead(agent, user.id, topic.id, discussion.id, 404)).body;
                const resReadExpected = {
                    status:
                    {
                        code: 40400,
                        message: 'Not Found'
                    }
                };
                assert.deepEqual(discussionR, resReadExpected)
            });

            test('Fail - Unauthorized', async function () {
                await _discussionDelete(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Comments', function () {

            suite('List', function () {

                const creatorAgent = request.agent(app);
                const userAgent = request.agent(app);

                let creator;
                let topic;
                let partner;
                let discussion;

                const commentType1 = Comment.TYPES.pro;
                const commentSubj1 = 'Test comment 1 subj';
                const commentText1 = 'Test comment 1 text';
                const commentType2 = Comment.TYPES.con;
                const commentSubj2 = 'Test comment 2 text';
                const commentText2 = 'Test comment 2 subj';
                const commentSubj3 = 'Test comment 3 subj';
                const commentText3 = 'Test comment 3 text';

                const replyText1 = 'R1';
                const replyText2 = 'R2';
                const replyText3 = 'R3';
                const replyText21 = 'R2.1';
                const replyText211 = 'R2.1.1';
                const replyText212 = 'R2.1.2';
                const replyText2121 = 'R2.1.2.1';
                const replyText11 = 'R1.1';
                const replyText111 = 'R1.1.1';
                const replyText1111 = 'R1.1.1.1';
                const replyText11111 = 'R1.1.1.1.1';

                let comment1;
                let comment2;
                let comment3;
                let reply1;
                let reply2;
                let reply3;
                let reply11;
                let reply21;
                let reply211;
                let reply212;
                let reply2121;
                let reply111;
                let reply1111;
                let reply11111;

                setup(async function () {
                    creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                    topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture])).body.data;
                    const question = 'Test discussion?';
                    discussion = (await discussionCreate(creatorAgent, creator.id, topic.id, question)).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.inProgress);
                    comment1 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, null, null, commentType1, commentSubj1, commentText1)).body.data;
                    comment2 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, null, null, commentType2, commentSubj2, commentText2)).body.data;
                    comment3 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, null, null, commentType1, commentSubj3, commentText3)).body.data;
                    partner = await Partner.create({
                        website: 'notimportant',
                        redirectUriRegexp: 'notimportant'
                    });

                    reply1 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, comment3.id, null, null, null, replyText1)).body.data;
                    reply2 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, comment3.id, null, null, null, replyText2)).body.data;
                    reply3 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, comment3.id, null, null, null, replyText3)).body.data;

                    reply11 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply1.id, null, null, null, replyText11)).body.data;
                    reply21 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply2.id, null, null, null, replyText21)).body.data;

                    reply111 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply11.id, null, null, null, replyText111)).body.data;
                    reply211 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply21.id, null, null, null, replyText211)).body.data;
                    reply212 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply21.id, null, null, null, replyText212)).body.data;
                    reply2121 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply212.id, null, null, null, replyText2121)).body.data;
                    reply1111 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply111.id, null, null, null, replyText1111)).body.data;

                    reply11111 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, reply1111.id, null, null, null, replyText11111)).body.data;
                    reply11111.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply11111.deletedAt = null;
                    reply1111.deletedAt = null;
                    reply1111.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply111.deletedAt = null;
                    reply111.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply11.deletedAt = null;
                    reply11.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply1.deletedAt = null;
                    reply1.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply2121.deletedAt = null;
                    reply2121.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply211.deletedAt = null;
                    reply211.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply212.deletedAt = null;
                    reply212.votes = {
                        up: { count: 1 },
                        down: { count: 0 },
                        count: 1
                    };
                    reply21.deletedAt = null;
                    reply21.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    reply2.deletedAt = null;
                    reply2.votes = {
                        up: { count: 0 },
                        down: { count: 1 },
                        count: 1
                    };
                    reply3.deletedAt = null;
                    reply3.votes = {
                        up: { count: 1 },
                        down: { count: 0 },
                        count: 1
                    };
                    comment3.deletedAt = null;
                    comment3.votes = {
                        up: { count: 0 },
                        down: { count: 0 },
                        count: 0
                    };
                    await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment2.id, 1);
                    await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment1.id, -1);
                    await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, reply212.id, 1);
                    await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, reply2.id, -1);
                    await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, reply3.id, 1);
                });

                test('Success', async function () {
                    const topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture])).body.data;
                    const discussion = (await discussionCreate(creatorAgent, creator.id, topic.id, 'TEST Question')).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.inProgress);
                    await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, null, null, Comment.TYPES.pro, 'Subject', 'WOHOO! This is my comment.');
                    // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                    const creatorCommentList = (await topicCommentList(creatorAgent, creator.id, topic.id, discussion.id, null)).body;
                    const userCommentList = (await topicCommentListUnauth(userAgent, topic.id, discussion.id, null)).body;

                    assert.deepEqual(creatorCommentList, userCommentList);
                });

                test('Success - public Topic without comments', async function () {
                    const topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.defense, Topic.CATEGORIES.education])).body.data;
                    // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                    const discussion = (await discussionCreate(creatorAgent, creator.id, topic.id, 'TEST Question')).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.inProgress);
                    const creatorCommentList = (await topicCommentList(creatorAgent, creator.id, topic.id, discussion.id, null)).body;
                    const userCommentList = (await topicCommentListUnauth(userAgent, topic.id, discussion.id, null)).body;

                    assert.deepEqual(creatorCommentList, userCommentList);
                });

                test('Success - Comments with replies v2 unauth orderBy date', async function () {
                    reply11111.replies = {
                        count: 0,
                        rows: []
                    };
                    reply1111.replies = {
                        count: 1,
                        rows: [reply11111]
                    };
                    reply111.replies = {
                        count: 1,
                        rows: [reply1111]
                    };
                    reply11.replies = {
                        count: 1,
                        rows: [reply111]
                    };
                    reply1.replies = {
                        count: 1,
                        rows: [reply11]
                    };
                    reply2121.replies = {
                        count: 0,
                        rows: []
                    };
                    reply211.replies = {
                        count: 0,
                        rows: []
                    };
                    reply212.replies = {
                        count: 1,
                        rows: [reply2121]
                    };
                    reply21.replies = {
                        count: 2,
                        rows: [reply211, reply212]
                    };
                    reply2.replies = {
                        count: 1,
                        rows: [reply21]
                    };
                    reply3.replies = {
                        count: 0,
                        rows: []
                    };
                    comment3.replies = {
                        count: 3,
                        rows: [reply1, reply2, reply3]
                    };
                    const data = (await topicCommentListUnauth(userAgent, topic.id, discussion.id, 'date')).body.data;
                    const expectedResult = {
                        rows: [comment3, comment2, comment1],
                        count: {
                            total: 14,
                            pro: 2,
                            con: 1,
                            poi: 0,
                            reply: 11
                        }
                    };
                    assert.shallowDeepEqual(data, expectedResult);
                });

                test('Success - Comments with replies v2 orderBy rating', async function () {
                    reply11111.replies = {
                        count: 0,
                        rows: []
                    };
                    reply1111.replies = {
                        count: 1,
                        rows: [reply11111]
                    };
                    reply111.replies = {
                        count: 1,
                        rows: [reply1111]
                    };
                    reply11.replies = {
                        count: 1,
                        rows: [reply111]
                    };
                    reply1.replies = {
                        count: 1,
                        rows: [reply11]
                    };
                    reply2121.replies = {
                        count: 0,
                        rows: []
                    };
                    reply211.replies = {
                        count: 0,
                        rows: []
                    };
                    reply212.replies = {
                        count: 1,
                        rows: [reply2121]
                    };
                    reply21.replies = {
                        count: 2,
                        rows: [reply212, reply211]
                    };
                    reply2.replies = {
                        count: 1,
                        rows: [reply21]
                    };
                    reply3.replies = {
                        count: 0,
                        rows: []
                    };
                    comment3.replies = {
                        count: 3,
                        rows: [reply3, reply1, reply2]
                    };
                    const data = (await topicCommentList(creatorAgent, creator.id, topic.id, discussion.id, 'rating')).body.data;
                    const expectedResult = {
                        rows: [comment2, comment3, comment1],
                        count: {
                            total: 14,
                            pro: 2,
                            con: 1,
                            poi: 0,
                            reply: 11
                        }
                    };
                    assert.shallowDeepEqual(data, expectedResult);
                });

                test('Success - Comments with replies v2 orderBy popularity', async function () {
                    reply11111.replies = {
                        count: 0,
                        rows: []
                    };
                    reply1111.replies = {
                        count: 1,
                        rows: [reply11111]
                    };
                    reply111.replies = {
                        count: 1,
                        rows: [reply1111]
                    };
                    reply11.replies = {
                        count: 1,
                        rows: [reply111]
                    };
                    reply1.replies = {
                        count: 1,
                        rows: [reply11]
                    };
                    reply2121.replies = {
                        count: 0,
                        rows: []
                    };
                    reply211.replies = {
                        count: 0,
                        rows: []
                    };
                    reply212.replies = {
                        count: 1,
                        rows: [reply2121]
                    };
                    reply21.replies = {
                        count: 2,
                        rows: [reply212, reply211]
                    };
                    reply2.replies = {
                        count: 1,
                        rows: [reply21]
                    };
                    reply3.replies = {
                        count: 0,
                        rows: []
                    };
                    comment3.replies = {
                        count: 3,
                        rows: [reply2, reply3, reply1]
                    };
                    const data = (await topicCommentList(creatorAgent, creator.id, topic.id, discussion.id, 'popularity')).body.data;
                    const expectedResult = {
                        rows: [comment2, comment1, comment3],
                        count: {
                            total: 14,
                            pro: 2,
                            con: 1,
                            poi: 0,
                            reply: 11
                        }
                    };
                    assert.shallowDeepEqual(data, expectedResult);
                });

                test('Success - Comments with replies v2 orderBy date user is moderator', async function () {
                    reply11111.replies = {
                        count: 0,
                        rows: []
                    };
                    reply1111.replies = {
                        count: 1,
                        rows: [reply11111]
                    };
                    reply111.replies = {
                        count: 1,
                        rows: [reply1111]
                    };
                    reply11.replies = {
                        count: 1,
                        rows: [reply111]
                    };
                    reply1.replies = {
                        count: 1,
                        rows: [reply11]
                    };
                    reply2121.replies = {
                        count: 0,
                        rows: []
                    };
                    reply211.replies = {
                        count: 0,
                        rows: []
                    };
                    reply212.replies = {
                        count: 1,
                        rows: [reply2121]
                    };
                    reply21.replies = {
                        count: 2,
                        rows: [reply211, reply212]
                    };
                    reply2.replies = {
                        count: 1,
                        rows: [reply21]
                    };
                    reply3.replies = {
                        count: 0,
                        rows: []
                    };
                    comment3.replies = {
                        count: 3,
                        rows: [reply1, reply2, reply3]
                    };
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
                    await Moderator.create({
                        userId: creator.id,
                        partnerId: partner.id
                    });
                    const data = (await topicCommentList(creatorAgent, creator.id, topic.id, discussion.id, 'date')).body.data;
                    const expectedResult = {
                        rows: [comment3, comment2, comment1],
                        count: {
                            total: 14,
                            pro: 2,
                            con: 1,
                            poi: 0,
                            reply: 11
                        }
                    };

                    assert.shallowDeepEqual(data, expectedResult);

                    data.rows.forEach(function (comment) {
                        assert.equal(comment.creator.email, creator.email);
                        if (comment.replies && comment.replies.rows) {
                            comment.replies.rows.forEach(function (creply) {
                                assert.equal(creply.creator.email, creator.email);
                            });
                        }
                    });
                });

                test('Fail - 404 - trying to fetch comments of non-public Topic', async function () {
                    const topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                    const discussion = (await discussionCreate(creatorAgent, creator.id, topic.id, 'TEST Question'));
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.inProgress);

                    return _topicCommentListUnauth(userAgent, topic.id, discussion.id, null, 404);
                });

            });

            // API - /api/topics/:topicId/discussions/:discussionId/comments/:commentId/votes
            suite('Votes', function () {

                suite('Create', function () {
                    const creatorAgent = request.agent(app);
                    const userAgent = request.agent(app);
                    const user2Agent = request.agent(app);

                    let creator;
                    let topic;
                    let discussion;
                    let comment;

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                        await userLib.createUserAndLogin(userAgent, null, null, null);
                        await userLib.createUserAndLogin(user2Agent, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                        discussion = (await discussionCreate(creatorAgent, creator.id, topic.id, 'Test question?')).body.data;
                        await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.inProgress);
                        comment = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, null, null, Comment.TYPES.pro, 'Subj', 'Text')).body.data;
                    });

                    test('Success - 20100 - Upvote', async function () {
                        const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, 1)).body;
                        const expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 1,
                                    selected: true
                                },
                                down: {
                                    count: 0,
                                    selected: false
                                }
                            }
                        };
                        assert.deepEqual(resBody, expected);
                    });


                    test('Success - 20100 - Downvote', async function () {
                        const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, -1)).body;
                        const expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 0,
                                    selected: false
                                },
                                down: {
                                    count: 1,
                                    selected: true
                                }
                            }
                        };
                        assert.deepEqual(resBody, expected);
                    });

                    test('Success - 20100 - clear vote', async function () {
                        const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, 0)).body;
                        const expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 0,
                                    selected: false
                                },
                                down: {
                                    count: 0,
                                    selected: false
                                }
                            }
                        };
                        assert.deepEqual(resBody, expected);
                    });

                    test('Success - 20100 - change vote from upvote to downvote', async function () {
                        await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, 1);
                        const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, -1)).body;
                        const expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 0,
                                    selected: false
                                },
                                down: {
                                    count: 1,
                                    selected: true
                                }
                            }
                        };
                        assert.deepEqual(resBody, expected);
                    });

                    test('Success - Multiple users voting', async function () {
                        await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, 1);
                        await topicCommentVotesCreate(userAgent, topic.id, discussion.id, comment.id, 1);
                        const resBody = (await topicCommentVotesCreate(user2Agent, topic.id, discussion.id, comment.id, -1)).body;
                        const expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 2,
                                    selected: false
                                },
                                down: {
                                    count: 1,
                                    selected: true
                                }
                            }
                        };
                        assert.deepEqual(resBody, expected);
                    });

                    test('Fail - 40000 - invalid vote value', async function () {
                        const resBody = (await _topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, 666, 400)).body;
                        const expectedBody = {
                            status: { code: 40000 },
                            errors: { value: 'Vote value must be 1 (up-vote), -1 (down-vote) OR 0 to clear vote.' }
                        };
                        assert.deepEqual(resBody, expectedBody);
                    });
                });

                suite('List', function () {
                    const creatorAgent = request.agent(app);
                    const creatorAgent2 = request.agent(app);

                    let creator;
                    let topic;
                    let discussion;
                    let comment;

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                        await userLib.createUserAndLogin(creatorAgent2, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                        discussion = (await discussionCreate(creatorAgent, creator.id, topic.id, 'Test question?')).body.data;
                        await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.inProgress);
                        comment = (await topicCommentCreate(creatorAgent, creator.id, topic.id, discussion.id, null, null, Comment.TYPES.pro, 'Subj', 'Text')).body.data
                    });

                    test('Success', async function () {
                        await topicCommentVotesCreate(creatorAgent, topic.id, discussion.id, comment.id, 1);
                        await topicCommentVotesCreate(creatorAgent2, topic.id, discussion.id, comment.id, 0); //Add cleared vote that should not be returned;
                        const commentVotesList = (await topicCommentVotesList(creatorAgent, creator.id, topic.id, discussion.id, comment.id)).body.data;
                        const commentVote = commentVotesList.rows[0];
                        const expected = {
                            rows: [
                                {
                                    company: null,
                                    imageUrl: null,
                                    createdAt: commentVote.createdAt,
                                    updatedAt: commentVote.updatedAt,
                                    name: creator.name,
                                    vote: "up"
                                }
                            ],
                            count: 1
                        };

                        assert.deepEqual(commentVotesList, expected);
                    });
                });

            });

            // API - /api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports
            suite('Reports', function () {

                suite('Create', function () {
                    const agentCreator = request.agent(app);
                    const agentReporter = request.agent(app);
                    const agentModerator = request.agent(app);

                    const emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportest.com';
                    const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportest.com';
                    const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportest.com';

                    let userCreator;
                    let userModerator;
                    let userReporter;

                    let partner;
                    let topic;
                    let discussion;
                    let comment;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        userReporter = await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                        discussion = (await discussionCreate(agentCreator, userCreator.id, topic.id, 'Test question?')).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.inProgress);
                        comment = (await topicCommentCreate(agentCreator, userCreator.id, topic.id, discussion.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
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

                        return Moderator.create({
                            userId: userModerator.id,
                            partnerId: partner.id
                        });
                    });

                    test('Success', async function () {
                        const reportText = 'Hate speech report test';

                        const reportResult = (await topicCommentReportCreate(agentReporter, topic.id, discussion.id, comment.id, Report.TYPES.hate, reportText)).body.data;
                        assert.isTrue(validator.isUUID(reportResult.id));
                        assert.equal(reportResult.type, Report.TYPES.hate);
                        assert.equal(reportResult.text, reportText);
                        assert.property(reportResult, 'createdAt');
                        assert.equal(reportResult.creator.id, userReporter.id);
                    });

                });

                suite('Read', function () {
                    const agentCreator = request.agent(app);
                    const agentReporter = request.agent(app);
                    const agentModerator = request.agent(app);

                    const emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportreadtest.com';
                    const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportreadtest.com';
                    const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportreadtest.com';

                    let userCreator;
                    let userModerator;

                    let partner;
                    let topic;
                    let discussion;
                    let comment;
                    let report;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
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
                        await Moderator.create({
                            userId: userModerator.id,
                            partnerId: partner.id
                        });
                        discussion = (await discussionCreate(agentCreator, userCreator.id, topic.id, 'Test question?')).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.inProgress);
                        comment = (await topicCommentCreate(agentCreator, userCreator.id, topic.id, discussion.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
                        report = (await topicCommentReportCreate(agentReporter, topic.id, discussion.id, comment.id, Report.TYPES.hate, 'reported!')).body.data;
                    });

                    test('Success - token with audience', async function () {
                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'GET /api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId'
                                    .replace(':topicId', topic.id)
                                    .replace(':discussionId', discussion.id)
                                    .replace(':commentId', comment.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        const resBody = (await topicCommentReportRead(request.agent(app), topic.id, discussion.id, comment.id, report.id, token)).body;
                        const expectedResult = {
                            status: { code: 20000 },
                            data: {
                                id: report.id,
                                type: report.type,
                                text: report.text,
                                createdAt: report.createdAt,
                                comment: {
                                    subject: comment.subject,
                                    text: comment.text,
                                    id: comment.id
                                }
                            }
                        };
                        assert.deepEqual(resBody, expectedResult);
                    });

                    test('Fail - 40100 - Invalid token', async function () {
                        const token = {};
                        return _topicCommentReportRead(request.agent(app), topic.id, discussion.id, comment.id, report.id, token, 401);
                    });

                    test('Fail - 40100 - invalid token - without audience', async function () {
                        const token = jwt.sign(
                            {},
                            config.session.privateKey,
                            {
                                algorithm: config.session.algorithm
                            }
                        );

                        return _topicCommentReportRead(request.agent(app), topic.id, discussion.id, comment.id, report.id, token, 401);
                    });

                    test('Fail - 40100 - invalid token - invalid audience', async function () {
                        const token = cosJwt.getTokenRestrictedUse({}, 'GET /foo/bar');

                        return _topicCommentReportRead(request.agent(app), topic.id, discussion.id, comment.id, report.id, token, 401);
                    });

                });

                suite('Moderate', function () {
                    const agentCreator = request.agent(app);
                    const agentReporter = request.agent(app);
                    const agentModerator = request.agent(app);

                    const emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@repormoderationtest.com';
                    const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@repormoderationtest.com';
                    const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@repormoderationtest.com';

                    let userCreator;
                    let userModerator;

                    let partner;
                    let topic;
                    let discussion;
                    let comment;
                    let report;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;

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
                        await Moderator.create({
                            userId: userModerator.id,
                            partnerId: partner.id
                        });
                        discussion = (await discussionCreate(agentCreator, userCreator.id, topic.id, 'Test question?')).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.inProgress);
                        comment = (await topicCommentCreate(agentCreator, userCreator.id, topic.id, discussion.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
                        report = (await topicCommentReportCreate(agentReporter, topic.id, discussion.id, comment.id, Report.TYPES.hate, 'Report create test text')).body.data;

                    });

                    test('Success', async function () {
                        const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                        const moderateText = 'Report create moderation text';

                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'POST /api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId/moderate'
                                    .replace(':topicId', topic.id)
                                    .replace(':discussionId', discussion.id)
                                    .replace(':commentId', comment.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        await topicCommentReportModerate(request.agent(app), topic.id, discussion.id, comment.id, report.id, token, moderateType, moderateText);

                        const commentRead = (await Comment.findOne({
                            where: {
                                id: comment.id
                            },
                            paranoid: false
                        })).toJSON();

                        assert.equal(commentRead.deletedBy.id, userModerator.id);
                        assert.equal(commentRead.report.id, report.id);
                        assert.equal(commentRead.deletedReasonType, moderateType);
                        assert.equal(commentRead.deletedReasonText, moderateText);
                        assert.isNotNull(commentRead.deletedAt);
                    });

                    test('Fail - 40100 - Invalid token - random stuff', async function () {
                        return _topicCommentReportModerate(request.agent(app), topic.id, discussion.id, comment.id, report.id, 'TOKEN HERE', Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
                    });

                    test('Fail - 40100 - Invalid token - invalid path', async function () {
                        const path = '/totally/foobar/path';

                        const token = jwt.sign(
                            {
                                path: path
                            },
                            config.session.privateKey,
                            {
                                algorithm: config.session.algorithm
                            }
                        );

                        return _topicCommentReportModerate(request.agent(app), topic.id, discussion.id, comment.id, report.id, token, Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
                    });

                    test('Fail - 40010 - Report has become invalid cause comment has been updated after the report', async function () {
                        // Revive the Comment we deleted on report
                        await Comment.update(
                            {
                                deletedById: null,
                                deletedAt: null,
                                deletedReasonType: null,
                                deletedReasonText: null,
                                deletedByReportId: null

                            },
                            {
                                where: {
                                    id: comment.id
                                },
                                paranoid: false
                            }
                        );

                        report = (await topicCommentReportCreate(agentReporter, topic.id, discussion.id, comment.id, Report.TYPES.hate, 'Report create test text')).body.data;
                        const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                        const moderateText = 'Report create moderation text';

                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'POST /api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId/moderate'
                                    .replace(':topicId', topic.id)
                                    .replace(':discussionId', discussion.id)
                                    .replace(':commentId', comment.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        await Comment.update(
                            {
                                text: 'Update comment!'
                            },
                            {
                                where: {
                                    id: comment.id
                                },
                                paranoid: false
                            }
                        );
                        const resBody = (await _topicCommentReportModerate(request.agent(app), topic.id, discussion.id, comment.id, report.id, token, moderateType, moderateText, 400)).body;
                        const expectedResult = {
                            status: {
                                code: 40010,
                                message: 'Report has become invalid cause comment has been updated after the report'
                            }
                        };

                        assert.deepEqual(resBody, expectedResult);
                    });
                });

            });

            suite('Create', function () {

                const agent = request.agent(app);

                let user;
                let topic;
                let discussion;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicLib.topicCreate(agent, user.id)).body.data;
                    discussion = (await discussionCreate(agent, user.id, topic.id, 'Test question?')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                });

                test('Success - type=pro with reply', async function () {
                    const type = Comment.TYPES.pro;
                    const subject = `Test ${type} comment subject`;
                    const text = `Test ${type} comment text`;

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, user.id);

                    const commentReplyText = `Test Child comment for comment ${type}`;
                    const commentReply = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

                    assert.property(commentReply, 'id');
                    assert.equal(commentReply.type, Comment.TYPES.reply);
                    assert.notProperty(commentReply, 'subject');
                    assert.equal(commentReply.text, commentReplyText);
                    assert.equal(commentReply.creator.id, user.id);
                    assert.equal(commentReply.parent.id, comment.id);
                });

                test('Success - type=con with reply', async function () {
                    const type = Comment.TYPES.con;
                    const subject = `Test ${type} comment subject`;
                    const text = `Test ${type} comment text`;

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, user.id);

                    const commentReplyText = `Test Child comment for comment ${type}`;
                    const commentReply = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

                    assert.property(commentReply, 'id');
                    assert.equal(commentReply.type, Comment.TYPES.reply);
                    assert.notProperty(commentReply, 'subject');
                    assert.equal(commentReply.text, commentReplyText);
                    assert.equal(commentReply.creator.id, user.id);
                    assert.equal(commentReply.parent.id, comment.id);
                });

                test('Success - type=poi with reply', async function () {
                    const type = Comment.TYPES.poi;
                    const subject = `Test ${type} comment subject`;
                    const text = `Test ${type} comment text`;

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, user.id);

                    const commentReplyText = `Test Child comment for comment ${type}`;
                    const commentReply = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

                    assert.property(commentReply, 'id');
                    assert.equal(commentReply.type, Comment.TYPES.reply);
                    assert.notProperty(commentReply, 'subject');
                    assert.equal(commentReply.text, commentReplyText);
                    assert.equal(commentReply.creator.id, user.id);
                    assert.equal(commentReply.parent.id, comment.id);
                });

                test('Success - test quotes "">\'!<', async function () {
                    const type = Comment.TYPES.pro;
                    const subject = 'subject test quotes "">\'!<';
                    const text = 'text test quotes "">\'!<';

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, type, subject, text)).body.data;

                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, user.id);
                });

                test('Fail - 40000 - text can be 1 - N characters longs - PRO', async function () {
                    const type = Comment.TYPES.pro;
                    const maxLength = Comment.TYPE_LENGTH_LIMIT[type];
                    const subject = 'subject test quotes "">\'!<';
                    const text = 'a'.repeat(maxLength + 1);

                    const resBody = (await _topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, type, subject, text, 400)).body;

                    const resBodyExpected = {
                        status: { code: 40000 },
                        errors: { text: `Text can be 1 to ${maxLength} characters long.` }
                    };

                    assert.deepEqual(resBody, resBodyExpected);
                });

                test('Fail - 40000 - text can be 1 - N characters longs - POI', async function () {
                    const type = Comment.TYPES.poi;
                    const maxLength = Comment.TYPE_LENGTH_LIMIT[type];
                    const subject = 'subject test quotes "">\'!<';
                    const text = 'a'.repeat(maxLength + 1);

                    const resBody = (await _topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, type, subject, text, 400)).body;

                    const resBodyExpected = {
                        status: { code: 40000 },
                        errors: { text: `Text can be 1 to ${maxLength} characters long.` }
                    };

                    assert.deepEqual(resBody, resBodyExpected);
                });

                test('Fail - 40300 - Forbidden - cannot comment on Topic you\'re not a member of or the Topic is not public', async function () {
                    const type = Comment.TYPES.poi;
                    const subject = 'subject test quotes "">\'!<';
                    const text = 'should not pass!';

                    const agentUser2 = request.agent(app);
                    const user2 = await userLib.createUserAndLogin(agentUser2, null, null, null);

                    const resBody = (await _topicCommentCreate(agentUser2, user2.id, topic.id, discussion.id, null, null, type, subject, text, 403)).body;

                    const resBodyExpected = {
                        status: {
                            code: 40300,
                            message: 'Insufficient permissions'
                        }
                    };

                    assert.deepEqual(resBody, resBodyExpected);
                });

            });

            suite('Update', function () {
                const agent2 = request.agent(app);
                const agent3 = request.agent(app);

                let user2;
                let user3;
                let topic;
                let discussion;

                suiteSetup(async function () {
                    user2 = await userLib.createUserAndLogin(agent2, null, null, null);
                    user3 = await userLib.createUserAndLogin(agent3, null, null, null);
                    topic = (await topicLib.topicCreate(agent2, user2.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                    discussion = (await discussionCreate(agent2, user2.id, topic.id, 'Test question?')).body.data;
                    await topicLib.topicUpdate(agent2, user2.id, topic.id, Topic.STATUSES.inProgress);
                });

                test('Success - edit comment by user', async function () {
                    const type = Comment.TYPES.pro;
                    const subject = 'to be edited by user';
                    const text = 'Wohoo!';

                    const comment = (await topicCommentCreate(agent3, user3.id, topic.id, discussion.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.type, Comment.TYPES.pro);
                    assert.equal(comment.creator.id, user3.id);

                    const editSubject = 'Edited by user';
                    const editText = 'Jei, i edited';

                    const status = (await topicCommentEdit(agent3, user3.id, topic.id, discussion.id, comment.id, editSubject, editText, Comment.TYPES.con)).body.status;
                    assert.equal(status.code, 20000);
                    const commentEdited = (await topicCommentList(agent3, user3.id, topic.id, discussion.id, 'date')).body.data.rows[0];
                    assert.property(commentEdited, 'id');
                    assert.property(commentEdited, 'edits');
                    assert.equal(commentEdited.edits.length, 2);
                    assert.equal(commentEdited.edits[0].subject, subject);
                    assert.equal(commentEdited.edits[1].subject, editSubject);
                    assert.equal(commentEdited.edits[0].text, text);
                    assert.equal(commentEdited.edits[1].text, editText);
                    assert.equal(commentEdited.edits[0].createdAt, commentEdited.createdAt);
                    assert.notEqual(commentEdited.type, Comment.TYPES.reply);
                    assert.equal(commentEdited.type, Comment.TYPES.con);
                    assert.equal(commentEdited.subject, editSubject);
                    assert.equal(commentEdited.text, editText);
                    assert.equal(commentEdited.creator.id, user3.id);
                    assert.equal(commentEdited.parent.id, comment.id);
                });

                test('Fail - 40000 - text can be 1 - N characters longs - PRO', async function () {
                    const type = Comment.TYPES.pro;
                    const maxLength = Comment.TYPE_LENGTH_LIMIT[type];
                    const subject = 'to be edited by user';
                    const text = 'Wohoo!';

                    const comment = (await topicCommentCreate(agent3, user3.id, topic.id, discussion.id, null, null, type, subject, text)).body.data;
                    const resBodyEdit = (await _topicCommentEdit(agent3, user3.id, topic.id, discussion.id, comment.id, subject + 'a', 'a'.repeat(maxLength + 1), type, 400)).body;

                    const resBodyEditExpected = {
                        status: { code: 40000 },
                        errors: { text: `Text can be 1 to ${maxLength} characters long.` }
                    };

                    assert.deepEqual(resBodyEdit, resBodyEditExpected);
                });
            });

            suite('List V2', function () {
                const agent = request.agent(app);

                const commentType1 = Comment.TYPES.pro;
                const commentSubj1 = 'Test comment 1 subj';
                const commentText1 = 'Test comment 1 text';
                const commentType2 = Comment.TYPES.con;
                const commentSubj2 = 'Test comment 2 text';
                const commentText2 = 'Test comment 2 subj';
                const commentType3 = Comment.TYPES.poi;
                const commentSubj3 = 'Test comment 3 text';
                const commentText3 = 'Test comment 3 subj';

                let user;
                let topic;
                let discussion;
                let partner;
                let comment1;
                let comment2;
                let comment3;

                setup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicLib.topicCreate(agent, user.id)).body.data;
                    discussion = (await discussionCreate(agent, user.id, topic.id, 'Test question?')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                    comment1 = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, commentType1, commentSubj1, commentText1)).body.data;
                    comment2 = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, commentType2, commentSubj2, commentText2)).body.data;
                    comment3 = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, commentType3, commentSubj3, commentText3)).body.data;
                    partner = await Partner.create({
                        website: 'notimportant',
                        redirectUriRegexp: 'notimportant'
                    });
                });

                test('Success', async function () {
                    const list = (await topicCommentList(agent, user.id, topic.id, discussion.id, null)).body.data;
                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    delete creatorExpected.email; // Email is not returned
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 3);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = comments.find((c) => c.id === comment1.id);

                    assert.equal(c1.id, comment1.id);
                    assert.equal(c1.type, comment1.type);
                    assert.equal(c1.subject, comment1.subject);
                    assert.equal(c1.text, comment1.text);
                    assert.property(c1, 'createdAt');
                    assert.equal(c1.parent.id, comment1.id);

                    assert.deepEqual(c1.creator, creatorExpected);

                    // Comment 2
                    const c2 = comments.find((c) => c.id === comment2.id);

                    assert.equal(c2.id, comment2.id);
                    assert.equal(c2.type, comment2.type);
                    assert.equal(c2.subject, comment2.subject);
                    assert.equal(c2.text, comment2.text);
                    assert.property(c2, 'createdAt');
                    assert.equal(c2.parent.id, comment2.id);

                    assert.deepEqual(c2.creator, creatorExpected);

                    // Comment 3
                    const c3 = comments.find((c) => c.id === comment3.id);

                    assert.equal(c3.id, comment3.id);
                    assert.equal(c3.type, comment3.type);
                    assert.equal(c3.subject, comment3.subject);
                    assert.equal(c3.text, comment3.text);
                    assert.property(c3, 'createdAt');
                    assert.equal(c3.parent.id, comment3.id);

                    assert.deepEqual(c3.creator, creatorExpected);
                });

                test('Success v2', async function () {
                    const list = (await topicCommentList(agent, user.id, topic.id, discussion.id, 'rating')).body.data;
                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    delete creatorExpected.email; // Email is not returned
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 3);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = comments.find((c) => c.id === comment1.id);

                    assert.equal(c1.id, comment1.id);
                    assert.equal(c1.type, comment1.type);
                    assert.equal(c1.subject, comment1.subject);
                    assert.equal(c1.text, comment1.text);
                    assert.property(c1, 'createdAt');
                    assert.equal(c1.parent.id, comment1.id);

                    assert.deepEqual(c1.creator, creatorExpected);
                });

                test('Success - Comments with replies - c1->r1.1 c2->r2.1 c2->r2.2 c3->r3.1', async function () {
                    const replyText11 = 'R1.1';
                    const replyText21 = 'R2.1';
                    const replyText22 = 'R2.2';
                    const replyText31 = 'R3.1';
                    await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment1.id, null, null, null, replyText11);
                    await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment2.id, null, null, null, replyText21);
                    await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment2.id, null, null, null, replyText22);
                    await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment3.id, null, null, null, replyText31);

                    const list = (await topicCommentList(agent, user.id, topic.id, discussion.id, null)).body.data;
                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    delete creatorExpected.email; // Email is not returned
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 7);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = comments.find((c) => c.id === comment1.id);

                    assert.equal(c1.id, comment1.id);
                    assert.equal(c1.type, comment1.type);
                    assert.equal(c1.subject, comment1.subject);
                    assert.equal(c1.text, commentText1);
                    assert.property(c1, 'createdAt');
                    assert.equal(c1.parent.id, comment1.id);

                    assert.deepEqual(c1.creator, creatorExpected);

                    // Comment 1 replies
                    assert.equal(c1.replies.count, 1);
                    assert.equal(c1.replies.rows.length, 1);

                    const c1r1 = c1.replies.rows[0];

                    assert.equal(c1r1.parent.id, comment1.id);
                    assert.equal(c1r1.type, Comment.TYPES.reply);
                    assert.isNull(c1r1.subject);
                    assert.equal(c1r1.text, replyText11);
                    assert.property(c1r1, 'createdAt');

                    assert.deepEqual(c1r1.creator, creatorExpected);

                    // Comment 2
                    const c2 = comments.find((c) => c.id === comment2.id);

                    assert.equal(c2.id, comment2.id);
                    assert.equal(c2.type, comment2.type);
                    assert.equal(c2.subject, comment2.subject);
                    assert.equal(c2.text, comment2.text);
                    assert.property(c2, 'createdAt');
                    assert.equal(c2.parent.id, c2.id);

                    assert.deepEqual(c2.creator, creatorExpected);

                    // Comment 2 replies
                    assert.equal(c2.replies.count, 2);
                    assert.equal(c2.replies.rows.length, 2);

                    const c2r1 = c2.replies.rows[0];

                    assert.equal(c2r1.parent.id, comment2.id);
                    assert.equal(c2r1.type, Comment.TYPES.reply);
                    assert.isNull(c2r1.subject);
                    assert.equal(c2r1.text, replyText21);
                    assert.property(c2r1, 'createdAt');

                    assert.deepEqual(c2r1.creator, creatorExpected);

                    const c2r2 = c2.replies.rows[1];

                    assert.equal(c2r2.parent.id, comment2.id);
                    assert.equal(c2r2.type, Comment.TYPES.reply);
                    assert.isNull(c2r2.subject);
                    assert.equal(c2r2.text, replyText22);
                    assert.property(c2r2, 'createdAt');

                    assert.deepEqual(c2r2.creator, creatorExpected);

                    // Comment 3
                    const c3 = comments.find((c) => c.id === comment3.id);

                    assert.equal(c3.id, comment3.id);
                    assert.equal(c3.type, comment3.type);
                    assert.equal(c3.subject, comment3.subject);
                    assert.equal(c3.text, commentText3);
                    assert.property(c3, 'createdAt');
                    assert.equal(c3.parent.id, comment3.id);

                    assert.deepEqual(c3.creator, creatorExpected);

                    // Comment 1 replies
                    assert.equal(c3.replies.count, 1);
                    assert.equal(c3.replies.rows.length, 1);

                    const c3r1 = c3.replies.rows[0];

                    assert.equal(c3r1.parent.id, comment3.id);
                    assert.equal(c3r1.type, Comment.TYPES.reply);
                    assert.isNull(c3r1.subject);
                    assert.equal(c3r1.text, replyText31);
                    assert.property(c3r1, 'createdAt');

                    assert.deepEqual(c3r1.creator, creatorExpected);
                });

                test('Success - User has Moderator permissions', async function () {
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
                    await Moderator.create({
                        userId: user.id,
                        partnerId: partner.id
                    });
                    const replyText11 = 'R1.1';
                    const replyText21 = 'R2.1';
                    const replyText22 = 'R2.2';
                    await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment1.id, null, null, null, replyText11);
                    await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment2.id, null, null, null, replyText21);
                    await topicCommentCreate(agent, user.id, topic.id, discussion.id, comment2.id, null, null, null, replyText22);
                    const list = (await topicCommentList(agent, user.id, topic.id, discussion.id, null)).body.data;

                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    creatorExpected.phoneNumber = null;
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 6);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = comments.find((c) => c.id === comment1.id);

                    assert.equal(c1.id, comment1.id);
                    assert.equal(c1.type, comment1.type);
                    assert.equal(c1.subject, comment1.subject);
                    assert.equal(c1.text, commentText1);
                    assert.property(c1, 'createdAt');
                    assert.equal(c1.parent.id, comment1.id);

                    assert.deepEqual(c1.creator, creatorExpected);

                    // Comment 1 replies
                    assert.equal(c1.replies.count, 1);
                    assert.equal(c1.replies.rows.length, 1);

                    const c1r1 = c1.replies.rows[0];

                    assert.equal(c1r1.parent.id, comment1.id);
                    assert.equal(c1r1.type, Comment.TYPES.reply);
                    assert.isNull(c1r1.subject);
                    assert.equal(c1r1.text, replyText11);
                    assert.property(c1r1, 'createdAt');

                    assert.deepEqual(c1r1.creator, creatorExpected);

                    // Comment 2
                    const c2 = comments.find((c) => c.id === comment2.id);

                    assert.equal(c2.id, comment2.id);
                    assert.equal(c2.type, comment2.type);
                    assert.equal(c2.subject, comment2.subject);
                    assert.equal(c2.text, comment2.text);
                    assert.property(c2, 'createdAt');
                    assert.equal(c2.parent.id, c2.id);

                    assert.deepEqual(c2.creator, creatorExpected);

                    // Comment 2 replies
                    assert.equal(c2.replies.count, 2);
                    assert.equal(c2.replies.rows.length, 2);

                    const c2r1 = c2.replies.rows[0];

                    assert.equal(c2r1.parent.id, comment2.id);
                    assert.equal(c2r1.type, Comment.TYPES.reply);
                    assert.isNull(c2r1.subject);
                    assert.equal(c2r1.text, replyText21);
                    assert.property(c2r1, 'createdAt');

                    assert.deepEqual(c2r1.creator, creatorExpected);

                    const c2r2 = c2.replies.rows[1];

                    assert.equal(c2r2.parent.id, comment2.id);
                    assert.equal(c2r2.type, Comment.TYPES.reply);
                    assert.isNull(c2r2.subject);
                    assert.equal(c2r2.text, replyText22);
                    assert.property(c2r2, 'createdAt');

                    assert.deepEqual(c2r2.creator, creatorExpected);
                });
            });

            suite('Delete', function () {

                const agent = request.agent(app);

                const commentType = Comment.TYPES.con;
                const commentSubject = 'Test comment subject for deletion';
                const commentText = 'Test comment text for deletion';

                let user;
                let topic;
                let discussion;
                let comment;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicLib.topicCreate(agent, user.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                    discussion = (await discussionCreate(agent, user.id, topic.id, 'Test question?')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                    comment = (await topicCommentCreate(agent, user.id, topic.id, discussion.id, null, null, commentType, commentSubject, commentText)).body.data;
                });

                test('Success', async function () {
                    await topicCommentDelete(agent, user.id, topic.id, discussion.id, comment.id);
                    const comments = (await topicCommentList(agent, user.id, topic.id, discussion.id, null)).body.data;
                    assert.equal(comments.count.total, 1);
                    assert.equal(comments.rows.length, 1);
                    assert.isNotNull(comments.rows[0].deletedAt);
                });


                test('Success - delete own comment from Topic with read permissions', async function () {
                    const agentComment = request.agent(app);

                    const userComment = await userLib.createUserAndLogin(agentComment, null, null, null);

                    const comment = (await topicCommentCreate(agentComment, userComment.id, topic.id, discussion.id, null, null, commentType, commentSubject, commentText)).body.data;

                    await topicCommentDelete(agentComment, userComment.id, topic.id, discussion.id, comment.id);
                });

            });

        });
    })
});