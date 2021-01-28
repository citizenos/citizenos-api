'use strict';

/**
 * VoteUserContainer
 *
 * Signed containers (BDOC) of a Users vote.
 * While we store each Vote instance  in the VoteList as a separate row (for stats?), we will store only one signed container to save space.
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var VoteUserContainer = sequelize.define(
        'VoteUserContainer',
        {
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
            voteId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Vote this signed container belongs to.',
                references: {
                    model: 'Votes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            container: {
                type: DataTypes.BLOB,
                allowNull: false,
                comment: 'BDOC containing the signed vote.'
            },
            PID: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'User personal ID',
                primaryKey: true
            }
        }
    );

    VoteUserContainer.associate = function (models) {
        VoteUserContainer.hasMany(models.UserConnection, {
            foreignKey: 'userId',
            constraints: false
        });
    };

    return VoteUserContainer;
};
