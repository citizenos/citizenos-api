'use strict';

const _topicCreate = async function (agent, userId, visibility, categories, endsAt, description, hashtag, expectedHttpCode) {
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

const topicCreate = async function (agent, userId, visibility, categories, endsAt, description, hashtag) {
    return _topicCreate(agent, userId, visibility, categories, endsAt, description, hashtag, 201);
};

const _topicRead = async function (agent, userId, topicId, include, expectedHttpCode) {
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

const topicRead = async function (agent, userId, topicId, include) {
    return _topicRead(agent, userId, topicId, include, 200);
};

const _topicReadUnauth = async function (agent, topicId, include, expectedHttpCode) {
    const path = '/api/topics/:topicId'
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .query({include: include})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicReadUnauth = async function (agent, topicId, include) {
    return _topicReadUnauth(agent, topicId, include, 200);
};

const _topicUpdate = async function (agent, userId, topicId, status, visibility, categories, endsAt, contact, expectedHttpCode) {
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

const topicUpdate = async function (agent, userId, topicId, status, visibility, categories, endsAt, contact) {
    return _topicUpdate(agent, userId, topicId, status, visibility, categories, endsAt, contact, 200);
};

const _topicUpdateField = async function (agent, userId, topicId, topic, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    topic.id = topicId;

    return agent
        .patch(path)
        .set('Content-Type', 'application/json')
        .send(topic)
        .expect(expectedHttpCode);
};

const topicUpdateField = async function (agent, userId, topicId, topic) {
    return _topicUpdateField(agent, userId, topicId, topic, 204);
};

const _topicUpdateTokenJoin = async function (agent, userId, topicId, level, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/join'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            level: level
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicUpdateTokenJoin = async function (agent, userId, topicId, level) {
    return _topicUpdateTokenJoin(agent, userId, topicId, level, 200);
};

const _topicUpdateTokenJoinLevel = async function (agent, userId, topicId, token, level, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/join/:token'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':token', token);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            level: level
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicUpdateTokenJoinLevel = async function (agent, userId, topicId, token, level) {
    return _topicUpdateTokenJoinLevel(agent, userId, topicId, token, level, 200);
};

// TODO: Should be part of PUT /topics/:topicId
const _topicUpdateStatus = async function (agent, userId, topicId, status, expectedHttpCode) {
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
const topicUpdateStatus = async function (agent, userId, topicId, status) {
    return _topicUpdateStatus(agent, userId, topicId, status, 200);
};

const _topicDelete = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicDelete = async function (agent, userId, topicId) {
    return _topicDelete(agent, userId, topicId, 200);
};

const _topicList = async function (agent, userId, include, visibility, statuses, creatorId, hasVoted, showModerated, pinned, expectedHttpCode) {
    const path = '/api/users/:userId/topics'.replace(':userId', userId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .query({
            include: include,
            visibility: visibility,
            statuses: statuses,
            creatorId: creatorId,
            hasVoted: hasVoted,
            showModerated: showModerated,
            pinned: pinned
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicList = async function (agent, userId, include, visibility, statuses, creatorId, hasVoted, showModerated, pinned) {
    return _topicList(agent, userId, include, visibility, statuses, creatorId, hasVoted, showModerated, pinned, 200);
};

const _topicsListUnauth = async function (agent, statuses, categories, orderBy, offset, limit, sourcePartnerId, include, expectedHttpCode) {
    return agent
        .get('/api/topics')
        .query({
            statuses: statuses,
            categories: categories,
            orderBy: orderBy,
            offset: offset,
            limit: limit,
            sourcePartnerId: sourcePartnerId,
            include: include
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicsListUnauth = async function (agent, status, categories, orderBy, offset, limit, sourcePartnerId, include) {
    return _topicsListUnauth(agent, status, categories, orderBy, offset, limit, sourcePartnerId, include, 200);
};

const _topicMemberUsersUpdate = async function (agent, userId, topicId, memberId, level, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    return agent
        .put(path)
        .send({level: level})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMemberUsersUpdate = async function (agent, userId, topicId, memberId, level) {
    return _topicMemberUsersUpdate(agent, userId, topicId, memberId, level, 200);
};

const _topicMemberUsersDelete = async function (agent, userId, topicId, memberId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMemberUsersDelete = async function (agent, userId, topicId, memberId) {
    return _topicMemberUsersDelete(agent, userId, topicId, memberId, 200);
};

const _topicMemberGroupsCreate = async function (agent, userId, topicId, members, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/groups'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .send(members)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMemberGroupsCreate = async function (agent, userId, topicId, members) {
    return _topicMemberGroupsCreate(agent, userId, topicId, members, 201);
};

const _topicMemberGroupsUpdate = async function (agent, userId, topicId, memberId, level, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/groups/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    return agent
        .put(path)
        .send({level: level})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMemberGroupsUpdate = async function (agent, userId, topicId, memberId, level) {
    return _topicMemberGroupsUpdate(agent, userId, topicId, memberId, level, 200);
};

const _topicMemberGroupsDelete = async function (agent, userId, topicId, memberId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/groups/:memberId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':memberId', memberId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMemberGroupsDelete = async function (agent, userId, topicId, memberId) {
    return _topicMemberGroupsDelete(agent, userId, topicId, memberId, 200);
};

const _topicMembersList = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMembersList = async function (agent, userId, topicId) {
    return _topicMembersList(agent, userId, topicId, 200);
};

const _topicMembersUsersList = async function (agent, userId, topicId, limit, offset, search, order, sortOrder, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);
    const queryParams = {};
    if (limit) {
        queryParams.limit = limit;
    }
    if (offset) {
        queryParams.offset = offset;
    }
    if (search) {
        queryParams.search = search;
    }
    if (order) {
        queryParams.order = order;
    }
    if (sortOrder) {
        queryParams.sortOrder = sortOrder;
    }

    return agent
        .get(path)
        .query(queryParams)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMembersUsersList = async function (agent, userId, topicId, limit, offset, search, order, sortOrder) {
    return _topicMembersUsersList(agent, userId, topicId, limit, offset, search, order, sortOrder, 200);
};

const _topicMembersGroupsList = async function (agent, userId, topicId, limit, offset, search, order, sortOrder, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/members/groups'
        .replace(':userId', userId)
        .replace(':topicId', topicId);
    const queryParams = {};
    if (limit) {
        queryParams.limit = limit;
    }
    if (offset) {
        queryParams.offset = offset;
    }
    if (search) {
        queryParams.search = search;
    }
    if (order) {
        queryParams.order = order;
    }
    if (sortOrder) {
        queryParams.sortOrder = sortOrder;
    }
    return agent
        .get(path)
        .query(queryParams)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMembersGroupsList = async function (agent, userId, topicId, limit, offset, search, order, sortOrder) {
    return _topicMembersGroupsList(agent, userId, topicId, limit, offset, search, order, sortOrder, 200);
};

const _topicInviteUsersCreate = async function (agent, userId, topicId, invites, ip, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/invites/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    const request = agent
        .post(path)
        .send(invites)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);

    if (ip) {
        request.set('X-Forwarded-For', ip)
    }

    return request;
};

const topicInviteUsersCreate = async function (agent, userId, topicId, invites, ip) {
    return _topicInviteUsersCreate(agent, userId, topicId, invites, ip, 201);
};

const _topicInviteUsersDelete = async function (agent, userId, topicId, inviteId, expectedHttpCode) {
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

const topicInviteUsersDelete = async function (agent, userId, topicId, inviteId) {
    return _topicInviteUsersDelete(agent, userId, topicId, inviteId, 200);
};

const _topicInviteUsersRead = async function (agent, topicId, inviteId, expectedHttpCode) {
    const path = '/api/topics/:topicId/invites/users/:inviteId'
        .replace(':topicId', topicId)
        .replace(':inviteId', inviteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersRead = async function (agent, topicId, inviteId) {
    return _topicInviteUsersRead(agent, topicId, inviteId, 200);
};

const _topicInviteUsersUpdate = async function (agent, userId, topicId, inviteId, level, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/invites/users/:inviteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':inviteId', inviteId);

    return agent
        .put(path)
        .send({level: level})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersUpdate = async function (agent, userId, topicId, inviteId, level) {
    return _topicInviteUsersUpdate(agent, userId, topicId, inviteId, level, 200);
};

const _topicInviteUsersList = function (agent, userId, topicId, order, sortOrder, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/invites/users'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .query({
            order,
            sortOrder
        })
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicInviteUsersList = async function (agent, userId, topicId, order, sortOrder) {
    return _topicInviteUsersList(agent, userId, topicId, order, sortOrder, 200);
};

const _topicInviteUsersAccept = async function (agent, userId, topicId, inviteId, expectedHttpCode) {
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

const topicInviteUsersAccept = async function (agent, userId, topicId, inviteId) {
    return _topicInviteUsersAccept(agent, userId, topicId, inviteId, 201);
};

const _topicJoinReadUnauth = async function (agent, token, expectedHttpCode) {
    const path = '/api/topics/join/:token'
        .replace(':token', token);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicJoinReadUnauth = async function (agent, token) {
    return _topicJoinReadUnauth(agent, token, 200);
};

const _topicJoinJoin = async function (agent, token, expectedHttpCode) {
    const path = '/api/topics/join/:token'
        .replace(':token', token);

    return agent
        .post(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicJoinJoin = async function (agent, token) {
    return _topicJoinJoin(agent, token, 200);
};

const _topicReportCreate = async function (agent, topicId, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/reports'
        .replace(':topicId', topicId);

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

const topicReportCreate = async function (agent, topicId, type, text) {
    return _topicReportCreate(agent, topicId, type, text, 200);
};

const _topicReportRead = async function (agent, topicId, reportId, expectedHttpCode) {
    const path = '/api/topics/:topicId/reports/:reportId'
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicReportRead = async function (agent, topicId, reportId) {
    return _topicReportRead(agent, topicId, reportId, 200);
};

const _topicReportModerate = async function (agent, topicId, reportId, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/reports/:reportId/moderate'
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

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

const topicReportModerate = async function (agent, topicId, reportId, type, text) {
    return _topicReportModerate(agent, topicId, reportId, type, text, 200);
};

const _topicReportsReview = async function (agent, userId, topicId, reportId, text, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/reports/:reportId/review'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

    const body = {};
    if (text) {
        body.text = text;
    }

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(body)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicReportsReview = async function (agent, userId, topicId, reportId, text) {
    return _topicReportsReview(agent, userId, topicId, reportId, text, 200);
};

const _topicReportsResolve = async function (agent, topicId, reportId, expectedHttpCode) {
    const path = '/api/topics/:topicId/reports/:reportId/resolve'
        .replace(':topicId', topicId)
        .replace(':reportId', reportId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicReportsResolve = async function (agent, topicId, reportId) {
    return _topicReportsResolve(agent, topicId, reportId, 200);
};

const _topicCommentCreate = async function (agent, userId, topicId, parentId, parentVersion, type, subject, text, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

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

const topicCommentCreate = async function (agent, userId, topicId, parentId, parentVersion, type, subject, text) {
    return _topicCommentCreate(agent, userId, topicId, parentId, parentVersion, type, subject, text, 201);
};

const _topicCommentEdit = async function (agent, userId, topicId, commentId, subject, text, type, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
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

const topicCommentEdit = async function (agent, userId, topicId, commentId, subject, text, type) {
    return _topicCommentEdit(agent, userId, topicId, commentId, subject, text, type, 200);
};

const _topicCommentList = async function (agent, userId, topicId, orderBy, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .query({orderBy: orderBy})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentList = async function (agent, userId, topicId, orderBy) {
    return _topicCommentList(agent, userId, topicId, orderBy, 200);
};

const _topicCommentListUnauth = async function (agent, topicId, orderBy, expectedHttpCode) {
    const path = '/api/topics/:topicId/comments'
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .query({orderBy: orderBy})
        .expect('Content-Type', /json/);
};

const topicCommentListUnauth = async function (agent, topicId, orderBy) {
    return _topicCommentListUnauth(agent, topicId, orderBy, 200);
};

const _topicCommentDelete = async function (agent, userId, topicId, commentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':commentId', commentId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentDelete = async function (agent, userId, topicId, commentId) {
    return _topicCommentDelete(agent, userId, topicId, commentId, 200);
};

const _topicCommentReportCreate = async function (agent, topicId, commentId, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/comments/:commentId/reports'
        .replace(':topicId', topicId)
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

const topicCommentReportCreate = async function (agent, topicId, commentId, type, text) {
    return _topicCommentReportCreate(agent, topicId, commentId, type, text, 200);
};

const _topicCommentReportRead = async function (agent, topicId, commentId, reportId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/comments/:commentId/reports/:reportId'
        .replace(':topicId', topicId)
        .replace(':commentId', commentId)
        .replace(':reportId', reportId);

    return agent
        .get(path)
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentReportRead = async function (agent, topicId, commentId, reportId, token) {
    return _topicCommentReportRead(agent, topicId, commentId, reportId, token, 200);
};

const _topicCommentReportModerate = async function (agent, topicId, commentId, reportId, token, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/comments/:commentId/reports/:reportId/moderate'
        .replace(':topicId', topicId)
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

const topicCommentReportModerate = async function (agent, topicId, commentId, reportId, token, type, text) {
    return _topicCommentReportModerate(agent, topicId, commentId, reportId, token, type, text, 200);
};

const _topicAttachmentAdd = async function (agent, userId, topicId, name, link, source, type, size, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/attachments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
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
        .expect('Content-Type', /json/);
};

const topicAttachmentAdd = async function (agent, userId, topicId, name, link, source, type, size) {
    return _topicAttachmentAdd(agent, userId, topicId, name, link, source, type, size, 200);
};

const _topicAttachmentUpdate = async function (agent, userId, topicId, attachmentId, name, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({name: name})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicAttachmentUpdate = async function (agent, userId, topicId, attachmentId, name) {
    return _topicAttachmentUpdate(agent, userId, topicId, attachmentId, name, 200);
};

const _topicAttachmentRead = async function (agent, userId, topicId, attachmentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);

};

const topicAttachmentRead = async function (agent, userId, topicId, attachmentId) {
    return _topicAttachmentRead(agent, userId, topicId, attachmentId, 200);
};

const _topicAttachmentReadUnauth = async function (agent, topicId, attachmentId, expectedHttpCode) {
    const path = '/api/topics/:topicId/attachments/:attachmentId'
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicAttachmentReadUnauth = async function (agent, topicId, attachmentId) {
    return _topicAttachmentReadUnauth(agent, topicId, attachmentId, 200);
};

const _topicAttachmentDownload = async function (agent, userId, topicId, attachmentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    return agent
        .get(path)
        .query({download: true})
        .expect(expectedHttpCode);

};
//TODO: Missing test to use it?
const topicAttachmentDownload = async function (agent, userId, topicId, attachmentId) { //eslint-disable-line no-unused-vars
    return _topicAttachmentDownload(agent, userId, topicId, attachmentId, 200);
};

const _topicAttachmentDelete = async function (agent, userId, topicId, attachmentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':attachmentId', attachmentId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicAttachmentDelete = async function (agent, userId, topicId, attachmentId) {
    return _topicAttachmentDelete(agent, userId, topicId, attachmentId, 200);
};

const _topicAttachmentList = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/attachments'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicAttachmentList = async function (agent, userId, topicId) {
    return _topicAttachmentList(agent, userId, topicId, 200);
};

const _topicAttachmentListUnauth = async function (agent, topicId, expectedHttpCode) {
    const path = '/api/topics/:topicId/attachments'
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicAttachmentListUnauth = async function (agent, topicId) {
    return _topicAttachmentListUnauth(agent, topicId, 200);
};

const _topicMentionList = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/mentions'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMentionList = async function (agent, userId, topicId) {
    return _topicMentionList(agent, userId, topicId, 200);
};

const _topicMentionListUnauth = async function (agent, topicId, expectedHttpCode) {
    const path = '/api/topics/:topicId/mentions'
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMentionListUnauth = async function (agent, topicId) {
    return _topicMentionListUnauth(agent, topicId, 200);
};

const _topicMentionListTestUnauth = async function (agent, topicId, expectedHttpCode) {
    const path = '/api/topics/:topicId/mentions'
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .query({test: 'error'})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicMentionListTestUnauth = async function (agent, topicId) {
    return _topicMentionListTestUnauth(agent, topicId, 200);
};

const _topicVoteCreate = async function (agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, autoClose, expectedHttpCode) {
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
            authType: authType,
            autoClose: autoClose
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteCreate = async function (agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, autoClose) {
    return _topicVoteCreate(agent, userId, topicId, options, minChoices, maxChoices, delegationIsAllowed, endsAt, description, type, authType, autoClose, 201);
};

const _topicVoteRead = async function (agent, userId, topicId, voteId, expectedHttpCode) {
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

const topicVoteRead = async function (agent, userId, topicId, voteId) {
    return _topicVoteRead(agent, userId, topicId, voteId, 200);
};


const _topicVoteUpdate = async function (agent, userId, topicId, voteId, endsAt, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .put(path)
        .send({
            endsAt: endsAt
        })
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteUpdate = async function (agent, userId, topicId, voteId, endsAt) {
    return _topicVoteUpdate(agent, userId, topicId, voteId, endsAt, 200);
};

const _topicVoteReadUnauth = async function (agent, topicId, voteId, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteReadUnauth = async function (agent, topicId, voteId) {
    return _topicVoteReadUnauth(agent, topicId, voteId, 200);
};

const _topicVoteVoteUnauth = async function (agent, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId'
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

const topicVoteVoteUnauth = async function (agent, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode) {
    return _topicVoteVoteUnauth(agent, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, 200);
};

const _topicVoteVote = async function (agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, expectedHttpCode) {
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

const topicVoteVote = async function (agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode) {
    return _topicVoteVote(agent, userId, topicId, voteId, voteList, certificate, pid, phoneNumber, countryCode, 200);
};

const _topicVoteStatus = async function (agent, userId, topicId, voteId, token, expectedHttpCode) {
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

const topicVoteStatus = async function (agent, userId, topicId, voteId, token) {
    return _topicVoteStatus(agent, userId, topicId, voteId, token, 200);
};

const _topicVoteStatusUnauth = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId/status'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .query({token: token})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

//TODO: Missing test to use it?
const topicVoteStatusUnauth = async function (agent, topicId, voteId, userId, token) { //eslint-disable-line no-unused-vars
    return _topicVoteStatusUnauth(agent, topicId, voteId, token, 200);
};

const _topicVoteSign = async function (agent, userId, topicId, voteId, voteList, certificate, pid, token, signatureValue, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/sign'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    const data = {
        options: voteList,
        certificate, // Used only for Vote.AUTH_TYPES.hard
        pid,
        token,
        signatureValue //TODO get propersignature
    };

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicVoteSign = async function (agent, userId, topicId, voteId, voteList, certificate, pid, token, signatureValue) {
    return _topicVoteSign(agent, userId, topicId, voteId, voteList, certificate, pid, token, signatureValue, 200);
};

const _topicVoteSignUnauth = async function (agent, topicId, voteId, voteList, certificate, pid, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId/sign'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    const data = {
        options: voteList,
        certificate: certificate, // Used only for Vote.AUTH_TYPES.hard
        pid: pid,
        token: token,
        signatureValue: 'asdasdas' //TODO get propersignature
    };

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

//TODO: Missing test to use it?
const topicVoteSignUnauth = async function (agent, topicId, voteId, voteList, certificate, pid, token) { //eslint-disable-line no-unused-vars
    return _topicVoteSignUnauth(agent, topicId, voteId, voteList, certificate, pid, token, 200);
};

const _topicVoteDownloadBdocFinalUnauth = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/final'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .query({token: token})
        .send()
        .expect(expectedHttpCode);
};

//TODO: Missing test to use it?
const topicVoteDownloadBdocFinalUnauth = async function (agent, topicId, voteId, token) { //eslint-disable-line no-unused-vars
    return _topicVoteDownloadBdocFinalUnauth(agent, topicId, voteId, token, 200);
};

const _topicVoteDownloadBdocUserUnauth = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/user'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .query({token: token})
        .send()
        .expect(expectedHttpCode);
};

const topicVoteDownloadBdocUserUnauth = async function (agent, topicId, voteId, token) { //eslint-disable-line no-unused-vars
    return _topicVoteDownloadBdocUserUnauth(agent, topicId, voteId, token, 200);
};


const _topicVoteDownloadBdocUser = async function (agent, topicId, voteId, token, expectedHttpCode) {
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

const topicVoteDownloadBdocUser = async function (agent, topicId, voteId, token) {
    return _topicVoteDownloadBdocUser(agent, topicId, voteId, token, 200);
};

const _topicVoteDownloadBdocFinal = async function (agent, topicId, voteId, token, include, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/final'
        .replace(':userId', 'self')
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    const query = {
        token
    };

    if (include) {
        query.include = include;
    }

    return agent
        .get(path)
        .query(query)
        .send()
        .expect(expectedHttpCode)
        .expect('Content-Type', 'application/vnd.etsi.asic-e+zip')
        .expect('Content-Disposition', 'attachment; filename=final.bdoc');
};

const topicVoteDownloadBdocFinal = async function (agent, topicId, voteId, token, include) {
    return _topicVoteDownloadBdocFinal(agent, topicId, voteId, token, include, 200);
};

const _topicVoteDelegationCreate = async function (agent, userId, topicId, voteId, toUserId, expectedHttpCode) {
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

const topicVoteDelegationCreate = async function (agent, userId, topicId, voteId, toUserId) {
    return _topicVoteDelegationCreate(agent, userId, topicId, voteId, toUserId, 200);
};

const _topicVoteDelegationDelete = async function (agent, userId, topicId, voteId, expectedHttpCode) {
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

const topicVoteDelegationDelete = async function (agent, userId, topicId, voteId) {
    return _topicVoteDelegationDelete(agent, userId, topicId, voteId, 200);
};

const _topicCommentVotesCreate = async function (agent, topicId, commentId, value, expectedHttpCode) {
    const path = '/api/topics/:topicId/comments/:commentId/votes'
        .replace(':topicId', topicId)
        .replace(':commentId', commentId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({value: value})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicCommentVotesCreate = async function (agent, topicId, commentId, value) {
    return _topicCommentVotesCreate(agent, topicId, commentId, value, 200);
};

const _topicCommentVotesList = async function (agent, userId, topicId, commentId, expectedHttpCode) {
    let path = '/api/users/:userId/topics/:topicId/comments/:commentId/votes'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':commentId', commentId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};


const topicCommentVotesList = async function (agent, userId, topicId, commentId) {
    return _topicCommentVotesList(agent, userId, topicId, commentId, 200);
};

const _topicEventCreate = async function (agent, userId, topicId, subject, text, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/events'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            subject: subject,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicEventCreate = async function (agent, userId, topicId, subject, text) {
    return _topicEventCreate(agent, userId, topicId, subject, text, 201);
};

const _topicEventCreateUnauth = async function (agent, topicId, token, subject, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/events'
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send({
            subject: subject,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicEventCreateUnauth = async function (agent, topicId, token, subject, text) {
    return _topicEventCreateUnauth(agent, topicId, token, subject, text, 201);
};

const _topicEventList = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/events'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicEventList = async function (agent, userId, topicId) {
    return _topicEventList(agent, userId, topicId, 200);
};

const _topicEventDelete = async function (agent, userId, topicId, eventId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/events/:eventId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':eventId', eventId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicEventDelete = async function (agent, userId, topicId, eventId) {
    return _topicEventDelete(agent, userId, topicId, eventId, 200);
};

const _topicFavouriteCreate = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/pin'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicFavouriteCreate = async function (agent, userId, topicId) {
    return _topicFavouriteCreate(agent, userId, topicId, 200);
};

const _topicFavouriteDelete = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/pin'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicFavouriteDelete = async function (agent, userId, topicId) {
    return _topicFavouriteDelete(agent, userId, topicId, 200);
};

const _parsePadUrl = function (padUrl) {
    const matches = padUrl.match(/(https?:\/\/[^/]*)(.*)/);

    if (!matches || matches.length < 3) {
        throw Error('Could not pare Pad url', padUrl, matches);
    }

    return {
        host: matches[1],
        path: matches[2]
    };
};

const _padRead = async function (padUrl, expectedHttpCode) {
    const parsedUrl = _parsePadUrl(padUrl);
    const padAgent = request.agent(parsedUrl.host);

    return padAgent
        .get(parsedUrl.path)
        .expect(expectedHttpCode);
};

const padRead = async function (padUrl) {
    return _padRead(padUrl, 200);
};

const _duplicateTopic = async function (agent, userId, topicId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/duplicate'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const duplicateTopic = async function (agent, userId, topicId) {
    return _duplicateTopic(agent, userId, topicId, 201);
};

const _uploadAttachmentFile = async function (agent, userId, topicId, attachment, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/attachments/upload'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    const request = agent
        .post(path);

    Object.keys(attachment).forEach(function (key) {
        request.field(key, attachment[key])
    });

    return request
        .attach('file', attachment.file)
        .set('Content-Type', 'multipart/form-data')
        .expect(expectedHttpCode);
};

const uploadAttachmentFile = async function (agent, userId, topicId, attachment) {
    return _uploadAttachmentFile(agent, userId, topicId, attachment, 201);
};

module.exports.topicCreate = topicCreate;
module.exports.topicFavouriteCreate = topicFavouriteCreate;
module.exports.topicDelete = topicDelete;
module.exports.topicMemberGroupsCreate = topicMemberGroupsCreate;
module.exports.topicCommentCreate = topicCommentCreate;
module.exports.topicReportCreate = topicReportCreate;
module.exports.topicVoteCreate = topicVoteCreate;
module.exports.topicVoteVote = topicVoteVote;

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
const memberLib = require('./lib/members')(app);
const groupLib = require('./group');
const authLib = require('./auth');
const activityLib = require('./activity');

const UserConnection = models.UserConnection;

const Partner = models.Partner;

const Moderator = models.Moderator;

const GroupMemberUser = models.GroupMemberUser;

const Topic = models.Topic;
const TopicMemberUser = models.TopicMemberUser;
const TopicMemberGroup = models.TopicMemberGroup;
const TopicInviteUser = models.TopicInviteUser;
const TopicJoin = models.TopicJoin;

const User = models.User;

const Comment = models.Comment;

const Report = models.Report;

const Vote = models.Vote;
const VoteOption = models.VoteOption;

// API - /api/users*
suite('Users', function () {

    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    // API - /api/users/:userId/topics*
    suite('Topics', function () {

        suite('Create', function () {
            const agent = request.agent(app);
            const email = 'test_topicc_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            let user;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
            });

            test('Success', async function () {
                const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                assert.property(topic, 'id');
                assert.equal(topic.creator.id, user.id);
                assert.equal(topic.visibility, Topic.VISIBILITY.private);
                assert.equal(topic.status, Topic.STATUSES.inProgress);
                assert.property(topic, 'padUrl');
            });

            test('Success - non-default visibility', async function () {
                const topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null)).body.data;
                assert.equal(topic.visibility, Topic.VISIBILITY.public);
            });

            test('Success - description', async function () {
                const description = '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><script>alert("owned!");</script><br><br>script<br><br></body></html>';

                const topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, description, null)).body.data;
                const getHtmlResult = await etherpadClient.getHTMLAsync({padID: topic.id});
                assert.equal(getHtmlResult.html, '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><br><br>script<br><br><br></body></html>');
                const topicR = (await topicRead(agent, user.id, topic.id, null)).body.data;
                assert.equal(topicR.title, 'H1');
                assert.equal(topicR.description, '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><br><br>script<br><br><br></body></html>');
            });

            test('Success - create with categories', async function () {
                const categories = [Topic.CATEGORIES.work, Topic.CATEGORIES.varia, Topic.CATEGORIES.transport];
                const topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, categories, null, null, null)).body.data;
                assert.deepEqual(topic.categories, categories);
            });

            test('Success - valid hashtag', async function () {
                const hashtag = 'abcdefghijklmnopqrstuvxyzabcdefghijklmnopqrstuvxyzabcdefghi';
                const topic = (await topicCreate(agent, user.id, null, null, null, null, hashtag)).body.data;
                assert.equal(topic.hashtag, hashtag);
            });

            test('Success - empty hashtag', async function () {
                const topic = (await topicCreate(agent, user.id, null, null, null, null, '')).body.data;
                assert.equal(topic.hashtag, null);
            });

            test('Success - Replace invalid characters in hashtag', async function () {
                const hashtag = '      #abc   defgh ijk.lmn,opqrstuvxyzabcdefghij:klmnopqrstuvxyzabcdefghi        ';
                const topic = (await topicCreate(agent, user.id, null, null, null, null, hashtag)).body.data;
                assert.equal(topic.hashtag, 'abcdefghijklmnopqrstuvxyzabcdefghijklmnopqrstuvxyzabcdefghi');
            });

            test('Fail - 40100', async function () {
                await _topicCreate(request.agent(app), user.id, Topic.VISIBILITY.public, null, null, null, null, 401);
            });

            test('Fail - 40000 - invalid hashtag', async function () {
                const res = await _topicCreate(agent, user.id, null, null, null, null, 'üüüüüüüüüüüüüüüüüüüüüüüüüüüüüüü', 400)
                const expectedBody = {
                    status: {
                        code: 40000
                    },
                    errors: {
                        hashtag: 'Maximum of 59 bytes allowed. Currently 62 bytes'
                    }
                };

                assert.deepEqual(res.body, expectedBody);
            });
        });

        suite('Read', function () {

            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            const topicCategories = [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.communities];

            let user;
            let topic;
            let partner;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);

                topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.private, topicCategories, null, null, null)).body.data;
                //FIXME: This is a hack. Actually we should have topicCreate that enables setting the Partner headers and sourcePartnerObjectId but not sure what the interface should look like
                partner = await Partner.create({
                    website: 'notimportant',
                    redirectUriRegexp: 'notimportant'
                })
                const resTopic = await Topic.update(
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
                const updatedTopic = resTopic[1][0].toJSON();

                topic.sourcePartnerId = updatedTopic.sourcePartnerId;
                topic.sourcePartnerObjectId = updatedTopic.sourcePartnerObjectId;
                topic.updatedAt = updatedTopic.updatedAt.toJSON();
            });


            test('Success', async function () {
                const topicR = (await topicRead(agent, user.id, topic.id, null)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedTopic = _.cloneDeep(topic);
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
                assert.isNull(topicR.voteId);
                delete topicR.voteId;

                // Check the padUrl, see if token is there. Delete later, as tokens are not comparable due to different expiry timestamps
                // TODO: May want to decrypt the tokens and compare data
                assert.match(topicR.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                assert.match(expectedTopic.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                delete topicR.padUrl;
                delete expectedTopic.padUrl;
                assert.deepEqual(topicR, expectedTopic);
            });

            test('Fail - Unauthorized', async function () {
                await _topicRead(request.agent(app), user.id, topic.id, null, 401);
            });

            suite('With Vote', function () {

                test('Success - no vote created', async function () {
                    const topicR = (await topicRead(agent, user.id, topic.id, 'vote')).body.data;

                    // The difference from create result "members" and "creator" are extended. Might consider changing in the future..
                    const expectedTopic = _.cloneDeep(topic);
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
                    assert.isNull(topicR.voteId);
                    delete topicR.voteId;

                    // Check the padUrl, see if token is there. Delete later, as tokens are not comparable due to different expiry timestamps
                    // TODO: May want to decrypt the tokens and compare data
                    assert.match(topicR.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                    assert.match(expectedTopic.padUrl, /http(s)?:\/\/.*\/p\/[a-zA-Z0-9-]{36}\?jwt=.*&lang=[a-z]{2}/);
                    delete topicR.padUrl;
                    delete expectedTopic.padUrl;

                    assert.deepEqual(topicR, expectedTopic);
                });

                test('Success - vote created', async function () {

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
                    const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft)).body.data;
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp);
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                    const topicR = (await topicRead(agent, user.id, topic.id, 'vote')).body.data;
                    assert.equal(topicR.status, Topic.STATUSES.voting);

                    // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                    const expectedTopic = _.cloneDeep(topicR);

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
                    const voteExpected = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                    assert.deepEqual(topicR.vote, voteExpected);
                    assert.deepEqual(topicR, expectedTopic);
                    assert.equal(topicR.voteId, topicR.vote.id);
                });

                suite('After voting', function () {
                    this.timeout(38000); //eslint-disable-line no-invalid-this

                    let vote;
                    let creator;
                    let voteTopic;
                    const voteAgent = request.agent(app);

                    const voteEmail = 'test_topicr_vote_' + new Date().getTime() + '@test.ee';
                    const votePassword = 'testPassword123';
                    const voteTopicCategories = [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.communities];

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

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLogin(voteAgent, voteEmail, votePassword, null);
                        voteTopic = (await topicCreate(voteAgent, creator.id, Topic.VISIBILITY.private, voteTopicCategories, null, null, null)).body.data;
                        vote = (await topicVoteCreate(voteAgent, creator.id, voteTopic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                        vote = (await topicVoteRead(voteAgent, creator.id, voteTopic.id, vote.id)).body.data;
                    });

                    teardown(async function () {
                        await UserConnection.destroy({
                            where: {
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: ['PNOEE-60001019906']
                            },
                            force: true
                        });
                    });

                    test('Success', async function () {
                        const phoneNumber = '+37200000766';
                        const pid = '60001019906';

                        const voteList = [
                            {
                                optionId: vote.options.rows[0].id
                            }
                        ];

                        const response = (await topicVoteVote(voteAgent, creator.id, voteTopic.id, vote.id, voteList, null, pid, phoneNumber, null)).body;
                        assert.equal(response.status.code, 20001);
                        assert.match(response.data.challengeID, /[0-9]{4}/);

                        const bdocpathExpected = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user'
                            .replace(':topicId', voteTopic.id)
                            .replace(':voteId', vote.id);
                        const statusresponse = (await topicVoteStatus(voteAgent, creator.id, voteTopic.id, vote.id, response.data.token)).body;
                        assert.equal(statusresponse.status.code, 20002);
                        assert.property(statusresponse.data, 'bdocUri');
                        const bdocUri = statusresponse.data.bdocUri;

                        const token = bdocUri.slice(bdocUri.indexOf('token=') + 6);
                        const tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
                        assert.equal(tokenData.userId, creator.id);
                        assert.equal(tokenData.aud[0], 'GET ' + bdocpathExpected);

                        const voteExpected = (await topicVoteRead(voteAgent, creator.id, voteTopic.id, vote.id)).body.data;
                        const topicR = (await topicRead(voteAgent, creator.id, voteTopic.id, 'vote')).body.data;
                        assert.equal(topicR.status, Topic.STATUSES.voting);

                        // Check the padUrl, see if token is there. Delete later, as tokens are not comparable due to different expiry timestamps
                        // TODO: May want to decrypt the tokens and compare data
                        assert.match(topicR.vote.downloads.bdocVote, /http(s)?:\/\/.*\/api\/users\/self\/topics\/[a-zA-Z0-9-]{36}\/votes\/[a-zA-Z0-9-]{36}\/downloads\/bdocs\/user\?token=.*/);
                        assert.match(voteExpected.downloads.bdocVote, /http(s)?:\/\/.*\/api\/users\/self\/topics\/[a-zA-Z0-9-]{36}\/votes\/[a-zA-Z0-9-]{36}\/downloads\/bdocs\/user\?token=.*/);
                        delete topicR.vote.downloads.bdocVote;
                        delete voteExpected.downloads.bdocVote;

                        assert.deepEqual(topicR.vote, voteExpected);
                    });
                });
            });

            suite('Authorization', function () {

                suite('Topic visibility = private', function () {
                    const agentCreator = request.agent(app);
                    const agentUser = request.agent(app);
                    const agentUser2 = request.agent(app);

                    let creator, user, user2, topic, group;

                    setup(async function () {
                        [creator, user, user2] = await Promise.all([
                            userLib.createUserAndLogin(agentCreator, null, null, null),
                            userLib.createUserAndLogin(agentUser, null, null, null),
                            userLib.createUserAndLogin(agentUser2, null, null, null)
                        ]);

                        group = (await groupLib.create(agentCreator, creator.id, 'Group', null, null)).body.data;
                        topic = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;

                        // Add Group to Topic members and User to that Group
                        const memberGroup = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.read
                        };

                        const memberUser = {
                            userId: user.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        await topicMemberGroupsCreate(agentCreator, creator.id, topic.id, memberGroup);
                        await memberLib.groupMemberUsersCreate(group.id, [memberUser]);
                    });

                    test('Success - User is a member of a Group that has READ access', async function () {
                        const topicData = (await topicRead(agentUser, user.id, topic.id, null)).body.data;

                        assert.isUndefined(topicData.creator.email);

                        const padUrl = topicData.padUrl;
                        const parsedUrl = _parsePadUrl(padUrl);
                        const padAgent = request.agent(parsedUrl.host);

                        padAgent
                            .get(parsedUrl.path)
                            .expect(200)
                            .expect('x-ep-auth-citizenos-authorize', 'readonly');
                    });

                    test('Success - User has direct EDIT access, Group membership revoked', async function () {
                        await groupLib.memberUsersDelete(agentCreator, creator.id, group.id, user.id);
                        const topicMemberUser = {
                            userId: user.id,
                            level: TopicMemberUser.LEVELS.edit
                        };
                        await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);
                        const topicData = (await topicRead(agentUser, user.id, topic.id, null)).body.data;
                        assert.equal(topicData.permission.level, topicMemberUser.level);

                        padRead(topicData.padUrl);
                    });

                    test('Success - User has ADMIN access directly and READ via Group', async function () {
                        const topicMemberUser = {
                            userId: user.id,
                            level: TopicMemberUser.LEVELS.admin
                        };
                        await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);
                        const topicData = (await topicRead(agentUser, user.id, topic.id, null)).body.data;

                        assert.equal(topicData.permission.level, topicMemberUser.level);
                        assert.isUndefined(topicData.creator.email);

                        const res = await padRead(topicData.padUrl);
                        assert.match(res.headers['content-type'], /html/);
                    });

                    test('Success - User has Moderator permissions', async function () {
                        const partner = await Partner.create({
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
                            userId: user.id,
                            partnerId: partner.id
                        });
                        const topicData = (await topicRead(agentUser, user.id, topic.id, null)).body.data;
                        assert.equal(topicData.creator.email, creator.email);

                    });

                    test('Fail - Forbidden - User has Global Moderator permissions access to private topic', async function () {
                        await Moderator.create({
                            userId: user2.id
                        });
                        const resultMessage = (await _topicRead(agentUser2, user2.id, topic.id, null, 403)).body;
                        const expectedResult = {
                            status: {
                                code: 40300,
                                message: 'Insufficient permissions'
                            }
                        };
                        assert.deepEqual(resultMessage, expectedResult);
                    });

                    test('Fail - Forbidden - User membership was revoked from Group', async function () {
                        await groupLib.memberUsersDelete(agentCreator, creator.id, group.id, user.id);
                        await _topicRead(agentUser, user.id, topic.id, null, 403);

                        const topicData = await Topic.findOne({
                            where: {id: topic.id}
                        });

                        const padUrl = cosEtherpad.getUserAccessUrl(topicData, user.id, user.name, user.language);
                        await _padRead(padUrl, 403);
                    });

                    test('Fail - Forbidden - Group access to Topic was revoked', async function () {
                        await topicMemberGroupsDelete(agentCreator, creator.id, topic.id, group.id);
                        await _topicRead(agentUser, user.id, topic.id, null, 403);

                        const topicData = await Topic.findOne({
                            where: {id: topic.id}
                        });
                        const padUrl = cosEtherpad.getUserAccessUrl(topicData, user.id, user.name, user.language);
                        await _padRead(padUrl, 403);
                    });

                    test('Fail - User is moderator has no permissions on topic', async function () {
                        const partner = await Partner.create({
                            website: 'notimportant',
                            redirectUriRegexp: 'notimportant'
                        });
                        await Moderator.create({
                            userId: user.id,
                            partnerId: partner.id
                        });
                        const topicData = (await topicRead(agentUser, user.id, topic.id, null)).body.data;

                        assert.isUndefined(topicData.creator.email);
                    });
                });

                suite('Topic visibility = public', function () {
                    const agentCreator = request.agent(app);
                    const agentUser = request.agent(app);

                    let creator;
                    let user;
                    let topic;

                    setup(async function () {
                        creator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        user = await userLib.createUserAndLogin(agentUser, null, null, null);

                        topic = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.taxes, Topic.CATEGORIES.transport], null, null, null)).body.data;
                    });

                    test('Success - User can read public Topic', async function () {
                        const topicData = (await topicRead(agentUser, user.id, topic.id, null)).body.data;
                        const padUrl = topicData.padUrl;
                        const parsedUrl = _parsePadUrl(padUrl);
                        const padAgent = request.agent(parsedUrl.host);

                        padAgent
                            .get(parsedUrl.path)
                            .expect(200)
                            .expect('x-ep-auth-citizenos-authorize', 'readonly');
                    });

                    test('Success - User has Global Moderator permissions', async function () {
                        await Moderator.create({
                            userId: user.id
                        });

                        const topicData = (await topicRead(agentUser, user.id, topic.id, null)).body.data;
                        assert.equal(topicData.creator.email, creator.email);
                    });

                });
            });

        });

        suite('Update', function () {

            const agent = request.agent(app);
            const agent2 = request.agent(app);
            const email = 'test_topicu_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            const topicStatusNew = Topic.STATUSES.inProgress;
            const topicVisibilityNew = Topic.VISIBILITY.public;
            const topicEndsAtNew = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);

            let user;
            let user2;
            let topic;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                user2 = await userLib.createUserAndLogin(agent2);
            });

            setup(async function () {
                topic = (await topicCreate(agent, user.id, null, null, null, null, 'testtag')).body.data;
                const topicMemberUser = {
                    userId: user2.id,
                    level: TopicMemberUser.LEVELS.edit
                };
                await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);
            });

            test('Success', async function () {
                await topicUpdate(agent, user.id, topic.id, topicStatusNew, topicVisibilityNew, null, topicEndsAtNew, null);
                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data;

                assert.equal(topicNew.status, topicStatusNew);
                assert.equal(topicNew.visibility, topicVisibilityNew);
                assert.equalTime(new Date(topicNew.endsAt), topicEndsAtNew);
            });

            test('Success - update field', async function () {
                const resBody = (await topicUpdateField(agent, user.id, topic.id, {visibility: Topic.VISIBILITY.public})).body;

                assert.isObject(resBody);
                assert.deepEqual(resBody, {});

                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data;

                assert.equal(topicNew.status, topicStatusNew);
                assert.equal(topicNew.visibility, topicVisibilityNew);
            });

            test('Success - status from "followUp" to "voting"', async function () {
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
                await topicVoteCreate(agent, user.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft);
                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp);
                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);

                const topicRes = (await topicRead(agent, user.id, topic.id, null)).body.data
                assert.equal(topicRes.status, Topic.STATUSES.voting);
            });

            test('Fail - update - user with edit permissions - update visibility', async () => {
                await topicUpdate(agent2, user2.id, topic.id, null, Topic.VISIBILITY.public, null, null, null);
                const topicRes = (await topicRead(agent, user.id, topic.id, null)).body.data
                assert.equal(topicRes.visibility, Topic.VISIBILITY.private);
            });

            test('Fail - update - user with edit permissions - update status', async () => {
                await topicUpdate(agent2, user2.id, topic.id, Topic.STATUSES.followUp, null, null, null, null);
                const topicRes = (await topicRead(agent, user.id, topic.id, null)).body.data;
                assert.equal(topicRes.status, Topic.STATUSES.inProgress);
            });

            test('Fail - update - status closed', async function () {
                const contact = {
                    name: 'Test',
                    email: 'test@test.com',
                    phone: '+3725100000'
                };
                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.closed);
                await _topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress, Topic.VISIBILITY.private, [], new Date(), contact, 403);
            });
            test('Fail - Not Found - topicId is null', async function () {
                await _topicUpdate(agent, user.id, null, topicStatusNew, topicVisibilityNew, null, null, null, 404);
            });

            test('Fail - Bad Request - status is null - should not modify existing value', async function () {
                await _topicUpdate(agent, user.id, topic.id, null, topicVisibilityNew, [], null, null, 400);

                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data;

                assert.equal(topicNew.status, topic.status);
            });

            test('Fail - Bad Request - update field - status is null - should not modify existing value', async function () {
                await _topicUpdateField(agent, user.id, topic.id, {status: null}, 400);

                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data

                assert.equal(topicNew.status, topic.status);
            });

            test('Fail - Bad Request - status is "voting" - should not modify existing value', async function () {
                const topicStatusNew = Topic.STATUSES.voting;
                await _topicUpdate(agent, user.id, topic.id, topicStatusNew, topicVisibilityNew, null, null, null, 400);

                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data;

                assert.equal(topicNew.status, topic.status);
            });

            test('Fail - Bad Request - status is "closed", trying to set back to "inProgress" - should not modify existing value', async function () {
                await topicUpdate(agent, user.id, topic.id, Topic.STATUSES.closed, topicVisibilityNew, null, null, null);

                await _topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress, topicVisibilityNew, null, null, null, 403);

                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data;

                assert.equal(topicNew.status, Topic.STATUSES.closed);
            });

            test('Fail - Bad Request - visibility is null - should not modify existing value', async function () {
                await _topicUpdate(agent, user.id, topic.id, topicStatusNew, null, null, null, null, 400);

                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data;

                assert.equal(topicNew.visibility, topic.visibility);
            });

            test('Fail - Bad Request - too many categories', async function () {
                const categories = [Topic.CATEGORIES.culture, Topic.CATEGORIES.agriculture, Topic.CATEGORIES.education, Topic.CATEGORIES.varia];

                const errors = (await _topicUpdate(agent, user.id, topic.id, topicStatusNew, Topic.VISIBILITY.private, categories, null, null, 400)).body.errors;

                assert.equal(errors.categories, 'Maximum of :count categories allowed.'.replace(':count', Topic.CATEGORIES_COUNT_MAX));
            });

            test('Fail - Bad Request - endsAt is in the past', async function () {

                const topicEndsAtNewInPast = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                const errors = (await _topicUpdate(agent, user.id, topic.id, topicStatusNew, Topic.VISIBILITY.private, null, topicEndsAtNewInPast, null, 400)).body.errors;

                assert.equal(errors.endsAt, 'Topic deadline must be in the future.');
            });

            test('Fail - Forbidden - at least edit permissions required', async function () {
                const agent = request.agent(app);
                const u = await userLib.createUserAndLogin(agent, null, null, null);

                await _topicUpdate(agent, u.id, topic.id, topicStatusNew, topicVisibilityNew, null, null, null, 403);
            });

            test('Fail - Cannot update content when status is not inProgress', async function () {
                await topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp, Topic.VISIBILITY.private, null, null, null);
                await _topicUpdateField(agent, user.id, topic.id, {description: '<html><body><h1>New content</h1></body></html>'}, 400);
            });
        });

        suite('Delete', function () {

            const agent = request.agent(app);
            const email = 'test_topicd_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
            });

            test('Success', async function () {
                await topicDelete(agent, user.id, topic.id);

                const tcount = await Topic.count({
                    where: {
                        id: topic.id
                    }
                });
                // Topic table should not have any lines for this Group
                assert.equal(tcount, 0);

                // Also if Topic is gone so should TopicMemberUser
                const tmCount = await TopicMemberUser.count({
                    where: {
                        topicId: topic.id
                    }
                });
                assert.equal(tmCount, 0);

                try {
                    await etherpadClient.getRevisionsCountAsync({padID: topic.id});
                } catch (err) {
                    const expectedResult = {
                        code: 1,
                        message: 'padID does not exist'
                    };

                    assert.deepEqual(err, expectedResult);
                }
            });

            test('Fail - Forbidden - at least admin permissions required', async function () {
                const agent = request.agent(app);
                const u = await userLib.createUserAndLogin(agent, null, null, null);
                await _topicDelete(agent, u.id, topic.id, 403);
            });

        });

        suite('List', function () {
            let agentCreator;
            let agentUser;

            let creator;
            let user;
            let topic;
            let group;

            setup(async function () {
                agentCreator = request.agent(app);
                agentUser = request.agent(app);
                creator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                user = await userLib.createUserAndLogin(agentUser, null, null, null);
                group = (await groupLib.create(agentCreator, creator.id, 'Group', null, null)).body.data;
                const topicRes = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;
                const title = 'T title';
                const description = 'T desc';
                topic = (await Topic.update(
                    {
                        title: title,
                        description: description
                    },
                    {
                        where: {
                            id: topicRes.id
                        },
                        limit: 1,
                        returning: true
                    }
                ))[1][0];
                // Add Group to Topic members and User to that Group
                const topicMemberGroup = {
                    groupId: group.id,
                    level: TopicMemberGroup.LEVELS.edit
                };

                const groupMemberUser = {
                    userId: user.id,
                    level: GroupMemberUser.LEVELS.read
                };
                await topicMemberGroupsCreate(agentCreator, creator.id, topic.id, topicMemberGroup);
                await memberLib.groupMemberUsersCreate(group.id, [groupMemberUser]);
            });

            test('Success', async function () {
                const type = Comment.TYPES.pro;
                const type2 = Comment.TYPES.con;
                const subject = 'TEST';
                const text = 'THIS IS A TEST';
                const comment = (await topicCommentCreate(agentCreator, creator.id, topic.id, null, null, Comment.TYPES.pro, subject, text)).body.data;
                assert.property(comment, 'id');
                assert.equal(comment.type, type);
                assert.equal(comment.subject, subject);
                assert.equal(comment.text, text);
                assert.equal(comment.creator.id, creator.id);

                const comment2 = (await topicCommentCreate(agentCreator, creator.id, topic.id, null, null, Comment.TYPES.con, subject, text)).body.data;

                assert.property(comment2, 'id');
                assert.equal(comment2.type, type2);
                assert.equal(comment2.subject, subject);
                assert.equal(comment2.text, text);
                assert.equal(comment2.creator.id, creator.id);

                const list = (await topicList(agentCreator, creator.id, null, null, null, null, null, null, null)).body.data;
                assert.equal(list.count, 1);

                const rows = list.rows;
                assert.equal(rows.length, 1);

                const topicR = rows[0];
                assert.equal(topicR.id, topic.id);
                assert.equal(topicR.title, topic.title);
                assert.equal(topicR.description, topic.description);
                assert.equal(topicR.status, topic.status);
                assert.equal(topicR.visibility, topic.visibility);
                assert.property(topicR, 'createdAt');
                assert.notProperty(topicR, 'events');

                const creator1 = topicR.creator;
                assert.equal(creator1.id, topic.creatorId);

                const members = topicR.members;
                assert.equal(members.users.count, 2);
                assert.equal(members.groups.count, 1);

                const permission = topicR.permission;
                assert.equal(permission.level, TopicMemberUser.LEVELS.admin);

                const comments = topicR.comments;
                assert.equal(comments.count, 2);
                assert.equal(comments.lastCreatedAt, comment2.createdAt);
            });

            test('Success - without deleted topics', async function () {
                let deletedTopic = (await topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;

                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Deleted Topic';
                const description = 'Deleted topic desc';

                await Topic.update(
                    {
                        title: title,
                        description: description
                    },
                    {
                        where: {
                            id: deletedTopic.id
                        }
                    }
                );

                deletedTopic = (await topicRead(agentUser, user.id, deletedTopic.id, null)).body.data;
                await topicDelete(agentUser, user.id, deletedTopic.id);
                const list = (await topicList(agentUser, user.id, null, null, null, null, null, null, null)).body.data
                assert.equal(list.count, 1);

                const listOfTopics = list.rows;

                assert.equal(list.count, listOfTopics.length);

                listOfTopics.forEach(function (resTopic) {
                    assert.notEqual(deletedTopic.id, resTopic.id);
                });
            });

            test('Success - without moderated topics', async function () {
                const agentModerator = request.agent(app);
                const agentReporter = request.agent(app);
                const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const userModerator = await userLib.createUserAndLogin(agentModerator, emailModerator, null, null);
                await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);

                await Moderator.create({
                    userId: userModerator.id
                });
                const moderatedTopic = (await topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                await Topic.update(
                    {
                        title: "Moderated TOPIC",
                        description: "Moderated TOPIC"
                    },
                    {
                        where: {
                            id: moderatedTopic.id
                        },
                        limit: 1,
                        returning: true
                    }
                );

                const report = (await topicReportCreate(agentReporter, moderatedTopic.id, Report.TYPES.spam, 'Topic spam report test')).body.data;
                const moderateType = Report.TYPES.spam;
                const moderateText = 'Report create moderation text';

                await topicReportModerate(agentModerator, moderatedTopic.id, report.id, moderateType, moderateText);

                const list = (await topicList(agentUser, user.id, null, null, null, null, null, null, null)).body.data
                assert.equal(list.count, 1);

                const listOfTopics = list.rows;

                assert.equal(list.count, listOfTopics.length);
                listOfTopics.forEach(function (resTopic) {
                    assert.notEqual(moderatedTopic.id, resTopic.id);
                });

            });

            test('Success - moderated topics', async function () {
                const agentModerator = request.agent(app);
                const agentReporter = request.agent(app);
                const emailModerator = 'moderator_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const emailReporter = 'reporter_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@topicreportest.com';
                const userModerator = await userLib.createUserAndLogin(agentModerator, emailModerator, null, null);
                await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);

                await Moderator.create({
                    userId: userModerator.id
                });
                const moderatedTopic = (await topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                await Topic.update(
                    {
                        title: "Moderated TOPIC",
                        description: "Moderated TOPIC"
                    },
                    {
                        where: {
                            id: moderatedTopic.id
                        },
                        limit: 1,
                        returning: true
                    }
                );
                const report = (await topicReportCreate(agentReporter, moderatedTopic.id, Report.TYPES.spam, 'Topic spam report test')).body.data;
                const moderateType = Report.TYPES.spam;
                const moderateText = 'Report create moderation text';

                await topicReportModerate(agentModerator, moderatedTopic.id, report.id, moderateType, moderateText);
                const list = (await topicList(agentUser, user.id, null, null, null, null, null, true, null)).body.data;
                assert.equal(list.count, 1);

                const listOfTopics = list.rows;

                assert.equal(list.count, listOfTopics.length);
                listOfTopics.forEach(function (resTopic) {
                    assert.equal(moderatedTopic.id, resTopic.id);
                });

            });

            test('Success - visibility private', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;

                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Public Topic';
                const description = 'Public topic desc';

                await Topic.update(
                    {
                        title: title,
                        description: description
                    },
                    {
                        where: {
                            id: publicTopic.id
                        }
                    }
                );

                const list = (await topicList(agentUser, user.id, null, Topic.VISIBILITY.private, null, null, null, null, null)).body.data;
                assert.equal(list.count, 1);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                });
            });

            test('Success - visibility public', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;

                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Public Topic';
                const description = 'Public topic desc';

                await Topic.update(
                    {
                        title: title,
                        description: description
                    },
                    {
                        where: {
                            id: publicTopic.id
                        }
                    }
                );
                const list = (await topicList(agentUser, user.id, null, Topic.VISIBILITY.public, null, null, null, null, null)).body.data;
                assert.equal(list.count, 1);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                });
            });

            test('Success - only users topics', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;

                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Public Topic';
                const description = 'Public topic desc';

                await Topic.update(
                    {
                        title: title,
                        description: description
                    },
                    {
                        where: {
                            id: publicTopic.id
                        }
                    }
                );

                const list = (await topicList(agentCreator, creator.id, null, null, null, creator.id, null, null, null)).body.data;
                assert.equal(list.count, 1);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.creator.id, creator.id);
                    assert.notEqual(topicItem.creator.id, user.id);
                });
            });

            test('Success - status inProgress', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, null, null, null, null, null)).body.data;
                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Public Topic';
                const description = 'Public topic desc';

                await Topic.update(
                    {
                        title: title,
                        description: description
                    },
                    {
                        where: {
                            id: publicTopic.id
                        }
                    }
                );

                const list = (await topicList(agentUser, user.id, null, null, 'inProgress', null, null, null, null)).body.data;
                assert.equal(list.count, 2);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.status, Topic.STATUSES.inProgress);
                    assert.equal(topicItem.deletedAt, null);
                });
            });

            test('Success - status voting', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, null, null, null, null, null)).body.data;
                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Public Topic';
                const description = 'Public topic desc';

                await Topic.update(
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
                );
                const list = (await topicList(agentUser, user.id, null, null, 'voting', null, null, null, null)).body.data;
                assert.equal(list.count, 1);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.status, Topic.STATUSES.voting);
                    assert.equal(topicItem.deletedAt, null);
                });
            });

            test('Success - status followUp', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, null, null, null, null, null)).body.data;

                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Public Topic';
                const description = 'Public topic desc';

                await Topic.update(
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
                );

                const list = (await topicList(agentUser, user.id, null, null, 'followUp', null, null, null, null)).body.data;
                assert.equal(list.count, 1);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.status, Topic.STATUSES.followUp);
                    assert.equal(topicItem.deletedAt, null);
                });
            });

            test('Success - status closed', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, null, null, null, null, null)).body.data;

                // Add title & description in DB. NULL title topics are not to be returned.
                const title = 'Public Topic';
                const description = 'Public topic desc';

                await Topic.update(
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
                );

                const list = (await topicList(agentUser, user.id, null, null, 'closed', null, null, null, null)).body.data;

                assert.equal(list.count, 1);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.status, Topic.STATUSES.closed);
                    assert.equal(topicItem.deletedAt, null);
                });

            });
            test('Success - list only topics that User has voted on - voted=true', async function () {
                this.timeout(10000);
                // Create 2 topics 1 in voting, but not voted, 1 voted. Topic list should return only 1 that User has voted on
                const topicWithVoteNotVoted = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS NOT VOTED on this topic</h2></body></html>', null)).body.data;
                const topicWithVoteAndVoted = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS VOTED on this topic</h2></body></html>', null)).body.data;
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

                await topicVoteCreate(agentCreator, user.id, topicWithVoteNotVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteNotVoted.title}`, null, null);
                const vote = (await topicVoteCreate(agentCreator, user.id, topicWithVoteAndVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteAndVoted.title}`, null, null)).body.data;
                const topicMemberGroup = {
                    groupId: group.id,
                    level: TopicMemberGroup.LEVELS.edit
                };

                await topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteNotVoted.id, topicMemberGroup);
                await topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteAndVoted.id, topicMemberGroup);
                const voteList = [
                    {
                        optionId: vote.options.rows[0].id
                    }
                ];

                await topicVoteVote(agentUser, user.id, topicWithVoteAndVoted.id, vote.id, voteList, null, null, null, null);
                const resData = (await topicList(agentUser, user.id, null, null, null, null, true, null, null)).body.data;

                assert.equal(resData.count, 1);
                assert.equal(resData.rows.length, 1);

                const resTopic = resData.rows[0];

                assert.equal(resTopic.id, topicWithVoteAndVoted.id);
            });

            test('Success - list only topics that User has NOT voted on - voted=false ', async function () {
                this.timeout(10000);
                // Create 2 topics 1 in voting, but not voted, 1 voted. Topic list should return only 1 that User has NOT voted on
                const topicWithVoteNotVoted = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS NOT VOTED on this topic</h2></body></html>', null)).body.data;
                const topicWithVoteAndVoted = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, '<html><head></head><body><h2>TEST User HAS VOTED on this topic</h2></body></html>', null)).body.data;
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

                await topicVoteCreate(agentCreator, user.id, topicWithVoteNotVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteNotVoted.title}`, null, null);
                const vote = (await topicVoteCreate(agentCreator, user.id, topicWithVoteAndVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteAndVoted.title}`, null, null)).body.data;

                const topicMemberGroup = {
                    groupId: group.id,
                    level: TopicMemberGroup.LEVELS.edit
                };

                await topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteNotVoted.id, topicMemberGroup);
                await topicMemberGroupsCreate(agentCreator, creator.id, topicWithVoteAndVoted.id, topicMemberGroup);
                const voteList = [
                    {
                        optionId: vote.options.rows[0].id
                    }
                ];

                await topicVoteVote(agentUser, user.id, topicWithVoteAndVoted.id, vote.id, voteList, null, null, null, null);
                const resData = (await topicList(agentUser, user.id, null, null, null, null, false, null, null)).body.data

                assert.equal(resData.count, 1);
                assert.equal(resData.rows.length, 1);

                const resTopic = resData.rows[0];

                assert.equal(resTopic.id, topicWithVoteNotVoted.id);
            });

            suite('Include', function () {

                const agent = request.agent(app);
                const title = 'Include test';
                const description = 'include content';

                let user;
                let topic;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                    await Topic.update(
                        {
                            title: title,
                            description: description
                        },
                        {
                            where: {
                                id: topic.id
                            }
                        }
                    );
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

                    const voteDescription = 'Vote description';

                    const vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, voteDescription, null, null)).body.data;

                    assert.property(vote, 'id');
                    assert.equal(vote.minChoices, 1);
                    assert.equal(vote.maxChoices, 1);
                    assert.equal(vote.delegationIsAllowed, false);
                    assert.isNull(vote.endsAt);
                    assert.equal(vote.description, voteDescription);
                    assert.equal(vote.authType, Vote.AUTH_TYPES.soft);

                    // Topic should end up in "voting" status
                    const t = await Topic.findOne({
                        where: {
                            id: topic.id
                        }
                    });
                    assert.equal(t.status, Topic.STATUSES.voting);
                    topic = t.dataValues;
                });

                test('Success - include vote', async function () {
                    const list = (await topicList(agent, user.id, ['vote'], null, null, null, null, null)).body.data.rows;

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

                    const list2 = (await topicList(agent, user.id, null, null, null, null, null, null)).body.data.rows;
                    assert.equal(list.length, list2.length);

                    for (let i = 0; i < list.length; i++) {
                        assert.equal(list[i].id, list2[i].id);
                        assert.equal(list[i].description, list2[i].description);
                        assert.deepEqual(list[i].creator, list2[i].creator);

                        if (list[i].status === Topic.STATUSES.voting) {
                            assert.equal(list[i].vote.id, list2[i].vote.id);
                            assert.property(list[i].vote, 'options');
                            assert.notProperty(list2[i].vote, 'options');
                        }
                    }
                });

                test('Success - include events', async function () {
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp);

                    const subject = 'Test Event title';
                    const text = 'Test Event description';

                    const res = await topicEventCreate(agent, user.id, topic.id, subject, text);
                    assert.equal(res.body.status.code, 20100);

                    const event = res.body.data;
                    assert.equal(event.subject, subject);
                    assert.equal(event.text, text);
                    assert.property(event, 'createdAt');
                    assert.property(event, 'id');
                    const list = (await topicList(agent, user.id, ['event'], null, null, null, null, null)).body.data.rows;
                    assert.equal(list.length, 1);

                    list.forEach(function (topicItem) {
                        assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                        if (topicItem.status === Topic.STATUSES.followUp) {
                            assert.property(topicItem, 'events');
                            assert.equal(topicItem.events.count, 1);
                        }
                    });

                    const list2 = (await topicList(agent, user.id, null, null, null, null, null, null)).body.data.rows;
                    assert.equal(list.length, list2.length);

                    for (let i = 0; i < list.length; i++) {
                        assert.equal(list[i].id, list2[i].id);
                        assert.equal(list[i].description, list2[i].description);
                        assert.deepEqual(list[i].creator, list2[i].creator);

                        if (list[i].status === Topic.STATUSES.voting) {
                            assert.equal(list[i].vote.id, list2[i].vote.id);
                            assert.property(list[i].vote, 'options');
                            assert.notProperty(list2[i].vote, 'options');
                        }
                    }
                });

                test('Success - include pinned', async function () {
                    await topicFavouriteCreate(agent, user.id, topic.id);

                    const list = (await topicList(agent, user.id, null, null, null, null, null, null, true)).body.data.rows;

                    assert.equal(list.length, 1);
                    list.forEach(function (topicItem) {
                        assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                        assert.equal(topicItem.pinned, true);
                    });

                    const list2 = (await topicList(agent, user.id, null, null, null, null, null, null)).body.data.rows;
                    assert.equal(list.length, list2.length);

                    for (let i = 0; i < list.length; i++) {
                        assert.equal(list[i].id, list2[i].id);
                        assert.equal(list[i].description, list2[i].description);
                        assert.deepEqual(list[i].creator, list2[i].creator);

                        if (list[i].status === Topic.STATUSES.voting) {
                            assert.equal(list[i].vote.id, list2[i].vote.id);
                            assert.property(list[i].vote, 'options');
                            assert.notProperty(list2[i].vote, 'options');
                        }
                    }
                });

                test('Success - include all', async function () {
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp);

                    const subject = 'Test Event title';
                    const text = 'Test Event description';

                    const res = await topicEventCreate(agent, user.id, topic.id, subject, text);

                    assert.equal(res.body.status.code, 20100);

                    let event = res.body.data;
                    assert.equal(event.subject, subject);
                    assert.equal(event.text, text);
                    assert.property(event, 'createdAt');
                    assert.property(event, 'id');

                    const list = (await topicList(agent, user.id, ['vote', 'event'], null, null, null, null, null)).body.data.rows;

                    assert.equal(list.length, 1);

                    list.forEach(function (topicItem) {
                        assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                        assert.property(topicItem, 'events');
                        if (topicItem.status === Topic.STATUSES.followUp) {
                            assert.property(topicItem, 'vote');
                            assert.equal(topicItem.events.count, 2);
                        }
                    });

                    const list2 = (await topicList(agent, user.id, null, null, null, null, null, null)).body.data.rows;
                    assert.equal(list.length, list2.length);

                    for (let i = 0; i < list.length; i++) {
                        assert.equal(list[i].id, list2[i].id);
                        assert.equal(list[i].description, list2[i].description);
                        assert.deepEqual(list[i].creator, list2[i].creator);

                        if (list[i].status === Topic.STATUSES.voting) {
                            assert.equal(list[i].vote.id, list2[i].vote.id);
                            assert.property(list[i].vote, 'options');
                            assert.notProperty(list2[i].vote, 'options');
                        }
                    }
                });
            });

            suite('Levels', function () {

                test('Success - User has "edit" via Group', async function () {
                    const listOfTopics = (await topicList(agentUser, user.id, null, null, null, null, null)).body.data;

                    assert.equal(listOfTopics.count, 1);
                    assert.equal(listOfTopics.rows.length, 1);

                    const topicR = listOfTopics.rows[0];

                    assert.equal(topicR.id, topic.id);

                    const permission = topicR.permission;

                    assert.equal(permission.level, TopicMemberUser.LEVELS.edit);
                });

                test('Success - User permission overrides Group - has "admin"', async function () {
                    const topicMemberUser = {
                        userId: user.id,
                        level: TopicMemberUser.LEVELS.admin
                    };

                    await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);
                    const listOfTopics = (await topicList(agentUser, user.id, null, null, null, null, null)).body.data;

                    assert.equal(listOfTopics.count, 1);
                    assert.equal(listOfTopics.rows.length, 1);

                    const topicR = listOfTopics.rows[0];

                    assert.equal(topicR.id, topic.id);

                    const permission = topicR.permission;

                    assert.equal(permission.level, TopicMemberUser.LEVELS.admin);

                });

                test('Success - User permission overrides Group permission - has "none" thus no Topics listed', async function () {
                    const topicMemberUser = {
                        userId: user.id,
                        level: TopicMemberUser.LEVELS.none
                    };

                    await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);
                    const listOfTopics = (await topicList(agentUser, user.id, null, null, null, null, null)).body.data;

                    assert.equal(listOfTopics.count, 0);
                    assert.property(listOfTopics, 'rows');
                    assert.equal(listOfTopics.rows.length, 0);
                });

                test('Success - User removed from Group which granted permissions - has "none" thus no Topics listed', async function () {
                    await groupLib.memberUsersDelete(agentCreator, creator.id, group.id, user.id);
                    const listOfTopics = (await topicList(agentUser, user.id, null, null, null, null, null)).body.data;

                    assert.equal(listOfTopics.count, 0);
                    assert.property(listOfTopics, 'rows');
                    assert.equal(listOfTopics.rows.length, 0);
                });

                test('Success - User granted direct "admin" access to Topic and then removed from Group which gave "edit" access - has "admin"', async function () {
                    const topicMemberUser = {
                        userId: user.id,
                        level: TopicMemberUser.LEVELS.admin
                    };

                    await memberLib.topicMemberUsersCreate(topic.id, [topicMemberUser]);
                    await groupLib.memberUsersDelete(agentCreator, creator.id, group.id, user.id);

                    const listOfTopics = (await topicList(agentUser, user.id, null, null, null, null, null)).body.data;

                    assert.equal(listOfTopics.count, 1);
                    assert.equal(listOfTopics.rows.length, 1);

                    const topicR = listOfTopics.rows[0];

                    assert.equal(topicR.id, topic.id);

                    const permission = topicR.permission;

                    assert.equal(permission.level, TopicMemberUser.LEVELS.admin);
                });

            });

        });

        // API - /api/users/:userId/topics/:topicId/members
        suite('Members', function () {

            suite('List', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const agentTopicMemberUser = request.agent(app);

                let user;
                let user2;
                let user3;

                let group;
                let group2;
                const groupMemberIds = [];

                let topic;
                let topicMemberUser;

                const topicMemberUserLevel = TopicMemberUser.LEVELS.edit;
                const topicMemberGroupLevel = TopicMemberGroup.LEVELS.read;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    user2 = await userLib.createUserAndLogin(agent2, null, null, null);
                });

                setup(async function () {
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                    group = (await groupLib.create(agent, user.id, 'Topic List Test Group', null, null)).body.data;
                    topicMemberUser = await userLib.createUserAndLogin(agentTopicMemberUser, null, null, null);
                    user3 = (await userLib.createUser(request.agent(app), null, null, null));
                    group2 = (await groupLib.create(agent2, user2.id, 'Topic List Test Group2', null, null)).body.data;
                    const members = [
                        {
                            userId: user.id,
                            level: GroupMemberUser.LEVELS.read
                        }
                    ];

                    await memberLib.groupMemberUsersCreate(group2.id, members);
                    groupMemberIds.push(user.id);
                    const member = {
                        groupId: group.id,
                        level: topicMemberGroupLevel
                    };

                    await topicMemberGroupsCreate(agent, user.id, topic.id, member);
                    const memberUser = {
                        userId: topicMemberUser.id,
                        level: topicMemberUserLevel
                    };

                    await memberLib.topicMemberUsersCreate(topic.id, [memberUser]);
                    const memberGroup = {
                        userId: user3.id,
                        level: GroupMemberUser.LEVELS.read
                    };

                    await memberLib.groupMemberUsersCreate(group.id, [memberGroup]);
                    groupMemberIds.push(user3.id);

                    const member2 = {
                        groupId: group2.id,
                        level: topicMemberGroupLevel
                    };

                    const result = await topicMemberGroupsCreate(agent, user.id, topic.id, member2);
                    if (result && result.body.status.code === 20100) {
                        await groupLib.memberUsersDelete(agent2, user2.id, group2.id, user.id);
                    }
                });

                test('Success', async function () {
                    const list = (await topicMembersList(agent, user.id, topic.id)).body.data;

                    const groups = list.groups;

                    assert.equal(groups.count, 2);
                    assert.equal(groups.rows.length, 2);

                    const groupRes = groups.rows.find((g) => {return g.id === group.id});
                    assert.equal(groupRes.name, group.name);
                    assert.equal(groupRes.level, topicMemberGroupLevel);
                    assert.equal(groupRes.permission.level, TopicMemberGroup.LEVELS.admin);

                    const group2Res = groups.rows.find((g) => {return g.id === group2.id});
                    assert.isNull(group2Res.name);
                    assert.equal(group2Res.level, topicMemberGroupLevel);
                    assert.isNull(group2Res.permission.level);

                    const users = list.users;

                    assert.equal(users.count, 4);
                    assert.equal(users.rows.length, 4);

                    let adminUser = null;
                    const memberUsers = [];

                    for (let i = 0; i < users.rows.length; i++) {
                        if (users.rows[i].level === TopicMemberUser.LEVELS.admin) {
                            adminUser = users.rows[i];
                        } else {
                            memberUsers.push(users.rows[i]);
                        }
                    }
                    assert.equal(adminUser.id, user.id);
                    assert.property(adminUser, 'name');
                    assert.equal(adminUser.level, TopicMemberUser.LEVELS.admin);

                    let topicMemberUserReturned = 0;
                    memberUsers.forEach(function (memberUser) {
                        if (memberUser.id === topicMemberUser.id) {
                            topicMemberUserReturned = 1;
                            assert.equal(memberUser.level, topicMemberUserLevel);
                        } else {
                            assert.equal(memberUser.level, topicMemberGroupLevel);
                        }
                        assert.property(memberUser, 'name');
                    });
                    assert.equal(topicMemberUserReturned, 1);
                });

                test('Success - non-admin User - MUST NOT show extended User data (email, phone etc) for NON admin member - https://github.com/citizenos/citizenos-fe/issues/670', async function () {
                    const list = (await topicMembersList(agentTopicMemberUser, topicMemberUser.id, topic.id)).body.data;

                    list.users.rows.forEach(function (user) {
                        assert.notProperty(user, 'email');
                        assert.notProperty(user, 'pid');
                        assert.notProperty(user, 'phoneNumber');
                    });
                });

                suite('Users', function () {

                    test('Success', async function () {
                        const users = (await topicMembersUsersList(agent, user.id, topic.id, null, null, null, 'name', 'ASC')).body.data;
                        let groupExistsCount = 0;
                        assert.equal(users.countTotal, users.count);
                        delete users.countTotal;

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
                        const memberUsers = (await topicMembersList(agent, user.id, topic.id)).body.data.users;
                        users.rows.forEach(function (user) {
                            delete user.groups;
                        });
                        assert.deepEqual(users, memberUsers);
                    });

                    test('Success - with search', async function () {
                        const allUsers = (await topicMembersUsersList(agent, user.id, topic.id, 1)).body.data;
                        assert.equal(allUsers.countTotal, 4);
                        assert.equal(allUsers.rows.length, 1);
                        const searchString = user.name.split(' ')[1];
                        const users = (await topicMembersUsersList(agent, user.id, topic.id, 1, null, searchString)).body.data;
                        let groupExistsCount = 0;

                        assert.equal(users.countTotal, 1);
                        assert.equal(users.rows.length, 1);

                        delete users.countTotal;

                        users.rows.forEach(function (memberUser) {
                            assert.property(memberUser, 'groups');
                            assert.isAbove(memberUser.name.toLowerCase().indexOf(searchString.toLowerCase()), -1);
                            memberUser.groups.rows.forEach(function (userGroup) {
                                if (userGroup.id === group.id) {
                                    groupExistsCount++;
                                    assert.include(groupMemberIds, memberUser.id);
                                    assert.equal(userGroup.name, group.name);
                                    assert.property(userGroup, 'level');
                                }
                            });
                        });

                        assert.equal(groupExistsCount, 1);
                    });

                    test('Success - use invalid sortOrder', async function () {
                        const users = (await topicMembersUsersList(agent, user.id, topic.id, null, null, null, 'name', 'lol')).body.data;
                        let groupExistsCount = 0;
                        assert.equal(users.countTotal, users.count);
                        delete users.countTotal;

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
                        const memberUsers = (await topicMembersList(agent, user.id, topic.id)).body.data.users;
                        users.rows.forEach(function (user) {
                            delete user.groups;
                        });
                        assert.deepEqual(users, memberUsers);
                    });
                });

                suite('Groups', function () {

                    test('Success', async function () {
                        const groups = (await topicMembersGroupsList(agent, user.id, topic.id)).body.data;
                        assert.equal(groups.count, groups.countTotal);
                        delete groups.countTotal;
                        const memberGroups = (await topicMembersList(agent, user.id, topic.id)).body.data.groups;
                        assert.deepEqual(groups, memberGroups);
                    });

                    test('Success - with search', async function () {
                        const groups = (await topicMembersGroupsList(agent, user.id, topic.id)).body.data;
                        assert.equal(groups.count, 2);
                        assert.equal(groups.countTotal, 2);
                        const searchString = group.name.split(' ')[1];
                        const groups2 = (await topicMembersGroupsList(agent, user.id, topic.id, 2, null, searchString, 'level', 'DESC')).body.data;
                        assert.equal(1, groups2.count);
                        assert.equal(1, groups2.countTotal);
                        assert.isAbove(groups2.rows[0].name.toLowerCase().indexOf(searchString.toLowerCase()), -1);
                    });

                });
            });

            suite('Users', function () {
                suite('Update', function () {
                    const agent = request.agent(app);
                    const email = 'test_topicmuu' + new Date().getTime() + '@test.ee';
                    const password = 'testPassword123';

                    const memberEmail = 'test_topicmu_m' + new Date().getTime() + '@test.ee';
                    const memberPassword = 'testPassword123';

                    let user;
                    let member;
                    let topic;

                    suiteSetup(async function () {
                        member = await userLib.createUser(agent, memberEmail, memberPassword, null);
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;

                        const memberToAdd = {
                            userId: member.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        await memberLib.topicMemberUsersCreate(topic.id, [memberToAdd]);
                    });

                    test('Success - update member User', async function () {
                        const newLevel = TopicMemberUser.LEVELS.admin;

                        await topicMemberUsersUpdate(agent, user.id, topic.id, member.id, newLevel);

                        const tm = await TopicMemberUser.findOne({
                            where: {
                                topicId: topic.id,
                                userId: member.id
                            }
                        });

                        assert.equal(tm.userId, member.id);
                        assert.equal(tm.level, TopicMemberUser.LEVELS.admin);
                    });

                    test('Fail - Forbidden - at least admin permissions required', async function () {
                        const agent = request.agent(app);
                        const u = await userLib.createUserAndLogin(agent, null, null, null);
                        await _topicMemberUsersUpdate(agent, u.id, topic.id, member.id, TopicMemberUser.LEVELS.admin, 403);
                    });

                });

                suite('Delete', function () {
                    let agent;
                    let email;
                    let password;

                    let memberAgent;
                    let memberEmail;
                    let memberPassword;

                    let user;
                    let member;
                    let topic;

                    setup(async function () {
                        agent = request.agent(app);
                        email = 'test_topicmud' + new Date().getTime() + '@test.ee';
                        password = 'testPassword123';

                        memberAgent = request.agent(app);
                        memberEmail = 'test_topicmd_m' + new Date().getTime() + '@test.ee';
                        memberPassword = 'testPassword123';

                        member = await userLib.createUserAndLogin(memberAgent, memberEmail, memberPassword, null);
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const memberToAdd = {
                            userId: member.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        await memberLib.topicMemberUsersCreate(topic.id, [memberToAdd]);
                    });

                    test('Success - 20000 - delete member User', async function () {
                        const topicRead1 = (await topicRead(agent, user.id, topic.id, null)).body.data;
                        assert.equal(topicRead1.members.users.count, 2);

                        await topicMemberUsersDelete(agent, user.id, topic.id, member.id);
                        const topicRead2 = (await topicRead(agent, user.id, topic.id, null)).body.data;
                        assert.equal(topicRead2.members.users.count, 1);
                    });

                    test('Success - 20000 - User leaves Topic', async function () {
                        const usersList1 = (await topicMembersUsersList(agent, user.id, topic.id)).body.data;
                        assert.equal(usersList1.count, 2);
                        assert.equal(usersList1.rows.length, 2);

                        await topicMemberUsersDelete(memberAgent, member.id, topic.id, member.id);

                        const usersList = (await topicMembersUsersList(agent, user.id, topic.id)).body.data;
                        assert.equal(usersList.count, 1);
                        assert.equal(usersList.rows.length, 1);
                    });

                    test('Success - add member update to admin and remove other admin', async function () {
                        const userWithInsufficientPermissionsAgent = request.agent(app);
                        let memberUser;
                        memberUser = await userLib.createUserAndLogin(userWithInsufficientPermissionsAgent, null, null, null);
                        const memberToAdd = {
                            userId: memberUser.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        await memberLib.topicMemberUsersCreate(topic.id, [memberToAdd]);

                        await _topicMemberUsersDelete(userWithInsufficientPermissionsAgent, memberToAdd.id, topic.id, member.id, 403);
                        const newLevel = TopicMemberUser.LEVELS.admin;

                        await topicMemberUsersUpdate(agent, user.id, topic.id, memberUser.id, newLevel);

                        await topicMemberUsersUpdate(userWithInsufficientPermissionsAgent, memberUser.id, topic.id, user.id, TopicMemberUser.LEVELS.read);
                        await topicMemberUsersDelete(userWithInsufficientPermissionsAgent, memberToAdd.id, topic.id, user.id);
                    });

                    test('Fail - 40010 - User leaves Topic being the last admin member', async function () {
                        const res = await _topicMemberUsersDelete(agent, user.id, topic.id, user.id, 400);

                        const expectedResponse = {
                            status: {
                                code: 40010,
                                message: 'Cannot delete the last admin member.'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);
                    });

                    test('Fail - 40300 - cannot delete with no admin permissions', async function () {
                        const userWithInsufficientPermissionsAgent = request.agent(app);
                        const newUser = await userLib.createUserAndLogin(userWithInsufficientPermissionsAgent, null, null, null);

                        const memberToAdd = {
                            userId: newUser.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        await memberLib.topicMemberUsersCreate(topic.id, [memberToAdd]);
                        await _topicMemberUsersDelete(userWithInsufficientPermissionsAgent, memberToAdd.id, topic.id, member.id, 403);
                    });
                });

            });

            suite('Groups', function () {

                suite('Create', function () {
                    const agent = request.agent(app);
                    const agent2 = request.agent(app);
                    const email = 'test_topicmgc_' + new Date().getTime() + '@test.ee';
                    const password = 'testPassword123';

                    const groupName = 'Test Group for group membership test';

                    let user;
                    let group;
                    let group2;
                    let topic;

                    let member;
                    let member2;

                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        const groupMemberUser = await userLib.createUserAndLogin(request.agent(app), null, null, null);
                        const user2 = await userLib.createUserAndLogin(agent2, null, null, null);

                        topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                        group2 = (await groupLib.create(agent2, user2.id, groupName + ' MUGRUPP', null, null)).body.data;
                        member2 = {
                            groupId: group2.id,
                            level: TopicMemberGroup.LEVELS.read
                        };

                        group = (await groupLib.create(agent, user.id, groupName, null, null)).body.data;
                        const groupMember = {
                            userId: groupMemberUser.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        member = {
                            groupId: group.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        await memberLib.groupMemberUsersCreate(group.id, [groupMember]);
                    });

                    test('Success - add Group as member', async function () {
                        await topicMemberGroupsCreate(agent, user.id, topic.id, member);

                        const count = await TopicMemberGroup.count({
                            where: {
                                topicId: topic.id,
                                groupId: group.id
                            }
                        })
                        assert.equal(count, 1);
                    });

                    test('Success - add same Group twice', async function () {
                        await topicMemberGroupsCreate(agent, user.id, topic.id, member);
                        member.level = TopicMemberGroup.LEVELS.admin;

                        await topicMemberGroupsCreate(agent, user.id, topic.id, member);
                        const topicMemberGroup = await TopicMemberGroup.findOne({
                            where: {
                                topicId: topic.id,
                                groupId: member.groupId
                            }
                        });

                        assert.notEqual(topicMemberGroup.level, member.level);
                    });


                    test('Fail - Forbidden - at least admin permissions required', async function () {
                        const agent = request.agent(app);
                        const u = await userLib.createUserAndLogin(agent, null, null, null);

                        await _topicMemberGroupsCreate(agent, u.id, topic.id, member, 403);
                    });

                    test('Fail - add Group as member', async function () {
                        await _topicMemberGroupsCreate(agent, user.id, topic.id, member2, 403);

                        const count = await TopicMemberGroup.count({
                            where: {
                                topicId: topic.id,
                                groupId: group2.id
                            }
                        });
                        assert.equal(count, 0);
                    });

                    test('Delete group - check topic member groups count after deleting member group', async function () {
                        await groupLib.delete(agent, user.id, group.id);
                        const resTopic = (await topicReadUnauth(agent, topic.id, null)).body.data;
                        assert.equal(resTopic.members.groups.count, 0);
                    });

                });

                suite('Update', function () {
                    const agent = request.agent(app);
                    const email = 'test_topicmgu' + new Date().getTime() + '@test.ee';
                    const password = 'testPassword123';

                    const groupName = 'Test Group for group membership test';

                    let user;
                    let group;
                    let topic;

                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;

                        group = (await groupLib.create(agent, user.id, groupName, null, null)).body.data;
                        const members = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.read
                        };

                        await topicMemberGroupsCreate(agent, user.id, topic.id, members);
                    });

                    test('Success - update member Group', async function () {
                        const newLevel = TopicMemberGroup.LEVELS.admin;

                        await topicMemberGroupsUpdate(agent, user.id, topic.id, group.id, newLevel);

                        const tm = await TopicMemberGroup.findOne({
                            where: {
                                topicId: topic.id,
                                groupId: group.id
                            }
                        });
                        assert.equal(tm.groupId, group.id);
                        assert.equal(tm.level, TopicMemberGroup.LEVELS.admin);
                    });

                    test('Fail - Forbidden - at least admin permissions required', async function () {
                        const agent = request.agent(app);
                        const u = await userLib.createUserAndLogin(agent, null, null, null);
                        await _topicMemberGroupsUpdate(agent, u.id, topic.id, group.id, TopicMemberGroup.LEVELS.admin, 403);
                    });

                });

                suite('Delete', function () {
                    const agent = request.agent(app);
                    const email = 'test_topicmd' + new Date().getTime() + '@test.ee';
                    const password = 'testPassword123';

                    const groupName = 'Test Group for group membership test';

                    let user;
                    let group;
                    let topic;

                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;

                        group = (await groupLib.create(agent, user.id, groupName, null, null)).body.data;

                        const members = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.read
                        };

                        await topicMemberGroupsCreate(agent, user.id, topic.id, members);
                    });

                    test('Success - delete member Group', async function () {
                        await topicMemberGroupsDelete(agent, user.id, topic.id, group.id);
                        const count = await TopicMemberGroup.count({
                            where: {
                                topicId: topic.id,
                                groupId: group.id
                            }
                        });
                        assert.equal(count, 0);
                    });

                    test('Fail - Forbidden - at least admin permissions required', async function () {
                        const agent = request.agent(app);
                        const u = await userLib.createUserAndLogin(agent, null, null, null);
                        await _topicMemberGroupsDelete(agent, u.id, topic.id, group.id, 403);
                    });

                });

            });

        });

        suite('Invites', function () {

            suite('Users', function () {
                this.timeout(15000);
                suite('Create', function () {
                    let agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite;
                    let topic;

                    setup(async function () {
                        userToInvite = await userLib.createUser(request.agent(app), null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        topic = (await topicCreate(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;
                    });

                    test('Success - 20100 - invite a single User', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const inviteCreateResult = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body;

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

                    test('Success - 20100 - invite a single User with non-existing e-mail', async function () {
                        const invitation = {
                            userId: 'topicInviteTest_' + cosUtil.randomString() + '@invitetest.com',
                            level: TopicMemberUser.LEVELS.read
                        };

                        const inviteCreateResult = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body;

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
                        assert.equal(createdInvite.level, invitation.level);
                        assert.isNotNull(createdInvite.userId);
                        assert.isNotNull(createdInvite.createdAt);
                        assert.isNotNull(createdInvite.updatedAt);

                        // Make sure the e-mail is converted to lower-case making e-mails case-insensitive - https://github.com/citizenos/citizenos-api/issues/234
                        const userCreated = await User.findOne({
                            where: {
                                id: createdInvite.userId
                            }
                        });

                        assert.equal(userCreated.email, invitation.userId.toLowerCase());
                    });

                    test('Success - 20100 - invite multiple Users - userId (uuidv4)', async function () {
                        const userToInvite2 = await userLib.createUser(request.agent(app), null, null, null);

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

                        const inviteCreateResult = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body;

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

                        const createdInviteUser1 = createdInvites.find((invite) => {
                            return invite.userId === invitation[0].userId;
                        });
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.topicId, topic.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.equal(createdInviteUser1.userId, invitation[0].userId);
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        const createdInviteUser2 = createdInvites.find((invite) => {
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
                        const userToInvite2 = await userLib.createUser(request.agent(app), null, null, null);

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

                        const createResult = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body;

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

                        const createdInviteUser1 = createdInvites.find(function (invite) { // find by level, not by id to keep the code simpler
                            return invite.level === invitation[0].level;
                        });
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.topicId, topic.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.equal(createdInviteUser1.userId, invitation[0].userId);
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        const createdInviteUser2 = createdInvites.find(function (invite) { // find by level, not by id to keep the code simpler
                            return invite.level === invitation[1].level;
                        });
                        assert.uuid(createdInviteUser2.id, 'v4');
                        assert.equal(createdInviteUser2.topicId, topic.id);
                        assert.equal(createdInviteUser2.creatorId, userCreator.id);
                        assert.equal(createdInviteUser2.userId, userToInvite2.id);
                        assert.equal(createdInviteUser2.level, invitation[1].level);
                        assert.isNotNull(createdInviteUser2.createdAt);
                        assert.isNotNull(createdInviteUser2.updatedAt);
                    });

                    test('Success - 20100 - invite multiple users, 1 existing User and one not existing User - email & email', async function () {
                        const userToInvite = await userLib.createUser(request.agent(app), 'multipleInviteTest1_' + cosUtil.randomString() + '@invitetest.com', null, null);
                        const invitation = [
                            {
                                userId: userToInvite.email,
                                level: TopicMemberUser.LEVELS.read
                            },
                            {
                                userId: 'multipleInviteTest2_' + cosUtil.randomString() + '@invitetest.com',
                                level: TopicMemberUser.LEVELS.edit
                            }
                        ];

                        const inviteCreateResult = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body;

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

                        const createdInviteUser1 = createdInvites.find((i) => {return i.level === invitation[0].level}); // find by level, not by id to keep the code simpler
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.topicId, topic.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.uuid(createdInviteUser1.userId, 'v4');
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        // Make sure the e-mail is converted to lower-case making e-mails case-insensitive - https://github.com/citizenos/citizenos-api/issues/234
                        const userInvited1 = await User.findOne({
                            where: {
                                id: createdInviteUser1.userId
                            }
                        });

                        assert.equal(userInvited1.email, invitation[0].userId.toLowerCase());

                        const createdInviteUser2 = createdInvites.find((i) => {return i.level === invitation[1].level}); // find by level, not by id to keep the code simpler
                        assert.uuid(createdInviteUser2.id, 'v4');
                        assert.equal(createdInviteUser2.topicId, topic.id);
                        assert.equal(createdInviteUser2.creatorId, userCreator.id);
                        assert.uuid(createdInviteUser2.userId, 'v4');
                        assert.equal(createdInviteUser2.level, invitation[1].level);
                        assert.isNotNull(createdInviteUser2.createdAt);
                        assert.isNotNull(createdInviteUser2.updatedAt);

                        // Make sure the e-mail is converted to lower-case making e-mails case-insensitive - https://github.com/citizenos/citizenos-api/issues/234
                        const userInvited2 = await User.findOne({
                            where: {
                                id: createdInviteUser2.userId
                            }
                        });

                        assert.equal(userInvited2.email, invitation[1].userId.toLowerCase());
                    });

                    test('Fail - 40001 - Invite yourself', async function () {
                        const invitation = {
                            userId: userCreator.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const inviteCreateResult = (await _topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation, null, 400)).body;

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

                        const inviteCreateResult = (await _topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation, null, 400)).body;

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

                        const inviteCreateResult1 = (await _topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, '{asdasdas', null, 400)).body;

                        assert.deepEqual(inviteCreateResult1, expectedResponseBody);

                        const inviteCreateResult2 = (await _topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, 'PPPasdasdas', null, 400)).body;

                        assert.deepEqual(inviteCreateResult2, expectedResponseBody);
                    });

                    test('Fail - 40000 - Maximum user limit reached', async function () {
                        const invitation = [];
                        let i = 0;
                        while (i < 51) {
                            invitation.push({
                                userId: cosUtil.randomString() + '@test.com',
                                level: TopicMemberUser.LEVELS.edit
                            });
                            i++;
                        }


                        const createResult = (await _topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation, null, 400)).body;

                        assert.deepEqual(
                            createResult.status,
                            {
                                code: 40000,
                                message: "Maximum user limit reached"
                            }
                        );
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _topicInviteUsersCreate(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', topic.id, [], null, 401);
                    });

                    test('Fail - 40300 - at least admin permissions required', async function () {
                        const agentInvalidUser = request.agent(app);
                        const invalidUser = await userLib.createUserAndLogin(agentInvalidUser, null, null, null);

                        await _topicInviteUsersCreate(agentInvalidUser, invalidUser.id, topic.id, [], null, 403);
                    });

                    test('Fail - 40300 - topic is closed', async function () {
                        const invitation = [
                            {
                                userId: userToInvite.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];
                        await topicUpdateStatus(agentCreator, userCreator.id, topic.id, Topic.STATUSES.closed);

                        await _topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation, null, 403);
                    });
                });

                suite('Read', function () {
                    const agentCreator = request.agent(app);
                    const agentUserToInvite = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let topic;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUserAndLogin(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicCreate(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;
                    });

                    test('Success - 20000 - existing User by user ID', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];

                        const inviteRead = (await topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated.id)).body.data;

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
                            email: userToInvite.email
                        };

                        assert.deepEqual(inviteRead, expectedInvite);
                    });

                    test('Success - 20000 - Multiple invites last one counts', async function () {
                        const invitation1 = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.admin
                        };

                        const invitation2 = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const topicInviteCreated1 = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation1)).body.data.rows[0];
                        const topicInviteCreated2 = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation2)).body.data.rows[0];

                        const inviteRead1 = (await topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated1.id)).body.data;
                        const inviteRead2 = (await topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated2.id)).body.data;

                        const expectedInvite = Object.assign({}, topicInviteCreated2); // Clone

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
                            email: userToInvite.email
                        };

                        assert.deepEqual(inviteRead1, expectedInvite);
                        assert.deepEqual(inviteRead2, expectedInvite);
                    });

                    test('Success - 20001 - Invite has been deleted (accepted), but User has access', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];

                        const topicMemberUser = (await topicInviteUsersAccept(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id)).body.data;

                        assert.equal(topicMemberUser.topicId, topic.id);
                        assert.equal(topicMemberUser.userId, userToInvite.id);
                        assert.equal(topicMemberUser.level, topicInviteCreated.level);
                        assert.property(topicMemberUser, 'createdAt');
                        assert.property(topicMemberUser, 'updatedAt');
                        assert.property(topicMemberUser, 'deletedAt');

                        const inviteReadResult = (await topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated.id)).body;
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
                            email: userToInvite.email
                        };

                        const expectedInviteResult = {
                            status: {
                                code: 20001
                            },
                            data: expectedInvite
                        };

                        assert.deepEqual(inviteReadResult, expectedInviteResult);
                    });

                    test('Success - 20002 - NOT existing User by e-mail', async function () {
                        const invitation = {
                            userId: `topics_invites_users_test_20002_${new Date().getTime()}@citizenostest.com`,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];

                        const inviteRead = (await topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated.id)).body;

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
                            id: topicInviteCreated.userId,
                            email: invitation.userId // in the invite userId is e-mail
                        };

                        const bodyExpected = {
                            status: {
                                code: 20002
                            },
                            data: expectedInvite
                        };

                        assert.deepEqual(inviteRead, bodyExpected);
                    });

                    test('Fail - 40400 - Not found', async function () {
                        await _topicInviteUsersRead(request.agent(app), topic.id, 'f4bb46b9-87a1-4ae4-b6df-c2605ab8c471', 404);
                    });

                    test('Fail - 41001 - Deleted', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];

                        await TopicInviteUser
                            .destroy({
                                where: {
                                    id: topicInviteCreated.id
                                }
                            });

                        const topicInviteRead = (await _topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41001,
                                message: 'The invite has been deleted'
                            }
                        };

                        assert.deepEqual(topicInviteRead, expectedBody);
                    });

                    test('Fail - 41002 - Expired', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        const topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];

                        await TopicInviteUser
                            .update(
                                {
                                    expiresAt: db.literal(`NOW()`)
                                },
                                {
                                    where: {
                                        id: topicInviteCreated.id
                                    }
                                }
                            );

                        const topicInviteRead = (await _topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41002,
                                message: `The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`
                            }
                        };

                        assert.deepEqual(topicInviteRead, expectedBody);

                    });

                });

                suite('Update', function () {
                    const agentCreator = request.agent(app);
                    const agentUserToInvite = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let topic;
                    let topicInviteCreated;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUserAndLogin(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicCreate(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20000', async function () {
                        const inviteUpdate = (await topicInviteUsersUpdate(agentCreator, userCreator.id, topic.id, topicInviteCreated.id, TopicMemberUser.LEVELS.admin)).body;

                        const expectedBody = {
                            status: {
                                code: 20000
                            }
                        };
                        assert.deepEqual(inviteUpdate, expectedBody);

                        const inviteRead = (await topicInviteUsersRead(request.agent(app), topic.id, topicInviteCreated.id)).body.data;
                        const expectedInvite = Object.assign({}, topicInviteCreated); // Clone

                        expectedInvite.level = TopicMemberUser.LEVELS.admin;
                        expectedInvite.updatedAt = inviteRead.updatedAt;
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
                            email: userToInvite.email
                        };

                        assert.deepEqual(inviteRead, expectedInvite);
                    });

                    test('Fail - 40100', async function () {
                        const inviteUpdate = (await _topicInviteUsersUpdate(request.agent(app), userCreator.id, topic.id, topicInviteCreated.id, TopicMemberUser.LEVELS.admin, 401)).body;

                        const expectedBody = {
                            status: {
                                code: 40100,
                                message: "Unauthorized"
                            }
                        };
                        assert.deepEqual(inviteUpdate, expectedBody);
                    });

                    test('Fail - 40000', async function () {
                        const inviteUpdate = (await _topicInviteUsersUpdate(agentCreator, userCreator.id, topic.id, topicInviteCreated.id, 'nonvalid', 400)).body;

                        const expectedBody = {
                            status: {
                                code: 40000,
                                message: "Invalid level \"nonvalid\""
                            }
                        };
                        assert.deepEqual(inviteUpdate, expectedBody);
                    });
                });

                suite('List', function () {
                    const agentCreator = request.agent(app);
                    const userToInvite1Agent = request.agent(app);

                    let userCreator;
                    let userToInvite1;
                    let userToInvite2;

                    let topic;

                    let topicInviteCreated1;
                    let topicInviteCreated2;
                    let topicInviteCreated3;
                    let topicInviteCreated4;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        userToInvite1 = await userLib.createUserAndLogin(userToInvite1Agent, null, null, null);
                        userToInvite2 = await userLib.createUser(request.agent(app), null, null, null);

                        topic = (await topicCreate(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;

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

                        topicInviteCreated1 = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, topicInvite11)).body.data.rows[0];
                        topicInviteCreated2 = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, topicInvite12)).body.data.rows[0];
                        topicInviteCreated3 = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, topicInvite21)).body.data.rows[0];
                        topicInviteCreated4 = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, topicInvite22)).body.data.rows[0];

                        // Expire an invite
                        await TopicInviteUser
                            .update(
                                {
                                    expiresAt: db.literal(`NOW()`)
                                },
                                {
                                    where: {
                                        id: topicInviteCreated4.id
                                    }
                                }
                            );
                    });

                    test('Success - 20000 - 3 invites - 2 to same person with different level lastone is stored, last to other expired', async function () {
                        const invitesListResult = (await topicInviteUsersList(agentCreator, userCreator.id, topic.id, 'level', 'DESC')).body.data;
                        assert.equal(1, invitesListResult.count);
                        const invitesList = invitesListResult.rows;
                        assert.equal(invitesList[0].level, TopicMemberUser.LEVELS.admin);
                        assert.isArray(invitesList);
                        assert.equal(1, invitesList.length);

                        // Make sure the deleted invite is not in the result
                        assert.isUndefined(invitesList.find(invite => {
                            return invite.id === topicInviteCreated3.id
                        }));

                        // Make sure the double invites are both present
                        // The list result has User object, otherwise the objects should be equal
                        assert.isUndefined(invitesList.find(invite => {
                            return invite.id === topicInviteCreated1.id
                        }));

                        // The list result has User object, otherwise the objects should be equal
                        const inviteListInvite2 = invitesList.find(invite => {
                            return invite.id === topicInviteCreated2.id
                        });
                        const inviteListInivteUser2 = inviteListInvite2.user;
                        assert.equal(inviteListInivteUser2.id, userToInvite1.id);
                        assert.equal(inviteListInivteUser2.name, userToInvite1.name);
                        assert.property(inviteListInivteUser2, 'imageUrl');
                        // Exra User info for ADMIN -  https://github.com/citizenos/citizenos-fe/issues/670
                        delete inviteListInvite2.user;

                        assert.deepEqual(inviteListInvite2, topicInviteCreated2);
                    });

                    test('Success - 20000 - NOT ADMIN member MUST NOT see extended User info (email, pid, phoneNumber) - https://github.com/citizenos/citizenos-fe/issues/670', async function () {
                        await topicInviteUsersAccept(userToInvite1Agent, userToInvite1.id, topic.id, topicInviteCreated2.id);

                        const invitesListResult = (await topicInviteUsersList(userToInvite1Agent, userToInvite1.id, topic.id)).body.data;
                        invitesListResult.rows.forEach(function (invite) {
                            assert.notProperty(invite.user, 'email');
                            assert.notProperty(invite.user, 'pid');
                            assert.notProperty(invite.user, 'phoneNumber');
                        });
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _topicInviteUsersList(request.agent(app), '93857ed7-a81a-4187-85de-234f6d06b011', topic.id, null, null, 401);
                    });

                    test('Fail - 40300 - at least read permissions required', async function () {
                        await userLib.createUserAndLogin(agentCreator, null, null, null);
                        await _topicInviteUsersList(agentCreator, userCreator.id, topic.id, null, null, 403);
                    });

                });

                suite('Delete', function () {

                    const agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let topic;
                    let topicInviteCreated;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUser(request.agent(app), null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        topic = (await topicCreate(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>', null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.read
                        };

                        topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20000', async function () {
                        const userDeleteResult = (await topicInviteUsersDelete(agentCreator, userCreator.id, topic.id, topicInviteCreated.id)).body;

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
                        const userDeleteResult = (await _topicInviteUsersDelete(agentCreator, userCreator.id, topic.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 404)).body;

                        const expectedBody = {
                            status: {
                                code: 40401,
                                message: 'Invite not found'
                            }
                        };

                        assert.deepEqual(userDeleteResult, expectedBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _topicInviteUsersDelete(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', topic.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 401);
                    });

                    test('Fail - 40300 - at least admin permissions required', async function () {
                        const agentInvalidUser = request.agent(app);
                        const invalidUser = await userLib.createUserAndLogin(agentInvalidUser, null, null, null);

                        await _topicInviteUsersDelete(agentInvalidUser, invalidUser.id, topic.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 403);
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
                        userToInvite = await userLib.createUserAndLogin(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        topic = (await topicCreate(agentCreator, userCreator.id, null, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST ACCEPT</h2></body></html>', null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: TopicMemberUser.LEVELS.edit
                        };

                        topicInviteCreated = (await topicInviteUsersCreate(agentCreator, userCreator.id, topic.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20100 - New member created', async function () {
                        const topicMemberUser = (await topicInviteUsersAccept(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id)).body.data;

                        assert.equal(topicMemberUser.topicId, topic.id);
                        assert.equal(topicMemberUser.userId, userToInvite.id);
                        assert.equal(topicMemberUser.level, topicInviteCreated.level);
                        assert.property(topicMemberUser, 'createdAt');
                        assert.property(topicMemberUser, 'updatedAt');
                        assert.property(topicMemberUser, 'deletedAt');
                    });

                    test('Success - 20000 - User already a Member, but re-accepts an Invite', async function () {
                        await topicInviteUsersAccept(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id);
                        const topicMemberUser = (await _topicInviteUsersAccept(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id, 200)).body.data;

                        assert.equal(topicMemberUser.topicId, topic.id);
                        assert.equal(topicMemberUser.userId, userToInvite.id);
                        assert.equal(topicMemberUser.level, topicInviteCreated.level);
                        assert.property(topicMemberUser, 'createdAt');
                        assert.property(topicMemberUser, 'updatedAt');
                        assert.property(topicMemberUser, 'deletedAt');
                    });

                    test('Fail - 40400 - Cannot accept deleted invite', async function () {
                        await topicInviteUsersDelete(agentCreator, userCreator.id, topic.id, topicInviteCreated.id);
                        await _topicInviteUsersAccept(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id, 404);
                    });

                    test('Fail - 41002 - Cannot accept expired invite', async function () {
                        await TopicInviteUser
                            .update(
                                {
                                    expiresAt: db.literal(`NOW()`)
                                },
                                {
                                    where: {
                                        id: topicInviteCreated.id
                                    }
                                }
                            );

                        const acceptResult = (await _topicInviteUsersAccept(agentUserToInvite, userToInvite.id, topic.id, topicInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41002,
                                message: `The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`
                            }
                        };

                        assert.deepEqual(acceptResult, expectedBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _topicInviteUsersAccept(request.agent(app), '93857ed7-a81a-4187-85de-234f6d06b011', topic.id, topicInviteCreated.id, 401);
                    });

                    test('Fail - 40300 - Forbidden - Cannot accept for someone else', async function () {
                        await _topicInviteUsersAccept(agentCreator, userToInvite.id, topic.id, topicInviteCreated.id, 403);
                    });
                });

            });

        });

        suite('Join', function () {
            const agentCreator = request.agent(app);
            const agentUser = request.agent(app);

            let creator;
            let user;

            let topic;

            suiteSetup(async function () {
                creator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                user = await userLib.createUserAndLogin(agentUser, null, null, null);
            });

            setup(async function () {
                topic = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;
            });

            test('Success - 20000 - default level (read)', async function () {
                const res = await topicJoinJoin(agentUser, topic.join.token);

                delete topic.permission;
                delete topic.pinned;
                delete topic.join;

                topic.padUrl = topic.padUrl.split('?')[0]; // Pad url will not have JWT token as the user gets read-only by default

                const expectedResult = {
                    status: {
                        code: 20000
                    },
                    data: topic
                };

                assert.deepEqual(res.body, expectedResult);

                const topicR = (await topicRead(agentUser, user.id, topic.id, null)).body.data;
                assert.equal(topicR.permission.level, TopicMemberUser.LEVELS.read);
            });

            test('Success - 20000 - non-default level (edit) with double join attempt (admin)', async function () {
                const resTopicJoinEdit = (await topicUpdateTokenJoin(agentCreator, creator.id, topic.id, TopicJoin.LEVELS.edit)).body.data;
                const resJoinEdit = await topicJoinJoin(agentUser, resTopicJoinEdit.token);

                const userActivities = (await activityLib.activitiesRead(agentUser, user.id)).body.data;
                const topicJoinActivityActual = userActivities[0].data;

                topic.padUrl = topic.padUrl.split('?')[0]; // Pad url will not have JWT token as the user gets read-only by default

                const topicJoinActivityExpected = {
                    type: 'Join',
                    actor: {
                        id: user.id,
                        type: 'User',
                        level: TopicJoin.LEVELS.edit,
                        company: user.company,
                        name: user.name
                    },
                    object: {
                        '@type': 'Topic',
                        creatorId: creator.id,
                        id: topic.id,
                        title: topic.title,
                        status: topic.status,
                        visibility: topic.visibility,
                        categories: topic.categories,
                        padUrl: topic.padUrl, // NOTE: topic.padUrl has JWT tokens etc, but we modify the url above!
                        sourcePartnerId: topic.sourcePartnerId,
                        sourcePartnerObjectId: topic.sourcePartnerObjectId,
                        endsAt: topic.endsAt,
                        hashtag: topic.hashtag,
                        createdAt: topic.createdAt,
                        updatedAt: topic.updatedAt,
                    }
                };

                assert.deepEqual(topicJoinActivityActual, topicJoinActivityExpected);

                delete topic.permission;
                delete topic.pinned;
                delete topic.join;

                const expectedResult = {
                    status: {
                        code: 20000
                    },
                    data: topic
                };

                assert.deepEqual(resJoinEdit.body, expectedResult);

                const topicR = (await topicRead(agentUser, user.id, topic.id, null)).body.data;
                assert.equal(topicR.permission.level, TopicMemberUser.LEVELS.edit);

                // Modify join token level to admin, same User tries to join, but the level should remain the same (edit)
                const resTopicJoinAdmin = (await topicUpdateTokenJoin(agentCreator, creator.id, topic.id, TopicJoin.LEVELS.admin)).body.data;
                await topicJoinJoin(agentUser, resTopicJoinAdmin.token);
                const topicReadAfterRejoin = (await topicRead(agentUser, user.id, topic.id, null)).body.data;
                assert.equal(topicReadAfterRejoin.permission.level, TopicMemberUser.LEVELS.edit);
            });

            test('Success - 20000 - User already a member, joins with a link SHOULD NOT update permissions', async function () {
                const resTopicJoinAdmin = (await topicUpdateTokenJoin(agentCreator, creator.id, topic.id, TopicJoin.LEVELS.admin)).body.data;
                await topicMemberUsersUpdate(agentCreator, creator.id, topic.id, user.id, TopicMemberUser.LEVELS.read);
                await topicJoinJoin(agentUser, resTopicJoinAdmin.token);
                const topicReadAfterJoin = (await topicRead(agentUser, user.id, topic.id, null)).body.data;

                assert.equal(topicReadAfterJoin.permission.level, TopicMemberUser.LEVELS.read);
            });

            test('Fail - 40101 - Matching token not found', async function () {
                const res = await _topicJoinJoin(agentUser, 'nonExistentToken', 400);

                const expectedResult = {
                    status: {
                        code: 40001,
                        message: 'Matching token not found'
                    }
                };
                assert.deepEqual(res.body, expectedResult);
            });

            test('Fail - 40100 - Unauthorized', async function () {
                await _topicJoinJoin(request.agent(app), topic.join.token, 401);
            });

            suite('Token', async function () {

                suite('Read', function () {

                    test('Success - 20000', async function () {
                        const topic = (await topicCreate(agentCreator, creator.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;

                        const topicJoinReadActual = (await topicJoinReadUnauth(request.agent(app), topic.join.token)).body.data;
                        const topicReadExpected = (await topicReadUnauth(request.agent(app), topic.id)).body.data;

                        assert.deepEqual(topicJoinReadActual, topicReadExpected);
                    });

                    test('Fail - 40400 - Not found - return 404 for private topic', async function () {
                        const topicJoinReadActual = (await _topicJoinReadUnauth(request.agent(app), topic.join.token, 404)).body;
                        const topicReadExpected = {
                            "status": {
                                "code": 40400,
                                "message": "Not Found"
                            }
                        };

                        assert.deepEqual(topicJoinReadActual, topicReadExpected);
                    });

                    test('Fail - 40401 - Not found - invalid token', async function () {
                        const topicJoinReadActual = (await _topicJoinReadUnauth(request.agent(app), '000000000000', 404)).body;
                        const topicReadExpected = {
                            "status": {
                                "code": 40400,
                                "message": "Not Found"
                            }
                        };

                        assert.deepEqual(topicJoinReadActual, topicReadExpected);
                    });


                });

                suite('Update', async function () {

                    test('Success - regenerate token', async function () {
                        const resData = (await topicUpdateTokenJoin(agentCreator, creator.id, topic.id, TopicJoin.LEVELS.edit)).body.data;

                        assert.match(resData.token, new RegExp('^[a-zA-Z0-9]{' + TopicJoin.TOKEN_LENGTH + '}$'));
                        assert.equal(resData.level, TopicJoin.LEVELS.edit);

                        const userActivities = (await activityLib.activitiesRead(agentCreator, creator.id)).body.data;
                        const tokenJoinUpdateActivityActual = userActivities[0].data;

                        const tokenJoinUpdateActivityExpected = {
                            "type": "Update",
                            "actor": {
                                "type": "User",
                                "id": creator.id,
                                "name": creator.name,
                                "company": creator.company
                            },
                            "object": {
                                "@type": "TopicJoin",
                                "level": topic.join.level, // previous level
                                "token": topic.join.token.replace(topic.join.token.substr(2, 8), '********'), // previous token
                                "topicId": topic.id,
                                "topicTitle": topic.title
                            },
                            "origin": {
                                "@type": "TopicJoin",
                                "level": topic.join.level, // previous level
                                "token": topic.join.token.replace(topic.join.token.substr(2, 8), '********'), // previous token
                            },
                            "result": [
                                {
                                    "op": "replace",
                                    "path": "/token",
                                    "value": resData.token.replace(resData.token.substr(2, 8), '********'), // new token
                                },
                                {
                                    "op": "replace",
                                    "path": "/level",
                                    "value": resData.level
                                }
                            ]
                        };

                        assert.deepEqual(tokenJoinUpdateActivityActual, tokenJoinUpdateActivityExpected);
                    });

                    test('Fail - 40001 - Bad request - missing required property "level"', async function () {
                        const resBody = (await _topicUpdateTokenJoin(agentCreator, creator.id, topic.id, null, 400)).body;
                        const resBodyExpected = {
                            status: {
                                code: 40001,
                                message: 'Invalid value for property "level". Possible values are read,edit,admin.'
                            }
                        };

                        assert.deepEqual(resBody, resBodyExpected);
                    });

                    test('Fail - 40100 - No permissions', async function () {
                        const resBody = (await _topicUpdateTokenJoin(agentUser, user.id, topic.id, null, 403)).body;
                        const resBodyExpected = {
                            status: {
                                code: 40300,
                                message: 'Insufficient permissions'
                            }
                        };

                        assert.deepEqual(resBody, resBodyExpected);
                    });

                    suite('Level', async function () {

                        test('Success', async function () {
                            const token = topic.join.token;

                            const resBody = (await topicUpdateTokenJoinLevel(agentCreator, creator.id, topic.id, token, TopicJoin.LEVELS.admin)).body;
                            const resBodyExpected = {
                                status: {code: 20000},
                                data: {
                                    token: token,
                                    level: TopicJoin.LEVELS.admin
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);

                            const userActivities = (await activityLib.activitiesRead(agentCreator, creator.id)).body.data;
                            const tokenJoinLevelUpdateActivityActual = userActivities[0].data;

                            const tokenJoinLevelUpdateActivityExpected = {
                                "type": "Update",
                                "actor": {
                                    "type": "User",
                                    "id": creator.id,
                                    "name": creator.name,
                                    "company": creator.company
                                },
                                "object": {
                                    "@type": "TopicJoin",
                                    "level": topic.join.level,
                                    "token": topic.join.token.replace(topic.join.token.substr(2, 8), '********'),
                                    "topicId": topic.id,
                                    "topicTitle": topic.title
                                },
                                "origin": {
                                    "@type": "TopicJoin",
                                    "level": topic.join.level,
                                    "token": topic.join.token.replace(topic.join.token.substr(2, 8), '********'),
                                },
                                "result": [
                                    {
                                        "op": "replace",
                                        "path": "/level",
                                        "value": resBody.data.level
                                    }
                                ]
                            };

                            assert.deepEqual(tokenJoinLevelUpdateActivityActual, tokenJoinLevelUpdateActivityExpected);
                        });

                        test('Fail - 40400 - Not found - invalid token', async function () {
                            const token = TopicJoin.generateToken();

                            const resBody = (await _topicUpdateTokenJoinLevel(agentCreator, creator.id, topic.id, token, TopicJoin.LEVELS.edit, 404)).body;
                            const resBodyExpected = {
                                status: {
                                    code: 40400,
                                    message: 'Nothing found for topicId and token combination.'
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);
                        });

                        test('Fail - 40001 - Bad request - missing required property "level"', async function () {
                            const resBody = (await _topicUpdateTokenJoinLevel(agentCreator, creator.id, topic.id, topic.join.token, null, 400)).body;
                            const resBodyExpected = {
                                status: {
                                    code: 40001,
                                    message: 'Invalid value for property "level". Possible values are read,edit,admin.'
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);
                        });

                        test('Fail - 40100 - No permissions', async function () {
                            const resBody = (await _topicUpdateTokenJoinLevel(agentUser, user.id, topic.id, topic.join.token, null, 403)).body;
                            const resBodyExpected = {
                                status: {
                                    code: 40300,
                                    message: 'Insufficient permissions'
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);
                        });
                    });
                });
            });

        });

        // API - /api/users/:userId/topics/:topicId/votes
        suite('Votes', function () {

            suite('Create', function () {
                const agent = request.agent(app);

                let user;
                let topic;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                });

                setup(async function () {
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                });

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

                    const description = 'Vote description';

                    const vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, null)).body.data;

                    assert.property(vote, 'id');
                    assert.equal(vote.minChoices, 1);
                    assert.equal(vote.maxChoices, 1);
                    assert.equal(vote.delegationIsAllowed, false);
                    assert.isNull(vote.endsAt);
                    assert.equal(vote.description, description);
                    assert.equal(vote.authType, Vote.AUTH_TYPES.soft);
                    assert.deepEqual(vote.autoClose, []);

                    // Topic should end up in "voting" status
                    const t = await Topic
                        .findOne({
                            where: {
                                id: topic.id
                            }
                        });
                    assert.equal(t.status, Topic.STATUSES.voting);
                });

                test('Success - multiple choice', async function () {
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

                    const description = 'Vote description';
                    const minChoices = 1;
                    const maxChoices = 2;

                    const vote = (await topicVoteCreate(agent, user.id, topic.id, options, minChoices, maxChoices, null, null, description, null, null)).body.data;

                    assert.property(vote, 'id');
                    assert.equal(vote.minChoices, minChoices);
                    assert.equal(vote.maxChoices, maxChoices);
                    assert.equal(vote.delegationIsAllowed, false);
                    assert.isNull(vote.endsAt);
                    assert.equal(vote.description, description);
                    assert.equal(vote.authType, Vote.AUTH_TYPES.soft);
                    assert.deepEqual(vote.autoClose, []);

                    // Topic should end up in "voting" status
                    const t = await Topic
                        .findOne({
                            where: {
                                id: topic.id
                            }
                        });
                    assert.equal(t.status, Topic.STATUSES.voting);
                });

                test('Success - authType === hard', async function () {
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

                    const description = 'Vote description';

                    const vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, Vote.AUTH_TYPES.hard)).body.data;

                    assert.equal(vote.authType, Vote.AUTH_TYPES.hard);

                    const voteContainerFiles = await db
                        .query(
                            `
                             SELECT
                                "mimeType",
                                "fileName"
                             FROM "VoteContainerFiles"
                             WHERE "voteId" = :voteId
                             ORDER BY "fileName"
                            `,
                            {
                                replacements: {
                                    voteId: vote.id
                                },
                                type: db.QueryTypes.SELECT,
                                raw: true,
                                nest: true
                            }
                        );

                    const expected = [
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
                });

                test('Fail - Bad Request - at least 2 vote options are required', async function () {
                    const options = [
                        {
                            value: 'Option 1'
                        }
                    ];
                    const resBody = (await _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, null, 400)).body;

                    const expectedBody = {
                        status: {
                            code: 40001,
                            message: 'At least 2 vote options are required'
                        }
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - Bad Request - authType == hard - options too similar', async function () {
                    const options = [
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

                    const description = 'Vote description';

                    const resBody = (await _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, Vote.AUTH_TYPES.hard, null, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40002,
                            message: 'Vote options are too similar'
                        }
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - Bad Request - authType == hard - usage of reserved prefix', async function () {
                    const options = [
                        {
                            value: '__Option 1'
                        },
                        {
                            value: 'Option 2'
                        }
                    ];

                    const description = 'Vote description';

                    const resBody = (await _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, description, null, Vote.AUTH_TYPES.hard, null, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40004,
                            message: 'Vote option not allowed due to usage of reserved prefix "' + VoteOption.RESERVED_PREFIX + '"'
                        }
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - Bad Request - endsAt cannot be in the past', async function () {
                    const options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 3'
                        }
                    ];

                    const dateInThePast = new Date().setDate(new Date().getDate() - 1);

                    const resBody = (await _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, dateInThePast, null, null, null, null, 400)).body;

                    const expectedBody = {
                        status: {
                            code: 40000
                        },
                        errors: {
                            endsAt: 'Voting deadline must be in the future.'
                        }
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - Bad Request - delegation is not allowed for authType = hard', async function () {
                    const options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 3'
                        }
                    ];

                    const authType = Vote.AUTH_TYPES.hard;
                    const delegationIsAllowed = true;

                    const resBody = (await _topicVoteCreate(agent, user.id, topic.id, options, null, null, delegationIsAllowed, null, null, null, authType, null, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40003,
                            message: 'Delegation is not allowed for authType "' + authType + '"'
                        }
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - Forbidden - Vote creation is allowed only if Topic status is "inProgress"', async function () {
                    const options = [
                        {
                            value: 'Option 1'
                        },
                        {
                            value: 'Option 2'
                        }
                    ];

                    // Create a vote, that will set it to "inVoting" status, thus further Vote creation should not be allowed.
                    await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null);
                    await _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, null, 403);
                });

                test('Fail - Bad Request - Vote option too long', async function () {
                    const options = [
                        {
                            value: 'This option is too long to be inserted in the database, because we have 200 character limit set. This is too long This is too long This is too long This is too long This is too long This is too long This is too long This is too long'
                        },
                        {
                            value: 'Option 3'
                        }
                    ];


                    const resBody = (await _topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, null, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40000
                        },
                        errors: {
                            value: 'Option value can be 1 to 200 characters long.'
                        }
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

            });

            suite('Read', function () {
                const agent = request.agent(app);

                const voteOptions = [
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

                const voteDescription = 'Vote description';

                let user;
                let topic;
                let vote;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                });

                setup(async function () {
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                    vote = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, null, null, voteDescription, null, null)).body.data;
                });

                test('Success', async function () {
                    const voteData = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                    assert.property(voteData, 'id');
                    assert.equal(voteData.minChoices, 1);
                    assert.equal(voteData.maxChoices, 1);
                    assert.equal(voteData.delegationIsAllowed, false);
                    assert.isNull(voteData.endsAt);
                    assert.equal(voteData.description, voteDescription);
                    assert.equal(voteData.type, Vote.TYPES.regular);
                    assert.equal(voteData.authType, Vote.AUTH_TYPES.soft);

                    const options = voteData.options;

                    assert.equal(options.count, 3);
                    assert.equal(options.rows.length, 3);

                    _(options.rows).forEach(function (o, index) {
                        assert.property(o, 'id');
                        assert.equal(o.value, voteOptions[index].value);
                    });
                });

                test('Fail - Not Found - trying to access Vote that does not belong to the Topic', async function () {
                    const topicWrong = (await topicCreate(agent, user.id, null, null, null, null, null));

                    await _topicVoteRead(agent, user.id, topicWrong.id, vote.id, 404);
                });

            });

            suite('Update', function () {

                const agent = request.agent(app);

                const voteOptions = [
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

                const voteEndsAt = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
                const voteDescription = 'Vote description';

                let user;
                let topic;
                let vote;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                });

                setup(async function () {
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                    vote = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, null, voteEndsAt, voteDescription, null, null)).body.data;
                });

                test('Success', async function () {
                    const newEndsAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
                    await topicVoteUpdate(agent, user.id, topic.id, vote.id, newEndsAt);

                    const res = await topicVoteRead(agent, user.id, topic.id, vote.id);
                    assert.equalTime(new Date(res.body.data.endsAt), newEndsAt);
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

                let toUser7;
                const agentToUser7 = request.agent(app);

                let toUser8;
                const agentToUser8 = request.agent(app);

                setup(async function () {
                    const usersCreatePromises = [
                        userLib.createUserAndLogin(agent, null, null, null),
                        userLib.createUserAndLogin(agentToUser1, null, null, 'et'),
                        userLib.createUserAndLogin(agentToUser2, null, null, 'et'),
                        userLib.createUserAndLogin(agentToUser3, null, null, 'et'),
                        userLib.createUserAndLogin(agentToUser4, null, null, null),
                        userLib.createUserAndLogin(agentToUser5, null, null, null),
                        userLib.createUserAndLogin(agentToUser6, null, null, null),
                        userLib.createUserAndLogin(agentToUser7, null, null, null),
                        userLib.createUserAndLogin(agentToUser8, null, null, null)
                    ];

                    [user, toUser1, toUser2, toUser3, toUser4, toUser5, toUser6, toUser7, toUser8] = await Promise.all(usersCreatePromises);
                });

                suite('Create', function () {

                    test('Success - OK - new delegation', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, topicVoteCreated.id)).body.data;
                        const members = [
                            {
                                topicId: topic.id,
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.topicMemberUsersCreate(topic.id, members);
                        await topicVoteDelegationCreate(agent, user.id, topic.id, voteRead.id, toUser1.id);
                        const voteReadAfterDelegation = (await topicVoteRead(agent, user.id, topic.id, voteRead.id)).body.data;

                        assert.deepEqual(voteReadAfterDelegation.delegation, toUser1.toJSON());
                    });

                    test('Success - OK - change delegation', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

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
                        await memberLib.topicMemberUsersCreate(topic.id, members);

                        await topicVoteDelegationCreate(agent, user.id, topic.id, voteRead.id, toUser1.id); // 1st delegation
                        await topicVoteDelegationCreate(agent, user.id, topic.id, voteRead.id, toUser2.id); // Change the delegation

                        const voteReadAfterDelegation = (await topicVoteRead(agent, user.id, topic.id, voteRead.id)).body.data;

                        assert.deepEqual(voteReadAfterDelegation.delegation, toUser2.toJSON());
                    });

                    test('Success - OK - count delegated votes and not delegated votes - Delegation chain U->U1->U2->U3, U4->U5 U7->U5, U6 no delegation', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
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
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

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
                            },
                            {
                                userId: toUser7.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.topicMemberUsersCreate(topic.id, members);

                        await topicVoteVote(agent, user.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[0].id}], null, null, null, null);

                        const delegationPromises = [
                            topicVoteDelegationCreate(agent, user.id, topic.id, voteRead.id, toUser1.id),
                            topicVoteDelegationCreate(agentToUser1, toUser1.id, topic.id, voteRead.id, toUser2.id),
                            topicVoteDelegationCreate(agentToUser2, toUser2.id, topic.id, voteRead.id, toUser3.id),
                            topicVoteDelegationCreate(agentToUser4, toUser4.id, topic.id, voteRead.id, toUser5.id),
                            topicVoteDelegationCreate(agentToUser7, toUser7.id, topic.id, voteRead.id, toUser5.id)
                        ];
                        await Promise.all(delegationPromises);

                        const votePromises = [
                            topicVoteVote(agentToUser3, toUser3.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[0].id}], null, null, null, null),
                            topicVoteVote(agentToUser6, toUser6.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[1].id}], null, null, null, null)
                        ];
                        await Promise.all(votePromises);

                        const voteReadAfterVote = (await topicVoteRead(agentToUser6, toUser6.id, topic.id, voteRead.id)).body.data;
                        assert.equal(voteReadAfterVote.votersCount, 5);

                        await topicVoteVote(agentToUser5, toUser5.id, topic.id, voteRead.id, [{optionId: voteRead.options.rows[1].id}], null, null, null, null);

                        const voteReadAfterVote2 = (await topicVoteRead(agentToUser6, toUser6.id, topic.id, voteRead.id)).body.data;
                        assert.equal(voteReadAfterVote2.votersCount, 8);
                        const voteReadAfterVoteOptions = voteReadAfterVote2.options.rows;

                        voteReadAfterVoteOptions.forEach(function (option) {
                            switch (option.id) {
                                case voteRead.options.rows[0].id:
                                    assert.equal(option.voteCount, 4);
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[1].id:
                                    assert.equal(option.voteCount, 2 + 1 + 1);
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

                    test('Success - OK - multiple choice - delegated votes and not delegated votes - Delegation chain U->U1->U2->U3, U4->U6 U5->U6, U7->U5, U8 no delegation', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
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
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, 2, 3, true, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, topicVoteCreated.id)).body.data;
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
                            },
                            {
                                userId: toUser7.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                            ,
                            {
                                userId: toUser8.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];
                        await memberLib.topicMemberUsersCreate(topic.id, members);

                        const voteList1 = [ // Will be overwritten by delegation
                            {
                                optionId: voteRead.options.rows[0].id
                            },
                            {
                                optionId: voteRead.options.rows[3].id
                            }
                        ];
                        await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null);

                        const delegationPromises = [
                            topicVoteDelegationCreate(agent, user.id, topic.id, voteRead.id, toUser1.id),
                            topicVoteDelegationCreate(agentToUser1, toUser1.id, topic.id, voteRead.id, toUser2.id),
                            topicVoteDelegationCreate(agentToUser2, toUser2.id, topic.id, voteRead.id, toUser3.id),
                            topicVoteDelegationCreate(agentToUser4, toUser4.id, topic.id, voteRead.id, toUser6.id),
                            topicVoteDelegationCreate(agentToUser5, toUser5.id, topic.id, voteRead.id, toUser6.id),
                            topicVoteDelegationCreate(agentToUser7, toUser7.id, topic.id, voteRead.id, toUser5.id)
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

                        const voteListUser6 = [
                            {
                                optionId: voteRead.options.rows[1].id,
                            },
                            {
                                optionId: voteRead.options.rows[2].id
                            }
                        ];

                        const voteListUser8 = [ // 1 (U8)
                            {
                                optionId: voteRead.options.rows[1].id
                            },
                            {
                                optionId: voteRead.options.rows[3].id
                            }
                        ];

                        const votePromises = [
                            topicVoteVote(agentToUser3, toUser3.id, topic.id, voteRead.id, voteListUser3, null, null, null, null),
                            topicVoteVote(agentToUser6, toUser6.id, topic.id, voteRead.id, voteListUser6, null, null, null, null),
                            topicVoteVote(agentToUser8, toUser8.id, topic.id, voteRead.id, voteListUser8, null, null, null, null)
                        ];
                        await Promise.all(votePromises);

                        const voteReadAfterVote = (await topicVoteRead(agentToUser8, toUser8.id, topic.id, voteRead.id)).body.data;
                        const voteReadAfterVoteOptions = voteReadAfterVote.options.rows;

                        voteReadAfterVoteOptions.forEach(function (option) {
                            switch (option.id) {
                                case voteRead.options.rows[0].id:
                                    assert.equal(option.voteCount, 3 + 1); // U->U1->U2->U3
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[1].id:
                                    assert.equal(option.voteCount, (3 + 1) + (2 + 1 + 1) + 1); // U->U1->U2->U3, U4->U6 U5->U6, U7->U5, U8
                                    assert.isTrue(option.selected);
                                    break;
                                case voteRead.options.rows[2].id:
                                    assert.equal(option.voteCount, (1 + 1 + 1 + 1)); // U4->U6 U5->U6 U7->U5
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[3].id:
                                    assert.equal(option.voteCount, 1); // U8
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

                        await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList3, null, null, null, null);

                        const voteReadAfterVoteForOverride = (await topicVoteRead(agent, user.id, topic.id, voteRead.id)).body.data;
                        const voteReadAfterVoteForOverrideOptions = voteReadAfterVoteForOverride.options.rows;
                        assert.equal(voteReadAfterVoteForOverride.votersCount, 9);

                        voteReadAfterVoteForOverrideOptions.forEach(function (option) {
                            switch (option.id) {
                                case voteRead.options.rows[0].id:
                                    assert.equal(option.voteCount, 2 + 1); // U1->U2->U3
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[1].id:
                                    assert.equal(option.voteCount, (2 + 1) + (2 + 1 + 1) + 1); // U->U1->U2->U3, U4->U6 U5->U6 U7->U5, U8
                                    assert.notProperty(option, 'selected');
                                    break;
                                case voteRead.options.rows[2].id:
                                    assert.equal(option.voteCount, (2 + 1 + 1) + 1); // U4->U6 U5->U6 U7-> U5, U
                                    assert.isTrue(option.selected);
                                    break;
                                case voteRead.options.rows[3].id:
                                    assert.equal(option.voteCount, 1); // U8
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
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;

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

                        await memberLib.topicMemberUsersCreate(topic.id, members);

                        await topicVoteDelegationCreate(agent, user.id, topic.id, topicVoteCreated.id, toUser1.id);
                        await topicVoteDelegationCreate(agentToUser1, toUser1.id, topic.id, topicVoteCreated.id, toUser2.id);
                        const responseDelegation = (await _topicVoteDelegationCreate(agentToUser2, toUser2.id, topic.id, topicVoteCreated.id, user.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40000,
                                message: 'Sorry, you cannot delegate your vote to this person.'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test('Fail - 40001 - Cannot delegate to self', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;

                        const responseDelegation = (await _topicVoteDelegationCreate(agent, user.id, topic.id, topicVoteCreated.id, user.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40001,
                                message: 'Cannot delegate to self.'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test('Fail - 40002 - Cannot delegate Vote to User who does not have access to this Topic', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        const userWithNoAccess = await userLib.createUser(request.agent(app), null, null, null);

                        const responseDelegation = (await _topicVoteDelegationCreate(agent, user.id, topic.id, topicVoteCreated.id, userWithNoAccess.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40002,
                                message: 'Cannot delegate Vote to User who does not have access to this Topic.'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test('Fail - 40300 - delegation is only allowed when voting is in progress', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.closed);

                        const responseDelegation = (await _topicVoteDelegationCreate(agent, user.id, topic.id, topicVoteCreated.id, toUser1.id, 403)).body;

                        const responseExpected = {
                            status: {
                                code: 40300,
                                message: 'Insufficient permissions'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });

                    test('Fail - Bad Request - delegation is not allowed for the Vote', async function () {
                        const topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, topicVoteCreated.id)).body.data;
                        const members = [
                            {
                                topicId: topic.id,
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.topicMemberUsersCreate(topic.id, members);
                        const responseDelegation = (await _topicVoteDelegationCreate(agent, user.id, topic.id, voteRead.id, toUser1.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40000,
                                message: 'Bad request'
                            }
                        };

                        assert.deepEqual(responseDelegation, responseExpected);
                    });
                });

                suite('Delete', function () {
                    let topic;
                    let vote;

                    setup(async function () {
                        topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        vote = (await topicVoteRead(agent, user.id, topic.id, topicVoteCreated.id)).body.data;

                        const members = [
                            {
                                userId: toUser1.id,
                                level: TopicMemberUser.LEVELS.read
                            }
                        ];
                        await memberLib.topicMemberUsersCreate(topic.id, members);
                        await topicVoteDelegationCreate(agent, user.id, topic.id, vote.id, toUser1.id);
                    });

                    test('Success', async function () {
                        await topicVoteDelegationDelete(agent, user.id, topic.id, vote.id);
                        const topicVoteReadAfterDelegationDelete = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

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

                        const responseDelegationDelete = (await _topicVoteDelegationDelete(agent, user.id, topic.id, vote.id, 400)).body;

                        const responseExpected = {
                            status: {
                                code: 40001,
                                message: 'The Vote has ended.'
                            }
                        };

                        assert.deepEqual(responseDelegationDelete, responseExpected);
                    });

                    test('Fail - Forbidden - Voting has ended (Topic.status != voting), cannot delete delegation', async function () {
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp);

                        const responseDelegationDelete = (await _topicVoteDelegationDelete(agent, user.id, topic.id, vote.id, 403)).body;

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
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    user2 = await userLib.createUserAndLogin(agent2, null, null, 'et');
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                    topicPublic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
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

                        const vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                        const voteList = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];
                        await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, null, null, null);
                        const voteReadAfterVote = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                        _(voteList).forEach(function (voteOption) {
                            const option = voteReadAfterVote.options.rows.find((o) => {return o.id === voteOption.optionId});
                            assert.equal(option.voteCount, 1);
                        });
                    });

                    test('Success - auto close', async function () {
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

                        const vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, [{value: 'allMembersVoted'}])).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                        const voteList = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];
                        await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, null, null, null, 205);
                        const voteReadAfterVote = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                        voteList.forEach((voteOption) => {
                            const option = voteReadAfterVote.options.rows.find((vo) => { return vo.id === voteOption.optionId});
                            assert.equal(option.voteCount, 1);
                        });
                        assert.closeTo(new Date(voteReadAfterVote.endsAt).getTime(), new Date().getTime(), 1000);
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

                        const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows.find((o) => {return o.value === options[0].value}).id
                            },
                            {
                                optionId: voteRead.options.rows.find((o) => {return o.value === options[1].value}).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList1, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        _(voteList1).forEach(function (voteOption) {
                            const option = voteReadAfterVote1.options.rows.find((o) => {return o.id === voteOption.optionId});
                            assert.equal(option.voteCount, 1);
                        });

                        // Vote for the 2nd time, change your vote, by choosing 1
                        const voteList2 = [
                            {
                                optionId: voteCreated.options.rows.find((o) => {return o.value === options[1].value}).id
                            },
                            {
                                optionId: voteCreated.options.rows.find((o) => {return o.value === options[2].value}).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList2, null, null, null, null);
                        const voteReadAfterVote2 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

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
                        const optionOverwritten = voteReadAfterVote2.options.rows.find((o) => {return o.id === voteList1[0].optionId});
                        assert.notProperty(optionOverwritten, 'voteCount');
                        assert.notProperty(optionOverwritten, 'selected');

                        // Verify the result of topic information, see that vote result is the same
                        const topicReadAfterVote = (await topicRead(agent, user.id, topic.id, ['vote'])).body.data;
                        assert.deepEqual(topicReadAfterVote.vote, voteReadAfterVote2);
                    });

                    test('Success - multiple choice - vote Veto', async function () {
                        const options = [
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
                                value: 'Veto'
                            }
                        ];

                        const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 2, 3, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList = [
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                            },
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[3].value}).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        const option1 = _.find(voteReadAfterVote1.options.rows, {id: voteList[0].optionId});
                        const option2 = _.find(voteReadAfterVote1.options.rows, {id: voteList[1].optionId});
                        assert.notProperty(option1, 'voteCount');
                        assert.equal(option2.voteCount, 1);
                        assert.equal(option2.value, 'Veto');
                    });

                    test('Success - multiple choice - vote Neutral', async function () {
                        const options = [
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
                                value: 'Neutral'
                            }
                        ];

                        const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 2, 3, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList = [
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                            },
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[3].value}).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        const option1 = _.find(voteReadAfterVote1.options.rows, {id: voteList[0].optionId});
                        const option2 = _.find(voteReadAfterVote1.options.rows, {id: voteList[1].optionId});
                        assert.notProperty(option1, 'voteCount');
                        assert.equal(option2.voteCount, 1);
                        assert.equal(option2.value, 'Neutral');
                    });

                    test('Success - multiple choice - vote Neutral and Veto', async function () {
                        const options = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            },
                            {
                                value: 'Veto'
                            },
                            {
                                value: 'Neutral'
                            }
                        ];

                        const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 2, 3, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList = [
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[2].value}).id
                            },
                            {
                                optionId: _.find(voteRead.options.rows, {value: options[3].value}).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        const option1 = _.find(voteReadAfterVote1.options.rows, {id: voteList[0].optionId});
                        const option2 = _.find(voteReadAfterVote1.options.rows, {id: voteList[1].optionId});

                        assert.equal(option1.value, 'Veto');
                        assert.equal(option2.value, 'Neutral');
                        if (option1.voteCount) { //Only one option goes through as final vote
                            assert.equal(option1.voteCount, 1);
                            assert.notProperty(option2, 'voteCount');
                        }
                        if (option2.voteCount) {
                            assert.equal(option2.voteCount, 1);
                            assert.notProperty(option1, 'voteCount');
                        }
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


                        const vote = (await topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topicPublic.id, vote.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];

                        await topicVoteVote(agent2, user2.id, topicPublic.id, vote.id, voteList1, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent2, user2.id, topicPublic.id, vote.id)).body.data;

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
                        const topicWrong = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
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

                        const topicVoteWrong = (await topicVoteCreate(agent, user.id, topicWrong.id, options, null, null, null, null, null, null, null)).body.data;
                        const topicVoteRight = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null)).body.data;
                        const topicVoteReadRight = (await topicVoteRead(agent, user.id, topic.id, topicVoteRight.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: topicVoteReadRight.options.rows[0].id
                            }
                        ];

                        // Try out wrong topicId & voteId combos
                        await _topicVoteVote(agent, user.id, topicWrong.id, topicVoteRight.id, voteList1, null, null, null, null, 404);
                        await _topicVoteVote(agent, user.id, topic.id, topicVoteWrong.id, voteList1, null, null, null, null, 404);
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


                        const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 1, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            },
                            {
                                optionId: voteRead.options.rows[1].id
                            }
                        ];

                        const voteResult = (await _topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null, 400)).body;
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


                        const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 2, 2, false, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];

                        const voteResult = (await _topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null, 400)).body;
                        const voteResultExpected = {
                            status: {
                                code: 40000,
                                message: 'The options must be an array of minimum 2 and maximum 2 options.'
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

                        const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 1, false, new Date(), null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];

                        const voteResult = (await _topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, null, null, null, 400)).body;
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

                        const voteCreated = (await topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, null)).body.data;
                        const voteRead = (await topicVoteRead(agent, user.id, topicPublic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];

                        // Log out the user
                        await authLib.logout(agent2);

                        const voteResult = (await _topicVoteVote(agent2, user2.id, topicPublic.id, voteRead.id, voteList1, null, null, null, null, 401)).body;
                        const voteResultExpected = {
                            status: {
                                code: 40100,
                                message: 'Unauthorized'
                            }
                        };

                        assert.deepEqual(voteResult, voteResultExpected);
                    });

                    test('Fail - Bad Request - option id does not belong to the Vote', async function () {
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

                        const vote1 = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null)).body.data;
                        const vote2 = (await topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, null)).body.data;
                        const voteRead2 = (await topicVoteRead(agent, user.id, topicPublic.id, vote2.id)).body.data;

                        const voteList = [
                            {
                                optionId: voteRead2.options.rows[0].id
                            }
                        ];
                        const voteResult = (await _topicVoteVote(agent, user.id, topic.id, vote1.id, voteList, null, null, null, null, 400)).body;

                        const voteResultExpected = {
                            status: {
                                code: 40000,
                                message: 'Invalid option'
                            }
                        };
                        assert.deepEqual(voteResult, voteResultExpected);
                    });

                });

                suite('authType === hard', function () {
                    this.timeout(10000); //eslint-disable-line no-invalid-this

                    suite('ID-card', function () {

                        suite('Init', function () {
                            let vote;
                            let vote2;

                            setup(async function () {
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
                                vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                                vote2 = (await topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            });

                            teardown(async function () {
                                await UserConnection
                                    .destroy({
                                        where: {
                                            connectionId: UserConnection.CONNECTION_IDS.esteid,
                                            connectionUserId: ['PNOEE-37101010021']
                                        },
                                        force: true
                                    });
                            });

                            test('Success', async function () {
                                const voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];

                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString(); //eslint-disable-line no-sync
                                const res = await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, certificate, null, null, null);
                                const status = res.body.status;
                                const data = res.body.data;

                                assert.deepEqual(status, {code: 20001});
                                assert.property(data, 'signedInfoDigest');
                                assert.isTrue(data.signedInfoDigest.length > 0);
                            });

                            test('Success - unauth', async function () {
                                const reqAgent = request.agent(app);
                                const voteList = [
                                    {
                                        optionId: vote2.options.rows[0].id
                                    }
                                ];

                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString(); //eslint-disable-line no-sync
                                const res = await topicVoteVoteUnauth(reqAgent, topicPublic.id, vote2.id, voteList, certificate, null, null, null);
                                const status = res.body.status;
                                const data = res.body.data;

                                assert.deepEqual(status, {code: 20001});
                                assert.property(data, 'signedInfoDigest');
                                assert.isTrue(data.signedInfoDigest.length > 0);
                            });

                            test('Fail - unauth - topic is private', async function () {
                                const reqAgent = request.agent(app);
                                const voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];

                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString(); //eslint-disable-line no-sync
                                const status = (await _topicVoteVoteUnauth(reqAgent, topic.id, vote.id, voteList, certificate, null, null, null, 401)).body.status;

                                assert.deepEqual(status, {
                                    code: 40100,
                                    message: 'Unauthorized'
                                });
                            });

                            test('Fail - 40009 - authType === hard - missing user certificate', async function () {
                                const voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];

                                const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, null, null, null, 400)).body;
                                const expectedBody = {
                                    status: {
                                        code: 40009,
                                        message: 'Vote with hard authentication requires users certificate when signing with ID card OR phoneNumber+pid when signing with mID'
                                    }
                                };

                                assert.deepEqual(resBody, expectedBody);
                            });

                            test('Fail - 40031 - User account already connected to another PID.', async function () {
                                const voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];
                                await UserConnection
                                    .create({
                                            userId: user.id,
                                            connectionId: UserConnection.CONNECTION_IDS.esteid,
                                            connectionUserId: 'PNOEE-19101010021'
                                    });
                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString(); //eslint-disable-line no-sync
                                const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, certificate, null, null, null, 400)).body;
                                const expectedBody = {
                                    status: {
                                        code: 40031,
                                        message: "User account already connected to another PID."
                                    }
                                }
                                assert.deepEqual(resBody, expectedBody);
                            });

                        });

                        suite.skip('Sign', function () {
                            let vote;

                            setup(async function () {
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

                                vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            });

                            test('Success', async function () {
                                const pid = 'PID';
                                const voteList = [
                                    {
                                        optionId: vote.options.rows[0].id
                                    }
                                ];
                                /**To run this test, it needs a private key cert pair, cert should be in hex format, also add issuer data to config file and also
                                 * in the cosSignature.js in _handleSigningResult comment out timemark part
                                 **/
                                const certificate = fs.readFileSync('./test/resources/certificates/my_good_cert_hex.crt').toString(); //eslint-disable-line no-sync
                                const privateKey = fs.readFileSync('./test/resources/certificates/my_good_key.pem'); //eslint-disable-line no-sync
                                const resBody = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, certificate, null, null, null)).body;

                                const status = resBody.status;
                                const data = resBody.data;
                                assert.deepEqual(status, {code: 20001});
                                assert.property(data, 'signedInfoDigest');
                                assert.isTrue(data.signedInfoDigest.length > 0);

                                const sign = crypto.createSign('SHA256');
                                sign.update(data.signedInfoDigest);
                                const signatureValue = sign.sign(privateKey, 'hex');

                                await topicVoteSign(agent, user.id, topic.id, vote.id, voteList, certificate, pid, data.token, signatureValue);

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


                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            vote = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        });

                        teardown(async function () {
                            await UserConnection.destroy({
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

                        test('Success - Estonian mobile number and PID2', async function () {
                            const phoneNumber = '+37200000766';
                            const pid = '60001019906';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const voteResult = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null)).body;
                            assert.equal(voteResult.status.code, 20001);
                            assert.match(voteResult.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - auto close', async function () {
                            const topicNew = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
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

                            const vote = (await topicVoteCreate(agent, user.id, topicNew.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard, [{value: 'allMembersVoted'}])).body.data;
                            const phoneNumber = '+37200000766';
                            const pid = '60001019906';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const voteResult = (await topicVoteVote(agent, user.id, topicNew.id, vote.id, voteList, null, pid, phoneNumber, null)).body;
                            assert.equal(voteResult.status.code, 20001);
                            assert.match(voteResult.data.challengeID, /[0-9]{4}/);
                            await _topicVoteStatus(agent, user.id, topicNew.id, vote.id, voteResult.data.token, 205);
                            const voteReadAfterVote = (await topicVoteRead(agent, user.id, topicNew.id, vote.id)).body.data;

                            assert.closeTo(new Date(voteReadAfterVote.endsAt).getTime(), new Date().getTime(), 1000);
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

                            const topic = (await topicCreate(agent, user.id, null, null, null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', null)).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                            // Vote for the first time
                            const voteList1 = [
                                {
                                    optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                                },
                                {
                                    optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                }
                            ];

                            const voteVoteResult1 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;

                            assert.equal(voteVoteResult1.status.code, 20001);
                            assert.match(voteVoteResult1.data.challengeID, /[0-9]{4}/);

                            // Wait for the vote signing to complete
                            await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);
                            const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteRead.id)).body.data;

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

                            const voteVoteResult2 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList2, null, pid, phoneNumber, null)).body;

                            assert.equal(voteVoteResult2.status.code, 20001);
                            assert.match(voteVoteResult2.data.challengeID, /[0-9]{4}/);

                            // Wait for the vote signing to complete
                            await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult2.data.token);
                            const voteReadAfterVote2 = (await topicVoteRead(agent, user.id, topic.id, voteRead.id)).body.data;
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
                            const topicReadAfterVoting = (await topicRead(agent, user.id, topic.id, ['vote'])).body.data;

                            // We can verify that both have the "downloads" present, BUT we cannot check that they are the same as JWT issue time is different and that makes tokens different
                            assert.property(voteReadAfterVote2, 'downloads');
                            assert.property(voteReadAfterVote2.downloads, 'bdocVote');
                            delete voteReadAfterVote2.downloads;

                            assert.property(topicReadAfterVoting.vote, 'downloads');
                            assert.property(topicReadAfterVoting.vote.downloads, 'bdocVote');
                            delete topicReadAfterVoting.vote.downloads;

                            assert.deepEqual(topicReadAfterVoting.vote, voteReadAfterVote2);

                            // Make sure the results match with the result read with Topic list (/api/users/:userId/topics)
                            const listOfTopics = (await topicList(agent, user.id, ['vote'], null, null, null, null, null, null)).body.data;
                            const topicVotedOn = _.find(listOfTopics.rows, {id: topic.id});

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

                            const topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', null)).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                            const agentUser1 = agent;
                            const user1 = user;

                            const agentUser2 = request.agent(app);
                            const user2 = await userLib.createUserAndLogin(agentUser2, null, null, null);

                            const agentUser3 = request.agent(app);
                            const user3 = await userLib.createUserAndLogin(agentUser3, null, null, null);

                            const agentUser4 = request.agent(app);
                            const user4 = await userLib.createUserAndLogin(agentUser4, null, null, null);

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

                            const voteResult1 = (await topicVoteVote(agentUser1, user1.id, topic.id, voteRead.id, voteListUser1, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser1, user1.id, topic.id, voteRead.id, voteResult1.token);

                            const voteResult2 = (await topicVoteVote(agentUser2, user2.id, topic.id, voteRead.id, voteListUser2, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser2, user2.id, topic.id, voteRead.id, voteResult2.token);

                            const voteResult3 = (await topicVoteVote(agentUser3, user3.id, topic.id, voteRead.id, voteListUser3, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser3, user3.id, topic.id, voteRead.id, voteResult3.token);

                            const voteResult4 = (await topicVoteVote(agentUser4, user4.id, topic.id, voteRead.id, voteListUser4, null, pidSingleVote, phoneNumberSingleVote)).body.data;
                            await topicVoteStatus(agentUser4, user4.id, topic.id, voteRead.id, voteResult4.token);
                            const voteReadAfterVote3 = (await topicVoteRead(agentUser3, user3.id, topic.id, voteCreated.id)).body.data;
                            assert.equal(2, voteReadAfterVote3.votersCount);
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
                            const voteReadAfterVote2 = (await topicVoteRead(agentUser2, user2.id, topic.id, voteCreated.id)).body.data;

                            // NOTE: At this point we show "selected" as what the "userId" has selected, we do not check for UserConnections. We MAY want to change this... MAY.
                            voteReadAfterVote3.options.rows.forEach(function (option) {
                                delete option.selected;
                            });

                            assert.deepEqual(voteReadAfterVote2.options, voteReadAfterVote3.options);
                            assert.equal(2, voteReadAfterVote2.votersCount);
                            // Make sure the results match with result read with Topic
                            const topicReadAfterVote2 = (await topicRead(agentUser2, user2.id, topic.id, ['vote'])).body.data;
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
                            await memberLib.topicMemberUsersCreate(topic.id, members);
                            const listOfTopics = (await topicList(agentUser2, user2.id, ['vote'], null, null, null, true, null, null)).body.data;
                            const topicVotedOn = _.find(listOfTopics.rows, {id: topic.id});

                            assert.deepEqual(topicVotedOn.vote, voteReadAfterVote2);
                        });

                        test('Success - Personal ID - vote multiple-choice, delete account  re-vote under another user and count', async function () {
                            this.timeout(40000);
                            const phoneNumberRepeatedVote = '+37200000766';
                            const pidRepeatedVote = '60001019906'
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

                            const topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', null)).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                            const agentUser1 = agent;
                            const user1 = user;

                            const agentUser2 = request.agent(app);
                            const user2 = await userLib.createUserAndLogin(agentUser2, null, null, null);

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

                            const voteResult1 = (await topicVoteVote(agentUser1, user1.id, topic.id, voteRead.id, voteListUser1, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser1, user1.id, topic.id, voteRead.id, voteResult1.token);
                            await userLib.deleteUser(agentUser1, user1.id);

                            const voteResult2 = (await topicVoteVote(agentUser2, user2.id, topic.id, voteRead.id, voteListUser2, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser2, user2.id, topic.id, voteRead.id, voteResult2.token);
                            await new Promise((resolve) => {
                                setTimeout(resolve, 1000);
                            });
                            const voteReadAfterVote2 = (await topicVoteRead(agentUser2, user2.id, topic.id, voteCreated.id)).body.data;
                            assert.equal(voteReadAfterVote2.votersCount, 1);
                            voteReadAfterVote2.options.rows.forEach(function (option) {
                                switch (option.id) {
                                    case voteListUser2[0].optionId:
                                        assert.equal(option.voteCount, 1);
                                        assert.isTrue(option.selected);
                                        break;
                                    case voteListUser2[1].optionId:
                                        assert.equal(option.voteCount, 1);
                                        assert.isTrue(option.selected);
                                        break;
                                    default:
                                        assert.property(option, 'value');
                                        assert.notProperty(option, 'voteCount');
                                }
                            });
                        });

                        test('Success - Personal ID already connected to another user account - vote multiple-choice, re-vote delete account and count', async function () {
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

                            const topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', null)).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                            const agentUser1 = agent;
                            const user1 = user;

                            const agentUser2 = request.agent(app);
                            const user2 = await userLib.createUserAndLogin(agentUser2, null, null, null);

                            const agentUser3 = request.agent(app);
                            const user3 = await userLib.createUserAndLogin(agentUser3, null, null, null);

                            const agentUser4 = request.agent(app);
                            const user4 = await userLib.createUserAndLogin(agentUser4, null, null, null);

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

                            const voteResult1 = (await topicVoteVote(agentUser1, user1.id, topic.id, voteRead.id, voteListUser1, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser1, user1.id, topic.id, voteRead.id, voteResult1.token);

                            const voteResult2 = (await topicVoteVote(agentUser2, user2.id, topic.id, voteRead.id, voteListUser2, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser2, user2.id, topic.id, voteRead.id, voteResult2.token);

                            const voteResult3 = (await topicVoteVote(agentUser3, user3.id, topic.id, voteRead.id, voteListUser3, null, pidRepeatedVote, phoneNumberRepeatedVote)).body.data;
                            await topicVoteStatus(agentUser3, user3.id, topic.id, voteRead.id, voteResult3.token);

                            await userLib.deleteUser(agentUser3, user3.id);
                            const voteResult4 = (await topicVoteVote(agentUser4, user4.id, topic.id, voteRead.id, voteListUser4, null, pidSingleVote, phoneNumberSingleVote)).body.data;
                            await topicVoteStatus(agentUser4, user4.id, topic.id, voteRead.id, voteResult4.token);
                            const voteReadAfterVote3 = (await topicVoteRead(agentUser3, user3.id, topic.id, voteCreated.id)).body.data;

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
                            const voteReadAfterVote2 = (await topicVoteRead(agentUser2, user2.id, topic.id, voteCreated.id)).body.data;

                            // NOTE: At this point we show "selected" as what the "userId" has selected, we do not check for UserConnections. We MAY want to change this... MAY.
                            voteReadAfterVote3.options.rows.forEach(function (option) {
                                delete option.selected;
                            });

                            assert.deepEqual(voteReadAfterVote2.options, voteReadAfterVote3.options);

                            // Make sure the results match with result read with Topic
                            const topicReadAfterVote2 = (await topicRead(agentUser2, user2.id, topic.id, ['vote'])).body.data;
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
                            await memberLib.topicMemberUsersCreate(topic.id, members);
                            const listOfTopics = (await topicList(agentUser2, user2.id, ['vote'], null, null, null, true, null, null)).body.data;
                            const topicVotedOn = _.find(listOfTopics.rows, {id: topic.id});
                            assert.deepEqual(topicVotedOn.vote, voteReadAfterVote2);
                        });

                        test('Success - Estonian mobile number and PID bdocUri exists', async function () {
                            this.timeout(24000); //eslint-disable-line no-invalid-this

                            const phoneNumber = '+37200000766';
                            const pid = '60001019906';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const response = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null)).body;
                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);

                            const bdocpathExpected = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user'
                                .replace(':topicId', topic.id)
                                .replace(':voteId', vote.id);
                            const statusresponse = (await topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token)).body;
                            assert.equal(statusresponse.status.code, 20002);
                            assert.property(statusresponse.data, 'bdocUri');

                            const bdocUri = statusresponse.data.bdocUri;

                            // Check for a valid token
                            const token = bdocUri.slice(bdocUri.indexOf('token=') + 6);
                            const tokenData = cosJwt.verifyTokenRestrictedUse(token, 'GET ' + bdocpathExpected);

                            assert.equal(tokenData.userId, user.id);
                        });

                        test('Fail - 40021 - Invalid phone number', async function () {
                            const phoneNumber = '+372519';
                            const pid = '51001091072';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40021,
                                    message: 'phoneNumber must contain of + and numbers(8-30)'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });

                        test('Fail - 40022 - Invalid PID', async function () {
                            const phoneNumber = '+37260000007';
                            const pid = '1072';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40022,
                                    message: 'nationalIdentityNumber must contain of 11 digits'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });
                        //Something has changed in SK MID
                        test('Fail - 40023 - Mobile-ID user certificates are revoked or suspended for Estonian citizen', async function () {

                            const phoneNumber = '+37200000266';
                            const pid = '60001019939';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 404)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40400,
                                    message: "Not Found"
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });
                        //Something has changed in SK MID
                        test('Fail - 40023 - Mobile-ID user certificates are revoked or suspended for Lithuanian citizen', async function () {
                            const phoneNumber = '+37060000266';
                            const pid = '50001018832';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 404)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40400,
                                    message: "Not Found"
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });
                        //Something has changed in SK MID
                        test('Fail - 40023 - User certificate is not activated for Estonian citizen.', async function () {
                            const phoneNumber = '+37200000366';
                            const pid = '60001019928';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 404)).body;

                            const expectedResponse = {
                                status: {
                                    code: 40400,
                                    message: "Not Found"
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });
                        //Something has changed in SK MID
                        test('Fail - 40023 - Mobile-ID is not activated for Lithuanian citizen', async function () {
                            const phoneNumber = '+37060000366';
                            const pid = '50001018821';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 404)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40400,
                                    message: "Not Found"
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });

                        test('Fail - 40031 - User account already connected to another PID.', async function () {
                            // Originally set by a successful Vote, but taking a shortcut for faster test runs
                            await UserConnection.create({
                                userId: user.id,
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: 'PNOEE-11412090004',
                                connectionData: {
                                    name: 'TEST' + new Date().getTime(),
                                    country: 'EE',
                                    pid: '11412090004'
                                }
                            });
                            const phoneNumber = '+37060000007';
                            const pid = '51001091072';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40031,
                                    message: 'User account already connected to another PID.'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
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

                                    const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                                    const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Vote for the first time
                                    const voteList1 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                        }
                                    ];

                                    const voteVoteResult1 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);

                                    // Vote for the 2nd time, change your vote, by choosing 1
                                    const voteList2 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[1].value}).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[2].value}).id
                                        }
                                    ];

                                    const voteVoteResult2 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList2, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult2.data.token);
                                    const voteReadAfterVote2 = (await topicVoteRead(agent, user.id, topic.id, voteRead.id)).body.data;

                                    // Verify the url format and download
                                    const userBdocUrlRegex = new RegExp(`^${config.url.api}/api/users/self/topics/${topic.id}/votes/${voteRead.id}/downloads/bdocs/user\\?token=([a-zA-Z_.0-9\\-]{675})$`);
                                    const userBdocUrlMatches = voteReadAfterVote2.downloads.bdocVote.match(userBdocUrlRegex);

                                    assert.isNotNull(userBdocUrlMatches);

                                    const userBdocDownloadToken = userBdocUrlMatches[1];
                                    await topicVoteDownloadBdocUser(agent, topic.id, voteRead.id, userBdocDownloadToken);

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

                                    const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                                    const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Vote for the first time
                                    // Vote for the first time
                                    const voteList1 = [
                                        {
                                            optionId: voteRead.options.rows.find((o) => {return o.value === options[0].value}).id
                                        },
                                        {
                                            optionId: voteRead.options.rows.find((o) => {return o.value === options[1].value}).id
                                        }
                                    ];

                                    const voteVoteResult1 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);

                                    // Vote for the 2nd time, change your vote, by choosing 1
                                    const voteList2 = [
                                        {
                                            optionId: voteRead.options.rows.find((o) => {return o.value === options[1].value}).id
                                        },
                                        {
                                            optionId: voteRead.options.rows.find((o) => {return o.value === options[2].value}).id
                                        }
                                    ];

                                    const voteVoteResult2 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList2, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult2.data.token);

                                    // End the voting
                                    await topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp, Topic.VISIBILITY.private, null, null, null);

                                    const voteReadAfterVoteClosed = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Verify the user vote container format and download
                                    const userBdocUrlRegex = new RegExp(`^${config.url.api}/api/users/self/topics/${topic.id}/votes/${voteRead.id}/downloads/bdocs/user\\?token=([a-zA-Z_.0-9\\-]{675})$`);
                                    const userBdocUrlMatches = voteReadAfterVoteClosed.downloads.bdocVote.match(userBdocUrlRegex);

                                    assert.isNotNull(userBdocUrlMatches);

                                    const userBdocDownloadToken = userBdocUrlMatches[1];
                                    await topicVoteDownloadBdocUser(agent, topic.id, voteRead.id, userBdocDownloadToken);
                                    // Verify the final vote container format and download
                                    const finalBdocUrlRegex = new RegExp(`^${config.url.api}/api/users/self/topics/${topic.id}/votes/${voteRead.id}/downloads/bdocs/final\\?token=([a-zA-Z_.0-9\\-]{676})$`);
                                    const finalBdocUrlMatches = voteReadAfterVoteClosed.downloads.bdocFinal.match(finalBdocUrlRegex);

                                    assert.isNotNull(finalBdocUrlMatches);

                                    const finalBdocDownloadToken = finalBdocUrlMatches[1];
                                    await topicVoteDownloadBdocFinal(agent, topic.id, voteRead.id, finalBdocDownloadToken, ['csv']);
                                    const pathFinalBdoc = `./test/tmp/final_${voteRead.id}_${user.id}.bdoc`;
                                    const fileWriteStream = fs.createWriteStream(pathFinalBdoc);
                                    const fileWriteStreamPromised = cosUtil.streamToPromise(fileWriteStream);

                                    request('')
                                        .get(voteReadAfterVoteClosed.downloads.bdocFinal.split('?')[0])
                                        .query({
                                            include: 'csv',
                                            token: finalBdocDownloadToken,
                                        })
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
                                        'document.docx',
                                        '__metainfo.html',
                                        `${options[0].value}.html`,
                                        `${options[1].value}.html`,
                                        `${options[2].value}.html`,
                                        `PNOEE-${pid}.bdoc`,
                                        'votes.csv',
                                        'graph.pdf',
                                        'META-INF/manifest.xml'
                                    ];
                                    const fileListReturned = [];
                                    bdocFileList.forEach(function (f) {
                                        fileListReturned.push(f.file);
                                    });

                                    assert.deepEqual(fileListExpected, fileListReturned);
                                    // Clean up
                                    fs.unlinkSync(pathFinalBdoc);
                                });

                                test('Success - Vote, delete account, re-vote & count, delete account re-count', async () => {
                                    const pid = 30303039914;
                                    const countryCode = 'EE';
                                    const topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, '<html><head></head><body><h2>TEST VOTE AND DELETE ACCOUNT AND RE-VOTE</h2></body></html>', null)).body.data;
                                    const agentUser1 = request.agent(app);
                                    const agentUser2 = request.agent(app);
                                    const user1 = await userLib.createUserAndLogin(agentUser1, null, null, null);
                                    const user2 = await userLib.createUserAndLogin(agentUser2, null, null, null);

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

                                    const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                                    const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

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

                                    // Vote for the first time
                                    // Vote for the first time
                                    const voteList2 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[0].value}).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, {value: options[2].value}).id
                                        }
                                    ];

                                    const voteVoteResult = (await topicVoteVote(agentUser1, user1.id, topic.id, voteRead.id, voteList1, null, pid, null, countryCode, null)).body;
                                    await topicVoteStatus(agentUser1, user1.id, topic.id, voteCreated.id, voteVoteResult.data.token);
                                    const voteRead2 = (await topicVoteRead(agentUser1, user1.id, topic.id, voteCreated.id)).body.data;

                                    assert.equal(1, voteRead2.votersCount);
                                    voteRead2.options.rows.forEach((option) => {
                                        switch (option.id) {
                                            case voteList1[0].optionId:
                                                assert.equal(option.voteCount, 1);
                                                assert.isTrue(option.selected);
                                                break;
                                            case voteList1[1].optionId:
                                                assert.equal(option.voteCount, 1);
                                                assert.isTrue(option.selected);
                                                break;
                                            default:
                                                assert.property(option, 'value');
                                                assert.notProperty(option, 'voteCount');
                                        }
                                    });

                                    await userLib.deleteUser(agentUser1, user1.id);

                                    const voteVoteResult2 = (await topicVoteVote(agentUser2, user2.id, topic.id, voteRead.id, voteList2, null, pid, null, countryCode, null)).body;
                                    await topicVoteStatus(agentUser2, user2.id, topic.id, voteCreated.id, voteVoteResult2.data.token);
                                    const voteRead3 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    assert.equal(1, voteRead3.votersCount);
                                    voteRead3.options.rows.forEach((option) => {
                                        switch (option.id) {
                                            case voteList2[0].optionId:
                                                assert.equal(option.voteCount, 1);
                                                assert.notProperty(option, 'selected');
                                                break;
                                            case voteList2[1].optionId:
                                                assert.equal(option.voteCount, 1);
                                                assert.notProperty(option, 'selected');
                                                break;
                                            default:
                                                assert.property(option, 'value');
                                                assert.notProperty(option, 'voteCount');
                                        }
                                    });

                                    await userLib.deleteUser(agentUser2, user2.id);

                                    // End the voting
                                    await topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp, Topic.VISIBILITY.private, null, null, null);
                                    const voteReadAfterVoteClosed = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                                    assert.equal(voteReadAfterVoteClosed.votersCount, 1);

                                    // Verify the final vote container format and download
                                    const finalBdocUrlRegex = new RegExp(`^${config.url.api}/api/users/self/topics/${topic.id}/votes/${voteRead.id}/downloads/bdocs/final\\?token=([a-zA-Z_.0-9\\-]{676})$`);
                                    const finalBdocUrlMatches = voteReadAfterVoteClosed.downloads.bdocFinal.match(finalBdocUrlRegex);

                                    assert.isNotNull(finalBdocUrlMatches);

                                    const finalBdocDownloadToken = finalBdocUrlMatches[1];
                                    await topicVoteDownloadBdocFinal(agent, topic.id, voteRead.id, finalBdocDownloadToken);

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


                                }).timeout(40000);

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

                        let vote;
                        let vote2;

                        setup(async function () {

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
                            vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            vote = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;
                            vote2 = (await topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                        });

                        teardown(async function () {
                            await UserConnection
                                .destroy({
                                    where: {
                                        connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                        connectionUserId: ['PNOEE-30403039917', 'PNOEE-30303039914', 'PNOEE-11412090004']
                                    },
                                    force: true
                                });
                        });

                        test('Success - Estonian PID', async function () {
                            await UserConnection.destroy({
                                where: {
                                    connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                    connectionUserId: ['PNOEE-30403039917', 'PNOEE-30303039914', 'PNOEE-11412090004']
                                },
                                force: true
                            });

                            const countryCode = 'EE';
                            const pid = '30303039914';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const response = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 200)).body;

                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - unauth - Estonian PID', async function () {
                            const reqAgent = request.agent(app);
                            await UserConnection.destroy({
                                where: {
                                    connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                    connectionUserId: ['PNOEE-30403039917', 'PNOEE-30303039914', 'PNOEE-11412090004']
                                },
                                force: true
                            });

                            const countryCode = 'EE';
                            const pid = '30303039914';

                            const voteList = [
                                {
                                    optionId: vote2.options.rows[0].id
                                }
                            ];
                            const response = (await _topicVoteVoteUnauth(reqAgent, topicPublic.id, vote2.id, voteList, null, pid, null, countryCode, 200)).body;

                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - Latvian PID', async function () {
                            const countryCode = 'LV';
                            const pid = '030303-10012';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const response = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode)).body;
                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - Lithuanian PID', async function () {
                            const countryCode = 'LT';
                            const pid = '30303039914';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const response = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode)).body;
                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - Personal ID already connected to another user account.', async function () {
                            const countryCode = 'EE';
                            const pid = '30303039914';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const createdUser = await userLib.createUser(request.agent(app), null, null, null)

                            await UserConnection.create({
                                userId: createdUser.id,
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: pid
                            });

                            const response = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode)).body;
                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - bdocUri exists', async function () {
                            this.timeout(30000); //eslint-disable-line no-invalid-this

                            const countryCode = 'EE';
                            const pid = '30303039914';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const response = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode)).body;
                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);

                            const bdocpathExpected = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user'
                                .replace(':topicId', topic.id)
                                .replace(':voteId', vote.id);
                            const statusresponse = (await topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token)).body;
                            assert.equal(statusresponse.status.code, 20002);
                            assert.property(statusresponse.data, 'bdocUri');

                            const bdocUri = statusresponse.data.bdocUri;

                            // Check for a valid token
                            const token = bdocUri.slice(bdocUri.indexOf('token=') + 6);
                            const tokenData = cosJwt.verifyTokenRestrictedUse(token, 'GET ' + bdocpathExpected);
                            assert.equal(tokenData.userId, user.id);

                        });

                        test('Fail - 40000 - Invalid country code', async function () {
                            const countryCode = 'OO';
                            const pid = '10101010004';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 400)).body
                            const expectedResponse = {
                                status: {
                                    code: 40000,
                                    message: 'Bad request'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });

                        test('Fail - 40400 - Invalid PID', async function () {
                            const countryCode = 'EE';
                            const pid = '1072';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 404)).body;

                            const expectedResponse = {
                                status: {
                                    code: 40400,
                                    message: 'Not Found'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });

                        test('Fail - 40010 - User has cancelled the signing process', async function () {
                            this.timeout(15000); // eslint-disable-line no-invalid-this

                            const countryCode = 'EE';
                            const pid = '30403039917';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const response = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode)).body;
                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);

                            const topicVoteStatusResponse = await _topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token, 400);
                            const expectedResponse = {
                                status:
                                    {
                                        code: 40010,
                                        message: 'User has cancelled the signing process'
                                    }
                            }
                            assert.equal(topicVoteStatusResponse.body.status.code, 40010);
                            assert.deepEqual(topicVoteStatusResponse.body, expectedResponse);
                        });

                        // FIXME: Known to fail, needs some attention. More details from @ilmartyrk
                        test('Fail - 40010 - User has cancelled the signing process Latvian PID', async function () {
                            this.timeout(55000); //eslint-disable-line no-invalid-this

                            const countryCode = 'LV';
                            const pid = '030403-10016';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const response = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode)).body;
                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);

                            const topicVoteStatusResponse = await _topicVoteStatus(agent, user.id, topic.id, vote.id, response.data.token, 400);
                            const expectedResponse = {
                                status:
                                    {
                                        code: 40010,
                                        message: 'User has cancelled the signing process'
                                    }
                            }
                            assert.equal(topicVoteStatusResponse.body.status.code, 40010);
                            assert.deepEqual(topicVoteStatusResponse.body, expectedResponse);
                        });

                        test('Fail - 40031 - User account already connected to another PID.', async function () {
                            // Originally set by a successful Vote, but taking a shortcut for faster test runs
                            await UserConnection.create({
                                userId: user.id,
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: 'PNOEE-11412090004',
                                connectionData: {
                                    name: 'TEst name',
                                    pid: '11412090004',
                                    country: 'EE'
                                }
                            });
                            const countryCode = 'EE';
                            const pid = '30303039914';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, null, countryCode, 400)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40031,
                                    message: 'User account already connected to another PID.'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });
                    });
                });
            });

        });

        // API - /api/users/:userId/topics/:topicId/comments
        suite('Comments', function () {

            suite('Create', function () {

                const agent = request.agent(app);

                let user;
                let topic;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                });

                test('Success - type=pro with reply', async function () {
                    const type = Comment.TYPES.pro;
                    const subject = `Test ${type} comment subject`;
                    const text = `Test ${type} comment text`;

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, user.id);

                    const commentReplyText = `Test Child comment for comment ${type}`;
                    const commentReply = (await topicCommentCreate(agent, user.id, topic.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

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

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, user.id);

                    const commentReplyText = `Test Child comment for comment ${type}`;
                    const commentReply = (await topicCommentCreate(agent, user.id, topic.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

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

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.creator.id, user.id);

                    const commentReplyText = `Test Child comment for comment ${type}`;
                    const commentReply = (await topicCommentCreate(agent, user.id, topic.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

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

                    const comment = (await topicCommentCreate(agent, user.id, topic.id, null, null, type, subject, text)).body.data;

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

                    const resBody = (await _topicCommentCreate(agent, user.id, topic.id, null, null, type, subject, text, 400)).body;

                    const resBodyExpected = {
                        status: {code: 40000},
                        errors: {text: `Text can be 1 to ${maxLength} characters long.`}
                    };

                    assert.deepEqual(resBody, resBodyExpected);
                });

                test('Fail - 40000 - text can be 1 - N characters longs - POI', async function () {
                    const type = Comment.TYPES.poi;
                    const maxLength = Comment.TYPE_LENGTH_LIMIT[type];
                    const subject = 'subject test quotes "">\'!<';
                    const text = 'a'.repeat(maxLength + 1);

                    const resBody = (await _topicCommentCreate(agent, user.id, topic.id, null, null, type, subject, text, 400)).body;

                    const resBodyExpected = {
                        status: {code: 40000},
                        errors: {text: `Text can be 1 to ${maxLength} characters long.`}
                    };

                    assert.deepEqual(resBody, resBodyExpected);
                });

                test('Fail - 40300 - Forbidden - cannot comment on Topic you\'re not a member of or the Topic is not public', async function () {
                    const type = Comment.TYPES.poi;
                    const subject = 'subject test quotes "">\'!<';
                    const text = 'should not pass!';

                    const agentUser2 = request.agent(app);
                    const user2 = await userLib.createUserAndLogin(agentUser2, null, null, null);

                    const resBody = (await _topicCommentCreate(agentUser2, user2.id, topic.id, null, null, type, subject, text, 403)).body;

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

                suiteSetup(async function () {
                    user2 = await userLib.createUserAndLogin(agent2, null, null, null);
                    user3 = await userLib.createUserAndLogin(agent3, null, null, null);
                    topic = (await topicCreate(agent2, user2.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                });

                test('Success - edit comment by user', async function () {
                    const type = Comment.TYPES.pro;
                    const subject = 'to be edited by user';
                    const text = 'Wohoo!';

                    const comment = (await topicCommentCreate(agent3, user3.id, topic.id, null, null, type, subject, text)).body.data;
                    assert.property(comment, 'id');
                    assert.equal(comment.type, type);
                    assert.equal(comment.subject, subject);
                    assert.equal(comment.text, text);
                    assert.equal(comment.type, Comment.TYPES.pro);
                    assert.equal(comment.creator.id, user3.id);

                    const editSubject = 'Edited by user';
                    const editText = 'Jei, i edited';

                    const status = (await topicCommentEdit(agent3, user3.id, topic.id, comment.id, editSubject, editText, Comment.TYPES.con)).body.status;
                    assert.equal(status.code, 20000);
                    const commentEdited = (await topicCommentList(agent3, user3.id, topic.id, 'date')).body.data.rows[0];
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

                    const comment = (await topicCommentCreate(agent3, user3.id, topic.id, null, null, type, subject, text)).body.data;
                    const resBodyEdit = (await _topicCommentEdit(agent3, user3.id, topic.id, comment.id, subject + 'a', 'a'.repeat(maxLength + 1), type, 400)).body;

                    const resBodyEditExpected = {
                        status: {code: 40000},
                        errors: {text: `Text can be 1 to ${maxLength} characters long.`}
                    };

                    assert.deepEqual(resBodyEdit, resBodyEditExpected);
                });
            });

            suite('List', function () {
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
                let partner;
                let comment1;
                let comment2;
                let comment3;

                setup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                    comment1 = (await topicCommentCreate(agent, user.id, topic.id, null, null, commentType1, commentSubj1, commentText1)).body.data;
                    comment2 = (await topicCommentCreate(agent, user.id, topic.id, null, null, commentType2, commentSubj2, commentText2)).body.data;
                    comment3 = (await topicCommentCreate(agent, user.id, topic.id, null, null, commentType3, commentSubj3, commentText3)).body.data;
                    partner = await Partner.create({
                        website: 'notimportant',
                        redirectUriRegexp: 'notimportant'
                    });
                });

                test('Success', async function () {
                    const list = (await topicCommentList(agent, user.id, topic.id, null)).body.data;
                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    delete creatorExpected.email; // Email is not returned
                    delete creatorExpected.imageUrl; // Image url is not returned as it's not needed for now
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 3);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = _.find(comments, {id: comment1.id});

                    assert.equal(c1.id, comment1.id);
                    assert.equal(c1.type, comment1.type);
                    assert.equal(c1.subject, comment1.subject);
                    assert.equal(c1.text, comment1.text);
                    assert.property(c1, 'createdAt');
                    assert.equal(c1.parent.id, comment1.id);

                    assert.deepEqual(c1.creator, creatorExpected);

                    // Comment 2
                    const c2 = _.find(comments, {id: comment2.id});

                    assert.equal(c2.id, comment2.id);
                    assert.equal(c2.type, comment2.type);
                    assert.equal(c2.subject, comment2.subject);
                    assert.equal(c2.text, comment2.text);
                    assert.property(c2, 'createdAt');
                    assert.equal(c2.parent.id, comment2.id);

                    assert.deepEqual(c2.creator, creatorExpected);

                    // Comment 3
                    const c3 = _.find(comments, {id: comment3.id});

                    assert.equal(c3.id, comment3.id);
                    assert.equal(c3.type, comment3.type);
                    assert.equal(c3.subject, comment3.subject);
                    assert.equal(c3.text, comment3.text);
                    assert.property(c3, 'createdAt');
                    assert.equal(c3.parent.id, comment3.id);

                    assert.deepEqual(c3.creator, creatorExpected);
                });

                test('Success v2', async function () {
                    const list = (await topicCommentList(agent, user.id, topic.id, 'rating')).body.data;
                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    delete creatorExpected.email; // Email is not returned
                    delete creatorExpected.imageUrl; // Image url is not returned as it's not needed for now
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 3);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = _.find(comments, {id: comment1.id});

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
                    await topicCommentCreate(agent, user.id, topic.id, comment1.id, null, null, null, replyText11);
                    await topicCommentCreate(agent, user.id, topic.id, comment2.id, null, null, null, replyText21);
                    await topicCommentCreate(agent, user.id, topic.id, comment2.id, null, null, null, replyText22);
                    await topicCommentCreate(agent, user.id, topic.id, comment3.id, null, null, null, replyText31);

                    const list = (await topicCommentList(agent, user.id, topic.id, null)).body.data;
                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    delete creatorExpected.email; // Email is not returned
                    delete creatorExpected.imageUrl; // Image url is not returned, as it's not needed for now
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 7);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = _.find(comments, {id: comment1.id});

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
                    const c2 = _.find(comments, {id: comment2.id});

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
                    const c3 = _.find(comments, {id: comment3.id});

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
                    await topicCommentCreate(agent, user.id, topic.id, comment1.id, null, null, null, replyText11);
                    await topicCommentCreate(agent, user.id, topic.id, comment2.id, null, null, null, replyText21);
                    await topicCommentCreate(agent, user.id, topic.id, comment2.id, null, null, null, replyText22);
                    const list = (await topicCommentList(agent, user.id, topic.id, null)).body.data;

                    const comments = list.rows;

                    const creatorExpected = user.toJSON();
                    creatorExpected.phoneNumber = null;
                    delete creatorExpected.imageUrl; // Image url is not returned, as it's not needed for now
                    delete creatorExpected.language; // Language is not returned

                    assert.equal(list.count.total, 6);
                    assert.equal(comments.length, 3);

                    // Comment 1
                    const c1 = _.find(comments, {id: comment1.id});

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
                    const c2 = _.find(comments, {id: comment2.id});

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
                let comment;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);

                    topic = (await topicCreate(agent, user.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;

                    comment = (await topicCommentCreate(agent, user.id, topic.id, null, null, commentType, commentSubject, commentText)).body.data;
                });

                test('Success', async function () {
                    await topicCommentDelete(agent, user.id, topic.id, comment.id);
                    const comments = (await topicCommentList(agent, user.id, topic.id, null)).body.data;
                    assert.equal(comments.count.total, 1);
                    assert.equal(comments.rows.length, 1);
                    assert.isNotNull(comments.rows[0].deletedAt);
                });


                test('Success - delete own comment from Topic with read permissions', async function () {
                    const agentComment = request.agent(app);

                    const userComment = await userLib.createUserAndLogin(agentComment, null, null, null);

                    const comment = (await topicCommentCreate(agentComment, userComment.id, topic.id, null, null, commentType, commentSubject, commentText)).body.data;

                    await topicCommentDelete(agentComment, userComment.id, topic.id, comment.id);
                });

            });

            suite('Reports', function () {
                // See the tests for unauthenticated reports - Topics Comments Reports
            });

        });

        // API - /api/users/:userId/topics/:topicId/mentions
        suite('Mentions', function () {

            suite('Read', function () {

                const agent = request.agent(app);

                let user;
                let topic;
                let mention1;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicCreate(agent, user.id, null, null, null, null, 'banana')).body.data;
                    mention1 = (await topicMentionList(agent, user.id, topic.id)).body.data.rows[0];
                });

                test('Success - cached result', async function () {
                    const list = (await topicMentionList(agent, user.id, topic.id)).body.data;
                    const mentions = list.rows;

                    assert.isTrue(list.count > 0);
                    assert.equal(list.count, mentions.length);

                    // Mention
                    const m1 = _.find(mentions, {id: mention1.id});
                    assert.deepEqual(m1, mention1);
                });

            });
        });

        // API - /api/users/:userId/topics/:topicId/attachments
        suite('Attachments', async function () {
            const creatorAgent = request.agent(app);
            const agent = request.agent(app);
            let creator;
            let user;
            let topic;
            let topic2;

            setup(async function () {
                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                user = await userLib.createUserAndLogin(agent);
                topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                topic2 = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;
            });

            suite('Create', async function () {
                test('Success', async function () {
                    const expectedAttachment = {
                        name: 'testfilename.pdf',
                        source: 'dropbox',
                        link: `https://www.dropbox.com/s/6schppqdg5qfofe/Getting%20Started.pdf?dl=0`,
                        type: '.pdf',
                        size: 1000,
                        creatorId: creator.id
                    };

                    const attachment = (await topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    assert.property(attachment, 'id');
                    assert.property(attachment, 'createdAt');
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.link, expectedAttachment.link);
                    assert.equal(attachment.source, expectedAttachment.source);
                    assert.equal(attachment.type, expectedAttachment.type);
                    assert.equal(attachment.size, expectedAttachment.size);
                    assert.equal(attachment.creatorId, creator.id);
                });

                test('Fail, no link', async function () {
                    const expectedAttachment = {
                        name: 'testfilename.pdf',
                        source: 'dropbox',
                        link: '',
                        type: '.pdf',
                        size: 1000,
                        creatorId: creator.id
                    };

                    const resBody = (await _topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40000,
                            message: "Missing attachment link"
                        }
                    };
                    assert.deepEqual(resBody, expectedBody);
                });
            });

            suite('Read', async function () {
                let attachment;

                suiteSetup(async function () {
                    const expectedAttachment = {
                        name: 'testfilename.pdf',
                        source: 'dropbox',
                        link: `https://www.dropbox.com/s/6schppqdg5qfofe/Getting%20Started.pdf?dl=0`,
                        type: '.pdf',
                        creatorId: creator.id
                    };
                    attachment = (await topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                });

                test('Success', async function () {
                    const readAttachment = (await topicAttachmentRead(creatorAgent, creator.id, topic.id, attachment.id)).body.data;

                    assert.equal(readAttachment.id, attachment.id);
                    assert.equal(readAttachment.createdAt, attachment.createdAt);
                    assert.equal(readAttachment.name, attachment.name);
                    assert.equal(readAttachment.link, attachment.link);
                    assert.equal(readAttachment.source, attachment.source);
                    assert.equal(readAttachment.type, attachment.type);
                    assert.equal(readAttachment.size, attachment.size);
                    assert.equal(readAttachment.creatorId, attachment.creatorId);
                });

                test('Unauth - Success', async function () {
                    const readAttachment = (await topicAttachmentReadUnauth(agent, topic.id, attachment.id)).body.data;

                    assert.equal(readAttachment.id, attachment.id);
                    assert.equal(readAttachment.createdAt, attachment.createdAt);
                    assert.equal(readAttachment.name, attachment.name);
                    assert.equal(readAttachment.link, attachment.link);
                    assert.equal(readAttachment.source, attachment.source);
                    assert.equal(readAttachment.type, attachment.type);
                    assert.equal(readAttachment.size, attachment.size);
                    assert.equal(readAttachment.creatorId, attachment.creatorId);
                });

                test('Unauth- Fail', async function () {
                    const result = (await _topicAttachmentReadUnauth(agent, topic2.id, attachment.id, 404)).body;
                    const expectedResponse = {
                        status: {
                            code: 40400,
                            message: 'Not Found'
                        }
                    };

                    assert.deepEqual(result, expectedResponse);
                });
            });

            suite('Update', async function () {
                let attachment;

                setup(async function () {
                    const expectedAttachment = {
                        name: 'testfilename.pdf',
                        source: 'dropbox',
                        link: `https://www.dropbox.com/s/6schppqdg5qfofe/Getting%20Started.pdf?dl=0`,
                        type: '.pdf',
                        creatorId: creator.id
                    };
                    attachment = (await topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                });

                test('Success', async function () {
                    const updateAttachment = (await topicAttachmentUpdate(creatorAgent, creator.id, topic.id, attachment.id, 'newTestFilename')).body.data;
                    assert.property(updateAttachment, 'id');
                    assert.property(updateAttachment, 'createdAt');
                    assert.equal(updateAttachment.name, 'newTestFilename');
                    assert.equal(updateAttachment.link, attachment.link);
                    assert.equal(updateAttachment.type, attachment.type);
                    assert.equal(updateAttachment.source, attachment.source);
                    assert.equal(updateAttachment.size, attachment.size);
                    assert.equal(updateAttachment.creatorId, creator.id);
                });

                test('Update attachment - Fail - Missing attachment name', async function () {
                    const resBody = (await _topicAttachmentUpdate(creatorAgent, creator.id, topic.id, attachment.id, '', 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40000,
                            message: "Missing attachment name"
                        }
                    };
                    assert.deepEqual(resBody, expectedBody);
                });
            });

            suite('Delete', async function () {
                let attachment;

                setup(async function () {
                    const expectedAttachment = {
                        name: 'testfilename.pdf',
                        source: 'dropbox',
                        link: `https://www.dropbox.com/s/6schppqdg5qfofe/Getting%20Started.pdf?dl=0`,
                        type: '.pdf',
                        creatorId: creator.id
                    };
                    attachment = (await topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                });

                test('Success', async function () {
                    const resBody = (await topicAttachmentDelete(creatorAgent, creator.id, topic.id, attachment.id)).body;
                    const expectedBody = {
                        status: {
                            code: 20000
                        }
                    };
                    assert.deepEqual(resBody, expectedBody);
                    const list = (await topicAttachmentList(creatorAgent, creator.id, topic.id)).body.data;

                    assert.equal(list.count, 0);
                    assert.equal(list.rows.length, 0);
                });

                test('Fail - unauthorized', async function () {
                    const resBody = (await _topicAttachmentDelete(agent, user.id, topic.id, attachment.id, 403)).body;
                    const expectedBody = {
                        status: {
                            code: 40300,
                            message: "Insufficient permissions"
                        }
                    };
                    assert.deepEqual(resBody, expectedBody);
                });

            });

            suite('Upload', function () {
                test('Success', async function () {
                    const expectedAttachment = {
                        name: 'test.txt',
                        source: 'upload',
                        type: '.txt',
                        size: 1000,
                        creatorId: creator.id,
                        file: path.join(__dirname, '/uploads/test.txt')
                    };

                    const attachment = (await uploadAttachmentFile(creatorAgent, creator.id, topic.id, expectedAttachment)).body.data;
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.creatorId, expectedAttachment.creatorId);
                    assert.equal(attachment.name, expectedAttachment.name);
                    assert.equal(attachment.name, expectedAttachment.name);
                });

                test('Fail - invalid format', async function () {
                    const expectedAttachment = {
                        name: 'test.txt',
                        source: 'upload',
                        type: '.txt',
                        size: 1000,
                        creatorId: creator.id,
                        file: path.join(__dirname, '/uploads/test.exe')
                    };

                    const resBody = (await _uploadAttachmentFile(creatorAgent, creator.id, topic.id, expectedAttachment, 403)).body;
                    assert.deepEqual(resBody, {
                        "status": {
                            "code": 40300,
                            "message": "File type application/x-msdos-program is invalid"
                        }
                    })
                });

                test('Fail - invalid format .exe with text/plain header', async function () {
                    const attachment = {
                        name: 'test.txt',
                        source: 'upload',
                        type: '.txt',
                        size: 1000,
                        creatorId: creator.id,
                        file: path.join(__dirname, '/uploads/test.exe')
                    };

                    const request = creatorAgent
                        .post('/api/users/:userId/topics/:topicId/attachments/upload'
                            .replace(':userId', creator.id)
                            .replace(':topicId', topic.id));

                    Object.keys(attachment).forEach(function (key) {
                        request.field(key, attachment[key])
                    });

                    const res = await request
                        .attach("name", attachment.file, {contentType: 'text/plain'})
                        .set('Content-Type', 'multipart/form-data')
                        .expect(403);

                    assert.deepEqual(res.body, {
                        "status": {
                            "code": 40300,
                            "message": "File type text/plain is invalid"
                        }
                    });
                });

                test('Fail - invalid format .exe with .txt filename', async function () {
                    const file = path.join(__dirname, '/uploads/test.exe');

                    const request = creatorAgent
                        .post('/api/users/:userId/topics/:topicId/attachments/upload'
                            .replace(':userId', creator.id)
                            .replace(':topicId', topic.id));

                    request.field('folder', 'test');

                    const res = await request
                        .attach("name", file, {contentType: 'text/plain'})
                        .set('Content-Type', 'multipart/form-data')
                        .expect(403);

                    assert.deepEqual(res.body, {
                        "status": {
                            "code": 40300,
                            "message": "File type text/plain is invalid"
                        }
                    });
                });

                test('Fail - invalid format file without extension', async function () {
                    const file = path.join(__dirname, '/uploads/test');

                    const request = creatorAgent
                        .post('/api/users/:userId/topics/:topicId/attachments/upload'
                            .replace(':userId', creator.id)
                            .replace(':topicId', topic.id));

                    request.field('folder', 'test');

                    return request
                        .attach("name", file, {contentType: 'text/plain'})
                        .set('Content-Type', 'multipart/form-data')
                        .expect(403);
                });

            });

            suite('List', function () {
                let attachment;

                setup(async function () {
                    const expectedAttachment = {
                        name: 'testfilename.pdf',
                        source: 'dropbox',
                        link: `https://www.dropbox.com/s/6schppqdg5qfofe/Getting%20Started.pdf?dl=0`,
                        type: '.pdf',
                        creatorId: creator.id
                    };
                    attachment = (await topicAttachmentAdd(creatorAgent, creator.id, topic.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                });

                test('Success', async function () {
                    const list = (await topicAttachmentList(creatorAgent, creator.id, topic.id)).body.data;
                    const listAttachment = list.rows[0];

                    assert.equal(list.count, 1);
                    assert.property(listAttachment, 'id');
                    assert.property(listAttachment, 'createdAt');
                    assert.equal(listAttachment.name, attachment.name);
                    assert.equal(listAttachment.link, attachment.link);
                    assert.equal(listAttachment.type, attachment.type);
                    assert.equal(listAttachment.size, attachment.size);
                    assert.equal(listAttachment.creator.id, creator.id);
                });

                test('Success unauth', async function () {
                    const list = (await topicAttachmentListUnauth(creatorAgent, topic.id)).body.data;
                    assert.equal(list.count, 1);
                    const listAttachment = list.rows[0];
                    assert.property(listAttachment, 'id');
                    assert.property(listAttachment, 'createdAt');
                    assert.equal(listAttachment.name, attachment.name);
                    assert.equal(listAttachment.link, attachment.link);
                    assert.equal(listAttachment.type, attachment.type);
                    assert.equal(listAttachment.source, attachment.source);
                    assert.equal(listAttachment.size, attachment.size);
                    assert.equal(listAttachment.creator.id, creator.id);
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

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUserAndLogin(agentModerator, emailModerator, null, null);
                    userReporter = await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, '<html><head></head><body><h2>TOPIC TITLE FOR SPAM REPORTING</h2></body></html>', null)).body.data;

                    return Moderator.create({
                        userId: userModerator.id
                    });
                });

                test('Success', async function () {
                    const reportType = Report.TYPES.spam;
                    const reportText = 'Topic spam report test';

                    const reportResult = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;
                    assert.isTrue(validator.isUUID(reportResult.id, 4));
                    assert.equal(reportResult.type, reportType);
                    assert.equal(reportResult.text, reportText);
                    assert.property(reportResult, 'createdAt');
                    assert.equal(reportResult.creator.id, userReporter.id);
                });

                test('Fail - 40001 - Topic has already been reported. No duplicate reports.', async function () {
                    const reportType = Report.TYPES.spam;
                    const reportText = 'Topic spam report test';

                    const resBodyStatus = (await _topicReportCreate(agentReporter, topic.id, reportType, reportText, 400)).body.status;
                    const expectedStatus = {
                        code: 40001,
                        message: 'Topic has already been reported. Only one active report is allowed at the time to avoid overloading the moderators'
                    };

                    assert.deepEqual(resBodyStatus, expectedStatus);
                });

                test('Fail - 40400 - Can\'t report a private Topic', async function () {
                    const reportType = Report.TYPES.hate;
                    const reportText = 'Topic hate speech report for private Topic test';

                    const topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;
                    return _topicReportCreate(agentReporter, topic.id, reportType, reportText, 404);
                });


                test('Fail - 40100 - Authentication is required', async function () {
                    const reportType = Report.TYPES.hate;
                    const reportText = 'Topic hate speech report for private Topic test';

                    const topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;
                    return _topicReportCreate(request.agent(app), topic.id, reportType, reportText, 401);
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

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUserAndLogin(agentModerator, emailModerator, null, null);
                    await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null)).body.data;
                    report = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;
                    // Create a moderator in DB so that the Moderation email flow is executed

                    return Moderator.create({
                        userId: userModerator.id
                    });
                });

                test('Success', async function () {
                    const reportResult = (await topicReportRead(agentModerator, topic.id, report.id)).body.data;
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
                });

                test('Fail - 40100 - Only moderators can read a report', async function () {
                    _topicReportRead(agentCreator, topic.id, report.id, 401);
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

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUserAndLogin(agentModerator, emailModerator, null, null);
                    await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);

                    return Moderator.create({
                        userId: userModerator.id
                    });
                });

                setup(async function () {
                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null)).body.data;
                    report = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;
                });

                test('Success', async function () {
                    const type = Report.TYPES.spam;
                    const text = 'Test: contains spam.';

                    const moderateResult = (await topicReportModerate(agentModerator, topic.id, report.id, type, text)).body.data;
                    const reportReadResult = (await topicReportRead(agentModerator, topic.id, report.id)).body.data
                    delete reportReadResult.topic; // No Topic info returned in moderation result

                    assert.deepEqual(moderateResult, reportReadResult);
                });

                test('Fail - 40012 - Report has become invalid cause the report has been already moderated', async function () {
                    const type = Report.TYPES.spam;
                    const text = 'Test: contains spam.';

                    await topicReportModerate(agentModerator, topic.id, report.id, type, text);
                    const resBody = (await _topicReportModerate(agentModerator, topic.id, report.id, type, text, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40012,
                            message: 'Report has become invalid cause the report has been already moderated'
                        }
                    };
                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - 40000 - type cannot be null', async function () {
                    const type = null;
                    const text = 'Test: contains spam.';

                    const resBody = (await _topicReportModerate(agentModerator, topic.id, report.id, type, text, 400)).body;
                    const expectedBody = {
                        status: {code: 40000},
                        errors: {
                            moderatedReasonType: 'TopicReport.moderatedReasonType cannot be null when moderator is set'
                        }
                    };
                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - 40000 - text cannot be null', async function () {
                    const type = Report.TYPES.spam;
                    const text = null;

                    const resBody = (await _topicReportModerate(agentModerator, topic.id, report.id, type, text, 400)).body;
                    const expectedBody = {
                        status: {code: 40000},
                        errors: {
                            moderatedReasonText: 'Text can be 1 to 2048 characters long.'
                        }
                    };
                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - 40100 - Moderation only allowed for Moderators', async function () {
                    const type = Report.TYPES.spam;
                    const text = null;

                    return _topicReportModerate(agentCreator, topic.id, report.id, type, text, 401);
                });
            });

            suite('Review', function () {
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
                let userReporter;

                let topic;
                let report;

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUserAndLogin(agentModerator, emailModerator, null, null);
                    userReporter = await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);

                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null)).body.data;

                    report = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;

                    const type = Report.TYPES.spam;
                    const text = 'Test: contains spam.';

                    // Create a moderator in DB so that the Moderation email flow is executed
                    await Moderator.create({userId: userModerator.id});
                    await topicReportModerate(agentModerator, topic.id, report.id, type, text);
                });

                test('Success', async function () {
                    topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, 'Please review, I have made many changes');
                });

                test('Fail - 40300 - Unauthorized, restricted to Users with access', async function () {
                    _topicReportsReview(agentReporter, userReporter.id, topic.id, report.id, 'Please review, I have made many changes', 403);
                });

                test('Fail - 40001 - Missing required parameter "text"', async function () {
                    const resBody = (await _topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, undefined, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40001,
                            message: 'Bad request'
                        },
                        errors: {text: 'Parameter "text" has to be between 10 and 4000 characters'}
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - 40001 - Review text too short', async function () {
                    const resBody = (await _topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, 'x', 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40001,
                            message: 'Bad request'
                        },
                        errors: {text: 'Parameter "text" has to be between 10 and 4000 characters'}
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - 40001 - Review text too long', async function () {
                    const text = new Array(4002).join('a');
                    const resBody = (await _topicReportsReview(agentCreator, userCreator.id, topic.id, report.id, text, 400)).body;

                    const expectedBody = {
                        status: {
                            code: 40001,
                            message: 'Bad request'
                        },
                        errors: {text: 'Parameter "text" has to be between 10 and 4000 characters'}
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

                test('Fail - 40300 - Review requests are only allowed for Topic members', async function () {
                    return _topicReportsReview(agentReporter, userReporter.id, topic.id, report.id, 'Please review, I have made many changes', 403);
                });
            });

            suite('Resolve', function () {
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

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUserAndLogin(agentModerator, emailModerator, null, null);
                    await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);

                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, topicDescription, null)).body.data;

                    report = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;

                    const type = Report.TYPES.spam;
                    const text = 'Test: contains spam.';

                    // Create a moderator in DB so that the Moderation email flow is executed
                    await Moderator.create({userId: userModerator.id});
                    await topicReportModerate(agentModerator, topic.id, report.id, type, text);
                });

                test('Success', async function () {
                    return topicReportsResolve(agentModerator, topic.id, report.id);
                });

                test('Fail - 40100 - Only Moderators can resolve a report', async function () {
                    return _topicReportsResolve(agentReporter, topic.id, report.id, 401);
                });
            });
        });
    });
});

