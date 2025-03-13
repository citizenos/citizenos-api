'use strict';

const _ = require('lodash');
const config = require('config');

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
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'User id in the connected system (encrypted). For Facebook their user id, for Google their user id and so on, PID for Estonian ID infra etc.',
                set: function(v) {
                    if (!v) {
                        this.setDataValue('connectionUserId', null);
                        return;
                    }
                    this.setDataValue('_connectionUserId_raw', v);
                    this.setDataValue('connectionUserId', v);
                },
                get: async function() {
                    const value = this.getDataValue('connectionUserId');
                    if (!value) return null;

                    // If we have raw data, return it directly
                    if (this.getDataValue('_connectionUserId_raw')) {
                        return this.getDataValue('_connectionUserId_raw');
                    }

                    try {
                        const passphrase = config.get('db.passphrase');
                        // Try decoding base64 first (for old data)
                        const [results] = await sequelize.query(
                            'SELECT pgp_sym_decrypt(decode(:encrypted, \'base64\'), :passphrase, \'cipher-algo=aes256\')::text as decrypted',
                            {
                                replacements: {
                                    encrypted: value,
                                    passphrase: passphrase
                                },
                                type: sequelize.QueryTypes.SELECT
                            }
                        );
                        return results?.decrypted || null;
                    } catch (err1) {
                        console.error('Base64 decryption failed:', err1);
                        try {
                            // If base64 decode fails, try direct bytea (for new data)
                            const passphrase = config.get('db.passphrase');
                            const [results] = await sequelize.query(
                                'SELECT pgp_sym_decrypt(:encrypted::bytea, :passphrase, \'cipher-algo=aes256\')::text as decrypted',
                                {
                                    replacements: {
                                        encrypted: value,
                                        passphrase: passphrase
                                    },
                                    type: sequelize.QueryTypes.SELECT
                                }
                            );
                            return results?.decrypted || null;
                        } catch (err2) {
                            console.error('Bytea decryption error:', err2);
                            return null;
                        }
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
                    this.setDataValue('_connectionData_raw', v);
                    this.setDataValue('connectionData', JSON.stringify(v));
                },
                get: async function() {
                    const value = this.getDataValue('connectionData');
                    if (!value) return null;

                    // If we have raw data, return it directly
                    if (this.getDataValue('_connectionData_raw')) {
                        return this.getDataValue('_connectionData_raw');
                    }

                    try {
                        const passphrase = config.get('db.passphrase');
                        // Try decoding base64 first (for old data)
                        const [results] = await sequelize.query(
                            'SELECT pgp_sym_decrypt(decode(:encrypted, \'base64\'), :passphrase, \'cipher-algo=aes256\')::text as decrypted',
                            {
                                replacements: {
                                    encrypted: value,
                                    passphrase: passphrase
                                },
                                type: sequelize.QueryTypes.SELECT
                            }
                        );
                        return JSON.parse(results?.decrypted || null);
                    } catch (err1) {
                        console.error('Base64 decryption failed:', err1);
                        try {
                            // If base64 decode fails, try direct bytea (for new data)
                            const passphrase = config.get('db.passphrase');
                            const [results] = await sequelize.query(
                                'SELECT pgp_sym_decrypt(:encrypted::bytea, :passphrase, \'cipher-algo=aes256\')::text as decrypted',
                                {
                                    replacements: {
                                        encrypted: value,
                                        passphrase: passphrase
                                    },
                                    type: sequelize.QueryTypes.SELECT
                                }
                            );
                            return JSON.parse(results?.decrypted || null);
                        } catch (err2) {
                            console.error('Bytea decryption error:', err2);
                            return null;
                        }
                    }
                }
            }
        }
    );

    // Add beforeCreate hook for encryption
    UserConnection.beforeCreate(async (connection, options) => {
        const passphrase = config.get('db.passphrase');

        // Handle connectionUserId encryption
        if (connection.getDataValue('_connectionUserId_raw')) {
            const value = connection.getDataValue('_connectionUserId_raw');
            const [result] = await sequelize.query(
                'SELECT pgp_sym_encrypt(:value::text, :passphrase, \'cipher-algo=aes256\') as encrypted',
                {
                    replacements: {
                        value: value,
                        passphrase: passphrase
                    },
                    type: sequelize.QueryTypes.SELECT,
                    transaction: options.transaction
                }
            );
            connection.setDataValue('connectionUserId', result.encrypted);
            connection.setDataValue('_connectionUserId_raw', null);
        }

        // Handle connectionData encryption
        if (connection.getDataValue('_connectionData_raw')) {
            const value = JSON.stringify(connection.getDataValue('_connectionData_raw'));
            const [result] = await sequelize.query(
                'SELECT pgp_sym_encrypt(:value::text, :passphrase, \'cipher-algo=aes256\') as encrypted',
                {
                    replacements: {
                        value: value,
                        passphrase: passphrase
                    },
                    type: sequelize.QueryTypes.SELECT,
                    transaction: options.transaction
                }
            );
            connection.setDataValue('connectionData', result.encrypted);
            connection.setDataValue('_connectionData_raw', null);
        }
    });

    // Add beforeUpdate hook for encryption
    UserConnection.beforeUpdate(async (connection, options) => {
        // Same encryption logic as beforeCreate
        await UserConnection.beforeCreate(connection, options);
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
