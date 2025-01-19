'use strict';

const _ideationCreate = async function (agent, userId, topicId, question, deadline, disableReplies, allowAnonymous, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations'
        .replace(':userId', userId)
        .replace(':topicId', topicId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            question,
            deadline,
            disableReplies,
            allowAnonymous
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationCreate = async function (agent, userId, topicId, question, deadline, disableReplies, allowAnonymous) {
    return _ideationCreate(agent, userId, topicId, question, deadline, disableReplies, allowAnonymous, 201);
};

const _ideationRead = async function (agent, userId, topicId, ideationId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationRead = async function (agent, userId, topicId, ideationId) {
    return _ideationRead(agent, userId, topicId, ideationId, 200);
};

const _ideationReadUnauth = async function (agent, topicId, ideationId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationReadUnauth = async function (agent, topicId, ideationId) {
    return _ideationReadUnauth(agent, topicId, ideationId, 200);
};

const _ideationUpdate = async function (agent, userId, topicId, ideationId, question, deadline, disableReplies, allowAnonymous, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    let body = {
        deadline,
        question,
        disableReplies,
        allowAnonymous
    };
    if (deadline === undefined) delete body.deadline;
    if (question === undefined) delete body.question;
    if (disableReplies === undefined) delete body.disableReplies;
    if (allowAnonymous === undefined) delete body.allowAnonymous;
    return agent
        .put(path)
        .send(body)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationUpdate = async function (agent, userId, topicId, ideationId, question, deadline, disableReplies, allowAnonymous) {
    return _ideationUpdate(agent, userId, topicId, ideationId, question, deadline, disableReplies, allowAnonymous, 200);
};

const _ideationDelete = async function (agent, userId, topicId, ideationId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);
    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationDelete = async function (agent, userId, topicId, ideationId) {
    return _ideationDelete(agent, userId, topicId, ideationId, 200);
};

const _ideationIdeaCreate = async function (agent, userId, topicId, ideationId, statement, description, imageUrl, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            statement,
            description,
            imageUrl
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaCreate = async function (agent, userId, topicId, ideationId, statement, description, imageUrl) {
    return _ideationIdeaCreate(agent, userId, topicId, ideationId, statement, description, imageUrl, 201)
};

const _ideationIdeaRead = async function (agent, userId, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaRead = async function (agent, userId, topicId, ideationId, ideaId) {
    return _ideationIdeaRead(agent, userId, topicId, ideationId, ideaId, 200)
};

const _ideationIdeaReadUnauth = async function (agent, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaReadUnauth = async function (agent, topicId, ideationId, ideaId) {
    return _ideationIdeaReadUnauth(agent, topicId, ideationId, ideaId, 200)
};

const _ideationIdeaUpdate = async function (agent, userId, topicId, ideationId, ideaId, statement, description, imageUrl, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    const body = {};
    if (statement) {
        body.statement = statement;
    }
    if (description) {
        body.description = description;
    }
    if (imageUrl) {
        body.imageUrl = imageUrl;
    }
    return agent
        .put(path)
        .send(body)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaUpdate = async function (agent, userId, topicId, ideationId, ideaId, statement, description, imageUrl) {
    return _ideationIdeaUpdate(agent, userId, topicId, ideationId, ideaId, statement, description, imageUrl, 200);
};


const _ideationIdeaDelete = async function (agent, userId, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaDelete = async function (agent, userId, topicId, ideationId, ideaId) {
    return _ideationIdeaDelete(agent, userId, topicId, ideationId, ideaId, 200);
};

const _ideationIdeaList = async function (agent, userId, topicId, ideationId, queryParams, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .query(queryParams)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaList = async function (agent, userId, topicId, ideationId, queryParams) {
    return _ideationIdeaList(agent, userId, topicId, ideationId, queryParams, 200);
};

const _ideationIdeaListUnauth = async function (agent, topicId, ideationId, queryParams, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .query(queryParams)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationIdeaListUnauth = async function (agent, topicId, ideationId, queryParams) {
    return _ideationIdeaListUnauth(agent, topicId, ideationId, queryParams, 200);
};

/* Reports*/


const _ideationIdeaReportCreate = async function (agent, topicId, ideationId, ideaId, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

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

const ideationIdeaReportCreate = async function (agent, topicId, ideationId, ideaId, type, text) {
    return _ideationIdeaReportCreate(agent, topicId, ideationId, ideaId, type, text, 200);
};

const _ideationIdeaReportRead = async function (agent, topicId, ideationId, ideaId, reportId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':reportId', reportId);

    return agent
        .get(path)
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaReportRead = async function (agent, topicId, ideationId, ideaId, reportId, token) {
    return _ideationIdeaReportRead(agent, topicId, ideationId, ideaId, reportId, token, 200);
};

const _ideationIdeaReportModerate = async function (agent, topicId, ideationId, ideaId, reportId, token, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
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

const ideationIdeaReportModerate = async function (agent, topicId, ideationId, ideaId, reportId, token, type, text) {
    return _ideationIdeaReportModerate(agent, topicId, ideationId, ideaId, reportId, token, type, text, 200);
};

const _ideationFolderCreate = async function (agent, userId, topicId, ideationId, name, description, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            name,
            description
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderCreate = async function (agent, userId, topicId, ideationId, name, description) {
    return _ideationFolderCreate(agent, userId, topicId, ideationId, name, description, 201)
};

const _ideationFolderRead = async function (agent, userId, topicId, ideationId, folderId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderRead = async function (agent, userId, topicId, ideationId, folderId) {
    return _ideationFolderRead(agent, userId, topicId, ideationId, folderId, 200)
};

const _ideationFolderReadUnauth = async function (agent, topicId, ideationId, folderId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/folders/:folderId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderReadUnauth = async function (agent, topicId, ideationId, folderId) {
    return _ideationFolderReadUnauth(agent, topicId, ideationId, folderId, 200)
};

const _ideationFolderReadIdeas = async function (agent, userId, topicId, ideationId, folderId, limit, offset, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId);

    return agent
        .get(path)
        .query({
            offset: offset,
            limit: limit
        })
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderReadIdeas = async function (agent, userId, topicId, ideationId, folderId, limit, offset) {
    return _ideationFolderReadIdeas(agent, userId, topicId, ideationId, folderId, limit, offset, 200)
};

const _ideationFolderReadIdeasUnauth = async function (agent, topicId, ideationId, folderId, limit, offset, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId);

    return agent
        .get(path)
        .query({
            limit,
            offset
        })
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderReadIdeasUnauth = async function (agent, topicId, ideationId, folderId, limit, offset,) {
    return _ideationFolderReadIdeasUnauth(agent, topicId, ideationId, folderId, limit, offset, 200)
};

const _ideationFolderIdeaCreate = async function (agent, userId, topicId, ideationId, folderId, ideas, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId);

    return agent
        .post(path)
        .send(ideas)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
}

const ideationFolderIdeaCreate = async function (agent, userId, topicId, ideationId, folderId, ideas) {
    return _ideationFolderIdeaCreate(agent, userId, topicId, ideationId, folderId, ideas, 201);
}

const _ideationFolderIdeaRemove = async function (agent, userId, topicId, ideationId, folderId, ideaId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId/ideas/:ideaId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId)
        .replace(':ideaId', ideaId);
    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
}

const ideationFolderIdeaRemove = async function (agent, userId, topicId, ideationId, folderId, ideaId) {
    return _ideationFolderIdeaRemove(agent, userId, topicId, ideationId, folderId, ideaId, 200);
}

const _ideationFolderUpdate = async function (agent, userId, topicId, ideationId, folderId, name, description, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId);

    const body = {};
    if (name) {
        body.name = name;
    }
    if (description) {
        body.description = description;
    }
    return agent
        .put(path)
        .send(body)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderUpdate = async function (agent, userId, topicId, ideationId, folderId, name, description) {
    return _ideationFolderUpdate(agent, userId, topicId, ideationId, folderId, name, description, 200);
};


const _ideationFolderDelete = async function (agent, userId, topicId, ideationId, folderId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders/:folderId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':folderId', folderId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderDelete = async function (agent, userId, topicId, ideationId, folderId) {
    return _ideationFolderDelete(agent, userId, topicId, ideationId, folderId, 200);
};

const _ideationFolderList = async function (agent, userId, topicId, ideationId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/folders'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderList = async function (agent, userId, topicId, ideationId) {
    return _ideationFolderList(agent, userId, topicId, ideationId, 200);
};

const _ideationFolderListUnauth = async function (agent, topicId, ideationId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/folders'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
};

const ideationFolderListUnauth = async function (agent, topicId, ideationId) {
    return _ideationFolderListUnauth(agent, topicId, ideationId, 200);
};

/*Vote*/

const _ideationIdeaVotesCreate = async function (agent, userId, topicId, ideationId, ideaId, value, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({ value: value })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaVotesCreate = async function (agent, userId, topicId, ideationId, ideaId, value) {
    return _ideationIdeaVotesCreate(agent, userId, topicId, ideationId, ideaId, value, 200);
};

const _ideationIdeaVotesList = async function (agent, userId, topicId, ideationId, ideaId, expectedHttpCode) {
    let path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/votes'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};


const ideationIdeaVotesList = async function (agent, userId, topicId, ideationId, ideaId) {
    return _ideationIdeaVotesList(agent, userId, topicId, ideationId, ideaId, 200);
};


const _ideationIdeaFavouriteCreate = async function (agent, userId, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/favourite'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .post(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaFavouriteCreate = async function (agent, userId, topicId, ideationId, ideaId) {
    return _ideationIdeaFavouriteCreate(agent, userId, topicId, ideationId, ideaId, 200);
};

const _ideationIdeaFavouriteDelete = async function (agent, userId, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/favourite'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaFavouriteDelete = async function (agent, userId, topicId, ideationId, ideaId) {
    return _ideationIdeaFavouriteDelete(agent, userId, topicId, ideationId, ideaId, 200);
};

/** COMMENTS*/


const _ideationIdeaCommentCreate = async function (agent, userId, topicId, ideationId, ideaId, parentId, parentVersion, type, subject, text, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

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

const ideationIdeaCommentCreate = async function (agent, userId, topicId, ideationId, ideaId, parentId, parentVersion, type, subject, text) {
    return _ideationIdeaCommentCreate(agent, userId, topicId, ideationId, ideaId, parentId, parentVersion, type, subject, text, 201);
};

const _ideationIdeaCommentEdit = async function (agent, userId, topicId, ideationId, ideaId, commentId, subject, text, type, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
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

const ideationIdeaCommentEdit = async function (agent, userId, topicId, ideationId, ideaId, commentId, subject, text, type) {
    return _ideationIdeaCommentEdit(agent, userId, topicId, ideationId, ideaId, commentId, subject, text, type, 200);
};

const _ideationIdeaCommentList = async function (agent, userId, topicId, ideationId, ideaId, orderBy, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .query({ orderBy: orderBy })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaCommentList = async function (agent, userId, topicId, ideationId, ideaId, orderBy) {
    return _ideationIdeaCommentList(agent, userId, topicId, ideationId, ideaId, orderBy, 200);
};

const _ideationIdeaCommentListUnauth = async function (agent, topicId, ideationId, ideaId, orderBy, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .query({ orderBy: orderBy })
        .expect('Content-Type', /json/);
};

const ideationIdeaCommentListUnauth = async function (agent, topicId, ideationId, ideaId, orderBy) {
    return _ideationIdeaCommentListUnauth(agent, topicId, ideationId, ideaId, orderBy, 200);
};

const _ideationIdeaCommentDelete = async function (agent, userId, topicId, ideationId, ideaId, commentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':commentId', commentId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaCommentDelete = async function (agent, userId, topicId, ideationId, ideaId, commentId) {
    return _ideationIdeaCommentDelete(agent, userId, topicId, ideationId, ideaId, commentId, 200);
};

const _ideationIdeaCommentReportCreate = async function (agent, topicId, ideationId, ideaId, commentId, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
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

const ideationIdeaCommentReportCreate = async function (agent, topicId, ideationId, ideaId, commentId, type, text) {
    return _ideationIdeaCommentReportCreate(agent, topicId, ideationId, ideaId, commentId, type, text, 200);
};

const _ideationIdeaCommentReportRead = async function (agent, topicId, ideationId, ideaId, commentId, reportId, token, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':commentId', commentId)
        .replace(':reportId', reportId);

    return agent
        .get(path)
        .set('Authorization', 'Bearer ' + token)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaCommentReportRead = async function (agent, topicId, ideationId, ideaId, commentId, reportId, token) {
    return _ideationIdeaCommentReportRead(agent, topicId, ideationId, ideaId, commentId, reportId, token, 200);
};

const _ideationIdeaCommentReportModerate = async function (agent, topicId, ideationId, ideaId, commentId, reportId, token, type, text, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId/moderate'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
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

const ideationIdeaCommentReportModerate = async function (agent, topicId, ideationId, ideaId, commentId, reportId, token, type, text) {
    return _ideationIdeaCommentReportModerate(agent, topicId, ideationId, ideaId, commentId, reportId, token, type, text, 200);
};

const _ideationIdeaCommentVotesCreate = async function (agent, topicId, ideationId, ideaId, commentId, value, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':commentId', commentId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({ value: value })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaCommentVotesCreate = async function (agent, topicId, ideationId, ideaId, commentId, value) {
    return _ideationIdeaCommentVotesCreate(agent, topicId, ideationId, ideaId, commentId, value, 200);
};

const _ideationIdeaCommentVotesList = async function (agent, userId, topicId, ideationId, ideaId, commentId, expectedHttpCode) {
    let path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/votes'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':commentId', commentId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideationIdeaCommentVotesList = async function (agent, userId, topicId, ideationId, ideaId, commentId) {
    return _ideationIdeaCommentVotesList(agent, userId, topicId, ideationId, ideaId, commentId, 200);
};


const _ideaAttachmentAdd = async function (agent, userId, topicId, ideationId, ideaId, name, link, source, type, size, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

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

const ideaAttachmentAdd = async function (agent, userId, topicId, ideationId, ideaId, name, link, source, type, size) {
    return _ideaAttachmentAdd(agent, userId, topicId, ideationId, ideaId, name, link, source, type, size, 200);
};

const _ideaAttachmentUpdate = async function (agent, userId, topicId, ideationId, ideaId, attachmentId, name, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':attachmentId', attachmentId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({ name: name })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideaAttachmentUpdate = async function (agent, userId, topicId, ideationId, ideaId, attachmentId, name) {
    return _ideaAttachmentUpdate(agent, userId, topicId, ideationId, ideaId, attachmentId, name, 200);
};

const _ideaAttachmentRead = async function (agent, userId, topicId, ideationId, ideaId, attachmentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':attachmentId', attachmentId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);

};

const ideaAttachmentRead = async function (agent, userId, topicId, ideationId, ideaId, attachmentId) {
    return _ideaAttachmentRead(agent, userId, topicId, ideationId, ideaId, attachmentId, 200);
};

const _ideaAttachmentReadUnauth = async function (agent, topicId, ideationId, ideaId, attachmentId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':attachmentId', attachmentId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideaAttachmentReadUnauth = async function (agent, topicId, ideationId, ideaId, attachmentId) {
    return _ideaAttachmentReadUnauth(agent, topicId, ideationId, ideaId, attachmentId, 200);
};

const _ideaAttachmentDownload = async function (agent, userId, topicId, ideationId, ideaId, attachmentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':attachmentId', attachmentId);

    return agent
        .get(path)
        .query({ download: true })
        .expect(expectedHttpCode);

};
//TODO: Missing test to use it?
const ideaAttachmentDownload = async function (agent, userId, topicId, ideationId, ideaId, attachmentId) { //eslint-disable-line
    return _ideaAttachmentDownload(agent, userId, topicId, ideationId, ideaId, attachmentId, 200);
};

const _ideaAttachmentDelete = async function (agent, userId, topicId, ideationId, ideaId, attachmentId, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/:attachmentId'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId)
        .replace(':attachmentId', attachmentId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideaAttachmentDelete = async function (agent, userId, topicId, ideationId, ideaId, attachmentId) {
    return _ideaAttachmentDelete(agent, userId, topicId, ideationId, ideaId, attachmentId, 200);
};

const _ideaAttachmentList = async function (agent, userId, topicId, ideationId, ideaId, type, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .query({ type })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideaAttachmentList = async function (agent, userId, topicId, ideationId, ideaId, type) {
    return _ideaAttachmentList(agent, userId, topicId, ideationId, ideaId, type, 200);
};

const _ideaAttachmentListUnauth = async function (agent, topicId, ideationId, ideaId, expectedHttpCode) {
    const path = '/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments'
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const ideaAttachmentListUnauth = async function (agent, topicId, ideationId, ideaId) {
    return _ideaAttachmentListUnauth(agent, topicId, ideationId, ideaId, 200);
};

const _uploadAttachmentFile = async function (agent, userId, topicId, ideationId, ideaId, attachment, expectedHttpCode) {
    const path = '/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/attachments/upload'
        .replace(':userId', userId)
        .replace(':topicId', topicId)
        .replace(':ideationId', ideationId)
        .replace(':ideaId', ideaId);

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

const uploadAttachmentFile = async function (agent, userId, topicId, ideationId, ideaId, attachment) {
    return _uploadAttachmentFile(agent, userId, topicId, ideationId, ideaId, attachment, 201);
};

module.exports.ideationCreate = ideationCreate;

const chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
chai.use(require('chai-uuid'));
const assert = chai.assert;
const request = require('supertest');
const path = require('path');
const app = require('../../app');
const config = app.get('config');

const models = app.get('models');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const topicLib = require('./topic');
const { discussionCreate } = require('./discussion');
const memberLib = require('./lib/members')(app);

const jwt = app.get('jwt');
const cosJwt = app.get('cosJwt');
const validator = app.get('validator');

const Topic = models.Topic;
const Comment = models.Comment;
const TopicMemberUser = models.TopicMemberUser;
const Partner = models.Partner;
const Moderator = models.Moderator;
const Report = models.Report;
const Idea = models.Idea;

// API - /api/users*
suite('Users', function () {

    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    // API - /api/users/:userId/topics*
    suite('Ideation', function () {

        suite('Create', function () {
            const agent = request.agent(app);
            const email = 'test_topicc_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            let user;
            let topic;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, 'TEST IDEATION')).body.data;
            });

            test('Success', async function () {
                const question = 'Test ideation?';
                const ideation = (await ideationCreate(agent, user.id, topic.id, question)).body.data;
                assert.property(ideation, 'id');
                assert.equal(ideation.creatorId, user.id);
                assert.equal(ideation.question, question);
            });

            test('Success - deadline', async function () {
                const question = 'Test ideation?';
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const ideation = (await ideationCreate(agent, user.id, topic.id, question, deadline)).body.data;
                assert.property(ideation, 'id');
                assert.equal(ideation.creatorId, user.id);
                assert.equal(ideation.question, question);
                assert.equal(new Date(ideation.deadline).getTime(), deadline.getTime());
            });

            test('Success - disableReplies', async function () {
                const question = 'Test ideation?';
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const disableReplies = true;
                const ideation = (await ideationCreate(agent, user.id, topic.id, question, deadline, disableReplies)).body.data;
                assert.property(ideation, 'id');
                assert.equal(ideation.creatorId, user.id);
                assert.equal(ideation.question, question);
                assert.equal(ideation.disableReplies, disableReplies);
                assert.equal(new Date(ideation.deadline).getTime(), deadline.getTime());
            });

            test('Success - allowAnonymous', async function () {
                const question = 'Test ideation?';
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const disableReplies = true;
                const ideation = (await ideationCreate(agent, user.id, topic.id, question, deadline, disableReplies)).body.data;
                assert.property(ideation, 'id');
                assert.equal(ideation.creatorId, user.id);
                assert.equal(ideation.question, question);
                assert.equal(ideation.disableReplies, disableReplies);
                assert.equal(new Date(ideation.deadline).getTime(), deadline.getTime());
            });

            test('Fail - Bad Request - deadline wrong format', async function () {
                const question = 'Test ideation?';
                const errors = (await _ideationCreate(agent, user.id, topic.id, question, 'TEST', null, null, 400)).body.errors;

                assert.equal(errors.deadline, 'Ideation deadline must be in the future.');
            });


            test('Fail - Bad Request - deadline is in the past', async function () {
                const question = 'Test ideation?';
                const deadlineInPast = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                const errors = (await _ideationCreate(agent, user.id, topic.id, question, deadlineInPast, null, null, 400)).body.errors;

                assert.equal(errors.deadline, 'Ideation deadline must be in the future.');
            });
        });

        suite('Read', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let ideation;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
            });


            test('Success', async function () {
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedIdeation = Object.assign({}, ideation);
                expectedIdeation.ideas = { count: 0 };
                expectedIdeation.folders = { count: 0 };
                assert.deepEqual(ideationR, expectedIdeation);
            });

            test('Success - public', async function () {
                await await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation, Topic.VISIBILITY.public);
                const ideationR = (await ideationReadUnauth(request.agent(app), topic.id, ideation.id)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                const expectedIdeation = Object.assign({}, ideation);
                expectedIdeation.ideas = { count: 0 };
                expectedIdeation.folders = { count: 0 };
                assert.deepEqual(ideationR, expectedIdeation);
            });

            test('Fail - Unauthorized', async function () {
                await _ideationRead(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Update', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let ideation;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
            });

            setup(async function () {
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
            });


            test('Success - question - draft topic', async function () {
                const updatedQuestion = 'Updated ideation';
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, updatedQuestion)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                ideationR.question = updatedQuestion;
                assert.notEqual(ideationUpdated.updatedAt, ideationR.updatedAt)
                ideationR.updatedAt = ideationUpdated.updatedAt;
                assert.deepEqual(ideationUpdated, ideationR);
            });

            test('Success - deadline - draft topic', async function () {
                const deadline = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, undefined, deadline)).body.data;

                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                ideationR.deadline = deadline;
                assert.equal(new Date(ideationUpdated.deadline).getTime(), deadline.getTime());
                assert.equal(ideationUpdated.question, ideationR.question);
                assert.notEqual(ideationUpdated.updatedAt, ideationR.updatedAt);

            });

            test('Success - question updated when topic status ideation', async function () {
                const updatedQuestion = 'Updated ideation';
                await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, updatedQuestion)).body.data;
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                assert.deepEqual(ideationUpdated, ideationR);
            });

            test('Success - disableReplies when topic status ideation', async function () {
                const topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, true)).body.data;
                await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'TEST', 'TEST', 403);
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, null, null, false)).body.data;
                await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'TEST2', 'TEST2');
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                // The difference from create result is that there is "members" and "creator" is extended. Might consider changing in the future..
                assert.deepEqual(ideationUpdated, ideationR);
            });

            test('Success - allowAnonymous', async function () {
                const topic = (await topicLib.topicCreate(agent, user.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, false)).body.data;
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, null, null, null, true)).body.data;
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                assert.deepEqual(ideationUpdated, ideationR);
                assert.equal(ideationUpdated.disableReplies, true);
                assert.equal(ideationUpdated.allowAnonymous, true);
            });

            test('Fail - turn off allowAnonymous after topic status ideation', async function () {
                const topic = (await topicLib.topicCreate(agent, user.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                const ideationUpdated = (await ideationUpdate(agent, user.id, topic.id, ideation.id, null, null, null, false)).body.data;
                const ideationR = (await ideationRead(agent, user.id, topic.id, ideation.id)).body.data;
                assert.equal(ideationUpdated.disableReplies, true);
                assert.equal(ideationUpdated.allowAnonymous, true);
                assert.equal(ideationR.disableReplies, true);
                assert.equal(ideationR.allowAnonymous, true);
            });

            test('Fail - deadline in the past', async function () {
                const deadline = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
                const errors = (await _ideationUpdate(agent, user.id, topic.id, ideation.id, undefined, deadline, null, null, 400)).body.errors;

                assert.equal(errors.deadline, 'Ideation deadline must be in the future.');
            });

            test('Fail - Unauthorized', async function () {
                await _ideationRead(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Delete', function () {
            const agent = request.agent(app);
            const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';

            let user;
            let topic;
            let ideation;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
            });


            test('Success', async function () {
                const ideationDeleted = (await ideationDelete(agent, user.id, topic.id, ideation.id)).body;
                const resExpected = { status: { code: 20000 } };
                assert.deepEqual(ideationDeleted, resExpected)

                const ideationR = (await _ideationRead(agent, user.id, topic.id, ideation.id, 404)).body;
                const resReadExpected = {
                    status:
                    {
                        code: 40400,
                        message: 'Not Found'
                    }
                };
                assert.deepEqual(ideationR, resReadExpected)
            });

            test('Fail - Unauthorized', async function () {
                await _ideationDelete(request.agent(app), user.id, topic.id, null, 401);
            });
        });

        suite('Idea', function () {


            suite('Create', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    assert.equal(idea.statement, statement);
                    assert.equal(idea.description, description);
                    assert.equal(idea.author.id, user.id);
                    assert.exists(idea, 'id');
                    assert.exists(idea, 'createdAt');
                    assert.exists(idea, 'updatedAt');
                    assert.exists(idea, 'deletedAt');
                });

                test('Fail - missing statement', async function () {
                    const description = 'This idea is just for testing';
                    const ideaRes = (await _ideationIdeaCreate(agent, user.id, topic.id, ideation.id, null, description, null, 400)).body;
                    const expectedRes = {
                        status: { code: 40000 },
                        errors: { statement: 'Idea.statement cannot be null' }
                    };

                    assert.deepEqual(ideaRes, expectedRes);
                });

                test('Fail - missing description', async function () {
                    const statement = 'This idea is just for testing';
                    const ideaRes = (await _ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, null, null, 400)).body;
                    const expectedRes = {
                        status: { code: 40000 },
                        errors: { description: 'Idea.description cannot be null' }
                    };

                    assert.deepEqual(ideaRes, expectedRes);
                });

                test('Fail - topic status not ideation', async function () {
                    await discussionCreate(agent, user.id, topic.id, 'TEST?');
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp);
                    await _ideationIdeaCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST idea', 'description', null, 401);
                });

                test('Fail - Unauthorized', async function () {
                    await _ideationIdeaCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST idea', 'description', null, 401);
                });
            });

            suite('Read', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;
                    assert.deepEqual(ideaR.votes, {
                        down: {
                            count: 0,
                            selected: false
                        },
                        up: {
                            count: 0,
                            selected: false
                        }
                    });
                    assert.equal(ideaR.favourite, false)
                    assert.deepEqual(ideaR.replies, {
                        count: 0
                    });
                    delete ideaR.replies;
                    delete ideaR.votes;
                    delete ideaR.favourite;
                    assert.deepEqual(idea, ideaR);
                });

                test('Success - public topic unauth', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;

                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    delete ideaR.favourite;
                    delete ideaR.votes.up.selected;
                    delete ideaR.votes.down.selected;
                    const ideaRUnauth = (await ideationIdeaReadUnauth(request.agent(app), topic.id, ideation.id, idea.id)).body.data;
                    assert.deepEqual(ideaR, ideaRUnauth);
                });

                test('Success - member topic', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;
                    assert.deepEqual(ideaR.votes, {
                        down: {
                            count: 0,
                            selected: false
                        },
                        up: {
                            count: 0,
                            selected: false
                        }
                    });
                    assert.equal(ideaR.favourite, false)
                    assert.deepEqual(ideaR.replies, {
                        count: 0
                    });
                    delete ideaR.replies;
                    delete ideaR.votes;
                    delete ideaR.favourite;
                    assert.deepEqual(idea, ideaR);
                });

                test('Fail - Unauthorized', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    await _ideationIdeaRead(request.agent(app), user.id, topic.id, ideation.id, idea.id, 401);
                });
            });

            suite('Update', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';

                    const updatedStatement = 'Test idea Update';
                    const updatedDescription = 'Updated description';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;

                    assert.equal(idea.statement, statement);
                    assert.equal(idea.description, description);
                    assert.equal(idea.author.id, user.id);
                    assert.exists(idea, 'id');
                    assert.exists(idea, 'createdAt');
                    assert.exists(idea, 'updatedAt');
                    assert.exists(idea, 'deletedAt');
                    const ideaUpdate = (await ideationIdeaUpdate(agent, user.id, topic.id, ideation.id, idea.id, updatedStatement, updatedDescription)).body.data;

                    assert.equal(ideaUpdate.statement, updatedStatement);
                    assert.equal(ideaUpdate.description, updatedDescription);
                    assert.equal(ideaUpdate.author.id, idea.author.id);
                    assert.equal(ideaUpdate.id, idea.id);
                    assert.exists(ideaUpdate.createdAt, idea.createdAt);
                    assert.notEqual(ideaUpdate.updatedAt, idea.updatedAt);
                    assert.equal(ideaUpdate.deletedAt, idea.deletedAt);
                });

                test('Fail - topic status not ideation', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await discussionCreate(agent, user.id, topic.id, 'TEST');
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                    await _ideationIdeaUpdate(agent, user.id, topic.id, ideation.id, idea.id, 'TEST idea', 'description', null, 403);
                });

                test('Fail - Unauthorized', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaUpdate(request.agent(app), user.id, topic.id, ideation.id, idea.id, 'TEST idea', 'description', null, 401);
                });
            });

            suite('Delete', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const deleteRes = (await ideationIdeaDelete(agent, user.id, topic.id, ideation.id, idea.id)).body;
                    const expectedBody = {
                        status: {
                            code: 20000
                        }
                    };
                    assert.deepEqual(deleteRes, expectedBody);
                });

                test('Fail - not author of the idea', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaDelete(agent2, user2.id, topic.id, ideation.id, idea.id, 403);
                });

                test('Fail - Unauthorized', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaDelete(request.agent(app), user.id, topic.id, ideation.id, idea.id, 401);
                });
            });

            suite('List', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const ideas = (await ideationIdeaList(agent, user.id, topic.id, ideation.id)).body.data;
                    assert.exists(ideas.rows[0], 'favourite');
                    delete ideas.rows[0].favourite;
                    assert.deepEqual(ideas.rows[0].replies, { count: 0 });
                    delete ideas.rows[0].replies;
                    assert.deepEqual(ideas.rows[0].votes, { up: { count: 0, selected: false }, down: { count: 0, selected: false } });
                    delete ideas.rows[0].votes;

                    assert.deepEqual(ideas, { count: 1, rows: [idea] });
                });

                test('Success - unauth', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const ideas = (await ideationIdeaListUnauth(request.agent(app), topic.id, ideation.id)).body.data;
                    assert.exists(ideas.rows[0], 'favourite');
                    delete ideas.rows[0].favourite;
                    assert.deepEqual(ideas.rows[0].replies, { count: 0 });
                    delete ideas.rows[0].replies;
                    assert.deepEqual(ideas.rows[0].votes, { up: { count: 0 }, down: { count: 0 } });
                    delete ideas.rows[0].votes;
                    assert.deepEqual(ideas, { count: 1, rows: [idea] });
                });

                test('Success - query - showModerated', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const agentModerator = request.agent(app);
                    const userModerator = await userLib.createUser(agentModerator, 'moderator@test.com', null, null);
                    await Moderator.create({
                        userId: userModerator.id
                    });
                    const agentReporter = request.agent(app);
                    const userReporter = await userLib.createUserAndLogin(agentReporter, 'reporter@test.com', null, null);
                    const report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'Report create test text')).body.data;

                    assert.isTrue(validator.isUUID(report.id));
                    assert.equal(report.type, Report.TYPES.hate);
                    assert.equal(report.text, 'Report create test text');
                    assert.property(report, 'createdAt');
                    assert.equal(report.creator.id, userReporter.id);

                    const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                    const moderateText = 'Report create moderation text';

                    const token = cosJwt.getTokenRestrictedUse(
                        {
                            userId: userModerator.id
                        },
                        [
                            'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate'
                                .replace(':topicId', topic.id)
                                .replace(':ideationId', ideation.id)
                                .replace(':ideaId', idea.id)
                                .replace(':reportId', report.id)
                        ]
                    );

                    await ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, moderateType, moderateText);

                    const ideas = (await ideationIdeaListUnauth(request.agent(app), topic.id, ideation.id, { showModerated: 'showModerated' })).body.data;
                    assert.deepEqual(ideas.rows[0].replies, { count: 0 });
                    delete ideas.rows[0].replies;
                    assert.deepEqual(ideas.rows[0].votes, { up: { count: 0 }, down: { count: 0 } });
                    delete ideas.rows[0].votes;
                    assert.equal(ideas.count, 1);
                    assert.equal(ideas.rows.length, 1);
                    const ideaRes = ideas.rows[0];
                    assert.deepEqual(ideaRes.author, idea.author);
                    assert.equal(ideaRes.statement, idea.statement);
                    assert.equal(ideaRes.description, idea.description);
                    assert.equal(ideaRes.imageUrl, idea.imageUrl);
                    assert.equal(ideaRes.createdAt, idea.createdAt);
                    assert.deepEqual(ideaRes.deletedBy, { id: userModerator.id, name: userModerator.name });
                    assert.deepEqual(ideaRes.report, { id: report.id });
                    assert.notEqual(ideaRes.deletedAt, null);
                    assert.equal(ideaRes.deletedReasonText, moderateText);
                    assert.equal(ideaRes.deletedReasonType, moderateType);
                });

                test('Fail - Unauthorized', async function () {
                    await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST');
                    await _ideationIdeaList(request.agent(app), user.id, topic.id, ideation.id, null, 401);
                });
            });

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
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        userReporter = await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                        ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST abusive', 'TEST inapropriate')).body.data;
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

                        const reportResult = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, reportText)).body.data;
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
                    let ideation;
                    let idea;
                    let report;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                        ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

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
                        report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'reported!')).body.data;
                    });

                    test('Success - token with audience', async function () {
                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'GET /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId'
                                    .replace(':topicId', topic.id)
                                    .replace(':ideationId', ideation.id)
                                    .replace(':ideaId', idea.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        const resBody = (await ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token)).body;

                        const expectedResult = {
                            status: { code: 20000 },
                            data: {
                                id: report.id,
                                type: report.type,
                                text: report.text,
                                createdAt: report.createdAt,
                                idea: {
                                    statement: idea.statement,
                                    description: idea.description,
                                    id: idea.id
                                }
                            }
                        };
                        assert.deepEqual(resBody, expectedResult);
                    });

                    test('Fail - 40100 - Invalid token', async function () {
                        const token = {};
                        return _ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, 401);
                    });

                    test('Fail - 40100 - invalid token - without audience', async function () {
                        const token = jwt.sign(
                            {},
                            config.session.privateKey,
                            {
                                algorithm: config.session.algorithm
                            }
                        );

                        return _ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, 401);
                    });

                    test('Fail - 40100 - invalid token - invalid audience', async function () {
                        const token = cosJwt.getTokenRestrictedUse({}, 'GET /foo/bar');

                        return _ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, 401);
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
                    let ideation;
                    let idea;
                    let report;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                        ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

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
                        report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'Report create test text')).body.data;

                    });

                    test('Success', async function () {
                        const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                        const moderateText = 'Report create moderation text';

                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate'
                                    .replace(':topicId', topic.id)
                                    .replace(':ideationId', ideation.id)
                                    .replace(':ideaId', idea.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        await ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, moderateType, moderateText);

                        const ideaRead = (await Idea.findOne({
                            where: {
                                id: idea.id
                            },
                            paranoid: false
                        })).toJSON();

                        assert.equal(ideaRead.deletedBy.id, userModerator.id);
                        assert.equal(ideaRead.report.id, report.id);
                        assert.equal(ideaRead.deletedReasonType, moderateType);
                        assert.equal(ideaRead.deletedReasonText, moderateText);
                        assert.isNotNull(ideaRead.deletedAt);
                    });

                    test('Fail - 40100 - Invalid token - random stuff', async function () {
                        return _ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, 'TOKEN HERE', Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
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

                        return _ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
                    });

                    test('Fail - 40010 - Report has become invalid cause comment has been updated after the report', async function () {
                        // Revive the Comment we deleted on report
                        await Idea.update(
                            {
                                deletedById: null,
                                deletedAt: null,
                                deletedReasonType: null,
                                deletedReasonText: null,
                                deletedByReportId: null

                            },
                            {
                                where: {
                                    id: idea.id
                                },
                                paranoid: false
                            }
                        );

                        report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'Report create test text')).body.data;
                        const moderateType = Idea.DELETE_REASON_TYPES.duplicate;
                        const moderateText = 'Report create moderation text';

                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate'
                                    .replace(':topicId', topic.id)
                                    .replace(':ideationId', ideation.id)
                                    .replace(':ideaId', idea.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        await Idea.update(
                            {
                                description: 'Update idea!'
                            },
                            {
                                where: {
                                    id: idea.id
                                },
                                paranoid: false
                            }
                        );
                        const resBody = (await _ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, moderateType, moderateText, 400)).body;
                        const expectedResult = {
                            status: {
                                code: 40010,
                                message: 'Report has become invalid cause idea has been updated after the report'
                            }
                        };

                        assert.deepEqual(resBody, expectedResult);
                    });
                });

            });

            suite('Votes', function () {
                suite('Create', function () {
                    const creatorAgent = request.agent(app);
                    const userAgent = request.agent(app);
                    const user2Agent = request.agent(app);

                    let creator;
                    let user;
                    let user2;
                    let topic;
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                        user = await userLib.createUserAndLogin(userAgent, null, null, null);
                        user2 = await userLib.createUserAndLogin(user2Agent, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                        ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success - 20100 - Upvote', async function () {
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1)).body;

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
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, -1)).body;
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
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 0)).body;
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
                        await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1);
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, -1)).body;
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
                        await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1);
                        await ideationIdeaVotesCreate(userAgent, user.id, topic.id, ideation.id, idea.id, 1);
                        const resBody = (await ideationIdeaVotesCreate(user2Agent, user2.id, topic.id, ideation.id, idea.id, -1)).body;
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
                        const resBody = (await _ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 666, 400)).body;
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
                    let creator2;
                    let topic;
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                        creator2 = await userLib.createUserAndLogin(creatorAgent2, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                        ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success', async function () {
                        await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1);
                        await ideationIdeaVotesCreate(creatorAgent2, creator2.id, topic.id, ideation.id, idea.id, 0); //Add cleared vote that should not be returned;
                        const commentVotesList = (await ideationIdeaVotesList(creatorAgent, creator.id, topic.id, ideation.id, idea.id)).body.data;
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

            suite('Favourite', function () {
                const creatorAgent = request.agent(app);
                const user2Agent = request.agent(app);

                let creator;
                let user2;
                let topic;
                let ideation;
                let idea;

                suiteSetup(async function () {
                    creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                    user2 = await userLib.createUserAndLogin(user2Agent, null, null, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                    ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                    idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                });

                suite('Create', function () {
                    test('Success', async function () {
                        const resBody = (await ideationIdeaFavouriteCreate(user2Agent, user2.id, topic.id, ideation.id, idea.id)).body;

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
                        const resBody = (await ideationIdeaFavouriteCreate(user2Agent, user2.id, topic.id, ideation.id, idea.id)).body;
                        const expectedBody = {
                            status: {
                                code: 20000
                            }
                        };

                        assert.deepEqual(resBody, expectedBody);

                        const resBody2 = (await ideationIdeaFavouriteDelete(user2Agent, user2.id, topic.id, ideation.id, idea.id)).body
                        const expectedBody2 = {
                            status: {
                                code: 20000
                            }
                        };

                        assert.deepEqual(resBody2, expectedBody2);
                    });
                });
            });

            // API - /api/users/:userId/topics/:topicId/comments
            suite('Comments', function () {

                suite('Create', function () {
                    const agent = request.agent(app);

                    let user;
                    let topic;
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, null, null, null);
                        topic = (await topicLib.topicCreate(agent, user.id, null)).body.data;
                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success - type=pro with reply', async function () {
                        const type = Comment.TYPES.pro;
                        const subject = `Test ${type} comment subject`;
                        const text = `Test ${type} comment text`;

                        const comment = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;
                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.creator.id, user.id);

                        const commentReplyText = `Test Child comment for comment ${type}`;
                        const commentReply = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

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

                        const comment = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;
                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.creator.id, user.id);

                        const commentReplyText = `Test Child comment for comment ${type}`;
                        const commentReply = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

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

                        const comment = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;
                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.creator.id, user.id);

                        const commentReplyText = `Test Child comment for comment ${type}`;
                        const commentReply = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment.id, comment.edits.length - 1, null, null, commentReplyText)).body.data;

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

                        const comment = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;

                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.creator.id, user.id);
                    });

                    test('Fail - disableReplies', async function () {
                        const topic = (await topicLib.topicCreate(agent, user.id, null)).body.data;
                        const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, true)).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        const resBody = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'subject', 'text', 403)).body;
                        const resBodyExpected = {
                            status: {
                                code: 40300,
                                message: 'Replies are disabled for this ideation'
                            }
                        };
                        assert.deepEqual(resBody, resBodyExpected);
                    });

                    test('Fail - 40000 - text can be 1 - N characters longs - PRO', async function () {
                        const type = Comment.TYPES.pro;
                        const maxLength = Comment.TYPE_LENGTH_LIMIT[type];
                        const subject = 'subject test quotes "">\'!<';
                        const text = 'a'.repeat(maxLength + 1);

                        const resBody = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text, 400)).body;

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

                        const resBody = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text, 400)).body;

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

                        const resBody = (await _ideationIdeaCommentCreate(agentUser2, user2.id, topic.id, ideation.id, idea.id, null, null, type, subject, text, 403)).body;

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
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        user2 = await userLib.createUserAndLogin(agent2, null, null, null);
                        user3 = await userLib.createUserAndLogin(agent3, null, null, null);
                        topic = (await topicLib.topicCreate(agent2, user2.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                        ideation = (await ideationCreate(agent2, user2.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent2, user2.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent2, user2.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success - edit comment by user', async function () {
                        const type = Comment.TYPES.pro;
                        const subject = 'to be edited by user';
                        const text = 'Wohoo!';

                        const comment = (await ideationIdeaCommentCreate(agent3, user3.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;
                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.type, Comment.TYPES.pro);
                        assert.equal(comment.creator.id, user3.id);

                        const editSubject = 'Edited by user';
                        const editText = 'Jei, i edited';

                        const status = (await ideationIdeaCommentEdit(agent3, user3.id, topic.id, ideation.id, idea.id, comment.id, editSubject, editText, Comment.TYPES.con)).body.status;
                        assert.equal(status.code, 20000);
                        const commentEdited = (await ideationIdeaCommentList(agent3, user3.id, topic.id, ideation.id, idea.id, 'date')).body.data.rows[0];
                        assert.property(commentEdited, 'id');
                        assert.property(commentEdited, 'edits');
                        assert.equal(commentEdited.edits.length, 1);
                        assert.equal(commentEdited.edits[0].subject, subject);
                        assert.equal(commentEdited.subject, editSubject);
                        assert.equal(commentEdited.edits[0].text, text);
                        assert.equal(commentEdited.text, editText);
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

                        const comment = (await ideationIdeaCommentCreate(agent3, user3.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;
                        const resBodyEdit = (await _ideationIdeaCommentEdit(agent3, user3.id, topic.id, ideation.id, idea.id, comment.id, subject + 'a', 'a'.repeat(maxLength + 1), type, 400)).body;

                        const resBodyEditExpected = {
                            status: { code: 40000 },
                            errors: { text: `Text can be 1 to ${maxLength} characters long.` }
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
                    let ideation;
                    let idea;
                    let partner;
                    let comment1;
                    let comment2;
                    let comment3;

                    setup(async function () {
                        user = await userLib.createUserAndLogin(agent, null, null, null);
                        topic = (await topicLib.topicCreate(agent, user.id)).body.data;
                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        comment1 = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, commentType1, commentSubj1, commentText1)).body.data;
                        comment2 = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, commentType2, commentSubj2, commentText2)).body.data;
                        comment3 = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, commentType3, commentSubj3, commentText3)).body.data;
                        partner = await Partner.create({
                            website: 'notimportant',
                            redirectUriRegexp: 'notimportant'
                        });
                    });

                    test('Success', async function () {
                        const list = (await ideationIdeaCommentList(agent, user.id, topic.id, ideation.id, idea.id, null)).body.data;
                        const comments = list.rows;

                        const creatorExpected = user.toJSON();
                        delete creatorExpected.email; // Email is not returned
                        delete creatorExpected.language; // Language is not returned

                        assert.equal(list.count.total, 3);
                        assert.equal(comments.length, 3);

                        // Comment 1
                        const c1 = comments.find((comment) => comment.id === comment1.id);

                        assert.equal(c1.id, comment1.id);
                        assert.equal(c1.type, comment1.type);
                        assert.equal(c1.subject, comment1.subject);
                        assert.equal(c1.text, comment1.text);
                        assert.property(c1, 'createdAt');
                        assert.equal(c1.parent.id, comment1.id);

                        assert.deepEqual(c1.creator, creatorExpected);

                        // Comment 2
                        const c2 = comments.find((comment) => comment.id === comment2.id);

                        assert.equal(c2.id, comment2.id);
                        assert.equal(c2.type, comment2.type);
                        assert.equal(c2.subject, comment2.subject);
                        assert.equal(c2.text, comment2.text);
                        assert.property(c2, 'createdAt');
                        assert.equal(c2.parent.id, comment2.id);

                        assert.deepEqual(c2.creator, creatorExpected);

                        // Comment 3
                        const c3 = comments.find((comment) => comment.id === comment3.id);

                        assert.equal(c3.id, comment3.id);
                        assert.equal(c3.type, comment3.type);
                        assert.equal(c3.subject, comment3.subject);
                        assert.equal(c3.text, comment3.text);
                        assert.property(c3, 'createdAt');
                        assert.equal(c3.parent.id, comment3.id);

                        assert.deepEqual(c3.creator, creatorExpected);
                    });

                    test('Success v2', async function () {
                        const list = (await ideationIdeaCommentList(agent, user.id, topic.id, ideation.id, idea.id, 'rating')).body.data;
                        const comments = list.rows;

                        const creatorExpected = user.toJSON();
                        delete creatorExpected.email; // Email is not returned
                        delete creatorExpected.language; // Language is not returned

                        assert.equal(list.count.total, 3);
                        assert.equal(comments.length, 3);

                        // Comment 1
                        const c1 = comments.find((comment) => comment.id === comment1.id);

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
                        await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment1.id, null, null, null, replyText11);
                        await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment2.id, null, null, null, replyText21);
                        await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment2.id, null, null, null, replyText22);
                        await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment3.id, null, null, null, replyText31);

                        const list = (await ideationIdeaCommentList(agent, user.id, topic.id, ideation.id, idea.id, null)).body.data;
                        const comments = list.rows;

                        const creatorExpected = user.toJSON();
                        delete creatorExpected.email; // Email is not returned
                        delete creatorExpected.language; // Language is not returned

                        assert.equal(list.count.total, 7);
                        assert.equal(comments.length, 3);

                        // Comment 1
                        const c1 = comments.find((comment) => comment.id === comment1.id);

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
                        const c2 = comments.find((comment) => comment.id === comment2.id);

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
                        const c3 = comments.find((comment) => comment.id === comment3.id);

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
                        await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment1.id, null, null, null, replyText11);
                        await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment2.id, null, null, null, replyText21);
                        await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, comment2.id, null, null, null, replyText22);
                        const list = (await ideationIdeaCommentList(agent, user.id, topic.id, ideation.id, idea.id, null)).body.data;

                        const comments = list.rows;

                        const creatorExpected = user.toJSON();
                        creatorExpected.phoneNumber = null;
                        delete creatorExpected.language; // Language is not returned

                        assert.equal(list.count.total, 6);
                        assert.equal(comments.length, 3);

                        // Comment 1
                        const c1 = comments.find((comment) => comment.id === comment1.id);

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
                        const c2 = comments.find((comment) => comment.id === comment2.id);

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
                    let ideation;
                    let idea;
                    let comment;

                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, null, null, null);

                        topic = (await topicLib.topicCreate(agent, user.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;

                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

                        comment = (await ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, commentType, commentSubject, commentText)).body.data;
                    });

                    test('Success', async function () {
                        await ideationIdeaCommentDelete(agent, user.id, topic.id, ideation.id, idea.id, comment.id);
                        const comments = (await ideationIdeaCommentList(agent, user.id, topic.id, ideation.id, idea.id, null)).body.data;
                        assert.equal(comments.count.total, 1);
                        assert.equal(comments.rows.length, 1);
                        assert.isNotNull(comments.rows[0].deletedAt);
                    });


                    test('Success - delete own comment from Topic with read permissions', async function () {
                        const agentComment = request.agent(app);

                        const userComment = await userLib.createUserAndLogin(agentComment, null, null, null);

                        const comment = (await ideationIdeaCommentCreate(agentComment, userComment.id, topic.id, ideation.id, idea.id, null, null, commentType, commentSubject, commentText)).body.data;

                        await ideationIdeaCommentDelete(agentComment, userComment.id, topic.id, ideation.id, idea.id, comment.id);
                    });

                });

                suite('Unauth', function () {

                    suite('List', function () {

                        const creatorAgent = request.agent(app);
                        const userAgent = request.agent(app);

                        let creator;
                        let topic;
                        let partner;
                        let ideation;
                        let idea;

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
                            topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture])).body.data;
                            ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                            await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                            idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                            comment1 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null, null, commentType1, commentSubj1, commentText1)).body.data;
                            comment2 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null, null, commentType2, commentSubj2, commentText2)).body.data;
                            comment3 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null, null, commentType1, commentSubj3, commentText3)).body.data;
                            partner = await Partner.create({
                                website: 'notimportant',
                                redirectUriRegexp: 'notimportant'
                            });
                            reply1 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, comment3.id, null, null, null, replyText1)).body.data;
                            reply2 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, comment3.id, null, null, null, replyText2)).body.data;
                            reply3 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, comment3.id, null, null, null, replyText3)).body.data;

                            reply11 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply1.id, null, null, null, replyText11)).body.data;
                            reply21 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply2.id, null, null, null, replyText21)).body.data;

                            reply111 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply11.id, null, null, null, replyText111)).body.data;
                            reply211 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply21.id, null, null, null, replyText211)).body.data;
                            reply212 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply21.id, null, null, null, replyText212)).body.data;
                            reply2121 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply212.id, null, null, null, replyText2121)).body.data;
                            reply1111 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply111.id, null, null, null, replyText1111)).body.data;

                            reply11111 = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, reply1111.id, null, null, null, replyText11111)).body.data;
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
                            await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment2.id, 1);
                            await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment1.id, -1);
                            await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, reply212.id, 1);
                            await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, reply2.id, -1);
                            await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, reply3.id, 1);
                        });

                        test('Success', async function () {
                            const topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.communities, Topic.CATEGORIES.culture])).body.data;
                            const ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                            await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                            const idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                            await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'Subject', 'WOHOO! This is my comment.');

                            // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                            const creatorCommentList = (await ideationIdeaCommentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null)).body;
                            const userCommentList = (await ideationIdeaCommentListUnauth(userAgent, topic.id, ideation.id, idea.id, null)).body;

                            assert.deepEqual(creatorCommentList, userCommentList);
                        });

                        test('Success - public Topic without comments', async function () {
                            const topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.defense, Topic.CATEGORIES.education])).body.data;
                            // Verify that the comments output is the same for unauthenticated and authenticated comment list API
                            const ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                            await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                            const idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                            const creatorCommentList = (await ideationIdeaCommentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null)).body;
                            const userCommentList = (await ideationIdeaCommentListUnauth(userAgent, topic.id, ideation.id, idea.id, null)).body;

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
                            const data = (await ideationIdeaCommentListUnauth(userAgent, topic.id, ideation.id, idea.id, 'date')).body.data;

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
                            const data = (await ideationIdeaCommentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 'rating')).body.data;
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
                            const data = (await ideationIdeaCommentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 'popularity')).body.data;
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
                            const data = (await ideationIdeaCommentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 'date')).body.data;
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
                            ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                            await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                            idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

                            return _ideationIdeaCommentListUnauth(userAgent, topic.id, ideation.id, idea.id, null, 404);
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
                            let ideation;
                            let idea;
                            let comment;

                            suiteSetup(async function () {
                                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                                await userLib.createUserAndLogin(userAgent, null, null, null);
                                await userLib.createUserAndLogin(user2Agent, null, null, null);
                            });

                            setup(async function () {
                                topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                                ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                                await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                                idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                                comment = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'Subj', 'Text')).body.data;
                            });

                            test('Success - 20100 - Upvote', async function () {
                                const resBody = (await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, 1)).body;
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
                                const resBody = (await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, -1)).body;
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
                                const resBody = (await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, 0)).body;
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
                                await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, 1);
                                const resBody = (await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, -1)).body;
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
                                await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, 1);
                                await ideationIdeaCommentVotesCreate(userAgent, topic.id, ideation.id, idea.id, comment.id, 1);
                                const resBody = (await ideationIdeaCommentVotesCreate(user2Agent, topic.id, ideation.id, idea.id, comment.id, -1)).body;
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
                                const resBody = (await _ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, 666, 400)).body;
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
                            let ideation;
                            let idea;
                            let comment;

                            suiteSetup(async function () {
                                creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                                await userLib.createUserAndLogin(creatorAgent2, null, null, null);
                            });

                            setup(async function () {
                                topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                                ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                                await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                                idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                                comment = (await ideationIdeaCommentCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'Subj', 'Text')).body.data
                            });

                            test('Success', async function () {
                                await ideationIdeaCommentVotesCreate(creatorAgent, topic.id, ideation.id, idea.id, comment.id, 1);
                                await ideationIdeaCommentVotesCreate(creatorAgent2, topic.id, ideation.id, idea.id, comment.id, 0); //Add cleared vote that should not be returned;
                                const commentVotesList = (await ideationIdeaCommentVotesList(creatorAgent, creator.id, topic.id, ideation.id, idea.id, comment.id)).body.data;
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
                            let ideation;
                            let idea;
                            let comment;

                            suiteSetup(async function () {
                                userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                                userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                                userReporter = await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                                topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                                ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation')).body.data;
                                await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                                idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                                comment = (await ideationIdeaCommentCreate(agentCreator, userCreator.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
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

                                const reportResult = (await ideationIdeaCommentReportCreate(agentReporter, topic.id, ideation.id, idea.id, comment.id, Report.TYPES.hate, reportText)).body.data;
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
                            let ideation;
                            let idea;
                            let comment;
                            let report;

                            suiteSetup(async function () {
                                userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                                userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                                await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                                topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                                ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation')).body.data;
                                await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                                idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

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
                                comment = (await ideationIdeaCommentCreate(agentCreator, userCreator.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
                                report = (await ideationIdeaCommentReportCreate(agentReporter, topic.id, ideation.id, idea.id, comment.id, Report.TYPES.hate, 'reported!')).body.data;
                            });

                            test('Success - token with audience', async function () {
                                const token = cosJwt.getTokenRestrictedUse(
                                    {
                                        userId: userModerator.id
                                    },
                                    [
                                        'GET /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId'
                                            .replace(':topicId', topic.id)
                                            .replace(':ideationId', ideation.id)
                                            .replace(':ideaId', idea.id)
                                            .replace(':commentId', comment.id)
                                            .replace(':reportId', report.id)
                                    ]
                                );

                                const resBody = (await ideationIdeaCommentReportRead(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, token)).body;
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
                                return _ideationIdeaCommentReportRead(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, token, 401);
                            });

                            test('Fail - 40100 - invalid token - without audience', async function () {
                                const token = jwt.sign(
                                    {},
                                    config.session.privateKey,
                                    {
                                        algorithm: config.session.algorithm
                                    }
                                );

                                return _ideationIdeaCommentReportRead(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, token, 401);
                            });

                            test('Fail - 40100 - invalid token - invalid audience', async function () {
                                const token = cosJwt.getTokenRestrictedUse({}, 'GET /foo/bar');

                                return _ideationIdeaCommentReportRead(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, token, 401);
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
                            let ideation;
                            let idea;
                            let comment;
                            let report;

                            suiteSetup(async function () {
                                userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                                userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                                await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                                topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                                ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation')).body.data;
                                await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                                idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

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
                                comment = (await ideationIdeaCommentCreate(agentCreator, userCreator.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'test abuse report', 'test abuse report')).body.data;
                                report = (await ideationIdeaCommentReportCreate(agentReporter, topic.id, ideation.id, idea.id, comment.id, Report.TYPES.hate, 'Report create test text')).body.data;

                            });

                            test('Success', async function () {
                                const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                                const moderateText = 'Report create moderation text';

                                const token = cosJwt.getTokenRestrictedUse(
                                    {
                                        userId: userModerator.id
                                    },
                                    [
                                        'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId/moderate'
                                            .replace(':topicId', topic.id)
                                            .replace(':ideationId', ideation.id)
                                            .replace(':ideaId', idea.id)
                                            .replace(':commentId', comment.id)
                                            .replace(':reportId', report.id)
                                    ]
                                );

                                await ideationIdeaCommentReportModerate(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, token, moderateType, moderateText);

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
                                return _ideationIdeaCommentReportModerate(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, 'TOKEN HERE', Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
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

                                return _ideationIdeaCommentReportModerate(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, token, Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
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

                                report = (await ideationIdeaCommentReportCreate(agentReporter, topic.id, ideation.id, idea.id, comment.id, Report.TYPES.hate, 'Report create test text')).body.data;
                                const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                                const moderateText = 'Report create moderation text';

                                const token = cosJwt.getTokenRestrictedUse(
                                    {
                                        userId: userModerator.id
                                    },
                                    [
                                        'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId/moderate'
                                            .replace(':topicId', topic.id)
                                            .replace(':ideationId', ideation.id)
                                            .replace(':ideaId', idea.id)
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
                                const resBody = (await _ideationIdeaCommentReportModerate(request.agent(app), topic.id, ideation.id, idea.id, comment.id, report.id, token, moderateType, moderateText, 400)).body;
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
                })
            });

            // API - /api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments
            suite('Attachments', function () {
                const creatorAgent = request.agent(app);
                const agent = request.agent(app);
                let creator;
                let user;
                let topic;
                let topic2;

                let ideation;
                let ideation2;

                let idea;
                let idea2;
                setup(async function () {
                    creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                    user = await userLib.createUserAndLogin(agent);
                    topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                    ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                    idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    topic2 = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                    ideation2 = (await ideationCreate(creatorAgent, creator.id, topic2.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic2.id, Topic.STATUSES.ideation);
                    idea2 = (await ideationIdeaCreate(creatorAgent, creator.id, topic2.id, ideation2.id, 'TEST', 'TEST')).body.data;
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

                        const attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
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

                        const resBody = (await _ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, 400)).body;
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
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const readAttachment = (await ideaAttachmentRead(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id)).body.data;

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
                        const readAttachment = (await ideaAttachmentReadUnauth(agent, topic.id, ideation.id, idea.id, attachment.id)).body.data;

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
                        const result = (await _ideaAttachmentReadUnauth(agent, topic2.id, ideation2.id, idea2.id, attachment.id, 404)).body;
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
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const updateAttachment = (await ideaAttachmentUpdate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id, 'newTestFilename')).body.data;
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
                        const resBody = (await _ideaAttachmentUpdate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id, '', 400)).body;
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
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const resBody = (await ideaAttachmentDelete(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id)).body;
                        const expectedBody = {
                            status: {
                                code: 20000
                            }
                        };
                        assert.deepEqual(resBody, expectedBody);
                        const list = (await ideaAttachmentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id)).body.data;

                        assert.equal(list.count, 0);
                        assert.equal(list.rows.length, 0);
                    });

                    test('Fail - unauthorized', async function () {
                        const resBody = (await _ideaAttachmentDelete(agent, user.id, topic.id, ideation.id, idea.id, attachment.id, 403)).body;
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

                        const attachment = (await uploadAttachmentFile(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment)).body.data;
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

                        const resBody = (await _uploadAttachmentFile(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment, 403)).body;
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
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const list = (await ideaAttachmentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id)).body.data;
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
                        const list = (await ideaAttachmentListUnauth(creatorAgent, topic.id, ideation.id, idea.id)).body.data;
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
        });

        suite('Idea Anonymous', function () {
            suite('Create', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    assert.equal(idea.statement, statement);
                    assert.equal(idea.description, description);
                    assert.notProperty(idea, 'author');
                    assert.exists(idea, 'id');
                    assert.exists(idea, 'createdAt');
                    assert.exists(idea, 'updatedAt');
                    assert.exists(idea, 'deletedAt');
                });

                test('Fail - missing statement', async function () {
                    const description = 'This idea is just for testing';
                    const ideaRes = (await _ideationIdeaCreate(agent, user.id, topic.id, ideation.id, null, description, null, 400)).body;
                    const expectedRes = {
                        status: { code: 40000 },
                        errors: { statement: 'Idea.statement cannot be null' }
                    };

                    assert.deepEqual(ideaRes, expectedRes);
                });

                test('Fail - missing description', async function () {
                    const statement = 'This idea is just for testing';
                    const ideaRes = (await _ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, null, null, 400)).body;
                    const expectedRes = {
                        status: { code: 40000 },
                        errors: { description: 'Idea.description cannot be null' }
                    };

                    assert.deepEqual(ideaRes, expectedRes);
                });

                test('Fail - topic status not ideation', async function () {
                    await discussionCreate(agent, user.id, topic.id, 'TEST?');
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.followUp);
                    await _ideationIdeaCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST idea', 'description', null, 401);
                });

                test('Fail - Unauthorized', async function () {
                    await _ideationIdeaCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST idea', 'description', null, 401);
                });
            });

            suite('Read', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;
                    assert.notProperty(ideaR, 'author');
                    assert.notProperty(idea, 'author');
                    assert.deepEqual(ideaR.votes, {
                        down: {
                            count: 0,
                            selected: false
                        },
                        up: {
                            count: 0,
                            selected: false
                        }
                    });
                    assert.equal(ideaR.favourite, false)
                    assert.deepEqual(ideaR.replies, {
                        count: 0
                    });
                    delete ideaR.replies;
                    delete ideaR.votes;
                    delete ideaR.favourite;
                    assert.deepEqual(idea, ideaR);
                });

                test('Success - public topic unauth', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;

                    assert.notProperty(ideaR, 'author');
                    assert.notProperty(idea, 'author');

                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    delete ideaR.favourite;
                    delete ideaR.votes.up.selected;
                    delete ideaR.votes.down.selected;
                    const ideaRUnauth = (await ideationIdeaReadUnauth(request.agent(app), topic.id, ideation.id, idea.id)).body.data;
                    assert.notProperty(ideaRUnauth, 'author');
                    assert.deepEqual(ideaR, ideaRUnauth);
                });

                test('Success - member topic', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    const ideaR = (await ideationIdeaRead(agent, user.id, topic.id, ideation.id, idea.id)).body.data;
                    assert.deepEqual(ideaR.votes, {
                        down: {
                            count: 0,
                            selected: false
                        },
                        up: {
                            count: 0,
                            selected: false
                        }
                    });
                    assert.notProperty(ideaR, 'author');
                    assert.notProperty(idea, 'author');
                    assert.equal(ideaR.favourite, false)
                    assert.deepEqual(ideaR.replies, {
                        count: 0
                    });
                    delete ideaR.replies;
                    delete ideaR.votes;
                    delete ideaR.favourite;
                    assert.deepEqual(idea, ideaR);
                });

                test('Fail - Unauthorized', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                    await _ideationIdeaRead(request.agent(app), user.id, topic.id, ideation.id, idea.id, 401);
                });
            });

            suite('Update', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Fail', async function () {
                    const statement = 'TEST idea';
                    const description = 'This idea is just for testing';

                    const updatedStatement = 'Test idea Update';
                    const updatedDescription = 'Updated description';
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;

                    assert.notProperty(idea, 'author');

                    assert.equal(idea.statement, statement);
                    assert.equal(idea.description, description);
                    assert.exists(idea, 'id');
                    assert.exists(idea, 'createdAt');
                    assert.exists(idea, 'updatedAt');
                    assert.exists(idea, 'deletedAt');
                    const ideaUpdate = (await _ideationIdeaUpdate(agent, user.id, topic.id, ideation.id, idea.id, updatedStatement, updatedDescription, null, 403)).body;

                    assert.deepEqual(
                        ideaUpdate,
                        {
                            status: { code: 40300, message: "Forbidden" }
                        }
                    );
                });

                test('Fail - Unauthorized', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaUpdate(request.agent(app), user.id, topic.id, ideation.id, idea.id, 'TEST idea', 'description', null, 401);
                });
            });

            suite('Delete', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                //TODO: Update this when verified if admins can delete anonymous ideas
                test('Success', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const deleteRes = (await ideationIdeaDelete(agent, user.id, topic.id, ideation.id, idea.id)).body;
                    const expectedBody = {
                        status: {
                            code: 20000
                        }
                    };
                    assert.deepEqual(deleteRes, expectedBody);
                });

                test('Fail - not author of the idea', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaDelete(agent2, user2.id, topic.id, ideation.id, idea.id, 403);
                });

                test('Fail - Unauthorized', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationIdeaDelete(request.agent(app), user.id, topic.id, ideation.id, idea.id, 401);
                });
            });

            suite('List', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const ideas = (await ideationIdeaList(agent, user.id, topic.id, ideation.id)).body.data;
                    assert.exists(ideas.rows[0], 'favourite');
                    delete ideas.rows[0].favourite;
                    assert.deepEqual(ideas.rows[0].replies, { count: 0 });
                    delete ideas.rows[0].replies;
                    assert.deepEqual(ideas.rows[0].votes, { up: { count: 0, selected: false }, down: { count: 0, selected: false } });
                    delete ideas.rows[0].votes;
                    assert.deepEqual(ideas, { count: 1, rows: [idea] });
                    ideas.rows.forEach((idea) => {
                        assert.notProperty(idea, 'author');
                    });
                });

                test('Success - unauth', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const ideas = (await ideationIdeaListUnauth(request.agent(app), topic.id, ideation.id)).body.data;
                    assert.exists(ideas.rows[0], 'favourite');
                    delete ideas.rows[0].favourite;
                    assert.deepEqual(ideas.rows[0].replies, { count: 0 });
                    delete ideas.rows[0].replies;
                    assert.deepEqual(ideas.rows[0].votes, { up: { count: 0 }, down: { count: 0 } });
                    delete ideas.rows[0].votes;
                    assert.deepEqual(ideas, { count: 1, rows: [idea] });
                    ideas.rows.forEach((idea) => {
                        assert.notProperty(idea, 'author');
                    });
                });

                test('Success - query - showModerated', async function () {
                    const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const agentModerator = request.agent(app);
                    const userModerator = await userLib.createUser(agentModerator, 'moderator' + new Date().getTime() + '@test.com', null, null);
                    await Moderator.create({
                        userId: userModerator.id
                    });
                    const agentReporter = request.agent(app);
                    const userReporter = await userLib.createUserAndLogin(agentReporter, 'reporter' + new Date().getTime() + '@test.com', null, null);
                    const report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'Report create test text')).body.data;

                    assert.isTrue(validator.isUUID(report.id));
                    assert.equal(report.type, Report.TYPES.hate);
                    assert.equal(report.text, 'Report create test text');
                    assert.property(report, 'createdAt');
                    assert.equal(report.creator.id, userReporter.id);

                    assert.notProperty(idea, 'author');

                    const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                    const moderateText = 'Report create moderation text';

                    const token = cosJwt.getTokenRestrictedUse(
                        {
                            userId: userModerator.id
                        },
                        [
                            'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate'
                                .replace(':topicId', topic.id)
                                .replace(':ideationId', ideation.id)
                                .replace(':ideaId', idea.id)
                                .replace(':reportId', report.id)
                        ]
                    );

                    await ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, moderateType, moderateText);

                    const ideas = (await ideationIdeaListUnauth(request.agent(app), topic.id, ideation.id, { showModerated: 'showModerated' })).body.data;
                    assert.deepEqual(ideas.rows[0].replies, { count: 0 });
                    delete ideas.rows[0].replies;
                    assert.deepEqual(ideas.rows[0].votes, { up: { count: 0 }, down: { count: 0 } });
                    delete ideas.rows[0].votes;
                    assert.equal(ideas.count, 1);
                    assert.equal(ideas.rows.length, 1);
                    const ideaRes = ideas.rows[0];
                    assert.deepEqual(ideaRes.author, idea.author);
                    assert.equal(ideaRes.statement, idea.statement);
                    assert.equal(ideaRes.description, idea.description);
                    assert.equal(ideaRes.imageUrl, idea.imageUrl);
                    assert.equal(ideaRes.createdAt, idea.createdAt);
                    assert.deepEqual(ideaRes.deletedBy, { id: userModerator.id, name: userModerator.name });
                    assert.deepEqual(ideaRes.report, { id: report.id });
                    assert.notEqual(ideaRes.deletedAt, null);
                    assert.equal(ideaRes.deletedReasonText, moderateText);
                    assert.equal(ideaRes.deletedReasonType, moderateType);
                });

                test('Fail - Unauthorized', async function () {
                    await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST');
                    await _ideationIdeaList(request.agent(app), user.id, topic.id, ideation.id, null, 401);
                });
            });

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
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        userReporter = await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                        ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST abusive', 'TEST inapropriate')).body.data;
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

                        const reportResult = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, reportText)).body.data;
                        assert.isTrue(validator.isUUID(reportResult.id));
                        assert.notProperty(idea, 'author');
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
                    let ideation;
                    let idea;
                    let report;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                        ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

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
                        report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'reported!')).body.data;
                    });

                    test('Success - token with audience', async function () {
                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'GET /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId'
                                    .replace(':topicId', topic.id)
                                    .replace(':ideationId', ideation.id)
                                    .replace(':ideaId', idea.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        const resBody = (await ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token)).body;

                        const expectedResult = {
                            status: { code: 20000 },
                            data: {
                                id: report.id,
                                type: report.type,
                                text: report.text,
                                createdAt: report.createdAt,
                                idea: {
                                    statement: idea.statement,
                                    description: idea.description,
                                    id: idea.id
                                }
                            }
                        };
                        assert.deepEqual(resBody, expectedResult);
                    });

                    test('Fail - 40100 - Invalid token', async function () {
                        const token = {};
                        return _ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, 401);
                    });

                    test('Fail - 40100 - invalid token - without audience', async function () {
                        const token = jwt.sign(
                            {},
                            config.session.privateKey,
                            {
                                algorithm: config.session.algorithm
                            }
                        );

                        return _ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, 401);
                    });

                    test('Fail - 40100 - invalid token - invalid audience', async function () {
                        const token = cosJwt.getTokenRestrictedUse({}, 'GET /foo/bar');

                        return _ideationIdeaReportRead(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, 401);
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
                    let ideation;
                    let idea;
                    let report;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, emailCreator, null, null);
                        userModerator = await userLib.createUser(agentModerator, emailModerator, null, null);
                        await userLib.createUserAndLogin(agentReporter, emailReporter, null, null);
                        topic = (await topicLib.topicCreate(agentCreator, userCreator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                        ideation = (await ideationCreate(agentCreator, userCreator.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                        await topicLib.topicUpdate(agentCreator, userCreator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agentCreator, userCreator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;

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
                        report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'Report create test text')).body.data;

                    });

                    test('Success', async function () {
                        const moderateType = Comment.DELETE_REASON_TYPES.duplicate;
                        const moderateText = 'Report create moderation text';

                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate'
                                    .replace(':topicId', topic.id)
                                    .replace(':ideationId', ideation.id)
                                    .replace(':ideaId', idea.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        await ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, moderateType, moderateText);

                        const ideaRead = (await Idea.findOne({
                            where: {
                                id: idea.id
                            },
                            paranoid: false
                        })).toJSON();

                        assert.equal(ideaRead.deletedBy.id, userModerator.id);
                        assert.equal(ideaRead.report.id, report.id);
                        assert.equal(ideaRead.deletedReasonType, moderateType);
                        assert.equal(ideaRead.deletedReasonText, moderateText);
                        assert.isNotNull(ideaRead.deletedAt);
                    });

                    test('Fail - 40100 - Invalid token - random stuff', async function () {
                        return _ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, 'TOKEN HERE', Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
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

                        return _ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, Comment.DELETE_REASON_TYPES.abuse, 'not important', 401);
                    });

                    test('Fail - 40010 - Report has become invalid cause comment has been updated after the report', async function () {
                        // Revive the Comment we deleted on report
                        await Idea.update(
                            {
                                deletedById: null,
                                deletedAt: null,
                                deletedReasonType: null,
                                deletedReasonText: null,
                                deletedByReportId: null

                            },
                            {
                                where: {
                                    id: idea.id
                                },
                                paranoid: false
                            }
                        );

                        report = (await ideationIdeaReportCreate(agentReporter, topic.id, ideation.id, idea.id, Report.TYPES.hate, 'Report create test text')).body.data;
                        const moderateType = Idea.DELETE_REASON_TYPES.duplicate;
                        const moderateText = 'Report create moderation text';

                        const token = cosJwt.getTokenRestrictedUse(
                            {
                                userId: userModerator.id
                            },
                            [
                                'POST /api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate'
                                    .replace(':topicId', topic.id)
                                    .replace(':ideationId', ideation.id)
                                    .replace(':ideaId', idea.id)
                                    .replace(':reportId', report.id)
                            ]
                        );

                        await Idea.update(
                            {
                                description: 'Update idea!'
                            },
                            {
                                where: {
                                    id: idea.id
                                },
                                paranoid: false
                            }
                        );
                        const resBody = (await _ideationIdeaReportModerate(request.agent(app), topic.id, ideation.id, idea.id, report.id, token, moderateType, moderateText, 400)).body;
                        const expectedResult = {
                            status: {
                                code: 40010,
                                message: 'Report has become invalid cause idea has been updated after the report'
                            }
                        };

                        assert.deepEqual(resBody, expectedResult);
                    });
                });

            });

            suite('Votes', function () {
                suite('Create', function () {
                    const creatorAgent = request.agent(app);
                    const userAgent = request.agent(app);
                    const user2Agent = request.agent(app);

                    let creator;
                    let user;
                    let user2;
                    let topic;
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                        user = await userLib.createUserAndLogin(userAgent, null, null, null);
                        user2 = await userLib.createUserAndLogin(user2Agent, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                        ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                        await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success - 20100 - Upvote', async function () {
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1)).body;

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
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, -1)).body;
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
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 0)).body;
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
                        await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1);
                        const resBody = (await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, -1)).body;
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
                        await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1);
                        await ideationIdeaVotesCreate(userAgent, user.id, topic.id, ideation.id, idea.id, 1);
                        const resBody = (await ideationIdeaVotesCreate(user2Agent, user2.id, topic.id, ideation.id, idea.id, -1)).body;
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
                        const resBody = (await _ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 666, 400)).body;
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
                    let creator2;
                    let topic;
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                        creator2 = await userLib.createUserAndLogin(creatorAgent2, null, null, null);
                    });

                    setup(async function () {
                        topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                        ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success', async function () {
                        await ideationIdeaVotesCreate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, 1);
                        await ideationIdeaVotesCreate(creatorAgent2, creator2.id, topic.id, ideation.id, idea.id, 0); //Add cleared vote that should not be returned;
                        const commentVotesList = (await ideationIdeaVotesList(creatorAgent, creator.id, topic.id, ideation.id, idea.id)).body.data;
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

            suite('Favourite', function () {
                const creatorAgent = request.agent(app);
                const user2Agent = request.agent(app);

                let creator;
                let user2;
                let topic;
                let ideation;
                let idea;

                suiteSetup(async function () {
                    creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                    user2 = await userLib.createUserAndLogin(user2Agent, null, null, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public, [Topic.CATEGORIES.agriculture, Topic.CATEGORIES.business])).body.data;
                    ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                    idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                });

                suite('Create', function () {
                    test('Success', async function () {
                        const resBody = (await ideationIdeaFavouriteCreate(user2Agent, user2.id, topic.id, ideation.id, idea.id)).body;

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
                        const resBody = (await ideationIdeaFavouriteCreate(user2Agent, user2.id, topic.id, ideation.id, idea.id)).body;
                        const expectedBody = {
                            status: {
                                code: 20000
                            }
                        };

                        assert.deepEqual(resBody, expectedBody);

                        const resBody2 = (await ideationIdeaFavouriteDelete(user2Agent, user2.id, topic.id, ideation.id, idea.id)).body
                        const expectedBody2 = {
                            status: {
                                code: 20000
                            }
                        };

                        assert.deepEqual(resBody2, expectedBody2);
                    });
                });
            });

            // API - /api/users/:userId/topics/:topicId/comments
            suite('Comments', function () {

                suite('Create', function () {
                    const agent = request.agent(app);

                    let user;
                    let topic;
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, null, null, null);
                        topic = (await topicLib.topicCreate(agent, user.id, null)).body.data;
                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Fail - 40300 - type=pro', async function () {
                        const type = Comment.TYPES.pro;
                        const subject = `Test ${type} comment subject`;
                        const text = `Test ${type} comment text`;

                        const comment = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text, 403)).body;
                        assert.deepEqual(comment, {
                            status: {
                                code: 40300,
                                message: 'Replies are disabled for this ideation'
                            }
                        });
                    });

                    test('Fail - 40300 - type=con', async function () {
                        const type = Comment.TYPES.con;
                        const subject = `Test ${type} comment subject`;
                        const text = `Test ${type} comment text`;

                        const comment = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text, 403)).body;
                        assert.deepEqual(comment, {
                            status: {
                                code: 40300,
                                message: 'Replies are disabled for this ideation'
                            }
                        });
                    });

                    test('Fail - 40300 - type=poi', async function () {
                        const type = Comment.TYPES.poi;
                        const subject = `Test ${type} comment subject`;
                        const text = `Test ${type} comment text`;

                        const comment = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, type, subject, text, 403)).body;
                        assert.deepEqual(comment, {
                            status: {
                                code: 40300,
                                message: 'Replies are disabled for this ideation'
                            }
                        });
                    });

                    test('Fail - disableReplies', async function () {
                        const topic = (await topicLib.topicCreate(agent, user.id, null)).body.data;
                        const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, true)).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        const resBody = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, Comment.TYPES.pro, 'subject', 'text', 403)).body;
                        const resBodyExpected = {
                            status: {
                                code: 40300,
                                message: 'Replies are disabled for this ideation'
                            }
                        };
                        assert.deepEqual(resBody, resBodyExpected);
                    });

                    test('Fail - 40300 - Forbidden - cannot comment on Topic you\'re not a member of or the Topic is not public', async function () {
                        const type = Comment.TYPES.poi;
                        const subject = 'subject test quotes "">\'!<';
                        const text = 'should not pass!';

                        const agentUser2 = request.agent(app);
                        const user2 = await userLib.createUserAndLogin(agentUser2, null, null, null);

                        const resBody = (await _ideationIdeaCommentCreate(agentUser2, user2.id, topic.id, ideation.id, idea.id, null, null, type, subject, text, 403)).body;

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
                    let ideation;
                    let idea;

                    suiteSetup(async function () {
                        user2 = await userLib.createUserAndLogin(agent2, null, null, null);
                        user3 = await userLib.createUserAndLogin(agent3, null, null, null);
                        topic = (await topicLib.topicCreate(agent2, user2.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                        ideation = (await ideationCreate(agent2, user2.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent2, user2.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent2, user2.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success - edit comment by user', async function () {
                        const type = Comment.TYPES.pro;
                        const subject = 'to be edited by user';
                        const text = 'Wohoo!';

                        const comment = (await ideationIdeaCommentCreate(agent3, user3.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;
                        assert.property(comment, 'id');
                        assert.equal(comment.type, type);
                        assert.equal(comment.subject, subject);
                        assert.equal(comment.text, text);
                        assert.equal(comment.type, Comment.TYPES.pro);
                        assert.equal(comment.creator.id, user3.id);

                        const editSubject = 'Edited by user';
                        const editText = 'Jei, i edited';

                        const status = (await ideationIdeaCommentEdit(agent3, user3.id, topic.id, ideation.id, idea.id, comment.id, editSubject, editText, Comment.TYPES.con)).body.status;
                        assert.equal(status.code, 20000);
                        const commentEdited = (await ideationIdeaCommentList(agent3, user3.id, topic.id, ideation.id, idea.id, 'date')).body.data.rows[0];
                        assert.property(commentEdited, 'id');
                        assert.property(commentEdited, 'edits');
                        assert.equal(commentEdited.edits.length, 1);
                        assert.equal(commentEdited.edits[0].subject, subject);
                        assert.equal(commentEdited.subject, editSubject);
                        assert.equal(commentEdited.edits[0].text, text);
                        assert.equal(commentEdited.text, editText);
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

                        const comment = (await ideationIdeaCommentCreate(agent3, user3.id, topic.id, ideation.id, idea.id, null, null, type, subject, text)).body.data;
                        const resBodyEdit = (await _ideationIdeaCommentEdit(agent3, user3.id, topic.id, ideation.id, idea.id, comment.id, subject + 'a', 'a'.repeat(maxLength + 1), type, 400)).body;

                        const resBodyEditExpected = {
                            status: { code: 40000 },
                            errors: { text: `Text can be 1 to ${maxLength} characters long.` }
                        };

                        assert.deepEqual(resBodyEdit, resBodyEditExpected);
                    });
                });

                suite('List', function () {
                    const agent = request.agent(app);

                    const commentType1 = Comment.TYPES.pro;
                    const commentSubj1 = 'Test comment 1 subj';
                    const commentText1 = 'Test comment 1 text';


                    let user;
                    let topic;
                    let ideation;
                    let idea;
                    let comment1;
                    let comment2;
                    let comment3;

                    setup(async function () {
                        user = await userLib.createUserAndLogin(agent, null, null, null);
                        topic = (await topicLib.topicCreate(agent, user.id)).body.data;
                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Fail', async function () {
                        comment1 = (await _ideationIdeaCommentCreate(agent, user.id, topic.id, ideation.id, idea.id, null, null, commentType1, commentSubj1, commentText1, 403)).body;
                        const list = (await ideationIdeaCommentList(agent, user.id, topic.id, ideation.id, idea.id, null)).body.data;
                        const comments = list.rows;

                        const creatorExpected = user.toJSON();
                        delete creatorExpected.email; // Email is not returned
                        delete creatorExpected.language; // Language is not returned

                        assert.equal(list.count.total, 0);
                        assert.equal(comments.length, 0);

                        // Comment 1
                        const c1 = comments.find((comment) => comment.id === comment1.id);

                        assert.equal(c1, null);

                        // Comment 2
                        const c2 = comments.find((comment) => comment.id === comment2.id);

                        assert.equal(c2, null);

                        // Comment 3
                        const c3 = comments.find((comment) => comment.id === comment3.id);

                        assert.equal(c3, null);
                    });

                    test('Success v2', async function () {
                        const list = (await ideationIdeaCommentList(agent, user.id, topic.id, ideation.id, idea.id, 'rating')).body.data;
                        const comments = list.rows;

                        assert.equal(list.count.total, 0);
                        assert.equal(comments.length, 0);

                        // Comment 1
                        const c1 = comments.find((comment) => comment.id === comment1.id);

                        assert.equal(c1, null);
                    });
                });
            });

            // API - /api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments
            suite('Attachments', function () {
                const creatorAgent = request.agent(app);
                const agent = request.agent(app);
                let creator;
                let user;
                let topic;
                let topic2;

                let ideation;
                let ideation2;

                let idea;
                let idea2;
                setup(async function () {
                    creator = await userLib.createUserAndLogin(creatorAgent, null, null, null);
                    user = await userLib.createUserAndLogin(agent);
                    topic = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.public)).body.data;
                    ideation = (await ideationCreate(creatorAgent, creator.id, topic.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic.id, Topic.STATUSES.ideation);
                    idea = (await ideationIdeaCreate(creatorAgent, creator.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    topic2 = (await topicLib.topicCreate(creatorAgent, creator.id, null, Topic.STATUSES.draft, null, Topic.VISIBILITY.private)).body.data;
                    ideation2 = (await ideationCreate(creatorAgent, creator.id, topic2.id, 'TEST ideation', null, false, true)).body.data;
                    await topicLib.topicUpdate(creatorAgent, creator.id, topic2.id, Topic.STATUSES.ideation);
                    idea2 = (await ideationIdeaCreate(creatorAgent, creator.id, topic2.id, ideation2.id, 'TEST', 'TEST')).body.data;
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

                        const attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                        assert.property(attachment, 'id');
                        assert.property(attachment, 'createdAt');
                        assert.equal(attachment.name, expectedAttachment.name);
                        assert.equal(attachment.link, expectedAttachment.link);
                        assert.equal(attachment.source, expectedAttachment.source);
                        assert.equal(attachment.type, expectedAttachment.type);
                        assert.equal(attachment.size, expectedAttachment.size);
                        assert.equal(attachment.creatorId, null);
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

                        const resBody = (await _ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size, 400)).body;
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
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const readAttachment = (await ideaAttachmentRead(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id)).body.data;

                        assert.equal(readAttachment.id, attachment.id);
                        assert.equal(readAttachment.createdAt, attachment.createdAt);
                        assert.equal(readAttachment.name, attachment.name);
                        assert.equal(readAttachment.link, attachment.link);
                        assert.equal(readAttachment.source, attachment.source);
                        assert.equal(readAttachment.type, attachment.type);
                        assert.equal(readAttachment.size, attachment.size);
                        assert.equal(readAttachment.creatorId, null);
                    });

                    test('Unauth - Success', async function () {
                        const readAttachment = (await ideaAttachmentReadUnauth(agent, topic.id, ideation.id, idea.id, attachment.id)).body.data;

                        assert.equal(readAttachment.id, attachment.id);
                        assert.equal(readAttachment.createdAt, attachment.createdAt);
                        assert.equal(readAttachment.name, attachment.name);
                        assert.equal(readAttachment.link, attachment.link);
                        assert.equal(readAttachment.source, attachment.source);
                        assert.equal(readAttachment.type, attachment.type);
                        assert.equal(readAttachment.size, attachment.size);
                        assert.equal(readAttachment.creatorId, null);
                    });

                    test('Unauth- Fail', async function () {
                        const result = (await _ideaAttachmentReadUnauth(agent, topic2.id, ideation2.id, idea2.id, attachment.id, 404)).body;
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
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const updateAttachment = (await ideaAttachmentUpdate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id, 'newTestFilename')).body.data;
                        assert.property(updateAttachment, 'id');
                        assert.property(updateAttachment, 'createdAt');
                        assert.equal(updateAttachment.name, 'newTestFilename');
                        assert.equal(updateAttachment.link, attachment.link);
                        assert.equal(updateAttachment.type, attachment.type);
                        assert.equal(updateAttachment.source, attachment.source);
                        assert.equal(updateAttachment.size, attachment.size);
                        assert.equal(updateAttachment.creatorId, null);
                    });

                    test('Update attachment - Fail - Missing attachment name', async function () {
                        const resBody = (await _ideaAttachmentUpdate(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id, '', 400)).body;
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
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const resBody = (await ideaAttachmentDelete(creatorAgent, creator.id, topic.id, ideation.id, idea.id, attachment.id)).body;
                        const expectedBody = {
                            status: {
                                code: 20000
                            }
                        };
                        assert.deepEqual(resBody, expectedBody);
                        const list = (await ideaAttachmentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id)).body.data;

                        assert.equal(list.count, 0);
                        assert.equal(list.rows.length, 0);
                    });

                    test('Fail - unauthorized', async function () {
                        const resBody = (await _ideaAttachmentDelete(agent, user.id, topic.id, ideation.id, idea.id, attachment.id, 403)).body;
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

                        const attachment = (await uploadAttachmentFile(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment)).body.data;
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

                        const resBody = (await _uploadAttachmentFile(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment, 403)).body;
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
                            creatorId: null
                        };
                        attachment = (await ideaAttachmentAdd(creatorAgent, creator.id, topic.id, ideation.id, idea.id, expectedAttachment.name, expectedAttachment.link, expectedAttachment.source, expectedAttachment.type, expectedAttachment.size)).body.data;
                    });

                    test('Success', async function () {
                        const list = (await ideaAttachmentList(creatorAgent, creator.id, topic.id, ideation.id, idea.id)).body.data;
                        const listAttachment = list.rows[0];

                        assert.equal(list.count, 1);
                        assert.property(listAttachment, 'id');
                        assert.property(listAttachment, 'createdAt');
                        assert.equal(listAttachment.name, attachment.name);
                        assert.equal(listAttachment.link, attachment.link);
                        assert.equal(listAttachment.type, attachment.type);
                        assert.equal(listAttachment.size, attachment.size);
                        assert.equal(listAttachment.creator.id, null);
                    });

                    test('Success unauth', async function () {
                        const list = (await ideaAttachmentListUnauth(creatorAgent, topic.id, ideation.id, idea.id)).body.data;
                        assert.equal(list.count, 1);
                        const listAttachment = list.rows[0];
                        assert.property(listAttachment, 'id');
                        assert.property(listAttachment, 'createdAt');
                        assert.equal(listAttachment.name, attachment.name);
                        assert.equal(listAttachment.link, attachment.link);
                        assert.equal(listAttachment.type, attachment.type);
                        assert.equal(listAttachment.source, attachment.source);
                        assert.equal(listAttachment.size, attachment.size);
                        assert.equal(listAttachment.creator.id, null);
                    });
                });
            });
        });

        suite('Folder', function () {
            suite('Create', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const name = 'TEST ideas';
                    const description = 'This folder is just for testing';
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, name, description)).body.data;

                    assert.equal(folder.name, name);
                    assert.equal(folder.description, description);
                    assert.equal(folder.creatorId, user.id);
                    assert.exists(folder, 'id');
                    assert.exists(folder, 'createdAt');
                    assert.exists(folder, 'updatedAt');
                    assert.exists(folder, 'deletedAt');
                });

                test('Success - missing description', async function () {
                    const name = 'Test folder';
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, name)).body.data;
                    assert.equal(folder.name, name);
                    assert.equal(folder.description, null);
                    assert.equal(folder.creatorId, user.id);
                    assert.exists(folder, 'id');
                    assert.exists(folder, 'createdAt');
                    assert.exists(folder, 'updatedAt');
                    assert.exists(folder, 'deletedAt');
                });

                test('Success - anonymous ideation', async function () {
                    const topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, null, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    const name = 'TEST ideas';
                    const description = 'This folder is just for testing';
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, name, description)).body.data;
                    assert.equal(folder.name, name);
                    assert.equal(folder.description, description);
                    assert.equal(folder.creatorId, user.id);
                    assert.exists(folder, 'id');
                    assert.exists(folder, 'createdAt');
                    assert.exists(folder, 'updatedAt');
                    assert.exists(folder, 'deletedAt');
                });

                test('Fail - missing name', async function () {
                    const description = 'This folder is just for testing';
                    const folderRes = (await _ideationFolderCreate(agent, user.id, topic.id, ideation.id, null, description, 400)).body;
                    const expectedRes = {
                        status: { code: 40000 },
                        errors: { name: 'Folder.name cannot be null' }
                    };

                    assert.deepEqual(folderRes, expectedRes);
                });

                test('Fail - topic status not ideation', async function () {
                    await discussionCreate(agent, user.id, topic.id, 'TEST');
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.inProgress);
                    await _ideationFolderCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST folder', 'description', 401);
                });

                test('Fail - Unauthorized', async function () {
                    await _ideationFolderCreate(request.agent(app), user.id, topic.id, ideation.id, 'TEST folder', 'description', 401);
                });
            });

            suite('Read', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;
                let idea;
                let folder;
                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                const folderName = 'TEST folder';
                const description = 'This folder is just for testing';
                setup(async function () {
                    idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, folderName, description)).body.data;
                    folder.ideas = {
                        count: 1,
                        rows: [idea]
                    };
                    await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, idea);
                })

                test('Success', async function () {
                    const folderR = (await ideationFolderRead(agent, user.id, topic.id, ideation.id, folder.id)).body.data;

                    assert.deepEqual(folderR, folder);
                });

                test('Success - anonymous ideation', async function () {
                    const topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, null, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, folderName, description)).body.data;
                    folder.ideas = {
                        count: 1,
                        rows: [idea]
                    };
                    await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, idea);

                    const folderR = (await ideationFolderRead(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                    assert.deepEqual(folderR, folder);
                    folderR.ideas.rows.forEach(idea => {
                        assert.equal(idea.author, null);
                    });
                });

                test('Success - public topic unauth', async function () {
                    const folderR = (await ideationFolderRead(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const folderRUnauth = (await ideationFolderReadUnauth(request.agent(app), topic.id, ideation.id, folder.id)).body.data;
                    assert.deepEqual(folderR, folderRUnauth);
                });

                test('Success - public topic unauth - anonymous ideation', async function () {
                    const topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, null, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, idea);

                    const folderR = (await ideationFolderRead(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const folderRUnauth = (await ideationFolderReadUnauth(request.agent(app), topic.id, ideation.id, folder.id)).body.data;
                    assert.deepEqual(folderR, folderRUnauth);

                    folderRUnauth.ideas.rows.forEach(idea => {
                        assert.equal(idea.author, null);
                    });
                });

                test('Fail - Unauthorized', async function () {
                    await _ideationFolderRead(request.agent(app), user.id, topic.id, ideation.id, folder.id, 401);
                });
            });

            suite('Ideas', function () {

                suite('Add', function () {
                    const agent = request.agent(app);
                    const agent2 = request.agent(app);
                    const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                    const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                    const password = 'testPassword123';

                    let user;
                    let user2;
                    let topic;
                    let ideation;
                    let idea;
                    let idea2;
                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                        topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        await memberLib.topicMemberUsersCreate(topic.id, [{
                            userId: user2.id,
                            level: TopicMemberUser.LEVELS.edit
                        }]);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        idea2 = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, idea)).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 1, rows: [idea] });
                    });


                    test('Success - anonymous ideation', async function () {
                        const topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                        const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, null, true)).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, idea)).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 1, rows: [idea] });
                        folderR.rows.forEach(idea => {
                            assert.equal(idea.author, null);
                        });
                    });


                    test('Success - 2 ideas', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, [idea, idea2])).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 2, rows: [idea, idea2] });
                    });

                    test('Success - 2 ideas anonymous ideation', async function () {
                        const topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                        const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, null, true)).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        const idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        const idea2 = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST2', 'TEST2')).body.data;

                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, [idea, idea2])).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 2, rows: [idea, idea2] });
                        folderR.rows.forEach(idea => {
                            assert.equal(idea.author, null);
                        });
                    });
                });

                suite('Read', function () {
                    const agent = request.agent(app);
                    const agent2 = request.agent(app);
                    const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                    const email2 = 'test_topicr_' + new Date().getTime() + '@test.ee';
                    const password = 'testPassword123';

                    let user;
                    let user2;
                    let topic;
                    let ideation;
                    let idea;
                    let idea2;
                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                        topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        await memberLib.topicMemberUsersCreate(topic.id, [{
                            userId: user2.id,
                            level: TopicMemberUser.LEVELS.edit
                        }]);
                    });

                    setup(async function () {
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        idea2 = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST2', 'TEST2')).body.data;
                    })

                    test('Success', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, idea)).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 1, rows: [idea] });
                    });

                    test('Success - 2 ideas', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, [idea, idea2])).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 2, rows: [idea, idea2] });
                    });

                    test('Success - public topic unauth', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, [idea, idea2]);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);

                        const folderRUnauth = (await ideationFolderReadIdeasUnauth(request.agent(app), topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, folderRUnauth);
                    });

                    test('Success - limit 1 offset 1', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, [idea, idea2]);
                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 2, rows: [idea, idea2] });
                        const folderR2 = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id, 1, 1)).body.data;

                        assert.deepEqual(folderR2, { count: 2, rows: [idea2] });
                    });

                    test('Fail - Unauthorized', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        await _ideationFolderReadIdeas(request.agent(app), user.id, topic.id, ideation.id, folder.id, null, null, 401);
                    });
                });

                suite('Remove', function () {
                    const agent = request.agent(app);
                    const agent2 = request.agent(app);
                    const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                    const email2 = 'test_topicr_' + new Date().getTime() + '@test.ee';
                    const password = 'testPassword123';

                    let user;
                    let user2;
                    let topic;
                    let ideation;
                    let idea;
                    let idea2;
                    suiteSetup(async function () {
                        user = await userLib.createUserAndLogin(agent, email, password, null);
                        user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                        topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                        ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                        await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                        await memberLib.topicMemberUsersCreate(topic.id, [{
                            userId: user2.id,
                            level: TopicMemberUser.LEVELS.edit
                        }]);
                        idea = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                        idea2 = (await ideationIdeaCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    });

                    test('Success', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, idea)).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 1, rows: [idea] });
                        const removeIdeaRes = (await ideationFolderIdeaRemove(agent, user.id, topic.id, ideation.id, folder.id, idea.id)).body;
                        const expectedRes2 = { status: { code: 20000 } };
                        assert.deepEqual(removeIdeaRes, expectedRes2);

                        const folderR2 = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR2, { count: 0, rows: [] });
                    });

                    test('Success - 2 ideas', async function () {
                        const statement = 'TEST folder';
                        const description = 'This folder is just for testing';
                        const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, statement, description)).body.data;
                        const addIdeaRes = (await ideationFolderIdeaCreate(agent, user.id, topic.id, ideation.id, folder.id, [idea, idea2])).body;
                        const expectedRes = { status: { code: 20100 } };
                        assert.deepEqual(addIdeaRes, expectedRes);

                        const folderR = (await ideationFolderReadIdeas(agent, user.id, topic.id, ideation.id, folder.id)).body.data;
                        assert.deepEqual(folderR, { count: 2, rows: [idea, idea2] });
                    });
                });
            });

            suite('Update', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const name = 'TEST folder';
                    const description = 'This folder is just for testing';

                    const updatedName = 'Test folder Update';
                    const updatedDescription = 'Updated description';
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, name, description)).body.data;

                    assert.equal(folder.name, name);
                    assert.equal(folder.description, description);
                    assert.equal(folder.creatorId, user.id);
                    assert.exists(folder, 'id');
                    assert.exists(folder, 'createdAt');
                    assert.exists(folder, 'updatedAt');
                    assert.exists(folder, 'deletedAt');
                    const folderUpdate = (await ideationFolderUpdate(agent, user.id, topic.id, ideation.id, folder.id, updatedName, updatedDescription)).body.data;

                    assert.equal(folderUpdate.name, updatedName);
                    assert.equal(folderUpdate.description, updatedDescription);
                    assert.equal(folderUpdate.creatorId, folder.creatorId);
                    assert.equal(folderUpdate.id, folder.id);
                    assert.exists(folderUpdate.createdAt, folder.createdAt);
                    assert.notEqual(folderUpdate.updatedAt, folder.updatedAt);
                    assert.equal(folderUpdate.deletedAt, folder.deletedAt);
                });

                test('Fail - Unauthorized', async function () {
                    const idea = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationFolderUpdate(request.agent(app), user.id, topic.id, ideation.id, idea.id, 'TEST idea', 'description', 401);
                });
            });

            suite('Delete', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const deleteRes = (await ideationFolderDelete(agent, user.id, topic.id, ideation.id, folder.id)).body;
                    const expectedBody = {
                        status: {
                            code: 20000
                        }
                    };
                    assert.deepEqual(deleteRes, expectedBody);
                });

                test('Fail - not author of the folder', async function () {
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationFolderDelete(agent2, user2.id, topic.id, ideation.id, folder.id, 403);
                });

                test('Fail - Unauthorized', async function () {
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await _ideationFolderDelete(request.agent(app), user.id, topic.id, ideation.id, folder.id, 401);
                });
            });

            suite('List', function () {
                const agent = request.agent(app);
                const agent2 = request.agent(app);
                const email = 'test_topicr_' + new Date().getTime() + '@test.ee';
                const email2 = 'test_topicr_' + new Date().getTime() + 2 + '@test.ee';
                const password = 'testPassword123';

                let user;
                let user2;
                let topic;
                let ideation;

                suiteSetup(async function () {
                    user = await userLib.createUserAndLogin(agent, email, password, null);
                    user2 = await userLib.createUserAndLogin(agent2, email2, password, null);
                });

                setup(async function () {
                    topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    await memberLib.topicMemberUsersCreate(topic.id, [{
                        userId: user2.id,
                        level: TopicMemberUser.LEVELS.edit
                    }]);
                });

                test('Success', async function () {
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const folders = (await ideationFolderList(agent, user.id, topic.id, ideation.id)).body.data;
                    const expectedFolder = Object.assign({
                        creator: {
                            id: user.id,
                            imageUrl: user.imageUrl,
                            name: user.name
                        },
                        ideas: { count: 0 }
                    }, folder);
                    delete expectedFolder.creatorId;
                    delete expectedFolder.deletedAt;
                    assert.deepEqual(folders, { count: 1, rows: [expectedFolder] });
                });

                test('Success - anonymous ideation', async function () {
                    const topic = (await topicLib.topicCreate(agent, user.id, 'TEST', null, null, Topic.VISIBILITY.private)).body.data;
                    const ideation = (await ideationCreate(agent, user.id, topic.id, 'TEST ideation', null, null, true)).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, Topic.STATUSES.ideation);
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    const folders = (await ideationFolderList(agent, user.id, topic.id, ideation.id)).body.data;
                    const expectedFolder = Object.assign({
                        creator: {
                            id: user.id,
                            imageUrl: user.imageUrl,
                            name: user.name
                        },
                        ideas: { count: 0 }
                    }, folder);
                    delete expectedFolder.creatorId;
                    delete expectedFolder.deletedAt;
                    assert.deepEqual(folders, { count: 1, rows: [expectedFolder] });
                });

                test('Success - unauth', async function () {
                    const folder = (await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST')).body.data;
                    await topicLib.topicUpdate(agent, user.id, topic.id, null, Topic.VISIBILITY.public);
                    const folders = (await ideationFolderListUnauth(request.agent(app), topic.id, ideation.id)).body.data;
                    const expectedFolder = Object.assign({
                        creator: {
                            id: user.id,
                            imageUrl: user.imageUrl,
                            name: user.name
                        },
                        ideas: { count: 0 }
                    }, folder);
                    delete expectedFolder.creatorId;
                    delete expectedFolder.deletedAt;
                    assert.deepEqual(folders, { count: 1, rows: [expectedFolder] });
                });

                test('Fail - Unauthorized', async function () {
                    await ideationFolderCreate(agent, user.id, topic.id, ideation.id, 'TEST', 'TEST');
                    await _ideationFolderList(request.agent(app), user.id, topic.id, ideation.id, 401);
                });
            });
        });
    });
});