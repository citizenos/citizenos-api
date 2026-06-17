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

  const socketOptions = Object.assign(
    {
      keepAlive: true,
      reconnectStrategy: (retries) => {
        if (retries > 20) return new Error("Max reconnection attempts reached");
        const delay = Math.min(retries * 100, 2000);
        return delay;
      },
    },
    clientOptions.socket
  );

  // If using rediss:// protocol, ensure TLS is correctly configured for node-redis v4+
  if (redisUrl && redisUrl.startsWith("rediss://")) {
    socketOptions.tls = true;
    if (socketOptions.rejectUnauthorized === undefined) {
      socketOptions.rejectUnauthorized = false; // Essential for Heroku Redis self-signed certs
    }
  }

  const { socket: _socket, ...rest } = clientOptions;
  void _socket;

  return Object.assign({}, rest, {
    url: redisUrl,
    socket: socketOptions,
  });
}

module.exports = { getRedisClientConfig };
