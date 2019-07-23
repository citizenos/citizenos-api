'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.addColumn('Partners', 'linkPrivacyPolicy', {
            type: Sequelize.TEXT,
            allowNull: true,
            description: 'Link to partners privacy policy'
        });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn('Partners', 'linkPrivacyPolicy');
    }
};
