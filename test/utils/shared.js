'use strict';

/**
 * Shared functionality of all Mocha tests
 *
 * @see {@link https://github.com/mochajs/mocha/wiki/Shared-Behaviours}
 */

var app = require('../../app');
var logger = app.get('logger');
var Promise = app.get('Promise');
var db = app.get('models').sequelize;

var syncDb = function () {
    if (process.env.FORCE_DB_SYNC == true && app.get('env') !== 'production') { // eslint-disable-line no-process-env, eqeqeq
        return db
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

module.exports.syncDb = syncDb;
