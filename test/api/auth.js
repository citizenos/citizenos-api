'use strict';

/**
 * Log in - call '/api/auth/login' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} email E-mail
 * @param {string} password Password
 * @param {string} expectedHttpCode Expected HTTP code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _login = function (agent, email, password, expectedHttpCode, callback) {
    var path = '/api/auth/login';

    var a = agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({email: email, password: password})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);

    if (expectedHttpCode === 200) {
        a.expect('set-cookie', /.*\.sid=.*; Path=\/api; Expires=.*; HttpOnly/);
    }

    a.end(callback);
};

var login = function (agent, email, password, callback) {
    _login(agent, email, password, 200, callback);
};

/**
 * Initialize Mobiil-ID login - call '/api/auth/mobile/init' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} pid Personal identification number
 * @param {string} phoneNumber Phone number
 * @param {number} expectedHttpCode Expected HTTP response code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _loginMobileInit = function (agent, pid, phoneNumber, expectedHttpCode, callback) {
    var path = '/api/auth/mobile/init';
    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({pid: pid, phoneNumber: phoneNumber})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var loginMobileInit = function (agent, pid, phoneNumber, callback) {
    _loginMobileInit(agent, pid, phoneNumber, 200, callback);
};

/**
 * Initialize Smart-ID login - call '/api/auth/smartid/init' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} pid Personal identification number
 * @param {number} expectedHttpCode Expected HTTP response code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _loginSmartIdInit = function (agent, pid, expectedHttpCode, callback) {
    var path = '/api/auth/smartid/init';
    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({pid: pid})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var loginSmartIdInit = function (agent, pid, callback) {
    _loginSmartIdInit(agent, pid, 200, callback);
};

/**
 * Check mobile authentication status - call '/api/auth/mobile/status'
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} token JWT token issued when login was initiated
 * @param {number} expectedHttpCode Expected HTTP response code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _loginMobileStatus = function (agent, token, expectedHttpCode, callback) {
    var path = '/api/auth/mobile/status';
    agent
        .get(path)
        .query({
            token: token
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var loginMobileStatus = function (agent, token, callback) {
    _loginMobileStatus(agent, token, 200, callback);
};

/**
 * Check smart-ID authentication status - call '/api/auth/smartid/status'
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} token JWT token that was issued when flow was initiated
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _loginSmartIdStatus = function (agent, token, callback) {
    var path = '/api/auth/smartid/status';
    agent
        .get(path)
        .query({
            token: token
        })
        .expect('Content-Type', /json/)
        .end(callback);
};

var loginSmartIdStatus = function (agent, token, callback) {
    _loginSmartIdStatus(agent, token, callback);
};

/**
 * Log out - call '/api/auth/logout' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {function} callback (err, res)
 *
 * @return {void}
 */
var logout = function (agent, callback) {
    var path = '/api/auth/logout';

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect('set-cookie', /express_sid=;/)// FIXME: Hate this - https://trello.com/c/CkkFUz5D/235-ep-api-authorization-the-way-ep-session-is-invalidated-on-logout
        .end(callback);
};

/**
 * Sign up - call '/api/auth/signup' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} email E-mail
 * @param {string} password Password
 * @param {string} language Users preferred language ISO 2 char language code
 * @param {number} expectedHttpCode Expected HTTP response code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _signup = function (agent, email, password, language, expectedHttpCode, callback) {
    var path = '/api/auth/signup';

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({email: email, password: password, language: language})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 * Sign up - call '/api/auth/signup' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} email E-mail
 * @param {string} password Password
 * @param {string} language Users preferred language ISO 2 char language code
 * @param {function} callback (err, res)
 *
 * @return {void}
 */
var signup = function (agent, email, password, language, callback) {
    _signup(agent, email, password, language, 200, callback);
};

/**
 * Set password - call '/api/auth/password' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} currentPassword Current password
 * @param {string} newPassword New password
 * @param {number} expectedHttpCode Expected HTTP response code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _passwordSet = function (agent, currentPassword, newPassword, expectedHttpCode, callback) {
    var path = '/api/auth/password';

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({currentPassword: currentPassword, newPassword: newPassword})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 * Set password - call '/api/auth/password' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} currentPassword Current password
 * @param {string} newPassword New password
 * @param {function} callback (err, res)
 *
 * @return {void}
 */
var passwordSet = function (agent, currentPassword, newPassword, callback) {
    _passwordSet(agent, currentPassword, newPassword, 200, callback);
};

/**
 * Send user password reset email with reset code - call '/api/auth/password/reset' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} email E-mail of the user who's password is to be reset
 * @param {number} expectedHttpCode Expected HTTP response code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _passwordResetSend = function (agent, email, expectedHttpCode, callback) {
    var path = '/api/auth/password/reset/send';

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({email: email})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 * Send user password reset email with reset code - call '/api/auth/password/reset' API endpoint
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} email E-mail of the user who's password is to be reset
 * @param {function} callback (err, res)
 *
 * @return {void}
 */
var passwordResetSend = function (agent, email, callback) {
    _passwordResetSend(agent, email, 200, callback);
};

