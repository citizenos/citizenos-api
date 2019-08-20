'use strict';

/**
 * Contains all Passport setup logic
 *
 * Separate just that the app.js would not look so ugly.
 *
 * @param {object} app Express app
 * @returns {{init: Function}}
 */

module.exports = function (app) {
    var passport = app.get('passport');
    var GoogleStrategy = require('passport-google-oauth20').Strategy;
    var FacebookStrategy = require('passport-facebook').Strategy;
    var LocalStrategy = require('passport-local').Strategy;

    var logger = app.get('logger');
    var config = app.get('config');
    var urlLib = app.get('urlLib');
    var util = app.get('util');
    var validator = app.get('validator');
    var emailLib = app.get('email');
    var cryptoLib = app.get('cryptoLib');
    var cosActivities = app.get('cosActivities');
    var models = app.get('models');
    var db = models.sequelize;

    var User = models.User;
    var UserConnection = models.UserConnection;

    var _init = function () {
        passport.serializeUser(function (user, done) { // Serialize data into session (req.user)
            done(null, user.id);
        });

        // GOOGLE
        passport.use(new GoogleStrategy(
            {
                clientID: config.passport.google.clientId,
                clientSecret: config.passport.google.clientSecret,
                callbackURL: urlLib.getApi(config.passport.google.callbackUrl),
                userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
                passReqToCallback: true // http://passportjs.org/guide/authorize/#association_in_verify_callback
            },
            function (req, accessToken, refreshToken, profile, done) {
                logger.debug('Google responded with profile: ', profile);

                var email = profile.email;
                if (!email && profile.emails.length) {
                    if (profile.emails[0]) {
                        email = profile.emails[0].value;
                    }
                }
                var displayName = profile.displayName;
                if (!displayName) {
                    displayName = util.emailToDisplayName(email);
                }
                var sourceId = profile.id;
                var imageUrl = null;
                if (profile.photos && profile.photos.length) {
                    imageUrl = profile.photos[0].value.split('?')[0];
                }

                UserConnection
                    .findOne({
                        where: {
                            connectionId: UserConnection.CONNECTION_IDS.google,
                            connectionUserId: sourceId
                        },
                        include: [User]
                    })
                    .then(function (userConnectionInfo) {
                        if (!userConnectionInfo) {
                            return db.transaction(function (t) {
                                return User
                                    .findOrCreate({
                                        where: {
                                            email: email // Well, this will allow user to log in either using User and pass or just Google.. I think it's ok..
                                        },
                                        defaults: {
                                            name: displayName,
                                            email: email,
                                            password: null,
                                            emailIsVerified: true,
                                            imageUrl: imageUrl,
                                            source: User.SOURCES.google,
                                            sourceId: sourceId
                                        },
                                        transaction: t
                                    })
                                    .spread(function (user, created) {
                                        var activityPromise = [];
                                        if (created) {
                                            logger.info('Created a new user with Google', user.id);
                                            
                                            activityPromise.push(cosActivities.createActivity(user, null, {
                                                type: 'User',
                                                id: user.id,
                                                ip: req.ip
                                            }, req.method + ' ' + req.path, t));
                                        }

                                        return Promise
                                            .all(activityPromise)
                                            .then(function () {
                                                return UserConnection
                                                    .create(
                                                        {
                                                            userId: user.id,
                                                            connectionId: UserConnection.CONNECTION_IDS.google,
                                                            connectionUserId: sourceId,
                                                            connectionData: profile
                                                        },
                                                        {transaction: t}
                                                    )
                                                    .then(function (uc) {

                                                        return cosActivities.addActivity(uc, {
                                                            type: 'User',
                                                            id: user.id,
                                                            ip: req.ip
                                                        }, null, user, req.method + ' ' + req.path, t);
                                                    })
                                                    .then(function () {
                                                        return UserConnection
                                                            .create(
                                                                {
                                                                    userId: user.id,
                                                                    connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                                                    connectionUserId: user.id,
                                                                    connectionData: user
                                                                },
                                                                {transaction: t}
                                                            )
                                                            .then(function (ucCos) {

                                                                return cosActivities.addActivity(ucCos, {
                                                                    type: 'User',
                                                                    id: user.id
                                                                }, null, user, req.method + ' ' + req.path, t);
                                                            });
                                                    })
                                                    .then(function () {
                                                        if (!user.imageUrl) {
                                                            logger.info('Updating User profile image from social network');
                                                            user.imageUrl = imageUrl; // Update existing Users image url in case there is none (for case where User is created via CitizenOS but logs in with social)

                                                            return [user.save(), created];
                                                        }

                                                        return [user, created];
                                                    });
                                            });
                                    });
                            });
                        } else {
                            var user = userConnectionInfo.User;

                            return [user, false];
                        }
                    })
                    .spread(function (user) {
                        if (user) {
                            done(null, user.toJSON());
                        } else {                            
                            done(null, null);
                        }
                    })
                    .catch(done);
            }
        ));

        // FACEBOOK
        passport.use(new FacebookStrategy(
            {
                clientID: config.passport.facebook.clientId,
                clientSecret: config.passport.facebook.clientSecret,
                callbackURL: urlLib.getApi(config.passport.facebook.callbackUrl),
                enableProof: false,
                profileFields: ['id', 'displayName', 'cover', 'email'],
                passReqToCallback: true
            },
            function (req, accessToken, refreshToken, profile, done) {
                logger.info('Facebook responded with profile: ', profile);

                if (!profile.emails || !profile.emails.length) {
                    logger.warn('Facebook did not return email for FB profile. User may have denied access to e-mail.', profile.profileUrl);

                    return done(new Error('Facebook did not provide e-mail, cannot authenticate user', null));
                }

                var email = profile.emails[0].value;
                var displayName = profile.displayName || util.emailToDisplayName(email);
                var sourceId = profile.id;
                var imageUrl = 'https://graph.facebook.com/:id/picture?type=large'.replace(':id', sourceId);

                UserConnection
                    .findOne({
                        where: {
                            connectionId: UserConnection.CONNECTION_IDS.facebook,
                            connectionUserId: sourceId
                        },
                        include: [User]
                    })
                    .then(function (userConnectionInfo) {
                        if (!userConnectionInfo) {
                            return db.transaction(function (t) {
                                return User
                                    .findOrCreate({
                                        where: {
                                            email: email // Well, this will allow user to log in either using User and pass or just Google.. I think it's ok..
                                        },
                                        defaults: {
                                            name: displayName,
                                            email: email,
                                            password: null,
                                            emailIsVerified: true,
                                            imageUrl: imageUrl,
                                            source: User.SOURCES.facebook,
                                            sourceId: sourceId
                                        },
                                        transaction: t
                                    })
                                    .spread(function (user, created) {
                                        var activityPromise = [];
                                        if (created) {
                                            logger.info('Created a new user with Google', user.id);
                                            
                                            activityPromise.push(cosActivities.createActivity(user, null, {
                                                type: 'User',
                                                id: user.id,
                                                ip: req.ip
                                            }, req.method + ' ' + req.path, t));
                                        }

                                        return Promise
                                            .all(activityPromise)
                                            .then(function () {
                                                return UserConnection
                                                    .create(
                                                        {
                                                            userId: user.id,
                                                            connectionId: UserConnection.CONNECTION_IDS.facebook,
                                                            connectionUserId: sourceId,
                                                            connectionData: profile
                                                        },
                                                        {transaction: t}
                                                    )
                                                    .then(function (uc) {

                                                        return cosActivities.addActivity(uc, {
                                                            type: 'User',
                                                            id: user.id,
                                                            ip: req.ip
                                                        }, null, user, req.method + ' ' + req.path, t);
                                                    })
                                                    .then(function () {
                                                        return UserConnection
                                                            .findOrCreate(
                                                                {
                                                                    userId: user.id,
                                                                    connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                                                    connectionUserId: user.id,
                                                                    connectionData: user
                                                                },
                                                                {transaction: t}
                                                            )
                                                            .then(function (ucCos) {

                                                                return cosActivities.addActivity(ucCos, {
                                                                    type: 'User',
                                                                    id: user.id
                                                                }, null, user, 'GET ' + config.passport.facebook.callbackUrl, t);
                                                            });
                                                    })
                                                    .then(function () {
                                                        if (!user.imageUrl) {
                                                            logger.info('Updating User profile image from social network');
                                                            user.imageUrl = imageUrl; // Update existing Users image url in case there is none (for case where User is created via CitizenOS but logs in with social)

                                                            return [user.save(), created];
                                                        }

                                                        return [user, created];
                                                    });
                                            });
                                    });
                            });
                        } else {
                            var user = userConnectionInfo.User;

                            return [user, false];
                        }
                    })
                    .spread(function (user) {
                        done(null, user.toJSON());
                    })
                    .catch(done);
            }
        ));

        // LOCAL
        passport.use(new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password'
            },
            function (email, password, done) {

                if (!validator.isEmail(email)) {
                    return done({message: 'Invalid email.'}, false);
                }

                User
                    .findOne({
                        where: {
                            email: email
                        }
                    })
                    .then(function (user) {
                        if (!user || !user.password) {
                            return done({
                                message: 'The account does not exists.',
                                code: 1
                            }, false);
                        }

                        if (!user.emailIsVerified) {
                            return emailLib
                                .sendAccountVerification(user.email, user.emailVerificationCode)
                                .then(function () {
                                    return done({
                                        message: 'The account verification has not been completed. Please check your e-mail.',
                                        code: 2
                                    }, false);
                                });
                        }

                        if (user.password === cryptoLib.getHash(password, 'sha256')) {
                            var userData = user.toJSON();
                            userData.termsVersion = user.dataValues.termsVersion;
                            userData.termsAcceptedAt = user.dataValues.termsAcceptedAt;

                            return done(null, userData);
                        } else {
                            return done({
                                message: {password: 'Invalid password'},
                                code: 3
                            }, false);
                        }
                    });
                
            }
        ));
    };

    return {
        init: _init
    };
};
