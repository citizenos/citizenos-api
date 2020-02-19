'use strict';

module.exports = {
    up: (queryInterface) => {
        return queryInterface.removeConstraint('UserConnections', 'UserConnections_connectionId_connectionUserId_key');
    },
    down: (queryInterface) => {
        return queryInterface.addConstraint('UserConnections', ['connectionId', 'connectionUserId'], {
            type: 'unique',
            name: 'UserConnections_connectionId_connectionUserId_key'
        });
    }
};
