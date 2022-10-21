'use strict';

/**
 * Etherpad related internal API-s
 */

module.exports = function (app) {
    const logger = app.get('logger');
    const emailLib = app.get('email');
    const rateLimiter = app.get('rateLimiter');

    /**
     * Callback API for Pad change events
     */
    app.post('/api/internal/help', async function (req, res, next) {
        try {
            const helpData = req.body;

            if (req.user) {
                helpData.userId = req.user.userId;
            }

            logger.info('Help request:', helpData);

            await emailLib.sendHelpRequest(helpData);

            return res.ok();
        } catch (e) {
            logger.error(e);
            next(e);
        }

    });

    app.post('/api/internal/feedback', rateLimiter(2, (15 * 60 * 1000), false), async function (req, res, next) {
        try {
            const data = {
                message: req.body.message
            }

            if (req.user) {
                data.userId = req.user.userId;
            }

            logger.info('Feedback:', data);

            await emailLib.sendFeedback(data);

            return res.ok();
        } catch (e) {
            logger.error(e);
            next(e);
        }

    });
};
