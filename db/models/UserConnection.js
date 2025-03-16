'use strict';

const cryptoLib = require('../../libs/crypto');

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
                values: Object.values(CONNECTION_IDS),
                allowNull: false,
                comment: 'User connection identificator.',
                primaryKey: true
            },
            connectionUserId: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'User id in the connected system (encrypted). For Facebook their user id, for Google their user id and so on, PID for Estonian ID infra etc.',
                set: function(v) {
                    if (!v) {
                        this.setDataValue('connectionUserId', null);
                        return;
                    }
                    this.setDataValue('connectionUserId', cryptoLib.privateEncrypt(v));
                },
                get: function() {
                    const value = this.getDataValue('connectionUserId');
                    if (!value) return null;

                    try {
                        return cryptoLib.privateDecrypt(value);
                    } catch (err) {
                        console.error('Decryption error:', err);
                        return null;
                    }
                }
            },
            connectionData: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Connection specific data (encrypted).',
                set: function(v) {
                    if (!v) {
                        this.setDataValue('connectionData', null);
                        return;
                    }
                    this.setDataValue('connectionData', cryptoLib.privateEncrypt(JSON.stringify(v)));
                },
                get: function() {
                    const value = this.getDataValue('connectionData');
                    if (!value) return null;

                    try {
                        const decrypted = cryptoLib.privateDecrypt(value);
                        return JSON.parse(decrypted);
                    } catch (err) {
                        console.error('Decryption error:', err);
                        return null;
                    }
                }
            }
        }
    );

    // Add beforeCreate hook for encryption
    UserConnection.beforeCreate(async (connection) => {
        // Handle connectionUserId encryption
        if (connection.getDataValue('_connectionUserId_raw')) {
            const value = connection.getDataValue('_connectionUserId_raw');
            connection.setDataValue('connectionUserId', cryptoLib.privateEncrypt(value));
            connection.setDataValue('_connectionUserId_raw', null);
        }

        // Handle connectionData encryption
        if (connection.getDataValue('_connectionData_raw')) {
            const value = JSON.stringify(connection.getDataValue('_connectionData_raw'));
            connection.setDataValue('connectionData', cryptoLib.privateEncrypt(value));
            connection.setDataValue('_connectionData_raw', null);
        }
    });

    // Add beforeUpdate hook for encryption
    UserConnection.beforeUpdate(async (connection) => {
        // Same encryption logic as beforeCreate
        await UserConnection.beforeCreate(connection);
    });

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

    // Add a method to get decrypted values
    UserConnection.prototype.getDecryptedFields = async function() {
        const [connectionUserId, connectionData] = await Promise.all([
            this.connectionUserId,
            this.connectionData
        ]);
        return {
            ...this.toJSON(),
            connectionUserId,
            connectionData
        };
    };

    UserConnection.CONNECTION_IDS = CONNECTION_IDS;

    return UserConnection;
};
