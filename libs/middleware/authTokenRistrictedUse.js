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
        return res.unauthorised('Missing authorization token. Specify it in authorization header or as a "token" query parameter');
    }

    jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]}, function (err, eventTokenData) {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                return res.unauthorised('JWT token has expired');
            } else {
                logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                return res.unauthorised('Invalid JWT token');
            }
        }

        // FIXME: Implement - https://github.com/citizenos/citizenos-api/issues/70
        if (!eventTokenData || !eventTokenData.paths || eventTokenData.paths.indexOf(req.method + ' ' + req.path) < 0) {
            logger.warn('Invalid token used to access path', req.method + '_' + req.path, '. Token was issued for path', eventTokenData.paths);

            return res.unauthorised('Invalid JWT token');
        }

        return next();
    });

};
