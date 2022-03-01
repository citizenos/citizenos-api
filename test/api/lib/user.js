'use strict';

/**
 * Lib of convenience methods to make testing easier
 */

module.exports = function (app) {
    const auth = require('../auth');
    const userLib = require('../user');
    const models = app.get('models');
    const db = models.Sequelize;

    const User = models.User;

    /**
     * Create a User by:
     *
     * calling Sing-up API
     * verifying the e-mail in the DB directly
     *
     * @param {object} agent Superagent
     * @param {string} [email] E-mail
     * @param {string} [password] Password
     * @param {string} [language] ISO 2-letter language code
     *
     * @returns {Promise<User>} Sequelize User object
     *
     * @private
     */
    const _createUser = async function (agent, email, password, language) {
        if (!email) {
            const prefix = 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '');

            email = prefix + '@test.com';
            // Need to add num and letter to the end for it to be a valid pass - https://github.com/citizenos/citizenos-api/issues/234
            password = prefix.toLowerCase() + '1A';
        }

        if (!password) {
            // Need to add num and letter to the end for it to be a valid pass - https://github.com/citizenos/citizenos-api/issues/234
            password = email.toLowerCase().split('@')[0] + '1A';
        }

        await auth.signup(agent, email, password, language);

        const user = await User.update(
            {
                emailIsVerified: true
            },
            {
                where: db.where(db.fn('lower', db.col('email')), db.fn('lower', email)),
                returning: true
            }
        );

        return user[1][0];
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
     *
     * @returns {Promise<User>} Sequelize User object
     *
     * @private
     */
    const _createUserAndLogin = async function (agent, email, password, language) {
        const user = await _createUser(agent, email, password, language);

        if (!email) {
            email = user.email;
        }

        if (!password) {
            password = user.email.split('@')[0] + '1A';
        }

        // Logs in the Agent
        await auth.login(agent, email, password, language);

        return user;
    };

    const _deleteUser = async function (agent, userId) {
        return userLib.userDelete(agent, userId);
    };

    return {
        deleteUser: _deleteUser,
        createUser: _createUser,
        createUserAndLogin: _createUserAndLogin
    };

};
