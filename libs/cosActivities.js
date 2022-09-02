'use strict';

const diff = require('json-patch-gen');

module.exports = function (app) {
    const _ = app.get('lodash');
    const models = app.get('models');
    const db = models.sequelize;
    const uuid = app.get('uuid');
    const logger = app.get('logger');
    const notifications = app.get('notifications');
    const Sequelize = require('sequelize');
    const { injectReplacements } = require('sequelize/lib/utils/sql');

    const Activity = models.Activity;

    const _setExtraProperties = function (inputObject, targetObject) {
        if (!targetObject.topicId && inputObject.topicId) {
            targetObject.topicId = inputObject.topicId;
        }
        if (!targetObject.groupId && inputObject.groupId) {
            targetObject.groupId = inputObject.groupId;
        }
        if (!targetObject.userId && inputObject.userId) {
            targetObject.userId = inputObject.userId;
        }

        return targetObject;
    };

    const _saveActivity = async function (activity, transaction) { //eslint-disable-line complexity
        const activityObject = {
            data: activity
        };

        activityObject.topicIds = [];
        activityObject.groupIds = [];
        activityObject.userIds = [];

        // TODO: Think about this, we MAY want code that looks for deep properties and adds them to the relevant arrays
        if (activity.object) {
            if (activity.object['@type'] === 'Topic') {
                activityObject.topicIds.push(activity.object.id);
            } else if (activity.object['@type'] === 'Group') {
                activityObject.groupIds.push(activity.object.id);
            } else if (activity.object['@type'] === 'User') {
                activityObject.userIds.push(activity.object.id);
            }

            if (activity.object.type === 'Invite') {
                activityObject.userIds.push(activity.object.actor.id);
                if (activity.object.object['@type'] === 'Topic') {
                    activityObject.topicIds.push(activity.object.object.id);
                }
            }

            if (activity.object.topicId) {
                activityObject.topicIds.push(activity.object.topicId);
            }
            if (activity.object.groupId) {
                activityObject.groupIds.push(activity.object.groupId);
            }
            if (activity.object.userId) {
                activityObject.userIds.push(activity.object.userId);
            }
            if ('email' in activity.object) {
                delete activityObject.data.object.email;
            }
        }

        if (activity.origin) {
            if (activity.origin['@type'] === 'Topic') {
                activityObject.topicIds.push(activity.origin.id);
            } else if (activity.origin['@type'] === 'Group') {
                activityObject.groupIds.push(activity.origin.id);
            } else if (activity.origin['@type'] === 'User') {
                activityObject.userIds.push(activity.origin.id);
            }
            if (activity.origin.topicId) {
                activityObject.topicIds.push(activity.origin.topicId);
            }
            if (activity.origin.groupId) {
                activityObject.groupIds.push(activity.origin.groupId);
            }
            if (activity.origin.userId) {
                activityObject.userIds.push(activity.origin.userId);
            }
            if ('email' in activity.origin) {
                delete activityObject.data.origin.email;
            }
        }

        if (activity.target) {
            if (activity.target['@type'] === 'Topic') {
                activityObject.topicIds.push(activity.target.id);
            } else if (activity.target['@type'] === 'Group') {
                activityObject.groupIds.push(activity.target.id);
            } else if (activity.target['@type'] === 'User') {
                activityObject.userIds.push(activity.target.id);
            }
            if (activity.target.topicId) {
                activityObject.topicIds.push(activity.target.topicId);
            }
            if (activity.target.groupId) {
                activityObject.groupIds.push(activity.target.groupId);
            }
            if (activity.target.userId) {
                activityObject.userIds.push(activity.target.userId);
            }
            if ('email' in activity.target) {
                delete activityObject.data.target.email;
            }
        }

        if (activity.actor) {
            activityObject.actorType = activity.actor.type;
            activityObject.actorId = activity.actor.id;
            if (activity.actor.type === 'User' || activity.actor.type === 'Moderator') {
                activityObject.userIds.push(activity.actor.id);
            }
        }

        activityObject.topicIds = Array.from(new Set(activityObject.topicIds));
        activityObject.groupIds = Array.from(new Set(activityObject.groupIds));
        activityObject.userIds = Array.from(new Set(activityObject.userIds));
        activityObject.createdAt = (new Date()).toISOString();
        activityObject.updatedAt = (new Date()).toISOString();

        const activitySaved = await Activity
            .create(
                activityObject,
                {
                    transaction: transaction
                }
            );

        return notifications.sendActivityNotifications(activitySaved);
    };

    const _getInstanceChangeSet = function (instance) {
        const currentValues = {};
        const previousValues = instance.previous();

        var changed = instance.changed();
        if (!changed) {
            return [];
        }
        changed.forEach(function (field) {
            currentValues[field] = instance.dataValues[field];
        });

        // Diff is only performed for JSON objects, thus if we put regular JS objects to it, it MAY result in invalid results
        // For example Date comparisons will fail if both sides have a Date object.
        const previousValuesJson = JSON.parse(JSON.stringify(previousValues));
        const currentValuesJson = JSON.parse(JSON.stringify(currentValues));

        return diff(previousValuesJson, currentValuesJson);
    };

    const _createActivity = function (instance, target, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally created a note",
        // "type": "Create",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Note",
        // "name": "A Simple Note",
        // "content": "This is a simple note"
        // }
        // }

        let object;

        if (Array.isArray(instance)) {
            object = [];
            instance.forEach(function (elem) {
                const o = _.cloneDeep(elem.toJSON());
                _setExtraProperties(instance, o);
                o['@type'] = elem.constructor.name;
                object.push(o);
            });
        } else {
            object = instance.toJSON();
            _setExtraProperties(instance, object);
            object['@type'] = instance.constructor.name;
        }

        const activity = {
            type: Activity.TYPES.create,
            object: object,
            actor: actor
        };

        if (target) {
            let targetObject = target.toJSON();
            targetObject['@type'] = target.constructor.name;
            _setExtraProperties(target, targetObject);
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _updateTopicDescriptionActivity = async function (instance, target, actor, fields, context, transaction) {

        const originPrevious = instance.previous();
        const origin = _.clone(instance.toJSON());

        _.mapValues(originPrevious, function (val, key) {
            origin[key] = val;
        });

        if (fields && Array.isArray(fields)) {
            Object.keys(origin).forEach(function (field) {
                if (fields.indexOf(field) === -1) {
                    delete origin[field];
                }
            });
        }

        const changeSet = _getInstanceChangeSet(instance);

        if (changeSet.length === 0) {
            return Promise.resolve();
        }

        changeSet.forEach(function (change, key) {
            if (change.path === '/description') {
                change.value = null;
                changeSet[key] = change;
            }
        });

        origin.description = null;
        origin['@type'] = instance.constructor.name;

        const object = _.clone(origin);

        _setExtraProperties(instance, object);
        const activity = {
            type: Activity.TYPES.update,
            object: origin,
            origin: origin,
            result: changeSet,
            actor: actor
        };

        if (target) {
            const targetObject = target.toJSON();
            _setExtraProperties(target, targetObject);
            targetObject['@type'] = target.constructor.name;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }
        const dataString = JSON.stringify(activity);

        const sqlFunctionBody = injectReplacements(`DECLARE passed RECORD;
        BEGIN
            CASE
            WHEN ($1 = 'true')
            THEN
                RETURN QUERY
                INSERT INTO "Activities" AS act
                (id, data, "actorType", "actorId", "topicIds", "userIds", "createdAt", "updatedAt")
                VALUES
                (:id, to_jsonb(:data::json), 'User', :userId , ARRAY[:topicId], ARRAY[:userId], NOW(), NOW())
                RETURNING act.id, act.data, act."actorId", act."topicIds", act."userIds", act."groupIds", act."createdAt", act."updatedAt";
            ELSE
                RETURN QUERY
                UPDATE
                    "Activities" AS act
                SET
                    data = to_jsonb(:data::json),
                    "updatedAt" = NOW()
                WHERE act.id = (
                    SELECT id FROM "Activities" a
                    WHERE
                        a."actorType" = 'User'
                        AND
                        a."actorId" = :userId
                        AND a.data@>'{"type": "Update"}'
                        AND ARRAY[:topicId] <@ a."topicIds"
                        AND (a.data#>>'{result, 0, path}' = '/description' OR a.data#>>'{result, 0, path}' = '/title')
                        ORDER BY a."updatedAt" DESC LIMIT 1
                )
                RETURNING act.id, act.data, act."actorId", act."topicIds", act."userIds", act."groupIds", act."createdAt", act."updatedAt";
            END CASE;`, Sequelize.postgres, {
                    id: uuid.v4(),
                    data: dataString,
                    topicId: instance.id,
                    userId: actor.id
            }).replace(/\\/gi, '');

        const queryString = injectReplacements(`WITH checker AS (SELECT (
            SELECT COUNT(*) = 0
                FROM "Activities"
                WHERE
                ARRAY[:topicId] <@ "topicIds"
                AND
                    data@>'{"type": "Update"}'
                AND (
                    data#>>'{result , 0, path}' = '/description'
                    OR data#>>'{result, 0, path}' = '/title'
                )
                AND "actorType" = 'User'
                AND "actorId" = :userId
            ) OR (
            SELECT
                    COUNT(*) > 0
                FROM "Activities"
                WHERE
                (
                    ARRAY[:topicId] <@ "topicIds"
                )
                AND
                (
                    NOT data@>'{"type": "Update"}'
                    OR
                    data@>'{"type": "Update"}'
                        AND (
                            data#>>'{result , 0, path}' != '/description'
                            AND
                            data#>>'{result, 0, path}' != '/title')
                )
                AND "updatedAt" > (
                    SELECT
                        "updatedAt"
                    FROM "Activities"
                    WHERE
                        data@>'{"type": "Update"}'
                        AND (
                            data#>>'{result , 0, path}' = '/description'
                            OR
                            data#>>'{result, 0, path}' = '/title'
                        )
                    AND "actorType" = 'User'
                    AND "actorId" = :userId
                    ORDER BY "updatedAt"
                    DESC LIMIT 1
                )
            ) AS isnew
        )
        SELECT
            checker.isnew,
            t."act_id" as "id",
            t."act_data" as "data",
            t."act_actorId" as "actorId",
            t."act_topicIds" as "topicIds",
            t."act_userIds" as "userIds",
            t."act_groupIds" as "groupIds",
            t."act_createdAt" as "createdAt",
            t."act_updatedAt" as "updatedAt"
            FROM checker JOIN pg_temp.setTopicActivityData(checker.isnew) t ON checker.isnew=checker.isnew;
        ;`, Sequelize.postgres ,{
            id: uuid.v4(),
            data: dataString,
            topicId: instance.id,
            userId: actor.id
        }).replace(/\\/gi, '');

        const act = await db
            .query(
                `CREATE OR REPLACE FUNCTION pg_temp.setTopicActivityData(boolean)
                RETURNS TABLE("act_id" uuid, "act_data" jsonb, "act_actorId" text, "act_topicIds" text[], "act_userIds" text[], "act_groupIds" text[], "act_createdAt"  timestamp with time zone, "act_updatedAt"  timestamp with time zone)
                AS $$
                ${sqlFunctionBody}
                END $$
                LANGUAGE plpgsql;
                ${queryString}
                `,
                {
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    transaction: transaction
                }
            );


        if (act[0].isnew) {
           await notifications.sendActivityNotifications(act[0]);
        }

    };

    const _updateActivity = function (instance, target, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally updated her note",
        // "type": "Update",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": "http://example.org/notes/1"

        const originPrevious = instance.previous();
        const origin = instance.toJSON();

        _.mapValues(originPrevious, function (val, key) {
            origin[key] = val;
        });

        const changeSet = _getInstanceChangeSet(instance);

        if (changeSet.length === 0) {
            logger.warn('No changes detected for instance', context);
            return Promise.resolve();
        }

        origin['@type'] = instance.constructor.name;
        const object = _.clone(origin);
        _setExtraProperties(instance, object);

        const activity = {
            type: Activity.TYPES.update,
            object,
            origin,
            result: changeSet,
            actor
        };

        if (target) {
            const targetObject = target.toJSON();
            _setExtraProperties(target, targetObject);
            targetObject['@type'] = target.constructor.name;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _addActivity = function (instance, actor, origin, target, context, transaction) {

        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally added a picture of her cat to her cat picture collection",
        // "type": "Add",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Image",
        // "name": "A picture of my cat",
        // "url": "http://example.org/img/cat.png"
        // },
        // "origin": {
        // "type": "Collection",
        // "name": "Camera Roll"
        // },
        // "target": {
        // "type": "Collection",
        // "name": "My Cat Pictures"
        // }
        // }
        const object = instance.toJSON();
        object['@type'] = instance.constructor.name;
        _setExtraProperties(instance, object);

        const activity = {
            type: Activity.TYPES.add,
            object: object,
            actor: actor
        };

        if (origin) {
            const originObject = origin.toJSON();
            originObject['@type'] = origin.constructor.name;
            activity.origin = originObject;
        }

        if (target) {
            const targetObject = target.toJSON();
            _setExtraProperties(target, targetObject);
            targetObject['@type'] = target.constructor.name;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _deleteActivity = function (instance, origin, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally deleted a note",
        // "type": "Delete",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": "http://example.org/notes/1",
        // "origin": {
        // "type": "Collection",
        // "name": "Sally's Notes"
        // }
        // }

        const object = instance.toJSON();
        _setExtraProperties(instance, object);

        object['@type'] = instance.constructor.name;

        const activity = {
            type: Activity.TYPES.delete,
            object: object,
            actor: actor
        };

        if (origin) {
            const originObject = origin.toJSON();
            originObject['@type'] = origin.constructor.name;

            activity.origin = originObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _inviteActivity = function (instance, target, actor, context, transaction) {
        /*
         // https://www.w3.org/TR/activitystreams-vocabulary/#dfn-invite

         {
         "@context": "https://www.w3.org/ns/activitystreams",
         "summary": "Sally invited John and Lisa to a party",
         "type": "Invite",
         "actor": {
         "type": "Person",
         "name": "Sally"
         },
         "object": {
         "type": "Event",
         "name": "A Party"
         },
         "target": [
         {
         "type": "Person",
         "name": "John"
         },
         {
         "type": "Person",
         "name": "Lisa"
         }
         ]
         }
         */

        const _object = instance.toJSON();

        _setExtraProperties(instance, _object);

        _object['@type'] = instance.constructor.name;

        var activity = {
            type: Activity.TYPES.invite,
            object: _object,
            actor: actor
        };

        if (target) {
            const targetObject = target.toJSON();
            _setExtraProperties(target, targetObject);
            targetObject['@type'] = target.constructor.name;
            if (target.dataValues.level) {
                targetObject.level = target.dataValues.level;
            }
            if (target.dataValues.inviteId) {
                targetObject.inviteId = target.dataValues.inviteId;
            }
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };


    const _acceptActivity = function (instance, actor, inviteActor, inviteObject, context, transaction) {
        //https://www.w3.org/TR/activitystreams-vocabulary/#dfn-accept
        //{
        //    "@context": "https://www.w3.org/ns/activitystreams",
        //    "summary": "Sally accepted an invitation to a party",
        //    "type": "Accept",
        //    "actor": {
        //        "type": "Person",
        //        "name": "Sally"
        //    },
        //    "object": {
        //        "type": "Invite",
        //            "actor": "http://john.example.org",
        //            "object": {
        //                "type": "Event",
        //                "name": "Going-Away Party for Jim"
        //        }
        //    }
        //}

        const object = {
            type: 'Invite',
            id: instance.id,
            actor: inviteActor,
            object: inviteObject.toJSON()
        };
        _setExtraProperties(instance, object);

        const activity = {
            type: 'Accept',
            actor: actor,
            context: context,
            object
        };

        activity.object.object['@type'] = inviteObject.constructor.name;

        return _saveActivity(activity, transaction);
    };

    const _leaveActivity = function (instance, actor, context, transaction) {

        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally left a group",
        // "type": "Leave",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Group",
        // "name": "A Simple Group"
        // }
        // }

        var object = instance.toJSON();
        if (!object.topicId && instance.topicId) {
            object.topicId = instance.topicId;
        }
        if (!object.groupId && instance.groupId) {
            object.groupId = instance.groupId;
        }
        if (!object.userId && instance.userId) {
            object.userId = instance.userId;
        }
        object['@type'] = instance.constructor.name;

        var activity = {
            type: Activity.TYPES.leave,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _viewActivity = function (instance, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally read an article",
        // "type": "View",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Article",
        // "name": "What You Should Know About Activity Streams"
        // }
        // }

        const object = instance.toJSON();
        _setExtraProperties(instance, object);
        object['@type'] = instance.constructor.name;

        const activity = {
            type: Activity.TYPES.view,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _viewActivityFeedActivity = function (instance, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally read an article",
        // "type": "View",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Article",
        // "name": "What You Should Know About Activity Streams"
        // }
        // }

        const object = instance.toJSON();
        _setExtraProperties(instance, object);
        if (object.offset > 0) {
            return Promise.resolve();
        }
        object['@type'] = instance.constructor.name;

        const activity = {
            type: Activity.TYPES.view,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        const dataString = JSON.stringify(activity);
        const queryString = injectReplacements(`BEGIN
            CASE
                WHEN (
                    SELECT
                        (
                        SELECT COUNT(*) = 0
                            FROM "Activities"
                            WHERE
                                data@>'{"type": "View"}'
                            AND
                                "actorType" = 'User'
                            AND
                                "actorId" = :userId
                            AND
                                data#>>'{object, @type}' = 'Activity'
                        )
                    )
            THEN
                INSERT INTO "Activities"
                (id, data, "userIds", "actorType", "actorId", "createdAt", "updatedAt")
                VALUES
                (:id, to_jsonb(:data::json), ARRAY[:userId], 'User', :userId, NOW(), NOW());
            ELSE
            UPDATE
                "Activities"
                SET
                    data = to_jsonb(:data::json),
                    "updatedAt" = NOW()
            WHERE id = (
                SELECT id FROM "Activities"
                WHERE
                        "actorType" = 'User'
                    AND
                        "actorId" = :userId
                    AND
                        data@>'{"type": "View"}'
                    AND
                        data#>>'{object, @type}' = 'Activity'
                    ORDER BY "updatedAt" DESC LIMIT 1
            );
            END CASE;
        END`, Sequelize.postgres, {
            id: uuid.v4(),
            data: dataString,
            topicId: instance.id,
            userId: actor.id
        }).replace(/\\/gi, '');
        return db
            .query(`DO $$ ${queryString} $$;`,
            {
                type: db.QueryTypes.INSERT,
                raw: true,
                transaction: transaction
            });
    };

    const _joinActivity = function (instance, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally joined a group",
        // "type": "Join",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Group",
        // "name": "A Simple Group"
        // }
        // }

        const object = instance.toJSON();
        _setExtraProperties(instance, object);
        object['@type'] = instance.constructor.name;

        const activity = {
            type: Activity.TYPES.join,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _replyActivity = function (instance, inReplyTo, target, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally created a note",
        // "type": "Create",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Note",
        // "name": "A Simple Note",
        // "content": "This is a simple note"
        // },
        // "inReplyTo": {
        // "type": "Note",
        // "name": "Write something",
        // "content", "please write something"
        // }
        // }

        let object;

        if (Array.isArray(instance)) {
            object = [];
            instance.forEach(function (elem) {
                const o = _.cloneDeep(elem.toJSON());
                _setExtraProperties(instance, o);
                o['@type'] = elem.constructor.name;
                object.push(o);
            });
        } else {
            object = instance.toJSON();
            _setExtraProperties(instance, object);
            object['@type'] = instance.constructor.name;

        }

        const replyTo = inReplyTo.toJSON();
        replyTo['@type'] = inReplyTo.constructor.name;

        const activity = {
            type: Activity.TYPES.create,
            object: object,
            inReplyTo: replyTo,
            actor: actor
        };

        if (target) {
            const targetObject = target.toJSON();
            _setExtraProperties(target, targetObject);
            targetObject['@type'] = target.constructor.name;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    const _downloadFinalContainerActivity = function (instance, actor, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally read an article",
        // "type": "View",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": {
        // "type": "Article",
        // "name": "What You Should Know About Activity Streams"
        // }
        // }

        const object = instance.toJSON ? instance.toJSON() : instance;
        _setExtraProperties(instance, object);
        object['@type'] = 'VoteFinalContainer';

        const activity = {
            type: Activity.TYPES.view,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    return {
        getInstanceChangeSet: _getInstanceChangeSet,
        createActivity: _createActivity,
        updateActivity: _updateActivity,
        updateTopicDescriptionActivity: _updateTopicDescriptionActivity,
        deleteActivity: _deleteActivity,
        inviteActivity: _inviteActivity,
        acceptActivity: _acceptActivity,
        leaveActivity: _leaveActivity,
        addActivity: _addActivity,
        viewActivity: _viewActivity,
        viewActivityFeedActivity: _viewActivityFeedActivity,
        joinActivity: _joinActivity,
        replyActivity: _replyActivity,
        downloadFinalContainerActivity: _downloadFinalContainerActivity,
    };
};
