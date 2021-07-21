'use strict';

var Response = require('../models/Response');

/**
 * Simplifed JSON response middleware
 *
 * Extends Express's "res" object with convenience methods.
 *
 * TODO: will do for now, but in the future may consider other approaches, specially when other response types come along.
 *
 * @param {object} req  Express request object
 * @param {object} res  Express response object
 * @param {function} next Express middleware function
 *
 * @returns {void}
 */
module.exports = function (req, res, next) {

    var buildJsonResponse = function (httpCode, defaultMessage) {
        return function (statusMessage, statusCode, data) {
            var response;

            if (defaultMessage && !statusMessage) {
                statusMessage = defaultMessage;
            }

            if (httpCode < 400) {
                response = new Response.Success(httpCode, statusMessage, statusCode, data);
            } else {
                response = new Response.Error(httpCode, statusMessage, statusCode, data);
            }

            return res.status(httpCode).json(response);
        };
    };

    res.ok = buildJsonResponse(200);
    res.noContent = buildJsonResponse(204);
    res.reload = buildJsonResponse(205);
    res.created = buildJsonResponse(201);
    res.badRequest = buildJsonResponse(400, 'Bad request');
    res.unauthorised = buildJsonResponse(401, 'Unauthorized');
    res.forbidden = buildJsonResponse(403, 'Forbidden');
    res.notFound = buildJsonResponse(404, 'Not Found');
    res.gone = buildJsonResponse(410, 'Gone');
    res.internalServerError = buildJsonResponse(500, 'Internal Server Error');
    res.notImplemented = buildJsonResponse(501, 'Not Implemented');

    next();
};
