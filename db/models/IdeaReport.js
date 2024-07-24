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

    const IdeaReport = sequelize.define(
        'IdeaReport',{
           ideaId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Ideas',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true,
            comment: 'Id of the idea which the Report belongs to.'
        },
        reportId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Which Report belongs to the Idea',
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
    });

    return IdeaReport;
};
