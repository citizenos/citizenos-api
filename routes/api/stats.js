'use strict';

/**
 * Statistics related routes
 *
 * @param {object} app Express App object
 */

module.exports = function (app) {

    const db = app.get('models').sequelize;
    const logger = app.get('logger');

    app.get('/api/stats', async function (req, res, next) {
        logger.info(`REQIP: ${req.ip}`, JSON.stringify(req.headers, null, 2));

        try {
            const [results] = await db
                .query(
                    `
                    SELECT
                    (
                        SELECT COUNT(*) FROM "Topics" WHERE title IS NOT NULL
                    ) AS "topicsCreated",
                    (
                        SELECT COUNT(*) FROM "VoteLists"
                    ) AS "votesCast",
                    (
                        SELECT COUNT(*) FROM "Groups"
                    ) AS "groupsCreated",
                    (
                        SELECT COUNT(*) FROM "Users"
                    ) AS "usersCreated"
                    ; `,
                    {
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            return res.ok(results);
        } catch (err) {
            return next(err);
        }

    });
};

