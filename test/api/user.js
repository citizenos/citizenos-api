'use strict';

var _userUpdate = function (agent, userId, name, email, password, language, expectedHttpCode, callback) {
    var path = '/api/users/:userId'
        .replace(':userId', userId);

    var data = {};

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

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send(data)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var userUpdate = function (agent, userId, name, email, password, language, callback) {
    _userUpdate(agent, userId, name, email, password, language, 200, callback);
};

var _userConsentCreate = function (agent, userId, partnerId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/consents';

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({partnerId: partnerId})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var userConsentCreate = function (agent, userId, partnerId, callback) {
    _userConsentCreate(agent, userId, partnerId, 200, callback);
};

var _userConsentsList = function (agent, userId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/consents'
        .replace(':userId', userId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var userConsentsList = function (agent, userId, callback) {
    _userConsentsList(agent, userId, 200, callback);
};

var _userConsentDelete = function (agent, userId, partnerId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/consents/:partnerId'
        .replace(':userId', userId)
        .replace(':partnerId', partnerId);

    agent
        .delete(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);

};

var userConsentDelete = function (agent, userId, partnerId, callback) {
    _userConsentDelete(agent, userId, partnerId, 200, callback);
};

var request = require('supertest');
var app = require('../../app');
var models = app.get('models');
var uuid = require('node-uuid');

var assert = require('chai').assert;
var cryptoLib = app.get('cryptoLib');

var shared = require('../utils/shared');
var userLib = require('./lib/user')(app);
var auth = require('./auth');

var User = models.User;
var Partner = models.Partner;

suite('User', function () {

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

    suite('Update', function () {
        var agent = request.agent(app);

        var email;
        var password;

        var user;

        setup(function (done) {
            email = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            password = 'Test123';

            userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                if (err) {
                    return done(err);
                }
                user = res;
                done();
            });
        });

        test('Success - change name & password', function (done) {
            var nameNew = 'New Name';
            var passwordNew = 'aaAA123';

            userUpdate(agent, user.id, nameNew, null, passwordNew, null, function () {
                auth.logout(agent, function () {
                    auth.login(agent, email, passwordNew, function (err) {
                        if (err) {
                            return done(err);
                        }

                        User
                            .findOne({
                                where: {id: user.id}
                            })
                            .then(function (u) {
                                assert.property(u, 'id');
                                assert.equal(u.email, email);
                                assert.equal(u.password, cryptoLib.getHash(passwordNew, 'sha256'));
                                assert.equal(u.name, nameNew);

                                done();
                            })
                            .catch(done);
                    });
                });
            });
        });

        test('Success - change name & email & password', function (done) {
            var nameNew = 'New Name';
            var emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            var passwordNew = 'aaAA123';

            userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null, function () {
                auth.logout(agent, function () {
                    User
                        .findOne({
                            where: {id: user.id}
                        })
                        .then(function (u) {
                            assert.equal(u.emailIsVerified, false);
                            User
                                .update(
                                    {emailIsVerified: true},
                                    {
                                        where: {
                                            id: user.id
                                        },
                                        limit: 1
                                    }
                                )
                                .then(function () {
                                    auth.login(agent, emailNew, passwordNew, function (err) {
                                        if (err) {
                                            return done(err);
                                        }
                
                                        User
                                            .findOne({
                                                where: {id: user.id}
                                            })
                                            .then(function (u) {
                                                assert.property(u, 'id');
                                                assert.equal(u.email, emailNew);
                                                assert.equal(u.password, cryptoLib.getHash(passwordNew, 'sha256'));
                                                assert.equal(u.name, nameNew);
                
                                                done();
                                            })
                                            .catch(done);
                                    });
                                });                    
                        });
                });
            });
        });

        test('Success - "null" password is ignored', function (done) {
            var nameNew = 'New Name';
            var emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            var passwordNew = null;

            userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null, function (err) {
                if (err) {
                    return done(err);
                }

                User
                    .findOne({
                        where: {id: user.id}
                    })
                    .then(function (u) {
                        assert.equal(u.password, cryptoLib.getHash(password, 'sha256'));

                        done();
                    })
                    .catch(done);
            });
        });

        test('Success - name can be "null", the name will be generated from e-mail', function (done) {
            var nameNew = null;
            var emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            var passwordNew = 'aaAA123';

            userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null, function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });

        test('Success - update language', function (done) {
            var newLanguage = 'ET';

            userUpdate(agent, user.id, null, null, null, newLanguage, function () {
                User
                    .findOne({
                        where: {id: user.id}
                    })
                    .then(function (u) {
                        assert.equal(u.language, newLanguage.toLowerCase());
                        done();
                    })
                    .catch(done);
            });
        });

        test('Fail - try to update forbidden field "emailVerificationCode" - fail silently', function (done) {
            var newEmailVerificationCode = uuid.v4();

            var path = '/api/users/:userId'
                .replace(':userId', user.id);

            var data = {
                emailVerificationCode: newEmailVerificationCode
            };

            agent
                .put(path)
                .set('Content-Type', 'application/json')
                .send(data)
                .expect(200)
                .expect('Content-Type', /json/)
                .end(function () {
                    User
                        .findOne({
                            where: {id: user.id}
                        })
                        .then(function (u) {
                            assert.notEqual(u.emailVerificationCode, newEmailVerificationCode);

                            done();
                        })
                        .catch(done);
                });

        });

        test('Fail - invalid password', function (done) {
            var nameNew = 'New Name';
            var emailNew = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1@test.com';
            var passwordNew = 'aaAA';

            _userUpdate(agent, user.id, nameNew, emailNew, passwordNew, null, 400, function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        });

    });

    suite('Consents', function () {
        var agent;
        var user;

        var TEST_PARTNER = {
            id: 'e5fcb764-a635-4858-a496-e43079c7326b',
            website: 'https://citizenospartner.ee',
            redirectUriRegexp: '^https:\\/\\/([^\\.]*\\.)?citizenospartner.ee(:[0-9]{2,5})?\\/.*'
        };

        suiteSetup(function (done) {
            agent = request.agent(app);

            userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                if (err) {
                    return done(err);
                }

                user = res;

                Partner
                    .upsert(TEST_PARTNER)
                    .then(function () {
                        done();
                    })
                    .catch(done);
            });
        });

        suite('Create', function () {
            test('Success', function (done) {
                userConsentCreate(agent, user.id, TEST_PARTNER.id, function (err) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
            });
        });

        suite('List', function () {
            test('Success', function (done) {
                userConsentsList(agent, user.id, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.deepEqual(res.body.status, {code: 20000});

                    assert.equal(res.body.data.count, 1);

                    var consents = res.body.data.rows;
                    assert.equal(consents.length, 1);

                    var consent = consents[0];
                    assert.equal(consent.id, TEST_PARTNER.id);
                    assert.equal(consent.website, TEST_PARTNER.website);

                    assert.property(consent, 'createdAt');
                    assert.property(consent, 'updatedAt');

                    done();
                });
            });
        });

        suite('Delete', function () {

            test('Success', function (done) {
                userConsentDelete(agent, user.id, TEST_PARTNER.id, function (err) {
                    if (err) {
                        return done(err);
                    }
                    userConsentsList(agent, user.id, function (err, res) {
                        if (err) return done(err);
                        assert.equal(res.body.data.count, 0);
                        done();
                    });
                });
            });

        });

    });
});
