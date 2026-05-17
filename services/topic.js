'use strict';

const _ = require('lodash');

module.exports = function (app) {
    try {
        const models = app.get('models');
        const {
            Topic, TopicMemberUser, TopicMemberGroup, User, Vote, Ideation,
            Discussion, TopicJoin, TopicEvent
        } = models;
        const db = models.sequelize;
        const logger = app.get('logger');
        const cosEtherpad = app.get('cosEtherpad');
        const cosActivities = app.get('cosActivities');
        const cosSignature = app.get('cosSignature');
        const cosUpload = app.get('cosUpload');

        /**
         * Helper to enforce permissions on topic access
         */
        const _checkPermission = async (topicId, userId, level = TopicMemberUser.LEVELS.read) => {
            const permissionsService = app.get('permissionsService');
            const authorizationResult = await permissionsService._topicPermission(topicId, userId, level, true);
            if (!authorizationResult) {
                const err = new Error('Insufficient permissions');
                err.status = 403;
                throw err;
            }
            return authorizationResult;
        };

        /**
         * Get Topic by ID with optional permission check
         */
        const getById = async (topicId, userId = null, options = {}) => {
            let permissions;
            if (userId) {
                permissions = await _checkPermission(topicId, userId);
            }

            const query = _.merge({
                where: {
                    id: topicId
                }
            }, options);

            const topic = await Topic.findOne(query);

            if (topic && permissions) {
                topic.setDataValue('permissions', permissions.topic.permissions);
            }

            return topic;
        };

        /**
         * Get Topic with Members
         */
        const getWithMembers = async (topicId, userId = null) => {
            return await getById(topicId, userId, {
                include: [
                    {
                        model: User,
                        as: 'memberUsers',
                        attributes: ['id', 'name', 'company', 'imageUrl'],
                        through: { attributes: ['level'] }
                    },
                    {
                        model: models.Group,
                        as: 'memberGroups',
                        through: { attributes: ['level'] }
                    }
                ]
            });
        };

        /**
         * Get Topic with Vote
         */
        const getWithVote = async (topicId, userId = null) => {
            return await getById(topicId, userId, {
                include: [
                    {
                        model: Vote,
                        include: [models.VoteOption]
                    }
                ]
            });
        };

        /**
         * Get Topic with Ideation
         */
        const getWithIdeation = async (topicId, userId = null) => {
            return await getById(topicId, userId, {
                include: [Ideation]
            });
        };

        /**
         * Create a Topic
         */
        const create = async (data, creatorId, activityContext, transaction = null) => {
            const activityLogService = app.get('activityLogService');

            const work = async (t) => {
                const topic = Topic.build({
                    ...data,
                    creatorId: creatorId,
                    authorIds: [creatorId]
                });

                const user = await User.findByPk(creatorId, { attributes: ['id', 'language'], transaction: t });

                // External: Etherpad
                await cosEtherpad.createTopic(topic.id, user.language, data.description);

                topic.padUrl = cosEtherpad.getTopicPadUrl(topic.id);
                await topic.save({ transaction: t });

                await TopicJoin.create({ topicId: topic.id }, { transaction: t });

                // Add creator as admin member
                await topic.addMemberUser(creatorId, {
                    through: {
                        level: TopicMemberUser.LEVELS.admin
                    },
                    transaction: t
                });

                // Activity log
                await cosActivities.createActivity(
                    topic,
                    null,
                    {
                        type: 'User',
                        id: creatorId,
                        ip: activityContext?.ip
                    },
                    activityContext?.path,
                    t
                );

                t.afterCommit(async () => {
                    await cosEtherpad.syncTopicWithPad(
                        topic.id,
                        activityContext?.path,
                        {
                            type: 'User',
                            id: creatorId,
                            ip: activityContext?.ip
                        },
                        null,
                        true
                    );
                });

                return topic;
            };

            if (transaction) {
                return await work(transaction);
            } else {
                return await activityLogService.withTransaction(work);
            }
        };

        /**
         * Update a Topic
         */
        const update = async (topicId, data, actorId, activityContext, transaction = null) => {
            const activityLogService = app.get('activityLogService');

            const work = async (t) => {
                const topic = await Topic.findOne({
                    where: { id: topicId },
                    include: [Vote, Ideation, Discussion],
                    transaction: t
                });

                if (!topic) {
                    const err = new Error('Topic not found');
                    err.status = 404;
                    throw err;
                }

                // Business rule validation: Status flow
                if (data.status && data.status !== topic.status && topic.status !== Topic.STATUSES.draft) {
                    const statuses = Object.values(Topic.STATUSES);
                    const vote = topic.Votes?.[0];
                    const ideation = topic.Ideations?.[0];
                    const discussion = topic.Discussions?.[0];

                    if (data.status === Topic.STATUSES.voting && !vote) {
                        const err = new Error('Cannot change to voting without a Vote');
                        err.status = 400;
                        throw err;
                    }
                    if (data.status === Topic.STATUSES.ideation && !ideation) {
                        const err = new Error('Cannot change to ideation without an Ideation');
                        err.status = 400;
                        throw err;
                    }
                    if (data.status === Topic.STATUSES.inProgress && !discussion) {
                        const err = new Error('Cannot change to inProgress without a Discussion');
                        err.status = 400;
                        throw err;
                    }

                    if (statuses.indexOf(topic.status) > statuses.indexOf(data.status) && data.status !== Topic.STATUSES.voting) {
                        const err = new Error('Invalid status flow');
                        err.status = 400;
                        throw err;
                    }
                }

                // Reverting back to voting (special logic from _topicUpdate)
                let isBackToVoting = false;
                if (data.status === Topic.STATUSES.voting && topic.status === Topic.STATUSES.followUp) {
                    isBackToVoting = true;
                }

                // Handle Etherpad
                if (data.description) {
                     if ([Topic.STATUSES.inProgress, Topic.STATUSES.draft, Topic.STATUSES.ideation].includes(topic.status)) {
                        await cosEtherpad.updateTopic(topicId, data.description);
                     } else {
                        const err = new Error('Cannot update content in current status');
                        err.status = 400;
                        throw err;
                     }
                }

                // Handle image deletion if requested
                const config = app.get('config');
                if (Object.keys(data).indexOf('imageUrl') > -1 && !data.imageUrl && topic.imageUrl) {
                    const currentImageURL = new URL(topic.imageUrl);
                    if (config.storage?.type.toLowerCase() === 's3' && currentImageURL.href.indexOf(`https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/users/${actorId}`) === 0) {
                        await cosUpload.delete(currentImageURL.pathname);
                    }
                }

                Object.assign(topic, data);
                await topic.save({ transaction: t });

                if (isBackToVoting) {
                    const vote = topic.Votes[0];
                    await cosSignature.deleteFinalBdoc(topicId, vote.id);
                    await TopicEvent.destroy({
                        where: { topicId: topicId },
                        force: true,
                        transaction: t
                    });
                }

                // Activity log
                await cosActivities.updateActivity(
                    topic,
                    null,
                    {
                        type: 'User',
                        id: actorId,
                        ip: activityContext?.ip
                    },
                    activityContext?.path,
                    t
                );

                // Sync with pad if description changed
                if (data.description) {
                    t.afterCommit(async () => {
                        await cosEtherpad.syncTopicWithPad(
                            topicId,
                            activityContext?.path,
                            {
                                type: 'User',
                                id: actorId,
                                ip: activityContext?.ip
                            },
                            null,
                            true
                        );
                    });
                }

                return topic;
            };

            if (transaction) {
                return await work(transaction);
            } else {
                return await activityLogService.withTransaction(work);
            }
        };

        /**
         * Delete a Topic
         */
        const destroy = async (topicId, actorId, activityContext, transaction = null) => {
            const activityLogService = app.get('activityLogService');

            const work = async (t) => {
                const topic = await Topic.findByPk(topicId, { transaction: t });
                if (!topic) {
                    const err = new Error('Topic not found');
                    err.status = 404;
                    throw err;
                }

                // Etherpad delete
                try {
                    await cosEtherpad.deleteTopic(topicId);
                } catch (err) {
                    if (!err.message || err.message !== 'padID does not exist') {
                        logger.error('Failed to delete Etherpad for topic', err);
                        throw err;
                    }
                }

                // Delete TopicMembers beforehand. Sequelize does not cascade and set "deletedAt" for related objects if "paranoid: true".
                await TopicMemberUser.destroy({
                    where: {
                        topicId: topic.id
                    },
                    force: true,
                    transaction: t
                });

                await TopicMemberGroup.destroy({
                    where: {
                        topicId: topic.id
                    },
                    force: true,
                    transaction: t
                });

                await topic.destroy({ transaction: t });

                // Activity log
                await cosActivities.deleteActivity(
                    topic,
                    null,
                    {
                        type: 'User',
                        id: actorId,
                        ip: activityContext?.ip
                    },
                    activityContext?.path,
                    t
                );

                return true;
            };

            if (transaction) {
                return await work(transaction);
            } else {
                return await activityLogService.withTransaction(work);
            }
        };

        const syncTopicAuthors = async (topicId) => {
            let authorIds = [];
            try {
                authorIds = await cosEtherpad.getTopicPadAuthors(topicId);
                if (!authorIds) authorIds = [];
            } catch (err) {
                authorIds = [];
                logger.error('Failed to sync authors from etherpad', err);
            }

            const topicData = await Topic.findOne({
                where: {
                    id: topicId
                },
                attributes: ['authorIds'],
                include: [{ model: User, as: 'creator' }]
            })
            if (!authorIds.length && topicData?.creator) {
                authorIds.push(topicData.creator.id);
            }
            const compareArrays = (a, b) => a.length === b.length && a.every((element, index) => element === b[index]);
            if (topicData && !compareArrays(authorIds.sort(), topicData.authorIds.sort())) {
                await Topic.update({
                    authorIds
                }, {
                    where: {
                        id: topicId
                    }
                });
            }
        };

        const addUserAsMember = async (userId, topicId, t) => {
            const isMember = await TopicMemberUser.findOne({
                where: {
                    userId,
                    topicId
                },
                transaction: t
            });
            if (!isMember) {
                await TopicMemberUser.create({
                    userId,
                    topicId,
                    level: TopicMemberUser.LEVELS.read
                });
            }
        };

        const getAllTopicMembers = async (topicId, userId, showExtraUserInfo) => {
            const response = {
                groups: {
                    count: 0,
                    rows: []
                },
                users: {
                    count: 0,
                    rows: []
                }
            };

            const groups = await db
                .query(
                    `
                    SELECT
                        g.id,
                        CASE
                            WHEN gmu.level IS NOT NULL THEN g.name
                            ELSE NULL
                        END as "name",
                        tmg.level,
                        gmu.level as "permission.level",
                        g.visibility,
                        g."createdAt",
                        g."updatedAt",
                        gmuc.count as "members.users.count"
                    FROM "TopicMemberGroups" tmg
                        JOIN "Groups" g ON (tmg."groupId" = g.id)
                        JOIN (
                            SELECT
                                "groupId",
                                COUNT(*) as count
                            FROM "GroupMemberUsers"
                            WHERE "deletedAt" IS NULL
                            GROUP BY 1
                        ) as gmuc ON (gmuc."groupId" = g.id)
                        LEFT JOIN "GroupMemberUsers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL)
                    WHERE tmg."topicId" = :topicId
                        AND tmg."deletedAt" IS NULL
                        AND g."deletedAt" IS NULL
                    ORDER BY level DESC;`,
                    {
                        replacements: {
                            topicId: topicId,
                            userId: userId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            let extraUserInfo = '';
            if (showExtraUserInfo) {
                extraUserInfo = `
                u.email,
                `;
            }

            const users = await db
                .query(
                    `
                    SELECT
                        tm.*
                FROM (
                    SELECT DISTINCT ON(id)
                        tm."memberId" as id,
                        tm."level",
                        tmu."level" as "levelUser",
                        u.name,
                        u.company,
                        ${extraUserInfo}
                        u."imageUrl"
                    FROM "Topics" t
                    JOIN (
                        SELECT
                            tmu."topicId",
                            tmu."userId" AS "memberId",
                            tmu."level"::text,
                            1 as "priority"
                        FROM "TopicMemberUsers" tmu
                        WHERE tmu."deletedAt" IS NULL
                        UNION
                        (
                            SELECT
                                tmg."topicId",
                                gm."userId" AS "memberId",
                                tmg."level"::text,
                                2 as "priority"
                            FROM "TopicMemberGroups" tmg
                            LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                            WHERE tmg."deletedAt" IS NULL
                            AND gm."deletedAt" IS NULL
                            ORDER BY tmg."level"::"enum_TopicMemberGroups_level" DESC
                        )
                    ) AS tm ON (tm."topicId" = t.id)
                    JOIN "Users" u ON (u.id = tm."memberId")
                    LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm."memberId" AND tmu."topicId" = t.id)
                    LEFT JOIN "UserConnections" uc ON (uc."userId" = tm."memberId" AND uc."connectionId" = 'esteid')
                    WHERE t.id = :topicId
                    ORDER BY id, tm.priority
                ) tm
                ORDER BY name ASC
                ;`,
                    {
                        replacements: {
                            topicId: topicId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true
                    }
                );

            if (groups?.length) {
                response.groups.count = groups.length;
                response.groups.rows = groups;
            }

            if (users?.length) {
                response.users.count = users.length;
                response.users.rows = users;
            }

            return response;
        };

        // Permission middleware — lazy wrappers so permissionsService is resolved at call time,
        // not at factory init time (avoids service loading-order issues with comments.js)
        const hasPermission = (...args) => app.get('permissionsService').hasTopicPermission(...args);
        const hasVisibility = (...args) => app.get('permissionsService').hasTopicVisibility(...args);
        const isModerator = (...args) => app.get('permissionsService').isModerator(...args);
        const hasPermissionModerator = (...args) => app.get('permissionsService').hasModeratorPermission(...args);
        const _hasPermission = (...args) => app.get('permissionsService')._topicPermission(...args);

        return {
            getById,
            getWithMembers,
            getWithVote,
            getWithIdeation,
            create,
            update,
            destroy,
            syncTopicAuthors,
            addUserAsMember,
            getAllTopicMembers,
            hasPermission,
            hasVisibility,
            isModerator,
            hasPermissionModerator,
            _hasPermission
        };
    } catch (err) {
        console.error('Error initializing TopicService:', err);
        throw err;
    }
};
