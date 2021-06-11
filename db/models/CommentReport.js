'use strict';

/**
 * CommentReport
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var CommentReport = sequelize.define(
        'CommentReport',
        {
            commentId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Comment the Report belongs to',
                references: {
                    model: 'Comments',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            reportId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which Report belongs to the Comment',
                references: {
                    model: 'Reports',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            }
        },
        {
            timestamps: false
        }
    );

    return CommentReport;
};
