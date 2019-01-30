'use strict';

/**
 * Activity API-s
 */

module.exports = function (app) {
    var models = app.get('models');
    var db = models.sequelize;
    var _ = app.get('lodash');
    var cosActivities = app.get('cosActivities');
    var loginCheck = app.get('middleware.loginCheck');
    var topicLib = require('./topic')(app);
    var groupLib = require('./group')(app);

    var Activity = models.Activity;
    var Group = models.Group;
    var User = models.User;
    var Topic = models.Topic;
    var GroupMember = models.GroupMember;
    var TopicMemberUser = models.TopicMemberUser;
    var TopicMemberGroup = models.TopicMemberGroup;
    var VoteUserContainer = models.VoteUserContainer;

    /**
     * Read (List) public Topic Activities
     */

    var activitiesDataFunction = ' \
    CREATE OR REPLACE FUNCTION pg_temp.getActivityData(uuid) \
        RETURNS TABLE (id uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone, actor jsonb, object jsonb, origin jsonb, target jsonb) \
        AS $$ \
        SELECT DISTINCT \
        a.id, \
        a.data, \
        a."createdAt", \
        a."updatedAt", \
        a."deletedAt", \
        CASE \
            WHEN u.id IS NOT NULL THEN to_jsonb(u.*) \
            ELSE NULL \
        END AS actor, \
        CASE \
            WHEN uo.id IS NOT NULL THEN to_jsonb(uo.*) \
            WHEN go.id IS NOT NULL THEN to_jsonb(go.*) \
            WHEN tobj.id IS NOT NULL THEN to_jsonb(tobj.*) \
            WHEN tvco."voteId" IS NOT NULL THEN to_jsonb(tvco.*) \
            ELSE NULL \
        END AS object, \
        CASE \
            WHEN torig.id IS NOT NULL THEN to_jsonb(torig.*) \
            WHEN origg.id IS NOT NULL THEN to_jsonb(origg.*) \
            WHEN tmuorig."topicId" IS NOT NULL THEN to_jsonb(tmuorig.*) \
            WHEN gmuorig."userId" IS NOT NULL THEN to_jsonb(gmuorig.*) \
            WHEN tmgorig."groupId" IS NOT NULL THEN to_jsonb(tmgorig.*) \
            ELSE NULL \
        END AS origin, \
        CASE \
            WHEN targg.id IS NOT NULL THEN to_jsonb(targg.*) \
            WHEN targt.id IS NOT NULL THEN to_jsonb(targt.*) \
            WHEN targtc.id IS NOT NULL THEN to_jsonb(targtc.*) \
            ELSE NULL \
        END AS target \
        FROM \
            "Activities" a \
        LEFT JOIN \
            (SELECT \'User\' AS "type", u.id, u.name, u.company FROM "Users" u) u ON (a.data#>>\'{actor, type}\' = \'User\' OR a.data#>>\'{actor, type}\' = \'Moderator\') AND u.id::text = a.data#>>\'{actor, id}\' \
        LEFT JOIN \
            (SELECT \'Topic\' AS "@type", t.* FROM "Topics" t) tobj ON a.data#>>\'{object, @type}\' = \'Topic\' AND tobj.id::text = a.data#>>\'{object, id}\' \
        LEFT JOIN \
            (SELECT \'Group\' AS "@type", g.* FROM "Groups" g) go ON a.data#>>\'{object, @type}\' = \'Group\' AND go.id::text = a.data#>>\'{object, id}\' \
        LEFT JOIN \
            (SELECT \'User\' as "@type", id, name, company FROM "Users") uo ON a.data#>>\'{object, @type}\' = \'User\' AND uo.id::text = a.data#>>\'{object, id}\' \
        LEFT JOIN ( \
            SELECT \
            a.id AS "activityId", \
            jpr.*, \
            tv."topicId" AS "topicId", \
            t.title AS "topicTitle" \
                FROM "Activities" a \
                JOIN jsonb_to_record(a.data) AS jpr("@type" text, "userId" text, "voteId" text, "createdAt" text, "updatedAt" text, "deletedAt" text) ON a.id = a.id \
                JOIN "TopicVotes" tv ON tv."voteId"::text = data#>>\'{object, id}\' \
                JOIN "Topics" t ON t.id = tv."topicId" \
                WHERE a.data#>>\'{object, @type}\' = \'VoteUserContainer\' \
            ) tvco ON a.data#>>\'{object, @type}\' = \'VoteUserContainer\' AND tvco."activityId" = a.id \
        LEFT JOIN \
            (SELECT \'Group\' as "@type", g.* FROM "Groups" g) origg ON a.data#>>\'{origin, @type}\' = \'Group\' AND origg.id::text = a.data#>>\'{origin, id}\' \
        LEFT JOIN ( \
            SELECT \
                a.id AS "activityId", \
                jpr.*, \
                u.name AS "userName", \
                t.title AS "topicTitle" \
            FROM "Activities" a \
            JOIN jsonb_to_record(a.data) AS jpr("@type" text, "level" text, "userId" text, "topicId" text, "createdAt" text, "updatedAt" text, "deletedAt" text) ON a.id = a.id \
            JOIN "Users" u ON u.id::text = data#>>\'{origin, userId}\' \
            JOIN "Topics" t ON t.id::text = data#>>\'{origin, topicId}\' \
            WHERE a.data#>>\'{origin, @type}\' = \'TopicMemberUser\' \
        ) tmuorig ON a.data#>>\'{origin, @type}\' = \'TopicMemberUser\' AND tmuorig."activityId" = a.id \
        LEFT JOIN ( \
            SELECT \
                a.id AS "activityId", \
                jpr.*, \
                g.name AS "groupName", \
                t.title AS "topicTitle" \
            FROM "Activities" a \
            JOIN jsonb_to_record(a.data) AS jpr("@type" text, "level" text, "groupId" text, "topicId" text, "createdAt" text, "updatedAt" text, "deletedAt" text) ON a.id = a.id \
            JOIN "Groups" g ON g.id::text = data#>>\'{origin, groupId}\' \
            JOIN "Topics" t ON t.id::text = data#>>\'{origin, topicId}\' \
            WHERE a.data#>>\'{origin, @type}\' = \'TopicMemberGroup\' \
        ) tmgorig ON a.data#>>\'{origin, @type}\' = \'TopicMemberGroup\' AND tmuorig."activityId" = a.id \
        LEFT JOIN ( \
            SELECT \
                a.id AS "activityId", \
                jpr.*, \
                u.name AS "userName", \
                g.name AS "groupName" \
            FROM "Activities" a \
            JOIN jsonb_to_record(a.data) AS jpr("@type" text, "level" text, "userId" text, "groupId" text, "createdAt" text, "updatedAt" text, "deletedAt" text) ON a.id = a.id \
            JOIN "Users" u ON u.id::text = data#>>\'{origin, userId}\' \
            JOIN "Groups" g ON g.id::text = data#>>\'{origin, groupId}\' \
            WHERE a.data#>>\'{origin, @type}\' = \'GroupMember\' \
        ) gmuorig ON a.data#>>\'{origin, @type}\' = \'GroupMember\' AND tmuorig."activityId" = a.id \
        LEFT JOIN \
            (SELECT \'Group\' AS "@type", g.* FROM "Groups" g) targg ON a.data#>>\'{target, @type}\' = \'Group\' AND targg.id::text = a.data#>>\'{target, id}\' \
        LEFT JOIN\
            (SELECT \'Topic\' AS "@type", t.* FROM "Topics" t) targt ON a.data#>>\'{target, @type}\' = \'Topic\' AND targt.id::text = a.data#>>\'{target, id}\' \
        LEFT JOIN ( \
            SELECT \
                a.id AS "activityId", \
                \'Comment\' AS "@type", \
                c.*, \
                tc."topicId" \
            FROM "Activities" a \
            JOIN "Comments" c ON a.data#>>\'{target, @type}\' = \'Comment\' AND c."id"::text = a.data#>>\'{target, id}\' \
            JOIN "TopicComments" tc ON tc."commentId" = c.id \
        ) targtc ON a.data#>>\'{target, @type}\' = \'Comment\' AND targtc."id"::text = a.data#>>\'{target, id}\' \
        LEFT JOIN \
            "Topics" torig ON a.data#>>\'{origin, @type}\' = \'Topic\' AND torig.id::text = a.data#>>\'{origin, id}\' \
    WHERE a.id = $1 \
    LIMIT 1 \
    ;$$ \
    LANGUAGE SQL IMMUTABLE ;\
    ';

    var buildActivityFeedIncludeString = function (req, visibility) {
        var queryInclude = req.query.include || [];

        if (queryInclude && !Array.isArray(queryInclude)) {
            queryInclude = [queryInclude];
        }
        var allowedIncludeAuth = ['userTopics', 'userGroups', 'user', 'self'];
        var allowedInclude = ['publicTopics', 'publicGroups'];

        var include = queryInclude.filter(function (item, key, input) {
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

        var includedSql = [];

        if (req.user && req.user.id && (!visibility || visibility !== 'public')) {
            var viewActivity = 'SELECT \
                va.id, \
                va.data, \
                va."createdAt", \
                va."updatedAt", \
                va."deletedAt" \
                FROM "Activities" va \
                WHERE \
                va."actorType" = \'User\' AND va."actorId" = :userId::text \
                AND va.data@>\'{"type": "View"}\' \
                AND va.data#>>\'{object, @type}\' = \'Activity\' \
                ';
            includedSql.push(viewActivity);
        }

        include.forEach(function (item) {
            switch (item) {
                case 'user':
                    includedSql.push('SELECT \
                        ua.id, \
                        ua.data, \
                        ua."createdAt", \
                        ua."updatedAt", \
                        ua."deletedAt" \
                    FROM \
                        pg_temp.getUserActivities(:userId) ua \
                    ');
                    break;
                case 'self':
                    includedSql.push('SELECT \
                        guaaa.id, \
                        guaaa.data, \
                        guaaa."createdAt", \
                        guaaa."updatedAt", \
                        guaaa."deletedAt" \
                    FROM \
                        pg_temp.getUserAsActorActivities(:userId) guaaa \
                    ');
                    break;
                case 'userTopics':
                    includedSql.push('SELECT \
                        guta.id, \
                        guta.data, \
                        guta."createdAt", \
                        guta."updatedAt", \
                        guta."deletedAt" \
                    FROM \
                        pg_temp.getUserTopicActivities(:userId) guta \
                    ');
                    break;
                case 'userGroups':
                    includedSql.push('SELECT \
                        guga.id, \
                        guga.data, \
                        guga."createdAt", \
                        guga."updatedAt", \
                        guga."deletedAt" \
                    FROM \
                        pg_temp.getUserGroupActivities(:userId) guga \
                    ');
                    break;
                case 'publicTopics':
                    includedSql.push('SELECT \
                        guta.id, \
                        guta.data, \
                        guta."createdAt", \
                        guta."updatedAt", \
                        guta."deletedAt" \
                    FROM \
                        pg_temp.getPublicTopicActivities() guta \
                    ');
                    break;
                case 'publicGroups':
                    includedSql.push('SELECT \
                        guga.id, \
                        guga.data, \
                        guga."createdAt", \
                        guga."updatedAt", \
                        guga."deletedAt" \
                    FROM \
                        pg_temp.getPublicGroupActivities() guga \
                    ');
                    break;
                default:
                // Do nothing
            }
        });

        return includedSql.join(' UNION ');
    };

    var parseActivitiesResults = function (activities) {
        var returnList = [];
        activities.forEach(function (activity) {
            var returnActivity = _.cloneDeep(activity);

            if (activity.data.object[0] && activity.data.object[0]['@type'] === 'VoteList') {
                returnActivity.data.actor = {
                    name: 'User',
                    type: 'User',
                    company: null
                };
            } else {
                if (activity.actor && !activity.actor.level) {
                    delete activity.actor.level;
                }
                if (returnActivity.data.actor && returnActivity.data.actor.type === 'Moderator') {
                    activity.actor.type = returnActivity.data.actor.type;
                }
                returnActivity.data.actor = activity.actor;
            }

            var extraFields = ['object', 'origin', 'target'];
            extraFields.forEach(function (field) {
                var object = null;
                if (activity[field] && activity[field]['@type']) {
                    switch (activity[field]['@type']) {
                        case 'Topic':
                            object = Topic.build(activity[field]).toJSON();
                            object['@type'] = activity[field]['@type'];
                            object.creatorId = activity[field].creatorId;
                            delete object.creator;
                            delete object.description;
                            break;
                        case 'Group':
                            object = Group.build(activity[field]).toJSON();
                            object['@type'] = activity[field]['@type'];
                            object.createdAt = activity[field].createdAt;
                            object.creatorId = activity[field].creatorId;
                            object.updatedAt = activity[field].updatedAt;
                            object.deletedAt = activity[field].deletedAt;
                            object.sourcePartnerId = activity[field].sourcePartnerId;
                            delete object.creator;
                            break;
                        case 'User':
                            if (field !== 'origin') {
                                object = User.build(activity[field]).toJSON();
                                object['@type'] = activity[field]['@type'];
                                delete object.language;
                            }
                            break;
                        case 'VoteUserContainer':
                            object = VoteUserContainer.build(activity[field]).toJSON();
                            object['@type'] = activity[field]['@type'];
                            break;
                        case 'TopicMemberUser':
                            object = TopicMemberUser.build(activity[field]).toJSON();
                            object['@type'] = activity[field]['@type'];
                            break;
                        case 'TopicMemberGroup':
                            object = TopicMemberGroup.build(activity[field]).toJSON();
                            object['@type'] = activity[field]['@type'];
                            break;
                        case 'GroupMember':
                            object = GroupMember.build(activity[field]).toJSON();
                            object['@type'] = activity[field]['@type'];
                            break;
                        default:
                    }
                }
                if (object) {
                    returnActivity.data[field] = object;
                }
            });

            delete returnActivity.actor;
            delete returnActivity.object;
            delete returnActivity.origin;
            delete returnActivity.target;

            returnList.push(returnActivity);
        });

        _.sortBy(returnList, function (activity) {
            return activity.updatedAt;
        });

        return returnList;
    };

    var topicActivitiesList = function (req, res, next, visibility) {
        var limitMax = 50;
        var limitDefault = 10;
        var topicId = req.params.topicId;
        var userId = null;
        if (req.user && !visibility) {
            userId = req.user.id;
        }
        var offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        var limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        var visibilityCondition = '';
        if (visibility) {
            visibilityCondition = 't.visibility = :visibility AND';
        }

        if (limit > limitMax) limit = limitDefault;

        var allowedFilters = ['Topic', 'Group', 'TopicComment', 'Vote', 'User', 'VoteList'];
        var queryFilters = req.query.filter || [];
        if (queryFilters && !Array.isArray(queryFilters)) {
            queryFilters = [queryFilters];
        }

        var filters = queryFilters.filter(function (item, key, input) {
            return allowedFilters.indexOf(item) > -1 && (input.indexOf(item) === key);
        });

        var filterSql = '';

        if (filters.length) {
            var filtersEscaped = filters.map(function (filter) {
                return db.escape(filter);
            });
            filterSql += 'AND a.data#>>\'{object, @type}\' IN (' + filtersEscaped.join(',') + ') OR a.data#>>\'{object, 0, @type}\' IN (' + filtersEscaped.join(',') + ') ';
        }

        return db.transaction(function (t) {
            var activity = Activity.build({
                data: {
                    offset: offset,
                    limit: limit
                }
            });

            return db
                .query(
                    '\
                    ' + activitiesDataFunction + ' \
                    SELECT \
                        ad.* \
                    FROM \
                    (SELECT \
                        a.id \
                        FROM \
                        "Activities" a \
                        JOIN "Topics" t ON t.id = :topicId \
                        WHERE \
                        ' + visibilityCondition + ' \
                        ARRAY[:topicId] <@  a."topicIds" \
                        ' + filterSql + ' \
                        OR \
                        a.data@>\'{"type": "View"}\' \
                        AND \
                        a."actorType" = \'User\' \
                        AND \
                        a."actorId" = :userId \
                        AND \
                        a.data#>>\'{object, @type}\' = \'Activity\' \
                        ORDER BY a."updatedAt" DESC \
                        LIMIT :limit OFFSET :offset) a \
                    JOIN pg_temp.getActivityData(a.id) ad ON ad."id" = a.id \
                    ORDER BY ad."updatedAt" DESC \
                    ;',
                    {
                        replacements: {
                            topicId: topicId,
                            userId: userId,
                            visibility: visibility,
                            limit: limit,
                            offset: offset
                        },
                        type: db.QueryTypes.SELECT,
                        transaction: t,
                        nest: true,
                        raw: true
                    }
                )
                .then(function (results) {
                    if (userId && !visibility) {
                        return cosActivities
                            .viewActivityFeedActivity(
                                activity,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                req.method + ' ' + req.path,
                                t
                            )
                            .then(function () {
                                return parseActivitiesResults(results);
                            });
                    }

                    return parseActivitiesResults(results);
                });
        });
    };

    app.get('/api/topics/:topicId/activities', function (req, res, next) {
        return topicActivitiesList(req, res, next, 'public')
            .then(function (results) {
                if (results && results.length && results[0]) {
                    return res.ok(results);
                } else {
                    return res.notFound();
                }
            })
            .catch(next);
    });

    app.get('/api/users/:userId/topics/:topicId/activities', loginCheck(['partner']), topicLib.hasPermission(TopicMemberUser.LEVELS.read, true), function (req, res, next) {
        return topicActivitiesList(req, res, next)
            .then(function (results) {
                return res.ok(results);
            })
            .catch(next);
    });

    app.get('/api/users/:userId/activities/unread', loginCheck(['partner']), function (req, res, next) {
        var userId = req.user.id;
        var sourcePartnerId = req.query.sourcePartnerId;

        // All partners should see only Topics created by their site, but our own app sees all.
        var wherePartnerTopics = '';
        var wherePartnerGroups = '';
        if (sourcePartnerId) {
            wherePartnerTopics = ' AND t."sourcePartnerId" = :sourcePartnerId ';
            wherePartnerGroups = ' AND g."sourcePartnerId" = :sourcePartnerId ';
        }

        var query = '\
            CREATE OR REPLACE FUNCTION pg_temp.getUserTopics(uuid) \
                RETURNS TABLE("topicId" uuid) \
                AS $$ \
                    SELECT \
                            t.id \
                    FROM "Topics" t \
                        LEFT JOIN ( \
                            SELECT \
                                tmu."topicId", \
                                tmu."userId", \
                                tmu.level::text AS level \
                            FROM "TopicMemberUsers" tmu \
                            WHERE tmu."deletedAt" IS NULL \
                        ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = $1) \
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
                        ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = $1) \
                        LEFT JOIN "Users" c ON (c.id = t."creatorId") \
                    WHERE \
                        t.title IS NOT NULL \
                        ' + wherePartnerTopics + ' \
                        AND COALESCE(tmup.level, tmgp.level, \'none\')::"enum_TopicMemberUsers_level" > \'none\' \
                    ORDER BY t."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL IMMUTABLE ; \
                \
            CREATE OR REPLACE FUNCTION pg_temp.getUserGroups(uuid) \
                RETURNS TABLE("groupId" uuid) \
                AS $$ \
                    SELECT \
                        g.id \
                    FROM "Groups" g \
                        JOIN "GroupMembers" gm ON (gm."groupId" = g.id) \
                        JOIN "Users" c ON (c.id = g."creatorId") \
                        JOIN ( \
                            SELECT "groupId", count("userId") AS "count" \
                            FROM "GroupMembers" \
                            WHERE "deletedAt" IS NULL \
                            GROUP BY "groupId" \
                        ) AS mc ON (mc."groupId" = g.id) \
                        LEFT JOIN ( \
                            SELECT \
                                tmg."groupId", \
                                count(tmg."topicId") AS "count" \
                            FROM "TopicMemberGroups" tmg \
                            WHERE tmg."deletedAt" IS NULL \
                            GROUP BY tmg."groupId" \
                        ) AS gtc ON (gtc."groupId" = g.id) \
                        LEFT JOIN ( \
                            SELECT \
                                tmg."groupId", \
                                tmg."topicId", \
                                t.title \
                            FROM "TopicMemberGroups" tmg \
                                LEFT JOIN "Topics" t ON (t.id = tmg."topicId") \
                            WHERE tmg."deletedAt" IS NULL \
                            ORDER BY t."updatedAt" ASC \
                        ) AS gt ON (gt."groupId" = g.id) \
                    WHERE gm."deletedAt" is NULL \
                        ' + wherePartnerGroups + ' \
                        AND gm."userId" = $1 \
                    GROUP BY g.id \
                    ORDER BY g."updatedAt" DESC, g.id \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getUserTopicActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a, \
                        pg_temp.getUserTopics($1) ut \
                        WHERE \
                        ARRAY[ut."topicId"::text] <@ (a."topicIds") \
                        ORDER BY a."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getUserGroupActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a, \
                        pg_temp.getUserGroups($1) ug \
                        WHERE \
                        ARRAY[ug."groupId"::text] <@ (a."groupIds") \
                        ORDER BY a."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION  pg_temp.getUserActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a \
                        WHERE \
                        ARRAY[$1::text] <@ (a."userIds") \
                        ORDER BY a."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION  pg_temp.getUserAsActorActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a \
                        WHERE \
                            a."actorType" = \'User\' AND a."actorId" = $1::text \
                        ORDER BY a."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            SELECT \
                    COUNT(uac.id) AS count \
                FROM \
                    ( \
                        SELECT \
                            ua.id, \
                            ua.data, \
                            ua."createdAt", \
                            ua."updatedAt", \
                            ua."deletedAt" \
                        FROM \
                            pg_temp.getUserActivities(:userId) ua \
                        UNION \
                        SELECT \
                            guta.id, \
                            guta.data, \
                            guta."createdAt", \
                            guta."updatedAt", \
                            guta."deletedAt" \
                        FROM \
                            pg_temp.getUserTopicActivities(:userId) guta \
                        UNION \
                        SELECT \
                            guga.id, \
                            guga.data, \
                            guga."createdAt", \
                            guga."updatedAt", \
                            guga."deletedAt" \
                        FROM \
                            pg_temp.getUserGroupActivities(:userId) guga \
                        UNION \
                        SELECT \
                            guaaa.id, \
                            guaaa.data, \
                            guaaa."createdAt", \
                            guaaa."updatedAt", \
                            guaaa."deletedAt" \
                        FROM \
                            pg_temp.getUserAsActorActivities(:userId) guaaa \
                    ) uac \
            JOIN (\
                SELECT \
                    va.id, \
                    va.data, \
                    va."createdAt", \
                    va."updatedAt", \
                    va."deletedAt" \
                FROM "Activities" va \
                WHERE \
                    va."actorType" = \'User\' AND va."actorId" = :userId::text \
                AND va.data@>\'{"type": "View"}\' \
                AND va.data#>>\'{object, @type}\' = \'Activity\' \
            ) ua ON ua.id = ua.id \
            WHERE \
                uac.id <> ua.id \
                AND \
                uac."createdAt" > ua."updatedAt" \
            OR \
                uac.id <> ua.id \
                AND \
                uac."updatedAt" > ua."updatedAt" \
            ;';

        return db
            .query(
                query,
                {
                    replacements: {
                        userId: userId,
                        sourcePartnerId: sourcePartnerId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (results) {
                return res.ok(results[0]);
            })
            .catch(next);

    });

    var activitiesList = function (req, res, next, visibility) {
        var limitMax = 50;
        var limitDefault = 10;
        var allowedFilters = ['Topic', 'Group', 'TopicComment', 'Vote', 'User', 'VoteList'];
        var userId;

        if (req.user) {
            userId = req.user.id;
        }
        var sourcePartnerId = req.query.sourcePartnerId;
        var page = parseInt(req.query.page, 10);
        var offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        var limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;

        var includeSql = buildActivityFeedIncludeString(req, visibility);
        var queryFilters = req.query.filter || [];
        if (queryFilters && !Array.isArray(queryFilters)) {
            queryFilters = [queryFilters];
        }

        var filters = queryFilters.filter(function (item, key, input) {
            return allowedFilters.indexOf(item) > -1 && (input.indexOf(item) === key);
        });

        var where = '';

        if (filters.length) {
            var filtersEscaped = filters.map(function (filter) {
                return db.escape(filter);
            });
            where += 'a.data#>>\'{object, @type}\' IN (' + filtersEscaped.join(',') + ') OR a.data#>>\'{object, 0, @type}\' IN (' + filtersEscaped.join(',') + ') ';
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
        var wherePartnerTopics = '';
        var wherePartnerGroups = '';
        if (sourcePartnerId) {
            wherePartnerTopics = ' AND t."sourcePartnerId" = :sourcePartnerId ';
            wherePartnerGroups = ' AND g."sourcePartnerId" = :sourcePartnerId ';
        }

        var query = '\
            ' + activitiesDataFunction + '\
            CREATE OR REPLACE FUNCTION pg_temp.getPublicTopics() \
                RETURNS TABLE("topicId" uuid) \
                AS $$ \
                    SELECT \
                            t.id \
                    FROM "Topics" t \
                        LEFT JOIN "Users" c ON (c.id = t."creatorId") \
                    WHERE \
                        t.title IS NOT NULL \
                        AND t.visibility = \'public\' \
                        ' + wherePartnerTopics + ' \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getPublicGroups() \
                RETURNS TABLE("groupId" uuid) \
                AS $$ \
                    SELECT \
                        g.id \
                    FROM "Groups" g \
                    WHERE g."visibility" = \'public\' \
                        ' + wherePartnerGroups + ' \
                    GROUP BY g.id \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getUserTopics(uuid) \
                RETURNS TABLE("topicId" uuid) \
                AS $$ \
                    SELECT \
                            t.id \
                    FROM "Topics" t \
                        LEFT JOIN ( \
                            SELECT \
                                tmu."topicId", \
                                tmu."userId", \
                                tmu.level::text AS level \
                            FROM "TopicMemberUsers" tmu \
                            WHERE tmu."deletedAt" IS NULL \
                        ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = $1) \
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
                        ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = $1) \
                        LEFT JOIN "Users" c ON (c.id = t."creatorId") \
                    WHERE \
                        t.title IS NOT NULL \
                        ' + wherePartnerTopics + ' \
                        AND COALESCE(tmup.level, tmgp.level, \'none\')::"enum_TopicMemberUsers_level" > \'none\' \
                    ORDER BY t."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
                \
            CREATE OR REPLACE FUNCTION pg_temp.getUserGroups(uuid) \
                RETURNS TABLE("groupId" uuid) \
                AS $$ \
                    SELECT \
                        g.id \
                    FROM "Groups" g \
                        JOIN "GroupMembers" gm ON (gm."groupId" = g.id) \
                        JOIN "Users" c ON (c.id = g."creatorId") \
                        JOIN ( \
                            SELECT "groupId", count("userId") AS "count" \
                            FROM "GroupMembers" \
                            WHERE "deletedAt" IS NULL \
                            GROUP BY "groupId" \
                        ) AS mc ON (mc."groupId" = g.id) \
                        LEFT JOIN ( \
                            SELECT \
                                tmg."groupId", \
                                count(tmg."topicId") AS "count" \
                            FROM "TopicMemberGroups" tmg \
                            WHERE tmg."deletedAt" IS NULL \
                            GROUP BY tmg."groupId" \
                        ) AS gtc ON (gtc."groupId" = g.id) \
                        LEFT JOIN ( \
                            SELECT \
                                tmg."groupId", \
                                tmg."topicId", \
                                t.title \
                            FROM "TopicMemberGroups" tmg \
                                LEFT JOIN "Topics" t ON (t.id = tmg."topicId") \
                            WHERE tmg."deletedAt" IS NULL \
                            ORDER BY t."updatedAt" ASC \
                        ) AS gt ON (gt."groupId" = g.id) \
                    WHERE gm."deletedAt" is NULL \
                        ' + wherePartnerGroups + ' \
                        AND gm."userId" = $1 \
                    GROUP BY g.id \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
                \
            CREATE OR REPLACE FUNCTION pg_temp.getPublicTopicActivities() \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a, \
                        pg_temp.getPublicTopics() ut \
                        WHERE \
                        ARRAY[ut."topicId"::text] <@ (a."topicIds") \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getPublicGroupActivities() \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a, \
                        pg_temp.getPublicGroups() ug \
                        WHERE \
                        ARRAY[ug."groupId"::text] <@ (a."groupIds") \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getUserTopicActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a, \
                        pg_temp.getUserTopics($1) ut \
                        WHERE \
                        ARRAY[ut."topicId"::text] <@ (a."topicIds") \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION pg_temp.getUserGroupActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a, \
                        pg_temp.getUserGroups($1) ug \
                        WHERE \
                        ARRAY[ug."groupId"::text] <@ (a."groupIds") \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION  pg_temp.getUserActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a \
                        WHERE \
                        ARRAY[$1::text] <@ (a."userIds") \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            CREATE OR REPLACE FUNCTION  pg_temp.getUserAsActorActivities(uuid) \
                RETURNS TABLE ("id" uuid, data jsonb, "createdAt" timestamp with time zone, "updatedAt" timestamp with time zone, "deletedAt" timestamp with time zone) \
                AS $$ \
                    SELECT \
                        a.id, \
                        a.data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a \
                        WHERE \
                            a."actorType" = \'User\' AND a."actorId" = $1::text \
                ; $$ \
            LANGUAGE SQL IMMUTABLE; \
            \
            SELECT \
                ad.* \
            FROM \
                ( \
                    SELECT a.* FROM \
                    ( \
                    ' + includeSql + ' \
                    ) a \
                    ' + where + ' \
                    ORDER BY a."updatedAt" DESC \
                    LIMIT :limit OFFSET :offset \
                ) uac \
            JOIN pg_temp.getActivityData(uac.id) ad ON ad."id" = uac.id \
                ORDER BY ad."updatedAt" DESC \
            ;';

        return db
            .transaction(function (t) {
                if (userId) {
                    var activity = Activity.build({
                        data: {
                            offset: offset,
                            limit: limit
                        }
                    });
                }

                return db
                    .query(
                        query,
                        {
                            replacements: {
                                userId: userId,
                                sourcePartnerId: sourcePartnerId,
                                limit: limit,
                                offset: offset
                            },
                            type: db.QueryTypes.SELECT,
                            raw: true,
                            nest: true,
                            transaction: t
                        }
                    ).then(function (results) {
                        if (!userId) {
                            return results;
                        }

                        return cosActivities
                            .viewActivityFeedActivity(
                                activity,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                req.method + ' ' + req.path,
                                t
                            )
                            .then(function () {
                                return results;
                            });
                    });
            }).then(function (results) {
                var finalResults = parseActivitiesResults(results);

                return res.ok(finalResults);
            })
            .catch(next);
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

    var groupActivitiesList = function (req, res, next, visibility) {
        var limitMax = 50;
        var limitDefault = 10;
        var groupId = req.params.groupId;
        var userId = null;
        if (req.user && !visibility) {
            userId = req.user.id;
        }
        var offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        var limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        var visibilityCondition = '';
        if (visibility) {
            visibilityCondition = 'g.visibility = :visibility AND';
        }

        if (limit > limitMax) limit = limitDefault;

        return db.transaction(function (t) {
            var activity = Activity.build({
                data: {
                    offset: offset,
                    limit: limit
                }
            });

            return db
                .query('\
                ' + activitiesDataFunction + '\
                    SELECT \
                        ad.* \
                    FROM \
                    ( \
                        SELECT a.id \
                        FROM \
                        "Activities" a \
                        JOIN "Groups" g ON g.id = :groupId \
                        WHERE \
                        ' + visibilityCondition + ' \
                        ARRAY[:groupId] <@  a."groupIds" \
                        OR \
                        a.data@>\'{"type": "View"}\' \
                        AND \
                        a."actorType" = \'User\' \
                        AND \
                        a."actorId" = :userId \
                        AND \
                        a.data#>>\'{object, @type}\' = \'Activity\' \
                        ORDER BY a."updatedAt" DESC \
                        LIMIT :limit OFFSET :offset \
                    ) \
                    JOIN pg_temp.getActivityData(a.id) ON ad.id = a.id \
                    ORDER BY ad."updatedAt" DESC \
            ;', {
                    replacements: {
                        groupId: groupId,
                        userId: userId,
                        visibility: visibility,
                        limit: limit,
                        offset: offset
                    },
                    type: db.QueryTypes.SELECT,
                    transaction: t,
                    nest: true,
                    raw: true
                })
                .then(function (results) {
                    if (userId && !visibility) {
                        return cosActivities
                            .viewActivityFeedActivity(
                                activity,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                req.method + ' ' + req.path,
                                t
                            )
                            .then(function () {
                                return parseActivitiesResults(results);
                            });
                    }

                    return parseActivitiesResults(results);
                });
        });
    };

    app.get('/api/groups/:groupId/activities', function (req, res, next) {
        return groupActivitiesList(req, res, next, 'public')
            .then(function (results) {
                if (results && results.length && results[0]) {
                    return res.ok(results);
                } else {
                    return res.notFound();
                }
            })
            .catch(next);
    });

    app.get('/api/users/:userId/groups/:groupId/activities', loginCheck(['partner']), groupLib.hasPermission(GroupMember.LEVELS.read, true), function (req, res, next) {
        return groupActivitiesList(req, res, next)
            .then(function (results) {
                return res.ok(results);
            })
            .catch(next);
    });
};
