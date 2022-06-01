'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
      queryInterface.addColumn('Votes', 'reminderSent', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Time when reminder to vote was sent out'
      });

      queryInterface.addColumn('Votes', 'reminderTime', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Time when reminder to vote will be sent'
    });
  },

  async down (queryInterface) {
      queryInterface.removeColumn('Votes', 'reminderSent');
      queryInterface.removeColumn('Votes', 'reminderTime');
  }
};
