'use strict';

suite('cosBdoc', function () {
    const assert = require('chai').assert;

    const app = require('../../app');
    const models = app.get('models');
    const db = models.sequelize;
    const logger = app.get('logger');
    const Promise = app.get('Promise');
    const fs = app.get('fs');
    const cosBdoc = app.get('cosSignature');
    const smartId = app.get('smartId');
    const mobileId = app.get('mobileId');
    const util = app.get('util');
    const _ = app.get('lodash');
    const shared = require('../utils/shared');

    const Topic = models.Topic;
    const Vote = models.Vote;
    const TopicVote = models.TopicVote;
    const VoteOption = models.VoteOption;
    const VoteList = models.VoteList;
    const VoteUserContainer = models.VoteUserContainer;
    const User = models.User;
    const UserConnection = models.UserConnection;

    let topic;
    let vote;
    const voteOptions = [];
    let user;

    let voteFileDir;

    suiteSetup(async function () {
        return shared.syncDb();
    });

    // FIXME: Proper test
    test.skip('createVoteFiles', async function () {
        await cosBdoc.createVoteFiles(topic, vote, voteOptions);
        const files = await fs.readdirAsync(voteFileDir + '/source');
        const expectedFiles = [
            'Option 1.html',
            'Option 2.html',
            '__metainfo.html',
            'document.docx'
        ];

        assert.deepEqual(files, expectedFiles);
    });

    test.skip('createUserBdoc', async function () {
        const certificate = await fs.readFileAsync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt');

        return cosBdoc.createUserBdoc(topic.id, vote.id, user.id, certificate.toString(), [voteOptions[0]]);
    });

    suite('getPersonalInfoFromCertificate', function () {

        test('Success - Hex encoded DER(default)', async function () {
            const certificate = await fs .readFileAsync('./test/resources/certificates/good-jaak-kristjan_jõeorg_esteid_sign_hex_encoded_der.crt');
            const personalInfo= await smartId.getCertUserData(certificate.toString(), 'hex');
               //     assert.equal(status, 'GOOD');
            const expectedPersonalInfo = {
                lastName: 'JÕEORG',
                firstName: 'JAAK-KRISTJAN',
                pid: 'PNOEE-38001085718',
                country: 'EE'
            };

            assert.deepEqual(personalInfo, expectedPersonalInfo);
        });

        test('Success - PEM', async function () {

            const pid = '60001019906';
            const phoneNumber = '+37200000766';
       //     const returnCertData = 'sign';

            const certInfo = await mobileId.getUserCertificate(pid, phoneNumber);
            const personalInfo = await mobileId.getCertUserData(certInfo, 'base64');
    //     assert.equal(status, 'GOOD');
            assert.deepEqual(personalInfo, {
                pid: '60001019906',
                firstName: 'MARY ÄNN',
                lastName: 'O’CONNEŽ-ŠUSLIK TESTNUMBER',
                country: 'EE'
            });

        });
    });

    suite('getMobileCertificate', function () {

        test('Success', async function () {
            const pid = '60001019906';
            const phoneNumber = '+37200000766';

            const certInfo = await mobileId.getUserCertificate(pid, phoneNumber);
            assert.equal(typeof certInfo, 'string');
        });

    });

    suite.skip('createFinalBdoc', function () {

        test.skip('Success', async function () {
            const fileBuffer = cosBdoc.getFinalBdoc(topic.id, vote.id);
            return fs.writeFileAsync(voteFileDir + '/final.bdoc', Buffer.from(fileBuffer, 'base64')); // eslint-disable-line no-buffer-constructor
        });


        // NB! Disable query logging when generating data, otherwise it will fill HDD with logs
        suite.skip('Performance', function () {
            this.timeout(0); //eslint-disable-line no-invalid-this

            // Run GC in a loop. Due to GC logic, first call to gc() will not free as much memory as possible. Every gc() call will a bit more if possible
            const runGC = function () {
                let j = 0;
                while (j < 10) {
                    global.gc();
                    j++;
                }
            };

            const SIGNED_VOTE_FILE_PATH = './test/resources/bdoc/voteCreateFinalBdoc.bdoc';
            const MEMBER_COUNT = 1000;
            const createdUserIds = [];
            let creatorId;
            let topic;
            let vote;
            let voteOptions;

            let timeStart;
            let interval;
            let processMemoryUsageMax;
            let processMemoryUsageMin;

            suiteSetup( async function () {
                return db
                    .transaction(async function (t) {
                        const userCreationPromises = [];

                        for (let i = 0; i < MEMBER_COUNT; i++) {
                            const name = util.randomString(16);
                            const userCreatePromise = User
                                .create(
                                    {
                                        name: name,
                                        email: name + '@createFinalBdocPerf.com',
                                        source: User.SOURCES.citizenos
                                    },
                                    {
                                        transaction: t
                                    }
                                )
                                .then(function (user) {
                                    createdUserIds.push(user.id);
                                });

                            userCreationPromises.push(userCreatePromise);
                        }

                        runGC();

                        await Promise.all(userCreationPromises);
                        logger.debug('Users created', process.memoryUsage());
                        // Create UserConnections
                        creatorId = createdUserIds[0];

                        const userConnectionsToCreate = [];

                        createdUserIds.forEach(function (userId) {
                            const pid = util.randomPid();
                            userConnectionsToCreate.push({
                                userId: userId,
                                connectionId: UserConnection.CONNECTION_IDS.esteid,
                                connectionUserId: pid,
                                connectionData: {firstName: 'FirstÕ', lastName: 'Last' + pid}
                            });
                        });

                        await UserConnection
                            .bulkCreate(
                                userConnectionsToCreate,
                                {
                                    transaction: t
                                }
                            );
                        logger.debug('User connections created', process.memoryUsage());

                        topic = await Topic
                            .create(
                                {
                                    title: 'createFinalBdoc Success - performance',
                                    description: 'createFinalBdoc Success - performance',
                                    padUrl: 'https://testarereal.com/p/test',
                                    creatorId: creatorId
                                },
                                {
                                    transaction: t
                                }
                            );
                        logger.debug('Topic created', process.memoryUsage());

                        // Create a Vote
                        vote = await Vote.create(
                            {
                                authType: Vote.AUTH_TYPES.hard
                            },
                            {
                                transaction: t
                            }
                        );
                        logger.debug('Vote created', process.memoryUsage());

                        // Create TopicVote
                        await TopicVote.create(
                            {
                                topicId: topic.id,
                                voteId: vote.id
                            },
                            {
                                transaction: t
                            }
                        );
                        // Create VoteOptions
                        logger.debug('Topic vote created', process.memoryUsage());

                        voteOptions = await VoteOption
                            .bulkCreate(
                                [
                                    {
                                        value: 'Yes',
                                        voteId: vote.id
                                    },
                                    {
                                        value: 'No',
                                        voteId: vote.id
                                    }
                                ],
                                {
                                    transaction: t
                                }
                            );
                        logger.debug('Vote options created', process.memoryUsage());

                        // Create  vote files
                        await cosBdoc.createVoteFiles(topic, vote, voteOptions, t);
                        logger.debug('Vote files created', process.memoryUsage());

                        // Create creator VoteUserContainer. Just for testing, everybody gets the same signed file.
                        const fileContents = await fs.readFileAsync(SIGNED_VOTE_FILE_PATH); // eslint-disable-line no-sync

                        await VoteUserContainer
                            .create(
                                {
                                    voteId: vote.id,
                                    userId: creatorId,
                                    container: fileContents
                                },
                                {
                                    transaction: t
                                }
                            );
                        logger.debug('Creator VoteUserContainers created', process.memoryUsage());

                        const voteUserContainersCreatePromises = [];

                        createdUserIds.forEach(function (userId, i) {
                            if (i === 0) { // Skip first, creator has already been added
                                return;
                            }

                            const createContainerPromise = db
                                .query(
                                    '\
                                    INSERT INTO "VoteUserContainers" ("voteId", "userId", "container", "createdAt", "updatedAt") \
                                        SELECT \
                                            "voteId",\
                                            :userId as "userId",\
                                            container, \
                                            NOW() as "createdAt", \
                                            NOW() as "updatedAt" \
                                        FROM "VoteUserContainers" \
                                        WHERE "voteId" = :voteId AND "userId" = :creatorId \
                                    ;',
                                    {
                                        replacements: {
                                            voteId: vote.id,
                                            userId: userId,
                                            creatorId: creatorId
                                        },
                                        type: db.QueryTypes.INSERT,
                                        raw: true,
                                        transaction: t
                                    }
                                );

                            voteUserContainersCreatePromises.push(createContainerPromise);
                        });

                        await Promise.all(voteUserContainersCreatePromises);
                            // console.log('VoteUserContainers created', process.memoryUsage());

                        const userVotePromises = [];
                        createdUserIds.forEach(function (userId) {
                            userVotePromises.push(VoteList.create({
                                userId: userId,
                                voteId: vote.id,
                                optionId: voteOptions[0].id,
                                optionGroupId: util.randomString(8)
                            }, {transaction: t}));
                        });

                        return Promise.all(userVotePromises);
                    });
            });

            setup(async function () {
                runGC();

                const mem = process.memoryUsage();
                processMemoryUsageMax = _.clone(mem);
                processMemoryUsageMin = _.clone(mem);

                interval = setInterval(function () {
                    const memUsage = process.memoryUsage();
                    logger.info('Memory usage', memUsage);

                    if (processMemoryUsageMax.rss < memUsage.rss) {
                        processMemoryUsageMax.rss = memUsage.rss;
                    }

                    if (processMemoryUsageMax.heapTotal < memUsage.heapTotal) {
                        processMemoryUsageMax.heapTotal = memUsage.heapTotal;
                    }

                    if (processMemoryUsageMax.heapUsed < memUsage.heapUsed) {
                        processMemoryUsageMax.heapUsed = memUsage.heapUsed;
                    }

                    if (processMemoryUsageMin.rss > memUsage.rss) {
                        processMemoryUsageMin.rss = memUsage.rss;
                    }

                    if (processMemoryUsageMin.heapTotal > memUsage.heapTotal) {
                        processMemoryUsageMin.heapTotal = memUsage.heapTotal;
                    }

                    if (processMemoryUsageMin.heapUsed > memUsage.heapUsed) {
                        processMemoryUsageMin.heapUsed = memUsage.heapUsed;
                    }
                }, 1000);

                timeStart = new Date().getTime();
            });

            test('Success - a lot of signatures', async function () {
                const fileStream = await cosBdoc.getFinalBdoc(topic.id, vote.id);
                const writeStream = fs.createWriteStream('/tmp/performanceTest.bdoc');
                fileStream.pipe(writeStream);

                return util.streamToPromise(writeStream);
            });

            teardown(async function () {
                clearInterval(interval);

                logger.info('Users:', createdUserIds.length);
                logger.info('Memory usage MIN: ', processMemoryUsageMin);
                logger.info('Memory usage MAX: ', processMemoryUsageMax);
                logger.info(
                    'Memory usage diff (rss, heapTotal, heapUsed): ',
                    processMemoryUsageMax.rss - processMemoryUsageMin.rss + '\t',
                    processMemoryUsageMax.heapTotal - processMemoryUsageMin.heapTotal + '\t',
                    processMemoryUsageMax.heapUsed - processMemoryUsageMin.heapUsed
                );
                logger.info('Time spent (ms):', new Date().getTime() - timeStart);

                return;
            });

        });

    });

});

