'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('Discussions',
        {
          id: {
            type: Sequelize.UUID,
            primaryKey: true,
            unique: true,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4
          },
          creatorId: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'User who created the discussion.',
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          question: {
            type: Sequelize.STRING(2048),
            allowNull: true,
            comment: 'Question the discussion is about'
          },
          deadline: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: 'Deadline for the discussion'
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          deletedAt: {
            allowNull: true,
            type: Sequelize.DATE
          },
        }, {
        transaction: t
      });
      await queryInterface.createTable('TopicDiscussions',
        {
          topicId: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'To what Topic this Ideation belongs to.',
            references: {
              model: 'Topics',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
          },
          discussionId: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'Discussion id.',
            references: {
              model: 'Discussions',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
          }
        }, {
        transaction: t
      });
      await queryInterface.sequelize.query(
        `INSERT INTO "Discussions"("id", "creatorId", "question", "createdAt", "updatedAt")
            SELECT t.id, t."creatorId", t.title, t."createdAt", NOW() FROM "Topics" t;
          INSERT INTO "TopicDiscussions"("topicId", "discussionId")
            SELECT t.id AS "topicId", t.id as "discussionId" FROM "Topics" t;
          `
        , {
          transaction: t
        });
      await queryInterface.renameTable('TopicComments', 'DiscussionComments', {
        transaction: t
      });
      await queryInterface.renameColumn('DiscussionComments', 'topicId', 'discussionId', {
        transaction: t
      });
      await queryInterface.changeColumn('DiscussionComments', 'discussionId', {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Discussion id',
        references: {
          model: 'Discussions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      }, {
        transaction: t
      });

    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {

      await queryInterface.dropTable('TopicDiscussions', {
        transaction: t
      })
      await queryInterface.dropTable('Discussions', {
        transaction: t
      });
      await queryInterface.renameTable('DiscussionComments', 'TopicComments', {
        transaction: t
      });
      await queryInterface.renameColumn('TopicComments', 'discussionId', 'topicId', {
        transaction: t
      });
      await queryInterface.changeColumn('TopicComments', 'topicId', {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Topic id',
        references: {
          model: 'Topics',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
      }, {
        transaction: t
      });
    });
  }

};
