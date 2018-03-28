'use strict';

module.exports = function (app) {
    var sequelize = app.get('db');
    var path = require('path');

    var Activity = sequelize.import(path.join(__dirname, 'Activity'));

    var User = sequelize.import(path.join(__dirname, 'User'));
    var UserConnection = sequelize.import(path.join(__dirname, 'UserConnection'));
    var UserConsent = sequelize.import(path.join(__dirname, 'UserConsent'));

    var Partner = sequelize.import(path.join(__dirname, 'Partner'));

    var Moderator = sequelize.import(path.join(__dirname, 'Moderator'));

    var Group = sequelize.import(path.join(__dirname, 'Group'));
    var GroupMember = sequelize.import(path.join(__dirname, 'GroupMember'));

    var Report = sequelize.import(path.join(__dirname, 'Report'));

    var Comment = sequelize.import(path.join(__dirname, 'Comment'));
    var CommentReport = sequelize.import(path.join(__dirname, 'CommentReport'));
    var CommentVote = sequelize.import(path.join(__dirname, 'CommentVote'));

    var Topic = sequelize.import(path.join(__dirname, 'Topic'));

    var TopicMember = require(path.join(__dirname, 'TopicMember')); //TODO: Somehow define inheritance here not in the child Model
    var TopicMemberUser = sequelize.import(path.join(__dirname, 'TopicMemberUser')); // extends TopicMember inside
    var TopicMemberGroup = sequelize.import(path.join(__dirname, 'TopicMemberGroup')); // extends TopicMember inside

    var TopicComment = sequelize.import(path.join(__dirname, 'TopicComment'));

    var Attachment = sequelize.import(path.join(__dirname, 'Attachment'));
    var TopicAttachment = sequelize.import(path.join(__dirname, 'TopicAttachment'));

    var TopicEvent = sequelize.import(path.join(__dirname, 'TopicEvent'));

    var TopicVote = sequelize.import(path.join(__dirname, 'TopicVote'));

    var Vote = sequelize.import(path.join(__dirname, 'Vote'));
    var VoteOption = sequelize.import(path.join(__dirname, 'VoteOption'));
    var VoteContainerFile = sequelize.import(path.join(__dirname, 'VoteContainerFile'));
    var VoteUserContainer = sequelize.import(path.join(__dirname, 'VoteUserContainer'));
    var VoteDelegation = sequelize.import(path.join(__dirname, 'VoteDelegation'));
    var VoteList = sequelize.import(path.join(__dirname, 'VoteList'));

    User.hasMany(UserConnection, {
        foreignKey: 'userId'
    });

    UserConnection.belongsTo(User, {
        foreignKey: 'userId'
    });

    User.hasMany(UserConsent, {
        foreignKey: 'userId'
    });

    UserConsent.belongsTo(User, {
        foreignKey: 'userId'
    });

    Partner.hasMany(UserConsent, {
        foreignKey: 'partnerId'
    });

    // Group can have many Members
    Group.belongsToMany(User, {
        through: GroupMember,
        foreignKey: 'groupId',
        as: {
            singular: 'member',
            plural: 'members'
        },
        constraints: true
    });
    User.belongsToMany(Group, {
        through: GroupMember,
        foreignKey: 'userId',
        constraints: true
    });

    // Every Group is created by a User whom we call "the Creator"
    Group.belongsTo(User, {
        foreignKey: {
            fieldName: 'creatorId',
            allowNull: false
        },
        as: 'creator'
    });

    // Every Topic is created by a User whom we call "the Creator"
    Topic.belongsTo(User, {
        foreignKey: {
            fieldName: 'creatorId',
            allowNull: false
        },
        as: 'creator'
    });

    // Topic can have many Users as Members (collaborators)
    Topic.belongsToMany(User, {
        through: TopicMemberUser,
        foreignKey: 'topicId',
        as: {
            singular: 'memberUser',
            plural: 'memberUsers'
        },
        constraints: true
    });

    Attachment.belongsTo(User, {
        foreignKey: {
            fieldName: 'creatorId',
            allowNull: false
        },
        as: 'creator'
    });

    User.belongsToMany(Topic, {
        through: TopicMemberUser,
        foreignKey: 'userId',
        constraints: true
    });

    // Topic can have many Groups as Members
    Topic.belongsToMany(Group, {
        through: TopicMemberGroup,
        foreignKey: 'topicId',
        as: {
            singular: 'memberGroup',
            plural: 'memberGroups'
        },
        constraints: true
    });

    Group.belongsToMany(Topic, {
        through: TopicMemberGroup,
        foreignKey: 'groupId',
        constraints: true
    });

    Comment.belongsToMany(Report, {
        through: CommentReport,
        foreignKey: 'commentId',
        constraints: true
    });

    // TODO: funky association for cascade delete and right reportId reference
    Report.belongsToMany(Comment, {
        through: CommentReport,
        foreignKey: 'reportId',
        constraints: true
    });

    Topic.belongsToMany(Comment, {
        through: TopicComment,
        foreignKey: 'topicId',
        constraints: true
    });

    // TODO: funky association for cascade delete and right commentId reference
    Comment.belongsToMany(Topic, {
        through: TopicComment,
        foreignKey: 'commentId',
        constraints: true
    });

    Topic.belongsToMany(Attachment, {
        through: TopicAttachment,
        foreignKey: 'topicId',
        constraints: true
    });

    Attachment.belongsToMany(Topic, {
        through: TopicAttachment,
        foreignKey: 'attachmentId',
        constraints: true
    });

    Topic.hasMany(TopicEvent, {
        foreignKey: 'topicId'
    });

    TopicEvent.belongsTo(Topic, {
        foreignKey: 'topicId'
    });

    Topic.hasOne(TopicVote, {
        foreignKey: 'topicId'
    });

    // Topic can have many Votes - that is Topic Vote, mini-Vote..
    Topic.belongsToMany(Vote, {
        through: TopicVote,
        foreignKey: 'topicId',
        constraints: true
    });

    Vote.belongsToMany(Topic, {
        through: TopicVote,
        foreignKey: 'voteId',
        constraints: true
    });

    Vote.hasMany(VoteOption, {
        foreignKey: 'voteId'
    });

    Vote.hasMany(VoteContainerFile, {
        foreignKey: 'voteId'
    });

    Vote.hasMany(VoteUserContainer, {
        foreignKey: 'voteId'
    });

    Vote.hasMany(VoteDelegation, {
        foreignKey: 'voteId'
    });

    VoteDelegation.belongsTo(User, {
        foreignKey: 'toUserId'
    });

    VoteUserContainer.hasMany(UserConnection, {
        foreignKey: 'userId',
        constraints: false
    });

    app.set('models.Activity', Activity);
    app.set('models.User', User);
    app.set('models.UserConnection', UserConnection);
    app.set('models.UserConsent', UserConsent);

    app.set('models.Partner', Partner);

    app.set('models.Moderator', Moderator);

    app.set('models.Group', Group);
    app.set('models.GroupMember', GroupMember);

    app.set('models.Report', Report);

    app.set('models.Comment', Comment);
    app.set('models.CommentVote', CommentVote);
    app.set('models.CommentReport', CommentReport);

    app.set('models.Topic', Topic);

    app.set('models.Attachment', Attachment);
    app.set('models.TopicAttachment', TopicAttachment);

    app.set('models.TopicMember', TopicMember); // NB! Not really a Sequelize model. Exposed for using constants like LEVELS
    app.set('models.TopicMemberUser', TopicMemberUser);
    app.set('models.TopicMemberGroup', TopicMemberGroup);

    app.set('models.TopicComment', TopicComment);

    app.set('models.TopicEvent', TopicEvent);

    app.set('models.TopicVote', TopicVote);

    app.set('models.Vote', Vote);
    app.set('models.VoteOption', VoteOption);
    app.set('models.VoteContainerFile', VoteContainerFile);
    app.set('models.VoteUserContainer', VoteUserContainer);
    app.set('models.VoteList', VoteList);
    app.set('models.VoteDelegation', VoteDelegation);
};
