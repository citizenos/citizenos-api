"use strict";

/**
 * Builds Redis client options with resilience for production (TLS, keepalive, reconnection).
 * Prefers REDIS_TLS_URL when set (e.g. Heroku Redis TLS), then REDIS_URL.
 */
function getRedisClientConfig(config) {
  const redisUrl =
    process.env.REDIS_TLS_URL ||
    process.env.REDIS_URL ||
    config?.rateLimit?.client?.url;
  const clientOptions = config?.rateLimit?.client?.options || {};

  const base = {
    url: redisUrl,
    socket: Object.assign(
      {
        keepAlive: true,
        reconnectStrategy: (retries) => {
          if (retries > 20) return new Error("Max reconnection attempts reached");
          const delay = Math.min(retries * 100, 2000);
          return delay;
        },
      },
      clientOptions.socket
    ),
  };
         const { socket: _socket, ...rest } = clientOptions;
         void _socket;
         return Object.assign(base, rest);
}

module.exports = { getRedisClientConfig };
