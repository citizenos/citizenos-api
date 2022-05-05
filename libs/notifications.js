'use strinct'
const jsonpatch = require('fast-json-patch');
const _ = require('lodash');

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const User = models.User;
    const emailLib = app.get('email');

    const parseActivity = async function (activity) {
        if (activity.data.type === 'Update' && Array.isArray(activity.data.result)) {
            const resultItems = [];
            if (activity.data.origin['@type'] === 'Topic') {
                activity.data.origin.description = null;
            }
            const resultObject = _.cloneDeep(activity.data.origin);
            activity.data.resultObject = jsonpatch.applyPatch(resultObject, activity.data.result).newDocument;
            activity.data.result.forEach(function (item) {
                const field = item.path.split('/')[1];
                if (['deletedById', 'deletedByReportId', 'edits'].indexOf(field) > -1 ) {
                    item = null;
                } else {
                    const change = _.find(resultItems, function (resItem) {
                        return resItem.path.indexOf(field) > -1;
                    });

                    if (!change) {
                        resultItems.push(item);
                    } else if (item.value) {
                        if (!Array.isArray(change.value)) {
                            change.value = [change.value];
                        }
                        change.value.push(item.value);
                    }
                }
            });
            activity.data.result = resultItems;
        }
        buildActivityString(activity);
        activity = await getActivityValues(activity);

        return activity;
    }
    const getActivityUsers = async function (data, values) {
        if (data.actor) {
            values.userName = data.actor.name;
            if (!data.actor.name) {
                const actor = await User.findOne({where: {id: data.actor.id}});
                values.userName = actor.name;
            }
        }
        Object.values(data).forEach( (value) => {
            values.userName2 = value.userName || value[0]?.userName;
            if (value['@type'] === 'User') {
                return values.userName2 = value.name
            } else if (Array.isArray(value) && value[0]['@type'] === 'User') {
                values.userName2 = value[0].name;
            }
        });
    };

    const getActivityTopicTitle = function (dataobject, data) {
        const target = data.target;
        const origin = data.origin;
        if (['Topic', 'VoteFinalContainer'].indexOf(dataobject['@type']) > -1) {
            return dataobject.title;
        }

        return dataobject?.topicTitle || target?.title || target?.topicTitle || origin?.title || origin?.topicTitle;
    };

    const getActivityDescription = function (dataobject, data) {
        if (dataobject['@type'] === 'Comment' || dataobject.text) {
            return dataobject.text;
        }
        if (data.target && data.target['@type'] === 'Comment') {
            return data.target.text;
        }
    };

    const getActivityGroupName = function (data) {
        Object.values(data).forEach((value) => {
            if (value.groupName) {
                return value.groupName;
            } else if (value['@type'] === 'Group') {
                return value.name
            } else if (Array.isArray(value) && value[0]['@type'] === 'Group') {
                return value[0].name;
            }
        });
    };

    const getActivityAttachmentName = function (dataobject) {
        if (dataobject['@type'] === 'Attachment' || dataobject.name) {
            return dataobject.name;
        }
    };

    const getAactivityUserConnectionName = function (dataobject) {
        if (dataobject['@type'] === 'UserConnection') {
            return 'NOTIFICATION_USERCONNECTION_CONNECTION_NAME_:connectionId'
                .replace(':connectionId', dataobject.connectionId)
                .toUpperCase();
        }
    };

    const getActivityUserLevel = function (data, values) {
        let levelKeyPrefix = 'NOTIFICATION_TOPIC_LEVELS_';
        let levelKey;

        if (data.actor && data.actor.level) {
            levelKey = levelKeyPrefix + data.actor.level;
        } else if (data.target && data.target.level) { // Invite to Topic has target User - https://github.com/citizenos/citizenos-fe/issues/112
            levelKey = levelKeyPrefix + data.target.level;
        }

        if (levelKey && levelKey !== levelKeyPrefix) {
            values.accessLevel = levelKey.toUpperCase();
        }
    };

    const getCategoryTranslationKeys = function (catInput) {
        if (Array.isArray(catInput)) {
            const translationKeys = [];
            catInput.forEach(function (category) {
                translationKeys.push(`TXT_TOPIC_CATEGORY_${category.toUpperCase()}`);
            });

            return translationKeys;
        }

        return 'TXT_TOPIC_CATEGORY_' + catInput.toUpperCase();
    };

    const getUpdatedTranslations = function (activity) {
        activity.data.result.forEach((item) => {
            const fieldName = item.path.split('/')[1];
            let previousValue = activity.data.origin[fieldName];
            let newValue = activity.data.resultObject[fieldName];
            let previousValueKey = null;
            let newValueKey = null;
            let fieldNameKey = null;
            const originType = activity.data.origin['@type'];
            if (originType === 'Topic' || originType === 'Comment') {
                fieldNameKey = `NOTIFICATION_${originType.toUpperCase()}_FIELD_${fieldName.toUpperCase()}`;
            }

            if (Array.isArray(previousValue) && previousValue.length === 0) {
                previousValue = '';
            }

            if (previousValue || newValue) {
                if (originType === 'Topic') {
                    if (fieldName === 'status' || fieldName === 'visibility') {
                        if (previousValue) {
                            previousValueKey = `NOTIFICATION_TOPIC_FIELD_${fieldName.toUpperCase()}_${previousValue.toUpperCase()}`;
                        }
                        if (newValue) {
                            newValueKey = `NOTIFICATION_TOPIC_FIELD_${fieldName.toUpperCase()}_${newValue.toUpperCase()}`;
                        }
                    }
                    if (fieldName === 'categories') {
                        if (previousValue) {
                            previousValueKey = getCategoryTranslationKeys(previousValue);
                        }
                        if (newValue) {
                            newValueKey = getCategoryTranslationKeys(newValue);
                        }
                    }
                }

                if (originType === 'CommentVote' && fieldName === 'value') {
                    const values = {
                        '-1': 'DOWN',
                        0: 'REMOVE',
                        1: 'UP'
                    }
                    if (previousValue === 0 || previousValue) {
                        previousValueKey = `NOTIFICATION_COMMENTVOTE_FIELD_VALUE_${values[previousValue]}`;
                    }
                    if (newValue === 0 || previousValue) {
                        newValueKey = `NOTIFICATION_COMMENTVOTE_FIELD_VALUE_${values[newValue]}`;
                    }
                }

                if (originType === 'Comment') {
                    newValueKey = `NOTIFICATION_COMMENT_FIELD_${fieldName.toUpperCase()}_${newValue.toUpperCase()}`
                }
            }
            activity.values.groupItems = activity.values.groupItems || {};
            activity.values.previousValue = previousValueKey || previousValue;
            if (fieldNameKey) {
                activity.values.groupItems[fieldNameKey] = {
                    previousValue: previousValueKey || previousValue
                };
            }
            activity.values.newValue = newValueKey || newValue;
            activity.values.groupItems[fieldNameKey].newValue = newValueKey || newValue;

            if (Object.keys(activity.values.groupItems).length > 1) {
                activity.string += '_USERACTIVITYGROUP';
            }
        });

    };

    const getActivityValues = async function (activity) {
      const values = {};

      if (activity.data.object) {
          let dataobject = activity.data.object;
          if (Array.isArray(dataobject)) {
              dataobject = dataobject[0];
          }
          await getActivityUsers(activity.data, values);
          values.topicTitle = getActivityTopicTitle(dataobject, activity.data);
          values.description = getActivityDescription(dataobject, activity.data);
          values.groupName = getActivityGroupName(activity.data);
          values.attachmentName = getActivityAttachmentName(dataobject, activity.data);
          values.connectionName = getAactivityUserConnectionName(dataobject);
          getActivityUserLevel(activity.data, values);

          if (dataobject['@type'] === 'CommentVote' && activity.data.type === 'Create') {
              let str = 'NOTIFICATION_COMMENTVOTE_FIELD_VALUE_';
              let val = 'UP';
              if (dataobject.value === -1) {
                  val = 'DOWN';
              } else if (dataobject.value === 0) {
                  val = 'REMOVE';
              }
              values.reaction = str + val;
          }
      }
      activity.values = values;
      if (activity.data.type === 'Update') {
          getUpdatedTranslations(activity);
      }

      return activity;
  };

  const buildActivityString = function (activity) {
    const keys = Object.keys(activity.data);
    const stringparts = ['NOTIFICATION'];
    if (keys.indexOf('actor') > -1) {
        stringparts.push(activity.data.actor.type);
    }

    if (keys.indexOf('type') > -1) {
        stringparts.push(activity.data.type);
    }

    // TODO: Maybe should implement recursive checking of "object", "origin", "target"  right now hardcoded to 2 levels because of Invite/Accept - https://github.com/citizenos/citizenos-fe/issues/112
    if (keys.indexOf('object') > -1) {
        if (Array.isArray(activity.data.object)) {
            stringparts.push(activity.data.object[0]['@type']);
        } else if (activity.data.object['@type']) {
            stringparts.push(activity.data.object['@type']);
        } else {
            stringparts.push(activity.data.object.type);
        }

        if (activity.data.object.object) { // Originally created to support Accept activity - https://www.w3.org/TR/activitystreams-vocabulary/#dfn-accept
            stringparts.push(activity.data.object.object['@type']);
        }
    }

    if (keys.indexOf('origin') > -1) {
        if (keys.indexOf('object') > -1 && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === activity.data.origin['@type']
            || activity.data.object['@type'] === activity.data.origin['@type'])) { //ignore duplicate stringparts
        } else if (Array.isArray(activity.data.origin)) {
            stringparts.push(activity.data.origin[0]['@type']);
        } else {
            stringparts.push(activity.data.origin['@type']);
        }
        if (activity.data.object && activity.data.object['@type'] && activity.data.result && activity.data.result[0].path.indexOf('level') > -1 && activity.data.result[0].value === 'none') {
            stringparts.push('none');
        }
    }

    if (keys.indexOf('target') > -1) {
        stringparts.push(activity.data.target['@type']);
    }

    if (keys.indexOf('inReplyTo') > -1) {
        stringparts.push('IN_REPLY_TO');
        stringparts.push(activity.data.inReplyTo['@type'])
    }

    if (activity.data.object && activity.data.object['@type'] && activity.data.object['@type'] === 'CommentVote' && activity.data.type !== 'Delete') {
        let val = 'up';
        if ((activity.data.resultObject && activity.data.resultObject.value === -1) || (!activity.data.resultObject && activity.data.object.value === -1)) {
            val = 'down';
        }
        if (activity.data.resultObject && activity.data.resultObject.value === 0) {
            val = 'remove';
        }
        stringparts.push(val);
    }
    activity.string = stringparts.join('_').toUpperCase();
 /*   if (Object.keys(activity.values?.groupItems).length > 1) {
        activity.string += '_USERACTIVITYGROUP';
    }*/
    return activity.string;
  };

  const getGroupMemberUsers = async (groupIds) => {
      try {
        const members = await db
            .query(
                `
                    SELECT
                        u.id
                    FROM "GroupMemberUsers" gm
                        JOIN "Users" u ON (u.id = gm."userId")
                    JOIN "UserNotificationSettings" usn ON usn."userId" = u.id AND usn."groupId" = gm."groupId" AND usn.preferences->>:activityType = 'true' AND usn."allowNotifications" = true
                    WHERE gm."groupId" IN (:groupIds)
                    AND gm."deletedAt" IS NULL
                    ;`,
                {
                    replacements: {
                        groupIds: groupIds.join(',')
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );

        return members[0].users;
      } catch (err) {
          console.log(err);
      }

  }
  const getTopicMemberUsers = async (topicIds, activityType) => {
    try {
      const users = await db
          .query(
              `
              SELECT
                array_agg(tmu.id)
              FROM (
                SELECT
                tm.id,
                tm."topicId"
                FROM (
                    SELECT DISTINCT ON(id)
                        tm."memberId" as id,
                        tm."level",
                        t.id as "topicId",
                        u.name,
                        u.company,
                        u."imageUrl",
                        u.email
                    FROM "Topics" t
                    JOIN (
                        SELECT
                            tmu."topicId",
                            tmu."userId" AS "memberId",
                            tmu."level"::text,
                            1 as "priority"
                        FROM "TopicMemberUsers" tmu
                        WHERE tmu."deletedAt" IS NULL
                        UNION
                        SELECT
                            tmg."topicId",
                            gm."userId" AS "memberId",
                            tmg."level"::text,
                            2 as "priority"
                        FROM "TopicMemberGroups" tmg
                        LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                        WHERE tmg."deletedAt" IS NULL
                        AND gm."deletedAt" IS NULL
                    ) AS tm ON (tm."topicId" = t.id)
                    JOIN "Users" u ON (u.id = tm."memberId")
                    WHERE t.id IN (:topicIds)
                    ORDER BY id, tm.priority, tm."level"::"enum_TopicMemberUsers_level" DESC
                ) tm
                LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm.id AND tmu."topicId" IN (:topicIds))
                LEFT JOIN (
                    SELECT gm."userId", tmg."groupId", tmg."topicId", tmg.level, g.name
                    FROM "GroupMemberUsers" gm
                    LEFT JOIN "TopicMemberGroups" tmg ON tmg."groupId" = gm."groupId"
                    LEFT JOIN "Groups" g ON g.id = tmg."groupId" AND g."deletedAt" IS NULL
                    WHERE gm."deletedAt" IS NULL
                    AND tmg."deletedAt" IS NULL
                ) tmg ON tmg."topicId" IN (:topicIds) AND (tmg."userId" = tm.id)
                GROUP BY tm.id, tm.level, tmu.level, tm.name, tm.company, tm."imageUrl", tm.email, tm."topicId"
                ) tmu
                JOIN "UserNotificationSettings" usn ON usn."userId" = tmu.id AND usn."topicId" = tmu."topicId" AND usn.preferences->>:activityType = 'true' AND usn."allowNotifications" = true
             ;`,
              {
                  replacements: {
                      topicIds: topicIds.join(','),
                      activityType
                  },
                  type: db.QueryTypes.SELECT,
                  raw: true,
                  nest: true
              }
          );
        console.log('Users', users);

      return users[0].users;
    } catch (err) {
        console.log(err);
    }
  }

  const filterUsersBySettings = async (users, activityType) => {
    try {
        const users = await db
            .query(`
                SELECT
                    u.id,
                    u.name,
                    u.language,
                    u.email
                FROM "Users" u
                JOIN
                    "UserNotificationSettings" usn ON
                        usn."userId" = tmu.id
                        AND usn."topicId" = tmu."topicId"
                        AND usn.preferences->>:activityType = 'true' AND usn."allowNotifications" = true
            `,
            {
                replacements: {
                    topicIds: topicIds.join(','),
                    activityType
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });
    } catch (err) {

    }
  };

  const getActivityType = (activity) => {
    let target = activity.data.target?.['@type'] || '';
    const object = activity.data.object['@type'];
    if (object.indexOf(target) > -1) {
        return object;
    }

    return (`${target}${object}`);
  }

  const getRelatedUsers = async (activity) => {
    const activityType = getActivityType(activity);
    console.log('activityType', activityType);
    let users = activity.userIds || [];
    if (activity.topicIds.length) {
        const topicusers = await getTopicMemberUsers(activity.topicIds);
        users = users.concat(topicusers);
    }
    if (activity.groupIds.length) {
        const groupUsers = await getGroupMemberUsers(activity.groupIds);
        users = users.concat(groupUsers);
    }
    if (users.length) {
        await filterUsersBySettings(users, activityType);
    }
    return users;
  }

  const sendActivityNotifications = async (activity) => {
    if (!activity) return;
    const usersPromise = getRelatedUsers(activity);
    const parsePromise = parseActivity(activity);
    const [users, activityRes] = await Promise.all([usersPromise, parsePromise]);

    return emailLib.sendTopicNotification(activityRes, users);
  };

  return {
    buildActivityString,
    getActivityValues,
    sendActivityNotifications,
    getRelatedUsers
  }
}