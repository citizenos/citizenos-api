'use strict';

/**
 * Group API-s (/api/../groups/..)
 */

module.exports = function (app) {
    const config = app.get('config');
    const fs = require('fs');
    const path = require('path');
    const logger = app.get('logger');
    const models = app.get('models');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const _ = app.get('lodash');
    const cosActivities = app.get('cosActivities');
    const cosUpload = app.get('cosUpload');
    const validator = app.get('validator');
    const emailLib = app.get('email');
    const util = app.get('util');
    const urlLib = app.get('urlLib');
    const topicLib = require('./topic')(app);

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');

    const Group = models.Group;
    const TopicMemberGroup = models.TopicMemberGroup;
    const GroupInviteUser = models.GroupInviteUser;
    const GroupMemberUser = models.GroupMemberUser;
    const GroupJoin = models.GroupJoin;
    const GroupFavourite = models.GroupFavourite;
    const User = models.User;
    const UserConnection = models.UserConnection;

    const _hasPermission = async function (groupId, userId, level, allowPublic, allowSelf) {
        try {

            const result = await db.query(`
        SELECT
            g.visibility = 'public' AS "isPublic",
            gm.level::"enum_GroupMemberUsers_level" >= :level AS "allowed",
            gm."userId" AS uid,
            gm."level" AS level,
            CASE
                WHEN m."userId" IS NOT NULL THEN TRUE
                ELSE FALSE
            END as "isModerator",
            g.id
        FROM "Groups" g
        LEFT JOIN "GroupMemberUsers" gm
            ON(gm."groupId" = g.id
            AND gm."userId" = :userId
            AND gm."deletedAt" IS NULL)
        LEFT JOIN "Moderators" m
            ON (m."partnerId" IS NULL AND m."deletedAt" IS NULL)
            AND m."userId" = gm."userId"
        WHERE g.id = :groupId
            AND g."deletedAt" IS NULL
        GROUP BY g.id, uid, gm.level, m."userId";`,
                {
                    replacements: {
                        groupId: groupId,
                        userId: userId,
                        level: level
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );

            if (result && result[0]) {
                const isPublic = result[0].isPublic;
                const isAllowed = result[0].allowed;
                if (isAllowed || (allowPublic && isPublic) || allowSelf) {
                    return {
                        group: result[0]
                    };
                }
            } else {
                return false;
            }

        } catch (err) {
            logger.error(err);
            return false;
        }
    };

    const hasPermission = function (level, allowPublic, allowSelf) {
        return async function (req, res, next) {
            const groupId = req.params.groupId;
            const userId = req.user?.userId;
            let allowDeleteSelf = allowSelf;

            if (allowSelf) {
                if (userId !== req.params.memberId) {
                    allowDeleteSelf = false;
                }
            }
            try {
                const authorizationResult = await _hasPermission(groupId, userId, level, allowPublic, allowDeleteSelf);
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

    /**
     * Create a new Group
     */
    app.post('/api/users/:userId/groups', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        await db
            .transaction(async function (t) {
                const group = Group
                    .build({
                        name: req.body.name,
                        description: req.body.description,
                        country: req.body.country,
                        language: req.body.language,
                        contact: req.body.contact,
                        rules: req.body.rules,
                        creatorId: req.user.userId,
                        parentId: req.body.parentId, //TODO: check that user actually has Permissions on the Parent and the Parent exists?
                        visibility: req.body.visibility || Group.VISIBILITY.private
                    });

                await group.save({ transaction: t });

                const groupJoin = await GroupJoin.create(
                    {
                        groupId: group.id
                    },
                    {
                        transaction: t
                    }
                );

                await cosActivities
                    .createActivity(
                        group,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path, t
                    );

                // Add creator as admin member to the Group
                await group.addMember( // Magic method by Sequelize - https://github.com/sequelize/sequelize/wiki/API-Reference-Associations#hasmanytarget-options
                    req.user.userId,
                    {
                        through: {
                            level: GroupMemberUser.LEVELS.admin
                        },
                        transaction: t
                    }
                );

                t.afterCommit(() => {
                    const resObject = group.toJSON();

                    resObject.join = groupJoin.toJSON();

                    return res.created(resObject);
                })
            });
    }));

    app.post('/api/users/:userId/groups/:groupId/upload', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        let group = await Group.findOne({
            where: {
                id: groupId
            }
        });

        if (group) {
            let imageUrl;

            try {
                imageUrl = await cosUpload.upload(req, 'groups', groupId);
            } catch (err) {
                if (err.type && (err.type === 'fileSize' || err.type === 'fileType')) {
                    return res.forbidden(err.message);
                } else {
                    throw err;
                }
            }

            await Group.update(
                {
                    imageUrl: imageUrl.link
                },
                {
                    where: {
                        id: groupId
                    },
                    limit: 1,
                    returning: true
                }
            );

            return res.created(imageUrl);
        } else {
            res.forbidden();
        }
    }));

    /**
     * Read a Group
     */
    const _readGroupUnauth = async (groupId, userId) => {
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
        const [group] = await db
            .query(
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
                    replacements: {
                        groupId: groupId,
                        userId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        if (group && !group.join) {
            group.join = {
                token: null,
                level: null
            }
        }
        return group;
    };

    const _readGroup = async (groupId, userId, visibility) => {
        const [group] = await db
            .query(
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
                    replacements: {
                        groupId: groupId,
                        userId: userId,
                        visibility
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        // Do not return token for people with insufficient permission - https://github.com/citizenos/citizenos-fe/issues/325
        if (group.join && !group.join.token) {
            delete group.join;
        }

        return group;
    };

    app.get('/api/groups/:groupId', asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const group = await _readGroupUnauth(groupId, req.user?.userId);
        if (!group) {
            return res.notFound();
        }
        return res.ok(group);
    }));

    app.get('/api/users/:userId/groups/:groupId', hasPermission(GroupMemberUser.LEVELS.read, true, null), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;
        const groupId = req.params.groupId;
        const group = await _readGroup(groupId, userId);
        if (!group) {
            return res.notFound();
        }
        return res.ok(group);
    }));

    /**
     * Update Group info
     */
    app.put('/api/users/:userId/groups/:groupId', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const groupName = req.body.name;
        const description = req.body.description || null;
        const imageUrl = req.body.imageUrl || null;
        const country = req.body.country || null;
        const contact = req.body.contact || null;
        const language = req.body.language || null;
        const rules = req.body.rules || [];
        const group = await Group
            .findOne({
                where: {
                    id: groupId
                }
            });

        if (!imageUrl && group.imageUrl) {
            const currentImageURL = new URL(group.imageUrl);
            //FIXME: No delete from DB?
            if (config.storage?.type.toLowerCase() === 's3' && currentImageURL.href.indexOf(`https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/groups/${req.user.id}`) === 0) {
                await cosUpload.delete(currentImageURL.pathname)
            } else if (config.storage?.type.toLowerCase() === 'local' && currentImageURL.hostname === (new URL(config.url.api)).hostname) {
                const appDir = __dirname.replace('/routes/api', '/public/uploads/groups');
                const baseFolder = config.storage.baseFolder || appDir;

                fs.unlinkSync(`${baseFolder}/${path.parse(currentImageURL.pathname).base}`);
            }
        }

        group.name = groupName;
        group.description = description;
        group.imageUrl = imageUrl;
        group.country = country;
        group.contact = contact;
        group.language = language;
        group.rules = rules;

        await db
            .transaction(async function (t) {
                await cosActivities
                    .updateActivity(
                        group,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await group.save({
                    transaction: t
                });
                const memberUsersCount = await GroupMemberUser.count({
                    where: {
                        groupId: group.id
                    },
                    transaction: t
                });
                const memberTopicsCount = await db.query(`
                    SELECT COALESCE(gtc.count, '{"total": 0}') as "count"
                    FROM "Groups" g LEFT JOIN (
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
                    ) gtc ON gtc."groupId" = g.id
                    WHERE g.id = :groupId;`
                    ,{
                        replacements: {
                            groupId: group.id
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        transaction: t,
                        nest: true
                    }
                );

                const creator = await User.findOne({
                    where: {
                        id: group.creatorId
                    },
                    attributes: ['id', 'name', 'email', 'createdAt'],
                    transaction: t
                });

                const groupUpdated = group.toJSON();
                groupUpdated.userLevel = GroupMemberUser.LEVELS.admin; //As check has already been done, there is no need for db check here
                groupUpdated.parent = { id: group.parentId };
                delete groupUpdated.parentId;
                groupUpdated.creator = creator.dataValues;
                groupUpdated.members = { users: { count: memberUsersCount }, topics: memberTopicsCount[0] };
                t.afterCommit(() => {
                    if (!groupUpdated) {
                        return res.badRequest();
                    }

                    return res.ok(groupUpdated);
                });
            });
    }));

    /**
     * Delete Group
     */
    app.delete('/api/users/:userId/groups/:groupId', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), asyncMiddleware(async function (req, res) {
        const group = await Group.findByPk(req.params.groupId);

        if (!group) {
            return res.notFound('No such Group found.');
        }

        await db.transaction(async function (t) {
            await GroupMemberUser.destroy({ where: { groupId: group.id } }, { transaction: t });
            await group.destroy({ transaction: t });
            await cosActivities.deleteActivity(
                group,
                null,
                {
                    type: 'User',
                    id: req.user.userId,
                    ip: req.ip
                },
                req.method + ' ' + req.path, t
            );
            t.afterCommit(() => {
                return res.ok();
            });
        });
    }));

    /**
     * Get all Groups User belongs to
     */
    app.get('/api/users/:userId/groups', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const limitMax = 100;
        const limitDefault = 26;
        const offset = req.query.offset || 0;
        let limit = req.query.limit || limitDefault;
        if (limit > limitMax) limit = limitDefault;

        let include = req.query.include;
        // Sequelize and associations are giving too eager results + not being the most effective. https://github.com/sequelize/sequelize/issues/2458
        // Falling back to raw SQL
        // TODO: support LIMIT & OFFSET
        // TODO: This cannot possibly be the most effective query in the world..

        const visibility = req.query.visibility;
        const search = req.query.search;
        const userId = req.user.id;
        const creatorId = req.query.creatorId;
        const favourite = req.query.favourite;

        const country = req.query.country;
        const language = req.query.language;
        let joinText = '';
        let returnFields = '';
        if (include && !Array.isArray(include)) {
            include = [include];
        }
        let where = ` WHERE g."deletedAt" IS NULL
        AND gmu."deletedAt" is NULL
        AND gmu."userId" = :userId `;

        if (search) {
            where += ` AND g.name ILIKE :search `
        }

        if (creatorId) {
            if (creatorId === userId) {
                where += ` AND c.id =:creatorId `;
            } else {
                return res.badRequest('No rights!');
            }
        }

        if (favourite) {
            where += ` AND gf."groupId" = g.id AND gf."userId" = :userId`;
        }
        const orderBy = req.query.orderBy || 'updatedAt';
        const order = (req.query.order && req.query.order.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
        let orderBySql = ` ORDER BY`;

        if (country) {
            where += ` AND g.country ILIKE :country `;
        }

        if (language) {
            where += ` AND g.language ILIKE :language `;
        }

        switch (orderBy) {
            case 'name':
                orderBySql += ` g.name `
                break;
            case 'activityCount':
                orderBySql += ` ga.count `
                break;
            case 'memberCount':
                orderBySql += ` "members.users.count" `
                break;
            case 'topicCount':
                orderBySql += ` "members.topics.count" `
                break;
            case 'createdAt':
                orderBySql += ` g."createdAt" `
                break;
            case 'activity':
                orderBySql += ` ga."updatedAt" `
                break;
            default:
                orderBySql += ` g."updatedAt" `
        }

        orderBySql += order;
        if (include) {
            let union = false;
            joinText = 'LEFT JOIN (';
            if (include.indexOf('member.topic') > -1) {
                joinText += `
                    SELECT
                        tmg."topicId" as "memberId",
                        t.title as "memberName",
                        'topic' as "type",
                        tmg."groupId" as "groupId",
                        tmg.level::text as "memberLevel"
                    FROM "TopicMemberGroups" tmg
                    LEFT JOIN "Topics" t
                    ON t.id = tmg."topicId"
                    WHERE tmg."deletedAt" IS NULL `;
                union = true;
                returnFields += ' tmgpl.level as "member.levelTopic", ';
            }
            if (include.indexOf('member.user') > -1) {
                if (union) {
                    joinText += ' UNION ';
                }
                joinText += `
                    SELECT
                        gmu."userId" as "memberId",
                        u.name as "memberName",
                        'user' as type,
                        gmu."groupId" as "groupId",
                        gmu.level::text as "memberLevel"
                    FROM "GroupMemberUsers" gmu
                    LEFT JOIN "Users" u
                    ON u.id = gmu."userId"
                    WHERE gmu."deletedAt" IS NULL`;
            }
            joinText += `
                ) as members ON members."groupId" = g.id
                LEFT JOIN (
                SELECT DISTINCT ON (tmgp."topicId") * FROM (
                    SELECT
                        tmg."topicId",
                        gm."userId",
                        tmg.level::text,
                        2 as "priority"
                    FROM "TopicMemberGroups" tmg
                        LEFT JOIN "GroupMemberUsers" gm
                    ON tmg."groupId" = gm."groupId"
                    WHERE tmg."deletedAt" IS NULL
                    UNION
                    SELECT
                        tmu."topicId",
                        tmu."userId",
                        tmu.level::text,
                        1 as "priority"
                    FROM "TopicMemberUsers" tmu
                    WHERE tmu."deletedAt" IS NULL
                    ) as tmgp ORDER BY tmgp."topicId", tmgp."priority", tmgp.level::"enum_TopicMemberUsers_level" DESC ) as tmgpl ON tmgpl."topicId" = members."memberId"`;
            returnFields += `
                members."memberId" as "member.memberId",
                members."memberName" as "member.memberName",
                members."type" as "member.memberType",
                members."memberLevel" as "member.level", `;
        }

        if (visibility && Object.values(Group.VISIBILITY).indexOf(visibility) > -1) {
            where += ` AND g.visibility=:visibility `;
        }

        const rows = await db
            .query(`
                SELECT
                    g.id,
                    g."parentId" AS "parent.id",
                    g.name,
                    g.description,
                    g."imageUrl",
                    g."createdAt",
                    g."updatedAt",
                    g.rules,
                    g.country,
                    g.language,
                    g.contact,
                    CASE
                        WHEN gf."groupId" = g.id THEN true
                        ELSE false
                     END as "favourite",
                    g.visibility,
                    c.id as "creator.id",
                    c.email as "creator.email",
                    c.name as "creator.name",
                    CASE
                    WHEN gmu.level = 'admin' THEN gj.token
                    ELSE NULL
                    END as "join.token",
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
                        FROM "GroupMemberUsers"
                        WHERE "deletedAt" IS NULL
                        GROUP BY "groupId"
                    ) AS mc ON (mc."groupId" = g.id)
                    LEFT JOIN (
                        SELECT g.id as "groupId", COALESCE(tmc.count::jsonb, '{"total": 0}'::jsonb) as count
                        FROM "Groups" g
                            LEFT JOIN (
                                    SELECT
                                        tmc."groupId",
                                        jsonb_object_agg(tmc.status, tmc.count) as count
                                            FROM
                                            (
                                                SELECT
                                                    tmg."groupId",
                                                    t."status"::text,
                                                    count(tmg."topicId") AS "count"
                                                FROM "TopicMemberGroups" tmg
                                                JOIN "Topics" t ON t.id = tmg."topicId"
                                                WHERE tmg."deletedAt" IS NULL
                                                GROUP BY tmg."groupId", t.status
                                                UNION
                                                SELECT
                                                    "groupId",
                                                    'total' as status,
                                                    COUNT("groupId") AS "count"
                                                    FROM "TopicMemberGroups"
                                                    GROUP BY "groupId"
                                            ) as tmc
                                    GROUP BY "groupId"
                            ) tmc ON tmc."groupId" = g.id
                    ) AS gtc ON (gtc."groupId" = g.id)
                    LEFT JOIN (
                        SELECT tmg."groupId",
                            tmg."topicId",
                            t.title,
                            t."updatedAt"
                            FROM "TopicMemberGroups" tmg
                            JOIN "Topics" t ON (t.id = tmg."topicId")
                            JOIN (
                            SELECT g.id, MAX(tmg."updatedAt") as "updatedAt" FROM "Groups" g JOIN (
                                SELECT
                                    tmg."groupId",
                                    tmg."topicId",
                                    t.title,
                                    t."updatedAt"
                                FROM "TopicMemberGroups" tmg
                                JOIN "Topics" t ON (t.id = tmg."topicId")
                                WHERE tmg."deletedAt" IS NULL
                                    AND t.title IS NOT NULL
                                    AND t.status <> 'draft'
                                ORDER BY t."updatedAt" DESC
                            ) as tmg ON g.id=tmg."groupId" GROUP BY g.id
                        ) tmgtm ON tmgtm."updatedAt" = t."updatedAt" GROUP BY "groupId", "topicId", t.title, t."updatedAt"
                    ) AS gt ON (gt."groupId" = g.id)
                    LEFT JOIN (
                        SELECT
                            MAX(a."updatedAt") as "updatedAt",
                            ag.count,
                            a."groupIds"
                        FROM
                        "Activities" a
                        LEFT JOIN (
                            SELECT COUNT(*) as "count",
                            "groupIds"
                            FROM "Activities"
                            WHERE array_length("groupIds", 1) > 0
                            GROUP BY "groupIds"
                        ) ag ON a."groupIds" = ag."groupIds"
                        WHERE array_length(a."groupIds", 1) > 0
                        GROUP BY a."groupIds", ag.count ORDER BY a."groupIds"
                    ) ga ON g.id::text = ANY(ga."groupIds")
                    LEFT JOIN "GroupFavourites" gf ON (gf."groupId" = g.id AND gf."userId" = :userId)
                    LEFT JOIN "GroupJoins" gj ON (gj."groupId" = g.id)
                    ${joinText}
                    ${where}
                ${orderBySql}
                OFFSET :offset LIMIT :limit;
                `,
                {
                    replacements: {
                        country: country,
                        language: language,
                        userId: req.user.userId,
                        visibility: visibility,
                        creatorId: creatorId,
                        offset: offset,
                        limit: limit,
                        search: '%' + search + '%'
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        const results = {
            countTotal: 0,
            count: 0,
            rows: []
        };
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
                        const newMember = {
                            id: member.memberId
                        };

                        if (member.memberType === 'topic') {
                            newMember.title = member.memberName;
                            newMember.level = member.levelTopic;

                            const topicInGroup = results.rows[index].members.topics.rows.find(function (t) {
                                return t.id === newMember.id;
                            });

                            if (!topicInGroup) {
                                results.rows[index].members.topics.rows.push(newMember);
                            }

                            return true;
                        } else if (member.memberType === 'user') {
                            newMember.name = member.memberName;
                            newMember.level = member.level;
                            results.rows[index].members.users.rows.push(newMember);

                            return true;
                        } else {
                            return true;
                        }
                    }

                    return false;
                });
            }
        });

        results.rows.forEach(function (row) {
            if (!row.members.topics.latest.id) {
                delete row.members.topics.latest;
            }
            if (!include || include.indexOf('member.user') < 0) {
                delete row.members.users.rows;
            }
            if (!include || include.indexOf('member.topic') < 0) {
                delete row.members.topics.rows;
            }
        });
        results.count = results.rows.length;

        return res.ok(results);
    }));

    /**
     * Get Group member Users
     */
    app.get('/api/groups/:groupId/members/users', asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        const order = req.query.order;
        let sortOrder = req.query.sortOrder || 'ASC';
        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let include = req.query.include;
        if (include && !Array.isArray(include)) {
            include = [include];
        }
        let join = '';
        if (include) {
            if (include.indexOf('invite') > -1) {
                join += `
                UNION
                SELECT
                    u.id,
                    u.name,
                    u.company,
                    u."imageUrl",
                    giu.level::text,
                    to_jsonb(giu) as invite
                FROM "GroupInviteUsers" giu
                JOIN "Users" u ON u.id = giu."userId"
                LEFT JOIN "GroupMemberUsers" gmu ON gmu."userId" = giu."userId"
                LEFT JOIN "UserConnections" uc ON (uc."userId" = giu."userId" AND uc."connectionId" = 'esteid')
                WHERE giu."groupId" = :groupId AND giu."deletedAt" IS NULL AND giu."expiresAt" > NOW() AND gmu."userId" IS NULL
                GROUP BY giu.id, giu."creatorId", giu.level, giu."groupId", u.id
                `;

            }
        }

        let sortSql = ` ORDER BY `;
        let where = '';
        if (search) {
            where = ` WHERE member.name ILIKE :search `
        }
        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` member.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` member."level"::"enum_GroupMemberUsers_level" ${sortOrder} `;
                    break;
                default:
                    sortSql += ` member.name ASC `
            }
        } else {
            sortSql += ` member.name ASC `;
        }

        const members = await db
            .query(
                `
                SELECT
                    member.id,
                    member.name,
                    member.company,
                    member."imageUrl",
                    member.level,
                    member.invite,
                    MAX(a."updatedAt") AS "latestActivity",
                    count(*) OVER()::integer AS "countTotal"
                FROM (
                    SELECT
                            u.id,
                            u.name,
                            u.company,
                            u."imageUrl",
                            gm.level::text,
                            '{}' as invite
                        FROM "GroupMemberUsers" gm
                        JOIN "Users" u ON (u.id = gm."userId")
                        WHERE gm."groupId" = :groupId
                        AND gm."deletedAt" IS NULL
                        GROUP BY u.id, gm.level
                    ${join}
                ) as member
                LEFT JOIN "Activities" a ON member.id::text = a."actorId" AND ARRAY[:groupId] <@  a."groupIds"
                ${where}
                GROUP BY member.id, member.name, member.company, member."imageUrl", member.invite, member.level
                ${sortSql}
                    LIMIT :limit
                    OFFSET :offset
                    ;`,
                {
                    replacements: {
                        groupId,
                        limit,
                        offset,
                        search: `%${search}%`
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );
        let countTotal = 0;
        if (members && members.length) {
            countTotal = members[0].countTotal;
            members.forEach(function (member) {
                if (!member.invite) {
                    delete member.invite;
                }
                delete member.countTotal;
            });
        }

        return res.ok({
            countTotal,
            count: members.length,
            rows: members
        });
    }));
    app.get('/api/users/:userId/groups/:groupId/members/users', hasPermission(GroupMemberUser.LEVELS.read, true, null), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        let search = req.query.search;

        const order = req.query.orderBy;
        let sortOrder = req.query.order || 'ASC';
        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let include = req.query.include;
        if (include && !Array.isArray(include)) {
            include = [include];
        }
        let join = '';
        if (include) {
            if (include.indexOf('invite') > -1) {
                join += `
                UNION
                SELECT
                    u.id,
                    u.name,
                    u.company,
                    u.email,
                    u."imageUrl",
                    giu.level::text,
                    to_jsonb(giu) as invite
                FROM "GroupInviteUsers" giu
                JOIN "Users" u ON u.id = giu."userId"
                LEFT JOIN "UserConnections" uc ON (uc."userId" = giu."userId" AND uc."connectionId" = 'esteid')
                WHERE giu."groupId" = :groupId AND giu."deletedAt" IS NULL AND giu."expiresAt" > NOW()
                GROUP BY giu.id, giu."creatorId", giu.level, giu."groupId", u.id
                `;

            }
        }

        let sortSql = ` ORDER BY `;
        let where = '';
        if (search) {
            where += ` WHERE member.name ILIKE :search `
        }
        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` member.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` member."level"::"enum_GroupMemberUsers_level" ${sortOrder} `;
                    break;
                default:
                    sortSql += ` member.name ASC `
            }
        } else {
            sortSql += ` member.name ASC `;
        }

        let dataForAdmin = '';
        if (req.locals && req.locals.group && req.locals.group.level === GroupMemberUser.LEVELS.admin) {
            dataForAdmin = `
            member.email,
            uc."connectionData"::jsonb->>'phoneNumber' AS "phoneNumber",
            `;
        }

        const members = await db
            .query(
                `
                SELECT
                    member.id,
                    member.name,
                    member.company,
                    member."imageUrl",
                    member.level,
                    member.invite,
                    MAX(a."updatedAt") AS "latestActivity",
                    ${dataForAdmin}
                    count(*) OVER()::integer AS "countTotal"
                FROM (
                    SELECT
                            u.id,
                            u.name,
                            u.company,
                            u.email,
                            u."imageUrl",
                            gm.level::text,
                            '{}' as invite
                        FROM "GroupMemberUsers" gm
                        JOIN "Users" u ON (u.id = gm."userId")
                        WHERE gm."groupId" = :groupId
                        AND gm."deletedAt" IS NULL
                        GROUP BY u.id, gm.level
                    ${join}
                ) as member
                LEFT JOIN "Activities" a ON member.id::text = a."actorId" AND ARRAY[:groupId] <@  a."groupIds"
                LEFT JOIN "UserConnections" uc ON (uc."userId" = member.id AND uc."connectionId" = 'esteid')
                ${where}
                GROUP BY member.id, member.name, member.company, member.email, member."imageUrl", member.invite, member.level, uc."connectionData"
                ${sortSql}
                    LIMIT :limit
                    OFFSET :offset
                    ;`,
                {
                    replacements: {
                        groupId,
                        limit,
                        offset,
                        search: `%${search}%`
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );

        let countTotal = 0;
        if (members && members.length) {
            countTotal = members[0].countTotal;
            members.forEach(function (member) {
                if (!member.invite) {
                    delete member.invite;
                }
                delete member.countTotal;
            });
        }

        return res.ok({
            countTotal,
            count: members.length,
            rows: members
        });

    }));

    /**
     * Update membership information
     */
    app.put('/api/users/:userId/groups/:groupId/members/users/:memberId', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), asyncMiddleware(async function (req, res) {
        const newLevel = req.body.level;
        const memberId = req.params.memberId;
        const groupId = req.params.groupId;

        const groupMembers = await GroupMemberUser
            .findAll({
                where: {
                    groupId: groupId,
                    level: GroupMemberUser.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            });

        if (groupMembers.length === 1 && _.find(groupMembers, { userId: memberId })) {
            return res.badRequest('Cannot revoke admin permissions from the last admin member.');
        }

        const groupMemberUser = await GroupMemberUser
            .findOne({
                where: {
                    groupId: groupId,
                    userId: memberId
                }
            });

        if (!groupMemberUser) {
            return res.notFound('User not found', 1);
        }

        groupMemberUser.level = newLevel;

        await db
            .transaction(async function (t) {
                await cosActivities
                    .updateActivity(
                        groupMemberUser,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await groupMemberUser
                    .save({
                        transaction: t
                    });
                t.afterCommit(() => {
                    return res.ok();
                });
            });
    }));

    /**
     * Delete membership information
     */
    app.delete('/api/users/:userId/groups/:groupId/members/users/:memberId', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, true), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const memberId = req.params.memberId;

        const groupMemberUsers = await GroupMemberUser
            .findAll({
                where: {
                    groupId: groupId,
                    level: GroupMemberUser.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            });

        if (groupMemberUsers.length === 1 && _.find(groupMemberUsers, { userId: memberId })) {
            return res.badRequest('Cannot delete the last admin member.');
        }

        // TODO: Used to use GroupMember.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
        // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
        await db
            .transaction(async function (t) {
                const group = Group.build({ id: groupId });
                const user = User.build({ id: memberId });

                group.dataValues.id = groupId;
                user.dataValues.id = memberId;

                await cosActivities
                    .deleteActivity(
                        user,
                        group,
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
                            "GroupMemberUsers"
                        WHERE ctid IN (
                            SELECT
                                ctid
                            FROM "GroupMemberUsers"
                            WHERE "groupId" = :groupId
                            AND "userId" = :userId
                            LIMIT 1
                        )
                        `,
                        {
                            replacements: {
                                groupId: groupId,
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
    }));

    /**
     * Update (regenerate) Group join token (GroupJoin) with a level
     *
     * PUT as there is one GroupJoin for each Group. Always overwrites previous.
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/325
     */
    app.put('/api/users/:userId/groups/:groupId/join', loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin, null, null), async function (req, res) {
        const groupId = req.params.groupId;
        const level = req.body.level;

        if (!Object.values(GroupJoin.LEVELS).includes(level)) {
            return res.badRequest('Invalid value for property "level". Possible values are ' + Object.values(GroupJoin.LEVELS) + '.', 1);
        }

        const groupJoin = await GroupJoin.findOne({
            where: {
                groupId: groupId
            }
        });

        groupJoin.token = GroupJoin.generateToken();
        groupJoin.level = level;

        await db
            .transaction(async function (t) {
                await cosActivities
                    .updateActivity(
                        groupJoin,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await groupJoin.save({ transaction: t });
                t.afterCommit(() => {
                    return res.ok(groupJoin);
                });
            });
    });

    /**
     * Update level of an existing token WITHOUT regenerating the token
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/325
     */
    app.put('/api/users/:userId/groups/:groupId/join/:token', loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin, null, null), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const token = req.params.token;
        const level = req.body.level;

        if (!Object.values(GroupJoin.LEVELS).includes(level)) {
            return res.badRequest('Invalid value for property "level". Possible values are ' + Object.values(GroupJoin.LEVELS) + '.', 1);
        }

        const groupJoin = await GroupJoin.findOne({
            where: {
                groupId: groupId,
                token: token
            }
        });

        if (!groupJoin) {
            return res.notFound('Nothing found for groupId and token combination.');
        }

        groupJoin.level = level;

        await db
            .transaction(async function (t) {
                await cosActivities
                    .updateActivity(
                        groupJoin,
                        null,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                await groupJoin.save({ transaction: t });
                t.afterCommit(() => {
                    return res.ok(groupJoin);
                });
            });
    }));

    app.get('/api/groups/join/:token', loginCheck(), async (req, res, next) => {
        try {
            const token = req.params.token;

            const groupJoin = await GroupJoin.findOne({
                where: {
                    token: token
                }
            });

            if (!groupJoin) {
                return res.badRequest('Matching token not found', 1);
            }
            const group = await Group.findOne({
                where: {
                    id: groupJoin.groupId
                }
            });

            return res.ok(group.toJSON());
        } catch (err) {
            next(err);
        }
    })
    /**
     * Join authenticated User to Group with a given token.
     *
     * Allows sharing of private join urls for example in forums, on conference screen...
     */
    app.post('/api/groups/join/:token', loginCheck(), asyncMiddleware(async function (req, res) {
        const token = req.params.token;
        const userId = req.user.userId;

        const groupJoin = await GroupJoin.findOne({
            where: {
                token: token
            }
        });

        if (!groupJoin) {
            return res.badRequest('Matching token not found', 1);
        }

        const group = await Group.findOne({
            where: {
                id: groupJoin.groupId
            }
        });

        await db.transaction(async function (t) {
            const [memberUser, created] = await GroupMemberUser.findOrCreate({ // eslint-disable-line
                where: {
                    groupId: group.id,
                    userId: userId
                },
                defaults: {
                    level: groupJoin.level
                },
                transaction: t
            });

            if (created) {
                const user = await User.findOne({
                    where: {
                        id: userId
                    }
                });

                await cosActivities.joinActivity(
                    group,
                    {
                        type: 'User',
                        id: user.id,
                        ip: req.ip,
                        level: groupJoin.level
                    },
                    req.method + ' ' + req.path,
                    t
                );
            }

            t.afterCommit(() => {
                const resObject = group.toJSON();
                resObject.join = groupJoin;
                resObject.userLevel = groupJoin.level;

                return res.ok(resObject);
            });
        });
    }));

    /**
     * Join authenticated User to publci Group without token.
     *
     */
    app.post('/api/users/:userId/groups/:groupId/join', loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;

        const group = await Group.findOne({
            where: {
                id: req.params.groupId,
                visibility: Group.VISIBILITY.public
            }
        });

        if (!group) {
            return res.badRequest('Group not found', 1);
        }



        await db.transaction(async function (t) {
            const [memberUser, created] = await GroupMemberUser.findOrCreate({ // eslint-disable-line
                where: {
                    groupId: group.id,
                    userId: userId
                },
                defaults: {
                    level: GroupMemberUser.LEVELS.read
                },
                transaction: t
            });

            if (created) {
                const user = await User.findOne({
                    where: {
                        id: userId
                    }
                });

                await cosActivities.joinActivity(
                    group,
                    {
                        type: 'User',
                        id: user.id,
                        ip: req.ip,
                        level: GroupMemberUser.LEVELS.read
                    },
                    req.method + ' ' + req.path,
                    t
                );
            }

            t.afterCommit(() => {
                const resObject = group.toJSON();
                resObject.join = GroupJoin.build({
                    groupId: group.id
                });
                resObject.userLevel = GroupMemberUser.LEVELS.read;

                return res.ok(resObject);
            });
        });
    }));

    /**
     * Invite new Members to the Group
     *
     * Does NOT add a Member automatically, but will send an invite, which has to accept in order to become a Member of the Group
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.post('/api/users/:userId/groups/:groupId/invites/users', loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin, true, null), asyncMiddleware(async function (req, res) {
        //NOTE: userId can be actual UUID or e-mail - it is comfort for the API user, but confusing in the BE code.
        const groupId = req.params.groupId;
        const userId = req.user.userId;
        let members = req.body;

        if (!Array.isArray(members)) {
            members = [members];
        }
        const inviteMessage = members[0].inviteMessage; // IF future holds personalized invite messages, every invite has its own message. Also, easiest solution without rewriting a lot of code.
        const validEmailMembers = [];
        let validUserIdMembers = [];

        // Need the Group just for the activity
        const group = await Group.findOne({
            where: {
                id: groupId
            }
        });
        const creator = await GroupMemberUser.findOne({
            where: {
                groupId: groupId,
                userId: req.user.id
            }
        });
        // userId can be actual UUID or e-mail, sort to relevant buckets
        _(members).forEach(function (m) {
            // Regular members can only invite members with read permissions
            if (group.visibility === Group.VISIBILITY.public && creator.level === GroupMemberUser.LEVELS.read) {
                m.level = GroupMemberUser.LEVELS.read;
            }

            if (m.userId) {
                m.userId = m.userId.trim();

                // Is it an e-mail?
                if (validator.isEmail(m.userId)) {
                    m.userId = m.userId.toLowerCase(); // https://github.com/citizenos/citizenos-api/issues/234
                    validEmailMembers.push(m); // The whole member object with level
                } else if (validator.isUUID(m.userId)) {
                    validUserIdMembers.push(m);
                } else {
                    logger.warn('Invalid member ID, is not UUID or email thus ignoring', req.method, req.path, m, req.body);
                }
            } else {
                logger.warn('Missing member id, ignoring', req.method, req.path, m, req.body);
            }
        });

        const validEmails = _.map(validEmailMembers, 'userId');
        if (validEmails.length) {
            // Find out which e-mails already exist
            const usersExistingEmail = await User
                .findAll({
                    where: {
                        email: {
                            [Op.iLike]: {
                                [Op.any]: validEmails
                            }
                        }
                    },
                    attributes: ['id', 'email']
                });


            _(usersExistingEmail).forEach(function (u) {
                const member = _.find(validEmailMembers, { userId: u.email });
                if (member) {
                    member.userId = u.id;
                    validUserIdMembers.push(member);
                    _.remove(validEmailMembers, member); // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                }
            });
        }

        await db.transaction(async function (t) {
            let createdUsers;

            // The leftovers are e-mails for which User did not exist
            if (validEmailMembers.length) {
                const usersToCreate = [];
                _(validEmailMembers).forEach(function (m) {
                    usersToCreate.push({
                        email: m.userId,
                        language: m.language,
                        password: null,
                        name: util.emailToDisplayName(m.userId),
                        source: User.SOURCES.citizenos
                    });
                });

                createdUsers = await User.bulkCreate(usersToCreate, { transaction: t });

                const createdUsersActivitiesCreatePromises = createdUsers.map(async function (user) {
                    return cosActivities.createActivity(
                        user,
                        null,
                        {
                            type: 'System',
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );
                });

                await Promise.all(createdUsersActivitiesCreatePromises);
            }

            // Go through the newly created users and add them to the validUserIdMembers list so that they get invited
            if (createdUsers && createdUsers.length) {
                _(createdUsers).forEach(function (u) {
                    const member = {
                        userId: u.id
                    };

                    // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                    const level = _.find(validEmailMembers, { userId: u.email }).level;
                    if (level) {
                        member.level = level;
                    }

                    validUserIdMembers.push(member);
                });
            }

            validUserIdMembers = validUserIdMembers.filter(function (member) {
                return member.userId !== req.user.userId; // Make sure user does not invite self
            });
            const currentMembers = await GroupMemberUser.findAll({
                where: {
                    groupId: groupId
                }
            });

            const createInvitePromises = validUserIdMembers.map(async function (member) {
                const existingMember = currentMembers.find(function (cmember) {
                    return cmember.userId === member.userId;
                });
                if (existingMember) {
                    const levelsArray = Object.keys(GroupMemberUser.LEVELS);
                    if (existingMember.level !== member.level) {
                        if (levelsArray.indexOf(member.level) > levelsArray.indexOf(existingMember.level)) {
                            await existingMember.update({
                                level: member.level
                            });

                            cosActivities
                                .updateActivity(
                                    existingMember,
                                    null,
                                    {
                                        type: 'User',
                                        id: req.user.userId,
                                        ip: req.ip
                                    },
                                    req.method + ' ' + req.path,
                                    t
                                );

                            return;
                        }

                        return;
                    } else {
                        return;
                    }
                } else {
                    const deletedCount = await GroupInviteUser
                        .destroy(
                            {
                                where: {
                                    userId: member.userId,
                                    groupId: groupId
                                }
                            }
                        );
                    logger.info(`Removed ${deletedCount} invites`);
                    const groupInvite = await GroupInviteUser.create(
                        {
                            groupId: groupId,
                            creatorId: userId,
                            userId: member.userId,
                            level: member.level
                        },
                        {
                            transaction: t
                        }
                    );

                    const userInvited = User.build({ id: groupInvite.userId });
                    userInvited.dataValues.level = groupInvite.level; // FIXME: HACK? Invite event, putting level here, not sure it belongs here, but.... https://github.com/citizenos/citizenos-fe/issues/112 https://github.com/w3c/activitystreams/issues/506
                    userInvited.dataValues.inviteId = groupInvite.id;

                    await cosActivities.inviteActivity(
                        group,
                        userInvited,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    return groupInvite;
                }
            });

            let createdInvites = await Promise.all(createInvitePromises);
            createdInvites = createdInvites.filter(function (invite) {
                return !!invite;
            });

            for (let invite of createdInvites) { // IF future holds personalized invite messages, every invite has its own message and this code can be removed.
                invite.inviteMessage = inviteMessage;
            }

            t.afterCommit(async () => {
                if (createdInvites.length) {
                    await emailLib.sendGroupMemberUserInviteCreate(createdInvites);
                    return res.created({
                        count: createdInvites.length,
                        rows: createdInvites
                    });
                } else {
                    return res.badRequest('No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.', 1);
                }
            });
        });
    }));

    /**
     * Get all pending User invites for a Group
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.get('/api/users/:userId/groups/:groupId/invites/users', loginCheck(), asyncMiddleware(async function (req, res) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        let where = '';
        if (search) {
            where = ` AND u.name ILIKE :search `
        }

        const groupId = req.params.groupId;
        const userId = req.user.userId;

        const permissions = await _hasPermission(groupId, userId, GroupMemberUser.LEVELS.read, null, null);

        // User is not member and can only get own result
        if (!permissions) {
            where = ` AND giu."userId" = :userId `;
        }

        let dataForTopicAdminAndModerator = '';

        if (permissions && (permissions.group.level === GroupMemberUser.LEVELS.admin || permissions.group.isModerator)) {
            dataForTopicAdminAndModerator = `
            u.email as "user.email",
            uc."connectionData"::jsonb->>'phoneNumber' AS "user.phoneNumber",
            `;
        }

        const invites = await db
            .query(
                `SELECT
                    giu.id,
                    giu."creatorId",
                    giu.level,
                    giu."groupId",
                    giu."userId",
                    giu."expiresAt",
                    giu."createdAt",
                    giu."updatedAt",
                    u.id as "user.id",
                    u.name as "user.name",
                    u."imageUrl" as "user.imageUrl",
                    ${dataForTopicAdminAndModerator}
                    count(*) OVER()::integer AS "countTotal"
                FROM "GroupInviteUsers" giu
                JOIN "Users" u ON u.id = giu."userId"
                LEFT JOIN "UserConnections" uc ON (uc."userId" = giu."userId" AND uc."connectionId" = 'esteid')
                WHERE giu."groupId" = :groupId AND giu."deletedAt" IS NULL AND giu."expiresAt" > NOW()
                ${where}
                ORDER BY u.name ASC
                LIMIT :limit
                OFFSET :offset
                ;`,
                {
                    replacements: {
                        groupId: groupId,
                        limit,
                        offset,
                        userId,
                        search: `%${search}%`
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        if (!invites) {
            return res.notFound();
        }
        let countTotal = 0;
        if (invites.length) {
            countTotal = invites[0].countTotal;
        } else if (!permissions) {
            return res.forbidden('Insufficient permissions');
        }

        invites.forEach(function (invite) {
            delete invite.countTotal;
        });

        return res.ok({
            countTotal,
            count: invites.length,
            rows: invites
        });
    }));

    /**
     * Get specific invite for a Group
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.get(['/api/groups/:groupId/invites/users/:inviteId', '/api/users/:userId/groups/:groupId/invites/users/:inviteId'], asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;

        const invite = await GroupInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        groupId: groupId
                    },
                    paranoid: false, // return deleted!
                    include: [
                        {
                            model: Group,
                            attributes: ['id', 'name', 'creatorId'],
                            as: 'group',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'company', 'imageUrl'],
                            as: 'creator',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );

        if (!invite) {
            return res.notFound();
        }
        let hasAccess;
        try {
            hasAccess = await _hasPermission(groupId, invite.userId, GroupMemberUser.LEVELS.read, null, null);
        } catch (e) {
            hasAccess = false;
        }

        if (hasAccess) {
            return res.ok(invite, 1); // Invite has already been accepted OR deleted and the person has access
        }

        const invites = await GroupInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        groupId: invite.groupId
                    },
                    paranoid: false, // return deleted!
                    include: [
                        {
                            model: Group,
                            attributes: ['id', 'name', 'creatorId'],
                            as: 'group',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'company', 'imageUrl'],
                            as: 'creator',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );
        const levels = Object.keys(GroupMemberUser.LEVELS);
        const finalInvites = invites.filter((invite) => {
            if (invite.expiresAt > Date.now() && invite.deletedAt === null) {
                return invite;
            }
        }).sort((a, b) => {
            if (levels.indexOf(a.level) < levels.indexOf(b.level)) return 1;
            if (levels.indexOf(a.level) > levels.indexOf(b.level)) return -1;
            if (levels.indexOf(a.level) === levels.indexOf(b.level)) return 0;
        });

        if (!finalInvites.length) {
            if (invite.deletedAt) {
                return res.gone('The invite has been deleted', 1);
            }


            if (invite.expiresAt < Date.now()) {
                return res.gone(`The invite has expired. Invites are valid for ${GroupInviteUser.VALID_DAYS} days`, 2);
            }
        }

        // At this point we can already confirm users e-mail
        await User
            .update(
                {
                    emailIsVerified: true
                }, {
                where: {
                    id: invite.userId
                },
                fields: ['emailIsVerified'],
                limit: 1
            }
            );

        // User has not been registered by a person but was created by the system on invite - https://github.com/citizenos/citizenos-fe/issues/773
        if (!invite.user.password && invite.user.source === User.SOURCES.citizenos && !invite.user.UserConnections.length) {
            return res.ok(finalInvites[0], 2);
        }

        return res.ok(finalInvites[0]);
    }));

    app.put(['/api/groups/:groupId/invites/users/:inviteId', '/api/users/:userId/groups/:groupId/invites/users/:inviteId'], loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const newLevel = req.body.level;
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;

        if (!(GroupMemberUser.LEVELS[newLevel])) {
            return res.badRequest(`Invalid level "${newLevel}"`)
        }

        const groupInviteUser = await GroupInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        groupId: groupId
                    }
                }
            );

        if (groupInviteUser) {
            await db.transaction(async function (t) {
                groupInviteUser.level = newLevel;

                await cosActivities.updateActivity(
                    groupInviteUser,
                    null,
                    {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    },
                    req.method + ' ' + req.path,
                    t
                );

                await groupInviteUser.save({
                    transaction: t
                });

                t.afterCommit(() => {
                    return res.ok();
                });
            });
        } else {
            return res.notFound();
        }
    }));

    /**
     * Delete Group invite
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.delete(['/api/groups/:groupId/invites/users/:inviteId', '/api/users/:userId/groups/:groupId/invites/users/:inviteId'], loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;
        const invite = await GroupInviteUser.findOne({
            where: {
                id: inviteId
            },
            paranoid: false
        });

        if (!invite) {
            return res.notFound('Invite not found', 1);
        }

        const deletedCount = await GroupInviteUser
            .destroy(
                {
                    where: {
                        userId: invite.userId,
                        groupId: groupId
                    }
                }
            );

        if (!deletedCount) {
            return res.notFound('Invite not found', 1);
        }

        return res.ok();
    }));

    /**
     * Accept a group invite
     */
    app.post(['/api/users/:userId/groups/:groupId/invites/users/:inviteId/accept', '/api/groups/:groupId/invites/users/:inviteId/accept'], loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;

        const invite = await GroupInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        groupId: groupId
                    },
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    },
                    paranoid: false
                }
            );

        if (invite && invite.userId !== userId) {
            return res.forbidden();
        }
        const invites = await GroupInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        groupId: groupId
                    },
                    include: [
                        {
                            model: Group,
                            attributes: ['id', 'name', 'creatorId'],
                            as: 'group',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'company', 'imageUrl'],
                            as: 'creator',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );
        const levelsArray = Object.values(GroupMemberUser.LEVELS);
        const finalInvites = invites.filter((invite) => {
            if (invite.expiresAt > Date.now() && invite.deletedAt === null) {
                return invite;
            }
        }).sort((a, b) => {
            if (levelsArray.indexOf(a.level) < levelsArray.indexOf(b.level)) return 1;
            if (levelsArray.indexOf(a.level) > levelsArray.indexOf(b.level)) return -1;
            if (levelsArray.indexOf(a.level) === levelsArray.indexOf(b.level)) return 0;
        });
        // Find out if the User is already a member of the Group
        const memberUserExisting = await GroupMemberUser
            .findOne({
                where: {
                    groupId: groupId,
                    userId: userId
                }
            });
        if (memberUserExisting) {
            // User already a member, see if we need to update the level
            if (finalInvites.length && levelsArray.indexOf(memberUserExisting.level) < levelsArray.indexOf(finalInvites[0].level)) {
                const memberUserUpdated = await memberUserExisting.update({
                    level: invite.level
                });
                return res.ok(memberUserUpdated);
            } else {
                // No level update, respond with existing member info
                return res.ok(memberUserExisting);
            }
        }

        if (!finalInvites.length) {
            // Find out if the User is already a member of the Topic
            if (invite.expiresAt < Date.now()) {
                return res.gone(`The invite has expired. Invites are valid for ${GroupInviteUser.VALID_DAYS} days`, 2);
            }
            return res.notFound();
        }

        const finalInvite = finalInvites[0];

        // Group needed just for the activity
        const group = await Group.findOne({
            where: {
                id: invite.groupId
            }
        });

        await db.transaction(async function (t) {
            const member = await GroupMemberUser.create(
                {
                    groupId: invite.groupId,
                    userId: invite.userId,
                    level: GroupMemberUser.LEVELS[invite.level]
                },
                {
                    transaction: t
                }
            );

            await GroupInviteUser.destroy({
                where: {
                    groupId: finalInvite.groupId,
                    userId: finalInvite.userId
                },
                transaction: t
            });

            const user = User.build({ id: member.userId });
            user.dataValues.id = member.userId;

            await cosActivities.acceptActivity(
                finalInvite,
                {
                    type: 'User',
                    id: req.user.userId,
                    ip: req.ip
                },
                {
                    type: 'User',
                    id: invite.creatorId
                },
                group,
                req.method + ' ' + req.path,
                t
            );
            t.afterCommit(() => {
                return res.created(member);
            });
        });
    }));

    /**
     * Get Group member Topics
     */

    const _getGroupMemberTopics = async (req, res, visibility) => {
        //const group = await Group.findOne({ where: { id: req.params.groupId } });
        const limitDefault = 8;
        const groupId = req.params.groupId;
        const group = await Group.findOne({
            where: {
                id: groupId
            }
        });
        const offset = parseInt(req.query.offset, 8) ? parseInt(req.query.offset, 8) : 0;
        let search = req.query.search;
        let limit = parseInt(req.query.limit, 8) ? parseInt(req.query.limit, 8) : limitDefault;
        let where = '';
        let join = '';
        let returncolumns = '';
        let voteResults = false;
        if (search) {
            where = ` AND t.title ILIKE :search `
        }
        const userId = req.user?.userId;
        const creatorId = req.query.creatorId;
        let statuses = req.query.statuses;
        const favourite = req.query.favourite;
        const country = req.query.country;
        const language = req.query.language;
        const hasVoted = req.query.hasVoted; // Filter out Topics where User has participated in the voting process.
        const showModerated = req.query.showModerated || false;
        const orderBy = req.query.orderBy;
        let sortOrder = req.query.order || 'ASC';
        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;
        let groupBy = ``;

        if (orderBy) {
            switch (orderBy) {
                case 'title':
                    sortSql += ` t.title ${sortOrder}`;
                    break;
                case 'status':
                    sortSql += ` t.status ${sortOrder} `;
                    break;
                case 'favourite':
                    sortSql += ` favourite ${sortOrder} `;
                    break;
                case 'lastActivity':
                    sortSql += ` "lastActivity" ${sortOrder}`;
                    break;
                case 'activityTime':
                    sortSql += ` ta.latest  ${sortOrder} `;
                    groupBy += `ta.latest,`;
                    break;
                case 'activityCount':
                    sortSql += ` ta.count  ${sortOrder} `;
                    groupBy += `ta.count,`;
                    break;
                case 'membersCount':
                    sortSql += ` muc.count ${sortOrder} `;
                    break;
                case 'created':
                    sortSql += ` t."createdAt" ${sortOrder} `;
                    break;
                default:
                    sortSql += ` "order" ASC, t."updatedAt" DESC `;
            }
        } else {
            if (userId) {
                sortSql += `favourite DESC, `;
            }
            sortSql += `t."updatedAt" DESC`;
        }

        if (statuses) {
            if (!Array.isArray(statuses)) {
                statuses = [statuses];
            }

            if (statuses.length) {
                where += ` AND t.status IN (:statuses) `;
            }
        }

        let include = req.query.include;
        if (!Array.isArray(include)) {
            include = [include];
        }
        if (include) {
            if (include.indexOf('vote') > -1) {
                returncolumns += `
                , (
                    SELECT to_json(
                        array (
                            SELECT concat(id, ':', value)
                            FROM   "VoteOptions"
                            WHERE  "deletedAt" IS NULL
                            AND    "voteId" = tv."voteId"
                        )
                    )
                ) as "vote.options"
                , tv."voteId" as "vote.id"
                , tv."authType" as "vote.authType"
                , tv."createdAt" as "vote.createdAt"
                , tv."delegationIsAllowed" as "vote.delegationIsAllowed"
                , tv."description" as "vote.description"
                , tv."endsAt" as "vote.endsAt"
                , tv."maxChoices" as "vote.maxChoices"
                , tv."minChoices" as "vote.minChoices"
                , tv."type" as "vote.type"
                `;
                groupBy += `tv."authType", tv."createdAt", tv."delegationIsAllowed", tv."description", tv."endsAt", tv."maxChoices", tv."minChoices", tv."type", `;
                voteResults = topicLib.getAllVotesResults();
            }
            if (include.indexOf('event') > -1) {
                join += `LEFT JOIN (
                            SELECT
                                COUNT(events.id) as count,
                                events."topicId"
                            FROM "TopicEvents" events
                            WHERE events."deletedAt" IS NULL
                            GROUP BY events."topicId"
                        ) AS te ON te."topicId" = t.id
                `;
                returncolumns += `
                , COALESCE(te.count, 0) AS "events.count"
                `;
                groupBy += `te."count", `;
            }
        }

        if (!userId && visibility) {
            visibility = Group.VISIBILITY.public;
        }
        if (visibility) {
            where += ` AND t.visibility=:visibility `;
        }
        if (country) {
            where += ` AND t.country=:country `;
        }
        if (language) {
            where += ` AND t.language=:language `;
        }
        let defaultPermission = TopicMemberGroup.LEVELS.none;

        if (group.visibility === Group.VISIBILITY.public) {
            defaultPermission = TopicMemberGroup.LEVELS.read;
        }
        if (userId && ['true', '1'].includes(hasVoted)) {
            where += ` AND EXISTS (SELECT TRUE FROM "VoteLists" vl WHERE vl."voteId" = tv."voteId" AND vl."userId" = :userId LIMIT 1)`;
        } else if (userId && ['false', '0'].includes(hasVoted)) {
            where += ` AND tv."voteId" IS NOT NULL AND t.status = 'voting'::"enum_Topics_status" AND NOT EXISTS (SELECT TRUE FROM "VoteLists" vl WHERE vl."voteId" = tv."voteId" AND vl."userId" = :userId LIMIT 1)`;
        } else {
            logger.warn(`Ignored parameter "voted" as invalid value "${hasVoted}" was provided`);
        }

        if (!showModerated || showModerated == "false") {
            where += ` AND (tr."moderatedAt" IS NULL OR tr."resolvedAt" IS NOT NULL) `;
        } else {
            where += ` AND (tr."moderatedAt" IS NOT NULL AND tr."resolvedAt" IS NULL) `;
        }

        const replacements = {
            groupId: groupId,
            limit,
            offset,
            country,
            language,
            search: `%${search || ''}%`,
            statuses,
            visibility,
            defaultPermission
        };
        let userSql = ``;
        let fields = ``;
        if (userId) {
            if (favourite) {
                where += ` AND tf."topicId" = t.id AND tf."userId" = :userId `;
            }
            if (creatorId) {
                if (creatorId === userId) {
                    where += ` AND u.id = :userId `;
                }
            }
            replacements.userId = userId;
            fields = ` CASE
                WHEN tf."topicId" = t.id THEN true
                ELSE false
            END as "favourite",
                lvl."permission.level",
                lvl."permission.levelGroup",`;
            where += `AND COALESCE(lvl."permission.level", lvl."permission.levelGroup", :defaultPermission)::"enum_TopicMemberUsers_level" > 'none'`;
            userSql = `
            LEFT JOIN (
                SELECT
                    t.id as "topicId",
                    CASE WHEN t.status = 'draft' AND COALESCE(tmup.level, tmgp.level, 'read')::"enum_TopicMemberUsers_level" < 'edit' THEN 'none'
                    WHEN t.visibility = 'private' THEN COALESCE(tmup.level, tmgp.level, 'none')::text
                    ELSE COALESCE(tmup.level, tmgp.level, 'read')::text
                    END AS "permission.level",
                    CASE WHEN t.status = 'draft' AND COALESCE(tmgp.level, 'read')::"enum_TopicMemberUsers_level" < 'edit' THEN 'none'
                    ELSE COALESCE(tmgp.level, 'read')::text
                    END AS "permission.levelGroup"
                FROM "TopicMemberGroups" gt
                JOIN "Topics" t ON (t.id = gt."topicId")
                LEFT JOIN (
                    SELECT
                        tmu."topicId",
                        tmu."userId",
                        CASE WHEN t.status = 'draft' AND MAX(tmu.level)::"enum_TopicMemberUsers_level" < 'edit' THEN 'none'
                        ELSE MAX(tmu.level)::text END AS level
                    FROM "TopicMemberUsers" tmu
                    JOIN "Topics" t ON t.id=tmu."topicId"
                    WHERE tmu."deletedAt" IS NULL
                    GROUP BY "topicId", "userId", t.status
                 ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
                LEFT JOIN (
                     SELECT
                         tmg."topicId",
                         gm."userId",
                         CASE WHEN t.status = 'draft' AND MAX(tmg.level) < 'edit' THEN 'none'
                         ELSE MAX(tmg.level)::text END AS level
                     FROM "TopicMemberGroups" tmg
                         LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                         JOIN "Topics" t ON t.id=tmg."topicId"
                     WHERE tmg."deletedAt" IS NULL
                     AND gm."deletedAt" IS NULL
                     GROUP BY "topicId", "userId", t.status
                ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
                WHERE gt."groupId" = :groupId
                    AND gt."deletedAt" IS NULL
                    AND t."deletedAt" IS NULL
                ) lvl ON lvl."topicId" = gt."topicId"
            LEFT JOIN "TopicFavourites" tf ON tf."topicId" = t.id AND tf."userId" = :userId `;
            groupBy += `lvl."permission.level", lvl."permission.levelGroup", tf."topicId", `;
        }
        const topicsquery = db
            .query(
                `SELECT
                        t.id,
                        t.title,
                        t.visibility,
                        t.status,
                        t."imageUrl",
                        t.intro,
                        t.categories,
                        t.country,
                        t.language,
                        t.contact,
                        t."endsAt",
                        ${fields}
                        t.hashtag,
                        t."createdAt",
                        t."updatedAt",
                        CASE WHEN t.status = 'voting' THEN 1
                            WHEN t.status = 'inProgress' THEN 2
                            WHEN t.status = 'followUp' THEN 3
                        ELSE 4
                        END AS "order",
                        COALESCE(MAX(a."updatedAt"), t."updatedAt") as "lastActivity",
                        u.id as "creator.id",
                        u.name as "creator.name",
                        u.company as "creator.company",
                        u."imageUrl" as "creator.imageUrl",
                        muc.count as "members.users.count",
                        COALESCE(mgc.count, 0) as "members.groups.count",
                        COALESCE(tc.count, 0) AS "comments.count",
                        count(*) OVER()::integer AS "countTotal"
                        ${returncolumns}
                    FROM "TopicMemberGroups" gt
                        JOIN "Topics" t ON (t.id = gt."topicId")
                        LEFT JOIN "TopicReports" tr ON  tr."topicId" = t.id
                        LEFT JOIN "Users" u ON (u.id = t."creatorId")
                        LEFT JOIN (
                            SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM (
                                SELECT
                                    tmuu."topicId",
                                    tmuu."userId" AS "memberId"
                                FROM "TopicMemberUsers" tmuu
                                WHERE tmuu."deletedAt" IS NULL
                                UNION
                                SELECT
                                    tmg."topicId",
                                    gm."userId" AS "memberId"
                                FROM "TopicMemberGroups" tmg
                                    JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                                WHERE tmg."deletedAt" IS NULL
                                AND gm."deletedAt" IS NULL
                            ) AS tmu GROUP BY "topicId"
                        ) AS muc ON (muc."topicId" = t.id)
                        LEFT JOIN (
                            SELECT "topicId", count("groupId")::integer AS "count"
                            FROM "TopicMemberGroups"
                            WHERE "deletedAt" IS NULL
                            GROUP BY "topicId"
                        ) AS mgc ON (mgc."topicId" = t.id)
                        ${userSql}
                        LEFT JOIN (
                            SELECT
                                tv."topicId",
                                tv."voteId",
                                v."authType",
                                v."createdAt",
                                v."delegationIsAllowed",
                                v."description",
                                v."endsAt",
                                v."maxChoices",
                                v."minChoices",
                                v."type",
                                v."autoClose"
                            FROM "TopicVotes" tv INNER JOIN
                                (
                                    SELECT
                                        MAX("createdAt") as "createdAt",
                                        "topicId"
                                    FROM "TopicVotes"
                                    GROUP BY "topicId"
                                ) AS _tv ON (_tv."topicId" = tv."topicId" AND _tv."createdAt" = tv."createdAt")
                            LEFT JOIN "Votes" v
                                    ON v.id = tv."voteId"
                        ) AS tv ON (tv."topicId" = t.id)
                        LEFT JOIN (
                            SELECT
                                unnest("topicIds") as "topicId",
                                COUNT("topicIds") as count,
                                MAX("updatedAt") AS latest
                                FROM "Activities"
                            GROUP BY "topicIds"
                        ) AS ta ON ta."topicId" = t.id::text
                        LEFT JOIN "Activities" a ON ARRAY[t.id::text] <@ a."topicIds"
                        LEFT JOIN (
                            SELECT
                                "topicId",
                                COUNT(*) AS count
                            FROM "TopicComments"
                            GROUP BY "topicId"
                        ) AS tc ON (tc."topicId" = t.id)
                        ${join}
                    WHERE gt."groupId" = :groupId
                        AND gt."deletedAt" IS NULL
                        AND t."deletedAt" IS NULL
                        ${where}
                    GROUP BY t.id, u.id, tv."voteId", ${groupBy} muc.count, mgc.count, tc.count
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset
                    ;`,
                {
                    replacements,
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
        let topics;
        [topics, voteResults] = await Promise.all([topicsquery, voteResults]);
        let countTotal = 0;
        if (topics && topics.length) {
            countTotal = topics[0].countTotal;
            topics.forEach(function (topic) {
                topic.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });

                delete topic.countTotal;

                if (include && include.indexOf('vote') > -1 && topic.vote.id) {
                    const options = [];
                    if (topic.vote.options) {
                        topic.vote.options.forEach(function (voteOption) {
                            const o = {};
                            const optText = voteOption.split(':');
                            o.id = optText[0];
                            o.value = optText[1];
                            if (voteResults && voteResults.length) {
                                const result = _.find(voteResults, { 'optionId': optText[0] });
                                if (result) {
                                    o.voteCount = parseInt(result.voteCount, 10);
                                }
                                topic.vote.votersCount = voteResults[0].votersCount;
                            }
                            options.push(o);
                        });
                    }
                    topic.vote.options = {
                        count: options.length,
                        rows: options
                    };
                } else {
                    delete topic.vote;
                }
            });

        }

        return res.ok({
            countTotal,
            count: topics.length,
            rows: topics
        });
    };

    app.get('/api/groups/:groupId/members/topics', asyncMiddleware(async function (req, res) {
        return _getGroupMemberTopics(req, res, 'public');
    }));

    app.get('/api/users/:userId/groups/:groupId/members/topics', hasPermission(GroupMemberUser.LEVELS.read, true, null), asyncMiddleware(async function (req, res) {
        const visibility = req.query.visibility;
        return _getGroupMemberTopics(req, res, visibility);
    }));

    /**
     * Group list
     */
    app.get('/api/groups', asyncMiddleware(async (req, res) => {
        const limitMax = 100;
        const limitDefault = 26;
        const userId = req.user?.userId;
        const country = req.query.country;
        const language = req.query.language;
        const orderBy = req.query.orderBy || 'updatedAt';
        const order = (req.query.order && req.query.order.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
        let orderBySql = ` ORDER BY`;

        switch (orderBy) {
            case 'name':
                orderBySql += ` g.name `
                break;
            case 'activityCount':
                orderBySql += ` ga.count `
                break;
            case 'memberCount':
                orderBySql += ` "members.users.count" `
                break;
            case 'topicCount':
                orderBySql += ` "members.topics.count" `
                break;
            case 'createdAt':
                orderBySql += ` g."createdAt" `
                break;
            case 'activity':
                orderBySql += ` ga."updatedAt" `
                break;
            default:
                orderBySql += ` g."updatedAt" `
        }

        orderBySql += order;
        const offset = req.query.offset || 0;
        let limit = req.query.limit || limitDefault;
        if (limit > limitMax) limit = limitDefault;

        let where = ` g.visibility = 'public'
        AND g.name IS NOT NULL
        AND g."deletedAt" IS NULL `;
        const name = req.query.name;
        if (name) {
            where += ` AND g.name ILIKE :search `;
        }

        const sourcePartnerId = req.query.sourcePartnerId;
        if (sourcePartnerId) {
            where += ` AND g."sourcePartnerId" = :sourcePartnerId `
        }
        let memberJoin = '';
        let memberLevel = '';
        if (userId) {

            memberLevel = ` gmu.level AS "userLevel",
            CASE
            WHEN gf."groupId" = g.id THEN true
                ELSE false
            END as "favourite", `;
            memberJoin = ` LEFT JOIN "GroupMemberUsers" gmu ON gmu."groupId" = g.id AND gmu."userId" = :userId
            LEFT JOIN "GroupFavourites" gf ON (gf."groupId" = g.id AND gf."userId" = :userId) `
            const favourite = req.query.favourite;
            if (favourite)
                where += ` AND gf."groupId" = g.id AND gf."userId" = :userId `;
        }
        if (country) {
            where += ` AND g.country ILIKE :country `;
        }

        if (language) {
            where += ` AND g.language ILIKE :language `;
        }
        const groups = await db
            .query(`
                SELECT
                    g.id,
                    g.name,
                    g.description,
                    g."parentId",
                    g."imageUrl",
                    g.rules,
                    g.country,
                    g.language,
                    g.contact,
                    ga."updatedAt" AS "latestActivity",
                    g.visibility,
                    gj.token as "join.token",
                    gj.level as "join.level",
                    ${memberLevel}
                    c.id as "creator.id",
                    c.name as "creator.name",
                    c.company as "creator.company",
                    mc.count as "members.users.count",
                    gtc.count as "members.topics.count",
                    gt."topicId" as "members.topics.latest.id",
                    gt.title as "members.topics.latest.title",
                    count(*) OVER()::integer AS "countTotal"
                FROM "Groups" g
                JOIN "Users" c ON c.id = g."creatorId"
                LEFT JOIN (
                    SELECT
                        MAX(a."updatedAt") as "updatedAt",
                        ag.count,
                        a."groupIds"
                    FROM
                    "Activities" a
                    LEFT JOIN (
                        SELECT COUNT(*) as "count",
                        "groupIds"
                        FROM "Activities"
                        WHERE array_length("groupIds", 1) > 0
                        GROUP BY "groupIds"
                    ) ag ON a."groupIds" = ag."groupIds"
                    WHERE array_length(a."groupIds", 1) > 0
                    GROUP BY a."groupIds", ag.count ORDER BY a."groupIds"
                ) ga ON g.id::text = ANY(ga."groupIds")
                LEFT JOIN "GroupJoins" gj ON gj."groupId" = g.id
                JOIN (
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
                            WHERE tmg."deletedAt" IS NULL
                            GROUP BY tmg."groupId", t.status
                        ) as tmc
                        GROUP BY "groupId"
                    ) tmc ON tmgtc."groupId" = tmc."groupId"
                ) AS gtc ON (gtc."groupId" = g.id)
                LEFT JOIN (
                    SELECT tmg."groupId",
                        tmg."topicId",
                        t.title,
                        t."updatedAt"
                        FROM "TopicMemberGroups" tmg
                        JOIN "Topics" t ON (t.id = tmg."topicId")
                        JOIN (
                        SELECT g.id, MAX(tmg."updatedAt") as "updatedAt" FROM "Groups" g JOIN (
                            SELECT
                                tmg."groupId",
                                tmg."topicId",
                                t.title,
                                t."updatedAt"
                            FROM "TopicMemberGroups" tmg
                            JOIN "Topics" t ON (t.id = tmg."topicId")
                            WHERE tmg."deletedAt" IS NULL
                                AND t.title IS NOT NULL
                                AND t.status <> 'draft'
                            ORDER BY t."updatedAt" DESC
                        ) as tmg ON g.id=tmg."groupId" GROUP BY g.id
                    ) tmgtm ON tmgtm."updatedAt" = t."updatedAt" GROUP BY "groupId", "topicId", t.title, t."updatedAt"
                ) AS gt ON (gt."groupId" = g.id)
                ${memberJoin}
                WHERE ${where}
                ${orderBySql}
                OFFSET :offset
                LIMIT :limit
            `,
                {
                    replacements: {
                        userId,
                        limit,
                        sourcePartnerId,
                        orderBy,
                        order,
                        country,
                        language,
                        search: `%${name}%`,
                        offset
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
        let countTotal = groups[0]?.countTotal || 0;
        groups.forEach((group) => {
            delete group.countTotal;
        })

        return res.ok({
            countTotal: countTotal,
            count: groups.length,
            rows: groups
        });
    }));

    app.post('/api/users/:userId/groups/:groupId/favourite', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const groupId = req.params.groupId;

        try {
            await db
                .transaction(async function (t) {
                    await GroupFavourite.findOrCreate({
                        where: {
                            groupId: groupId,
                            userId: userId
                        },
                        transaction: t
                    });

                    t.afterCommit(() => {
                        return res.ok();
                    })
                });
        } catch (err) {
            return next(err);
        }
    });

    app.delete('/api/users/:userId/groups/:groupId/favourite', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const groupId = req.params.groupId;

        try {
            const groupFavourite = await GroupFavourite.findOne({
                where: {
                    userId: userId,
                    groupId: groupId
                }
            });

            if (groupFavourite) {
                await db
                    .transaction(async function (t) {
                        await GroupFavourite.destroy({
                            where: {
                                userId: userId,
                                groupId: groupId
                            },
                            transaction: t
                        });

                        t.afterCommit(() => {
                            return res.ok();
                        });
                    });
            }
        } catch (err) {
            return next(err);
        }
    });

    return {
        hasPermission: hasPermission
    };
};
