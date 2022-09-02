'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.addColumn('TopicInviteUsers', 'expiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Invite expiration time.',
      validate: {
          isAfter: {
              args: [new Date().toString()],
              msg: 'Expiration deadline must be in the future.'
          }
      }
    });
  },

  async down (queryInterface) {
    return queryInterface.removeColumn('TopicInviteUsers', 'expiresAt');
  }
};
