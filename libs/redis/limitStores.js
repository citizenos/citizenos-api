"use strict";

const config = require("config");
const RedisStoreSession = require("connect-redis").default;
const { RedisStore } = require("rate-limit-redis");

module.exports = function (client) {
  let rateLimitStore, speedLimitStore;
  if (config.rateLimit && config.rateLimit.storageType === "redis") {
    rateLimitStore = new RedisStore({
      client,
      prefix: "rl",
      sendCommand: (...args) => client.sendCommand(args),
    });

    speedLimitStore = new RedisStore({
      client,
      prefix: "sl",
      sendCommand: (...args) => client.sendCommand(args),
    });

    /*Set Redis Session store*/
    config.session.store = new RedisStoreSession({
      client,
    });
  }

  return {
    rateLimitStore,
    speedLimitStore,
  };
};
