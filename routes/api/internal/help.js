'use strict';

/**
 * Etherpad related internal API-s
 */

module.exports = function (app) {
    const logger = app.get('logger');
    const emailLib = app.get('email');

    /**
     * Callback API for Pad change events
     */
    app.post('/api/internal/help', async function (req, res, next) {
        try {
            const helpData = req.body;

            if (req.user) {
                helpData.userId = req.user.id;
            }

            logger.info('Help request:', helpData);

            await emailLib.sendHelpRequest(helpData);

            return res.ok();
        } catch (e) {
            logger.error(e);
            next(e);
        }

    });
};
