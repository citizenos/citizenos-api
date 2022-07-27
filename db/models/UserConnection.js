'use strict';

var _ = require('lodash');

/**
 * UserConnection
 *
 * All User connections to external systems.
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    const CONNECTION_IDS = {
        esteid: 'esteid', // Estonian ID card infra
        smartid: 'smartid', // Smart ID
        google: 'google',
        facebook: 'facebook',
        citizenos: 'citizenos'
    };

    const UserConnection = sequelize.define(
        'UserConnection',
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
            connectionId: {
                type: DataTypes.ENUM,
                values: _.values(CONNECTION_IDS),
                allowNull: false,
                comment: 'User connection identificator.',
                primaryKey: true
            },
            connectionUserId: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'User id in the connected system. For Facebook their user id, for Google their user id and so on, PID for Estonian ID infra etc.'
            },
            connectionData: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: 'Connection specific data you want to store.'
            }
        }
    );

    UserConnection.associate = function (models) {
        UserConnection.belongsTo(models.User, {
            foreignKey: 'userId'
        });
    };

    UserConnection.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        const user = {
            userId: this.dataValues.userId,
            connectionId: this.dataValues.connectionId
        };

        return user;
    };

    UserConnection.CONNECTION_IDS = CONNECTION_IDS;

    return UserConnection;
};
