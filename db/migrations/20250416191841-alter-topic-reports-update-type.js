'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Check if the value already exists in the enum before adding it
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        -- Check if 'other' value already exists in the enum
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'other'
          AND enumtypid = (
            SELECT oid
            FROM pg_type
            WHERE typname = 'enum_TopicReports_type'
          )
        ) THEN
          -- If it doesn't exist, add it
          ALTER TYPE "enum_TopicReports_type" ADD VALUE 'other' AFTER 'duplicate';
        END IF;
      END
      $$;
    `);
  },

  async down() {
    console.log('NO ROLLBACK FOR THIS MIGRATION.');
    console.log('IF you want to revert this. You need to decide what to do with the data that has the new Report.type="other".');
    console.log('Once the data has been cleaned up, that is, no "other" is used, you need to recreate the ENUM without the "other" because at this point PG does not support droping values from ENUM');
  }
};
