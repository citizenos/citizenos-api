'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.changeColumn('UserConnections', 'connectionData', Sequelize.DataTypes.JSONB);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.changeColumn('UserConnections', 'connectionData', Sequelize.DataTypes.JSON);
  }
};
