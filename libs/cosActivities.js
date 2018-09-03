'use strict';

var diff = require('json-patch-gen');

module.exports = function (app) {
    var Activity = app.get('models.Activity');
    var Promise = app.get('Promise');
    var _ = app.get('lodash');
    var db = app.get('db');
    var uuid = app.get('uuid');
    var moment = app.get('moment');

    var _saveActivity = function (activity, transaction) { //eslint-disable-line complexity
        var activityObject = {
            data: activity
        };

        activityObject.topicIds = [];
        activityObject.groupIds = [];
        activityObject.userIds = [];

        if (activity.object) {
            if (activity.object['@type'] === 'Topic') {
                activityObject.topicIds.push(activity.object.id);
            } else if (activity.object['@type'] === 'Group') {
                activityObject.groupIds.push(activity.object.id);
            } else if (activity.object['@type'] === 'User') {
                activityObject.userIds.push(activity.object.id);
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
        }

        if (activity.actor) {
            activityObject.actorType = activity.actor.type;
            activityObject.actorId = activity.actor.id;
            if (activity.actor.type === 'User') {
                activityObject.userIds.push(activity.actor.id);
            }
        }

        activityObject.topicIds = Array.from(new Set(activityObject.topicIds));
        activityObject.groupIds = Array.from(new Set(activityObject.groupIds));
        activityObject.userIds = Array.from(new Set(activityObject.userIds));
        activityObject.createdAt = moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
        activityObject.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ');

        return Activity
            .create(
                activityObject,
                {
                    transaction: transaction
                }
            );
    };

    var _getInstanceChangeSet = function (instance) {
        var currentValues = {};
        var previousValues = instance.previous();

        var changed = instance.changed();
        if (!changed) {
            return [];
        }
        changed.forEach(function (field) {
            currentValues[field] = instance.dataValues[field];
        });

        return diff(previousValues, currentValues); // This shows what changes to apply to get previous object
    };

    var _createActivity = function (instance, target, actor, context, transaction) {
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

        var object;

        if (Array.isArray(instance)) {
            object = [];
            instance.forEach(function (elem) {
                var o = _.cloneDeep(elem.toJSON());
                o['@type'] = elem.$modelOptions.name.singular;
                object.push(o);
            });
        } else {
            object = instance.toJSON();
            object['@type'] = instance.$modelOptions.name.singular;

        }

        var activity = {
            type: Activity.TYPES.create,
            object: object,
            actor: actor
        };

        if (target) {
            var targetObject = target.toJSON();
            targetObject['@type'] = target.$modelOptions.name.singular;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    var _updateTopicDescriptionActivity = function (instance, target, actor, fields, context, transaction) {

        var originPrevious = instance.previous();
        var origin = _.clone(instance.toJSON());
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

        var changeSet = _getInstanceChangeSet(instance);

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
        origin['@type'] = instance.$modelOptions.name.singular;

        var activity = {
            type: Activity.TYPES.update,
            object: origin,
            origin: origin,
            result: changeSet,
            actor: actor
        };

        if (target) {
            var targetObject = target.toJSON();
            targetObject['@type'] = target.$modelOptions.name.singular;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }
        var dataString = JSON.stringify(activity);

        return db
            .query(
                ' \
                DO $$ BEGIN \
                    CASE \
                        WHEN ( \
                            SELECT \
                                ( \
                                SELECT COUNT(*) = 0 \
                                    FROM "Activities" \
                                    WHERE \
                                    ARRAY[:topicId] <@ "topicIds" \
                                    AND \
                                        data@>\'{"type": "Update"}\' \
                                    AND ( \
                                        data#>>\'{result , 0, path}\' = \'/description\' \
                                        OR data#>>\'{result, 0, path}\' = \'/title\' \
                                    ) \
                                    AND "actorType" = \'User\' \
                                    AND "actorId" = :userId \
                                ) OR ( \
                                SELECT \
                                        COUNT(*) > 0 \
                                    FROM "Activities" \
                                    WHERE \
                                    ( \
                                       ARRAY[:topicId] <@ "topicIds" \
                                    ) \
                                    AND \
                                    ( \
                                        NOT data@>\'{"type": "Update"}\' \
                                        OR \
                                        data@>\'{"type": "Update"}\' \
                                            AND ( \
                                                data#>>\'{result , 0, path}\' != \'/description\' \
                                                AND \
                                                data#>>\'{result, 0, path}\' != \'/title\') \
                                    ) \
                                    AND "updatedAt" > ( \
                                        SELECT \
                                            "updatedAt" \
                                        FROM "Activities" \
                                        WHERE \
                                            data@>\'{"type": "Update"}\' \
                                            AND ( \
                                                data#>>\'{result , 0, path}\' = \'/description\' \
                                                OR \
                                                data#>>\'{result, 0, path}\' = \'/title\' \
                                            ) \
                                        AND "actorType" = \'User\' \
                                        AND "actorId" = :userId \
                                        ORDER BY "updatedAt" \
                                        DESC LIMIT 1 \
                                    )) \
                        ) \
                    THEN \
                        INSERT INTO "Activities" \
                        (id, data, "actorType", "actorId", "topicIds", "userIds", "createdAt", "updatedAt") \
                        VALUES \
                        (:id, to_jsonb(:data::json), \'User\', :userId , ARRAY[:topicId], ARRAY[:userId], NOW(), NOW()); \
                    ELSE \
                    UPDATE \
                        "Activities" \
                        SET \
                            data = to_jsonb(:data::json), \
                            "updatedAt" = NOW() \
                    WHERE id = ( \
                        SELECT id FROM "Activities" \
                        WHERE \
                            "actorType" = \'User\' \
                            AND \
                            "actorId" = :userId \
                            AND data@>\'{"type": "Update"}\' \
                            AND ARRAY[:topicId] <@ "topicIds" \
                            AND (data#>>\'{result, 0, path}\' = \'/description\' OR data#>>\'{result, 0, path}\' = \'/title\') \
                            ORDER BY "updatedAt" DESC LIMIT 1\
                    ); \
                    END CASE; \
                END $$ \
                ;',
                {
                    replacements: {
                        id: uuid.v4(),
                        data: dataString,
                        topicId: instance.id,
                        userId: actor.id
                    },
                    type: db.QueryTypes.INSERT,
                    raw: true,
                    transaction: transaction
                }
            );
    };

    var _updateActivity = function (instance, target, actor, fields, context, transaction) {
        // {
        // "@context": "https://www.w3.org/ns/activitystreams",
        // "summary": "Sally updated her note",
        // "type": "Update",
        // "actor": {
        // "type": "Person",
        // "name": "Sally"
        // },
        // "object": "http://example.org/notes/1"

        var originPrevious = instance.previous();
        var origin = _.clone(instance.toJSON());

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

        var changeSet = _getInstanceChangeSet(instance);

        if (changeSet.length === 0) {
            return Promise.resolve();
        }

        origin['@type'] = instance.$modelOptions.name.singular;
        var activity = {
            type: Activity.TYPES.update,
            object: origin,
            origin: origin,
            result: changeSet,
            actor: actor
        };

        if (target) {
            var targetObject = target.toJSON();
            targetObject['@type'] = target.$modelOptions.name.singular;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    var _addActivity = function (instance, actor, origin, target, context, transaction) {

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
        var object = instance.toJSON();
        object['@type'] = instance.$modelOptions.name.singular;

        var activity = {
            type: Activity.TYPES.add,
            object: object,
            actor: actor
        };

        if (origin) {
            var originObject = origin.toJSON();
            originObject['@type'] = origin.$modelOptions.name.singular;
            activity.origin = originObject;
        }

        if (target) {
            var targetObject = target.toJSON();
            targetObject['@type'] = target.$modelOptions.name.singular;
            activity.target = targetObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    var _deleteActivity = function (instance, origin, actor, context, transaction) {
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

        var object = instance.toJSON();
        object['@type'] = instance.$modelOptions.name.singular;

        var activity = {
            type: Activity.TYPES.delete,
            object: object,
            actor: actor
        };

        if (origin) {
            var originObject = origin.toJSON();
            originObject['@type'] = origin.$modelOptions.name.singular;

            activity.origin = originObject;
        }

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    var _leaveActivity = function (instance, actor, context, transaction) {

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
        object['@type'] = instance.$modelOptions.name.singular;

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

    var _viewActivity = function (instance, actor, context, transaction) {
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

        var object = instance.toJSON();
        object['@type'] = instance.$modelOptions.name.singular;

        var activity = {
            type: Activity.TYPES.view,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    var _viewActivityFeedActivity = function (instance, actor, context, transaction) {
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

        var object = instance.toJSON();
        if (object.offset > 0) {
            return Promise.resolve();
        }
        object['@type'] = instance.$modelOptions.name.singular;

        var activity = {
            type: Activity.TYPES.view,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        var dataString = JSON.stringify(activity);

        return db
            .query(' \
                DO $$ BEGIN \
                    CASE \
                        WHEN ( \
                            SELECT \
                                ( \
                                SELECT COUNT(*) = 0 \
                                    FROM "Activities" \
                                    WHERE \
                                        data@>\'{"type": "View"}\' \
                                    AND \
                                        "actorType" = \'User\' \
                                    AND \
                                        "actorId" = :userId \
                                    AND \
                                        data#>>\'{object, @type}\' = \'Activity\' \
                                ) \
                            ) \
                    THEN \
                        INSERT INTO "Activities" \
                        (id, data, "userIds", "actorType", "actorId", "createdAt", "updatedAt") \
                        VALUES \
                        (:id, to_jsonb(:data::json), ARRAY[:userId], \'User\', :userId, NOW(), NOW()); \
                    ELSE \
                    UPDATE \
                        "Activities" \
                        SET \
                            data = to_jsonb(:data::json), \
                            "updatedAt" = NOW() \
                    WHERE id = ( \
                        SELECT id FROM "Activities" \
                        WHERE \
                                "actorType" = \'User\' \
                            AND \
                                "actorId" = :userId \
                            AND \
                                data@>\'{"type": "View"}\' \
                            AND \
                                data#>>\'{object, @type}\' = \'Activity\' \
                            ORDER BY "updatedAt" DESC LIMIT 1\
                    ); \
                    END CASE; \
                END $$ \
                ;', {
                replacements: {
                    id: uuid.v4(),
                    data: dataString,
                    topicId: instance.id,
                    userId: actor.id
                },
                type: db.QueryTypes.INSERT,
                raw: true,
                transaction: transaction
            });
    };

    var _joinActivity = function (instance, actor, context, transaction) {
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

        var object = instance.toJSON();
        object['@type'] = instance.$modelOptions.name.singular;

        var activity = {
            type: Activity.TYPES.join,
            object: object,
            actor: actor
        };

        if (context) {
            activity.context = context;
        }

        return _saveActivity(activity, transaction);
    };

    var _replyActivity = function (instance, inReplyTo, target, actor, context, transaction) {
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

        var object;

        if (Array.isArray(instance)) {
            object = [];
            instance.forEach(function (elem) {
                var o = _.cloneDeep(elem.toJSON());
                o['@type'] = elem.$modelOptions.name.singular;
                object.push(o);
            });
        } else {
            object = instance.toJSON();
            object['@type'] = instance.$modelOptions.name.singular;

        }

        var replyTo = inReplyTo.toJSON();
        replyTo['@type'] = inReplyTo.$modelOptions.name.singular;

        var activity = {
            type: Activity.TYPES.create,
            object: object,
            inReplyTo: replyTo,
            actor: actor
        };

        if (target) {
            var targetObject = target.toJSON();
            targetObject['@type'] = target.$modelOptions.name.singular;
            activity.target = targetObject;
        }

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
        leaveActivity: _leaveActivity,
        addActivity: _addActivity,
        viewActivity: _viewActivity,
        viewActivityFeedActivity: _viewActivityFeedActivity,
        joinActivity: _joinActivity,
        replyActivity: _replyActivity
    };
};
