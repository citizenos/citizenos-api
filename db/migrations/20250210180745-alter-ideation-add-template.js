"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn(
        "Ideations",
        "template",
        {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: "Idea template",
        },
        { transaction: t }
      );
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn("Ideations", "template", {
          transaction: t,
        }),
      ]);
    });
  },
};
