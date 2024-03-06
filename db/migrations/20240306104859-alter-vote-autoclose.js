'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Votes', 'autoClose', Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.JSONB));
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Votes', 'autoClose', Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.JSON));
  }
};
