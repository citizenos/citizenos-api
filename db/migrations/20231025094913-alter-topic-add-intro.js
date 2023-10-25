'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    queryInterface.addColumn('Topics', 'intro', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Topic introduction text'
    })
  },

  async down (queryInterface) {
    return queryInterface.removeColumn('Topics', 'intro');
  }
};
