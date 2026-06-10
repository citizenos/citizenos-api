'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const cosActivities = app.get('cosActivities');

    const Topic = models.Topic;
    const Discussion = models.Discussion;
    const TopicDiscussion = models.TopicDiscussion;

    /**
     * Fetch a single discussion with comment count by discussionId.
     * Used for both GET and post-update responses.
     */
    const getById = async function (discussionId) {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const rows = await db.query(
            `SELECT
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
                SELECT "discussionId", COUNT("discussionId") as count
                FROM "DiscussionComments"
                GROUP BY "discussionId"
            ) AS dc ON dc."discussionId" = d.id
            WHERE d.id = :discussionId AND d."deletedAt" IS NULL;`,
            {
                replacements: { discussionId },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
        );
        return rows[0] || null;
    };

    /**
     * Fetch participant users for a discussion (users who have commented).
     */
    const getParticipants = async function (discussionId) {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const users = await db.query(
            `SELECT
                u.id,
                u.name,
                u."imageUrl",
                i."commentCount" as "comments.count",
                count(*) OVER()::integer AS "countTotal"
            FROM "Users" u
            JOIN (
                SELECT c."creatorId", COUNT(c.id) as "commentCount"
                FROM "Comments" c
                JOIN "DiscussionComments" dc ON dc."commentId" = c.id
                WHERE dc."discussionId" = :discussionId
                GROUP BY c."creatorId"
            ) i ON u.id = i."creatorId";`,
            {
                replacements: { discussionId },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
        );
        const count = users[0]?.countTotal || 0;
        users.forEach((u) => delete u.countTotal);
        return { count, rows: users };
    };

    /**
     * Create a discussion, link it to the topic, and log the activity.
     * Caller is responsible for providing and committing the transaction.
     */
    const create = async function (data, topicId, actor, t) {
        const { question, deadline, creatorId } = data;

        const topic = await Topic.findOne({
            where: { id: topicId },
            include: [Discussion],
            transaction: t
        });

        if (topic.Discussions.length) {
            const err = new Error('Topic already has a discussion');
            err.statusCode = 403;
            throw err;
        }

        const discussion = Discussion.build({ question, deadline, creatorId, topicId });
        await discussion.save({ transaction: t });

        await TopicDiscussion.create({ topicId, discussionId: discussion.id }, { transaction: t });

        await cosActivities.createActivity(
            discussion,
            topic,
            actor,
            actor.context,
            t
        );

        if (topic.status !== Topic.STATUSES.draft) {
            topic.status = Topic.STATUSES.inProgress;
            await cosActivities.updateActivity(topic, null, actor, actor.context, t);
            await topic.save({ returning: true, transaction: t });
        }

        return discussion;
    };

    /**
     * Update discussion fields and log the activity.
     */
    const update = async function (discussionInstance, topic, fields, body, actor, t) {
        fields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(body, field)) {
                discussionInstance[field] = body[field];
            }
        });

        await cosActivities.updateActivity(discussionInstance, topic, actor, actor.context, t);
        await discussionInstance.save({ transaction: t });
    };

    /**
     * Delete a discussion and log the activity.
     */
    const remove = async function (discussionInstance, actor, t) {
        await cosActivities.deleteActivity(
            discussionInstance,
            discussionInstance.Topics?.[0] || null,
            actor,
            actor.context,
            t
        );
        await discussionInstance.destroy({ transaction: t });
    };

    return {
        getById,
        getParticipants,
        create,
        update,
        remove
    };
};
