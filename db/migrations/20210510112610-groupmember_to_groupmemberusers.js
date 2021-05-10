'use strict';

/**
 * Migration related to "REFACTOR: API/DB - "GroupMember" to "GroupMemberUser"" - https://github.com/citizenos/citizenos-api/issues/198
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const t = await queryInterface.sequelize.transaction();
    try {
      // Modify remove "edit" and "none" values from the "enum_GroupInviteUsers_level"
      console.info('Modify "enum_GroupInviteUsers_level" - remove "edit" and "none" values...');
      queryInterface.sequelize.query(`ALTER TYPE "enum_GroupInviteUsers_level" RENAME TO "enum_GroupInviteUsers_level_old"`, {transaction: t});
      queryInterface.sequelize.query(`CREATE TYPE "enum_GroupInviteUsers_level" AS ENUM ('read', 'admin')`, {transaction: t});
      queryInterface.sequelize.query(`ALTER TABLE "GroupInviteUsers" ALTER COLUMN "level" DROP DEFAULT`, {transaction: t}); // Temporary removal of default value so that I can alter column type to the new ENUM
      queryInterface.sequelize.query(`ALTER TABLE "GroupInviteUsers" ALTER COLUMN "level" TYPE "enum_GroupInviteUsers_level" USING "level"::text::"enum_GroupInviteUsers_level"`, {transaction: t});
      queryInterface.sequelize.query(`ALTER TABLE "GroupInviteUsers" ALTER COLUMN "level" SET DEFAULT 'read'::"enum_GroupInviteUsers_level"`, {transaction: t}); // Add back the default value
      queryInterface.sequelize.query(`DROP TYPE "enum_GroupInviteUsers_level_old"`, {transaction: t});
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('NO ROLLBACK FOR THIS MIGRATION.');
    console.log('IF ANY PARTS OF THE MIGRATION FAILED, THE WHOLE MIGRATION WAS ROLLED BACK.');
  }
};
