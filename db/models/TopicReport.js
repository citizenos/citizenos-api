'use strict';

/**
 * TopicReport
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var TopicReport = sequelize.define(
        'TopicReport',
        {
            topicId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Topic the Report belongs to',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                primaryKey: true
            },
            reportId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which Report belongs to the Topic',
                references: {
                    model: 'Reports',
                    key: 'id'
                },
                primaryKey: true
            }
        },
        {
            timestamps: false
        }
    );

    return TopicReport;
};
