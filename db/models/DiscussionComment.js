'use strict';

/**
 * DiscussionComment
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var DiscussionComment = sequelize.define(
        'DiscussionComment',
        {
            discussionId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Discussion this Comment belongs to.',
                references: {
                    model: 'Discussions',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            commentId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which Comment belongs to this Discussion.',
                references: {
                    model: 'Comments',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            }
        },
        {
            timestamps: false
        }
    );

    return DiscussionComment;
};
