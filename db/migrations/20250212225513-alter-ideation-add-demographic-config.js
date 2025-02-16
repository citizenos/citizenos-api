"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn(
        "Ideations",
        "demographicsConfig",
        {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: "Idea demographics fields configuration",
        },
        { transaction: t }
      );
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn("Ideations", "demographicsConfig", {
          transaction: t,
        }),
      ]);
    });
  },
};
