'use strict';

var _topicCreate = function (agent, userId, visibility, categories, endsAt, description, hashtag, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics'
        .replace(':userId', userId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://citizenos.com')
        .send({
            visibility: visibility,
            categories: categories,
            description: description,
            endsAt: endsAt,
            hashtag: hashtag
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCreate = function (agent, userId, visibility, categories, endsAt, description, hashtag, callback) {
    _topicCreate(agent, userId, visibility, categories, endsAt, description, hashtag, 201, callback);
};

const _topicCreatePromised = async function (agent, userId, visibility, categories, endsAt, description, hashtag, expectedHttpCode) {
    const path = '/api/users/:userId/topics'
        .replace(':userId', userId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://citizenos.com')
        .send({
            visibility: visibility,
            categories: categories,
            description: description,
            endsAt: endsAt,
            hashtag: hashtag
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const topicCreatePromised = async function (agent, userId, visibility, categories, endsAt, description, hashtag) {
    return _topicCreatePromised(agent, userId, visibility, categories, endsAt, description, hashtag, 201);
};

var _topicRead = function (agent, userId, topicId, include, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .query({include: include})
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://citizenos.com')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicRead = function (agent, userId, topicId, include, callback) {
    _topicRead(agent, userId, topicId, include, 200, callback);
};

const _topicReadPromised = async function (agent, userId, topicId, include, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .query({include: include})
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://citizenos.com')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicReadPromised = async function (agent, userId, topicId, include) {
    return _topicReadPromised(agent, userId, topicId, include, 200);
};

var _topicReadUnauth = function (agent, topicId, include, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId'
        .replace(':topicId', topicId);

    agent
        .get(path)
        .query({include: include})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicReadUnauth = function (agent, topicId, include, callback) {
    _topicReadUnauth(agent, topicId, include, 200, callback);
};

var _topicUpdate = function (agent, userId, topicId, status, visibility, categories, endsAt, contact, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    var payload = {
        visibility: visibility,
        status: status
    };

    if (categories) {
        payload.categories = categories;
    }

    if (endsAt) {
        payload.endsAt = endsAt;
    }

    if (contact) {
        payload.contact = contact;
    }

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicUpdate = function (agent, userId, topicId, status, visibility, categories, endsAt, contact, callback) {
    _topicUpdate(agent, userId, topicId, status, visibility, categories, endsAt, contact, 200, callback);
};

const _topicUpdatePromised = async function (agent, userId, topicId, status, visibility, categories, endsAt, contact, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    // We should fix the undefined vs null problem here...
    // If I set it to null it should set to null
    // IF I it's undefined, it should not change the value and not pass to server

    const payload = {
        visibility: visibility,
        status: status
    };

    if (categories) {
        payload.categories = categories;
    }

    if (endsAt) {
        payload.endsAt = endsAt;
    }

    if (contact) {
        payload.contact = contact;
    }

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicUpdatePromised = async function (agent, userId, topicId, status, visibility, categories, endsAt, contact) {
    return _topicUpdatePromised(agent, userId, topicId, status, visibility, categories, endsAt, contact, 200);
};

var _topicUpdateField = function (agent, userId, topicId, topic, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    topic.id = topicId;

    agent
        .patch(path)
        .set('Content-Type', 'application/json')
        .send(topic)
        .expect(expectedHttpCode)
        .end(callback);
};

var topicUpdateField = function (agent, userId, topicId, topic, callback) {
    _topicUpdateField(agent, userId, topicId, topic, 204, callback);
};

// TODO: https://trello.com/c/ezqHssSL/124-refactoring-put-tokenjoin-to-be-part-of-put-topics-topicid
var _topicUpdateTokenJoin = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/tokenJoin'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send()
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicUpdateTokenJoin = function (agent, userId, topicId, callback) {
    _topicUpdateTokenJoin(agent, userId, topicId, 200, callback);
};

// TODO: Should be part of PUT /topics/:topicId
/**
 @deprecated Use _topicUpdateStatusPromised instead
 */
var _topicUpdateStatus = function (agent, userId, topicId, status, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    var payload = {
        status: status
    };

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 @deprecated Use topicUpdateStatusPromised instead
 */
var topicUpdateStatus = function (agent, userId, topicId, status, callback) {
    _topicUpdateStatus(agent, userId, topicId, status, 200, callback);
};

// TODO: Should be part of PUT /topics/:topicId
const _topicUpdateStatusPromised = function (agent, userId, topicId, status, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    const payload = {
        status: status
    };

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

// TODO: Should be part of PUT /topics/:topicId
const topicUpdateStatusPromised = async function (agent, userId, topicId, status) {
    return _topicUpdateStatusPromised(agent, userId, topicId, status, 200);
};

var _topicDelete = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicDelete = function (agent, userId, topicId, callback) {
    _topicDelete(agent, userId, topicId, 200, callback);
};

/**
 @deprecated Use _topicListPromised instead
 */
const _topicList = function (agent, userId, include, visibility, statuses, creatorId, hasVoted, expectedHttpCode, callback) {
    const path = '/api/users/:userId/topics'.replace(':userId', userId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .query({
            include: include,
            visibility: visibility,
            statuses: statuses,
            creatorId: creatorId,
            hasVoted: hasVoted
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 @deprecated Use topicListPromised instead
 */
const topicList = function (agent, userId, include, visibility, statuses, creatorId, hasVoted, callback) {
    _topicList(agent, userId, include, visibility, statuses, creatorId, hasVoted, 200, callback);
};

const _topicListPromised = async function (agent, userId, include, visibility, statuses, creatorId, hasVoted, expectedHttpCode) {
    const path = '/api/users/:userId/topics'.replace(':userId', userId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .query({
            include: include,
            visibility: visibility,
            statuses: statuses,
            creatorId: creatorId,
            hasVoted: hasVoted
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicListPromised = async function (agent, userId, include, visibility, statuses, creatorId, hasVoted) {
    return _topicListPromised(agent, userId, include, visibility, statuses, creatorId, hasVoted, 200);
};

var _topicsListUnauth = function (agent, statuses, categories, orderBy, offset, limit, sourcePartnerId, include, expectedHttpCode, callback) {
    var path = '/api/topics';

    agent
        .get(path)
        .query({
            statuses: statuses,
            categories: categories,
            orderBy: orderBy,
            offset: offset,
            limit: limit,
            sourcePartnerId: sourcePartnerId,
            include: include
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicsListUnauth = function (agent, status, categories, orderBy, offset, limit, sourcePartnerId, include, callback) {
    _topicsListUnauth(agent, status, categories, orderBy, offset, limit, sourcePartnerId, include, 200, callback);
};

/**
 * @deprecated Use _topicMemberUsersCreatePromised instead
 */
var _topicMemberUsersCreate = function (agent, userId, topicId, members, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .post(path)
        .send(members)
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://citizenos.com')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 * @deprecated Use topicMemberUsersCreatePromised instead
 */
var topicMemberUsersCreate = function (agent, userId, topicId, members, callback) {
    _topicMemberUsersCreate(agent, userId, topicId, members, 201, callback);
};

const _topicMemberUsersCreatePromised = async function (agent, userId, topicId, members, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .send(members)
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://citizenos.com')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMemberUsersCreatePromised = async function (agent, userId, topicId, members) {
    return _topicMemberUsersCreatePromised(agent, userId, topicId, members, 201);
};

var _topicMemberUsersUpdate = function (agent, userId, topicId, memberId, level, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    agent
        .put(path)
        .send({level: level})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMemberUsersUpdate = function (agent, userId, topicId, memberId, level, callback) {
    _topicMemberUsersUpdate(agent, userId, topicId, memberId, level, 200, callback);
};

var _topicMemberUsersDelete = function (agent, userId, topicId, memberId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMemberUsersDelete = function (agent, userId, topicId, memberId, callback) {
    _topicMemberUsersDelete(agent, userId, topicId, memberId, 200, callback);
};

var _topicMemberGroupsCreate = function (agent, userId, topicId, members, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/groups'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .post(path)
        .send(members)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);

};

var topicMemberGroupsCreate = function (agent, userId, topicId, members, callback) {
    _topicMemberGroupsCreate(agent, userId, topicId, members, 201, callback);
};

var _topicMemberGroupsUpdate = function (agent, userId, topicId, memberId, level, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/groups/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    agent
        .put(path)
        .send({level: level})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMemberGroupsUpdate = function (agent, userId, topicId, memberId, level, callback) {
    _topicMemberGroupsUpdate(agent, userId, topicId, memberId, level, 200, callback);
};

var _topicMemberGroupsDelete = function (agent, userId, topicId, memberId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/groups/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMemberGroupsDelete = function (agent, userId, topicId, memberId, callback) {
    _topicMemberGroupsDelete(agent, userId, topicId, memberId, 200, callback);
};

var _topicMembersList = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMembersList = function (agent, userId, topicId, callback) {
    _topicMembersList(agent, userId, topicId, 200, callback);
};

var _topicMembersUsersList = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMembersUsersList = function (agent, userId, topicId, callback) {
    _topicMembersUsersList(agent, userId, topicId, 200, callback);
};

var _topicMembersGroupsList = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/members/groups'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMembersGroupsList = function (agent, userId, topicId, callback) {
    _topicMembersGroupsList(agent, userId, topicId, 200, callback);
};

const _topicInviteUsersCreatePromised = async function (agent, userId, topicId, invites, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/invites/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .send(invites)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersCreatePromised = async function (agent, userId, topicId, invites) {
    return _topicInviteUsersCreatePromised(agent, userId, topicId, invites, 201);
};

const _topicInviteUsersDeletePromised = async function (agent, userId, topicId, inviteId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/invites/users/:inviteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':inviteId', inviteId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersDeletePromised = async function (agent, userId, topicId, inviteId) {
    return _topicInviteUsersDeletePromised(agent, userId, topicId, inviteId, 200);
};

const _topicInviteUsersReadPromised = async function (agent, topicId, inviteId, expectedHttpCode) {
    const path = '/api/topics/:topicId/invites/users/:inviteId'
        .replace(':topicId', topicId)
        .replace(':inviteId', inviteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersReadPromised = async function (agent, topicId, inviteId) {
    return _topicInviteUsersReadPromised(agent, topicId, inviteId, 200);
};

const _topicInviteUsersListPromised = function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/invites/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersListPromised = async function (agent, userId, topicId) {
    return _topicInviteUsersListPromised(agent, userId, topicId, 200);
};

const _topicInviteUsersAcceptPromised = function aync (agent, userId, topicId, inviteId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/invites/users/:inviteId/accept'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':inviteId', inviteId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersAcceptPromised = function async (agent, userId, topicId, inviteId) {
    return _topicInviteUsersAcceptPromised(agent, userId, topicId, inviteId, 201);
};

var _topicJoin = function (agent, tokenJoin, expectedHttpCode, callback) {
    var path = '/api/topics/join/:tokenJoin'
        .replace(':tokenJoin', tokenJoin);

    agent
        .post(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicJoin = function (agent, tokenJoin, callback) {
    _topicJoin(agent, tokenJoin, 200, callback);
};

var _topicReportCreate = function (agent, topicId, type, text, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/reports'
        .replace(':topicId', topicId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            type: type,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicReportCreate = function (agent, topicId, type, text, callback) {
    _topicReportCreate(agent, topicId, type, text, 200, callback);
};

var _topicReportRead = function (agent, topicId, reportId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/reports/:reportId'
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicReportRead = function (agent, topicId, reportId, callback) {
    _topicReportRead(agent, topicId, reportId, 200, callback);
};

var _topicReportModerate = function (agent, topicId, reportId, type, text, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/reports/:reportId/moderate'
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            type: type,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicReportModerate = function (agent, topicId, reportId, type, text, callback) {
    _topicReportModerate(agent, topicId, reportId, type, text, 200, callback);
};

var _topicReportsReview = function (agent, userId, topicId, reportId, text, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/reports/:reportId/review'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

    var body = {};
    if (text) {
        body.text = text;
    }

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(body)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicReportsReview = function (agent, userId, topicId, reportId, text, callback) {
    _topicReportsReview(agent, userId, topicId, reportId, text, 200, callback);
};

var _topicReportsResolve = function (agent, topicId, reportId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/reports/:reportId/resolve'
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicReportsResolve = function (agent, topicId, reportId, callback) {
    _topicReportsResolve(agent, topicId, reportId, 200, callback);
};

var _topicCommentCreate = function (agent, userId, topicId, parentId, parentVersion, type, subject, text, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
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
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentCreate = function (agent, userId, topicId, parentId, parentVersion, type, subject, text, callback) {
    _topicCommentCreate(agent, userId, topicId, parentId, parentVersion, type, subject, text, 201, callback);
};

var _topicCommentEdit = function (agent, userId, topicId, commentId, subject, text, type, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':commentId', commentId);

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            subject: subject,
            text: text,
            type: type
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentEdit = function (agent, userId, topicId, commentId, subject, text, type, callback) {
    _topicCommentEdit(agent, userId, topicId, commentId, subject, text, type, 200, callback);
};

var _topicCommentList = function (agent, userId, topicId, orderBy, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .query({orderBy: orderBy})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentList = function (agent, userId, topicId, orderBy, callback) {
    _topicCommentList(agent, userId, topicId, orderBy, 200, callback);
};

var _topicCommentListUnauth = function (agent, topicId, orderBy, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/comments'
        .replace(':topicId', topicId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .query({orderBy: orderBy})
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentListUnauth = function (agent, topicId, orderBy, callback) {
    _topicCommentListUnauth(agent, topicId, orderBy, 200, callback);
};

var _topicCommentDelete = function (agent, userId, topicId, commentId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':commentId', commentId);

    agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentDelete = function (agent, userId, topicId, commentId, callback) {
    _topicCommentDelete(agent, userId, topicId, commentId, 200, callback);
};

var _topicCommentReportCreate = function (agent, topicId, commentId, type, text, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/comments/:commentId/reports'
        .replace(':topicId', topicId)
        .replace(':commentId', commentId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            type: type,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentReportCreate = function (agent, topicId, commentId, type, text, callback) {
    _topicCommentReportCreate(agent, topicId, commentId, type, text, 200, callback);
};

var _topicCommentReportRead = function (agent, topicId, commentId, reportId, token, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/comments/:commentId/reports/:reportId'
        .replace(':topicId', topicId)
        .replace(':commentId', commentId)
        .replace(':reportId', reportId);

    agent
        .get(path)
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentReportRead = function (agent, topicId, commentId, reportId, token, callback) {
    _topicCommentReportRead(agent, topicId, commentId, reportId, token, 200, callback);
};

var _topicCommentReportModerate = function (agent, topicId, commentId, reportId, token, type, text, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/comments/:commentId/reports/:reportId/moderate'
        .replace(':topicId', topicId)
        .replace(':commentId', commentId)
        .replace(':reportId', reportId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send({
            type: type,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicCommentReportModerate = function (agent, topicId, commentId, reportId, token, type, text, callback) {
    _topicCommentReportModerate(agent, topicId, commentId, reportId, token, type, text, 200, callback);
};

var _topicAttachmentAdd = function (agent, userId, topicId, name, link, source, type, size, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/attachments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            name: name,
            link: link,
            source: source,
            type: type,
            size: size
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicAttachmentAdd = function (agent, userId, topicId, name, link, source, type, size, callback) {
    _topicAttachmentAdd(agent, userId, topicId, name, link, source, type, size, 200, callback);
};

var _topicAttachmentUpdate = function (agent, userId, topicId, attachmentId, name, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({name: name})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicAttachmentUpdate = function (agent, userId, topicId, attachmentId, name, callback) {
    _topicAttachmentUpdate(agent, userId, topicId, attachmentId, name, 200, callback);
};

var _topicAttachmentRead = function (agent, userId, topicId, attachmentId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);

};

var topicAttachmentRead = function (agent, userId, topicId, attachmentId, callback) {
    _topicAttachmentRead(agent, userId, topicId, attachmentId, 200, callback);
};

var _topicAttachmentReadUnauth = function (agent, topicId, attachmentId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/attachments/:attachmentId'
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicAttachmentReadUnauth = function (agent, topicId, attachmentId, callback) {
    _topicAttachmentReadUnauth(agent, topicId, attachmentId, 200, callback);
};

var _topicAttachmentDownload = function (agent, userId, topicId, attachmentId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    agent
        .get(path)
        .query({download: true})
        .then(callback);

};
//TODO: Missing test to use it?
var topicAttachmentDownload = function (agent, userId, topicId, attachmentId, callback) { //eslint-disable-line no-unused-vars
    _topicAttachmentDownload(agent, userId, topicId, attachmentId, 200, callback);
};

var _topicAttachmentDownloadUnauth = function (agent, topicId, attachmentId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/attachments/:attachmentId'
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    agent
        .get(path)
        .query({download: true})
        .then(callback);

};

//TODO: Missing test to use it?
var topicAttachmentDownloadUnauth = function (agent, topicId, attachmentId, callback) { //eslint-disable-line no-unused-vars
    _topicAttachmentDownloadUnauth(agent, topicId, attachmentId, 200, callback);
};

var _topicAttachmentDelete = function (agent, userId, topicId, attachmentId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicAttachmentDelete = function (agent, userId, topicId, attachmentId, callback) {
    _topicAttachmentDelete(agent, userId, topicId, attachmentId, 200, callback);
};

var _topicAttachmentList = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/attachments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicAttachmentList = function (agent, userId, topicId, callback) {
    _topicAttachmentList(agent, userId, topicId, 200, callback);
};

var _topicAttachmentListUnauth = function (agent, topicId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/attachments'
        .replace(':topicId', topicId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var _topicAttachmentSignDownload = function (agent, userId, uploadfilename, uploadfolder, downloadfilename, expectedHttpCode, callback) {
    var path = '/api/users/:userId/upload/signdownload'
        .replace(':userId', userId);

    agent
        .get(path)
        .query({
            filename: uploadfilename,
            folder: uploadfolder,
            downloadName: downloadfilename
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

//TODO: Missing test to use it?
var topicAttachmentSignDownload = function (agent, userId, uploadfilename, uploadfolder, downloadfilename, callback) { //eslint-disable-line no-unused-vars
    _topicAttachmentSignDownload(agent, userId, uploadfilename, uploadfolder, downloadfilename, 200, callback);
};

var topicAttachmentListUnauth = function (agent, topicId, callback) {
    _topicAttachmentListUnauth(agent, topicId, 200, callback);
};

var _topicMentionList = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/mentions'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMentionList = function (agent, userId, topicId, callback) {
    _topicMentionList(agent, userId, topicId, 200, callback);
};

var _topicMentionListUnauth = function (agent, topicId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/mentions'
        .replace(':topicId', topicId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMentionListUnauth = function (agent, topicId, callback) {
    _topicMentionListUnauth(agent, topicId, 200, callback);
};

var _topicMentionListTestUnauth = function (agent, topicId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/mentions'
        .replace(':topicId', topicId);

    agent
        .get(path)
        .query({test: 'error'})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicMentionListTestUnauth = function (agent, topicId, callback) {
    _topicMentionListTestUnauth(agent, topicId, 200, callback);
};

/**
 @deprecated use _topicVoteCreatePromised instead.
 */
var _topicVoteCreate = function (agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, expectedHttpCode, callback) {
    authType = authType || null;
    var path = '/api/users/:userId/topics/:topicId/votes'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            options: options,
            minChoices: minChoices,
            maxChoices: maxChoices,
            delegationIsAllowed: delegationIsAllowed,
            endsAt: endsAt,
            description: description,
            type: type,
            authType: authType
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 @deprecated use topicVoteCreate instead.
 */
var topicVoteCreate = function (agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, callback) {
    return _topicVoteCreate(agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, 201, callback);
};

const _topicVoteCreatePromised = async function (agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, expectedHttpCode) {
    authType = authType || null;
    const path = '/api/users/:userId/topics/:topicId/votes'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            options: options,
            minChoices: minChoices,
            maxChoices: maxChoices,
            delegationIsAllowed: delegationIsAllowed,
            endsAt: endsAt,
            description: description,
            type: type,
            authType: authType
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteCreatePromised = async function (agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType) {
    return _topicVoteCreatePromised(agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, 201);
};

/**
 @deprecated use _topicVoteReadPromised instead.
 */
var _topicVoteRead = function (agent, userId, topicId, voteId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/votes/:voteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 @deprecated use topicVoteReadPromised instead.
 */
var topicVoteRead = function (agent, userId, topicId, voteId, callback) {
    _topicVoteRead(agent, userId, topicId, voteId, 200, callback);
};

const _topicVoteReadPromised = async function (agent, userId, topicId, voteId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteReadPromised = async function (agent, userId, topicId, voteId) {
    return _topicVoteReadPromised(agent, userId, topicId, voteId, 200);
};


var _topicVoteUpdate = function (agent, userId, topicId, voteId, endsAt, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/votes/:voteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .put(path)
        .send({
            endsAt: endsAt
        })
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicVoteUpdate = function (agent, userId, topicId, voteId, endsAt, callback) {
    _topicVoteUpdate(agent, userId, topicId, voteId, endsAt, 200, callback);
};

var _topicVoteReadUnauth = function (agent, topicId, voteId, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/votes/:voteId'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicVoteReadUnauth = function (agent, topicId, voteId, callback) {
    _topicVoteReadUnauth(agent, topicId, voteId, 200, callback);
};

var _topicVoteVoteUnauth = function (agent, topicId, voteId, voteList, certificate, pid, phoneNumber, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/votes/:voteId'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    var data = {
        options: voteList,
        certificate: certificate, // Used only for Vote.AUTH_TYPES.hard
        pid: pid,
        phoneNumber: phoneNumber
    };

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicVoteVoteUnauth = function (agent, topicId, voteId, voteList, certificate, pid, phoneNumber, callback) {
    _topicVoteVoteUnauth(agent, topicId, voteId, voteList, certificate, pid, phoneNumber, 200, callback);
};

/**
 @deprecated Use _topicVoteVotePromised instead
 */
var _topicVoteVote = function (agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/votes/:voteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    var data = {
        options: voteList,
        certificate: certificate, // Used only for Vote.AUTH_TYPES.hard
        pid: pid,
        phoneNumber: phoneNumber,
        countryCode: countryCode
    };

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 @deprecated Use topicVoteVotePromised instead
 */
var topicVoteVote = function (agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, callback) {
    _topicVoteVote(agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, 200, callback);
};

const _topicVoteVotePromised = async function (agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    const data = {
        options: voteList,
        certificate: certificate, // Used only for Vote.AUTH_TYPES.hard
        pid: pid,
        phoneNumber: phoneNumber,
        countryCode: countryCode
    };

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteVotePromised = async function (agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode) {
    return _topicVoteVotePromised(agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, 200);
};

var _topicVoteStatus = function (agent, userId, topicId, voteId, token, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/votes/:voteId/status'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .query({token: token})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicVoteStatus = function (agent, topicId, voteId, userId, token, callback) {
    _topicVoteStatus(agent, topicId, voteId, userId, token, 200, callback);
};

const _topicVoteStatusPromised = async function (agent, userId, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/status'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .query({token: token})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteStatusPromised = async function (agent, userId, topicId, voteId, token) {
    return new Promise(function (resolve, reject) {
        const maxRetries = 20;
        const retryInterval = 1000; // milliseconds;

        let retries = 0;

        const statusInterval = setInterval(async function () {
            try {
                if (retries < maxRetries) {
                    retries++;

                    const topicVoteStatusResponse = await _topicVoteStatusPromised(agent, userId, topicId, voteId, token, 200);

                    if (topicVoteStatusResponse.body.status.code === 20001 && topicVoteStatusResponse.body.status.message === 'Signing in progress') {
                        // Signing is in progress, we shall journey on...
                    } else {
                        // Its HTTP 200 and NOT 20001 - Signing in progress, so we have our result, WE'RE DONE HERE
                        clearInterval(statusInterval);

                        return resolve(topicVoteStatusResponse);
                    }
                } else {
                    clearInterval(statusInterval);

                    return reject(new Error(`topicVoteStatus maximum retry limit ${maxRetries} reached!`));
                }
            } catch (err) {
                // Whatever blows, stop polling
                clearInterval(statusInterval);

                return reject(err);
            }

        }, retryInterval);
    });
};

var _topicVoteStatusUnauth = function (agent, topicId, voteId, token, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/votes/:voteId/status'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .query({token: token})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

//TODO: Missing test to use it?
var topicVoteStatusUnauth = function (agent, topicId, voteId, userId, token, callback) { //eslint-disable-line no-unused-vars
    _topicVoteStatusUnauth(agent, topicId, voteId, token, 200, callback);
};

var _topicVoteSignUnauth = function (agent, topicId, voteId, voteList, certificate, pid, token, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/votes/:voteId/sign'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    var data = {
        options: voteList,
        certificate: certificate, // Used only for Vote.AUTH_TYPES.hard
        pid: pid,
        token: token,
        signatureValue: 'asdasdas' //TODO get propersignature
    };

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

//TODO: Missing test to use it?
var topicVoteSignUnauth = function (agent, topicId, voteId, voteList, certificate, pid, token, callback) { //eslint-disable-line no-unused-vars
    _topicVoteSignUnauth(agent, topicId, voteId, voteList, certificate, pid, token, 200, callback);
};

var _topicVoteDownloadBdocFinal = function (agent, userId, topicId, voteId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/final'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .get(path)
        .send()
        .expect(expectedHttpCode)
        .end(callback);
};

//TODO: Missing test to use it?
var topicVoteDownloadBdocFinal = function (agent, userId, topicId, voteId, callback) { //eslint-disable-line no-unused-vars
    return _topicVoteDownloadBdocFinal(agent, userId, topicId, voteId, 200, callback);
};

var _topicVoteDownloadBdocFinalUnauth = function (agent, topicId, voteId, token, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/final'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .get(path)
        .query({token: token})
        .send()
        .expect(expectedHttpCode)
        .end(callback);
};

//TODO: Missing test to use it?
var topicVoteDownloadBdocFinalUnauth = function (agent, topicId, voteId, token, callback) { //eslint-disable-line no-unused-vars
    return _topicVoteDownloadBdocFinalUnauth(agent, topicId, voteId, token, 200, callback);
};

var _topicVoteDownloadBdocUserUnauth = function (agent, topicId, voteId, token, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/user'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    agent
        .get(path)
        .query({token: token})
        .send()
        .expect(expectedHttpCode)
        .end(callback);
};

//TODO: Missing test to use it?
var topicVoteDownloadBdocUserUnauth = function (agent, topicId, voteId, token, callback) { //eslint-disable-line no-unused-vars
    return _topicVoteDownloadBdocUserUnauth(agent, topicId, voteId, token, 200, callback);
};


const _topicVoteDownloadBdocUserPromised = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/user'
        .replace(':userId', 'self')
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .query({token: token})
        .send()
        .expect(expectedHttpCode)
        .expect('Content-Type', 'application/vnd.etsi.asic-e+zip')
        .expect('Content-Disposition', 'attachment; filename=vote.bdoc');
};

const topicVoteDownloadBdocUserPromised = async function (agent, topicId, voteId, token) {
    return _topicVoteDownloadBdocUserPromised(agent, topicId, voteId, token, 200);
};

const _topicVoteDownloadBdocFinalPromised = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/final'
        .replace(':userId', 'self')
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .query({token: token})
        .send()
        .expect(expectedHttpCode)
        .expect('Content-Type', 'application/vnd.etsi.asic-e+zip')
        .expect('Content-Disposition', 'attachment; filename=final.bdoc');
};

const topicVoteDownloadBdocFinalPromised = async function (agent, topicId, voteId, token) {
    return _topicVoteDownloadBdocFinalPromised(agent, topicId, voteId, token, 200);
};

const _topicVoteDelegationCreatePromised = async function (agent, userId, topicId, voteId, toUserId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/delegations'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({userId: toUserId})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteDelegationCreatePromised = async function (agent, userId, topicId, voteId, toUserId) {
    return _topicVoteDelegationCreatePromised(agent, userId, topicId, voteId, toUserId, 200);
};

const _topicVoteDelegationDeletePromised = function async (agent, userId, topicId, voteId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/delegations'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteDelegationDeletePromised = async function (agent, userId, topicId, voteId) {
    return _topicVoteDelegationDeletePromised(agent, userId, topicId, voteId, 200);
};

var _topicCommentVotesCreate = function (agent, topicId, commentId, value, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/comments/:commentId/votes'
        .replace(':topicId', topicId)
        .replace(':commentId', commentId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({value: value})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var _topicEventCreate = function (agent, userId, topicId, subject, text, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/events'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            subject: subject,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicEventCreate = function (agent, userId, topicId, subject, text, callback) {
    _topicEventCreate(agent, userId, topicId, subject, text, 201, callback);
};

var _topicEventCreateUnauth = function (agent, topicId, token, subject, text, expectedHttpCode, callback) {
    var path = '/api/topics/:topicId/events'
        .replace(':topicId', topicId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send({
            subject: subject,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicEventCreateUnauth = function (agent, topicId, token, subject, text, callback) {
    _topicEventCreateUnauth(agent, topicId, token, subject, text, 201, callback);
};

var _topicEventList = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/events'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicEventList = function (agent, userId, topicId, callback) {
    _topicEventList(agent, userId, topicId, 200, callback);
};

var _topicEventDelete = function (agent, userId, topicId, eventId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/events/:eventId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':eventId', eventId);

    agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicEventDelete = function (agent, userId, topicId, eventId, callback) {
    _topicEventDelete(agent, userId, topicId, eventId, 200, callback);
};

var topicCommentVotesCreate = function (agent, topicId, commentId, value, callback) {
    _topicCommentVotesCreate(agent, topicId, commentId, value, 200, callback);
};

var _topicFavouriteCreate = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/pin'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .post(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicFavouriteCreate = function (agent, userId, topicId, callback) {
    _topicFavouriteCreate(agent, userId, topicId, 200, callback);
};

var _topicFavouriteDelete = function (agent, userId, topicId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/topics/:topicId/pin'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var topicFavouriteDelete = function (agent, userId, topicId, callback) {
    _topicFavouriteDelete(agent, userId, topicId, 200, callback);
};

var _parsePadUrl = function (padUrl) {
    var matches = padUrl.match(/(https?:\/\/[^/]*)(.*)/);

    if (!matches || matches.length < 3) {
        throw Error('Could not pare Pad url', padUrl, matches);
    }

    return {
        host: matches[1],
        path: matches[2]
    };
};

module.exports.topicCreate = topicCreate;
module.exports.topicRead = topicRead;
module.exports.topicUpdate = topicUpdate;
module.exports.topicDelete = topicDelete;

module.exports.topicCommentCreate = topicCommentCreate;

module.exports.topicMemberGroupsCreate = topicMemberGroupsCreate;
module.exports.topicMemberUsersCreate = topicMemberUsersCreate;

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
const async = app.get('async');
const fs = app.get('fs');
const SevenZip = app.get('SevenZip');
const etherpadClient = app.get('etherpadClient');
const cosEtherpad = app.get('cosEtherpad');
const jwt = app.get('jwt');
const cosJwt = app.get('cosJwt');
const moment = app.get('moment');
const validator = app.get('validator');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const groupLib = require('./group');
const authLib = require('./auth');

const User = models.User;
const UserConnection = models.UserConnection;

const Partner = models.Partner;

const Moderator = models.Moderator;

const GroupMember = models.GroupMember;

const Topic = models.Topic;
const TopicMemberUser = models.TopicMemberUser;
const TopicMemberGroup = models.TopicMemberGroup;
const TopicInviteUser = models.TopicInviteUser;

const Comment = models.Comment;

const Report = models.Report;

const Vote = models.Vote;
const VoteOption = models.VoteOption;

// API - /api/users*
suite('Users', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .finally(done);
    });

    // API - /api/users/:userId/topics*
    suite('Topics', function () {

        suite('Create', function () {
            var agent = request.agent(app);
            var email = 'test_topicc_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var user;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) return done(err);
                    user = res;
                    done();
                });
            });

            test('Success', function (done) {
                topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                    if (err) return done(err);
                    var topic = res.body.data;
                    assert.property(topic, 'id');
                    assert.equal(topic.creator.id, user.id);
                    assert.equal(topic.visibility, Topic.VISIBILITY.private);
                    assert.equal(topic.status, Topic.STATUSES.inProgress);
                    assert.property(topic, 'padUrl');

                    done();
                });
            });

            test('Success - non-default visibility', function (done) {
                topicCreate(agent, user.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null, function (err, res) {
                    if (err) return done(err);
                    var topic = res.body.data;
                    assert.equal(topic.visibility, Topic.VISIBILITY.public);
                    done();
                });
            });

            test('Success - description', function (done) {
                var description = '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><script>alert("owned!");</script><br><br>script<br><br></body></html>';

                topicCreate(agent, user.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, description, null, function (err, res) {
                    if (err) return done(err);
                    var topic = res.body.data;
                    etherpadClient
                        .getHTMLAsync({padID: topic.id})
                        .then(function (getHtmlResult) {
                            assert.equal(getHtmlResult.html, '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><br><br>script<br><br><br></body></html>');
                        })
                        .then(function () {
                            topicRead(agent, user.id, topic.id, null, function (err, res) {
                                if (err) return done(err);

                                var topicRead = res.body.data;
                                assert.equal(topicRead.title, 'H1');
                                assert.equal(topicRead.description, '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><br><br>script<br><br><br></body></html>');

                                done();
                            });
                        })
                        .catch(done);
                });
            });

            test('Success - create with categories', function (done) {
                var categories = [Topic.CATEGORIES.work, Topic.CATEGORIES.varia, Topic.CATEGORIES.transport];

                topicCreate(agent, user.id, Topic.VISIBILITY.public, categories, null, null, null, function (err, res) {
                    if (err) return done(err);
                    var topic = res.body.data;
                    assert.deepEqual(topic.categories, categories);
                    done();
                });
            });

            test('Success - valid hashtag', function (done) {
                var hashtag = 'abcdefghijklmnopqrstuvxyzabcdefghijklmnopqrstuvxyzabcdefghi';
                topicCreate(agent, user.id, null, null, null, null, hashtag, function (err, res) {
                    if (err) return done(err);
                    var topic = res.body.data;
                    assert.equal(topic.hashtag, hashtag);
                    done();
                });
            });

            test('Success - empty hashtag', function (done) {
                var hashtag = '';
                topicCreate(agent, user.id, null, null, null, null, hashtag, function (err, res) {
                    if (err) return done(err);
                    var topic = res.body.data;
                    assert.equal(topic.hashtag, null);
                    done();
                });
            });

            test('Success - Replace invalid characters in hashtag', function (done) {
                var hashtag = '      #abc   defgh ijk.lmn,opqrstuvxyzabcdefghij:klmnopqrstuvxyzabcdefghi        ';
                topicCreate(agent, user.id, null, null, null, null, hashtag, function (err, res) {
                    if (err) return done(err);
                    var topic = res.body.data;
                    assert.equal(topic.hashtag, 'abcdefghijklmnopqrstuvxyzabcdefghijklmnopqrstuvxyzabcdefghi');
                    done();
                });
            });

            test('Fail - 40100', function (done) {
                _topicCreate(request.agent(app), user.id, Topic.VISIBILITY.public, null, null, null, null, 401, function (err) {
                    if (err) return done(err);
                    done();
                });
            });

            test('Fail - 40000 - invalid hashtag', function (done) {
                _topicCreate(agent, user.id, null, null, null, null, 'üüüüüüüüüüüüüüüüüüüüüüüüüüüüüüü', 400, function (err, res) {
                    if (err) return done(err);

                    var expectedBody = {
                        status: {
                            code: 40000
                        },
                        errors: {
                            hashtag: 'Maximum of 59 bytes allowed. Currently 62 bytes'
                        }
                    };

                    assert.deepEqual(res.body, expectedBody);

                    done();
                });
            });
        });

        suite('Read', function () {

            var agent = request.agent(app);
            var email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var topicCategories = [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.communities];

            var user;
            var topic;
            var partner;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) return done(err);

                    user = res;

                    topicCreate(agent, user.id, Topic.VISIBILITY.private, topicCategories, null, null, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        //FIXME: This is a hack. Actually we should have topicCreate that enables setting the Partner headers and sourcePartnerObjectId but not sure what the interface should look like
                        Partner
                            .create({
                                website: 'notimportant',
                                redirectUriRegexp: 'notimportant'
                            })
                            .then(function (res) {
                                partner = res;

                                return Topic
                                    .update(
                                        {
                                            sourcePartnerId: partner.id,
                                            sourcePartnerObjectId: cosUtil.randomString()
                                        },
                                        {
                                            where: {
                                                id: topic.id
                                            },
                                            returning: true
                                        }
                                    );
                            })
                            .then(function (resTopic) {
                                var updatedTopic = resTopic[1][0].toJSON();

                                topic.sourcePartnerId = updatedTopic.sourcePartnerId;
                                topic.sourcePartnerObjectId = updatedTopic.sourcePartnerObjectId;
                                topic.updatedAt = updatedTopic.updatedAt.toJSON();

                                return done();
                            })
                            .catch(done);
                    });
                });
            });


            test('Success', function (done) {
                topicRead(agent, user.id, topic.id, null, function (err, res) {
                    if (err) return done(err);

                    var topicRead = res.body.data;

                    // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                    var expectedTopic = _.cloneDeep(topic);
                    expectedTopic.members = {
                        users: {
                            count: 1
                        },
                        groups: {
                            count: 0
                        }
                    };
                    expectedTopic.creator = user.toJSON();

                    delete expectedTopic.creator.email; // Email url is not returned by Topic read, we don't need it
                    delete expectedTopic.creator.imageUrl; // Image url is not returned by Topic read, we don't need it
                    delete expectedTopic.creator.language; // Language is not returned by Topic read, we don't need it

                    expectedTopic.permission = {
                        level: TopicMemberUser.LEVELS.admin
                    };

                    // The difference from create result is that there is no voteId
                    assert.isNull(topicRead.voteId);
                    delete topicRead.voteId;

                    // Check the padUrl, see if token is there. Delete later, as tokens are not comparable due to different expiry timestamps
                    // TODO: May want to decrypt the tokens and compare data
                    assert.match(topicRead.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                    assert.match(expectedTopic.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                    delete topicRead.padUrl;
                    delete expectedTopic.padUrl;

                    assert.deepEqual(topicRead, expectedTopic);

                    done();
                });
            });

            test('Fail - Unauthorized', function (done) {
                _topicRead(request.agent(app), user.id, topic.id, null, 401, function (err) {
                    if (err) return done(err);
                    done();
                });
            });

            suite('With Vote', function () {

                test('Success - no vote created', function (done) {
                    topicRead(agent, user.id, topic.id, 'vote', function (err, res) {
                        if (err) return done(err);

                        var topicRead = res.body.data;

                        // The difference from create result "members" and "creator" are extended. Might consider changing in the future..
                        var expectedTopic = _.cloneDeep(topic);
                        expectedTopic.members = {
                            users: {
                                count: 1
                            },
                            groups: {
                                count: 0
                            }
                        };
                        expectedTopic.creator = user.toJSON();
                        delete expectedTopic.creator.email; // Email url is not returned by Topic read, we don't need it
                        delete expectedTopic.creator.imageUrl; // Image url is not returned by Topic read, we don't need it
                        delete expectedTopic.creator.language; // Language is not returned by Topic read, we don't need it
                        expectedTopic.permission = {
                            level: TopicMemberUser.LEVELS.admin
                        };

                        // The difference from create result is that there is no voteId
                        assert.isNull(topicRead.voteId);
                        delete topicRead.voteId;

                        // Check the padUrl, see if token is there. Delete later, as tokens are not comparable due to different expiry timestamps
                        // TODO: May want to decrypt the tokens and compare data
                        assert.match(topicRead.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                        assert.match(expectedTopic.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                        delete topicRead.padUrl;
                        delete expectedTopic.padUrl;

                        assert.deepEqual(topicRead, expectedTopic);

                        done();
                    });
                });

                test('Success - vote created', function (done) {

                    var options = [
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
                    topicVoteCreate(agent, user.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var voteCreated = res.body.data;
                        topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp, function (err) {
                            if (err) return done(err);
                            topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting, function (err) {
                                if (err) return done(err);
                                topicRead(agent, user.id, topic.id, 'vote', function (err, res) {
                                    if (err) return done(err);

                                    var topicRead = res.body.data;
                                    assert.equal(topicRead.status, Topic.STATUSES.voting);

                                    // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                                    var expectedTopic = _.cloneDeep(topicRead);

                                    expectedTopic.members = {
                                        users: {
                                            count: 1
                                        },
                                        groups: {
                                            count: 0
                                        }
                                    };

                                    expectedTopic.creator = user.toJSON();
                                    delete expectedTopic.creator.email; // Email url is not returned by Topic read, we don't need it
                                    delete expectedTopic.creator.imageUrl; // Image url is not returned by Topic read, we don't need it
                                    delete expectedTopic.creator.language; // Language is not returned by Topic read, we don't need it
                                    expectedTopic.permission = {
                                        level: TopicMemberUser.LEVELS.admin
                                    };
                                    topicVoteRead(agent, user.id, topic.id, voteCreated.id, function (err, res) {
                                        if (err) return done(err);

                                        var voteExpected = res.body.data;

                                        assert.deepEqual(topicRead.vote, voteExpected);
                                        assert.deepEqual(topicRead, expectedTopic);
                                        assert.equal(topicRead.voteId, topicRead.vote.id);

                                        done();
                                    });

                                });
                            });
                        });
                    });
                });

                suite('After voting', function () {
                    this.timeout(38000); //eslint-disable-line no-invalid-this

                    var vote;
                    var creator;
                    var voteTopic;
                    var voteAgent = request.agent(app);

                    var voteEmail = 'test_topicr_vote_' + new Date().getTime() + '@test.ee';
                    var votePassword = 'testPassword123';
                    var voteTopicCategories = [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.communities];

                    var options = [
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

                    suiteSetup(function (done) {
                        userLib.createUserAndLogin(voteAgent, voteEmail, votePassword, null, function (err, res) {
                            if (err) return done(err);
                            creator = res;
                            topicCreate(voteAgent, creator.id, Topic.VISIBILITY.private, voteTopicCategories, null, null, null, function (err, res) {
                                if (err) return done(err);
                                voteTopic = res.body.data;

                                topicVoteCreate(voteAgent, creator.id, voteTopic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard, function (err, res) {
                                    if (err) return done(err);

                                    vote = res.body.data;

                                    topicVoteRead(voteAgent, creator.id, voteTopic.id, vote.id, function (err, res) {
                                        if (err) return done(err);
                                        vote = res.body.data;
                                        done();
                                    });
                                });

                            });

                        });
                    });

                    teardown(function (done) {
                        UserConnection
                            .destroy({
                                where: {
                                    connectionId: UserConnection.CONNECTION_IDS.esteid,
                                    connectionUserId: ['PNOEE-60001019906']
                                },
                                force: true
                            })
                            .then(function () {
                                done();
                            })
                            .catch(done);
                    });

                    test('Success', function (done) {
                        var phoneNumber = '+37200000766';
                        var pid = '60001019906';

                        var voteList = [
                            {
                                optionId: vote.options.rows[0].id
                            }
                        ];

                        topicVoteVote(voteAgent, creator.id, voteTopic.id, vote.id, voteList, null, pid, phoneNumber, null, function (err, res) {
                            if (err) return done(err);

                            var response = res.body;

                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);

                            var bdocpathExpected = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user'
                                .replace(':topicId', voteTopic.id)
                                .replace(':voteId', vote.id);
                            var called = 0;
                            var replied = 0;

                            var getStatus = setInterval(function () {
                                if (called <= replied) {
                                    called++;
                                    topicVoteStatus(voteAgent, creator.id, voteTopic.id, vote.id, response.data.token, function (err, res) {
                                        if (err) return done(err);

                                        replied++;

                                        var statusresponse = res.body;
                                        if (statusresponse.status.code === 20001 && statusresponse.status.message === 'Signing in progress') {
                                            // TODO: Interesting empty if block
                                        } else {
                                            clearInterval(getStatus);

                                            assert.equal(statusresponse.status.code, 20002);
                                            assert.property(statusresponse.data, 'bdocUri');
                                            var bdocUri = statusresponse.data.bdocUri;

                                            var token = bdocUri.slice(bdocUri.indexOf('token=') + 6);
                                            var tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
                                            assert.equal(tokenData.userId, creator.id);
                                            assert.equal(tokenData.aud[0], 'GET ' + bdocpathExpected);

                                            topicVoteRead(voteAgent, creator.id, voteTopic.id, vote.id, function (err, res) {
                                                if (err) return done(err);

                                                var voteExpected = res.body.data;
                                                topicRead(voteAgent, creator.id, voteTopic.id, 'vote', function (err, res) {
                                                    if (err) return done(err);

                                                    var topicRead = res.body.data;
                                                    assert.equal(topicRead.status, Topic.STATUSES.voting);

                                                    // Check the padUrl, see if token is there. Delete later, as tokens are not comparable due to different expiry timestamps
                                                    // TODO: May want to decrypt the tokens and compare data
                                                    assert.match(topicRead.vote.downloads.bdocVote, /http(s)?:\/\/.*\/api\/users\/self\/topics\/[a-zA-Z0-9-]{36}\/votes\/[a-zA-Z0-9-]{36}\/downloads\/bdocs\/user\?token=.*/);
                                                    assert.match(voteExpected.downloads.bdocVote, /http(s)?:\/\/.*\/api\/users\/self\/topics\/[a-zA-Z0-9-]{36}\/votes\/[a-zA-Z0-9-]{36}\/downloads\/bdocs\/user\?token=.*/);
                                                    delete topicRead.vote.downloads.bdocVote;
                                                    delete voteExpected.downloads.bdocVote;

                                                    assert.deepEqual(topicRead.vote, voteExpected);

                                                    done();
                                                });
                                            });
                                        }
                                    });
                                }
                            }, 1000);
                        });
                    });
                });
            });

            suite('Authorization', function () {

                suite('Topic visibility = private', function () {
                    var agentCreator = request.agent(app);
                    var agentUser = request.agent(app);
                    var agentUser2 = request.agent(app);

                    var creator;
                    var user;
                    var user2;
                    var topic;
                    var group;

                    setup(function (done) {
                        async
                            .parallel(
                                [
                                    function (cb) {
                                        userLib.createUserAndLogin(agentCreator, null, null, null, cb);
                                    },
                                    function (cb) {
                                        userLib.createUserAndLogin(agentUser, null, null, null, cb);
                                    },
                                    function (cb) {
                                        userLib.createUserAndLogin(agentUser2, null, null, null, cb);
                                    }
                                ]
                                , function (err, results) {
                                    if (err) return done(err);
                                    creator = results[0];
                                    user = results[1];
                                    user2 = results[2];

                                    async
                                        .parallel(
                                            [
                                                function (cb) {
                                                    groupLib.create(agentCreator, creator.id, 'Group', null, null, cb);
                                                },
                                                function (cb) {
                                                    topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, null, null, cb);
                                                }
                                            ]
                                            , function (err, results) {
                                                if (err) return done(err);
                                                group = results[0].body.data;
                                                topic = results[1].body.data;

                                                // Add Group to Topic members and User to that Group
                                                var memberGroup = {
                                                    groupId: group.id,
                                                    level: TopicMemberGroup.LEVELS.read
                                                };

                                                var memberUser = {
                                                    userId: user.id,
                                                    level: GroupMember.LEVELS.read
                                                };

                                                async
                                                    .parallel(
                                                        [
                                                            function (cb) {
                                                                topicMemberGroupsCreate(agentCreator, creator.id, topic.id, memberGroup, cb);
                                                            },
                                                            function (cb) {
                                                                groupLib.membersCreate(agentCreator, creator.id, group.id, memberUser, cb);
                                                            }
                                                        ],
                                                        done
                                                    );
                                            }
                                        );
                                }
                            );
                    });

                    test('Success - User is a member of a Group that has READ access', function (done) {
                        topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                            if (err) return done(err);

                            var topic = res.body.data;

                            assert.isUndefined(topic.creator.email);

                            var padUrl = topic.padUrl;
                            var parsedUrl = _parsePadUrl(padUrl);
                            var padAgent = request.agent(parsedUrl.host);

                            // TODO: PADREAD: Move to reusable code
                            padAgent
                                .get(parsedUrl.path)
                                .expect(302)
                                .end(function (err, res) {
                                    if (err) return done(err);

                                    var redirectUrl = res.headers.location;
                                    assert.match(redirectUrl, /^\/p\/r\.[\w]{32}/);

                                    padAgent
                                        .get(redirectUrl)
                                        .expect(200)
                                        .expect('Content-Type', /html/)
                                        .end(done); // TODO: may want to check if body contains something to confirm it's the read only page
                                });
                        });
                    });

                    test('Success - User has direct EDIT access, Group membership revoked', function (done) {
                        groupLib.membersDelete(agentCreator, creator.id, group.id, user.id, function (err) {
                            if (err) return done(err);

                            var topicMemberUser = {
                                userId: user.id,
                                level: TopicMemberUser.LEVELS.edit
                            };

                            topicMemberUsersCreate(agentCreator, creator.id, topic.id, topicMemberUser, function (err) {
                                if (err) return done(err);

                                topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                                    if (err) return done(err);

                                    var topic = res.body.data;

                                    assert.equal(topic.permission.level, topicMemberUser.level);

                                    // TODO: PADREAD: Move to reusable code
                                    var padUrl = topic.padUrl;
                                    var parsedUrl = _parsePadUrl(padUrl);
                                    var padAgent = request.agent(parsedUrl.host);

                                    padAgent
                                        .get(parsedUrl.path)
                                        .expect(200)
                                        .expect('Content-Type', /html/)
                                        .end(done);
                                });
                            });
                        });
                    });

                    test('Success - User has ADMIN access directly and READ via Group', function (done) {
                        var topicMemberUser = {
                            userId: user.id,
                            level: TopicMemberUser.LEVELS.admin
                        };
                        topicMemberUsersCreate(agentCreator, creator.id, topic.id, topicMemberUser, function (err) {
                            if (err) return done(err);

                            topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                                if (err) return done(err);

                                var topic = res.body.data;

                                assert.equal(topic.permission.level, topicMemberUser.level);
                                assert.isUndefined(topic.creator.email);

                                // TODO: PADREAD: Move to reusable code
                                var padUrl = topic.padUrl;
                                var parsedUrl = _parsePadUrl(padUrl);
                                var padAgent = request.agent(parsedUrl.host);

                                padAgent
                                    .get(parsedUrl.path)
                                    .expect(200)
                                    .expect('Content-Type', /html/)
                                    .end(done);
                            });
                        });
                    });

                    test('Success - User has Moderator permissions', function (done) {
                        var partner;
                        Partner
                            .create({
                                website: 'notimportant',
                                redirectUriRegexp: 'notimportant'
                            })
                            .then(function (res) {
                                partner = res;

                                return Topic
                                    .update(
                                        {
                                            sourcePartnerId: partner.id
                                        },
                                        {
                                            where: {
                                                id: topic.id
                                            }
                                        }
                                    );
                            })
                            .then(function () {
                                return Moderator
                                    .create({
                                        userId: user.id,
                                        partnerId: partner.id
                                    });
                            })
                            .then(function () {
                                topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                                    if (err) return done(err);

                                    var topic = res.body.data;
                                    assert.equal(topic.creator.email, creator.email);

                                    done();
                                });
                            });
                    });

                    test('Fail - Forbidden - User has Global Moderator permissions access to private topic', function (done) {

                        Moderator
                            .create({
                                userId: user2.id
                            })
                            .then(function () {
                                _topicRead(agentUser2, user2.id, topic.id, null, 403, function (err, res) {
                                    if (err) return done(err);

                                    var expectedResult = {
                                        status: {
                                            code: 40300,
                                            message: 'Insufficient permissions'
                                        }
                                    };
                                    var resultMessage = res.body;
                                    assert.deepEqual(resultMessage, expectedResult);

                                    done();
                                });
                            });
                    });

                    test('Fail - Forbidden - User membership was revoked from Group', function (done) {
                        groupLib.membersDelete(agentCreator, creator.id, group.id, user.id, function (err) {
                            if (err) return done(err);

                            _topicRead(agentUser, user.id, topic.id, null, 403, function (err) {
                                if (err) return done(err);

                                Topic
                                    .findOne({
                                        where: {id: topic.id}
                                    })
                                    .then(function (topic) {
                                        // TODO: PADREAD: Move to reusable code
                                        var padUrl = cosEtherpad.getUserAccessUrl(topic, user.id, user.name, user.language);
                                        var parsedUrl = _parsePadUrl(padUrl);
                                        var padAgent = request.agent(parsedUrl.host);

                                        padAgent
                                            .get(parsedUrl.path)
                                            .expect(401)
                                            .end(done);
                                    });
                            });
                        });
                    });

                    test('Fail - Forbidden - Group access to Topic was revoked', function (done) {
                        topicMemberGroupsDelete(agentCreator, creator.id, topic.id, group.id, function (err) {
                            if (err) return done(err);

                            _topicRead(agentUser, user.id, topic.id, null, 403, function (err) {
                                if (err) return done(err);

                                Topic
                                    .findOne({
                                        where: {id: topic.id}
                                    })
                                    .then(function (topic) {
                                        var padUrl = cosEtherpad.getUserAccessUrl(topic, user.id, user.name, user.language);
                                        var parsedUrl = _parsePadUrl(padUrl);
                                        var padAgent = request.agent(parsedUrl.host);

                                        padAgent
                                            .get(parsedUrl.path)
                                            .expect(401)
                                            .end(done);
                                    });
                            });
                        });
                    });

                    test('Fail - User is moderator has no permissions on topic', function (done) {
                        var partner;
                        Partner
                            .create({
                                website: 'notimportant',
                                redirectUriRegexp: 'notimportant'
                            })
                            .then(function (res) {
                                partner = res;
                            })
                            .then(function () {
                                return Moderator
                                    .create({
                                        userId: user.id,
                                        partnerId: partner.id
                                    });
                            })
                            .then(function () {
                                topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                                    if (err) return done(err);

                                    var topic = res.body.data;

                                    assert.isUndefined(topic.creator.email);

                                    done();
                                });
                            });
                    });
                });

                suite('Topic visibility = public', function () {
                    var agentCreator = request.agent(app);
                    var agentUser = request.agent(app);

                    var creator;
                    var user;
                    var topic;

                    setup(function (done) {
                        async
                            .parallel(
                                [
                                    function (cb) {
                                        userLib.createUserAndLogin(agentCreator, null, null, null, cb);
                                    },
                                    function (cb) {
                                        userLib.createUserAndLogin(agentUser, null, null, null, cb);
                                    }
                                ],
                                function (err, results) {
                                    if (err) return done(err);

                                    creator = results[0];
                                    user = results[1];

                                    topicCreate(agentCreator, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.taxes, Topic.CATEGORIES.transport], null, null, null, function (err, res) {
                                        if (err) return done(err);

                                        topic = res.body.data;

                                        done();
                                    });
                                }
                            );
                    });

                    test('Success - User can read public Topic', function (done) {
                        topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                            if (err) return done(err);

                            var topic = res.body.data;

                            var padUrl = topic.padUrl;
                            var parsedUrl = _parsePadUrl(padUrl);
                            var padAgent = request.agent(parsedUrl.host);

                            // TODO: PADREAD: Move to reusable code
                            padAgent
                                .get(parsedUrl.path)
                                .expect(302)
                                .end(function (err, res) {
                                    if (err) return done(err);

                                    var redirectUrl = res.headers.location;
                                    assert.match(redirectUrl, /^\/p\/r\.[\w]{32}/);

                                    padAgent
                                        .get(redirectUrl)
                                        .expect(200)
                                        .expect('Content-Type', /html/)
                                        .end(done); // TODO: may want to check if body contains something to confirm it's the read only page
                                });
                        });
                    });

                    test('Success - User has Global Moderator permissions', function (done) {
                        Moderator
                            .create({
                                userId: user.id
                            })
                            .then(function () {
                                topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                                    if (err) return done(err);

                                    var topic = res.body.data;
                                    assert.equal(topic.creator.email, creator.email);

                                    done();
                                });
                            });
                    });

                });
            });

        });

        suite('Update', function () {

            var agent = request.agent(app);
            var email = 'test_topicu_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';

            var topicStatusNew = Topic.STATUSES.inProgress;
            var topicVisibilityNew = Topic.VISIBILITY.public;
            var topicEndsAtNew = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);

            var user;
            var topic;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) return done(err);
                    user = res;
                    done();
                });
            });

            setup(function (done) {
                topicCreate(agent, user.id, null, null, null, null, 'testtag', function (err, res) {
                    if (err) return done(err);
                    topic = res.body.data;
                    done();
                });
            });

            test('Success', function (done) {
                topicUpdate(agent, user.id, topic.id, topicStatusNew, topicVisibilityNew, null, topicEndsAtNew, null, function (err) {
                    if (err) return done(err);

                    topicRead(agent, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var topicNew = res.body.data;

                        assert.equal(topicNew.status, topicStatusNew);
                        assert.equal(topicNew.visibility, topicVisibilityNew);
                        assert.equalTime(new Date(topicNew.endsAt), topicEndsAtNew);

                        done();
                    });
                });
            });

            test('Success - update field', function (done) {
                topicUpdateField(agent, user.id, topic.id, {visibility: Topic.VISIBILITY.public}, function (err, res) {
                    if (err) return done(err);

                    assert.isObject(res.body);
                    assert.deepEqual(res.body, {});

                    topicRead(agent, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var topicNew = res.body.data;

                        assert.equal(topicNew.status, topicStatusNew);
                        assert.equal(topicNew.visibility, topicVisibilityNew);

                        done();
                    });
                });
            });

            test('Success - status from "followUp" to "voting"', function (done) {
                var options = [
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
                topicVoteCreate(agent, user.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft, function (err) {
                    if (err) return done(err);

                    topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp, function (err) {
                        if (err) return done(err);

                        topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting, function (err) {
                            if (err) return done(err);

                            topicRead(agent, user.id, topic.id, null, function (err, res) {
                                if (err) return done(err);

                                var topic = res.body.data;
                                assert.equal(topic.status, Topic.STATUSES.voting);

                                done();
                            });
                        });
                    });
                });
            });

            test('Success - send to Parliament', function (done) {
                var voteOptions = [
                    {
                        value: 'Option 1'
                    },
                    {
                        value: 'Option 2'
                    }
                ];

                Topic
                    .update(
                        {
                            title: 'TEST TITLE FOR SENDING TO PARLIAMENT', // Add  title which is not there as Topic is not edited in EP,
                            endsAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24)
                        },
                        {
                            where: {
                                id: topic.id
                            },
                            validate: false
                        }
                    )
                    .then(function () {
                        // NOTE: Creating a Vote.AUTH_TYPES.soft and changing to Vote.AUTH_TYPES.hard after voting just for testing
                        topicVoteCreate(agent, user.id, topic.id, voteOptions, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft, function (err, res) {
                            if (err) return done(err);

                            topicVoteRead(agent, user.id, topic.id, res.body.data.id, function (err, res) {
                                if (err) return done(err);

                                var vote = res.body.data;
                                var option = vote.options.rows[0];

                                async
                                    .parallel(
                                        [
                                            function (cb) {
                                                topicVoteVote(agent, user.id, topic.id, vote.id, [{optionId: option.id}], null, null, null, null, cb);
                                            },
                                            function (cb) {
                                                var agent2 = request.agent(app);
                                                userLib.createUserAndLogin(agent2, null, null, null, function (err, res) {
                                                    if (err) return cb(err);

                                                    var user2 = res;
                                                    topicMemberUsersCreate(
                                                        agent,
                                                        user.id,
                                                        topic.id,
                                                        [
                                                            {
                                                                userId: user2.id,
                                                                level: TopicMemberUser.LEVELS.read
                                                            }
                                                        ],
                                                        function (err) {
                                                            if (err) return done(err);

                                                            topicVoteVote(agent2, user2.id, topic.id, vote.id, [{optionId: option.id}], null, null, null, null, cb);
                                                        }
                                                    );
                                                });
                                            }
                                        ],
                                        function (err) {
                                            if (err) return done(err);

                                            // Now that we have generated required Vote count, change the Vote to Vote.AUTH_TYPES.hard to be allowed to send to parliament
                                            Vote
                                                .update(
                                                    {
                                                        authType: Vote.AUTH_TYPES.hard
                                                    },
                                                    {
                                                        where: {
                                                            id: vote.id
                                                        }
                                                    }
                                                )
                                                .then(function () {
                                                    var contact = {
                                                        name: 'Test',
                                                        email: 'test@test.com',
                                                        phone: '+3725100000'
                                                    };

                                                    topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp, Topic.VISIBILITY.public, null, null, contact, function (err) {
                                                        if (err) return done(err);

                                                        _topicUpdate(agent, user.id, topic.id, Topic.STATUSES.voting, Topic.VISIBILITY.public, null, null, contact, 400, done);
                                                    });
                                                })
                                                .catch(done);
                                        }
                                    );
                            });
                        });
                    })
                    .catch(done);
            });

            test('Fail - Page Not Found - topicId is null', function (done) {
                _topicUpdate(agent, user.id, null, topicStatusNew, topicVisibilityNew, null, null, null, 404, done);
            });

            test('Fail - Bad Request - status is null - should not modify existing value', function (done) {
                _topicUpdate(agent, user.id, topic.id, null, topicVisibilityNew, [], null, null, 400, function (err) {
                    if (err) return done(err);

                    topicRead(agent, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var topicNew = res.body.data;

                        assert.equal(topicNew.status, topic.status);

                        done();
                    });
                });
            });

            test('Fail - Bad Request - update field - status is null - should not modify existing value', function (done) {
                _topicUpdateField(agent, user.id, topic.id, {status: null}, 400, function (err) {
                    if (err) return done(err);

                    topicRead(agent, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var topicNew = res.body.data;

                        assert.equal(topicNew.status, topic.status);

                        done();
                    });
                });
            });

            test('Fail - Bad Request - status is "voting" - should not modify existing value', function (done) {
                var topicStatusNew = Topic.STATUSES.voting;
                _topicUpdate(agent, user.id, topic.id, topicStatusNew, topicVisibilityNew, null, null, null, 400, function (err) {
                    if (err) return done(err);

                    topicRead(agent, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var topicNew = res.body.data;

                        assert.equal(topicNew.status, topic.status);

                        done();
                    });
                });
            });

            test('Fail - Bad Request - status is "closed", trying to set back to "inProgress" - should not modify existing value', function (done) {
                topicUpdate(agent, user.id, topic.id, Topic.STATUSES.closed, topicVisibilityNew, null, null, null, function (err) {
                    if (err) return done(err);

                    _topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress, topicVisibilityNew, null, null, null, 400, function (err) {
                        if (err) return done(err);

                        topicRead(agent, user.id, topic.id, null, function (err, res) {
                            if (err) return done(err);

                            var topicNew = res.body.data;

                            assert.equal(topicNew.status, Topic.STATUSES.closed);

                            done();
                        });
                    });
                });
            });

            test('Fail - Bad Request - visibility is null - should not modify existing value', function (done) {
                _topicUpdate(agent, user.id, topic.id, topicStatusNew, null, null, null, null, 400, function (err) {
                    if (err) return done(err);

                    topicRead(agent, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var topicNew = res.body.data;

                        assert.equal(topicNew.visibility, topic.visibility);

                        done();
                    });
                });
            });

            test('Fail - Bad Request - too many categories', function (done) {
                var categories = [Topic.CATEGORIES.culture, Topic.CATEGORIES.agriculture, Topic.CATEGORIES.education, Topic.CATEGORIES.varia];

                _topicUpdate(agent, user.id, topic.id, topicStatusNew, Topic.VISIBILITY.private, categories, null, null, 400, function (err, res) {
                    if (err) return done(err);

                    var errors = res.body.errors;

                    assert.equal(errors.categories, 'Maximum of :count categories allowed.'.replace(':count', Topic.CATEGORIES_COUNT_MAX));

                    done();
                });
            });

            test('Fail - Bad Request - endsAt is in the past', function (done) {

                var topicEndsAtNewInPast = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                _topicUpdate(agent, user.id, topic.id, topicStatusNew, Topic.VISIBILITY.private, null, topicEndsAtNewInPast, null, 400, function (err, res) {
                    if (err) return done(err);

                    var errors = res.body.errors;

                    assert.equal(errors.endsAt, 'Topic deadline must be in the future.');

                    done();
                });
            });

            test('Fail - Bad Request - send to Parliament - invalid contact info. Missing or invalid name, email or phone', function (done) {
                var voteOptions = [
                    {
                        value: 'Option 1'
                    },
                    {
                        value: 'Option 2'
                    }
                ];

                topicVoteCreate(agent, user.id, topic.id, voteOptions, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.hard, function (err) {
                    if (err) return done(err);

                    var contact = {};

                    _topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp, Topic.VISIBILITY.public, null, null, contact, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40000,
                                message: 'Invalid contact info. Missing or invalid name, email or phone'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });
            });

            test('Fail - Bad Request - send to Parliament - not enough votes to send to Parliament', function (done) {
                var voteOptions = [
                    {
                        value: 'Option 1'
                    },
                    {
                        value: 'Option 2'
                    }
                ];

                topicVoteCreate(agent, user.id, topic.id, voteOptions, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.hard, function (err) {
                    if (err) return done(err);

                    var contact = {
                        name: 'Test',
                        email: 'test@test.com',
                        phone: '+3725100000'
                    };

                    _topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp, Topic.VISIBILITY.public, null, null, contact, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40010,
                                message: 'Not enough votes to send to Parliament. Votes required - ' + config.features.sendToParliament.voteCountMin
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });
            });

            test('Fail - Forbidden - at least edit permissions required', function (done) {
                var agent = request.agent(app);
                userLib.createUserAndLogin(agent, null, null, null, function (err, u) {
                    if (err) return done(err);

                    _topicUpdate(agent, u.id, topic.id, topicStatusNew, topicVisibilityNew, null, null, null, 403, function (err) {
                        if (err) return done(err);

                        done();
                    });
                });
            });

            suite('TokenJoin', function () {

                test('Success', function (done) {
                    var tokenJoinBeforeUpdate = topic.tokenJoin;
                    topicUpdateTokenJoin(agent, user.id, topic.id, function (err, res) {
                        if (err) return done(err);

                        var tokenJoin = res.body.data.tokenJoin;
                        assert.notEqual(tokenJoin, tokenJoinBeforeUpdate);

                        done();
                    });
                });

            });

        });

        suite('Delete', function () {

            var agent = request.agent(app);
            var email = 'test_topicd_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';

            var user;
            var topic;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) return done(err);
                    user = res;
                    topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                        if (err) return done(err);
                        topic = res.body.data;
                        done();
                    });
                });
            });

            test('Success', function (done) {
                topicDelete(agent, user.id, topic.id, function (err) {
                    if (err) return done(err);

                    Topic
                        .count({
                            where: {
                                id: topic.id
                            }
                        })
                        .then(function (tcount) {
                            // Topic table should not have any lines for this Group
                            assert.equal(tcount, 0);

                            // Also if Topic is gone so should TopicMemberUser
                            return TopicMemberUser.count({
                                where: {
                                    topicId: topic.id
                                }
                            });
                        })
                        .then(function (tmCount) {
                            assert.equal(tmCount, 0);

                            return etherpadClient
                                .getRevisionsCountAsync({padID: topic.id})
                                .then(
                                    function () {
                                        done(new Error('Should return padID does not exist!'));
                                    },
                                    function (err) {
                                        var expectedResult = {
                                            code: 1,
                                            message: 'padID does not exist'
                                        };

                                        assert.deepEqual(err, expectedResult);

                                        done();
                                    }
                                );
                        })
                        .catch(done);
                });
            });

            test('Fail - Forbidden - at least admin permissions required', function (done) {
                var agent = request.agent(app);
                userLib.createUserAndLogin(agent, null, null, null, function (err, u) {
                    if (err) return done(err);

                    _topicDelete(agent, u.id, topic.id, 403, function (err) {
                        if (err) return done(err);
                        done();
                    });
                });
            });

        });

        suite('List', function () {
            var agentCreator;
            var agentUser;

            var creator;
            var user;
            var topic;
            var group;

            setup(function (done) {
                agentCreator = request.agent(app);
                agentUser = request.agent(app);

                async
                    .parallel(
                        [
                            function (cb) {
                                userLib.createUserAndLogin(agentCreator, null, null, null, cb);
                            },
                            function (cb) {
                                userLib.createUserAndLogin(agentUser, null, null, null, cb);
                            }
                        ],
                        function (err, results) {
                            if (err) return done(err);

                            creator = results[0];
                            user = results[1];

                            async
                                .parallel(
                                    [
                                        function (cb) {
                                            groupLib.create(agentCreator, creator.id, 'Group', null, null, cb);
                                        },
                                        function (cb) {
                                            topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, null, null, function (err, res) {
                                                if (err) return cb(err);

                                                // Add title & description in DB. NULL title topics are not to be returned.
                                                var title = 'T title';
                                                var description = 'T desc';

                                                Topic
                                                    .update(
                                                        {
                                                            title: title,
                                                            description: description
                                                        },
                                                        {
                                                            where: {
                                                                id: res.body.data.id
                                                            },
                                                            limit: 1,
                                                            returning: true
                                                        }
                                                    )
                                                    .then(
                                                        function (updateResult) {
                                                            cb(null, updateResult[1][0].toJSON());
                                                        },
                                                        cb
                                                    );
                                            });
                                        }
                                    ],
                                    function (err, results) {
                                        if (err) return done(err);
                                        group = results[0].body.data;
                                        topic = results[1];

                                        // Add Group to Topic members and User to that Group
                                        var topicMemberGroup = {
                                            groupId: group.id,
                                            level: TopicMemberGroup.LEVELS.edit
                                        };

                                        var groupMemberUser = {
                                            userId: user.id,
                                            level: GroupMember.LEVELS.read
                                        };

                                        async
                                            .parallel(
                                                [
                                                    function (cb) {
                                                        topicMemberGroupsCreate(agentCreator, creator.id, topic.id, topicMemberGroup, cb);
                                                    },
                                                    function (cb) {
                                                        groupLib.membersCreate(agentCreator, creator.id, group.id, groupMemberUser, cb);
                                                    }
                                                ],
                                                done
                                            );
                                    }
                                );
                        }
                    );
            });

            test('Success', function (done) {
                var type = Comment.TYPES.pro;
                var type2 = Comment.TYPES.con;
                var subject = 'TEST';
                var text = 'THIS IS A TEST';
                var comment, comment2;
                topicCommentCreate(agentCreator, creator.id, topic.id, null, null, Comment.TYPES.pro, subject, text, function (err, res) {
                    if (err) return done(err);

                    comment = res.body.data;

                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, creator.id);

                    topicCommentCreate(agentCreator, creator.id, topic.id, null, null, Comment.TYPES.con, subject, text, function (err, res) {
                        if (err) return done(err);

                        comment2 = res.body.data;

                        assert.property(comment2, 'id');
                        assert.equal(comment2.type, type2);
                        assert.equal(comment2.subject, subject);
                        assert.equal(comment2.text, text);
                        assert.equal(comment2.creator.id, creator.id);

                        topicList(agentCreator, creator.id, null, null, null, null, null, function (err, res) {
                            if (err) return done(err);

                            var list = res.body.data;
                            assert.equal(list.count, 1);

                            var rows = list.rows;
                            assert.equal(rows.length, 1);

                            var topicRead = rows[0];
                            assert.equal(topicRead.id, topic.id);
                            assert.equal(topicRead.title, topic.title);
                            assert.equal(topicRead.description, topic.description);
                            assert.equal(topicRead.status, topic.status);
                            assert.equal(topicRead.visibility, topic.visibility);
                            assert.property(topicRead, 'createdAt');
                            assert.notProperty(topicRead, 'events');

                            var creator = topicRead.creator;
                            assert.equal(creator.id, topic.creator.id);

                            var members = topicRead.members;
                            assert.equal(members.users.count, 2);
                            assert.equal(members.groups.count, 1);

                            var permission = topicRead.permission;
                            assert.equal(permission.level, TopicMemberUser.LEVELS.admin);

                            var comments = topicRead.comments;
                            assert.equal(comments.count, 2);
                            assert.equal(comments.lastCreatedAt, comment2.createdAt);

                            done();
                        });
                    });
                });
            });

            test('Success - without deleted topics', function (done) {
                var deletedTopic;

                topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    deletedTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Deleted Topic';
                    var description = 'Deleted topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description
                            },
                            {
                                where: {
                                    id: deletedTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicRead(agentUser, user.id, deletedTopic.id, null, function (err, res) {
                                if (err) return done(err);

                                deletedTopic = res.body.data;

                                topicDelete(agentUser, user.id, deletedTopic.id, function (err) {
                                    if (err) return done(err);

                                    topicList(agentUser, user.id, null, null, null, null, null, function (err, res) {
                                        if (err) return done(err);

                                        var list = res.body.data;
                                        assert.equal(list.count, 1);

                                        var topicList = res.body.data.rows;

                                        assert.equal(res.body.data.count, topicList.length);

                                        topicList.forEach(function (resTopic) {
                                            assert.notEqual(deletedTopic.id, resTopic.id);
                                        });
                                        done();

                                    });

                                });

                            });
                        })
                        .catch(done);
                });
            });

            test('Success - visibility private', function (done) {
                topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var publicTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Public Topic';
                    var description = 'Public topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description
                            },
                            {
                                where: {
                                    id: publicTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicList(agentUser, user.id, null, Topic.VISIBILITY.private, null, null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data;
                                assert.equal(list.count, 1);
                                var rows = list.rows;

                                rows.forEach(function (topicItem) {
                                    assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                                });
                                done();
                            });
                        });
                });
            });

            test('Success - visibility public', function (done) {
                topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var publicTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Public Topic';
                    var description = 'Public topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description
                            },
                            {
                                where: {
                                    id: publicTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicList(agentUser, user.id, null, Topic.VISIBILITY.public, null, null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data;
                                assert.equal(list.count, 1);
                                var rows = list.rows;

                                rows.forEach(function (topicItem) {
                                    assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                                });
                                done();
                            });
                        });
                });
            });

            test('Success - only users topics', function (done) {
                topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var publicTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Public Topic';
                    var description = 'Public topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description
                            },
                            {
                                where: {
                                    id: publicTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicList(agentCreator, creator.id, null, null, null, creator.id, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data;
                                assert.equal(list.count, 1);
                                var rows = list.rows;

                                rows.forEach(function (topicItem) {
                                    assert.equal(topicItem.creator.id, creator.id);
                                    assert.notEqual(topicItem.creator.id, user.id);
                                });
                                done();
                            });
                        });
                });
            });

            test('Success - status inProgress', function (done) {
                topicCreate(agentUser, user.id, null, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var publicTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Public Topic';
                    var description = 'Public topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description
                            },
                            {
                                where: {
                                    id: publicTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicList(agentUser, user.id, null, null, 'inProgress', null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data;
                                assert.equal(list.count, 2);
                                var rows = list.rows;

                                rows.forEach(function (topicItem) {
                                    assert.equal(topicItem.status, Topic.STATUSES.inProgress);
                                    assert.equal(topicItem.deletedAt, null);
                                });
                                done();
                            });
                        });
                });
            });

            test('Success - status voting', function (done) {
                topicCreate(agentUser, user.id, null, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var publicTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Public Topic';
                    var description = 'Public topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description,
                                status: Topic.STATUSES.voting
                            },
                            {
                                where: {
                                    id: publicTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicList(agentUser, user.id, null, null, 'voting', null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data;
                                assert.equal(list.count, 1);
                                var rows = list.rows;

                                rows.forEach(function (topicItem) {
                                    assert.equal(topicItem.status, Topic.STATUSES.voting);
                                    assert.equal(topicItem.deletedAt, null);
                                });
                                done();
                            });
                        });
                });
            });

            test('Success - status followUp', function (done) {
                topicCreate(agentUser, user.id, null, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var publicTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Public Topic';
                    var description = 'Public topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description,
                                status: Topic.STATUSES.followUp
                            },
                            {
                                where: {
                                    id: publicTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicList(agentUser, user.id, null, null, 'followUp', null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data;
                                assert.equal(list.count, 1);
                                var rows = list.rows;

                                rows.forEach(function (topicItem) {
                                    assert.equal(topicItem.status, Topic.STATUSES.followUp);
                                    assert.equal(topicItem.deletedAt, null);
                                });
                                done();
                            });
                        });
                });
            });

            test('Success - status closed', function (done) {
                topicCreate(agentUser, user.id, null, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var publicTopic = res.body.data;

                    // Add title & description in DB. NULL title topics are not to be returned.
                    var title = 'Public Topic';
                    var description = 'Public topic desc';

                    Topic
                        .update(
                            {
                                title: title,
                                description: description,
                                status: Topic.STATUSES.closed
                            },
                            {
                                where: {
                                    id: publicTopic.id
                                }
                            }
                        )
                        .then(function () {
                            topicList(agentUser, user.id, null, null, 'closed', null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data;
                                assert.equal(list.count, 1);
                                var rows = list.rows;

                                rows.forEach(function (topicItem) {
                                    assert.equal(topicItem.status, Topic.STATUSES.closed);
                                    assert.equal(topicItem.deletedAt, null);
                                });
                                done();
                            });
                        });
                });
            });

            test('Success - list only topics that User has voted on - voted=true', function (done) {
                // Create 2 topics 1 in voting, but not voted, 1 voted. Topic list should return only 1 that User has voted on
                async
                    .parallel(
                        [
                            function (cb) {
                                topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS NOT VOTED on this topic</h2></body></html>', null, cb);
                            },
                            function (cb) {
                                topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS VOTED on this topic</h2></body></html>', null, cb);
                            }
                        ],
                        function (err, res) {
                            if (err) return done(err);

                            const topicWithVoteNotVoted = res[0].body.data;
                            const topicWithVoteAndVoted = res[1].body.data;

                            async
                                .parallel(
                                    [
                                        function (cb) {
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

                                            topicVoteCreate(agentCreator, user.id, topicWithVoteNotVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteNotVoted.title}`, null, null, cb);
                                        },
                                        function (cb) {
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

                                            topicVoteCreate(agentCreator, user.id, topicWithVoteAndVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteAndVoted.title}`, null, null, cb);
                                        },
                                        function (cb) {
                                            // Add topic to the group so the User has access through the Group
                                            const topicMemberGroup = {
                                                groupId: group.id,
                                                level: TopicMemberGroup.LEVELS.edit
                                            };

                                            topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteNotVoted.id, topicMemberGroup, cb);
                                        },
                                        function (cb) {
                                            // Add topic to the group so the User has access through the Group
                                            const topicMemberGroup = {
                                                groupId: group.id,
                                                level: TopicMemberGroup.LEVELS.edit
                                            };

                                            topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteAndVoted.id, topicMemberGroup, cb);
                                        }
                                    ],
                                    function (err, res) {
                                        if (err) return done(err);

                                        const vote = res[1].body.data; // Vote

                                        const voteList = [
                                            {
                                                optionId: vote.options.rows[0].id
                                            }
                                        ];

                                        topicVoteVote(agentUser, user.id, topicWithVoteAndVoted.id, vote.id, voteList, null, null, null, null, function (err) {
                                            if (err) return done(err);

                                            topicList(agentUser, user.id, null, null, null, null, true, function (err, res) {
                                                if (err) return done(err);

                                                const resData = res.body.data;

                                                assert.equal(resData.count, 1);
                                                assert.equal(resData.rows.length, 1);

                                                const resTopic = resData.rows[0];

                                                assert.equal(resTopic.id, topicWithVoteAndVoted.id);

                                                done();
                                            });
                                        });
                                    }
                                )

                        }
                    );
            });

            test('Success - list only topics that User has NOT voted on - voted=false ', function (done) {
                // Create 2 topics 1 in voting, but not voted, 1 voted. Topic list should return only 1 that User has NOT voted on
                async
                    .parallel(
                        [
                            function (cb) {
                                topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS NOT VOTED on this topic</h2></body></html>', null, cb);
                            },
                            function (cb) {
                                topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS VOTED on this topic</h2></body></html>', null, cb);
                            }
                        ],
                        function (err, res) {
                            if (err) return done(err);

                            const topicWithVoteNotVoted = res[0].body.data;
                            const topicWithVoteAndVoted = res[1].body.data;

                            async
                                .parallel(
                                    [
                                        function (cb) {
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

                                            topicVoteCreate(agentCreator, user.id, topicWithVoteNotVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteNotVoted.title}`, null, null, cb);
                                        },
                                        function (cb) {
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

                                            topicVoteCreate(agentCreator, user.id, topicWithVoteAndVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteAndVoted.title}`, null, null, cb);
                                        },
                                        function (cb) {
                                            // Add topic to the group so the User has access through the Group
                                            const topicMemberGroup = {
                                                groupId: group.id,
                                                level: TopicMemberGroup.LEVELS.edit
                                            };

                                            topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteNotVoted.id, topicMemberGroup, cb);
                                        },
                                        function (cb) {
                                            // Add topic to the group so the User has access through the Group
                                            const topicMemberGroup = {
                                                groupId: group.id,
                                                level: TopicMemberGroup.LEVELS.edit
                                            };

                                            topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteAndVoted.id, topicMemberGroup, cb);
                                        }
                                    ],
                                    function (err, res) {
                                        if (err) return done(err);

                                        const vote = res[1].body.data; // Vote

                                        const voteList = [
                                            {
                                                optionId: vote.options.rows[0].id
                                            }
                                        ];

                                        topicVoteVote(agentUser, user.id, topicWithVoteAndVoted.id, vote.id, voteList, null, null, null, null, function (err) {
                                            if (err) return done(err);

                                            topicList(agentUser, user.id, null, null, null, null, false, function (err, res) {
                                                if (err) return done(err);

                                                const resData = res.body.data;

                                                assert.equal(resData.count, 1);
                                                assert.equal(resData.rows.length, 1);

                                                const resTopic = resData.rows[0];

                                                assert.equal(resTopic.id, topicWithVoteNotVoted.id);

                                                done();
                                            });
                                        });
                                    }
                                )

                        }
                    );
            });

            suite('Include', function () {

                var agent = request.agent(app);
                var title = 'Include test';
                var description = 'include content';

                var user;
                var topic;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;
                        topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                            if (err) return done(err);
                            topic = res.body.data;
                            Topic
                                .update(
                                    {
                                        title: title,
                                        description: description
                                    },
                                    {
                                        where: {
                                            id: topic.id
                                        }
                                    }
                                )
                                .then(function () {
                                    var options = [
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

                                    var description = 'Vote description';

                                    topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, null, function (err, res) {
                                        if (err) return done(err);

                                        var vote = res.body.data;

                                        assert.property(vote, 'id');
                                        assert.equal(vote.minChoices, 1);
                                        assert.equal(vote.maxChoices, 1);
                                        assert.equal(vote.delegationIsAllowed, false);
                                        assert.isNull(vote.endsAt);
                                        assert.equal(vote.description, description);
                                        assert.equal(vote.authType, Vote.AUTH_TYPES.soft);

                                        // Topic should end up in "voting" status
                                        Topic
                                            .findOne({
                                                where: {
                                                    id: topic.id
                                                }
                                            })
                                            .then(function (t) {
                                                assert.equal(t.status, Topic.STATUSES.voting);
                                                topic = t.dataValues;
                                                done();
                                            })
                                            .catch(done);
                                    });
                                });
                        });
                    });
                });

                test('Success - include vote', function (done) {
                    topicList(agent, user.id, ['vote'], null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        var list = res.body.data.rows;
                        assert.equal(list.length, 1);

                        list.forEach(function (topicItem) {
                            assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                            if (topicItem.status === Topic.STATUSES.voting) {
                                assert.property(topicItem, 'vote');
                                topicItem.vote.options.rows.forEach(function (option) {
                                    assert.property(option, 'id');
                                    assert.property(option, 'value');
                                });
                            }
                        });

                        topicList(agent, user.id, null, null, null, null, null, function (err, res) {
                            if (err) return done(err);

                            var list2 = res.body.data.rows;
                            assert.equal(list.length, list2.length);

                            for (var i = 0; i < list.length; i++) {
                                assert.equal(list[i].id, list2[i].id);
                                assert.equal(list[i].description, list2[i].description);
                                assert.deepEqual(list[i].creator, list2[i].creator);

                                if (list[i].status === Topic.STATUSES.voting) {
                                    assert.equal(list[i].vote.id, list2[i].vote.id);
                                    assert.property(list[i].vote, 'options');
                                    assert.notProperty(list2[i].vote, 'options');
                                }
                            }

                            done();
                        });

                    });
                });

                test('Success - include events', function (done) {
                    topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp, function (err) {
                        if (err) return done(err);

                        var subject = 'Test Event title';
                        var text = 'Test Event description';

                        topicEventCreate(agent, user.id, topic.id, subject, text, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.body.status.code, 20100);

                            var event = res.body.data;
                            assert.equal(event.subject, subject);
                            assert.equal(event.text, text);
                            assert.property(event, 'createdAt');
                            assert.property(event, 'id');
                            topicList(agent, user.id, ['event'], null, null, null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data.rows;
                                assert.equal(list.length, 1);

                                list.forEach(function (topicItem) {
                                    assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                                    if (topicItem.status === Topic.STATUSES.followUp) {
                                        assert.property(topicItem, 'events');
                                        assert.equal(topicItem.events.count, 1);
                                    }
                                });

                                topicList(agent, user.id, null, null, null, null, null, function (err, res) {
                                    if (err) return done(err);

                                    var list2 = res.body.data.rows;
                                    assert.equal(list.length, list2.length);

                                    for (var i = 0; i < list.length; i++) {
                                        assert.equal(list[i].id, list2[i].id);
                                        assert.equal(list[i].description, list2[i].description);
                                        assert.deepEqual(list[i].creator, list2[i].creator);

                                        if (list[i].status === Topic.STATUSES.voting) {
                                            assert.equal(list[i].vote.id, list2[i].vote.id);
                                            assert.property(list[i].vote, 'options');
                                            assert.notProperty(list2[i].vote, 'options');
                                        }
                                    }

                                    done();
                                });

                            });
                        });
                    });
                });

                test('Success - include all', function (done) {
                    topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp, function (err) {
                        if (err) return done(err);

                        var subject = 'Test Event title';
                        var text = 'Test Event description';

                        topicEventCreate(agent, user.id, topic.id, subject, text, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.body.status.code, 20100);

                            var event = res.body.data;
                            assert.equal(event.subject, subject);
                            assert.equal(event.text, text);
                            assert.property(event, 'createdAt');
                            assert.property(event, 'id');
                            topicList(agent, user.id, ['vote', 'event'], null, null, null, null, function (err, res) {
                                if (err) return done(err);

                                var list = res.body.data.rows;
                                assert.equal(list.length, 1);

                                list.forEach(function (topicItem) {
                                    assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                                    assert.property(topicItem, 'events');
                                    if (topicItem.status === Topic.STATUSES.followUp) {
                                        assert.property(topicItem, 'vote');
                                        assert.equal(topicItem.events.count, 2);
                                    }
                                });

                                topicList(agent, user.id, null, null, null, null, null, function (err, res) {
                                    if (err) return done(err);

                                    var list2 = res.body.data.rows;
                                    assert.equal(list.length, list2.length);

                                    for (var i = 0; i < list.length; i++) {
                                        assert.equal(list[i].id, list2[i].id);
                                        assert.equal(list[i].description, list2[i].description);
                                        assert.deepEqual(list[i].creator, list2[i].creator);

                                        if (list[i].status === Topic.STATUSES.voting) {
                                            assert.equal(list[i].vote.id, list2[i].vote.id);
                                            assert.property(list[i].vote, 'options');
                                            assert.notProperty(list2[i].vote, 'options');
                                        }
                                    }

                                    done();
                                });

                            });
                        });
                    });
                });

            });

            suite('Levels', function () {

                test('Success - User has "edit" via Group', function (done) {
                    topicList(agentUser, user.id, null, null, null, null, null, function (err, res) {
                        if (err) return done(err);
                        var topicList = res.body.data;

                        assert.equal(topicList.count, 1);
                        assert.equal(topicList.rows.length, 1);

                        var topicRead = topicList.rows[0];

                        assert.equal(topicRead.id, topic.id);

                        var permission = topicRead.permission;

                        assert.equal(permission.level, TopicMemberUser.LEVELS.edit);

                        done();
                    });
                });

                test('Success - User permission overrides Group - has "admin"', function (done) {
                    var topicMemberUser = {
                        userId: user.id,
                        level: TopicMemberUser.LEVELS.admin
                    };

                    topicMemberUsersCreate(agentCreator, creator.id, topic.id, topicMemberUser, function (err) {
                        if (err) return done(err);

                        topicList(agentUser, user.id, null, null, null, null, null, function (err, res) {
                            if (err) return done(err);

                            var topicList = res.body.data;

                            assert.equal(topicList.count, 1);
                            assert.equal(topicList.rows.length, 1);

                            var topicRead = topicList.rows[0];

                            assert.equal(topicRead.id, topic.id);

                            var permission = topicRead.permission;

                            assert.equal(permission.level, TopicMemberUser.LEVELS.admin);

                            done();
                        });
                    });

                });

                test('Success - User permission overrides Group permission - has "none" thus no Topics listed', function (done) {
                    var topicMemberUser = {
                        userId: user.id,
                        level: TopicMemberUser.LEVELS.none
                    };

                    topicMemberUsersCreate(agentCreator, creator.id, topic.id, topicMemberUser, function (err) {
                        if (err) return done(err);

                        topicList(agentUser, user.id, null, null, null, null, null, function (err, res) {
                            if (err) return done(err);

                            var topicList = res.body.data;

                            assert.equal(topicList.count, 0);
                            assert.property(topicList, 'rows');
                            assert.equal(topicList.rows.length, 0);

                            done();
                        });
                    });
                });

                test('Success - User removed from Group which granted permissions - has "none" thus no Topics listed', function (done) {
                    groupLib.membersDelete(agentCreator, creator.id, group.id, user.id, function (err) {
                        if (err) return done(err);

                        topicList(agentUser, user.id, null, null, null, null, null, function (err, res) {
                            if (err) return done(err);

                            var topicList = res.body.data;

                            assert.equal(topicList.count, 0);
                            assert.property(topicList, 'rows');
                            assert.equal(topicList.rows.length, 0);

                            done();
                        });
                    });
                });

                test('Success - User granted direct "admin" access to Topic and then removed from Group which gave "edit" access - has "admin"', function (done) {
                    var topicMemberUser = {
                        userId: user.id,
                        level: TopicMemberUser.LEVELS.admin
                    };

                    topicMemberUsersCreate(agentCreator, creator.id, topic.id, topicMemberUser, function (err) {
                        if (err) return done(err);

                        groupLib.membersDelete(agentCreator, creator.id, group.id, user.id, function (err) {
                            if (err) return done(err);

                            topicList(agentUser, user.id, null, null, null, null, null, function (err, res) {
                                if (err) return done(err);

                                var topicList = res.body.data;

                                assert.equal(topicList.count, 1);
                                assert.equal(topicList.rows.length, 1);

                                var topicRead = topicList.rows[0];

                                assert.equal(topicRead.id, topic.id);

                                var permission = topicRead.permission;

                                assert.equal(permission.level, TopicMemberUser.LEVELS.admin);

                                done();
                            });
                        });
                    });
                });

            });

        });

        // API - /api/users/:userId/topics/:topicId/members
        suite('Members', function () {

            suite('List', function () {
                var agent = request.agent(app);
                var agent2 = request.agent(app);

                var user;
                var user2;
                var user3;

                var group;
                var group2;
                var groupMemberIds = [];

                var topic;
                var topicMemberUser;
                var topicMemberUserLevel = TopicMemberUser.LEVELS.edit;
                var topicMemberGroupLevel = TopicMemberGroup.LEVELS.read;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agent, null, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agent2, null, null, null, cb);
                                }
                            ],
                            function (err, result) {
                                if (err) return done(err);

                                user = result[0];
                                user2 = result[1];

                                done();
                            }
                        );
                });

                setup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    topicCreate(agent, user.id, null, null, null, null, null, cb);
                                },
                                function (cb) {
                                    groupLib.create(agent, user.id, 'Topic List Test Group', null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUser(request.agent(app), null, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUser(request.agent(app), null, null, null, cb);
                                },
                                function (cb) {
                                    groupLib.create(agent2, user2.id, 'Topic List Test Group2', null, null, function (err, result) {
                                        if (err) return done(err);

                                        group2 = result.body.data;
                                        var members = [
                                            {
                                                userId: user.id,
                                                level: GroupMember.LEVELS.read
                                            }
                                        ];

                                        groupLib.membersCreate(agent2, user2.id, group2.id, members, cb);
                                        groupMemberIds.push(user.id);
                                    });
                                }
                            ],
                            function (err, results) {
                                if (err) return done(err);

                                topic = results[0].body.data;
                                group = results[1].body.data;
                                topicMemberUser = results[2];
                                user3 = results[3];
                                assert.equal(results[4].body.status.code, 20100);

                                async
                                    .parallel(
                                        [
                                            function (cb) {
                                                var member = {
                                                    groupId: group.id,
                                                    level: topicMemberGroupLevel
                                                };

                                                topicMemberGroupsCreate(agent, user.id, topic.id, member, cb);
                                            },
                                            function (cb) {
                                                var member = {
                                                    userId: topicMemberUser.id,
                                                    level: topicMemberUserLevel
                                                };

                                                topicMemberUsersCreate(agent, user.id, topic.id, member, cb);
                                            },
                                            function (cb) {
                                                var member = {
                                                    userId: user3.id,
                                                    level: GroupMember.LEVELS.read
                                                };

                                                groupLib.membersCreate(agent, user.id, group.id, member, cb);
                                                groupMemberIds.push(user3.id);
                                            },
                                            function (cb) {
                                                var member2 = {
                                                    groupId: group2.id,
                                                    level: topicMemberGroupLevel
                                                };

                                                topicMemberGroupsCreate(agent, user.id, topic.id, member2, function (err, result) {
                                                    if (err) return done(err);

                                                    if (result && result.body.status.code === 20100) {
                                                        groupLib.membersDelete(agent2, user2.id, group2.id, user.id, cb);
                                                    }
                                                });
                                            }
                                        ],
                                        done
                                    );
                            }
                        );
                });

                test('Success', function (done) {
                    topicMembersList(agent, user.id, topic.id, function (err, res) {
                        if (err) return done(err);

                        var list = res.body.data;

                        var groups = list.groups;

                        assert.equal(groups.count, 2);
                        assert.equal(groups.rows.length, 2);

                        var groupRes = _.find(groups.rows, {id: group.id});
                        assert.equal(groupRes.name, group.name);
                        assert.equal(groupRes.level, topicMemberGroupLevel);
                        assert.equal(groupRes.permission.level, TopicMemberGroup.LEVELS.admin);

                        var group2Res = _.find(groups.rows, {id: group2.id});
                        assert.isNull(group2Res.name);
                        assert.equal(group2Res.level, topicMemberGroupLevel);
                        assert.isNull(group2Res.permission.level);

                        var users = list.users;

                        assert.equal(users.count, 4);
                        assert.equal(users.rows.length, 4);

                        var adminUser = null;
                        var memberUsers = [];

                        for (var i = 0; i < users.rows.length; i++) {
                            if (users.rows[i].level === TopicMemberUser.LEVELS.admin) {
                                adminUser = users.rows[i];
                            } else {
                                memberUsers.push(users.rows[i]);
                            }
                        }
                        assert.equal(adminUser.id, user.id);
                        assert.property(adminUser, 'name');
                        assert.notProperty(adminUser, 'email');
                        assert.equal(adminUser.level, TopicMemberUser.LEVELS.admin);

                        var topicMemberUserReturned = 0;
                        memberUsers.forEach(function (memberUser) {
                            if (memberUser.id === topicMemberUser.id) {
                                topicMemberUserReturned = 1;
                                assert.equal(memberUser.level, topicMemberUserLevel);
                            } else {
                                assert.equal(memberUser.level, topicMemberGroupLevel);
                            }
                            assert.property(memberUser, 'name');
                            assert.notProperty(memberUser, 'email');
                        });
                        assert.equal(topicMemberUserReturned, 1);
                        done();
                    });
                });

                suite('Users', function () {

                    test('Success', function (done) {
                        topicMembersUsersList(agent, user.id, topic.id, function (err, res) {
                            if (err) return done(err);

                            var users = res.body.data;
                            var groupExistsCount = 0;
                            users.rows.forEach(function (memberUser) {
                                assert.property(memberUser, 'groups');
                                memberUser.groups.rows.forEach(function (userGroup) {
                                    if (userGroup.id === group.id) {
                                        groupExistsCount++;
                                        assert.include(groupMemberIds, memberUser.id);
                                        assert.equal(userGroup.name, group.name);
                                        assert.property(userGroup, 'level');
                                    }
                                });
                            });

                            assert.equal(groupExistsCount, 2);
                            topicMembersList(agent, user.id, topic.id, function (err, res) {
                                if (err) return done(err);
                                users.rows.forEach(function (user) {
                                    delete user.groups;
                                });
                                assert.deepEqual(users, res.body.data.users);

                                done();
                            });
                        });
                    });

                });

                suite('Groups', function () {

                    test('Success', function (done) {
                        topicMembersGroupsList(agent, user.id, topic.id, function (err, res) {
                            if (err) return done(err);

                            var groups = res.body.data;

                            topicMembersList(agent, user.id, topic.id, function (err, res) {
                                if (err) return done(err);

                                assert.deepEqual(groups, res.body.data.groups);

                                done();
                            });
                        });
                    });

                });
            });

            suite('Users', function () {

                suite('Create (DEPRECATED)', function () {
                    var agent = request.agent(app);

                    var user;
                    var member;
                    var topic;

                    var memberToAdd;

                    setup(function (done) {
                        userLib.createUser(agent, null, null, null, function (err, res) {
                            if (err) return done(err);
                            member = res;
                            memberToAdd = {
                                userId: member.id,
                                level: TopicMemberUser.LEVELS.read
                            };

                            userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                                if (err) return done(err);

                                user = res;
                                topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    done();
                                });
                            });
                        });
                    });

                    test('Success - add User as member', function (done) {
                        topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                            TopicMemberUser
                                .count({
                                    where: {topicId: topic.id}
                                })
                                .then(function (count) {
                                    assert.equal(count, 2);

                                    done();
                                });
                        });
                    });

                    test('Success - add same User as Member twice with new level', function (done) {
                        topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                            // Change level
                            memberToAdd.level = TopicMemberUser.LEVELS.admin;

                            topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err) {
                                if (err) return done(err);

                                TopicMemberUser
                                    .findOne({
                                        where: {
                                            topicId: topic.id,
                                            userId: memberToAdd.userId
                                        }
                                    })
                                    .then(function (addedMember) {
                                        // No changing level! https://trello.com/c/lWnvvPq5/47-bug-invite-members-can-create-a-situation-where-0-admin-members-remain-for-a-topic
                                        assert.notEqual(addedMember.level, memberToAdd.level);
                                        done();
                                    })
                                    .catch(done);
                            });
                        });
                    });

                    test('Success - add existing User as member with e-mail address', function (done) {
                        var memberToAdd = {
                            userId: member.email,
                            level: TopicMemberUser.LEVELS.read
                        };

                        topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                            TopicMemberUser
                                .count({
                                    where: {topicId: topic.id}
                                })
                                .then(function (count) {
                                    assert.equal(count, 2);

                                    done();
                                });
                        });
                    });

                    test('Success - add non-existent e-mail as member with language', function (done) {
                        var memberToAdd = {
                            userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists@test.com',
                            level: TopicMemberUser.LEVELS.read,
                            language: 'et'
                        };

                        topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                            TopicMemberUser
                                .count({
                                    where: {topicId: topic.id}
                                })
                                .then(function (count) {
                                    assert.equal(count, 2);

                                    // Verify that the User was created in expected language
                                    User
                                        .findOne({
                                            where: {
                                                email: memberToAdd.userId
                                            }
                                        })
                                        .then(function (user) {
                                            assert.equal(user.language, memberToAdd.language);
                                            done();
                                        })
                                        .catch(done);
                                });
                        });
                    });

                    test('Success - add 1 existing and 1 non-existing e-mail', function (done) {
                        var membersToAdd = [
                            {
                                userId: member.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists2@test.com',
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];


                        topicMemberUsersCreate(agent, user.id, topic.id, membersToAdd, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                            TopicMemberUser
                                .count({
                                    where: {topicId: topic.id}
                                })
                                .then(function (count) {
                                    assert.equal(count, 3);
                                    done();
                                });
                        });
                    });

                    test('Success - add, remove, add the same User again', function (done) {
                        topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err, res) {
                            if (err) return done(err);

                            assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                            topicMemberUsersDelete(agent, user.id, topic.id, memberToAdd.userId, function (err) {
                                if (err) return done(err);

                                topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err, res) {
                                    if (err) return done(err);

                                    assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                                    done();
                                });
                            });
                        });
                    });

                    test.skip('Fail - Bad Request - try to add same Group twice', function (done) {
                        done();
                    });

                    test('Fail - Forbidden - at least admin permissions required', function (done) {
                        var agent = request.agent(app);
                        userLib.createUserAndLogin(agent, null, null, null, function (err, u) {
                            if (err) return done(err);

                            _topicMemberUsersCreate(agent, u.id, topic.id, memberToAdd, 403, function (err, res) {
                                if (err) return done(err);

                                assert.equal(res.headers['citizenos-deprecated'], 'Use invite API - https://github.com/citizenos/citizenos-fe/issues/112');

                                done();
                            });
                        });
                    });

                });

                suite('Update', function () {
                    var agent = request.agent(app);
                    var email = 'test_topicmuu' + new Date().getTime() + '@test.ee';
                    var password = 'testPassword123';

                    var memberEmail = 'test_topicmu_m' + new Date().getTime() + '@test.ee';
                    var memberPassword = 'testPassword123';

                    var user;
                    var member;
                    var topic;

                    suiteSetup(function (done) {
                        userLib.createUser(agent, memberEmail, memberPassword, null, function (err, res) {
                            if (err) return done(err);
                            member = res;
                            userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                                if (err) return done(err);
                                user = res;
                                topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                                    if (err) return done(err);
                                    topic = res.body.data;

                                    var memberToAdd = {
                                        userId: member.id,
                                        level: TopicMemberUser.LEVELS.read
                                    };

                                    topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err) {
                                        if (err) return done(err);

                                        done();
                                    });
                                });
                            });
                        });
                    });

                    test('Success - update member User', function (done) {
                        var newLevel = TopicMemberUser.LEVELS.admin;

                        topicMemberUsersUpdate(agent, user.id, topic.id, member.id, newLevel, function (err) {
                            if (err) return done(err);

                            TopicMemberUser
                                .findOne({
                                    where: {
                                        topicId: topic.id,
                                        userId: member.id
                                    }
                                })
                                .then(function (tm) {
                                    assert.equal(tm.userId, member.id);
                                    assert.equal(tm.level, TopicMemberUser.LEVELS.admin);

                                    done();
                                })
                                .catch(done);
                        });
                    });

                    test('Fail - Forbidden - at least admin permissions required', function (done) {
                        var agent = request.agent(app);
                        userLib.createUserAndLogin(agent, null, null, null, function (err, u) {
                            if (err) return done(err);

                            _topicMemberUsersUpdate(agent, u.id, topic.id, member.id, TopicMemberUser.LEVELS.admin, 403, function (err) {
                                if (err) return done(err);

                                done();
                            });
                        });
                    });

                });

                suite('Delete', function () {
                    var agent;
                    var email;
                    var password;

                    var memberAgent;
                    var memberEmail;
                    var memberPassword;

                    var user;
                    var member;
                    var topic;

                    setup(function (done) {
                        agent = request.agent(app);
                        email = 'test_topicmud' + new Date().getTime() + '@test.ee';
                        password = 'testPassword123';

                        memberAgent = request.agent(app);
                        memberEmail = 'test_topicmd_m' + new Date().getTime() + '@test.ee';
                        memberPassword = 'testPassword123';

                        userLib.createUserAndLogin(memberAgent, memberEmail, memberPassword, null, function (err, res) {
                            if (err) return done(err);
                            member = res;
                            userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                                if (err) return done(err);
                                user = res;
                                topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                                    if (err) return done(err);
                                    topic = res.body.data;

                                    var memberToAdd = {
                                        userId: member.id,
                                        level: TopicMemberUser.LEVELS.read
                                    };

                                    topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err) {
                                        if (err) return done(err);

                                        done();
                                    });
                                });
                            });
                        });
                    });

                    test('Success - 20000 - delete member User', function (done) {
                        topicRead(agent, user.id, topic.id, null, function (err, res) {
                            if (err) return done(err);

                            var topicRead1 = res.body.data;
                            assert.equal(topicRead1.members.users.count, 2);

                            topicMemberUsersDelete(agent, user.id, topic.id, member.id, function (err) {
                                if (err) return done(err);

                                topicRead(agent, user.id, topic.id, null, function (err, res) {
                                    if (err) return done(err);

                                    var topicRead2 = res.body.data;
                                    assert.equal(topicRead2.members.users.count, 1);

                                    done();
                                });
                            });
                        });
                    });

                    test('Success - 20000 - User leaves Topic', function (done) {
                        topicMembersUsersList(agent, user.id, topic.id, function (err, res) {
                            if (err) return done(err);
                            var usersList1 = res.body.data;
                            assert.equal(usersList1.count, 2);
                            assert.equal(usersList1.rows.length, 2);

                            topicMemberUsersDelete(memberAgent, member.id, topic.id, member.id, function (err) {
                                if (err) return done(err);

                                topicMembersUsersList(agent, user.id, topic.id, function (err, res) {
                                    if (err) return done(err);

                                    var usersList = res.body.data;
                                    assert.equal(usersList.count, 1);
                                    assert.equal(usersList.rows.length, 1);

                                    done();
                                });
                            });
                        });
                    });

                    test('Success - add member update to admin and remove other admin', function (done) {
                        var userWithInsufficientPermissionsAgent = request.agent(app);
                        var memberUser;
                        userLib.createUserAndLogin(userWithInsufficientPermissionsAgent, null, null, null, function (err, res) {
                            if (err) return done(err);
                            memberUser = res;
                            var memberToAdd = {
                                userId: memberUser.id,
                                level: TopicMemberUser.LEVELS.read
                            };

                            topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err) {
                                if (err) return done(err);

                                _topicMemberUsersDelete(userWithInsufficientPermissionsAgent, memberToAdd.id, topic.id, member.id, 403, function (err) {
                                    if (err) return done(err);

                                    var newLevel = TopicMemberUser.LEVELS.admin;

                                    topicMemberUsersUpdate(agent, user.id, topic.id, memberUser.id, newLevel, function (err) {
                                        if (err) return done(err);

                                        topicMemberUsersUpdate(userWithInsufficientPermissionsAgent, memberUser.id, topic.id, user.id, TopicMemberUser.LEVELS.read, function (err) {
                                            if (err) return done(err);

                                            topicMemberUsersDelete(userWithInsufficientPermissionsAgent, memberToAdd.id, topic.id, user.id, function (err) {
                                                if (err) return done(err);

                                                done();
                                            });
                                        });
                                    });
                                });

                            });
                        });
                    });

                    test('Fail - 40010 - User leaves Topic being the last admin member', function (done) {
                        _topicMemberUsersDelete(agent, user.id, topic.id, user.id, 400, function (err, res) {
                            if (err) return done(err);

                            var expectedResponse = {
                                status: {
                                    code: 40010,
                                    message: 'Cannot delete the last admin member.'
                                }
                            };

                            assert.deepEqual(res.body, expectedResponse);

                            done();
                        });
                    });

                    test('Fail - 40300 - cannot delete with no admin permissions', function (done) {
                        var userWithInsufficientPermissionsAgent = request.agent(app);
                        userLib.createUserAndLogin(userWithInsufficientPermissionsAgent, null, null, null, function (err, res) {
                            if (err) return done(err);

                            var memberToAdd = {
                                userId: res.id,
                                level: TopicMemberUser.LEVELS.read
                            };

                            topicMemberUsersCreate(agent, user.id, topic.id, memberToAdd, function (err) {
                                if (err) return done(err);

                                _topicMemberUsersDelete(userWithInsufficientPermissionsAgent, memberToAdd.id, topic.id, member.id, 403, function (err) {
                                    if (err) return done(err);

                                    done();
                                });
                            });
                        });
                    });
                });

            });

            suite('Groups', function () {

                suite('Create', function () {
                    var agent = request.agent(app);
                    var agent2 = request.agent(app);
                    var email = 'test_topicmgc_' + new Date().getTime() + '@test.ee';
                    var password = 'testPassword123';

                    var groupName = 'Test Group for group membership test';

                    var user;
                    var group;
                    var group2;
                    var topic;

                    var member;
                    var member2;

                    suiteSetup(function (done) {
                        async
                            .parallel(
                                [
                                    function (cb) {
                                        userLib.createUserAndLogin(agent, email, password, null, cb);
                                    },
                                    function (cb) {
                                        userLib.createUserAndLogin(request.agent(app), null, null, null, cb);
                                    },
                                    function (cb) {
                                        userLib.createUserAndLogin(agent2, null, null, null, cb);
                                    }
                                ],
                                function (err, res) {
                                    if (err) return done(err);

                                    user = res[0];
                                    var groupMemberUser = res[1];
                                    var user2 = res[2];

                                    topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                                        if (err) return done(err);

                                        topic = res.body.data;
                                        groupLib.create(agent2, user2.id, groupName + ' MUGRUPP', null, null, function (err, res) {
                                            if (err) return done(err);

                                            group2 = res.body.data;
                                            member2 = {
                                                groupId: group2.id,
                                                level: TopicMemberGroup.LEVELS.read
                                            };

                                            groupLib.create(agent, user.id, groupName, null, null, function (err, res) {
                                                if (err) return done(err);

                                                group = res.body.data;
                                                var groupMember = {
                                                    userId: groupMemberUser.id,
                                                    level: GroupMember.LEVELS.read
                                                };

                                                member = {
                                                    groupId: group.id,
                                                    level: GroupMember.LEVELS.read
                                                };

                                                groupLib.membersCreate(agent, user.id, group.id, groupMember, function (err) {
                                                    if (err) return done(err);

                                                    done();
                                                });
                                            });
                                        });
                                    });
                                }
                            );
                    });

                    test('Success - add Group as member', function (done) {
                        topicMemberGroupsCreate(agent, user.id, topic.id, member, function (err) {
                            if (err) return done(err);

                            TopicMemberGroup
                                .count({
                                    where: {
                                        topicId: topic.id,
                                        groupId: group.id
                                    }
                                })
                                .then(function (count) {
                                    assert.equal(count, 1);

                                    done();
                                })
                                .catch(done);
                        });
                    });

                    test('Success - add same Group twice', function (done) {
                        topicMemberGroupsCreate(agent, user.id, topic.id, member, function (err) {
                            if (err) return done(err);

                            //Change level
                            member.level = TopicMemberGroup.LEVELS.admin;

                            topicMemberGroupsCreate(agent, user.id, topic.id, member, function (err) {
                                if (err) return done(err);

                                TopicMemberGroup
                                    .findOne({
                                        where: {
                                            topicId: topic.id,
                                            groupId: member.groupId
                                        }
                                    })
                                    .then(function (topicMemberGroup) {
                                        assert.notEqual(topicMemberGroup.level, member.level);

                                        done();
                                    })
                                    .catch(done);
                            });
                        });
                    });


                    test('Fail - Forbidden - at least admin permissions required', function (done) {
                        var agent = request.agent(app);
                        userLib.createUserAndLogin(agent, null, null, null, function (err, u) {
                            if (err) return done(err);

                            _topicMemberGroupsCreate(agent, u.id, topic.id, member, 403, function (err) {
                                if (err) return done(err);

                                done();
                            });
                        });
                    });

                    test('Fail - add Group as member', function (done) {
                        _topicMemberGroupsCreate(agent, user.id, topic.id, member2, 403, function (err) {
                            if (err) return done(err);

                            TopicMemberGroup
                                .count({
                                    where: {
                                        topicId: topic.id,
                                        groupId: group2.id
                                    }
                                })
                                .then(function (count) {
                                    assert.equal(count, 0);
                                    done();
                                })
                                .catch(done);
                        });
                    });

                    test('Delete group - check topic member groups count after deleting member group', function (done) {
                        groupLib.delete(agent, user.id, group.id, function (err) {
                            if (err) return done(err);

                            topicReadUnauth(agent, topic.id, null, function (err, res) {
                                if (err) return done(err);

                                var resTopic = res.body.data;
                                assert.equal(resTopic.members.groups.count, 0);

                                done();
                            });
                        });
                    });

                });

                suite('Update', function () {
                    var agent = request.agent(app);
                    var email = 'test_topicmgu' + new Date().getTime() + '@test.ee';
                    var password = 'testPassword123';

                    var groupName = 'Test Group for group membership test';

                    var user;
                    var group;
                    var topic;

                    suiteSetup(function (done) {
                        userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                            if (err) return done(err);
                            user = res;
                            topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                                if (err) return done(err);
                                topic = res.body.data;

                                groupLib.create(agent, user.id, groupName, null, null, function (err, res) {
                                    if (err) return done(err);
                                    group = res.body.data;

                                    var members = {
                                        groupId: group.id,
                                        level: TopicMemberGroup.LEVELS.read
                                    };

                                    topicMemberGroupsCreate(agent, user.id, topic.id, members, function (err) {
                                        if (err) return done(err);

                                        done();
                                    });
                                });
                            });
                        });
                    });

                    test('Success - update member Group', function (done) {
                        var newLevel = TopicMemberGroup.LEVELS.admin;

                        topicMemberGroupsUpdate(agent, user.id, topic.id, group.id, newLevel, function (err) {
                            if (err) return done(err);

                            TopicMemberGroup
                                .findOne({
                                    where: {
                                        topicId: topic.id,
                                        groupId: group.id
                                    }
                                })
                                .then(function (tm) {
                                    assert.equal(tm.groupId, group.id);
                                    assert.equal(tm.level, TopicMemberGroup.LEVELS.admin);
                                    done();
                                })
                                .catch(done);
                        });
                    });

                    test('Fail - Forbidden - at least admin permissions required', function (done) {
                        var agent = request.agent(app);
                        userLib.createUserAndLogin(agent, null, null, null, function (err, u) {
                            if (err) return done(err);

                            _topicMemberGroupsUpdate(agent, u.id, topic.id, group.id, TopicMemberGroup.LEVELS.admin, 403, function (err) {
                                if (err) return done(err);

                                done();
                            });
                        });
                    });

                });

                suite('Delete', function () {
                    var agent = request.agent(app);
                    var email = 'test_topicmd' + new Date().getTime() + '@test.ee';
                    var password = 'testPassword123';

                    var groupName = 'Test Group for group membership test';

                    var user;
                    var group;
                    var topic;

                    suiteSetup(function (done) {
                        userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                            if (err) return done(err);
                            user = res;
                            topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                                if (err) return done(err);
                                topic = res.body.data;

                                groupLib.create(agent, user.id, groupName, null, null, function (err, res) {
                                    if (err) return done(err);
                                    group = res.body.data;

                                    var members = {
                                        groupId: group.id,
                                        level: TopicMemberGroup.LEVELS.read
                                    };

                                    topicMemberGroupsCreate(agent, user.id, topic.id, members, function (err) {
                                        if (err) return done(err);

                                        done();
                                    });
                                });
                            });
                        });
                    });

                    test('Success - delete member Group', function (done) {
                        topicMemberGroupsDelete(agent, user.id, topic.id, group.id, function (err) {
                            if (err) return done(err);

                            TopicMemberGroup
                                .count({
                                    where: {
                                        topicId: topic.id,
                                        groupId: group.id
                                    }
                                })
                                .then(function (count) {
                                    assert.equal(count, 0);

                                    done();
                                })
                                .catch(done);
                        });
                    });

                    test('Fail - Forbidden - at least admin permissions required', function (done) {
                        var agent = request.agent(app);
                        userLib.createUserAndLogin(agent, null, null, null, function (err, u) {
                            if (err) return done(err);

                            _topicMemberGroupsDelete(agent, u.id, topic.id, group.id, 403, function (err) {
                                if (err) return done(err);

                                done();
                            });
                        });
                    });

                });

            });

        });

        suite('Invites', function () {

            suite('Users', function () {

                suite('Create', function () {
                    let agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite;
                    let topic;

                    setup(async function () {
                        userToInvite = await userLib.createUserPromised(request.agent(app), null, null, null);
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        topic = (await topicCreatePromised(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;
                    });

                    test('Success - 20100 - invite a single User', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const inviteCreateResult = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body;

                        assert.deepEqual(
                            inviteCreateResult.status,
                            {
                                code: 20100
                            }
                        );

                        assert.equal(inviteCreateResult.data.count, 1);

                        const createdInvites = inviteCreateResult.data.rows;
                        assert.isArray(createdInvites);
                        assert.equal(createdInvites.length, 1);

                        const createdInvite = createdInvites[0];
                        assert.uuid(createdInvite.id, 'v4');
                        assert.equal(createdInvite.topicId, topic.id);
                        assert.equal(createdInvite.creatorId, userCreator.id);
                        assert.equal(createdInvite.userId, invitation.userId);
                        assert.equal(createdInvite.level, invitation.level);
                        assert.isNotNull(createdInvite.createdAt);
                        assert.isNotNull(createdInvite.updatedAt);
                    });


                    test('Success - 20100 - invite multiple Users - userId (uuidv4)', async function () {
                        const userToInvite2 = await userLib.createUserPromised(request.agent(app), null, null, null);

                        const invitation = [
                            {
                                userId: userToInvite.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: userToInvite2.id,
                                level: TopicMemberUser.LEVELS.edit
                            }
                        ];

                        const inviteCreateResult = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body;

                        assert.deepEqual(
                            inviteCreateResult.status,
                            {
                                code: 20100
                            }
                        );

                        assert.equal(inviteCreateResult.data.count, 2);

                        const createdInvites = inviteCreateResult.data.rows;
                        assert.isArray(createdInvites);
                        assert.equal(createdInvites.length, 2);

                        const createdInviteUser1 = _.find(createdInvites, invite => {
                            return invite.userId === invitation[0].userId;
                        });
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.topicId, topic.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.equal(createdInviteUser1.userId, invitation[0].userId);
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        const createdInviteUser2 = _.find(createdInvites, invite => {
                            return invite.userId === invitation[1].userId;
                        });
                        assert.uuid(createdInviteUser2.id, 'v4');
                        assert.equal(createdInviteUser2.topicId, topic.id);
                        assert.equal(createdInviteUser2.creatorId, userCreator.id);
                        assert.equal(createdInviteUser2.userId, invitation[1].userId);
                        assert.equal(createdInviteUser2.level, invitation[1].level);
                        assert.isNotNull(createdInviteUser2.createdAt);
                        assert.isNotNull(createdInviteUser2.updatedAt);
                    });

                    test('Success - 20100 - invite multiple existing Users - userId (uuid4) & email', async function () {
                        const userToInvite2 = await userLib.createUserPromised(request.agent(app), null, null, null);

                        const invitation = [
                            {
                                userId: userToInvite.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: userToInvite2.email,
                                level: TopicMemberUser.LEVELS.edit
                            }
                        ];

                        const createResult = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body;

                        assert.deepEqual(
                            createResult.status,
                            {
                                code: 20100
                            }
                        );

                        assert.equal(createResult.data.count, 2);

                        const createdInvites = createResult.data.rows;
                        assert.isArray(createdInvites);
                        assert.equal(createdInvites.length, 2);

                        const createdInviteUser1 = _.find(createdInvites, {level: invitation[0].level}); // find by level, not by id to keep the code simpler
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.topicId, topic.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.equal(createdInviteUser1.userId, invitation[0].userId);
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        const createdInviteUser2 = _.find(createdInvites, {level: invitation[1].level}); // find by level, not by id to keep the code simpler
                        assert.uuid(createdInviteUser2.id, 'v4');
                        assert.equal(createdInviteUser2.topicId, topic.id);
                        assert.equal(createdInviteUser2.creatorId, userCreator.id);
                        assert.equal(createdInviteUser2.userId, userToInvite2.id);
                        assert.equal(createdInviteUser2.level, invitation[1].level);
                        assert.isNotNull(createdInviteUser2.createdAt);
                        assert.isNotNull(createdInviteUser2.updatedAt);
                    });

                    test('Success - 20100 - invite multiple users, 1 existing User and one not existing User - email & email', async function () {
                        const invitation = [
                            {
                                userId: userToInvite.email,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: cosUtil.randomString() + '@invitetest.com',
                                level: TopicMemberUser.LEVELS.edit
                            }
                        ];

                        const inviteCreateResult = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body;

                        assert.deepEqual(
                            inviteCreateResult.status,
                            {
                                code: 20100
                            }
                        );

                        assert.equal(inviteCreateResult.data.count, 2);

                        const createdInvites = inviteCreateResult.data.rows;
                        assert.isArray(createdInvites);
                        assert.equal(createdInvites.length, 2);

                        const createdInviteUser1 = _.find(createdInvites, {level: invitation[0].level}); // find by level, not by id to keep the code simpler
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.topicId, topic.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.uuid(createdInviteUser1.userId, 'v4');
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        const createdInviteUser2 = _.find(createdInvites, {level: invitation[1].level}); // find by level, not by id to keep the code simpler
                        assert.uuid(createdInviteUser2.id, 'v4');
                        assert.equal(createdInviteUser2.topicId, topic.id);
                        assert.equal(createdInviteUser2.creatorId, userCreator.id);
                        assert.uuid(createdInviteUser2.userId, 'v4');
                        assert.equal(createdInviteUser2.level, invitation[1].level);
                        assert.isNotNull(createdInviteUser2.createdAt);
                        assert.isNotNull(createdInviteUser2.updatedAt);
                    });

                    test('Fail - 40001 - Invite yourself', async function () {
                        const invitation = {
                            userId: userCreator.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const inviteCreateResult = (await _topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation, 400)).body;

                        const expectedBody = {
                            status: {
                                code: 40001,
                                message: 'No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.'
                            }
                        };

                        assert.deepEqual(inviteCreateResult, expectedBody);
                    });

                    test('Fail - 40001 - invite a User with invalid userId', async function () {
                        const invitation = [
                            {
                                userId: 'notAnEmailNorUserId',
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];

                        const inviteCreateResult = (await _topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation, 400)).body;

                        const expectedResponseBody = {
                            status: {
                                code: 40001,
                                message: 'No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.'
                            }
                        };

                        assert.deepEqual(inviteCreateResult, expectedResponseBody);
                    });

                    test('Fail - 40000 - invalid JSON in request body', async function () {
                        const expectedResponseBody = {
                            status: {
                                code: 40000,
                                message: 'Invalid JSON in request body'
                            }
                        };

                        const inviteCreateResult1 = (await _topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, '{asdasdas', 400)).body;

                        assert.deepEqual(inviteCreateResult1, expectedResponseBody);

                        const inviteCreateResult2 = (await _topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, 'PPPasdasdas', 400)).body;

                        assert.deepEqual(inviteCreateResult2, expectedResponseBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _topicInviteUsersCreatePromised(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', topic.id, [], 401);
                    });

                    test('Fail - 40300 - at least admin permissions required', async function () {
                        const agentInvalidUser = request.agent(app);
                        const invalidUser = await userLib.createUserAndLoginPromised(agentInvalidUser, null, null, null);

                        await _topicInviteUsersCreatePromised(agentInvalidUser, invalidUser.id, topic.id, [], 403);
                    });
                });

                suite('Read', function () {
                    const agentCreator = request.agent(app);
                    const agentUserToInvite = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let topic;
                    let topicInviteCreated;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUserAndLoginPromised(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicCreatePromised(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        topicInviteCreated = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20000', async function () {
                        const inviteRead = (await topicInviteUsersReadPromised(request.agent(app), topic.id, topicInviteCreated.id)).body.data;

                        const expectedInvite = Object.assign({}, topicInviteCreated); // Clone

                        expectedInvite.topic = {
                            id: topic.id,
                            title: topic.title,
                            visibility: topic.visibility,
                            creator: {
                                id: userCreator.id
                            }
                        };

                        expectedInvite.creator = {
                            company: null,
                            id: userCreator.id,
                            imageUrl: null,
                            name: userCreator.name
                        };

                        expectedInvite.user = {
                            id: userToInvite.id,
                            email: cosUtil.emailToMaskedEmail(userToInvite.email)
                        };

                        assert.deepEqual(inviteRead, expectedInvite);
                    });

                    // I invite has been accepted (deleted, but User has access)
                    test('Success - 20001', async function () {
                        const topicMemberUser = (await topicInviteUsersAcceptPromised(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id)).body.data;

                        assert.equal(topicMemberUser.topicId, topic.id);
                        assert.equal(topicMemberUser.userId, userToInvite.id);
                        assert.equal(topicMemberUser.level, topicInviteCreated.level);
                        assert.property(topicMemberUser, 'createdAt');
                        assert.property(topicMemberUser, 'updatedAt');
                        assert.property(topicMemberUser, 'deletedAt');

                        const inviteReadResult = (await topicInviteUsersReadPromised(request.agent(app), topic.id, topicInviteCreated.id)).body;
                        const expectedInvite = Object.assign({}, topicInviteCreated);

                        // Accepting the invite changes "updatedAt", thus these are not the same. Verify that the "updatedAt" exists and remove from expected and actual
                        assert.property(inviteReadResult.data, 'updatedAt');
                        delete inviteReadResult.data.updatedAt;
                        delete expectedInvite.updatedAt;

                        expectedInvite.topic = {
                            id: topic.id,
                            title: topic.title,
                            visibility: topic.visibility,
                            creator: {
                                id: userCreator.id
                            }
                        };

                        expectedInvite.creator = {
                            company: null,
                            id: userCreator.id,
                            imageUrl: null,
                            name: userCreator.name
                        };

                        expectedInvite.user = {
                            id: userToInvite.id,
                            email: cosUtil.emailToMaskedEmail(userToInvite.email)
                        };

                        const expectedInviteResult = {
                            status: {
                                code: 20001
                            },
                            data: expectedInvite
                        };

                        assert.deepEqual(inviteReadResult, expectedInviteResult);
                    });


                    test('Fail - 40400 - Not found', async function () {
                        await _topicInviteUsersReadPromised(request.agent(app), topic.id, 'f4bb46b9-87a1-4ae4-b6df-c2605ab8c471', 404);
                    });

                    test('Fail - 41001 - Deleted', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        topicInviteCreated = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];

                        await TopicInviteUser
                            .destroy({
                                where: {
                                    id: topicInviteCreated.id
                                }
                            });

                        const topicInviteRead = (await _topicInviteUsersReadPromised(request.agent(app), topic.id, topicInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41001,
                                message: 'The invite has been deleted'
                            }
                        };

                        assert.deepEqual(topicInviteRead, expectedBody);
                    });

                    test('Fail - 41002 - Expired', async function () {
                        await TopicInviteUser
                            .update(
                                {
                                    createdAt: db.literal(`NOW() - INTERVAL '${TopicInviteUser.VALID_DAYS + 1}d'`)
                                },
                                {
                                    where: {
                                        id: topicInviteCreated.id
                                    }
                                }
                            );

                        const topicInviteRead = (await _topicInviteUsersReadPromised(request.agent(app), topic.id, topicInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41002,
                                message: `The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`
                            }
                        };

                        assert.deepEqual(topicInviteRead, expectedBody);

                    });

                });

                suite('List', function () {
                    const agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite1;
                    let userToInvite2;

                    let topic;

                    let topicInviteCreated1;
                    let topicInviteCreated2;
                    let topicInviteCreated3;
                    let topicInviteCreated4;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        userToInvite1 = await userLib.createUserPromised(request.agent(app), null, null, null);
                        userToInvite2 = await userLib.createUserPromised(request.agent(app), null, null, null);

                        topic = (await topicCreatePromised(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;

                        const topicInvite11 = {
                            userId: userToInvite1.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const topicInvite12 = {
                            userId: userToInvite1.id,
                            level: TopicMemberUser.LEVELS.admin
                        };

                        const topicInvite21 = {
                            userId: userToInvite2.id,
                            level: TopicMemberUser.LEVELS.edit
                        };

                        const topicInvite22 = {
                            userId: userToInvite2.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        topicInviteCreated1 = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, topicInvite11)).body.data.rows[0];
                        topicInviteCreated2 = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, topicInvite12)).body.data.rows[0];
                        topicInviteCreated3 = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, topicInvite21)).body.data.rows[0];
                        topicInviteCreated4 = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, topicInvite22)).body.data.rows[0];

                        // Delete an invite
                        await topicInviteUsersDeletePromised(agentCreator, userCreator.id, topic.id, topicInviteCreated3.id);

                        // Expire an invite
                        await TopicInviteUser
                            .update(
                                {
                                    createdAt: db.literal(`NOW() - INTERVAL '${TopicInviteUser.VALID_DAYS + 1}d'`)
                                },
                                {
                                    where: {
                                        id: topicInviteCreated4.id
                                    }
                                }
                            );
                    });

                    test('Success - 20000 - 3 invites - 2 to same person with different level, 1 to other but deleted later, 1 to other but expired', async function () {
                        const invitesListResult = (await topicInviteUsersListPromised(agentCreator, userCreator.id, topic.id)).body.data;
                        assert.equal(2, invitesListResult.count);

                        const invitesList = invitesListResult.rows;
                        assert.isArray(invitesList);
                        assert.equal(2, invitesList.length);

                        // Make sure the deleted invite is not in the result
                        assert.isUndefined(invitesList.find(invite => {
                            return invite.id === topicInviteCreated3.id
                        }));

                        // Make sure the double invites are both present
                        // The list result has User object, otherwise the objects should be equal
                        const inviteListInvite1 = invitesList.find(invite => {
                            return invite.id === topicInviteCreated1.id
                        });

                        const inviteListInivteUser1 = inviteListInvite1.user;
                        assert.equal(inviteListInivteUser1.id, userToInvite1.id);
                        assert.equal(inviteListInivteUser1.name, userToInvite1.name);
                        assert.property(inviteListInivteUser1, 'imageUrl');
                        delete inviteListInvite1.user;
                        assert.deepEqual(inviteListInvite1, topicInviteCreated1);

                        // The list result has User object, otherwise the objects should be equal
                        const inviteListInvite2 = invitesList.find(invite => {
                            return invite.id === topicInviteCreated2.id
                        });
                        const inviteListInivteUser2 = inviteListInvite2.user;
                        assert.equal(inviteListInivteUser2.id, userToInvite1.id);
                        assert.equal(inviteListInivteUser2.name, userToInvite1.name);
                        assert.property(inviteListInivteUser2, 'imageUrl');
                        delete inviteListInvite2.user;
                        assert.deepEqual(inviteListInvite2, topicInviteCreated2);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _topicInviteUsersListPromised(request.agent(app), '93857ed7-a81a-4187-85de-234f6d06b011', topic.id, 401);
                    });

                    test('Fail - 40300 - at least read permissions required', async function () {
                        await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        await _topicInviteUsersListPromised(agentCreator, userCreator.id, topic.id, 403);
                    });

                });

                suite('Delete', function () {

                    suite('Success', function () {

                        const agentCreator = request.agent(app);

                        let userCreator;
                        let userToInvite;

                        let topic;
                        let topicInviteCreated;

                        suiteSetup(async function () {
                            userToInvite = await userLib.createUserPromised(request.agent(app), null, null, null);
                            userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                            topic = (await topicCreatePromised(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;

                            const invitation = {
                                userId: userToInvite.id,
                                level: TopicMemberUser.LEVELS.read
                            };

                            topicInviteCreated = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];
                        });

                        test('Success - 20000', async function () {
                            const userDeleteResult = (await topicInviteUsersDeletePromised(agentCreator, userCreator.id, topic.id, topicInviteCreated.id)).body;

                            const expectedBody = {
                                status: {
                                    code: 20000
                                }
                            };

                            assert.deepEqual(userDeleteResult, expectedBody);

                            const topicInvite = await TopicInviteUser
                                .findOne({
                                    where: {
                                        id: topicInviteCreated.id,
                                        topicId: topic.id
                                    },
                                    paranoid: false
                                });

                            assert.isNotNull(topicInvite, 'deletedAt');
                        });

                        test('Fail - 40401 - Invite not found', async function () {
                            const userDeleteResult = (await _topicInviteUsersDeletePromised(agentCreator, userCreator.id, topic.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 404)).body;

                            const expectedBody = {
                                status: {
                                    code: 40401,
                                    message: 'Invite not found'
                                }
                            };

                            assert.deepEqual(userDeleteResult, expectedBody);
                        });


                        test('Fail - 40100 - Unauthorized', async function () {
                            await _topicInviteUsersDeletePromised(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', topic.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 401);
                        });

                        test('Fail - 40300 - at least admin permissions required', async function () {
                            const agentInvalidUser = request.agent(app);
                            const invalidUser = await userLib.createUserAndLoginPromised(agentInvalidUser, null, null, null);

                            await _topicInviteUsersDeletePromised(agentInvalidUser, invalidUser.id, topic.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 403);
                        });

                    });

                });

                suite('Accept', function () {

                    const agentCreator = request.agent(app);
                    const agentUserToInvite = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let topic;
                    let topicInviteCreated;

                    setup(async function () {
                        userToInvite = await userLib.createUserAndLoginPromised(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        topic = (await topicCreatePromised(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST ACCEPT</h2></body></html>', null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.edit
                        };

                        topicInviteCreated = (await topicInviteUsersCreatePromised(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20100 - New member created', async function () {
                        const topicMemberUser = (await topicInviteUsersAcceptPromised(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id)).body.data;

                        assert.equal(topicMemberUser.topicId, topic.id);
                        assert.equal(topicMemberUser.userId, userToInvite.id);
                        assert.equal(topicMemberUser.level, topicInviteCreated.level);
                        assert.property(topicMemberUser, 'createdAt');
                        assert.property(topicMemberUser, 'updatedAt');
                        assert.property(topicMemberUser, 'deletedAt');
                    });

                    test('Success - 20000 - User already a Member, but accepts an Invite', async function () {
                        await topicInviteUsersAcceptPromised(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id);
                        const topicMemberUser = (await _topicInviteUsersAcceptPromised(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id, 200)).body.data;

                        assert.equal(topicMemberUser.topicId, topic.id);
                        assert.equal(topicMemberUser.userId, userToInvite.id);
                        assert.equal(topicMemberUser.level, topicInviteCreated.level);
                        assert.property(topicMemberUser, 'createdAt');
                        assert.property(topicMemberUser, 'updatedAt');
                        assert.property(topicMemberUser, 'deletedAt');
                    });

                    test('Fail - 40400 - Cannot accept deleted invite', async function () {
                        await topicInviteUsersDeletePromised(agentCreator, userCreator.id, topic.id, topicInviteCreated.id);
                        await _topicInviteUsersAcceptPromised(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id, 404);
                    });

                    test('Fail - 41002 - Cannot accept expired invite', async function () {
                        await TopicInviteUser
                            .update(
                                {
                                    createdAt: db.literal(`NOW() - INTERVAL '${TopicInviteUser.VALID_DAYS + 1}d'`)
                                },
                                {
                                    where: {
                                        id: topicInviteCreated.id
                                    }
                                }
                            );

                        const acceptResult = (await _topicInviteUsersAcceptPromised(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41002,
                                message: `The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`
                            }
                        };

                        assert.deepEqual(acceptResult, expectedBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _topicInviteUsersAcceptPromised(request.agent(app), '93857ed7-a81a-4187-85de-234f6d06b011', topic.id, topicInviteCreated.id, 401);
                    });

                    test('Fail - 40300 - Forbidden - Cannot accept for someone else', async function () {
                        await _topicInviteUsersAcceptPromised(agentCreator, userToInvite.id, topic.id, topicInviteCreated.id, 403);
                    });
                });

            });

        });

        suite('Join', function () {
            var agentCreator = request.agent(app);
            var agentUser = request.agent(app);

            var creator;
            var user;

            var topic;

            suiteSetup(function (done) {
                async
                    .parallel(
                        [
                            function (cb) {
                                userLib.createUserAndLogin(agentCreator, null, null, null, cb);
                            },
                            function (cb) {
                                userLib.createUserAndLogin(agentUser, null, null, null, cb);
                            }
                        ],
                        function (err, results) {
                            if (err) return done(err);

                            creator = results[0];
                            user = results[1];

                            done();
                        }
                    );
            });

            setup(function (done) {
                topicCreate(agentCreator, creator.id, null, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    topic = res.body.data;

                    done();
                });
            });

            test('Success - 20000', function (done) {
                topicJoin(agentUser, topic.tokenJoin, function (err, res) {
                    if (err) return done(err);

                    delete topic.permission;
                    delete topic.pinned;
                    topic.padUrl = topic.padUrl.split('?')[0]; // Pad url will not have JWT token as the user gets read-only by default

                    var expectedResult = {
                        status: {
                            code: 20000
                        },
                        data: topic
                    };

                    assert.deepEqual(res.body, expectedResult);

                    topicRead(agentUser, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var topicRead = res.body.data;
                        assert.equal(topicRead.permission.level, TopicMemberUser.LEVELS.read);

                        done();
                    });
                });
            });

            test('Fail - 40101 - Matching token not found', function (done) {
                _topicJoin(agentUser, 'nonExistentToken', 400, function (err, res) {
                    if (err) return done(err);

                    var expectedResult = {
                        status: {
                            code: 40001,
                            message: 'Matching token not found'
                        }
                    };
                    assert.deepEqual(res.body, expectedResult);
                    done();
                });
            });

            test('Fail - 40100 - Unauthorized', function (done) {
                _topicJoin(request.agent(app), topic.tokenJoin, 401, function (err) {
                    if (err) return done(err);

                    done();
                });
            });

        });

        // API - /api/users/:userId/topics/:topicId/votes
        suite('Votes', function () {

            suite('Create', function () {
                var agent = request.agent(app);

                var user;
                var topic;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;
                        done();
                    });
                });

                setup(function (done) {
                    topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                        if (err) return done(err);
                        topic = res.body.data;
                        done();
                    });
                });

                test('Success', function (done) {
                    var options = [
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

                    var description = 'Vote description';

                    topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, null, function (err, res) {
                        if (err) return done(err);

                        var vote = res.body.data;

                        assert.property(vote, 'id');
                        assert.equal(vote.minChoices, 1);
                        assert.equal(vote.maxChoices, 1);
                        assert.equal(vote.delegationIsAllowed, false);
                        assert.isNull(vote.endsAt);
                        assert.equal(vote.description, description);
                        assert.equal(vote.authType, Vote.AUTH_TYPES.soft);

                        // Topic should end up in "voting" status
                        Topic
                            .findOne({
                                where: {
                                    id: topic.id
                                }
                            })
                            .then(function (t) {
                                assert.equal(t.status, Topic.STATUSES.voting);
                                done();
                            })
                            .catch(done);
                    });
                });

                test('Success - multiple choice', function (done) {
                    let options = [
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

                    let description = 'Vote description';
                    let minChoices = 1;
                    let maxChoices = 2;

                    topicVoteCreate(agent, user.id, topic.id, options, minChoices, maxChoices, null, null, description, null, null, function (err, res) {
                        if (err) return done(err);

                        var vote = res.body.data;

                        assert.property(vote, 'id');
                        assert.equal(vote.minChoices, minChoices);
                        assert.equal(vote.maxChoices, maxChoices);
                        assert.equal(vote.delegationIsAllowed, false);
                        assert.isNull(vote.endsAt);
                        assert.equal(vote.description, description);
                        assert.equal(vote.authType, Vote.AUTH_TYPES.soft);

                        // Topic should end up in "voting" status
                        Topic
                            .findOne({
                                where: {
                                    id: topic.id
                                }
                            })
                            .then(function (t) {
                                assert.equal(t.status, Topic.STATUSES.voting);
                                done();
                            })
                            .catch(done);
                    });
                });

                test('Success - authType === hard', function (done) {
                    var options = [
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

                    var description = 'Vote description';

                    topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, Vote.AUTH_TYPES.hard, function (err, res) {
                        if (err) return done(err);

                        var vote = res.body.data;

                        assert.equal(vote.authType, Vote.AUTH_TYPES.hard);

                        db
                            .query(
                                ' \
                                 SELECT \
                                    "mimeType", \
                                    "fileName" \
                                 FROM "VoteContainerFiles" \
                                 WHERE "voteId" = :voteId \
                                 ORDER BY "fileName" \
                                ',
                                {
                                    replacements: {
                                        voteId: vote.id
                                    },
                                    type: db.QueryTypes.SELECT,
                                    raw: true,
                                    nest: true
                                }
                            )
                            .then(function (voteContainerFiles) {
                                var expected = [
                                    {
                                        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                        fileName: 'document.docx'
                                    },
                                    {
                                        mimeType: 'text/html',
                                        fileName: '__metainfo.html'
                                    },
                                    {
                                        mimeType: 'text/html',
                                        fileName: options[0].value + '.html'
                                    },
                                    {
                                        mimeType: 'text/html',
                                        fileName: options[1].value + '.html'
                                    },
                                    {
                                        mimeType: 'text/html',
                                        fileName: options[2].value + '.html'
                                    }
                                ];

                                assert.deepEqual(voteContainerFiles, expected);

                                done();
                            });
                    });
                });

                test('Fail - Bad Request - at least 2 vote options are required', function (done) {
                    var options = [
                        {
                            value: 'Option 1'
                        }
                    ];
                    _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40001,
                                message: 'At least 2 vote options are required'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - Bad Request - authType == hard - options too similar', function (done) {
                    var options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 1'
                        }
                    ];

                    var description = 'Vote description';

                    _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, Vote.AUTH_TYPES.hard, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40002,
                                message: 'Vote options are too similar'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - Bad Request - authType == hard - usage of reserved prefix', function (done) {
                    var options = [
                        {
                            value: '__Option 1'
                        },
                        {
                            value: 'Option 2'
                        }
                    ];

                    var description = 'Vote description';

                    _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, Vote.AUTH_TYPES.hard, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40004,
                                message: 'Vote option not allowed due to usage of reserved prefix "' + VoteOption.RESERVED_PREFIX + '"'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - Bad Request - endsAt cannot be in the past', function (done) {
                    var options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 3'
                        }
                    ];

                    var dateInThePast = new Date().setDate(new Date().getDate() - 1);

                    _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, dateInThePast, null, null, null, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40000
                            },
                            errors: {
                                endsAt: 'Voting deadline must be in the future.'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - Bad Request - delegation is not allowed for authType = hard', function (done) {
                    var options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 3'
                        }
                    ];

                    var authType = Vote.AUTH_TYPES.hard;
                    var delegationIsAllowed = true;

                    _topicVoteCreate(agent, user.id, topic.id, options, null, null, delegationIsAllowed, null, null, null, authType, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40003,
                                message: 'Delegation is not allowed for authType "' + authType + '"'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - Forbidden - Vote creation is allowed only if Topic status is "inProgress"', function (done) {
                    var options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 2'
                        }
                    ];

                    // Create a vote, that will set it to "inVoting" status, thus further Vote creation should not be allowed.
                    topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, function (err) {
                        if (err) return done(err);

                        _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, 403, function (err) {
                            if (err) return done(err);

                            done();
                        });
                    });
                });

                test('Fail - Bad Request - Vote option too long', function (done) {
                    var options = [
                        {
                            value: 'This option is too long to be inserted in the database, because we have 200 character limit set. This is too long This is too long This is too long This is too long This is too long This is too long This is too long This is too long'
                        },
                        {
                            value: 'Option 3'
                        }
                    ];


                    _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40000
                            },
                            errors: {
                                value: 'Option value can be 1 to 200 characters long.'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

            });

            suite('Read', function () {
                var agent = request.agent(app);

                var voteOptions = [
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

                var voteDescription = 'Vote description';

                var user;
                var topic;
                var vote;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;
                        done();
                    });
                });

                setup(function (done) {
                    topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                        if (err) return done(err);
                        topic = res.body.data;

                        topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, null, null, voteDescription, null, null, function (err, res) {
                            if (err) return done(err);
                            vote = res.body.data;
                            done();
                        });
                    });
                });

                test('Success', function (done) {
                    topicVoteRead(agent, user.id, topic.id, vote.id, function (err, res) {
                        if (err) return done(err);

                        var vote = res.body.data;

                        assert.property(vote, 'id');
                        assert.equal(vote.minChoices, 1);
                        assert.equal(vote.maxChoices, 1);
                        assert.equal(vote.delegationIsAllowed, false);
                        assert.isNull(vote.endsAt);
                        assert.equal(vote.description, voteDescription);
                        assert.equal(vote.type, Vote.TYPES.regular);
                        assert.equal(vote.authType, Vote.AUTH_TYPES.soft);

                        var options = vote.options;

                        assert.equal(options.count, 3);
                        assert.equal(options.rows.length, 3);

                        _(options.rows).forEach(function (o, index) {
                            assert.property(o, 'id');
                            assert.equal(o.value, voteOptions[index].value);
                        });

                        done();
                    });
                });

                test('Fail - Not Found - trying to access Vote that does not belong to the Topic', function (done) {
                    topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        var topicWrong = res.body.data;

                        _topicVoteRead(agent, user.id, topicWrong.id, vote.id, 404, done);
                    });
                });

            });

            suite('Update', function () {

                var agent = request.agent(app);

                var voteOptions = [
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

                var voteEndsAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
                var voteDescription = 'Vote description';

                var user;
                var topic;
                var vote;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;
                        done();
                    });
                });

                setup(function (done) {
                    topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                        if (err) return done(err);
                        topic = res.body.data;

                        topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, null, voteEndsAt, voteDescription, null, null, function (err, res) {
                            if (err) return done(err);
                            vote = res.body.data;
                            done();
                        });
                    });
                });

                test('Success', function (done) {
                    var newEndsAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
                    topicVoteUpdate(agent, user.id, topic.id, vote.id, newEndsAt, function (err) {
                        if (err) return done(err);

                        topicVoteRead(agent, user.id, topic.id, vote.id, function (err, res) {
                            if (err) return done(err);

                            assert.equalTime(new Date(res.body.data.endsAt), newEndsAt);

                            done();
                        });
                    });
                });

            });

            suite('Delegations', function () {
                let user;
                const agent = request.agent(app);

                let toUser1;
                const agentToUser1 = request.agent(app);

                let toUser2;
                const agentToUser2 = request.agent(app);

                let toUser3;
                const agentToUser3 = request.agent(app);

                let toUser4;
                const agentToUser4 = request.agent(app);

                let toUser5;
                const agentToUser5 = request.agent(app);

                let toUser6;
                const agentToUser6 = request.agent(app);

                suiteSetup(async function () {
                    const usersCreatePromises = [
                        userLib.createUserAndLoginPromised(agent, null, null, null),
                        userLib.createUserAndLoginPromised(agentToUser1, null, null, 'et'),
                        userLib.createUserAndLoginPromised(agentToUser2, null, null, 'et'),
                        userLib.createUserAndLoginPromised(agentToUser3, null, null, 'et'),
                        userLib.createUserAndLoginPromised(agentToUser4, null, null, null),
                        userLib.createUserAndLoginPromised(agentToUser5, null, null, null),
                        userLib.createUserAndLoginPromised(agentToUser6, null, null, null)
                    ];

                    [user, toUser1, toUser2, toUser3, toUser4, toUser5, toUser6] = await Promise.all(usersCreatePromises);
                });

                suite('Create', function () {

                    test('Success - OK - new delegation', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

                        const members = [
                            {
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];

                        await topicMemberUsersCreatePromised(agent, user.id, topic.id, members);
                        await topicVoteDelegationCreatePromised(agent, user.id, topic.id, voteRead.id, toUser1.id);
                        const voteReadAfterDelegation = (await topicVoteReadPromised(agent, user.id, topic.id, voteRead.id)).body.data;

                        assert.deepEqual(voteReadAfterDelegation.delegation, toUser1.toJSON());
                    });

                    test('Success - OK - change delegation', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

                        const members = [
                            {
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser2.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];
                        await topicMemberUsersCreatePromised(agent, user.id, topic.id, members);

                        await topicVoteDelegationCreatePromised(agent, user.id, topic.id, voteRead.id, toUser1.id); // 1st delegation
                        await topicVoteDelegationCreatePromised(agent, user.id, topic.id, voteRead.id, toUser2.id); // Change the delegation

                        const voteReadAfterDelegation = (await topicVoteReadPromised(agent, user.id, topic.id, voteRead.id)).body.data;

                        assert.deepEqual(voteReadAfterDelegation.delegation, toUser2.toJSON());
                    });

                    test('Success - OK - count delegated votes and not delegated votes - Delegation chain U->U1->U2->U3, U4->U5, U6 no delegation', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2',
                            },
                            {
                                value: 'Option 3'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

                        const members = [
                            {
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser2.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser3.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser4.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser5.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser6.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];

                        await topicMemberUsersCreatePromised(agent, user.id, topic.id, members);

                        await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[0].id}], null, null, null, null);

                        const delegationPromises = [
                            topicVoteDelegationCreatePromised(agent, user.id, topic.id, voteRead.id, toUser1.id),
                            topicVoteDelegationCreatePromised(agentToUser1, toUser1.id, topic.id, voteRead.id, toUser2.id),
                            topicVoteDelegationCreatePromised(agentToUser2, toUser2.id, topic.id, voteRead.id, toUser3.id),
                            topicVoteDelegationCreatePromised(agentToUser4, toUser4.id, topic.id, voteRead.id, toUser5.id)
                        ];
                        await Promise.all(delegationPromises);

                        const votePromises = [
                            topicVoteVotePromised(agentToUser3, toUser3.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[0].id}], null, null, null, null),
                            topicVoteVotePromised(agentToUser5, toUser5.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[1].id}], null, null, null, null),
                            topicVoteVotePromised(agentToUser6, toUser6.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[1].id}], null, null, null, null)
                        ];
                        await Promise.all(votePromises);

                        const voteReadAfterVote = (await topicVoteReadPromised(agentToUser6, toUser6.id, topic.id, voteRead.id)).body.data;
                        const voteReadAfterVoteOptions = voteReadAfterVote.options.rows;

                        voteReadAfterVoteOptions.forEach(function (option) {
                            switch (option.id) {
                                case voteRead.options.rows[0].id:
                                    assert.equal(option.voteCount, 4);
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[1].id:
                                    assert.equal(option.voteCount, 2 + 1);
                                    assert.isTrue(option.selected);
                                    break;
                                case voteRead.options.rows[2].id:
                                    assert.notProperty(option, 'voteCount');
                                    assert.notProperty(option, 'selected');
                                    break;
                                default:
                                    throw new Error('SHOULD NEVER HAPPEN!');
                            }
                        });
                    });

                    test('Success - OK - multiple choice - delegated votes and not delegated votes - Delegation chain U->U1->U2->U3, U4->U5, U6 no delegation', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            },
                            {
                                value: 'Option 3'
                            },
                            {
                                value: 'Option 4'
                            },
                            {
                                value: 'Option 5'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, 2, 3, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

                        const members = [
                            {
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser2.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser3.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser4.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser5.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser6.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];
                        await topicMemberUsersCreatePromised(agent, user.id, topic.id, members);

                        const voteList1 = [ // Will be overwritten by delegation
                            {
                                optionId: voteRead.options.rows[0].id
                            },
                            {
                                optionId: voteRead.options.rows[3].id
                            }
                        ];
                        await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null);

                        const delegationPromises = [
                            topicVoteDelegationCreatePromised(agent, user.id, topic.id, voteRead.id, toUser1.id),
                            topicVoteDelegationCreatePromised(agentToUser1, toUser1.id, topic.id, voteRead.id, toUser2.id),
                            topicVoteDelegationCreatePromised(agentToUser2, toUser2.id, topic.id, voteRead.id, toUser3.id),
                            topicVoteDelegationCreatePromised(agentToUser4, toUser4.id, topic.id, voteRead.id, toUser5.id)
                        ];
                        await Promise.all(delegationPromises);

                        const voteListUser3 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            },
                            {
                                optionId: voteRead.options.rows[1].id
                            }
                        ];

                        const voteListUser5 = [
                            {
                                optionId: voteRead.options.rows[1].id,
                            },
                            {
                                optionId: voteRead.options.rows[2].id
                            }
                        ];

                        const voteListUser6 = [ // 1 (U6)
                            {
                                optionId: voteRead.options.rows[1].id
                            },
                            {
                                optionId: voteRead.options.rows[3].id
                            }
                        ];

                        const votePromises = [
                            topicVoteVotePromised(agentToUser3, toUser3.id, topic.id, voteRead.id, voteListUser3, null, null, null, null),
                            topicVoteVotePromised(agentToUser5, toUser5.id, topic.id, voteRead.id, voteListUser5, null, null, null, null),
                            topicVoteVotePromised(agentToUser6, toUser6.id, topic.id, voteRead.id, voteListUser6, null, null, null, null)
                        ];
                        await Promise.all(votePromises);

                        const voteReadAfterVote = (await topicVoteReadPromised(agentToUser6, toUser6.id, topic.id, voteRead.id)).body.data;
                        const voteReadAfterVoteOptions = voteReadAfterVote.options.rows;

                        voteReadAfterVoteOptions.forEach(function (option) {
                            switch (option.id) {
                                case voteRead.options.rows[0].id:
                                    assert.equal(option.voteCount, 3 + 1); // U->U1->U2->U3
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[1].id:
                                    assert.equal(option.voteCount, (3 + 1) + (1 + 1) + 1); // U->U1->U2->U3, U4->U5, U6
                                    assert.isTrue(option.selected);
                                    break;
                                case voteRead.options.rows[2].id:
                                    assert.equal(option.voteCount, (1 + 1)); // U4->U5
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[3].id:
                                    assert.equal(option.voteCount, 1); // U6
                                    assert.isTrue(option.selected);
                                    break;
                                case voteRead.options.rows[4].id:
                                    assert.notProperty(option, 'voteCount');
                                    assert.notProperty(option, 'selected');
                                    break;
                                default:
                                    throw new Error('SHOULD NEVER HAPPEN!');
                            }
                        });

                        // User will re-vote, thus the delegation will be overriden
                        const voteList3 = [ // Will override the delegated vote
                            {
                                optionId: voteRead.options.rows[2].id
                            },
                            {
                                optionId: voteRead.options.rows[4].id
                            }
                        ];

                        await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList3, null, null, null, null);

                        const voteReadAfterVoteForOverride = (await topicVoteReadPromised(agent, user.id, topic.id, voteRead.id)).body.data;
                        const voteReadAfterVoteForOverrideOptions = voteReadAfterVoteForOverride.options.rows;

                        voteReadAfterVoteForOverrideOptions.forEach(function (option) {
                            switch (option.id) {
                                case voteRead.options.rows[0].id:
                                    assert.equal(option.voteCount, 2 + 1); // U1->U2->U3
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[1].id:
                                    assert.equal(option.voteCount, (2 + 1) + (1 + 1) + 1); // U->U1->U2->U3, U4->U5, U6
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[2].id:
                                    assert.equal(option.voteCount, (1 + 1) + 1); // U4->U5, U
                                    assert.isTrue(option.selected);
                                    break;
                                case voteRead.options.rows[3].id:
                                    assert.equal(option.voteCount, 1); // U6
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[4].id:
                                    assert.equal(option.voteCount, 1); // U
                                    assert.isTrue(option.selected);
                                    break;
                                default:
                                    throw new Error('SHOULD NEVER HAPPEN!');
                            }
                        });
                    });

                    test('Fail - 40000 - cyclic delegation - U->U1->U2-->U', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;

                        const members = [
                            {
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: toUser2.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];

                        await topicMemberUsersCreatePromised(agent, user.id, topic.id, members);

                        await topicVoteDelegationCreatePromised(agent, user.id, topic.id, topicVoteCreated.id, toUser1.id);
                        await topicVoteDelegationCreatePromised(agentToUser1, toUser1.id, topic.id, topicVoteCreated.id, toUser2.id);
                        const responseDelegation = (await _topicVoteDelegationCreatePromised(agentToUser2, toUser2.id, topic.id, topicVoteCreated.id, user.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40000,
                                message: 'Sorry, you cannot delegate your vote to this person.'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test('Fail - 40001 - Cannot delegate to self', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;

                        const responseDelegation = (await _topicVoteDelegationCreatePromised(agent, user.id, topic.id, topicVoteCreated.id, user.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40001,
                                message: 'Cannot delegate to self.'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test('Fail - 40002 - Cannot delegate Vote to User who does not have access to this Topic', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const userWithNoAccess = await userLib.createUserPromised(request.agent(app), null, null, null);

                        const responseDelegation = (await _topicVoteDelegationCreatePromised(agent, user.id, topic.id, topicVoteCreated.id, userWithNoAccess.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40002,
                                message: 'Cannot delegate Vote to User who does not have access to this Topic.'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test('Fail - 40300 - delegation is only allowed when voting is in progress', async function () {
                        const topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatusPromised(agent, user.id, topic.id, Topic.STATUSES.closed);

                        const responseDelegation = (await _topicVoteDelegationCreatePromised(agent, user.id, topic.id, topicVoteCreated.id, toUser1.id, 403)).body;

                        const responseExpected = {
                            status: {
                                code: 40300,
                                message: 'Insufficient permissions'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test.skip('Fail - Bad Request - delegation is not allowed for the Vote', async function () {
                        throw new Error('NOT IMPLEMENTED!');
                    });
                });

                suite('Delete', function () {
                    let topic;
                    let vote;

                    setup(async function () {
                        topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        vote = (await topicVoteReadPromised(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

                        const members = [
                            {
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];
                        await topicMemberUsersCreatePromised(agent, user.id, topic.id, members);
                        await topicVoteDelegationCreatePromised(agent, user.id, topic.id, vote.id, toUser1.id);
                    });

                    test('Success', async function () {
                        await topicVoteDelegationDeletePromised(agent, user.id, topic.id, vote.id);
                        const topicVoteReadAfterDelegationDelete = (await topicVoteReadPromised(agent, user.id, topic.id, vote.id)).body.data;

                        assert.notProperty(topicVoteReadAfterDelegationDelete, 'delegation');
                    });

                    test('Fail - 40000 - Vote end time has passed, cannot delete delegation', async function () {
                        //Set the end date to past
                        const date = new Date();
                        date.setDate(date.getDate() - 1);

                        await Vote.update(
                            {
                                endsAt: date // 1 day in the past
                            },
                            {
                                where: {
                                    id: vote.id
                                },
                                validate: false
                            }
                        );

                        const responseDelegationDelete = (await _topicVoteDelegationDeletePromised(agent, user.id, topic.id, vote.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40001,
                                message: 'The Vote has ended.'
                            }
                        };

                        assert.deepEqual(responseDelegationDelete, responseExpected);
                    });

                    test('Fail - Forbidden - Voting has ended (Topic.status != voting), cannot delete delegation', async function () {
                        await topicUpdateStatusPromised(agent, user.id, topic.id, Topic.STATUSES.followUp);

                        const responseDelegationDelete = (await _topicVoteDelegationDeletePromised(agent, user.id, topic.id, vote.id, 403)).body;

                        const responseExpected = {
                            status: {
                                code: 40300,
                                message: 'Insufficient permissions'
                            }
                        };

                        assert.deepEqual(responseDelegationDelete, responseExpected);
                    });

                });
            });

            suite('Vote', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);

                let user;
                let user2;
                let topic;
                let topicPublic;

                setup(async function () {
                    user = await userLib.createUserAndLoginPromised(agent, null, null, null);
                    user2 = await userLib.createUserAndLoginPromised(agent2, null, null, 'et');
                    topic = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
                    topicPublic = (await topicCreatePromised(agent, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                });

                suite('authType === soft', function () {

                    test('Success', async function () {
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

                        const vote = (await topicVoteCreatePromised(agent, user.id, topic.id, options, null, null, null, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, vote.id)).body.data;

                        const voteList = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];
                        await topicVoteVotePromised(agent, user.id, topic.id, vote.id, voteList, null, null, null, null);
                        const voteReadAfterVote = (await topicVoteReadPromised(agent, user.id, topic.id, vote.id)).body.data;

                        _(voteList).forEach(function (voteOption) {
                            const option = _.find(voteReadAfterVote.options.rows, {id: voteOption.optionId});
                            assert.equal(option.voteCount, 1);
                        });
                    });

                    test('Success - multiple choice - vote and re-vote', async function () {
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

                        const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 2, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                            },
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                            }
                        ];

                        await topicVoteVotePromised(agent, user.id, topic.id, voteCreated.id, voteList1, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                        _(voteList1).forEach(function (voteOption) {
                            const option = _.find(voteReadAfterVote1.options.rows, {id: voteOption.optionId});
                            assert.equal(option.voteCount, 1);
                        });

                        // Vote for the 2nd time, change your vote, by choosing 1
                        const voteList2 = [
                            {
                                optionId: _.find(voteCreated.options.rows, {value: options[1].value}).id
                            },
                            {
                                optionId: _.find(voteCreated.options.rows, {value: options[2].value}).id
                            }
                        ];

                        await topicVoteVotePromised(agent, user.id, topic.id, voteCreated.id, voteList2, null, null, null, null);
                        const voteReadAfterVote2 = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                        // Check that the 2nd vote was counted
                        voteReadAfterVote2.options.rows.forEach(function (option) {
                            switch (option.id) {
                                case voteList2[0].optionId:
                                    assert.equal(option.voteCount, 1);
                                    assert.isTrue(option.selected);
                                    break;
                                case voteList2[1].optionId:
                                    assert.equal(option.voteCount, 1);
                                    assert.isTrue(option.selected);
                                    break;
                                default:
                                    assert.notProperty(option, 'voteCount');
                                    assert.notProperty(option, 'selected');
                            }
                        });

                        // Check that the 1st vote was overwritten
                        const optionOverwritten = _.find(voteReadAfterVote2.options.rows, {id: voteList1[0].optionId});
                        assert.notProperty(optionOverwritten, 'voteCount');
                        assert.notProperty(optionOverwritten, 'selected');

                        // Verify the result of topic information, see that vote result is the same
                        const topicReadAfterVote = (await topicReadPromised(agent, user.id, topic.id, ['vote'])).body.data;

                        assert.deepEqual(topicReadAfterVote.vote, voteReadAfterVote2);
                    });

                    test('Success - public topic user with logged in', async function () {
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


                        const vote = (await topicVoteCreatePromised(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topicPublic.id, vote.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];

                        await topicVoteVotePromised(agent2, user2.id, topicPublic.id, vote.id, voteList1, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteReadPromised(agent2, user2.id, topicPublic.id, vote.id)).body.data;

                        voteReadAfterVote1.options.rows.forEach(function (voteOption) {
                            if (voteOption.id === voteList1[0].optionId) {
                                assert.equal(voteOption.voteCount, 1);
                                assert.isTrue(voteOption.selected);
                            } else {
                                assert.notProperty(voteOption, 'voteCount');
                                assert.notProperty(voteOption, 'selected');
                            }
                        })
                    });

                    test('Fail - Not Found - trying to vote on a Topic while the Vote actually does not belong to the Topic', async function () {
                        const topicWrong = (await topicCreatePromised(agent, user.id, null, null, null, null, null)).body.data;
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

                        const topicVoteWrong = (await topicVoteCreatePromised(agent, user.id, topicWrong.id, options, null, null, null, null, null, null, null)).body.data;
                        const topicVoteRight = (await topicVoteCreatePromised(agent, user.id, topic.id, options, null, null, null, null, null, null, null)).body.data;
                        const topicVoteReadRight = (await topicVoteReadPromised(agent, user.id, topic.id, topicVoteRight.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: topicVoteReadRight.options.rows[0].id
                            }
                        ];

                        // Try out wrong topicId & voteId combos
                        await _topicVoteVotePromised(agent, user.id, topicWrong.id, topicVoteRight.id, voteList1, null, null, null, null, 404);
                        await _topicVoteVotePromised(agent, user.id, topic.id, topicVoteWrong.id, voteList1, null, null, null, null, 404);
                    });

                    test('Fail - Bad Request - too many options chosen', async function () {
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


                        const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 1, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            },
                            {
                                optionId: voteRead.options.rows[1].id
                            }
                        ];

                        const voteResult = (await _topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null, 400)).body;
                        const voteResultExpected = {
                            status: {
                                code: 40000,
                                message: 'The options must be an array of minimum 1 and maximum 1 options.'
                            }
                        };

                        assert.deepEqual(voteResult, voteResultExpected);
                    });

                    test('Fail - Bad Request - not enough options chosen', async function () {
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


                        const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 1, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [];

                        const voteResult = (await _topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null, 400)).body;
                        const voteResultExpected = {
                            status: {
                                code: 40000,
                                message: 'The options must be an array of minimum 1 and maximum 1 options.'
                            }
                        };

                        assert.deepEqual(voteResult, voteResultExpected);
                    });

                    test('Fail - Bad Request - vote has ended (NOW > endsAt)', async function () {
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

                        const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 1, false, new Date(), null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];

                        const voteResult = (await _topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null, 400)).body;
                        const voteResultExpected = {
                            status: {
                                code: 40000,
                                message: 'The Vote has ended.'
                            }
                        };

                        assert.deepEqual(voteResult, voteResultExpected);
                    });

                    test('Fail - Public topic, user not logged in', async function () {
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

                        const voteCreated = (await topicVoteCreatePromised(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteReadPromised(agent, user.id, topicPublic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];

                        // Log out the user
                        await authLib.logoutPromised(agent2);

                        const voteResult = (await _topicVoteVotePromised(agent2, user2.id, topicPublic.id, voteRead.id, voteList1, null, null, null, null, 401)).body;
                        const voteResultExpected = {
                            status: {
                                code: 40100,
                                message: 'Unauthorized'
                            }
                        };

                        assert.deepEqual(voteResult, voteResultExpected);
                    });

                    test.skip('Fail - Bad Request - option id does not belong to the Vote', async function () {
                        //TODO: Check that you cannot vote for options that do not belong to the Vote
                        throw new Error('NOT IMPLEMENTED!');
                    });

                });

                suite('authType === hard', function () {
                    this.timeout(10000); //eslint-disable-line no-invalid-this

                    suite('ID-card', function () {

                        suite('Init', function () {
                            var vote;
                            var vote2;

                            setup(function (done) {
                                var options = [
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
                                async
                                    .parallel(
                                        [
                                            function (cb) {
                                                topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard, cb);
                                            },
                                            function (cb) {
                                                topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard, cb);
                                            }
                                        ],
                                        function (err, results) {
                                            if (err) return done(err);

                                            vote = results[0].body.data;
                                            vote2 = results[1].body.data;
                                            done();
                                        }
                                    );
                            });

                            teardown(function (done) {
                                UserConnection
                                    .destroy({
                                        where: {
                                            connectionId: UserConnection.CONNECTION_IDS.esteid,
                                            connectionUserId: ['PNOEE-37101010021']
                                        },
                                        force: true
                                    })
                                    .then(function () {
                                        done();
                                    })
                                    .catch(done);
                            });

                            test('Success', function (done) {
                                var voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];

                                var certificate = fs.readFileSync('./test/resources/certificates/dds_good_igor_sign_hex_encoded_der.crt').toString(); //eslint-disable-line no-sync
                                topicVoteVote(agent, user.id, topic.id, vote.id, voteList, certificate, null, null, null, function (err, res) {
                                    if (err) return done(err);

                                    var status = res.body.status;
                                    var data = res.body.data;

                                    assert.deepEqual(status, {code: 20001});
                                    assert.property(data, 'signedInfoDigest');
                                    assert.isTrue(data.signedInfoDigest.length > 0);

                                    done();
                                });
                            });

                            test('Success - unauth', function (done) {
                                var reqAgent = request.agent(app);
                                var voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];

                                var certificate = fs.readFileSync('./test/resources/certificates/dds_good_igor_sign_hex_encoded_der.crt').toString(); //eslint-disable-line no-sync
                                topicVoteVoteUnauth(reqAgent, topicPublic.id, vote2.id, voteList, certificate, null, null, function (err, res) {
                                    if (err) return done(err);

                                    var status = res.body.status;
                                    var data = res.body.data;

                                    assert.deepEqual(status, {code: 20001});
                                    assert.property(data, 'signedInfoDigest');
                                    assert.isTrue(data.signedInfoDigest.length > 0);

                                    done();
                                });
                            });

                            test('Fail - unauth - topic is private', function (done) {
                                var reqAgent = request.agent(app);
                                var voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];

                                var certificate = fs.readFileSync('./test/resources/certificates/dds_good_igor_sign_hex_encoded_der.crt').toString(); //eslint-disable-line no-sync
                                _topicVoteVoteUnauth(reqAgent, topic.id, vote.id, voteList, certificate, null, null, 401, function (err, res) {
                                    if (err) return done(err);

                                    var status = res.body.status;

                                    assert.deepEqual(status, {
                                        code: 40100,
                                        message: 'Unauthorized'
                                    });

                                    done();
                                });
                            });

                            test('Fail - 40009 - authType === hard - missing user certificate', function (done) {
                                var voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];

                                _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, null, null, null, 400, function (err, res) {
                                    if (err) return done(err);

                                    var expectedBody = {
                                        status: {
                                            code: 40009,
                                            message: 'Vote with hard authentication requires users certificate when signing with ID card OR phoneNumber+pid when signing with mID'
                                        }
                                    };

                                    assert.deepEqual(res.body, expectedBody);

                                    done();
                                });
                            });

                            test.skip('Fail - 40030 - Personal ID already connected to another user account.', function (done) {
                                // TODO: This test needs to generate a certificate
                                done();
                            });

                            test.skip('Fail - 40031 - User account already connected to another PID.', function (done) {
                                // TODO: This test needs to generate a certificate
                                done();
                            });

                        });

                        suite('Sign', function () {

                            test.skip('Success', function (done) {
                                done();
                            });

                        });

                    });

                    suite('Mobiil-ID', function () {

                        let vote;

                        setup(async function () {
                            // TODO: Remove once all tests create their own data
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


                            const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            vote = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;
                        });

                        teardown(async function () {
                            return UserConnection
                                .destroy({
                                    where: {
                                        connectionId: {
                                            [db.Sequelize.Op.in]: [
                                                UserConnection.CONNECTION_IDS.esteid,
                                                UserConnection.CONNECTION_IDS.smartid
                                            ]
                                        },
                                        connectionUserId: ['PNOEE-600010199060', 'PNOEE-11412090004', 'PNOEE-51001091072', 'PNOEE-60001018800']
                                    },
                                    force: true
                                });
                        });

                        test('Success - Estonian mobile number and PID', async function () {
                            const phoneNumber = '+37200000766';
                            const pid = '60001019906';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const voteResult = (await topicVoteVotePromised(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null)).body;

                            assert.equal(voteResult.status.code, 20001);
                            assert.match(voteResult.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - Estonian mobile number and PID - multiple choice - vote and re-vote', async function () {
                            this.timeout(30000);

                            const phoneNumber = '+37200000766';
                            const pid = '60001019906';

                            let options = [
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

                            const topic = (await topicCreatePromised(agent, user.id, null, null, null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', null)).body.data;
                            const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                            // Vote for the first time
                            const voteList1 = [
                                {
                                    optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                                },
                                {
                                    optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                }
                            ];

                            const voteVoteResult1 = (await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;

                            assert.equal(voteVoteResult1.status.code, 20001);
                            assert.match(voteVoteResult1.data.challengeID, /[0-9]{4}/);

                            // Wait for the vote signing to complete
                            await topicVoteStatusPromised(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);
                            const voteReadAfterVote1 = (await topicVoteReadPromised(agent, user.id, topic.id, voteRead.id)).body.data;

                            _(voteList1).forEach(function (voteOption) {
                                const option = _.find(voteReadAfterVote1.options.rows, {id: voteOption.optionId});
                                assert.equal(option.voteCount, 1);
                            });

                            // Vote for the 2nd time, change your vote, by choosing 1
                            const voteList2 = [
                                {
                                    optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                },
                                {
                                    optionId: _.find(voteRead.options.rows, {value: options[2].value}).id
                                }
                            ];

                            const voteVoteResult2 = (await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList2, null, pid, phoneNumber, null)).body;

                            assert.equal(voteVoteResult2.status.code, 20001);
                            assert.match(voteVoteResult2.data.challengeID, /[0-9]{4}/);

                            // Wait for the vote signing to complete
                            await topicVoteStatusPromised(agent, user.id, topic.id, voteRead.id, voteVoteResult2.data.token);
                            const voteReadAfterVote2 = (await topicVoteReadPromised(agent, user.id, topic.id, voteRead.id)).body.data;

                            // Check that the 2nd vote was counted
                            _(voteList2).forEach(function (voteOption) {
                                const option = _.find(voteReadAfterVote2.options.rows, {id: voteOption.optionId});
                                assert.equal(option.voteCount, 1);
                                assert.isTrue(option.selected);
                            });

                            // Check that the 1st vote was overwritten
                            const optionOverwritten = _.find(voteReadAfterVote2.options.rows, {id: voteList1[0].optionId});

                            assert.notProperty(optionOverwritten, 'voteCount');
                            assert.notProperty(optionOverwritten, 'selected');

                            // Verify the result of topic information, see that vote result is the same
                            const topicReadAfterVoting = (await topicReadPromised(agent, user.id, topic.id, ['vote'])).body.data;

                            // We can verify that both have the "downloads" present, BUT we cannot check that they are the same as JWT issue time is different and that makes tokens different
                            assert.property(voteReadAfterVote2, 'downloads');
                            assert.property(voteReadAfterVote2.downloads, 'bdocVote');
                            delete voteReadAfterVote2.downloads;

                            assert.property(topicReadAfterVoting.vote, 'downloads');
                            assert.property(topicReadAfterVoting.vote.downloads, 'bdocVote');
                            delete topicReadAfterVoting.vote.downloads;

                            assert.deepEqual(topicReadAfterVoting.vote, voteReadAfterVote2);

                            // Make sure the results match with the result read with Topic list (/api/users/:userId/topics)
                            const topicList = (await topicListPromised(agent, user.id, ['vote'], null, null, null, null)).body.data;
                            const topicVotedOn = _.find(topicList.rows, {id: topic.id});

                            // Topic list included votes dont have downloads
                            delete voteReadAfterVote2.downloads;

                            assert.deepEqual(topicVotedOn.vote, voteReadAfterVote2);
                        });

                        test('Success - Personal ID already connected to another user account - vote multiple-choice, re-vote and count', async function () {
                            this.timeout(40000);

                            const phoneNumberRepeatedVote = '+37200000766';
                            const pidRepeatedVote = '60001019906';

                            const phoneNumberSingleVote = '+37200000566';
                            const pidSingleVote = '60001018800';

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

                            const topic = (await topicCreatePromised(agent, user.id, Topic.VISIBILITY.public, null, null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', null)).body.data;
                            const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                            const agentUser1 = agent;
                            const user1 = user;

                            const agentUser2 = request.agent(app);
                            const user2 = await userLib.createUserAndLoginPromised(agentUser2, null, null, null);

                            const agentUser3 = request.agent(app);
                            const user3 = await userLib.createUserAndLoginPromised(agentUser3, null, null, null);

                            const agentUser4 = request.agent(app);
                            const user4 = await userLib.createUserAndLoginPromised(agentUser4, null, null, null);

                            const voteListUser1 = [
                                {
                                    optionId: voteRead.options.rows[0].id
                                },
                                {
                                    optionId: voteRead.options.rows[1].id
                                }
                            ];

                            const voteListUser2 = [
                                {
                                    optionId: voteRead.options.rows[1].id
                                },
                                {
                                    optionId: voteRead.options.rows[2].id
                                }
                            ];

                            const voteListUser3 = [ // This should be counted in the final result as different "userId" is connected to the same PID
                                {
                                    optionId: voteRead.options.rows[0].id
                                },
                                {
                                    optionId: voteRead.options.rows[2].id
                                }
                            ];

                            const voteListUser4 = [ // This a person voting with a different PID to mix the water a bit
                                {
                                    optionId: voteRead.options.rows[0].id
                                }
                            ];

                            const voteResult1 = (await topicVoteVotePromised(agentUser1, user1.id, topic.id, voteRead.id, voteListUser1, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatusPromised(agentUser1, user1.id, topic.id, voteRead.id, voteResult1.token);

                            const voteResult2 = (await topicVoteVotePromised(agentUser2, user2.id, topic.id, voteRead.id, voteListUser2, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatusPromised(agentUser2, user2.id, topic.id, voteRead.id, voteResult2.token);

                            const voteResult3 = (await topicVoteVotePromised(agentUser3, user3.id, topic.id, voteRead.id, voteListUser3, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatusPromised(agentUser3, user3.id, topic.id, voteRead.id, voteResult3.token);

                            const voteResult4 = (await topicVoteVotePromised(agentUser4, user4.id, topic.id, voteRead.id, voteListUser4, null, pidSingleVote, phoneNumberSingleVote)).body.data;
                            await topicVoteStatusPromised(agentUser4, user4.id, topic.id, voteRead.id, voteResult4.token);

                            const voteReadAfterVote3 = (await topicVoteReadPromised(agentUser3, user3.id, topic.id, voteCreated.id)).body.data;

                            voteReadAfterVote3.options.rows.forEach(function (option) {
                                switch (option.id) {
                                    case voteListUser3[0].optionId:
                                        assert.equal(option.voteCount, 1 + 1); // U3, U4
                                        assert.isTrue(option.selected);
                                        break;
                                    case voteListUser3[1].optionId:
                                        assert.equal(option.voteCount, 1); // U3
                                        assert.isTrue(option.selected);
                                        break;
                                    default:
                                        assert.property(option, 'value');
                                        assert.notProperty(option, 'voteCount');
                                }
                            });

                            // Make sure the results match between different User requests
                            const voteReadAfterVote2 = (await topicVoteReadPromised(agentUser2, user2.id, topic.id, voteCreated.id)).body.data;

                            // NOTE: At this point we show "selected" as what the "userId" has selected, we do not check for UserConnections. We MAY want to change this... MAY.
                            voteReadAfterVote3.options.rows.forEach(function (option) {
                                delete option.selected;
                            });

                            assert.deepEqual(voteReadAfterVote2.options, voteReadAfterVote3.options);

                            // Make sure the results match with result read with Topic
                            const topicReadAfterVote2 = (await topicReadPromised(agentUser2, user2.id, topic.id, ['vote'])).body.data;
                            const voteReadWithTopic2 = topicReadAfterVote2.vote;

                            assert.deepEqual(voteReadWithTopic2, voteReadAfterVote2);

                            // Make sure the results match with the result read with Topic list (/api/users/:userId/topics)
                            // In order to do that, to see the topic in Users list, User needs to be a member of the Topic
                            const members = [
                                {
                                    userId: user2.id,
                                    level: TopicMemberUser.LEVELS.read
                                }
                            ];
                            await topicMemberUsersCreatePromised(agent, user.id, topic.id, members);
                            const topicList = (await topicListPromised(agentUser2, user2.id, ['vote'], null, null, null, true)).body.data;
                            const topicVotedOn = _.find(topicList.rows, {id: topic.id});

                            assert.deepEqual(topicVotedOn.vote, voteReadAfterVote2);
                        });

                        test('Success - Estonian mobile number and PID bdocUri exists', function (done) {
                            this.timeout(24000); //eslint-disable-line no-invalid-this

                            var phoneNumber = '+37200000766';
                            var pid = '60001019906';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, function (err, res) {
                                if (err) return done(err);

                                var response = res.body;
                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);

                                var bdocpathExpected = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user'
                                    .replace(':topicId', topic.id)
                                    .replace(':voteId', vote.id);
                                var called = 0;
                                var replied = 0;

                                var getStatus = setInterval(function () {
                                    if (called === replied) {
                                        called++;
                                        topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token, function (err, res) {
                                            if (err) done(err);

                                            replied++;

                                            var statusresponse = res.body;
                                            if (statusresponse.status.code === 20001 && statusresponse.status.message === 'Signing in progress') {
                                                // FIXME: Interesting empty block
                                            } else {
                                                clearStatus(); //eslint-disable-line no-use-before-define

                                                assert.equal(statusresponse.status.code, 20002);
                                                assert.property(statusresponse.data, 'bdocUri');

                                                var bdocUri = statusresponse.data.bdocUri;

                                                // Check for a valid token
                                                var token = bdocUri.slice(bdocUri.indexOf('token=') + 6);
                                                var tokenData = cosJwt.verifyTokenRestrictedUse(token, 'GET ' + bdocpathExpected);

                                                assert.equal(tokenData.userId, user.id);

                                                done();
                                            }
                                        });
                                    }
                                }, 2000);

                                var clearStatus = function () {
                                    clearInterval(getStatus);
                                };
                            });

                        });

                        test('Fail - 40021 - Invalid phone number', function (done) {
                            var phoneNumber = '+372519';
                            var pid = '51001091072';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40021,
                                        message: 'phoneNumber must contain of + and numbers(8-30)'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40022 - Invalid PID', function (done) {
                            var phoneNumber = '+37260000007';
                            var pid = '1072';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400, function (err, res) {
                                if (err) return done(err);


                                var expectedResponse = {
                                    status: {
                                        code: 40022,
                                        message: 'nationalIdentityNumber must contain of 11 digits'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40023 - Mobile-ID user certificates are revoked or suspended for Estonian citizen', function (done) {
                            var phoneNumber = '+37200000266';
                            var pid = '60001019939';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40023,
                                        message: 'Certificate was found but is not active'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40023 - Mobile-ID user certificates are revoked or suspended for Lithuanian citizen', function (done) {
                            var phoneNumber = '+37060000266';
                            var pid = '50001018832';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40023,
                                        message: 'Certificate was found but is not active'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40023 - User certificate is not activated for Estonian citizen.', function (done) {
                            var phoneNumber = '+37200000366';
                            var pid = '60001019928';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40023,
                                        message: 'Certificate was found but is not active'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40023 - Mobile-ID is not activated for Lithuanian citizen', function (done) {
                            var phoneNumber = '+37060000366';
                            var pid = '50001018821';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40023,
                                        message: 'Certificate was found but is not active'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40031 - User account already connected to another PID.', function (done) {
                            // Originally set by a successful Vote, but taking a shortcut for faster test runs
                            UserConnection
                                .create({
                                    userId: user.id,
                                    connectionId: UserConnection.CONNECTION_IDS.esteid,
                                    connectionUserId: 'PNOEE-11412090004',
                                    connectionData: {
                                        name: 'TEST' + new Date().getTime(),
                                        country: 'EE',
                                        pid: '11412090004'
                                    }
                                })
                                .then(function () {
                                    var phoneNumber = '+37060000007';
                                    var pid = '51001091072';

                                    var voteList = [
                                        {
                                            optionId: vote.options.rows[0].id
                                        }
                                    ];

                                    _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400, function (err, res) {
                                        if (err) return done(err);

                                        var expectedResponse = {
                                            status: {
                                                code: 40031,
                                                message: 'User account already connected to another PID.'
                                            }
                                        };

                                        assert.deepEqual(res.body, expectedResponse);

                                        done();
                                    });
                                });
                        });

                        test.skip('Fail - 40024 - User certificate is suspended', function (done) {
                            //TODO: No test phone numbers available for errorcode = 304 - http://id.ee/?id=36373
                            done();
                        });

                        test.skip('Fail - 40025 - User certificate is expired', function (done) {
                            //TODO: No test phone numbers available for errorcode = 305 - http://id.ee/?id=36373
                            done();
                        });
                    });

                    suite('Downloads', function () {

                        suite('Bdocs', function () {

                            suite('User', function () {
                                const phoneNumber = '+37200000766';
                                const pid = '60001019906';

                                test('Success', async function () {
                                    this.timeout(30000);

                                    let options = [
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

                                    const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                                    const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Vote for the first time
                                    const voteList1 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                        }
                                    ];

                                    const voteVoteResult1 = (await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatusPromised(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);

                                    // Vote for the 2nd time, change your vote, by choosing 1
                                    const voteList2 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[2].value}).id
                                        }
                                    ];

                                    const voteVoteResult2 = (await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList2, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatusPromised(agent, user.id, topic.id, voteRead.id, voteVoteResult2.data.token);
                                    const voteReadAfterVote2 = (await topicVoteReadPromised(agent, user.id, topic.id, voteRead.id)).body.data;

                                    // Verify the url format and download
                                    const userBdocUrlRegex = new RegExp(`^${config.url.api}/api/users/self/topics/${topic.id}/votes/${voteRead.id}/downloads/bdocs/user\\?token=([a-zA-Z_.0-9\\-]{675})$`);
                                    const userBdocUrlMatches = voteReadAfterVote2.downloads.bdocVote.match(userBdocUrlRegex);

                                    assert.isNotNull(userBdocUrlMatches);

                                    const userBdocDownloadToken = userBdocUrlMatches[1];
                                    await topicVoteDownloadBdocUserPromised(agent, topic.id, voteRead.id, userBdocDownloadToken);

                                    const pathUserBdoc = `./test/tmp/user_${voteRead.id}_${user.id}.bdoc`;
                                    const fileWriteStream = fs.createWriteStream(pathUserBdoc);
                                    const fileWriteStreamPromised = cosUtil.streamToPromise(fileWriteStream);

                                    request('')
                                        .get(voteReadAfterVote2.downloads.bdocVote.split('?')[0])
                                        .query({token: userBdocDownloadToken})
                                        .pipe(fileWriteStream);

                                    await fileWriteStreamPromised;

                                    const bdocFileList = await new Promise(function (resolve, reject) {
                                        const files = [];

                                        const listStream = SevenZip.list(pathUserBdoc);

                                        listStream.on('data', function (data) {
                                            files.push(data);
                                        });

                                        listStream.on('end', function () {
                                            resolve(files);
                                        });

                                        listStream.on('error', function (err) {
                                            reject(err);
                                        });
                                    });

                                    const fileListExpected = [
                                        'mimetype',
                                        '__metainfo.html',
                                        '__userinfo.html',
                                        `${options[1].value}.html`,
                                        `${options[2].value}.html`,
                                        'document.docx',
                                        'META-INF/manifest.xml',
                                        'META-INF/signatures-1.xml'
                                    ];

                                    bdocFileList.forEach(function (f) {
                                        assert.include(fileListExpected, f.file);
                                    });

                                    // Clean up
                                    fs.unlinkSync(pathUserBdoc);
                                });

                                teardown(async function () {
                                    await UserConnection
                                        .destroy({
                                            where: {
                                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                                connectionUserId: [`PNOEE-${pid}`]
                                            },
                                            force: true
                                        });
                                });
                            });

                            suite('Final', function () {
                                const phoneNumber = '+37200000766';
                                const pid = '60001019906';

                                test('Success', async function () {
                                    this.timeout(30000);

                                    let options = [
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

                                    const voteCreated = (await topicVoteCreatePromised(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                                    const voteRead = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Vote for the first time
                                    // Vote for the first time
                                    const voteList1 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                        }
                                    ];

                                    const voteVoteResult1 = (await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatusPromised(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);

                                    // Vote for the 2nd time, change your vote, by choosing 1
                                    const voteList2 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[2].value}).id
                                        }
                                    ];

                                    const voteVoteResult2 = (await topicVoteVotePromised(agent, user.id, topic.id, voteRead.id, voteList2, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatusPromised(agent, user.id, topic.id, voteRead.id, voteVoteResult2.data.token);

                                    // End the voting
                                    await topicUpdatePromised(agent, user.id, topic.id, Topic.STATUSES.followUp, Topic.VISIBILITY.private, null, null, null);

                                    const voteReadAfterVoteClosed = (await topicVoteReadPromised(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Verify the user vote container format and download
                                    const userBdocUrlRegex = new RegExp(`^${config.url.api}/api/users/self/topics/${topic.id}/votes/${voteRead.id}/downloads/bdocs/user\\?token=([a-zA-Z_.0-9\\-]{675})$`);
                                    const userBdocUrlMatches = voteReadAfterVoteClosed.downloads.bdocVote.match(userBdocUrlRegex);

                                    assert.isNotNull(userBdocUrlMatches);

                                    const userBdocDownloadToken = userBdocUrlMatches[1];
                                    await topicVoteDownloadBdocUserPromised(agent, topic.id, voteRead.id, userBdocDownloadToken);

                                    // Verify the final vote container format and download
                                    const finalBdocUrlRegex = new RegExp(`^${config.url.api}/api/users/self/topics/${topic.id}/votes/${voteRead.id}/downloads/bdocs/final\\?token=([a-zA-Z_.0-9\\-]{676})$`);
                                    const finalBdocUrlMatches = voteReadAfterVoteClosed.downloads.bdocFinal.match(finalBdocUrlRegex);

                                    assert.isNotNull(finalBdocUrlMatches);

                                    const finalBdocDownloadToken = finalBdocUrlMatches[1];
                                    await topicVoteDownloadBdocFinalPromised(agent, topic.id, voteRead.id, finalBdocDownloadToken);

                                    const pathFinalBdoc = `./test/tmp/final_${voteRead.id}_${user.id}.bdoc`;
                                    const fileWriteStream = fs.createWriteStream(pathFinalBdoc);
                                    const fileWriteStreamPromised = cosUtil.streamToPromise(fileWriteStream);

                                    request('')
                                        .get(voteReadAfterVoteClosed.downloads.bdocFinal.split('?')[0])
                                        .query({token: finalBdocDownloadToken})
                                        .pipe(fileWriteStream);

                                    await fileWriteStreamPromised;

                                    const bdocFileList = await new Promise(function (resolve, reject) {
                                        const files = [];

                                        const listStream = SevenZip.list(pathFinalBdoc);

                                        listStream.on('data', function (data) {
                                            files.push(data);
                                        });

                                        listStream.on('end', function () {
                                            resolve(files);
                                        });

                                        listStream.on('error', function (err) {
                                            reject(err);
                                        });
                                    });

                                    const fileListExpected = [
                                        'mimetype',
                                        '__metainfo.html',
                                        `${options[0].value}.html`,
                                        `${options[1].value}.html`,
                                        `${options[2].value}.html`,
                                        'document.docx',
                                        `PNOEE-${pid}.bdoc`,
                                        'votes.csv',
                                        'META-INF/manifest.xml'
                                    ];

                                    bdocFileList.forEach(function (f) {
                                        assert.include(fileListExpected, f.file);
                                    });

                                    // Clean up
                                    fs.unlinkSync(pathFinalBdoc);
                                });

                                teardown(async function () {
                                    await UserConnection
                                        .destroy({
                                            where: {
                                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                                connectionUserId: [`PNOEE-${pid}`]
                                            },
                                            force: true
                                        });
                                });
                            });

                        });

                    });

                    suite('Smart-ID', function () {

                        var vote;

                        setup(function (done) {

                            var options = [
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

                            topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard, function (err, res) {
                                if (err) return done(err);

                                vote = res.body.data;

                                topicVoteRead(agent, user.id, topic.id, vote.id, function (err, res) {
                                    if (err) return done(err);

                                    vote = res.body.data;

                                    done();
                                });
                            });
                        });

                        teardown(function (done) {
                            UserConnection
                                .destroy({
                                    where: {
                                        connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                        connectionUserId: ['PNOEE-10101010016', 'PNOEE-10101010005', 'PNOEE-11412090004']
                                    },
                                    force: true
                                })
                                .then(function () {
                                    done();
                                })
                                .catch(done);
                        });

                        test('Success - Estonian PID', function (done) {
                            UserConnection
                                .destroy({
                                    where: {
                                        connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                        connectionUserId: ['PNOEE-10101010016', 'PNOEE-10101010005', 'PNOEE-11412090004']
                                    },
                                    force: true
                                })
                                .then(function () {
                                    var countryCode = 'EE';
                                    var pid = '10101010005';

                                    var voteList = [
                                        {
                                            optionId: vote.options.rows[0].id
                                        }
                                    ];

                                    _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 200, function (err, res) {
                                        if (err) return done(err);

                                        var response = res.body;
                                        assert.equal(response.status.code, 20001);
                                        assert.match(response.data.challengeID, /[0-9]{4}/);
                                        done();
                                    });
                                });
                        });

                        test('Success - Latvian PID', function (done) {
                            var countryCode = 'LV';
                            var pid = '010101-10006';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, function (err, res) {
                                if (err) return done(err);

                                var response = res.body;
                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);
                                done();
                            });
                        });

                        test('Success - Lithuanian PID', function (done) {
                            var countryCode = 'LT';
                            var pid = '10101010005';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, function (err, res) {
                                if (err) return done(err);

                                var response = res.body;
                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);
                                done();
                            });
                        });

                        test('Success - Personal ID already connected to another user account.', function (done) {
                            var countryCode = 'EE';
                            var pid = '10101010005';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            userLib.createUser(request.agent(app), null, null, null, function (err, res) {
                                if (err) return done(err);

                                var createdUser = res;

                                UserConnection
                                    .create({
                                        userId: createdUser.id,
                                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                                        connectionUserId: pid
                                    })
                                    .then(function () {
                                        topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, function (err, res) {
                                            if (err) return done(err);

                                            var response = res.body;
                                            assert.equal(response.status.code, 20001);
                                            assert.match(response.data.challengeID, /[0-9]{4}/);
                                            done();
                                        });
                                    });
                            });
                        });

                        test('Success - bdocUri exists', function (done) {
                            this.timeout(24000); //eslint-disable-line no-invalid-this

                            var countryCode = 'EE';
                            var pid = '10101010005';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, function (err, res) {
                                if (err) return done(err);

                                var response = res.body;
                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);

                                var bdocpathExpected = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user'
                                    .replace(':topicId', topic.id)
                                    .replace(':voteId', vote.id);
                                var called = 0;
                                var replied = 0;

                                var getStatus = setInterval(function () {
                                    if (called === replied) {
                                        called++;
                                        topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token, function (err, res) {
                                            if (err) done(err);

                                            replied++;
                                            var statusresponse = res.body;
                                            if (statusresponse.status.code === 20001 && statusresponse.status.message === 'Signing in progress') {
                                                // FIXME: Interesting empty block
                                            } else {
                                                clearStatus(); //eslint-disable-line no-use-before-define

                                                assert.equal(statusresponse.status.code, 20002);
                                                assert.property(statusresponse.data, 'bdocUri');

                                                var bdocUri = statusresponse.data.bdocUri;

                                                // Check for a valid token
                                                var token = bdocUri.slice(bdocUri.indexOf('token=') + 6);
                                                var tokenData = cosJwt.verifyTokenRestrictedUse(token, 'GET ' + bdocpathExpected);

                                                assert.equal(tokenData.userId, user.id);

                                                done();
                                            }
                                        });
                                    }
                                }, 2000);

                                var clearStatus = function () {
                                    clearInterval(getStatus);
                                };
                            });

                        });

                        test('Fail - 40000 - Invalid country code', function (done) {
                            var countryCode = 'OO';
                            var pid = '10101010004';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 400, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40000,
                                        message: 'Bad request'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40400 - Invalid PID', function (done) {
                            var countryCode = 'EE';
                            var pid = '1072';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 404, function (err, res) {
                                if (err) return done(err);


                                var expectedResponse = {
                                    status: {
                                        code: 40400,
                                        message: 'Not Found'
                                    }
                                };

                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - 40010 - User has cancelled the signing process', function (done) {
                            this.timeout(15000); // eslint-disable-line no-invalid-this

                            var countryCode = 'EE';
                            var pid = '10101010016';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 200, function (err, res) {
                                if (err) return done(err);

                                var response = res.body;
                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);

                                var called = 0;
                                var replied = 0;

                                var getStatus = setInterval(function () {
                                    if (called === replied) {
                                        called++;
                                        _topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token, 400, function (err, res) {
                                            if (err && res.body && res.statusCode !== 200) return done(err);

                                            replied++;
                                            var statusresponse = res.body;
                                            if (statusresponse.status.code === 20001 && statusresponse.status.message === 'Signing in progress') {
                                                // FIXME: Interesting empty block
                                            } else {
                                                clearStatus(); //eslint-disable-line no-use-before-define

                                                var expectedResponse = {
                                                    status:
                                                        {
                                                            code: 40010,
                                                            message: 'User has cancelled the signing process'
                                                        }
                                                }
                                                assert.equal(statusresponse.status.code, 40010);
                                                assert.deepEqual(res.body, expectedResponse);

                                                done();
                                            }
                                        });
                                    }
                                }, 2000);

                                var clearStatus = function () {
                                    clearInterval(getStatus);
                                };
                            });
                        });

                        test('Fail - 40010 - User has cancelled the signing process Latvian PID', function (done) {
                            this.timeout(15000); //eslint-disable-line no-invalid-this

                            var countryCode = 'LV';
                            var pid = '010101-10014';

                            var voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 200, function (err, res) {
                                if (err) return done(err);

                                var response = res.body;
                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);

                                var called = 0;
                                var replied = 0;

                                var getStatus = setInterval(function () {
                                    if (called === replied) {
                                        called++;
                                        _topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token, 400, function (err, res) {
                                            if (err && res.body && res.statusCode !== 200) return done(err);

                                            replied++;
                                            var statusresponse = res.body;
                                            if (statusresponse.status.code === 20001 && statusresponse.status.message === 'Signing in progress') {
                                                // FIXME: Interesting empty block
                                            } else {
                                                clearStatus(); //eslint-disable-line no-use-before-define

                                                var expectedResponse = {
                                                    status:
                                                        {
                                                            code: 40010,
                                                            message: 'User has cancelled the signing process'
                                                        }
                                                }
                                                assert.equal(statusresponse.status.code, 40010);
                                                assert.deepEqual(res.body, expectedResponse);

                                                done();
                                            }
                                        });
                                    }
                                }, 2000);

                                var clearStatus = function () {
                                    clearInterval(getStatus);
                                };
                            });
                        });

                        test('Fail - 40031 - User account already connected to another PID.', function (done) {
                            // Originally set by a successful Vote, but taking a shortcut for faster test runs
                            UserConnection
                                .create({
                                    userId: user.id,
                                    connectionId: UserConnection.CONNECTION_IDS.esteid,
                                    connectionUserId: 'PNOEE-11412090004',
                                    connectionData: {
                                        name: 'TEst name',
                                        pid: '11412090004',
                                        country: 'EE'
                                    }
                                })
                                .then(function () {
                                    var countryCode = 'EE';
                                    var pid = '10101010005';

                                    var voteList = [
                                        {
                                            optionId: vote.options.rows[0].id
                                        }
                                    ];

                                    _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 400, function (err, res) {
                                        if (err) return done(err);

                                        var expectedResponse = {
                                            status: {
                                                code: 40031,
                                                message: 'User account already connected to another PID.'
                                            }
                                        };

                                        assert.deepEqual(res.body, expectedResponse);

                                        done();
                                    });
                                });
                        });
                    });
                });
            });

        });

        // API - /api/users/:userId/topics/:topicId/comments
        suite('Comments', function () {

            suite('Create', function () {

                var agent = request.agent(app);

                var user;
                var topic;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;
                        topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                            if (err) return done(err);
                            topic = res.body.data;
                            done();
                        });
                    });
                });

                test('Success', function (done) {
                    var type = Comment.TYPES.pro;
                    var subject = 'My sub';
                    var text = 'Wohoo!';

                    topicCommentCreate(agent, user.id, topic.id, null, null, Comment.TYPES.pro, subject, text, function (err, res) {
                        if (err) return done(err);

                        var comment = res.body.data;

                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.creator.id, user.id);

                        var commentReplyText = 'Child comment';
                        topicCommentCreate(agent, user.id, topic.id, comment.id, comment.edits.length - 1, null, null, commentReplyText, function (err, res) {
                            if (err) return done(err);

                            var commentReply = res.body.data;

                            assert.property(commentReply, 'id');
                            assert.equal(commentReply.type, Comment.TYPES.reply);
                            assert.notProperty(commentReply, 'subject');
                            assert.equal(commentReply.text, commentReplyText);
                            assert.equal(commentReply.creator.id, user.id);
                            assert.equal(commentReply.parent.id, comment.id);

                            done();
                        });
                    });
                });

                test('Success - test quotes "">\'!<', function (done) {
                    var type = Comment.TYPES.pro;
                    var subject = 'subject test quotes "">\'!<';
                    var text = 'text test quotes "">\'!<';

                    topicCommentCreate(agent, user.id, topic.id, null, null, Comment.TYPES.pro, subject, text, function (err, res) {
                        if (err) return done(err);

                        var comment = res.body.data;

                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.creator.id, user.id);

                        done();
                    });
                });

                test.skip('Success - public Topic', function (done) {
                    done();
                });

                test.skip('Fail - 403 - Forbidden - cannot comment on Topic you\'re not a member of or the Topic is not public', function (done) {
                    done();
                });

            });

            suite('Update', function () {
                var agent2 = request.agent(app);
                var agent3 = request.agent(app);

                var user2;
                var user3;
                var topic;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent2, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user2 = res;
                        userLib.createUserAndLogin(agent3, null, null, null, function (err, res) {
                            if (err) return done(err);
                            user3 = res;
                            topicCreate(agent2, user2.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                                if (err) return done(err);
                                topic = res.body.data;
                                done();
                            });
                        });
                    });
                });

                test('Success - edit comment by user', function (done) {
                    var type = Comment.TYPES.pro;
                    var subject = 'to be edited by user';
                    var text = 'Wohoo!';

                    topicCommentCreate(agent3, user3.id, topic.id, null, null, Comment.TYPES.pro, subject, text, function (err, res) {
                        if (err) return done(err);

                        var comment = res.body.data;

                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.type, Comment.TYPES.pro);
                        assert.equal(comment.creator.id, user3.id);

                        var editSubject = 'Edited by user';
                        var editText = 'Jei, i edited';

                        topicCommentEdit(agent3, user3.id, topic.id, comment.id, editSubject, editText, Comment.TYPES.con, function (err, res) {
                            if (err) return done(err);

                            var status = res.body.status;
                            assert.equal(status.code, 20000);
                            topicCommentList(agent3, user3.id, topic.id, 'date', function (err, res) {
                                if (err) return done(err);

                                var commentEdited = res.body.data.rows[0];
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
                                done();
                            });
                        });
                    });
                });
            });

            suite('List', function () {
                var agent = request.agent(app);

                var commentType1 = Comment.TYPES.pro;
                var commentSubj1 = 'Test comment 1 subj';
                var commentText1 = 'Test comment 1 text';
                var commentType2 = Comment.TYPES.con;
                var commentSubj2 = 'Test comment 2 text';
                var commentText2 = 'Test comment 2 subj';

                var user;
                var topic;
                var partner;
                var comment1;
                var comment2;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, result) {
                        if (err) return done(err);

                        user = result;
                        topicCreate(agent, user.id, null, null, null, null, null, function (err, result) {
                            if (err) return done(err);

                            topic = result.body.data;

                            async
                                .series(
                                    [
                                        function (cb) {
                                            topicCommentCreate(agent, user.id, topic.id, null, null, commentType1, commentSubj1, commentText1, cb);
                                        },
                                        function (cb) {
                                            topicCommentCreate(agent, user.id, topic.id, null, null, commentType2, commentSubj2, commentText2, cb);
                                        },
                                        function (cb) {
                                            return Partner
                                                .create({
                                                    website: 'notimportant',
                                                    redirectUriRegexp: 'notimportant'
                                                })
                                                .then(function (res) {
                                                    partner = res;
                                                    cb();
                                                });
                                        }
                                    ],
                                    function (err, results) {
                                        if (err) return done(err);

                                        comment1 = results[0].body.data;
                                        comment2 = results[1].body.data;

                                        done();
                                    }
                                );
                        });
                    });
                });

                test('Success', function (done) {
                    topicCommentList(agent, user.id, topic.id, null, function (err, res) {
                        if (err) return done(err);

                        var list = res.body.data;
                        var comments = list.rows;

                        var creatorExpected = user.toJSON();
                        delete creatorExpected.email; // Email is not returned
                        delete creatorExpected.imageUrl; // Image url is not returned as it's not needed for now
                        delete creatorExpected.language; // Language is not returned

                        assert.equal(list.count.total, 2);
                        assert.equal(comments.length, 2);

                        // Comment 1
                        var c1 = _.find(comments, {id: comment1.id});

                        assert.equal(c1.id, comment1.id);
                        assert.equal(c1.type, comment1.type);
                        assert.equal(c1.subject, comment1.subject);
                        assert.equal(c1.text, comment1.text);
                        assert.property(c1, 'createdAt');
                        assert.equal(c1.parent.id, comment1.id);

                        assert.deepEqual(c1.creator, creatorExpected);

                        // Comment 2
                        var c2 = _.find(comments, {id: comment2.id});

                        assert.equal(c2.id, comment2.id);
                        assert.equal(c2.type, comment2.type);
                        assert.equal(c2.subject, comment2.subject);
                        assert.equal(c2.text, comment2.text);
                        assert.property(c2, 'createdAt');
                        assert.equal(c2.parent.id, comment2.id);

                        assert.deepEqual(c2.creator, creatorExpected);

                        done();
                    });
                });

                test('Success v2', function (done) {
                    topicCommentList(agent, user.id, topic.id, 'rating', function (err, res) {
                        if (err) return done(err);

                        var list = res.body.data;
                        var comments = list.rows;

                        var creatorExpected = user.toJSON();
                        delete creatorExpected.email; // Email is not returned
                        delete creatorExpected.imageUrl; // Image url is not returned as it's not needed for now
                        delete creatorExpected.language; // Language is not returned

                        assert.equal(list.count.total, 2);
                        assert.equal(comments.length, 2);

                        // Comment 1
                        var c1 = _.find(comments, {id: comment1.id});

                        assert.equal(c1.id, comment1.id);
                        assert.equal(c1.type, comment1.type);
                        assert.equal(c1.subject, comment1.subject);
                        assert.equal(c1.text, comment1.text);
                        assert.property(c1, 'createdAt');
                        assert.equal(c1.parent.id, comment1.id);

                        assert.deepEqual(c1.creator, creatorExpected);

                        done();
                    });
                });

                test('Success - Comments with replies - c1->r1.1 c2->r2.1 c2->r2.2', function (done) {
                    var replyText11 = 'R1.1';
                    var replyText21 = 'R2.1';
                    var replyText22 = 'R2.2';

                    async
                        .series(
                            [
                                function (cb) {
                                    topicCommentCreate(agent, user.id, topic.id, comment1.id, null, null, null, replyText11, cb);
                                },
                                function (cb) {
                                    topicCommentCreate(agent, user.id, topic.id, comment2.id, null, null, null, replyText21, cb);
                                },
                                function (cb) {
                                    topicCommentCreate(agent, user.id, topic.id, comment2.id, null, null, null, replyText22, cb);
                                }
                            ],
                            function (err) {
                                if (err) return done(err);

                                topicCommentList(agent, user.id, topic.id, null, function (err, res) {
                                    if (err) return done(err);

                                    var list = res.body.data;
                                    var comments = list.rows;

                                    var creatorExpected = user.toJSON();
                                    delete creatorExpected.email; // Email is not returned
                                    delete creatorExpected.imageUrl; // Image url is not returned, as it's not needed for now
                                    delete creatorExpected.language; // Language is not returned

                                    assert.equal(list.count.total, 2);
                                    assert.equal(comments.length, 2);

                                    // Comment 1
                                    var c1 = _.find(comments, {id: comment1.id});

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

                                    var c1r1 = c1.replies.rows[0];

                                    assert.equal(c1r1.parent.id, comment1.id);
                                    assert.equal(c1r1.type, Comment.TYPES.reply);
                                    assert.isNull(c1r1.subject);
                                    assert.equal(c1r1.text, replyText11);
                                    assert.property(c1r1, 'createdAt');

                                    assert.deepEqual(c1r1.creator, creatorExpected);

                                    // Comment 2
                                    var c2 = _.find(comments, {id: comment2.id});

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

                                    var c2r1 = c2.replies.rows[0];

                                    assert.equal(c2r1.parent.id, comment2.id);
                                    assert.equal(c2r1.type, Comment.TYPES.reply);
                                    assert.isNull(c2r1.subject);
                                    assert.equal(c2r1.text, replyText21);
                                    assert.property(c2r1, 'createdAt');

                                    assert.deepEqual(c2r1.creator, creatorExpected);

                                    var c2r2 = c2.replies.rows[1];

                                    assert.equal(c2r2.parent.id, comment2.id);
                                    assert.equal(c2r2.type, Comment.TYPES.reply);
                                    assert.isNull(c2r2.subject);
                                    assert.equal(c2r2.text, replyText22);
                                    assert.property(c2r2, 'createdAt');

                                    assert.deepEqual(c2r2.creator, creatorExpected);

                                    done();
                                });
                            }
                        );
                });

                test('Success - User has Moderator permissions', function (done) {
                    Topic
                        .update(
                            {
                                sourcePartnerId: partner.id
                            },
                            {
                                where: {
                                    id: topic.id
                                }
                            }
                        )
                        .then(function () {
                            return Moderator
                                .create({
                                    userId: user.id,
                                    partnerId: partner.id
                                });
                        })
                        .then(function () {
                            topicCommentList(agent, user.id, topic.id, null, function (err, res) {
                                if (err) return done(err);

                                var replyText11 = 'R1.1';
                                var replyText21 = 'R2.1';
                                var replyText22 = 'R2.2';

                                var list = res.body.data;
                                var comments = list.rows;

                                var creatorExpected = user.toJSON();
                                creatorExpected.pid = null;
                                creatorExpected.phoneNumber = null;
                                delete creatorExpected.imageUrl; // Image url is not returned, as it's not needed for now
                                delete creatorExpected.language; // Language is not returned

                                assert.equal(list.count.total, 2);
                                assert.equal(comments.length, 2);

                                // Comment 1
                                var c1 = _.find(comments, {id: comment1.id});

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

                                var c1r1 = c1.replies.rows[0];

                                assert.equal(c1r1.parent.id, comment1.id);
                                assert.equal(c1r1.type, Comment.TYPES.reply);
                                assert.isNull(c1r1.subject);
                                assert.equal(c1r1.text, replyText11);
                                assert.property(c1r1, 'createdAt');

                                assert.deepEqual(c1r1.creator, creatorExpected);

                                // Comment 2
                                var c2 = _.find(comments, {id: comment2.id});

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

                                var c2r1 = c2.replies.rows[0];

                                assert.equal(c2r1.parent.id, comment2.id);
                                assert.equal(c2r1.type, Comment.TYPES.reply);
                                assert.isNull(c2r1.subject);
                                assert.equal(c2r1.text, replyText21);
                                assert.property(c2r1, 'createdAt');

                                assert.deepEqual(c2r1.creator, creatorExpected);

                                var c2r2 = c2.replies.rows[1];

                                assert.equal(c2r2.parent.id, comment2.id);
                                assert.equal(c2r2.type, Comment.TYPES.reply);
                                assert.isNull(c2r2.subject);
                                assert.equal(c2r2.text, replyText22);
                                assert.property(c2r2, 'createdAt');

                                assert.deepEqual(c2r2.creator, creatorExpected);

                                done();
                            });
                        });
                });
            });

            suite('Delete', function () {

                var agent = request.agent(app);

                var commentType = Comment.TYPES.con;
                var commentSubject = 'Test comment subject for deletion';
                var commentText = 'Test comment text for deletion';

                var user;
                var topic;
                var comment;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;

                        topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                            if (err) return done(err);
                            topic = res.body.data;

                            topicCommentCreate(agent, user.id, topic.id, null, null, commentType, commentSubject, commentText, function (err, res) {
                                if (err) return done(err);
                                comment = res.body.data;
                                done();
                            });
                        });
                    });
                });

                test('Success', function (done) {
                    topicCommentDelete(agent, user.id, topic.id, comment.id, function (err) {
                        if (err) return done(err);

                        topicCommentList(agent, user.id, topic.id, null, function (err, res) {
                            if (err) return done(err);

                            var comments = res.body.data;
                            assert.equal(comments.count.total, 1);
                            assert.equal(comments.rows.length, 1);
                            assert.isNotNull(comments.rows[0].deletedAt);

                            done();
                        });
                    });
                });


                test('Success - delete own comment from Topic with read permissions', function (done) {
                    var agentComment = request.agent(app);

                    userLib.createUserAndLogin(agentComment, null, null, null, function (err, res) {
                        if (err) return done(err);

                        var userComment = res;

                        topicCommentCreate(agentComment, userComment.id, topic.id, null, null, commentType, commentSubject, commentText, function (err, res) {
                            if (err) return done(err);

                            var comment = res.body.data;

                            topicCommentDelete(agentComment, userComment.id, topic.id, comment.id, function (err) {
                                if (err) return done(err);

                                done();
                            });
                        });
                    });
                });

            });

        });

        // API - /api/users/:userId/topics/:topicId/mentions
        suite('Mentions', function () {

            suite('Read', function () {

                var agent = request.agent(app);

                var user;
                var topic;
                var mention1;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;

                        topicCreate(agent, user.id, null, null, null, null, 'banana', function (err, res) {
                            if (err) return done(err);
                            topic = res.body.data;

                            topicMentionList(agent, user.id, topic.id, function (err, res) {
                                if (err) return done(err);

                                mention1 = res.body.data.rows[0];

                                done();
                            });
                        });
                    });
                });

                test('Success - cached result', function (done) {
                    topicMentionList(agent, user.id, topic.id, function (err, res) {
                        if (err) return done(err);

                        var list = res.body.data;
                        var mentions = list.rows;

                        assert.isTrue(list.count > 0);
                        assert.equal(list.count, mentions.length);

                        // Mention
                        var m1 = _.find(mentions, {id: mention1.id});
                        assert.deepEqual(m1, mention1);

                        done();
                    });
                });

            });
        });

        // API - /api/users/:userId/topics/:topicId/attachments
        suite('Attachments', function () {
            var creatorAgent = request.agent(app);
            var agent = request.agent(app);
            var creator;
            var topic;
            var topic2;

            setup(function (done) {
                userLib.createUserAndLogin(creatorAgent, null, null, null, function (err, res) {
                    if (err) return done(err);
                    creator = res;

                    async
                        .parallel(
                            [
                                function (cb) {
                                    topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, null, null, null, null, cb);
                                },
                                function (cb) {
                                    topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.private, null, null, null, null, cb);
                                }
                            ],
                            function (err, result) {
                                if (err) return done(err);

                                topic = result[0].body.data;
                                topic2 = result[1].body.data;

                                done();
                            }
                        );
                });
            });

            test('Add attachment - Success', function (done) {
                var expectedAttachment = {
                    name: 'testfilename.doc',
                    source: 'upload',
                    link: 'http://example.com/testfilename.doc',
                    type: '.doc',
                    size: 1000,
                    creatorId: creator.id
                };

                topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, function (err, res) {
                    if (err) return done(err);
                    var attachment = res.body.data;
                    assert.property(attachment, 'id');
                    assert.property(attachment, 'createdAt');
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.link, expectedAttachment.link);
                    assert.equal(attachment.source, expectedAttachment.source);
                    assert.equal(attachment.type, expectedAttachment.type);
                    assert.equal(attachment.size, expectedAttachment.size);
                    assert.equal(attachment.creatorId, creator.id);
                    done();
                });
            });

            test('Read attachment - Success', function (done) {
                var expectedAttachment = {
                    name: 'testfilename.doc',
                    source: 'upload',
                    link: 'http://example.com/testfilename.doc',
                    type: '.doc',
                    size: 1000,
                    creatorId: creator.id
                };

                topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, function (err, res) {
                    if (err) return done(err);

                    var attachment = res.body.data;

                    assert.property(attachment, 'id');
                    assert.property(attachment, 'createdAt');
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.link, expectedAttachment.link);
                    assert.equal(attachment.source, expectedAttachment.source);
                    assert.equal(attachment.type, expectedAttachment.type);
                    assert.equal(attachment.size, expectedAttachment.size);
                    assert.equal(attachment.creatorId, creator.id);

                    topicAttachmentRead(creatorAgent, creator.id, topic.id, attachment.id, function (err, res) {
                        if (err) return done(err);

                        var readAttachment = res.body.data;

                        assert.equal(readAttachment.id, attachment.id);
                        assert.equal(readAttachment.createdAt, attachment.createdAt);
                        assert.equal(readAttachment.name, attachment.name);
                        assert.equal(readAttachment.link, attachment.link);
                        assert.equal(readAttachment.source, attachment.source);
                        assert.equal(readAttachment.type, attachment.type);
                        assert.equal(readAttachment.size, attachment.size);
                        assert.equal(readAttachment.creatorId, attachment.creatorId);
                        done();
                    });
                });
            });

            test('Read attachment unauth- Success', function (done) {
                var expectedAttachment = {
                    name: 'testfilename.doc',
                    source: 'upload',
                    link: 'http://example.com/testfilename.doc',
                    type: '.doc',
                    size: 1000,
                    creatorId: creator.id
                };

                topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, function (err, res) {
                    if (err) return done(err);

                    var attachment = res.body.data;

                    assert.property(attachment, 'id');
                    assert.property(attachment, 'createdAt');
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.link, expectedAttachment.link);
                    assert.equal(attachment.source, expectedAttachment.source);
                    assert.equal(attachment.type, expectedAttachment.type);
                    assert.equal(attachment.size, expectedAttachment.size);
                    assert.equal(attachment.creatorId, creator.id);

                    topicAttachmentReadUnauth(agent, topic.id, attachment.id, function (err, res) {
                        if (err) return done(err);

                        var readAttachment = res.body.data;

                        assert.equal(readAttachment.id, attachment.id);
                        assert.equal(readAttachment.createdAt, attachment.createdAt);
                        assert.equal(readAttachment.name, attachment.name);
                        assert.equal(readAttachment.link, attachment.link);
                        assert.equal(readAttachment.source, attachment.source);
                        assert.equal(readAttachment.type, attachment.type);
                        assert.equal(readAttachment.size, attachment.size);
                        assert.equal(readAttachment.creatorId, attachment.creatorId);
                        done();
                    });
                });
            });

            test('Read attachment unauth- Fail', function (done) {
                var expectedAttachment = {
                    name: 'testfilename.doc',
                    source: 'upload',
                    link: 'http://example.com/testfilename.doc',
                    type: '.doc',
                    size: 1000,
                    creatorId: creator.id
                };

                topicAttachmentAdd(creatorAgent, creator.id, topic2.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, function (err, res) {
                    if (err) return done(err);

                    var attachment = res.body.data;

                    assert.property(attachment, 'id');
                    assert.property(attachment, 'createdAt');
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.link, expectedAttachment.link);
                    assert.equal(attachment.source, expectedAttachment.source);
                    assert.equal(attachment.type, expectedAttachment.type);
                    assert.equal(attachment.size, expectedAttachment.size);
                    assert.equal(attachment.creatorId, creator.id);

                    _topicAttachmentReadUnauth(agent, topic2.id, attachment.id, 404, function (err, res) {
                        if (err) return done(err);

                        var expectedResponse = {
                            status: {
                                code: 40400,
                                message: 'Not Found'
                            }
                        };

                        var result = res.body;

                        assert.deepEqual(result, expectedResponse);
                        done();
                    });
                });
            });

            test('Add Attachment - fail, no link', function (done) {
                var expectedAttachment = {
                    name: null,
                    source: 'upload',
                    link: null,
                    type: '.doc',
                    size: 1000,
                    creatorId: creator.id
                };

                _topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, 400, function (err, res) {
                    if (err) return done(err);
                    var expectedBody = {
                        status: {code: 40000},
                        errors: {
                            name: 'Attachment.name cannot be null',
                            link: 'Attachment.link cannot be null'
                        }
                    };
                    assert.deepEqual(res.body, expectedBody);
                    done();
                });
            });

            test('Update attachment - Success', function (done) {
                var expectedAttachment = {
                    name: 'newTestFilename',
                    source: 'dropbox',
                    link: 'http://example.com/testfilename.doc',
                    type: '.doc',
                    size: 1000,
                    creatorId: creator.id
                };

                topicAttachmentAdd(creatorAgent, creator.id, topic.id, 'testfilename', 'http://example.com/testfilename.doc', 'dropbox', '.doc', 1000, function (err, res) {
                    if (err) return done(err);
                    var attachment = res.body.data;

                    assert.property(attachment, 'id');
                    assert.property(attachment, 'createdAt');
                    assert.equal(attachment.name, 'testfilename');
                    assert.equal(attachment.link, 'http://example.com/testfilename.doc');
                    assert.equal(attachment.type, '.doc');
                    assert.equal(attachment.source, 'dropbox');
                    assert.equal(attachment.size, 1000);
                    assert.equal(attachment.creatorId, creator.id);

                    topicAttachmentUpdate(creatorAgent, creator.id, topic.id, attachment.id, 'newTestFilename', function (err, res) {
                        if (err) return done(err);

                        var updateAttachment = res.body.data;
                        assert.property(updateAttachment, 'id');
                        assert.property(updateAttachment, 'createdAt');
                        assert.equal(updateAttachment.name, expectedAttachment.name);
                        assert.equal(updateAttachment.link, expectedAttachment.link);
                        assert.equal(updateAttachment.type, expectedAttachment.type);
                        assert.equal(updateAttachment.source, expectedAttachment.source);
                        assert.equal(updateAttachment.size, expectedAttachment.size);
                        assert.equal(updateAttachment.creatorId, creator.id);
                        done();
                    });
                });
            });

            test('Delete attachment - Success', function (done) {
                var expectedAttachment = {
                    name: 'testfilename.pdf',
                    link: 'http://example.com/testfilename.pdf',
                    source: 'onedrive',
                    type: '.pdf',
                    size: 1000,
                    creatorId: creator.id
                };

                topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, function (err, res) {
                    if (err) return done(err);
                    var attachment = res.body.data;

                    assert.property(attachment, 'id');
                    assert.property(attachment, 'createdAt');
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.link, expectedAttachment.link);
                    assert.equal(attachment.type, expectedAttachment.type);
                    assert.equal(attachment.source, expectedAttachment.source);
                    assert.equal(attachment.size, expectedAttachment.size);
                    assert.equal(attachment.creatorId, creator.id);

                    topicAttachmentDelete(creatorAgent, creator.id, topic.id, attachment.id, function (err, res) {
                        if (err) return done(err);
                        var expectedBody = {
                            status: {
                                code: 20000
                            }
                        };
                        assert.deepEqual(res.body, expectedBody);
                        topicAttachmentList(creatorAgent, creator.id, topic.id, function (err, res) {
                            if (err) return done(err);

                            var list = res.body.data;

                            assert.equal(list.count, 0);
                            assert.equal(list.rows.length, 0);

                            done();
                        });

                    });
                });
            });

            test.skip('Get signed download url', function (done) {
                done();
            });

            suite('List', function () {

                test('Read', function (done) {
                    var expectedAttachment = {
                        name: 'testfilename.doc',
                        link: 'http://example.com/testfilename.doc',
                        source: 'googledrive',
                        type: '.doc',
                        size: 1000,
                        creatorId: creator.id
                    };

                    topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, function (err, res) {
                        if (err) return done(err);

                        var attachment = res.body.data;

                        assert.property(attachment, 'id');
                        assert.property(attachment, 'createdAt');
                        assert.equal(attachment.name, expectedAttachment.name);
                        assert.equal(attachment.link, expectedAttachment.link);
                        assert.equal(attachment.source, expectedAttachment.source);
                        assert.equal(attachment.type, expectedAttachment.type);
                        assert.equal(attachment.size, expectedAttachment.size);
                        assert.equal(attachment.creatorId, creator.id);

                        topicAttachmentList(creatorAgent, creator.id, topic.id, function (err, res) {
                            if (err) return done(err);

                            var list = res.body.data;
                            var listAttachment = list.rows[0];

                            assert.equal(list.count, 1);
                            assert.property(attachment, 'id');
                            assert.property(attachment, 'createdAt');
                            assert.equal(listAttachment.name, expectedAttachment.name);
                            assert.equal(listAttachment.link, expectedAttachment.link);
                            assert.equal(listAttachment.type, expectedAttachment.type);
                            assert.equal(listAttachment.size, expectedAttachment.size);
                            assert.equal(listAttachment.creator.id, creator.id);

                            done();
                        });
                    });
                });

                test('Read unauth', function (done) {
                    var expectedAttachment = {
                        name: 'testfilename.doc',
                        link: 'http://example.com/testfilename.doc',
                        type: '.doc',
                        source: 'onedrive',
                        size: 1000,
                        creatorId: creator.id
                    };

                    topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, function (err, res) {
                        if (err) return done(err);

                        var attachment = res.body.data;
                        assert.property(attachment, 'id');
                        assert.property(attachment, 'createdAt');
                        assert.equal(attachment.name, expectedAttachment.name);
                        assert.equal(attachment.link, expectedAttachment.link);
                        assert.equal(attachment.type, expectedAttachment.type);
                        assert.equal(attachment.source, expectedAttachment.source);
                        assert.equal(attachment.size, expectedAttachment.size);
                        assert.equal(attachment.creatorId, creator.id);

                        topicAttachmentListUnauth(creatorAgent, topic.id, function (err, res) {
                            if (err) return done(err);

                            var list = res.body.data;
                            assert.equal(list.count, 1);
                            var listAttachment = list.rows[0];
                            assert.property(attachment, 'id');
                            assert.property(attachment, 'createdAt');
                            assert.equal(listAttachment.name, expectedAttachment.name);
                            assert.equal(listAttachment.link, expectedAttachment.link);
                            assert.equal(listAttachment.type, expectedAttachment.type);
                            assert.equal(listAttachment.source, expectedAttachment.source);
                            assert.equal(listAttachment.size, expectedAttachment.size);
                            assert.equal(listAttachment.creator.id, creator.id);

                            done();
                        });
                    });
                });
            });
        });

        // API - /api/users/:userId/topics/:topicId/reports
        suite('Reports', function () {

            suite('Create', function () {
                const agentCreator = request.agent(app);
                const agentReporter = request.agent(app);
                const agentModerator = request.agent(app);

                const emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';

                let userCreator;
                let userReporter;
                let userModerator;

                let topic;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ]
                            , function (err, results) {
                                if (err) return done(err);

                                [userCreator, userModerator, userReporter] = results;

                                topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR SPAM REPORTING</h2></body></html>', null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    // Create a moderator in DB so that the Moderation email flow is executed
                                    Moderator
                                        .create({
                                            userId: userModerator.id
                                        })
                                        .then(function () {
                                            done();
                                        })
                                        .catch(done);
                                });
                            }
                        );
                });

                test('Success', function (done) {
                    const reportType = Report.TYPES.spam;
                    const reportText = 'Topic spam report test';

                    topicReportCreate(agentReporter, topic.id, reportType, reportText, function (err, res) {
                        if (err) return done(err);

                        const reportResult = res.body.data;

                        assert.isTrue(validator.isUUID(reportResult.id, 4));
                        assert.equal(reportResult.type, reportType);
                        assert.equal(reportResult.text, reportText);
                        assert.property(reportResult, 'createdAt');
                        assert.equal(reportResult.creator.id, userReporter.id);

                        done();
                    });
                });

                test('Fail - 40001 - Topic has already been reported. No duplicate reports.', function (done) {
                    const reportType = Report.TYPES.spam;
                    const reportText = 'Topic spam report test';

                    _topicReportCreate(agentReporter, topic.id, reportType, reportText, 400, function (err, res) {
                        if (err) return done(err);

                        const expectedStatus = {
                            code: 40001,
                            message: 'Topic has already been reported. Only one active report is allowed at the time to avoid overloading the moderators'
                        };

                        assert.deepEqual(res.body.status, expectedStatus);

                        done();
                    });
                });

                test('Fail - 40400 - Can\'t report a private Topic', function (done) {
                    const reportType = Report.TYPES.hate;
                    const reportText = 'Topic hate speech report for private Topic test';

                    topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.private, null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        _topicReportCreate(agentReporter, topic.id, reportType, reportText, 404, done);
                    });
                });


                test('Fail - 40100 - Authentication is required', function (done) {
                    const reportType = Report.TYPES.hate;
                    const reportText = 'Topic hate speech report for private Topic test';

                    topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.private, null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        _topicReportCreate(request.agent(app), topic.id, reportType, reportText, 401, done);
                    });
                });

            });

            suite('Read', function () {
                const agentCreator = request.agent(app);
                const agentReporter = request.agent(app);
                const agentModerator = request.agent(app);

                const emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';

                const topicTitle = 'Topic report test';
                const topicDescription = '<!DOCTYPE HTML><html><body><h1>Topic report test</h1><br>Topic report test desc<br><br></body></html>'
                    .replace(':topicTitle', topicTitle);

                const reportType = Report.TYPES.hate;
                const reportText = 'Topic hate speech report test';

                let userCreator;
                let userModerator;

                let topic;
                let report;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ]
                            , function (err, results) {
                                if (err) return done(err);

                                [userCreator, userModerator] = results;

                                topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    topicReportCreate(agentReporter, topic.id, reportType, reportText, function (err, res) {
                                        if (err) return done(err);

                                        report = res.body.data;

                                        // Create a moderator in DB so that the Moderation email flow is executed
                                        Moderator
                                            .create({
                                                userId: userModerator.id
                                            })
                                            .then(function () {
                                                done();
                                            })
                                            .catch(done);
                                    });
                                });
                            }
                        );
                });

                test('Success', function (done) {

                    topicReportRead(agentModerator, topic.id, report.id, function (err, res) {
                        if (err) return done(err);

                        const reportResult = res.body.data;

                        assert.equal(reportResult.id, report.id);
                        assert.equal(reportResult.type, report.type);
                        assert.equal(reportResult.text, report.text);
                        assert.equal(reportResult.createdAt, report.createdAt);

                        // FIXME: MAY NOT want to output moderator info
                        assert.isNotNull(reportResult.moderator);
                        assert.property(reportResult.moderator, 'id');

                        assert.property(reportResult, 'moderatedReasonText');
                        assert.property(reportResult, 'moderatedReasonType');

                        const reportResultTopic = reportResult.topic;

                        assert.equal(reportResultTopic.id, topic.id);
                        assert.equal(reportResultTopic.title, topicTitle);
                        assert.equal(reportResultTopic.description, '<!DOCTYPE HTML><html><body><h1>Topic report test</h1><br>Topic report test desc<br><br><br></body></html>'); // DOH, whatever you do Etherpad adds extra <br>

                        done();
                    });
                });

                test('Fail - 40100 - Only moderators can read a report', function (done) {
                    _topicReportRead(agentCreator, topic.id, report.id, 401, done);
                });
            });

            suite('Moderate', function () {
                const agentCreator = request.agent(app);
                const agentReporter = request.agent(app);
                const agentModerator = request.agent(app);

                const emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';

                const topicTitle = 'Topic report test';
                const topicDescription = '<!DOCTYPE HTML><html><body><h1>Topic report test</h1><br>Topic report test desc<br><br></body></html>'
                    .replace(':topicTitle', topicTitle);

                const reportType = Report.TYPES.hate;
                const reportText = 'Topic hate speech report test';

                let userCreator;
                let userModerator;

                let topic;
                let report;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ]
                            , function (err, results) {
                                if (err) return done(err);

                                [userCreator, userModerator] = results;

                                Moderator
                                    .create({
                                        userId: userModerator.id
                                    })
                                    .then(function () {
                                        done();
                                    })
                                    .catch(done);
                            }
                        );
                });

                setup(function (done) {
                    topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        topicReportCreate(agentReporter, topic.id, reportType, reportText, function (err, res) {
                            if (err) return done(err);

                            report = res.body.data;

                            done();
                        });
                    });
                });

                test('Success', function (done) {
                    var type = Report.TYPES.spam;
                    var text = 'Test: contains spam.';

                    topicReportModerate(agentModerator, topic.id, report.id, type, text, function (err, res) {
                        if (err) return done(err);

                        var moderateResult = res.body.data;

                        topicReportRead(agentModerator, topic.id, report.id, function (err, res) {
                            if (err) return done(err);

                            const reportReadResult = res.body.data;
                            delete reportReadResult.topic; // No Topic info returned in moderation result

                            assert.deepEqual(moderateResult, reportReadResult);

                            return done();
                        });
                    });
                });

                test('Fail - 40012 - Report has become invalid cause the report has been already moderated', function (done) {
                    var type = Report.TYPES.spam;
                    var text = 'Test: contains spam.';

                    topicReportModerate(agentModerator, topic.id, report.id, type, text, function (err) {
                        if (err) return done(err);

                        _topicReportModerate(agentModerator, topic.id, report.id, type, text, 400, function (err, res) {
                            if (err) return done(err);

                            var expectedBody = {
                                status: {
                                    code: 40012,
                                    message: 'Report has become invalid cause the report has been already moderated'
                                }
                            };
                            assert.deepEqual(res.body, expectedBody);

                            done();
                        });
                    });
                });

                test('Fail - 40000 - type cannot be null', function (done) {
                    var type = null;
                    var text = 'Test: contains spam.';

                    _topicReportModerate(agentModerator, topic.id, report.id, type, text, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {code: 40000},
                            errors: {
                                moderatedReasonType: 'TopicReport.moderatedReasonType cannot be null when moderator is set'
                            }
                        };
                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - 40000 - text cannot be null', function (done) {
                    var type = Report.TYPES.spam;
                    var text = null;

                    _topicReportModerate(agentModerator, topic.id, report.id, type, text, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {code: 40000},
                            errors: {
                                moderatedReasonText: 'Text can be 1 to 2048 characters long.'
                            }
                        };
                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - 40100 - Moderation only allowed for Moderators', function (done) {
                    var type = Report.TYPES.spam;
                    var text = null;

                    _topicReportModerate(agentCreator, topic.id, report.id, type, text, 401, done);
                });
            });

            suite('Review', function () {
                var agentCreator = request.agent(app);
                var agentReporter = request.agent(app);
                var agentModerator = request.agent(app);

                var emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                var emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                var emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';

                var topicTitle = 'Topic report test';
                var topicDescription = '<!DOCTYPE HTML><html><body><h1>Topic report test</h1><br>Topic report test desc<br><br></body></html>'
                    .replace(':topicTitle', topicTitle);

                var reportType = Report.TYPES.hate;
                var reportText = 'Topic hate speech report test';

                var userCreator;
                var userModerator;
                var userReporter;

                var topic;
                var report;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ]
                            , function (err, results) {
                                if (err) return done(err);

                                [userCreator, userModerator, userReporter] = results;

                                topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    topicReportCreate(agentReporter, topic.id, reportType, reportText, function (err, res) {
                                        if (err) return done(err);

                                        report = res.body.data;

                                        var type = Report.TYPES.spam;
                                        var text = 'Test: contains spam.';

                                        // Create a moderator in DB so that the Moderation email flow is executed
                                        Moderator
                                            .create({
                                                userId: userModerator.id
                                            })
                                            .then(function () {
                                                topicReportModerate(agentModerator, topic.id, report.id, type, text, done);
                                            })
                                            .catch(done);
                                    });
                                });
                            }
                        );
                });

                test('Success', function (done) {
                    topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, 'Please review, I have made many changes', done);
                });

                test('Fail - 40300 - Unauthorized, restricted to Users with access', function (done) {
                    _topicReportsReview(agentReporter, userReporter.id, topic.id, report.id, 'Please review, I have made many changes', 403, done);
                });

                test('Fail - 40001 - Missing required parameter "text"', function (done) {
                    _topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, undefined, 400, function (err, res) { //eslint-disable-line no-undefined
                        if (err) {
                            return done(err);
                        }

                        var expectedBody = {
                            status: {
                                code: 40001,
                                message: 'Bad request'
                            },
                            errors: {text: 'Parameter "text" has to be between 10 and 4000 characters'}
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - 40001 - Review text too short', function (done) {
                    _topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, 'x', 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedBody = {
                            status: {
                                code: 40001,
                                message: 'Bad request'
                            },
                            errors: {text: 'Parameter "text" has to be between 10 and 4000 characters'}
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - 40001 - Review text too long', function (done) {
                    var text = new Array(4002).join('a');
                    _topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, text, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedBody = {
                            status: {
                                code: 40001,
                                message: 'Bad request'
                            },
                            errors: {text: 'Parameter "text" has to be between 10 and 4000 characters'}
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

                test('Fail - 40300 - Review requests are only allowed for Topic members', function (done) {
                    _topicReportsReview(agentReporter, userReporter.id, topic.id, report.id, 'Please review, I have made many changes', 403, done);
                });
            });

            suite('Resolve', function () {
                var agentCreator = request.agent(app);
                var agentReporter = request.agent(app);
                var agentModerator = request.agent(app);

                var emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                var emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                var emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';

                var topicTitle = 'Topic report test';
                var topicDescription = '<!DOCTYPE HTML><html><body><h1>Topic report test</h1><br>Topic report test desc<br><br></body></html>'
                    .replace(':topicTitle', topicTitle);

                var reportType = Report.TYPES.hate;
                var reportText = 'Topic hate speech report test';

                var userCreator;
                var userModerator;

                var topic;
                var report;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ]
                            , function (err, results) {
                                if (err) return done(err);

                                [userCreator, userModerator] = results;

                                topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    topicReportCreate(agentReporter, topic.id, reportType, reportText, function (err, res) {
                                        if (err) return done(err);

                                        report = res.body.data;

                                        var type = Report.TYPES.spam;
                                        var text = 'Test: contains spam.';

                                        // Create a moderator in DB so that the Moderation email flow is executed
                                        Moderator
                                            .create({
                                                userId: userModerator.id
                                            })
                                            .then(function () {
                                                topicReportModerate(agentModerator, topic.id, report.id, type, text, done);
                                            })
                                            .catch(done);
                                    });
                                });
                            }
                        );
                });

                test('Success', function (done) {
                    topicReportsResolve(agentModerator, topic.id, report.id, done);
                });

                test('Fail - 40100 - Only Moderators can resolve a report', function (done) {
                    _topicReportsResolve(agentReporter, topic.id, report.id, 401, done);
                });
            });
        });
    });
});

