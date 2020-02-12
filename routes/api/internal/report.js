'use strict';

/**
 * Endpoint to log csp-reports
 */

module.exports = function (app) {
    var logger = app.get('logger');

    app.post('/api/internal/report', function (req, res) {

        const cspReport = req.body['csp-report'];
        const headers = req.headers;

        if (cspReport) {
            // Extra long one liner with useful info so that we can do easier parsing and alerting
            logger.error(
                'CSP report:',
                JSON.stringify(cspReport),
                'Headers:',
                JSON.stringify(headers)
            );
        } else {
            logger.error('CSP report endpoint called with invalid payload', req.body, req.headers);
        }

        return res.ok();
    });
};
