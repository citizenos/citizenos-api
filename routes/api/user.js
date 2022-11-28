'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;

    const logger = app.get('logger');
    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const emailLib = app.get('email');
    const config = app.get('config');
    const cosActivities = app.get('cosActivities');
    const urlLib = app.get('urlLib');
    const jwt = app.get('jwt');
    const uuid = app.get('uuid');
    const moment = app.get('moment');
    const validator = app.get('validator');
    const cryptoLib = app.get('cryptoLib');
    const cosUpload = app.get('cosUpload');
    const authUser = require('./auth')(app);
    const passport = app.get('passport');

    const fs = require('fs');
    const path = require('path');
    const User = models.User;
    const UserConsent = models.UserConsent;
    const UserConnection = models.UserConnection;
    const UserNotificationSettings = models.UserNotificationSettings;
    const Op = db.Sequelize.Op;

    app.post('/api/users/:userId/upload', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        let user = await User.findOne({
            where: {
                id: req.user.id
            }
        });

        if (user) {
            let imageUrl;

            try {
                imageUrl = await cosUpload.upload(req, 'users', req.user.id);
            } catch (err) {
                if (err.type && (err.type === 'fileSize' || err.type === 'fileType')) {
                    return res.forbidden(err.message);
                } else {
                    throw err;
                }
            }

            await User.update(
                {
                    imageUrl: imageUrl.link
                },
                {
                    where: {
                        id: req.user.id
                    },
                    limit: 1,
                    returning: true
                }
            );

            return res.created(imageUrl);
        } else {
            res.forbidden();
        }
    }));

    /**
     * Update User info
     */
    app.put('/api/users/:userId', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const fields = ['name', 'company', 'email', 'language', 'imageUrl', 'termsVersion', 'preferences'];
        const data = req.body;
        if (!req.user.partnerId && data.password && data.newPassword) { // Allow only our own app change the password
            fields.push('password');
        }
        let updateEmail = false;

        let user = await User.findOne({
            where: {
                id: req.user.userId
            }
        });

        if (data.email && data.email !== user.email) {
            updateEmail = true;
            fields.push('emailIsVerified');
            fields.push('emailVerificationCode');
            data.emailIsVerified = false;
            data.emailVerificationCode = uuid.v4(); // Generate new emailVerificationCode
        }
        if (data.termsVersion && data.termsVersion !== user.termsVersion) {
            fields.push('termsAcceptedAt');
            data.termsAcceptedAt = moment().format();
        }

        if ((user.email && updateEmail) || data.newPassword) {
            if (!data.password || user.password !== cryptoLib.getHash(data.password, 'sha256')) {
                return res.badRequest('Invalid password')
            }
            if (data.newPassword) {
                data.password = data.newPassword;
            }
        }

        if (Object.keys(data).indexOf('imageUrl') > -1 && !data.imageUrl && user.imageUrl) {
            const currentImageURL = new URL(user.imageUrl);
            //FIXME: No delete from DB?
            if (config.storage?.type.toLowerCase() === 's3' && currentImageURL.href.indexOf(`https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/users/${req.user.id}`) === 0) {
                await cosUpload.delete(currentImageURL.pathname)
            } else if (config.storage?.type.toLowerCase() === 'local' && currentImageURL.hostname === (new URL(config.url.api)).hostname) {
                const appDir = __dirname.replace('/routes/api', '/public/uploads/users');
                const baseFolder = config.storage.baseFolder || appDir;

                fs.unlinkSync(`${baseFolder}/${path.parse(currentImageURL.pathname).base}`);
            }
        }
        const results = await User.update(
            data,
            {
                where: {
                    id: req.user.userId
                },
                fields: fields,
                limit: 1,
                returning: true
            }
        );

        if (!results[1]) {
            return res.ok();
        }

        user = results[1][0];

        if (updateEmail) {
            await UserConnection.update({
                connectionData: user
            }, {
                where: {
                    connectionId: UserConnection.CONNECTION_IDS.citizenos,
                    userId: user.id
                }
            });
            const tokenData = {
                redirectSuccess: urlLib.getFe() // TODO: Misleading naming, would like to use "redirectUri" (OpenID convention) instead, but needs RAA.ee to update codebase.
            };

            const token = jwt.sign(tokenData, config.session.privateKey, {algorithm: config.session.algorithm});

            await emailLib.sendAccountVerification(user.email, user.emailVerificationCode, token);
        }

        return res.ok(user.toJSON());
    }));

    /**
     * Get User info
     *
     * Right now only supports getting info for logged in User
     */
    app.get('/api/users/:userId', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const user = await User.findOne({
            where: {
                id: req.user.userId
            }
        });

        if (!user) {
            return res.notFound();
        }

        return res.ok(user.toJSON());
    }));

    /**
     * Delete User
     */
    app.delete('/api/users/:userId', loginCheck(), asyncMiddleware(async function (req, res) {
        const user = await User
            .findOne({
                where: {
                    id: req.user.userId
                }
            });

        if (!user) {
            return res.notFound();
        }

        await db
            .transaction(async function (t) {
                await User.update(
                    {
                        name: 'Anonymous',
                        email: null,
                        company: null,
                        imageUrl: null,
                        sourceId: null

                    },
                    {
                        where: {
                            id: req.user.userId
                        },
                        limit: 1,
                        returning: true,
                        transaction: t
                    }
                );

                await User.destroy({
                    where: {
                        id: req.user.userId
                    },
                    transaction: t
                });

                await UserConnection.destroy({
                    where: {
                        userId: req.user.userId
                    },
                    force: true,
                    transaction: t
                });

                t.afterCommit(() => {
                    return res.ok();
                });
            });
    }));
    /**
     * Create UserConsent
     */
    app.post('/api/users/:userId/consents', loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;
        const partnerId = req.body.partnerId;

        await db
            .transaction(async function (t) {
                const created = await UserConsent.upsert(
                    {
                        userId: userId,
                        partnerId: partnerId
                    },
                    {
                        transaction: t
                    }
                );

                if (created) {
                    const userConsent = UserConsent.build({
                        userId: userId,
                        partnerId: partnerId
                    });

                    await cosActivities
                        .createActivity(
                            userConsent,
                            null,
                            {
                                type: 'User',
                                id: userId,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
                }

                t.afterCommit(() => {
                    return res.ok();
                });
            });
    }));

    /**
     * Read User consents
     */
    app.get('/api/users/:userId/consents', loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;

        const results = await db.query(
            `
                SELECT
                    p.id,
                    p.website,
                    p."createdAt",
                    p."updatedAt"
                FROM "UserConsents" uc
                LEFT JOIN "Partners" p ON (p.id = uc."partnerId")
                WHERE uc."userId" = :userId
                    AND uc."deletedAt" IS NULL
                ;`,
            {
                replacements: {
                    userId: userId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
        );

        return res.ok({
            count: results.length,
            rows: results
        });
    }));

    /**
     * Delete User consent
     */
    app.delete('/api/users/:userId/consents/:partnerId', loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;
        const partnerId = req.params.partnerId;

        await db.transaction(async function (t) {
            await UserConsent.destroy(
                {
                    where: {
                        userId: userId,
                        partnerId: partnerId
                    },
                    limit: 1,
                    force: true
                },
                {
                    transaction: t
                }
            );

            const consent = UserConsent.build({
                userId: userId,
                partnerId: partnerId
            });

            await cosActivities.deleteActivity(
                consent,
                null,
                {
                    type: 'User',
                    id: req.user.userId,
                    ip: req.ip
                },
                req.method + ' ' + req.path,
                t
            );
            t.afterCommit(() => {
                return res.ok();
            });
        });
    }));


    /**
     * Get UserConnections
     *
     * Get UserConnections, that is list of methods User can use to authenticate.
     */
    app.get('/api/users/:userId/userconnections', asyncMiddleware(async function (req, res) {
        const userId = req.params.userId;
        let where;

        if (validator.isUUID(userId)) {
            const user = await User.findOne({
                where: {
                    id: userId
                },
                attributes: ['id']
            });

            if (!user) {
                return res.notFound();
            }

            where = {
                userId: userId
            }
        } else if (validator.isEmail(userId)) {
            const user = await User.findOne({
                where: {
                    email: userId
                },
                attributes: ['id']
            });

            if (!user) {
                return res.notFound();
            }

            where = {
                userId: user.id
            }
        } else {
            return res.badRequest('Invalid userId', 1);
        }

        const userConnections = await UserConnection.findAll({
            where: where,
            attributes: ['connectionId'],
            order: [[db.cast(db.col('connectionId'), 'TEXT'), 'ASC']] // Cast as we want alphabetical order, not enum order.
        });

        if (!userConnections || !userConnections.length) {
            return res.ok({
                count: 0,
                rows: []
            });
        }

        return res.ok({
            count: userConnections.length,
            rows: userConnections
        });
    }));

    app.get('/api/users/:userId/userconnections/:connection', function (req, res, next) {
        const connection = req.params.connection;

        if (connection === UserConnection.CONNECTION_IDS.google) {
            return passport.authenticate('google', {
                scope: ['https://www.googleapis.com/auth/userinfo.email']
            })(req, res, next);
        } else if (connection === UserConnection.CONNECTION_IDS.facebook) {
            passport.authenticate('facebook', {
                scope: ['email'],
                display: req.query.display ? 'popup' : null
            })(req, res, next);
        }
    });

    app.post('/api/users/:userId/userconnections/:connection', asyncMiddleware(async function (req, res) {
        const connection = req.params.connection;
        const token = req.body.token;
        const cert = req.headers['x-ssl-client-cert'] || req.body.cert;
        const timeoutMs = req.query.timeoutMs || 5000;
        let personalInfo;

        if (!UserConnection.CONNECTION_IDS[connection]) {
            return res.badRequest('Invalid connection');
        }
        if ([UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid].indexOf(connection) > -1) {
            if (config.services.idCard && cert) {
                logger.error('X-SSL-Client-Cert header is not allowed when ID-card service is enabled. IF you trust your proxy, sending the X-SSL-Client-Cert, delete the services.idCard from your configuration.');
                return res.badRequest('X-SSL-Client-Cert header is not allowed when ID-card proxy service is enabled.');
            }
            if (!token && !cert) {
                logger.warn('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!', req.path, req.headers);
                return res.badRequest('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!');
            }
            if (cert || token.indexOf('.') === -1) {
                personalInfo = await authUser.getIdCardCertStatus(res, token, cert);
            } else {
                personalInfo = await authUser.getAuthReqStatus(connection, token, timeoutMs);
            }

            if (personalInfo === 'RUNNING') {
                return res.ok('Log in progress', 1);
            }

            let personId = personalInfo.pid;
            if (personalInfo.pid.indexOf('PNO') > -1) {
                personId = personId.split('-')[1];
            }
            const countryCode = personalInfo.country || personalInfo.countryCode;
            const connectionUserId = `PNO${countryCode}-${personId}`;
            await db.transaction(async function (t) {
                const userConnectionInfo = await UserConnection.findOne({
                    where: {
                        connectionId: {
                            [Op.in]: [
                                UserConnection.CONNECTION_IDS.esteid,
                                UserConnection.CONNECTION_IDS.smartid
                            ]
                        },
                        userId: req.user.id
                    },
                    order: [['createdAt', 'ASC']],
                    include: [User],
                    transaction: t
                });

                if (!userConnectionInfo) {
                    await UserConnection.create(
                        {
                            userId: req.user.id,
                            connectionId: connection,
                            connectionUserId: connectionUserId,
                            connectionData: personalInfo
                        },
                        {
                            transaction: t
                        }
                    );
                    t.afterCommit(async () => {
                        const userConnections = await UserConnection.findAll({
                            where: {
                                userId: req.user.id
                            },
                            attributes: ['connectionId'],
                            order: [[db.cast(db.col('connectionId'), 'TEXT'), 'ASC']] // Cast as we want alphabetical order, not enum order.
                        });

                        return res.ok({
                            count: userConnections.length,
                            rows: userConnections
                        });
                    });
                } else if (userConnectionInfo.connectionUserId !== connectionUserId) {
                    await authUser.clearSessionCookies(req, res);
                    t.afterCommit(() => {
                        return res.forbidden();
                    });
                }
            });
        } else {
            return res.badRequest();
        }

        const userConnections = await UserConnection.findAll({
            where: {
                userId: req.user.id
            },
            attributes: ['connectionId'],
            order: [[db.cast(db.col('connectionId'), 'TEXT'), 'ASC']] // Cast as we want alphabetical order, not enum order.
        });

        return res.ok({
            count: userConnections.length,
            rows: userConnections
        });
    }));


    /**
     * Read User preferences
    */
    app.get('/api/users/:userId/notifications', loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;
        const type = req.params.type || null;

        const preferences = await UserNotificationSettings
            .findAll({
                where: {
                    userId,
                    type
                }
            });

        return res.ok({
            preferences
        });
    }));

};
