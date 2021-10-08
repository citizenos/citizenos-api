'use strict';

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
    const LEVELS = {
        read: 'read',
        admin: 'admin'
    };

    // Parent model for this model
    const _GroupMember = require('./_GroupMember').model(sequelize, DataTypes);

    // NOTE: GroupMemberUser extends GroupMember
    const attributes = Object.assign({
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User id',
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
        }
    }, _GroupMember.attributes);


    const GroupMemberUser = sequelize.define('GroupMemberUser', attributes);

    GroupMemberUser.LEVELS = LEVELS; // For easy usage in code.

    return GroupMemberUser;
};
