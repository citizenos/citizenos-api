'use strict';

var _ = require('lodash');
const LEVELS = {
    none: 'none', // Enables to override inherited permissions.
    read: 'read',
    edit: 'edit',
    admin: 'admin'
};

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('TopicInviteUsers', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4
            },
            creatorId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'User who created the invite.',
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'User who is invited.',
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            topicId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'Topic to which member belongs.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                primaryKey: true
            },
            level: {
                type: Sequelize.ENUM,
                values: _.values(LEVELS),
                allowNull: false,
                defaultValue: LEVELS.read,
                comment: 'User membership level.'
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
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('TopicInviteUsers');
    }
};