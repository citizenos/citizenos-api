'use strict';

module.exports = function (app) {
    const logger = app.get('logger');
    const models = app.get('models');
    const db = models.sequelize;
    const Op = db.Sequelize.Op;
    const validator = app.get('validator');
    const util = app.get('util');
    const urlLib = app.get('urlLib');
    const emailLib = app.get('email');
    const cosActivities = app.get('cosActivities');

    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const speedLimiter = app.get('speedLimiter');
    const rateLimiter = app.get('rateLimiter');

    const User = models.User;
    const UserConnection = models.UserConnection;
    const Topic = models.Topic;
    const TopicMemberUser = models.TopicMemberUser;
    const TopicJoin = models.TopicJoin;
    const TopicInviteUser = models.TopicInviteUser;

    const topicService = app.get('topicService');

    /**
     * Invite new Members to the Topic
     *
     * Does NOT add a Member automatically, but will send an invite, which has to accept in order to become a Member of the Topic
     *
     * @see /api/users/:userId/topics/:topicId/members/users "Auto accept" - Adds a Member to the Topic instantly and sends a notification to the User.
     */
    app.post('/api/users/:userId/topics/:topicId/invites/users', loginCheck(), topicService.hasPermission(TopicMemberUser.LEVELS.admin, false, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress, Topic.STATUSES.voting, Topic.STATUSES.followUp]), rateLimiter(5, false), speedLimiter(1, false), asyncMiddleware(async function (req, res) {
        //NOTE: userId can be actual UUID or e-mail - it is comfort for the API user, but confusing in the BE code.
        const topicId = req.params.topicId;
        const userId = req.user.userId;
        let members = req.body;
        const MAX_LENGTH = 50;

        if (!Array.isArray(members)) {
            members = [members];
        }

        if (members.length > MAX_LENGTH) {
            return res.badRequest("Maximum user limit reached");
        }

        const inviteMessage = members[0].inviteMessage;
        const validEmailMembers = [];
        let validUserIdMembers = [];

        // userId can be actual UUID or e-mail, sort to relevant buckets
        members.forEach((m) => {
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

        const validEmails = validEmailMembers.map(m => m.userId);
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

            usersExistingEmail.forEach((u) => {
                const member = validEmailMembers.find(m => {
                    return m.userId === u.email
                });
                if (member) {
                    const index = validEmailMembers.findIndex(m => m.userId === u.email);
                    member.userId = u.id;
                    validUserIdMembers.push(member);
                    validEmailMembers.splice(index, 1) // Remove the e-mail, so that by the end of the day only e-mails that did not exist remain.
                }
            });
        }

        await db.transaction(async function (t) {
            let createdUsers;

            // The leftovers are e-mails for which User did not exist
            if (validEmailMembers.length) {
                const usersToCreate = [];
                validEmailMembers.forEach((m) => {
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
            if (createdUsers && createdUsers.length) {
                createdUsers.forEach((u) => {
                    const member = {
                        userId: u.id
                    };

                    // Sequelize defaultValue has no effect if "undefined" or "null" is set for attribute...
                    const level = validEmailMembers.find(m => m.userId === u.email).level;
                    if (level) {
                        member.level = level;
                    }

                    validUserIdMembers.push(member);
                });
            }

            // Need the Topic just for the activity
            const topic = await topicService.getById(topicId);

            validUserIdMembers = validUserIdMembers.filter(function (member) {
                return member.userId !== req.user.userId; // Make sure user does not invite self
            });
            const currentMembers = await TopicMemberUser.findAll({
                where: {
                    topicId: topicId
                }
            });

            const createInvitePromises = validUserIdMembers.map(async function (member) {
                const addedMember = currentMembers.find(function (cmember) {
                    return cmember.userId === member.userId;
                });
                if (addedMember) {
                    const LEVELS = {
                        none: 0, // Enables to override inherited permissions.
                        read: 1,
                        edit: 2,
                        admin: 3
                    };
                    if (addedMember.level !== member.level) {
                        if (LEVELS[member.level] > LEVELS[addedMember.level]) {
                            await addedMember.update({
                                level: member.level
                            });

                            cosActivities.updateActivity(
                                addedMember,
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
                    const deletedCount = await TopicInviteUser
                        .destroy(
                            {
                                where: {
                                    userId: member.userId,
                                    topicId: topicId
                                }
                            }
                        );
                    logger.info(`Removed ${deletedCount} invites`);
                    const topicInvite = await TopicInviteUser.create(
                        {
                            topicId: topicId,
                            creatorId: userId,
                            userId: member.userId,
                            level: member.level
                        },
                        {
                            transaction: t
                        }
                    );

                    const userInvited = User.build({ id: topicInvite.userId });
                    userInvited.dataValues.level = topicInvite.level; // FIXME: HACK? Invite event, putting level here, not sure it belongs here, but.... https://github.com/citizenos/citizenos-fe/issues/112 https://github.com/w3c/activitystreams/issues/506
                    userInvited.dataValues.inviteId = topicInvite.id; // FIXME: HACK? Invite event, pu

                    await cosActivities.inviteActivity(
                        topic,
                        userInvited,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );

                    return topicInvite;
                }
            });

            let createdInvites = await Promise.all(createInvitePromises);

            createdInvites = createdInvites.filter(function (invite) {
                return !!invite;
            });

            for (let invite of createdInvites) {
                invite.inviteMessage = inviteMessage;
            }

            t.afterCommit(async () => {
                if (createdInvites.length) {
                    await emailLib.sendTopicMemberUserInviteCreate(createdInvites);
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

    app.get('/api/users/:userId/topics/:topicId/invites/users', loginCheck(), asyncMiddleware(async function (req, res) {
        const limitDefault = 10;
        const offset = parseInt(req.query.offset, 10) ? parseInt(req.query.offset, 10) : 0;
        let limit = parseInt(req.query.limit, 10) ? parseInt(req.query.limit, 10) : limitDefault;
        const search = req.query.search;

        const topicId = req.params.topicId;
        const userId = req.user.userId;
        const permissions = await topicService._hasPermission(topicId, userId, TopicMemberUser.LEVELS.read, true);

        let where = '';
        if (search) {
            where = ` AND u.name ILIKE :search `
        }

        const order = req.query.order;
        let sortOrder = req.query.sortOrder || 'ASC';

        if (sortOrder && ['asc', 'desc'].indexOf(sortOrder.toLowerCase()) === -1) {
            sortOrder = 'ASC';
        }

        let sortSql = ` ORDER BY `;

        if (order) {
            switch (order) {
                case 'name':
                    sortSql += ` u.name ${sortOrder} `;
                    break;
                case 'level':
                    sortSql += ` tiu."level"::"enum_TopicInviteUsers_level" ${sortOrder} `;
                    break;
                default:
                    sortSql += ` u.name ASC `
            }
        } else {
            sortSql += ` u.name ASC `;
        }

        let dataForTopicAdmin = '';
        if (permissions && permissions.topic.permissions.level === TopicMemberUser.LEVELS.admin) {
            dataForTopicAdmin = `
            u.email as "user.email",
            `;
        }

        // User is not member and can only get own result
        if (!permissions) {
            where = ` AND tiu."userId" = :userId `;
        }

        const invites = await db
            .query(
                `SELECT
                        tiu.id,
                        tiu."creatorId",
                        tiu.level,
                        tiu."topicId",
                        tiu."userId",
                        tiu."expiresAt",
                        tiu."createdAt",
                        tiu."updatedAt",
                        u.id as "user.id",
                        u.name as "user.name",
                        u."imageUrl" as "user.imageUrl",
                        ${dataForTopicAdmin}
                        count(*) OVER()::integer AS "countTotal"
                    FROM "TopicInviteUsers" tiu
                    JOIN "Users" u ON u.id = tiu."userId"
                    LEFT JOIN "UserConnections" uc ON (uc."userId" = tiu."userId" AND uc."connectionId" = 'esteid')
                    WHERE tiu."topicId" = :topicId AND tiu."deletedAt" IS NULL AND tiu."expiresAt" > NOW()
                    ${where}
                    ${sortSql}
                    LIMIT :limit
                    OFFSET :offset
                    ;`,
                {
                    replacements: {
                        topicId,
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
            if (invite.user.email) {
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

    app.get(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        const invite = await TopicInviteUser
            .findOne({
                where: {
                    id: inviteId,
                    topicId: topicId
                },
                paranoid: false,
                include: [
                    {
                        model: Topic,
                        attributes: ['id', 'title', 'visibility', 'creatorId', 'imageUrl', 'intro', 'description'],
                        as: 'topic',
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
                            db.literal(`EXTRACT(DAY FROM (NOW() - "TopicInviteUser"."createdAt"))`),
                            'createdDaysAgo'
                        ]
                    ]
                }
            });

        if (!invite) {
            return res.notFound();
        }
        const hasAccess = await topicService._hasPermission(topicId, invite.userId, TopicMemberUser.LEVELS.read, true);

        if (hasAccess) {
            return res.ok(invite, 1); // Invite has already been accepted OR deleted and the person has access
        }

        const invites = await TopicInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        topicId: topicId
                    },
                    include: [
                        {
                            model: Topic,
                            attributes: ['id', 'title', 'visibility', 'creatorId', 'imageUrl', 'intro', 'description'],
                            as: 'topic',
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
                                db.literal(`EXTRACT(DAY FROM (NOW() - "TopicInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );

        const levels = Object.keys(TopicMemberUser.LEVELS);
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
                return res.gone(`The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`, 2);
            }
        }

        // At this point we can already confirm users e-mail
        await User
            .update(
                {
                    emailIsVerified: true
                },
                {
                    where: { id: invite.userId },
                    fields: ['emailIsVerified'],
                    limit: 1
                }
            );

        // User has not been registered by a person but was created by the system on invite - https://github.com/citizenos/citizenos-fe/issues/773
        if (!invite.user.password && invite.user.source === User.SOURCES.citizenos && !invite.user.UserConnections.length) {
            return res.ok(finalInvites[0], 2);
        }

        return res.ok(finalInvites[0], 0);
    }));

    app.put(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], loginCheck(), topicService.hasPermission(TopicMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const newLevel = req.body.level;
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        if (!(TopicMemberUser.LEVELS[newLevel])) {
            return res.badRequest(`Invalid level "${newLevel}"`)
        }

        const topicMemberUser = await TopicInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        topicId: topicId
                    }
                }
            );

        if (topicMemberUser) {
            await db.transaction(async function (t) {
                topicMemberUser.level = newLevel;

                await cosActivities.updateActivity(
                    topicMemberUser,
                    null,
                    {
                        type: 'User',
                        id: req.user.userId,
                        ip: req.ip
                    },
                    req.method + ' ' + req.path,
                    t
                );

                await topicMemberUser.save({
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

    app.delete(['/api/topics/:topicId/invites/users/:inviteId', '/api/users/:userId/topics/:topicId/invites/users/:inviteId'], loginCheck(), topicService.hasPermission(TopicMemberUser.LEVELS.admin), asyncMiddleware(async function (req, res) {
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;
        const invite = await TopicInviteUser.findOne({
            where: {
                id: inviteId
            },
            paranoid: false
        });

        if (!invite) {
            return res.notFound('Invite not found', 1);
        }

        const deletedCount = await TopicInviteUser
            .destroy(
                {
                    where: {
                        userId: invite.userId,
                        topicId: topicId
                    }
                }
            );

        if (!deletedCount) {
            return res.notFound('Invite not found', 1);
        }

        return res.ok();
    }));

    app.post(['/api/users/:userId/topics/:topicId/invites/users/:inviteId/accept', '/api/topics/:topicId/invites/users/:inviteId/accept'], loginCheck(), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;
        const topicId = req.params.topicId;
        const inviteId = req.params.inviteId;

        const invite = await TopicInviteUser
            .findOne(
                {
                    where: {
                        id: inviteId,
                        topicId: topicId
                    },
                    attributes: {
                        include: [
                            [
                                db.literal(`EXTRACT(DAY FROM (NOW() - "TopicInviteUser"."createdAt"))`),
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
        const invites = await TopicInviteUser
            .findAll(
                {
                    where: {
                        userId: invite.userId,
                        topicId: topicId
                    },
                    include: [
                        {
                            model: Topic,
                            attributes: ['id', 'title', 'visibility', 'creatorId'],
                            as: 'topic',
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
                                db.literal(`EXTRACT(DAY FROM (NOW() - "TopicInviteUser"."createdAt"))`),
                                'createdDaysAgo'
                            ]
                        ]
                    }
                }
            );
        const levelsArray = Object.values(TopicMemberUser.LEVELS);
        const finalInvites = invites.filter((invite) => {
            if (invite.expiresAt > Date.now() && invite.deletedAt === null) {
                return invite;
            }
        }).sort((a, b) => {
            if (levelsArray.indexOf(a.level) < levelsArray.indexOf(b.level)) return 1;
            if (levelsArray.indexOf(a.level) > levelsArray.indexOf(b.level)) return -1;
            if (levelsArray.indexOf(a.level) === levelsArray.indexOf(b.level)) return 0;
        });
        const memberUserExisting = await TopicMemberUser
            .findOne({
                where: {
                    topicId: topicId,
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
                return res.gone(`The invite has expired. Invites are valid for ${TopicInviteUser.VALID_DAYS} days`, 2);
            }
            return res.notFound();
        }

        const finalInvite = finalInvites[0];
        // Has the invite expired?


        // Topic needed just for the activity
        const topic = await topicService.getById(finalInvite.topicId);

        await db.transaction(async function (t) {
            const member = await TopicMemberUser.create(
                {
                    topicId: finalInvite.topicId,
                    userId: finalInvite.userId,
                    level: TopicMemberUser.LEVELS[finalInvite.level]
                },
                {
                    transaction: t
                }
            );

            await TopicInviteUser.destroy({
                where: {
                    topicId: finalInvite.topicId,
                    userId: finalInvite.userId
                },
                transaction: t
            });

            await Topic.increment('memberCount', {
                where: { id: finalInvite.topicId },
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
                    id: finalInvite.creatorId
                },
                topic,
                req.method + ' ' + req.path,
                t
            );
            t.afterCommit(() => {
                return res.created(member);
            });
        });
    }));

    /**
     * Get PUBLIC Topic information for given token.
     * Returns 404 for PRIVATE Topic even if it exists.
     */
    app.get('/api/topics/join/:token', async function (req, res) {
        const token = req.params.token;
        const user = req.user;
        const topicJoin = await TopicJoin.findOne({
            where: {
                token: token
            }
        });

        if (!topicJoin) {
            return res.notFound();
        }
        let topicMember;
        if (user) {
            topicMember = await db.query(`
            SELECT
            COALESCE(
                tmup.level,
                tmgp.level,
                    'none'
            ) as "level"
            FROM "Topics" t
                LEFT JOIN (
                SELECT
                    tmu."topicId",
                    tmu."userId",
                    tmu.level::text AS level
                FROM "TopicMemberUsers" tmu
                WHERE tmu."deletedAt" IS NULL
            ) AS tmup ON (tmup."topicId" = t.id AND tmup."userId" = :userId)
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
            ) AS tmgp ON (tmgp."topicId" = t.id AND tmgp."userId" = :userId)
            WHERE t.id = :topicId
            `, {
                replacements: {
                    topicId: topicJoin.topicId,
                    userId: user.id
                },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true
            });
        }
        let topic = await topicService.getById(topicJoin.topicId, null, {
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'company', 'imageUrl'],
                    as: 'creator',
                    required: true
                },
            ],
            attributes: ['id', 'visibility', 'title', 'intro', 'description', 'imageUrl', 'visibility']
        });

        if (!topic) {
            return res.notFound();
        }
        topic = topic.toJSON();
        if (topicMember && topicMember.length) {
            topic.permission = { level: topicMember[0].level };
        }

        return res.ok(topic);
    });


    /**
     * Join authenticated User to Topic with a given token.
     *
     * Allows sharing of private join urls for example in forums, on conference screen...
     */
    app.post('/api/topics/join/:token', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const token = req.params.token;
        const userId = req.user.userId;

        const topicJoin = await TopicJoin.findOne({
            where: {
                token: token
            }
        });

        if (!topicJoin) {
            return res.badRequest('Matching token not found', 1);
        }

        const topic = await topicService.getById(topicJoin.topicId);

        await db.transaction(async function (t) {
            const [memberUser, created] = await TopicMemberUser.findOrCreate({//eslint-disable-line
                where: {
                    topicId: topic.id,
                    userId: userId
                },
                defaults: {
                    level: topicJoin.level
                },
                transaction: t
            });

            if (created) {
                const user = await User.findOne({
                    where: {
                        id: userId
                    }
                });

                await cosActivities.joinActivity(
                    topic,
                    {
                        type: 'User',
                        id: user.id,
                        ip: req.ip,
                        level: topicJoin.level
                    },
                    req.method + ' ' + req.path,
                    t
                );
            }
            const authorIds = topic.authorIds;
            const authors = await User.findAll({
                where: {
                    id: authorIds
                },
                attributes: ['id', 'name'],
                raw: true
            });

            const resObject = topic.toJSON();

            resObject.authors = authors;
            resObject.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });
            t.afterCommit(() => {
                return res.ok(resObject);
            });
        });
    }));

    /**
     * Join authenticated User to Topic with a given token.
     *
     * Allows sharing of private join urls for example in forums, on conference screen...
     */
    app.post('/api/users/:userId/topics/:topicId/join', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const userId = req.user.userId;

        const topic = await topicService.getById(req.params.topicId, null, {
            where: {
                visibility: Topic.VISIBILITY.public
            }
        });

        if (!topic) {
            return res.badRequest('Topic not found', 1);
        }



        await db.transaction(async function (t) {
            const [memberUser, created] = await TopicMemberUser.findOrCreate({//eslint-disable-line
                where: {
                    topicId: topic.id,
                    userId: userId
                },
                defaults: {
                    level: TopicMemberUser.LEVELS.read
                },
                transaction: t
            });

            if (created) {
                const user = await User.findOne({
                    where: {
                        id: userId
                    }
                });

                await cosActivities.joinActivity(
                    topic,
                    {
                        type: 'User',
                        id: user.id,
                        ip: req.ip,
                        level: TopicMemberUser.LEVELS.read
                    },
                    req.method + ' ' + req.path,
                    t
                );
            }
            const authorIds = topic.authorIds;
            const authors = await User.findAll({
                where: {
                    id: authorIds
                },
                attributes: ['id', 'name'],
                raw: true
            });

            const resObject = topic.toJSON();

            resObject.authors = authors;
            resObject.url = urlLib.getFe('/topics/:topicId', { topicId: topic.id });
            t.afterCommit(() => {
                return res.ok(resObject);
            });
        });
    }));
};
