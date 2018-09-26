'use strict';

/**
 * Activity API-s 
 */

module.exports = function (app) {
    var db = app.get('db');
    var _ = app.get('lodash');
    var cosActivities = app.get('cosActivities');
    var loginCheck = app.get('middleware.loginCheck');
    var topicLib = require('./topic')(app);
    var groupLib = require('./group')(app);

    var Activity = app.get('models.Activity');
    var Group = app.get('models.Group');
    var User = app.get('models.User');
    var Topic = app.get('models.Topic');
    var GroupMember = app.get('models.GroupMember');
    var TopicMember = app.get('models.TopicMember');
    var TopicMemberUser = app.get('models.TopicMemberUser');
    var TopicMemberGroup = app.get('models.TopicMemberGroup');
    var VoteUserContainer = app.get('models.VoteUserContainer');

    /**
     * Read (List) public Topic Activities
     */

    var activitiesWithDataJoin = 'SELECT \
        a.id, \
        a.data, \
        a."createdAt", \
        a."updatedAt", \
        a."deletedAt", \
        u.id as "actor.id", \
        a.data#>>\'{actor, type}\' as "actor.type", \
        u.name as "actor.name", \
        u.company as "actor.company", \
        COALESCE(a.data#>>\'{actor, level}\') as "actor.level", \
        COALESCE(go.id, tobj.id, uo.id) AS "object.id", \
        COALESCE(go.name, uo.name) AS "object.name", \
        COALESCE(tobj.title) AS "object.title", \
        a.data#>>\'{object, @type}\' AS "object.@type", \
        COALESCE(go."creatorId", tobj."creatorId") AS "object.creatorId", \
        COALESCE(go."parentId") AS "object.parentId", \
        COALESCE(tobj.status) AS "object.status", \
        COALESCE(go.visibility::text, tobj.visibility::text) AS "object.visibility", \
        COALESCE(tobj."sourcePartnerId", go."sourcePartnerId") AS "object.sourcePartnerId", \
        COALESCE(tobj."sourcePartnerObjectId") AS "object.sourcePartnerObjectId", \
        COALESCE(tobj."categories") AS "object.categories", \
        COALESCE(tobj."tokenJoin") AS "object.tokenJoin", \
        COALESCE(tobj."padUrl") AS "object.padUrl", \
        COALESCE(tobj."endsAt") AS "object.endsAt", \
        COALESCE(tobj.hashtag) AS "object.hashtag", \
        COALESCE(go."createdAt"::text, tobj."createdAt"::text, tvco."createdAt"::text) AS "object.createdAt", \
        COALESCE(go."updatedAt"::text, tobj."updatedAt"::text, tvco."updatedAt"::text) AS "object.updatedAt", \
        COALESCE(go."deletedAt"::text, tobj."deletedAt"::text, tvco."deletedAt"::text) AS "object.deletedAt", \
        COALESCE(uo.company) AS "object.company", \
        COALESCE(tvco."userId") AS "object.userId", \
        COALESCE(tvco."voteId") AS "object.voteId", \
        COALESCE(tvco."topicId") AS "object.topicId", \
        COALESCE(tvco."topicTitle") AS "object.topicTitle", \
        COALESCE(torig.id, origg.id) AS "origin.id", \
        COALESCE(origg.name) AS "origin.name", \
        COALESCE(torig.title) AS "origin.title", \
        COALESCE(torig.status) AS "origin.status", \
        COALESCE(torig.categories) AS "origin.categories", \
        COALESCE(torig."tokenJoin") AS "origin.tokenJoin", \
        COALESCE(torig."padUrl") AS "origin.padUrl", \
        COALESCE(torig."endsAt") AS "origin.endsAt", \
        COALESCE(torig.hashtag) AS "origin.hashtag", \
        a.data#>>\'{origin, @type}\' AS "origin.@type", \
        COALESCE(torig."creatorId", origg."creatorId") AS "origin.creatorId", \
        COALESCE(origg."parentId") AS "origin.parentId", \
        COALESCE(torig.visibility::text, origg.visibility::text) AS "origin.visibility", \
        COALESCE(torig."sourcePartnerId", origg."sourcePartnerId") AS "origin.sourcePartnerId", \
        COALESCE(torig."sourcePartnerObjectId") AS "origin.sourcePartnerObjectId", \
        COALESCE(torig."createdAt"::text, origg."createdAt"::text, tmuorig."createdAt"::text, gmuorig."createdAt"::text, tmgorig."createdAt"::text) AS "origin.createdAt", \
        COALESCE(torig."updatedAt"::text, origg."updatedAt"::text, tmuorig."updatedAt"::text, gmuorig."updatedAt"::text, tmgorig."updatedAt"::text) AS "origin.updatedAt", \
        COALESCE(torig."deletedAt"::text, origg."deletedAt"::text, tmuorig."deletedAt"::text, gmuorig."deletedAt"::text, tmgorig."deletedAt"::text) AS "origin.deletedAt", \
        COALESCE(tmuorig."level", tmgorig."level", gmuorig."level") AS "origin.level", \
        COALESCE(tmuorig."userId", gmuorig."userId") AS "origin.userId", \
        COALESCE(gmuorig."groupId", tmgorig."groupId") AS "origin.groupId", \
        COALESCE(tmuorig."topicId", tmgorig."topicId") AS "origin.topicId", \
        COALESCE(tmuorig."topicTitle", tmgorig."topicTitle") AS "origin.topicTitle", \
        COALESCE(gmuorig."groupName", tmgorig."topicTitle") AS "origin.groupName", \
        COALESCE(tmuorig."userName", gmuorig."userName") AS "origin.userName", \
        COALESCE(targg.id, targt.id, targtc.id) AS "target.id", \
        COALESCE(targg.name, uo.name) AS "target.name", \
        COALESCE(targt.title) AS "target.title", \
        COALESCE(targtc.subject) AS "target.subject", \
        COALESCE(targtc.text) AS "target.text", \
        a.data#>>\'{target, @type}\' AS "target.@type", \
        COALESCE(targg."creatorId", targt."creatorId", targtc."creatorId") AS "target.creatorId", \
        COALESCE(targtc."topicId") AS "target.topicId", \
        COALESCE(targg."parentId", targtc."parentId") AS "target.parentId", \
        COALESCE(targtc."parentVersion") AS "target.parentVersion", \
        COALESCE(targt.status) AS "target.status", \
        COALESCE(targg.visibility::text, targt.visibility::text) AS "target.visibility", \
        COALESCE(targt."sourcePartnerId", targg."sourcePartnerId") AS "target.sourcePartnerId", \
        COALESCE(targt."sourcePartnerObjectId") AS "target.sourcePartnerObjectId", \
        COALESCE(targt."categories") AS "target.categories", \
        COALESCE(targt."tokenJoin") AS "target.tokenJoin", \
        COALESCE(targt."padUrl") AS "target.padUrl", \
        COALESCE(targt."endsAt") AS "target.endsAt", \
        COALESCE(targt."hashtag") AS "target.hashtag", \
        COALESCE(targtc."deletedById") AS "target.deletedById", \
        COALESCE(targtc."deletedReasonType"::text) AS "target.deletedReasonType ", \
        COALESCE(targtc."deletedReasonText") AS "target.deletedReasonText", \
        COALESCE(targtc."deletedByReportId") AS "target.deletedByReportId", \
        COALESCE(targtc."edits") AS "target.edits", \
        COALESCE(targg."createdAt"::text, targt."createdAt"::text, targtc."createdAt"::text) AS "target.createdAt", \
        COALESCE(targg."updatedAt"::text, targt."updatedAt"::text, targtc."updatedAt"::text) AS "target.updatedAt", \
        COALESCE(targg."deletedAt"::text, targt."deletedAt"::text, targtc."deletedAt"::text) AS "target.deletedAt" \
        FROM  \
            "Activities" a \
        LEFT JOIN \
            "Users" u ON u.id::text = a.data#>>\'{actor, id}\' \
        LEFT JOIN \
            "Topics" tobj ON a.data#>>\'{object, @type}\' = \'Topic\' AND tobj.id::text = a.data#>>\'{object, id}\' \
        LEFT JOIN \
            "Groups" go ON a.data#>>\'{object, @type}\' = \'Group\' AND go.id::text = a.data#>>\'{object, id}\' \
        LEFT JOIN \
            "Users" uo ON a.data#>>\'{object, @type}\' = \'User\' AND uo.id::text = a.data#>>\'{object, id}\' \
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
            "Groups" origg ON a.data#>>\'{origin, @type}\' = \'Group\' AND origg.id::text = a.data#>>\'{origin, id}\' \
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
            "Groups" targg ON a.data#>>\'{target, @type}\' = \'Group\' AND targg.id::text = a.data#>>\'{target, id}\' \
        LEFT JOIN \
            "Topics" targt ON a.data#>>\'{target, @type}\' = \'Topic\' AND targt.id::text = a.data#>>\'{target, id}\' \
        LEFT JOIN ( \
            SELECT \
                a.id AS "activityId", \
                c.*, \
                tc."topicId" \
                FROM "Activities" a \
                JOIN "Comments" c ON a.data#>>\'{target, @type}\' = \'Comment\' AND c."id"::text = a.data#>>\'{target, id}\' \
                JOIN "TopicComments" tc ON tc."commentId" = c.id \
        ) targtc ON a.data#>>\'{target, @type}\' = \'Comment\' AND targtc."id"::text = a.data#>>\'{target, id}\' \
        LEFT JOIN \
            "Topics" torig ON a.data#>>\'{origin, @type}\' = \'Topic\' AND torig.id::text = a.data#>>\'{origin, id}\' \
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
                            if (field !== 'origin') {
                                object = Group.build(activity[field]).toJSON();
                                object['@type'] = activity[field]['@type'];
                                object.createdAt = activity[field].createdAt;
                                object.creatorId = activity[field].creatorId;
                                object.updatedAt = activity[field].updatedAt;
                                object.deletedAt = activity[field].deletedAt;
                                object.sourcePartnerId = activity[field].sourcePartnerId;
                                delete object.creator;
                            }
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
                    SELECT \
                        ad.* \
                    FROM \
                        "Activities" a \
                        JOIN "Topics" t ON t.id = :topicId \
                        JOIN (' + activitiesWithDataJoin + ') ad ON ad."id" = a.id \
                        WHERE \
                        ' + visibilityCondition + ' \
                        ARRAY[:topicId] <@  a."topicIds" \
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

    app.get('/api/users/:userId/topics/:topicId/activities', loginCheck(['partner']), topicLib.hasPermission(TopicMember.LEVELS.read, true), function (req, res, next) {
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
        var allowedFilters = ['Topic', 'Group', 'TopicComment', 'Vote', 'User'];
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
            where += 'uac.data#>>\'{object, @type}\' IN (' + filtersEscaped.join(',') + ')';
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
                    ORDER BY t."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL; \
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
                    ORDER BY g."updatedAt" DESC, g.id \
                ; $$ \
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
                        ORDER BY a."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL; \
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
                        ORDER BY a."updatedAt" DESC \
                ; $$ \
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
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
            LANGUAGE SQL; \
            \
            SELECT \
                    ad.* \
                FROM \
                    ( \
                    ' + includeSql + ' \
                    ) uac \
                JOIN ( \
                    ' + activitiesWithDataJoin + ') ad ON ad.id = uac.id \
                ' + where + ' \
                ORDER BY uac."updatedAt" DESC \
                LIMIT :limit OFFSET :offset \
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
                    SELECT \
                        ad.* \
                    FROM \
                        "Activities" a \
                        JOIN "Groups" g ON g.id = :groupId \
                        JOIN ( \
                            ' + activitiesWithDataJoin + ') ad ON ad.id = a.id \
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
