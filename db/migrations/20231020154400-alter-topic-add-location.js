'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Topics', 'country', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Topic location country',
          transaction: t
        }),
        queryInterface.addColumn('Topics', 'language', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Topic language',
          transaction: t
        }),
        queryInterface.addColumn('Topics', 'contact', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Topic contact address or phone',
          transaction: t
        })
      ]);
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Topics', 'country', {transaction: t}),
        queryInterface.removeColumn('Topics', 'language', {transaction: t}),
        queryInterface.removeColumn('Topics', 'contact', {transaction: t})
      ])
    });
  }
};
