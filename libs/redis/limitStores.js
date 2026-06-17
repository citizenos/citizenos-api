"use strict";

const config = require("config");
const { RedisStore: RedisStoreSession } = require("connect-redis");
const { RedisStore } = require("rate-limit-redis");

module.exports = function (client) {
  if (config.rateLimit && config.rateLimit.storageType === "redis") {
    /*Set Redis Session store*/
    config.session.store = new RedisStoreSession({
      client,
    });
  }

  return {
    getRateLimitStore: (prefix) => {
        if (!config.rateLimit || config.rateLimit.storageType !== "redis") return undefined;
        return new RedisStore({
            client,
            prefix: prefix || "rl",
            sendCommand: (...args) => client.sendCommand(args),
        });
    },
    getSpeedLimitStore: (prefix) => {
        if (!config.rateLimit || config.rateLimit.storageType !== "redis") return undefined;
        return new RedisStore({
            client,
            prefix: prefix || "sl",
            sendCommand: (...args) => client.sendCommand(args),
        });
    }
  };
};
