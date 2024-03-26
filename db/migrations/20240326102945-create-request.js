'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const LEVELS = {
      none: 'none', // Enables to override inherited permissions.
      read: 'read',
      edit: 'edit',
      admin: 'admin'
    };
    const TYPES = {
      addTopicGroup: 'addTopicGroup',
      addGroupTopic: 'addGroupTopic',
      userTopic: 'userTopic',
      userGroup: 'userGroup'
    }
    await queryInterface.createTable('Requests',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.UUIDV4
        },
        creatorId: {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'User who created the request.',
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          primaryKey: true
        },
        topicId: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Topic related to the request',
          references: {
            model: 'Topics',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          primaryKey: true
        },
        groupId: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Group related to the request.',
          references: {
            model: 'Groups',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          primaryKey: true
        },
        level: {
          type: Sequelize.ENUM,
          values: Object.values(LEVELS),
          allowNull: false,
          defaultValue: LEVELS.read,
          comment: 'Permission level related to the request.'
        },
        text: {
          type: Sequelize.STRING(2048),
          allowNull: true,
          comment: 'Additional comment for request, or message to the admin.'
        },
        type: {
          type: Sequelize.ENUM,
          values: Object.values(TYPES),
          allowNull: false,
          comment: 'Type of the request'
        },
        acceptedAt: {
          allowNull: true,
          type: Sequelize.DATE,
          comment: 'Request accepting time'
        },
        rejectedAt: {
          allowNull: true,
          type: Sequelize.DATE,
          comment: 'Request rejection time'
        },
        actorId: {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'User who accepted or rejected the request.',
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        deletedAt: {
          allowNull: true,
          type: Sequelize.DATE
        },
      });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Requests');
  }
};
