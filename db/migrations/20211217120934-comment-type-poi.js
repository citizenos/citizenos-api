'use strict';

module.exports = {
    up: async (queryInterface) => {
        return queryInterface.sequelize.transaction(async function (t) {
            await queryInterface.sequelize.query(
                `ALTER TYPE "enum_Comments_type" ADD VALUE 'poi' AFTER 'pro'`,
                {
                    transaction: t
                }
            );
        });
    },

    down: async () => {
        console.log('NO ROLLBACK FOR THIS MIGRATION.');
        console.log('IF ANY PARTS OF THE MIGRATION FAILED, THE WHOLE MIGRATION WAS ROLLED BACK.');
        console.log('IF you want to revert this. You need to decide what to do with the data that has the new Comment.type="poi".')
        console.log('Once the data has been cleaned up, that is, no "poi" is used, you can remove "poi" from the ENUM.')
    }
};
