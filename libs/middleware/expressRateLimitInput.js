'use strict';

const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible'); // FIXME: Allow configurable RateLimiter...
const assert = require('assert');
const { createClient } = require('redis');

function ExpressRateLimitInput(app) {
    const config = app.get('config');
    const logger = app.get('logger');
    let client;
    if (config.rateLimit && config.rateLimit.storageType === 'redis') {
        const redisConf = Object.assign({ url: process.env.REDIS_URL || config.rateLimit.client.url }, config.rateLimit.client.options);
        client = createClient(redisConf);

        client.on('error', err => logger.error('Redis Client Error', err))
        client.on('end', () => {
            logger.log('Redis connection ended');
        });

        client.connect();

    }
    /**
     * Express Rate Limit Input middleware - rate limiting middleware for doing rate limiting based on input.
     *
     * @param {Array<String>} properties Array of strings in dot notation for the properties to look at from Express request object (req).
     * @param {number} windowMs Window size in milliseconds.
     * @param {number} max Maximum number of events in given window.
     *
     * @returns {function(...[*]=)}
     *
     * @see https://github.com/animir/node-rate-limiter-flexible
     * @see https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example
     * @see https://expressjs.com/en/4x/api.html
     * @see https://expressjs.com/en/guide/writing-middleware.html
     */
    return function expressRateLimitInput(properties, windowMs, max) {
        assert(properties && Array.isArray(properties), `Parameter "properties" is required and must be an array of dot notation strings of properties. Value: ${properties}`);
        assert(windowMs && Number.isInteger(windowMs), `Parameter "windowMs" is required and must be an integer determining the window size in milliseconds. Value: ${windowMs}`);
        assert(max && Number.isInteger(max), `Parameter "max" and must be an integer determining the maximum number of events in given window. Value: ${max}`);

        // The widely used express-rate-limit and express-slow-down have window size (windowMs) and maximum events in given window (max).
        // rate-limiter-flexible has a concept of duration and points. In certain duration X points can be consumed before hitting limits. This idea is better in a sense that you MAY want penalize some events more than others by consuming more than 1 point.

        // NOTE: Would have liked that you pass in a rate limit storage, like express-rate-limit, so that storage type definition and limits configuration was separate.
        // BUT, when it comes to node-rate-limiter-flexible, the storage and limiter configuration itself are defined as one.
        let rateLimiter;
        if (config.rateLimit && config.rateLimit.storageType === 'redis' && client) {

            rateLimiter = new RateLimiterRedis({
                storeClient: client,
                duration: windowMs / 1000,
                points: max
            });
        } else {
            rateLimiter = new RateLimiterMemory({
                duration: windowMs / 1000,
                points: max
            });
        }
        function _get(object, path, defval = null) {
            if (typeof path === "string") path = path.split(".");
            return path.reduce((xs, x) => (xs && xs[x] ? xs[x] : defval), object);
        }

        return function (req, res, next) {
            let propsAndValues = [];
            properties.forEach(prop => {
                const propValue = _get(req, prop);
                // NOTE: We assume that ANY property in the "properties" array is REQUIRED. If the value does not exist, we consider it as a bad request!
                if (!propValue) {
                    logger.error('expressRateLimitInput', `No value for property "${prop}" found in Express request object (req)!`);
                    return res.status(400).end();
                }
                propsAndValues.push(`${prop}=${propValue}`);
            });

            let key = `expressRateLimitInput_${req.method}_${req.route.path}__${propsAndValues.join('+')}`;

            rateLimiter
                .consume(key, 1)
                .then(() => {
                    return (next());
                })
                .catch(() => {
                    logger.warn('express-rate-limit-input', 'RATE LIMIT HIT!', `Key: ${key} - Conf: windowMs=${windowMs}, max=${max}.`);
                    res.status(429).json({
                        status: {
                            code: 42900,
                            message: 'Too Many Requests'
                        }
                    });
                })
        };
    }
}

module.exports = ExpressRateLimitInput;
