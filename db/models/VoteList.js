'use strict';

/**
 * VoteList
 *
 * List of actual Votes cast buy voters. Contains a line for each VoteOption selected to support multiple choice voting.
 * Also note that ALL events of voting are recorded thus when counting Votes last record(s) count.
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var VoteList = sequelize.define(
        'VoteList',
        {
            voteId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Vote this option belongs to.',
                references: {
                    model: 'Votes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Id of the User Who cast the Vote.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            optionId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'The VoteOption selected by the voter.',
                references: {
                    model: 'VoteOptions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            optionGroupId: {
                type: DataTypes.STRING(8),
                allowNull: false,
                comment: 'To recognise which votes were given in the same request needed to adequately count votes later.'
            },
            userHash: {
                type: DataTypes.STRING(64),
                allowNull: true,
                comment: 'Hash from users PID that allows filtering votes from different users, but same person'
            }
        },
        {
            indexes: [
                {
                    fields: ['voteId']
                },
                {
                    fields: ['voteId', 'deletedAt']
                }
            ]
        }
    );

    return VoteList;
};
