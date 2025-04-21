"use strict";

module.exports = function (client) {
  const setResetPasswordToken = async (key, ttl, data) => {
    await client.setEx(key, ttl, JSON.stringify(data));
  };

  const getResetPasswordToken = async (key) => {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  };

  const deleteResetPasswordToken = async (key) => {
    await client.del(key);
  };

  return {
    setResetPasswordToken,
    getResetPasswordToken,
    deleteResetPasswordToken,
  };
};
