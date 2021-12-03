'use strict';

const _uploadFile = async function (agent, userId, file, folderName, expectedHttpCode) {
    const path = '/api/users/:userId/upload'.replace(':userId', userId);

    const request = agent
        .post(path);

    if (folderName) {
        request.field('folder', folderName);
    }

    return request
        .attach('file', file)
        .set('Content-Type', 'multipart/form-data')
        .expect(expectedHttpCode);
};

const uploadFile = async function (agent, userId, file, folderName) {
    return _uploadFile(agent, userId, file, folderName, 201);
};

module.exports.uploadFile = uploadFile;

const chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
const assert = chai.assert;
const request = require('supertest');
const app = require('../../app');
const config = app.get('config');
const https = require('https');
const fs = require('fs-extra');
const path = require('path');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);


// API - /api/users*
suite('Users', function () {

});
