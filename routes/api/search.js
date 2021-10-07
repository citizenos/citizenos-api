'use strict';

/**
 * Search all objects (Users, Groups)
 *
 * @param {object} app Express app
 *
 * @returns {void}
 */
module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;

    const loginCheck = app.get('middleware.loginCheck');

    const User = models.User;
    const Group = models.Group;
    const Topic = models.Topic;

    app.get('/api/search', loginCheck(['partner']), async function (req, res, next) {
        const str = req.query.str; // Search string
        try {
            const users = await User.findAll({
                where: {
                    [Op.or]: [
                        {
                            name: {
                                [Op.iLike]: '%' + str + '%'
                            }
                        },
                        {
                            email: {
                                [Op.iLike]: str + '%'
                            }
                        }
                    ]
                },
                attributes: ['id', 'name', 'company', 'imageUrl'],
                limit: 10
            });

            const groups = await Group.findAll({
                where: {
                    name: {
                        [Op.iLike]: str + '%'
                    }
                },
                attributes: ['id', 'name'],
                limit: 10
            });

            return res.ok({
                users: {
                    count: users.length,
                    rows: users
                },
                groups: {
                    count: groups.length,
                    rows: groups
                }
            });
        } catch (e) {
            return next(e);
        }
    });

    app.get('/api/v2/search', async function (req, res, next) {
        try {
            const str = req.query.str; // Search string
            const limitMax = 100;
            const limitDefault = 10;
            let userId = null;
            let partnerId = null;
            const searchResults = [];
            if (req.user) {
                userId = req.user.id;
                partnerId = req.user.partnerId;
            }

            let include = req.query.include;
            const fields = [];
            let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
            if (limit > limitMax) limit = limitDefault;
            const page = parseInt(req.query.page, 10) ? parseInt(req.query.page, 10) : 1;
            const offset = (page * limit) - limit;
            const params = Object.keys(req.query);
            let statuses;
            let queryStatuses = req.query.statuses;
            const pinned = req.query.pinned;

            if (queryStatuses) {
                if (!Array.isArray(queryStatuses)) {
                    queryStatuses = [queryStatuses];
                }

                statuses = queryStatuses.filter(function (status) {
                    return Object.keys(Topic.STATUSES).indexOf(status) > -1;
                });
            }

            if (include && !Array.isArray(include)) {
                include = [include];
            } else if (!include) {
                include = ['public.topic', 'public.group'];
            }

            params.forEach(function (param) {
                if (['str', 'include', 'limit', 'page'].indexOf(param) === -1) {
                    fields.push(param);
                }
            });

            //Iterate through query include params and add querys to search array
            for (let i = 0; i < include.length; i++) {
                const term = include[i];
                const terms = term.split('.');
                let context = null;
                let model = null;

                if (terms.length === 2) {
                    context = terms[0];
                    model = terms[1];
                } else if (terms.length === 1) {
                    context = 'public';
                    model = terms[0];
                }

                if (context && model) {
                    if (context === 'my') {
                        let levelComparer;
                        let level;

                        if (model === 'topic') {
                            levelComparer = '>';
                            level = 'none';
                            let myTopicWhere = ` t."deletedAt" IS NULL
                                    AND t.title ILIKE :str
                                    `;

                            fields.forEach(function (field) {
                                const fieldBuild = field.split('.');
                                if (fieldBuild[0] === 'my' && fieldBuild[1] === 'topic') {
                                    if (fieldBuild[2] === 'level' && req.query[field] !== 'none') {
                                        levelComparer = '>=';
                                        level = req.query[field];
                                    }
                                }
                            });

                            myTopicWhere += `AND COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" ${levelComparer} :level `;
                            // All partners should see only Topics created by their site, but our own app sees all.
                            if (partnerId) {
                                myTopicWhere += ` AND t."sourcePartnerId" = :partnerId `;
                            }

                            if (statuses && statuses.length) {
                                myTopicWhere += ` AND t.status IN (:statuses)`;
                            }

                            if (pinned) {
                                myTopicWhere += ` AND tp."topicId" = t.id AND tp."userId" = :userId`;
                            }

                            // TODO: NOT THE MOST EFFICIENT QUERY IN THE WORLD, tune it when time.
                            // TODO: That casting to "enum_TopicMemberUsers_level". Sequelize does not support naming enums, through inheritance I have 2 enums that are the same but with different name thus different type in PG. Feature request - https://github.com/sequelize/sequelize/issues/2577
                            // FIXME: Fix query to return "token"
                            const myTopicQuery = `
                                SELECT
                                    COUNT(t.id) OVER() as count,
                                    t.id,
                                    t.title,
                                    t.status,
                                    t.visibility,
                                    t.hashtag,
                                    CASE
                                    WHEN COALESCE(tmup.level, tmgp.level, 'none') = 'admin' THEN t."tokenJoin"
                                    ELSE NULL
                                    END as "tokenJoin",
                                    CASE
                                    WHEN tp."topicId" = t.id THEN true
                                    ELSE false
                                    END as "pinned",
                                    t.categories,
                                    t."endsAt",
                                    t."createdAt",
                                    COALESCE(tmup.level, tmgp.level, 'none') as "permission.level",
                                    muc.count as "members.users.count",
                                    COALESCE(mgc.count, 0) as "members.groups.count",
                                    tv."voteId" as "voteId"
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
                                            MAX(tmg.level)::text AS level
                                        FROM "TopicMemberGroups" tmg
                                            LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                                        WHERE tmg."deletedAt" IS NULL
                                        AND gm."deletedAt" IS NULL
                                        GROUP BY "topicId", "userId"
                                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
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
                                        SELECT "topicId", count("groupId") AS "count"
                                        FROM "TopicMemberGroups"
                                        WHERE "deletedAt" IS NULL
                                        GROUP BY "topicId"
                                    ) AS mgc ON (mgc."topicId" = t.id)
                                    LEFT JOIN "TopicVotes" tv
                                        ON (tv."topicId" = t.id)
                                    LEFT JOIN "TopicPins" tp ON tp."topicId" = t.id AND tp."userId" = :userId
                                WHERE ${myTopicWhere}
                                GROUP BY t.id, tmup.level, tmgp.level, muc.count, mgc.count, tv."voteId", tp."topicId"
                                ORDER BY t.title ASC
                                LIMIT :limit
                                OFFSET :offset
                            ;`;

                            const topicsResult = await db
                                .query(
                                    myTopicQuery,
                                    {
                                        replacements: {
                                            userId: userId,
                                            partnerId: partnerId,
                                            statuses: statuses,
                                            str: '%' + str + '%',
                                            level: level,
                                            limit: limit,
                                            offset: offset
                                        },
                                        type: db.QueryTypes.SELECT,
                                        raw: true,
                                        nest: true
                                    }
                                );
                            const topics = {
                                count: 0,
                                rows: []
                            };

                            topicsResult.forEach(function (row) {
                                topics.count = row.count;
                                delete row.count;
                                topics.rows.push(row);
                            });

                            searchResults.push({
                                context: 'my',
                                topics: topics
                            });

                        } else if (model === 'group') {
                            let whereCondition = '';
                            level = 'read';
                            levelComparer = '>=';

                            fields.forEach(function (field) {
                                const fieldBuild = field.split('.');
                                if (fieldBuild[0] === 'my' && fieldBuild[1] === 'group') {
                                    if (fieldBuild[2] === 'level') {
                                        level = req.query[field];
                                    }
                                }
                            });

                            whereCondition += ` AND gm.level::"enum_GroupMemberUsers_level" ${levelComparer} :level `;

                            const groupsResult = await db
                                .query(
                                    `SELECT
                                        COUNT(g.id) OVER() as count,
                                        g.id,
                                        g.name,
                                        gm.level as "permission.level"
                                    FROM "Groups" g
                                        JOIN "GroupMemberUsers" gm ON (gm."groupId" = g.id)
                                    WHERE g.name ILIKE :str
                                        AND g."deletedAt" IS NULL
                                        AND gm."deletedAt" is NULL
                                        AND gm."userId" = :userId
                                        ${whereCondition}
                                            ORDER BY g.name ASC
                                            LIMIT :limit
                                            OFFSET :offset
                                            ;`,
                                    {
                                        replacements: {
                                            userId: userId,
                                            str: '%' + str + '%',
                                            level: level,
                                            limit: limit,
                                            offset: offset
                                        },
                                        type: db.QueryTypes.SELECT,
                                        raw: true,
                                        nest: true,
                                        limit: limit,
                                        offset: offset
                                    }
                                )
                            const groups = {
                                count: 0,
                                rows: []
                            };

                            groupsResult.forEach(function (row) {
                                groups.count = row.count;
                                delete row.count;
                                groups.rows.push(row);
                            });

                            searchResults.push({
                                context: 'my',
                                groups: groups
                            });
                        }
                    }

                    if (context === 'public') {
                        if (model === 'topic') {
                            const publicTopicsResult = await Topic
                                .findAndCountAll({
                                    where: {
                                        title: {
                                            [Op.iLike]: '%' + str + '%'
                                        },
                                        visibility: Topic.VISIBILITY.public
                                    },
                                    attributes: ['id', 'title', 'status', 'visibility', 'hashtag', 'categories', 'endsAt', 'createdAt'],
                                    limit: limit,
                                    offset: offset,
                                    orderby: {title: 'ASC'}
                                });

                            searchResults.push({
                                context: 'public',
                                topics: publicTopicsResult,
                                status: statuses
                            });
                        } else if (model === 'group') {
                            const publicGroupsResult = await Group
                                .findAll({
                                    where: {
                                        [Op.and]: [
                                            {
                                                name: {
                                                    [Op.iLike]: str + '%'
                                                }
                                            },
                                            {
                                                visibility: Topic.VISIBILITY.public
                                            }
                                        ]
                                    },
                                    attributes: ['id', 'name'],
                                    limit: limit,
                                    offset: offset
                                });

                            searchResults.push({
                                context: 'public',
                                groups: publicGroupsResult
                            });
                        } else if (model === 'user') {
                            const publicUserResult = await User
                                .findAndCountAll({
                                    where: {
                                        [Op.or]: [
                                            {
                                                name: {
                                                    [Op.iLike]: str + '%'
                                                }
                                            },
                                            {
                                                email: {
                                                    [Op.iLike]: str + '%'
                                                }
                                            }
                                        ]
                                    },
                                    attributes: ['id', 'name', 'company', 'imageUrl'],
                                    limit: limit,
                                    offset: offset
                                });
                            searchResults.push({
                                context: 'public',
                                users: publicUserResult
                            });
                        }
                    }
                }
            }

            const results = {};
            searchResults.forEach(function (row) {
                const keys = Object.keys(row);
                if (!results[row.context]) {
                    results[row.context] = {};
                }
                results[row.context][keys[1]] = row[keys[1]];
            });

            return res.ok({
                results: results
            });
        } catch(err) {
            next(err);
        }
    });

};
