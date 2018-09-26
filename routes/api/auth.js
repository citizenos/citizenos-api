'use strict';

module.exports = function (app) {

    var logger = app.get('logger');
    var _ = app.get('lodash');
    var cryptoLib = app.get('cryptoLib');
    var smartId = app.get('smartId');
    var loginCheck = app.get('middleware.loginCheck');
    var emailLib = app.get('email');
    var validator = app.get('validator');
    var util = app.get('util');
    var config = app.get('config');
    var passport = app.get('passport');
    var db = app.get('db');
    var cosBdoc = app.get('cosBdoc');
    var cosActivities = app.get('cosActivities');
    var jwt = app.get('jwt');
    var objectEncrypter = app.get('objectEncrypter');
    var querystring = app.get('querystring');
    var urlLib = app.get('urlLib');
    var superagent = app.get('superagent');
    var Promise = app.get('Promise');
    var DigiDocServiceClient = app.get('ddsClient');
    var url = app.get('url');

    var User = app.get('models.User');
    var UserConnection = app.get('models.UserConnection');
    var UserConsent = app.get('models.UserConsent');
    var Partner = app.get('models.Partner');

    var COOKIE_NAME_OPENID_AUTH_STATE = 'cos.authStateOpenId';
    var COOKIE_NAME_COS_AUTH_STATE = 'cos.authState';

    /**
     * Set state cookie with all in req.query when it does not exist
     *
     * @param {object} req Express request object
     * @param {object} res Express response object
     * @param {string} cookieName Cookie name
     * @param {boolean} allowOverwrite Allow overwrite of the cookie
     *
     * @returns {void}
     */
    var setStateCookie = function (req, res, cookieName, allowOverwrite) {
        if (!req.cookies[cookieName] || allowOverwrite) {
            var stateCookieData = jwt.sign(req.query, config.session.privateKey, {algorithm: config.session.algorithm});
            res.cookie(cookieName, stateCookieData, {
                path: '/api/auth/',
                httpOnly: true,
                secure: true
            });
        }
    };


    /**
     * Get state cookie
     *
     * @param {object} req Express request object
     * @param {string} cookieName Cookie name
     *
     * @returns {object|null} State from cookie or null if it does not exist or verification fails.
     */
    var getStateCookie = function (req, cookieName) {
        var stateCookie = req.cookies[cookieName]; // FIXME: cookie name from config?
        if (stateCookie) { // Don't use the state cookie when req.query parameters are there. For the case a new authorization is started.
            var stateCookieData;
            try {
                stateCookieData = jwt.verify(stateCookie, config.session.publicKey, {algorithms: [config.session.algorithm]});
            } catch (e) {
                // Whatever happens, just ignore the cookie
                logger.warn('Invalid state cookie', req.path, e);

                return null;
            }

            return stateCookieData;
        }

        return null;
    };


    /**
     * Clear state cookie
     *
     * @param {object} res Express response object
     * @param {string} cookieName Cookie name
     *
     * @returns {void}
     */
    var clearStateCookie = function (res, cookieName) {
        res.clearCookie(cookieName, {path: '/api/auth/'});
    };

    var handleOpenIdErrorRedirect = function (res, redirectUri, error, errorDescription, state, errorUri) {

        clearStateCookie(res, COOKIE_NAME_OPENID_AUTH_STATE);

        if (redirectUri.indexOf('#') < 0) {
            redirectUri += '#';
        }

        var errorObj = {
            error: error,
            error_description: errorDescription
        };

        if (state) {
            errorObj.state = state;
        }

        if (errorUri) {
            errorObj.error_uri = errorUri;
        }

        return res.redirect(redirectUri + querystring.stringify(errorObj));
    };

    app.post('/api/auth/signup', function (req, res, next) {
        var email = req.body.email || ''; // HACK: Sequelize validate() is not run if value is "null". Also cannot use allowNull: false as I don' want constraint in DB. https://github.com/sequelize/sequelize/issues/2643
        var password = req.body.password || ''; // HACK: Sequelize validate() is not run if value is "null". Also cannot use allowNull: false as I don' want constraint in DB. https://github.com/sequelize/sequelize/issues/2643
        var name = req.body.name || util.emailToDisplayName(req.body.email);
        var company = req.body.company;
        var language = req.body.language;
        var redirectSuccess = req.body.redirectSuccess;

        return User
            .findOne({
                where: {
                    email: email
                }
            })
            .then(function (user) {
                if (user) {
                    // IF password is null, the User was created through an invite. We allow an User to claim the account.
                    if (user.password) {
                        // Email address is already in use.
                        return null;
                    }
                    user.password = password;

                    return user.save();
                } else {
                    return db.transaction(function (t) {
                        return User
                            .findOrCreate({
                                where: {
                                    email: email // Well, this will allow user to log in either using User and pass or just Google.. I think it's ok..
                                },
                                defaults: {
                                    name: name,
                                    email: email,
                                    password: password,
                                    company: company,
                                    source: User.SOURCES.citizenos,
                                    language: language
                                },
                                transaction: t
                            })
                            .spread(function (user, created) {
                                var activityPromise = [];

                                if (created) {
                                    logger.info('Created a new user with Google', user.id);
                                    activityPromise.push(cosActivities.createActivity(user, null, {
                                        type: 'User',
                                        id: user.id
                                    }, req.method + ' ' + req.path, t));
                                }

                                return Promise
                                    .all(activityPromise)
                                    .then(function () {
                                        return UserConnection
                                            .create({
                                                userId: user.id,
                                                connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                                connectionUserId: user.id,
                                                connectionData: user
                                            }, {
                                                transaction: t
                                            })
                                            .then(function (uc) {

                                                return cosActivities.addActivity(uc, {
                                                    type: 'User',
                                                    id: user.id
                                                }, null, user, req.method + ' ' + req.path, t);
                                            })
                                            .then(function () {
                                                return user;
                                            });
                                    });
                            });
                    });
                }
            })
            .then(function (user) {
                if (user) {
                    // Store redirect url in the token so that /api/auth/verify/:code could redirect to the url late
                    var tokenData = {
                        redirectSuccess: redirectSuccess ? redirectSuccess : urlLib.getFe() // TODO: Misleading naming, would like to use "redirectUri" (OpenID convention) instead, but needs RAA.ee to update codebase.
                    };

                    var token = jwt.sign(tokenData, config.session.privateKey, {algorithm: config.session.algorithm});
                    emailLib.sendVerification(user.email, user.emailVerificationCode, token);

                    return res.ok('Check your email ' + user.email + ' to verify your account.', user.toJSON());
                } else {
                    return res.badRequest({email: 'The email address is already in use.'}, 1);
                }
            })
            .catch(next);
    });

    /**
     * Set the authorization cookie, can also be viewed as starting a session
     *
     * @param {object} res Express response object
     * @param {string} userId User id
     * @returns {cookie} data
     *
     * @see http://expressjs.com/en/4x/api.html#res
     */
    var setAuthCookie = function (res, userId) {
        var authToken = jwt.sign({
            id: userId,
            scope: 'all'
        }, config.session.privateKey, {
            expiresIn: config.session.cookie.maxAge,
            algorithm: config.session.algorithm
        });
        res.cookie(config.session.name, authToken, config.session.cookie);
    };

    var clearSessionCookies = function (req, res) {
        res.clearCookie(config.session.name, {
            path: config.session.cookie.path,
            domain: config.session.cookie.domain
        });
        res.clearCookie('express_sid'); // FIXME: Absolutely hate this solution. This deletes the EP session, so that on logout also EP session is destroyed. - https://trello.com/c/CkkFUz5D/235-ep-api-authorization-the-way-ep-session-is-invalidated-on-logout
    };

    /**
     * Login
     */
    app.post('/api/auth/login', function (req, res) {
        passport.authenticate('local', function (err, user) {
            if (err || !user) {
                return res.badRequest(err.message, err.code);
            }

            setAuthCookie(res, user.id);

            return res.ok(user);
        })(req, res);
    });


    app.post('/api/auth/logout', function (req, res) {
        clearSessionCookies(req, res);

        return res.ok();
    });

    app.get('/api/auth/verify/:code', function (req, res, next) {
        var code = req.params.code;
        var token = req.query.token;

        var redirectSuccess = urlLib.getFe('/');
        if (token) {
            var tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
            if (tokenData.redirectSuccess) {
                redirectSuccess = tokenData.redirectSuccess;
            }
        }

        User
            .update(
                {
                    emailIsVerified: true
                },
                {
                    where: {emailVerificationCode: code},
                    limit: 1,
                    validate: false,
                    returning: true
                }
            )
            .then(
                function (result) {
                    // Result[0] - rows, result[1] - updated rows
                    // Result is array with the count of affected rows. For PG also possible to return affected rows
                    if (result && result.length && !result[1] && !result[1].length) { // 0 rows updated.
                        logger.warn('Email verification ended up updating 0 rows. Hackers or new verification code has been generated in between?');

                        return res.redirect(302, redirectSuccess + '?error=emailVerificationFailed');
                    }

                    var user = result[1][0];

                    setAuthCookie(res, user.id);

                    if (getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE)) { // We are in the middle of OpenID authorization flow
                        return res.redirect(urlLib.getApi('/api/auth/openid/authorize'));
                    } else {
                        return res.redirect(302, redirectSuccess);
                    }
                },
                function (err) {
                    logger.warn('Sequelize DB error', err);
                    // TODO: Not the sweetest solution for PG throwing "SequelizeDatabaseError: error: invalid input syntax for uuid: "columnName"".
                    // TODO: Probably not required when TEXT type is used instead of UUID as then PG validation would not kick in.

                    return res.redirect(302, redirectSuccess + '?error=emailVerificationFailed');
                }
            )
            .catch(next); // Whatever blows up, always call next() for Express error handlers to be called.
    });


    app.post('/api/auth/password', loginCheck(), function (req, res, next) {
        var currentPassword = req.body.currentPassword;
        var newPassword = req.body.newPassword;

        User
            .findOne({
                where: {
                    id: req.user.id
                }
            })
            .then(function (user) {
                if (!user || user.password !== cryptoLib.getHash(currentPassword, 'sha256')) {
                    res.badRequest('Invalid email or new password.');

                    return Promise.reject();
                }

                user.password = newPassword;

                return user.save({fields: ['password']});
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });


    app.post('/api/auth/password/reset/send', function (req, res, next) {
        var email = req.body.email;

        if (!validator.isEmail(email)) {
            return res.badRequest({email: 'Invalid email'});
        }

        User
            .findOne({
                where: {
                    email: email
                }
            })
            .then(function (user) {
                if (!user) {
                    res.badRequest({email: 'Account with this email does not exist.'}, 2);

                    return Promise.reject();
                }

                user.passwordResetCode = true; // Model will generate new code

                return user
                    .save({fields: ['passwordResetCode']})
                    .then(function () {
                        emailLib.sendPasswordReset(user.email, user.passwordResetCode);

                        return res.ok('Success! Please check your email :email to complete your password recovery.'.replace(':email', user.email));
                    });
            })
            .catch(next);
    });


    app.post('/api/auth/password/reset', function (req, res, next) {
        var email = req.body.email;
        var password = req.body.password;
        var passwordResetCode = req.body.passwordResetCode;

        User
            .find({
                where: {
                    email: email,
                    passwordResetCode: passwordResetCode
                }
            })
            .then(function (user) {
                // !user.passwordResetCode avoids the situation where passwordResetCode has not been sent (null), but user posts null to API
                if (!user || !user.passwordResetCode) {
                    res.badRequest('Invalid email, password or password reset code.');

                    return Promise.reject();
                }

                user.password = password; // Hash is created by the model hooks

                return user.save({fields: ['password']});
            })
            .then(function () {
                //TODO: Logout all existing sessions for the User!
                return res.ok();
            })
            .catch(next);

    });


    /**
     * Get logged in User info
     *
     * @deprecated Use GET /api/users/self instead.
     */
    app.get('/api/auth/status', loginCheck(['partner']), function (req, res, next) {
        User
            .findOne({
                where: {
                    id: req.user.id
                }
            })
            .then(function (user) {
                if (!user) {
                    clearSessionCookies(req, res);

                    return res.notFound();
                }

                return res.ok(user.toJSON());
            })
            .catch(next);
    });


    app.post('/api/auth/smartid/init', function (req, res, next) {
        var pid = req.body.pid;
        var countryCode = req.body.countryCode;

        if (!pid) {
            return res.badRequest('Smart-ID athentication requires users pid', 1);
        }

        smartId
            .authenticate(pid, countryCode)
            .then(function (sessionData) {
                var sessionDataEncrypted = {sessionDataEncrypted: objectEncrypter(config.session.secret).encrypt(sessionData)};
                var token = jwt.sign(sessionDataEncrypted, config.session.privateKey, {
                    expiresIn: '5m',
                    algorithm: config.session.algorithm
                });

                return res.ok({
                    challengeID: sessionData.challengeID,
                    token: token
                }, 1);
            })
            .catch(function (e) {
                if (e.code === 404) {
                    return res.notFound();
                }

                return next();
            });
    });


    app.get('/api/auth/smartid/status', function (req, res, next) {
        var token = req.query.token;

        if (!token) {
            return res.badRequest('Smart-ID signing has not been started. "token" is required.', 2);
        }

        var tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
        var loginMobileFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);

        smartId
            .status(loginMobileFlowData.sessionId, loginMobileFlowData.sessionHash, 500)
            .then(function (response) {
                // TODO: DUPLICATE CODE, also used in /api/auth/id
                if (response.error) {
                    return res.badRequest(response.error.message, response.error.code);
                } else if (response.state === 'RUNNING') {
                    return res.ok('Log in progress', 1);
                } else if (response.state === 'COMPLETE') {
                    if (response.result.endResult === 'OK') {
                        var personalInfo = response.result.user;
                    } else {
                        return res.badRequest(response.result);
                    }
                } else {
                    return res.badRequest(response);
                }

                return UserConnection
                    .findOne({
                        where: {
                            connectionId: {
                                $in: [
                                    UserConnection.CONNECTION_IDS.esteid,
                                    UserConnection.CONNECTION_IDS.smartid
                                ]
                            },
                            connectionUserId: personalInfo.pid
                        },
                        include: [User]
                    })
                    .then(function (userConnectionInfo) {
                        if (!userConnectionInfo) {
                            return db.transaction(function (t) {
                                return User
                                    .create(
                                        {
                                            name: db.fn('initcap', personalInfo.firstName + ' ' + personalInfo.lastName),
                                            source: User.SOURCES.citizenos
                                        },
                                        {
                                            transaction: t
                                        }
                                    )
                                    .then(function (user) {
                                        return UserConnection
                                            .create(
                                                {
                                                    userId: user.id,
                                                    connectionId: UserConnection.CONNECTION_IDS.smartid,
                                                    connectionUserId: personalInfo.pid,
                                                    connectionData: personalInfo
                                                },
                                                {
                                                    transaction: t
                                                }
                                            )
                                            .then(function () {
                                                return user;
                                            });
                                    });
                            }).then(function (user) {
                                setAuthCookie(res, user.id);

                                return res.ok(user.toJSON(), 3); // New user was created
                            });
                        } else {
                            var user = userConnectionInfo.User;
                            setAuthCookie(res, user.id);

                            return res.ok(user.toJSON(), 2); // Existing User found and logged in
                        }
                    });
            }, _.noop)
            .error(next);
    });

    var idCardAuth = function (req, res, next) {
        var token = req.query.token || req.body.token; // Token to access the ID info service
        var cert = req.headers['x-ssl-client-cert'];

        if (config.services.idCard && cert) {
            logger.error('X-SSL-Client-Cert header is not allowed when ID-card service is enabled. IF you trust your proxy, sending the X-SSL-Client-Cert, delete the services.idCard from your configuration.');

            return res.badRequest('X-SSL-Client-Cert header is not allowed when ID-card proxy service is enabled.');
        }

        if (!token && !cert) {
            logger.warn('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!', req.path, req.headers);

            return res.badRequest('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!');
        }

        var checkCertificatePromise = null;

        if (cert) {
            var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);
            checkCertificatePromise = ddsClient
                .checkCertificate(cert, false)
                .spread(function (checkCertificateResult) {
                    var data = {
                        status: checkCertificateResult.Status.$value
                    };

                    switch (data.status) { // GOOD, UNKNOWN, EXPIRED, SUSPENDED
                        case 'GOOD':
                            data.user = {
                                pid: checkCertificateResult.UserIDCode.$value,
                                firstName: checkCertificateResult.UserGivenname.$value,
                                lastName: checkCertificateResult.UserSurname.$value,
                                countryCode: checkCertificateResult.UserCountry.$value // UPPERCASE ISO-2 letter
                            };
                            break;
                        case 'SUSPENDED':
                        case 'EXPIRED':
                        case 'UNKNOWN':
                            // Not giving User data for such cases - you're not supposed to use it anyway
                            logger.warn('Invalid certificate status', data.status);
                            break;
                        default:
                            logger.error('Unexpected certificate status from DDS', data.status);
                            res.internalServerError();

                            return Promise.reject();
                    }

                    return data;
                });
        } else {
            checkCertificatePromise = superagent
                .get(config.services.idCard.serviceUrl)
                .query({token: token})
                .set('X-API-KEY', config.services.idCard.apiKey)
                .then(function (res) {
                    return res.body.data;
                });
        }

        checkCertificatePromise
            .then(function (res) {
                var status = res.status;

                switch (status) { //GOOD, UNKNOWN, EXPIRED, SUSPENDED, REVOKED
                    case 'GOOD':
                        return res.user;
                    case 'SUSPENDED':
                        res.badRequest('User certificate is suspended.', 24);

                        return Promise.reject();
                    case 'EXPIRED':
                        res.badRequest('User certificate is expired.', 25);

                        return Promise.reject();
                    case 'UNKNOWN':
                        res.badRequest('Unknown user certificate.', 26);

                        return Promise.reject();
                    case 'REVOKED':
                        res.badRequest('User certificate has been revoked.', 27);

                        return Promise.reject();
                    default:
                        logger.error('Unexpected certificate status from DDS', status);
                        res.internalServerError();

                        return Promise.reject();
                }
            })
            .then(function (personalInfo) {
                // TODO: DUPLICATE CODE, also used in /api/auth/mobile/status
                return UserConnection
                    .findOne({
                        where: {
                            connectionId: {
                                $in: [
                                    UserConnection.CONNECTION_IDS.esteid,
                                    UserConnection.CONNECTION_IDS.smartid
                                ]
                            },
                            connectionUserId: personalInfo.pid
                        },
                        include: [User]
                    })
                    .then(function (userConnectionInfo) {
                        if (!userConnectionInfo) {
                            return db.transaction(function (t) {
                                return User
                                    .create(
                                        {
                                            name: db.fn('initcap', personalInfo.firstName + ' ' + personalInfo.lastName),
                                            source: User.SOURCES.citizenos
                                        },
                                        {
                                            transaction: t
                                        }
                                    )
                                    .then(function (user) {
                                        return UserConnection
                                            .create({
                                                userId: user.id,
                                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                                connectionUserId: personalInfo.pid,
                                                connectionData: personalInfo
                                            }, {transaction: t})
                                            .then(function () {
                                                return [user, true];
                                            });
                                    });
                            });
                        } else {
                            var user = userConnectionInfo.User;

                            return [user, false];
                        }
                    });
            })
            .then(function (userInfo) {
                var user = userInfo[0];
                var created = userInfo[1];

                setAuthCookie(res, user.id);
                if (created) {
                    return res.ok(user, 3); // New user was created
                } else {
                    return res.ok(user, 2); // Existing user
                }
            })
            .catch(next);
    };

    /**
     * Authenticate using ID-card
     *
     * NOTE: Requires proxy in front of the app to set "X-SSL-Client-Cert" header
     *
     * GET support due to the fact that FF does not send credentials for preflight requests.
     *
     * @see https://bugs.chromium.org/p/chromium/issues/detail?id=775438
     * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1019603
     */
    app.post('/api/auth/id', idCardAuth);
    app.get('/api/auth/id', idCardAuth);

    /**
     * Start Mobiil-ID authentication
     *
     * Initializes Mobiil-ID authentication. For login, client is supposed to poll /api/auth/mid/status to check if authentication succeeded
     */
    app.post('/api/auth/mobile/init', function (req, res, next) {
        var pid = req.body.pid;
        var phoneNumber = req.body.phoneNumber;

        if (!pid || !phoneNumber) {
            return res.badRequest('mID athentication requires users phoneNumber+pid', 1);
        }

        cosBdoc
            .loginMobileInit(pid, phoneNumber, null)
            .then(function (loginMobileInitResult) {
                switch (loginMobileInitResult.statusCode) {
                    case 0:
                        // Encrypt session data into token which is required back by /api/auth/mobile/status
                        var sessionData = {
                            sesscode: loginMobileInitResult.sesscode,
                            personalInfo: loginMobileInitResult.personalInfo
                        };

                        var sessionDataEncrypted = {sessionDataEncrypted: objectEncrypter(config.session.secret).encrypt(sessionData)};
                        var token = jwt.sign(sessionDataEncrypted, config.session.privateKey, {
                            expiresIn: '5m',
                            algorithm: config.session.algorithm
                        });

                        return res.ok({
                            challengeID: loginMobileInitResult.challengeID,
                            token: token
                        }, 1);
                    case 101:
                    case 102:
                        logger.warn('Invalid input parameters', loginMobileInitResult.statusCode, loginMobileInitResult.status);

                        return res.badRequest('Invalid input parameters.', 20);
                    case 301:
                        return res.badRequest('User is not a Mobile-ID client. Please double check phone number and/or id code.', 21);
                    case 302:
                        return res.badRequest('User certificates are revoked or suspended.', 22);
                    case 303:
                        return res.badRequest('User certificate is not activated.', 23);
                    case 304:
                        return res.badRequest('User certificate is suspended.', 24);
                    case 305:
                        return res.badRequest('User certificate is expired.', 25);
                    default:
                        logger.error('Unhandled DDS status code', loginMobileInitResult.statusCode, loginMobileInitResult.status);

                        return res.internalServerError();
                }
            })
            .catch(next);
    });


    /**
     * Check Mobiil-ID authentication status
     *
     * Authentication is initialized with /api/auth/mid/init, after that client is polling this endpoint for authentication status. In case of success, User session is created and logged in.
     */
    app.get('/api/auth/mobile/status', function (req, res, next) {
        var token = req.query.token;

        if (!token) {
            return res.badRequest('Mobile ID signing has not been started. "token" is required.', 2);
        }

        var tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
        var loginMobileFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);

        cosBdoc
            .loginMobileStatus(loginMobileFlowData.sesscode)
            .then(function (statusCode) {
                switch (statusCode) {
                    case 'USER_AUTHENTICATED':
                        return Promise.resolve(loginMobileFlowData.personalInfo);
                    case 'OUTSTANDING_TRANSACTION':
                        res.ok('Log in progress', 1);

                        return Promise.reject();
                    case 'USER_CANCEL':
                        res.badRequest('User has cancelled the log in process', 10);

                        return Promise.reject();
                    case 'EXPIRED_TRANSACTION':
                        res.badRequest('The transaction has expired', 11);

                        return Promise.reject();
                    case 'NOT_VALID':
                        res.badRequest('Signature is not valid', 12);

                        return Promise.reject();
                    case 'MID_NOT_READY':
                        res.badRequest('Mobile-ID functionality of the phone is not yet ready', 13);

                        return Promise.reject();
                    case 'PHONE_ABSENT':
                        res.badRequest('Delivery of the message was not successful, mobile phone is probably switched off or out of coverage;', 14);

                        return Promise.reject();
                    case 'SENDING_ERROR':
                        res.badRequest('Other error when sending message (phone is incapable of receiving the message, error in messaging server etc.)', 15);

                        return Promise.reject();
                    case 'SIM_ERROR':
                        res.badRequest('SIM application error.', 16);

                        return Promise.reject();
                    case 'REVOKED_CERTIFICATE':
                        res.badRequest('Certificate has been revoked', 17);

                        return Promise.reject();
                    case 'INTERNAL_ERROR':
                        logger.error('Unknown DDS error when trying to log in with mobile', statusCode);
                        res.internalServerError('DigiDocService error', 1);

                        return Promise.reject();
                    default:
                        logger.error('Unknown status code when trying to log in with mobile', statusCode);
                        res.internalServerError();

                        return Promise.reject();
                }
            })
            .then(function (personalInfo) {
                // TODO: DUPLICATE CODE, also used in /api/auth/id
                return UserConnection
                    .findOne({
                        where: {
                            connectionId: {
                                $in: [
                                    UserConnection.CONNECTION_IDS.esteid,
                                    UserConnection.CONNECTION_IDS.smartid
                                ]
                            },
                            connectionUserId: personalInfo.pid
                        },
                        include: [User]
                    })
                    .then(function (userConnectionInfo) {
                        if (!userConnectionInfo) {
                            return db.transaction(function (t) {
                                return User
                                    .create(
                                        {
                                            name: db.fn('initcap', personalInfo.firstName + ' ' + personalInfo.lastName),
                                            source: User.SOURCES.citizenos
                                        },
                                        {
                                            transaction: t
                                        }
                                    )
                                    .then(function (user) {
                                        return UserConnection
                                            .create(
                                                {
                                                    userId: user.id,
                                                    connectionId: UserConnection.CONNECTION_IDS.esteid,
                                                    connectionUserId: personalInfo.pid,
                                                    connectionData: personalInfo
                                                },
                                                {
                                                    transaction: t
                                                }
                                            )
                                            .then(function () {
                                                return user;
                                            });
                                    });
                            }).then(function (user) {
                                setAuthCookie(res, user.id);

                                return res.ok(user.toJSON(), 3); // New user was created
                            });
                        } else {
                            var user = userConnectionInfo.User;
                            setAuthCookie(res, user.id);

                            return res.ok(user.toJSON(), 2); // Existing User found and logged in
                        }
                    });
            }, _.noop)
            .error(next);
    });


    var handleCallbackRedirect = function (req, res) {
        if (getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE)) { // We are in the middle of OpenID authorization flow
            // This is used to get rid of Referer header from FB/Google callback. If I sent 302, the referer would be FB/Google and XSRF check on the /api/auth/openid/authorize would fail.
            res.status(200).send('<!doctype html><html><head><meta http-equiv="refresh" content="0;URL=\'/api/auth/openid/authorize\'" /></head><body></body></html>');
        } else {
            var stateData = getStateCookie(req, COOKIE_NAME_COS_AUTH_STATE);
            if (stateData && stateData.redirectSuccess) {
                clearStateCookie(res, COOKIE_NAME_COS_AUTH_STATE);
                res.redirect(stateData.redirectSuccess); // TODO: Validate return url? Is it sufficient to check that Origin and callback are to the same domain?
            } else {
                // TODO: Not sure if used, check logs and REMOVE when API and FE get separated.
                logger.info('handleCallbackRedirect', 'fallback used', req.method, req.path, req.headers);
                res.redirect(urlLib.getFe('/?')); // DIRTY HACK: Avoid digest loop on Angular side - https://trello.com/c/PedvtYp2/125-bug-join-tokenjoin-infinite-digest-loop-when-signing-in-with-google-fb-functionality-works-but-not-beautiful
            }
        }
    };


    // Passport endpoints
    app.get(config.passport.google.url, function (req, res, next) {
        // Store original request in a cookie, so that we know where to redirect back on callback from the partner (FB, Google...)
        setStateCookie(req, res, COOKIE_NAME_COS_AUTH_STATE);

        passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/userinfo.email']
        })(req, res, next);
    });


    app.get(
        config.passport.google.callbackUrl,
        passport.authenticate('google', {
            failureRedirect: urlLib.getFe('/account/login')
        }),
        function (req, res) {
            setAuthCookie(res, req.user.id);
            handleCallbackRedirect(req, res);
        }
    );


    app.get(config.passport.facebook.url, function (req, res, next) {
        // Store original request in a cookie, so that we know where to redirect back on callback from the partner (FB, Google...)
        setStateCookie(req, res, COOKIE_NAME_COS_AUTH_STATE);

        passport.authenticate('facebook', {
            scope: ['email'],
            display: 'popup'
        })(req, res, next);
    });


    app.get(
        config.passport.facebook.callbackUrl,
        passport.authenticate('facebook', {
            failureRedirect: urlLib.getFe('/account/login')
        }),
        function (req, res) {
            setAuthCookie(res, req.user.id);
            handleCallbackRedirect(req, res);
        }
    );


    /**
     * Open ID Authorize
     *
     * Open ID authorization endpoint. This is the ONLY place where authorization and it's following flow decision should be made.
     * What we want to avoid is to have redirect logic in several places.
     *
     * How we keep the state between redirects (login, register, FB, Google..), is we have a state cookie where we store the first authorization request.
     * After the initial request, all actions redirect back to this endpoint and we use the state cookie data.
     * At some point all conditions are met and we redirect back to Partner site and clear the cookie.
     *
     * @see http://openid.net/specs/openid-connect-implicit-1_0.html#rfc.section.2.1.1
     */
    app.get('/api/auth/openid/authorize', function (req, res, next) {
        var reqQuery = req.query;

        // We store original authorization state in a state cookie so that after whatever login/register flow, we know where it all began.
        // This means that every login/register will redirect back to this endpoint again and this is the only place where flow decisions are made.
        var stateCookieData = getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE);
        if (stateCookieData && !Object.keys(req.query).length) { // Ignore cookie when request parameters are provided, means new authorization flow has been started
            reqQuery = stateCookieData;
        }

        // Ugh, using camelCase in all the other places, but OpenID/OAuth dictates snake_case.
        var responseType = reqQuery.response_type; //id_token token
        var clientId = reqQuery.client_id;
        var redirectUri = reqQuery.redirect_uri;
        var scope = reqQuery.scope;
        var nonce = reqQuery.nonce;
        var state = reqQuery.state;
        var uiLocales = reqQuery.ui_locales ? reqQuery.ui_locales.split(' ')[0] : 'en';
        var referer = req.headers.referer;

        /**
         * If "client_id" OR "redirect_uri" is invalid, thou shall not redirect to "redirect_uri"
         *
         * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
         */
        var uuidV4Regexp = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
        if (!clientId || !uuidV4Regexp.test(clientId)) {
            return res.status(400).send('Invalid or missing "client_id" parameter value.');
        }

        Partner
            .findOne({
                where: {
                    id: clientId
                }
            })
            .then(function (partner) {
                if (!partner || !partner.website || !partner.redirectUriRegexp) {
                    return res.status(400).send('Invalid partner configuration. Please contact system administrator.');
                }

                var partnerUriRegexp = new RegExp(partner.redirectUriRegexp, 'i');

                // Check referer IF it exists, not always true. May help in some XSRF scenarios.
                if (referer && !partnerUriRegexp.test(referer)) {
                    var refererHostname = url.parse(referer).hostname;
                    var feHostname = url.parse(urlLib.getFe()).hostname;
                    var apiHostname = url.parse(urlLib.getApi()).hostname;

                    if (refererHostname !== feHostname && refererHostname !== apiHostname) {
                        logger.warn('Possible XSRF attempt! Referer header does not match expected partner URI scheme', referer, req.path, reqQuery, !partnerUriRegexp.test(referer), refererHostname, apiHostname, feHostname);

                        return res.status(400).send('Invalid referer. Referer header does not match expected partner URI scheme.');
                    }
                }

                if (!redirectUri || !partnerUriRegexp.test(redirectUri)) {
                    return res.status(400).send('Invalid or missing "redirect_uri" parameter value.');
                }

                if (redirectUri.indexOf('#') > -1) {
                    return res.status(400).send('Invalid "redirect_uri". Cannot contain fragment component "#".');
                }

                // Now that we have verified "redirect_uri" and "client_id" we can start redirecting to the "redirect_uri" with errors/successes
                // response_type
                if (!responseType || (responseType !== 'id_token token' && responseType !== 'token id_token')) {
                    return handleOpenIdErrorRedirect(
                        res,
                        redirectUri,
                        'unsupported_response_type',
                        'Unsupported "response_type" parameter value. Only "token id_token" is supported.',
                        state
                    );
                }

                // scope - 'openid' is required for OpenID flow, right now no other scopes are supported
                if (!scope || scope !== 'openid') {
                    return handleOpenIdErrorRedirect(
                        res,
                        redirectUri,
                        'invalid_scope',
                        'Unsupported "scope" parameter value. Only "openid" is supported.',
                        state
                    );
                }

                // nonce
                if (!nonce || nonce.length < 14) {
                    return handleOpenIdErrorRedirect(
                        res,
                        redirectUri,
                        'invalid_request',
                        'Invalid or missing "nonce" parameter value. "nonce" must be a random string with at least 14 characters of length.',
                        state,
                        'http://openid.net/specs/openid-connect-implicit-1_0.html#RequestParameters'
                    );
                }

                // User logged in
                if (req.user && req.user.id) {
                    return UserConsent
                        .count({
                            where: {
                                userId: req.user.id,
                                partnerId: clientId
                            }
                        })
                        .then(function (count) {
                            // User connection exits
                            if (count) {
                                // IF User is logged in to CitizenOS AND has agreed before -> redirect_uri
                                var accessToken = jwt.sign(
                                    {
                                        id: req.user.id,
                                        partnerId: clientId,
                                        scope: 'partner'
                                    },
                                    config.session.privateKey,
                                    {
                                        expiresIn: '7 days',
                                        algorithm: config.session.algorithm
                                    }
                                );
                                var accessTokenHash = cryptoLib.getAtHash(accessToken, 'sha' + config.session.algorithm.match(/[0-9]*$/)[0]);

                                // ID Token - http://openid.net/specs/openid-connect-implicit-1_0.html#IDToken
                                var idToken = jwt.sign({
                                    iss: urlLib.getApi(), // issuer
                                    sub: req.user.id, // subject
                                    aud: clientId, // audience
                                    exp: parseInt(new Date().getTime() / 1000 + (5 * 60 * 1000), 10), // expires - 5 minutes from now
                                    nonce: nonce,
                                    at_hash: accessTokenHash
                                }, config.session.privateKey, {algorithm: config.session.algorithm});

                                var params = {
                                    access_token: accessToken,
                                    id_token: idToken,
                                    state: state
                                };

                                // Clear state cookies as we are done with the authorization
                                clearStateCookie(res, COOKIE_NAME_OPENID_AUTH_STATE);
                                clearStateCookie(res, COOKIE_NAME_COS_AUTH_STATE);

                                return res.redirect(redirectUri + '#' + querystring.stringify(params));
                            } else {
                                // IF User is logged in to CitizenOS AND has NOT agreed before -> /consent?redirect_uri -> redirect_uri
                                setStateCookie(req, res, COOKIE_NAME_OPENID_AUTH_STATE);

                                return res.redirect(urlLib.getFe('/:language/partners/:partnerId/consent', {
                                    partnerId: clientId,
                                    language: uiLocales
                                }));
                            }
                        });
                } else { // User NOT logged in
                    setStateCookie(req, res, COOKIE_NAME_OPENID_AUTH_STATE, true);

                    return res.redirect(urlLib.getFe('/:language/partners/:partnerId/login', {
                        partnerId: clientId,
                        language: uiLocales
                    }));
                }
            })
            .catch(next);
    });


    /**
     * Cancel Open ID authorization flow
     */
    app.get('/api/auth/openid/cancel', function (req, res) {
        var stateCookieData = getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE);
        if (!stateCookieData) {
            logger.warn('Open ID authorization flow has not been started', req.path, req.cookies);

            return res.badRequest('Open ID Authorization flow has not been started.');
        }

        var redirectUri = stateCookieData.redirect_uri;

        clearStateCookie(res, COOKIE_NAME_COS_AUTH_STATE);
        handleOpenIdErrorRedirect(res, redirectUri, 'access_denied', 'The resource owner or authorization server denied the request.', stateCookieData.state);
    });

};
