'use strict';
const config = require('config');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TokenRevocations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tokenId: {
        type: Sequelize.UUID,
        comment: 'Token Id that has been revoked',
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      expiresAt: {
        type: Sequelize.DATE,
        comment: 'Token expiration time, after that this entry is not relevant anymore',
        allowNull: false,
        defaultValue: function () {
            return new Date((new Date()).getTime() + (config.session.cookie.maxAge * 1000));
        }
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
  down: async (queryInterface) => {
    await queryInterface.dropTable('TokenRevocations');
  }
};
