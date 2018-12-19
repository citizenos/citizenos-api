'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('TopicFavourites', {
            topicId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'To what Topic this Favourite belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                primaryKey: true
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'Which User this Favourite belongs to.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                primaryKey: true
            }
        }, {
            timestamps: false
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('TopicFavourites');
    }
};
