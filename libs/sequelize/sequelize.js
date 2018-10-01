'use strict';

var Sequelize = require('sequelize');

/**
 * Get Sequelize instance.
 *
 * Default behavior is to authenticate() and process.exit(1) if the authentication fails.
 *
 * @param {string} uri - Database connection string (Ex: postgres://user:pass@localhost:5432/mydb)
 * @param {object} [options] - Sequelize options object - http://sequelizejs.com/docs/1.7.8/usage#options
 * @param {object} [logger=console] - Used for the default query logging function.. Object must satisfy the traditional logger interface meaning has .log, .info, .error, .debug, .warn functions.
 *
 * @returns {Sequelize} Sequelize instance
 */
var sequelize = function (uri, options, logger) {
    logger = logger || console;

    var defaultLoggingFunction = function (query) {
        logger.debug('DB QUERY', query);
    };

    if (options.logging && typeof options.logging !== 'function') {
        options.logging = defaultLoggingFunction;
    }

    if (options.sync && options.sync.logging && typeof options.sync.logging !== 'function') {
        options.sync.logging = defaultLoggingFunction;
    }

    if (options.operatorsAliases === 'undefined') {
        options.operatorsAliases = Sequelize.Op;
    }

    logger.info(
        'Sequelize connection configuration',
        process.env.NODE_ENV === 'development' ? uri : uri.replace(/\/\/.*:.*@/g, '//*****:*****@'),
        options
    );

    var s = new Sequelize(uri, options);
    s
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

    // IF PG is used we need to enable "parseInt8" so that counts would actually be numeric in JS - https://github.com/sequelize/sequelize/issues/2383
    // Might want to find better place for this logic...
    var pg = require('pg');

    if (pg) {
        // pg is a singleton so the same instance is in Sequelize-s guts thus the settings work.
        pg.defaults.parseInt8 = true;
    }

    return s;
};

module.exports = sequelize;
