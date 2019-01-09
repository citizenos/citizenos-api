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
    var config = app.get('config');
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

        req.locals.tokenDecoded = cosJwt.verifyTokenRestrictedUse(token, req.path + ' ' + req.method);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            logger.info('authTokenRestrictedUse - JWT error - token expired', req.method, req.path, err);

            return res.unauthorised('JWT token has expired');
        } else {
            logger.warn('authTokenRestrictedUse - JWT error', req.method, req.path, req.headers, err);

            return res.unauthorised('Invalid JWT token');
        }
    }

    // TODO: BACKWARD COMPATIBILITY LOGIC: Can be deleted after all deployments have upgraded to this version - https://github.com/citizenos/citizenos-api/issues/70
    //jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]}, function (err, eventTokenData) {
    //    if (err) {
    //        if (err.name === 'TokenExpiredError') {
    //            logger.info('loginCheck - JWT token has expired', req.method, req.path, err);
    //
    //            return res.unauthorised('JWT token has expired');
    //        } else {
    //            logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);
    //
    //            return res.unauthorised('Invalid JWT token');
    //        }
    //    }
    //
    //
    //    if ((eventTokenData.paths && eventTokenData.paths.indexOf(req.method + '_' + req.path) < 0) || (eventTokenData.path && eventTokenData.path !== req.path)) {
    //        logger.warn('Invalid token used to access path', req.method + '_' + req.path, '. Token was issued for path', eventTokenData.paths);
    //
    //        return res.unauthorised('Invalid JWT token');
    //    }
    //
    //    return next();
    //});
    // TODO: END OF BACKWARD COMP

};
