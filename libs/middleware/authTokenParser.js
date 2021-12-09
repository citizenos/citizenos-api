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
    const app = req.app;
    const config = app.get('config');
    const logger = app.get('logger');
    const jwt = app.get('jwt');

    const TokenRevocation = app.get('models').TokenRevocation;
    let token;

    // App itself uses cookie which contains the JWT
    const cookieAuthorization = req.cookies[config.session.name];
    if (cookieAuthorization) {
        token = cookieAuthorization;
    }

    // Partners use "Authorization: Bearer <JWT>. Partner JWT always overrides app cookie JWT
    const headerAuthorization = req.headers.authorization;
    if (headerAuthorization) {
        const headerInfoArr = headerAuthorization.split(' ');
        const tokenType = headerInfoArr[0];

        if (tokenType === 'Bearer') {
            token = headerInfoArr[1];
        }
    }

    if (token) {
        jwt.verify(token, config.session.publicKey, {algorithms: [config.session.algorithm]}, async function (err, tokenData) {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                    return res.unauthorised('JWT token has expired');
                } else {
                    logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                    return res.unauthorised('Invalid JWT token');
                }
            } else if (tokenData.tokenId) {
                const revoked = await TokenRevocation.findOne({
                    where: {
                        tokenId: tokenData.tokenId
                    }
                });

                if (revoked) {
                    res.clearCookie(config.session.name, {
                        path: config.session.cookie.path,
                        domain: config.session.cookie.domain
                    });
                } else {
                    req.user = tokenData;
                    req.user.id = tokenData.userId;
                }
            }

            return next();
        });
    } else {
        return next();
    }
};
