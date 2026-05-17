'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;

    /**
     * Execute database operations inside a transaction.
     * Use t.afterCommit() inside work for post-commit side effects (email, response).
     *
     * @param {Function} work async function(t) — receives the Sequelize transaction
     * @returns {Promise}
     */
    const withTransaction = (work) => db.transaction(work);

    return { withTransaction };
};
