'use strict';

module.exports = function (app) {
    var models = app.get('models');
    var db = models.sequelize;

    var loginCheck = app.get('middleware.loginCheck');
    var emailLib = app.get('email');
    var config = app.get('config');
    var cosActivities = app.get('cosActivities');
    var urlLib = app.get('urlLib');
    var jwt = app.get('jwt');
    var uuid = app.get('uuid');
    var moment = app.get('moment');

    var User = models.User;
    var UserConsent = models.UserConsent;
    var UserConnection = models.UserConnection;

    /**
     * Update User info
     */
    app.put('/api/users/:userId', loginCheck(['partner']), function (req, res, next) {

        const fields = ['name', 'company', 'email', 'language', 'imageUrl', 'termsVersion'];
        if (!req.user.partnerId) { // Allow only our own app change the password
            fields.push('password');
        }
        var updateEmail = false;

        User
            .findOne({
                where: {
                    id: req.user.id
                }
            })
            .then(function (user) {
                if (req.body.email && req.body.email !== user.email) {
                    updateEmail = true;
                    fields.push('emailIsVerified');
                    fields.push('emailVerificationCode');
                    req.body.emailIsVerified = false;
                    req.body.emailVerificationCode = uuid.v4(); // Generate new emailVerificationCode
                }
                if (req.body.termsVersion && req.body.termsVersion !== user.termsVersion) {
                    fields.push('termsAcceptedAt');
                    req.body.termsAcceptedAt = moment().format();
                }

                return User
                    .update(
                        req.body,
                        {
                            where: {
                                id: req.user.id
                            },
                            fields: fields,
                            limit: 1,
                            returning: true
                        }
                    );

            })
            .then(function (results) {
                const user = results[1][0];

                let sendEmailPromise = Promise.resolve();

                if (updateEmail) {
                    UserConnection
                        .update({
                            connectionData: user 
                        }, {
                            where: {
                                connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                userId: user.id
                            }
                        })
                        .then(function () {
                            const tokenData = {
                                redirectSuccess: urlLib.getFe() // TODO: Misleading naming, would like to use "redirectUri" (OpenID convention) instead, but needs RAA.ee to update codebase.
                            };
        
                            const token = jwt.sign(tokenData, config.session.privateKey, {algorithm: config.session.algorithm});
        
                            sendEmailPromise = emailLib.sendAccountVerification(user.email, user.emailVerificationCode, token);
                        });
                }

                return sendEmailPromise
                    .then(function () {
                        return res.ok(user.toJSON());
                    });
            })
            .catch(next);
    });

    /**
     * Get User info
     *
     * Right now only supports getting info for logged in User
     */
    app.get('/api/users/:userId', loginCheck(['partner']), function (req, res, next) {
        User
            .findOne({
                where: {
                    id: req.user.id
                }
            })
            .then(function (user) {
                if (!user) {
                    return res.notFound();
                }

                return res.ok(user.toJSON());
            })
            .catch(next);
    });

    /**
     * Delete User
     */
    app.delete('/api/users/:userId', loginCheck(), function (req, res, next) {
        User
            .findOne({
                where: {
                    id: req.user.id
                }
            })
            .then(function (user) {
                if (!user) {
                    return res.notFound();
                }
                return db
                    .transaction(function (t) {
                        return User
                            .update(
                                {
                                    name: 'Anonymous',
                                    email: null,
                                    company: null,
                                    imageUrl: null,
                                    sourceId: null

                                },
                                {
                                    where: {
                                        id: req.user.id
                                    },
                                    limit: 1,
                                    returning: true,
                                    transaction: t
                                }
                            )
                            .then(function () {
                                return User.destroy({
                                    where: {
                                        id: req.user.id
                                    },
                                    transaction: t
                                });
                            })
                            .then(function () {
                                return UserConnection.destroy({
                                    where: {
                                        userId: req.user.id
                                    },
                                    force: true,
                                    transaction: t
                                })
                            });
            })
        })
        .then(function () {
            return res.ok();
        })
        .catch(next);
    });
    /**
     * Create UserConsent
     */
    app.post('/api/users/:userId/consents', loginCheck(), function (req, res, next) {
        var userId = req.user.id;
        var partnerId = req.body.partnerId;

        db
            .transaction(function (t) {
                return UserConsent
                    .upsert({
                        userId: userId,
                        partnerId: partnerId
                    }, {
                        transaction: t
                    })
                    .then(function (created) {
                        if (created) {
                            var userConsent = UserConsent.build({
                                userId: userId,
                                partnerId: partnerId
                            });

                            return cosActivities
                                .createActivity(userConsent, null, {
                                    type: 'User',
                                    id: userId
                                }, req.method + ' ' + req.path, t);
                        }

                        return created;
                    });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

    /**
     * Read User consents
     */
    app.get('/api/users/:userId/consents', loginCheck(), function (req, res, next) {
        var userId = req.user.id;

        db
            .query(
                '\
                SELECT \
                    p.id, \
                    p.website, \
                    p."createdAt", \
                    p."updatedAt" \
                FROM "UserConsents" uc \
                LEFT JOIN "Partners" p ON (p.id = uc."partnerId") \
                WHERE uc."userId" = :userId \
                  AND uc."deletedAt" IS NULL \
                ;',
                {
                    replacements: {
                        userId: userId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (results) {
                return res.ok({
                    count: results.length,
                    rows: results
                });
            })
            .catch(next);
    });

    /**
     * Delete User consent
     */
    app.delete('/api/users/:userId/consents/:partnerId', loginCheck(), function (req, res, next) {
        var userId = req.user.id;
        var partnerId = req.params.partnerId;

        db
            .transaction(function (t) {
                return UserConsent
                    .destroy(
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
                    )
                    .then(function () {
                        var consent = UserConsent.build({
                            userId: userId,
                            partnerId: partnerId
                        });

                        return cosActivities
                            .deleteActivity(
                                consent,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                req.method + ' ' + req.path,
                                t
                            );
                    });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

};
