'use strict';

/**
 * Search all objects (Users, Groups)
 *
 * @param {object} app Express app
 *
 * @returns {void}
 */
module.exports = function (app) {
    var Promise = app.get('Promise');
    var models = app.get('models');
    var db = models.sequelize;
    var Op = db.Sequelize.Op;

    var loginCheck = app.get('middleware.loginCheck');

    var User = models.User;
    var Group = models.Group;
    var Topic = models.Topic;

    app.get('/api/search', loginCheck(['partner']), function (req, res, next) {
        var str = req.query.str; // Search string

        var findUserPromise = User
            .findAll({
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

        var findGroupPromise = Group
            .findAll({
                where: {
                    name: {
                        [Op.iLike]: str + '%'
                    }
                },
                attributes: ['id', 'name'],
                limit: 10
            });

        Promise
            .all([findUserPromise, findGroupPromise])
            .then(function ([users, groups]) {
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
            })
            .catch(next);
    });

    app.get('/api/v2/search', function (req, res, next) {
        var str = req.query.str; // Search string
        var limitMax = 100;
        var limitDefault = 10;
        var searchPromises = [];
        var userId = null;
        var partnerId = null;

        if (req.user) {
            userId = req.user.id;
            partnerId = req.user.partnerId;
        }

        var include = req.query.include;
        var fields = [];
        var limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        if (limit > limitMax) limit = limitDefault;
        var page = parseInt(req.query.page, 10) ? parseInt(req.query.page, 10) : 1;
        var offset = (page * limit) - limit;
        var params = Object.keys(req.query);
        var statuses;
        var queryStatuses = req.query.statuses;
        var pinned = req.query.pinned;

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
        include.forEach(function (term) {
            var terms = term.split('.');
            var context = null;
            var model = null;

            if (terms.length === 2) {
                context = terms[0];
                model = terms[1];
            } else if (terms.length === 1) {
                context = 'public';
                model = terms[0];
            }

            if (context && model) {
                if (context === 'my') {
                    var levelComparer;
                    var level;

                    if (model === 'topic') {
                        levelComparer = '>';
                        level = 'none';
                        var myTopicWhere = ' t."deletedAt" IS NULL \
                                AND t.title ILIKE :str \
                                ';

                        fields.forEach(function (field) {
                            var fieldBuild = field.split('.');
                            if (fieldBuild[0] === 'my' && fieldBuild[1] === 'topic') {
                                if (fieldBuild[2] === 'level' && req.query[field] !== 'none') {
                                    levelComparer = '>=';
                                    level = req.query[field];
                                }
                            }
                        });

                        myTopicWhere += 'AND COALESCE(tmup.level, tmgp.level, \'none\')::"enum_TopicMemberUsers_level" ' + levelComparer + ' :level ';
                        // All partners should see only Topics created by their site, but our own app sees all.
                        if (partnerId) {
                            myTopicWhere += ' AND t."sourcePartnerId" = :partnerId ';
                        }

                        if (statuses && statuses.length) {
                            myTopicWhere += ' AND t.status IN (:statuses)';
                        }

                        if (pinned) {
                            myTopicWhere += 'AND tp."topicId" = t.id AND tp."userId" = :userId';
                        }

                        // TODO: NOT THE MOST EFFICIENT QUERY IN THE WORLD, tune it when time.
                        // TODO: That casting to "enum_TopicMemberUsers_level". Sequelize does not support naming enums, through inheritance I have 2 enums that are the same but with different name thus different type in PG. Feature request - https://github.com/sequelize/sequelize/issues/2577
                        var myTopicQuery = '\
                                SELECT \
                                     COUNT(t.id) OVER() as count, \
                                     t.id, \
                                     t.title, \
                                     t.status, \
                                     t.visibility, \
                                     t.hashtag, \
                                     CASE \
                                        WHEN COALESCE(tmup.level, tmgp.level, \'none\') = \'admin\' THEN t."tokenJoin" \
                                        ELSE NULL \
                                     END as "tokenJoin", \
                                     CASE \
                                        WHEN tp."topicId" = t.id THEN true \
                                        ELSE false \
                                     END as "pinned", \
                                     t.categories, \
                                     t."endsAt", \
                                     t."createdAt", \
                                     COALESCE(tmup.level, tmgp.level, \'none\') as "permission.level", \
                                     muc.count as "members.users.count", \
                                     COALESCE(mgc.count, 0) as "members.groups.count", \
                                     tv."voteId" as "voteId" \
                                FROM "Topics" t \
                                    LEFT JOIN ( \
                                        SELECT \
                                            tmu."topicId", \
                                            tmu."userId", \
                                            tmu.level::text AS level \
                                        FROM "TopicMemberUsers" tmu \
                                        WHERE tmu."deletedAt" IS NULL \
                                    ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId) \
                                    LEFT JOIN ( \
                                        SELECT \
                                            tmg."topicId", \
                                            gm."userId", \
                                            MAX(tmg.level)::text AS level \
                                        FROM "TopicMemberGroups" tmg \
                                            LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                                        WHERE tmg."deletedAt" IS NULL \
                                        AND gm."deletedAt" IS NULL \
                                        GROUP BY "topicId", "userId" \
                                    ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId) \
                                    LEFT JOIN ( \
                                        SELECT tmu."topicId", COUNT(tmu."memberId") AS "count" FROM ( \
                                            SELECT \
                                                tmuu."topicId", \
                                                tmuu."userId" AS "memberId" \
                                            FROM "TopicMemberUsers" tmuu \
                                            WHERE tmuu."deletedAt" IS NULL \
                                            UNION \
                                            SELECT \
                                                tmg."topicId", \
                                                gm."userId" AS "memberId" \
                                            FROM "TopicMemberGroups" tmg \
                                                JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                                            WHERE tmg."deletedAt" IS NULL \
                                            AND gm."deletedAt" IS NULL \
                                        ) AS tmu GROUP BY "topicId" \
                                    ) AS muc ON (muc."topicId" = t.id) \
                                    LEFT JOIN ( \
                                        SELECT "topicId", count("groupId") AS "count" \
                                        FROM "TopicMemberGroups" \
                                        WHERE "deletedAt" IS NULL \
                                        GROUP BY "topicId" \
                                    ) AS mgc ON (mgc."topicId" = t.id) \
                                    LEFT JOIN "TopicVotes" tv \
                                        ON (tv."topicId" = t.id) \
                                    LEFT JOIN "TopicPins" tp ON tp."topicId" = t.id AND tp."userId" = :userId \
                                WHERE ' + myTopicWhere + ' \
                                GROUP BY t.id, tmup.level, tmgp.level, muc.count, mgc.count, tv."voteId", tp."topicId" \
                                ORDER BY t.title ASC \
                                LIMIT :limit \
                                OFFSET :offset \
                            ;';

                        var myTopicPromise = db
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
                            )
                            .then(function (result) {
                                var topics = {
                                    count: 0,
                                    rows: []
                                };

                                result.forEach(function (row) {
                                    topics.count = row.count;
                                    delete row.count;
                                    topics.rows.push(row);
                                });

                                return {
                                    context: 'my',
                                    topics: topics
                                };
                            });

                        searchPromises.push(myTopicPromise);
                    } else if (model === 'group') {
                        var whereCondition = '';
                        level = 'read';
                        levelComparer = '>=';

                        fields.forEach(function (field) {
                            var fieldBuild = field.split('.');
                            if (fieldBuild[0] === 'my' && fieldBuild[1] === 'group') {
                                if (fieldBuild[2] === 'level') {
                                    level = req.query[field];
                                }
                            }
                        });

                        whereCondition += ' AND gm.level::"enum_GroupMembers_level" ' + levelComparer + ' :level ';

                        var myGroupPromise = db
                            .query(
                                'SELECT \
                                    COUNT(g.id) OVER() as count, \
                                    g.id, \
                                    g.name, \
                                    gm.level as "permission.level" \
                                FROM "Groups" g \
                                    JOIN "GroupMembers" gm ON (gm."groupId" = g.id) \
                                WHERE g.name ILIKE :str \
                                    AND g."deletedAt" IS NULL \
                                    AND gm."deletedAt" is NULL \
                                    AND gm."userId" = :userId \
                                    ' + whereCondition + ' \
                                        ORDER BY g.name ASC \
                                        LIMIT :limit \
                                        OFFSET :offset \
                                        ;',
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
                            .then(function (result) {
                                var groups = {
                                    count: 0,
                                    rows: []
                                };

                                result.forEach(function (row) {
                                    groups.count = row.count;
                                    delete row.count;
                                    groups.rows.push(row);
                                });

                                return {
                                    context: 'my',
                                    groups: groups
                                };
                            });

                        searchPromises.push(myGroupPromise);
                    }
                }

                if (context === 'public') {
                    if (model === 'topic') {
                        var publicTopicPromise = Topic
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
                            })
                            .then(function (result) {
                                return {
                                    context: 'public',
                                    topics: result,
                                    status: statuses
                                };
                            });
                        searchPromises.push(publicTopicPromise);
                    } else if (model === 'group') {
                        var publicGroupPromise = Group
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
                            })
                            .then(function (result) {
                                return {
                                    context: 'public',
                                    groups: result
                                };
                            });
                        searchPromises.push(publicGroupPromise);
                    } else if (model === 'user') {
                        var publicUserPromise = User
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
                            })
                            .then(function (result) {
                                return {
                                    context: 'public',
                                    users: result
                                };
                            });
                        searchPromises.push(publicUserPromise);
                    }
                }
            }
        });

        Promise
            .all(searchPromises)
            .then(function (result) {
                var results = {};
                result.forEach(function (row) {
                    var keys = Object.keys(row);
                    if (!results[row.context]) {
                        results[row.context] = {};
                    }
                    results[row.context][keys[1]] = row[keys[1]];
                });

                return res.ok({
                    results: results
                });
            })
            .catch(next);
    });

};
