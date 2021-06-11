'use strict';

var _ = require('lodash');

/**
 * TopicMemberGroup
 *
 * @extends TopicMember
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    // Parent model for this model
    var TopicMember = require('./_TopicMember').model(sequelize, DataTypes);

    // NOTE: TopicMemberUser extends TopicMember
    var attributes = _.extend({
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Group to whom the membership was given.',
            references: {
                model: 'Groups',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
        }
    }, TopicMember.attributes);

    var TopicMemberGroup = sequelize.define('TopicMemberGroup', attributes, {
        indexes: [
            {
                fields: ['groupId']
            },
            {
                fields: ['topicId', 'groupId']
            }
        ]
    });

    TopicMemberGroup.LEVELS = TopicMember.LEVELS;

    return TopicMemberGroup;
};
