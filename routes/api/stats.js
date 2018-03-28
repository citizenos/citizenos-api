'use strict';

/**
 * Statistics related routes
 *
 * @param {object} app Express App object
 */

module.exports = function (app) {

    var db = app.get('db');

    app.get('/api/stats', function (req, res, next) {
        db
            .query(
                ' \
                SELECT \
                ( \
                    SELECT COUNT(*) FROM "Topics" WHERE title IS NOT NULL \
                ) AS "topicsCreated", \
                ( \
                    SELECT COUNT(*) FROM "VoteLists" \
                ) AS "votesCast", \
                ( \
                    SELECT COUNT(*) FROM "Groups" \
                ) AS "groupsCreated", \
                ( \
                    SELECT COUNT(*) FROM "Users" \
                ) AS "usersCreated" \
                ; \
                ',
                {
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .spread(function (results) {
                return res.ok(results);
            })
            .catch(next);
    });

};
