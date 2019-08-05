'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('Users', 'termsVersion', {
                    type: Sequelize.STRING,
                    allowNull: true,
                    comment: 'Version identifier of user terms accepted by user'
                }, { transaction: t }),
                queryInterface.addColumn('Users', 'termsAcceptedAt', {
                    type: Sequelize.DATE,
                    comment: 'Time when the terms were accepted',
                    allowNull: true
                }, { transaction: t })
            ])
        })
    },

    down: (queryInterface) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeColumn('Users', 'termsVersion', { transaction: t }),
                queryInterface.removeColumn('Users', 'termsAcceptedAt', { transaction: t })
            ])
        })
    }
};