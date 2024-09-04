'use strict';

/**
 * IdeaAttachment
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
    const IdeaAttachment = sequelize.define(
        'IdeaAttachment',
        {
            ideaId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Idea this Attachment belongs to.',
                references: {
                    model: 'Ideas',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            attachmentId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Which Attachment belongs to this Idea.',
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

    IdeaAttachment.ATTACHMENT_TYPES = ATTACHMENT_TYPES;
    return IdeaAttachment;
};
