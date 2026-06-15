'use strict';
// topic-votes.js - Voting flows (soft + hard auth)

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

        return shared.syncDb();
    });

    suiteTeardown(function () {
        if (originalGetHTMLAsync) {
            etherpadClient.getHTMLAsync = originalGetHTMLAsync;
        }
    });

        suite('Votes', function () {

            suite('Create', function () {
                const agent = request.agent(app);

                let user;
                let topic;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, null, null, null);
                });

                setup(async function () {
                    topic = (await topicCreate(agent, user.id)).body.data;
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
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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

                test('Fail - Forbidden - Vote creation is allowed only if Topic status is "draft" or "inProgress"', async function () {
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
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                    topic = (await topicCreate(agent, user.id)).body.data;
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
                    const topicWrong = (await topicCreate(agent, user.id));

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
                    topic = (await topicCreate(agent, user.id)).body.data;
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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

                        await topicVoteVote(agent, user.id, topic.id, voteRead.id, [{ optionId: voteRead.options.rows[0].id }], null, null, null, null);

                        const delegationPromises = [
                            topicVoteDelegationCreate(agent, user.id, topic.id, voteRead.id, toUser1.id),
                            topicVoteDelegationCreate(agentToUser1, toUser1.id, topic.id, voteRead.id, toUser2.id),
                            topicVoteDelegationCreate(agentToUser2, toUser2.id, topic.id, voteRead.id, toUser3.id),
                            topicVoteDelegationCreate(agentToUser4, toUser4.id, topic.id, voteRead.id, toUser5.id),
                            topicVoteDelegationCreate(agentToUser7, toUser7.id, topic.id, voteRead.id, toUser5.id)
                        ];
                        await Promise.all(delegationPromises);

                        const votePromises = [
                            topicVoteVote(agentToUser3, toUser3.id, topic.id, voteRead.id, [{ optionId: voteRead.options.rows[0].id }], null, null, null, null),
                            topicVoteVote(agentToUser6, toUser6.id, topic.id, voteRead.id, [{ optionId: voteRead.options.rows[1].id }], null, null, null, null)
                        ];
                        await Promise.all(votePromises);

                        const voteReadAfterVote = (await topicVoteRead(agentToUser6, toUser6.id, topic.id, voteRead.id)).body.data;
                        assert.equal(voteReadAfterVote.votersCount, 5);

                        await topicVoteVote(agentToUser5, toUser5.id, topic.id, voteRead.id, [{ optionId: voteRead.options.rows[1].id }], null, null, null, null);

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
                        const topic = (await topicCreate(agent, user.id)).body.data;
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
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
                        const topic = (await topicCreate(agent, user.id)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, false, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        topic = (await topicCreate(agent, user.id)).body.data;
                        const voteOptions = [
                            {
                                value: 'Option 1'
                            },
                            {
                                value: 'Option 2'
                            }
                        ];
                        const topicVoteCreated = (await topicVoteCreate(agent, user.id, topic.id, voteOptions, null, null, true, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                    topic = (await topicCreate(agent, user.id)).body.data;
                    topicPublic = (await topicCreate(agent, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                        const voteList = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];
                        await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, null, null, null);
                        const voteReadAfterVote = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                        _(voteList).forEach(function (voteOption) {
                            const option = voteReadAfterVote.options.rows.find((o) => { return o.id === voteOption.optionId });
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

                        const vote = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null, [{ value: 'allMembersVoted', enabled: true }])).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;
                        const voteList = [
                            {
                                optionId: voteRead.options.rows[0].id
                            }
                        ];
                        await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, null, null, null, 205);
                        const voteReadAfterVote = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;

                        voteList.forEach((voteOption) => {
                            const option = voteReadAfterVote.options.rows.find((vo) => { return vo.id === voteOption.optionId });
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows.find((o) => { return o.value === options[0].value }).id
                            },
                            {
                                optionId: voteRead.options.rows.find((o) => { return o.value === options[1].value }).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList1, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        _(voteList1).forEach(function (voteOption) {
                            const option = voteReadAfterVote1.options.rows.find((o) => { return o.id === voteOption.optionId });
                            assert.equal(option.voteCount, 1);
                        });

                        // Vote for the 2nd time, change your vote, by choosing 1
                        const voteList2 = [
                            {
                                optionId: voteCreated.options.rows.find((o) => { return o.value === options[1].value }).id
                            },
                            {
                                optionId: voteCreated.options.rows.find((o) => { return o.value === options[2].value }).id
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
                        const optionOverwritten = voteReadAfterVote2.options.rows.find((o) => { return o.id === voteList1[0].optionId });
                        assert.notProperty(optionOverwritten, 'voteCount');
                        assert.notProperty(optionOverwritten, 'selected');

                        // Verify the result of topic information, see that vote result is the same
                        const topicReadAfterVote = (await topicRead(agent, user.id, topic.id, ['vote'])).body.data;
                        assert.deepEqual(topicReadAfterVote.vote, voteReadAfterVote2);
                    });

                    test('Success - multiple choice - vote with same options', async function () {
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList1 = [
                            {
                                optionId: voteRead.options.rows.find((o) => { return o.value === options[0].value }).id
                            },
                            {
                                optionId: voteRead.options.rows.find((o) => { return o.value === options[0].value }).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList1, null, null, null, null);

                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        _(voteList1).forEach(function (voteOption) {
                            const option = voteReadAfterVote1.options.rows.find((o) => { return o.id === voteOption.optionId });
                            assert.equal(option.voteCount, 1);
                        });
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList = [
                            {
                                optionId: _.find(voteRead.options.rows, { value: options[0].value }).id
                            },
                            {
                                optionId: _.find(voteRead.options.rows, { value: options[3].value }).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        const option1 = _.find(voteReadAfterVote1.options.rows, { id: voteList[0].optionId });
                        const option2 = _.find(voteReadAfterVote1.options.rows, { id: voteList[1].optionId });
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList = [
                            {
                                optionId: _.find(voteRead.options.rows, { value: options[0].value }).id
                            },
                            {
                                optionId: _.find(voteRead.options.rows, { value: options[3].value }).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        const option1 = _.find(voteReadAfterVote1.options.rows, { id: voteList[0].optionId });
                        const option2 = _.find(voteReadAfterVote1.options.rows, { id: voteList[1].optionId });
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                        const voteList = [
                            {
                                optionId: _.find(voteRead.options.rows, { value: options[2].value }).id
                            },
                            {
                                optionId: _.find(voteRead.options.rows, { value: options[3].value }).id
                            }
                        ];

                        await topicVoteVote(agent, user.id, topic.id, voteCreated.id, voteList, null, null, null, null);
                        const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;
                        const option1 = _.find(voteReadAfterVote1.options.rows, { id: voteList[0].optionId });
                        const option2 = _.find(voteReadAfterVote1.options.rows, { id: voteList[1].optionId });

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
                        await topicUpdateStatus(agent, user.id, topicPublic.id, Topic.STATUSES.voting);
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
                        const topicWrong = (await topicCreate(agent, user.id)).body.data;
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
                        await topicUpdateStatus(agent, user.id, topicWrong.id, Topic.STATUSES.voting);
                        const topicVoteRight = (await topicVoteCreate(agent, user.id, topic.id, options, null, null, null, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                        await topicUpdateStatus(agent, user.id, topicPublic.id, Topic.STATUSES.voting);
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
                        await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                        const vote2 = (await topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, null)).body.data;
                        await topicUpdateStatus(agent, user.id, topicPublic.id, Topic.STATUSES.voting);
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
                    this.timeout(10000);

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
                                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                                vote2 = (await topicVoteCreate(agent, user.id, topicPublic.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                                await topicUpdateStatus(agent, user.id, topicPublic.id, Topic.STATUSES.voting);
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

                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString();
                                const res = await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, certificate, null, null, null);
                                const status = res.body.status;
                                const data = res.body.data;

                                assert.deepEqual(status, { code: 20001 });
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

                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString();
                                const res = await topicVoteVoteUnauth(reqAgent, topicPublic.id, vote2.id, voteList, certificate, null, null, null);
                                const status = res.body.status;
                                const data = res.body.data;

                                assert.deepEqual(status, { code: 20001 });
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

                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString();
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

                            test.skip('Fail - 40031 - User account already connected to another PID.', async function () {
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
                                const certificate = fs.readFileSync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt').toString();
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
                                await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                                const certificate = fs.readFileSync('./test/resources/certificates/my_good_cert_hex.crt').toString();
                                const privateKey = fs.readFileSync('./test/resources/certificates/my_good_key.pem');
                                const resBody = (await topicVoteVote(agent, user.id, topic.id, vote.id, voteList, certificate, null, null, null)).body;

                                const status = resBody.status;
                                const data = resBody.data;
                                assert.deepEqual(status, { code: 20001 });
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
                            await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                            const topicNew = (await topicCreate(agent, user.id)).body.data;
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

                            const vote = (await topicVoteCreate(agent, user.id, topicNew.id, options, null, null, null, null, null, null, Vote.AUTH_TYPES.hard, [{ value: 'allMembersVoted', enabled: true }])).body.data;
                            await topicUpdateStatus(agent, user.id, topicNew.id, Topic.STATUSES.voting);
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

                            const topic = (await topicCreate(agent, user.id, 'TEST VOTE AND RE-VOTE', null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>')).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                            const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                            // Vote for the first time
                            const voteList1 = [
                                {
                                    optionId: voteRead.options.rows.find((o) => o.value === options[0].value).id
                                },
                                {
                                    optionId: voteRead.options.rows.find((o) => o.value === options[1].value).id
                                }
                            ];

                            const voteVoteResult1 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;

                            assert.equal(voteVoteResult1.status.code, 20001);
                            assert.match(voteVoteResult1.data.challengeID, /[0-9]{4}/);

                            // Wait for the vote signing to complete
                            await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);
                            const voteReadAfterVote1 = (await topicVoteRead(agent, user.id, topic.id, voteRead.id)).body.data;

                            voteList1.forEach((voteOption) => {
                                const option = _.find(voteReadAfterVote1.options.rows, { id: voteOption.optionId });
                                assert.equal(option.voteCount, 1);
                            });

                            // Vote for the 2nd time, change your vote, by choosing 1
                            const voteList2 = [
                                {
                                    optionId: voteRead.options.rows.find((o) => o.value === options[1].value).id
                                },
                                {
                                    optionId: voteRead.options.rows.find((o) => o.value === options[2].value).id
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
                                const option = _.find(voteReadAfterVote2.options.rows, { id: voteOption.optionId });
                                assert.equal(option.voteCount, 1);
                                assert.isTrue(option.selected);
                            });

                            // Check that the 1st vote was overwritten
                            const optionOverwritten = _.find(voteReadAfterVote2.options.rows, { id: voteList1[0].optionId });
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
                            const topicVotedOn = _.find(listOfTopics.rows, { id: topic.id });

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

                            const topic = (await topicCreate(agent, user.id, 'TEST VOTE AND RE-VOTE', null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', Topic.VISIBILITY.public)).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                            const topicVotedOn = _.find(listOfTopics.rows, { id: topic.id });

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

                            const topic = (await topicCreate(agent, user.id, 'TEST VOTE AND RE-VOTE', null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', Topic.VISIBILITY.public)).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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

                            const topic = (await topicCreate(agent, user.id, 'TEST VOTE AND RE-VOTE', null, '<html><head></head><body><h2>TEST VOTE AND RE-VOTE</h2></body></html>', Topic.VISIBILITY.public)).body.data;
                            const voteCreated = (await topicVoteCreate(agent, user.id, topic.id, options, 1, 2, false, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                            await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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
                            const topicVotedOn = _.find(listOfTopics.rows, { id: topic.id });
                            assert.deepEqual(topicVotedOn.vote, voteReadAfterVote2);
                        });

                        test('Success - Estonian mobile number and PID bdocUri exists', async function () {
                            this.timeout(24000);

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

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40000,
                                    message: 'Certificate choice failed'
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

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40000,
                                    message: 'Certificate choice failed'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });
                        //Something has changed in SK MID
                        test('Fail - 40023 - User certificate is not activated for Estonian citizen.', async function () {
                            const phoneNumber = '+37200000266';
                            const pid = '60001019939';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400)).body;

                            const expectedResponse = {
                                status: {
                                    code: 40000,
                                    message: 'Certificate choice failed'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });
                        //Something has changed in SK MID
                        test('Fail - 40023 - Mobile-ID is not activated for Lithuanian citizen', async function () {
                            const phoneNumber = '+37060000266';
                            const pid = '50001018832';

                            const voteList = [
                                {
                                    optionId: vote.options.rows[0].id
                                }
                            ];

                            const resBody = (await _topicVoteVote(agent, user.id, topic.id, vote.id, voteList, null, pid, phoneNumber, null, 400)).body;
                            const expectedResponse = {
                                status: {
                                    code: 40000,
                                    message: 'Certificate choice failed'
                                }
                            };

                            assert.deepEqual(resBody, expectedResponse);
                        });

                        test('Fail - 40031 - User account already connected to another PID.', async function () {
                            // Originally set by a successful Vote, but taking a shortcut for faster test runs
                            await UserConnection.create({
                                userId: user.id,
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: 'PNOEE-51001091072',
                                connectionData: {
                                    name: 'TEST' + new Date().getTime(),
                                    country: 'EE',
                                    pid: '51001091072'
                                }
                            });
                            const phoneNumber = '+37268000769';
                            const pid = '60001017869';

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
                                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                                    const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Vote for the first time
                                    const voteList1 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[0].value }).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[1].value }).id
                                        }
                                    ];

                                    const voteVoteResult1 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);

                                    // Vote for the 2nd time, change your vote, by choosing 1
                                    const voteList2 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[1].value }).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[2].value }).id
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
                                        .query({ token: userBdocDownloadToken })
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
                                        'hääl.docx',
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
                                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                                    const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Vote for the first time
                                    // Vote for the first time
                                    const voteList1 = [
                                        {
                                            optionId: voteRead.options.rows.find((o) => { return o.value === options[0].value }).id
                                        },
                                        {
                                            optionId: voteRead.options.rows.find((o) => { return o.value === options[1].value }).id
                                        }
                                    ];

                                    const voteVoteResult1 = (await topicVoteVote(agent, user.id, topic.id, voteRead.id, voteList1, null, pid, phoneNumber, null)).body;
                                    await topicVoteStatus(agent, user.id, topic.id, voteRead.id, voteVoteResult1.data.token);

                                    // Vote for the 2nd time, change your vote, by choosing 1
                                    const voteList2 = [
                                        {
                                            optionId: voteRead.options.rows.find((o) => { return o.value === options[1].value }).id
                                        },
                                        {
                                            optionId: voteRead.options.rows.find((o) => { return o.value === options[2].value }).id
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
                                        `PNOEE-${pid}.bdoc`,
                                        'votes.csv',
                                        'graph.html',
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
                                    const pid = 50001029996;
                                    const countryCode = 'EE';
                                    const topic = (await topicCreate(agent, user.id, 'TEST VOTE AND DELETE ACCOUNT AND RE-VOTE', null, '<html><head></head><body><h2>TEST VOTE AND DELETE ACCOUNT AND RE-VOTE</h2></body></html>', Topic.VISIBILITY.public)).body.data;
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
                                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                                    const voteRead = (await topicVoteRead(agent, user.id, topic.id, voteCreated.id)).body.data;

                                    // Vote for the first time
                                    // Vote for the first time
                                    const voteList1 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[0].value }).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[1].value }).id
                                        }
                                    ];

                                    // Vote for the first time
                                    // Vote for the first time
                                    const voteList2 = [
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[0].value }).id
                                        },
                                        {
                                            optionId: _.find(voteRead.options.rows, { value: options[2].value }).id
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
                                        .query({ token: finalBdocDownloadToken })
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
                            await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
                            vote = (await topicVoteRead(agent, user.id, topic.id, vote.id)).body.data;
                            vote2 = (await topicVoteCreate(agent, user.id, topicPublic.id, options, 1, 2, null, null, null, null, Vote.AUTH_TYPES.hard)).body.data;
                        });

                        teardown(async function () {
                            await UserConnection
                                .destroy({
                                    where: {
                                        connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                        connectionUserId: ['PNOEE-30403039917', 'PNOEE-50001029996', 'PNOEE-11412090004']
                                    },
                                    force: true
                                });
                        });

                        test('Success - Estonian PID', async function () {
                            await UserConnection.destroy({
                                where: {
                                    connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                    connectionUserId: ['PNOEE-30403039917', 'PNOEE-50001029996', 'PNOEE-11412090004']
                                },
                                force: true
                            });

                            const countryCode = 'EE';
                            const pid = '50001029996';

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
                                    connectionUserId: ['PNOEE-30403039917', 'PNOEE-50001029996', 'PNOEE-11412090004']
                                },
                                force: true
                            });

                            const countryCode = 'EE';
                            const pid = '50001029996';

                            const voteList = [
                                {
                                    optionId: vote2.options.rows[0].id
                                }
                            ];
                            const response = (await _topicVoteVoteUnauth(reqAgent, topicPublic.id, vote2.id, voteList, null, pid, null, countryCode, 200)).body;

                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);
                        });

                        test('Success - unauth - Estonian PID 2 time same option', async function () {
                            this.timeout(30000);
                            const reqAgent = request.agent(app);
                            await UserConnection.destroy({
                                where: {
                                    connectionId: [UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid],
                                    connectionUserId: ['PNOEE-30403039917', 'PNOEE-50001029996', 'PNOEE-11412090004']
                                },
                                force: true
                            });

                            const countryCode = 'EE';
                            const pid = '50001029996';

                            const voteList = [
                                {
                                    optionId: vote2.options.rows[0].id
                                },
                                {
                                    optionId: vote2.options.rows[0].id
                                }
                            ];
                            const response = (await _topicVoteVoteUnauth(reqAgent, topicPublic.id, vote2.id, voteList, null, pid, null, countryCode, 200)).body;

                            assert.equal(response.status.code, 20001);
                            assert.match(response.data.challengeID, /[0-9]{4}/);
                            const statusresponse = (await topicVoteStatusUnauth(reqAgent, topicPublic.id, vote2.id, response.data.token)).body;
                            assert.equal(statusresponse.status.code, 20002);
                            assert.property(statusresponse.data, 'bdocUri');
                            await topicReadUnauth(reqAgent, topicPublic.id);
                            await topicVoteReadUnauth(reqAgent, topicPublic.id, vote2.id);
                        });

                        test('Success - Latvian PID', async function () {
                            const countryCode = 'LV';
                            const pid = '030303-10215';

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
                            const pid = '50001029996';

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
                            const pid = '50001029996';

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
                            this.timeout(30000);

                            const countryCode = 'EE';
                            const pid = '50001029996';

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
                                    message: 'Internal Server Error'
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
                            this.timeout(15000);

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
                            this.timeout(55000);

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
                            const pid = '50001029996';

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
    });

});

