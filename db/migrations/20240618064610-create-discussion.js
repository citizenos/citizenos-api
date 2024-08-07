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
            SELECT t.id, t."creatorId", '', t."createdAt", NOW() FROM "Topics" t JOIN "TopicComments" tc ON tc."topicId" = t.id GROUP BY t.id;
          INSERT INTO "TopicDiscussions"("topicId", "discussionId")
            SELECT t.id AS "topicId", t.id as "discussionId" FROM "Topics" t JOIN "Discussions" d ON t.id=d.id;
          `
        , {
          transaction: t
        });
      await queryInterface.renameTable('TopicComments', 'DiscussionComments', {
        transaction: t
      });

      await queryInterface.addColumn('DiscussionComments', 'discussionId', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Discussion id',
        references: {
          model: 'Discussions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, {
        transaction: t
      });

      await queryInterface.sequelize.query(
        `UPDATE "DiscussionComments" dc SET "discussionId"=dc."topicId";
          `
        , {
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

      await queryInterface.removeColumn('DiscussionComments', 'topicId', {
        transaction: t
      });

  /*    await queryInterface.removeConstraint('DiscussionComments', 'TopicComments_topicId_fkey', {
        transaction: t
      });*/
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {

      await queryInterface.renameTable('DiscussionComments', 'TopicComments', {
        transaction: t
      });

      await queryInterface.addColumn('TopicComments', 'topicId', {
        type: Sequelize.UUID,
        allowNull: true,
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

      await queryInterface.sequelize.query(
        `UPDATE "TopicComments" tc SET "topicId"=td."topicId" FROM "TopicDiscussions" td WHERE td."discussionId" = tc."discussionId";
          `
        , {
          transaction: t
        });

      await queryInterface.removeColumn('TopicComments', 'discussionId', {
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

      await queryInterface.dropTable('TopicDiscussions', {
        transaction: t
      })

      await queryInterface.dropTable('Discussions', {
        transaction: t
      });
    });
  }

};
