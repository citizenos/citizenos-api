'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const DELETE_REASON_TYPES = {
      abuse: 'abuse', // is abusive or insulting
      obscene: 'obscene', // contains obscene language
      spam: 'spam', // contains spam or is unrelated to topic
      hate: 'hate', // contains hate speech
      netiquette: 'netiquette', // infringes (n)etiquette
      duplicate: 'duplicate' // duplicate
    };
    await queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.createTable('Ideations',
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
              comment: 'User who created the ideation.',
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
              comment: 'Question the ideation is gathering ideas for'
            },
            deadline: {
              type: Sequelize.DATE,
              allowNull: true,
              comment: 'Deadline for the ideation'
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
        }),
        queryInterface.createTable('Ideas',
          {
            id: {
              type: Sequelize.UUID,
              primaryKey: true,
              unique: true,
              allowNull: false,
              defaultValue: Sequelize.UUIDV4
            },
            ideationId: {
              type: Sequelize.UUID,
              allowNull: false,
              comment: 'Ideation id.',
              references: {
                model: 'Ideations',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            authorId: {
              type: Sequelize.UUID,
              allowNull: false,
              comment: 'Author of the idea',
              references: {
                model: 'Users',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            statement: {
              type: Sequelize.STRING(2048),
              allowNull: true,
              comment: 'Main idea statement'
            },
            description: {
              type: Sequelize.TEXT,
              allowNull: true,
              comment: 'Idea description'
            },
            imageUrl: {
              type: Sequelize.TEXT,
              allowNull: true,
              comment: 'Image for the idea'
            },
            deletedById: {
              type: Sequelize.UUID,
              comment: 'User ID of the person who deleted the Comment',
              allowNull: true,
              references: {
                model: 'Users',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            deletedReasonType: {
              type: Sequelize.ENUM,
              values: Object.values(DELETE_REASON_TYPES),
              allowNull: true,
              comment: 'Delete reason type which is provided in case deleted by moderator due to a user report'
            },
            deletedReasonText: {
              type: Sequelize.STRING(2048),
              allowNull: true,
              validate: {
                len: {
                  args: [1, 2048],
                  msg: 'Text can be 1 to 2048 characters long.'
                }
              },
              comment: 'Free text with reason why the comment was deleted'
            },
            deletedByReportId: {
              type: Sequelize.UUID,
              comment: 'Report ID due to which comment was deleted',
              allowNull: true,
              references: {
                model: 'Reports',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            edits: {
              type: Sequelize.JSONB,
              comment: 'Comment versions in JSONB array',
              allowNull: true
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
        }),
      ])
    })
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.createTable('TopicIdeations',
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
            ideationId: {
              type: Sequelize.UUID,
              allowNull: false,
              comment: 'Ideation id.',
              references: {
                model: 'Ideations',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
              primaryKey: true
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
            }
          }, {
          transaction: t
        }),
        queryInterface.createTable('IdeaVotes',
          {
            ideaId: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: 'Ideas',
                key: 'id'
              },
              primaryKey: true,
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            creatorId: {
              type: Sequelize.UUID,
              comment: 'User ID of the voter',
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
              type: Sequelize.INTEGER,
              comment: 'Vote value. Numeric, can be negative on down-vote.',
              allowNull: false,
              validate: {
                isIn: {
                  args: [[1, 0, -1]],
                  msg: 'Vote value must be 1 (up-vote), -1 (down-vote) OR 0 to clear vote.'
                }
              }
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
        }),
        queryInterface.createTable('IdeaFavourites',
          {
            ideaId: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: 'Ideas',
                key: 'id'
              },
              primaryKey: true,
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            userId: {
              type: Sequelize.UUID,
              comment: 'User ID who favourited the idea',
              allowNull: false,
              references: {
                model: 'Users',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
              primaryKey: true
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
            }
          }, {
          transaction: t
        }),
        queryInterface.createTable('Folders',
          {
            id: {
              type: Sequelize.UUID,
              allowNull: false,
              primaryKey: true
            },
            ideationId: {
              type: Sequelize.UUID,
              allowNull: false,
              comment: 'To what ideation the folder belongs to',
              references: {
                model: 'Ideations',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            creatorId: {
              type: Sequelize.UUID,
              comment: 'User ID who favourited the idea',
              allowNull: false,
              references: {
                model: 'Users',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            name: {
              type: Sequelize.STRING(512),
              allowNull: true,
              comment: 'Folder name'
            },
            description: {
              type: Sequelize.STRING(2048),
              allowNull: true,
              comment: 'Folder description'
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
        }),
        queryInterface.createTable('FolderIdeas',
          {
            folderId: {
              type: Sequelize.UUID,
              comment: 'Folder where idea belongs',
              allowNull: false,
              references: {
                model: 'Folders',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
              primaryKey: true
            },
            ideaId: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: 'Ideas',
                key: 'id'
              },
              primaryKey: true,
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            }
          }, {
          transaction: t
        }),
        queryInterface.createTable('IdeaComments',
          {
            commentId: {
              type: Sequelize.UUID,
              comment: 'Which Comment belongs to this Idea.',
              allowNull: false,
              references: {
                model: 'Comments',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
              primaryKey: true
            },
            ideaId: {
              type: Sequelize.UUID,
              comment: 'To what Idea this Comment belongs to.',
              allowNull: false,
              references: {
                model: 'Ideas',
                key: 'id'
              },
              primaryKey: true,
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            }
          }, {
          transaction: t
        }),
        queryInterface.createTable(
          'IdeaReports',
          {
            ideaId: {
              type: Sequelize.UUID,
              allowNull: false,
              references: {
                model: 'Ideas',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
              primaryKey: true,
              comment: 'Id of the idea which the Report belongs to.'
            },
            reportId: {
              type: Sequelize.UUID,
              allowNull: false,
              comment: 'Which Report belongs to the Idea',
              references: {
                model: 'Reports',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE',
              primaryKey: true
            }
          }, {
          transaction: t
        }
        ),
        queryInterface.addColumn('VoteOptions', 'ideaId', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Ideas',
            key: 'id'
          },
          comment: 'Idea refered to this option',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
          { transaction: t }
        ),
        queryInterface.sequelize.query(
          `ALTER TYPE "enum_Topics_status" ADD VALUE IF NOT EXISTS 'ideation' BEFORE 'inProgress';`
          , { transaction: t })
      ])
    });

  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.dropTable('TopicIdeations', { transaction: t }),
        queryInterface.dropTable('IdeaVotes', { transaction: t }),
        queryInterface.dropTable('IdeaFavourites', { transaction: t }),
        queryInterface.dropTable('FolderIdeas', { transaction: t }),
        queryInterface.dropTable('IdeaComments', { transaction: t }),
        queryInterface.dropTable('Folders', { transaction: t }),
        queryInterface
          .dropTable('IdeaReports', { transaction: t })
          .then(function () { // While Sequelize does not support naming ENUMS, it creates duplicates - https://github.com/sequelize/sequelize/issues/2577
            return queryInterface.sequelize
              .query('DROP TYPE IF EXISTS "enum_IdeaReports_moderatedReasonType";', { transaction: t });
          })
          .then(function () {
            return queryInterface.sequelize
              .query('DROP TYPE IF EXISTS "enum_IdeaReports_type";', { transaction: t });
          })
      ]);
    });

    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.dropTable('Ideation', { transaction: t }),
        queryInterface.dropTable('Ideas', { transaction: t }),
      ])
    })
  }
};
