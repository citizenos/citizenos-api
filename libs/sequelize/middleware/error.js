'use strict';

var Sequelize = require('sequelize');

/**
 * SequelizeErrorResponse
 *
 * Single property "errors" which is an object containing {fieldName1: 'Error msg 1', fieldName2: 'this is whats wrong'}
 *
 * @param {Sequelize.Error} error Sequelize error.
 *
 * @returns {object} Errors
 */
var getErrors = function (error) {
    var errors = {};

    if (error.errors) {
        error.errors.forEach(function (err) {
            var field;

            if (err.fields && err.fields.length) {
                field = err.fields[0];
            } else {
                field = err.path;
            }

            errors[field] = err.message;
        });
    } else {
        errors[error.fields[0]] = error.message || null;
    }

    return errors;
};


/**
 * Sequelize specific error handler
 *
 * Maps Sequelize errors to responses. Simplifies the endpoint code a lot.
 *
 * @param {object} err Error
 * @param {object} req Express request object
 * @param {object} res Express response object
 * @param {function} next Express middleware function
 *
 * @returns {void}
 */
function sequelizeErrorHandler (err, req, res, next) {

    var logger = req.app.get('logger') || console;

    logger.info('Sequelize error handler middleware activated.', err, err.stack);

    if (err instanceof Sequelize.ValidationError) {
        logger.info('Sequelize.ValidationError', JSON.stringify(err));

        return res.badRequest(getErrors(err));
    } else if (err instanceof Sequelize.UniqueConstraintError) {
        logger.info('Sequelize.UniqueConstraintError', err);

        return res.badRequest(getErrors(err));
    }

    // Did not take care of the error, let the next handler try.
    next(err);
}

module.exports = sequelizeErrorHandler;
