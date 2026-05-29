'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('Topics', 'memberCount', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });

        await queryInterface.addColumn('Topics', 'commentCount', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });

        await queryInterface.addColumn('Topics', 'lastActivityAt', {
            type: Sequelize.DATE,
            allowNull: true
        });

        // Add indexes
        await queryInterface.addIndex('Topics', ['lastActivityAt'], {
            name: 'idx_topics_last_activity_at'
        });
        await queryInterface.addIndex('Topics', ['status', 'visibility', 'deletedAt'], {
            name: 'idx_topics_status_visibility_deleted'
        });

        // Initial data population
        // 1. lastActivityAt
        await queryInterface.sequelize.query(`
            UPDATE "Topics" t
            SET "lastActivityAt" = COALESCE(
                (
                    SELECT MAX(a."updatedAt")
                    FROM "Activities" a
                    WHERE ARRAY[t.id::text] <@ a."topicIds"
                ),
                t."updatedAt"
            )
        `);

        // 2. commentCount
        await queryInterface.sequelize.query(`
            UPDATE "Topics" t
            SET "commentCount" = COALESCE(tc.count, 0)
            FROM (
                SELECT td."topicId", COUNT(dc."commentId") as count
                FROM "TopicDiscussions" td
                JOIN "DiscussionComments" dc ON td."discussionId" = dc."discussionId"
                GROUP BY td."topicId"
            ) tc
            WHERE t.id = tc."topicId"
        `);

        // 3. memberCount
        await queryInterface.sequelize.query(`
            UPDATE "Topics" t
            SET "memberCount" = COALESCE(muc.count, 0)
            FROM (
                SELECT tmu."topicId", COUNT(DISTINCT tmu."memberId")::integer AS "count" FROM (
                    SELECT
                        tmuu."topicId",
                        tmuu."userId" AS "memberId"
                    FROM "TopicMemberUsers" tmuu
                    WHERE tmuu."deletedAt" IS NULL
                    UNION
                    SELECT
                        tmg."topicId",
                        gm."userId" AS "memberId"
                    FROM "TopicMemberGroups" tmg
                        JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        JOIN "Groups" g ON g.id = tmg."groupId"
                    WHERE tmg."deletedAt" IS NULL
                    AND g."deletedAt" IS NULL
                    AND gm."deletedAt" IS NULL
                ) AS tmu GROUP BY "topicId"
            ) AS muc
            WHERE t.id = muc."topicId"
        `);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex('Topics', 'idx_topics_last_activity_at');
        await queryInterface.removeIndex('Topics', 'idx_topics_status_visibility_deleted');
        await queryInterface.removeColumn('Topics', 'memberCount');
        await queryInterface.removeColumn('Topics', 'commentCount');
        await queryInterface.removeColumn('Topics', 'lastActivityAt');
    }
};
