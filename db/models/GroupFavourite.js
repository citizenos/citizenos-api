'use strict';

/**
 * GroupFavourite
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var GroupFavourite = sequelize.define(
        'GroupFavourite',
        {
            groupId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Group this row belongs to.',
                references: {
                    model: 'Groups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which User this row belongs to.',
                references: {
                    model: 'Users',
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

    return GroupFavourite;
};
