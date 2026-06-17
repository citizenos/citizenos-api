'use strict';

/**
 * User related internal API-s
 */

module.exports = function (app) {
    const models = app.get('models');

    const authApiKey = app.get('middleware.authApiKey');
    const userLib = require('../../../services/user')(app);

    /**
     * Get update user etherpad authorID
     */

    app.put('/api/internal/users/:userId', authApiKey, async function (req, res) {
        const authorData = req.body;
        if (authorData.userId && authorData.authorID) {
            try {
                await userLib.updateUserAuthorId(authorData.userId, authorData.authorID);
            } catch (err) {
                console.log('ERROR /api/internal/users', err);
            }

            return res.ok();
        }
    });
};
