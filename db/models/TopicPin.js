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

    var TopicPin = sequelize.define(
        'TopicPin',
        {
            topicId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Topic this Pin belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which User this Pin belongs to.',
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

    return TopicPin;
};
