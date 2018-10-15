'use strict';

/**
 * Sequelize migrations configuration
 */
const config = require('config').util.loadFileConfigs('./config');

module.exports = {
    development: Object.assign({url: config.db.url}, config.db.options),
    test: Object.assign({url: config.db.url}, config.db.options),
    production: Object.assign({url: config.db.url}, config.db.options)
};
