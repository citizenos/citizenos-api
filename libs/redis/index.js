"use strict";

const config = require("config");
const { createClient } = require("redis");
const log4js = require("log4js");
const { getRedisClientConfig } = require("./clientConfig");

/** Interval (ms) for PING to keep connection alive when idle (e.g. cloud Redis timeouts). */
const PING_INTERVAL_MS = 30 * 1000;

module.exports = function (app) {
  const logger = log4js.getLogger(app.settings.env);

  const redisConf = getRedisClientConfig(config);
  const client = createClient(redisConf);

  client.on("error", (err) => logger.error("Redis Client Error", err));
  client.on("end", () => {
    logger.log("Redis connection ended");
  });
  client.connect().then(() => {
    const pingInterval = setInterval(() => {
      client.ping().catch((err) => logger.error("Redis PING failed", err));
    }, PING_INTERVAL_MS);
    pingInterval.unref();
  });

  const {
    setResetPasswordToken,
    getResetPasswordToken,
    deleteResetPasswordToken,
  } = require("./cache")(client);

  const {
    getRateLimitStore,
    getSpeedLimitStore,
  } = require("./limitStores")(client);

  return {
    getRateLimitStore,
    getSpeedLimitStore,
    client,
    setResetPasswordToken,
    getResetPasswordToken,
    deleteResetPasswordToken,
  };
};
