'use strict';
// topic-members.js - Topic member management

'use strict';

const _topicCreate = async function (agent, userId, title, status, description, visibility, categories, endsAt, hashtag, contact, country, language, intro, expectedHttpCode) {
    const path = '/api/users/:userId/topics'
        .replace(':userId', userId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .set('Origin', 'https://citizenos.com')
        .send({
            visibility: visibility,
            status: status,
            categories: categories,
            description: description,
            intro: intro,
            endsAt: endsAt,
            contact: contact,
            country: country,
            language: language,
            title: title,
            hashtag: hashtag
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const topicCreate = async function (agent, userId, title, status, description, visibility, categories, endsAt, hashtag, contact, country, language, intro) {
    return _topicCreate(agent, userId, title, status, description, visibility, categories, endsAt, hashtag, contact, country, language, intro, 201);
};

const _topicRead = async function (agent, userId, topicId, include, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .get(path)
        .query({ include: include })
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
        .query({ include: include })
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
    };

    if (status) {
        payload.status = status;
    }

    if (visibility) {
        payload.visibility = visibility;
    }

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

const _topicList = async function (agent, userId, include, visibility, statuses, creatorId, hasVoted, showModerated, favourite, expectedHttpCode) {
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
            favourite: favourite
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const topicList = async function (agent, userId, include, visibility, statuses, creatorId, hasVoted, showModerated, favourite) {
    return _topicList(agent, userId, include, visibility, statuses, creatorId, hasVoted, showModerated, favourite, 200);
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
        .send({ level: level })
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
        .send({ level: level })
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
        .send({ level: level })
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
        .send({ name: name })
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
        .query({ download: true })
        .expect(expectedHttpCode);

};
//TODO: Missing test to use it?
const topicAttachmentDownload = async function (agent, userId, topicId, attachmentId) { //eslint-disable-line
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
        .query({ test: 'error' })
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
        .query({ token: token })
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
        .query({ token: token })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

//TODO: Missing test to use it?
const topicVoteStatusUnauth = async function (agent, topicId, voteId, token) {
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
const topicVoteSignUnauth = async function (agent, topicId, voteId, voteList, certificate, pid, token) { //eslint-disable-line
    return _topicVoteSignUnauth(agent, topicId, voteId, voteList, certificate, pid, token, 200);
};

const _topicVoteDownloadBdocFinalUnauth = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/final'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .query({ token: token })
        .send()
        .expect(expectedHttpCode);
};

//TODO: Missing test to use it?
const topicVoteDownloadBdocFinalUnauth = async function (agent, topicId, voteId, token) { //eslint-disable-line
    return _topicVoteDownloadBdocFinalUnauth(agent, topicId, voteId, token, 200);
};

const _topicVoteDownloadBdocUserUnauth = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/user'
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .query({ token: token })
        .send()
        .expect(expectedHttpCode);
};

const topicVoteDownloadBdocUserUnauth = async function (agent, topicId, voteId, token) { //eslint-disable-line
    return _topicVoteDownloadBdocUserUnauth(agent, topicId, voteId, token, 200);
};


const _topicVoteDownloadBdocUser = async function (agent, topicId, voteId, token, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/user'
        .replace(':userId', 'self')
        .replace(':topicId', topicId)
        .replace(':voteId', voteId);

    return agent
        .get(path)
        .query({ token: token })
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
        .send({ userId: toUserId })
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

const _topicEventUpdate = async function (agent, userId, topicId, eventId, subject, text, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/events/:eventId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':eventId', eventId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            subject: subject,
            text: text
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
}

const topicEventUpdate = async function (agent, userId, topicId, eventId, subject, text) {
    return _topicEventUpdate(agent, userId, topicId, eventId, subject, text, 200);
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
    const path = '/api/users/:userId/topics/:topicId/favourite'
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
    const path = '/api/users/:userId/topics/:topicId/favourite'
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
module.exports.topicUpdate = topicUpdate;
module.exports.topicFavouriteCreate = topicFavouriteCreate;
module.exports.topicDelete = topicDelete;
module.exports.topicMemberGroupsCreate = topicMemberGroupsCreate;
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
const cosSignature = app.get('cosSignature');
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
const discussionLib = require('./discussion');
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

// API - /api/users*
suite('Users', function () {

    suiteSetup(async function () {
        return shared.syncDb();
    });

    // API - /api/users/:userId/topics*
    suite('Topics', function () {

    let originalCreateVoteFiles;
    let originalGetHTMLAsync;

    suiteSetup(function () {
        // Store original if it exists
        originalGetHTMLAsync = etherpadClient.getHTMLAsync;

        originalCreateVoteFiles = cosSignature.createVoteFiles;
        cosSignature.createVoteFiles = async function () {
            return Promise.resolve();
        };
    });

    suiteTeardown(function () {
        cosSignature.createVoteFiles = originalCreateVoteFiles;
        if (originalGetHTMLAsync) {
            etherpadClient.getHTMLAsync = originalGetHTMLAsync;
        }
    });

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
                    topic = (await topicCreate(agent, user.id)).body.data;
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

                    const groupRes = groups.rows.find((g) => { return g.id === group.id });
                    assert.equal(groupRes.name, group.name);
                    assert.equal(groupRes.level, topicMemberGroupLevel);
                    assert.equal(groupRes.permission.level, TopicMemberGroup.LEVELS.admin);

                    const group2Res = groups.rows.find((g) => { return g.id === group2.id });
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
                        topic = (await topicCreate(agent, user.id)).body.data;

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
                        topic = (await topicCreate(agent, user.id)).body.data;
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

                        topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;
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

                        assert.equal(topicMemberGroup.level, member.level);
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
                        topic = (await topicCreate(agent, user.id)).body.data;

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
                        topic = (await topicCreate(agent, user.id)).body.data;

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
    });

});

