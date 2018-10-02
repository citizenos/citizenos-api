'use strict';

/**
 * Shared functionality of all Mocha tests
 *
 * @see {@link https://github.com/mochajs/mocha/wiki/Shared-Behaviours}
 */

var app = require('../../app');
var logger = app.get('logger');
var Promise = app.get('Promise');

var syncDb = function () {
    if (process.env.FORCE_DB_SYNC == true && app.get('env') !== 'production') { // eslint-disable-line no-process-env, eqeqeq
        return app
            .get('db')
            .sync({
                logging: function (msg) {
                    logger.info(msg);
                }
            })
            .then(function () {
                return Promise.resolve();
            });
    } else {
        return Promise.resolve();
    }
};

var interval;

var closeDb = function () {
    // HACK: I want to keep the --no-exit flag to detect leaks, but that means I have to call sequelize.close() for Sequelize to exit.
    // BUT, as in the universe of these tests there is only one instance of Sequelize, thus if I call sequelize.close() in the suiteTearDown(), next tests will fail cause they cannot get a connection.
    // Sequelize has pool.min, pool.idle and pool.evict which clean up the pool, but that by design does not exit Sequelize.
    // So I have 2 options: this hack or in suiteSetup each test sets a new Sequelize connection and kills it later. Right now it's the hack.
    if (!interval) {
        interval = setInterval(function () {
            if (app.get('db').connectionManager.pool._allObjects.size === 0) {
                clearInterval(interval);
                app.get('db')
                    .close()
                    .then(function () {
                        logger.info('DB connection force closed from shared.closeDb as the pool was empty.');
                    });
            }
        }, 5000);
    }

    return Promise.resolve();
};

module.exports.syncDb = syncDb;
module.exports.closeDb = closeDb;
