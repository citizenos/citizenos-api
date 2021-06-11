'use strict';

/**
 * TopicVote
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var TopicVote = sequelize.define(
        'TopicVote',
        {
            topicId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Topic this Vote belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            voteId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which Vote belongs to this Topic.',
                references: {
                    model: 'Votes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            }
        },
        {
            indexes: [
                {
                    fields: ['topicId']
                }
            ]
        }
    );

    return TopicVote;
};
