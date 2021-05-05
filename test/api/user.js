'use strict';

const _userUpdate = async function (agent, userId, name, email, password, language, expectedHttpCode) {
    const path = '/api/users/:userId'
        .replace(':userId', userId);

    const data = {};

    if (name) {
        data.name = name;
    }

    if (email) {
        data.email = email;
    }

    if (password) {
        data.password = password;
    }

    if (language) {
        data.language = language;
    }

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const _userDeletePromised = async function (agent, userId, expectedHttpCode) {
    const path = '/api/users/:userId'
        .replace('userId', userId);

    return agent
        .del(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const userDeletePromised = async function (agent, userId) {
    return _userDeletePromised(agent, userId, 200);
};

const userUpdate = async function (agent, userId, name, email, password, language) {
    return _userUpdate(agent, userId, name, email, password, language, 200);
};

const _userConsentCreate = async function (agent, userId, partnerId, expectedHttpCode) {
    const path = '/api/users/:userId/consents'.replace(':userId', userId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({partnerId: partnerId})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const userConsentCreate = async function (agent, userId, partnerId) {
    return _userConsentCreate(agent, userId, partnerId, 200);
};

const _userConsentsList = async function (agent, userId, expectedHttpCode) {
    const path = '/api/users/:userId/consents'
        .replace(':userId', userId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const userConsentsList = async function (agent, userId) {
    return _userConsentsList(agent, userId, 200);
};

const _userConsentDelete = async function (agent, userId, partnerId, expectedHttpCode) {
    const path = '/api/users/:userId/consents/:partnerId'
        .replace(':userId', userId)
        .replace(':partnerId', partnerId);

    return agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);

};

const userConsentDelete = async function (agent, userId, partnerId) {
    return _userConsentDelete(agent, userId, partnerId, 200);
};

const _userConnectionsList = async function (agent, userId, expectedHttpCode) {
    const path = '/api/users/:userId/userconnections'
        .replace(':userId', userId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const userConnectionsList = async function (agent, userId) {
    return _userConnectionsList(agent, userId, 200);
};

exports.userDeletePromised = userDeletePromised;

const request = require('supertest');
const app = require('../../app');
const models = app.get('models');
const uuid = require('node-uuid');
const cosUtil = app.get('util');

const assert = require('chai').assert;
const cryptoLib = app.get('cryptoLib');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const auth = require('./auth');

const User = models.User;
const UserConnection = models.UserConnection;
const Partner = models.Partner;

suite('User', function () {

    suiteSetup(async function () {
        return shared.syncDb();
    });

    suite('Update', function () {
        const agent = request.agent(app);

        let email;
        let password;

        let user;

        setup(async function () {
            email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            password = 'Test123';

            user = await userLib.createUserAndLoginPromised(agent, email, password, null);
        });

        test('Success - change name & password', async function () {
            const nameNew = 'New Name';
            const passwordNew = 'aaAA123';

            await userUpdate(agent, user.id, nameNew, null, passwordNew, null);
            await auth.logoutPromised(agent);
            await auth.loginPromised(agent, email, passwordNew);
            const u = await User.findOne({
                where: {id: user.id}
            });

            assert.property(u, 'id');
            assert.equal(u.email, email);
            assert.equal(u.password, cryptoLib.getHash(passwordNew, 'sha256'));
            assert.equal(u.name, nameNew);
        });

        test('Success - change name & email & password', async function () {
            const nameNew = 'New Name';
            const emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            const passwordNew = 'aaAA123';

            await userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null);
            await auth.logoutPromised(agent);
            let u = await User.findOne({
                where: {id: user.id}
            });
            assert.equal(u.emailIsVerified, false);
            await User.update(
                {emailIsVerified: true},
                {
                    where: {
                        id: user.id
                    },
                    limit: 1
                }
            );

            await auth.loginPromised(agent, emailNew, passwordNew);

            u = await User.findOne({
                where: {id: user.id}
            });

            assert.property(u, 'id');
            assert.equal(u.email, emailNew);
            assert.equal(u.password, cryptoLib.getHash(passwordNew, 'sha256'));
            assert.equal(u.name, nameNew);
        });

        test('Success - "null" password is ignored', async function () {
            const nameNew = 'New Name';
            const emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            const passwordNew = null;

            await userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null);
            const u = await User.findOne({
                where: {id: user.id}
            });
            assert.equal(u.password, cryptoLib.getHash(password, 'sha256'));
        });

        test('Success - name can be "null", the name will be generated from e-mail', async function () {
            const nameNew = null;
            const emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            const passwordNew = 'aaAA123';

            return userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null);
        });

        test('Success - update language', async function () {
            const newLanguage = 'ET';

            await userUpdate(agent, user.id, null, null, null, newLanguage);
            const u = await User.findOne({
                where: {id: user.id}
            })
            assert.equal(u.language, newLanguage.toLowerCase());
        });

        test('Fail - try to update forbidden field "emailVerificationCode" - fail silently', async function () {
            const newEmailVerificationCode = uuid.v4();

            const path = '/api/users/:userId'
                .replace(':userId', user.id);

            const data = {
                emailVerificationCode: newEmailVerificationCode
            };

            await agent
                .put(path)
                .set('Content-Type', 'application/json')
                .send(data)
                .expect(200)
                .expect('Content-Type', /json/);
            const u = User.findOne({
                where: {id: user.id}
            });
            assert.notEqual(u.emailVerificationCode, newEmailVerificationCode);
        });

        test('Fail - invalid password', async function () {
            const nameNew = 'New Name';
            const emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            const passwordNew = 'aaAA';

            return _userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null, 400);
        });

    });

    suite('Consents', function () {
        suite('Create', function () {
            let agent;
            let user;

            const TEST_PARTNER = {
                id: 'e5fcb764-a635-4858-a496-e43079c7326b',
                website: 'https://citizenospartner.ee',
                redirectUriRegexp: '^https:\\/\\/([^\\.]*\\.)?citizenospartner.ee(:[0-9]{2,5})?\\/.*'
            };

            suiteSetup(async function () {
                agent = request.agent(app);

                user = await userLib.createUserAndLoginPromised(agent, null, null, null);
                return Partner.upsert(TEST_PARTNER)
            });
            test('Success', async function () {
                return userConsentCreate(agent, user.id, TEST_PARTNER.id);
            });
        });

        suite('List', function () {
            let agent;
            let user;

            const TEST_PARTNER = {
                id: 'e5fcb764-a635-4858-a496-e43079c7326b',
                website: 'https://citizenospartner.ee',
                redirectUriRegexp: '^https:\\/\\/([^\\.]*\\.)?citizenospartner.ee(:[0-9]{2,5})?\\/.*'
            };

            suiteSetup(async function () {
                agent = request.agent(app);

                user = await userLib.createUserAndLoginPromised(agent, null, null, null);
                return Partner.upsert(TEST_PARTNER)
            });

            test('Success', async function () {
                await userConsentCreate(agent, user.id, TEST_PARTNER.id);
                const resBody = (await userConsentsList(agent, user.id)).body;
                assert.deepEqual(resBody.status, {code: 20000});

                assert.equal(resBody.data.count, 1);

                const consents = resBody.data.rows;
                assert.equal(consents.length, 1);

                const consent = consents[0];
                assert.equal(consent.id, TEST_PARTNER.id);
                assert.equal(consent.website, TEST_PARTNER.website);

                assert.property(consent, 'createdAt');
                assert.property(consent, 'updatedAt');
            });
        });

        suite('Delete', function () {
            let agent;
            let user;

            const TEST_PARTNER = {
                id: 'e5fcb764-a635-4858-a496-e43079c7326b',
                website: 'https://citizenospartner.ee',
                redirectUriRegexp: '^https:\\/\\/([^\\.]*\\.)?citizenospartner.ee(:[0-9]{2,5})?\\/.*'
            };

            suiteSetup(async function () {
                agent = request.agent(app);

                user = await userLib.createUserAndLoginPromised(agent, null, null, null);
                return Partner.upsert(TEST_PARTNER)
            });

            test('Success', async function () {
                await userConsentCreate(agent, user.id, TEST_PARTNER.id);
                await userConsentDelete(agent, user.id, TEST_PARTNER.id);
                const count = (await userConsentsList(agent, user.id)).body.data.count;
                assert.equal(count, 0);
            });

        });

    });

    suite('Delete', function () {
        const agent = request.agent(app);
        const agent2 = request.agent(app);
        let email, email2, password, user, user2;

        setup(async function () {
            email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            email2 = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A2@test.com';
            password = 'Test123';
            user = await userLib.createUserAndLoginPromised(agent, email, password, null);
            user2 = await userLib.createUserPromised(agent2, email2, password, null);
        });

        test('Success', async function () {
            return userDeletePromised(agent, user.id);
        });

        test('Fail - try deleting other user', async function () {
            return _userDeletePromised(agent2, user.id, 401);
        });

        teardown(async function () {
            return User
                .destroy({
                    where: {
                        id: [user.id, user2.id]
                    }
                });
        });
    });

    suite('UserConnections', function () {
        const agent = request.agent(app);

        let user;

        setup(async function () {
            user = await userLib.createUserPromised(agent); // Creates connection with e-mail
        });

        test('Success - 20000 - 1 connection - emails only', async function () {
            const res = await userConnectionsList(agent, user.email);

            const bodyExpected = {
                status: {
                    code: 20000
                },
                data: {
                    count: 1,
                    rows: [
                        {
                            connectionId: UserConnection.CONNECTION_IDS.citizenos
                        }
                    ]
                }
            };

            assert.deepEqual(res.body, bodyExpected);
        });

        test('Success - 2000 - 4 connections - citizenos, google, esteid, smartid', async function () {
            // UserConnection "citizenos" is created on signup
            await UserConnection.create({
                userId: user.id,
                connectionId: UserConnection.CONNECTION_IDS.google,
                connectionUserId: 'test_generated_google1234' + cosUtil.randomString()
            });

            await UserConnection.create({
                userId: user.id,
                connectionId: UserConnection.CONNECTION_IDS.esteid,
                connectionUserId: 'test_generated_esteid_' + cosUtil.randomString()
            });

            await UserConnection.create({
                userId: user.id,
                connectionId: UserConnection.CONNECTION_IDS.smartid,
                connectionUserId: 'test_generated_smartId_`' + cosUtil.randomString()
            });

            const res = await userConnectionsList(agent, user.email);

            const bodyExpected = {
                status: {
                    code: 20000
                },
                data: {
                    count: 4,
                    rows: [
                        {
                            connectionId: UserConnection.CONNECTION_IDS.citizenos
                        },
                        {
                            connectionId: UserConnection.CONNECTION_IDS.esteid
                        },
                        {
                            connectionId: UserConnection.CONNECTION_IDS.google
                        },
                        {
                            connectionId: UserConnection.CONNECTION_IDS.smartid
                        }
                    ]
                }
            };

            assert.deepEqual(res.body, bodyExpected);
        });

        test('Fail - 40400 - not found by valid UUID', async function () {
            const res = await _userConnectionsList(agent, uuid.v4(), 404);

            const bodyExpected = {
                status: {
                    code: 40400,
                    message: 'Not Found'
                }
            };

            assert.deepEqual(res.body, bodyExpected);
        });

        test('Fail - 40400 - not found by valid e-mail', async function () {
            const res = await _userConnectionsList(agent, 'citizenos_test_get_user_connections_404@test.com', 404);

            const bodyExpected = {
                status: {
                    code: 40400,
                    message: 'Not Found'
                }
            };

            assert.deepEqual(res.body, bodyExpected);
        });

        test('Fail - 40001 - invalid userId', async function () {
            const res = await _userConnectionsList(agent, '123', 400);

            const bodyExpected = {
                status: {
                    code: 40001,
                    message: 'Invalid userId'
                }
            };

            assert.deepEqual(res.body, bodyExpected);
        });

    });
});
