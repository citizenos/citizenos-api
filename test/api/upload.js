'use strict';

const _uploadFile = async function (agent, userId, file, expectedHttpCode) {
    const path = '/api/users/:userId/upload'.replace(':userId', userId);

    const request = agent
        .post(path);

    return request
        .attach('file', file)
        .set('Content-Type', 'multipart/form-data')
        .expect(expectedHttpCode);
};

const uploadFile = async function (agent, userId, file) {
    return _uploadFile(agent, userId, file, 201);
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
    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    // API - /api/users/:userId/activities*
    suite('Upload', function () {

        suite('File', function () {
            const agent = request.agent(app);

            let user;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, null, null, null);
            });

            test('Success', async function () {
                const file = path.join(__dirname, '/uploads/test.txt');
                const fileUrl = (await uploadFile(agent, user.id, file)).body.data.link;
                if (config.storage?.type.toLowerCase() === 'local') {
                    assert.include(fileUrl, config.url.api);
                } else if (config.storage?.type.toLowerCase() === 's3') {
                    assert.include(fileUrl, `${config.storage.bucket}.s3.amazonaws.com`);
                }
                const file2 = fs.createWriteStream(path.join(__dirname, '/uploads/return.txt'));

                return https.get(fileUrl, function (response) {
                    const stream = response.pipe(file2);

                    stream.on('finish', async function () {
                        const data = await fs.readFileSync(path.join(__dirname, '/uploads/return.txt'), 'utf8');
                        assert.equal('Test file for upload test.', data);
                        fs.remove(path.join(__dirname, '/uploads/return.txt'));
                        fs.remove(path.join(__dirname.replace('/test/api', '/public/uploads/'), 'test/'));
                    });
                });
            });

            test('Fail - invalid format', async function () {
                const file = path.join(__dirname, '/uploads/test');
                await _uploadFile(agent, user.id, file, 403);
            });

            test('Fail - invalid format .exe', async function () {
                const file = path.join(__dirname, '/uploads/test.exe');
                await _uploadFile(agent, user.id, file, 403);
            });
        });

    });
});
