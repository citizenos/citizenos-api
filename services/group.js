'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const cosActivities = app.get('cosActivities');
    const _ = app.get('lodash');

    const Group = models.Group;
    const GroupJoin = models.GroupJoin;
    const GroupMemberUser = models.GroupMemberUser;
    const User = models.User;

    /**
     * Fetch a group for an unauthenticated (or optionally authenticated) request.
     * Only returns public groups.
     */
    const getByIdPublic = async function (groupId, userId) {
        let userLevelSql = '';
        let userLevelJoin = '';

        if (userId) {
            userLevelSql = ` COALESCE(gmu.level, null) AS "userLevel",
                CASE
                   WHEN gmu.level = 'admin' THEN gj.token
                   ELSE NULL
                END as "join.token",
                CASE
                   WHEN gmu.level = 'admin' THEN gj.level
                   ELSE NULL
                   END as "join.level",`;
            userLevelJoin = ` LEFT JOIN "GroupMemberUsers" gmu ON gmu."userId"=:userId AND gmu."groupId" = g.id `;
        }

        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const [group] = await db.query(
            `SELECT
                 g.id,
                 g."parentId" AS "parent.id",
                 g.name,
                 g.description,
                 g.visibility,
                 g.rules,
                 g.country,
                 g.language,
                 g.contact,
                 g."imageUrl",
                 g."createdAt",
                 g."updatedAt",
                 c.id as "creator.id",
                 c.email as "creator.email",
                 c.name as "creator.name",
                 c."createdAt" as "creator.createdAt",
                 ${userLevelSql}
                 mc.count as "members.users.count",
                 COALESCE(gtc.count, '{"total": 0}') as "members.topics.count"
            FROM "Groups" g
                LEFT JOIN "Users" c ON (c.id = g."creatorId")
                LEFT JOIN (
                    SELECT "groupId", count("userId") AS "count"
                    FROM "GroupMemberUsers"
                    WHERE "deletedAt" IS NULL
                    GROUP BY "groupId"
                ) AS mc ON (mc."groupId" = g.id)
                LEFT JOIN (
                    SELECT tmgtc."groupId", tmgtc.count::jsonb || tmc.count::jsonb as count
                    FROM (
                        SELECT
                            "groupId",
                            jsonb_object_agg('total', total) as count
                        FROM (
                            SELECT
                                tmg."groupId",
                                COUNT(tmg."groupId") AS total
                            FROM "TopicMemberGroups" tmg
                            WHERE tmg."groupId" = :groupId
                            GROUP BY tmg."groupId"
                        ) as tmgtc
                        GROUP BY "groupId"
                    ) as tmgtc
                    LEFT JOIN (
                        SELECT
                            tmc."groupId",
                            jsonb_object_agg(tmc.status, tmc.count) as count
                        FROM
                        (
                            SELECT
                                tmg."groupId",
                                t."status",
                                count(tmg."topicId") AS "count"
                            FROM "TopicMemberGroups" tmg
                            JOIN "Topics" t ON t.id = tmg."topicId"
                            WHERE tmg."deletedAt" IS NULL AND
                            tmg."groupId" = :groupId
                            GROUP BY tmg."groupId", t.status
                        ) as tmc
                        GROUP BY "groupId"
                    ) tmc ON tmgtc."groupId" = tmc."groupId"
                ) AS gtc ON (gtc."groupId" = g.id)
                LEFT JOIN "GroupJoins" gj ON (gj."groupId" = g.id)
                ${userLevelJoin}
            WHERE g.id = :groupId
            AND g."deletedAt" IS NULL
            AND g.visibility = 'public';`,
            {
                replacements: { groupId, userId },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
        );

        if (group && !group.join) {
            group.join = { token: null, level: null };
        }
        return group || null;
    };

    /**
     * Fetch a group for an authenticated member request.
     */
    const getById = async function (groupId, userId) {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const [group] = await db.query(
            `SELECT
                 g.id,
                 g."parentId" AS "parent.id",
                 g.name,
                 g.description,
                 g.rules,
                 g.country,
                 g.language,
                 g.contact,
                 g.visibility,
                 g."imageUrl",
                 g."createdAt",
                 g."updatedAt",
                 CASE
                    WHEN gf."groupId" = g.id THEN true
                    ELSE false
                 END as "favourite",
                 c.id as "creator.id",
                 c.email as "creator.email",
                 c.name as "creator.name",
                 c."createdAt" as "creator.createdAt",
                 CASE
                    WHEN gmu.level = 'admin' THEN gj.token
                 ELSE NULL
                 END as "join.token",
                 CASE
                    WHEN gmu.level = 'admin' THEN gj.level
                 ELSE NULL
                 END as "join.level",
                 COALESCE (gmu.level, null) AS "userLevel",
                 mc.count as "members.users.count",
                 COALESCE(gtc.count, '{"total": 0}') as "members.topics.count"
            FROM "Groups" g
                LEFT JOIN "Users" c ON (c.id = g."creatorId")
                LEFT JOIN (
                    SELECT "groupId", count("userId") AS "count"
                    FROM "GroupMemberUsers"
                    WHERE "deletedAt" IS NULL
                    GROUP BY "groupId"
                ) AS mc ON (mc."groupId" = g.id)
                LEFT JOIN (
                    SELECT tmgtc."groupId", tmgtc.count::jsonb || tmc.count::jsonb as count
                    FROM (
                        SELECT
                            "groupId",
                            jsonb_object_agg('total', total) as count
                        FROM (
                            SELECT
                                tmg."groupId",
                                COUNT(tmg."groupId") AS total
                            FROM "TopicMemberGroups" tmg
                            WHERE tmg."groupId" = :groupId
                            GROUP BY tmg."groupId"
                        ) as tmgtc
                        GROUP BY "groupId"
                    ) as tmgtc
                    LEFT JOIN (
                        SELECT
                            tmc."groupId",
                            jsonb_object_agg(tmc.status, tmc.count) as count
                        FROM
                        (
                            SELECT
                                tmg."groupId",
                                t."status",
                                count(tmg."topicId") AS "count"
                            FROM "TopicMemberGroups" tmg
                            JOIN "Topics" t ON t.id = tmg."topicId"
                            WHERE tmg."deletedAt" IS NULL AND
                            tmg."groupId" = :groupId
                            GROUP BY tmg."groupId", t.status
                        ) as tmc
                        GROUP BY "groupId"
                    ) tmc ON tmgtc."groupId" = tmc."groupId"
                ) AS gtc ON (gtc."groupId" = g.id)
                LEFT JOIN "GroupFavourites" gf ON gf."groupId" = g.id AND gf."userId" = :userId
                LEFT JOIN "GroupJoins" gj ON (gj."groupId" = g.id)
                LEFT JOIN "GroupMemberUsers" gmu ON (gmu."groupId" = g.id AND gmu."userId" = :userId AND gmu."deletedAt" IS NULL)
            WHERE g.id = :groupId;`,
            {
                replacements: { groupId, userId },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
        );

        if (!group) return null;
        if (group.join && !group.join.token) delete group.join;
        return group;
    };

    /**
     * List groups a user is a member of, with optional filters.
     */
    const list = async function (userId, filters) {
        const {
            include,
            visibility,
            search,
            creatorId,
            favourite,
            country,
            language,
            orderBy = 'updatedAt',
            order = 'DESC',
            offset = 0,
            limit = 26
        } = filters;

        let joinText = '';
        let returnFields = '';
        let where = ` WHERE g."deletedAt" IS NULL AND gmu."deletedAt" is NULL AND gmu."userId" = :userId `;

        if (search) where += ` AND g.name ILIKE :search `;
        if (creatorId) where += ` AND c.id =:creatorId `;
        if (favourite) where += ` AND gf."groupId" = g.id AND gf."userId" = :userId`;
        if (country) where += ` AND g.country ILIKE :country `;
        if (language) where += ` AND g.language ILIKE :language `;
        if (visibility && Object.values(Group.VISIBILITY).indexOf(visibility) > -1) {
            where += ` AND g.visibility=:visibility `;
        }

        let orderBySql = ' ORDER BY ';
        switch (orderBy) {
            case 'name': orderBySql += ' g.name '; break;
            case 'activityCount': orderBySql += ' ga.count '; break;
            case 'memberCount': orderBySql += ' "members.users.count" '; break;
            case 'topicCount': orderBySql += ' "members.topics.count" '; break;
            case 'createdAt': orderBySql += ' g."createdAt" '; break;
            case 'activity': orderBySql += ' ga."updatedAt" '; break;
            default: orderBySql += ' g."updatedAt" ';
        }
        orderBySql += (order.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

        if (include) {
            let union = false;
            joinText = 'LEFT JOIN (';
            if (include.indexOf('member.topic') > -1) {
                joinText += `
                    SELECT tmg."topicId" as "memberId", t.title as "memberName", 'topic' as "type", tmg."groupId" as "groupId", tmg.level::text as "memberLevel"
                    FROM "TopicMemberGroups" tmg
                    LEFT JOIN "Topics" t ON t.id = tmg."topicId"
                    WHERE tmg."deletedAt" IS NULL `;
                union = true;
                returnFields += ' tmgpl.level as "member.levelTopic", ';
            }
            if (include.indexOf('member.user') > -1) {
                if (union) joinText += ' UNION ';
                joinText += `
                    SELECT gmu."userId" as "memberId", u.name as "memberName", 'user' as type, gmu."groupId" as "groupId", gmu.level::text as "memberLevel"
                    FROM "GroupMemberUsers" gmu
                    LEFT JOIN "Users" u ON u.id = gmu."userId"
                    WHERE gmu."deletedAt" IS NULL`;
            }
            joinText += `
                ) as members ON members."groupId" = g.id
                LEFT JOIN (
                SELECT DISTINCT ON (tmgp."topicId") * FROM (
                    SELECT tmg."topicId", gm."userId", tmg.level::text, 2 as "priority"
                    FROM "TopicMemberGroups" tmg LEFT JOIN "GroupMemberUsers" gm ON tmg."groupId" = gm."groupId"
                    WHERE tmg."deletedAt" IS NULL
                    UNION
                    SELECT tmu."topicId", tmu."userId", tmu.level::text, 1 as "priority"
                    FROM "TopicMemberUsers" tmu WHERE tmu."deletedAt" IS NULL
                    ) as tmgp ORDER BY tmgp."topicId", tmgp."priority", tmgp.level::"enum_TopicMemberUsers_level" DESC ) as tmgpl ON tmgpl."topicId" = members."memberId"`;
            returnFields += ` members."memberId" as "member.memberId", members."memberName" as "member.memberName", members."type" as "member.memberType", members."memberLevel" as "member.level", `;
        }

        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const rows = await db.query(`
            SELECT
                g.id, g."parentId" AS "parent.id", g.name, g.description, g."imageUrl",
                g."createdAt", g."updatedAt", g.rules, g.country, g.language, g.contact,
                CASE WHEN gf."groupId" = g.id THEN true ELSE false END as "favourite",
                g.visibility,
                c.id as "creator.id", c.email as "creator.email", c.name as "creator.name",
                CASE WHEN gmu.level = 'admin' THEN gj.token ELSE NULL END as "join.token",
                gj.level as "join.level",
                gmu.level as "permission.level",
                mc.count as "members.users.count",
                gtc.count as "members.topics.count",
                gt."topicId" as "members.topics.latest.id",
                count(*) OVER()::integer AS "countTotal",
                ${returnFields}
                gt.title as "members.topics.latest.title"
            FROM "Groups" g
                JOIN "GroupMemberUsers" gmu ON (gmu."groupId" = g.id)
                JOIN "Users" c ON (c.id = g."creatorId")
                JOIN (
                    SELECT "groupId", count("userId") AS "count"
                    FROM "GroupMemberUsers" WHERE "deletedAt" IS NULL GROUP BY "groupId"
                ) AS mc ON (mc."groupId" = g.id)
                LEFT JOIN (
                    SELECT g.id as "groupId", COALESCE(tmc.count::jsonb, '{"total": 0}'::jsonb) as count
                    FROM "Groups" g LEFT JOIN (
                        SELECT tmc."groupId", jsonb_object_agg(tmc.status, tmc.count) as count
                        FROM (
                            SELECT tmg."groupId", t."status"::text, count(tmg."topicId") AS "count"
                            FROM "TopicMemberGroups" tmg JOIN "Topics" t ON t.id = tmg."topicId"
                            WHERE tmg."deletedAt" IS NULL GROUP BY tmg."groupId", t.status
                            UNION
                            SELECT "groupId", 'total' as status, COUNT("groupId") AS "count"
                            FROM "TopicMemberGroups" GROUP BY "groupId"
                        ) as tmc GROUP BY "groupId"
                    ) tmc ON tmc."groupId" = g.id
                ) AS gtc ON (gtc."groupId" = g.id)
                LEFT JOIN (
                    SELECT tmg."groupId", tmg."topicId", t.title, t."updatedAt"
                    FROM "TopicMemberGroups" tmg JOIN "Topics" t ON (t.id = tmg."topicId")
                    JOIN (
                        SELECT g.id, MAX(tmg."updatedAt") as "updatedAt" FROM "Groups" g JOIN (
                            SELECT tmg."groupId", tmg."topicId", t.title, t."updatedAt"
                            FROM "TopicMemberGroups" tmg JOIN "Topics" t ON (t.id = tmg."topicId")
                            WHERE tmg."deletedAt" IS NULL AND t.title IS NOT NULL AND t.status <> 'draft'
                            ORDER BY t."updatedAt" DESC
                        ) as tmg ON g.id=tmg."groupId" GROUP BY g.id
                    ) tmgtm ON tmgtm."updatedAt" = t."updatedAt" GROUP BY "groupId", "topicId", t.title, t."updatedAt"
                ) AS gt ON (gt."groupId" = g.id)
                LEFT JOIN (
                    SELECT MAX(a."updatedAt") as "updatedAt", ag.count, a."groupIds"
                    FROM "Activities" a
                    LEFT JOIN (
                        SELECT COUNT(*) as "count", "groupIds" FROM "Activities"
                        WHERE array_length("groupIds", 1) > 0 GROUP BY "groupIds"
                    ) ag ON a."groupIds" = ag."groupIds"
                    WHERE array_length(a."groupIds", 1) > 0
                    GROUP BY a."groupIds", ag.count ORDER BY a."groupIds"
                ) ga ON g.id::text = ANY(ga."groupIds")
                LEFT JOIN "GroupFavourites" gf ON (gf."groupId" = g.id AND gf."userId" = :userId)
                LEFT JOIN "GroupJoins" gj ON (gj."groupId" = g.id)
                ${joinText}
                ${where}
            ${orderBySql}
            OFFSET :offset LIMIT :limit;`,
            {
                replacements: { userId, visibility, creatorId, offset, limit, country, language, search: '%' + search + '%' },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            }
        );

        const results = { countTotal: 0, count: 0, rows: [] };
        const memberGroupIds = [];
        rows.forEach(function (groupRow) {
            results.countTotal = groupRow.countTotal;
            delete groupRow.countTotal;
            const group = _.cloneDeep(groupRow);
            const member = _.clone(group.member);

            if (memberGroupIds.indexOf(group.id) < 0) {
                delete group.member;
                group.members.users.rows = [];
                group.members.topics.rows = [];
                results.rows.push(group);
                memberGroupIds.push(group.id);
            }

            if (include && member && member.memberId) {
                results.rows.find(function (g, index) {
                    if (g.id === group.id) {
                        const newMember = { id: member.memberId };
                        if (member.memberType === 'topic') {
                            newMember.title = member.memberName;
                            newMember.level = member.levelTopic;
                            const topicInGroup = results.rows[index].members.topics.rows.find((t) => t.id === newMember.id);
                            if (!topicInGroup) results.rows[index].members.topics.rows.push(newMember);
                            return true;
                        } else if (member.memberType === 'user') {
                            newMember.name = member.memberName;
                            newMember.level = member.level;
                            results.rows[index].members.users.rows.push(newMember);
                            return true;
                        }
                        return true;
                    }
                    return false;
                });
            }
        });

        results.rows.forEach(function (row) {
            if (!row.members.topics.latest.id) delete row.members.topics.latest;
            if (!include || include.indexOf('member.user') < 0) delete row.members.users.rows;
            if (!include || include.indexOf('member.topic') < 0) delete row.members.topics.rows;
        });
        results.count = results.rows.length;
        return results;
    };

    /**
     * Create a group, its GroupJoin record, and log the activity.
     */
    const create = async function (data, actorId, actorIp, t) {
        const group = Group.build({
            name: data.name,
            description: data.description,
            country: data.country,
            language: data.language,
            contact: data.contact,
            rules: data.rules,
            creatorId: actorId,
            parentId: data.parentId,
            visibility: data.visibility || Group.VISIBILITY.private
        });
        await group.save({ transaction: t });

        const groupJoin = await GroupJoin.create({ groupId: group.id }, { transaction: t });

        await cosActivities.createActivity(
            group,
            null,
            { type: 'User', id: actorId, ip: actorIp },
            'POST /api/users/:userId/groups',
            t
        );

        await group.addMember(actorId, {
            through: { level: GroupMemberUser.LEVELS.admin },
            transaction: t
        });

        return { group, groupJoin };
    };

    /**
     * Update group fields and log the activity.
     */
    const update = async function (group, data, actorId, actorIp, t) {
        group.name = data.name;
        group.description = data.description || null;
        group.imageUrl = data.imageUrl || null;
        group.country = data.country || null;
        group.contact = data.contact || null;
        group.language = data.language || null;
        group.rules = data.rules || [];

        await cosActivities.updateActivity(
            group,
            null,
            { type: 'User', id: actorId, ip: actorIp },
            'PUT /api/users/:userId/groups/:groupId',
            t
        );

        await group.save({ transaction: t });
    };

    /**
     * Soft-delete a group and log the activity.
     */
    const remove = async function (group, actorId, actorIp, t) {
        await GroupMemberUser.destroy({ where: { groupId: group.id } }, { transaction: t });
        await group.destroy({ transaction: t });
        await cosActivities.deleteActivity(
            group,
            null,
            { type: 'User', id: actorId, ip: actorIp },
            'DELETE /api/users/:userId/groups/:groupId',
            t
        );
    };

    /**
     * Update a member's level in a group and log the activity.
     * Throws if it would remove the last admin.
     */
    const updateMemberLevel = async function (groupId, memberId, newLevel, actorId, actorIp, t) {
        const groupMemberUser = await GroupMemberUser.findOne({ where: { groupId, userId: memberId } });
        if (!groupMemberUser) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }

        const admins = await GroupMemberUser.findAll({
            where: { groupId, level: GroupMemberUser.LEVELS.admin },
            attributes: ['userId'],
            raw: true
        });
        if (admins.length === 1 && _.find(admins, { userId: memberId })) {
            const err = new Error('Cannot revoke admin permissions from the last admin member.');
            err.statusCode = 400;
            throw err;
        }

        groupMemberUser.level = newLevel;
        await cosActivities.updateActivity(
            groupMemberUser,
            null,
            { type: 'User', id: actorId, ip: actorIp },
            'PUT /api/users/:userId/groups/:groupId/members/users/:memberId',
            t
        );
        await groupMemberUser.save({ transaction: t });
    };

    /**
     * Remove a member from a group and log the activity.
     * Throws if it would remove the last admin.
     */
    const removeMember = async function (groupId, memberId, actorId, actorIp, t) {
        const admins = await GroupMemberUser.findAll({
            where: { groupId, level: GroupMemberUser.LEVELS.admin },
            attributes: ['userId'],
            raw: true
        });
        if (admins.length === 1 && _.find(admins, { userId: memberId })) {
            const err = new Error('Cannot delete the last admin member.');
            err.statusCode = 400;
            throw err;
        }

        const group = Group.build({ id: groupId });
        const user = User.build({ id: memberId });
        group.dataValues.id = groupId;
        user.dataValues.id = memberId;

        await cosActivities.deleteActivity(
            user,
            group,
            { type: 'User', id: actorId, ip: actorIp },
            'DELETE /api/users/:userId/groups/:groupId/members/users/:memberId',
            t
        );

        // Raw SQL required: Postgres does not support LIMIT for DELETE; use hidden ctid column
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        await db.query(
            `DELETE FROM "GroupMemberUsers" WHERE ctid IN (
                SELECT ctid FROM "GroupMemberUsers"
                WHERE "groupId" = :groupId AND "userId" = :userId LIMIT 1
            )`,
            { replacements: { groupId, userId: memberId }, type: db.QueryTypes.DELETE, transaction: t, raw: true }
        );
    };

    return {
        getByIdPublic,
        getById,
        list,
        create,
        update,
        remove,
        updateMemberLevel,
        removeMember
    };
};
