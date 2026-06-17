'use strict';

/**
 * Search all objects (Users, Groups)
 *
 * @param {object} app Express app
 *
 * @returns {void}
 */
module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const searchService = app.get('searchService');

    app.get('/api/search', async (req, res, next) => {
        try {
            const results = await searchService.search(req.query, req.user);
            return res.ok(results);
        } catch (err) {
            return next(err);
        }
    });

    app.get('/api/users/:userId/search/users', loginCheck(), async (req, res, next) => {
        try {
            const results = await searchService.searchUsers(req.query.str);
            return res.ok(results);
        } catch (err) {
            return next(err);
        }
    });
};
