'use strict';

/**
 * IdeaComment
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var IdeaComment = sequelize.define(
        'IdeaComment',
        {
            ideaId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Idea this Comment belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            commentId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which Comment belongs to this Idea.',
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

    return IdeaComment;
};
