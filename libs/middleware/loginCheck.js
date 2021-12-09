'use strict';

/**
 * Middleware to perform login check and verify appropriate scope
 *
 * @param {Array<String>} [scopes=['all']] Array of scopes to which the endpoint access is restricted to. By default requires "all" which is only true for the app itself and to NO Partner.
 *
 * @returns {function} Express middleware function
 */
module.exports = function (scopes) {
    if (!scopes) {
        scopes = [];
    }
    scopes.push('all'); // Allow everything to User with 'all' scope.

    return function (req, res, next) {
        if (!req.user || !req.user.userId) {
            return res.unauthorised();
        }

        if (scopes.indexOf(req.user.scope) < 0) {
            return res.unauthorised('Invalid scope. Access denied.');
        }

        return next();
    };
};
