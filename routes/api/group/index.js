'use strict';

/**
 * Group core CRUD + join + favourites + topic-membership requests + topic-member list
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
    const emailLib = app.get('email');
    const urlLib = app.get('urlLib');
    const topicService = app.get('topicService');
    const groupService = app.get('groupService');
    const { hasGroupPermission: hasPermission, _groupPermission: _hasPermission } = app.get('permissionsService');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');

    const Group = models.Group;
    const Topic = models.Topic;
    const TopicMemberGroup = models.TopicMemberGroup;
    const GroupMemberUser = models.GroupMemberUser;
    const GroupJoin = models.GroupJoin;
    const GroupFavourite = models.GroupFavourite;
    const User = models.User;
    const Request = models.Request;

    /**
     * Create a new Group
     */
    app.post('/api/users/:userId/groups', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        await db.transaction(async function (t) {
            const { group, groupJoin } = await groupService.create(req.body, req.user.userId, req.ip, t);
            t.afterCommit(() => {
                const resObject = group.toJSON();
                resObject.join = groupJoin.toJSON();
                return res.created(resObject);
            });
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
    app.get('/api/groups/:groupId', asyncMiddleware(async function (req, res) {
        const group = await groupService.getByIdPublic(req.params.groupId, req.user?.userId);
        if (!group) return res.notFound();
        return res.ok(group);
    }));

    app.get('/api/users/:userId/groups/:groupId', hasPermission(GroupMemberUser.LEVELS.read, true, null), asyncMiddleware(async function (req, res) {
        const group = await groupService.getById(req.params.groupId, req.user.userId);
        if (!group) return res.notFound();
        return res.ok(group);
    }));

    /**
     * Update Group info
     */
    app.put('/api/users/:userId/groups/:groupId', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const group = await Group.findOne({ where: { id: groupId } });

        if (req.body.imageUrl == null && group.imageUrl) {
            const currentImageURL = new URL(group.imageUrl);
            //FIXME: No delete from DB?
            if (config.storage?.type.toLowerCase() === 's3' && currentImageURL.href.indexOf(`https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/groups/${req.user.id}`) === 0) {
                await cosUpload.delete(currentImageURL.pathname);
            } else if (config.storage?.type.toLowerCase() === 'local' && currentImageURL.hostname === (new URL(config.url.api)).hostname) {
                const appDir = __dirname.replace('/routes/api/group', '/public/uploads/groups');
                const baseFolder = config.storage.baseFolder || appDir;
                fs.unlinkSync(`${baseFolder}/${path.parse(currentImageURL.pathname).base}`);
            }
        }

        await db.transaction(async function (t) {
            await groupService.update(group, req.body, req.user.userId, req.ip, t);
            const memberUsersCount = await GroupMemberUser.count({ where: { groupId: group.id }, transaction: t });
            const memberTopicsCount = await db.query(`
                SELECT COALESCE(gtc.count, '{"total": 0}') as "count"
                FROM "Groups" g LEFT JOIN (
                SELECT tmgtc."groupId", tmgtc.count::jsonb || tmc.count::jsonb as count
                FROM (
                    SELECT "groupId", jsonb_object_agg('total', total) as count
                    FROM (
                        SELECT tmg."groupId", COUNT(tmg."groupId") AS total
                        FROM "TopicMemberGroups" tmg
                        WHERE tmg."groupId" = :groupId
                        GROUP BY tmg."groupId"
                    ) as tmgtc GROUP BY "groupId"
                ) as tmgtc
                LEFT JOIN (
                    SELECT tmc."groupId", jsonb_object_agg(tmc.status, tmc.count) as count
                    FROM (
                        SELECT tmg."groupId", t."status", count(tmg."topicId") AS "count"
                        FROM "TopicMemberGroups" tmg
                        JOIN "Topics" t ON t.id = tmg."topicId"
                        WHERE tmg."deletedAt" IS NULL AND tmg."groupId" = :groupId
                        GROUP BY tmg."groupId", t.status
                    ) as tmc GROUP BY "groupId"
                ) tmc ON tmgtc."groupId" = tmc."groupId"
                ) gtc ON gtc."groupId" = g.id
                WHERE g.id = :groupId;`,
                { replacements: { groupId: group.id }, type: db.QueryTypes.SELECT, raw: true, transaction: t, nest: true }
            );
            const creator = await User.findOne({ where: { id: group.creatorId }, attributes: ['id', 'name', 'email', 'createdAt'], transaction: t });
            const groupUpdated = group.toJSON();
            groupUpdated.userLevel = GroupMemberUser.LEVELS.admin;
            groupUpdated.parent = { id: group.parentId };
            delete groupUpdated.parentId;
            groupUpdated.creator = creator.dataValues;
            groupUpdated.members = { users: { count: memberUsersCount }, topics: memberTopicsCount[0] };
            t.afterCommit(() => res.ok(groupUpdated));
        });
    }));

    /**
     * Delete Group
     */
    app.delete('/api/users/:userId/groups/:groupId', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), asyncMiddleware(async function (req, res) {
        const group = await Group.findByPk(req.params.groupId);
        if (!group) return res.notFound('No such Group found.');

        await db.transaction(async function (t) {
            await groupService.remove(group, req.user.userId, req.ip, t);
            t.afterCommit(() => res.ok());
        });
    }));

    /**
     * Get all Groups User belongs to
     */
    app.get('/api/users/:userId/groups', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const limitMax = 100;
        const limitDefault = 26;
        const userId = req.user.id;
        const creatorId = req.query.creatorId;

        if (creatorId && creatorId !== userId) {
            return res.badRequest('No rights!');
        }

        let limit = req.query.limit || limitDefault;
        if (limit > limitMax) limit = limitDefault;

        let include = req.query.include;
        if (include && !Array.isArray(include)) include = [include];

        const results = await groupService.list(userId, {
            include,
            visibility: req.query.visibility,
            search: req.query.search,
            creatorId,
            favourite: req.query.favourite,
            country: req.query.country,
            language: req.query.language,
            orderBy: req.query.orderBy,
            order: req.query.order,
            offset: req.query.offset || 0,
            limit
        });

        return res.ok(results);
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

    app.get('/api/groups/join/:token', async (req, res, next) => {
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
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'company', 'imageUrl'],
                        as: 'creator',
                        required: true
                    },
                ],
            });

            return res.ok(group.toJSON());
        } catch (err) {
            next(err);
        }
    });

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
            const [memberUser, created] = await GroupMemberUser.findOrCreate({ //eslint-disable-line
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
            const [memberUser, created] = await GroupMemberUser.findOrCreate({ //eslint-disable-line
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
                /*    case 'activityTime':
                        sortSql += ` ta.latest  ${sortOrder} `;
                        groupBy += `ta.latest,`;
                        break;
                    case 'activityCount':
                        sortSql += ` ta.count  ${sortOrder} `;
                        groupBy += `ta.count,`;
                        break;*/
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
                voteResults = topicService.getAllVotesResults();
            } else {
                returncolumns += `, tv."voteId"`;
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
            where += ` AND t.status <> 'draft' `
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
                        ti."ideationId" as "ideationId",
                        ti."ideationId" as "ideation.id",
                        ti."ideaCount" as "ideation.ideas.count",
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
                        LEFT JOIN "Activities" a ON ARRAY[t.id::text] <@ a."topicIds"
                        LEFT JOIN (
                            SELECT
                                ti."topicId",
                                ti."ideationId",
                                i."createdAt",
                                i."deadline",
                                i."creatorId",
                                COALESCE(id."ideaCount", 0) as "ideaCount"
                            FROM "TopicIdeations" ti INNER JOIN
                                (
                                    SELECT
                                        MAX("createdAt") as "createdAt",
                                        "topicId"
                                    FROM "TopicIdeations"
                                    GROUP BY "topicId"
                                ) AS _ti ON (_ti."topicId" = ti."topicId" AND _ti."createdAt" = ti."createdAt")
                            LEFT JOIN "Ideations" i
                                    ON i.id = ti."ideationId"
                            LEFT JOIN (
                                SELECT "ideationId",
                                COUNT("ideationId") as "ideaCount"
                                FROM "Ideas"
                                GROUP BY "ideationId"
                            ) id ON ti."ideationId" = id."ideationId"
                        ) AS ti ON (ti."topicId" = t.id)
                        LEFT JOIN (
                            SELECT
                                "topicId",
                                COUNT(*) AS count
                            FROM "DiscussionComments" dc
                                JOIN "TopicDiscussions" td ON td."discussionId" = dc."discussionId"
                            GROUP BY "topicId"
                        ) AS tc ON (tc."topicId" = t.id)
                        ${join}
                    WHERE gt."groupId" = :groupId
                        AND gt."deletedAt" IS NULL
                        AND t."deletedAt" IS NULL
                        ${where}
                    GROUP BY t.id, u.id, tv."voteId", ${groupBy} muc.count, ti."ideationId", ti."ideaCount", mgc.count, tc.count
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

    app.post('/api/users/:userId/groups/:groupId/requests/topics', loginCheck(['partner']), async (req, res, next) => {
        try {
            const groupId = req.params.groupId;
            const userId = req.user.userId;
            let topics = req.body;
            const type = 'addTopicGroup';

            if (!Array.isArray(topics)) {
                topics = [topics];
            }
            if (!topics.length) {
                return res.badRequest();
            }
            const message = topics[0].text;

            // Need the Group just for the activity
            const group = await Group.findOne({
                where: {
                    id: groupId
                }
            });

            await db.transaction(async (t) => {
                let createRequestPromises = topics.map(async (request) => {
                    const hasAccess = await topicService._hasPermission(request.topicId, userId, TopicMemberGroup.LEVELS.admin);
                    if (hasAccess && hasAccess.topic.permissions.level === TopicMemberGroup.LEVELS.admin) {
                        const topicMember = await TopicMemberGroup.findOne({
                            where: {
                                topicId: request.topicId,
                                groupId: groupId
                            }
                        })
                        if (!topicMember) {
                            const data = {
                                type,
                                creatorId: userId,
                                topicId: request.topicId,
                                groupId: groupId,
                                text: message,
                                level: request.level
                            };
                            const existing = await Request.findOne({
                                where: {
                                    creatorId: userId,
                                    topicId: request.topicId,
                                    groupId: groupId,
                                    acceptedAt: {
                                        [Op.eq]: null
                                    },
                                    rejectedAt: {
                                        [Op.eq]: null
                                    }
                                },
                                transaction: t
                            });
                            if (existing) {
                                data.id = existing.id;
                            }
                            const newRequest = await Request.upsert(data);
                            const topic = await Topic.findOne({ where: { id: request.topicId } });
                            await cosActivities.offerActivity(
                                topic,
                                group,
                                {
                                    type: 'User',
                                    id: req.user.userId,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );

                            await emailLib.sendRequestAddTopicGroup(newRequest[0]);
                            const resObject = newRequest[0].toJSON();
                            resObject.topic = {
                                id: topic.id,
                                title: topic.title,
                                visibility: topic.visibility,
                                creator: {}
                            };
                            return resObject;
                        }
                    }
                })

                let createdRequests = await Promise.all(createRequestPromises);
                createdRequests = createdRequests.filter((res) => !!res);
                t.afterCommit(async () => {
                    if (createdRequests.length) {
                        //await emailLib.sendGroupMemberUserInviteCreate(createdRequests);
                        return res.created({
                            count: createdRequests.length,
                            rows: createdRequests
                        });
                    } else {
                        return res.badRequest('No requests were created. Possibly because no valid topicId-s were provided.', 1);
                    }
                });
            });
        } catch (err) {
            return next(err);
        }
    });

    /* List topic requests*/
    app.get('/api/users/:userId/groups/:groupId/requests/topics', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), async (req, res, next) => {
        try {
            const groupId = req.params.groupId;
            const results = await Request.findAndCountAll({
                where: {
                    groupId: groupId,
                    topicId: {
                        [Op.ne]: null
                    },
                    acceptedAt: {
                        [Op.eq]: null
                    },
                    rejectedAt: {
                        [Op.eq]: null
                    }
                },
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'title', 'visibility'],
                        required: true
                    }
                ]
            });
            res.ok(results);
        } catch (err) {
            return next(err);
        }
    });

    /* Get topic request*/
    app.get('/api/users/:userId/groups/:groupId/requests/topics/:requestId', loginCheck(['partner']), async (req, res, next) => {
        try {
            const groupId = req.params.groupId;
            const isGroupAdmin = await _hasPermission(groupId, req.user.id, GroupMemberUser.LEVELS.admin);
            const request = await Request.findOne({
                where: {
                    id: req.params.requestId
                },
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'title'],
                        required: true
                    }
                ]
            });

            if (request.creatorId === req.user.id || isGroupAdmin) {
                return res.ok(request.toJSON());
            }
        } catch (err) {
            next(err);
        }
    });

    /* Update topic request*/
    app.put('/api/users/:userId/groups/:groupId/requests/topics/:requestId', loginCheck(['partner']), async (req, res, next) => {
        try {
            const groupId = req.params.groupId;
            const level = req.body.level;
            const isGroupAdmin = await _hasPermission(groupId, req.user.id, GroupMemberUser.LEVELS.admin);
            const request = await Request.findOne({
                where: {
                    id: req.params.requestId
                }
            });

            if (request.creatorId === req.user.id || isGroupAdmin) {
                request.level = level;
                await request.update();
                return res.ok(request);
            }
        } catch (err) {
            next(err);
        }
    });

    /* Delete topic request*/
    app.delete('/api/users/:userId/groups/:groupId/requests/topics/:requestId', loginCheck(['partner']), async (req, res, next) => {
        try {
            const groupId = req.params.groupId;
            const isGroupAdmin = await _hasPermission(groupId, req.user.id, GroupMemberUser.LEVELS.admin);
            const request = await Request.findOne({
                where: {
                    id: req.params.requestId
                }
            });

            if (request.creatorId === req.user.id || isGroupAdmin) {
                await request.destroy();
                return res.ok();
            }
        } catch (err) {
            next(err);
        }
    });

    /*Accept request*/
    const _acceptTopicToGroupRequest = async (req, res, redirect) => {
        let userId;
        if (req.locals.tokenDecoded) {
            userId = req.locals.tokenDecoded.userId
        } else if (req.user) {
            userId = req.user.id;
        }
        const requestId = req.params.requestId;
        await db.transaction(async (t) => {
            const request = await Request.findOne({
                where: {
                    id: requestId
                },
                transaction: t
            });
            if (request && request.acceptedAt === null && request.rejectedAt === null) {
                const group = await Group.findOne({
                    where: {
                        id: request.groupId
                    }
                });
                const topic = await Topic.findOne({
                    where: {
                        id: request.topicId,
                    },
                    attributes: ['id', 'title']
                });

                await TopicMemberGroup.create({
                    groupId: request.groupId,
                    topicId: request.topicId,
                    level: request.level
                }, { transaction: t })
                request.acceptedAt = new Date();
                await request.save({
                    transaction: t
                });

                await cosActivities.acceptRequestActivity(
                    request,
                    topic,
                    {
                        type: 'User',
                        id: userId,
                        ip: req.ip
                    },
                    group,
                    req.method + ' ' + req.path,
                    t
                );

                t.afterCommit(() => {
                    if (redirect) {
                        return res.redirect(redirect);
                    }

                    return res.ok();
                });
            } else {
                t.afterCommit(() => {
                    if (!request)
                        return res.notFound();
                    if (redirect) {
                        return res.redirect(redirect)
                    } else {
                        return res.ok();
                    }
                });
            }
        });
    };

    app.get('/api/users/:userId/groups/:groupId/requests/topics/:requestId/accept', authTokenRestrictedUse, async (req, res, next) => {
        try {
            const request = await Request.findOne({
                where: {
                    id: req.params.requestId
                }
            });
            await _acceptTopicToGroupRequest(req, res, urlLib.getFe('/groups/:groupId/requests/topics/:requestId/accept', { groupId: request.groupId, requestId: request.id }));
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/users/:userId/groups/:groupId/requests/topics/:requestId/accept', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), async (req, res, next) => {
        try {
            _acceptTopicToGroupRequest(req, res)
        } catch (err) {
            console.log(err);
            return next(err);
        }
    });

    /*Reject request*/

    const _rejectTopicToGroupRequest = async (req, res, redirect) => {
        let userId;
        if (req.locals.tokenDecoded) {
            userId = req.locals.tokenDecoded.userId
        } else if (req.user) {
            userId = req.user.id;
        }
        const requestId = req.params.requestId;
        await db.transaction(async (t) => {
            const request = await Request.findOne({
                where: {
                    id: requestId
                },
                transaction: t
            });
            if (!request)
                return res.notFound();
            if (request?.acceptedAt === null && request?.rejectedAt === null) {
                const group = await Group.findOne({
                    where: {
                        id: request.groupId
                    }
                });
                const topic = await Topic.findOne({
                    where: {
                        id: request.topicId,
                    },
                    attributes: ['id', 'title']
                });

                request.rejectedAt = new Date();
                await request.save({
                    transaction: t
                });
                await cosActivities.rejectRequestActivity(
                    request,
                    topic,
                    {
                        type: 'User',
                        id: userId,
                        ip: req.ip
                    },
                    group,
                    req.method + ' ' + req.path,
                    t
                );

                t.afterCommit(() => {
                    if (redirect) {
                        return res.redirect(redirect);
                    }

                    return res.ok();
                });
            } else {
                t.afterCommit(() => {

                    if (redirect) {
                        return res.redirect(redirect)
                    } else {
                        return res.ok();
                    }
                });
            }
        });
    }

    app.get('/api/users/:userId/groups/:groupId/requests/topics/:requestId/reject', authTokenRestrictedUse, async (req, res, next) => {
        try {
            const request = await Request.findOne({
                where: {
                    id: req.params.requestId
                }
            });

            await _rejectTopicToGroupRequest(req, res, urlLib.getFe('/groups/:groupId/requests/topics/:requestId/reject', { groupId: request.groupId, requestId: request.id }));
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/users/:userId/groups/:groupId/requests/topics/:requestId/reject', loginCheck(['partner']), hasPermission(GroupMemberUser.LEVELS.admin, null, null), async (req, res, next) => {
        try {
            await _rejectTopicToGroupRequest(req, res);
        } catch (err) {
            console.log(err);
            return next(err);
        }
    });

    return {
        hasPermission: hasPermission
    };
};
