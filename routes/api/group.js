'use strict';

/**
 * Group API-s (/api/../groups/..)
 */

module.exports = function (app) {
    var logger = app.get('logger');
    var db = app.get('db');
    var _ = app.get('lodash');
    var cosActivities = app.get('cosActivities');
    var validator = app.get('validator');
    var emailLib = app.get('email');
    var util = app.get('util');
    var moment = app.get('moment');
    var Promise = app.get('Promise');

    var loginCheck = app.get('middleware.loginCheck');

    var Activity = app.get('models.Activity');
    var Group = app.get('models.Group');
    var GroupMember = app.get('models.GroupMember');
    var User = app.get('models.User');

    /**
     * Check if User has sufficient privileges to access the Object.
     *
     * @param {string} level One of Permission.LEVELS
     *
     * @returns {Function} Express middleware function
     */

    var _hasPermission = function (groupId, userId, level, allowPublic, allowSelf) {
        // TODO: I think this will also map not found Groups/Users into Forbidden. May want to fix this for better User messaging.
        var LEVELS = {
            none: 0, // Enables to override inherited permissions.
            read: 1,
            edit: 2,
            admin: 3
        };
        var minRequiredLevel = level;

        return new Promise(function (resolve, reject) {
            return db
                .query('\
                    SELECT \
                        g.visibility = \'public\' AS "isPublic", \
                        gm."userId" AS "allowed", \
                        gm."userId" AS uid, \
                        gm."level" AS level, \
                        g.id \
                    FROM "Groups" g \
                    LEFT JOIN "GroupMembers" gm \
                        ON(gm."groupId" = g.id) \
                    WHERE g.id = :groupId \
                        AND gm."userId" = :userId \
                        AND gm."deletedAt" IS NULL \
                        AND g."deletedAt" IS NULL \
                    GROUP BY id, uid, level;', {
                    replacements: {
                        groupId: groupId,
                        userId: userId,
                        level: level
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                })
                .then(function (result) {
                    if (result && result[0]) {
                        var isPublic = result[0].isPublic;
                        var isAllowed = result[0].allowed;
                        var blevel = result[0].level;

                        if (!allowSelf && (LEVELS[minRequiredLevel] > LEVELS[blevel])) {
                            logger.warn('Access denied to topic due to member without permissions trying to delete user! ', 'userId:', userId);

                            return reject();
                        }
                        if (isAllowed || (allowPublic && isPublic) || allowSelf) {
                            return resolve();
                        }
                    }

                    return reject();
                })
                .catch(function (err) {
                    return reject(err);
                });
        });
    };
    var hasPermission = function (level, allowPublic, allowSelf) {
        return function (req, res, next) {
            var groupId = req.params.groupId;
            var userId = req.user.id;
            var allowDeleteSelf = allowSelf;

            if (allowSelf) {
                if (userId !== req.params.memberId) {
                    allowDeleteSelf = false;
                }
            }

            return _hasPermission(groupId, userId, level, allowPublic, allowDeleteSelf)
                .then(function () {
                    return new Promise(function (resolve) {
                        return resolve(next(null, req, res));
                    });
                }, function (err) {
                    if (err) {
                        return next(err);
                    }

                    return res.forbidden('Insufficient permissions');
                })
                .catch(next);
        };
    };

    /**
     * Create a new Group
     */
    app.post('/api/users/:userId/groups', loginCheck(['partner']), function (req, res, next) {
        var group = Group
            .build({
                name: req.body.name,
                creatorId: req.user.id,
                parentId: req.body.parentId, //TODO: check that user actually has Permissions on the Parent and the Parent exists?
                visibility: req.body.visibility || Group.VISIBILITY.private
            });

        db
            .transaction(function (t) {
                return group
                    .save({transaction: t})
                    .then(function () {
                        return cosActivities
                            .createActivity(
                                group,
                                null,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                req.method + ' ' + req.path, t
                            );
                    })
                    .then(function () {
                        return group.addMember( // Magic method by Sequelize - https://github.com/sequelize/sequelize/wiki/API-Reference-Associations#hasmanytarget-options
                            req.user.id,
                            {
                                level: GroupMember.LEVELS.admin,
                                transaction: t
                            }
                        );
                    });
            })
            .then(function () {
                return res.created(group.toJSON());
            })
            .catch(next);
    });


    /**
     * Read a Group
     */
    app.get('/api/users/:userId/groups/:groupId', loginCheck(['partner']), hasPermission(GroupMember.LEVELS.read, null, null), function (req, res, next) {
        db
            .query(
                'SELECT \
                     g.id, \
                     g."parentId" AS "parent.id", \
                     g.name, \
                     g.visibility, \
                     c.id as "creator.id", \
                     c.email as "creator.email", \
                     c.name as "creator.name", \
                     c."createdAt" as "creator.createdAt", \
                     mc.count as "members.count" \
                FROM "Groups" g \
                    LEFT JOIN "Users" c ON (c.id = g."creatorId") \
                    LEFT JOIN ( \
                        SELECT "groupId", count("userId") AS "count" \
                        FROM "GroupMembers" \
                        WHERE "deletedAt" IS NULL \
                        GROUP BY "groupId" \
                    ) AS mc ON (mc."groupId" = g.id) \
                WHERE g.id = :groupId;',
                {
                    replacements: {
                        groupId: req.params.groupId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (result) {
                if (result && result.length && result[0]) {
                    var group = result[0];

                    return res.ok(group);
                }
            })
            .catch(next);
    });

    /**
     * Update Group info
     */
    app.put('/api/users/:userId/groups/:groupId', loginCheck(['partner']), hasPermission(GroupMember.LEVELS.admin, null, null), function (req, res, next) {
        var groupId = req.params.groupId;
        var groupName = req.body.name;

        Group
            .findOne({
                where: {
                    id: groupId
                }
            })
            .then(function (group) {
                group.name = groupName;

                return group
                    .validate()
                    .then(function (err) {
                        if (err) {
                            return next(err);
                        } else {
                            return db
                                .transaction(function (t) {
                                    return cosActivities
                                        .updateActivity(group, null, {
                                            type: 'User',
                                            id: req.user.id
                                        }, null, req.method + ' ' + req.path, t)
                                        .then(function () {
                                            return db
                                                .query(
                                                    'WITH \
                                                        updated AS ( \
                                                            UPDATE \
                                                                "Groups" SET \
                                                                "name"= :groupName, \
                                                                "updatedAt"=:timestamp \
                                                                    WHERE "id" = :groupId \
                                                                RETURNING * \
                                                        ) \
                                                        SELECT  \
                                                            g.id, \
                                                            g."parentId" AS "parent.id", \
                                                            g.name, \
                                                            g.visibility, \
                                                            c.id as "creator.id", \
                                                            c.email as "creator.email", \
                                                            c.name as "creator.name", \
                                                            c."createdAt" as "creator.createdAt", \
                                                            mc.count as "members.count" \
                                                        FROM updated g \
                                                        LEFT JOIN \
                                                            "Users" c ON (c.id = g."creatorId") \
                                                                LEFT JOIN ( \
                                                                    SELECT "groupId", count("userId") AS "count" \
                                                                    FROM "GroupMembers" \
                                                                    WHERE "deletedAt" IS NULL \
                                                                    GROUP BY "groupId" \
                                                                ) AS mc ON (mc."groupId" = g.id);'
                                                    , {
                                                        replacements: {
                                                            timestamp: moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ'),
                                                            groupId: req.params.groupId,
                                                            groupName: req.body.name
                                                        },
                                                        type: db.QueryTypes.SELECT,
                                                        raw: true,
                                                        nest: true,
                                                        transaction: t
                                                    }
                                                );
                                        });
                                }).then(function (result) {
                                    if (result && result.length && result[0]) {
                                        return res.ok(result[0]);
                                    }

                                    return next();
                                })
                                .catch(next);
                        }
                    });
            })
            .catch(next);
    });

    /**
     * Delete Group
     */
    app.delete('/api/users/:userId/groups/:groupId', loginCheck(['partner']), hasPermission(GroupMember.LEVELS.admin, null, null), function (req, res, next) {
        Group
            .findById(req.params.groupId)
            .then(function (group) {
                if (!group) {
                    res.notFound('No such Group found.');

                    return Promise.reject();
                }

                return db.transaction(function (t) {
                    return GroupMember.destroy({where: {groupId: group.id}}, {transaction: t})
                        .then(function () {
                            return group.destroy({transaction: t});
                        })
                        .then(function () {
                            return cosActivities
                                .deleteActivity(
                                    group,
                                    null,
                                    {
                                        type: 'User',
                                        id: req.user.id
                                    },
                                    req.method + ' ' + req.path, t
                                );
                        });
                });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });


    /**
     * Get all Groups User belongs to
     */
    app.get('/api/users/:userId/groups', loginCheck(['partner']), function (req, res, next) {
        var include = req.query.include;
        // Sequelize and associations are giving too eager results + not being the most effective. https://github.com/sequelize/sequelize/issues/2458
        // Falling back to raw SQL
        // TODO: support LIMIT & OFFSET
        // TODO: This cannot possibly be the most effective query in the world..
        var joinText = '';
        var returnFields = '';
        if (include && !Array.isArray(include)) {
            include = [include];
        }

        if (include) {
            var union = false;
            joinText = 'LEFT JOIN (';
            if (include.indexOf('member.topic') > -1) {
                joinText += '\
                                SELECT \
                                    tmg."topicId" as "memberId", \
                                    t.title as "memberName", \
                                    \'topic\' as "type", \
                                    tmg."groupId" as "groupId", \
                                    tmg.level::text as "memberLevel" \
                                FROM "TopicMemberGroups" tmg \
                                LEFT JOIN "Topics" t \
                                ON t.id = tmg."topicId" \
                                WHERE tmg."deletedAt" IS NULL ';
                union = true;
                returnFields += ' tmgpl.level as "member.levelTopic", ';
            }
            if (include.indexOf('member.user') > -1) {
                if (union) {
                    joinText += ' UNION ';
                }
                joinText += '\
                                SELECT \
                                    gmu."userId" as "memberId", \
                                    u.name as "memberName", \
                                    \'user\' as type, \
                                    gmu."groupId" as "groupId", \
                                    gmu.level::text as "memberLevel" \
                                FROM "GroupMembers" gmu \
                                LEFT JOIN "Users" u \
                                ON u.id = gmu."userId" \
                                WHERE gmu."deletedAt" IS NULL';
            }
            joinText += ') as members ON members."groupId" = g.id ';
            joinText += ' \
                        LEFT JOIN ( \
                        SELECT DISTINCT ON (tmgp."topicId") * FROM ( \
                            SELECT \
                                tmg."topicId", \
                                gm."userId", \
                                tmg.level::text, \
                                2 as "priority" \
                            FROM "TopicMemberGroups" tmg \
                                LEFT JOIN "GroupMembers" gm \
                            ON tmg."groupId" = gm."groupId" \
                            WHERE tmg."deletedAt" IS NULL \
                             \
                            UNION \
                              \
                            SELECT \
                                tmu."topicId", \
                                tmu."userId", \
                                tmu.level::text, \
                                1 as "priority" \
                            FROM "TopicMemberUsers" tmu \
                            WHERE tmu."deletedAt" IS NULL \
                            ) as tmgp ORDER BY tmgp."topicId", tmgp."priority", tmgp.level::"enum_TopicMemberUsers_level" DESC ) as tmgpl ON tmgpl."topicId" = members."memberId"';
            returnFields += '\
                                members."memberId" as "member.memberId", \
                                members."memberName" as "member.memberName", \
                                members."type" as "member.memberType", \
                                members."memberLevel" as "member.level", ';
        }

        db
            .query(
                ' \
                SELECT \
                    g.id, \
                    g."parentId" AS "parent.id", \
                    g.name, \
                    g.visibility, \
                    c.id as "creator.id", \
                    c.email as "creator.email", \
                    c.name as "creator.name", \
                    gm.level as "permission.level", \
                    mc.count as "members.users.count", \
                    COALESCE(gtc.count, 0) as "members.topics.count", \
                    gt."topicId" as "members.topics.latest.id", \
                    ' + returnFields + ' \
                    gt.title as "members.topics.latest.title" \
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
                    ' + joinText + ' \
                WHERE g."deletedAt" IS NULL \
                    AND gm."deletedAt" is NULL \
                    AND gm."userId" = :userId \
                ORDER BY g."updatedAt" DESC, g.id; \
                ',
                {
                    replacements: {
                        userId: req.user.id
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (rows) {
                var results = {
                    count: 0,
                    rows: []
                };
                var memberGroupIds = [];

                rows.forEach(function (groupRow) {
                    var group = _.cloneDeep(groupRow);
                    var member = _.clone(group.member);


                    if (memberGroupIds.indexOf(group.id) < 0) {
                        delete group.member;
                        group.members.users.rows = [];
                        group.members.topics.rows = [];
                        results.rows.push(group);
                        memberGroupIds.push(group.id);
                    }

                    if (include && member && member.memberId) {
                        results.rows.find(function (g, index) {
                            if (g.id === group.id) {
                                var newMember = {
                                    id: member.memberId
                                };

                                if (member.memberType === 'topic') {
                                    newMember.title = member.memberName;
                                    newMember.level = member.levelTopic;

                                    var topicInGroup = results.rows[index].members.topics.rows.find(function (t) {
                                        return t.id === newMember.id;
                                    });

                                    if (!topicInGroup) {
                                        results.rows[index].members.topics.rows.push(newMember);
                                    }

                                    return true;
                                } else if (member.memberType === 'user') {
                                    newMember.name = member.memberName;
                                    newMember.level = member.level;
                                    results.rows[index].members.users.rows.push(newMember);

                                    return true;
                                } else {
                                    return true;
                                }
                            }

                            return false;
                        });
                    }
                });

                return results;
            })
            .then(function (results) {
                results.rows.forEach(function (row) {
                    if (!row.members.topics.latest.id) {
                        delete row.members.topics.latest;
                    }
                    if (!include || include.indexOf('member.user') < 0) {
                        delete row.members.users.rows;
                    }
                    if (!include || include.indexOf('member.topic') < 0) {
                        delete row.members.topics.rows;
                    }
                });
                results.count = results.rows.length;

                return res.ok(results);
            })
            .catch(next);
    });


    /**
     * Create new members (GroupMember) to a Group
     *
     * TODO: Remove first route definition after NEW FE deploy - https://trello.com/c/JutjiDeX/574-new-fe-post-deploy-actions
     */
    app.post(['/api/users/:userId/groups/:groupId/members', '/api/users/:userId/groups/:groupId/members/users'], loginCheck(['partner']), hasPermission(GroupMember.LEVELS.admin, null, null), function (req, res) {
        var members = req.body;
        var groupId = req.params.groupId;

        var validEmailMembers = [];
        var validUserIdMembers = [];

        if (!Array.isArray(members)) {
            members = [members];
        }

        _(members).forEach(function (m) {
            // Is it an e-mail?
            if (validator.isEmail(m.userId)) {
                validEmailMembers.push(m); // The whole member object with level
            }

            // Is it User id?
            if (validator.isUUID(m.userId, 4)) {
                validUserIdMembers.push(m);
            }
        });

        var validEmails = validEmailMembers.map(function (m) {
            return m.userId;
        });

        var usersCreatedPromise = Promise.resolve();

        if (validEmails.length) {
            usersCreatedPromise = User
                .findAll({
                    where: {email: validEmails},
                    attributes: ['id', 'email']
                })
                .then(function (users) {
                    _(users).forEach(function (u) {
                        var member = _.find(validEmailMembers, {userId: u.email});
                        if (member) {
                            member.userId = u.id;
                            validUserIdMembers.push(member);
                            _.remove(validEmailMembers, member); // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                        }
                    });

                    // The leftovers are e-mails for which User did not exist
                    if (validEmailMembers.length) {
                        var usersToCreate = [];
                        _(validEmailMembers).forEach(function (m) {
                            usersToCreate.push({
                                email: m.userId,
                                language: m.language,
                                password: null,
                                name: util.emailToDisplayName(m.userId),
                                source: User.SOURCES.citizenos
                            });
                        });

                        return db.transaction(function (t) {
                            return User
                                .bulkCreate(usersToCreate, {transaction: t})
                                .then(function (usersCreated) {
                                    var userCreateActivityPromises = [];
                                    usersCreated.forEach(function (u) {
                                        var createActivityPromise = cosActivities.createActivity(
                                            u,
                                            null,
                                            {
                                                type: 'System'
                                            },
                                            req.method + ' ' + req.path,
                                            t
                                        );
                                        userCreateActivityPromises.push(createActivityPromise);
                                    });

                                    return Promise
                                        .all(userCreateActivityPromises)
                                        .then(function () {
                                            return usersCreated;
                                        });
                                });
                        });
                    } else {
                        return Promise.resolve();
                    }
                });
        }

        usersCreatedPromise
            .then(function (createdUsers) {
                if (createdUsers && createdUsers.length) {
                    _(createdUsers).forEach(function (u) {
                        var member = {
                            userId: u.id
                        };

                        // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                        var level = _.find(validEmailMembers, {userId: u.email}).level;
                        if (level) {
                            member.level = level;
                        }

                        validUserIdMembers.push(member);
                    });
                }

                // TODO: Creates 1 DB call per Member which is not wise when thinking of performance.
                // Change once http://sequelize.readthedocs.org/en/latest/api/model/#bulkcreaterecords-options-promisearrayinstance suppors "bulkUpsert"
                var findOrCreatePromises = validUserIdMembers.map(function (member) {
                    member.groupId = req.params.groupId;

                    return db
                        .transaction(function (t) {
                            return GroupMember
                                .findOrCreate({
                                    where: {
                                        groupId: member.groupId,
                                        userId: member.userId
                                    },
                                    defaults: {
                                        level: member.level || GroupMember.LEVELS.read
                                    },
                                    transaction: t
                                });
                        })
                        .then(function (result) {
                            return Promise.resolve(result);
                        });
                });

                return Promise
                    .all(findOrCreatePromises.map(function (promise) {
                        return promise.reflect();
                    }))
                    .then(function (newMembers) {
                        return Group
                            .findOne({
                                where: {
                                    id: groupId
                                }
                            })
                            .then(function (group) {
                                var userIdsToInvite = [];

                                newMembers.forEach(function (result, i) {
                                    if (result.isFulfilled()) {
                                        var value = result.value(); // findOrCreate returns [instance, created=true/false]
                                        if (value && value[1]) {
                                            userIdsToInvite.push(validUserIdMembers[i].userId);
                                            var user = User.build({id: value[0].userId});
                                            user.dataValues.id = value[0].userId;
                                            cosActivities.addActivity(user, {
                                                type: 'User',
                                                id: req.user.id
                                            }, null, group, req.method + ' ' + req.path);
                                        }
                                    } else {
                                        logger.error('Failed to create a TopicMemberUser', validUserIdMembers[i]);
                                    }
                                });

                                emailLib.sendGroupInvite(userIdsToInvite, req.user.id, groupId);

                                return res.created();
                            });
                    });
            })
            .catch(function (err) {
                logger.error('Adding Users with e-mail failed.', err);
            });
    });

    /**
     * Get Group member Users
     *
     * TODO: Remove first route definition after NEW FE deploy - https://trello.com/c/JutjiDeX/574-new-fe-post-deploy-actions
     */
    app.get(['/api/users/:userId/groups/:groupId/members', '/api/users/:userId/groups/:groupId/members/users'], loginCheck(['partner']), hasPermission(GroupMember.LEVELS.read, null, null), function (req, res, next) {
        var groupId = req.params.groupId;

        db
            .query('SELECT \
                    u.id, \
                    u.name, \
                    u.company, \
                    u."imageUrl", \
                    gm.level \
                FROM "GroupMembers" gm \
                    JOIN "Users" u ON (u.id = gm."userId") \
                WHERE gm."groupId" = :groupId \
                AND gm."deletedAt" IS NULL', {
                replacements: {groupId: groupId},
                type: db.QueryTypes.SELECT,
                raw: true
            })
            .then(function (members) {
                return res.ok({
                    count: members.length,
                    rows: members
                });
            })
            .catch(next);
    });

    /**
     * Update membership information
     *
     * TODO: Remove first route definition after NEW FE deploy - https://trello.com/c/JutjiDeX/574-new-fe-post-deploy-actions
     */
    app.put(['/api/users/:userId/groups/:groupId/members/:memberId', '/api/users/:userId/groups/:groupId/members/users/:memberId'], loginCheck(['partner']), hasPermission(GroupMember.LEVELS.admin, null, null), function (req, res, next) {
        var newLevel = req.body.level;
        var memberId = req.params.memberId;
        var groupId = req.params.groupId;

        GroupMember
            .findAll({
                where: {
                    groupId: groupId,
                    level: GroupMember.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            })
            .then(function (result) {
                if (result.length === 1 && _.find(result, {userId: memberId})) {
                    return res.badRequest('Cannot revoke admin permissions from the last admin member.');
                }

                return GroupMember
                    .findOne({
                        where: {
                            groupId: groupId,
                            userId: memberId
                        }
                    })
                    .then(function (groupMember) {
                        groupMember.level = newLevel;

                        return db
                            .transaction(function (t) {
                                return cosActivities
                                    .updateActivity(
                                        groupMember,
                                        null,
                                        {
                                            type: 'User',
                                            id: req.user.id
                                        },
                                        null,
                                        req.method + ' ' + req.path, t
                                    )
                                    .then(function () {
                                        return groupMember
                                            .save({
                                                transaction: t
                                            });
                                    });
                            });
                    });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });

    /**
     * Delete membership information
     *
     * TODO: Remove first route definition after NEW FE deploy - https://trello.com/c/JutjiDeX/574-new-fe-post-deploy-actions
     */
    app.delete(['/api/users/:userId/groups/:groupId/members/:memberId', '/api/users/:userId/groups/:groupId/members/users/:memberId'], loginCheck(['partner']), hasPermission(GroupMember.LEVELS.admin, null, true), function (req, res, next) {
        var groupId = req.params.groupId;
        var memberId = req.params.memberId;

        GroupMember
            .findAll({
                where: {
                    groupId: groupId,
                    level: GroupMember.LEVELS.admin
                },
                attributes: ['userId'],
                raw: true
            })
            .then(function (result) {
                // At least 1 admin member has to remain at all times..
                if (result.length === 1 && _.find(result, {userId: memberId})) {
                    return res.badRequest('Cannot delete the last admin member.');
                }

                // TODO: Used to use GroupMember.destroy, but that broke when moving 2.x->3.x - https://github.com/sequelize/sequelize/issues/4465
                // NOTE: Postgres does not support LIMIT for DELETE, thus the hidden "ctid" column and subselect is used
                return db
                    .transaction(function (t) {
                        var group = Group.build({id: groupId});
                        var user = User.build({id: memberId});
                        group.dataValues.id = groupId;
                        user.dataValues.id = memberId;

                        return cosActivities
                            .deleteActivity(
                                user,
                                group,
                                {
                                    type: 'User',
                                    id: req.user.id
                                },
                                req.method + ' ' + req.path,
                                t
                            )
                            .then(function () {
                                return db
                                    .query(
                                        '\
                                        DELETE FROM \
                                            "GroupMembers" \
                                        WHERE ctid IN (\
                                            SELECT \
                                                ctid \
                                            FROM "GroupMembers" \
                                            WHERE "groupId" = :groupId \
                                            AND "userId" = :userId \
                                            LIMIT 1 \
                                        ) \
                                        ',
                                        {
                                            replacements: {
                                                groupId: groupId,
                                                userId: memberId
                                            },
                                            type: db.QueryTypes.DELETE,
                                            transaction: t,
                                            raw: true
                                        }
                                    );
                            });
                    });
            })
            .then(function () {
                return res.ok();
            })
            .catch(next);
    });


    /**
     * Get Group Topics
     */
    app.get('/api/users/:userId/groups/:groupId/topics', loginCheck(['partner']), hasPermission(GroupMember.LEVELS.read, null, null), function (req, res, next) {
        db
            .query(
                'SELECT \
                    t.id, \
                    t.title, \
                    t.visibility, \
                    t.status, \
                    t.categories, \
                    t."endsAt", \
                    t.hashtag, \
                    t."updatedAt", \
                    t."createdAt", \
                    COALESCE(tmup.level, tmgp.level, \'none\') as "permission.level", \
                    muc.count as "members.users.count", \
                    COALESCE(mgc.count, 0) as "members.groups.count" \
                FROM "TopicMemberGroups" gt \
                    JOIN "Topics" t ON (t.id = gt."topicId") \
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
                        SELECT "topicId", count("groupId")::integer AS "count" \
                        FROM "TopicMemberGroups" \
                        WHERE "deletedAt" IS NULL \
                        GROUP BY "topicId" \
                    ) AS mgc ON (mgc."topicId" = t.id) \
                WHERE gt."groupId" = :groupId \
                    AND gt."deletedAt" IS NULL \
                    AND t."deletedAt" IS NULL;'
                ,
                {
                    replacements: {
                        groupId: req.params.groupId,
                        userId: req.user.id
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (topics) {
                return res.ok({
                    count: topics.length,
                    rows: topics
                });
            })
            .catch(next);
    });

    /**
     * Get Group member Topics
     */
    app.get('/api/users/:userId/groups/:groupId/members/topics', loginCheck(['partner']), hasPermission(GroupMember.LEVELS.read, null, null), function (req, res, next) {

        db
            .query(
                'SELECT \
                    t.id, \
                    t.title, \
                    t.visibility, \
                    t.status, \
                    t.categories, \
                    t."endsAt", \
                    t.hashtag, \
                    t."updatedAt", \
                    t."createdAt", \
                    u.id as "creator.id", \
                    u.name as "creator.name", \
                    u.company as "creator.company", \
                    u."imageUrl" as "creator.imageUrl", \
                    COALESCE(tmup.level, tmgp.level, \'none\') as "permission.level", \
                    COALESCE(tmgp.level, \'none\') as "permission.levelGroup", \
                    muc.count as "members.users.count", \
                    COALESCE(mgc.count, 0) as "members.groups.count" \
                FROM "TopicMemberGroups" gt \
                    JOIN "Topics" t ON (t.id = gt."topicId") \
                    LEFT JOIN "Users" u ON (u.id = t."creatorId") \
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
                        SELECT "topicId", count("groupId")::integer AS "count" \
                        FROM "TopicMemberGroups" \
                        WHERE "deletedAt" IS NULL \
                        GROUP BY "topicId" \
                    ) AS mgc ON (mgc."topicId" = t.id) \
                WHERE gt."groupId" = :groupId \
                    AND gt."deletedAt" IS NULL \
                    AND t."deletedAt" IS NULL \
                    AND COALESCE(tmup.level, tmgp.level, \'none\')::"enum_TopicMemberUsers_level" > \'none\' \
                    ; \
                ',
                {
                    replacements: {
                        groupId: req.params.groupId,
                        userId: req.user.id
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function (topics) {
                return res.ok({
                    count: topics.length,
                    rows: topics
                });
            })
            .catch(next);
    });

    /**
     * Group list
     */
    app.get('/api/groups', function (req, res, next) {
        var limitMax = 100;
        var limitDefault = 26;

        var offset = req.query.offset || 0;
        var limit = req.query.limit || limitDefault;
        if (limit > limitMax) limit = limitDefault;

        var where = {
            visibility: Group.VISIBILITY.public,
            name: {
                not: null
            }
        };

        var name = req.query.name;
        if (name) {
            where.name = {
                $iLike: name
            };
        }

        var sourcePartnerId = req.query.sourcePartnerId;
        if (sourcePartnerId) {
            where.sourcePartnerId = sourcePartnerId;
        }
        // TODO: .findAndCount does 2 queries, either write a raw query using PG window functions (http://www.postgresql.org/docs/9.3/static/tutorial-window.html) or wait for Sequelize to fix it - https://github.com/sequelize/sequelize/issues/2465
        Group
            .findAndCount({
                where: where,
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'company'] // TODO: Should fix User model not to return "email" by default. I guess requires Sequelize scopes - https://github.com/sequelize/sequelize/issues/1462
                    }
                ],
                limit: limit,
                offset: offset,
                order: [['updatedAt', 'DESC']]
            })
            .then(function (result) {
                return res.ok({
                    countTotal: result.count,
                    count: result.rows.length,
                    rows: result.rows
                });
            })
            .catch(next);
    });

    /**
     * Read (List) public Group Activities
     */

    var groupActivitiesList = function (req, res, next, visibility) {
        var limitMax = 50;
        var limitDefault = 10;
        var groupId = req.params.groupId;
        var userId = null;
        if (req.user) {
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
                    CREATE OR REPLACE FUNCTION pg_temp.parseData(data jsonb) \
                        RETURNS jsonb \
                        AS \
                        $BODY$ \
                        DECLARE \
                        finalData jsonb = data; \
                        BEGIN \
                            IF ((data ? \'actor\') AND data#>>\'{actor, type}\' = \'User\' AND data#>>\'{actor, id}\' IS NOT NULL AND (data ? \'object\' AND data#>>\'{object, 0, @type}\' = \'VoteList\')) THEN \
                                SELECT jsonb_set( \
                                    data, \
                                    \'{actor}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'type\', data#>>\'{actor, type}\', \
                                            \'name\', \'User\', \
                                            \'company\', \'\' \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Users" u WHERE u.id::text = data#>>\'{actor, id}\'; \
                            ELSIF ((data ? \'actor\') AND data#>>\'{actor, type}\' = \'User\' AND data#>>\'{actor, id}\' IS NOT NULL ) THEN \
                                SELECT jsonb_set( \
                                    data, \
                                    \'{actor}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'id\', u.id, \
                                            \'type\', data#>>\'{actor, type}\', \
                                            \'name\', u.name, \
                                            \'company\', u.company \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Users" u WHERE u.id::text = data#>>\'{actor, id}\'; \
                            ELSE \
                                SELECT jsonb_set( \
                                    data, \
                                    \'{actor}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'type\', data#>>\'{actor, type}\' \
                                        ) \
                                    ), \
                                false) INTO finalData; \
                            END IF; \
                            IF ((data ? \'actor\') AND data#>>\'{actor, type}\' = \'User\' AND data#>>\'{actor, id}\' IS NULL  AND (data ? \'object\' AND data#>>\'{object, 0, @type}\' = \'VoteList\')) THEN \
                                SELECT \
                                    jsonb_set( \
                                        data, \
                                        \'{object, 0}\', \
                                        to_jsonb( \
                                            (data#>>\'{object, 0}\')::jsonb - \'userId\' \
                                        ), \
                                    false ) INTO finalData; \
                            END IF; \
                            IF ((finalData ? \'object\') AND finalData#>>\'{object, @type}\' = \'Group\') THEN \
                                SELECT jsonb_set( \
                                    finalData, \
                                    \'{object}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'id\', g.id, \
                                            \'@type\', finalData#>>\'{object, @type}\', \
                                            \'parentId\', g."parentId", \
                                            \'name\', g.name, \
                                            \'creatorId\', g."creatorId", \
                                            \'visibility\', g.visibility, \
                                            \'sourcePartnerId\', g."sourcePartnerId", \
                                            \'createdAt\', g."createdAt", \
                                            \'updatedAt\', g."updatedAt", \
                                            \'deletedAt\', g."deletedAt" \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Groups" g WHERE g.id::text = data#>>\'{object, id}\'; \
                            END IF; \
                            IF ((finalData ? \'object\') AND finalData#>>\'{object, @type}\' = \'Topic\') THEN \
                                SELECT jsonb_set( \
                                    finalData, \
                                    \'{object}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'id\', t.id, \
                                            \'@type\', finalData#>>\'{object, @type}\', \
                                            \'title\', t.title, \
                                            \'status\', t.status, \
                                            \'visibility\', t.visibility, \
                                            \'categories\', t.categories, \
                                            \'sourcePartnerId\', t."sourcePartnerId", \
                                            \'creatorId\', t."creatorId", \
                                            \'tokenJoin\', t."tokenJoin", \
                                            \'padUrl\', t."padUrl", \
                                            \'endsAt\', t."endsAt", \
                                            \'hashtag\', t.hashtag, \
                                            \'createdAt\', t."createdAt", \
                                            \'updatedAt\', t."updatedAt" \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Topics" t WHERE t.id::text = data#>>\'{object, id}\'; \
                            END IF; \
                            IF ((finalData ? \'object\') AND finalData#>>\'{object, @type}\' = \'User\') THEN \
                                SELECT jsonb_set( \
                                    finalData, \
                                    \'{object}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'id\', u.id, \
                                            \'@type\', finalData#>>\'{object, @type}\', \
                                            \'name\', u.name, \
                                            \'company\', u."company" \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Users" u WHERE u.id::text = data#>>\'{object, id}\'; \
                            END IF; \
                            IF ((finalData ? \'origin\') AND finalData#>>\'{origin, @type}\' = \'TopicMemberUser\') THEN \
                                SELECT jsonb_set( \
                                    finalData, \
                                    \'{object}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'@type\', finalData#>>\'{origin, @type}\', \
                                            \'level\', finalData#>>\'{origin, level}\', \
                                            \'userId\', finalData#>>\'{origin, userId}\', \
                                            \'topicId\', finalData#>>\'{origin, topicId}\', \
                                            \'createdAt\', finalData#>>\'{origin, createdAt}\', \
                                            \'deletedAt\', finalData#>>\'{origin, deletedAt}\', \
                                            \'updatedAt\', finalData#>>\'{origin, updatedAt}\', \
                                            \'userName\', u.name, \
                                            \'topicTitle\', t.title \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Users" u JOIN "Topics" t ON t.id = t.id WHERE u.id::text = data#>>\'{origin, userId}\' AND t.id::text = data#>>\'{origin, topicId}\'; \
                            END IF; \
                            IF ((finalData ? \'origin\') AND finalData#>>\'{origin, @type}\' = \'TopicMemberGroup\') THEN \
                                SELECT jsonb_set( \
                                    finalData, \
                                    \'{object}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'@type\', finalData#>>\'{origin, @type}\', \
                                            \'level\', finalData#>>\'{origin, level}\', \
                                            \'userId\', finalData#>>\'{origin, userId}\', \
                                            \'topicId\', finalData#>>\'{origin, topicId}\', \
                                            \'createdAt\', finalData#>>\'{origin, createdAt}\', \
                                            \'deletedAt\', finalData#>>\'{origin, deletedAt}\', \
                                            \'updatedAt\', finalData#>>\'{origin, updatedAt}\', \
                                            \'groupName\', g.name, \
                                            \'topicTitle\', t.title \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Groups" g JOIN "Topics" t ON t.id = t.id WHERE g.id::text = data#>>\'{origin, userId}\' AND t.id::text = data#>>\'{origin, topicId}\'; \
                            END IF; \
                            IF ((finalData ? \'target\') AND finalData#>>\'{target, @type}\' = \'Group\') THEN \
                                SELECT jsonb_set( \
                                    finalData, \
                                    \'{target}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'id\', g.id, \
                                            \'@type\', finalData#>>\'{target, @type}\', \
                                            \'parentId\', g."parentId", \
                                            \'name\', g.name, \
                                            \'creatorId\', g."creatorId", \
                                            \'visibility\', g.visibility, \
                                            \'sourcePartnerId\', g."sourcePartnerId", \
                                            \'createdAt\', g."createdAt", \
                                            \'updatedAt\', g."updatedAt", \
                                            \'deletedAt\', g."deletedAt" \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Groups" g WHERE g.id::text = data#>>\'{target, id}\'; \
                            END IF; \
                            IF ((finalData ? \'target\') AND finalData#>>\'{target, @type}\' = \'Topic\') THEN \
                                SELECT jsonb_set( \
                                    finalData, \
                                    \'{target}\', \
                                    to_jsonb( \
                                        json_build_object( \
                                            \'id\', t.id, \
                                            \'@type\', finalData#>>\'{target, @type}\', \
                                            \'title\', t.title, \
                                            \'status\', t.status, \
                                            \'visibility\', t.visibility, \
                                            \'categories\', t.categories, \
                                            \'sourcePartnerId\', t."sourcePartnerId", \
                                            \'creatorId\', t."creatorId", \
                                            \'tokenJoin\', t."tokenJoin", \
                                            \'padUrl\', t."padUrl", \
                                            \'endsAt\', t."endsAt", \
                                            \'hashtag\', t.hashtag, \
                                            \'createdAt\', t."createdAt", \
                                            \'updatedAt\', t."updatedAt" \
                                        ) \
                                    ), \
                                false) INTO finalData FROM "Topics" t WHERE t.id::text = data#>>\'{target, id}\'; \
                            END IF; \
                            RETURN finalData; \
                        END; \
                        $BODY$ \
                        LANGUAGE plpgsql; \
                    \
                    SELECT \
                        a.id, \
                        pdata as data, \
                        a."createdAt", \
                        a."updatedAt", \
                        a."deletedAt" \
                    FROM \
                        "Activities" a, \
                        pg_temp.parseData(a.data) pdata \
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
                        GROUP BY a.id, pdata, a."createdAt", a."updatedAt", a."deletedAt" \
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
                    raw: true
                })
                .then(function (results) {
                    if (userId) {
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
                    }

                    return results;
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

    app.get('/api/users/:userId/groups/:groupId/activities', loginCheck(['partner']), hasPermission(GroupMember.LEVELS.read, true), function (req, res, next) {
        return groupActivitiesList(req, res, next)
            .then(function (results) {
                return res.ok(results);
            })
            .catch(next);
    });
};
