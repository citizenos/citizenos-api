'use strict';

const _ = require('lodash');
// All possible permission levels.

const LEVELS = {
  read: 'read',
  admin: 'admin'
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('GroupInviteUsers', {
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
      groupId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Group to which member belongs.',
        references: {
          model: 'Groups',
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
    return queryInterface.dropTable('GroupInviteUsers');
  }
};
