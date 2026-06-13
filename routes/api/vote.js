'use strict';

module.exports = function (app) {
    const sanitizeFilename = app.get('sanitizeFilename');

    const models = app.get('models');
    const db = models.sequelize;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;
    const Vote = models.Vote;
    const VoteDelegation = models.VoteDelegation;
    const VoteUserContainer = models.VoteUserContainer;
    const VoteOption = models.VoteOption;
    const User = models.User;

    const cosActivities = app.get('cosActivities');
    const logger = app.get('logger');
    const loginCheck = app.get('middleware.loginCheck');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const voteService = app.get('voteService');
    const topicService = app.get('topicService');

    /**
     * Create a Vote
     */
    app.post('/api/users/:userId/topics/:topicId/votes', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation, Topic.STATUSES.inProgress]), async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const userId = req.user.userId;
            const voteData = {
                minChoices: req.body.minChoices,
                maxChoices: req.body.maxChoices,
                delegationIsAllowed: req.body.delegationIsAllowed,
                endsAt: req.body.endsAt,
                description: req.body.description,
                type: req.body.type,
                authType: req.body.authType,
                autoClose: req.body.autoClose,
                reminderTime: req.body.reminderTime
            };
            const voteOptions = req.body.options;
            const activityContext = {
                ip: req.ip,
                method: req.method,
                path: req.path
            };

            const vote = await voteService.createTopicVote(topicId, userId, voteData, voteOptions, activityContext);
            return res.created(vote.toJSON());
        } catch (e) {
            if (e.validationError) {
                return res.badRequest(e.message, e.code);
            }
            if (e.status === 404) {
                return res.notFound();
            }
            next(e);
        }
    });


    /**
     * Read a Vote
     */
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const voteId = req.params.voteId;
            const userId = req.user.userId;

            const voteInfo = await Vote.findOne({
                where: { id: voteId },
                include: [
                    {
                        model: Topic,
                        where: { id: topicId }
                    },
                    VoteOption,
                    {
                        model: VoteDelegation,
                        where: {
                            voteId: voteId,
                            byUserId: userId
                        },
                        attributes: ['id'],
                        required: false,
                        include: [
                            {
                                model: User
                            }
                        ]
                    }
                ]
            });

            if (!voteInfo) {
                return res.notFound();
            }

            const voteResults = await voteService.getVoteResults(voteId, userId);
            let hasVoted = false;
            if (voteResults && voteResults.length) {
                voteInfo.dataValues.VoteOptions.forEach(function (option) {
                    const result = voteResults.find((o) => o.optionId === option.id);

                    if (result) {
                        const voteCount = parseInt(result.voteCount, 10);
                        if (voteCount)
                            option.dataValues.voteCount = voteCount;//TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                        if (result.selected) {
                            option.dataValues.selected = result.selected; //TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                            hasVoted = true;
                        }
                    }
                });

                voteInfo.dataValues.votersCount = voteResults[0].votersCount;
            }

            // TODO: Contains duplicate code with GET /status AND /sign
            if (hasVoted && voteInfo.authType === Vote.AUTH_TYPES.hard) {
                voteInfo.dataValues.downloads = {
                    bdocVote: voteService.getBdocURL({
                        userId: userId,
                        topicId: topicId,
                        voteId: voteId,
                        type: 'user'
                    })
                };
            }

            if (req.locals.topic.permissions.level === TopicMemberUser.LEVELS.admin && [Topic.STATUSES.followUp, Topic.STATUSES.closed].indexOf(req.locals.topic.status) > -1) {
                if (!voteInfo.dataValues.downloads) {
                    voteInfo.dataValues.downloads = {};
                }
                const voteFinalURLParams = {
                    userId: userId,
                    topicId: topicId,
                    voteId: voteId,
                    type: 'final'
                };
                if (voteInfo.authType === Vote.AUTH_TYPES.hard) {
                    voteInfo.dataValues.downloads.bdocFinal = voteService.getBdocURL(voteFinalURLParams);
                } else {
                    voteInfo.dataValues.downloads.zipFinal = voteService.getZipURL(voteFinalURLParams);
                }
            }

            return res.ok(voteInfo);


        } catch (e) {
            next(e);
        }
    });

    /**
     * Update a Vote
     */
    app.put('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const voteId = req.params.voteId;
            // Make sure the Vote is actually related to the Topic through which the permission was granted.
            let fields = ['endsAt', 'reminderTime'];

            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [
                    {
                        model: Vote,
                        where: {
                            id: voteId
                        }
                    }
                ]
            });

            if (!topic || !topic.Votes || !topic.Votes.length) {
                return res.notFound();
            }
            if (topic.status === Topic.STATUSES.draft) {
                fields = fields.concat(['minChoices', 'maxChoices', 'description', 'type', 'authType', 'autoClose', 'delegationIsAllowed']);
            }
            const voteOptions = req.body.options;

            if (Array.isArray(voteOptions) && voteOptions.length < 2) {
                return res.badRequest('At least 2 vote options are required', 1);
            }
            const vote = topic.Votes[0];


            await db.transaction(async function (t) {
                fields.forEach(function (field) {
                    if (Object.keys(req.body).indexOf(field) > -1)
                        vote[field] = req.body[field];
                });
                await cosActivities
                    .updateActivity(
                        vote,
                        topic,
                        {
                            type: 'User',
                            id: req.user.userId,
                            ip: req.ip
                        },
                        req.method + ' ' + req.path,
                        t
                    );


                const createPromises = [];
                if (voteOptions && voteOptions.length && topic.status === Topic.STATUSES.draft) {
                    try {

                        await VoteOption.destroy({
                            where: {
                                voteId: vote.id
                            },
                            force: true
                        });
                    } catch (e) {
                        console.error('Vote Option delete fail', e);
                    }
                    if (vote.authType === Vote.AUTH_TYPES.hard) {
                        const voteOptionValues = voteOptions.map(o => sanitizeFilename(o.value).toLowerCase());

                        const uniqueValues = voteOptionValues.filter((value, index, array) => {
                            return array.indexOf(value) === index;
                        })
                        if (uniqueValues.length !== voteOptions.length) {
                            return res.badRequest('Vote options are too similar', 2);
                        }

                        const reservedPrefix = VoteOption.RESERVED_PREFIX;
                        uniqueValues.forEach(function (value) {
                            if (value.substr(0, 2) === reservedPrefix) {
                                return res.badRequest('Vote option not allowed due to usage of reserved prefix "' + reservedPrefix + '"', 4);
                            }
                        });
                    }

                    voteOptions.forEach((o) => {
                        o.voteId = vote.id;
                        const vopt = VoteOption.build(o);
                        createPromises.push(vopt.validate());
                    });
                }
                let voteOptionsCreated;
                if (createPromises.length) {
                    await Promise.all(createPromises);
                    voteOptionsCreated = await VoteOption
                        .bulkCreate(
                            voteOptions,
                            {
                                fields: ['id', 'voteId', 'value'], // Deny updating other fields like "updatedAt", "createdAt"...
                                returning: true,
                                transaction: t
                            }
                        );
                    await cosActivities
                        .createActivity(
                            voteOptionsCreated,
                            null,
                            {
                                type: 'User',
                                id: req.user.userId,
                                ip: req.ip
                            },
                            req.method + ' ' + req.path,
                            t
                        );
                }

                await vote.save({
                    transaction: t
                });
                t.afterCommit(async () => {
                    const voteInfo = await Vote
                        .findOne({
                            where: { id: voteId },
                            include: [
                                {
                                    model: Topic,
                                    where: { id: topicId }
                                },
                                VoteOption
                            ]
                        });

                    return res.ok(voteInfo);
                })
            });
        } catch (e) {
            next(e);
        }
    });

    /**
     * Vote
     *
     * IF Vote authType===hard then starts Vote signing process. Vote won't be counted before signing is finalized by calling POST /api/users/:userId/topics/:topicId/votes/:voteId/sign or Mobiil-ID signing is completed (GET /api/users/:userId/topics/:topicId/votes/:voteId/status)
     *
     * TODO: Should simplify all of this routes code. It's a mess cause I decided to keep one endpoint for all of the voting. Maybe it's a better idea to move authType===hard to separate endpont
     * TODO: create an alias /api/topics/:topicId/votes/:voteId for un-authenticated signing? I's weird to call /users/self when user has not logged in...
     */
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.voting]), async function (req, res, next) {
        try {
            const vote = await voteService.handleTopicVotePreconditions(req, res);
            if (vote.authType === Vote.AUTH_TYPES.soft) {
                return voteService.handleTopicVoteSoft(vote, req, res, next);
            }
            await voteService.handleTopicVoteHard(vote, req, res);

        } catch (err) {
            return next(err);
        }
    });


    /**
     * Sign a Vote
     *
     * Complete the ID-card signing flow started by calling POST /api/users/:userId/topics/:topicId/votes/:voteId
     */
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId/sign', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.voting]), voteService.handleTopicVoteSign);

    /**
     * Get Vote signing status
     *
     * Initially designed only for Mobile-ID signing. The signing is to be started by calling POST /api/users/:userId/topics/:topicId/votes/:voteId.
     */
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId/status', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true, [Topic.STATUSES.voting]), voteService.handleTopicVoteStatus);


    /**
     * Vote (Un-authenticated)
     *
     * Un-authenticated, which means only authType===hard is supported.
     * Vote authType===hard then starts Vote signing process. Vote won't be counted before signing is finalized by calling POST /api/topics/:topicId/votes/:voteId/sign or Mobiil-ID signing is completed (GET /api/topics/:topicId/votes/:voteId/status)
     */
    app.post('/api/topics/:topicId/votes/:voteId', async function (req, res, next) {
        try {
            const vote = await voteService.handleTopicVotePreconditions(req, res);
            // Deny calling for non-public Topics
            if (vote.Topics[0].visibility !== Topic.VISIBILITY.public) {
                return res.unauthorised();
            }

            if (vote.authType === Vote.AUTH_TYPES.soft) {
                logger.warn('Un-authenticated Voting is not supported for Votes with authType === soft.');

                return res.badRequest('Un-authenticated Voting is not supported for Votes with authType === soft.');
            } else {
                await voteService.handleTopicVoteHard(vote, req, res);
            }
        } catch (e) {
            next(e);
        }
    });


    /**
     * Sign a Vote (Un-authenticated).
     *
     * Complete the ID-card signing flow started by calling POST /api/topics/:topicId/votes/:voteId
     *
     * NOTE: NO authorization checks as there are checks on the init (POST /api/topics/:topicId/votes/:voteId) and you cannot have required data for this endpoint without calling the init.
     */
    app.post('/api/topics/:topicId/votes/:voteId/sign', voteService.handleTopicVoteSign);


    /**
     * Get Vote signing status (Un-authenticated)
     *
     * Initially designed only for Mobile-ID signing. The signing is to be started by calling POST /api/topics/:topicId/votes/:voteId.
     *
     * NOTE: NO authorization checks as there are checks on the init (POST /api/topics/:topicId/votes/:voteId) and you cannot have required data for this endpoint without calling the init.
     */
    app.get('/api/topics/:topicId/votes/:voteId/status', voteService.handleTopicVoteStatus);


    /**
     * Download Users vote BDOC container
     *
     * TODO: Deprecate /api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/user
     */
    app.get(['/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/user', '/api/topics/:topicId/votes/:voteId/downloads/bdocs/user'], authTokenRestrictedUse, async function (req, res, next) {
        const voteId = req.params.voteId;
        const downloadTokenData = req.locals.tokenDecoded;
        const userId = downloadTokenData.userId;

        //TODO: Make use of streaming once Sequelize supports it - https://github.com/sequelize/sequelize/issues/2454
        try {
            const voteUserContainer = await VoteUserContainer
                .findOne({
                    where: {
                        userId: userId,
                        voteId: voteId
                    }
                });

            if (!voteUserContainer) {
                return res.notFound();
            }

            const container = voteUserContainer.container;

            res.set('Content-disposition', 'attachment; filename=vote.bdoc');
            res.set('Content-type', 'application/vnd.etsi.asic-e+zip');

            return res.send(container);

        } catch (err) {
            return next(err);
        }
    });

    /**
     * Download final vote BDOC container
     *
     * TODO: Get rid of this endpoint usage in favor of the one below
     *
     * @deprecated Use GET /api/topics/:topicId/votes/:voteId/downloads/bdocs/final instead
     */
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId/downloads/bdocs/final', authTokenRestrictedUse, voteService.topicDownloadBdocFinal);
    app.get('/api/users/:userId/topics/:topicId/votes/:voteId/downloads/zip/final', authTokenRestrictedUse, voteService.topicDownloadZipFinal);


    /**
     * Download final vote BDOC container
     */
    app.get('/api/topics/:topicId/votes/:voteId/downloads/bdocs/final', authTokenRestrictedUse, voteService.topicDownloadBdocFinal);
    app.get('/api/topics/:topicId/votes/:voteId/downloads/zip/final', authTokenRestrictedUse, voteService.topicDownloadZipFinal);

    /**
     * Delegate a Vote
     */
    app.post('/api/users/:userId/topics/:topicId/votes/:voteId/delegations', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.voting]), async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const voteId = req.params.voteId;
            const toUserId = req.body.userId;
            const byUserId = req.user.userId;
            const partnerId = req.user.partnerId;
            const activityContext = {
                ip: req.ip,
                method: req.method,
                path: req.path
            };

            await voteService.createDelegation(topicId, voteId, byUserId, toUserId, partnerId, activityContext);
            return res.ok();
        } catch (e) {
            if (e.validationError) {
                return res.badRequest(e.message, e.code);
            }
            if (e.status === 404) {
                return res.notFound();
            }
            next(e);
        }
    });

    /**
     * Delete Vote delegation
     */
    app.delete('/api/users/:userId/topics/:topicId/votes/:voteId/delegations', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, null, [Topic.STATUSES.voting]), async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const voteId = req.params.voteId;
            const userId = req.user.userId;
            const activityContext = {
                ip: req.ip,
                method: req.method,
                path: req.path
            };

            await voteService.deleteDelegation(topicId, voteId, userId, activityContext);
            return res.ok();
        } catch (e) {
            if (e.validationError) {
                return res.badRequest(e.message, e.code);
            }
            if (e.status === 404) {
                return res.notFound(e.message, e.code);
            }
            next(e);
        }
    });

    /**
     * Read a public Topics Vote
     */
    app.get('/api/topics/:topicId/votes/:voteId', topicService.hasVisibility(Topic.VISIBILITY.public), async function (req, res, next) {
        try {
            const topicId = req.params.topicId;
            const voteId = req.params.voteId;

            // TODO: Can be done in 1 query.
            const voteInfo = await Vote
                .findOne({
                    where: { id: voteId },
                    include: [
                        {
                            model: Topic,
                            where: { id: topicId }
                        },
                        VoteOption
                    ]
                });

            if (!voteInfo) {
                return res.notFound();
            }

            const voteResults = await voteService.getVoteResults(voteId);
            if (voteResults && voteResults.length) {
                voteInfo.dataValues.VoteOptions.forEach((option) => {
                    const result = voteResults.find((o) => o.optionId === option.id);
                    if (result) {
                        option.dataValues.voteCount = parseInt(result.voteCount, 10); //TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                        if (result.selected) {
                            option.dataValues.selected = result.selected; //TODO: this could be replaced with virtual getters/setters - https://gist.github.com/pranildasika/2964211
                        }
                    }
                });
                voteInfo.dataValues.votersCount = voteResults[0].votersCount;
            }

            return res.ok(voteInfo);
        } catch (e) {
            next(e);
        }
    });
};

