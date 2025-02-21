'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Ideas', 'status', {
        type: Sequelize.ENUM('draft', 'published'),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Idea status',
        transaction: t
      });

      await queryInterface.sequelize.query(`UPDATE "Ideas" SET "status" = 'published';`, {
        transaction: t
      });
    });
  },

  async down (queryInterface) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Ideas', 'status', { transaction: t });
    });
  }
};
