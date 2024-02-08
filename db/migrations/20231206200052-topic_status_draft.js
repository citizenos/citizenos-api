'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface) {
      await queryInterface.sequelize.query(
          `ALTER TYPE "enum_Topics_status" ADD VALUE 'draft' BEFORE 'inProgress'`
      );
  },

  async down () {
    console.log('NO ROLLBACK FOR THIS MIGRATION.');
      console.log('IF you want to revert this. You need to decide what to do with the data that has the new Topic.status="draft".');
      console.log('Once the data has been cleaned up, that is, no "draft" is used, you need to recreate the ENUM without the "draft" because at this point PG does not support droping values from ENUM');
  }
};
