'use strict';

module.exports = function (app) {
    const cosActivities = app.get('cosActivities');
    const cosSignature = app.get('cosSignature');
    const logger = app.get('logger');
    const config = app.get('config');
    const cryptoLib = app.get('cryptoLib');
    const crypto = app.get('crypto');
    const smartId = app.get('smartId');
    const mobileId = app.get('mobileId');
    const jwt = app.get('jwt');
    const cosJwt = app.get('cosJwt');
    const urlLib = app.get('urlLib');

    const authUser = require('../routes/api/auth')(app);
    const models = app.get('models');
    const db = models.sequelize;
    const Topic = models.Topic;
    const Vote = models.Vote;
    const VoteOption = models.VoteOption;
    const VoteUserContainer = models.VoteUserContainer;
    const UserConnection = models.UserConnection;
    const VoteContainerFile = models.VoteContainerFile;
    const VoteList = models.VoteList;
    const VoteDelegation = models.VoteDelegation;
    const { injectReplacements } = require('sequelize/lib/utils/sql');
    const Op = db.Sequelize.Op;
    const User = models.User;
    const topicService = require('./topic')(app);

    const createDataHash = (dataToHash) => {
        const hmac = crypto.createHmac('sha256', config.encryption.salt);

        hmac.update(dataToHash);

        return hmac.digest('hex');
    };

    const _checkAuthenticatedUser = async function (userId, personalInfo, transaction) {
        const userConnection = await UserConnection.findOne({
            where: {
                connectionId: {
                    [Op.in]: [
                        UserConnection.CONNECTION_IDS.esteid,
                        UserConnection.CONNECTION_IDS.smartid
                    ]
                },
                userId: userId
            },
            transaction
        });

        if (userConnection) {
            let personId = personalInfo.pid;
            let connectionUserId = userConnection.connectionUserId;
            if (personalInfo.pid.indexOf('PNO') > -1) {
                personId = personId.split('-')[1];
            }
            const country = (personalInfo.country || personalInfo.countryCode);
            const idPattern = `PNO${country}-${personId}`;
            if (connectionUserId.indexOf('PNO') > -1) {
                connectionUserId = connectionUserId.split('-')[1];
            }
            if (!userConnection.connectionData || (userConnection.connectionData.country || userConnection.connectionData.countryCode)) {
                if (userConnection.connectionUserId !== idPattern) {
                    throw new Error('User account already connected to another PID.');
                }
            }
            const conCountry = (userConnection.connectionData.country || userConnection.connectionData.countryCode)
            const connectionUserPattern = `PNO${conCountry}-${connectionUserId}`;
            if (connectionUserPattern !== idPattern) {
                throw new Error('User account already connected to another PID.');
            }
        }
    };

    const handleTopicVoteHard = async function (vote, req, res) {
        try {
            const voteId = vote.id;
            let userId = req.user ? req.user.userId : null;

            //idCard
            const certificate = req.body.certificate;
            //mID
            const pid = req.body.pid;
            const phoneNumber = req.body.phoneNumber;
            //smart-ID
            const countryCode = req.body.countryCode;
            let personalInfo;
            let signingMethod;

            if (!certificate && !(pid && (phoneNumber || countryCode))) {
                return res.badRequest('Vote with hard authentication requires users certificate when signing with ID card OR phoneNumber+pid when signing with mID', 9);
            }
            let certificateInfo;
            let smartIdcertificate;
            let mobileIdCertificate;
            let signingTime = new Date();
            let certFormat = 'base64';
            if (pid && countryCode) {
                signingMethod = Vote.SIGNING_METHODS.smartId;
                smartIdcertificate = await smartId.getUserCertificate(pid, countryCode);
                certificateInfo = {
                    certificate: smartIdcertificate,
                    format: 'pem'
                };
            } else if (certificate) {
                signingMethod = Vote.SIGNING_METHODS.idCard;
                await mobileId.validateCert(certificate, 'hex');
                certificateInfo = {
                    certificate: certificate,
                    format: 'der'
                }
                certFormat = 'hex';
            } else {
                signingMethod = Vote.SIGNING_METHODS.mid;
                mobileIdCertificate = await mobileId.getUserCertificate(pid, phoneNumber);

                if (mobileIdCertificate.data && mobileIdCertificate.data.result === 'NOT_FOUND') {
                    return res.notFound();
                }
                certificateInfo = {
                    certificate: mobileIdCertificate,
                    format: 'pem'
                };
            }
            if (signingMethod === Vote.SIGNING_METHODS.smartId) {
                personalInfo = await smartId.getCertUserData(certificateInfo.certificate);
                if (personalInfo.pid.indexOf(pid) - 1) {
                    personalInfo.pid = pid;
                }
            } else {
                personalInfo = await mobileId.getCertUserData(certificateInfo.certificate, certFormat);
                if (signingMethod === Vote.SIGNING_METHODS.mid) {
                    personalInfo.phoneNumber = phoneNumber;
                }
            }
            let signInitResponse, token, sessionDataEncrypted;
            await db.transaction(async function (t) { // One big transaction, we don't want created User data to lay around in DB if the process failed.
                // Authenticated User
                if (userId) {
                    await _checkAuthenticatedUser(userId, personalInfo, t);
                } else { // Un-authenticated User, find or create one.
                    const user = (await authUser.getUserByPersonalId(personalInfo, UserConnection.CONNECTION_IDS.esteid, req, t))[0];
                    userId = user.id;
                }

                switch (signingMethod) {
                    case Vote.SIGNING_METHODS.idCard:
                        signInitResponse = await cosSignature.signInitIdCard(voteId, userId, vote.VoteOptions, signingTime, certificate, t);
                        break;
                    case Vote.SIGNING_METHODS.smartId:
                        signInitResponse = await cosSignature.signInitSmartId(voteId, userId, vote.VoteOptions, signingTime, personalInfo.pid, countryCode, smartIdcertificate, t);
                        break;
                    case Vote.SIGNING_METHODS.mid:
                        signInitResponse = await cosSignature.signInitMobile(voteId, userId, vote.VoteOptions, signingTime, personalInfo.pid, personalInfo.phoneNumber, mobileIdCertificate, t);
                        break;
                    default:
                        throw new Error('Invalid signing method ' + signingMethod);
                }
                // Check that the personal ID is not related to another User account. We don't want Users signing Votes from different accounts.
                t.afterCommit(() => {

                    let sessionData = {
                        voteOptions: vote.VoteOptions,
                        signingTime: signingTime,
                        signingMethod,
                        userId: userId, // Required for un-authenticated signing.
                        voteId: voteId // saves one run of "handleTopicVotePreconditions" in the /sign
                    }

                    if (signInitResponse.sessionId) {
                        sessionData.sessionId = signInitResponse.sessionId;
                        sessionData.hash = signInitResponse.hash;
                        sessionData.sessionHash = signInitResponse.sessionHash;
                        sessionData.personalInfo = signInitResponse.personalInfo;
                        sessionData.signatureId = signInitResponse.signatureId;
                    } else {
                        switch (signInitResponse.statusCode) {
                            case 0:
                                // Common to MID and ID-card signing
                                sessionData.personalInfo = personalInfo;
                                sessionData.hash = signInitResponse.hash;
                                sessionData.signableHash = signInitResponse.signableHash;
                                sessionData.signatureId = signInitResponse.signatureId;
                                break;
                            case 101:
                                return res.badRequest('Invalid input parameters.', 20);
                            case 301:
                                return res.badRequest('User is not a Mobile-ID client. Please double check phone number and/or id code.', 21);
                            case 302:
                                return res.badRequest('User certificates are revoked or suspended.', 22);
                            case 303:
                                return res.badRequest('User certificate is not activated.', 23);
                            case 304:
                                return res.badRequest('User certificate is suspended.', 24);
                            case 305:
                                return res.badRequest('User certificate is expired.', 25);
                            default:
                                logger.error('Unhandled DDS status code', signInitResponse.statusCode);
                                return res.internalServerError();
                        }
                    }

                    // Send JWT with state and expect it back in /sign /status - https://trello.com/c/ZDN2WomW/287-bug-id-card-signing-does-not-work-for-some-users
                    // Wrapping sessionDataEncrypted in object, otherwise jwt.sign "expiresIn" will not work - https://github.com/auth0/node-jsonwebtoken/issues/166
                    sessionDataEncrypted = { sessionDataEncrypted: cryptoLib.encrypt(config.session.secret, sessionData) };
                    token = jwt.sign(sessionDataEncrypted, config.session.privateKey, {
                        expiresIn: '5m',
                        algorithm: config.session.algorithm
                    });

                    if (signingMethod === Vote.SIGNING_METHODS.idCard) {
                        return res.ok({
                            signedInfoDigest: signInitResponse.signableHash,
                            signedInfoHashType: cryptoLib.getHashType(signInitResponse.signableHash),
                            token: token
                        }, 1);
                    } else {
                        setTimeout(() => {
                            return res.ok({
                                challengeID: signInitResponse.challengeID,
                                token: token
                            }, 1);
                        }, 1000);
                    }
                });
            });
        } catch (error) {
            switch (error.message) {
                case 'Personal ID already connected to another user account.':
                    return res.badRequest(error.message, 30)
                case 'User account already connected to another PID.':
                    return res.badRequest(error.message, 31);
                case 'Invalid signature':
                    return res.badRequest(error.message, 32);
                case 'Invalid certificate issuer':
                    return res.badRequest(error.message, 33);
                case 'Certificate not active':
                    return res.badRequest(error.message, 34);
                case 'phoneNumber must contain of + and numbers(8-30)':
                    return res.badRequest(error.message, 21);
                case 'nationalIdentityNumber must contain of 11 digits':
                    return res.badRequest(error.message, 22);
                case 'Bad Request':
                    return res.badRequest();
                case 'Not Found':
                    return res.notFound();
                default:
                    logger.error(error)
                    return res.badRequest(error.message);
            }
        }
    };

    const topicDownloadBdocFinal = async function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;
        const include = req.query.include;
        let finalDocStream;
        try {
            const topic = await Topic
                .findOne({
                    where: {
                        id: topicId
                    },
                    include: [
                        {
                            model: Vote,
                            where: {
                                id: voteId,
                                authType: Vote.AUTH_TYPES.hard
                            }
                        }
                    ]
                });
            const vote = topic.Votes[0];

            // TODO: Once we implement the the "endDate>now -> followUp" we can remove Topic.STATUSES.voting check
            if ((vote.endsAt && vote.endsAt.getTime() > new Date().getTime() && topic.status === Topic.STATUSES.voting) || topic.status === Topic.STATUSES.voting) {
                return res.badRequest('The Vote has not ended.');
            }

            let userId = '';
            if (req.user) {
                userId = req.user.userId
            }

            await cosActivities
                .downloadFinalContainerActivity({
                    voteId,
                    topicId
                }, {
                    type: 'User',
                    id: userId,
                    ip: req.ip
                },
                    req.method + ' ' + req.path
                );

            if (req.query.accept === 'application/x-7z-compressed') {
                res.set('Content-disposition', 'attachment; filename=final.7z');
                res.set('Content-type', 'application/x-7z-compressed');
                finalDocStream = await cosSignature.getFinalBdoc(topicId, voteId, include, true);
            } else {
                res.set('Content-disposition', 'attachment; filename=final.bdoc');
                res.set('Content-type', 'application/vnd.etsi.asic-e+zip');
                finalDocStream = await cosSignature.getFinalBdoc(topicId, voteId, include);
            }

            return finalDocStream.pipe(res);
        } catch (e) {
            return next(e);
        }
    };

    /**
     * Download final vote Zip container
     */

    const topicDownloadZipFinal = async function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;
        try {
            const topic = await Topic.findOne({
                where: {
                    id: topicId
                },
                include: [
                    {
                        model: Vote,
                        where: {
                            id: voteId,
                            authType: Vote.AUTH_TYPES.soft
                        }
                    }
                ]
            });

            const vote = topic.Votes[0];

            // TODO: Once we implement the the "endDate>now -> followUp" we can remove Topic.STATUSES.voting check
            if ((vote.endsAt && vote.endsAt.getTime() > new Date().getTime() && topic.status === Topic.STATUSES.voting) || topic.status === Topic.STATUSES.voting) {
                return res.badRequest('The Vote has not ended.');
            }

            res.set('Content-disposition', 'attachment; filename=final.zip');
            res.set('Content-type', 'application/zip');

            const finalDocStream = await cosSignature.getFinalZip(topicId, voteId, true);

            return finalDocStream.pipe(res);
        } catch (err) {
            return next(err);
        }
    };


    const handleHardVotingFinalization = async (req, userId, topicId, voteId, idSignFlowData, context, transaction) => {
        // Store vote options
        const voteOptions = idSignFlowData.voteOptions;
        const optionGroupId = Math.random().toString(36).substring(2, 10);

        let connectionUserId = idSignFlowData.personalInfo.pid;
        if (connectionUserId.indexOf('PNO') === -1) {
            const country = (idSignFlowData.personalInfo.country || idSignFlowData.personalInfo.countryCode);
            connectionUserId = `PNO${country}-${connectionUserId}`;
        }

        const userHash = createDataHash(voteId + connectionUserId);

        voteOptions.forEach((o) => {
            o.voteId = voteId;
            o.userId = userId;
            o.optionGroupId = optionGroupId;
            o.optionId = o.optionId || o.id;
            o.userHash = userHash;
        });

        // Authenticated User signing, check the user connection
        if (req.user) {
            await _checkAuthenticatedUser(userId, idSignFlowData.personalInfo, transaction);
        }

        await handleVoteLists(req, userId, topicId, voteId, voteOptions, context, transaction);

        await UserConnection.upsert(
            {
                userId: userId,
                connectionId: UserConnection.CONNECTION_IDS.esteid,
                connectionUserId,
                connectionData: idSignFlowData.personalInfo
            },
            {
                transaction: transaction
            }
        );
    };

    const handleTopicVoteSign = async function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        const token = req.body.token;
        const signatureValue = req.body.signatureValue;

        if (!token) {
            logger.warn('Missing requried parameter "token"', req.ip, req.path, req.headers);

            return res.badRequest('Missing required parameter "token"');
        }

        if (!signatureValue) {
            return res.badRequest('Missing signature', 1);
        }

        let tokenData;
        let idSignFlowData;

        try {
            tokenData = jwt.verify(token, config.session.publicKey, { algorithms: [config.session.algorithm] });
            idSignFlowData = cryptoLib.decrypt(config.session.secret, tokenData.sessionDataEncrypted);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                return res.unauthorised('JWT token has expired');
            } else {
                logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                return res.unauthorised('Invalid JWT token');
            }
        }

        const userId = req.user ? req.user.userId : idSignFlowData.userId; // Auth has User in session, but un-authenticated in idSignFlowData

        // POST /votes/:voteId checks that Vote belongs to Topic using "handleTopicVotePreconditions". It sets it in the sign flow data so we would not have to call "handleTopicVotePreconditions" again.
        if (voteId !== idSignFlowData.voteId) {
            logger.warn('Invalid token provider for vote.', voteId, idSignFlowData.voteId);

            return res.badRequest('Invalid token for the vote');
        }

        try {
            await db.transaction(async function (t) {
                await handleHardVotingFinalization(req, userId, topicId, voteId, idSignFlowData, req.method + ' ' + req.path, t);
                const voteOptions = idSignFlowData.voteOptions;
                const optionIds = voteOptions.map(function (elem) {
                    return elem.optionId
                });

                const voteOptionsResult = await VoteOption.findAll({
                    where: {
                        id: optionIds,
                        voteId: voteId
                    }
                });
                const signedDocument = await cosSignature.signUserBdoc(
                    idSignFlowData.voteId,
                    idSignFlowData.userId,
                    voteOptionsResult,
                    idSignFlowData.signableHash,
                    idSignFlowData.signatureId,
                    Buffer.from(signatureValue, 'hex').toString('base64'),
                    idSignFlowData.hash
                );

                let connectionUserId = idSignFlowData.personalInfo.pid;

                if (connectionUserId.indexOf('PNO') === -1) {
                    const country = (idSignFlowData.personalInfo.country || idSignFlowData.personalInfo.countryCode);
                    connectionUserId = `PNO${country}-${connectionUserId}`;
                }

                await VoteUserContainer.destroy({
                    where: {
                        voteId,
                        PID: connectionUserId
                    },
                    force: true,
                    transaction: t
                });

                await topicService.addUserAsMember(idSignFlowData.userId, topicId, t);

                await VoteUserContainer.upsert(
                    {
                        userId: userId,
                        voteId: voteId,
                        container: signedDocument.signedDocData,
                        PID: connectionUserId
                    },
                    {
                        transaction: t
                    }
                );

                t.afterCommit(() => {
                    return res.ok({
                        bdocUri: getBdocURL({
                            userId: userId,
                            topicId: topicId,
                            voteId: voteId,
                            type: 'user'
                        })
                    });
                });
            });
        } catch (e) {
            switch (e.message) {
                case 'Personal ID already connected to another user account.':
                    return res.badRequest(e.message, 30)
                case 'User account already connected to another PID.':
                    return res.badRequest(e.message, 31);
            }
            return next(e);
        }
    };

    const handleTopicVoteStatus = async function (req, res, next) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        const token = req.query.token;
        const timeoutMs = req.query.timeoutMs || 5000;

        if (!token) {
            logger.warn('Missing requried parameter "token"', req.ip, req.path, req.headers);

            return res.badRequest('Missing required parameter "token"');
        }

        let tokenData;
        let idSignFlowData;
        try {
            tokenData = jwt.verify(token, config.session.publicKey, { algorithms: [config.session.algorithm] });
            idSignFlowData = cryptoLib.decrypt(config.session.secret, tokenData.sessionDataEncrypted);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                logger.info('loginCheck - JWT token has expired', req.method, req.path, err);

                return res.unauthorised('JWT token has expired');
            } else {
                logger.warn('loginCheck - JWT error', req.method, req.path, req.headers, err);

                return res.unauthorised('Invalid JWT token');
            }
        }

        const userId = req.user ? req.user.userId : idSignFlowData.userId;
        try {
            const getStatus = async () => {
                let signedDocInfo;
                try {
                    if (idSignFlowData.signingMethod === Vote.SIGNING_METHODS.smartId) {
                        signedDocInfo = await cosSignature.getSmartIdSignedDoc(idSignFlowData.sessionId, idSignFlowData.sessionHash, idSignFlowData.signatureId, idSignFlowData.voteId, idSignFlowData.userId, idSignFlowData.voteOptions, idSignFlowData.hash, timeoutMs);
                    } else {
                        signedDocInfo = await cosSignature.getMobileIdSignedDoc(idSignFlowData.sessionId, idSignFlowData.sessionHash, idSignFlowData.signatureId, idSignFlowData.voteId, idSignFlowData.userId, idSignFlowData.voteOptions, idSignFlowData.hash, timeoutMs);
                    }

                    return signedDocInfo;
                } catch (err) {
                    let statusCode;
                    if (err.result && err.result.endResult) {
                        statusCode = err.result.endResult;
                    } else if (err.result && !err.result.endResult) {
                        statusCode = err.result;
                    } else {
                        statusCode = err.state;
                    }
                    if (statusCode === 'RUNNING') {
                        return getStatus();
                    }

                    throw err;
                }
            }

            const signedDocInfo = await getStatus();

            await db.transaction(async function (t) {
                await handleHardVotingFinalization(req, userId, topicId, voteId, idSignFlowData, req.method + ' ' + req.path, t);
                let connectionUserId = idSignFlowData.personalInfo.pid;

                if (connectionUserId.indexOf('PNO') === -1) {
                    const country = (idSignFlowData.personalInfo.country || idSignFlowData.personalInfo.countryCode);
                    connectionUserId = `PNO${country}-${connectionUserId}`;
                }

                await VoteContainerFile.destroy({
                    where: {
                        voteId: voteId,
                        hash: idSignFlowData.hash
                    },
                    force: true,
                    transaction: t
                });

                await VoteUserContainer.destroy({
                    where: {
                        voteId,
                        PID: connectionUserId
                    },
                    force: true,
                    transaction: t
                });

                await VoteUserContainer.upsert(
                    {
                        userId: userId,
                        voteId: voteId,
                        container: signedDocInfo.signedDocData,
                        PID: connectionUserId
                    },
                    {
                        transaction: t,
                        logging: false
                    }
                );

                if (!req.user) {
                    // When starting signing with Mobile-ID we have no full name, thus we need to fetch and update
                    await User
                        .update(
                            {
                                name: db.fn('initcap', idSignFlowData.personalInfo.firstName + ' ' + idSignFlowData.personalInfo.lastName)
                            },
                            {
                                where: {
                                    id: userId,
                                    name: null
                                },
                                limit: 1, // SAFETY
                                transaction: t
                            }
                        );
                }
                t.afterCommit(async () => {
                    const isClosed = await _handleVoteAutoCloseConditions(voteId, topicId, userId);
                    const resBody = {
                        bdocUri: getBdocURL({
                            userId: userId,
                            topicId: topicId,
                            voteId: voteId,
                            type: 'user'
                        })
                    };
                    if (isClosed) {
                        return res.reload('Signing has been completed and vote is now closed', 2, resBody);
                    }

                    return res.ok('Signing has been completed', 2, resBody);
                });
            });
        } catch (err) {
            let statusCode;
            if (err.result && err.result.endResult) {
                statusCode = err.result.endResult;
            } else if (err.result && !err.result.endResult) {
                statusCode = err.result;
            } else {
                statusCode = err.state;
            }
            switch (err.message) {
                case 'Personal ID already connected to another user account.':
                    return res.badRequest(err.message, 30);
                case 'User account already connected to another PID.':
                    return res.badRequest(err.message, 31);
            }
            switch (statusCode) {
                case 'RUNNING':
                    return res.ok('Signing in progress', 1);
                case 'USER_CANCELLED':
                    return res.badRequest('User has cancelled the signing process', 10);
                case 'USER_REFUSED':
                    return res.badRequest('User has cancelled the signing process', 10);
                case 'SIGNATURE_HASH_MISMATCH':
                    return res.badRequest('Signature is not valid', 12);
                case 'NOT_MID_CLIENT':
                    return res.badRequest('Mobile-ID functionality of the phone is not yet ready', 13);
                case 'PHONE_ABSENT':
                    return res.badRequest('Delivery of the message was not successful, mobile phone is probably switched off or out of coverage;', 14);
                case 'DELIVERY_ERROR':
                    return res.badRequest('Other error when sending message (phone is incapable of receiving the message, error in messaging server etc.)', 15);
                case 'SIM_ERROR':
                    return res.badRequest('SIM application error.', 16);
                case 'TIMEOUT':
                    logger.error('There was a timeout, i.e. end user did not confirm or refuse the operation within maximum time frame allowed (can change, around two minutes).', statusCode);
                    return res.badRequest('There was a timeout, i.e. end user did not confirm or refuse the operation within maximum time frame allowed (can change, around two minutes).', 10);
                default:
                    logger.error('Unknown status code when trying to sign with mobile', statusCode, err);
                    return next(err);
            }
        }
    };


    const handleTopicVoteSoft = async function (vote, req, res, next) {
        try {
            const voteId = vote.id;
            const userId = req.user.userId;
            const topicId = req.params.topicId;
            const voteOptions = [...new Map(req.body.options.map(item =>
                [item['optionId'], item])).values()];

            await db
                .transaction(async function (t) {
                    // Store vote options
                    await topicService.addUserAsMember(userId, topicId, t);

                    const optionGroupId = Math.random().toString(36).substring(2, 10);

                    voteOptions.forEach((o) => {
                        o.voteId = voteId;
                        o.userId = userId;
                        o.optionGroupId = optionGroupId;
                    });

                    await handleVoteLists(req, userId, topicId, voteId, voteOptions, req.method + ' ' + req.path, t);
                    t.afterCommit(async () => {
                        const isClosed = await _handleVoteAutoCloseConditions(voteId, topicId, userId);
                        if (isClosed) {
                            return res.reload();
                        }

                        return res.ok();
                    });
                });
        } catch (err) {
            return next(err);
        }
    };

    const handleTopicVotePreconditions = async function (req, res) {
        const topicId = req.params.topicId;
        const voteId = req.params.voteId;

        let voteOptions = [...new Map(req.body.options.map(item =>
            [item['optionId'], item])).values()];
        let isSingelOption = false;

        const vote = await Vote
            .findOne({
                where: { id: voteId },
                include: [
                    {
                        model: Topic,
                        where: { id: topicId }
                    },
                    {
                        model: VoteOption,
                        where: { id: voteOptions.map(o => o.optionId) },
                        required: false
                    }
                ]
            });

        if (!vote) {
            return res.notFound();
        }

        if (vote.endsAt && new Date() > vote.endsAt) {
            return res.badRequest('The Vote has ended.');
        }

        if (!vote.VoteOptions.length) {
            return res.badRequest('Invalid option');
        }
        const singleOptions = vote.VoteOptions.filter((option) => {
            const optVal = option.value.toLowerCase();

            return optVal === 'neutral' || optVal === 'veto';
        });
        if (singleOptions.length) {
            for (let i = 0; i < voteOptions.length; i++) {
                const isOption = singleOptions.find(opt => opt.id === voteOptions[i].optionId);

                if (isOption) {
                    isSingelOption = true;
                    req.body.options = [{ optionId: isOption.id }];
                }
            }
        }

        if (!isSingelOption && (!voteOptions || !Array.isArray(voteOptions) || voteOptions.length > vote.maxChoices || voteOptions.length < vote.minChoices)) {
            return res.badRequest('The options must be an array of minimum :minChoices and maximum :maxChoices options.'
                .replace(':minChoices', vote.minChoices)
                .replace(':maxChoices', vote.maxChoices));
        }

        return vote;
    };

    const _handleVoteAutoCloseConditions = async (voteId, topicId, userId) => {
        const vote = await Vote
            .findOne({
                where: { id: voteId },
                include: [
                    {
                        model: Topic,
                        where: { id: topicId }
                    }
                ]
            });

        if (vote.autoClose) {
            const promises = vote.autoClose.map(async (condition) => {
                if (condition.enabled && condition.value === Vote.AUTO_CLOSE.allMembersVoted) {
                    const topicMembers = await topicService.getAllTopicMembers(topicId, userId, false);
                    const voteResults = await getVoteResults(voteId, userId);
                    if (voteResults.length && topicMembers.users.count === voteResults[0].votersCount) {
                        vote.endsAt = (new Date()).toISOString();
                        await vote.save();

                        return true;
                    }
                }
            });
            const isClosed = await Promise.all(promises);

            return isClosed.includes(true);
        } else {
            return false;
        }
    };

    const handleVoteLists = async (req, userId, topicId, voteId, voteOptions, context, transaction) => {
        await VoteList.destroy({
            where: {
                voteId,
                userId
            },
            force: true,
            transaction: transaction
        });
        const voteListPromise = VoteList.bulkCreate(
            voteOptions,
            {
                fields: ['optionId', 'voteId', 'userId', 'optionGroupId', 'userHash'],
                transaction: transaction
            });
        const topicPromise = Topic.findOne({
            where: {
                id: topicId
            },
            transaction: transaction
        });
        const [voteList, topic] = await Promise.all([voteListPromise, topicPromise]);
        const vl = [];
        let tc = JSON.parse(JSON.stringify(topic.dataValues));
        tc.description = null;
        tc = Topic.build(tc);

        voteList.forEach(function (el, key) {
            delete el.dataValues.optionId;
            delete el.dataValues.optionGroupId;
            el = VoteList.build(el.dataValues);
            vl[key] = el;
        });
        const actor = {
            type: 'User',
            ip: req.ip
        };
        if (userId) {
            actor.id = userId;
        }
        const activityPromise = cosActivities.createActivity(vl, tc, actor, context, transaction);

        // Delete delegation if you are voting - TODO: why is this here? You cannot delegate when authType === 'hard'
        const destroyDelegation = VoteDelegation
            .destroy({
                where: {
                    voteId: voteId,
                    byUserId: userId
                },
                force: true,
                transaction: transaction
            });
        await Promise.all([activityPromise, destroyDelegation]);
    };

    const getBdocURL = function (params) {
        const userId = params.userId;
        const topicId = params.topicId;
        const voteId = params.voteId;
        const type = params.type;

        let path;
        const tokenPayload = {};
        const tokenOptions = {
            expiresIn: '1d'
        };

        if (type === 'user') {
            path = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/user';
        }

        if (type === 'final') {
            path = '/api/users/self/topics/:topicId/votes/:voteId/downloads/bdocs/final';
        }

        if (type === 'goverment') {
            tokenOptions.expiresIn = '30d';
            path = '/api/topics/:topicId/votes/:voteId/downloads/bdocs/final';
        }

        if (userId) {
            tokenPayload.userId = userId;
        }

        path = path
            .replace(':topicId', topicId)
            .replace(':voteId', voteId);

        const urlOptions = {
            token: cosJwt.getTokenRestrictedUse(tokenPayload, 'GET ' + path, tokenOptions)
        };

        if (type === 'goverment') {
            urlOptions.accept = 'application/x-7z-compressed';
        }

        return urlLib.getApi(path, null, urlOptions);
    };

    const getZipURL = function (params) {
        const userId = params.userId;
        const topicId = params.topicId;
        const voteId = params.voteId;
        const type = params.type;

        let path;
        const tokenPayload = {};
        const tokenOptions = {
            expiresIn: '1d'
        };

        if (type === 'final') {
            path = '/api/users/self/topics/:topicId/votes/:voteId/downloads/zip/final';
        }
        if (userId) {
            tokenPayload.userId = userId;
        }

        path = path
            .replace(':topicId', topicId)
            .replace(':voteId', voteId);

        const urlOptions = {
            token: cosJwt.getTokenRestrictedUse(tokenPayload, 'GET ' + path, tokenOptions)
        };

        urlOptions.accept = 'application/x-7z-compressed';

        return urlLib.getApi(path, null, urlOptions);
    };

    const getVoteResults = async function (voteId, userId) {
        let includeVoted = '';
        if (userId) {
            includeVoted = ',(SELECT true FROM votes WHERE "userId" = :userId AND "optionId" = v."optionId") as "selected" ';
        }

        let sql = `
            WITH
            RECURSIVE delegations("voteId", "toUserId", "byUserId", depth) AS (
                SELECT
                        "voteId",
                        "toUserId",
                        "byUserId",
                            1
                        FROM "VoteDelegations" vd
                        WHERE vd."voteId" = :voteId
                            AND vd."deletedAt" IS NULL

                        UNION ALL

                        SELECT
                            vd."voteId",
                            vd."toUserId",
                            dc."byUserId",
                            dc.depth+1
                        FROM delegations dc, "VoteDelegations" vd
                        WHERE vd."byUserId" = dc."toUserId"
                            AND vd."voteId" = dc."voteId"
                            AND vd."deletedAt" IS NULL
                    ),
                    indirect_delegations("voteId", "toUserId", "byUserId", depth) AS (
                        SELECT DISTINCT ON("byUserId")
                            "voteId",
                            "toUserId",
                            "byUserId",
                            depth
                        FROM delegations
                        ORDER BY "byUserId", depth DESC
                    ),
                    vote_groups("voteId", "userId", "optionGroupId", "updatedAt") AS (
                        SELECT DISTINCT ON (vl."userId") vl."voteId", vl."userId", vli."optionGroupId", vl."updatedAt"
                        FROM (
                            SELECT DISTINCT ON (vl."userHash", MAX(vl."updatedAt"))
                            vl."userId",
                            vl."voteId",
                            MAX(vl."updatedAt") as "updatedAt"
                            FROM "VoteLists" vl
                            WHERE vl."voteId" = :voteId
                            AND vl."deletedAt" IS NULL
                            GROUP BY vl."userHash", vl."userId", vl."voteId"
                            ORDER BY MAX(vl."updatedAt") DESC
                        ) vl
                        JOIN "VoteLists" vli
                        ON
                            vli."userId" = vl."userId"
                            AND vl."voteId" = vli."voteId"
                            AND vli."updatedAt" = vl."updatedAt"
                        WHERE vl."voteId" = :voteId
                    ),
                    votes("voteId", "userId", "optionId", "optionGroupId") AS (
                        SELECT
                            vl."voteId",
                            vl."userId",
                            vl."optionId",
                            vl."optionGroupId"
                        FROM "VoteLists" vl
                        JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."optionGroupId" = vg."optionGroupId")
                        JOIN "Votes" v ON v.id = vl."voteId"
                        WHERE v."authType"='${Vote.AUTH_TYPES.soft}' AND vl."voteId" = :voteId
                        UNION ALL
                        SELECT
                            vl."voteId",
                            vl."userId",
                            vl."optionId",
                            vl."optionGroupId"
                        FROM "VoteLists" vl
                        JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."optionGroupId" = vg."optionGroupId")
                        JOIN "Votes" v ON v.id = vl."voteId"
                        WHERE v."authType"='${Vote.AUTH_TYPES.hard}' AND vl."voteId" = :voteId
                        AND vl."userId" IN (
                            SELECT "userId" FROM (
                                SELECT DISTINCT ON (vl."userHash")
                                vl."userId",
                                vl."userHash",
                                MAX(vl."updatedAt")
                                FROM "VoteLists" vl
                                WHERE vl."voteId" = :voteId
                                GROUP BY vl."userId", vl."userHash", vl."updatedAt" ORDER BY vl."userHash", vl."updatedAt" DESC
                            ) vu
                        )
                    ),
                    votes_with_delegations("voteId", "userId", "optionId", "optionGroupId", "byUserId", depth) AS (
                        SELECT
                            v."voteId",
                            v."userId",
                            v."optionId",
                            v."optionGroupId",
                            id."byUserId",
                            id."depth"
                        FROM votes v
                        LEFT JOIN indirect_delegations id ON (v."userId" = id."toUserId")
                        WHERE v."userId" NOT IN (SELECT "byUserId" FROM indirect_delegations WHERE "voteId"=v."voteId")
                    )

                SELECT
                    SUM(v."voteCount") as "voteCount",
                    v."optionId",
                    v."voteId",
                    (SELECT vc.count + vd.count + dt.count
                        FROM (
                            SELECT COUNT (*) FROM (
                                SELECT DISTINCT ON ("userId")
                                     "userId"
                                FROM votes_with_delegations
                                WHERE "byUserId" IS NULL
                            ) nd
                        ) vc
                        JOIN (
                            SELECT COUNT(*) FROM (
                                SELECT "byUserId" FROM votes_with_delegations WHERE "byUserId" IS NOT NULL GROUP BY "byUserId"
                                ) d
                        ) vd ON vd."count" = vd."count"
                        JOIN (
                        SELECT COUNT(*) FROM (
                            SELECT vl."userId" FROM "VoteLists" vl JOIN votes_with_delegations vd ON vd."userId" = vl."userId" WHERE vd."byUserId" IS NOT NULL GROUP BY vl."userId"
                            ) dt
                        ) dt ON dt."count" = dt."count"
                    ) AS "votersCount",
                    vo."value"
                    ${includeVoted}
                FROM (
                    SELECT
                        COUNT(v."optionId") + 1 as "voteCount",
                        v."optionId",
                        v."optionGroupId",
                        v."voteId"
                    FROM votes_with_delegations v
                    WHERE v.depth IS NOT NULL
                    GROUP BY v."optionId", v."optionGroupId", v."voteId"

                    UNION ALL

                    SELECT
                        COUNT(v."optionId") as "voteCount",
                        v."optionId",
                        v."optionGroupId",
                        v."voteId"
                    FROM votes_with_delegations v
                    WHERE v.depth IS NULL
                    GROUP BY v."optionId", v."optionGroupId", v."voteId"
                ) v
                LEFT JOIN "VoteOptions" vo ON (v."optionId" = vo."id")
                GROUP BY v."optionId", v."voteId", vo."value"
        ;`;

        return db
            .query(sql,
                {
                    replacements: {
                        voteId: voteId,
                        userId: userId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );
    };

    const getAllVotesResults = async (userId) => {
        let where = '';
        let join = '';
        let select = '';
        if (!userId) {
            where = ` AND t.visibility = '${Topic.VISIBILITY.public}'`;
        } else {
            select = injectReplacements(', (SELECT true FROM pg_temp.votes(v."voteId") WHERE "userId" = :userId AND "optionId" = v."optionId") as "selected" ', db.dialect, { userId });
            where = `AND COALESCE(tmup.level, tmgp.level, 'none')::"enum_TopicMemberUsers_level" > 'none'`;
            join += injectReplacements(`LEFT JOIN (
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
            `, db.dialect, { userId });
        }
        const query = `
                        CREATE OR REPLACE FUNCTION pg_temp.delegations(uuid)
                            RETURNS TABLE("voteId" uuid, "toUserId" uuid, "byUserId" uuid, depth INT)
                                AS $$
                                    WITH  RECURSIVE q ("voteId", "toUserId", "byUserId", depth)
                                        AS
                                            (
                                            SELECT
                                                vd."voteId",
                                                vd."toUserId",
                                                vd."byUserId",
                                                1
                                            FROM "VoteDelegations" vd
                                            WHERE vd."voteId" = $1
                                              AND vd."deletedAt" IS NULL
                                            UNION ALL
                                            SELECT
                                                vd."voteId",
                                                vd."toUserId",
                                                dc."byUserId",
                                                dc.depth+1
                                            FROM q dc, "VoteDelegations" vd
                                            WHERE vd."byUserId" = dc."toUserId"
                                              AND vd."voteId" = dc."voteId"
                                              AND vd."deletedAt" IS NULL
                                            )
                            SELECT * FROM q; $$
                        LANGUAGE SQL;
                        CREATE OR REPLACE FUNCTION pg_temp.indirect_delegations(uuid)
                            RETURNS TABLE("voteId" uuid, "toUserId" uuid, "byUserId" uuid, depth int)
                                AS $$
                                    SELECT DISTINCT ON("byUserId")
                                        "voteId",
                                        "toUserId",
                                        "byUserId",
                                        depth
                                    FROM pg_temp.delegations($1)
                                    ORDER BY "byUserId", depth DESC; $$
                            LANGUAGE SQL;
                        CREATE OR REPLACE FUNCTION pg_temp.vote_groups(uuid)
                            RETURNS TABLE ("voteId" uuid, "userId" uuid, "optionGroupId" character varying , "updatedAt" timestamp with time zone)
                            AS $$
                            SELECT DISTINCT ON (vl."userId") vl."voteId", vl."userId", vli."optionGroupId", vl."updatedAt"
                            FROM (
                                SELECT DISTINCT ON (vl."userHash", MAX(vl."updatedAt"))
                                    vl."userId",
                                    vl."voteId",
                                    MAX(vl."updatedAt") as "updatedAt"
                                FROM "VoteLists" vl
                                WHERE vl."voteId" = $1
                                    AND vl."deletedAt" IS NULL
                                GROUP BY vl."userHash", vl."userId", vl."voteId"
                                ORDER BY MAX(vl."updatedAt") DESC
                            ) vl
                            JOIN "VoteLists" vli
                            ON
                                vli."userId" = vl."userId"
                                AND vl."voteId" = vli."voteId"
                                AND vli."updatedAt" = vl."updatedAt"
                              ; $$
                            LANGUAGE SQL;
                        CREATE OR REPLACE FUNCTION pg_temp.votes(uuid)
                            RETURNS TABLE ("voteId" uuid, "userId" uuid, "optionId" uuid, "optionGroupId" character varying)
                            AS $$
                                SELECT
                                    vl."voteId",
                                    vl."userId",
                                    vl."optionId",
                                    vl."optionGroupId"
                                FROM "VoteLists" vl
                                JOIN pg_temp.vote_groups($1) vg ON (vl."voteId" = vg."voteId" AND vl."optionGroupId" = vg."optionGroupId")
                                JOIN "Votes" vo ON vo.id = vl."voteId"
                                WHERE vo."authType"='${Vote.AUTH_TYPES.soft}' AND vl."voteId" = $1
                                UNION ALL
                                SELECT
                                    vl."voteId",
                                    vl."userId",
                                    vl."optionId",
                                    vl."optionGroupId"
                                FROM "VoteLists" vl
                                JOIN pg_temp.vote_groups($1) vg ON (vl."voteId" = vg."voteId" AND vl."optionGroupId" = vg."optionGroupId")
                                JOIN "Votes" vo ON vo.id = vl."voteId"
                                WHERE vo."authType"='${Vote.AUTH_TYPES.hard}' AND vl."voteId" = $1
                                AND vl."userId" IN (
                                    SELECT "userId" FROM (
                                        SELECT DISTINCT ON (vl."userHash")
                                        vl."userId",
                                        vl."userHash",
                                        MAX(vl."updatedAt")
                                        FROM "VoteLists" vl
                                        WHERE vl."voteId" = $1
                                        GROUP BY vl."userId", vl."userHash", vl."updatedAt" ORDER BY vl."userHash", vl."updatedAt" DESC
                                    ) vu
                                )
                                $$
                            LANGUAGE SQL;
                        CREATE OR REPLACE FUNCTION pg_temp.votes_with_delegations(uuid)
                            RETURNS TABLE ("voteId" uuid, "userId" uuid, "optionId" uuid, "optionGroupId" varchar(8), depth int)
                            AS $$
                                SELECT
                                    v."voteId",
                                    v."userId",
                                    v."optionId",
                                    v."optionGroupId",
                                    id."depth"
                                FROM pg_temp.votes($1) v
                                LEFT JOIN pg_temp.indirect_delegations($1) id ON (v."userId" = id."toUserId")
                                WHERE v."userId" NOT IN (SELECT "byUserId" FROM pg_temp.indirect_delegations($1) WHERE "voteId"=v."voteId");
                                $$
                            LANGUAGE SQL;
                        CREATE OR REPLACE FUNCTION pg_temp.get_vote_results (uuid)
                            RETURNS TABLE ("voteCount" bigint, "optionId" uuid, "optionGroupId" varchar(8), "voteId" uuid)
                            AS $$
                                SELECT
                                    COUNT(v."optionId") + 1 as "voteCount",
                                    v."optionId",
                                    v."optionGroupId",
                                    v."voteId"
                                FROM pg_temp.votes_with_delegations($1) v
                                WHERE v.depth IS NOT NULL
                                GROUP BY v."optionId", v."optionGroupId", v."voteId"

                                UNION ALL

                                SELECT
                                    COUNT(v."optionId") as "voteCount",
                                    v."optionId",
                                    v."optionGroupId",
                                    v."voteId"
                                FROM pg_temp.votes_with_delegations($1) v
                                WHERE v.depth IS NULL
                                GROUP BY v."optionId", v."optionGroupId", v."voteId"; $$
                            LANGUAGE SQL;
                        CREATE OR REPLACE FUNCTION pg_temp.get_voters_count (uuid)
                            RETURNS TABLE ("votersCount" bigint)
                            AS $$
                                SELECT COUNT(*) as "votersCount" FROM
                                (
                                    SELECT "userId" FROM (
                                        SELECT DISTINCT ON (vl."userHash")
                                        vl."userId",
                                        vl."userHash",
                                        MAX(vl."updatedAt")
                                        FROM "VoteLists" vl
                                        WHERE vl."voteId" = $1
                                        GROUP BY vl."userId", vl."userHash", vl."updatedAt" ORDER BY vl."userHash", vl."updatedAt" DESC
                                    ) vu
                                ) c
                             $$
                            LANGUAGE SQL;

                        SELECT
                            SUM(v."voteCount") as "voteCount",
                            vc."votersCount",
                            v."optionId",
                            v."voteId",
                            vo."value",
                            vo."ideaId"
                            ${select}
                        FROM "Topics" t
                        LEFT JOIN "TopicVotes" tv
                            ON tv."topicId" = t.id AND tv."deletedAt" IS NULL
                        LEFT JOIN pg_temp.get_vote_results(tv."voteId") v ON v."voteId" = tv."voteId"
                        LEFT JOIN "VoteOptions" vo ON v."optionId" = vo.id
                        LEFT JOIN pg_temp.get_voters_count(tv."voteId") vc ON vc."votersCount" = vc."votersCount"
                        ${join}
                        WHERE  t."deletedAt" IS NULL
                        AND v."optionId" IS NOT NULL
                        AND v."voteId" IS NOT NULL
                        AND vo."value" IS NOT NULL
                        ${where}
                        GROUP BY v."optionId", v."voteId", vo."value", vo."ideaId", vc."votersCount"
                    ;`;

        return db
            .query(
                query,
                {
                    type: db.QueryTypes.SELECT,
                    raw: true
                }
            );
    };


    return {
        handleTopicVotePreconditions,
        handleTopicVoteHard,
        handleTopicVoteSoft,
        handleTopicVoteSign,
        handleTopicVoteStatus,
        topicDownloadBdocFinal,
        topicDownloadZipFinal,
        getVoteResults,
        getBdocURL,
        getZipURL,
        getAllVotesResults
    };
};

