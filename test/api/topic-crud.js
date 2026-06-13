'use strict';
// topic-crud.js - Create, Read, Update, Delete

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

        suite('Create', function () {
            const agent = request.agent(app);
            const email = 'test_topicc_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            let user;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
            });

            test('Success', async function () {
                const topic = (await topicCreate(agent, user.id)).body.data;
                assert.property(topic, 'id');
                assert.equal(topic.creator.id, user.id);
                assert.equal(topic.visibility, Topic.VISIBILITY.private);
                assert.equal(topic.status, Topic.STATUSES.draft);
                assert.property(topic, 'padUrl');
            });

            test('Success - non-default visibility', async function () {
                const topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health])).body.data;
                assert.equal(topic.visibility, Topic.VISIBILITY.public);
            });

            test('Success - description', async function () {
                const description = '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><script>alert("owned!");</script><br><br>script<br><br></body></html>';
                const expectedDescription = '<!DOCTYPE HTML><html><body><h1>H1</h1><br><h2>h2</h2><br><h3>h3</h3><br><br><br>script<br><br><br></body></html>';

                // Override global mock for this test
                etherpadClient.getHTMLAsync = async () => Promise.resolve({ html: expectedDescription });

                const topic = (await topicCreate(agent, user.id, 'H1', Topic.STATUSES.inProgress, description, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health])).body.data;
                const getHtmlResult = await etherpadClient.getHTMLAsync({ padID: topic.id });
                assert.equal(getHtmlResult.html, expectedDescription);

                // Reload topic from DB to verify description update
                const topicR = (await topicRead(agent, user.id, topic.id, null)).body.data;
                assert.equal(topicR.title, 'H1');
                assert.equal(topicR.description, expectedDescription);
            });

            test('Success - create with categories', async function () {
                const categories = [Topic.CATEGORIES.work, Topic.CATEGORIES.varia, Topic.CATEGORIES.transport];
                const topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, categories)).body.data;
                assert.deepEqual(topic.categories, categories);
            });

            test('Success - valid hashtag', async function () {
                const hashtag = 'abcdefghijklmnopqrstuvxyzabcdefghijklmnopqrstuvxyzabcdefghi';
                const topic = (await topicCreate(agent, user.id, null, null, null, null, null, null, hashtag)).body.data;
                assert.equal(topic.hashtag, hashtag);
            });

            test('Success - empty hashtag', async function () {
                const topic = (await topicCreate(agent, user.id, null, null, null, null, null, null, '')).body.data;
                assert.equal(topic.hashtag, null);
            });

            test('Success - Replace invalid characters in hashtag', async function () {
                const hashtag = '      #abc   defgh ijk.lmn,opqrstuvxyzabcdefghij:klmnopqrstuvxyzabcdefghi        ';
                const topic = (await topicCreate(agent, user.id, null, null, null, null, null, null, hashtag)).body.data;
                assert.equal(topic.hashtag, 'abcdefghijklmnopqrstuvxyzabcdefghijklmnopqrstuvxyzabcdefghi');
            });

            test('Success - Country, language and contact', async function () {
                const contact = 'creator@topicauthor.eu';
                const country = 'Estonia';
                const language = 'Estonian';
                const topic = (await topicCreate(agent, user.id, null, null, null, null, null, null, null, contact, country, language)).body.data;
                assert.equal(topic.contact, contact);
                assert.equal(topic.country, country);
                assert.equal(topic.language, language);
            });

            test('Success - Intro', async function () {
                const contact = 'creator@topicauthor.eu';
                const country = 'Estonia';
                const language = 'Estonian';
                const intro = 'This is an introduction text to the topic that will be displayed before the main content of the document in the final read view';
                const topic = (await topicCreate(agent, user.id, null, null, null, null, null, null, null, contact, country, language, intro)).body.data;
                assert.equal(topic.contact, contact);
                assert.equal(topic.country, country);
                assert.equal(topic.language, language);
                assert.equal(topic.intro, intro);
            });

            test('Fail - 40100', async function () {
                await _topicCreate(request.agent(app), user.id, Topic.VISIBILITY.public, Topic.STATUSES.inProgress, null, null, null, null, null, null, null, null, null, 401);
            });

            test('Fail - 40000 - invalid hashtag', async function () {
                const res = await _topicCreate(agent, user.id, null, null, null, null, null, null, 'üüüüüüüüüüüüüüüüüüüüüüüüüüüüüüü', null, null, null, null, 400)
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

                topic = (await topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private, topicCategories)).body.data;
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
                topic.discussionId = null;
                topic.ideationId = null;
                topic.authors = [
                    {
                        id: user.id,
                        name: user.name
                    }
                ];
            });


            test('Success', async function () {
                const topicR = (await topicRead(agent, user.id, topic.id, null)).body.data;
                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedTopic = Object.assign({}, topic);
                expectedTopic.ideationId = null;
                //  delete expectedTopic.authors
                expectedTopic.updatedAt = topicR.updatedAt;
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
                expectedTopic.revision = 1;
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
                    const expectedTopic = Object.assign({}, topic);
                    expectedTopic.members = {
                        users: {
                            count: 1
                        },
                        groups: {
                            count: 0
                        }
                    };
                    expectedTopic.updatedAt = topicR.updatedAt;
                    expectedTopic.creator = user.toJSON();
                    expectedTopic.revision = 1;
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
                    const expectedTopic = Object.assign({}, topicR);

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
                    this.timeout(120000);

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
                        voteTopic = (await topicCreate(voteAgent, creator.id, null, null, null, Topic.VISIBILITY.private, voteTopicCategories)).body.data;
                        vote = (await topicVoteCreate(voteAgent, creator.id, voteTopic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                        await topicUpdateStatus(voteAgent, creator.id, voteTopic.id, Topic.STATUSES.voting);
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
                        const tokenData = jwt.verify(token, config.session.publicKey, { algorithms: [config.session.algorithm] });
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
                        topic = (await topicCreate(agentCreator, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.private)).body.data;

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
                            where: { id: topic.id }
                        });

                        const padUrl = cosEtherpad.getUserAccessUrl(topicData, user.id, user.name, user.language);
                        await _padRead(padUrl, 403);
                    });

                    test('Fail - Forbidden - Group access to Topic was revoked', async function () {
                        await topicMemberGroupsDelete(agentCreator, creator.id, topic.id, group.id);
                        await _topicRead(agentUser, user.id, topic.id, null, 403);

                        const topicData = await Topic.findOne({
                            where: { id: topic.id }
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

                        topic = (await topicCreate(agentCreator, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.taxes, Topic.CATEGORIES.transport])).body.data;
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
                topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, null, null, null, 'testtag')).body.data;
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
                const resBody = (await topicUpdateField(agent, user.id, topic.id, { visibility: Topic.VISIBILITY.public })).body;

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
                await topicUpdate(agent, user.id, topic.id, null, topicVisibilityNew, [], null, null);

                const topicNew = (await topicRead(agent, user.id, topic.id, null)).body.data;
                assert.equal(topicNew.status, topic.status);
            });

            test('Fail - Bad Request - update field - status is null - should not modify existing value', async function () {
                await _topicUpdateField(agent, user.id, topic.id, { status: null }, 400);

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
                const topicStatusNew = Topic.STATUSES.voting;
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
                await _topicUpdateField(agent, user.id, topic.id, { description: '<html><body><h1>New content</h1></body></html>' }, 400);
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
                topic = (await topicCreate(agent, user.id)).body.data;
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
                    await etherpadClient.getRevisionsCountAsync({ padID: topic.id });
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
    });

});

