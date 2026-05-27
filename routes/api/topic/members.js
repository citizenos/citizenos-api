'use strict';

module.exports = function (app) {
    const logger = app.get('logger');
    const models = app.get('models');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const emailLib = app.get('email');
    const cosActivities = app.get('cosActivities');

    const loginCheck = app.get('middleware.loginCheck');

    const User = models.User;
    const Group = models.Group;
    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicMemberGroup = models.TopicMemberGroup;

    const topicService = app.get('topicService');

    /**
     * Get all members of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read), async function (req, res, next) {
        try {
            const showExtraUserInfo = req.user?.moderator;
            const response = await topicService.getAllTopicMembers(req.params.topicId, req.user.userId, showExtraUserInfo);

            return res.ok(response);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Get all member Users of the Topic
     */

    /**
     * Get all member Users of the Topic
     */
    const _topicMemberUsers = async (req, res, next) => {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;
        const order = req.query.orderBy;
        let sortOrder = req.query.order || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.trim().toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` tm.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` tm."level"::"enum_TopicMemberUsers_level" ${sortOrder} `;
                    break;
                default:
                    sortSql += ` tm.name ASC `
            }
        } else {
            sortSql += ` tm.name ASC `;
        }

        let where = '';
        if (search) {
            where = ` WHERE tm.name ILIKE :search OR tm.email ILIKE :search `
        }

        let dataForModeratorAndAdmin = '';
        let joinForAdmin = '';
        let groupForAdmin = '';
        if (req.user?.moderator) {
            dataForModeratorAndAdmin = `
            tm.email,
            `;
            joinForAdmin = ` LEFT JOIN "UserConnections" uc ON (uc."userId" = tm.id AND uc."connectionId" = 'esteid') `;
            groupForAdmin = `, uc."connectionData"::jsonb `;
        }

        try {
            const users = await db
                .query(
                    `SELECT
                    tm.id,
                    tm.level,
                    tmu.level AS "levelUser",
                    tm.name,
                    tm.company,
                    tm."imageUrl",
                    ${dataForModeratorAndAdmin}
                    json_agg(
                        json_build_object('id', tmg."groupId",
                        'name', tmg.name,
                        'level', tmg."level"
                        )
                    ) as "groups.rows",
                    count(*) OVER()::integer AS "countTotal"
                FROM (
                    SELECT DISTINCT ON(id)
                        tm."memberId" as id,
                        tm."level",
                        u.name,
                        u.company,
                        u."imageUrl",
                        u.email
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
                        SELECT
                            tmg."topicId",
                            gm."userId" AS "memberId",
                            tmg."level"::text,
                            2 as "priority"
                        FROM "TopicMemberGroups" tmg
                        LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                    ) AS tm ON (tm."topicId" = t.id)
                    JOIN "Users" u ON (u.id = tm."memberId")
                    WHERE t.id = :topicId
                    ORDER BY id, tm.priority, tm."level"::"enum_TopicMemberUsers_level" DESC
                ) tm
                LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm.id AND tmu."topicId" = :topicId)
                LEFT JOIN (
                    SELECT gm."userId", tmg."groupId", tmg."topicId", tmg.level, g.name
                    FROM "GroupMemberUsers" gm
                    LEFT JOIN "TopicMemberGroups" tmg ON tmg."groupId" = gm."groupId"
                    LEFT JOIN "Groups" g ON g.id = tmg."groupId" AND g."deletedAt" IS NULL
                    WHERE gm."deletedAt" IS NULL
                    AND tmg."deletedAt" IS NULL
                ) tmg ON tmg."topicId" = :topicId AND (tmg."userId" = tm.id)
                ${joinForAdmin}
                ${where}
                GROUP BY tm.id, tm.level, tmu.level, tm.name, tm.company, tm."imageUrl", tm.email ${groupForAdmin}
                ${sortSql}
                LIMIT :limit
                OFFSET :offset
                ;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user?.userId,
                            search: '%' + search + '%',
                            limit,
                            offset
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                )
            let countTotal = 0;
            if (users?.length) {
                countTotal = users[0].countTotal;
            }
            users.forEach(function (userRow) {
                delete userRow.countTotal;

                userRow.groups.rows.forEach(function (group, index) {
                    if (group.id === null) {
                        userRow.groups.rows.splice(index, 1);
                    } else if (group.level === null) {
                        group.name = null;
                    }
                });
                userRow.groups.count = userRow.groups.rows.length;
            });

            return res.ok({
                countTotal,
                count: users.length,
                rows: users
            });
        } catch (err) {
            return next(err);
        }
    }
    app.get('/api/topics/:topicId/members/users', async function (req, res, next) {
        const topic = await topicService.getById(req.params.topicId, null, {
            where: {
                visibility: Topic.VISIBILITY.public
            }
        });
        if (topic) {
            return _topicMemberUsers(req, res, next);
        }
        return res.notFound();
    });

    app.get('/api/users/:userId/topics/:topicId/members/users', loginCheck(['partner']), topicService.isModerator(), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        return _topicMemberUsers(req, res, next);
    });

    /**
     * Get all member Groups of the Topic
     */
    app.get('/api/topics/:topicId/members/groups', async function (req, res, next) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;
        const order = req.query.order;
        let sortOrder = req.query.sortOrder || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` mg.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` mg."level"::"enum_TopicMemberGroups_level" ${sortOrder} `;
                    break;
                case 'members.users.count':
                    sortSql += ` mg."members.users.count" ${sortOrder} `;
                    break;
                default:
                    sortSql = ` `
            }
        } else {
            sortSql = ` `;
        }

        let where = '';
        if (search) {
            where = `WHERE mg.name ILIKE :search`
        }
        let userLevelField = '';
        let userLevelJoin = '';
        if (req.user?.id) {
            userLevelField = ` gmu.level as "permission.level", `,
                userLevelJoin = ` LEFT JOIN "GroupMemberUsers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL) `;
        }
        try {
            const groups = await db
                .query(
                    `
                    SELECT mg.*,count(*) OVER()::integer AS "countTotal" FROM (
                        SELECT
                            g.id,
                            g.name,
                            g."createdAt",
                            g."updatedAt",
                            tmg.level,
                            ${userLevelField}
                            g.visibility,
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
                            ${userLevelJoin}
                        WHERE tmg."topicId" = :topicId AND g."visibility" = 'public'
                        AND tmg."deletedAt" IS NULL
                        AND g."deletedAt" IS NULL
                        ORDER BY level DESC
                    ) mg
                    ${where}
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user?.userId,
                            search: `%${search}%`,
                            limit,
                            offset
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            let countTotal = 0;
            if (groups && groups.length) {
                countTotal = groups[0].countTotal;
            }
            groups.forEach(function (group) {
                delete group.countTotal;
            });

            return res.ok({
                countTotal,
                count: groups.length,
                rows: groups
            });
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Get all member Groups of the Topic
     */
    app.get('/api/users/:userId/topics/:topicId/members/groups', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;
        const order = req.query.order;
        let sortOrder = req.query.sortOrder || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` mg.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` mg."level"::"enum_TopicMemberGroups_level" ${sortOrder} `;
                    break;
                case 'members.users.count':
                    sortSql += ` mg."members.users.count" ${sortOrder} `;
                    break;
                default:
                    sortSql = ` `
            }
        } else {
            sortSql = ` `;
        }

        let where = '';
        if (search) {
            where = `WHERE mg.name ILIKE :search`
        }

        try {
            const groups = await db
                .query(
                    `
                    SELECT mg.*,count(*) OVER()::integer AS "countTotal" FROM (
                        SELECT
                            g.id,
                            CASE
                                WHEN gmu.level IS NOT NULL THEN g.name
                                ELSE NULL
                            END as "name",
                            g."createdAt",
                            g."updatedAt",
                            tmg.level,
                            gmu.level as "permission.level",
                            g.visibility,
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
                        ORDER BY level DESC
                    ) mg
                    ${where}
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset;`,
                    {
                        replacements: {
                            topicId: req.params.topicId,
                            userId: req.user.userId,
                            search: `%${search}%`,
                            limit,
                            offset
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            let countTotal = 0;
            if (groups && groups.length) {
                countTotal = groups[0].countTotal;
            }
            groups.forEach(function (group) {
                delete group.countTotal;
            });

            return res.ok({
                countTotal,
                count: groups.length,
                rows: groups
            });
        } catch (err) {
            return next(err);
        }
    });

    const checkPermissionsForGroups = async function (groupIds, userId, level) {
        if (!Array.isArray(groupIds)) {
            groupIds = [groupIds];
        }

        const LEVELS = {
            none: 0, // Enables to override inherited permissions.
            read: 1,
            edit: 2,
            admin: 3
        };

        const minRequiredLevel = level || 'read';

        const result = await db
            .query(
                `
                SELECT
                    g.visibility = 'public' AS "isPublic",
                    gm."userId" AS "allowed",
                    gm."userId" AS uid,
                    gm."level" AS level,
                    g.id
                FROM "Groups" g
                LEFT JOIN "GroupMemberUsers" gm
                    ON(gm."groupId" = g.id)
                WHERE g.id IN (:groupIds)
                    AND gm."userId" = :userId
                    AND gm."deletedAt" IS NULL
                    AND g."deletedAt" IS NULL
                GROUP BY id, uid, level;`,
                {
                    replacements: {
                        groupIds: groupIds,
                        userId: userId,
                        level: minRequiredLevel
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            )

        if (result && result.length) {
            if (result.length < groupIds.length) {
                return Promise.reject();
            }
            const checked = [];
            result.forEach((row) => {
                checked.push(
                    new Promise((reject, resolve) => {
                        const blevel = row.level;
                        if (LEVELS[minRequiredLevel] > LEVELS[blevel] && row.isPublic === true) {
                            logger.warn('Access denied to topic due to member without permissions trying to delete user! ', 'userId:', userId);

                            throw new Error('Access denied');
                        }
                        resolve();
                    })
                );
            });
            await Promise.all(checked)
                .catch((err) => {
                    if (err) {
                        return Promise.reject(err);
                    }
                });

            return result;
        } else {
            return Promise.reject();
        }
    };

    /**
     * Create new member Groups to a Topic
     */
    app.post('/api/users/:userId/topics/:topicId/members/groups', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        let members = req.body;
        const topicId = req.params.topicId;

        if (!Array.isArray(members)) {
            members = [members];
        }

        const groupIds = [];
        members.forEach(function (member) {
            groupIds.push(member.groupId);
        });
        try {
            const allowedGroups = await checkPermissionsForGroups(groupIds, req.user.userId, 'admin'); // Checks if all groups are allowed
            if (allowedGroups && allowedGroups[0]) {
                await db.transaction(async function (t) {

                    const topic = await topicService.getById(topicId, null, { transaction: t });
                    const excisitingMembers = await TopicMemberGroup.findAll({
                        where: {
                            topicId: topicId,
                            groupId: {
                                [Op.in]: groupIds
                            }
                        }
                    });
                    const findOrCreateTopicMemberGroups = allowedGroups.map(function (group) {
                        const member = members.find(o => o.groupId === group.id);

                        return TopicMemberGroup
                            .upsert({
                                topicId: topicId,
                                groupId: member.groupId,
                                level: member.level || TopicMemberUser.LEVELS.read
                            },
                                { transaction: t }
                            );
                    });

                    const groupIdsToInvite = [];
                    const memberGroupActivities = [];
                    const results = await Promise.allSettled(findOrCreateTopicMemberGroups);
                    results.forEach((inspection) => {
                        const member = inspection.value[0];
                        if (inspection.status === 'fulfilled') {
                            const exists = excisitingMembers.find((item) => {
                                return item.groupId === member.groupId
                            });
                            const memberGroup = member.toJSON();
                            if (!exists) {
                                groupIdsToInvite.push(memberGroup.groupId);
                                const groupData = allowedGroups.find(item => item.id === memberGroup.groupId);
                                const group = Group.build(groupData);

                                const addActivity = cosActivities.addActivity(
                                    topic,
                                    {
                                        type: 'User',
                                        id: req.user.userId,
                                        ip: req.ip
                                    },
                                    null,
                                    group,
                                    req.method + ' ' + req.path,
                                    t
                                );
                                memberGroupActivities.push(addActivity);
                            }
                        } else {
                            logger.error('Adding Group failed', inspection.reason());
                        }
                    });
                    await Promise.all(memberGroupActivities);
                    const emailResult = await emailLib.sendTopicMemberGroupCreate(groupIdsToInvite, req.user.userId, topicId);
                    if (emailResult && emailResult.errors) {
                        logger.error('ERRORS', emailResult.errors);
                    }

                    t.afterCommit(() => {
                        return res.created();
                    });
                });
            } else {
                return res.forbidden();
            }

        } catch (err) {
            if (err) {
                if (err.message === 'Access denied') {
                    return res.forbidden();
                }
                logger.error('Adding Group to Topic failed', req.path, err);

                return next(err);
            }

            return res.forbidden();
        }
    });


    /**
     * Update User membership information
     */
    app.put('/api/users/:userId/topics/:topicId/members/users/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const newLevel = req.body.level;
        const memberId = req.params.memberId;
        const topicId = req.params.topicId;

        try {
            const topicAdminMembers = await TopicMemberUser
                .findAll({
                    where: {
                        topicId: topicId,
                        level: TopicMemberUser.LEVELS.admin
                    },
                    attributes: ['userId'],
                    raw: true
                });
            const topicMemberUser = await TopicMemberUser.findOne({
                where: {
                    topicId: topicId,
                    userId: memberId
                }
            });

            if (topicAdminMembers && topicAdminMembers.length === 1 && topicAdminMembers.find(m => m.userId === memberId)) {
                return res.badRequest('Cannot revoke admin permissions from the last admin member.');
            }

            // TODO: UPSERT - sequelize has "upsert" from new version, use that if it works - http://sequelize.readthedocs.org/en/latest/api/model/#upsert
            if (topicMemberUser) {
                await db.transaction(async function (t) {
                    topicMemberUser.level = newLevel;

                    await cosActivities.updateActivity(
                        topicMemberUser,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    await topicMemberUser.save({
                        transaction: t
                    });

                    t.afterCommit(() => {
                        return res.ok();
                    });
                });
            } else {
                await TopicMemberUser.create({
                    topicId: topicId,
                    userId: memberId,
                    level: newLevel
                });
                return res.ok();
            }
        } catch (e) {
            return next(e);
        }
    });


    /**
     * Update Group membership information
     */
    app.put('/api/users/:userId/topics/:topicId/members/groups/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), async function (req, res, next) {
        const newLevel = req.body.level;
        const memberId = req.params.memberId;
        const topicId = req.params.topicId;

        try {
            let results;
            try {
                results = await checkPermissionsForGroups(memberId, req.user.userId);
            } catch (err) {
                logger.debug(err)
                return res.forbidden();
            }

            if (results && results[0] && results[0].id === memberId) {
                const topicMemberGroup = await TopicMemberGroup.findOne({
                    where: {
                        topicId: topicId,
                        groupId: memberId
                    }
                });

                await db.transaction(async function (t) {
                    topicMemberGroup.level = newLevel;

                    await cosActivities.updateActivity(
                        topicMemberGroup,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    await topicMemberGroup.save({ transaction: t });

                    t.afterCommit(() => res.ok());
                });
            } else {
                return res.forbidden();
            }

        } catch (err) {
            return next(err);
        }
    });


    /**
     * Delete User membership information
     */
    app.delete('/api/users/:userId/topics/:topicId/members/users/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, null, true), async function (req, res, next) {
        const topicId = req.params.topicId;
        const memberId = req.params.memberId;
        try {
            const result = await TopicMemberUser.findAll({
                where: {
                    topicId: topicId,
                    level: TopicMemberUser.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            });

            // At least 1 admin member has to remain at all times..
            if (result.length === 1 && result.find(r => r.userId === memberId)) {
                return res.badRequest('Cannot delete the last admin member.', 10);
            }
            // TODO: Used to use TopicMemberUser.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
            // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
            const topicMemberUser = await db
                .query(
                    `SELECT
                        t.id as "Topic.id",
                        t.title as "Topic.title",
                        t.description as "Topic.description",
                        t.status as "Topic.status",
                        t.visibility as "Topic.visibility",
                        tj."token" as "Topic.join.token",
                        tj."level" as "Topic.join.level",
                        t.categories as "Topic.categories",
                        t."padUrl" as "Topic.padUrl",
                        t."sourcePartnerId" as "Topic.sourcePartnerId",
                        t."endsAt" as "Topic.endsAt",
                        t.hashtag as "Topic.hashtag",
                        t."createdAt" as "Topic.createdAt",
                        t."updatedAt" as "Topic.updatedAt",
                        u.id as "User.id",
                        u.name as "User.name",
                        u.company as "User.company",
                        u.language as "User.language",
                        u.email as "User.email",
                        u."imageUrl" as "User.imageUrl"
                    FROM
                        "TopicMemberUsers" tmu
                    JOIN "Topics" t
                        ON t.id = tmu."topicId"
                    JOIN "TopicJoins" tj
                        ON (tj."topicId" = t.id AND tj."deletedAt" IS NULL)
                    JOIN "Users" u
                        ON u.id = tmu."userId"
                        WHERE
                        tmu."userId" = :userId
                        AND
                        tmu."topicId" = :topicId
                    ;`,
                    {
                        replacements: {
                            topicId: topicId,
                            userId: memberId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            const topic = Topic.build(topicMemberUser.Topic);
            if (topic.status === Topic.STATUSES.closed && req.user.userId !== memberId) {
                return res.forbidden();
            }
            const user = User.build(topicMemberUser.User);
            topic.dataValues.id = topicId;
            user.dataValues.id = memberId;

            await db
                .transaction(async function (t) {
                    if (memberId === req.user.userId) {
                        // User leaving a Topic
                        logger.debug('Member is leaving the Topic', {
                            memberId: memberId,
                            topicId: topicId
                        });
                        await cosActivities
                            .leaveActivity(topic, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                    } else {
                        await cosActivities
                            .deleteActivity(user, topic, {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            }, req.method + ' ' + req.path, t);
                    }

                    await db
                        .query(
                            `
                            DELETE FROM
                                "TopicMemberUsers"
                            WHERE ctid IN (
                                SELECT
                                    ctid
                                FROM "TopicMemberUsers"
                                WHERE "topicId" = :topicId
                                    AND "userId" = :userId
                                LIMIT 1
                            )
                            `,
                            {
                                replacements: {
                                    topicId: topicId,
                                    userId: memberId
                                },
                                type: db.QueryTypes.DELETE,
                                transaction: t,
                                raw: true
                            }
                        );
                    t.afterCommit(() => {
                        return res.ok();
                    });
                });
        } catch (err) {
            return next(err);
        }
    });


    /**
     * Delete Group membership information
     */
    app.delete('/api/users/:userId/topics/:topicId/members/groups/:memberId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
        const topicId = req.params.topicId;
        const memberId = req.params.memberId;

        try {
            let results;
            try {
                results = await checkPermissionsForGroups(memberId, req.user.userId);
            } catch (err) {
                logger.error(err);

                return res.forbidden();
            }

            if (results && results[0] && results[0].id === memberId) {
                // TODO: Used to use TopicMemberGroups.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
                // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
                const topicMemberGroup = await db
                    .query(
                        `
                        SELECT
                            t.id as "Topic.id",
                            t.title as "Topic.title",
                            t.description as "Topic.description",
                            t.status as "Topic.status",
                            t.visibility as "Topic.visibility",
                            t.intro as "Topic.intro",
                            t.country as "Topic.country",
                            t.language as "Topic.language",
                            t.contact as "Topic.contact",
                            tj."token" as "Topic.join.token",
                            tj."level" as "Topic.join.level",
                            t.categories as "Topic.categories",
                            t."padUrl" as "Topic.padUrl",
                            t."sourcePartnerId" as "Topic.sourcePartnerId",
                            t."endsAt" as "Topic.endsAt",
                            t.hashtag as "Topic.hashtag",
                            t."createdAt" as "Topic.createdAt",
                            t."updatedAt" as "Topic.updatedAt",
                            g.id as "Group.id",
                            g."parentId" as "Group.parentId",
                            g.name as "Group.name",
                            g."creatorId" as "Group.creator.id",
                            g.visibility as "Group.visibility",
                            g.contact as "Group.contact",
                            g.country as "Group.country",
                            g.language as "Group.language",
                            g.rules as "Group.rules"
                        FROM
                            "TopicMemberGroups" tmg
                        JOIN "Topics" t
                            ON t.id = tmg."topicId"
                        JOIN "TopicJoins" tj
                            ON (tj."topicId" = t.id AND tj."deletedAt" IS NULL)
                        JOIN "Groups" g
                            ON g.id = tmg."groupId"
                            WHERE
                            tmg."groupId" = :groupId
                            AND
                            tmg."topicId" = :topicId
                        ;`,
                        {
                            replacements: {
                                topicId: topicId,
                                groupId: memberId
                            },
                            type: db.QueryTypes.SELECT,
                            raw: true,
                            nest: true
                        }
                    );
                const topic = Topic.build(topicMemberGroup.Topic);
                topic.dataValues.id = topicId;
                const group = Group.build(topicMemberGroup.Group);
                group.dataValues.id = memberId;

                await db.transaction(async function (t) {
                    await cosActivities.deleteActivity(
                        group,
                        topic,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    await db
                        .query(
                            `
                                DELETE FROM
                                    "TopicMemberGroups"
                                WHERE ctid IN (
                                    SELECT
                                        ctid
                                    FROM "TopicMemberGroups"
                                    WHERE "topicId" = :topicId
                                    AND "groupId" = :groupId
                                    LIMIT 1
                                )
                                `,
                            {
                                replacements: {
                                    topicId: topicId,
                                    groupId: memberId
                                },
                                type: db.QueryTypes.DELETE,
                                raw: true
                            }
                        );
                    t.afterCommit(() => res.ok());
                });
            } else {
                return res.forbidden();
            }

        } catch (err) {
            return next(err);
        }

    });
};
