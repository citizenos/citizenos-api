'use strict';

module.exports = {
    up: function (queryInterface, Sequelize) {
        return queryInterface.createTable('TopicReports', {
            topicId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'To what Topic the Report belongs to',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                primaryKey: true
            },
            reportId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'Which Report belongs to the Topic',
                references: {
                    model: 'Reports',
                    key: 'id'
                },
                primaryKey: true
            }
        });
    },
    down: function (queryInterface) {
        return queryInterface.dropTable('TopicReports');
    }
};