// API - /api/topics - unauthenticated endpoints
suite('Topics', function () {

    suiteSetup(async function () {
        return shared.syncDb();
    });

    suite('Read', function () {
        const creatorAgent = request.agent(app);

        let creator;

        let topic;

        suiteSetup(async function () {
            creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
        });

        setup(async function () {
            topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business], null, null, null)).body.data;
        });

        test('Success', async function () {
            const topicR = (await topicRead(creatorAgent, creator.id, topic.id, null)).body;
            const topicRUnauth = (await topicReadUnauth(request.agent(app), topic.id, null)).body;

            // The only difference between auth and unauth is the permission, thus modify it in expected response.
            topicR.data.permission.level = TopicMemberUser.LEVELS.none;
            assert.notProperty(topicR.data, 'events');

            delete topicR.data.join; // Unauth read of Topic should not give out TopicJoin info!
            delete topicR.data.pinned; // Unauth read of Topic should not give out pinned tag value!

            // Also, padUrl will not have authorization token
            topicR.data.padUrl = topicR.data.padUrl.split('?')[0];

            assert.deepEqual(topicRUnauth, topicR);
        });

        suite('Include', function () {
            test('Success - vote', async function () {
                const options = [
                    {
                        value: 'YES'
                    },
                    {
                        value: 'NO'
                    }
                ];
                await topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft);
                const topicR = (await topicRead(creatorAgent, creator.id, topic.id, 'vote')).body;
                const topicRUnauth = (await topicReadUnauth(request.agent(app), topic.id, ['vote'])).body;
                // The only difference between auth and unauth is the permission, thus modify it in expected response.
                topicR.data.permission.level = TopicMemberUser.LEVELS.none;

                delete topicR.data.join; // Unauth read of Topic should not give out TopicJoin info!
                delete topicR.data.pinned; // Unauth read of Topic should not give out pinned tag value!

                // Also, padUrl will not have authorization token
                topicR.data.padUrl = topicR.data.padUrl.split('?')[0];

                const vote = topicR.data.vote;

                assert.property(vote, 'options');
                assert.property(vote.options, 'count');
                assert.property(vote.options, 'rows');

                vote.options.rows.forEach(function (option) {
                    assert.property(option, 'id');
                    assert.property(option, 'value');
                });

                assert.deepEqual(topicRUnauth, topicR);
            });

            test('Success - events', async function () {
                await topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp);
                const topicR = (await topicRead(creatorAgent, creator.id, topic.id, 'event')).body;
                const topicRUnauth = (await topicReadUnauth(request.agent(app), topic.id, ['event'])).body;

                assert.equal(topicR.data.status, Topic.STATUSES.followUp);
                // The only difference between auth and unauth is the permission, thus modify it in expected response.
                topicR.data.permission.level = TopicMemberUser.LEVELS.none;

                delete topicR.data.join; // Unauth read of Topic should not give out TopicJoin info!
                delete topicR.data.pinned; // Unauth read of Topic should not give out pinned tag value!

                // Also, padUrl will not have authorization token
                topicR.data.padUrl = topicR.data.padUrl.split('?')[0];

                const events = topicR.data.events;

                assert.property(events, 'count');
                assert.equal(events.count, 0);

                assert.deepEqual(topicRUnauth, topicR);
            });
        });

        test('Success - all', async function () {
            const options = [
                {
                    value: 'YES'
                },
                {
                    value: 'NO'
                }
            ];
            await topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, Vote.AUTH_TYPES.soft);
            await topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp);
            const topicR = (await topicRead(creatorAgent, creator.id, topic.id, ['vote', 'event'])).body;
            const topicRUnauth = (await topicReadUnauth(request.agent(app), topic.id, ['vote', 'event'])).body;

            assert.equal(topicR.data.status, Topic.STATUSES.followUp);
            // The only difference between auth and unauth is the permission, thus modify it in expected response.
            topicR.data.permission.level = TopicMemberUser.LEVELS.none;

            delete topicR.data.join; // Unauth read of Topic should not give out TopicJoin info!
            delete topicR.data.pinned; // Unauth read of Topic should not give out pinned tag value!

            // Also, padUrl will not have authorization token
            topicR.data.padUrl = topicR.data.padUrl.split('?')[0];

            const events = topicR.data.events;

            assert.property(events, 'count');
            assert.equal(events.count, 0);

            const vote = topicR.data.vote;

            assert.property(vote, 'options');
            assert.property(vote.options, 'count');
            assert.property(vote.options, 'rows');

            vote.options.rows.forEach(function (option) {
                assert.property(option, 'id');
                assert.property(option, 'value');
            });

            assert.deepEqual(topicRUnauth, topicR);
        });

    });

    suite('List', function () {
        const creatorAgent = request.agent(app);
        const userAgent = request.agent(app);

        let creator;
        let topic;

        suiteSetup(async function () {
            creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
        });

        setup(async function () {
            topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null)).body.data;
            // Set "title" to Topic, otherwise there will be no results because of the "title NOT NULL" in the query
            return Topic.update(
                {
                    title: 'TEST PUBLIC'
                },
                {
                    where: {
                        id: topic.id
                    }
                }
            );
        });

        test('Success - non-authenticated User - show "public" Topics', async function () {
            const data = (await topicsListUnauth(userAgent, null, null, null, null, null, null, null)).body.data;
            assert.property(data, 'countTotal');

            const listOfTopics = data.rows;

            assert.equal(data.count, listOfTopics.length);

            assert(listOfTopics.length > 0);
            assert(listOfTopics.length <= 26); // No limit, means default limit == 25

            listOfTopics.forEach(function (topic) {
                assert.equal(topic.visibility, Topic.VISIBILITY.public);
                assert.notProperty(topic, 'events');
            });
        });

        test('Success - non-authenticated User - limit and offset fallback', async function () {
            const data = (await topicsListUnauth(userAgent, null, null, null, 'sfsf', 'dsasdas', null, null)).body.data;
            assert.property(data, 'countTotal');

            const listOfTopics = data.rows;

            assert.equal(data.count, listOfTopics.length);

            assert(listOfTopics.length > 0);
            assert(listOfTopics.length <= 26); // No limit, means default limit == 25

            listOfTopics.forEach(function (topic) {
                assert.equal(topic.visibility, Topic.VISIBILITY.public);
                assert.notProperty(topic, 'events');
            });
        });

        test('Success - non-authenticated User - show "public" Topics in categories', async function () {
            const data = (await topicsListUnauth(userAgent, null, [Topic.CATEGORIES.environment], null, null, null, null, null)).body.data;
            assert.property(data, 'countTotal');

            const listOfTopics = data.rows;

            assert.equal(data.count, listOfTopics.length);

            assert(listOfTopics.length > 0);
            assert(listOfTopics.length <= 26); // No limit, means default limit == 25

            listOfTopics.forEach(function (topic) {
                assert.equal(topic.visibility, Topic.VISIBILITY.public);
                assert.include(topic.categories, Topic.CATEGORIES.environment);
            });

            const data2 = (await topicsListUnauth(userAgent, null, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null, null, null)).body.data;

            assert.property(data2, 'countTotal');

            const topicList2 = data2.rows;

            assert.equal(topicList2.length, listOfTopics.length);

            assert(topicList2.length > 0);
            assert(topicList2.length <= 26); // No limit, means default limit == 25

            listOfTopics.forEach(function (topic) {
                assert.equal(topic.visibility, Topic.VISIBILITY.public);
                assert.include(topic.categories, Topic.CATEGORIES.environment);
                assert.include(topic.categories, Topic.CATEGORIES.health);
            });

            const data3 = (await topicsListUnauth(userAgent, null, [Topic.CATEGORIES.work], null, null, null, null, null)).body.data;
            assert.property(data3, 'countTotal');

            const topicList3 = data3.rows;

            assert.equal(data3.count, topicList3.length);

            assert(topicList3.length === 0);
        });

        test('Success - non-authenticated User - show "public" Topics with status', async function () {
            const data = (await topicsListUnauth(userAgent, Topic.STATUSES.inProgress, null, null, null, null, null, null)).body.data;

            assert.property(data, 'countTotal');

            const listOfTopics = data.rows;

            assert.equal(data.count, listOfTopics.length);

            assert(listOfTopics.length > 0);
            assert(listOfTopics.length <= 26); // No limit, means default limit == 25

            listOfTopics.forEach((topic) => {
                assert.equal(topic.visibility, Topic.VISIBILITY.public);
            });

            const data2 = (await topicsListUnauth(userAgent, Topic.STATUSES.voting, null, null, null, null, null, null)).body.data;
            assert.property(data2, 'countTotal');

            const topicList2 = data2.rows;

            assert.notEqual(topicList2.length, listOfTopics.length);
            assert.equal(topicList2.length, 0);
        });

        test('Success - non-authenticated User - don\'t show deleted "public" Topics', async function () {

            const deletedTopic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null)).body.data;
            // Set "title" to Topic, otherwise there will be no results because of the "title NOT NULL" in the query
            await Topic.update(
                {
                    title: 'TEST PUBLIC DELETE'
                },
                {
                    where: {
                        id: deletedTopic.id
                    }
                }
            );
            await topicDelete(creatorAgent, creator.id, deletedTopic.id);

            const topicListRes = (await topicsListUnauth(userAgent, Topic.STATUSES.inProgress, null, null, null, null, null, null)).body.data;

            assert.property(topicListRes, 'countTotal');

            const listOfTopics = topicListRes.rows;

            assert.equal(topicListRes.count, listOfTopics.length);

            assert(listOfTopics.length > 0);
            assert(listOfTopics.length <= 26); // No limit, means default limit == 25

            listOfTopics.forEach(function (resTopic) {
                assert.notEqual(deletedTopic.id, resTopic.id);
            });

        });

        test('Success - non-authenticated User - show "public" Topics with sourcePartnerId', async function () {
            const now = moment().format();
            const partnerId = uuid.v4();
            await db
                .query(
                    `
                    INSERT INTO
                    "Partners" (id, website, "redirectUriRegexp", "createdAt", "updatedAt")
                        SELECT
                        :partnerId,
                        :website,
                        :partnerRegEx,
                        :updatedAt,
                        :createdAt
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM "Partners"
                            WHERE id = :partnerId
                        );
                    `,
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
                );

            const partnerTopic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health], null, null, null)).body.data;

            // Set "title" to Topic, otherwise there will be no results because of the "title NOT NULL" in the query
            await Topic.update(
                {
                    title: 'TEST PUBLIC PARTNER',
                    sourcePartnerId: partnerId
                },
                {
                    where: {
                        id: partnerTopic.id
                    }
                }
            );
            const data = (await topicsListUnauth(userAgent, null, null, null, null, null, partnerId, null)).body.data;

            assert.property(data, 'countTotal');

            const listOfTopics = data.rows;
            assert.equal(data.count, listOfTopics.length);
            assert.equal(listOfTopics.length, 1);
            listOfTopics.forEach(function (topic) {
                assert.property(topic, 'sourcePartnerId');
                assert.equal(topic.sourcePartnerId, partnerId);
            });
        });

        suite('Include', function () {
            const creatorAgent = request.agent(app);
            const userAgent = request.agent(app);

            let creator;
            let topic;

            const options = [
                {
                    value: 'YES'
                },
                {
                    value: 'NO'
                }
            ];

            suiteSetup(async function () {
                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
            });

            setup(async function () {
                topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                await Topic.update(
                    {
                        title: 'TEST PUBLIC'
                    },
                    {
                        where: {
                            id: topic.id
                        }
                    }
                );
                const vote = (await topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, null)).body.data;
                const voteRead = (await topicVoteRead(creatorAgent, creator.id, topic.id, vote.id)).body.data;
                const voteReadUnauth = (await topicVoteReadUnauth(userAgent, topic.id, vote.id)).body.data;

                // For consistency, the logged in authenticated and unauthenticated should give same result
                assert.deepEqual(voteReadUnauth, voteRead);
            });

            test('Success - non-authenticated User - show "public" Topics include vote', async function () {
                const data = (await topicsListUnauth(userAgent, null, null, null, null, null, null, 'vote')).body.data;
                assert.property(data, 'countTotal');
                assert.isNumber(data.countTotal);
                const listOfTopics = data.rows;

                assert.equal(data.count, listOfTopics.length);

                assert(listOfTopics.length > 0);
                assert(listOfTopics.length <= 26); // No limit, means default limit == 25
                listOfTopics.forEach(async function (topicItem) {
                    assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                    if (topicItem.status === Topic.STATUSES.voting) {
                        const vote = topicItem.vote;
                        /// Compare that result from vote read is same as in included vote property
                        const voteRead = (await topicVoteRead(creatorAgent, creator.id, topicItem.id, vote.id)).body.data;
                        assert.deepEqual(vote, voteRead);
                    }
                });
            });

            test('Success - non-authenticated User - show "public" Topics include events', async function () {
                await topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp);

                const data = (await topicsListUnauth(userAgent, null, null, null, null, null, null, 'event')).body.data;

                assert.property(data, 'countTotal');
                assert.isNumber(data.countTotal);
                const listOfTopics = data.rows;

                assert.equal(data.count, listOfTopics.length);

                assert(listOfTopics.length > 0);
                assert(listOfTopics.length <= 26); // No limit, means default limit == 25
                listOfTopics.forEach(function (topicItem) {
                    assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                    if (topicItem.status === Topic.STATUSES.followUp) {
                        assert.property(topicItem, 'events');
                        assert.equal(topicItem.events.count, 0);
                    }
                });
            });

            test('Success - non-authenticated User - show "public" Topics include all', async function () {
                await topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.followUp);

                const data = (await topicsListUnauth(userAgent, null, null, null, null, null, null, ['event', 'vote'])).body.data;

                assert.property(data, 'countTotal');
                assert.isNumber(data.countTotal);
                const listOfTopics = data.rows;

                assert.equal(data.count, listOfTopics.length);

                assert(listOfTopics.length > 0);
                assert(listOfTopics.length <= 26); // No limit, means default limit == 25
                listOfTopics.forEach(async function (topicItem) {
                    assert.equal(topicItem.visibility, Topic.VISIBILITY.public);
                    assert.property(topicItem, 'events');
                    if (topicItem.status === Topic.STATUSES.followUp) {
                        assert.property(topicItem, 'vote');
                        assert.equal(topicItem.events.count, 0);
                    } else if (topicItem.status === Topic.STATUSES.voting) {
                        const vote = topicItem.vote;
                        /// Compare that result from vote read is same as in included vote property
                        const voteRead = (await topicVoteRead(creatorAgent, creator.id, topicItem.id, vote.id)).body.data;
                        assert.deepEqual(vote, voteRead);
                    }
                });
            });

        });

    });

    suite('Comments', function () {

        suite('List', function () {

            const creatorAgent = request.agent(app);
            const userAgent = request.agent(app);

            let creator;
            let topic;
            let partner;

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

            suiteSetup(async function () {
                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture], null, null, null)).body.data;
                comment1 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, commentType1, commentSubj1, commentText1)).body.data;
                comment2 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, commentType2, commentSubj2, commentText2)).body.data;
                comment3 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, commentType1, commentSubj3, commentText3)).body.data;
                partner = await Partner.create({
                    website: 'notimportant',
                    redirectUriRegexp: 'notimportant'
                });

                reply1 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, comment3.id, null, null, null, replyText1)).body.data;
                reply2 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, comment3.id, null, null, null, replyText2)).body.data;
                reply3 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, comment3.id, null, null, null, replyText3)).body.data;

                reply11 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply1.id, null, null, null, replyText11)).body.data;
                reply21 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply2.id, null, null, null, replyText21)).body.data;

                reply111 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply11.id, null, null, null, replyText111)).body.data;
                reply211 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply21.id, null, null, null, replyText211)).body.data;
                reply212 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply21.id, null, null, null, replyText212)).body.data;
                reply2121 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply212.id, null, null, null, replyText2121)).body.data;
                reply1111 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply111.id, null, null, null, replyText1111)).body.data;

                reply11111 = (await topicCommentCreate(creatorAgent, creator.id, topic.id, reply1111.id, null, null, null, replyText11111)).body.data;
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
                await topicCommentVotesCreate(creatorAgent, topic.id, comment2.id, 1);
                await topicCommentVotesCreate(creatorAgent, topic.id, comment1.id, -1);
                await topicCommentVotesCreate(creatorAgent, topic.id, reply212.id, 1);
                await topicCommentVotesCreate(creatorAgent, topic.id, reply2.id, -1);
                await topicCommentVotesCreate(creatorAgent, topic.id, reply3.id, 1);
            });

            test('Success', async function () {
                const topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture], null, null, null)).body.data;

                await topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, Comment.TYPES.pro, 'Subject', 'WOHOO! This is my comment.');
                // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                const creatorCommentList = (await topicCommentList(creatorAgent, creator.id, topic.id, null)).body;
                const userCommentList = (await topicCommentListUnauth(userAgent, topic.id, null)).body;

                assert.deepEqual(creatorCommentList, userCommentList);
            });

            test('Success - public Topic without comments', async function () {
                const topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.defense, Topic.CATEGORIES.education], null, null, null)).body.data;
                // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                const creatorCommentList = (await topicCommentList(creatorAgent, creator.id, topic.id, null)).body;
                const userCommentList = (await topicCommentListUnauth(userAgent, topic.id, null)).body;

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
                const data = (await topicCommentListUnauth(userAgent, topic.id, 'date')).body.data;
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
                const data = (await topicCommentList(creatorAgent, creator.id, topic.id, 'rating')).body.data;
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
                const data = (await topicCommentList(creatorAgent, creator.id, topic.id, 'popularity')).body.data;
                const expectedResult = {
                    rows: [comment2, comment1, comment3],
                    count: {
                        total: 14,
                        pro: 2,
                        con: 1,
                        poi: 0,
                        reply:  11
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
                const data = (await topicCommentList(creatorAgent, creator.id, topic.id, 'date')).body.data;
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
                const topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;

                return _topicCommentListUnauth(userAgent, topic.id, null, 404);
            });

        });

        // API - /api/topics/:topicId/comments/:commentId/votes
        suite('Votes', function () {

            suite('Create', function () {
                const creatorAgent = request.agent(app);
                const userAgent = request.agent(app);
                const user2Agent = request.agent(app);

                let creator;
                let topic;
                let comment;

                suiteSetup(async function () {
                    creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                    await userLib.createUserAndLogin(userAgent, null, null, null);
                    await userLib.createUserAndLogin(user2Agent, null, null, null);
                });

                setup(async function () {
                    topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business], null, null, null)).body.data;
                    comment = (await topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, Comment.TYPES.pro, 'Subj', 'Text')).body.data;
                });

                test('Success - 20100 - Upvote', async function () {
                    const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 1)).body;
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
                    const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, comment.id, -1)).body;
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
                    const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 0)).body;
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
                    await topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 1);
                    const resBody = (await topicCommentVotesCreate(creatorAgent, topic.id, comment.id, -1)).body;
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
                    await topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 1);
                    await topicCommentVotesCreate(userAgent, topic.id, comment.id, 1);
                    const resBody = (await topicCommentVotesCreate(user2Agent, topic.id, comment.id, -1)).body;
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
                    const resBody = (await _topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 666, 400)).body;
                    const expectedBody = {
                        status: {code: 40000},
                        errors: {value: 'Vote value must be 1 (up-vote), -1 (down-vote) OR 0 to clear vote.'}
                    };
                    assert.deepEqual(resBody, expectedBody);
                });
            });

            suite('List', function () {
                const creatorAgent = request.agent(app);
                const creatorAgent2 = request.agent(app);

                let creator;
                let topic;
                let comment;

                suiteSetup(async function () {
                    creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                    await userLib.createUserAndLogin(creatorAgent2, null, null, null);
                });

                setup(async function () {
                    topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business], null, null, null)).body.data;
                    comment = (await topicCommentCreate(creatorAgent, creator.id, topic.id, null, null, Comment.TYPES.pro, 'Subj', 'Text')).body.data
                });

                test('Success', async function () {
                    await topicCommentVotesCreate(creatorAgent, topic.id, comment.id, 1);
                    await topicCommentVotesCreate(creatorAgent2, topic.id, comment.id, 0); //Add cleared vote that should not be returned;
                    const commentVotesList = (await topicCommentVotesList(creatorAgent, creator.id, topic.id, comment.id)).body.data;
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

        // API - /api/topics/:topicId/comments/:commentId/reports
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
                let comment;

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                    userReporter = await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
                    comment = (await topicCommentCreate(agentCreator, userCreator.id, topic.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
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

                    const reportResult = (await topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, reportText)).body.data;
                    assert.isTrue(validator.isUUID(reportResult.id, 4));
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
                let comment;
                let report;

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                    await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;
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
                    comment = (await topicCommentCreate(agentCreator, userCreator.id, topic.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
                    report = (await topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, 'reported!')).body.data;
                });

                test('Success - token with audience', async function () {
                    const token = cosJwt.getTokenRestrictedUse(
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

                    const resBody = (await topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token)).body;
                    const expectedResult = {
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
                    assert.deepEqual(resBody, expectedResult);
                });

                test('Fail - 40100 - Invalid token', async function () {
                    const token = {};
                    return _topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token, 401);
                });

                test('Fail - 40100 - invalid token - without audience', async function () {
                    const token = jwt.sign(
                        {},
                        config.session.privateKey,
                        {
                            algorithm: config.session.algorithm
                        }
                    );

                    return _topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token, 401);
                });

                test('Fail - 40100 - invalid token - invalid audience', async function () {
                    const token = cosJwt.getTokenRestrictedUse({}, 'GET /foo/bar');

                    return _topicCommentReportRead(request.agent(app), topic.id, comment.id, report.id, token, 401);
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
                let comment;
                let report;

                suiteSetup(async function () {
                    userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                    userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                    await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                    topic = (await topicCreate(agentCreator, userCreator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;

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
                    comment = (await topicCommentCreate(agentCreator, userCreator.id, topic.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
                    report = (await topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, 'Report create test text')).body.data;

                });

                test('Success', async function () {
                    const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                    const moderateText = 'Report create moderation text';

                    const token = cosJwt.getTokenRestrictedUse(
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

                    await topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, token, moderateType, moderateText);

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
                    return _topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, 'TOKEN HERE', Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
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

                    return _topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, token, Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
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

                    report = (await topicCommentReportCreate(agentReporter, topic.id, comment.id, Report.TYPES.hate, 'Report create test text')).body.data;
                    const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                    const moderateText = 'Report create moderation text';

                    const token = cosJwt.getTokenRestrictedUse(
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
                    const resBody = (await _topicCommentReportModerate(request.agent(app), topic.id, comment.id, report.id, token, moderateType, moderateText, 400)).body;
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

    });

    suite('Votes', function () {

        suite('Read', function () {

            const creatorAgent = request.agent(app);
            const userAgent = request.agent(app);

            let creator;

            suiteSetup(async function () {
                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
            });

            test('Success', async function () {
                const topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.public, null, null, null, null)).body.data;

                const options = [
                    {
                        value: 'YES'
                    },
                    {
                        value: 'NO'
                    }
                ];

                const vote = (await topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, null)).body.data;
                const voteRead = (await topicVoteRead(creatorAgent, creator.id, topic.id, vote.id)).body.data;
                const voteReadUnauth = (await topicVoteReadUnauth(userAgent, topic.id, vote.id)).body.data;

                // For consistency, the logged in authenticated and unauthenticated should give same result
                assert.deepEqual(voteReadUnauth, voteRead);
            });

            test('Fail - 404 - trying to fetch Vote of non-public Topic', async function () {
                const topic = (await topicCreate(creatorAgent, creator.id, Topic.VISIBILITY.private, null, null, null, null)).body.data;

                const options = [
                    {
                        value: 'YES'
                    },
                    {
                        value: 'NO'
                    }
                ];

                const vote = (await topicVoteCreate(creatorAgent, creator.id, topic.id, options, 1, 1, false, null, null, Vote.TYPES.regular, null)).body.data;

                await _topicVoteReadUnauth(userAgent, topic.id, vote.id, 404);
            });

        });

        suite('Vote', function () {

            suite('authType === hard', function () {

                suite('Sign', function () {

                    test('Fail - Unauthorized - JWT token expired', async function () {
                        const token = jwt.sign({
                            id: 'notimportantinthistest',
                            scope: 'all'
                        }, config.session.privateKey, {
                            expiresIn: '.1ms',
                            algorithm: config.session.algorithm
                        });
                        const resBody = (await _topicVoteSignUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', [], 'notimportant', 'notimportant', token, 401)).body;

                        const expectedResponse = {
                            status: {
                                code: 40100,
                                message: 'JWT token has expired'
                            }
                        };
                        assert.deepEqual(resBody, expectedResponse);
                    });

                });

                suite('Status', function () {

                    test('Fail - Unauthorized - JWT token expired', async function () {
                        const token = jwt.sign({
                            id: 'notimportantinthistest',
                            scope: 'all'
                        }, config.session.privateKey, {
                            expiresIn: '.1ms',
                            algorithm: config.session.algorithm
                        });
                        const resBody = (await _topicVoteStatusUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401)).body;

                        const expectedResponse = {
                            status: {
                                code: 40100,
                                message: 'JWT token has expired'
                            }
                        };
                        assert.deepEqual(resBody, expectedResponse);
                    });

                });

                suite('Downloads', function () {

                    suite('Final', function () {

                        test('Fail - Unauthorized - JWT token expired', async function () {
                            const token = jwt.sign({path: '/not/important'}, config.session.privateKey, {
                                expiresIn: '.1ms',
                                algorithm: config.session.algorithm
                            });
                            const resBody = (await _topicVoteDownloadBdocFinalUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401)).body
                            const expectedResponse = {
                                status: {
                                    code: 40100,
                                    message: 'JWT token has expired'
                                }
                            };
                            assert.deepEqual(resBody, expectedResponse);
                        });

                        test('Fail - Bad Request - Invalid JWT token - invalid path', async function () {
                            const token = jwt.sign({path: '/this/is/wrong'}, config.session.privateKey, {
                                expiresIn: '1m',
                                algorithm: config.session.algorithm
                            });
                            const resBody = (await _topicVoteDownloadBdocFinalUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40100,
                                    message: 'Invalid JWT token'
                                }
                            };
                            assert.deepEqual(resBody, expectedResponse);
                        });

                    });


                    suite('User', function () {

                        test('Fail - Unauthorized - JWT token expired', async function () {
                            const token = jwt.sign({
                                id: 'notimportantinthistest',
                                scope: 'all'
                            }, config.session.privateKey, {
                                expiresIn: '.1ms',
                                algorithm: config.session.algorithm
                            });
                            const resBody = (await _topicVoteDownloadBdocUserUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401)).body;

                            const expectedResponse = {
                                status: {
                                    code: 40100,
                                    message: 'JWT token has expired'
                                }
                            };
                            assert.deepEqual(resBody, expectedResponse);
                        });

                        test('Fail - Bad Request - Invalid JWT token - invalid path', async function () {
                            const token = jwt.sign({path: '/this/is/wrong'}, config.session.privateKey, {
                                expiresIn: '1m',
                                algorithm: config.session.algorithm
                            });
                            const resBody = (await _topicVoteDownloadBdocUserUnauth(request.agent(app), '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', '5f471e25-b2b2-4e87-bfc9-6f96c9ac1866', token, 401)).body;

                            const expectedResponse = {
                                status: {
                                    code: 40100,
                                    message: 'Invalid JWT token'
                                }
                            };
                            assert.deepEqual(resBody, expectedResponse);
                        });

                    });

                });

            });

        });

    });

    suite('Events', function () {

        suite('Create, list, delete', function () {
            const agent = request.agent(app);

            let user;
            let topic;

            setup(async function () {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                topic = (await topicCreate(agent, user.id, null, null, null, null, null)).body.data;
                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.followUp);
            });

            test('Success', async function () {
                const subject = 'Test Event title';
                const text = 'Test Event description';

                const resBody = (await topicEventCreate(agent, user.id, topic.id, subject, text)).body;

                assert.equal(resBody.status.code, 20100);

                const event = resBody.data;
                assert.equal(event.subject, subject);
                assert.equal(event.text, text);
                assert.property(event, 'createdAt');
                assert.property(event, 'id');

                const eventList = (await topicEventList(agent, user.id, topic.id)).body;

                const expectedBody = {
                    status: {
                        code: 20000
                    },
                    data: {
                        count: 1,
                        rows: [event]
                    }
                };

                assert.deepEqual(eventList, expectedBody);

                await topicEventDelete(agent, user.id, topic.id, event.id);

                const eventListNew = (await topicEventList(agent, user.id, topic.id)).body;
                const expectedBody2 = {
                    status: {
                        code: 20000
                    },
                    data: {
                        count: 0,
                        rows: []
                    }
                };

                assert.deepEqual(eventListNew, expectedBody2);
            });

            test('Success - with token', async function () {
                const agent = request.agent(app);

                const subject = 'Test Event title, testing with token';
                const text = 'Test Event description, testing with token';

                const token = cosJwt.getTokenRestrictedUse(
                    {},
                    [
                        'POST /api/topics/:topicId/events'
                            .replace(':topicId', topic.id)
                    ],
                    {
                        expiresIn: '1d'
                    }
                );

                const event = (await topicEventCreateUnauth(agent, topic.id, token, subject, text)).body.data;
                assert.property(event, 'id');
                assert.property(event, 'createdAt');
                assert.equal(event.subject, subject);
                assert.equal(event.text, text);
            });

            test('Fail - Unauthorize - topic is closed', async function () {
                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.closed);
                const subject = 'Test Event title';
                const text = 'Test Event description';

                await _topicEventCreate(agent, user.id, topic.id, subject, text, 403);

            });

            test('Fail - with token', async function () {
                const agentNew = request.agent(app);

                const subject = 'Test Event title, testing with token';
                const text = 'Test Event description, testing with token';

                const token = cosJwt.getTokenRestrictedUse(
                    {},
                    [
                        'POST /api/topics/:topicId/events'
                            .replace(':topicId', topic.id)
                    ],
                    {
                        expiresIn: '1d'
                    }
                );
                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.closed);

                await _topicEventCreateUnauth(agentNew, topic.id, token, subject, text, 403);
            });

            test('Fail - Unauthorized - Invalid token', async function () {
                const agent = request.agent(app);
                const token = 'FOOBAR';

                const resBody = (await _topicEventCreateUnauth(agent, topic.id, token, 'notimportant', 'notimportant', 401)).body;
                const expectedBody = {
                    status: {
                        code: 40100,
                        message: 'Invalid JWT token'
                    }
                };
                assert.deepEqual(resBody, expectedBody);
            });

            test('Fail - Unauthorized - Invalid JWT token - invalid path', async function () {
                const agent = request.agent(app);
                const token = jwt.sign({path: '/this/is/wrong'}, config.session.privateKey, {
                    expiresIn: '1m',
                    algorithm: config.session.algorithm
                });

                const resBody = (await _topicEventCreateUnauth(agent, topic.id, token, 'notimportant', 'notimportant', 401)).body;
                const expectedBody = {
                    status: {
                        code: 40100,
                        message: 'Invalid JWT token'
                    }
                };
                assert.deepEqual(resBody, expectedBody);
            });

            test('Fail - Unauthorized - JWT token expired', async function () {
                const agent = request.agent(app);
                const token = jwt.sign({path: '/not/important'}, config.session.privateKey, {
                    expiresIn: '.1ms',
                    algorithm: config.session.algorithm
                });

                const resBody = (await _topicEventCreateUnauth(agent, 'notimportant', token, 'notimportant', 'notimportant', 401)).body;
                const expectedResponse = {
                    status: {
                        code: 40100,
                        message: 'JWT token has expired'
                    }
                };
                assert.deepEqual(resBody, expectedResponse);
            });
        });

    });

    // API - /api/topics/:topicId/mentions
    suite('Mentions', function () {

        suite('Read', function () {

            const agent = request.agent(app);

            let user;
            let topic;
            const mention1 = {
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

            setup(async function () {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                topic = (await topicCreate(agent, user.id, 'public', null, null, null, 'banana')).body.data;
            });

            test('Success - non-authenticated User', async function () {
                this.timeout(5000); //eslint-disable-line no-invalid-this

                const list = (await topicMentionListUnauth(agent, topic.id)).body.data;
                const mentions = list.rows;

                assert.isTrue(list.count > 0);
                assert.equal(list.count, mentions.length);
                assert.deepEqual(Object.keys(mentions[0]), Object.keys(mention1));
            });

            test('Success - non-authenticated User read from cache', async function () {
                this.timeout(5000); //eslint-disable-line no-invalid-this

                const list = (await topicMentionListUnauth(agent, topic.id)).body.data;
                const mentions = list.rows;

                assert.isTrue(list.count > 0);
                assert.equal(list.count, mentions.length);
                assert.deepEqual(Object.keys(mentions[0]), Object.keys(mention1));
            });

            test('Success - Twitter error, return from cache', async function () {
                const list = (await topicMentionListTestUnauth(agent, topic.id)).body.data;
                const mentions = list.rows;

                assert.isTrue(list.count > 0);
                assert.equal(list.count, mentions.length);
                assert.deepEqual(Object.keys(mentions[0]), Object.keys(mention1));
            });

            suite('Success - read without hashtag', function () {

                const agent = request.agent(app);

                let user;
                let topic;

                setup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicCreate(agent, user.id, 'public', null, null, null, null)).body.data;
                });

                test('Non-authenticated User', async function () {
                    this.timeout(5000); //eslint-disable-line no-invalid-this

                    const resBody = (await _topicMentionListUnauth(agent, topic.id, 400)).body;
                    const expectedBody = {
                        status: {
                            code: 40001,
                            message: 'Topic has no hashtag defined'
                        }
                    };

                    assert.deepEqual(resBody, expectedBody);
                });

            });

            test('Fail - 50000 - Twitter error, no cache', async function () {
                const agent = request.agent(app);

                const user = await userLib.createUserAndLogin(agent, null, null, null);

                const topic = (await topicCreate(agent, user.id, 'public', null, null, null, cosUtil.randomString(40))).body.data;

                const resBody = (await _topicMentionListTestUnauth(request.agent(app), topic.id, 500)).body;
                const expectedBody = {
                    status: {
                        code: 50000,
                        message: 'Internal Server Error'
                    }
                };

                assert.deepEqual(resBody, expectedBody);
            });

        });

    });

    suite('Pin', function () {
        const agent = request.agent(app);

        let user;
        let topic;

        setup(async function () {
            user = await userLib.createUserAndLogin(agent, null, null, null);
            topic = (await topicCreate(agent, user.id, 'public', null, null, null, null)).body.data;
        });

        suite('Create', function () {
            test('Success', async function () {
                const resBody = (await topicFavouriteCreate(agent, user.id, topic.id)).body;

                const expectedBody = {
                    status: {
                        code: 20000
                    }
                };

                assert.deepEqual(resBody, expectedBody);
            });
        });

        suite('Delete', function () {

            test('Success', async function () {
                const resBody = (await topicFavouriteCreate(agent, user.id, topic.id)).body;
                const expectedBody = {
                    status: {
                        code: 20000
                    }
                };

                assert.deepEqual(resBody, expectedBody);

                const resBody2 = (await topicFavouriteDelete(agent, user.id, topic.id)).body
                const expectedBody2 = {
                    status: {
                        code: 20000
                    }
                };

                assert.deepEqual(resBody2, expectedBody2);
            });
        });
    });

    suite('Duplicate', function () {
        const agent = request.agent(app);
        const agent2 = request.agent(app);

        let user;
        let user2;
        let topic;
        const description = 'Public topic description';

        setup(async function () {
            user = await userLib.createUserAndLogin(agent, null, null, null);
            user2 = await userLib.createUserAndLogin(agent2, null, null, null);
            topic = (await topicCreate(agent, user.id, 'public', null, null, description, null)).body.data;
            const members = [
                {
                    userId: user2.id,
                    level: TopicMemberUser.LEVELS.read
                }
            ];
            await memberLib.topicMemberUsersCreate(topic.id, members);
        });

        suite('Create', function () {
            test('Success', async function () {
                const resBody = (await duplicateTopic(agent, user.id, topic.id)).body.data;
                // description is excluded because how Etherpad handles final lines and <br> tags
                const matchingValueKeys = ['title', 'status', 'permission', 'endsAt', 'hashtag'];
                Object.entries(resBody).forEach(([key, value]) => {
                    if (matchingValueKeys.indexOf(key) > -1) {
                        assert.deepEqual(value, topic[key]);
                    }
                });
                assert.equal(topic.description, resBody.description.replace('<br><br><br>', '<br><br>'));
                assert.equal(resBody.visibility, Topic.VISIBILITY.private);
            });

            test('Fail - no permissions', async function () {
                const resultMessage = (await _duplicateTopic(agent2, user2.id, topic.id, 403)).body;
                const expectedResult = {
                    status: {
                        code: 40300,
                        message: 'Forbidden'
                    }
                };
                assert.deepEqual(resultMessage, expectedResult);
            });
        });
    });

    suite('Notifications', function () {

    });
});
