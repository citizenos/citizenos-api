"use strict";

const config = require("config");
const { createClient } = require("redis");
const log4js = require("log4js");

module.exports = function (app) {
  const logger = log4js.getLogger(app.settings.env);

  const redisUrl = config.rateLimit?.client?.url;
  const redisOptions = config.rateLimit?.client?.options;
  const redisConf = Object.assign(
    { url: process.env.REDIS_URL || redisUrl },
    redisOptions
  );
  const client = createClient(redisConf);

  client.on("error", (err) => logger.error("Redis Client Error", err));
  client.on("end", () => {
    logger.log("Redis connection ended");
  });
  client.connect();

  const {
    setResetPasswordToken,
    getResetPasswordToken,
    deleteResetPasswordToken,
  } = require("./cache")(client);

  const { rateLimitStore, speedLimitStore } = require("./limitStores")(client);

  return {
    rateLimitStore,
    speedLimitStore,
    client,
    setResetPasswordToken,
    getResetPasswordToken,
    deleteResetPasswordToken,
  };
};
