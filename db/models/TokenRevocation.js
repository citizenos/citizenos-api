'use strict';

const config = require('config');
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

    const TokenRevocation = sequelize.define(
        'TokenRevocation',
        {
            tokenId: {
                type: DataTypes.UUID,
                comment: 'Token Id that has been revoked',
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4

            },
            expiresAt: {
                type: DataTypes.DATE,
                comment: 'Token expiration time, after that this entry is not relevant anymore',
                allowNull: false,
                defaultValue: function () {
                    return new Date((new Date()).getTime() + (config.session.cookie.maxAge * 1000));
                }
            }
        }
    );

    return TokenRevocation;
};
