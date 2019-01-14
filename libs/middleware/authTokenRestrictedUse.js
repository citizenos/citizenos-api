'use strict';

/**
 * Middleware to parse authorization token that is issued for limited use.
 * Such tokens are issued for example to Moderators to moderate a Topic or a Comment (argument)
 *
 * The token is read from:
 * * Authorization header
 * * URL parameter "token"
 *
 * Every new presence overrides previous one. So URL parameter "token" overrides "Authorization" header.
 *
 * @param {object} req  Express request object
 * @param {object} res  Express response object
 * @param {function} next Express middleware function
 *
 * @returns {void}
 */
module.exports = function (req, res, next) {
    var app = req.app;
    var logger = app.get('logger');
    var jwt = app.get('jwt');
    var cosJwt = app.get('cosJwt');

    var token;

    if (req.headers && req.headers.authorization) {
        var headerInfoArr = req.headers.authorization.split(' '); // "Bearer <token>"

        if (headerInfoArr[0] === 'Bearer') {
            token = headerInfoArr[1];
        }
    }

    if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.badRequest('Missing required parameter "token"');
    }

    try {
        // TODO: May want to store the info in req.locals.tokenDecoded for use in the endpoint
        if (!req.locals) {
            req.locals = {};
        }

        req.locals.tokenDecoded = cosJwt.verifyTokenRestrictedUse(token, req.method + ' ' + req.path);

        return next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            logger.info('authTokenRestrictedUse - JWT error - token expired', req.method, req.path, err);

            return res.unauthorised('JWT token has expired');
        } else {
            logger.warn('authTokenRestrictedUse - JWT error', req.method, req.path, req.headers, err);

            return res.unauthorised('Invalid JWT token');
        }
    }
};
