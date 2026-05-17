'use strict';
// topic-attachments-reports.js - Attachments, Reports, Mentions

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

        suite.skip('Mentions', function () {

            suite('Read', function () {

                const agent = request.agent(app);

                let user;
                let topic;
                let mention1;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                    topic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, null, null, 'banana')).body.data;
                    mention1 = (await topicMentionList(agent, user.id, topic.id)).body.data.rows[0];
                });

                test('Success - cached result', async function () {
                    const list = (await topicMentionList(agent, user.id, topic.id)).body.data;
                    const mentions = list.rows;

                    assert.isTrue(list.count > 0);
                    assert.equal(list.count, mentions.length);

                    // Mention
                    const m1 = _.find(mentions, { id: mention1.id });
                    assert.deepEqual(m1, mention1);
                });

            });
        });

        suite('Attachments', function () {
            const creatorAgent = request.agent(app);
            const agent = request.agent(app);
            let creator;
            let user;
            let topic;
            let topic2;

            setup(async function () {
                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                user = await userLib.createUserAndLogin(agent);
                topic = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;
                topic2 = (await topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.private)).body.data;
            });

            suite('Create', function () {
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

            suite('Read', function () {
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

            suite('Update', function () {
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

            suite('Delete', function () {
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
                        .attach("name", attachment.file, { contentType: 'text/plain' })
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
                        .attach("name", file, { contentType: 'text/plain' })
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
                        .attach("name", file, { contentType: 'text/plain' })
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
                    topic = (await topicCreate(agentCreator, userCreator.id, 'TOPIC TITLE FOR SPAM REPORTING', Topic.STATUSES.inProgress, '<html><head></head><body><h2>TOPIC TITLE FOR SPAM REPORTING</h2></body></html>', Topic.VISIBILITY.public)).body.data;

                    return Moderator.create({
                        userId: userModerator.id
                    });
                });

                test('Success', async function () {
                    const reportType = Report.TYPES.spam;
                    const reportText = 'Topic spam report test';

                    const reportResult = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;
                    assert.isTrue(validator.isUUID(reportResult.id));
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

                    const topic = (await topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.private)).body.data;
                    return _topicReportCreate(agentReporter, topic.id, reportType, reportText, 404);
                });


                test('Fail - 40100 - Authentication is required', async function () {
                    const reportType = Report.TYPES.hate;
                    const reportText = 'Topic hate speech report for private Topic test';

                    const topic = (await topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.private)).body.data;
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
                    topic = (await topicCreate(agentCreator, userCreator.id, topicTitle, Topic.STATUSES.inProgress, topicDescription, Topic.VISIBILITY.public)).body.data;
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
                    assert.equal(reportResultTopic.description, topicDescription); // DOH, whatever you do Etherpad adds extra <br>
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
                const topicDescription = '<!DOCTYPE HTML><html><body><h1>c</h1><br>Topic report test desc<br><br></body></html>'
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
                    topic = (await topicCreate(agentCreator, userCreator.id, topicTitle, Topic.STATUSES.inProgress, topicDescription, Topic.VISIBILITY.public)).body.data;
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
                        status: { code: 40000 },
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
                        status: { code: 40000 },
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

                    topic = (await topicCreate(agentCreator, userCreator.id, topicTitle, Topic.STATUSES.inProgress, topicDescription, Topic.VISIBILITY.public)).body.data;

                    report = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;

                    const type = Report.TYPES.spam;
                    const text = 'Test: contains spam.';

                    // Create a moderator in DB so that the Moderation email flow is executed
                    await Moderator.create({ userId: userModerator.id });
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
                        errors: { text: 'Parameter "text" has to be between 10 and 4000 characters' }
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
                        errors: { text: 'Parameter "text" has to be between 10 and 4000 characters' }
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
                        errors: { text: 'Parameter "text" has to be between 10 and 4000 characters' }
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

                    topic = (await topicCreate(agentCreator, userCreator.id, topicTitle, Topic.STATUSES.inProgress, topicDescription, Topic.VISIBILITY.public)).body.data;

                    report = (await topicReportCreate(agentReporter, topic.id, reportType, reportText)).body.data;

                    const type = Report.TYPES.spam;
                    const text = 'Test: contains spam.';

                    // Create a moderator in DB so that the Moderation email flow is executed
                    await Moderator.create({ userId: userModerator.id });
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

