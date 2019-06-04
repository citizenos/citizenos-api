'use strict';

/**
 * Async middleware to support routes that use async/await
 *
 * Hides away stack traces from the caller and log using a configured logger with a fallback to console.
 *
 * @param {function} fn Express route handler function fn(req, res, next)
 *
 * @returns {function} Express middleware function
 *
 * @see https://medium.com/@Abazhenov/using-async-await-in-express-with-node-8-b8af872c0016
 * @see https://odino.org/async-slash-await-in-expressjs/
 */
function asyncMiddleware (fn) {
    return function (req, res, next) {
        Promise
            .resolve(fn(req, res, next))
            .catch(next);
    };
}

module.exports = asyncMiddleware;
