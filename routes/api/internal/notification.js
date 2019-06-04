'use strict';

/**
 * Etherpad related internal API-s
 */

module.exports = function (app) {
    var cosEtherpad = app.get('cosEtherpad');
    var Promise = app.get('Promise');
    var authApiKey = app.get('middleware.authApiKey');

    /**
     * Callback API for Pad change events
     */
    app.post('/api/internal/notifications/pads/update', authApiKey, function (req, res, next) {
        var pads = req.body.pads;
        var promisesToResolve = [];

        // padID === topicId
        var padIds = Object.keys(pads);
        padIds.forEach(function (topicId) {
            pads[padIds].forEach(function (pdata) {
                return cosEtherpad
                    .syncTopicWithPad(
                        topicId,
                        req.method + ' ' + req.path,
                        {
                            'type': 'User',
                            id: pdata.userId
                        }
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
};
