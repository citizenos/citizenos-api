'use strict';

/**
 * Middleware to parse authorization token and set "req.user" if the token is present and valid
 *
 * Partners use "Authorization: Bearer <JWT>
 * App itself uses cookie which contains JWT
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

    // App itself uses cookie which contains the JWT
    var cookieAuthorization = req.cookies[config.session.name];
    if (cookieAuthorization) {
        token = cookieAuthorization;
    }

    // Partners use "Authorization: Bearer <JWT>. Partner JWT always overrides app cookie JWT
    var headerAuthorization = req.headers.authorization;
    if (headerAuthorization) {
        var headerInfoArr = headerAuthorization.split(' ');
        var tokenType = headerInfoArr[0];

        if (tokenType === 'Bearer') {
            token = headerInfoArr[1];
        }
    }

    if (token) {
        jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]}, function (err, tokenData) {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                    return res.unauthorised('JWT token has expired');
                } else {
                    logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                    return res.unauthorised('Invalid JWT token');
                }
            } else {
                req.user = tokenData;
            }

            return next();
        });
    } else {
        return next();
    }
};
