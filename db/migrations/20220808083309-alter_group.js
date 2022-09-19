'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.addColumn('Groups', 'imageUrl', {
              type: Sequelize.STRING,
              allowNull: true,
              comment: 'Group profile image url.'
          }, { transaction: t }),
          queryInterface.addColumn('Groups', 'description', {
            type: Sequelize.TEXT,
            comment: 'Short description of what the Group is about.',
            allowNull: true
          }, { transaction: t })
      ])
  })
  },
  async down (queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.removeColumn('Groups', 'imageUrl', { transaction: t }),
          queryInterface.removeColumn('Groups', 'description', { transaction: t }),
      ])
  })
  }
};
