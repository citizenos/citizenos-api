'use strict';

/**
 * Response object
 *
 * @param {number} httpCode HTTP response code
 * @param {string} statusMessage Status message
 * @param {number} [statusCode] Specific status code for numeric error codes.
 *
 * @constructor
 * @private
 */
function Response (httpCode, statusMessage, statusCode) {
    this.status = {
        code: parseInt(httpCode + ('00' + (statusCode || 0).toString()).slice(-2), 10) // Pad statusCode so that the response code is always 5 digit.
    };

    if (statusMessage) {
        this.status.message = statusMessage;
    }
}

/**
 * Response success
 *
 * @param {number} httpCode HTTP response code from 200 to 399.
 * @param {string} [statusMessage] Specific status message.
 * @param {number} [statusCode] Specific status code for numeric error codes.
 * @param {object|Array} [data] Whatever data
 *
 * @throws {Error} If httpCode is out of valid HTTP success code range.
 *
 * @constructor
 */
function ResponseSuccess (httpCode, statusMessage, statusCode, data) {
    if (httpCode < 200 || httpCode > 399) {
        throw new Error('HTTP error codes are between 400 and 599. Wanted to use ResponseError instead?');
    }

    //2 param call httpCode + data
    if (typeof statusMessage === 'object') {
        data = statusMessage;
        statusMessage = null;
    }

    if (typeof statusCode === 'object') {
        data = statusCode;
        statusCode = null;
    }

    Response.call(this, httpCode, statusMessage, statusCode);

    if (data) {
        this.data = data;
    }
}

ResponseSuccess.prototype = Object.create(Response.prototype);
ResponseSuccess.prototype.constructor = ResponseSuccess;

/**
 * Response error
 *
 * @param {number} httpCode HTTP response code from 400 to 599.
 * @param {string} [statusMessage] Specific status message.
 * @param {number} [statusCode] Specific status code for numeric error codes.
 * @param {*} [errors] Whatever error data.
 *
 * @throws {Error} If httpCode is out of valid HTTP error code range.
 *
 * @constructor
 */
function ResponseError (httpCode, statusMessage, statusCode, errors) {
    if (httpCode < 400 || httpCode > 599) {
        throw new Error('HTTP error codes are between 400 and 599. Wanted to use ResponseSuccess?');
    }

    //2 param call httpCode + data
    if (typeof statusMessage === 'object') {
        errors = statusMessage;
        statusMessage = null;
    }

    if (typeof statusCode === 'object') {
        errors = statusCode;
        statusCode = null;
    }

    Response.call(this, httpCode, statusMessage, statusCode);

    if (errors) {
        this.errors = errors;
    }
}

ResponseError.prototype = Object.create(Response.prototype);
ResponseError.prototype.constructor = ResponseError;

module.exports.Success = ResponseSuccess;
module.exports.Error = ResponseError;
