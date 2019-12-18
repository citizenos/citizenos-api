'use strict';

var TITLE_LENGTH_MAX_OLD = 100;
var TITLE_LENGTH_MAX_NEW = 200;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('VoteOptions', 'value', {
      type: Sequelize.STRING(TITLE_LENGTH_MAX_NEW),
      allowNull: false,
      comment: 'Option value shown to the voter.'
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('VoteOptions', 'value', {
      type: Sequelize.STRING(TITLE_LENGTH_MAX_OLD),
      allowNull: false,
      comment: 'Option value shown to the voter.'
    });
  }
};
