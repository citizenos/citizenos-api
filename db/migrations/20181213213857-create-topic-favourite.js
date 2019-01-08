'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('TopicPins', {
            topicId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'To what Topic this Pin belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                primaryKey: true
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'Which User this Pin belongs to.',
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
        return queryInterface.dropTable('TopicPins');
    }
};