// API - /api/topics - unauthenticated endpoints
suite('Topics', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .finally(done);
    });

    suite('Read', function () {
        var creatorAgent = request.agent(app);

        var creator;

        var topic;

        suiteSetup(function (done) {
            userLib.createUserAndLogin(creatorAgent, null, null, null, function (err, res) {
                if (err) return done(err);
                creator = res;
                done();
            });
        });

        setup(function (done) {
            topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business], null, null, null, function (err, res) {
                if (err) return done(err);
                topic = res.body.data;
                done();
            });
        });

        test('Success', function (done) {
            async
                .parallel(
                    [
                        function (cb) {
                            topicRead(creatorAgent, creator.id, topic.id, null, cb);
                        },
                        function (cb) {
                            topicReadUnauth(request.agent(app), topic.id, null, cb);
                        }
                    ],
                    function (err, results) {
                        if (err) return done(err);

                        var topicRead = results[0].body;
                        var topicReadUnauth = results[1].body;

                        // The only difference between auth and unauth is the permission, thus modify it in expected response.
                        topicRead.data.permission.level = TopicMemberUser.LEVELS.none;
                        assert.notProperty(topicRead.data, 'events');

                        delete topicRead.data.tokenJoin; // Unauth read of Topic should not give out token!
                        delete topicRead.data.pinned; // Unauth read of Topic should not give out pinned tag value!

                        // Also, padUrl will not have authorization token
                        topicRead.data.padUrl = topicRead.data.padUrl.split('?')[0];

                        assert.deepEqual(topicReadUnauth, topicRead);

                        done();
                    }
                );
        });

        suite('Include', function () {
            test('Success - vote', function (done) {
                var options = [
                    {
                        value: 'YES'
                    },
                    {
                        value: 'NO'
                    }
                ];
                topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft, function (err) {
                    if (err) return done(err);

                    async
                        .parallel(
                            [
                                function (cb) {
                                    topicRead(creatorAgent, creator.id, topic.id, 'vote', cb);
                                },
                                function (cb) {
                                    topicReadUnauth(request.agent(app), topic.id, ['vote'], cb);
                                }
                            ],
                            function (err, results) {
                                if (err) return done(err);

                                var topicRead = results[0].body;
                                var topicReadUnauth = results[1].body;

                                // The only difference between auth and unauth is the permission, thus modify it in expected response.
                                topicRead.data.permission.level = TopicMemberUser.LEVELS.none;

                                delete topicRead.data.tokenJoin; // Unauth read of Topic should not give out token!
                                delete topicRead.data.pinned; // Unauth read of Topic should not give out pinned tag value!

                                // Also, padUrl will not have authorization token
                                topicRead.data.padUrl = topicRead.data.padUrl.split('?')[0];

                                var vote = topicRead.data.vote;

                                assert.property(vote, 'options');
                                assert.property(vote.options, 'count');
                                assert.property(vote.options, 'rows');

                                vote.options.rows.forEach(function (option) {
                                    assert.property(option, 'id');
                                    assert.property(option, 'value');
                                });

                                assert.deepEqual(topicReadUnauth, topicRead);

                                done();
                            }
                        );
                });
            });

            test('Success - events', function (done) {
                topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp, function (err) {
                    if (err) return done(err);

                    async
                        .parallel(
                            [
                                function (cb) {
                                    topicRead(creatorAgent, creator.id, topic.id, 'event', cb);
                                },
                                function (cb) {
                                    topicReadUnauth(request.agent(app), topic.id, ['event'], cb);
                                }
                            ],
                            function (err, results) {
                                if (err) return done(err);

                                var topicRead = results[0].body;
                                var topicReadUnauth = results[1].body;

                                assert.equal(topicRead.data.status, Topic.STATUSES.followUp);
                                // The only difference between auth and unauth is the permission, thus modify it in expected response.
                                topicRead.data.permission.level = TopicMemberUser.LEVELS.none;

                                delete topicRead.data.tokenJoin; // Unauth read of Topic should not give out token!
                                delete topicRead.data.pinned; // Unauth read of Topic should not give out pinned tag value!

                                // Also, padUrl will not have authorization token
                                topicRead.data.padUrl = topicRead.data.padUrl.split('?')[0];

                                var events = topicRead.data.events;

                                assert.property(events, 'count');
                                assert.equal(events.count, 0);

                                assert.deepEqual(topicReadUnauth, topicRead);

                                done();
                            }
                        );
                });
            });
        });

        test('Success - all', function (done) {
            var options = [
                {
                    value: 'YES'
                },
                {
                    value: 'NO'
                }
            ];
            topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft, function (err) {
                if (err) return done(err);

                topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp, function (err) {
                    if (err) return done(err);

                    async
                        .parallel(
                            [
                                function (cb) {
                                    topicRead(creatorAgent, creator.id, topic.id, ['vote', 'event'], cb);
                                },
                                function (cb) {
                                    topicReadUnauth(request.agent(app), topic.id, ['vote', 'event'], cb);
                                }
                            ],
                            function (err, results) {
                                if (err) return done(err);

                                var topicRead = results[0].body;
                                var topicReadUnauth = results[1].body;

                                assert.equal(topicRead.data.status, Topic.STATUSES.followUp);
                                // The only difference between auth and unauth is the permission, thus modify it in expected response.
                                topicRead.data.permission.level = TopicMemberUser.LEVELS.none;

                                delete topicRead.data.tokenJoin; // Unauth read of Topic should not give out token!
                                delete topicRead.data.pinned; // Unauth read of Topic should not give out pinned tag value!

                                // Also, padUrl will not have authorization token
                                topicRead.data.padUrl = topicRead.data.padUrl.split('?')[0];

                                var events = topicRead.data.events;

                                assert.property(events, 'count');
                                assert.equal(events.count, 0);

                                var vote = topicRead.data.vote;

                                assert.property(vote, 'options');
                                assert.property(vote.options, 'count');
                                assert.property(vote.options, 'rows');

                                vote.options.rows.forEach(function (option) {
                                    assert.property(option, 'id');
                                    assert.property(option, 'value');
                                });

                                assert.deepEqual(topicReadUnauth, topicRead);

                                done();
                            }
                        );
                });
            });
        });

    });

    suite('List', function () {
        var creatorAgent = request.agent(app);
        var userAgent = request.agent(app);

        var creator;
        var topic;

        suiteSetup(function (done) {
            userLib.createUserAndLogin(creatorAgent, null, null, null, function (err, res) {
                if (err) return done(err);

                creator = res;

                done();
            });
        });

        setup(function (done) {
            topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null, function (err, res) {
                if (err) return done(err);
                topic = res.body.data;

                // Set "title" to Topic, otherwise there will be no results because of the "title NOT NULL" in the query
                Topic
                    .update(
                        {
                            title: 'TEST PUBLIC'
                        },
                        {
                            where: {
                                id: topic.id
                            }
                        }
                    )
                    .then(function () {
                        done();
                    })
                    .catch(done);
            });
        });

        test('Success - non-authenticated User - show "public" Topics', function (done) {
            topicsListUnauth(userAgent, null, null, null, null, null, null, null, function (err, res) {
                if (err) return done(err);

                assert.property(res.body.data, 'countTotal');

                var topicList = res.body.data.rows;

                assert.equal(res.body.data.count, topicList.length);

                assert(topicList.length > 0);
                assert(topicList.length <= 26); // No limit, means default limit == 25

                topicList.forEach(function (topic) {
                    assert.equal(topic.visibility, Topic.VISIBILITY.public);
                    assert.notProperty(topic, 'events');
                });

                done();
            });
        });

        test('Success - non-authenticated User - limit and offset fallback', function (done) {
            topicsListUnauth(userAgent, null, null, null, 'sfsf', 'dsasdas', null, null, function (err, res) {
                if (err) return done(err);

                assert.property(res.body.data, 'countTotal');

                var topicList = res.body.data.rows;

                assert.equal(res.body.data.count, topicList.length);

                assert(topicList.length > 0);
                assert(topicList.length <= 26); // No limit, means default limit == 25

                topicList.forEach(function (topic) {
                    assert.equal(topic.visibility, Topic.VISIBILITY.public);
                    assert.notProperty(topic, 'events');
                });

                done();
            });
        });

        test('Success - non-authenticated User - show "public" Topics in categories', function (done) {
            topicsListUnauth(userAgent, null, [Topic.CATEGORIES.environment], null, null, null, null, null, function (err, res) {
                if (err) return done(err);

                assert.property(res.body.data, 'countTotal');

                var topicList = res.body.data.rows;

                assert.equal(res.body.data.count, topicList.length);

                assert(topicList.length > 0);
                assert(topicList.length <= 26); // No limit, means default limit == 25

                topicList.forEach(function (topic) {
                    assert.equal(topic.visibility, Topic.VISIBILITY.public);
                    assert.include(topic.categories, Topic.CATEGORIES.environment);
                });

                topicsListUnauth(userAgent, null, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    assert.property(res.body.data, 'countTotal');

                    var topicList2 = res.body.data.rows;

                    assert.equal(topicList2.length, topicList.length);

                    assert(topicList2.length > 0);
                    assert(topicList2.length <= 26); // No limit, means default limit == 25

                    topicList.forEach(function (topic) {
                        assert.equal(topic.visibility, Topic.VISIBILITY.public);
                        assert.include(topic.categories, Topic.CATEGORIES.environment);
                        assert.include(topic.categories, Topic.CATEGORIES.health);
                    });

                    topicsListUnauth(userAgent, null, [Topic.CATEGORIES.work], null, null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        assert.property(res.body.data, 'countTotal');

                        var topicList3 = res.body.data.rows;

                        assert.equal(res.body.data.count, topicList3.length);

                        assert(topicList3.length === 0);

                        done();
                    });
                });
            });
        });

        test('Success - non-authenticated User - show "public" Topics with status', function (done) {
            topicsListUnauth(userAgent, Topic.STATUSES.inProgress, null, null, null, null, null, null, function (err, res) {
                if (err) return done(err);

                assert.property(res.body.data, 'countTotal');

                var topicList = res.body.data.rows;

                assert.equal(res.body.data.count, topicList.length);

                assert(topicList.length > 0);
                assert(topicList.length <= 26); // No limit, means default limit == 25

                topicList.forEach(function (topic) {
                    assert.equal(topic.visibility, Topic.VISIBILITY.public);
                });

                topicsListUnauth(userAgent, Topic.STATUSES.voting, null, null, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    assert.property(res.body.data, 'countTotal');

                    var topicList2 = res.body.data.rows;

                    assert.notEqual(topicList2.length, topicList.length);
                    assert.equal(topicList2.length, 0);

                    done();
                });
            });
        });

        test('Success - non-authenticated User - don\'t show deleted "public" Topics', function (done) {

            topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null, function (err, res) {
                if (err) return done(err);
                var deletedTopic = res.body.data;

                // Set "title" to Topic, otherwise there will be no results because of the "title NOT NULL" in the query
                Topic
                    .update(
                        {
                            title: 'TEST PUBLIC DELETE'
                        },
                        {
                            where: {
                                id: deletedTopic.id
                            }
                        }
                    )
                    .then(function () {
                        topicDelete(creatorAgent, creator.id, deletedTopic.id, function (err) {
                            if (err) return done(err);

                            topicsListUnauth(userAgent, Topic.STATUSES.inProgress, null, null, null, null, null, null, function (err, res) {
                                if (err) return done(err);

                                assert.property(res.body.data, 'countTotal');

                                var topicList = res.body.data.rows;

                                assert.equal(res.body.data.count, topicList.length);

                                assert(topicList.length > 0);
                                assert(topicList.length <= 26); // No limit, means default limit == 25

                                topicList.forEach(function (resTopic) {
                                    assert.notEqual(deletedTopic.id, resTopic.id);
                                });
                                done();
                            });
                        });

                    })
                    .catch(done);
            });

        });

        test('Success - non-authenticated User - show "public" Topics with sourcePartnerId', function (done) {
            var now = moment().format();
            var partnerId = '4b511ad1-5b20-4c13-a6da-0b95d07b6900';
            db
                .query(
                    ' \
                    INSERT INTO \
                    "Partners" (id, website, "redirectUriRegexp", "createdAt", "updatedAt") \
                        SELECT \
                        :partnerId, \
                        :website, \
                        :partnerRegEx, \
                        :updatedAt, \
                        :createdAt \
                        WHERE NOT EXISTS ( \
                            SELECT 1 \
                            FROM "Partners" \
                            WHERE id = :partnerId \
                        ); \
                    ',
                    {
                        replacements: {
                            partnerId: partnerId,
                            website: 'http://www.partner.com',
                            partnerRegEx: '^http(s)?://([^.]*.)?partner.com(:[0-9]{2,5})?/.*',
                            createdAt: now,
                            updatedAt: now
                        },
                        type: db.QueryTypes.INSERT,
                        raw: true
                    }
                )
                .then(function () {
                    topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null, function (err, res) {
                        if (err) return done(err);

                        var partnerTopic = res.body.data;

                        // Set "title" to Topic, otherwise there will be no results because of the "title NOT NULL" in the query
                        Topic
                            .update(
                                {
                                    title: 'TEST PUBLIC PARTNER',
                                    sourcePartnerId: partnerId
                                },
                                {
                                    where: {
                                        id: partnerTopic.id
                                    }
                                }
                            )
                            .then(function () {
                                topicsListUnauth(userAgent, null, null, null, null, null, ['4b511ad1-5b20-4c13-a6da-0b95d07b6901', partnerId], null, function (err, res) {
                                    if (err) return done(err);

                                    assert.property(res.body.data, 'countTotal');

                                    var topicList = res.body.data.rows;
                                    assert.equal(res.body.data.count, topicList.length);
                                    assert.equal(topicList.length, 1);
                                    topicList.forEach(function (topic) {
                                        assert.property(topic, 'sourcePartnerId');
                                        assert.equal(topic.sourcePartnerId, partnerId);
                                    });

                                    done();
                                });
                            });
                    });
                });

        });

        suite('Include', function () {
            var creatorAgent = request.agent(app);
            var userAgent = request.agent(app);

            var creator;
            var topic;

            var options = [
                {
                    value: 'YES'
                },
                {
                    value: 'NO'
                }
            ];

            suiteSetup(function (done) {
                userLib.createUserAndLogin(creatorAgent, null, null, null, function (err, res) {
                    if (err) return done(err);

                    creator = res;

                    done();
                });
            });

            setup(function (done) {
                topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    topic = res.body.data;

                    Topic
                        .update(
                            {
                                title: 'TEST PUBLIC'
                            },
                            {
                                where: {
                                    id: topic.id
                                }
                            }
                        )
                        .then(function () {
                            topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, null, function (err, res) {
                                if (err) return done(err);

                                var vote = res.body.data;

                                async
                                    .parallel(
                                        [
                                            function (cb) {
                                                topicVoteRead(creatorAgent, creator.id, topic.id, vote.id, cb);
                                            },
                                            function (cb) {
                                                topicVoteReadUnauth(userAgent, topic.id, vote.id, cb);
                                            }
                                        ],
                                        function (err, results) {
                                            if (err) return done(err);

                                            var voteRead = results[0].body.data;
                                            var voteReadUnauth = results[1].body.data;

                                            // For consistency, the logged in authenticated and unauthenticated should give same result
                                            assert.deepEqual(voteReadUnauth, voteRead);

                                            done();
                                        }
                                    );
                            });
                        })
                        .catch(done);

                });
            });

            test('Success - non-authenticated User - show "public" Topics include vote', function (done) {
                topicsListUnauth(userAgent, null, null, null, null, null, null, 'vote', function (err, res) {
                    if (err) return done(err);

                    assert.property(res.body.data, 'countTotal');
                    assert.isNumber(res.body.data.countTotal);
                    var topicList = res.body.data.rows;

                    assert.equal(res.body.data.count, topicList.length);

                    assert(topicList.length > 0);
                    assert(topicList.length <= 26); // No limit, means default limit == 25
                    var i = 0;
                    topicList.forEach(function (topicItem) {
                        assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                        if (topicItem.status === Topic.STATUSES.voting) {
                            i++;
                            var vote = topicItem.vote;
                            /// Compare that result from vote read is same as in included vote property
                            topicVoteRead(creatorAgent, creator.id, topicItem.id, vote.id, function (err, res) {
                                if (err) return done(err);
                                var voteRead = res.body.data;
                                assert.deepEqual(vote, voteRead);
                            });
                        } else {
                            i++;
                        }

                        //Done should be called after all topics are compared
                        if (i === topicList.length) {
                            done();
                        }
                    });
                });
            });

            test('Success - non-authenticated User - show "public" Topics include events', function (done) {
                topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp, function (err) {
                    if (err) return done(err);

                    topicsListUnauth(userAgent, null, null, null, null, null, null, 'event', function (err, res) {
                        if (err) return done(err);

                        assert.property(res.body.data, 'countTotal');
                        assert.isNumber(res.body.data.countTotal);
                        var topicList = res.body.data.rows;

                        assert.equal(res.body.data.count, topicList.length);

                        assert(topicList.length > 0);
                        assert(topicList.length <= 26); // No limit, means default limit == 25
                        var i = 0;
                        topicList.forEach(function (topicItem) {
                            assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                            if (topicItem.status === Topic.STATUSES.followUp) {
                                assert.property(topicItem, 'events');
                                assert.equal(topicItem.events.count, 0);
                                i++;
                            } else {
                                i++;
                            }

                            //Done should be called after all topics are compared
                            if (i === topicList.length) {
                                done();
                            }
                        });
                    });
                });
            });

            test('Success - non-authenticated User - show "public" Topics include all', function (done) {
                topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp, function (err) {
                    if (err) return done(err);

                    topicsListUnauth(userAgent, null, null, null, null, null, null, ['event', 'vote'], function (err, res) {
                        if (err) return done(err);

                        assert.property(res.body.data, 'countTotal');
                        assert.isNumber(res.body.data.countTotal);
                        var topicList = res.body.data.rows;

                        assert.equal(res.body.data.count, topicList.length);

                        assert(topicList.length > 0);
                        assert(topicList.length <= 26); // No limit, means default limit == 25
                        var i = 0;
                        topicList.forEach(function (topicItem) {
                            assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                            assert.property(topicItem, 'events');
                            if (topicItem.status === Topic.STATUSES.followUp) {
                                assert.property(topicItem, 'vote');
                                assert.equal(topicItem.events.count, 0);
                                i++;
                            } else if (topicItem.status === Topic.STATUSES.voting) {
                                i++;
                                var vote = topicItem.vote;
                                /// Compare that result from vote read is same as in included vote property
                                topicVoteRead(creatorAgent, creator.id, topicItem.id, vote.id, function (err, res) {
                                    if (err) return done(err);
                                    var voteRead = res.body.data;
                                    assert.deepEqual(vote, voteRead);
                                });
                            } else {
                                i++;
                            }

                            //Done should be called after all topics are compared
                            if (i === topicList.length) {
                                done();
                            }
                        });
                    });
                });
            });

        });

    });

    suite('Comments', function () {

        suite('List', function () {

            var creatorAgent = request.agent(app);
            var userAgent = request.agent(app);

            var creator;
            var topic;
            var partner;

            var commentType1 = Comment.TYPES.pro;
            var commentSubj1 = 'Test comment 1 subj';
            var commentText1 = 'Test comment 1 text';
            var commentType2 = Comment.TYPES.con;
            var commentSubj2 = 'Test comment 2 text';
            var commentText2 = 'Test comment 2 subj';
            var commentSubj3 = 'Test comment 3 subj';
            var commentText3 = 'Test comment 3 text';

            var replyText1 = 'R1';
            var replyText2 = 'R2';
            var replyText3 = 'R3';
            var replyText21 = 'R2.1';
            var replyText211 = 'R2.1.1';
            var replyText212 = 'R2.1.2';
            var replyText2121 = 'R2.1.2.1';
            var replyText11 = 'R1.1';
            var replyText111 = 'R1.1.1';
            var replyText1111 = 'R1.1.1.1';
            var replyText11111 = 'R1.1.1.1.1';

            var comment1;
            var comment2;
            var comment3;
            var reply1;
            var reply2;
            var reply3;
            var reply11;
            var reply21;
            var reply211;
            var reply212;
            var reply2121;
            var reply111;
            var reply1111;
            var reply11111;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(creatorAgent, null, null, null, function (err, res) {
                    if (err) return done(err);

                    creator = res;

                    topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture], null, null, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        async
                            .series(
                                [
                                    function (cb) {
                                        topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, commentType1, commentSubj1, commentText1, cb);
                                    },
                                    function (cb) {
                                        topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, commentType2, commentSubj2, commentText2, cb);
                                    },
                                    function (cb) {
                                        topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, commentType1, commentSubj3, commentText3, cb);
                                    },
                                    function (cb) {
                                        Partner
                                            .create({
                                                website: 'notimportant',
                                                redirectUriRegexp: 'notimportant'
                                            })
                                            .then(function (res) {
                                                partner = res;
                                                cb();
                                            });
                                    }
                                ],
                                function (err, results) {
                                    if (err) return done(err);

                                    comment1 = results[0].body.data;
                                    comment2 = results[1].body.data;
                                    comment3 = results[2].body.data;

                                    async
                                        .series(
                                            [
                                                function (cb) {
                                                    topicCommentCreate(creatorAgent, creator.id, topic.id, comment3.id, null, null, null, replyText1, cb);
                                                },
                                                function (cb) {
                                                    topicCommentCreate(creatorAgent, creator.id, topic.id, comment3.id, null, null, null, replyText2, cb);
                                                },
                                                function (cb) {
                                                    topicCommentCreate(creatorAgent, creator.id, topic.id, comment3.id, null, null, null, replyText3, cb);
                                                }
                                            ],
                                            function (err, results) {
                                                if (err) return done(err);
                                                reply1 = results[0].body.data;
                                                reply2 = results[1].body.data;
                                                reply3 = results[2].body.data;

                                                async
                                                    .series(
                                                        [
                                                            function (cb) {
                                                                topicCommentCreate(creatorAgent, creator.id, topic.id, reply1.id, null, null, null, replyText11, cb);
                                                            },
                                                            function (cb) {
                                                                topicCommentCreate(creatorAgent, creator.id, topic.id, reply2.id, null, null, null, replyText21, cb);
                                                            }
                                                        ],
                                                        function (err, results) {
                                                            if (err) return done(err);
                                                            reply11 = results[0].body.data;
                                                            reply21 = results[1].body.data;

                                                            async
                                                                .series(
                                                                    [
                                                                        function (cb) {
                                                                            topicCommentCreate(creatorAgent, creator.id, topic.id, reply11.id, null, null, null, replyText111, cb);
                                                                        },
                                                                        function (cb) {
                                                                            topicCommentCreate(creatorAgent, creator.id, topic.id, reply21.id, null, null, null, replyText211, cb);
                                                                        },
                                                                        function (cb) {
                                                                            topicCommentCreate(creatorAgent, creator.id, topic.id, reply21.id, null, null, null, replyText212, cb);
                                                                        }
                                                                    ],
                                                                    function (err, results) {
                                                                        if (err) return done(err);
                                                                        reply111 = results[0].body.data;
                                                                        reply211 = results[1].body.data;
                                                                        reply212 = results[2].body.data;
                                                                        async
                                                                            .series(
                                                                                [
                                                                                    function (cb) {
                                                                                        topicCommentCreate(creatorAgent, creator.id, topic.id, reply212.id, null, null, null, replyText2121, cb);
                                                                                    },
                                                                                    function (cb) {
                                                                                        topicCommentCreate(creatorAgent, creator.id, topic.id, reply111.id, null, null, null, replyText1111, cb);
                                                                                    }
                                                                                ],
                                                                                function (err, results) {
                                                                                    if (err) return done(err);
                                                                                    reply2121 = results[0].body.data;
                                                                                    reply1111 = results[1].body.data;

                                                                                    topicCommentCreate(creatorAgent, creator.id, topic.id, reply1111.id, null, null, null, replyText11111, function (err, res) {
                                                                                        if (err) return done(err);

                                                                                        reply11111 = res.body.data;
                                                                                        reply11111.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply11111.deletedAt = null;
                                                                                        reply1111.deletedAt = null;
                                                                                        reply1111.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply111.deletedAt = null;
                                                                                        reply111.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply11.deletedAt = null;
                                                                                        reply11.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply1.deletedAt = null;
                                                                                        reply1.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply2121.deletedAt = null;
                                                                                        reply2121.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply211.deletedAt = null;
                                                                                        reply211.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply212.deletedAt = null;
                                                                                        reply212.votes = {
                                                                                            up: {count: 1},
                                                                                            down: {count: 0},
                                                                                            count: 1
                                                                                        };
                                                                                        reply21.deletedAt = null;
                                                                                        reply21.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };
                                                                                        reply2.deletedAt = null;
                                                                                        reply2.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 1},
                                                                                            count: 1
                                                                                        };
                                                                                        reply3.deletedAt = null;
                                                                                        reply3.votes = {
                                                                                            up: {count: 1},
                                                                                            down: {count: 0},
                                                                                            count: 1
                                                                                        };
                                                                                        comment3.deletedAt = null;
                                                                                        comment3.votes = {
                                                                                            up: {count: 0},
                                                                                            down: {count: 0},
                                                                                            count: 0
                                                                                        };

                                                                                        async
                                                                                            .parallel(
                                                                                                [
                                                                                                    function (cb) {
                                                                                                        topicCommentVotesCreate(creatorAgent, topic.id, comment2.id, 1, cb);
                                                                                                    },
                                                                                                    function (cb) {
                                                                                                        topicCommentVotesCreate(creatorAgent, topic.id, comment1.id, -1, cb);
                                                                                                    },
                                                                                                    function (cb) {
                                                                                                        topicCommentVotesCreate(creatorAgent, topic.id, reply212.id, 1, cb);
                                                                                                    },
                                                                                                    function (cb) {
                                                                                                        topicCommentVotesCreate(creatorAgent, topic.id, reply2.id, -1, cb);
                                                                                                    },
                                                                                                    function (cb) {
                                                                                                        topicCommentVotesCreate(creatorAgent, topic.id, reply3.id, 1, cb);
                                                                                                    }
                                                                                                ],
                                                                                                function (err) {
                                                                                                    if (err) return done(err);

                                                                                                    done();
                                                                                                }
                                                                                            );
                                                                                    });
                                                                                }
                                                                            );
                                                                    }
                                                                );
                                                        }
                                                    );
                                            }
                                        );
                                }
                            );
                    });
                });
            });

            test('Success', function (done) {
                topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture], null, null, null, function (err, res) {
                    if (err) return done(err);

                    var topic = res.body.data;

                    topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, Comment.TYPES.pro, 'Subject', 'WOHOO! This is my comment.', function (err) {
                        if (err) return done(err);

                        // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                        async
                            .parallel(
                                [
                                    function (cb) {
                                        topicCommentList(creatorAgent, creator.id, topic.id, null, cb);
                                    },
                                    function (cb) {
                                        topicCommentListUnauth(userAgent, topic.id, null, cb);
                                    }
                                ],
                                function (err, results) {
                                    if (err) return done(err);

                                    var creatorCommentList = results[0].body;
                                    var userCommentList = results[1].body;

                                    assert.deepEqual(creatorCommentList, userCommentList);

                                    done();
                                }
                            );
                    });
                });
            });

            test('Success - public Topic without comments', function (done) {
                topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.defense, Topic.CATEGORIES.education], null, null, null, function (err, res) {
                    if (err) return done(err);

                    var topic = res.body.data;

                    // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                    async
                        .parallel(
                            [
                                function (cb) {
                                    topicCommentList(creatorAgent, creator.id, topic.id, null, cb);
                                },
                                function (cb) {
                                    topicCommentListUnauth(userAgent, topic.id, null, cb);
                                }
                            ],
                            function (err, results) {
                                if (err) return done(err);

                                var creatorCommentList = results[0].body;
                                var userCommentList = results[1].body;

                                assert.deepEqual(creatorCommentList, userCommentList);

                                done();
                            }
                        );
                });
            });

            test('Success - Comments with replies v2 unauth orderBy date', function (done) {
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
                topicCommentListUnauth(userAgent, topic.id, 'date', function (err, res) {
                    if (err) return done(err);
                    var data = res.body.data;
                    var expectedResult = {
                        rows: [comment3, comment2, comment1],
                        count: {
                            total: 3,
                            pro: 2,
                            con: 1
                        }
                    };
                    assert.shallowDeepEqual(data, expectedResult);
                    done();
                });

            });

            test('Success - Comments with replies v2 orderBy rating', function (done) {
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
                topicCommentList(creatorAgent, creator.id, topic.id, 'rating', function (err, res) {
                    if (err) return done(err);
                    var data = res.body.data;
                    var expectedResult = {
                        rows: [comment2, comment3, comment1],
                        count: {
                            total: 3,
                            pro: 2,
                            con: 1
                        }
                    };
                    assert.shallowDeepEqual(data, expectedResult);
                    done();
                });

            });

            test('Success - Comments with replies v2 orderBy popularity', function (done) {
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
                topicCommentList(creatorAgent, creator.id, topic.id, 'popularity', function (err, res) {
                    if (err) return done(err);
                    var data = res.body.data;
                    var expectedResult = {
                        rows: [comment2, comment1, comment3],
                        count: {
                            total: 3,
                            pro: 2,
                            con: 1
                        }
                    };
                    assert.shallowDeepEqual(data, expectedResult);
                    done();
                });

            });

            test('Success - Comments with replies v2 orderBy date user is moderator', function (done) {
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
                Topic
                    .update(
                        {
                            sourcePartnerId: partner.id
                        },
                        {
                            where: {
                                id: topic.id
                            }
                        }
                    )
                    .then(function () {
                        return Moderator
                            .create({
                                userId: creator.id,
                                partnerId: partner.id
                            });
                    })
                    .then(function () {
                        topicCommentList(creatorAgent, creator.id, topic.id, 'date', function (err, res) {
                            if (err) return done(err);

                            var data = res.body.data;
                            var expectedResult = {
                                rows: [comment3, comment2, comment1],
                                count: {
                                    total: 3,
                                    pro: 2,
                                    con: 1
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

                            done();
                        });
                    });
            });

            test('Fail - 404 - trying to fetch comments of non-public Topic', function (done) {
                topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.private, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var topic = res.body.data;

                    _topicCommentListUnauth(userAgent, topic.id, null, 404, function (err) {
                        if (err) return done(err);

                        done();
                    });
                });
            });

        });

        // API - /api/topics/:topicId/comments/:commentId/votes
        suite('Votes', function () {

            suite('Create', function () {
                var creatorAgent = request.agent(app);

                var creator;
                var topic;
                var comment;

                suiteSetup(function (done) {
                    userLib.createUserAndLogin(creatorAgent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        creator = res;
                        done();
                    });
                });

                setup(function (done) {
                    topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business], null, null, null, function (err, res) {
                        if (err) return done(err);
                        topic = res.body.data;

                        topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, Comment.TYPES.pro, 'Subj', 'Text', function (err, res) {
                            if (err) return done(err);
                            comment = res.body.data;
                            done();
                        });
                    });
                });

                test('Success - 20100 - Upvote', function (done) {
                    topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 1, function (err, res) {
                        if (err) return done(err);

                        var expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 1
                                },
                                down: {
                                    count: 0
                                }
                            }
                        };
                        assert.deepEqual(res.body, expected);

                        done();
                    });
                });


                test('Success - 20100 - Downvote', function (done) {
                    topicCommentVotesCreate(creatorAgent, topic.id, comment.id, -1, function (err, res) {
                        if (err) return done(err);

                        var expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 0
                                },
                                down: {
                                    count: 1
                                }
                            }
                        };
                        assert.deepEqual(res.body, expected);

                        done();
                    });
                });

                test('Success - 20100 - clear vote', function (done) {
                    topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 0, function (err, res) {
                        if (err) return done(err);

                        var expected = {
                            status: {
                                code: 20000
                            },
                            data: {
                                up: {
                                    count: 0
                                },
                                down: {
                                    count: 0
                                }
                            }
                        };
                        assert.deepEqual(res.body, expected);

                        done();
                    });
                });

                test('Success - 20100 - change vote from upvote to downvote', function (done) {
                    topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 1, function (err) {
                        if (err) return done(err);

                        topicCommentVotesCreate(creatorAgent, topic.id, comment.id, -1, function (err, res) {
                            if (err) return done(err);

                            var expected = {
                                status: {
                                    code: 20000
                                },
                                data: {
                                    up: {
                                        count: 0
                                    },
                                    down: {
                                        count: 1
                                    }
                                }
                            };
                            assert.deepEqual(res.body, expected);

                            done();
                        });
                    });
                });

                test('Fail - 40000 - invalid vote value', function (done) {
                    _topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 666, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {code: 40000},
                            errors: {value: 'Vote value must be 1 (up-vote), -1 (down-vote) OR 0 to clear vote.'}
                        };
                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

            });

        });

        // API - /api/topics/:topicId/comments/:commentId/reports
        suite('Reports', function () {

            suite('Create', function () {
                var agentCreator = request.agent(app);
                var agentReporter = request.agent(app);
                var agentModerator = request.agent(app);

                var emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportest.com';
                var emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportest.com';
                var emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportest.com';

                var userCreator;
                var userModerator;
                var userReporter;

                var partner;
                var topic;
                var comment;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUser(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ]
                            , function (err, results) {
                                if (err) return done(err);

                                userCreator = results[0];
                                userModerator = results[1];
                                userReporter = results[2];

                                topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    topicCommentCreate(agentCreator, userCreator.id, topic.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report', function (err, res) {
                                        if (err) return done(err);

                                        comment = res.body.data;

                                        Partner
                                            .create({
                                                website: 'notimportant',
                                                redirectUriRegexp: 'notimportant'
                                            })
                                            .then(function (res) {
                                                partner = res;

                                                return Topic
                                                    .update(
                                                        {
                                                            sourcePartnerId: partner.id
                                                        },
                                                        {
                                                            where: {
                                                                id: topic.id
                                                            }
                                                        }
                                                    );
                                            })
                                            .then(function () {
                                                return Moderator
                                                    .create({
                                                        userId: userModerator.id,
                                                        partnerId: partner.id
                                                    });
                                            })
                                            .then(function () {
                                                done();
                                            })
                                            .catch(done);
                                    });
                                });
                            }
                        );
                });

                test('Success', function (done) {
                    var reportText = 'Hate speech report test';

                    topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, reportText, function (err, res) {
                        if (err) return done(err);

                        var reportResult = res.body.data;

                        assert.isTrue(validator.isUUID(reportResult.id, 4));
                        assert.equal(reportResult.type, Report.TYPES.hate);
                        assert.equal(reportResult.text, reportText);
                        assert.property(reportResult, 'createdAt');
                        assert.equal(reportResult.creator.id, userReporter.id);

                        done();
                    });
                });

            });

            suite('Read', function () {
                var agentCreator = request.agent(app);
                var agentReporter = request.agent(app);
                var agentModerator = request.agent(app);

                var emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportreadtest.com';
                var emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportreadtest.com';
                var emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@reportreadtest.com';

                var userCreator;
                var userModerator;

                var partner;
                var topic;
                var comment;
                var report;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUser(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ],
                            function (err, results) {
                                if (err) return done(err);

                                userCreator = results[0];
                                userModerator = results[1];

                                topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    async
                                        .parallel(
                                            [
                                                function (cb) {
                                                    Partner
                                                        .create({
                                                            website: 'notimportant',
                                                            redirectUriRegexp: 'notimportant'
                                                        })
                                                        .then(function (res) {
                                                            partner = res;

                                                            return Topic
                                                                .update(
                                                                    {
                                                                        sourcePartnerId: partner.id
                                                                    },
                                                                    {
                                                                        where: {
                                                                            id: topic.id
                                                                        }
                                                                    }
                                                                );
                                                        })
                                                        .then(function () {
                                                            return Moderator
                                                                .create({
                                                                    userId: userModerator.id,
                                                                    partnerId: partner.id
                                                                });
                                                        })
                                                        .then(function () {
                                                            cb();
                                                        })
                                                        .catch(cb);
                                                },
                                                function (cb) {
                                                    topicCommentCreate(agentCreator, userCreator.id, topic.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report', function (err, res) {
                                                        if (err) return cb(err);

                                                        comment = res.body.data;

                                                        cb();
                                                    });
                                                }
                                            ],
                                            function (err) {
                                                if (err) return done(err);

                                                topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, 'reported!', function (err, res) {
                                                    if (err) return done(err);

                                                    report = res.body.data;

                                                    done();
                                                });
                                            }
                                        );
                                });
                            }
                        );
                });

                test('Success - token with audience', function (done) {
                    var token = cosJwt.getTokenRestrictedUse(
                        {
                            userId: userModerator.id
                        },
                        [
                            'GET /api/topics/:topicId/comments/:commentId/reports/:reportId'
                                .replace(':topicId', topic.id)
                                .replace(':commentId', comment.id)
                                .replace(':reportId', report.id)
                        ]
                    );

                    topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token, function (err, res) {
                        if (err) return done(err);

                        var expectedResult = {
                            status: {code: 20000},
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

                        assert.deepEqual(res.body, expectedResult);

                        done();
                    });
                });

                test('Fail - 40100 - Invalid token', function (done) {
                    var token = {};
                    _topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token, 401, done);
                });

                test('Fail - 40100 - invalid token - without audience', function (done) {
                    var token = jwt.sign(
                        {},
                        config.session.privateKey,
                        {
                            algorithm: config.session.algorithm
                        }
                    );

                    _topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token, 401, done);
                });

                test('Fail - 40100 - invalid token - invalid audience', function (done) {
                    var token = cosJwt.getTokenRestrictedUse({}, 'GET /foo/bar');

                    _topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token, 401, done);
                });

            });

            suite('Moderate', function () {

                var agentCreator = request.agent(app);
                var agentReporter = request.agent(app);
                var agentModerator = request.agent(app);

                var emailCreator = 'creator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@repormoderationtest.com';
                var emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@repormoderationtest.com';
                var emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@repormoderationtest.com';

                var userCreator;
                var userModerator;

                var partner;
                var topic;
                var comment;
                var report;

                suiteSetup(function (done) {
                    async
                        .parallel(
                            [
                                function (cb) {
                                    userLib.createUserAndLogin(agentCreator, emailCreator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUser(agentModerator, emailModerator, null, null, cb);
                                },
                                function (cb) {
                                    userLib.createUserAndLogin(agentReporter, emailReporter, null, null, cb);
                                }
                            ]
                            , function (err, results) {
                                if (err) return done(err);

                                userCreator = results[0];
                                userModerator = results[1];

                                topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.private, null, null, null, null, function (err, res) {
                                    if (err) return done(err);

                                    topic = res.body.data;

                                    async
                                        .parallel(
                                            [
                                                function (cb) {
                                                    Partner
                                                        .create({
                                                            website: 'notimportant',
                                                            redirectUriRegexp: 'notimportant'
                                                        })
                                                        .then(function (res) {
                                                            partner = res;

                                                            return Topic
                                                                .update(
                                                                    {
                                                                        sourcePartnerId: partner.id
                                                                    },
                                                                    {
                                                                        where: {
                                                                            id: topic.id
                                                                        }
                                                                    }
                                                                );
                                                        })
                                                        .then(function () {
                                                            return Moderator
                                                                .create({
                                                                    userId: userModerator.id,
                                                                    partnerId: partner.id
                                                                });
                                                        })
                                                        .then(function () {
                                                            cb();
                                                        })
                                                        .catch(cb);
                                                },
                                                function (cb) {
                                                    topicCommentCreate(agentCreator, userCreator.id, topic.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report', function (err, res) {
                                                        if (err) return cb(err);

                                                        comment = res.body.data;

                                                        cb();
                                                    });
                                                }
                                            ],
                                            function (err) {
                                                if (err) return done(err);

                                                topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, 'Report create test text', function (err, res) {
                                                    if (err) return done(err);

                                                    report = res.body.data;

                                                    done();
                                                });
                                            }
                                        );
                                });
                            }
                        );
                });

                test('Success', function (done) {
                    var moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                    var moderateText = 'Report create moderation text';

                    var token = cosJwt.getTokenRestrictedUse(
                        {
                            userId: userModerator.id
                        },
                        [
                            'POST /api/topics/:topicId/comments/:commentId/reports/:reportId/moderate'
                                .replace(':topicId', topic.id)
                                .replace(':commentId', comment.id)
                                .replace(':reportId', report.id)
                        ]
                    );

                    topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, token, moderateType, moderateText, function (err) {
                        if (err) return done(err);

                        Comment
                            .findOne({
                                where: {
                                    id: comment.id
                                },
                                paranoid: false
                            })
                            .then(function (comm) {
                                var commentRead = comm.toJSON();

                                assert.equal(commentRead.deletedBy.id, userModerator.id);
                                assert.equal(commentRead.report.id, report.id);
                                assert.equal(commentRead.deletedReasonType, moderateType);
                                assert.equal(commentRead.deletedReasonText, moderateText);
                                assert.isNotNull(commentRead.deletedAt);

                                done();
                            })
                            .catch(done);
                    });
                });

                test('Fail - 40100 - Invalid token - random stuff', function (done) {
                    _topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, 'TOKEN HERE', Comment.DELETE_REASON_TYPES.abuse, 'not important', 401, done);
                });

                test('Fail - 40100 - Invalid token - invalid path', function (done) {
                    var path = '/totally/foobar/path';

                    var token = jwt.sign(
                        {
                            path: path
                        },
                        config.session.privateKey,
                        {
                            algorithm: config.session.algorithm
                        }
                    );

                    _topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, token, Comment.DELETE_REASON_TYPES.abuse, 'not important', 401, done);
                });

                test('Fail - 40010 - Report has become invalid cause comment has been updated after the report', function (done) {
                    // Revive the Comment we deleted on report
                    Comment
                        .update(
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
                        )
                        .then(function () {
                            topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, 'Report create test text', function (err, res) {
                                if (err) return done(err);

                                var report = res.body.data;

                                var moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                                var moderateText = 'Report create moderation text';

                                var token = cosJwt.getTokenRestrictedUse(
                                    {
                                        userId: userModerator.id
                                    },
                                    [
                                        'POST /api/topics/:topicId/comments/:commentId/reports/:reportId/moderate'
                                            .replace(':topicId', topic.id)
                                            .replace(':commentId', comment.id)
                                            .replace(':reportId', report.id)
                                    ]
                                );

                                Comment
                                    .update(
                                        {
                                            text: 'Update comment!'
                                        },
                                        {
                                            where: {
                                                id: comment.id
                                            },
                                            paranoid: false
                                        }
                                    )
                                    .then(function () {
                                        _topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, token, moderateType, moderateText, 400, function (err, res) {
                                            if (err) return done(err);

                                            var expectedResult = {
                                                status: {
                                                    code: 40010,
                                                    message: 'Report has become invalid cause comment has been updated after the report'
                                                }
                                            };

                                            assert.deepEqual(res.body, expectedResult);

                                            done();
                                        });
                                    })
                                    .catch(done);
                            });

                        })
                        .catch(done);
                });
            });

        });

    });

    suite('Votes', function () {

        suite('Read', function () {

            var creatorAgent = request.agent(app);
            var userAgent = request.agent(app);

            var creator;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(creatorAgent, null, null, null, function (err, res) {
                    if (err) return done(err);

                    creator = res;

                    done();
                });
            });

            test('Success', function (done) {
                topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var topic = res.body.data;

                    var options = [
                        {
                            value: 'YES'
                        },
                        {
                            value: 'NO'
                        }
                    ];

                    topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, null, function (err, res) {
                        if (err) return done(err);

                        var vote = res.body.data;

                        async
                            .parallel(
                                [
                                    function (cb) {
                                        topicVoteRead(creatorAgent, creator.id, topic.id, vote.id, cb);
                                    },
                                    function (cb) {
                                        topicVoteReadUnauth(userAgent, topic.id, vote.id, cb);
                                    }
                                ],
                                function (err, results) {
                                    if (err) return done(err);

                                    var voteRead = results[0].body.data;
                                    var voteReadUnauth = results[1].body.data;

                                    // For consistency, the logged in authenticated and unauthenticated should give same result
                                    assert.deepEqual(voteReadUnauth, voteRead);

                                    done();
                                }
                            );
                    });
                });
            });

            test('Fail - 404 - trying to fetch Vote of non-public Topic', function (done) {
                topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.private, null, null, null, null, function (err, res) {
                    if (err) return done(err);

                    var topic = res.body.data;

                    var options = [
                        {
                            value: 'YES'
                        },
                        {
                            value: 'NO'
                        }
                    ];

                    topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, null, function (err, res) {
                        if (err) return done(err);

                        var vote = res.body.data;

                        _topicVoteReadUnauth(userAgent, topic.id, vote.id, 404, done);
                    });
                });
            });

        });

        suite('Vote', function () {

            suite('authType === hard', function () {

                suite('Sign', function () {

                    test('Fail - Unauthorized - JWT token expired', function (done) {
                        var token = jwt.sign({
                            id: 'notimportantinthistest',
                            scope: 'all'
                        }, config.session.privateKey, {
                            expiresIn: '.1ms',
                            algorithm: config.session.algorithm
                        });
                        _topicVoteSignUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', [], 'notimportant', 'notimportant', token, 401, function (err, res) {
                            if (err) return done(err);

                            var expectedResponse = {
                                status: {
                                    code: 40100,
                                    message: 'JWT token has expired'
                                }
                            };
                            assert.deepEqual(res.body, expectedResponse);

                            done();
                        });
                    });

                });

                suite('Status', function () {

                    test('Fail - Unauthorized - JWT token expired', function (done) {
                        var token = jwt.sign({
                            id: 'notimportantinthistest',
                            scope: 'all'
                        }, config.session.privateKey, {
                            expiresIn: '.1ms',
                            algorithm: config.session.algorithm
                        });
                        _topicVoteStatusUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401, function (err, res) {
                            if (err) return done(err);

                            var expectedResponse = {
                                status: {
                                    code: 40100,
                                    message: 'JWT token has expired'
                                }
                            };
                            assert.deepEqual(res.body, expectedResponse);

                            done();
                        });
                    });

                });

                suite('Downloads', function () {

                    suite('Final', function () {

                        test('Fail - Unauthorized - JWT token expired', function (done) {
                            var token = jwt.sign({path: '/not/important'}, config.session.privateKey, {
                                expiresIn: '.1ms',
                                algorithm: config.session.algorithm
                            });
                            _topicVoteDownloadBdocFinalUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40100,
                                        message: 'JWT token has expired'
                                    }
                                };
                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - Bad Request - Invalid JWT token - invalid path', function (done) {
                            var token = jwt.sign({path: '/this/is/wrong'}, config.session.privateKey, {
                                expiresIn: '1m',
                                algorithm: config.session.algorithm
                            });
                            _topicVoteDownloadBdocFinalUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40100,
                                        message: 'Invalid JWT token'
                                    }
                                };
                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                    });


                    suite('User', function () {

                        test('Fail - Unauthorized - JWT token expired', function (done) {
                            var token = jwt.sign({
                                id: 'notimportantinthistest',
                                scope: 'all'
                            }, config.session.privateKey, {
                                expiresIn: '.1ms',
                                algorithm: config.session.algorithm
                            });
                            _topicVoteDownloadBdocUserUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40100,
                                        message: 'JWT token has expired'
                                    }
                                };
                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                        test('Fail - Bad Request - Invalid JWT token - invalid path', function (done) {
                            var token = jwt.sign({path: '/this/is/wrong'}, config.session.privateKey, {
                                expiresIn: '1m',
                                algorithm: config.session.algorithm
                            });
                            _topicVoteDownloadBdocUserUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401, function (err, res) {
                                if (err) return done(err);

                                var expectedResponse = {
                                    status: {
                                        code: 40100,
                                        message: 'Invalid JWT token'
                                    }
                                };
                                assert.deepEqual(res.body, expectedResponse);

                                done();
                            });
                        });

                    });

                });

            });

        });

    });

    suite('Events', function () {

        suite('Create, list, delete', function () {
            var agent = request.agent(app);

            var user;
            var topic;

            setup(function (done) {
                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) return done(err);
                    user = res;

                    topicCreate(agent, user.id, null, null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp, function (err) {
                            if (err) return done(err);

                            done();
                        });
                    });
                });
            });

            test('Success', function (done) {
                var subject = 'Test Event title';
                var text = 'Test Event description';

                topicEventCreate(agent, user.id, topic.id, subject, text, function (err, res) {
                    if (err) return done(err);

                    assert.equal(res.body.status.code, 20100);

                    var event = res.body.data;
                    assert.equal(event.subject, subject);
                    assert.equal(event.text, text);
                    assert.property(event, 'createdAt');
                    assert.property(event, 'id');

                    topicEventList(agent, user.id, topic.id, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 20000
                            },
                            data: {
                                count: 1,
                                rows: [event]
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        topicEventDelete(agent, user.id, topic.id, event.id, function (err) {
                            if (err) return done(err);

                            topicEventList(agent, user.id, topic.id, function (err, res) {
                                if (err) return done(err);

                                var expectedBody = {
                                    status: {
                                        code: 20000
                                    },
                                    data: {
                                        count: 0,
                                        rows: []
                                    }
                                };

                                assert.deepEqual(res.body, expectedBody);

                                done();
                            });
                        });
                    });
                });
            });

            test('Success - with token', function (done) {
                var agent = request.agent(app);

                var subject = 'Test Event title, testing with token';
                var text = 'Test Event description, testing with token';

                var token = cosJwt.getTokenRestrictedUse(
                    {},
                    [
                        'POST /api/topics/:topicId/events'
                            .replace(':topicId', topic.id)
                    ],
                    {
                        expiresIn: '1d'
                    }
                );

                topicEventCreateUnauth(agent, topic.id, token, subject, text, function (err, res) {
                    if (err) return done(err);

                    var event = res.body.data;
                    assert.property(event, 'id');
                    assert.property(event, 'createdAt');
                    assert.equal(event.subject, subject);
                    assert.equal(event.text, text);

                    done();
                });
            });

            test('Fail - Unauthorized - Invalid token', function (done) {
                var agent = request.agent(app);
                var token = 'FOOBAR';

                _topicEventCreateUnauth(agent, topic.id, token, 'notimportant', 'notimportant', 401, function (err, res) {
                    if (err) return done(err);

                    var expectedBody = {
                        status: {
                            code: 40100,
                            message: 'Invalid JWT token'
                        }
                    };
                    assert.deepEqual(res.body, expectedBody);

                    done();
                });
            });

            test('Fail - Unauthorized - Invalid JWT token - invalid path', function (done) {
                var agent = request.agent(app);
                var token = jwt.sign({path: '/this/is/wrong'}, config.session.privateKey, {
                    expiresIn: '1m',
                    algorithm: config.session.algorithm
                });

                _topicEventCreateUnauth(agent, topic.id, token, 'notimportant', 'notimportant', 401, function (err, res) {
                    if (err) return done(err);

                    var expectedBody = {
                        status: {
                            code: 40100,
                            message: 'Invalid JWT token'
                        }
                    };
                    assert.deepEqual(res.body, expectedBody);

                    done();
                });
            });

            test('Fail - Unauthorized - JWT token expired', function (done) {
                var agent = request.agent(app);
                var token = jwt.sign({path: '/not/important'}, config.session.privateKey, {
                    expiresIn: '.1ms',
                    algorithm: config.session.algorithm
                });

                _topicEventCreateUnauth(agent, 'notimportant', token, 'notimportant', 'notimportant', 401, function (err, res) {
                    if (err) return done(err);

                    var expectedResponse = {
                        status: {
                            code: 40100,
                            message: 'JWT token has expired'
                        }
                    };
                    assert.deepEqual(res.body, expectedResponse);

                    done();
                });
            });
        });

    });

    // API - /api/topics/:topicId/mentions
    suite('Mentions', function () {

        suite('Read', function () {

            var agent = request.agent(app);

            var user;
            var topic;
            var mention1 = {
                id: null,
                text: null,
                creator: {
                    name: null,
                    profileUrl: null,
                    profilePictureUrl: null
                },
                createdAt: null,
                sourceId: 'TWITTER',
                sourceUrl: null
            };

            setup(function (done) {
                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) return done(err);
                    user = res;

                    topicCreate(agent, user.id, 'public', null, null, null, 'banana', function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        done();
                    });
                });
            });

            test('Success - non-authenticated User', function (done) {
                this.timeout(5000); //eslint-disable-line no-invalid-this

                topicMentionListUnauth(agent, topic.id, function (err, res) {
                    if (err) return done(err);
                    var list = res.body.data;
                    var mentions = list.rows;

                    assert.isTrue(list.count > 0);
                    assert.equal(list.count, mentions.length);
                    assert.deepEqual(Object.keys(mentions[0]), Object.keys(mention1));

                    done();
                });
            });

            test('Success - non-authenticated User read from cache', function (done) {
                this.timeout(5000); //eslint-disable-line no-invalid-this

                topicMentionListUnauth(agent, topic.id, function (err, res) {
                    if (err) return done(err);
                    var list = res.body.data;
                    var mentions = list.rows;

                    assert.isTrue(list.count > 0);
                    assert.equal(list.count, mentions.length);
                    assert.deepEqual(Object.keys(mentions[0]), Object.keys(mention1));

                    done();
                });
            });

            test('Success - Twitter error, return from cache', function (done) {
                topicMentionListTestUnauth(agent, topic.id, function (err, res) {
                    if (err) return done(err);
                    var list = res.body.data;
                    var mentions = list.rows;

                    assert.isTrue(list.count > 0);
                    assert.equal(list.count, mentions.length);
                    assert.deepEqual(Object.keys(mentions[0]), Object.keys(mention1));

                    done();
                });
            });

            suite('Success - read without hashtag', function () {

                var agent = request.agent(app);

                var user;
                var topic;

                setup(function (done) {
                    userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                        if (err) return done(err);
                        user = res;

                        topicCreate(agent, user.id, 'public', null, null, null, null, function (err, res) {
                            if (err) return done(err);

                            topic = res.body.data;
                            done();
                        });
                    });
                });

                test('Non-authenticated User', function (done) {
                    this.timeout(5000); //eslint-disable-line no-invalid-this

                    _topicMentionListUnauth(agent, topic.id, 400, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 40001,
                                message: 'Topic has no hashtag defined'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });

            });

            test('Fail - 50000 - Twitter error, no cache', function (done) {
                var agent = request.agent(app);

                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) return done(err);

                    topicCreate(agent, res.id, 'public', null, null, null, cosUtil.randomString(40), function (err, res) {
                        if (err) return done(err);

                        var topic = res.body.data;

                        _topicMentionListTestUnauth(request.agent(app), topic.id, 500, function (err, res) {
                            if (err) return done(err);
                            var expectedBody = {
                                status: {
                                    code: 50000,
                                    message: 'Internal Server Error'
                                }
                            };

                            assert.deepEqual(res.body, expectedBody);

                            done();
                        });
                    });
                });
            });

        });

    });

    suite('Pin', function () {

        suite('Create', function () {
            var agent = request.agent(app);

            var user;
            var topic;

            setup(function (done) {
                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) return done(err);
                    user = res;

                    topicCreate(agent, user.id, 'public', null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        done();
                    });
                });
            });

            test('Success', function (done) {
                topicFavouriteCreate(agent, user.id, topic.id, function (err, res) {
                    if (err) return done(err);

                    var expectedBody = {
                        status: {
                            code: 20000
                        }
                    };

                    assert.deepEqual(res.body, expectedBody);

                    done();
                });
            });
        });

        suite('Delete', function () {
            var agent = request.agent(app);

            var user;
            var topic;

            setup(function (done) {
                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) return done(err);
                    user = res;

                    topicCreate(agent, user.id, 'public', null, null, null, null, function (err, res) {
                        if (err) return done(err);

                        topic = res.body.data;

                        done();
                    });
                });
            });

            test('Success', function (done) {
                topicFavouriteCreate(agent, user.id, topic.id, function (err, res) {
                    if (err) return done(err);

                    var expectedBody = {
                        status: {
                            code: 20000
                        }
                    };

                    assert.deepEqual(res.body, expectedBody);

                    topicFavouriteDelete(agent, user.id, topic.id, function (err, res) {
                        if (err) return done(err);

                        var expectedBody = {
                            status: {
                                code: 20000
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        done();
                    });
                });
            });
        });
    });
});
