'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const logger = app.get('logger');
    const Topic = models.Topic;

    const TOPIC_LEVELS = {
        none: 0,
        read: 1,
        edit: 2,
        admin: 3
    };

    // ─── Topic permissions ────────────────────────────────────────────────────────

    // TODO: The cast to "enum_TopicMemberUsers_level" is needed because Sequelize
    // does not support naming enums — two structurally identical enums end up with
    // different PG type names. See https://github.com/sequelize/sequelize/issues/2577
    const _topicPermission = async function (topicId, userId, level, allowPublic, topicStatusesAllowed, allowSelf, partnerId) {
        const minRequiredLevel = level;

        const result = await db.query(
            `SELECT
                t.visibility = 'public' AS "isPublic",
                t.status,
                COALESCE(
                    tmup.level,
                    tmgp.level,
                    CASE WHEN t.visibility = 'public' THEN 'read' ELSE NULL END,
                    'none'
                ) as level,
                COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" >= :level AS "hasDirectAccess",
                t."sourcePartnerId"
            FROM "Topics" t
                LEFT JOIN (
                    SELECT tmu."topicId", tmu."userId", tmu.level::text AS level
                    FROM "TopicMemberUsers" tmu
                    WHERE tmu."deletedAt" IS NULL
                ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                LEFT JOIN (
                    SELECT tmg."topicId", gm."userId",
                        CASE WHEN t.status = 'draft' AND MAX(tmg.level) < 'edit' THEN 'none'
                        ELSE MAX(tmg.level)::text END AS level
                    FROM "TopicMemberGroups" tmg
                        JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        JOIN "Topics" t ON t.id = tmg."topicId"
                    WHERE tmg."deletedAt" IS NULL AND gm."deletedAt" IS NULL
                    GROUP BY "topicId", "userId", t.status
                ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
            WHERE t.id = :topicId AND t."deletedAt" IS NULL;`,
            {
                replacements: { topicId, userId, level },
                type: db.QueryTypes.SELECT,
                raw: true
            }
        );

        if (!result?.[0]) return false;

        const { isPublic, status, hasDirectAccess, level: userLevel, sourcePartnerId } = result[0];

        if (!hasDirectAccess && !(allowPublic && isPublic) && !allowSelf) return false;

        if (topicStatusesAllowed && !topicStatusesAllowed.includes(status)) {
            logger.warn('Access denied to topic due to status mismatch!', 'topicStatusesAllowed:', topicStatusesAllowed, 'status:', status);
            return false;
        }

        if (!isPublic && partnerId && sourcePartnerId && partnerId !== sourcePartnerId) {
            logger.warn('Access denied to topic due to Partner mismatch!', 'partnerId:', partnerId, 'sourcePartnerId:', sourcePartnerId);
            return false;
        }

        if (!allowSelf && TOPIC_LEVELS[minRequiredLevel] > TOPIC_LEVELS[userLevel]) {
            logger.warn('Access denied to topic due to insufficient level', 'userId:', userId);
            return false;
        }

        return {
            topic: {
                id: topicId,
                isPublic,
                sourcePartnerId,
                status,
                permissions: { level: userLevel, hasDirectAccess }
            }
        };
    };

    const hasTopicPermission = function (level, allowPublic, topicStatusesAllowed, allowSelf) {
        return async function (req, res, next) {
            const userId = req.user?.userId || req.user?.id || null;
            const partnerId = req.user?.partnerId || null;
            const topicId = req.params.topicId;

            let effectiveAllowPublic = allowPublic || false;
            if (req.user?.moderator) effectiveAllowPublic = true;

            const effectiveStatusesAllowed = topicStatusesAllowed || null;
            if (effectiveStatusesAllowed && !Array.isArray(effectiveStatusesAllowed)) {
                throw new Error('topicStatusesAllowed must be an array but was ' + topicStatusesAllowed);
            }

            let allowSelfDelete = allowSelf || null;
            if (allowSelfDelete && req.user?.userId !== req.params.memberId) {
                allowSelfDelete = false;
            }

            try {
                const authorizationResult = await _topicPermission(topicId, userId, level, effectiveAllowPublic, effectiveStatusesAllowed, allowSelfDelete, partnerId);
                if (authorizationResult) {
                    req.locals = authorizationResult;
                    return next(null, req, res);
                }
                return res.forbidden('Insufficient permissions');
            } catch (err) {
                return next(err);
            }
        };
    };

    const hasTopicVisibility = function (visibility) {
        return async function (req, res, next) {
            try {
                const count = await Topic.count({ where: { id: req.params.topicId, visibility } });
                if (!count) return res.notFound();
                return next();
            } catch (err) {
                return next(err);
            }
        };
    };

    const _isModerator = async function (topicId, userId) {
        const result = await db.query(
            `SELECT t."id" as "topicId", m."userId", m."partnerId"
            FROM "Topics" t
            JOIN "Moderators" m
                ON (m."partnerId" = t."sourcePartnerId" OR m."partnerId" IS NULL)
                AND m."userId" = :userId
            WHERE t.id = :topicId AND t."deletedAt" IS NULL AND m."deletedAt" IS NULL;`,
            { replacements: { topicId, userId }, type: db.QueryTypes.SELECT, raw: true }
        );

        if (result?.[0] && result[0].userId === userId && result[0].topicId === topicId) {
            return { isModerator: result[0].partnerId ? result[0].partnerId : true };
        }
        return false;
    };

    /**
     * Middleware — adds req.user.moderator flag; does NOT block access.
     */
    const isModerator = function () {
        return async function (req, res, next) {
            const topicId = req.params.topicId;
            const userId = req.user?.userId || req.user?.id;
            if (!topicId || !userId) return next(null, req, res);

            const result = await _isModerator(topicId, userId);
            if (result) req.user.moderator = result.isModerator;
            return next(null, req, res);
        };
    };

    /**
     * Middleware — blocks access if caller is not a Moderator.
     */
    const hasModeratorPermission = function () {
        return async function (req, res, next) {
            const topicId = req.params.topicId;
            const userId = req.user?.userId;
            if (!topicId || !userId) return res.unauthorised();

            try {
                const result = await _isModerator(topicId, userId);
                if (result) {
                    req.user.moderator = result.isModerator;
                    return next(null, req, res);
                }
                return res.unauthorised();
            } catch (err) {
                return next(err);
            }
        };
    };

    // ─── Group permissions ────────────────────────────────────────────────────────

    const _groupPermission = async function (groupId, userId, level, allowPublic, allowSelf) {
        const result = await db.query(
            `SELECT
                g.visibility = 'public' AS "isPublic",
                gm.level::"enum_GroupMemberUsers_level" >= :level AS "allowed",
                gm."userId" AS uid,
                gm."level" AS level,
                CASE WHEN m."userId" IS NOT NULL THEN TRUE ELSE FALSE END as "isModerator",
                g.id
            FROM "Groups" g
            LEFT JOIN "GroupMemberUsers" gm
                ON (gm."groupId" = g.id AND gm."userId" = :userId AND gm."deletedAt" IS NULL)
            LEFT JOIN "Moderators" m
                ON (m."partnerId" IS NULL AND m."deletedAt" IS NULL) AND m."userId" = gm."userId"
            WHERE g.id = :groupId AND g."deletedAt" IS NULL
            GROUP BY g.id, uid, gm.level, m."userId";`,
            {
                replacements: { groupId, userId, level },
                type: db.QueryTypes.SELECT,
                raw: true
            }
        );

        if (!result?.[0]) return false;

        const { isPublic, allowed } = result[0];
        if (allowed || (allowPublic && isPublic) || allowSelf) {
            return { group: result[0] };
        }
        return false;
    };

    const hasGroupPermission = function (level, allowPublic, allowSelf) {
        return async function (req, res, next) {
            const groupId = req.params.groupId;
            const userId = req.user?.userId;
            let allowDeleteSelf = allowSelf;

            if (allowSelf && userId !== req.params.memberId) {
                allowDeleteSelf = false;
            }

            try {
                const authorizationResult = await _groupPermission(groupId, userId, level, allowPublic, allowDeleteSelf);
                if (authorizationResult) {
                    req.locals = authorizationResult;
                    return next(null, req, res);
                }
                return res.forbidden('Insufficient permissions');
            } catch (err) {
                return next(err);
            }
        };
    };

    return {
        _topicPermission,
        hasTopicPermission,
        hasTopicVisibility,
        isModerator,
        hasModeratorPermission,
        _groupPermission,
        hasGroupPermission
    };
};
