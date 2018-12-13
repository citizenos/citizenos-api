'use strict';

/**
 * TopicComment
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var TopicFavourite = sequelize.define(
        'TopicFavourite',
        {
            topicId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Topic this Favourite belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which User this Favourite belongs to.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                primaryKey: true
            }
        },
        {
            timestamps: false
        }
    );

    return TopicFavourite;
};
