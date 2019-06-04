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
                JSON.stringify({
                    'blocked-uri': cspReport['blocked-uri'], // IF "data", means "data" url was used. For example: data:application/javascript;charset=utf-8;base64... May be a hack, may be a bad plugin.
                    'effective-directive': cspReport['effective-directive'], // The directive whose enforcement caused the violation.
                    'violated-directive': cspReport['violated-directive'], // The name of the policy section that was violated.
                    'document-uri': cspReport['document-uri'], // The URI of the document in which the violation occurred.
                    'referrer': cspReport['referrer'], // The referrer of the document in which the violation occurred.
                    'script-sample': cspReport['script-sample'] // The first 40 characters of the inline script, event handler, or style that caused the violation.
                }),
                'Headers:',
                JSON.stringify({
                    'user-agent': headers['user-agent'],
                    'x-forwarded-for': headers['x-forwarded-for'],
                    'cf-ipcountry': headers['cf-ipcountry'],
                    'x-request-id': headers['x-request-id']
                })
            );
        } else {
            logger.error('CSP report endpoint called with invalid payload', req.body, req.headers);
        }

        res.ok();
    });
};
