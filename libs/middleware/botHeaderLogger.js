'use strict';

/**
 * Middleware to log bot req headers
 *
 * @param {object} req Express request object
 * @param {object} res Express response object
 * @param {function} next Next middleware function
 *
 * @returns {void}
 */
module.exports = function (req, res, next) {
    const app = req.app;
    const logger = app.get('logger');

    logger.info('User agent', req.method, req.path, req.headers['user-agent']);

    if (req.device.type === 'bot') {
        logger.info('BOT HEADER', req.method, req.path, req.headers);
    }

    return next();
};
