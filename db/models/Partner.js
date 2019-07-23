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
            },
            linkPrivacyPolicy: {
                type: DataTypes.TEXT,
                allowNull: true,
                description: 'Link to partners privacy policy'
            }
        }
    );

    Partner.associate = function (models) {
        Partner.hasMany(models.UserConsent, {
            foreignKey: 'partnerId'
        });
    };

    Partner.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        var data = {
            id: this.dataValues.id,
            website: this.dataValues.website,
            redirectUriRegexp: this.dataValues.redirectUriRegexp,
            linkPrivacyPolicy: this.dataValues.linkPrivacyPolicy,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt
        };

        return data;
    };

    return Partner;
};
