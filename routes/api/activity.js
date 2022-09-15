'use strict';

/**
 * Activity API-s
 */

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const Sequelize = require('sequelize');
    const { injectReplacements } = require('sequelize/lib/utils/sql');
    const _ = app.get('lodash');
    const cosActivities = app.get('cosActivities');
    const loginCheck = app.get('middleware.loginCheck');
    const topicLib = require('./topic')(app);
    const groupLib = require('./group')(app);

    const Activity = models.Activity;
    const Group = models.Group;
    const User = models.User;
    const Topic = models.Topic;
    const GroupMemberUser = models.GroupMemberUser;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicMemberGroup = models.TopicMemberGroup;
    const VoteUserContainer = models.VoteUserContainer;

    /**
     * Read (List) public Topic Activities
     */

    const activitiesDataFunction = `
        CREATE OR REPLACE FUNCTION pg_temp.getActivityData(uuid, text[], text[], text[])
            RETURNS TABLE (id uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone, topicIds text[], topics jsonb, groups jsonb, users jsonb)
            AS $$
            SELECT DISTINCT
            a.id,
            a.data,
            a."createdAt",
            a."updatedAt",
            a."deletedAt",
            string_to_array(array_to_string($2, ','), ',') AS "topicIds",
            jsonb_agg(t.*) AS topics,
            jsonb_agg(g.*) AS groups,
            jsonb_agg(u.*) AS users
            FROM
                "Activities" a
                LEFT JOIN
                    "Topics" t ON ARRAY[t.id::text] <@ string_to_array(array_to_string($2, ','), ',')
                LEFT JOIN
                    "Groups" g ON ARRAY[g.id::text] <@ string_to_array(array_to_string($3, ','), ',')
                LEFT JOIN
                    "Users" u ON ARRAY[u.id::text] <@ string_to_array(array_to_string($4, ','), ',')
            WHERE a.id = $1
            GROUP BY a.id
            LIMIT 1
            ;$$
            LANGUAGE SQL IMMUTABLE ;
    `;

    const buildActivityFeedIncludeString = function (req, visibility) {
        let queryInclude = req.query.include || [];

        if (queryInclude && !Array.isArray(queryInclude)) {
            queryInclude = [queryInclude];
        }
        const allowedIncludeAuth = ['userTopics', 'userGroups', 'user', 'self'];
        const allowedInclude = ['publicTopics', 'publicGroups'];

        let include = queryInclude.filter(function (item, key, input) {
            if (visibility && visibility === 'public') {
                return allowedInclude.indexOf(item) > -1 && (input.indexOf(item) === key);
            } else {
                return allowedIncludeAuth.indexOf(item) > -1 && (input.indexOf(item) === key);
            }
        });
        if (!include || !include.length) {
            include = allowedIncludeAuth;
            if (visibility === 'public') {
                include = allowedInclude;
            }
        }

        const includedSql = [];

        if (req.user && req.user.userId && (!visibility || visibility !== 'public')) {
            const viewActivity = `SELECT
                va.id,
                va.data,
                va."topicIds",
                va."groupIds",
                va."userIds",
                va."createdAt",
                va."updatedAt",
                va."deletedAt"
                FROM "Activities" va
                WHERE
                va."actorType" = 'User' AND va."actorId" = :userId::text
                AND va.data@>'{"type": "View"}'
                AND va.data#>>'{object, @type}' = 'Activity'
                `;
            includedSql.push(viewActivity);
        }

        include.forEach(function (item) {
            switch (item) {
                case 'user':
                    includedSql.push(`SELECT
                        ua.id,
                        ua.data,
                        ua."topicIds",
                        ua."groupIds",
                        ua."userIds",
                        ua."createdAt",
                        ua."updatedAt",
                        ua."deletedAt"
                    FROM
                        pg_temp.getUserActivities(:userId) ua
                    `);
                    break;
                case 'self':
                    includedSql.push(`SELECT
                        guaaa.id,
                        guaaa.data,
                        guaaa."topicIds",
                        guaaa."groupIds",
                        guaaa."userIds",
                        guaaa."createdAt",
                        guaaa."updatedAt",
                        guaaa."deletedAt"
                    FROM
                        pg_temp.getUserAsActorActivities(:userId) guaaa
                    `);
                    break;
                case 'userTopics':
                    includedSql.push(`SELECT
                        guta.id,
                        guta.data,
                        guta."topicIds",
                        guta."groupIds",
                        guta."userIds",
                        guta."createdAt",
                        guta."updatedAt",
                        guta."deletedAt"
                    FROM
                        pg_temp.getUserTopicActivities(:userId) guta
                    `);
                    break;
                case 'userGroups':
                    includedSql.push(`SELECT
                        guga.id,
                        guga.data,
                        guga."topicIds",
                        guga."groupIds",
                        guga."userIds",
                        guga."createdAt",
                        guga."updatedAt",
                        guga."deletedAt"
                    FROM
                        pg_temp.getUserGroupActivities(:userId) guga
                    `);
                    break;
                case 'publicTopics':
                    includedSql.push(`SELECT
                        guta.id,
                        guta.data,
                        guta."topicIds",
                        guta."groupIds",
                        guta."userIds",
                        guta."createdAt",
                        guta."updatedAt",
                        guta."deletedAt"
                    FROM
                        pg_temp.getPublicTopicActivities() guta
                    `);
                    break;
                case 'publicGroups':
                    includedSql.push(`SELECT
                        guga.id,
                        guga.data,
                        guga."topicIds",
                        guga."groupIds",
                        guga."userIds",
                        guga."createdAt",
                        guga."updatedAt",
                        guga."deletedAt"
                    FROM
                        pg_temp.getPublicGroupActivities() guga
                    `);
                    break;
                default:
                // Do nothing
            }
        });

        return includedSql.join(' UNION ');
    };

    const parseActivitiesResults = function (activities) {
        const returnList = [];
        activities.forEach(function (activity) {
            const returnActivity = _.cloneDeep(activity);

            delete activity.data.actor.ip; // NEVER expose IP

            activity.actor = activity.data.actor;
            if (activity.data.actor.type === 'User') {
                const actor = _.find(activity.users, function (o) {
                    return o.id === activity.data.actor.id;
                });
                activity.actor.company = actor.company;
                activity.actor.name = actor.name;
            }
            if (activity.data.object[0] && activity.data.object[0]['@type'] === 'VoteList') {
                returnActivity.data.actor = {
                    name: 'User',
                    type: 'User',
                    company: null
                };
            } else {
                if (activity.data.actor && activity.data.actor.level) {
                    activity.actor.level = activity.data.actor.level;
                }
                if (returnActivity.data.actor && returnActivity.data.actor.type === 'Moderator') {
                    activity.actor.type = returnActivity.data.actor.type;
                }
                returnActivity.data.actor = activity.actor;
            }

            const extraFields = ['object', 'origin', 'target'];

            extraFields.forEach(function (field) {
                let object = null;
                let topic;
                let group;
                let user;
                if (activity.data[field]) {
                    switch (activity.data[field]['@type']) {
                        case 'Topic':
                            delete returnActivity.data[field].creator;
                            delete returnActivity.data[field].description;
                            if (field === 'origin' && activity.data.type === 'Update') break;
                            topic = _.find(activity.topics, function (t) {
                                return t.id === activity.data[field].id
                            });
                            object = Topic.build(topic).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            object.creatorId = topic.creatorId;
                            delete object.creator;
                            delete object.description;
                            break;
                        case 'Group':
                            delete returnActivity.data[field].creator;
                            if (field === 'origin' && activity.data.type === 'Update') break;
                            group = _.find(activity.groups, function (t) {
                                return t.id === activity.data[field].id
                            });
                            object = Group.build(group).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            object.createdAt = activity.data[field].createdAt;
                            object.creatorId = activity.data[field].creatorId;
                            object.updatedAt = activity.data[field].updatedAt;
                            object.deletedAt = activity.data[field].deletedAt;
                            object.sourcePartnerId = activity.data[field].sourcePartnerId;
                            delete object.creator;
                            break;
                        case 'User':
                            delete returnActivity.data[field].language;
                            if (field === 'origin' && activity.data.type === 'Update') break;
                            user = _.find(activity.users, function (t) {
                                return t.id === activity.data[field].id
                            });
                            object = User.build(user).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            if (activity.data[field].level) { // FIXME: HACK? Invite event, putting level here, not sure it belongs here, but.... https://github.com/citizenos/citizenos-fe/issues/112 https://github.com/w3c/activitystreams/issues/506
                                object.level = activity.data[field].level;
                            }
                            if (activity.data[field].inviteId) { // FIXME: HACK? Invite event, putting level here, not sure it belongs here, but.... https://github.com/citizenos/citizenos-fe/issues/112 https://github.com/w3c/activitystreams/issues/506
                                object.inviteId = activity.data[field].inviteId;
                            }

                            delete object.email;
                            delete object.imageUrl;
                            delete object.language;
                            break;
                        case 'VoteUserContainer':
                            object = VoteUserContainer.build(activity.data[field]).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            break;
                        case 'VoteFinalContainer':
                            delete returnActivity.data[field].creator;
                            delete returnActivity.data[field].description;
                            if (field === 'origin' && activity.data.type === 'Update') break;
                            topic = _.find(activity.topics, function (t) {
                                return t.id === activity.data[field].topicId
                            });
                            object = Topic.build(topic).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            object.creatorId = topic.creatorId;
                            delete object.creator;
                            delete object.description;
                            break;
                        case 'TopicMemberUser':
                            object = TopicMemberUser.build(activity.data[field]).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            break;
                        case 'TopicMemberGroup':
                            object = TopicMemberGroup.build(activity.data[field]).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            break;
                        case 'GroupMemberUser':
                            object = GroupMemberUser.build(activity.data[field]).toJSON();
                            object['@type'] = activity.data[field]['@type'];
                            break;
                        case 'TopicJoin': // https://github.com/citizenos/citizenos-fe/issues/311
                        case 'GroupJoin': // https://github.com/citizenos/citizenos-fe/issues/325
                            object = activity.data[field];

                            // At the moment, we have no Activity feed data modifications based on User access level.
                            // That is, every objects activity and it's data is visible to EVERY User that has access to the object.
                            // When a token can ONLY be modified and shared by admin level Users, we CANNOT leak the token to Users with lesser permissions.
                            // Instead of taking on the journey (LONG ONE) to filter/mask data based on permissions, I take the shortcut of masking the token in the feed for ALL Users.
                            // IDEALLY I FEEL like all the filtering SHOULD be done in the Models "toJSON(permission)" function which MUST then be used for filtering API output as well.
                            // @see https://github.com/citizenos/citizenos-fe/issues/311
                            // @see https://github.com/citizenos/citizenos-fe/issues/325

                            if (object.token) {
                                object.token = object.token.replace(object.token.substr(2, 8), '********');
                            }

                            if (activity.data.result) {
                                for (const obj of activity.data.result) {
                                    if (obj.path && obj.path ==='/token') {
                                        obj.value = obj.value.replace(obj.value.substr(2, 8), '********');
                                        break;
                                    }
                                }
                            }

                            returnActivity.data.result = activity.data.result;
                            break;
                        default:
                            object = activity.data[field];
                    }

                    // If the there is "topicId" present in the origin/target/object, it is not a Topic object.
                    // To show Topic title in the feed, we need to populate these objects with "topicTitle" property.
                    // Example cases are TopicMemberUsers level change activity, TopicJoin link change activity etc which have no Topic object in them.
                    // @see https://github.com/citizenos/citizenos-fe/issues/311
                    if (object && object.topicId) {
                        const topic = returnActivity.topics.find(function (el) {
                            return el.id === object.topicId;
                        });
                        object.topicTitle = topic.title;
                    }

                    // @see https://github.com/citizenos/citizenos-fe/issues/325
                    if (object && object.groupId) {
                        const group = returnActivity.groups.find(function (el) {
                            return el.id === object.groupId;
                        });
                        object.groupName = group.name;
                    }
                } else if (activity.data.object && activity.data.object.object) {
                    if (activity.data.object.object['@type'] === 'Topic') {
                        delete returnActivity.data.object.object.creator;
                        delete returnActivity.data.object.object.description;
                    }
                }
                if (object) {
                    returnActivity.data[field] = object;
                }
            });

            delete returnActivity.topicids;
            delete returnActivity.topics;
            delete returnActivity.users;
            delete returnActivity.groups;
            delete returnActivity.data.context; // Remove "context" which is for debugging purposes but MAY expose unwanted data to the end User. - https://github.com/citizenos/citizenos-fe/issues/325

            returnList.push(returnActivity);
        });

        _.sortBy(returnList, function (activity) {
            return activity.updatedAt;
        });

        return returnList;
    };

    const topicActivitiesList = async function (req, res, next, visibility) {
        try {
            const limitMax = 50;
            const limitDefault = 10;
            const topicId = req.params.topicId;
            let userId = null;
            if (req.user && !visibility) {
                userId = req.user.userId;
            }
            const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
            let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
            let visibilityCondition = '';
            if (visibility) {
                visibilityCondition = 't.visibility = :visibility AND';
            }

            if (limit > limitMax) limit = limitDefault;

            const allowedFilters = ['Topic', 'Group', 'TopicComment', 'Vote', 'User', 'VoteList'];
            let queryFilters = req.query.filter || [];
            if (queryFilters && !Array.isArray(queryFilters)) {
                queryFilters = [queryFilters];
            }

            const filters = queryFilters.filter(function (item, key, input) {
                return allowedFilters.indexOf(item) > -1 && (input.indexOf(item) === key);
            });

            let filterSql = '';

            if (filters.length) {
                const filtersEscaped = filters.map(function (filter) {
                    return db.escape(filter);
                });
                filterSql += `AND a.data#>>'{object, @type}' IN (${filtersEscaped.join(',')}) OR a.data#>>'{object, 0, @type}' IN (${filtersEscaped.join(',')}) `;
            }

            await db.transaction(async function (t) {
                const activity = Activity.build({
                    data: {
                        offset: offset,
                        limit: limit
                    }
                });

                const queryString = injectReplacements(`SELECT
                    ad.*
                    FROM
                    (SELECT
                        a.id, a."topicIds", a."groupIds", a."userIds"
                        FROM
                        "Activities" a
                        JOIN "Topics" t ON t.id = :topicId
                        WHERE
                        ${visibilityCondition}
                        ARRAY[:topicId] <@  a."topicIds" AND a.data#>>'{object, @type}' <> 'UserNotificationSettings' OR  ( ARRAY[:topicId] <@  a."topicIds" AND a.data#>>'{object, @type}' = 'UserNotificationSettings' AND a.data#>>'{object, "userId"}' = :userId)
                        ${filterSql}
                        OR
                        (a.data@>'{"type": "View"}'
                        AND
                        a."actorType" = 'User'
                        AND
                        a."actorId" = :userId
                        AND
                        a.data#>>'{object, @type}' = 'Activity')
                        ORDER BY a."updatedAt" DESC
                        LIMIT :limit OFFSET :offset) a
                    JOIN pg_temp.getActivityData(a.id, a."topicIds", a."groupIds", a."userIds") ad ON ad."id" = a.id
                    ORDER BY ad."updatedAt" DESC
                    ;`, Sequelize.postgres, {
                        topicId: topicId,
                        userId: userId,
                        visibility: visibility,
                        limit: limit,
                        offset: offset
                });
                const results = await db.query(`${activitiesDataFunction} ${queryString}`,
                    {
                        type: db.QueryTypes.SELECT,
                        transaction: t,
                        nest: true,
                        raw: true
                    }
                );

                if (userId && !visibility) {
                    await cosActivities
                        .viewActivityFeedActivity(
                            activity,
                            {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        )
                }

                const finalResults = parseActivitiesResults(results);

                t.afterCommit(() => {
                    if (finalResults && finalResults.length && finalResults[0]) {
                        return res.ok(finalResults);
                    }

                    return res.notFound();
                });
            });
        } catch (err) {
            return next(err);
        }
    };

    app.get('/api/topics/:topicId/activities', async function (req, res, next) {
        return topicActivitiesList(req, res, next, 'public');
    });

    app.get('/api/test/users/:userId/activities', function (req, res, next) {
        req.user = {id: req.params.userId};

        return activitiesList(req, res, next);
    });

    app.get('/api/test/old/users/:userId/activities', function (req, res, next) {
        req.user = {id: req.params.userId};

        return activitiesList(req, res, next);
    });

    app.get('/api/users/:userId/topics/:topicId/activities', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        return topicActivitiesList(req, res, next);
    });

    app.get('/api/users/:userId/activities/unread', loginCheck(['partner']), async function (req, res, next) {
        const userId = req.user.userId;
        const sourcePartnerId = req.query.sourcePartnerId;

        // All partners should see only Topics created by their site, but our own app sees all.
        let wherePartnerTopics = '';
        let wherePartnerGroups = '';
        if (sourcePartnerId) {
            wherePartnerTopics = injectReplacements(` AND t."sourcePartnerId" = :sourcePartnerId `, Sequelize.postgres, {sourcePartnerId});
            wherePartnerGroups = injectReplacements(`' AND g."sourcePartnerId" = :sourcePartnerId `, Sequelize.postgres, {sourcePartnerId});
        }
        try {
            const queryFunctions = `
                CREATE OR REPLACE FUNCTION pg_temp.getUserTopics(uuid)
                    RETURNS TABLE("topicId" uuid)
                    AS $$
                        SELECT
                                t.id
                        FROM "Topics" t
                        LEFT JOIN (
                            SELECT
                                tmu."topicId",
                                tmu."userId",
                                tmu.level::text AS level
                            FROM "TopicMemberUsers" tmu
                            WHERE tmu."deletedAt" IS NULL
                        ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = $1)
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
                        ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = $1)
                        LEFT JOIN "Users" c ON (c.id = t."creatorId")
                        WHERE
                            t.title IS NOT NULL
                            ${wherePartnerTopics}
                            AND COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" > 'none'
                        ORDER BY t."updatedAt" DESC
                    ; $$
                LANGUAGE SQL IMMUTABLE ;

                CREATE OR REPLACE FUNCTION pg_temp.getUserGroups(uuid)
                    RETURNS TABLE("groupId" uuid)
                    AS $$
                        SELECT
                            g.id
                        FROM "Groups" g
                            JOIN "GroupMemberUsers" gm ON (gm."groupId" = g.id)
                            JOIN "Users" c ON (c.id = g."creatorId")
                            JOIN (
                                SELECT "groupId", count("userId") AS "count"
                                FROM "GroupMemberUsers"
                                WHERE "deletedAt" IS NULL
                                GROUP BY "groupId"
                            ) AS mc ON (mc."groupId" = g.id)
                            LEFT JOIN (
                                SELECT
                                    tmg."groupId",
                                    count(tmg."topicId") AS "count"
                                FROM "TopicMemberGroups" tmg
                                WHERE tmg."deletedAt" IS NULL
                                GROUP BY tmg."groupId"
                            ) AS gtc ON (gtc."groupId" = g.id)
                            LEFT JOIN (
                                SELECT
                                    tmg."groupId",
                                    tmg."topicId",
                                    t.title
                                FROM "TopicMemberGroups" tmg
                                    LEFT JOIN "Topics" t ON (t.id = tmg."topicId")
                                WHERE tmg."deletedAt" IS NULL
                                ORDER BY t."updatedAt" ASC
                            ) AS gt ON (gt."groupId" = g.id)
                        WHERE gm."deletedAt" is NULL
                            ${wherePartnerGroups}
                            AND gm."userId" = $1
                        GROUP BY g.id
                        ORDER BY g."updatedAt" DESC, g.id
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getUserTopicActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a,
                            pg_temp.getUserTopics($1) ut
                            WHERE
                            ARRAY[ut."topicId"::text] <@ (a."topicIds")
                            ORDER BY a."updatedAt" DESC
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getUserGroupActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a,
                            pg_temp.getUserGroups($1) ug
                            WHERE
                            ARRAY[ug."groupId"::text] <@ (a."groupIds")
                            ORDER BY a."updatedAt" DESC
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION  pg_temp.getUserActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a
                            WHERE
                            ARRAY[$1::text] <@ (a."userIds")
                            ORDER BY a."updatedAt" DESC
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION  pg_temp.getUserAsActorActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a
                            WHERE
                                a."actorType" = 'User' AND a."actorId" = $1::text
                            ORDER BY a."updatedAt" DESC
                    ; $$
                LANGUAGE SQL IMMUTABLE;
            `;
            const query = injectReplacements(`
                SELECT
                        COUNT(uac.id) AS count
                    FROM
                        (
                            SELECT
                                ua.id,
                                ua.data,
                                ua."createdAt",
                                ua."updatedAt",
                                ua."deletedAt"
                            FROM
                                pg_temp.getUserActivities(:userId) ua
                            UNION
                            SELECT
                                guta.id,
                                guta.data,
                                guta."createdAt",
                                guta."updatedAt",
                                guta."deletedAt"
                            FROM
                                pg_temp.getUserTopicActivities(:userId) guta
                            UNION
                            SELECT
                                guga.id,
                                guga.data,
                                guga."createdAt",
                                guga."updatedAt",
                                guga."deletedAt"
                            FROM
                                pg_temp.getUserGroupActivities(:userId) guga
                            UNION
                            SELECT
                                guaaa.id,
                                guaaa.data,
                                guaaa."createdAt",
                                guaaa."updatedAt",
                                guaaa."deletedAt"
                            FROM
                                pg_temp.getUserAsActorActivities(:userId) guaaa
                        ) uac
                JOIN (
                    SELECT
                        va.id,
                        va.data,
                        va."createdAt",
                        va."updatedAt",
                        va."deletedAt"
                    FROM "Activities" va
                    WHERE
                        va."actorType" = 'User' AND va."actorId" = :userId::text
                    AND va.data@>'{"type": "View"}'
                    AND va.data#>>'{object, @type}' = 'Activity'
                ) ua ON ua.id = ua.id
                WHERE
                    uac.id <> ua.id
                    AND
                    uac."createdAt" > ua."updatedAt"
                OR
                    uac.id <> ua.id
                    AND
                    uac."updatedAt" > ua."updatedAt"
                ;`, Sequelize.postgres, {userId: userId});

            const results = await db
                .query(`${queryFunctions} ${query}`,
                    {
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );

            return res.ok(results[0]);

        } catch (err) {
            return next(err);
        }

    });

    const activitiesList = async function (req, res, next, visibility) {
        try {
            const limitMax = 50;
            const limitDefault = 10;
            const allowedFilters = ['Topic', 'Group', 'TopicComment', 'Vote', 'User', 'VoteList'];
            let userId;

            if (req.user) {
                userId = req.user.userId;
            }
            const sourcePartnerId = req.query.sourcePartnerId;
            const page = parseInt(req.query.page, 10);
            let offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
            let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;

            const includeSql = injectReplacements(buildActivityFeedIncludeString(req, visibility), Sequelize.postgres, {userId: userId});
            let queryFilters = req.query.filter || [];
            if (queryFilters && !Array.isArray(queryFilters)) {
                queryFilters = [queryFilters];
            }

            const filters = queryFilters.filter(function (item, key, input) {
                return allowedFilters.indexOf(item) > -1 && (input.indexOf(item) === key);
            });

            let where = ``;

            if (filters.length) {
                const filtersEscaped = filters.map(function (filter) {
                    return db.escape(filter);
                });
                where += `a.data#>>'{object, @type}' IN (${filtersEscaped.join(',')}) OR a.data#>>'{object, 0, @type}' IN (${filtersEscaped.join(',')}) `;
            } else if (userId) {
                where = injectReplacements(`a.data#>>'{object, @type}' <> 'UserNotificationSettings' OR  (a.data#>>'{object, @type}' = 'UserNotificationSettings' AND a.data#>>'{object, "userId"}' = :userId ) `, Sequelize.postgres, {userId: req.user.userId});
            }

            if (where) {
                where = 'WHERE ' + where;
            }

            if (page && page > 0) {
                offset = page * limitDefault - limitDefault;
                limit = limitDefault;
            }

            if (limit > limitMax) limit = limitDefault;

            // All partners should see only Topics created by their site, but our own app sees all.
            let wherePartnerTopics = '';
            let wherePartnerGroups = '';
            if (sourcePartnerId) {
                wherePartnerTopics = injectReplacements(` AND t."sourcePartnerId" = :sourcePartnerId `, Sequelize.postgres, {sourcePartnerId});
                wherePartnerGroups = injectReplacements(` AND g."sourcePartnerId" = :sourcePartnerId `, Sequelize.postgres, {sourcePartnerId});
            }

            const query = `
                ${activitiesDataFunction}
                CREATE OR REPLACE FUNCTION pg_temp.getPublicTopics()
                    RETURNS TABLE("topicId" uuid)
                    AS $$
                        SELECT
                                t.id
                        FROM "Topics" t
                            LEFT JOIN "Users" c ON (c.id = t."creatorId")
                        WHERE
                            t.title IS NOT NULL
                            AND t.visibility = 'public'
                            ${wherePartnerTopics}
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getPublicGroups()
                    RETURNS TABLE("groupId" uuid)
                    AS $$
                        SELECT
                            g.id
                        FROM "Groups" g
                        WHERE g."visibility" = 'public'
                            ${wherePartnerGroups}
                        GROUP BY g.id
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getUserTopics(uuid)
                    RETURNS TABLE("topicId" uuid)
                    AS $$
                        SELECT
                                t.id
                        FROM "Topics" t
                            LEFT JOIN (
                                SELECT
                                    tmu."topicId",
                                    tmu."userId",
                                    tmu.level::text AS level
                                FROM "TopicMemberUsers" tmu
                                WHERE tmu."deletedAt" IS NULL
                            ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = $1)
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
                            ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = $1)
                            LEFT JOIN "Users" c ON (c.id = t."creatorId")
                        WHERE
                            t.title IS NOT NULL
                            ${wherePartnerTopics}
                            AND COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" > 'none'
                        ORDER BY t."updatedAt" DESC
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getUserGroups(uuid)
                    RETURNS TABLE("groupId" uuid)
                    AS $$
                        SELECT
                            g.id
                        FROM "Groups" g
                            JOIN "GroupMemberUsers" gm ON (gm."groupId" = g.id)
                            JOIN "Users" c ON (c.id = g."creatorId")
                            JOIN (
                                SELECT "groupId", count("userId") AS "count"
                                FROM "GroupMemberUsers"
                                WHERE "deletedAt" IS NULL
                                GROUP BY "groupId"
                            ) AS mc ON (mc."groupId" = g.id)
                            LEFT JOIN (
                                SELECT
                                    tmg."groupId",
                                    count(tmg."topicId") AS "count"
                                FROM "TopicMemberGroups" tmg
                                WHERE tmg."deletedAt" IS NULL
                                GROUP BY tmg."groupId"
                            ) AS gtc ON (gtc."groupId" = g.id)
                            LEFT JOIN (
                                SELECT
                                    tmg."groupId",
                                    tmg."topicId",
                                    t.title
                                FROM "TopicMemberGroups" tmg
                                    LEFT JOIN "Topics" t ON (t.id = tmg."topicId")
                                WHERE tmg."deletedAt" IS NULL
                                ORDER BY t."updatedAt" ASC
                            ) AS gt ON (gt."groupId" = g.id)
                        WHERE gm."deletedAt" is NULL
                            ${wherePartnerGroups}
                            AND gm."userId" = $1
                        GROUP BY g.id
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getPublicTopicActivities()
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a,
                            pg_temp.getPublicTopics() ut
                            WHERE
                            ARRAY[ut."topicId"::text] <@ (a."topicIds")
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getPublicGroupActivities()
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a,
                            pg_temp.getPublicGroups() ug
                            WHERE
                            ARRAY[ug."groupId"::text] <@ (a."groupIds")
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getUserTopicActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a,
                            pg_temp.getUserTopics($1) ut
                            WHERE
                            ARRAY[ut."topicId"::text] <@ (a."topicIds")
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION pg_temp.getUserGroupActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a,
                            pg_temp.getUserGroups($1) ug
                            WHERE
                            ARRAY[ug."groupId"::text] <@ (a."groupIds")
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION  pg_temp.getUserActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a
                            WHERE
                            ARRAY[$1::text] <@ (a."userIds")
                    ; $$
                LANGUAGE SQL IMMUTABLE;

                CREATE OR REPLACE FUNCTION  pg_temp.getUserAsActorActivities(uuid)
                    RETURNS TABLE ("id" uuid, data jsonb, "topicIds" text[], "groupIds" text[], "userIds" text[], "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone)
                    AS $$
                        SELECT
                            a.id,
                            a.data,
                            a."topicIds",
                            a."groupIds",
                            a."userIds",
                            a."createdAt",
                            a."updatedAt",
                            a."deletedAt"
                        FROM
                            "Activities" a
                            WHERE
                                a."actorType" = 'User' AND a."actorId" = $1::text
                    ; $$
                LANGUAGE SQL IMMUTABLE;
                `;

            let activity;

            const selectSql = injectReplacements(`SELECT
                ad.*
            FROM
                (
                    SELECT a.* FROM
                    (
                    ${includeSql}
                    ) a
                    ${where}
                    ORDER BY a."updatedAt" DESC
                    LIMIT :limit OFFSET :offset
                ) uac
            JOIN pg_temp.getActivityData(uac.id, uac."topicIds", uac."groupIds", uac."userIds") ad ON ad."id" = uac.id
                ORDER BY ad."updatedAt" DESC
            ;`, Sequelize.postgres, {
                limit: limit,
                offset: offset
            });

            await db
                .transaction(async function (t) {
                    if (userId) {
                        activity = Activity.build({
                            data: {
                                offset: offset,
                                limit: limit
                            }
                        });
                    }

                    const results = await db
                        .query(`${query} ${selectSql}`,
                            {
                                type: db.QueryTypes.SELECT,
                                raw: true,
                                nest: true,
                                transaction: t
                            }
                        );

                    if (userId) {
                        await cosActivities
                            .viewActivityFeedActivity(
                                activity,
                                {
                                    type: 'User',
                                    id: req.user.userId,
                                    ip: req.ip
                                },
                                req.method + ' ' + req.path,
                                t
                            );
                    }
                    const finalResults = parseActivitiesResults(results);

                    t.afterCommit(() => {
                        return res.ok(finalResults);
                    });
                });
        } catch (err) {
            return next(err);
        }
    };

    app.get('/api/users/:userId/activities', loginCheck(['partner']), function (req, res, next) {
        return activitiesList(req, res, next);
    });

    app.get('/api/activities', function (req, res, next) {
        return activitiesList(req, res, next, 'public');
    });

    /**
     * Read (List) public Group Activities
     */

    const groupActivitiesList = async function (req, res, next, visibility) {
        try {
            const limitMax = 50;
            const limitDefault = 10;
            const groupId = req.params.groupId;
            let userId = null;
            if (req.user && !visibility) {
                userId = req.user.userId;
            }
            const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
            let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
            let visibilityCondition = '';
            if (visibility) {
                visibilityCondition = 'g.visibility = :visibility AND';
            }

            if (limit > limitMax) limit = limitDefault;

            await db.transaction(async function (t) {
                const activity = Activity.build({
                    data: {
                        offset: offset,
                        limit: limit
                    }
                });

                const selectSql = injectReplacements(`
                    SELECT
                        ad.*
                    FROM
                    (
                        SELECT a.id, a."topicIds", a."groupIds", a."userIds"
                        FROM
                        "Activities" a
                        JOIN "Groups" g ON g.id = :groupId
                        WHERE
                        ${visibilityCondition}
                        ARRAY[:groupId] <@  a."groupIds"
                        OR
                        a.data@>'{"type": "View"}'
                        AND
                        a."actorType" = 'User'
                        AND
                        a."actorId" = :userId
                        AND
                        a.data#>>'{object, @type}' = 'Activity'
                        ORDER BY a."updatedAt" DESC
                        LIMIT :limit OFFSET :offset
                    ) a
                    JOIN pg_temp.getActivityData(a.id, a."topicIds", a."groupIds", a."userIds") ad ON ad.id = a.id
                    ORDER BY ad."updatedAt" DESC
                    ;`,
                    Sequelize.postgres, {
                        groupId: groupId,
                        userId: userId,
                        visibility: visibility,
                        limit: limit,
                        offset: offset
                    })
                const results = await db
                    .query(`${activitiesDataFunction} ${selectSql}`, {
                        type: db.QueryTypes.SELECT,
                        transaction: t,
                        nest: true,
                        raw: true
                    });

                if (userId && !visibility) {
                    await cosActivities
                        .viewActivityFeedActivity(
                            activity,
                            {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
                }

                const finalResults = parseActivitiesResults(results);

                t.afterCommit(() => {
                    if (finalResults && finalResults.length && finalResults[0]) {
                        return res.ok(finalResults);
                    } else {
                        return res.notFound();
                    }

                });
            });
        } catch (err) {
            return next(err);
        }
    };

    app.get('/api/groups/:groupId/activities', function (req, res, next) {
        return groupActivitiesList(req, res, next, 'public')
    });

    app.get('/api/users/:userId/groups/:groupId/activities', loginCheck(['partner']), groupLib.hasPermission(GroupMemberUser.LEVELS.read, true), function (req, res, next) {
        return groupActivitiesList(req, res, next);
    });

   /* app.get('/api/acitivites/strings', async (req, res, next) => {
        const strings = [];

        try {
            const activities = await db
            .query(`
                ${activitiesDataFunction}
                SELECT DISTINCT
                    a.id,
                    a.data,
                    a."createdAt",
                    a."updatedAt",
                    a."deletedAt",
                    a."topicIds",
                    a."userIds",
                    a."groupIds",
                    jsonb_agg(t.*) AS topics,
                    jsonb_agg(g.*) AS groups,
                    jsonb_agg(u.*) AS users
                FROM
                "Activities" a
                LEFT JOIN
                    "Topics" t ON ARRAY[t.id::text] <@ string_to_array(array_to_string(a."topicIds", ','), ',')
                LEFT JOIN
                    "Groups" g ON ARRAY[g.id::text] <@ string_to_array(array_to_string(a."groupIds", ','), ',')
                LEFT JOIN
                    "Users" u ON ARRAY[u.id::text] <@ string_to_array(array_to_string(a."userIds", ','), ',')
                GROUP BY a.id
                ORDER BY a."updatedAt" DESC
            ;`, {
                type: db.QueryTypes.SELECT,
                nest: true,
                raw: true
            });
            activities.forEach(async (activity) => {
                /*notifications.buildActivityString(activity);
                notifications.getActivityValues(activity);
                strings.push(activity.data.type + ' ' + (activity.data.object['@type'] || activity.data.object.type));
                const users = await notifications.getRelatedUsers(activity);
                console.log(users);
            });
            return res.ok(Array.from(new Set(strings)));
        } catch (err) {
            console.log(err);
            next(err)
        }
    })*/
};
