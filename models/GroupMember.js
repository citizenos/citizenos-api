'use strict';

var _ = require('lodash');

/**
 * GroupMember
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    // All possible permission levels.
    var LEVELS = {
        read: 'read',
        admin: 'admin'
    };

    var GroupMember = sequelize.define(
        'GroupMember',
        {
            groupId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Group id',
                references: {
                    model: 'Groups',
                    key: 'id'
                },
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'User id',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                primaryKey: true
            },
            level: {
                type: DataTypes.ENUM,
                values: _.values(LEVELS),
                allowNull: false,
                defaultValue: LEVELS.read,
                comment: 'Levels - read, admin'
            }
        }
    );

    GroupMember.LEVELS = LEVELS; // For easy usage in code.

    return GroupMember;
};
