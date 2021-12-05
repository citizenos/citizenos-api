'use strict';

module.exports = function (app) {

    const logger = app.get('logger');
    const cryptoLib = app.get('cryptoLib');
    const smartId = app.get('smartId');
    const loginCheck = app.get('middleware.loginCheck');
    const emailLib = app.get('email');
    const validator = app.get('validator');
    const util = app.get('util');
    const config = app.get('config');
    const passport = app.get('passport');
    const models = app.get('models');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const cosActivities = app.get('cosActivities');
    const jwt = app.get('jwt');
    const objectEncrypter = app.get('objectEncrypter');
    const querystring = app.get('querystring');
    const urlLib = app.get('urlLib');
    const superagent = app.get('superagent');
    const url = app.get('url');
    const mobileId = app.get('mobileId');
    const speedLimiter = app.get('speedLimiter');
    const rateLimiter = app.get('rateLimiter');

    const User = models.User;
    const UserConnection = models.UserConnection;
    const UserConsent = models.UserConsent;
    const Partner = models.Partner;

    const COOKIE_NAME_OPENID_AUTH_STATE = 'cos.authStateOpenId';
    const COOKIE_NAME_COS_AUTH_STATE = 'cos.authState';

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
    const setStateCookie = function (req, res, cookieName, allowOverwrite) {
        if (!req.cookies[cookieName] || allowOverwrite) {
            const allowedFields = ['response_type', 'client_id', 'redirect_uri', 'scope', 'nonce', 'state', 'ui_locales', 'redirectSuccess'];
            const filtered = Object.entries(req.query).filter(([key, value]) => allowedFields.indexOf(key) > -1);

            const params = Object.fromEntries(filtered);
            if (Object.keys(params).length) {
                const stateCookieData = jwt.sign(params, config.session.privateKey, {algorithm: config.session.algorithm});
                res.cookie(cookieName, stateCookieData, Object.assign({secure: req.secure}, config.session.cookie));
            }
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
    const getStateCookie = function (req, cookieName) {
        const stateCookie = req.cookies[cookieName]; // FIXME: cookie name from config?
        if (stateCookie) { // Don't use the state cookie when req.query parameters are there. For the case a new authorization is started.
            let stateCookieData;
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
    const clearStateCookie = function (res, cookieName) {
        res.clearCookie(cookieName, {
            path: config.session.cookie.path,
            domain: config.session.cookie.domain
        });
    };

    const handleOpenIdErrorRedirect = function (res, redirectUri, error, errorDescription, state, errorUri) {

        clearStateCookie(res, COOKIE_NAME_OPENID_AUTH_STATE);

        if (redirectUri.indexOf('#') < 0) {
            redirectUri += '#';
        }

        const errorObj = {
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

    app.post('/api/auth/signup', async function (req, res, next) {
        const email = req.body.email || ''; // HACK: Sequelize validate() is not run if value is "null". Also cannot use allowNull: false as I don' want constraint in DB. https://github.com/sequelize/sequelize/issues/2643
        const password = req.body.password || ''; // HACK: Sequelize validate() is not run if value is "null". Also cannot use allowNull: false as I don' want constraint in DB. https://github.com/sequelize/sequelize/issues/2643
        const name = req.body.name || util.emailToDisplayName(req.body.email);
        const company = req.body.company;
        const language = req.body.language;
        const redirectSuccess = req.body.redirectSuccess || urlLib.getFe();
        const preferences = req.body.preferences;

        let created = false;
        try {
            let user = await User
                .findOne({
                    where: db.where(db.fn('lower', db.col('email')), db.fn('lower',email))
                });
            if (user) {
                // IF password is null, the User was created through an invite. We allow an User to claim the account.
                if (user.password) {
                    // Email address is already in use.
                    return res.ok('Check your email ' + email + ' to verify your account.');
                }
                user.password = password;

                await user.save({fields: ['password']});
            } else {
                try {
                    await db.transaction(async function (t) {
                        [user, created] = await User
                            .findOrCreate({
                                where: db.where(db.fn('lower', db.col('email')), db.fn('lower',email)), // Well, this will allow user to log in either using User and pass or just Google.. I think it's ok..
                                defaults: {
                                    name,
                                    email,
                                    password,
                                    company,
                                    source: User.SOURCES.citizenos,
                                    language,
                                    preferences
                                },
                                transaction: t
                            });
                        if (created) {
                            logger.info('Created a new user', user.id);
                            await cosActivities.createActivity(user, null, {
                                type: 'User',
                                id: user.id,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                        }

                        const uc = await UserConnection
                            .create({
                                userId: user.id,
                                connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                connectionUserId: user.id,
                                connectionData: user
                            }, {
                                transaction: t
                            });

                        return cosActivities.addActivity(uc, {
                            type: 'User',
                            id: user.id,
                            ip: req.ip
                        }, null, user, req.method + ' ' + req.path, t);
                    });
                } catch(err) {
                    return next(err);
                }
            }

            if (user) {
                if (user.emailIsVerified) {
                    setAuthCookie(req, res, user.id);

                    return res.ok({redirectSuccess});
                } else {
                    // Store redirect url in the token so that /api/auth/verify/:code could redirect to the url late
                    const tokenData = {
                        redirectSuccess // TODO: Misleading naming, would like to use "redirectUri" (OpenID convention) instead, but needs RAA.ee to update codebase.
                    };

                    const token = jwt.sign(tokenData, config.session.privateKey, {algorithm: config.session.algorithm});
                    await emailLib.sendAccountVerification(user.email, user.emailVerificationCode, token);

                    return res.ok('Check your email ' + user.email + ' to verify your account.', user.toJSON());
                }
            } else {
                return res.ok('Check your email ' + email + ' to verify your account.');
            }
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Set the authorization cookie, can also be viewed as starting a session
     *
     * @param {object} req Express request object
     * @param {object} res Express response object
     * @param {string} userId User id
     * @returns {cookie} data
     *
     * @see http://expressjs.com/en/4x/api.html#res
     */
    const setAuthCookie = function (req, res, userId) {
        const authToken = jwt.sign({
            id: userId,
            scope: 'all'
        }, config.session.privateKey, {
            expiresIn: config.session.cookie.maxAge,
            algorithm: config.session.algorithm
        });
        res.cookie(config.session.name, authToken, Object.assign({secure: req.secure}, config.session.cookie));
    };

    const clearSessionCookies = function (req, res) {
        res.clearCookie(config.session.name, {
            path: config.session.cookie.path,
            domain: config.session.cookie.domain
        });
    };

    /**
     * Login
     */
    app.post('/api/auth/login', rateLimiter(15), speedLimiter(10), function (req, res) {
        passport.authenticate('local', function (err, user) {
            if (err || !user) {
                return res.badRequest(err?.message, err?.code);
            }

            setAuthCookie(req, res, user.id);

            return res.ok(user);
        })(req, res);
    });


    app.post('/api/auth/logout', function (req, res) {
        clearSessionCookies(req, res);

        return res.ok();
    });

    app.get('/api/auth/verify/:code', async function (req, res) {
        const code = req.params.code;
        const token = req.query.token;

        let redirectSuccess = urlLib.getFe('/');
        if (token) {
            const tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
            if (tokenData.redirectSuccess) {
                redirectSuccess = tokenData.redirectSuccess;
            }
        }
        try {
            const result = await User
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
                );
            // Result[0] - rows, result[1] - updated rows
            // Result is array with the count of affected rows. For PG also possible to return affected rows
            if (result && result.length && !result[1] && !result[1].length) { // 0 rows updated.
                logger.warn('Email verification ended up updating 0 rows. Hackers or new verification code has been generated in between?');

                return res.redirect(302, redirectSuccess + '?error=emailVerificationFailed');
            }

            if (getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE)) { // We are in the middle of OpenID authorization flow
                return res.redirect(urlLib.getApi('/api/auth/openid/authorize'));
            } else {
                return res.redirect(302, redirectSuccess);
            }
        } catch (err) {
            logger.warn('Sequelize DB error', err);
            // TODO: Not the sweetest solution for PG throwing "SequelizeDatabaseError: error: invalid input syntax for uuid: "columnName"".
            // TODO: Probably not required when TEXT type is used instead of UUID as then PG validation would not kick in.

            return res.redirect(302, redirectSuccess + '?error=emailVerificationFailed');
        }
    });


    app.post('/api/auth/password', loginCheck(), async function (req, res, next) {
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        try {
            const user = await User
                .findOne({
                    where: {
                        id: req.user.id
                    }
                });

            if (!user || user.password !== cryptoLib.getHash(currentPassword, 'sha256')) {
                return res.badRequest('Invalid email or new password.');
            }

            user.password = newPassword;

            await user.save({fields: ['password']});

            return res.ok();
        } catch (err) {
            return next(err);
        }
    });


    app.post('/api/auth/password/reset/send', async function (req, res, next) {
        const email = req.body.email;
        if (!email || !validator.isEmail(email)) {
            return res.badRequest({email: 'Invalid email'});
        }
        try {
            const user = await User.findOne({
                where: db.where(db.fn('lower', db.col('email')), db.fn('lower',email))
            });

            if (!user) {
                return res.ok('Success! Please check your email :email to complete your password recovery.'.replace(':email', email));
            }

            user.passwordResetCode = true; // Model will generate new code

            await user.save({fields: ['passwordResetCode']});

            await emailLib.sendPasswordReset(user.email, user.passwordResetCode);

            return res.ok('Success! Please check your email :email to complete your password recovery.'.replace(':email', email));
        } catch (err) {
            return next(err);
        }
    });


    app.post('/api/auth/password/reset', async function (req, res, next) {
        const email = req.body.email;
        const password = req.body.password;
        const passwordResetCode = req.body.passwordResetCode;
        try {
            const user = await User.findOne({
                where: {
                    [Op.and]: [
                        db.where(db.fn('lower', db.col('email')), db.fn('lower',email)),
                        db.where(db.col('passwordResetCode'), passwordResetCode)
                    ]
                }
            });

            // !user.passwordResetCode avoids the situation where passwordResetCode has not been sent (null), but user posts null to API
            if (!user || !user.passwordResetCode) {
                return res.badRequest('Invalid email, password or password reset code.');
            }

            user.password = password; // Hash is created by the model hooks
            user.passwordResetCode = true; // Model will generate new code so that old code cannot be used again - https://github.com/citizenos/citizenos-api/issues/68

            await user.save({fields: ['password', 'passwordResetCode']});
            //TODO: Logout all existing sessions for the User!
            return res.ok();
        } catch (err) {
            return next(err);
        }

    });


    /**
     * Get logged in User info
     *
     * @deprecated Use GET /api/users/self instead.
     */
    app.get('/api/auth/status', loginCheck(['partner']), async function (req, res, next) {
        try {
            const path = require('path');

            const user = await User.findOne({
                where: {
                    id: req.user.id
                }
            });

            if (!user) {
                clearSessionCookies(req, res);

                return res.notFound();
            }
            const userData = user.toJSON();
            userData.termsVersion = user.dataValues.termsVersion;
            userData.termsAcceptedAt = user.dataValues.termsAcceptedAt;
            userData.preferences = user.dataValues.preferences;

            return res.ok(userData);
        } catch (err) {
            return next(err);
        }
    });


    app.post('/api/auth/smartid/init', async function (req, res, next) {
        const pid = req.body.pid;
        const countryCode = req.body.countryCode;

        if (!pid) {
            return res.badRequest('Smart-ID athentication requires users pid', 1);
        }
        try {
            const sessionData = await smartId.authenticate(pid, countryCode);
            const sessionDataEncrypted = {sessionDataEncrypted: objectEncrypter(config.session.secret).encrypt(sessionData)};
            const token = jwt.sign(sessionDataEncrypted, config.session.privateKey, {
                expiresIn: '5m',
                algorithm: config.session.algorithm
            });

            return res.ok({
                challengeID: sessionData.challengeID,
                token: token
            }, 1);
        } catch(e) {
            if (e.code === 404) {
                return res.notFound();
            }
            if (e.code === 400) {
                return res.badRequest();
            }

            return next(e);
        }
    });

    const _getUserByPersonalId = async function (personalInfo, connectionId, req, transaction) {
        let t;
        let toCommit = false;
        let personId = personalInfo.pid;
        if (personalInfo.pid.indexOf('PNO') > -1) {
            personId = personId.split('-')[1];
        }
        const countryCode = personalInfo.country || personalInfo.countryCode;

        if (!transaction) {
            t = await db.transaction();
            toCommit = true;
        } else {
            t = transaction;
        }
        try {
            const userConnectionInfo = await UserConnection.findOne({
                where: {
                    connectionId: {
                        [Op.in]: [
                            UserConnection.CONNECTION_IDS.esteid,
                            UserConnection.CONNECTION_IDS.smartid
                        ]
                    },
                    connectionUserId: {
                        [Op.like]: '%' + personId + '%',
                    }
                },
                order: [['createdAt', 'ASC']],
                include: [User],
                transaction: t
            });

            if (!userConnectionInfo) {
                const user = await User.create(
                    {
                        name: db.fn('initcap', personalInfo.firstName + ' ' + personalInfo.lastName),
                        source: User.SOURCES.citizenos
                    },
                    {
                        transaction: t
                    });

                await cosActivities.createActivity(user, null, {
                        type: 'System',
                        ip: req.ip
                    }, req.method + ' ' + req.path, t);

                await UserConnection.create(
                    {
                        userId: user.id,
                        connectionId: connectionId,
                        connectionUserId: `PNO${countryCode}-${personId}`,
                        connectionData: personalInfo
                    },
                    {
                        transaction: t
                    }
                );
                if (toCommit) t.commit();
                let userData = user.toJSON();
                userData.termsVersion = user.dataValues.termsVersion;
                userData.termsAcceptedAt = user.dataValues.termsAcceptedAt;
                userData.preferences = user.dataValues.preferences;

                return [userData, 3]; // New user was created
            } else {
                if (toCommit) t.commit();
                const idPattern = new RegExp(`^(PNO${countryCode}-)?${personId}$`);
                if (userConnectionInfo && idPattern.test(userConnectionInfo.connectionUserId)) {
                    const user = userConnectionInfo.User;
                    const userData = user.toJSON();
                    userData.termsVersion = user.dataValues.termsVersion;
                    userData.termsAcceptedAt = user.dataValues.termsAcceptedAt;
                    userData.preferences = user.dataValues.preferences;

                    return [userData, 2]; // Existing User found and logged in
                }
            }
        } catch (error) {
            if (toCommit) t.rollback();
            logger.error(error);
        }
    };

    app.get('/api/auth/smartid/status', async function (req, res, next) {
        const token = req.query.token;
        const timeoutMs = req.query.timeoutMs || 5000;

        if (!token) {
            return res.badRequest('Smart-ID signing has not been started. "token" is required.', 2);
        }

        const tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
        const loginSmartIdFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);
        let personalInfo;
        try {
            const response = await smartId.statusAuth(loginSmartIdFlowData.sessionId, loginSmartIdFlowData.sessionHash, timeoutMs);

            if (response.error) {
                return res.badRequest(response.error.message, response.error.code);
            } else if (response.state === 'RUNNING') {
                return res.ok('Log in progress', 1);
            } else if (response.state === 'COMPLETE') {
                switch (response.result.endResult) {
                    case 'OK':
                        personalInfo = response.personalInfo;
                        break;
                    case 'USER_REFUSED':
                        return res.badRequest('User refused', 10);
                    case 'TIMEOUT':
                        return res.badRequest('The transaction has expired', 11);
                    default:
                        return res.badRequest(response);
                }
            } else {
                return res.badRequest(response);
            }

            const userData = await _getUserByPersonalId(personalInfo, UserConnection.CONNECTION_IDS.smartid, req);
            const user = userData[0];
            const created = userData[1];
            setAuthCookie(req, res, user.id);

            return res.ok(user, created);
        } catch(error) {
            if (error && error.name === 'ValidationError') {
                return res.badRequest(error.message);
            }
            return next(error);
        }
    });

    const idCardAuth = async function (req, res, next) {
        const cert = req.headers['x-ssl-client-cert'];
        const token = req.query.token || req.body.token; // Token to access the ID info service

        if (config.services.idCard && cert) {
            logger.error('X-SSL-Client-Cert header is not allowed when ID-card service is enabled. IF you trust your proxy, sending the X-SSL-Client-Cert, delete the services.idCard from your configuration.');
            return res.badRequest('X-SSL-Client-Cert header is not allowed when ID-card proxy service is enabled.');
        }
        if (!token && !cert) {
            logger.warn('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!', req.path, req.headers);
            return res.badRequest('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!');
        }

        try {
            let personalInfo;
            if (cert) {
                let clientCert = cert;
                if(cert.indexOf('-----BEGIN') > -1) {
                    clientCert = cert.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '')
                }
                await mobileId.validateCert(clientCert, 'base64');
                personalInfo = await mobileId.getCertUserData(clientCert, 'base64');
                personalInfo.countryCode = personalInfo.country;
                delete personalInfo.country;
            } else {
                const idReq = await superagent.get(config.services.idCard.serviceUrl)
                    .query({token})
                    .set('X-API-KEY', config.services.idCard.apiKey)
                    .catch(function (error) {
                        if (error && error.response && error.response.body) {
                            return res.badRequest(error.response.body.status.message);
                        } else {
                            throw new Error(error);
                        }
                    });

                    personalInfo = idReq.body.data.user
            }

            const userData = await _getUserByPersonalId(personalInfo, UserConnection.CONNECTION_IDS.esteid, req);
            const user = userData[0];
            const created = userData[1];
            setAuthCookie(req, res, user.id);

            return res.ok(user, created);

        } catch(e) {
            if (e.name === 'ValidationError') {
                return res.badRequest(e.message);
            }

            return next(e);
        }
    };

    /**
     * Authenticate using ID-card
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
        const pid = req.body.pid;
        const phoneNumber = req.body.phoneNumber;

        if (!pid || !phoneNumber) {
            return res.badRequest('mID athentication requires users phoneNumber+pid', 1);
        }

        mobileId
            .authenticate(pid, phoneNumber, null)
            .then(function (sessionData) {
                const sessionDataEncrypted = {sessionDataEncrypted: objectEncrypter(config.session.secret).encrypt(sessionData)};
                const token = jwt.sign(sessionDataEncrypted, config.session.privateKey, {
                    expiresIn: '5m',
                    algorithm: config.session.algorithm
                });

                return res.ok({
                    challengeID: sessionData.challengeID,
                    token: token
                }, 1);
            })
            .catch(function (e) {
                if (e.code === 400) {
                    return res.badRequest(e.message);
                }
                if (e.code === 404) {
                    return res.notFound();
                }

                return next(e);
            });
    });


    /**
     * Check Mobiil-ID authentication status
     *
     * Authentication is initialized with /api/auth/mid/init, after that client is polling this endpoint for authentication status. In case of success, User session is created and logged in.
     */
    app.get('/api/auth/mobile/status', async function (req, res, next) {
        const token = req.query.token;
        const timeoutMs = req.query.timeoutMs || 5000;
        if (!token) {
            return res.badRequest('Mobile ID signing has not been started. "token" is required.', 2);
        }

        const tokenData = jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]});
        const loginMobileFlowData = objectEncrypter(config.session.secret).decrypt(tokenData.sessionDataEncrypted);
        try {
            const authResult = await mobileId.statusAuth(loginMobileFlowData.sessionId, loginMobileFlowData.sessionHash, timeoutMs);
            let statusCode;
            if (authResult.result) {
                statusCode = authResult.result;
            } else {
                statusCode = authResult.state;
            }

            switch (statusCode) {
                case 'RUNNING':
                    return res.ok('Log in progress', 1);
                case 'OK':
                    break;
                case 'TIMEOUT':
                    logger.error('There was a timeout, i.e. end user did not confirm or refuse the operation within maximum time frame allowed (can change, around two minutes).', statusCode);
                    return res.badRequest('There was a timeout, i.e. end user did not confirm or refuse the operation within maximum time frame allowed (can change, around two minutes).', 10);
                case 'NOT_MID_CLIENT':
                    return res.badRequest('Mobile-ID functionality of the phone is not yet ready', 13);
                case 'USER_CANCELLED':
                    return res.badRequest('User has cancelled the log in process', 10);
                case 'SIGNATURE_HASH_MISMATCH':
                    return res.badRequest('Signature is not valid', 12);
                case 'PHONE_ABSENT':
                    return res.badRequest('Delivery of the message was not successful, mobile phone is probably switched off or out of coverage;', 14);
                case 'DELIVERY_ERROR':
                    return res.badRequest('Other error when sending message (phone is incapable of receiving the message, error in messaging server etc.)', 15);
                case 'SIM_ERROR':
                    return res.badRequest('SIM application error.', 16);
                default:
                    logger.error('Unknown status code when trying to log in with mobile', authResult.result);
                    return res.internalServerError();
            }
            if (authResult.personalInfo) {
                const userData = await _getUserByPersonalId(authResult.personalInfo, UserConnection.CONNECTION_IDS.esteid, req);
                const user = userData[0];
                const created = userData[1];
                setAuthCookie(req, res, user.id);

                return res.ok(user, created);
            }
        } catch (error) {
            if (error && error.name === 'ValidationError') {
                return res.badRequest(error.message);
            }

            return next(error);
        }
    });


    const handleCallbackRedirect = function (req, res) {
        if (getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE)) { // We are in the middle of OpenID authorization flow
            // This is used to get rid of Referer header from FB/Google callback. If I sent 302, the referer would be FB/Google and XSRF check on the /api/auth/openid/authorize would fail.
            res.status(200).send('<!doctype html><html><head><meta http-equiv="refresh" content="0;URL=\'/api/auth/openid/authorize\'" /></head><body></body></html>');
        } else {
            const stateData = getStateCookie(req, COOKIE_NAME_COS_AUTH_STATE);
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
            setAuthCookie(req, res, req.user.id);
            handleCallbackRedirect(req, res);
        }
    );


    app.get(config.passport.facebook.url, function (req, res, next) {
        // Store original request in a cookie, so that we know where to redirect back on callback from the partner (FB, Google...)
        setStateCookie(req, res, COOKIE_NAME_COS_AUTH_STATE);

        passport.authenticate('facebook', {
            scope: ['email'],
            display: req.query.display ? 'popup' : null
        })(req, res, next);
    });


    app.get(
        config.passport.facebook.callbackUrl,
        passport.authenticate('facebook', {
            failureRedirect: urlLib.getFe('/account/login')
        }),
        function (req, res) {
            setAuthCookie(req, res, req.user.id);
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
        let reqQuery = req.query;

        // We store original authorization state in a state cookie so that after whatever login/register flow, we know where it all began.
        // This means that every login/register will redirect back to this endpoint again and this is the only place where flow decisions are made.
        const stateCookieData = getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE);
        if (stateCookieData && !Object.keys(req.query).length) { // Ignore cookie when request parameters are provided, means new authorization flow has been started
            reqQuery = stateCookieData;
        }

        // Ugh, using camelCase in all the other places, but OpenID/OAuth dictates snake_case.
        const responseType = reqQuery.response_type; //id_token token
        const clientId = reqQuery.client_id;
        const redirectUri = reqQuery.redirect_uri;
        const scope = reqQuery.scope;
        const nonce = reqQuery.nonce;
        const state = reqQuery.state;
        const uiLocales = reqQuery.ui_locales ? reqQuery.ui_locales.split(' ')[0] : 'en';
        const referer = req.headers.referer;

        /**
         * If "client_id" OR "redirect_uri" is invalid, thou shall not redirect to "redirect_uri"
         *
         * @see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
         */
        const uuidV4Regexp = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
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

                const partnerUriRegexp = new RegExp(partner.redirectUriRegexp, 'i');

                // Check referer IF it exists, not always true. May help in some XSRF scenarios.
                if (referer && !partnerUriRegexp.test(referer)) {
                    const refererHostname = url.parse(referer).hostname;
                    const feHostname = url.parse(urlLib.getFe()).hostname;
                    const apiHostname = url.parse(urlLib.getApi()).hostname;

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
                                const accessToken = jwt.sign(
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
                                const accessTokenHash = cryptoLib.getAtHash(accessToken, 'sha' + config.session.algorithm.match(/[0-9]*$/)[0]);

                                // ID Token - http://openid.net/specs/openid-connect-implicit-1_0.html#IDToken
                                const idToken = jwt.sign(
                                    {
                                        iss: urlLib.getApi(), // issuer
                                        sub: req.user.id, // subject
                                        aud: clientId, // audience
                                        exp: parseInt(new Date().getTime() / 1000 + (5 * 60 * 1000), 10), // expires - 5 minutes from now
                                        nonce: nonce,
                                        at_hash: accessTokenHash
                                    },
                                    config.session.privateKey,
                                    {algorithm: config.session.algorithm}
                                );

                                const params = {
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
        const stateCookieData = getStateCookie(req, COOKIE_NAME_OPENID_AUTH_STATE);
        if (!stateCookieData) {
            logger.warn('Open ID authorization flow has not been started', req.path, req.cookies);

            return res.badRequest('Open ID Authorization flow has not been started.');
        }

        const redirectUri = stateCookieData.redirect_uri;

        clearStateCookie(res, COOKIE_NAME_COS_AUTH_STATE);
        handleOpenIdErrorRedirect(res, redirectUri, 'access_denied', 'The resource owner or authorization server denied the request.', stateCookieData.state);
    });

    return {
        getUserByPersonalId: _getUserByPersonalId
    }
};
