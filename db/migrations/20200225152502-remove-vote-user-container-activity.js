'use strict';
module.exports = {
    up: (queryInterface) => {
        return queryInterface.sequelize.query('DELETE FROM "Activities" WHERE data->\'object\'->>\'@type\'=\'VoteUserContainer\'')
            .then(function (res) {
                console.log(`DELETED ${res[1].rowCount} ACTIVITIES!`);

                return Promise.resolve();
            });
    },
    down: () => {
        console.log('NO UNDO FOR THIS MIGRATION!', __filename);

        return Promise.resolve();
    }
};