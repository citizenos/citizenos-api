'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.addColumn('Ideations', 'disableReplies', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Disable replies'
      }, { transaction: t })
    })
  },
  async down(queryInterface) {
    return queryInterface.sequelize.transaction((t) => {
      return queryInterface.removeColumn('Ideations', 'disableReplies', { transaction: t })
    })
  }
};
