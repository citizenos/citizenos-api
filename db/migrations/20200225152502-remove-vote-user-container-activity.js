'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.query('DELETE FROM "Activities" WHERE data->\'object\'->>\'@type\'=\'VoteUserContainer\'')
            .then(function (res) {
                console.log(`DELETED ${res[1].rowCount} ACTIVITIES!`);

                return Promise.resolve();
            });
    },
    down: (queryInterface) => {
        console.log('NO UNDO FOR THIS MIGRATION!', __filename);

        return Promise.resolve();
    }
};