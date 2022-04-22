'use strinct'
const jsonpatch = require('fast-json-patch');
const _ = require('lodash');

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;

    const getActivityUsers = function (dataobject, data, values) {
        const target = data.target;
        values.userName = data.actor?.name;
        if (dataobject['@type'] === 'User') {
            values.userName2 = dataobject.name;
        } else if (dataobject.userName) {
            values.userName2 = dataobject.userName;
        } else if (target && target['@type'] === 'User') {
            values.userName2 = target.name;
        } else if (target?.userName) {
            values.userName2 = target.userName;
        }
    };

    const getActivityTopicTitle = function (dataobject, data) {
        const target = data.target;
        const origin = data.origin;
        if (['Topic', 'VoteFinalContainer'].indexOf(dataobject['@type']) > -1) {
            return dataobject.title;
        }
        return dataobject?.topicTitle || target?.title || target?.topicTitle || origin?.title || origin?.topicTitle;
    };

    const getActivityClassName = function (dataobject, data) {

        if (data.type === 'Accept' || data.type === 'Invite' || (data.type === 'Add' && data.actor.type === 'User' && data.object['@type'] === 'User' && data.target['@type'] === 'Group')) { // Last condition if for Group invites
            return 'invite';
        } else if (['Topic', 'TopicMemberUser', 'Attachment', 'TopicPin' ].indexOf(dataobject['@type']) > -1 || data.target && data.target['@type'] === ' Topic') {
            return 'topic';
        } else if (['Group'].indexOf(dataobject['@type']) > -1 || dataobject.groupName) {
            return 'group';
        } else if (['Vote', 'VoteList', 'VoteUserContainer', 'VoteFinalContainer', 'VoteOption', 'VoteDelegation'].indexOf(dataobject['@type']) > -1) {
            return 'vote';
        } else if (['Comment', 'CommentVote'].indexOf(dataobject['@type']) > -1) {
            return 'comment';
        } else if (['User', 'UserConnection'].indexOf(dataobject['@type']) > -1 || dataobject.text) {
            return 'personal';
        } else {
            return 'topic';
        }
    };

    const getActivityDescription = function (dataobject, data) {
        if (dataobject['@type'] === 'Comment' || dataobject.text) {
            return dataobject.text;
        }
        if (data.target && data.target['@type'] === 'Comment') {
            return data.target.text;
        }
    };

    const getActivityGroupName = function (dataobject, data) {
        if (dataobject['@type'] === 'Group') {
            return dataobject.name;
        } else if (dataobject.groupName) {
            return dataobject.groupName;
        } else if (data.target && data.target['@type'] === 'Group') {
            return data.target.name;
        } else if (data.target && data.target.groupName) {
            return data.target.groupName;
        } else if (data.origin && data.origin['@type'] === 'Group') {
            return data.origin.name;
        } else if (data.origin && data.origin.groupName) {
            return data.origin.groupName;
        }
    };

    const getActivityAttachmentName = function (dataobject) {
        if (dataobject['@type'] === 'Attachment' || dataobject.name) {
            return dataobject.name;
        }
    };

    const getAactivityUserConnectionName = function (dataobject) {
        if (dataobject['@type'] === 'UserConnection') {
            return 'ACTIVITY_FEED.ACTIVITY_USERCONNECTION_CONNECTION_NAME_:connectionId'
                .replace(':connectionId', dataobject.connectionId)
                .toUpperCase();
        }
    };

    const getActivityUserLevel = function (data, values) {
        let levelKeyPrefix = 'ACTIVITY_FEED.ACTIVITY_TOPIC_LEVELS_';
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
                translationKeys.push('TXT_TOPIC_CATEGORY_' + category.toUpperCase());
            });

            return translationKeys;
        }

        return 'TXT_TOPIC_CATEGORY_' + catInput.toUpperCase();
    };

    const getUpdatedTranslations = function (activity) {
        const fieldName = activity.data.result[0].path.split('/')[1];
        activity.values.fieldName = fieldName;
        let previousValue = activity.data.origin[fieldName];
        const resultObject = _.cloneDeep(activity.data.origin);
        activity.data.resultObject = jsonpatch.applyPatch(resultObject, activity.data.result).newDocument;
        let newValue = activity.data.resultObject[fieldName];
        let previousValueKey = null;
        let newValueKey = null;
        let fieldNameKey = null;
        const originType = activity.data.origin['@type'];
        if (originType === 'Topic' || originType === 'Comment') {
            fieldNameKey = 'ACTIVITY_FEED.ACTIVITY_' + originType.toUpperCase() + '_FIELD_' + fieldName.toUpperCase();
        }

        if (Array.isArray(previousValue) && previousValue.length === 0) {
            previousValue = '';
        }

        if (previousValue || newValue) {
            if (originType === 'Topic') {
                if (fieldName === 'status' || fieldName === 'visibility') {
                    if (previousValue) {
                        previousValueKey = 'ACTIVITY_FEED.ACTIVITY_TOPIC_FIELD_' + fieldName.toUpperCase() + '_' + previousValue.toUpperCase();
                    }
                    if (newValue) {
                        newValueKey = 'ACTIVITY_FEED.ACTIVITY_TOPIC_FIELD_' + fieldName.toUpperCase() + '_' + newValue.toUpperCase();
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

            if (originType === 'CommentVote') {
                if (fieldName === 'value') {
                    if (previousValue === 0 || previousValue) {

                        if (previousValue === 1) {
                            previousValue = 'up';
                        } else if (previousValue === -1) {
                            previousValue = 'down';
                        } else if (previousValue === 0) {
                            previousValue = 'remove';
                        }

                        previousValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_' + previousValue.toUpperCase();
                    }
                    if (newValue === 0 || previousValue) {
                        if (newValue === 1) {
                            newValue = 'up';
                        } else if (newValue === -1) {
                            newValue = 'down';
                        } else if (newValue === 0) {
                            newValue = 'remove';
                        }

                        newValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_' + newValue.toUpperCase();
                    }
                }
            }

            if (originType === 'Comment') {
                if (fieldName === 'deletedReasonType') {
                    newValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENT_FIELD_DELETEDREASONTYPE_' + newValue.toUpperCase();
                }
                if (fieldName === 'type') {
                    newValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENT_FIELD_VALUE_' + newValue.toUpperCase();
                }
            }
        }

        activity.values.previousValue = previousValueKey || previousValue;

        if (fieldNameKey) {
            activity.values.fieldName = fieldNameKey;
            activity.values.groupItemValue = fieldNameKey;
        }
        if (newValueKey) {
            activity.values.newValue = newValueKey;
            activity.values.groupItemValue += ': ' + newValueKey;
        } else {
            activity.values.newValue = newValue;
            activity.values.groupItemValue += ': ' + newValue;
        }

    };

    const getActivityValues = function (activity) {
      const values = {};

      if (activity.data.object) {
          let dataobject = activity.data.object;
          if (Array.isArray(dataobject)) {
              dataobject = dataobject[0];
          }
          getActivityUsers(dataobject, activity.data, values);
          values.topicTitle = getActivityTopicTitle(dataobject, activity.data);
          values.className = getActivityClassName(dataobject, activity.data);
          values.description = getActivityDescription(dataobject, activity.data);
          values.groupName = getActivityGroupName(dataobject, activity.data);
          values.attachmentName = getActivityAttachmentName(dataobject, activity.data);
          values.connectionName = getAactivityUserConnectionName(dataobject);
          getActivityUserLevel(activity.data, values);



          if (dataobject['@type'] === 'Comment') {
              values.groupItemValue = dataobject.text;
          }

          if (dataobject['@type'] === 'CommentVote' && activity.data.type === 'Create') {
              let str = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_';
              let val = 'UP';
              if (dataobject.value === -1) {
                  val = 'DOWN';
              } else if (dataobject.value === 0) {
                  val = 'REMOVE';
              }
              values.reaction = str + val;
              values.groupItemValue = str + val;
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
    const stringparts = ['ACTIVITY'];
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
    activity.string = 'ACTIVITY_FEED.' + stringparts.join('_').toUpperCase();
  };

  const getGroupMemberUsers = async (groupIds) => {
      try {
        const members = await db
            .query(
                `SELECT array_agg(id) as users FROM (
                    SELECT
                        u.id
                    FROM "GroupMemberUsers" gm
                        JOIN "Users" u ON (u.id = gm."userId")
                    WHERE gm."groupId" IN (:groupIds)
                    AND gm."deletedAt" IS NULL) gmu
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
  const getTopicMemberUsers = async (topicIds) => {
    try {
      const users = await db
          .query(
              ` SELECT array_agg(id) as users FROM (
              SELECT
              tm.id
          FROM (
              SELECT DISTINCT ON(id)
                  tm."memberId" as id,
                  tm."level",
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
          GROUP BY tm.id, tm.level, tmu.level, tm.name, tm.company, tm."imageUrl", tm.email
          ) a;`,
              {
                  replacements: {
                      topicIds: topicIds.join(',')
                  },
                  type: db.QueryTypes.SELECT,
                  raw: true,
                  nest: true
              }
          )

      return users[0].users;
  } catch (err) {
      console.log(err);
  }
  }
  const getRelatedUsers = async (activity) => {
      console.log(activity)
    let users = activity.userIds || [];
    if (activity.topicIds.length) {
        const topicusers = await getTopicMemberUsers(activity.topicIds);
        users = users.concat(topicusers);
    }
    if (activity.groupIds.length) {
        const groupUsers = await getGroupMemberUsers(activity.groupIds);
        users = users.concat(groupUsers);
    }

    return users;
  }

  const sendActivityNotifications = async (activity) => {
    const usersPromise = getRelatedUsers(activity);
    const textPromise = buildActivityString(activity);
    const [users, text] = await Promise.all([usersPromise, textPromise]);
    console.log(users);
    console.log(text);
  };

  return {
    buildActivityString,
    getActivityValues,
    sendActivityNotifications,
    getRelatedUsers
  }
}