'use strict';

/**
 * Migration related to "REFACTOR: API/DB - "GroupMember" to "GroupMemberUser"" - https://github.com/citizenos/citizenos-api/issues/198
 */

module.exports = {
  up: async (queryInterface, Sequelize) => { //eslint-disable-line no-unused-vars
    const t = await queryInterface.sequelize.transaction();
    try {
      console.info('Modify ENUM "enum_GroupInviteUsers_level" - remove "edit" and "none" values...');
      await queryInterface.sequelize.query(`ALTER TYPE "enum_GroupInviteUsers_level" RENAME TO "enum_GroupInviteUsers_level_old"`, {transaction: t});
      await queryInterface.sequelize.query(`CREATE TYPE "enum_GroupInviteUsers_level" AS ENUM ('read', 'admin')`, {transaction: t});
      await queryInterface.sequelize.query(`ALTER TABLE "GroupInviteUsers" ALTER COLUMN "level" DROP DEFAULT`, {transaction: t}); // Temporary removal of default value so that I can alter column type to the new ENUM
      await queryInterface.sequelize.query(`ALTER TABLE "GroupInviteUsers" ALTER COLUMN "level" TYPE "enum_GroupInviteUsers_level" USING "level"::text::"enum_GroupInviteUsers_level"`, {transaction: t});
      await queryInterface.sequelize.query(`ALTER TABLE "GroupInviteUsers" ALTER COLUMN "level" SET DEFAULT 'read'::"enum_GroupInviteUsers_level"`, {transaction: t}); // Add back the default value
      await queryInterface.sequelize.query(`DROP TYPE "enum_GroupInviteUsers_level_old"`, {transaction: t});

      console.info('Rename ENUM "enum_GroupMembers_level" to "enum_GroupMemberUsers_level ...');
      await queryInterface.sequelize.query(`ALTER TYPE "enum_GroupMembers_level" RENAME TO "enum_GroupMemberUsers_level"`, {transaction: t});

      console.info('Rename TABLE "GroupMembers" TO "GroupMemberUsers"...');
      await queryInterface.sequelize.query(`ALTER TABLE "GroupMembers" RENAME TO "GroupMemberUsers"`, {transaction: t});

      console.info('Update Activites - "GroupMember" to "GroupMemberUser"...');
      const activityResult = await queryInterface.sequelize.query(`UPDATE "Activities" SET data = (REPLACE(data::text, '"GroupMember"', '"GroupMemberUser"'))::jsonb WHERE data::text LIKE '%"GroupMember"%'`, {transaction: t});
      console.log('... number of Activities modified: ', activityResult[1].rowCount);

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => { //eslint-disable-line no-unused-vars
    console.log('NO ROLLBACK FOR THIS MIGRATION.');
    console.log('IF ANY PARTS OF THE MIGRATION FAILED, THE WHOLE MIGRATION WAS ROLLED BACK.');
  }
};
