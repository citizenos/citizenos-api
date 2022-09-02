const stringUtil = require('../../libs/util');

'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        console.log('Migration for https://github.com/citizenos/citizenos-fe/issues/325');

        const TOKEN_LENGTH = 12;
        const LEVELS = {
            read: 'read',
            admin: 'admin'
        };

        const generateTokenJoin = function () {
            return stringUtil.randomString(TOKEN_LENGTH);
        };

        return queryInterface.sequelize.transaction(async function (t) {
            await queryInterface.createTable(
                'GroupJoins',
                {
                    groupId: {
                        type: Sequelize.UUID,
                        allowNull: false,
                        comment: 'Group to which the Join information belongs.',
                        references: {
                            model: 'Groups',
                            key: 'id'
                        },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE',
                        primaryKey: true
                    },
                    token: {
                        type: Sequelize.STRING(TOKEN_LENGTH),
                        comment: 'Token for joining the Group. Used for sharing public urls for Users to join the Group.',
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

            // Create a GroupJoins entry for each Group
            const createGroupJoins = await queryInterface.sequelize.query(
                `
                INSERT INTO "GroupJoins"
                    SELECT
                        id,
                        substr(
                            regexp_replace(
                                encode(
                                    decode(
                                        md5(random()::text), 'hex'
                                    ),
                                    'base64'
                                ),
                                '\\W',
                                '',
                                'g'
                            ),
                            1,
                            12
                        ),
                        'read',
                        NOW(),
                        NOW(),
                        null
                    FROM "Groups"
                `,
                {
                    transaction: t
                }
            );

            console.info('GroupJoin migration updated row count:', createGroupJoins[1]);
        });
    },
    down: async (queryInterface) => {
        await queryInterface.dropTable('GroupJoins');
    }
};
