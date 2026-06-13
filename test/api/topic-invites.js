'use strict';
// topic-invites.js - Topic invite flows

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

        suite('Invites', function () {

            suite('Users', function () {
                this.timeout(120000);
                suite('Create', function () {
                    let agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite;
                    let topic;

                    setup(async function () {
                        userToInvite = await userLib.createUser(request.agent(app), null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        topic = (await topicCreate(agentCreator, userCreator.id, 'TOPIC TITLE FOR INVITE TEST', Topic.STATUSES.inProgress, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>')).body.data;
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

                        const createdInviteUser1 = createdInvites.find((i) => { return i.level === invitation[0].level }); // find by level, not by id to keep the code simpler
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

                        const createdInviteUser2 = createdInvites.find((i) => { return i.level === invitation[1].level }); // find by level, not by id to keep the code simpler
                        //   console.log(invitation[1].level, createdInvites)
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
                        topic = (await topicCreate(agentCreator, userCreator.id, 'TOPIC TITLE FOR INVITE TEST', Topic.STATUSES.inProgress, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>')).body.data;
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
                            intro: topic.intro,
                            description: topic.description,
                            imageUrl: topic.imageUrl,
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
                            intro: topic.intro,
                            description: topic.description,
                            imageUrl: topic.imageUrl,
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
                            intro: topic.intro,
                            description: topic.description,
                            imageUrl: topic.imageUrl,
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
                            intro: topic.intro,
                            description: topic.description,
                            imageUrl: topic.imageUrl,
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
                        topic = (await topicCreate(agentCreator, userCreator.id, 'TOPIC TITLE FOR INVITE TEST', Topic.STATUSES.inProgress, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>')).body.data;

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
                            description: topic.description,
                            intro: topic.intro,
                            imageUrl: topic.imageUrl,
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

                        topic = (await topicCreate(agentCreator, userCreator.id, 'TOPIC TITLE FOR INVITE TEST', Topic.STATUSES.inProgress, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>')).body.data;

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
                        topic = (await topicCreate(agentCreator, userCreator.id, 'TOPIC TITLE FOR INVITE TEST', Topic.STATUSES.inProgress, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST</h2></body></html>')).body.data;

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
                        topic = (await topicCreate(agentCreator, userCreator.id, 'TOPIC TITLE FOR INVITE TEST ACCEPT', Topic.STATUSES.inProgress, '<html><head></head><body><h2>TOPIC TITLE FOR INVITE TEST ACCEPT</h2></body></html>')).body.data;

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
    });

});

