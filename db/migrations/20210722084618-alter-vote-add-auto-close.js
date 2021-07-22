'use strict';

const AUTO_CLOSE = {
  allMembersVoted: 'allMembersVoted'
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Votes', 'autoClose', {
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
    })
  },

  down: async (queryInterface) => {
    return queryInterface.removeColumn('Votes', 'autoClose');
  }
};
