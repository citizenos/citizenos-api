'use strict';

/**
 * Default error handler
 *
 * Hides away stack traces from the caller and log using a configured logger with a fallback to console.
 *
 * @param {object} err Error
 * @param {object} req Express request object
 * @param {object} res Express response object
 * @param {function} next Next NOTE: Unused but if not present, Express will never call the middleware.
 *
 * @returns {void}
 *
 * @see http://expressjs.com/en/guide/error-handling.html
 */
function cosErrorHandler (err, req, res, next) { //eslint-disable-line no-unused-vars
    var logger = req.app.get('logger') || console;

    logger.error(
        'Endpoint',
        req.method,
        '"' + req.path + '"',
        'failed miserably.',
        err
    );

    var status = 500;
    var message = 'Internal Server Error';

    if (req.accepts('json')) {
        // If the request Content-Type is JSON...
        if (req.is('json')) {
            // body-parser has 2 validations - 1 based on first character and other is just JSON parser exception, need to handle both
            if ((err.message = 'invalid json' || err instanceof SyntaxError) && err.status === 400 && 'body' in err) {
                status = 400;
                message = 'Invalid JSON in request body';
            }
        }

        return res.status(status).json({
            status: {
                code: parseInt((status + '00000').slice(0, 5)),
                message: message
            }
        });
    }

    res.status(status).send(message);
}

module.exports = cosErrorHandler;
