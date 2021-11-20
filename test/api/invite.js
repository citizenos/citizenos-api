'use strict';

const request = require('supertest');
const app = require('../../app');
const models = app.get('models');

const auth = require('./auth');
const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);

const urlLib = app.get('urlLib');

const User = models.User;

suite('Invite', function () {

    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    suite('View', function () {

        test('Success - non existing user', async function () {
            const agent = request.agent(app);

            const email = 'nonexistent1234@foobar.com';
            const path = '/api/invite/view?email=:email'
                .replace(':email', 'nonexistent1234@foobar.com');

                const expectedLocation = urlLib.getFe('/account/login', null, {email: email});

            return agent
                .get(path)
                .expect(302)
                .expect('Location', expectedLocation);
        });

        test('Success - existing User with incomplete signup (null password, created on invite) - redirect to login', async function () {
            const agent = request.agent(app);

            const email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            const path = '/api/invite/view?email=:email'
                .replace(':email', email);

            // Creates a new User without password (same thing happens on adding Members with e-mail)
            // TODO: should create User service so that the logic would be shared in code.
            return User
                .create({
                    email: email,
                    password: null,
                    name: 'Testboy666',
                    source: User.SOURCES.citizenos
                })
                .then(function () {
                    const expectedLocation = urlLib.getFe('/account/login', null, {email: email});

                    return agent
                        .get(path)
                        .expect(302)
                        .expect('Location', expectedLocation);
                });
        });

        test('Success - existing User, logged in, topicId - redirect to Topic', async function () {
            const agent = request.agent(app);

            const email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            const topicId = 't1241234asdasdasdas';

            const path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);

            await userLib.createUserAndLogin(agent, email, null, null);
            const expectedLocation = urlLib.getFe('/topics/:topicId', {topicId: topicId});

            return agent
                .get(path)
                .expect(302)
                .expect('Location', expectedLocation);
        });

        test('Success - existing User, logged in, groupId - redirect to Group', async function () {
            const agent = request.agent(app);

            const email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            const groupId = 'g1241234asdasdasdas';

            const path = '/api/invite/view?email=:email&groupId=:groupId'
                .replace(':email', email)
                .replace(':groupId', groupId);

            await userLib.createUserAndLogin(agent, email, null, null);
            const expectedLocation = urlLib.getFe('/my/groups/:groupId', {groupId: groupId});

            return agent
                .get(path)
                .expect(302)
                .expect('Location', expectedLocation);
        });

        test('Success - existing User with incomplete verification - redirect to login', async function () {
            const agent = request.agent(app);

            const email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            const password = 'TestA123';

            const path = '/api/invite/view?email=:email'
                .replace(':email', email);

            await auth.signup(agent, email, password, null);

            const expectedLocation = urlLib.getFe('/account/login', null, {
                email: email,
                redirectSuccess: ''
            });

            return agent
                    .get(path)
                    .expect(302)
                    .expect('Location', expectedLocation);
        });

        test('Success - existing User, not logged in - redirect to login with continue url', async function () {
            const agent = request.agent(app);

            const email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            const topicId = 't12321321321312';

            const path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);

            await userLib.createUser(agent, email, null, null);

            const expectedLocation = urlLib.getFe('/account/login', null, {
                email: email,
                redirectSuccess: urlLib.getFe('/topics/:topicId', {topicId: topicId})
            });

            return agent
                .get(path)
                .expect(302)
                .expect('Location', expectedLocation);
        });

        test('Success - Invited non-existing User, a different User currently logged in - logout current User, redirect to login', async function () {
            const agent = request.agent(app);

            const email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            const topicId = 't12321321321312';

            const path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);

            const redirectUri = urlLib.getFe('/topics/:topicId', {topicId: topicId});
            await userLib.createUserAndLogin(agent, null, null, null);
            const expectedLocation = urlLib.getFe('/account/login', null, {email: email, redirectSuccess: redirectUri});

            return agent
                .get(path)
                .expect(302)
                .expect('Location', expectedLocation)
                .then(async function () {
                    await auth._status(agent, 401); // Verify that the existing user was logged out.
                });
        });

        test('Success - Invited existing User, a different User currently logged in - logout current User, redirect to topic view', async function () {
            const agent = request.agent(app);

            const email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            const topicId = 't12321321321312';

            await userLib.createUser(request.agent(app), email, null, null);
            await userLib.createUserAndLogin(agent, null, null, null);
            const path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);
            const expectedLocation = urlLib.getFe('/account/login', null, {email: email, redirectSuccess: urlLib.getFe('/topics/:topicId', {topicId})});

            return agent
                .get(path)
                .expect(302)
                .expect('Location', expectedLocation)
                .then(async function () {
                    await auth._status(agent, 401); // Verify that the existing user was logged out.
                });
        });
    });

});
