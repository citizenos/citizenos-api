'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.renameTable('TopicPins', 'TopicFavourites', { transaction: t }),
        queryInterface.createTable('GroupFavourites', {
          groupId: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'To what Topic this row belongs to.',
            references: {
              model: 'Groups',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
          },
          userId: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'Which User this row belongs to.',
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
          }
        }, {
          transaction: t,
          timestamps: false
        })
      ])
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.renameTable('TopicPins', 'TopicFavourites', { transaction: t }),
        queryInterface.dropTable('GroupFavourites', { transaction: t })
      ]);
    });
  }
};
