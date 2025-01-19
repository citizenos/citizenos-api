'use strict';

const { Sequelize } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Ideations', 'allowAnonymous', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Whether the ideation allows anonymous ideas'
        }, { transaction: t }),
        queryInterface.changeColumn('Ideas', 'authorId', {
          type: Sequelize.UUID,
          allowNull: true,
          comment: 'Author of the idea',
          references: {
              model: 'Users',
              key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        }, { transaction: t })
      ]);
    })
  },
  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Ideations', 'allowAnonymous', { transaction: t }),
        queryInterface.changeColumn('Ideas', 'authorId', {
          type: Sequelize.UUID,
          allowNull: false,
          comment: 'Author of the idea',
          references: {
              model: 'Users',
              key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        }, { transaction: t })
      ]);
    })
  }
};
