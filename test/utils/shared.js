'use strict';

/**
 * Shared functionality of all Mocha tests
 *
 * @see {@link https://github.com/mochajs/mocha/wiki/Shared-Behaviours}
 */

const app = require('../../app');
const logger = app.get('logger');
const db = app.get('models').sequelize;

const syncDb = async function () {
    if (['true', '1'].indexOf(process.env.FORCE_DB_SYNC) > -1 && app.get('env') !== 'production') {
        return db
            .sync({
                force: true,
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
