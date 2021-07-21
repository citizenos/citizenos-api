'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        const AUTO_CLOSE = {
            allMembersVoted: 'allMembersVoted'
        };

        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('Votes', 'autoClose', {
                    type: Sequelize.ARRAY(Sequelize.JSON),
                    defaultValue: [],
                    validate: {
                        isArrayOfautoCloseConditions: function (value) {
                            if (!value) return; // Since Sequelize 5.x custom validators are run when allowNull is true.

                            if (!Array.isArray(value)) {
                                throw new Error('Must be an array.');
                            }

                            value.forEach((condition) => {
                                if (!AUTO_CLOSE[condition.value]) {
                                    throw new Error(`Invalid condition ${condition}`);
                                }
                            });
                        }
                    },
                    allowNull: true
                }, { transaction: t }),
            ])
        })
    },
    down: (queryInterface) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeColumn('Votes', 'autoClose', { transaction: t })
            ])
        })
    }
};