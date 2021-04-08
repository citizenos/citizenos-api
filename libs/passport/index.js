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
    const passport = app.get('passport');
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    const FacebookStrategy = require('passport-facebook').Strategy;
    const LocalStrategy = require('passport-local').Strategy;

    const logger = app.get('logger');
    const config = app.get('config');
    const urlLib = app.get('urlLib');
    const util = app.get('util');
    const validator = app.get('validator');
    const emailLib = app.get('email');
    const cryptoLib = app.get('cryptoLib');
    const cosActivities = app.get('cosActivities');
    const models = app.get('models');
    const db = models.sequelize;

    const User = models.User;
    const UserConnection = models.UserConnection;

    const _init = function () {
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
            async function (req, accessToken, refreshToken, profile, done) {
                logger.debug('Google responded with profile: ', profile);

                let email = profile.email;
                let user, created;
                if (!email && profile.emails.length) {
                    if (profile.emails[0]) {
                        email = profile.emails[0].value;
                    }
                }
                let displayName = profile.displayName;
                if (!displayName) {
                    displayName = util.emailToDisplayName(email);
                }
                const sourceId = profile.id;
                let imageUrl = null;
                if (profile.photos && profile.photos.length) {
                    imageUrl = profile.photos[0].value.split('?')[0];
                }
                try {
                    const userConnectionInfo = await UserConnection.findOne({
                        where: {
                            connectionId: UserConnection.CONNECTION_IDS.google,
                            connectionUserId: sourceId
                        },
                        include: [User]
                    });

                    if (!userConnectionInfo) {
                        await db.transaction(async function (t) {
                            [user, created] = await User.findOrCreate({
                                where: db.where(db.fn('lower', db.col('email')), db.fn('lower',email)),
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
                            });

                            if (created) {
                                logger.info('Created a new user with Google', user.id);

                                await cosActivities.createActivity(user, null, {
                                    type: 'User',
                                    id: user.id,
                                    ip: req.ip
                                }, req.method + ' ' + req.path, t);
                            }

                            const uc = await UserConnection.create(
                                {
                                    userId: user.id,
                                    connectionId: UserConnection.CONNECTION_IDS.google,
                                    connectionUserId: sourceId,
                                    connectionData: profile
                                },
                                {transaction: t}
                            );

                            await cosActivities.addActivity(uc, {
                                type: 'User',
                                id: user.id,
                                ip: req.ip
                            }, null, user, req.method + ' ' + req.path, t);

                            await UserConnection.findOrCreate({
                                where: {
                                    userId: user.id,
                                    connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                    connectionUserId: user.id
                                },
                                defaults: {
                                    userId: user.id,
                                    connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                    connectionUserId: user.id,
                                    connectionData: user
                                },
                                transaction: t
                            });

                            if (!user.imageUrl) {
                                logger.info('Updating User profile image from social network');
                                user.imageUrl = imageUrl; // Update existing Users image url in case there is none (for case where User is created via CitizenOS but logs in with social)

                                await user.save();
                            }

                        });
                    } else {
                        user = userConnectionInfo.User;
                    }

                    if (user) {
                        done(null, user.toJSON());
                    } else {
                        done(null, null);
                    }
                } catch(err) {
                    console.log(err);
                    done(err);
                }
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
            async function (req, accessToken, refreshToken, profile, done) {
                logger.info('Facebook responded with profile: ', profile);

                if (!profile.emails || !profile.emails.length) {
                    logger.warn('Facebook did not return email for FB profile. User may have denied access to e-mail.', profile.profileUrl);

                    return done(new Error('Facebook did not provide e-mail, cannot authenticate user', null));
                }

                const email = profile.emails[0].value;
                const displayName = profile.displayName || util.emailToDisplayName(email);
                const sourceId = profile.id;
                const imageUrl = 'https://graph.facebook.com/:id/picture?type=large'.replace(':id', sourceId);
                let user, created;
                try {
                    const userConnectionInfo = await UserConnection
                        .findOne({
                            where: {
                                connectionId: UserConnection.CONNECTION_IDS.facebook,
                                connectionUserId: sourceId
                            },
                            include: [User]
                        });
                    if (!userConnectionInfo) {
                        await db.transaction(async function (t) {
                            [user, created] = await User
                                .findOrCreate({
                                    where: db.where(db.fn('lower', db.col('email')), db.fn('lower',email)), // Well, this will allow user to log in either using User and pass or just Google.. I think it's ok..
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
                                });
                            if (created) {
                                logger.info('Created a new user with Google', user.id);

                                await cosActivities.createActivity(user, null, {
                                    type: 'User',
                                    id: user.id,
                                    ip: req.ip
                                }, req.method + ' ' + req.path, t);
                            }

                            const uc = await UserConnection.create(
                                {
                                    userId: user.id,
                                    connectionId: UserConnection.CONNECTION_IDS.facebook,
                                    connectionUserId: sourceId,
                                    connectionData: profile
                                },
                                {transaction: t}
                            );

                            await cosActivities.addActivity(uc, {
                                type: 'User',
                                id: user.id,
                                ip: req.ip
                            }, null, user, req.method + ' ' + req.path, t);

                            await UserConnection.findOrCreate(
                                {
                                    where: {
                                        userId: user.id,
                                        connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                        connectionUserId: user.id
                                    },
                                    defaults: {
                                        userId: user.id,
                                        connectionId: UserConnection.CONNECTION_IDS.citizenos,
                                        connectionUserId: user.id,
                                        connectionData: user
                                    },
                                    transaction: t
                                }
                            );
                            if (!user.imageUrl) {
                                logger.info('Updating User profile image from social network');
                                user.imageUrl = imageUrl; // Update existing Users image url in case there is none (for case where User is created via CitizenOS but logs in with social)

                                await user.save();
                            }
                        });
                    } else {
                        user = userConnectionInfo.User;
                    }

                    return done(null, user.toJSON());
                } catch(err) {
                    return done(err);
                }
            }
        ));

        // LOCAL
        passport.use(new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'password'
            },
            async function (email, password, done) {

                if (!validator.isEmail(email)) {
                    return done({message: 'Invalid email.'}, false);
                }

                const user = await User
                    .findOne({
                        where: db.where(db.fn('lower', db.col('email')), db.fn('lower',email))
                    });

                if (!user || !user.password) {
                    return done({
                        message: 'The account does not exists.',
                        code: 1
                    }, false);
                }

                if (!user.emailIsVerified) {
                    await emailLib.sendAccountVerification(user.email, user.emailVerificationCode);

                    return done({
                        message: 'The account verification has not been completed. Please check your e-mail.',
                        code: 2
                    }, false);
                }

                if (user.password === cryptoLib.getHash(password, 'sha256')) {
                    const userData = user.toJSON();
                    userData.termsVersion = user.dataValues.termsVersion;
                    userData.termsAcceptedAt = user.dataValues.termsAcceptedAt;

                    return done(null, userData);
                } else {
                    return done({
                        message: {password: 'Invalid password'},
                        code: 3
                    }, false);
                }

            }
        ));
    };

    return {
        init: _init
    };
};
