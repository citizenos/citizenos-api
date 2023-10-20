'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Groups', 'country', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Group location country',
          transaction: t
        }),
        queryInterface.addColumn('Groups', 'language', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Group language',
          transaction: t
        }),
        queryInterface.addColumn('Groups', 'rules', {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true,
          comment: 'Group rules',
          transaction: t
        }),
        queryInterface.addColumn('Groups', 'contact', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Group contact info',
          transaction: t
        })
      ]);
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Groups', 'country', {transaction: t}),
        queryInterface.removeColumn('Groups', 'language', {transaction: t}),
        queryInterface.removeColumn('Groups', 'rules', {transaction: t}),
        queryInterface.removeColumn('Groups', 'contact', {transaction: t})
      ])
    });
  }
};
