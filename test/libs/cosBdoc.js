'use strict';

suite('cosBdoc', function () {
    var assert = require('chai').assert;

    var app = require('../../app');
    var models = app.get('models');
    var db = models.sequelize;
    var logger = app.get('logger');
    var Promise = app.get('Promise');
    var fs = app.get('fs');
    var cosBdoc = app.get('cosSignature');
    var smartId = app.get('smartId');
    var mobileId = app.get('mobileId');
    var util = app.get('util');
    var _ = app.get('lodash');
    var shared = require('../utils/shared');

    var Topic = models.Topic;
    var Vote = models.Vote;
    var TopicVote = models.TopicVote;
    var VoteOption = models.VoteOption;
    var VoteList = models.VoteList;
    var VoteUserContainer = models.VoteUserContainer;
    var User = models.User;
    var UserConnection = models.UserConnection;

    var topic;
    var vote;
    var voteOptions = [];
    var user;

    var voteFileDir;

    suiteSetup(function (done) {
        shared
            .syncDb()
            .finally(done);
    });

    // FIXME: Proper test
    test.skip('createVoteFiles', function (done) {
        cosBdoc
            .createVoteFiles(topic, vote, voteOptions)
            .then(function () {
                return fs
                    .readdirAsync(voteFileDir + '/source');
            })
            .then(function (files) {
                var expectedFiles = [
                    'Option 1.html',
                    'Option 2.html',
                    '__metainfo.html',
                    'document.docx'
                ];

                assert.deepEqual(files, expectedFiles);

                done();
            });
    });

    test.skip('createUserBdoc', function (done) {
        fs
            .readFileAsync('./test/resources/certificates/dds_good_igor_sign_hex_encoded_der.crt')
            .then(function (certificate) {
                return cosBdoc.createUserBdoc(topic.id, vote.id, user.id, certificate.toString(), [voteOptions[0]]);
            })
            .then(function () {
                done();
            });
    });

    suite('getPersonalInfoFromCertificate', function () {

        test('Success - Hex encoded DER(default)', function (done) {
            fs
                .readFileAsync('./test/resources/certificates/dds_good_igor_sign_hex_encoded_der.crt')
                .then(function (certificate) {
                    return smartId
                        .getCertUserData(certificate.toString(), 'hex');
                })
                .then(function (personalInfo) {
               //     assert.equal(status, 'GOOD');
                    var expectedPersonalInfo = {
                        lastName: 'ŽAIKOVSKI',
                        firstName: 'IGOR',
                        pid: '37101010021',
                        country: 'EE'
                    };

                    assert.deepEqual(personalInfo, expectedPersonalInfo);

                    done();
                })
                .catch(done);
        });

        test('Success - PEM', function (done) {

            var pid = '60001019906';
            var phoneNumber = '+37200000766';
       //     var returnCertData = 'sign';

            mobileId
                .getUserCertificate(pid, phoneNumber)
                .then(function (certInfo) {
                    return mobileId
                        .getCertUserData(certInfo, 'base64');
                })
                .then(function (personalInfo) {
               //     assert.equal(status, 'GOOD');
                    assert.deepEqual(personalInfo, {
                        pid: '60001019906',
                        firstName: 'MARY ÄNN',
                        lastName: 'O’CONNEŽ-ŠUSLIK TESTNUMBER',
                        country: 'EE'
                    });

                    done();
                })
                .catch(done);

        });
    });

    suite('getMobileCertificate', function () {

        test('Success', function (done) {
            var pid = '60001019906';
            var phoneNumber = '+37200000766';

            mobileId
                .getUserCertificate(pid, phoneNumber)
                .then(function (certInfo) {
                    assert.equal(typeof certInfo, 'string');
                    done();
                });
        });

    });

    suite.skip('createFinalBdoc', function () {

        test.skip('Success', function (done) {
            cosBdoc
                .getFinalBdoc(topic.id, vote.id)
                .then(function (fileBuffer) {
                    return fs
                        .writeFileAsync(voteFileDir + '/final.bdoc', Buffer.from(fileBuffer, 'base64')); // eslint-disable-line no-buffer-constructor
                })
                .then(done)
                .catch(done);
        });


        // NB! Disable query logging when generating data, otherwise it will fill HDD with logs
        suite.skip('Performance', function () {
            this.timeout(0); //eslint-disable-line no-invalid-this

            // Run GC in a loop. Due to GC logic, first call to gc() will not free as much memory as possible. Every gc() call will a bit more if possible
            var runGC = function () {
                var j = 0;
                while (j < 10) {
                    global.gc();
                    j++;
                }
            };

            var SIGNED_VOTE_FILE_PATH = './test/resources/bdoc/voteCreateFinalBdoc.bdoc';
            var MEMBER_COUNT = 1000;
            var createdUserIds = [];
            var creatorId;
            var topic;
            var vote;
            var voteOptions;

            var timeStart;
            var interval;
            var processMemoryUsageMax;
            var processMemoryUsageMin;

            suiteSetup(function (done) {
                db
                    .transaction(function (t) {
                        var userCreationPromises = [];

                        for (var i = 0; i < MEMBER_COUNT; i++) {
                            var name = util.randomString(16);
                            var userCreatePromise = User
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

                        return Promise
                            .all(userCreationPromises)
                            .then(function () {
                                logger.debug('Users created', process.memoryUsage());
                                // Create UserConnections
                                creatorId = createdUserIds[0];

                                var userConnectionsToCreate = [];

                                createdUserIds.forEach(function (userId) {
                                    var pid = util.randomPid();
                                    userConnectionsToCreate.push({
                                        userId: userId,
                                        connectionId: UserConnection.CONNECTION_IDS.esteid,
                                        connectionUserId: pid,
                                        connectionData: {firstName: 'FirstÕ', lastName: 'Last' + pid}
                                    });
                                });

                                return UserConnection
                                    .bulkCreate(
                                        userConnectionsToCreate,
                                        {
                                            transaction: t
                                        }
                                    );
                            })
                            .then(function () {
                                logger.debug('User connections created', process.memoryUsage());

                                return Topic
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
                            })
                            .then(function (topicCreateResult) {
                                logger.debug('Topic created', process.memoryUsage());
                                topic = topicCreateResult;

                                // Create a Vote
                                return Vote
                                    .create(
                                        {
                                            authType: Vote.AUTH_TYPES.hard
                                        },
                                        {
                                            transaction: t
                                        }
                                    );
                            })
                            .then(function (voteCreateResult) {
                                logger.debug('Vote created', process.memoryUsage());

                                vote = voteCreateResult;

                                // Create TopicVote
                                return TopicVote
                                    .create(
                                        {
                                            topicId: topic.id,
                                            voteId: voteCreateResult.id
                                        },
                                        {
                                            transaction: t
                                        }
                                    );
                            })
                            .then(function () {
                                // Create VoteOptions
                                logger.debug('Topic vote created', process.memoryUsage());

                                return VoteOption
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
                            })
                            .then(function (voteOptionCreateResult) {
                                logger.debug('Vote options created', process.memoryUsage());

                                voteOptions = voteOptionCreateResult;

                                // Create  vote files
                                return cosBdoc.createVoteFiles(topic, vote, voteOptions, t);
                            })
                            .then(function () {
                                logger.debug('Vote files created', process.memoryUsage());

                                // Create creator VoteUserContainer. Just for testing, everybody gets the same signed file.
                                var fileContents = fs.readFileSync(SIGNED_VOTE_FILE_PATH); // eslint-disable-line no-sync

                                return VoteUserContainer
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
                            })
                            .then(function () {
                                logger.debug('Creator VoteUserContainers created', process.memoryUsage());

                                var voteUserContainersCreatePromises = [];

                                createdUserIds.forEach(function (userId, i) {
                                    if (i === 0) { // Skip first, creator has already been added
                                        return;
                                    }

                                    var createContainerPromise = db
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

                                return Promise.all(voteUserContainersCreatePromises);
                            })
                            .then(function () {
                                // console.log('VoteUserContainers created', process.memoryUsage());

                                var userVotePromises = [];
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
                    })
                    .then(function () {
                        // console.log('VoteList created', process.memoryUsage());
                        // console.log('Suite setup complete', 'topicId', topic.id, 'voteId', vote.id);
                        done();
                    })
                    .catch(done);
            });

            setup(function (done) {
                runGC();

                var mem = process.memoryUsage();
                processMemoryUsageMax = _.clone(mem);
                processMemoryUsageMin = _.clone(mem);

                interval = setInterval(function () {
                    var memUsage = process.memoryUsage();
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

                done();
            });

            test('Success - a lot of signatures', function (done) {
                cosBdoc
                    .getFinalBdoc(topic.id, vote.id)
                    .then(function (fileStream) {
                        var writeStream = fs.createWriteStream('/tmp/performanceTest.bdoc');
                        fileStream.pipe(writeStream);

                        return util.streamToPromise(writeStream);
                    })
                    .then(done)
                    .catch(done);
            });

            teardown(function (done) {
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

                done();
            });

        });

    });

});

