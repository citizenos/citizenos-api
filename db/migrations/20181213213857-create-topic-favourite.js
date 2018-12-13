'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('TopicFavourites', {
      topicId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Favourite belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which User this Favourite belongs to.',
        references: {
            model: 'Users',
            key: 'id'
        },
        primaryKey: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('TopicFavourites');
  }
};