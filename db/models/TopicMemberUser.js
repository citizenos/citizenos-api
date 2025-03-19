'use strict';

/**
 * TopicMemberUser
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @extends TopicMember
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    // Parent model for this model
    const TopicMember = require('./_TopicMember').model(sequelize, DataTypes);

    // NOTE: TopicMemberUser extends TopicMember
    const attributes = {
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User whom the membership was given.',
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
        }
        , ...TopicMember.attributes
    };

    const TopicMemberUser = sequelize.define('TopicMemberUser', attributes, {
        indexes: [
            {
                fields: ['topicId', 'userId']
            }
        ]
    });

    TopicMemberUser.LEVELS = TopicMember.LEVELS;

    return TopicMemberUser;
};
