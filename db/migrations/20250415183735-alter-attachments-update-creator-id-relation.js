"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE "Attachments" ALTER COLUMN "creatorId" DROP NOT NULL;'
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE "Attachments" ALTER COLUMN "creatorId" SET NOT NULL;'
    );
  },
};
