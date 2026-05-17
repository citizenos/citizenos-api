'use strict';
// topic-public.js - Public unauthenticated topic endpoints

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

// API - /api/topics - unauthenticated endpoints
suite('Topics', function () {
    let originalSyncTopicWithPad;
    let originalCreateTopic;
    let originalDeleteTopic;
    let originalCreateVoteFiles;

    suiteSetup(async function () {
        originalSyncTopicWithPad = cosEtherpad.syncTopicWithPad;
        cosEtherpad.syncTopicWithPad = async function (topicId) {
            return Topic.findOne({ where: { id: topicId } });
        };

        originalCreateTopic = cosEtherpad.createTopic;
        cosEtherpad.createTopic = async function () {
            return Promise.resolve();
        };

        originalDeleteTopic = cosEtherpad.deleteTopic;
        cosEtherpad.deleteTopic = async function () {
            return Promise.resolve();
        };

        originalCreateVoteFiles = cosSignature.createVoteFiles;
        cosSignature.createVoteFiles = async function () {
            return Promise.resolve();
        };

        return shared.syncDb();
    });

    suiteTeardown(function () {
        cosEtherpad.syncTopicWithPad = originalSyncTopicWithPad;
        cosEtherpad.createTopic = originalCreateTopic;
        cosEtherpad.deleteTopic = originalDeleteTopic;
        cosSignature.createVoteFiles = originalCreateVoteFiles;
    });

    suite('Read', function () {
        const creatorAgent = request.agent(app);

        let creator;

        let topic;

        suiteSetup(async function () {
            creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
        });

        setup(async function () {
            topic = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
        });

        test('Success', async function () {
            const topicR = (await topicRead(creatorAgent, creator.id, topic.id, null)).body;
            const topicRUnauth = (await topicReadUnauth(request.agent(app), topic.id, null)).body;

            // The only difference between auth and unauth is the permission, thus modify it in expected response.
            topicR.data.permission.level = TopicMemberUser.LEVELS.none;
            assert.notProperty(topicR.data, 'events');

            delete topicR.data.join; // Unauth read of Topic should not give out TopicJoin info!
            delete topicR.data.favourite; // Unauth read of Topic should not give out favourite tag value!

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
                delete topicR.data.favourite; // Unauth read of Topic should not give out favourite tag value!

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
                delete topicR.data.favourite; // Unauth read of Topic should not give out favourite tag value!

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
            let topicR = (await topicRead(creatorAgent, creator.id, topic.id, ['vote', 'event'])).body;
            let topicRUnauth = (await topicReadUnauth(request.agent(app), topic.id, ['vote', 'event'])).body;

            assert.equal(topicR.data.status, Topic.STATUSES.followUp);
            // The only difference between auth and unauth is the permission, thus modify it in expected response.
            topicR.data.permission.level = TopicMemberUser.LEVELS.none;

            delete topicR.data.join; // Unauth read of Topic should not give out TopicJoin info!
            delete topicR.data.favourite; // Unauth read of Topic should not give out favourite tag value!

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
            topic = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health])).body.data;
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

            const deletedTopic = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health])).body.data;
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

            const partnerTopic = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.environment, Topic.CATEGORIES.health])).body.data;

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
                topic = (await topicCreate(creatorAgent, creator.id, null, null, null, Topic.VISIBILITY.public)).body.data;
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
                await topicUpdateStatus(creatorAgent, creator.id, topic.id, Topic.STATUSES.voting);
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

    suite('Votes', function () {

        suite('Read', function () {

            const creatorAgent = request.agent(app);
            const userAgent = request.agent(app);

            let creator;

            suiteSetup(async function () {
                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
            });

            test('Success', async function () {
                const topic = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;

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
                const topic = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.private)).body.data;

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
                            const token = jwt.sign({ path: '/not/important' }, config.session.privateKey, {
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
                            const token = jwt.sign({ path: '/this/is/wrong' }, config.session.privateKey, {
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
                            const token = jwt.sign({ path: '/this/is/wrong' }, config.session.privateKey, {
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

        suite('Create, update, list, delete', function () {
            const agent = request.agent(app);

            let user;
            let topic;

            setup(async function () {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                topic = (await topicCreate(agent, user.id)).body.data;
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

            test('Update - Success', async function () {
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
                const subjectUpdate = 'Test Event title updated';
                const textUpdate = 'Test Event description updated';
                const resBodyUpdate = (await topicEventUpdate(agent, user.id, topic.id, event.id, subjectUpdate, textUpdate)).body;

                assert.equal(resBodyUpdate.status.code, 20000);

                const eventUpdated = resBodyUpdate.data;
                assert.equal(eventUpdated.id, event.id);
                assert.equal(eventUpdated.subject, subjectUpdate);
                assert.equal(eventUpdated.text, textUpdate);
                assert.equal(eventUpdated.createdAt, event.createdAt);
                assert.notEqual(eventUpdated.updatedAt, event.updatedAt);

                const eventList2 = (await topicEventList(agent, user.id, topic.id)).body;

                const expectedBody2 = {
                    status: {
                        code: 20000
                    },
                    data: {
                        count: 1,
                        rows: [eventUpdated]
                    }
                };
                assert.deepEqual(eventList2, expectedBody2);
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
                const token = jwt.sign({ path: '/this/is/wrong' }, config.session.privateKey, {
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
                const token = jwt.sign({ path: '/not/important' }, config.session.privateKey, {
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
    suite.skip('Mentions', function () {

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
                topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, null, null, 'banana')).body.data;
            });

            test('Success - non-authenticated User', async function () {
                this.timeout(5000);

                const list = (await topicMentionListUnauth(agent, topic.id)).body.data;
                const mentions = list.rows;

                assert.isTrue(list.count > 0);
                assert.equal(list.count, mentions.length);
                assert.deepEqual(Object.keys(mentions[0]), Object.keys(mention1));
            });

            test('Success - non-authenticated User read from cache', async function () {
                this.timeout(5000);

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
                    topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;
                });

                test('Non-authenticated User', async function () {
                    this.timeout(5000);

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

                const topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public, null, null, cosUtil.randomString(40))).body.data;

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

    suite('Favourite', function () {
        const agent = request.agent(app);

        let user;
        let topic;

        setup(async function () {
            user = await userLib.createUserAndLogin(agent, null, null, null);
            topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;
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
            topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, description, Topic.VISIBILITY.public)).body.data;
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
                const matchingValueKeys = ['title', 'permission', 'endsAt', 'hashtag'];

                Object.entries(resBody).forEach(([key, value]) => {
                    if (matchingValueKeys.indexOf(key) > -1) {
                        assert.deepEqual(value, topic[key]);
                    }
                });
                assert.equal(resBody.status, Topic.STATUSES.draft);
                console.log(resBody.description);
                assert.equal(topic.description, resBody.description.replace('<br><br><br>', '<br><br>'));
                assert.equal(resBody.visibility, Topic.VISIBILITY.private);
            });

            test('Fail - no permissions', async function () {
                const resultMessage = (await _duplicateTopic(agent2, user2.id, topic.id, 403)).body;
                const expectedResult = {
                    status: {
                        code: 40300,
                        message: 'Insufficient permissions'
                    }
                };
                assert.deepEqual(resultMessage, expectedResult);
            });
        });
    });

    suite('Notifications', function () {

    });
});

