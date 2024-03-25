'use strict';

/**
 * Etherpad related internal API-s
 */

module.exports = function (app) {
    const logger = app.get('logger');
    const cosEtherpad = app.get('cosEtherpad');
    const authApiKey = app.get('middleware.authApiKey');
    const emailLib = app.get('email');
    /**
     * Callback API for Pad change events
     */
    app.post('/api/internal/notifications/pads/update', authApiKey, function (req, res, next) {
        const pads = req.body.pads;
        const promisesToResolve = [];

        // padID === topicId
        const padIds = Object.keys(pads);

        // Sometimes EP calls the hook without Pad IDs, needs to be investigated and fixed, but meanwhile don't throw an error but warn and log body for debugging
        if (!pads) {
            logger.warn('Etherpad sync called without padIds', req.path, req.body);

            return res.ok();
        }

        padIds.forEach(function (topicId) {
            pads[padIds].forEach(function (pdata) {
                promisesToResolve.push(cosEtherpad
                    .syncTopicWithPad(
                        topicId,
                        req.method + ' ' + req.path,
                        {
                            type: 'User',
                            id: pdata.userId,
                            ip: pdata.ip,
                        },
                        pdata.rev,
                        true
                    )
                );
            });
        });

        Promise
            .all(promisesToResolve)
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });


    app.get('/api/newsletter', authApiKey, (req, res) => {
        const newsletterName = req.query.letterName;
        emailLib.sendNewsletter(newsletterName);

        return res.ok();
    })
};
