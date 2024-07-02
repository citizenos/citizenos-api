'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn('VoteContainerFiles', 'hash', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'File hash'
      }, { transaction: t })
    })
  },
  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.removeColumn('VoteContainerFiles', 'hash', { transaction: t })
    })
  }
};
