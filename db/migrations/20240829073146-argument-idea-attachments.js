'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ATTACHMENT_TYPES = {
      image: 'image', // Image
      file: 'file', // File
    };

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('IdeaAttachments',
        {
          ideaId: {
            type: Sequelize.UUID,
            primaryKey: true,
            comment: 'To what Idea this Attachment belongs to.',
            allowNull: false,
            defaultValue: Sequelize.UUIDV4
          },
          attachmentId: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            comment: 'Which Attachment belongs to this Idea.',
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          type: {
            type: Sequelize.ENUM,
            values: Object.values(ATTACHMENT_TYPES),
            allowNull: true,
            defaultValue: ATTACHMENT_TYPES.file,
            comment: 'Type of the attachment image or file'
          },
        }, {
        transaction: t
      });
      await queryInterface.createTable('CommentAttachments',
        {
          commentId: {
            type: Sequelize.UUID,
            primaryKey: true,
            comment: 'To what Comment this Attachment belongs to.',
            allowNull: false,
            defaultValue: Sequelize.UUIDV4
          },
          attachmentId: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            comment: 'Which Attachment belongs to this Comment.',
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          type: {
            type: Sequelize.ENUM,
            values: Object.values(ATTACHMENT_TYPES),
            allowNull: true,
            defaultValue: ATTACHMENT_TYPES.file,
            comment: 'Type of the attachment image or file'
          },
        }, {
        transaction: t
      });

    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('IdeaAttachments', {
        transaction: t
      })

      await queryInterface.dropTable('CommentAttachments', {
        transaction: t
      });
    });
  }
};
