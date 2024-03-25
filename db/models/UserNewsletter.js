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

    var UserNewsletter = sequelize.define(
        'UserNewsletter',
        {
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'User whom the newsletter was sent.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            newsletterName: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'Name of the template for the newsletter',
                primaryKey: true
            }
        }
    );

    UserNewsletter.associate = function (models) {
        UserNewsletter.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    return UserNewsletter;
};
