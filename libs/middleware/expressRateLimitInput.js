'use strict';
const _ = require('lodash');
const {RateLimiterMemory} = require('rate-limiter-flexible'); // FIXME: Allow configurable RateLimiter...

/**
 * Express Rate Limit Input middleware - rate limiting middleware for doing rate limiting based on input.
 *
 * @param {Array<String>} properties Array of strings in dot notation for the properties to look at. Using Lodash GET internally (https://lodash.com/docs/4.17.15#get)
 * @param {number} windowMs Window size in milliseconds.
 * @param {number} max Maximum number of events in given window.
 *
 * @returns {function(...[*]=)}
 *
 * @see https://github.com/animir/node-rate-limiter-flexible
 * @see https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example
 * @see https://expressjs.com/en/4x/api.html
 * @see https://expressjs.com/en/guide/writing-middleware.html
 * @see https://lodash.com/docs/4.17.15#get
 */
function expressRateLimitInput (properties, windowMs, max) {
    assert(properties && Array.isArray(properties), `Parameter "properties" is required and must be an array of dot notation strings of properties. Value: ${properties}`);
    assert(windowMs && Number.isInteger(windowMs), `Parameter "windowMs" is required and must be an integer determining the window size in milliseconds. Value: ${windowMs}`);
    assert(max && Number.isInteger(max), `Parameter "max" and must be an integer determining the maximum number of events in given window. Value: ${max}`);

    // The widely used express-rate-limit and express-slow-down have window size (windowMs) and maximum events in given window (max).
    // rate-limiter-flexible has a concept of duration and points. In certain duration X points can be consumed before hitting limits. This idea is better in a sense that you MAY want penalize some events more than others by consuming more than 1 point.
    const rateLimiter = new RateLimiterMemory({
        duration: windowMs,
        points: max
    });

    return function (req, res, next) {
        let propsAndValues = [];
        properties.forEach(prop => {
            const propValue = _.get(req, prop);
            // NOTE: We assume that ANY property in the "properties" array is REQUIRED. If the value does not exist, we consider it as a bad request!
            if (!propValue) {
                console.error('expressRateLimitInput', `No value for property "${prop}" found!`); // FIXME: LOGGER?
                return res.status(400).end();
            }
            propsAndValues.push(`${prop}=${propValue}`);
        });

        let key = `expressRateLimitInput_${req.route.method}_${req.route.path}__${propsAndValues.join('+')}`;

        rateLimiter
            .consume(key, 1)
            .then(() => {
                return (next());
            })
            .catch(() => {
                res.status(429).send('Too Many Requests'); // FIXME: MAY want to make response configurable.
            })
    };
}

module.exports = expressRateLimitInput;
