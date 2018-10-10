'use strict';

/**
 * CommentVote
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var CommentVote = sequelize.define(
        'CommentVote',
        {
            commentId: {
                type: DataTypes.UUID,
                comment: 'Comment ID',
                allowNull: false,
                references: {
                    model: 'Comments',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID of the creator of the Topic.',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            value: {
                type: DataTypes.INTEGER,
                comment: 'Vote value. Numeric, can be negative on down-vote.',
                allowNull: false,
                validate: {
                    isIn: {
                        args: [[1, 0, -1]],
                        msg: 'Vote value must be 1 (up-vote), -1 (down-vote) OR 0 to clear vote.'
                    }
                }
            }
        }
    );

    return CommentVote;
};
