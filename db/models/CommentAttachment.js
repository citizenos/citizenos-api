'use strict';

/**
 * CommentAttachment
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {
    const ATTACHMENT_TYPES = {
        image: 'image', // Image
        file: 'file', // File
    };
    const CommentAttachment = sequelize.define(
        'CommentAttachment',
        {
            commentId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Comment this Attachment belongs to.',
                references: {
                    model: 'Comments',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            attachmentId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which Attachment belongs to this Comment.',
                references: {
                    model: 'Attachments',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            type: {
                type: DataTypes.ENUM,
                values: Object.values(ATTACHMENT_TYPES),
                allowNull: true,
                defaultValue: ATTACHMENT_TYPES.file,
                comment: 'Type of the attachment image or file'
            },
        },
        {
            timestamps: false
        }
    );
    CommentAttachment.ATTACHMENT_TYPES = ATTACHMENT_TYPES;
    return CommentAttachment;
};
