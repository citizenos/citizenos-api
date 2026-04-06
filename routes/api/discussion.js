'use strict';

/**
 * Topic API-s (/api/../topics/..)
 */

module.exports = function (app) {
    const config = app.get('config');
    const models = app.get('models');
    const db = models.sequelize;
    const { injectReplacements } = require('sequelize/lib/utils/sql');
    //const _ = app.get('lodash');
    const emailLib = app.get('email');
    const cosActivities = app.get('cosActivities');

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const cosUpload = app.get('cosUpload');
    const https = require('https');
    const path = require('path');

    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;

    const TopicDiscussion = models.TopicDiscussion;
    const Report = models.Report;

    const User = models.User;
    const Attachment = models.Attachment;
    const Comment = models.Comment;
    const CommentVote = models.CommentVote;
    const CommentReport = models.CommentReport;
    const CommentAttachment = models.CommentAttachment;

    const DiscussionComment = models.DiscussionComment;
    const Discussion = models.Discussion;

    const topicService = require('../../services/topic')(app);

    const commentsService = require('../../services/comments')(app);
    const commentsLib = commentsService({
        parentModel: Discussion,
        parentIdParam: 'discussionId',
        joinModel: DiscussionComment,
        joinParentIdField: 'discussionId',
        contextName: 'Discussion',
        listByTopic: true
    });

    const isCommentCreator = commentsLib.isCommentCreator();

    /**
     * Create a Discussion
     */
    app.post('/api/users/:userId/topics/:topicId/discussions', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress]), async (req, res, next) => {
        const question = req.body.question;
        const deadline = req.body.deadline;
        const topicId = req.params.topicId;
        try {
            if (!question) {
                return res.badRequest('Discussion question is missing', 1);
            }

            const discussion = Discussion.build({
                question,
                deadline,
                creatorId: req.user.id
            });


            // TODO: Some of these queries can be done in parallel
            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [
                    Discussion
                ]
            });
            /* Allow only one discussion per topic*/
            if (topic.Discussions.length) return res.forbidden();
            await db
                .transaction(async function (t) {
                    discussion.topicId = topicId;
                    await discussion.save({ transaction: t });

                    await TopicDiscussion
                        .create(
                            {
                                topicId: topicId,
                                discussionId: discussion.id
                            },
                            { transaction: t }
                        );
                    await cosActivities
                        .createActivity(
                            discussion,
                            topic,
                            {
                                type: 'User',
                                id: req.user.id,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
                    if (topic.status !== Topic.STATUSES.draft) {

                        topic.status = Topic.STATUSES.inProgress;

                        await cosActivities
                            .updateActivity(
                                topic,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.id,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );
                        await topic
                            .save({
                                returning: true,
                                transaction: t
                            });
                    }

                    t.afterCommit(() => {
                        const result = discussion.toJSON();
                        result.topicId = topicId;
                        return res.created(result);
                    });
                });
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read a discussion
     */

    const _readDiscussion = async (req, res, next) => {
        const discussionId = req.params.discussionId;
        try {
            const discussionInfo = await db.query(`
            SELECT
                d.id,
                d.question,
                d.deadline,
                d."creatorId",
                d."createdAt",
                td."topicId",
                d."updatedAt",
                COALESCE(dc.count, 0) as "comments.count"
            FROM "Discussions" d
            JOIN "TopicDiscussions" td ON td."discussionId" = d.id
            LEFT JOIN (
                SELECT
                    "discussionId",
                    COUNT("discussionId") as count
                FROM "DiscussionComments"
                GROUP BY "discussionId"
            ) AS dc ON dc."discussionId" = d.id
            WHERE d.id = :discussionId AND d."deletedAt" IS NULL
            ;
        `, {
                replacements: {
                    discussionId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });

            if (!discussionInfo.length) {
                return res.notFound();
            }

            return res.ok(discussionInfo[0]);

        } catch (err) {
            next(err);
        }
    }

    const _readDiscussionParticipants = async (req, res, next) => {
        try {
            const discussionId = req.params.discussionId;
            const users = await db.query(`
            SELECT
                u.id,
                u.name,
                u."imageUrl",
                i."commentCount" as "comments.count",
                count(*) OVER()::integer AS "countTotal"
            FROM "Users" u
            JOIN (
                SELECT "creatorId",
                COUNT(id) as "commentCount"
                FROM "Comments" c
                JOIN "DiscussionComments" dc ON dc."commentId" = c.id
                WHERE dc."discussionId" = :discussionId
                GROUP BY "creatorId"
            ) i ON u.id = c."creatorId";
        `, {
                replacements: {
                    discussionId
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
            )
            const count = users[0]?.countTotal || 0;
            users.forEach((user) => delete user.countTotal);

            return res.ok({
                count,
                rows: users
            });
        } catch (err) {
            next(err);
        }
    };

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/participants', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const discussion = await Discussion.findOne({
                where: {
                    id: req.params.discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    }
                ]
            });
            if (!discussion || discussion.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readDiscussionParticipants(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/discussions/:discussionId/participants', async (req, res, next) => {
        try {
            const discussion = await Discussion.findOne({
                where: {
                    id: req.params.discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    }
                ]
            });
            if (!discussion || discussion.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readDiscussionParticipants(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/topics/:topicId/discussions/:discussionId', async (req, res, next) => {
        try {
            const discussion = await Discussion.findOne({
                where: {
                    id: req.params.discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: {
                            id: req.params.topicId
                        },
                        attributes: ['visibility']
                    }
                ]
            });
            if (!discussion || discussion.Topics[0].visbility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readDiscussion(req, res, next);

        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        _readDiscussion(req, res, next);
    });

    /**
     * Update a discussion
     */
    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.inProgress]), async (req, res, next) => {
        try {
            const topicId = req.params.topicId;
            const discussionId = req.params.discussionId;
            let fields = ['deadline', 'question'];

            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [
                    {
                        model: Discussion,
                        where: {
                            id: discussionId
                        }
                    }
                ]
            });
            if (!topic || !topic.Discussions || !topic.Discussions.length) {
                return res.notFound();
            }

            const discussion = topic.Discussions[0];
            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        discussion[field] = req.body[field];
                });
                await cosActivities
                    .updateActivity(
                        discussion,
                        topic,
                        {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await discussion.save({
                    transaction: t
                });
                t.afterCommit(async () => {
                    const discussionInfo = await db.query(`
                        SELECT
                            d.id,
                            d.question,
                            d.deadline,
                            d."creatorId",
                            d."createdAt",
                            td."topicId",
                            d."updatedAt",
                            COALESCE(dc.count, 0) as "comments.count"
                        FROM "Discussions" d
                        JOIN "TopicDiscussions" td ON td."discussionId" = d.id
                        LEFT JOIN (
                            SELECT
                                "discussionId",
                                COUNT("discussionId") as count
                            FROM "DiscussionComments"
                            GROUP BY "discussionId"
                        ) AS dc ON dc."discussionId" = d.id
                        WHERE d.id = :discussionId AND d."deletedAt" IS NULL
                        ;
                    `, {
                        replacements: {
                            discussionId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    });

                    return res.ok(discussionInfo[0]);
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            const discussionId = req.params.discussionId;
            const discussion = await Discussion.findOne({
                where: {
                    id: discussionId
                },
                include: [
                    {
                        model: Topic,
                        where: { id: req.params.topicId }
                    },
                ]
            });
            if (!discussion) {
                return res.notFound();
            }

            await db
                .transaction(async function (t) {
                    await cosActivities
                        .deleteActivity(discussion, discussion.Topic, {
                            type: 'User',
                            id: req.user.id,
                            ip: req.ip
                        }, req.method + ' ' + req.path, t);


                    await discussion.destroy();

                    t.afterCommit(() => {
                        return res.ok();
                    })
                });
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.createComment);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), commentsLib.listComments);
    app.get('/api/topics/:topicId/discussions/:discussionId/comments', topicService.hasPermission(TopicMemberUser.LEVELS.read, true), topicService.isModerator(), commentsLib.listComments);

    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, false, null, true), commentsLib.deleteComment);

    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId', loginCheck(['partner']), commentsLib.isCommentCreator(), commentsLib.updateComment);

    app.post(['/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/reports', '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports'], loginCheck(['partner']), commentsLib.createReport);

    app.get(['/api/topics/:topicId/comments/:commentId/reports/:reportId', '/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/comments/:commentId/reports/:reportId', '/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId'], authTokenRestrictedUse, commentsLib.readReport);

    app.post('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, commentsLib.moderateReport);

    app.post('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.createVote);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.listVotes);

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/upload', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.admin, false, null, true), commentsLib.uploadCommentAttachment);

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/image/upload', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.uploadCommentImage);

    app.post('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.createCommentAttachment);

    app.put('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.updateCommentAttachment);

    app.delete('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), commentsLib.isCommentCreator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), commentsLib.deleteCommentAttachment);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.commentAttachmentsList);

    app.get('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments', topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.commentAttachmentsList);

    app.get('/api/users/:userId/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.readAttachment);

    app.get('/api/topics/:topicId/discussions/:discussionId/comments/:commentId/attachments/:attachmentId', topicService.hasPermission(TopicMemberUser.LEVELS.read, true), commentsLib.readAttachment);

    return {
        isCommentCreator
    }
}