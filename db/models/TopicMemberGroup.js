'use strict';

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
    const TopicMember = require('./_TopicMember').model(sequelize, DataTypes);

    // NOTE: TopicMemberUser extends TopicMember
    const attributes = {
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
        },
        ...TopicMember.attributes
    };

    const TopicMemberGroup = sequelize.define('TopicMemberGroup', attributes, {
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
