'use strict';
const _isMainTestFile = process.argv.some(arg => arg.endsWith(require('path').basename(__filename))) || process.argv.includes('test') || process.argv.includes('test/');

// topic-list.js - Topic list endpoints

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
if (_isMainTestFile) suite('Users', function () {

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
            etherpadClient.getHTMLAsync = async function () {
                return Promise.resolve({ html: '<!DOCTYPE HTML><html><body></body></html>' });
            };

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

        suite('List', function () {
            let agentCreator;
            let agentUser;

            let creator;
            let user;
            let topic;
            let discussion;
            let group;

            setup(async function () {
                agentCreator = request.agent(app);
                agentUser = request.agent(app);
                creator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                user = await userLib.createUserAndLogin(agentUser, null, null, null);
                group = (await groupLib.create(agentCreator, creator.id, 'Group', null, null)).body.data;
                const topicRes = (await topicCreate(agentCreator, creator.id, null, Topic.STATUSES.ideation, null, Topic.VISIBILITY.private)).body.data;
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
                discussion = (await discussionLib.discussionCreate(agentCreator, creator.id, topic.id, 'Test question?')).body.data;
                await topicUpdate(agentCreator, creator.id, topic.id, Topic.STATUSES.inProgress);
                topic.status = Topic.STATUSES.inProgress;
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
                const comment = (await discussionLib.topicCommentCreate(agentCreator, creator.id, topic.id, discussion.id, null, null, Comment.TYPES.pro, subject, text)).body.data;
                assert.property(comment, 'id');
                assert.equal(comment.type, type);
                assert.equal(comment.subject, subject);
                assert.equal(comment.text, text);
                assert.equal(comment.creator.id, creator.id);

                const comment2 = (await discussionLib.topicCommentCreate(agentCreator, creator.id, topic.id, discussion.id, null, null, Comment.TYPES.con, subject, text)).body.data;

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
                let deletedTopic = (await topicCreate(agentUser, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;

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
                const moderatedTopic = (await topicCreate(agentUser, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;
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

                const list = (await topicList(agentUser, user.id, null, null, null, null, null, false, null)).body.data;
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
                const moderatedTopic = (await topicCreate(agentUser, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;
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
                const publicTopic = (await topicCreate(agentUser, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;

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
                const publicTopic = (await topicCreate(agentUser, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;

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
                const publicTopic = (await topicCreate(agentUser, user.id, null, Topic.STATUSES.inProgress, null, Topic.VISIBILITY.public)).body.data;

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

            test('Success - status draft', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id)).body.data;
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

                const list = (await topicList(agentUser, user.id, null, null, 'draft', null, null, null, null)).body.data;
                assert.equal(list.count, 1);
                const rows = list.rows;

                rows.forEach(function (topicItem) {
                    assert.equal(topicItem.status, Topic.STATUSES.draft);
                    assert.equal(topicItem.deletedAt, null);
                });
            });

            test('Success - status inProgress', async function () {
                const publicTopic = (await topicCreate(agentUser, user.id, 'Public Topic', Topic.STATUSES.inProgress)).body.data;
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
                const publicTopic = (await topicCreate(agentUser, user.id)).body.data;
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
                const publicTopic = (await topicCreate(agentUser, user.id)).body.data;

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
                const publicTopic = (await topicCreate(agentUser, user.id)).body.data;

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
                this.timeout(120000);
                // Create 2 topics 1 in voting, but not voted, 1 voted. Topic list should return only 1 that User has voted on
                const topicWithVoteNotVoted = (await topicCreate(agentCreator, creator.id, 'TEST User HAS NOT VOTED on this topic', null, '<html><head></head><body><h2>TEST User HAS NOT VOTED on this topic</h2></body></html>', Topic.VISIBILITY.private)).body.data;
                const topicWithVoteAndVoted = (await topicCreate(agentCreator, creator.id, 'TEST User HAS VOTED on this topic', null, '<html><head></head><body><h2>TEST User HAS VOTED on this topic</h2></body></html>', Topic.VISIBILITY.private)).body.data;
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
                await topicUpdateStatus(agentCreator, user.id, topicWithVoteNotVoted.id, Topic.STATUSES.voting);
                const vote = (await topicVoteCreate(agentCreator, user.id, topicWithVoteAndVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteAndVoted.title}`, null, null)).body.data;
                await topicUpdateStatus(agentCreator, user.id, topicWithVoteAndVoted.id, Topic.STATUSES.voting);
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
                this.timeout(120000);
                // Create 2 topics 1 in voting, but not voted, 1 voted. Topic list should return only 1 that User has NOT voted on
                const topicWithVoteNotVoted = (await topicCreate(agentCreator, creator.id, 'TEST User HAS NOT VOTED on this topic', null, '<html><head></head><body><h2>TEST User HAS NOT VOTED on this topic</h2></body></html>', Topic.VISIBILITY.private)).body.data;
                const topicWithVoteAndVoted = (await topicCreate(agentCreator, creator.id, 'TEST User HAS VOTED on this topic', null, '<html><head></head><body><h2>TEST User HAS VOTED on this topic</h2></body></html>', Topic.VISIBILITY.private)).body.data;
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
                await topicUpdateStatus(agentCreator, user.id, topicWithVoteNotVoted.id, Topic.STATUSES.voting);
                const vote = (await topicVoteCreate(agentCreator, user.id, topicWithVoteAndVoted.id, options, null, null, null, null, `Vote for test topic ${topicWithVoteAndVoted.title}`, null, null)).body.data;
                await topicUpdateStatus(agentCreator, user.id, topicWithVoteAndVoted.id, Topic.STATUSES.voting);
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
                    topic = (await topicCreate(agent, user.id)).body.data;
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
                    await topicUpdateStatus(agent, user.id, topic.id, Topic.STATUSES.voting);
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

                test('Success - include favourite', async function () {
                    await topicFavouriteCreate(agent, user.id, topic.id);

                    const list = (await topicList(agent, user.id, null, null, null, null, null, null, true)).body.data.rows;

                    assert.equal(list.length, 1);
                    list.forEach(function (topicItem) {
                        assert.equal(topicItem.visibility, Topic.VISIBILITY.private);
                        assert.equal(topicItem.favourite, true);
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
    });

});

