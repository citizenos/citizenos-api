'use strict';

/**
 * Shared functionality of all Mocha tests
 *
 * @see {@link https://github.com/mochajs/mocha/wiki/Shared-Behaviours}
 */

const app = require('../../app');
const logger = app.get('logger');
const Promise = app.get('Promise');
const db = app.get('models').sequelize;

const syncDb = async function () {
    if (process.env.FORCE_DB_SYNC == true && app.get('env') !== 'production') { // eslint-disable-line no-process-env, eqeqeq
        return db
            .sync({
                logging: function (msg) {
                    logger.info(msg);
                }
            });
    } else {
        return Promise.resolve();
    }
};

const randomIP = function () {
    const randomnr = () => (Math.floor(Math.random() * 255) + 1);
    return `${randomnr()}.${randomnr()}.${randomnr()}.${randomnr()}`;
};

module.exports.syncDb = syncDb;
module.exports.randomIP = randomIP;
