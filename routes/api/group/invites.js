'use strict';

/**
 * Group invite endpoints
 */

module.exports = function (app) {
    const logger = app.get('logger');
    const models = app.get('models');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const _ = app.get('lodash');
    const cosActivities = app.get('cosActivities');
    const validator = app.get('validator');
    const emailLib = app.get('email');
    const util = app.get('util');
    const { hasGroupPermission: hasPermission, _groupPermission: _hasPermission } = app.get('permissionsService');

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');

    const Group = models.Group;
    const GroupInviteUser = models.GroupInviteUser;
    const GroupMemberUser = models.GroupMemberUser;
    const User = models.User;
    const UserConnection = models.UserConnection;

    /**
     * Invite new Members to the Group
     *
     * Does NOT add a Member automatically, but will send an invite, which has to accept in order to become a Member of the Group
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.post('/api/users/:userId/groups/:groupId/invites/users', loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin, true, null), asyncMiddleware(async function (req, res) {
        //NOTE: userId can be actual UUID or e-mail - it is comfort for the API user, but confusing in the BE code.
        const groupId = req.params.groupId;
        const userId = req.user.userId;
        let members = req.body;

        if (!Array.isArray(members)) {
            members = [members];
        }
        const inviteMessage = members[0].inviteMessage; // IF future holds personalized invite messages, every invite has its own message. Also, easiest solution without rewriting a lot of code.
        const validEmailMembers = [];
        let validUserIdMembers = [];

        // Need the Group just for the activity
        const group = await Group.findOne({
            where: {
                id: groupId
            }
        });
        const creator = await GroupMemberUser.findOne({
            where: {
                groupId: groupId,
                userId: req.user.id
            }
        });
        // userId can be actual UUID or e-mail, sort to relevant buckets
        _(members).forEach(function (m) {
            // Regular members can only invite members with read permissions
            if (group.visibility === Group.VISIBILITY.public && creator.level === GroupMemberUser.LEVELS.read) {
                m.level = GroupMemberUser.LEVELS.read;
            }

            if (m.userId) {
                m.userId = m.userId.trim();

                // Is it an e-mail?
                if (validator.isEmail(m.userId)) {
                    m.userId = m.userId.toLowerCase(); // https://github.com/citizenos/citizenos-api/issues/234
                    validEmailMembers.push(m); // The whole member object with level
                } else if (validator.isUUID(m.userId)) {
                    validUserIdMembers.push(m);
                } else {
                    logger.warn('Invalid member ID, is not UUID or email thus ignoring', req.method, req.path, m, req.body);
                }
            } else {
                logger.warn('Missing member id, ignoring', req.method, req.path, m, req.body);
            }
        });

        const validEmails = _.map(validEmailMembers, 'userId');
        if (validEmails.length) {
            // Find out which e-mails already exist
            const usersExistingEmail = await User
                .findAll({
                    where: {
                        email: {
                            [Op.iLike]: {
                                [Op.any]: validEmails
                            }
                        }
                    },
                    attributes: ['id', 'email']
                });


            _(usersExistingEmail).forEach(function (u) {
                const member = _.find(validEmailMembers, { userId: u.email });
                if (member) {
                    member.userId = u.id;
                    validUserIdMembers.push(member);
                    _.remove(validEmailMembers, member); // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                }
            });
        }

        await db.transaction(async function (t) {
            let createdUsers;

            // The leftovers are e-mails for which User did not exist
            if (validEmailMembers.length) {
                const usersToCreate = [];
                _(validEmailMembers).forEach(function (m) {
                    usersToCreate.push({
                        email: m.userId,
                        language: m.language,
                        password: null,
                        name: util.emailToDisplayName(m.userId),
                        source: User.SOURCES.citizenos
                    });
                });

                createdUsers = await User.bulkCreate(usersToCreate, { transaction: t });

                const createdUsersActivitiesCreatePromises = createdUsers.map(async function (user) {
                    return cosActivities.createActivity(
                        user,
                        null,
                        {
                            type: 'System',
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );
                });

                await Promise.all(createdUsersActivitiesCreatePromises);
            }

            // Go through the newly created users and add them to the validUserIdMembers list so that they get invited
            if (createdUsers?.length) {
                _(createdUsers).forEach(function (u) {
                    const member = {
                        userId: u.id
                    };

                    // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                    const level = _.find(validEmailMembers, { userId: u.email }).level;
                    if (level) {
                        member.level = level;
                    }

                    validUserIdMembers.push(member);
                });
            }

            validUserIdMembers = validUserIdMembers.filter(function (member) {
                return member.userId !== req.user.userId; // Make sure user does not invite self
            });
            const currentMembers = await GroupMemberUser.findAll({
                where: {
                    groupId: groupId
                }
            });

            const createInvitePromises = validUserIdMembers.map(async function (member) {
                const existingMember = currentMembers.find(function (cmember) {
                    return cmember.userId === member.userId;
                });
                if (existingMember) {
                    const levelsArray = Object.keys(GroupMemberUser.LEVELS);
                    if (existingMember.level !== member.level) {
                        if (levelsArray.indexOf(member.level) > levelsArray.indexOf(existingMember.level)) {
                            await existingMember.update({
                                level: member.level
                            });

                            cosActivities
                                .updateActivity(
                                    existingMember,
                                    null,
                                    {
                                        type: 'User',
                                        id: req.user.userId,
                                        ip: req.ip
                                    },
                                    req.method + ' ' + req.path,
                                    t
                                );

                            return;
                        }

                        return;
                    } else {
                        return;
                    }
                } else {
                    const deletedCount = await GroupInviteUser
                        .destroy(
                            {
                                where: {
                                    userId: member.userId,
                                    groupId: groupId
                                }
                            }
                        );
                    logger.info(`Removed ${deletedCount} invites`);
                    const groupInvite = await GroupInviteUser.create(
                        {
                            groupId: groupId,
                            creatorId: userId,
                            userId: member.userId,
                            level: member.level
                        },
                        {
                            transaction: t
                        }
                    );

                    const userInvited = User.build({ id: groupInvite.userId });
                    userInvited.dataValues.level = groupInvite.level; // FIXME: HACK? Invite event, putting level here, not sure it belongs here, but.... https://github.com/citizenos/citizenos-fe/issues/112 https://github.com/w3c/activitystreams/issues/506
                    userInvited.dataValues.inviteId = groupInvite.id;

                    await cosActivities.inviteActivity(
                        group,
                        userInvited,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    return groupInvite;
                }
            });

            let createdInvites = await Promise.all(createInvitePromises);
            createdInvites = createdInvites.filter(function (invite) {
                return !!invite;
            });

            for (let invite of createdInvites) { // IF future holds personalized invite messages, every invite has its own message and this code can be removed.
                invite.inviteMessage = inviteMessage;
            }

            t.afterCommit(async () => {
                if (createdInvites.length) {
                    await emailLib.sendGroupMemberUserInviteCreate(createdInvites);
                    return res.created({
                        count: createdInvites.length,
                        rows: createdInvites
                    });
                } else {
                    return res.badRequest('No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.', 1);
                }
            });
        });
    }));

    /**
     * Get all pending User invites for a Group
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.get('/api/users/:userId/groups/:groupId/invites/users', loginCheck(), asyncMiddleware(async function (req, res) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        let where = '';
        if (search) {
            where = ` AND u.name ILIKE :search `
        }

        const groupId = req.params.groupId;
        const userId = req.user.userId;

        const permissions = await _hasPermission(groupId, userId, GroupMemberUser.LEVELS.read, null, null);

        // User is not member and can only get own result
        if (!permissions) {
            where = ` AND giu."userId" = :userId `;
        }

        let dataForTopicAdminAndModerator = '';

        if (permissions && (permissions.group.level === GroupMemberUser.LEVELS.admin || permissions.group.isModerator)) {
            dataForTopicAdminAndModerator = `
            u.email as "user.email",
            `;
        }

        const invites = await db
            .query(
                `SELECT
                    giu.id,
                    giu."creatorId",
                    giu.level,
                    giu."groupId",
                    giu."userId",
                    giu."expiresAt",
                    giu."createdAt",
                    giu."updatedAt",
                    u.id as "user.id",
                    u.name as "user.name",
                    u."imageUrl" as "user.imageUrl",
                    ${dataForTopicAdminAndModerator}
                    count(*) OVER()::integer AS "countTotal"
                FROM "GroupInviteUsers" giu
                JOIN "Users" u ON u.id = giu."userId"
                LEFT JOIN "UserConnections" uc ON (uc."userId" = giu."userId" AND uc."connectionId" = 'esteid')
                WHERE giu."groupId" = :groupId AND giu."deletedAt" IS NULL AND giu."expiresAt" > NOW()
                ${where}
                ORDER BY u.name ASC
                LIMIT :limit
                OFFSET :offset
                ;`,
                {
                    replacements: {
                        groupId: groupId,
                        limit,
                        offset,
                        userId,
                        search: `%${search}%`
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        if (!invites) {
            return res.notFound();
        }
        let countTotal = 0;
        if (invites.length) {
            countTotal = invites[0].countTotal;
        } else if (!permissions) {
            return res.forbidden('Insufficient permissions');
        }

        invites.forEach(function (invite) {

            if (invite.user?.email) {
                invite.user.email = invite.user.email.replace(/^(.).*(?=@)/, '$1*****');
            }
            delete invite.countTotal;
        });

        return res.ok({
            countTotal,
            count: invites.length,
            rows: invites
        });
    }));

    /**
     * Get specific invite for a Group
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.get(['/api/groups/:groupId/invites/users/:inviteId', '/api/users/:userId/groups/:groupId/invites/users/:inviteId'], asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;

        const invite = await GroupInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        groupId: groupId
                    },
                    paranoid: false, // return deleted!
                    include: [
                        {
                            model: Group,
                            attributes: ['id', 'name', 'creatorId', 'visibility'],
                            as: 'group',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'company', 'imageUrl'],
                            as: 'creator',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );

        if (!invite) {
            return res.notFound();
        }
        let hasAccess;
        try {
            hasAccess = await _hasPermission(groupId, invite.userId, GroupMemberUser.LEVELS.read, null, null);
        } catch (e) {
            logger.debug(e);
            hasAccess = false;
        }

        if (hasAccess) {
            return res.ok(invite, 1); // Invite has already been accepted OR deleted and the person has access
        }

        const invites = await GroupInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        groupId: invite.groupId
                    },
                    paranoid: false, // return deleted!
                    include: [
                        {
                            model: Group,
                            attributes: ['id', 'name', 'creatorId', 'visibility', 'description', 'imageUrl'],
                            as: 'group',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'company', 'imageUrl'],
                            as: 'creator',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );
        const levels = Object.keys(GroupMemberUser.LEVELS);
        const finalInvites = invites.filter((invite) => {
            if (invite.expiresAt > Date.now() && invite.deletedAt === null) {
                return invite;
            }
        }).sort((a, b) => {
            if (levels.indexOf(a.level) < levels.indexOf(b.level)) return 1;
            if (levels.indexOf(a.level) > levels.indexOf(b.level)) return -1;
            if (levels.indexOf(a.level) === levels.indexOf(b.level)) return 0;
        });

        if (!finalInvites.length) {
            if (invite.deletedAt) {
                return res.gone('The invite has been deleted', 1);
            }


            if (invite.expiresAt < Date.now()) {
                return res.gone(`The invite has expired. Invites are valid for ${GroupInviteUser.VALID_DAYS} days`, 2);
            }
        }

        // At this point we can already confirm users e-mail
        await User
            .update(
                {
                    emailIsVerified: true
                }, {
                where: {
                    id: invite.userId
                },
                fields: ['emailIsVerified'],
                limit: 1
            }
            );

        // User has not been registered by a person but was created by the system on invite - https://github.com/citizenos/citizenos-fe/issues/773
        if (!invite.user.password && invite.user.source === User.SOURCES.citizenos && !invite.user.UserConnections.length) {
            return res.ok(finalInvites[0], 2);
        }

        return res.ok(finalInvites[0]);
    }));

    app.put(['/api/groups/:groupId/invites/users/:inviteId', '/api/users/:userId/groups/:groupId/invites/users/:inviteId'], loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const newLevel = req.body.level;
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;

        if (!(GroupMemberUser.LEVELS[newLevel])) {
            return res.badRequest(`Invalid level "${newLevel}"`)
        }

        const groupInviteUser = await GroupInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        groupId: groupId
                    }
                }
            );

        if (groupInviteUser) {
            await db.transaction(async function (t) {
                groupInviteUser.level = newLevel;

                await cosActivities.updateActivity(
                    groupInviteUser,
                    null,
                    {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    },
                    req.method + ' ' + req.path,
                    t
                );

                await groupInviteUser.save({
                    transaction: t
                });

                t.afterCommit(() => {
                    return res.ok();
                });
            });
        } else {
            return res.notFound();
        }
    }));

    /**
     * Delete Group invite
     *
     * @see https://github.com/citizenos/citizenos-fe/issues/348
     */
    app.delete(['/api/groups/:groupId/invites/users/:inviteId', '/api/users/:userId/groups/:groupId/invites/users/:inviteId'], loginCheck(), hasPermission(GroupMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;
        const invite = await GroupInviteUser.findOne({
            where: {
                id: inviteId
            },
            paranoid: false
        });

        if (!invite) {
            return res.notFound('Invite not found', 1);
        }

        const deletedCount = await GroupInviteUser
            .destroy(
                {
                    where: {
                        userId: invite.userId,
                        groupId: groupId
                    }
                }
            );

        if (!deletedCount) {
            return res.notFound('Invite not found', 1);
        }

        return res.ok();
    }));

    /**
     * Accept a group invite
     */
    app.post(['/api/users/:userId/groups/:groupId/invites/users/:inviteId/accept', '/api/groups/:groupId/invites/users/:inviteId/accept'], loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;
        const groupId = req.params.groupId;
        const inviteId = req.params.inviteId;

        const invite = await GroupInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        groupId: groupId
                    },
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    },
                    paranoid: false
                }
            );

        if (invite && invite.userId !== userId) {
            return res.forbidden();
        }
        const invites = await GroupInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        groupId: groupId
                    },
                    include: [
                        {
                            model: Group,
                            attributes: ['id', 'name', 'creatorId'],
                            as: 'group',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'name', 'company', 'imageUrl'],
                            as: 'creator',
                            required: true
                        },
                        {
                            model: User,
                            attributes: ['id', 'email', 'password', 'source'],
                            as: 'user',
                            required: true,
                            include: [UserConnection]
                        }
                    ],
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "GroupInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );
        const levelsArray = Object.values(GroupMemberUser.LEVELS);
        const finalInvites = invites.filter((invite) => {
            if (invite.expiresAt > Date.now() && invite.deletedAt === null) {
                return invite;
            }
        }).sort((a, b) => {
            if (levelsArray.indexOf(a.level) < levelsArray.indexOf(b.level)) return 1;
            if (levelsArray.indexOf(a.level) > levelsArray.indexOf(b.level)) return -1;
            if (levelsArray.indexOf(a.level) === levelsArray.indexOf(b.level)) return 0;
        });
        // Find out if the User is already a member of the Group
        const memberUserExisting = await GroupMemberUser
            .findOne({
                where: {
                    groupId: groupId,
                    userId: userId
                }
            });
        if (memberUserExisting) {
            // User already a member, see if we need to update the level
            if (finalInvites.length && levelsArray.indexOf(memberUserExisting.level) < levelsArray.indexOf(finalInvites[0].level)) {
                const memberUserUpdated = await memberUserExisting.update({
                    level: invite.level
                });
                return res.ok(memberUserUpdated);
            } else {
                // No level update, respond with existing member info
                return res.ok(memberUserExisting);
            }
        }

        if (!finalInvites.length) {
            // Find out if the User is already a member of the Topic
            if (invite.expiresAt < Date.now()) {
                return res.gone(`The invite has expired. Invites are valid for ${GroupInviteUser.VALID_DAYS} days`, 2);
            }
            return res.notFound();
        }

        const finalInvite = finalInvites[0];

        // Group needed just for the activity
        const group = await Group.findOne({
            where: {
                id: invite.groupId
            }
        });

        await db.transaction(async function (t) {
            const member = await GroupMemberUser.create(
                {
                    groupId: invite.groupId,
                    userId: invite.userId,
                    level: GroupMemberUser.LEVELS[invite.level]
                },
                {
                    transaction: t
                }
            );

            await GroupInviteUser.destroy({
                where: {
                    groupId: finalInvite.groupId,
                    userId: finalInvite.userId
                },
                transaction: t
            });

            const user = User.build({ id: member.userId });
            user.dataValues.id = member.userId;

            await cosActivities.acceptActivity(
                finalInvite,
                {
                    type: 'User',
                    id: req.user.userId,
                    ip: req.ip
                },
                {
                    type: 'User',
                    id: invite.creatorId
                },
                group,
                req.method + ' ' + req.path,
                t
            );
            t.afterCommit(() => {
                return res.created(member);
            });
        });
    }));
};
