'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.addColumn('Topics', 'imageUrl', {
              type: Sequelize.STRING,
              allowNull: true,
              comment: 'Topic header image url.'
          }, { transaction: t })
      ])
  })
  },
  async down (queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
          queryInterface.removeColumn('Topics', 'imageUrl', { transaction: t })
      ])
  })
  }
};
