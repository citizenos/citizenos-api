'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Reports_type" ADD VALUE 'other' AFTER 'duplicate'`
    );
},

down: async () => {
    console.log('NO ROLLBACK FOR THIS MIGRATION.');
    console.log('IF you want to revert this. You need to decide what to do with the data that has the new Report.type="other".');
    console.log('Once the data has been cleaned up, that is, no "other" is used, you need to recreate the ENUM without the "other" because at this point PG does not support droping values from ENUM');
}
};
