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

    var CONNECTION_IDS = {
        esteid: 'esteid', // Estonian ID card infra
        smartid: 'smartid', // Smart ID
        google: 'google',
        facebook: 'facebook',
        citizenos: 'citizenos'
    };

    var UserConnection = sequelize.define(
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
                primaryKey: true
            },
            connectionId: {
                type: DataTypes.ENUM,
                values: _.values(CONNECTION_IDS),
                allowNull: false,
                comment: 'User connection identificator.',
                primaryKey: true,
                unique: 'uniqueConnectionIdAndConnectionUserId'
            },
            connectionUserId: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'User id in the connected system. For Facebook their user id, for Google their user id and so on, PID for Estonian ID infra etc.',
                unique: 'uniqueConnectionIdAndConnectionUserId'
            },
            connectionData: {
                type: DataTypes.JSON,
                allowNull: true,
                comment: 'Connection specific data you want to store.'
            }
        }
    );

    UserConnection.CONNECTION_IDS = CONNECTION_IDS;

    return UserConnection;
};
