'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;
    const User = models.User;
    const db = models.sequelize;
    const logger = app.get('logger');
    const cosEtherpad = app.get('cosEtherpad');

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
        if (!authorIds.length) {
            authorIds.push(topicData.creator.id);
        }
        const compareArrays = (a, b) => a.length === b.length && a.every((element, index) => element === b[index]);
        if (!compareArrays(authorIds.sort(), topicData.authorIds.sort())) {
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
    }

    const _hasPermission = async function (topicId, userId, level, allowPublic, topicStatusesAllowed, allowSelf, partnerId) {
        const LEVELS = {
            none: 0, // Enables to override inherited permissions.
            read: 1,
            edit: 2,
            admin: 3
        };
        const minRequiredLevel = level;

        // TODO: That casting to "enum_TopicMemberUsers_level". Sequelize does not support naming enums, through inheritance I have 2 enums that are the same but with different name thus different type in PG. Feature request - https://github.com/sequelize/sequelize/issues/2577
        const result = await db
            .query(
                `SELECT
                    t.visibility = 'public' AS "isPublic",
                    t.status,
                    COALESCE(
                        tmup.level,
                        tmgp.level,
                        CASE
                            WHEN t.visibility = 'public' THEN 'read' ELSE NULL
                        END,
                        'none'
                    ) as level,
                    COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" >= :level AS "hasDirectAccess",
                    t."sourcePartnerId"
                FROM "Topics" t
                    LEFT JOIN (
                        SELECT
                            tmu."topicId",
                            tmu."userId",
                            tmu.level::text AS level
                        FROM "TopicMemberUsers" tmu
                        WHERE tmu."deletedAt" IS NULL
                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                    LEFT JOIN (
                        SELECT
                            tmg."topicId",
                            gm."userId",
                            CASE WHEN t.status= 'draft' AND MAX(tmg.level) < 'edit' THEN 'none'
                            ELSE MAX(tmg.level)::text END AS level
                        FROM "TopicMemberGroups" tmg
                            JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                            JOIN "Topics" t ON t.id = tmg."topicId"
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                        GROUP BY "topicId", "userId", t.status
                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
                WHERE t.id = :topicId
                AND t."deletedAt" IS NULL;
                `,
                {
                    replacements: {
                        topicId: topicId,
                        userId: userId,
                        level: level
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );
        if (result?.[0]) {
            const isPublic = result[0].isPublic;
            const status = result[0].status;
            const hasDirectAccess = result[0].hasDirectAccess;
            const level = result[0].level;
            const sourcePartnerId = result[0].sourcePartnerId;
            if (hasDirectAccess || (allowPublic && isPublic) || allowSelf) {
                // If Topic status is not in the allowed list, deny access.
                if (topicStatusesAllowed && topicStatusesAllowed.indexOf(status) <= -1) {
                    logger.warn('Access denied to topic due to status mismatch! ', 'topicStatusesAllowed:', topicStatusesAllowed, 'status:', status);

                    return false
                }

                // Don't allow Partner to edit other Partners topics
                if (!isPublic && partnerId && sourcePartnerId) {
                    if (partnerId !== sourcePartnerId) {
                        logger.warn('Access denied to topic due to Partner mismatch! ', 'partnerId:', partnerId, 'sourcePartnerId:', sourcePartnerId);

                        return false;
                    }
                }

                if (!allowSelf && (LEVELS[minRequiredLevel] > LEVELS[level])) {
                    logger.warn('Access denied to topic due to member without permissions trying to delete user! ', 'userId:', userId);

                    return false
                }

                const authorizationResult = {
                    topic: {
                        id: topicId,
                        isPublic: isPublic,
                        sourcePartnerId: sourcePartnerId,
                        status: status,
                        permissions: {
                            level: level,
                            hasDirectAccess: hasDirectAccess
                        }
                    }
                };

                return authorizationResult;
            } else {
                return false
            }
        } else {
            return false
        }
    };

    /**
     * Check if User has sufficient privileges to access the Object.
     *
     * @param {string} level One of TopicMemberUser.LEVELS
     * @param {boolean} [allowPublic=false] Allow access to Topic with "public" visibility.
     * @param {string[]} [topicStatusesAllowed=null] Allow access to Topic which is in one of the allowed statuses. IF null, then any status is OK
     * @param {boolean} [allowSelf=false] Allow access when caller does action to is own user
     *
     * @returns {Function} Express middleware function
     */
    const hasPermission = function (level, allowPublic, topicStatusesAllowed, allowSelf) {
        return async function (req, res, next) {
            const userId = req.user?.userId || req.user?.id;
            const partnerId = req.user?.partnerId;
            const topicId = req.params.topicId;

            allowPublic = allowPublic ? allowPublic : false;

            if (req.user && req.user.moderator) {
                allowPublic = true;
            }
            topicStatusesAllowed = topicStatusesAllowed ? topicStatusesAllowed : null;
            let allowSelfDelete = allowSelf ? allowSelf : null;
            if (allowSelfDelete && req.user?.userId !== req.params.memberId) {
                allowSelfDelete = false;
            }

            if (topicStatusesAllowed && !Array.isArray(topicStatusesAllowed)) {
                throw new Error('topicStatusesAllowed must be an array but was ', topicStatusesAllowed);
            }

            try {
                const authorizationResult = await _hasPermission(topicId, userId, level, allowPublic, topicStatusesAllowed, allowSelfDelete, partnerId)
                // Add "req.locals" to store info collected from authorization for further use in the request. Might save a query or two for some use cases.
                // Naming convention ".locals" is inspired by "res.locals" - http://expressjs.com/api.html#res.locals
                if (authorizationResult) {
                    req.locals = authorizationResult;
                    return next(null, req, res);
                }

                return res.forbidden('Insufficient permissions');
            } catch (err) {
                if (err) {
                    return next(err);
                }
            }
        };
    };

    const hasVisibility = function (visibility) {
        return async function (req, res, next) {
            try {
                const count = await Topic.count({
                    where: {
                        id: req.params.topicId,
                        visibility: visibility
                    }
                });

                if (!count) {
                    return res.notFound();
                }

                return next();
            } catch (err) {
                return next(err);
            }
        };
    };

    const _isModerator = async function (topicId, userId) {
        const result = await db
            .query(
                `
                SELECT
                    t."id" as "topicId",
                    m."userId",
                    m."partnerId"
                FROM "Topics" t
                JOIN "Moderators" m
                    ON (m."partnerId" = t."sourcePartnerId" OR m."partnerId" IS NULL)
                    AND m."userId" = :userId
                WHERE t.id = :topicId
                AND t."deletedAt" IS NULL
                AND m."deletedAt" IS NULL
                ;`,
                {
                    replacements: {
                        topicId: topicId,
                        userId: userId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );

        if (result && result[0]) {
            const isUserModerator = result[0].userId === userId;
            const isTopicModerator = result[0].topicId === topicId;

            if (isUserModerator && isTopicModerator) {
                return { isModerator: result[0].partnerId ? result[0].partnerId : true };
            }
        }

        return false;
    };

    /**
     * NOTE! This does not block access in case of not being a Moderator, but only adds moderator flag to user object.
     *
     * @returns {Function} Express middleware function
     */
    const isModerator = function () {
        return async function (req, res, next) {
            const topicId = req.params.topicId;
            let userId;

            if (req.user) {
                userId = req.user.userId;
            }

            if (!topicId || !userId) {
                return next(null, req, res);
            }

            const result = await _isModerator(topicId, userId)
            if (result) {
                req.user.moderator = result.isModerator;
            }

            return next(null, req, res);
        };
    };

    /**
     * Middleware to check for Moderator permissions. Rejects request if there are no Moderator permissions.
     *
     * @returns {Function} Express middleware function
     */
    const hasPermissionModerator = function () {
        return async function (req, res, next) {
            const topicId = req.params.topicId;
            let userId;

            if (req.user) {
                userId = req.user.userId;
            }

            if (!topicId || !userId) {
                return res.unauthorised();
            }
            try {
                const result = await _isModerator(topicId, userId);
                if (result) {
                    req.user.moderator = result.isModerator;

                    return next(null, req, res);
                } else {
                    return res.unauthorised();
                }
            } catch (err) {
                return next(err);
            }
        };
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
            uc."connectionData"::jsonb->>'phoneNumber' AS "phoneNumber",
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

    return {
        syncTopicAuthors,
        addUserAsMember,
        hasPermission,
        hasVisibility,
        isModerator,
        hasPermissionModerator,
        getAllTopicMembers,
        _hasPermission
    }
}