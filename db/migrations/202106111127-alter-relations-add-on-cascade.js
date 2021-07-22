'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('CommentReports', 'commentId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Comment the Report belongs to',
        references: {
            model: 'Comments',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });
    await queryInterface.changeColumn('CommentReports', 'reportId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Report belongs to the Comment',
        references: {
            model: 'Reports',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('GroupMemberUsers', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User id',
        references: {
            model: 'Users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('GroupMemberUsers', 'groupId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Group to which member belongs.',
        references: {
            model: 'Groups',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicAttachments', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Attachment belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicAttachments', 'attachmentId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Attachment belongs to this Topic.',
        references: {
            model: 'Attachments',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicComments', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Comment belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicComments', 'commentId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Comment belongs to this Topic.',
        references: {
            model: 'Comments',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicEvents', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Comment belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    });

    await queryInterface.changeColumn('TopicMemberGroups', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Topic to which member belongs.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicMemberGroups', 'groupId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Group to whom the membership was given.',
        references: {
            model: 'Groups',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicMemberUsers', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Topic to which member belongs.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicMemberUsers', 'userId', {
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
    });

    await queryInterface.changeColumn('TopicPins', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Pin belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicPins', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which User this Pin belongs to.',
        references: {
            model: 'Users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicReports', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true,
        comment: 'Id if the Topic which the Report belongs to.'
    });

    await queryInterface.changeColumn('TopicVotes', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Vote belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicVotes', 'voteId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Vote belongs to this Topic.',
        references: {
            model: 'Votes',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('UserConnections', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Id of the User whom the connection belongs to.',
        references: {
            model: 'Users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('UserConsents', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Id of the User whom the connection belongs to.',
        references: {
            model: 'Users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('UserConsents', 'partnerId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Partner id (client_id).',
        references: {
            model: 'Partners',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        primaryKey: true
    });

    await queryInterface.changeColumn('VoteContainerFiles', 'voteId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Vote these files belong to.',
        references: {
            model: 'Votes',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    });

    await queryInterface.changeColumn('VoteOptions', 'voteId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Vote this option belongs to.',
        references: {
            model: 'Votes',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    });
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.changeColumn('CommentReports', 'commentId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Comment the Report belongs to',
        references: {
            model: 'Comments',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('CommentReports', 'reportId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Report belongs to the Comment',
        references: {
            model: 'Reports',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('GroupMemberUsers', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User id',
        references: {
            model: 'Users',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('GroupMemberUsers', 'groupId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Group to which member belongs.',
        references: {
            model: 'Groups',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicAttachments', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Attachment belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicAttachments', 'attachmentId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Attachment belongs to this Topic.',
        references: {
            model: 'Attachments',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicComments', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Comment belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicComments', 'commentId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Comment belongs to this Topic.',
        references: {
            model: 'Comments',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicEvents', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Comment belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        }
    });

    await queryInterface.changeColumn('TopicMemberGroups', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Topic to which member belongs.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicMemberGroups', 'groupId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Group to whom the membership was given.',
        references: {
            model: 'Groups',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicMemberUsers', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Topic to which member belongs.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicMemberUsers', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'User whom the membership was given.',
        references: {
            model: 'Users',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicPins', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Pin belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicPins', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which User this Pin belongs to.',
        references: {
            model: 'Users',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicReports', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true,
        comment: 'Id if the Topic which the Report belongs to.'
    });

    await queryInterface.changeColumn('TopicVotes', 'topicId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Topic this Vote belongs to.',
        references: {
            model: 'Topics',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('TopicVotes', 'voteId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Which Vote belongs to this Topic.',
        references: {
            model: 'Votes',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('UserConnections', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Id of the User whom the connection belongs to.',
        references: {
            model: 'Users',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('UserConsents', 'userId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Id of the User whom the connection belongs to.',
        references: {
            model: 'Users',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('UserConsents', 'partnerId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Partner id (client_id).',
        references: {
            model: 'Partners',
            key: 'id'
        },
        primaryKey: true
    });

    await queryInterface.changeColumn('VoteContainerFiles', 'voteId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Vote these files belong to.',
        references: {
            model: 'Votes',
            key: 'id'
        }
    });

    await queryInterface.changeColumn('VoteOptions', 'voteId', {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'To what Vote this option belongs to.',
        references: {
            model: 'Votes',
            key: 'id'
        }
    });
  }
};
