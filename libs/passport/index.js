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

    const _findOrCreateUser = async (connectionId, source, profile, req) => {
        logger.info(`${source} responded with profile: `, profile);
        const sourceId = profile.id;
        const userConnectionInfo = await UserConnection.findOne({
            where: {
                connectionId: connectionId,
                connectionUserId: sourceId
            },
            include: [User]
        });
        let user, created;
        if (!userConnectionInfo) {
            let email = profile.email;

            if (!email && profile.emails.length) {
                email = profile.emails[0].value;
            }
            const displayName = profile.displayName || util.emailToDisplayName(email);
            let imageUrl = null;
            if (source === User.SOURCES.facebook) {
                imageUrl = 'https://graph.facebook.com/:id/picture?type=large'.replace(':id', sourceId);
            } else {
                imageUrl = profile.photos[0]?.value?.split('?')[0];
            }

            await db.transaction(async function (t) {
                if (!req.user?.id) {
                    [user, created] = await User.findOrCreate({
                        where: db.where(db.fn('lower', db.col('email')), db.fn('lower', email)),
                        defaults: {
                            name: displayName,
                            email: email,
                            password: null,
                            emailIsVerified: true,
                            imageUrl: imageUrl,
                            source: source,
                            sourceId: sourceId
                        },
                        transaction: t
                    });
                } else {
                    user = await User.findOne({
                        where: {
                            id: req.user.id
                        }
                    });
                }

                if (created) {
                    logger.info(`Created a new user with ${connectionId}`, user.id);

                    await cosActivities.createActivity(user, null, {
                        type: 'User',
                        id: user.id,
                        ip: req.ip
                    }, req.method + ' ' + req.path, t);
                }

                const uc = await UserConnection.create(
                    {
                        userId: user.id,
                        connectionId,
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
        } else if (req.user?.id && req.user.id !== userConnectionInfo.userId) {
            throw new Error('User conection error');
        } else {
            user = userConnectionInfo.User;
        }

        return user;
    };

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

                try {
                    const user = await _findOrCreateUser(UserConnection.CONNECTION_IDS.google, User.SOURCES.google, profile, req);

                    return done(null, user.toJSON());
                } catch (err) {
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
                try {
                    const user = await _findOrCreateUser(UserConnection.CONNECTION_IDS.facebook, User.SOURCES.facebook, profile, req);

                    return done(null, user.toJSON());
                } catch (err) {
                    console.log(err);
                    done(err);
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
                        where: db.where(db.fn('lower', db.col('email')), db.fn('lower', email))
                    });

                if (user && user.password === cryptoLib.getHash(password, 'sha256')) {
                    const userData = user.toJSON();
                    userData.termsVersion = user.dataValues.termsVersion;
                    userData.termsAcceptedAt = user.dataValues.termsAcceptedAt;

                    if (!user.emailIsVerified) {
                        await emailLib.sendAccountVerification(user.email, user.emailVerificationCode);

                        return done({
                            message: 'The account verification has not been completed. Please check your e-mail.',
                            code: 2
                        }, false);
                    }

                    return done(null, userData);
                } else {
                    return done({
                        message: 'Invalid password',
                        code: 1
                    }, false);
                }

            }
        ));
    };

    return {
        init: _init
    };
};
