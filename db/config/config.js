'use strict';

/**
 * Sequelize migrations configuration
 */
const config = require('config').util.loadFileConfigs('./config');

module.exports = {
    development: config.db,
    test: config.db,
    production: config.db
};
