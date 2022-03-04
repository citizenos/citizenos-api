'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        queryInterface.addColumn('Users', 'preferences', {
            type: Sequelize.JSONB,
            allowNull: true,
            comment: 'User preferences JSON object'
        });
    },

    down: async (queryInterface) => {
        queryInterface.removeColumn('Users', 'preferences');
    }
};
