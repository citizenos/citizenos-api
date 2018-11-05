'use strict';

var request = require('supertest');
var app = require('../../app');
var models = app.get('models');

var auth = require('./auth');
var shared = require('../utils/shared');
var userLib = require('./lib/user')(app);

var urlLib = app.get('urlLib');

var User = models.User;

suite('Invite', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .finally(done);
    });

    suiteTeardown(function (done) {
        shared
            .closeDb()
            .finally(done);
    });

    suite('View', function () {

        test('Success - non existing user', function (done) {
            var agent = request.agent(app);

            var email = 'nonexistent1234@foobar.com';
            var path = '/api/invite/view?email=:email'
                .replace(':email', 'nonexistent1234@foobar.com');

            var expectedLocation = urlLib.getFe('/account/signup', null, {email: email});

            agent
                .get(path)
                .expect(302)
                .expect('Location', expectedLocation)
                .end(done);
        });

        test('Success - existing User with incomplete signup (null password, created on invite) - redirect to signup', function (done) {
            var agent = request.agent(app);

            var email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            var path = '/api/invite/view?email=:email'
                .replace(':email', email);

            // Creates a new User without password (same thing happens on adding Members with e-mail)
            // TODO: should create User service so that the logic would be shared in code.
            User
                .create({
                    email: email,
                    password: null,
                    name: 'Testboy666',
                    source: User.SOURCES.citizenos
                })
                .then(function () {
                    var expectedLocation = urlLib.getFe('/account/signup', null, {email: email});

                    agent
                        .get(path)
                        .expect(302)
                        .expect('Location', expectedLocation)
                        .end(done);
                })
                .catch(done);
        });

        test('Success - existing User, logged in, topicId - redirect to Topic', function (done) {
            var agent = request.agent(app);

            var email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            var topicId = 't1241234asdasdasdas';

            var path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);

            userLib
                .createUserAndLogin(agent, email, null, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    var expectedLocation = urlLib.getFe('/topics/:topicId', {topicId: topicId});

                    agent
                        .get(path)
                        .expect(302)
                        .expect('Location', expectedLocation)
                        .end(done);
                });
        });

        test('Success - existing User, logged in, groupId - redirect to Group', function (done) {
            var agent = request.agent(app);

            var email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            var groupId = 'g1241234asdasdasdas';

            var path = '/api/invite/view?email=:email&groupId=:groupId'
                .replace(':email', email)
                .replace(':groupId', groupId);

            userLib
                .createUserAndLogin(agent, email, null, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    var expectedLocation = urlLib.getFe('/my/groups');

                    agent
                        .get(path)
                        .expect(302)
                        .expect('Location', expectedLocation)
                        .end(done);
                });
        });

        test('Success - existing User with incomplete verification - redirect to login', function (done) {
            var agent = request.agent(app);

            var email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            var password = 'TestA123';

            var path = '/api/invite/view?email=:email'
                .replace(':email', email);

            auth
                .signup(agent, email, password, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    var expectedLocation = urlLib.getFe('/account/login', null, {
                        email: email,
                        redirectSuccess: ''
                    });

                    agent
                        .get(path)
                        .expect(302)
                        .expect('Location', expectedLocation)
                        .end(done);
                });
        });

        test('Success - existing User, not logged in - redirect to login with continue url', function (done) {
            var agent = request.agent(app);

            var email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            var topicId = 't12321321321312';

            var path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);

            userLib
                .createUser(agent, email, null, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    var expectedLocation = urlLib.getFe('/account/login', null, {
                        email: email,
                        redirectSuccess: urlLib.getFe('/topics/:topicId', {topicId: topicId})
                    });

                    agent
                        .get(path)
                        .expect(302)
                        .expect('Location', expectedLocation)
                        .end(done);
                });
        });

        test('Success - Invited non-existing User, a different User currently logged in - logout current User, redirect to signup', function (done) {
            var agent = request.agent(app);

            var email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            var topicId = 't12321321321312';

            var path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);

            userLib
                .createUserAndLogin(agent, null, null, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    var expectedLocation = urlLib.getFe('/account/signup', null, {email: email});

                    agent
                        .get(path)
                        .expect(302)
                        .expect('Location', expectedLocation)
                        .end(function () {
                            auth._status(agent, 401, done); // Verify that the existing user was logged out.
                        });
                });
        });

        test('Success - Invited existing User, a different User currently logged in - logout current User, redirect to signup', function (done) {
            var agent = request.agent(app);

            var email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@foo.com';
            var topicId = 't12321321321312';

            var path = '/api/invite/view?email=:email&topicId=:topicId'
                .replace(':email', email)
                .replace(':topicId', topicId);

            userLib
                .createUser(request.agent(app), email, null, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    userLib
                        .createUserAndLogin(agent, null, null, null, function (err) {
                            if (err) {
                                return done(err);
                            }

                            var expectedLocation = '/account/login?email=:email'.replace(':email', email);

                            agent
                                .get(path)
                                .expect(302)
                                .expect('Location', expectedLocation)
                                .end(function () {
                                    auth._status(agent, 401, done); // Verify that the existing user was logged out.
                                });
                        });
                });
        });

    });

});
