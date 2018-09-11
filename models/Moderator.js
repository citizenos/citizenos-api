'use strict';

/**
 * Moderator
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var Moderator = sequelize.define(
        'Moderator',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Id of the User of the Moderator',
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            partnerId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Which Partner moderator represents. One User can be a moderator of many Partners',
                references: {
                    model: 'Partners',
                    key: 'id'
                }
            }
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['userId', 'partnerId'],
                    where: {
                        partnerId: {
                            $not: null
                        }
                    }
                },
                {
                    unique: true,
                    fields: ['userId'],
                    where: {
                        partnerId: {
                            $eq: null
                        }
                    }
                }
            ]
        }
    );

    return Moderator;
};
