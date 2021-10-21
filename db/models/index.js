'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const config = require('config').util.loadFileConfigs('./config');
const db = {};
const _ = require('lodash');

// Set up DB logging
const log4js = require('log4js');
if (typeof config.logging === 'string') {
    config.logging = JSON.parse(config.logging); // Support JSON string from ENV
}
log4js.configure(config.logging.log4js);
const logger = log4js.getLogger(process.env.NOTE_ENV);

const defaultLoggingFunction = function (query) {
    logger.debug('DB', query);
};

const dbOptions = config.db.options;
config.db.options.pool.max = parseInt(config.db.options.pool.max); // FIXME: https://github.com/citizenos/citizenos-api/issues/137
config.db.options.pool.min = parseInt(config.db.options.pool.min); // FIXME: https://github.com/citizenos/citizenos-api/issues/137

if (dbOptions.logging && typeof dbOptions.logging !== 'function') {
    dbOptions.logging = defaultLoggingFunction;
}

if (dbOptions.sync && dbOptions.sync.logging && typeof dbOptions.sync.logging !== 'function') {
    dbOptions.sync.logging = defaultLoggingFunction;
}

if (dbOptions.operatorsAliases === 'undefined') {
    dbOptions.operatorsAliases = Sequelize.Op;
}

const dbConfSanitized = _.cloneDeep(config.db);
if (process.env.NODE_ENV !== 'development') {
    dbConfSanitized.url = dbConfSanitized.url ? dbConfSanitized.url.replace(/\/\/.*:.*@/g, '//*****:*****@') : dbConfSanitized.url;
    dbConfSanitized.options.username = dbConfSanitized.options.username ? '*******' : dbConfSanitized.options.username;
    dbConfSanitized.options.password = dbConfSanitized.options.password ? '*******' : dbConfSanitized.options.password;
}

logger.info(
    'Sequelize connection configuration',
    dbConfSanitized
);

let sequelize;
if (config.db.url) {
    sequelize = new Sequelize(config.db.url, dbOptions);
} else {
    sequelize = new Sequelize(dbOptions);
}

sequelize
    .authenticate()
    .then(
        function () {
            logger.info('Successfully connected to DB');
        },
        function (err) {
            logger.error('Unable to connect do database. Bye bye!', err);
            process.exit(1);
        }
    );

fs
    .readdirSync(__dirname)
    .filter((file) => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js') && file.indexOf('_') !== 0;
    })
    .forEach((file) => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});


// IF PG is used we need to enable "parseInt8" so that counts would actually be numeric in JS - https://github.com/sequelize/sequelize/issues/2383
// Might want to find better place for this logic...
const pg = require('pg');

if (pg) {
    // pg is a singleton so the same instance is in Sequelize-s guts thus the settings work.
    pg.defaults.parseInt8 = true;
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
