'use strict';

/**
 * VoteDelegation
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var VoteDelegation = sequelize.define(
        'VoteDelegation',
        {
            voteId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Vote the delegation applies.',
                references: {
                    model: 'Votes',
                    key: 'id'
                },
                unique: 'oneUserDelegationPerVote'
            },
            toUserId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To which User the Vote was delegated.',
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            byUserId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'The User who delegated the Vote.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                unique: 'oneUserDelegationPerVote'
            }
        }
    );

    return VoteDelegation;
};
