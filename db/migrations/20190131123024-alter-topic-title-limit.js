'use strict';

var TITLE_LENGTH_MAX_OLD = 100;
var TITLE_LENGTH_MAX = 1000;

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.changeColumn('Topics', 'title', {
            type: Sequelize.STRING(TITLE_LENGTH_MAX),
            validate: {
                len: {
                    args: [1, TITLE_LENGTH_MAX],
                    msg: 'Title can be 1 to ' + TITLE_LENGTH_MAX + ' characters long.'
                }
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.changeColumn('Topics', 'title', {
            type: Sequelize.STRING(TITLE_LENGTH_MAX_OLD),
            validate: {
                len: {
                    args: [1, TITLE_LENGTH_MAX_OLD],
                    msg: 'Title can be 1 to ' + TITLE_LENGTH_MAX_OLD + ' characters long.'
                }
            }
        });
    }
};
