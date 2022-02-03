'use strict';

module.exports = {
    async up (queryInterface) {
        await queryInterface.sequelize.query(
            `COMMENT ON COLUMN "Users"."password" IS 'Password hash. NULL if User was created on invitation OR with another method like ESTEID, FB, Google.'`
        );
    },

    async down () {
        console.log('NO ROLLBACK FOR THIS MIGRATION. Only updates a comment on a field.');
    }
};
