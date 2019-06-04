'use strict';

/**
 * Sequelize migrations configuration
 */
const config = require('config').util.loadFileConfigs('./config');

config.db.options.pool.max = parseInt(config.db.options.pool.max); // FIXME: https://github.com/citizenos/citizenos-api/issues/137
config.db.options.pool.min = parseInt(config.db.options.pool.min); // FIXME: https://github.com/citizenos/citizenos-api/issues/137

module.exports = {
    development: Object.assign({url: config.db.url}, config.db.options),
    test: Object.assign({url: config.db.url}, config.db.options),
    production: Object.assign({url: config.db.url}, config.db.options)
};
