'use strict';

/**
 * Endpoint to log csp-reports
 */

module.exports = function (app) {
    var logger = app.get('logger');

    app.post('/api/internal/report', function (req, res) {

        logger.error({
            headers: req.headers, 
            body: req.body
        });

        res.ok();
    });
};
