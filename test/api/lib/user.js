'use strict';

/**
 * Lib of convenience methods to make testing easier
 */

module.exports = function (app) {
    var auth = require('../auth');
    var models = app.get('models');

    var User = models.User;

    /**
     * Create a user
     *
     * Actions performed:
     * * Sign-Up
     * * Verify
     *
     * @param {object} agent Superagent
     * @param {string} [email] E-mail
     * @param {string} [password] Password
     * @param {string} [language] ISO 2-letter language code
     * @param {function} callback (req, user)
     *
     * @returns {void}
     */
    var _createUser = function (agent, email, password, language, callback) {
        if (!email) {
            var prefix = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1';

            email = prefix + '@test.com';
            password = prefix;
        }

        if (!password) {
            password = email.split('@')[0];
        }

        auth.signup(agent, email, password, language, function (err, res) {
            if (err) {
                return callback(err, res);
            }

            User
                .findOne({
                    where: {
                        email: email
                    }
                })
                .then(function (user) {
                    auth.verify(agent, user.emailVerificationCode, function () {
                        // As "verify" signs in, we sign out the User so that test could have verified BUT un-authenticated User
                        auth.logout(agent, function (err) {
                            callback(err, user);
                        });
                    });
                });
        });
    };

    /**
     * Create a user and log in
     *
     * Actions performed:
     * * Sign-Up
     * * Verify
     * * Log-in
     *
     * @param {object} agent Superagent
     * @param {string} [email] Email
     * @param {string} [password] Password
     * @param {string} [language] ISO 2-letter language code
     * @param {function} callback (req, user)
     *
     * @returns {void}
     */
    var _createUserAndLogin = function (agent, email, password, language, callback) {
        _createUser(agent, email, password, language, function (err, user) {
            if (err) {
                return callback(err);
            }

            if (!email) {
                email = user.email;
            }

            if (!password) {
                password = user.email.split('@')[0];
            }

            auth.login(agent, email, password, function (err) {
                return callback(err, user);
            });
        });
    };

    return {
        createUser: _createUser,
        createUserAndLogin: _createUserAndLogin
    };

};
