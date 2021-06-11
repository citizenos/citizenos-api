'use strict';

/**
 * Group Member
 *
 * A parent "Model" for all the GroupMember* models so that consistency is guaranteed.
 *
 * NOT a full blown Sequelize model as Sequelize does not support extending models.
 *
 * @see https://github.com/sequelize/sequelize/wiki/Suggestion-for-Inheritance-API
 * @see http://stackoverflow.com/questions/19682171/how-to-extend-sequelize-model#answer-19684348
 */

const _ = require('lodash');
const LEVELS = {
    read: 'read',
    admin: 'admin'
};

module.exports.model = function (sequelize, DataTypes) {

    const GroupMember = {
        attributes: {
            groupId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Group to which member belongs.',
                references: {
                    model: 'Groups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            level: {
                type: DataTypes.ENUM,
                values: _.values(LEVELS),
                allowNull: false,
                defaultValue: LEVELS.read,
                comment: 'User membership level.'
            }
        }
    };

    GroupMember.LEVELS = LEVELS;

    return GroupMember;
};
