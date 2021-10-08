const stringUtil = require('../../libs/util');
const path = require('path');

'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        console.log('Migration for https://github.com/citizenos/citizenos-fe/issues/311');

        const TOKEN_LENGTH = 12;
        const LEVELS = {
            read: 'read',
            edit: 'edit',
            admin: 'admin'
        };

        const generateTokenJoin = function () {
            return stringUtil.randomString(TOKEN_LENGTH);
        };


        return queryInterface.sequelize.transaction(async function (t) {
            await queryInterface.createTable(
                'TopicJoins',
                {
                    topicId: {
                        type: Sequelize.UUID,
                        allowNull: false,
                        comment: 'Topic to which the Join information belongs.',
                        references: {
                            model: 'Topics',
                            key: 'id'
                        },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE',
                        primaryKey: true
                    },
                    token: {
                        type: Sequelize.STRING(TOKEN_LENGTH),
                        comment: 'Token for joining the Topic. Used for sharing public urls for Users to join the Topic.',
                        allowNull: false,
                        unique: true,
                        defaultValue: function () {
                            return generateTokenJoin();
                        }
                    },
                    level: {
                        type: Sequelize.ENUM,
                        values: Object.values(LEVELS),
                        allowNull: false,
                        defaultValue: LEVELS.read,
                        comment: 'Join level, that is what level access will the join token provide'
                    },
                    createdAt: {
                        type: Sequelize.DATE,
                        allowNull: false
                    },
                    updatedAt: {
                        type: Sequelize.DATE,
                        allowNull: false
                    },
                    deletedAt: {
                        type: Sequelize.DATE
                    }
                },
                {
                    transaction: t
                }
            );

            // Create a TokenJoins entry for each Topic to pull over old token, pad them 0-s as they are shorter
            await queryInterface.sequelize.query(
                `
                INSERT INTO "TopicJoins"
                    SELECT id, LPAD("tokenJoin", 12, '0'), 'read', NOW(), NOW(), null FROM "Topics"
                `,
                {
                    transaction: t
                }
            );

            await queryInterface.removeColumn(
                'Topics',
                'tokenJoin',
                {
                    transaction: t
                }
            );

            // Update all "Topic.tokenJoin" modification activities to "TopicJoin.token" activities
            const queryUpdateActivities = `
                UPDATE "Activities" a
                SET "data" = (
                    replace(
                        replace(
                            replace(
                                replace(
                                    replace(
                                        '{
                                            "type": "Update",
                                            "actor": {
                                                "id": ":USER_ID",
                                                "type": "User"
                                            },
                                            "object": {
                                                "@type": "TopicJoin",
                                                "level": "read",
                                                "token": "0000:TOKEN_OLD",
                                                "topicId": ":TOPIC_ID"
                                            },
                                            "origin": {
                                                "@type": "TopicJoin",
                                                "level": "read",
                                                "token": "0000:TOKEN_OLD"
                                            },
                                            "result": [
                                                {
                                                    "op": "replace",
                                                    "path": "/token",
                                                    "value": "0000:TOKEN_NEW"
                                                }
                                            ],
                                            "context": "PUT /api/users/:USER_ID/topics/:TOPIC_ID/join",
                                            "__migratedAt": ":MIGRATION_TIMESTAMP",
                                            "__migrationId": "${path.basename(__filename)}"
                                        }'
                                        , ':TOPIC_ID'
                                        , a."topicIds"[1]
                                    )
                                    , ':USER_ID'
                                    , a."actorId"
                                )
                                , ':TOKEN_OLD'
                                , a.data#>>'{origin, tokenJoin}'
                            )
                            , ':TOKEN_NEW'
                            , (a.data->'result'#>'{0}')#>>'{value}'
                        )
                        , ':MIGRATION_TIMESTAMP'
                        , NOW()::text
                    )
                )::jsonb
                WHERE
                    a.data @> '{"type": "Update"}'::jsonb
                    AND (a.data->'result')::text ILIKE '%/tokenJoin%'
            `;

            const activityMigrationResult = await queryInterface.sequelize.query(
                queryUpdateActivities,
                {
                    transaction: t
                }
            );

            console.info('Activity migration updated row count:', activityMigrationResult[1].rowCount);
        });
    },
    down: async () => {
        const path = require('path');

        console.warn('Down is not implemented for migration ', path.basename(__filename), '. Did not find a need for it as the migration runs in a transaction.');
    }
};
