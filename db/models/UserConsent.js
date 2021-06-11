'use strict';

/**
 * UserConsent
 *
 * All User consents, that is User agreements to share info with specific partner (OpenID "client_id).
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var UserConsent = sequelize.define(
        'UserConsent',
        {
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Id of the User whom the connection belongs to.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            partnerId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Partner id (client_id).',
                references: {
                    model: 'Partners',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            }
        }
    );

    UserConsent.associate = function (models) {
        UserConsent.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    return UserConsent;
};
