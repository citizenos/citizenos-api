'use strict';

/**
 * Topic related internal API-s
 */

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const authApiKey = app.get('middleware.authApiKey');

    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;

    /**
     * Get Topic permissions for a User
     */

    app.get('/api/internal/topics/:topicId/permissions', authApiKey, async function (req, res, next) {
        const topicId = req.params.topicId;
        const userId = req.query.userId;
        try {
            if (userId) {
                // TODO: The query is quite close to topic.js hasAccess, should try to reuse?
                const results = await db
                    .query(`
                        SELECT
                            t.visibility = 'public' AS "isPublic",
                            t.status,
                            COALESCE(tmup.level, tmgp.level, 'none') as level
                        FROM "Topics" t
                            LEFT JOIN (
                                SELECT
                                    tmu."topicId",
                                    tmu."userId",
                                    tmu.level::text AS level
                                FROM "TopicMemberUsers" tmu
                                WHERE tmu."deletedAt" IS NULL
                            ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                            LEFT JOIN (
                                SELECT
                                    tmg."topicId",
                                    gm."userId",
                                    MAX(tmg.level)::text AS level
                                FROM "TopicMemberGroups" tmg
                                    JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                                WHERE tmg."deletedAt" IS NULL
                                AND gm."deletedAt" IS NULL
                                GROUP BY "topicId", "userId"
                            ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
                        WHERE t.id = :topicId
                            AND t."deletedAt" IS NULL;
                        `,
                        {
                            replacements: {
                                topicId: topicId,
                                userId: userId
                            },
                            type: db.QueryTypes.SELECT,
                            raw: true
                        }
                    );
                if (results && results[0]) {
                    const permissions = results[0];

                    // If it's a public topic, allow anyone to read.
                    if ((permissions.level === TopicMemberUser.LEVELS.none && permissions.isPublic) || permissions.status !== Topic.STATUSES.inProgress) {
                        permissions.level = TopicMemberUser.LEVELS.read;
                    }

                    return res.ok(permissions);
                } else {
                    return res.ok({level: TopicMemberUser.LEVELS.none});
                }
            } else { // Public Topic?
                const count = await Topic
                    .count({
                        where: {
                            id: req.params.topicId,
                            visibility: Topic.VISIBILITY.public
                        }
                    });
                let level = TopicMemberUser.LEVELS.none;

                if (count) {
                    level = TopicMemberUser.LEVELS.read;
                }

                return res.ok({level: level});
            }
        } catch (err) {
            return next(err);
        }
    });
};
