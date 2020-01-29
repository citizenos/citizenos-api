'use strict';

/**
 * Signature
 * All acitivities.
 * @param {object} sequelize
 * @param {object} DataTypes
 */

module.exports = function (sequelize, DataTypes) {

    var Signature = sequelize.define(
        'Signature', {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
                comment: 'Id of the Signature',
                primaryKey: true
            },
            data: {
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'Signature xml'
            }
        });

    return Signature;
};