var _passwordResetComplete = function (agent, email, password, passwordResetCode, expectedHttpCode, callback) {
    var path = '/api/auth/password/reset';

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({email: email, password: password, passwordResetCode: passwordResetCode})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var passwordResetComplete = function (agent, email, password, passwordResetCode, callback) {
    _passwordResetComplete(agent, email, password, passwordResetCode, 200, callback);
};


/**
 * Verify e-mail - call '/api/auth/verify/:code'
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {string} emailVerificationCode Verification code e-mailed to the user.
 * @param {function} callback (err, res)
 *
 * @return {void}
 */
var verify = function (agent, emailVerificationCode, callback) {
    var path = '/api/auth/verify/:code'.replace(':code', emailVerificationCode);

    agent
        .get(path)
        .expect(302)
        .expect('Location', /\/account\/login\?email=.*/)
        .end(callback);
};

/**
 * Check auth status - call '/api/auth/status'
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {number} expectedHttpCode Expected HTTP response code
 * @param {function} callback (err, res)
 *
 * @return {void}
 *
 * @private
 */
var _status = function (agent, expectedHttpCode, callback) {
    var path = '/api/auth/status';

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

/**
 * Check auth status - call '/api/auth/status'
 *
 * @param {object} agent SuperAgent is in the interface so other tests preparing data could provide their agent. Useful when agent holds a state (for ex session).
 * @param {function} callback (err, res)
 *
 * @return {void}
 */
var status = function (agent, callback) {
    _status(agent, 200, callback);
};

var _openIdAuthorize = function (agent, responseType, clientId, redirectUri, nonce, scope, state, expectedHttpCode, callback) {
    var path = '/api/auth/openid/authorize';

    agent
        .get(path)
        .query({
            response_type: responseType,
            client_id: clientId,
            redirect_uri: redirectUri,
            nonce: nonce,
            scope: scope,
            state: state
        })
        .expect(expectedHttpCode)
        .end(callback);
};

var openIdAuthorize = function (agent, responseType, clientId, redirectUri, scope, state, nonce, callback) {
    _openIdAuthorize(agent, responseType, clientId, redirectUri, nonce, scope, state, 302, callback);
};

//Export the above function call so that other tests could use it to prepare data.
module.exports.login = login;
module.exports.logout = logout;
module.exports.signup = signup;
module.exports.verify = verify;
module.exports.passwordSet = passwordSet;
module.exports.passwordResetSend = passwordResetSend;
module.exports.status = status;
module.exports._status = _status;

var request = require('supertest');
var app = require('../../app');
var uuid = require('node-uuid');

var assert = require('chai').assert;
var config = app.get('config');
var jwt = app.get('jwt');
var urlLib = app.get('urlLib');
var objectEncrypter = app.get('objectEncrypter');

var shared = require('../utils/shared')(app);
var userLib = require('./lib/user')(app);

var User = app.get('models.User');
var UserConnection = app.get('models.UserConnection');
var UserConsent = app.get('models.UserConsent');
var Partner = app.get('models.Partner');

suite('Auth', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .then(done)
            .catch(done);
    });

    suite('Login', function () {

        suite('Username & password', function () {

            var agent = request.agent(app);
            var email = 'test_' + new Date().getTime() + '@test.ee';
            var password = 'Test123';

            suiteSetup(function (done) {
                userLib.createUser(agent, email, password, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    return done();
                });
            });

            test('Success', function (done) {
                login(agent, email, password, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var user = res.body.data;
                    assert.equal(user.email, email);
                    assert.property(user, 'id');
                    assert.notProperty(res.body, 'name'); //TODO: would be nice if null values were not returned in the response
                    assert.notProperty(user, 'password');
                    assert.notProperty(user, 'emailIsVerified');
                    assert.notProperty(user, 'emailVerificationCode');
                    assert.notProperty(user, 'createdAt');
                    assert.notProperty(user, 'updatedAt');
                    assert.notProperty(user, 'deletedAt');

                    return done();
                });
            });

            test('Fail - 40001 - account does not exist', function (done) {
                agent
                    .post('/api/auth/login')
                    .set('Content-Type', 'application/json')
                    .send({email: 'test_nonexistent_' + new Date().getTime() + '@test.ee', password: password})
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var status = res.body.status;

                        assert.equal(status.code, 40001);
                        assert.equal(status.message, 'The account does not exists.');

                        return done();
                    });
            });

            test('Fail - 40002 - account has not been verified', function (done) {
                var agent = request.agent(app);

                var email = 'test_notverif_' + new Date().getTime() + '@test.ee';
                var password = 'Test123';


                signup(agent, email, password, null, function () {
                    _login(agent, email, password, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var status = res.body.status;

                        assert.equal(status.code, 40002);
                        assert.equal(status.message, 'The account verification has not been completed. Please check your e-mail.');

                        return done();
                    });
                });

            });

            test('Fail - 40003 - wrong password', function (done) {
                agent
                    .post('/api/auth/login')
                    .set('Content-Type', 'application/json')
                    .send({email: email, password: 'thisinvalidpassword'})
                    .expect(400)
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var status = res.body.status;

                        assert.equal(status.code, 40003);
                        assert.equal(res.body.errors.password, 'Invalid password');

                        return done();
                    });
            });
        });

        suite.skip('ID-card', function () {
            // TODO: Create some
        });

        suite('Mobiil-ID', function () {

            suite('Init', function () {

                test('Success - 20001 - Estonian mobile number and PID', function (done) {
                    this.timeout(5000); //eslint-disable-line no-invalid-this

                    var phoneNumber = '+37200000766';
                    var pid = '11412090004';

                    UserConnection
                        .destroy({
                            where: {
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: [pid] // Remove the good user so that test would run multiple times. Also other tests use same numbers
                            },
                            force: true
                        })
                        .then(function () {
                            loginMobileInit(request.agent(app), pid, phoneNumber, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                var response = res.body;

                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);

                                var token = response.data.token;
                                assert.isNotNull(token);

                                var tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
                                var loginMobileFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);

                                assert.property(loginMobileFlowData, 'sesscode');
                                assert.deepEqual(loginMobileFlowData.personalInfo, {
                                    pid: '11412090004',
                                    firstName: 'MARY ÄNN',
                                    lastName: 'O’CONNEŽ-ŠUSLIK',
                                    countryCode: 'EE'
                                });

                                return done();
                            });
                        })
                        .catch(done);

                });

                test('Fail - 40021 - Invalid phone number', function (done) {
                    var phoneNumber = '+372519';
                    var pid = '51001091072';

                    _loginMobileInit(request.agent(app), pid, phoneNumber, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedResponse = {
                            status: {
                                code: 40021,
                                message: 'User is not a Mobile-ID client. Please double check phone number and/or id code.'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);

                        return done();
                    });
                });

                test('Fail - 40021 - Invalid PID', function (done) {
                    var phoneNumber = '+37260000007';
                    var pid = '1072';

                    _loginMobileInit(request.agent(app), pid, phoneNumber, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedResponse = {
                            status: {
                                code: 40021,
                                message: 'User is not a Mobile-ID client. Please double check phone number and/or id code.'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);

                        return done();
                    });
                });

                test('Fail - 40022 - Mobile-ID user certificates are revoked or suspended for Estonian citizen', function (done) {
                    var phoneNumber = '+37200009';
                    var pid = '14212128027';

                    _loginMobileInit(request.agent(app), pid, phoneNumber, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedResponse = {
                            status: {
                                code: 40022,
                                message: 'User certificates are revoked or suspended.'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);

                        return done();
                    });
                });

                test('Fail - 40022 - Mobile-ID user certificates are revoked or suspended for Lithuanian citizen', function (done) {
                    var phoneNumber = '+37060000009';
                    var pid = '51001091094';

                    _loginMobileInit(request.agent(app), pid, phoneNumber, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedResponse = {
                            status: {
                                code: 40022,
                                message: 'User certificates are revoked or suspended.'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);

                        return done();
                    });
                });

                test('Fail - 40023 - User certificate is not activated for Estonian citizen.', function (done) {
                    var phoneNumber = '+37200001';
                    var pid = '38002240211';

                    _loginMobileInit(request.agent(app), pid, phoneNumber, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedResponse = {
                            status: {
                                code: 40023,
                                message: 'User certificate is not activated.'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);

                        return done();
                    });
                });

                test('Fail - 40023 - Mobile-ID is not activated for Lithuanian citizen', function (done) {
                    var phoneNumber = '+37060000001';
                    var pid = '51001091006';

                    _loginMobileInit(request.agent(app), pid, phoneNumber, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedResponse = {
                            status: {
                                code: 40023,
                                message: 'User certificate is not activated.'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);

                        return done();
                    });
                });

                test.skip('Fail - 40024 - User certificate is suspended', function (done) {
                    //TODO: No test phone numbers available for errorcode = 304 - http://id.ee/?id=36373
                    done();
                });

                test.skip('Fail - 40025 - User certificate is expired', function (done) {
                    //TODO: No test phone numbers available for errorcode = 305 - http://id.ee/?id=36373
                    done();
                });

            });

            suite('Status', function () {
                var phoneNumber = '+37200000766';
                var pid = '11412090004';

                suite('New User', function () {
                    suiteSetup(function (done) {
                        UserConnection
                            .destroy({
                                where: {
                                    connectionId: UserConnection.CONNECTION_IDS.esteid,
                                    connectionUserId: [pid] // Remove the good user so that test would run multiple times. Also other tests use same numbers
                                },
                                force: true
                            })
                            .then(function () {
                                done();
                            })
                            .catch(done);
                    });

                    test('Success - 20003 - created', function (done) {
                        this.timeout(35000); //eslint-disable-line no-invalid-this

                        var agent = request.agent(app);

                        loginMobileInit(agent, pid, phoneNumber, function (err, res) { // eslint-disable-line consistent-return
                            if (err) {
                                return done(err);
                            }

                            var interval;
                            var calls = 0;
                            var replies = 0;
                            var clearStatus = function () {
                                clearInterval(interval);
                            };


                            interval = setInterval(function () { // eslint-disable-line consistent-return
                                if (calls < 5) {
                                    if (calls === replies) {
                                        calls++;
                                        loginMobileStatus(agent, res.body.data.token, function (err, res) { // eslint-disable-line consistent-return
                                            replies++;
                                            if (err) {
                                                return done(err);
                                            }

                                            if (calls === 1) {
                                                assert.equal(res.body.status.code, 20001);
                                            }

                                            if (res.body.status.code === 20003) {
                                                clearStatus();

                                                var userInfoFromMobiilIdStatusResponse = res.body.data;

                                                status(agent, function (err, res) {
                                                    if (err) {
                                                        return done(err);
                                                    }

                                                    // Makes sure login succeeded AND consistency between /auth/status and /auth/mobile/status endpoints
                                                    assert.deepEqual(res.body.data, userInfoFromMobiilIdStatusResponse);
                                                    assert.equal(userInfoFromMobiilIdStatusResponse.name, 'Mary Änn O’Connež-Šuslik'); // Special check for encoding issues

                                                    return done();
                                                });
                                            }
                                        });
                                    }
                                } else {
                                    clearStatus();

                                    return done(new Error('Maximum retries reached'));
                                }

                            }, 5000);

                            // Don't leave leave tests hanging on error
                            setTimeout(function () {
                                clearStatus();
                            }, 35000);
                        });
                    });
                });


                suite('Existing User', function () {
                    var agent2 = request.agent(app);

                    suiteSetup(function (done) {
                        userLib
                            .createUser(agent2, null, null, null, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                return UserConnection
                                    .findOrCreate({
                                        where: {
                                            connectionId: UserConnection.CONNECTION_IDS.esteid,
                                            connectionUserId: pid
                                        },
                                        defaults: {
                                            userId: res.id,
                                            connectionId: UserConnection.CONNECTION_IDS.esteid,
                                            connectionUserId: pid
                                        }
                                    })
                                    .then(function (user, err) {
                                        if (err) {
                                            return done(err);
                                        }

                                        return done();
                                    })
                                    .catch(done);
                            });
                    });

                    test('Success - 20002 - existing User', function (done) {
                        this.timeout(35000); //eslint-disable-line no-invalid-this

                        loginMobileInit(agent2, pid, phoneNumber, function (err, res) { // eslint-disable-line consistent-return
                            if (err) {
                                return done(err);
                            }

                            var interval;
                            var calls = 0;
                            var replies = 0;
                            var clearStatus = function () {
                                clearInterval(interval);
                            };

                            interval = setInterval(function () { // eslint-disable-line consistent-return
                                if (calls < 5) {
                                    if (calls === replies) {
                                        calls++;
                                        loginMobileStatus(agent2, res.body.data.token, function (err, res) { // eslint-disable-line consistent-return
                                            replies++;
                                            if (err) {
                                                clearStatus();

                                                return done(err);
                                            }
                                            if (res.body.status.code === 20002) {
                                                clearStatus();

                                                var userInfoFromMobiilIdStatusResponse = res.body.data;

                                                status(agent2, function (err, res) {
                                                    if (err) {
                                                        return done(err);
                                                    }

                                                    // Makes sure login succeeded AND consistency between /auth/status and /auth/mobile/status endpoints
                                                    assert.deepEqual(res.body.data, userInfoFromMobiilIdStatusResponse);

                                                    return done();
                                                });
                                            } else if (calls === 1) {
                                                assert.equal(res.body.status.code, 20001);
                                            }
                                        });
                                    }
                                } else {
                                    clearStatus();

                                    return done(new Error('Maximum retries reached'));
                                }
                            }, 4000);

                            // Don't leave leave tests hanging on error
                            setTimeout(function () {
                                clearStatus();
                            }, 35000);
                        });
                    });

                });

            });

        });

        suite('Smart-ID', function () {
            suite('Init', function () {
                test('Success - 20001 - Estonian PID', function (done) {
                    this.timeout(5000); //eslint-disable-line no-invalid-this

                    var pid = '10101010005';

                    UserConnection
                        .destroy({
                            where: {
                                connectionId: UserConnection.CONNECTION_IDS.smartid,
                                connectionUserId: [pid] // Remove the good user so that test would run multiple times. Also other tests use same numbers
                            },
                            force: true
                        })
                        .then(function () {
                            loginSmartIdInit(request.agent(app), pid, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                var response = res.body;
                                assert.equal(response.status.code, 20001);
                                assert.match(response.data.challengeID, /[0-9]{4}/);

                                var token = response.data.token;
                                assert.isNotNull(token);

                                var tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
                                var loginMobileFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);

                                assert.property(loginMobileFlowData, 'sessionId');
                                assert.property(loginMobileFlowData, 'sessionHash');
                                assert.property(loginMobileFlowData, 'challengeID');
                                assert.equal(loginMobileFlowData.challengeID, response.data.challengeID);

                                return done();
                            });
                        })
                        .catch(done);

                });

                test('Fail - 40400 - Invalid PID', function (done) {
                    var pid = '1010101';

                    _loginSmartIdInit(request.agent(app), pid, 404, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedResponse = {
                            status: {
                                code: 40400,
                                message: 'Not Found'
                            }
                        };

                        assert.deepEqual(res.body, expectedResponse);

                        return done();
                    });
                });
            });

            suite('Status', function () {
                var pid = '10101010005';

                suite('New User', function () {
                    suiteSetup(function (done) {
                        UserConnection
                            .destroy({
                                where: {
                                    connectionId: UserConnection.CONNECTION_IDS.smartid,
                                    connectionUserId: [pid] // Remove the good user so that test would run multiple times. Also other tests use same numbers
                                },
                                force: true
                            })
                            .then(function () {
                                return done();
                            })
                            .catch(done);
                    });

                    test('Success - 20003 - created', function (done) {
                        this.timeout(15000); //eslint-disable-line no-invalid-this

                        var agent = request.agent(app);

                        loginSmartIdInit(agent, pid, function (err, res) { // eslint-disable-line consistent-return
                            if (err) {
                                return done(err);
                            }

                            var interval;
                            var calls = 0;
                            var replies = 0;
                            var clearStatus = function () {
                                clearInterval(interval);
                            };

                            interval = setInterval(function () { // eslint-disable-line consistent-return
                                if (calls < 5) {
                                    if (calls === replies) {
                                        calls++;
                                        loginSmartIdStatus(agent, res.body.data.token, function (err, res) { // eslint-disable-line consistent-return
                                            replies++;
                                            if (err) {
                                                return done(err);
                                            }

                                            if (res.body.status.code === 20003) {
                                                clearStatus();

                                                var userInfoFromSmartIdStatusResponse = res.body.data;

                                                status(agent, function (err, res) {
                                                    if (err) {
                                                        return done(err);
                                                    }

                                                    // Makes sure login succeeded AND consistency between /auth/status and /auth/mobile/status endpoints
                                                    assert.deepEqual(res.body.data, userInfoFromSmartIdStatusResponse);
                                                    assert.equal(userInfoFromSmartIdStatusResponse.name, 'Demo Smart-Id'); // Special check for encoding issues

                                                    return done();
                                                });
                                            } else {
                                                assert.equal(res.body.status.code, 20001);
                                            }
                                        });
                                    }
                                } else {
                                    clearStatus();

                                    return done(new Error('Maximum retries reached'));
                                }

                            }, 2000);
                            // Don't leave leave tests hanging on error
                            setTimeout(function () {
                                clearStatus();
                            }, 15000);
                        });
                    });

                    test('Fail - 40010 - User refused', function (done) {
                        this.timeout(15000); //eslint-disable-line no-invalid-this

                        var agent = request.agent(app);

                        loginSmartIdInit(agent, '10101010016', function (err, res) { // eslint-disable-line consistent-return
                            if (err) {
                                return done(err);
                            }

                            var interval;
                            var calls = 0;
                            var replies = 0;
                            var clearStatus = function () {
                                clearInterval(interval);
                            };

                            interval = setInterval(function () { // eslint-disable-line consistent-return
                                if (calls < 5) {
                                    if (calls === replies) {
                                        calls++;
                                        _loginSmartIdStatus(agent, res.body.data.token, function (err, res) { // eslint-disable-line consistent-return
                                            replies++;
                                            if (err) {
                                                return done(err);
                                            }

                                            if (res.body.status.code === 40010) {
                                                clearStatus();
                                                var expectedResponse = {
                                                    status: {
                                                        code: 40010,
                                                        message: 'User refused'
                                                    }
                                                };
                                                assert.deepEqual(expectedResponse, res.body);

                                                return done();
                                            } else {
                                                assert.equal(res.body.status.code, 20001);
                                            }
                                        });
                                    }
                                } else {
                                    clearStatus();

                                    return done(new Error('Maximum retries reached'));
                                }

                            }, 2000);

                            // Don't leave leave tests hanging on error
                            setTimeout(function () {
                                clearStatus();
                            }, 15000);
                        });
                    });


                    test('Fail - 40011 - Timeout', function (done) {
                        this.timeout(120000); //eslint-disable-line no-invalid-this

                        var agent = request.agent(app);

                        loginSmartIdInit(agent, '10101010027', function (err, res) { // eslint-disable-line consistent-return
                            if (err) {
                                return done(err);
                            }

                            setTimeout(function () {
                                _loginSmartIdStatus(agent, res.body.data.token, function (err, res) { // eslint-disable-line consistent-return
                                    if (err) {
                                        return done(err);
                                    }

                                    if (res.body.status.code === 40011) {
                                        var expectedResponse = {
                                            status: {
                                                code: 40011,
                                                message: 'The transaction has expired'
                                            }
                                        };
                                        assert.deepEqual(expectedResponse, res.body);

                                        return done();
                                    } else {
                                        assert.equal(res.body.status.code, 20001);
                                    }
                                });
                            }, 100000);

                        });
                    });
                });


                suite('Existing User', function () {
                    var agent2 = request.agent(app);

                    suiteSetup(function (done) {
                        userLib
                            .createUser(agent2, null, null, null, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                return UserConnection
                                    .findOrCreate({
                                        where: {
                                            connectionId: UserConnection.CONNECTION_IDS.smartid,
                                            connectionUserId: pid
                                        },
                                        defaults: {
                                            userId: res.id,
                                            connectionId: UserConnection.CONNECTION_IDS.smartid,
                                            connectionUserId: pid
                                        }
                                    })
                                    .then(function (user, err) {
                                        if (err) {
                                            return done(err);
                                        }

                                        return done();
                                    })
                                    .catch(done);
                            });
                    });

                    test('Success - 20002 - existing User', function (done) {
                        this.timeout(15000); //eslint-disable-line no-invalid-this

                        loginSmartIdInit(agent2, pid, function (err, res) { // eslint-disable-line consistent-return
                            if (err) {
                                return done(err);
                            }

                            var interval;
                            var calls = 0;
                            var replies = 0;
                            var clearStatus = function () {
                                clearInterval(interval);
                            };

                            interval = setInterval(function () { // eslint-disable-line consistent-return
                                if (calls < 5) {
                                    if (calls === replies) {
                                        calls++;
                                        loginSmartIdStatus(agent2, res.body.data.token, function (err, res) { // eslint-disable-line consistent-return
                                            replies++;
                                            if (err) {
                                                clearStatus();

                                                return done(err);
                                            }

                                            if (res.body.status.code === 20002) {
                                                clearStatus();

                                                var userInfoFromSmartIdStatusResponse = res.body.data;

                                                status(agent2, function (err, res) {
                                                    if (err) {
                                                        return done(err);
                                                    }

                                                    // Makes sure login succeeded AND consistency between /auth/status and /auth/mobile/status endpoints
                                                    assert.deepEqual(res.body.data, userInfoFromSmartIdStatusResponse);

                                                    return done();
                                                });
                                            } else {
                                                assert.equal(res.body.status.code, 20001);
                                            }


                                        });
                                    }
                                } else {
                                    clearStatus();

                                    return done(new Error('Maximum retries reached'));
                                }
                            }, 2000);

                            // Don't leave leave tests hanging on error
                            setTimeout(function () {
                                clearStatus();
                            }, 15000);
                        });
                    });

                });

            });
        });
    });

    suite('Logout', function () {

        test('Success', function (done) {
            var agent = request.agent(app);
            var email = 'test_' + new Date().getTime() + '@test.ee';
            var password = 'Test123';

            userLib.createUserAndLogin(agent, email, password, null, function () {
                logout(agent, function (err) {
                    if (err) {
                        return done(err);
                    }

                    return done();
                });
            });
        });

    });

    suite('Signup', function () {
        var agent = request.agent(app);

        test('Success', function (done) {
            var email = 'test_' + new Date().getTime() + '@test.ee';
            var password = 'Test123';

            signup(agent, email, password, null, function (err, res) {
                if (err) {
                    return done(err);
                }

                var user = res.body.data;
                assert.equal(user.email, email);
                assert.property(user, 'id');
                assert.notProperty(user, 'password');
                assert.notProperty(user, 'emailIsVerified');
                assert.notProperty(user, 'emailVerificationCode');
                assert.notProperty(user, 'passwordResetCode');
                assert.notProperty(user, 'createdAt');
                assert.notProperty(user, 'updatedAt');
                assert.notProperty(user, 'deletedAt');

                return done();
            });
        });

        test('Success - invited user - User with NULL password in DB should be able to sign up', function (done) {
            // Users with NULL password are created on User invite
            var agent = request.agent(app);

            var email = 'test_' + new Date().getTime() + '_invited@test.ee';
            var password = 'Test123';
            var language = 'et';

            User
                .create({
                    email: email,
                    password: null,
                    name: email,
                    source: User.SOURCES.citizenos
                })
                .then(function (user) {
                    signup(agent, user.email, password, language, function (err) {
                        if (err) {
                            return done(err);
                        }

                        return done();
                    });
                })
                .catch(done);

        });

        test('Fail - 40000 - email cannot be null', function (done) {
            var email = null;
            var password = 'Test123';

            _signup(agent, email, password, null, 400, function (err, res) {
                if (err) {
                    return done(err);
                }

                var expected = {
                    status: {
                        code: 40000
                    },
                    errors: {
                        email: 'Invalid email.'
                    }
                };

                assert.deepEqual(res.body, expected);

                return done();
            });
        });

        test('Fail - 40000 - invalid email', function (done) {
            var email = 'this is an invalid email';
            var password = 'Test123';

            _signup(agent, email, password, null, 400, function (err, res) {
                if (err) {
                    return done(err);
                }

                var expected = {
                    status: {
                        code: 40000
                    },
                    errors: {
                        email: 'Invalid email.'
                    }
                };

                assert.deepEqual(res.body, expected);

                return done();
            });
        });

        test('Fail - 40000 - missing password', function (done) {
            var email = 'test_' + new Date().getTime() + '@test.ee';
            var password = null;

            _signup(agent, email, password, null, 400, function (err, res) {
                if (err) {
                    return done(err);
                }

                var expected = {
                    status: {
                        code: 40000
                    },
                    errors: {
                        password: 'Password must be at least 6 character long, containing at least 1 digit, 1 lower and upper case character.'
                    }
                };

                assert.deepEqual(res.body, expected);

                return done();
            });
        });

        test('Fail - 40000 - invalid password', function (done) {
            var email = 'test_' + new Date().getTime() + '@test.ee';
            var password = 'nonumbersoruppercase';

            _signup(agent, email, password, null, 400, function (err, res) {
                if (err) {
                    return done(err);
                }

                var expected = {
                    status: {
                        code: 40000
                    },
                    errors: {
                        password: 'Password must be at least 6 character long, containing at least 1 digit, 1 lower and upper case character.'
                    }
                };

                assert.deepEqual(res.body, expected);

                return done();
            });
        });

        test('Fail - 40000 - invalid password and invalid email', function (done) {
            var email = 'notvalidatall';
            var password = 'nonumbersoruppercase';

            _signup(agent, email, password, null, 400, function (err, res) {
                if (err) {
                    return done(err);
                }

                var expected = {
                    status: {
                        code: 40000
                    },
                    errors: {
                        email: 'Invalid email.',
                        password: 'Password must be at least 6 character long, containing at least 1 digit, 1 lower and upper case character.'
                    }
                };

                assert.deepEqual(res.body, expected);

                return done();
            });
        });

        test('Fail - 40001 - email already in use', function (done) {
            var email = 'test_emailinuse_' + new Date().getTime() + '@test.ee';
            var password = 'Test123';

            signup(agent, email, password, null, function () {
                _signup(agent, email, password, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var expect = {
                        status: {
                            code: 40001
                        },
                        errors: {
                            email: 'The email address is already in use.'
                        }
                    };

                    assert.deepEqual(res.body, expect);

                    return done();
                });
            });
        });

    });

    suite('Verify', function () {
        var agent = request.agent(app);

        // Success is already tested as a part of 'Login' suite.
        test.skip('Success - signup sets redirectSuccess and verify should redirect to it', function (done) {
            done();
        });

        test('Fail - invalid emailVerificationCode', function (done) {
            agent
                .get('/api/auth/verify/thisCodeDoesNotExist')
                .expect(302)
                .expect('Location', urlLib.getFe('/', null, {error: 'emailVerificationFailed'}))
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }

                    return done();
                });
        });

    });

    suite('Password', function () {

        suite('Set', function () {
            var agent = request.agent(app);
            var email = 'test_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var newPassword = 'newPassword123';

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    return done();
                });
            });

            test('Success', function (done) {
                passwordSet(agent, password, newPassword, function (err) {
                    if (err) {
                        return done(err);
                    }

                    //now try to log in with new password
                    return login(request.agent(app), email, newPassword, function (err) {
                        if (err) {
                            return done(err);
                        }

                        return done();
                    });
                });
            });

            test('Fail - invalid new password which does not contain special characters needed', function (done) {
                var currentPassword = newPassword;
                var invalidNewPassword = 'nospecialchars';
                _passwordSet(agent, currentPassword, invalidNewPassword, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var expected = {
                        status: {
                            code: 40000
                        },
                        errors: {
                            password: 'Password must be at least 6 character long, containing at least 1 digit, 1 lower and upper case character.'
                        }
                    };

                    assert.deepEqual(res.body, expected);

                    return done();
                });
            });

            test('Fail - invalid old password', function (done) {
                var invalidCurrentPassword = 'thiscannotbevalid';
                var validNewPassword = 'Test123ASD';
                _passwordSet(agent, invalidCurrentPassword, validNewPassword, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.body.status.message, 'Invalid email or new password.');

                    return done();
                });
            });

            test('Fail - Unauthorized', function (done) {
                var agent = request.agent(app);
                _passwordSet(agent, 'oldPassSomething', 'newPassSomething', 401, function (err) {
                    if (err) {
                        return done(err);
                    }

                    return done();
                });
            });

        });

        suite('Reset', function () {
            var agent = request.agent(app);
            var email = 'test_reset_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var language = 'et';

            suiteSetup(function (done) {
                userLib.createUser(agent, email, password, language, function (err) {
                    if (err) {
                        return done(err);
                    }

                    return done();
                });
            });

            suite('Send', function () {
                test('Success', function (done) {
                    passwordResetSend(agent, email, function () {
                        User.find({
                            where: {
                                email: email
                            }
                        }).then(function (user) {
                            var passwordResetCode = user.passwordResetCode;
                            assert.property(user, 'passwordResetCode');
                            assert.isNotNull(passwordResetCode);
                            assert.lengthOf(passwordResetCode, 36);
                            done();
                        });
                    });
                });

                test('Fail - 40000 - missing email', function (done) {
                    _passwordResetSend(agent, null, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedBody = {
                            status: {
                                code: 40000
                            },
                            errors: {
                                email: 'Invalid email'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        return done();
                    });
                });

                test('Fail - 40001 - non existent email', function (done) {
                    _passwordResetSend(agent, 'test_this_user_we_dont_have@test.com', 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedBody = {
                            status: {
                                code: 40002
                            },
                            errors: {
                                email: 'Account with this email does not exist.'
                            }
                        };

                        assert.deepEqual(res.body, expectedBody);

                        return done();
                    });
                });
            });


            suite('Complete', function () {
                var passwordResetCode;

                suiteSetup(function (done) {
                    passwordResetSend(agent, email, function (err) {
                        if (err) {
                            return done(err);
                        }

                        return User
                            .find({
                                where: {
                                    email: email
                                }
                            })
                            .then(function (user) {
                                passwordResetCode = user.passwordResetCode;

                                return done();
                            });
                    });
                });

                test('Fail - invalid reset code', function (done) {
                    _passwordResetComplete(agent, email, password, uuid.v4(), 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        assert.equal(res.body.status.message, 'Invalid email, password or password reset code.');

                        return done();
                    });
                });

                test('Fail - missing reset code', function (done) {
                    _passwordResetComplete(agent, email, password, null, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        assert.equal(res.body.status.message, 'Invalid email, password or password reset code.');

                        return done();
                    });
                });


                test('Fail - invalid password', function (done) {
                    _passwordResetComplete(agent, email, 'thispassisnotinvalidformat', passwordResetCode, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expected = {
                            status: {
                                code: 40000
                            },
                            errors: {
                                password: 'Password must be at least 6 character long, containing at least 1 digit, 1 lower and upper case character.'
                            }
                        };

                        assert.deepEqual(res.body, expected);

                        return done();
                    });
                });

                test('Fail - invalid email', function (done) {
                    _passwordResetComplete(agent, 'test_invalidemail@test.com', password, passwordResetCode, 400, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        assert.equal(res.body.status.message, 'Invalid email, password or password reset code.');

                        return done();
                    });
                });

                test('Fail - no password reset has been requested by user (passwordResetCode is null)', function (done) {
                    var agent = request.agent(app);
                    var email = 'test_' + new Date().getTime() + '@test.ee';
                    var password = 'testPassword123';

                    signup(agent, email, password, null, function () {
                        _passwordResetComplete(agent, email, password, null, 400, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            assert.equal(res.body.status.message, 'Invalid email, password or password reset code.');

                            return done();
                        });
                    });
                });

                test('Success', function (done) {
                    passwordResetComplete(agent, email, password, passwordResetCode, function (err) {
                        if (err) {
                            return done(err);
                        }

                        // After the reset, user has to be able to log in with the new credentials
                        return login(agent, email, password, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            assert.equal(email, res.body.data.email);

                            return done();
                        });
                    });
                });

            });

        });

    });

    suite('Status', function () {
        var agent = request.agent(app);
        var email = 'test_status_' + new Date().getTime() + '@test.ee';
        var password = 'testPassword123';

        suiteSetup(function (done) {
            userLib.createUser(agent, email, password, null, function (err) {
                if (err) {
                    return done(err);
                }

                return done();
            });
        });

        test('Success', function (done) {
            login(agent, email, password, function () {
                status(agent, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var user = res.body.data;
                    assert.equal(user.email, email);

                    return done();
                });
            });
        });

        test('Fail - Unauthorized', function (done) {
            _status(request.agent(app), 401, function (err) {
                if (err) {
                    return done(err);
                }

                return done();
            });
        });

        test('Fail - Unauthorized - JWT token expired', function (done) {
            var agent = request.agent(app);

            var path = '/api/auth/status';
            var token = jwt.sign({id: 'notimportantinthistest', scope: 'all'}, config.session.privateKey, {expiresIn: '.1ms', algorithm: config.session.algorithm});

            agent
                .get(path)
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .expect(401)
                .expect('Content-Type', /json/)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var expectedResponse = {
                        status: {
                            code: 40100,
                            message: 'JWT token has expired'
                        }
                    };
                    assert.deepEqual(res.body, expectedResponse);

                    return done();
                });
        });

    });

    suite('Open ID', function () {
        var TEST_RESPONSE_TYPE = 'id_token token';
        var TEST_PARTNER = {
            id: 'e5fcb764-a635-4858-a496-e43079c7326b',
            website: 'https://citizenospartner.ee',
            redirectUriRegexp: '^https:\\/\\/([^\\.]*\\.)?citizenospartner.ee(:[0-9]{2,5})?\\/.*'
        };
        var TEST_CALLBACK_URI = 'https://dev.citizenospartner.ee/callback';

        var agent = request.agent(app);

        suiteSetup(function (done) {
            shared
                .syncDb()
                .then(done)
                .catch(done);
        });

        suite('Authorize', function () {

            suiteSetup(function (done) {
                Partner
                    .upsert(TEST_PARTNER)
                    .then(function () {
                        done();
                    })
                    .catch(done);
            });

            test('Success - 302 - User is logged in to CitizenOS AND has agreed before -> redirect_uri', function (done) {
                var agent = request.agent(app);
                userLib.createUserAndLogin(agent, null, null, null, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    return UserConsent
                        .create({
                            userId: user.id,
                            partnerId: TEST_PARTNER.id
                        })
                        .then(function () {
                            var state = '123213asdasas1231';
                            openIdAuthorize(agent, TEST_RESPONSE_TYPE, TEST_PARTNER.id, TEST_CALLBACK_URI, 'openid', state, 'dasd12312sdasAA', function (err, authRes) {
                                if (err) {
                                    return done(err);
                                }

                                var uriParts = authRes.headers.location.split('#');
                                assert.equal(uriParts[0], TEST_CALLBACK_URI);

                                var hashParams = uriParts[1];
                                var matchExp = new RegExp('^access_token=[^&]*&id_token=[^&]*&state=' + state + '$');
                                assert.match(hashParams, matchExp);

                                // TODO: Validate contents of ID Token & Access Token

                                return done();
                            });
                        })
                        .catch(done);
                });
            });

            test('Success - 302 - User is logged in to CitizenOS AND has NOT agreed before -> /consent -> redirect_uri', function (done) {
                var agent = request.agent(app);
                userLib.createUserAndLogin(agent, null, null, null, function (err) {
                    if (err) {
                        return done(err);
                    }

                    return openIdAuthorize(agent, TEST_RESPONSE_TYPE, TEST_PARTNER.id, TEST_CALLBACK_URI, 'openid', '123213asdasas1231', 'dasd12312sdasAA', function (err, authRes) {
                        if (err) {
                            return done(err);
                        }

                        var expectedUrl = urlLib.getFe('/:language/partners/:partnerId/consent', {partnerId: TEST_PARTNER.id, language: 'en'});

                        assert.equal(authRes.headers.location, expectedUrl);
                        // FIXME: Verify OpenID callback parameters!
                        // FIXME: Check that state cookie is set

                        return done();
                    });
                });
            });

            test.skip('Success - 302 - User is NOT logged in AND has agreed before -> /login -> redirect_uri', function (done) {
                done();
            });

            test.skip('Success - 302 - User is NOT logged in AND has not agreed before -> /login -> /consent -> redirect_uri', function (done) {
                done();
            });

            test.skip('Success - 302 - User is NOT registered -> /register -> /verify -> /consent -> redirect_uri', function (done) {
                done();
            });

            test('Fail - 400 - Invalid or missing "client_id" parameter value', function (done) {
                _openIdAuthorize(agent, null, null, null, null, null, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.text, 'Invalid or missing "client_id" parameter value.');

                    return done();
                });
            });

            test('Fail - 400 - Invalid partner configuration. Please contact system administrator.', function (done) {
                _openIdAuthorize(agent, null, uuid.v4(), null, null, null, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.text, 'Invalid partner configuration. Please contact system administrator.');

                    return done();
                });
            });

            test('Fail - 400 - Invalid referer. Referer header does not match expected partner URI scheme.', function (done) {
                agent
                    .get('/api/auth/openid/authorize')
                    .set('Referer', 'https://invalidtest.ee/invalid/referer')
                    .query({
                        client_id: TEST_PARTNER.id
                    })
                    .expect(400)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        assert.equal(res.text, 'Invalid referer. Referer header does not match expected partner URI scheme.');

                        return done();
                    });
            });

            test('Fail - 400 - Invalid or missing "redirect_uri" parameter value.', function (done) {
                _openIdAuthorize(agent, null, TEST_PARTNER.id, 'https://invalidtest.ee/callback', null, null, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.text, 'Invalid or missing "redirect_uri" parameter value.');

                    return done();
                });
            });

            test('Fail - 400 - Invalid "redirect_uri". Cannot contain fragment component "#".', function (done) {
                _openIdAuthorize(agent, null, TEST_PARTNER.id, TEST_CALLBACK_URI + '#', null, null, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.text, 'Invalid "redirect_uri". Cannot contain fragment component "#".');

                    return done();
                });
            });

            test('Fail - 302 - Unsupported "response_type" parameter value. Only "token id_token" is supported.', function (done) {
                openIdAuthorize(agent, 'code', TEST_PARTNER.id, TEST_CALLBACK_URI, null, null, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.headers.location, TEST_CALLBACK_URI + '#error=unsupported_response_type&error_description=Unsupported%20%22response_type%22%20parameter%20value.%20Only%20%22token%20id_token%22%20is%20supported.');

                    return done();
                });
            });

            test('Fail - 302 - Unsupported "scope" parameter value. Only "openid" is supported.', function (done) {
                openIdAuthorize(agent, TEST_RESPONSE_TYPE, TEST_PARTNER.id, TEST_CALLBACK_URI, 'invalid', null, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.headers.location, TEST_CALLBACK_URI + '#error=invalid_scope&error_description=Unsupported%20%22scope%22%20parameter%20value.%20Only%20%22openid%22%20is%20supported.');

                    return done();
                });
            });

            test('Fail - 302 - Invalid or missing "nonce" parameter value. "nonce" must be a random string with at least 14 characters of length.', function (done) {
                openIdAuthorize(agent, TEST_RESPONSE_TYPE, TEST_PARTNER.id, TEST_CALLBACK_URI, 'openid', null, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.equal(res.headers.location, TEST_CALLBACK_URI + '#error=invalid_request&error_description=Invalid%20or%20missing%20%22nonce%22%20parameter%20value.%20%22nonce%22%20must%20be%20a%20random%20string%20with%20at%20least%2014%20characters%20of%20length.&error_uri=http%3A%2F%2Fopenid.net%2Fspecs%2Fopenid-connect-implicit-1_0.html%23RequestParameters');

                    return done();
                });
            });

        });

    });

});
