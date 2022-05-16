'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserNotificationSettings', {
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Id of the User whom the connection belongs to.',
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
      references: {
          model: 'Topics',
          key: 'id'
      },
      unique: false
    },
    groupId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
          model: 'Groups',
          key: 'id'
      },
      unique: false
    },
    allowNotifications: {
        type: Sequelize.BOOLEAN,
        default: false
    },
    preferences: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Notification pecific data you want to store.'
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
    }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('UserNotificationSettings');
  }
};