'use strict';

/**
 * Shared functionality of all Mocha tests
 *
 * @see {@link https://github.com/mochajs/mocha/wiki/Shared-Behaviours}
 */

module.exports = function (app) {
    var logger = app.get('logger');

    var _syncDb = function () {
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

    return {
        syncDb: _syncDb
    };
};
