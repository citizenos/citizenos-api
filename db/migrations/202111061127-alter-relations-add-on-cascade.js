'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeConstraint('CommentReports', 'CommentReports_commentId_fkey');
    await queryInterface.addConstraint('CommentReports', {
        fields: ['commentId'],
        type: 'foreign key',
        name: 'CommentReports_commentId_fkey',
        references: { //Required field
          table: 'Comments',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('CommentReports', 'CommentReports_reportId_fkey');
    await queryInterface.addConstraint('CommentReports', {
        fields: ['reportId'],
        type: 'foreign key',
        name: 'CommentReports_reportId_fkey',
        references: { //Required field
          table: 'Reports',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('GroupMemberUsers', 'GroupMemberUsers_userId_fkey');
    await queryInterface.addConstraint('GroupMemberUsers', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'GroupMemberUsers_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('GroupMemberUsers', 'GroupMemberUsers_groupId_fkey');
    await queryInterface.addConstraint('GroupMemberUsers', {
        fields: ['groupId'],
        type: 'foreign key',
        name: 'GroupMemberUsers_groupId_fkey',
        references: { //Required field
          table: 'Groups',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicAttachments', 'TopicAttachments_topicId_fkey');
    await queryInterface.addConstraint('TopicAttachments', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicAttachments_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicAttachments', 'TopicAttachments_attachmentId_fkey');
    await queryInterface.addConstraint('TopicAttachments', {
        fields: ['attachmentId'],
        type: 'foreign key',
        name: 'TopicAttachments_attachmentId_fkey',
        references: { //Required field
          table: 'Attachments',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicComments', 'TopicComments_topicId_fkey');
    await queryInterface.addConstraint('TopicComments', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicComments_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicComments', 'TopicComments_commentId_fkey');
    await queryInterface.addConstraint('TopicComments', {
        fields: ['commentId'],
        type: 'foreign key',
        name: 'TopicComments_commentId_fkey',
        references: { //Required field
          table: 'Comments',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicEvents', 'TopicEvents_topicId_fkey');
    await queryInterface.addConstraint('TopicEvents', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicEvents_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberGroups', 'TopicMemberGroups_topicId_fkey');
    await queryInterface.addConstraint('TopicMemberGroups', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicMemberGroups_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberGroups', 'TopicMemberGroups_groupId_fkey');
    await queryInterface.addConstraint('TopicMemberGroups', {
        fields: ['groupId'],
        type: 'foreign key',
        name: 'TopicMemberGroups_groupId_fkey',
        references: { //Required field
          table: 'Groups',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberUsers', 'TopicMemberUsers_topicId_fkey');
    await queryInterface.addConstraint('TopicMemberUsers', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicMemberUsers_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberUsers', 'TopicMemberUsers_userId_fkey');
    await queryInterface.addConstraint('TopicMemberUsers', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'TopicMemberUsers_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicPins', 'TopicPins_topicId_fkey');
    await queryInterface.addConstraint('TopicPins', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicPins_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicPins', 'TopicPins_userId_fkey');
    await queryInterface.addConstraint('TopicPins', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'TopicPins_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicReports', 'TopicReports_topicId_fkey');
    await queryInterface.addConstraint('TopicReports', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicReports_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicVotes', 'TopicVotes_topicId_fkey');
    await queryInterface.addConstraint('TopicVotes', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicVotes_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicVotes', 'TopicVotes_voteId_fkey');
    await queryInterface.addConstraint('TopicVotes', {
        fields: ['voteId'],
        type: 'foreign key',
        name: 'TopicVotes_voteId_fkey',
        references: { //Required field
          table: 'Votes',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('UserConnections', 'UserConnections_userId_fkey');
    await queryInterface.addConstraint('UserConnections', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'UserConnections_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('UserConsents', 'UserConsents_userId_fkey');
    await queryInterface.addConstraint('UserConsents', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'UserConsents_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('VoteContainerFiles', 'VoteContainerFiles_voteId_fkey');
    await queryInterface.addConstraint('VoteContainerFiles', {
        fields: ['voteId'],
        type: 'foreign key',
        name: 'VoteContainerFiles_voteId_fkey',
        references: { //Required field
          table: 'Votes',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('VoteOptions', 'VoteOptions_voteId_fkey');
    return queryInterface.addConstraint('VoteOptions', {
        fields: ['voteId'],
        type: 'foreign key',
        name: 'VoteOptions_voteId_fkey',
        references: { //Required field
          table: 'Votes',
          field: 'id'
        },
        onDelete: 'cascade',
        onUpdate: 'cascade'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeConstraint('CommentReports', 'CommentReports_commentId_fkey');
    await queryInterface.addConstraint('CommentReports', {
        fields: ['commentId'],
        type: 'foreign key',
        name: 'CommentReports_commentId_fkey',
        references: { //Required field
          table: 'Comments',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('CommentReports', 'CommentReports_reportId_fkey');
    await queryInterface.addConstraint('CommentReports', {
        fields: ['reportId'],
        type: 'foreign key',
        name: 'CommentReports_reportId_fkey',
        references: { //Required field
          table: 'Reports',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('GroupMemberUsers', 'GroupMemberUsers_userId_fkey');
    await queryInterface.addConstraint('GroupMemberUsers', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'GroupMemberUsers_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('GroupMemberUsers', 'GroupMemberUsers_groupId_fkey');
    await queryInterface.addConstraint('GroupMemberUsers', {
        fields: ['groupId'],
        type: 'foreign key',
        name: 'GroupMemberUsers_groupId_fkey',
        references: { //Required field
          table: 'Groups',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicAttachments', 'TopicAttachments_topicId_fkey');
    await queryInterface.addConstraint('TopicAttachments', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicAttachments_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicAttachments', 'TopicAttachments_attachmentId_fkey');
    await queryInterface.addConstraint('TopicAttachments', {
        fields: ['attachmentId'],
        type: 'foreign key',
        name: 'TopicAttachments_attachmentId_fkey',
        references: { //Required field
          table: 'Attachments',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicComments', 'TopicComments_topicId_fkey');
    await queryInterface.addConstraint('TopicComments', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicComments_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicComments', 'TopicComments_commentId_fkey');
    await queryInterface.addConstraint('TopicComments', {
        fields: ['commentId'],
        type: 'foreign key',
        name: 'TopicComments_commentId_fkey',
        references: { //Required field
          table: 'Comments',
          field: 'id'
        },
        onUpdate: 'cascade'
    });


    await queryInterface.removeConstraint('TopicEvents', 'TopicEvents_topicId_fkey');
    await queryInterface.addConstraint('TopicEvents', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicEvents_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberGroups', 'TopicMemberGroups_topicId_fkey');
    await queryInterface.addConstraint('TopicMemberGroups', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicMemberGroups_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberGroups', 'TopicMemberGroups_groupId_fkey');
    await queryInterface.addConstraint('TopicMemberGroups', {
        fields: ['groupId'],
        type: 'foreign key',
        name: 'TopicMemberGroups_groupId_fkey',
        references: { //Required field
          table: 'Groups',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberUsers', 'TopicMemberUsers_topicId_fkey');
    await queryInterface.addConstraint('TopicMemberUsers', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicMemberUsers_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicMemberUsers', 'TopicMemberUsers_userId_fkey');
    await queryInterface.addConstraint('TopicMemberUsers', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'TopicMemberUsers_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicPins', 'TopicPins_topicId_fkey');
    await queryInterface.addConstraint('TopicPins', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicPins_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicPins', 'TopicPins_userId_fkey');
    await queryInterface.addConstraint('TopicPins', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'TopicPins_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicReports', 'TopicReports_topicId_fkey');
    await queryInterface.addConstraint('TopicReports', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicReports_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicVotes', 'TopicVotes_topicId_fkey');
    await queryInterface.addConstraint('TopicVotes', {
        fields: ['topicId'],
        type: 'foreign key',
        name: 'TopicVotes_topicId_fkey',
        references: { //Required field
          table: 'Topics',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('TopicVotes', 'TopicVotes_voteId_fkey');
    await queryInterface.addConstraint('TopicVotes', {
        fields: ['voteId'],
        type: 'foreign key',
        name: 'TopicVotes_voteId_fkey',
        references: { //Required field
          table: 'Votes',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('UserConnections', 'UserConnections_userId_fkey');
    await queryInterface.addConstraint('UserConnections', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'UserConnections_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('UserConsents', 'UserConsents_userId_fkey');
    await queryInterface.addConstraint('UserConsents', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'UserConsents_userId_fkey',
        references: { //Required field
          table: 'Users',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('VoteContainerFiles', 'VoteContainerFiles_voteId_fkey');
    await queryInterface.addConstraint('VoteContainerFiles', {
        fields: ['voteId'],
        type: 'foreign key',
        name: 'VoteContainerFiles_voteId_fkey',
        references: { //Required field
          table: 'Votes',
          field: 'id'
        },
        onUpdate: 'cascade'
    });

    await queryInterface.removeConstraint('VoteOptions', 'VoteOptions_voteId_fkey');
    await queryInterface.addConstraint('VoteOptions', {
        fields: ['voteId'],
        type: 'foreign key',
        name: 'VoteOptions_voteId_fkey',
        references: { //Required field
          table: 'Votes',
          field: 'id'
        },
        onUpdate: 'cascade'
    });
  }
};
