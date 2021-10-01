const stringUtil = require('../../libs/util');

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
                INSERT INTO 
                    "TopicJoins"
                VALUES (
                    SELECT "id", LPAD("tokenJoin", 12, '0'), 'read', NOW(), NOW(), null FROM "Topics"
                );
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

            throw new Error('Incomplete migration, force rollback with error!'); // FIXME: REMOVE ONCE COMPLETE
        });


    },
    down: async (queryInterface, Sequelize) => {
        const path = require('path');

        console.warn('Down is not implemented for migration ', path.basename(__filename), '. Did not find a need for it as the migration runs in a transaction.');
    }
};
