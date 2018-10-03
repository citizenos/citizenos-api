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

    var Partner = sequelize.define(
        'Partner',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                comment: 'Partner id. Open ID client_id.'
            },
            website: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'Partner website'
            },
            redirectUriRegexp: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'Partner callback (callback_uri) validation regexp. Also may be used to check request Origin and Referer if present.'
            }
        }
    );

    Partner.associate = function (models) {
        Partner.hasMany(models.UserConsent, {
            foreignKey: 'partnerId'
        });
    };

    return Partner;
};
