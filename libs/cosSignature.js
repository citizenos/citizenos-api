'use strict';

module.exports = function (app) {
    const logger = app.get('logger');
    const models = app.get('models');
    const util = app.get('util');
    const fs = app.get('fs');
    const config = app.get('config');
    const fsExtra = app.get('fsExtra');
    const mu = app.get('mu');
    const sanitizeFilename = app.get('sanitizeFilename');
    const fastCsv = app.get('fastCsv');
    const db = models.sequelize;
    const QueryStream = app.get('QueryStream');
    const Bdoc = app.get('Bdoc');
    const SevenZip = app.get('SevenZip');
    const CosHtmlToDocx = app.get('cosHtmlToDocx');
    const Hades = require('undersign');
    const Xades = require('undersign/xades');
    const smartId = app.get('smartId');
    const mobileId = app.get('mobileId');
    const Crypto = require('crypto');
    const Certificate = require('undersign/lib/certificate');
    const Asic = require('undersign/lib/asic');
    const Tsl = require('undersign/lib/tsl');
    let tslCertificates;

    const tslPath = config.services.signature.certificates.tsl;

    if (Array.isArray(tslPath)) {
        tslPath.forEach(function (path) {
            const tsl = Tsl.parse(fs.readFileSync(path));
            if (!tslCertificates) {
                tslCertificates = tsl.certificates;
            } else {
                tsl.certificates.forEach(tslCertificates.add.bind(tslCertificates))
            }
        });
    } else {
        const tsl = tslPath && Tsl.parse(fs.readFileSync(tslPath))
        tslCertificates = tsl.certificates;
    }

    const hades = new Hades({
		certificates: tslCertificates,
		timemarkUrl: config.services.signature.timemarkUrl,
		timestampUrl: config.services.signature.timestampUrl
	});


    const VoteContainerFile = models.VoteContainerFile;
    const UserConnection = models.UserConnection;
    const Signature = models.Signature;

    const FILE_CREATE_MODE = '0760';

    const TOPIC_FILE = {
        template: 'bdoc/document.html',
        name: 'document.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    const METAINFO_FILE = {
        template: 'bdoc/metainfo.html',
        name: '__metainfo.html',
        mimeType: 'text/html'
    };

    const VOTE_OPTION_FILE = {
        template: 'bdoc/voteOption.html',
        name: ':value.html', // ":value" is a placeholder to replace with sanitized file name
        mimeType: 'text/html'
    };

    const USERINFO_FILE = {
        template: 'bdoc/userinfo.html',
        name: '__userinfo.html',
        mimeType: 'text/html'
    };

    const VOTE_RESULTS_FILE = {
        name: 'votes.csv',
        mimeType: 'text/csv'
    };

    const USER_BDOC_FILE = {
        name: ':pid.bdoc',
        mimeType: 'application/vnd.etsi.asic-e+zip'
    };


    /**
     * Get absolute path to Topic directory where all topic related files are stored
     *
     * @param {string} topicId Topic ID
     *
     * @returns {string} Absolute path to Topic vote files
     *
     * @private
     */
    const _getTopicFileDir = function (topicId) {
        return app.get('FILE_ROOT') + '/' + topicId;
    };

    /**
     * Get absolute path to Topic Vote directory where all vote BDOC containers are stored
     *
     * @param {string} topicId Topic ID
     * @param {string} voteId Vote ID
     *
     * @returns {string} Absolute path to Topic vote files
     *
     * @private
     */
    const _getVoteFileDir = function (topicId, voteId) {
        return _getTopicFileDir(topicId) + '/' + voteId;
    };

    /**
     * Get the file name for specific VoteOption
     *
     * @param {Object} voteOption VoteOption Sequelize instance
     *
     * @returns {string} File name
     *
     * @private
     */
    const _getVoteOptionFileName = function (voteOption) {
        const sanitizedfileName = sanitizeFilename(voteOption.value);

        if (!sanitizedfileName.length) {
            throw Error('Nothing left after sanitizing the optionValue: ' + voteOption.value);
        }

        return VOTE_OPTION_FILE.name.replace(':value', sanitizedfileName);
    };

    /**
     * Get absolute path to Topic vote files that are to be part of BDOC container
     *
     * @param {string} topicId Topic ID
     * @param {string} voteId Vote ID
     *
     * @returns {string} Absolute path to Topic vote files
     *
     * @private
     */
    const _getVoteFileSourceDir = function (topicId, voteId) {
        return _getVoteFileDir(topicId, voteId) + '/source';
    };

    /**
     * Create the Topic (document) file
     *
     * @param {Object} topic Topic Sequelize instance
     * @param {Object} vote Vote Sequelize instance
     * @param {Object} transaction Sequelize transaction
     *
     * @returns {Promise} Vote container file
     *
     * @private
     */
    const _createTopicFile = function (topic, vote, transaction) {
        const destinationDir = _getVoteFileSourceDir(topic.id, vote.id);

        let filePath;

        return fsExtra
            .mkdirsAsync(destinationDir, FILE_CREATE_MODE)
            .then(function () {
                filePath = destinationDir + '/' + TOPIC_FILE.name;
                const doc = new CosHtmlToDocx(topic.description, topic.title, filePath);

                return doc.processHTML();
            })
            .then(function () {
                const docxReadStream = fs.createReadStream(filePath);

                return util.streamToBuffer(docxReadStream);
            })
            .then(function (docxBuffer) {
                return VoteContainerFile
                    .create(
                        {
                            voteId: vote.id,
                            fileName: TOPIC_FILE.name,
                            mimeType: TOPIC_FILE.mimeType,
                            content: docxBuffer
                        },
                        {
                            transaction: transaction
                        }
                    );
            })
            .then(function () {
                // Best effort to remove temporary files, no need to block request
                return fsExtra
                    .removeAsync(function () {
                        return _getTopicFileDir(topic.id);
                    })
                    .catch(function () {
                        logger.warn('Failed to clean up temporary Topic files', destinationDir);
                    });
            });
    };

    /**
     * Create the metainfo file
     *
     * @param {Object} topic Topic Sequelize instance
     * @param {Object} vote Vote Sequelize instance
     * @param {Object} transaction Sequelize transaction
     *
     * @returns {Promise} Vote container file
     *
     * @private
     */
    const _createMetainfoFile = function (topic, vote, transaction) {
        const templateStream = mu.compileAndRender(METAINFO_FILE.template, {
            topic: topic,
            vote: vote
        });

        return util.streamToBuffer(templateStream)
            .then(function (templateBuffer) {
                return VoteContainerFile
                    .create(
                        {
                            voteId: vote.id,
                            fileName: METAINFO_FILE.name,
                            mimeType: METAINFO_FILE.mimeType,
                            content: templateBuffer
                        },
                        {
                            transaction: transaction
                        }
                    );
            });
    };

    /**
     * Create a file for given VoteOption
     *
     * @param {Object} vote Vote Sequelize instance
     * @param {Object} voteOption Vote option Sequelize instance
     * @param {Object} transaction Sequelize transaction
     *
     * @returns {Promise} Promise
     * @private
     */
    const _createVoteOptionFile = function (vote, voteOption, transaction) {
        const templateStream = mu.compileAndRender(VOTE_OPTION_FILE.template, voteOption);

        return util.streamToBuffer(templateStream)
            .then(function (templateBuffer) {
                return VoteContainerFile
                    .create(
                        {
                            voteId: vote.id,
                            fileName: _getVoteOptionFileName(voteOption),
                            mimeType: VOTE_OPTION_FILE.mimeType,
                            content: templateBuffer
                        },
                        {
                            transaction: transaction
                        }
                    );
            });
    };

    /**
     * Create all Vote related files
     *
     * Files are:
     * * document.html - The document (topic) itself. Using document as User friendly name in the container
     * * option(s).html - One file for each Vote option
     *
     * @param {Object} topic Topic Sequelize instance
     * @param {Object} vote Vote Sequelize instance
     * @param {Object[]} voteOptions Array of VoteOption Sequelize instances
     * @param {Object} transaction Sequelize transaction
     *
     * @returns {Promise} Promise
     * @private
     */
    const _createVoteFiles = function (topic, vote, voteOptions, transaction) {
        if (!topic || !vote || !voteOptions) {
            throw Error('Missing one or more required parameters!');
        }

        const promisesToResolve = [];

        // Topic (document file)
        promisesToResolve.push(_createTopicFile(topic, vote, transaction));

        // Metainfo file
        promisesToResolve.push(_createMetainfoFile(topic, vote, transaction));

        // Each option file
        voteOptions.forEach(function (voteOption) {
            promisesToResolve.push(_createVoteOptionFile(vote, voteOption, transaction));
        });

        return Promise.all(promisesToResolve);

    };

    const _getUserContainer = function (voteId, userId, voteOptions) {
        const container = new Asic();
        const chosenVoteOptionFileNames = voteOptions.map(_getVoteOptionFileName);

        return VoteContainerFile
            .findAll({
                where: {
                    voteId: voteId
                }
            })
            .each(function (voteContainerFile) {
                const fileName = voteContainerFile.fileName;
                const mimeType = voteContainerFile.mimeType;
                const content = voteContainerFile.content;

                switch (voteContainerFile.fileName) {
                    case TOPIC_FILE.name:
                    case METAINFO_FILE.name:
                        break;
                    default:
                        // Must be option file
                        if (chosenVoteOptionFileNames.indexOf(fileName)) {
                            //Skip the option that User did not choose
                            return;
                        }
                }
                container.add(fileName, content, mimeType);
            })
            .then(function () {
                return new Promise (function (resolve) {
                    let finalData = '';
                    const mufileStream = mu
                        .compileAndRender(USERINFO_FILE.template, {user: {id: userId}});
                    mufileStream
                        .on('data', function (data) {
                            finalData += data.toString();
                        });
                    mufileStream
                        .on('end', function () {
                            container.add(USERINFO_FILE.name, finalData, 'text/html');

                            return resolve(container);
                        });
                });
            })
            .then(function () {
                return container;
            }).catch(function (e) {
                logger.error(e);
            });
    };

    const _createUserBdoc = function (voteId, userId, voteOptions, cert, certFormat, transaction) {
        let containerFiles = [];
        const certificate = new Certificate(Buffer.from(cert, certFormat));
        const chosenVoteOptionFileNames = voteOptions.map(_getVoteOptionFileName);

        return VoteContainerFile
            .findAll({
                where: {
                    voteId: voteId
                },
                transaction: transaction
            })
            .each(function (voteContainerFile) {
                const fileName = voteContainerFile.fileName;
                const mimeType = voteContainerFile.mimeType;
                const content = voteContainerFile.content;

                switch (voteContainerFile.fileName) {
                    case TOPIC_FILE.name:
                    case METAINFO_FILE.name:
                        break;
                    default:
                        // Must be option file
                        if (chosenVoteOptionFileNames.indexOf(fileName)) {
                            //Skip the option that User did not choose
                            return;
                        }
                }

                containerFiles.push({
                    path: fileName,
                    type: mimeType,
                    hash: Crypto.createHash('sha256').update(content).digest()
                });
            })
            .then(function () {
                return new Promise (function (resolve) {
                    let finalData = '';
                    const mufileStream = mu
                        .compileAndRender(USERINFO_FILE.template, {user: {id: userId}});
                    mufileStream
                        .on('data', function (data) {
                            finalData += data.toString();
                        });
                    mufileStream
                        .on('end', function () {
                            containerFiles.push({
                                path: USERINFO_FILE.name,
                                type: 'text/html',
                                hash: Crypto.createHash('sha256').update(Buffer.from(finalData)).digest()
                            });

                            return resolve(containerFiles);
                        });
                });
            })
            .then(function (files) {
                const xades = hades.new(certificate, files, {policy: "bdoc"});

                return Promise.resolve(xades);
            }).catch(function (e) {
                logger.error(e)
            });
    };


    /**
     * Initialize ID-card signing
     *
     * Creates the User BDOC container and initiates signing with ID card
     *
     * @param {string} voteId Vote ID
     * @param {string} userId User ID
     * @param {Object[]} voteOptions Array of selected vote options
     * @param {string} certificate Hex encoded DER certificate
     * @param {Object} transaction Sequelize Transaction
     *
     * @returns {Promise<Object>} Sign response
     *
     * @private
     */
    const _signInitIdCard = function (voteId, userId, voteOptions, certificate, transaction) {
        return _createUserBdoc(voteId, userId, voteOptions, certificate, 'hex', transaction)
            .then(function (xades) {
                const signableData = xades.signableHash;

                    return mobileId
                        .getCertUserData(certificate, 'hex')
                        .then(function (personalInfo) {
                            xades = xades.toString();

                            return Signature
                                .create({data: xades})
                                .then(function (signatureData) {
                                    return {
                                        statusCode: 0,
                                        personalInfo,
                                        signableHash: signableData.toString('hex'),
                                        signatureId: signatureData.id
                                    };
                                });
                        })
                    }).catch(function (e) {
                        logger.error(e);
                    });
    };

    /**
     * Initialize mobile signing
     *
     * Creates the User BDOC container and initiates signing with mobile ID
     *
     * @param {string} voteId Vote ID
     * @param {string} userId User ID
     * @param {Object[]} voteOptions Array of selected vote options
     * @param {string} pid Personal identification code
     * @param {string} phoneNumber Phone number
     * @param {Object} transaction Sequelize Transaction
     *
     * @return {Promise<Object>} Sign init response
     *
     * @private
     */
    const _signInitMobile = function (voteId, userId, voteOptions, pid, phoneNumber, certificate, transaction) {
        return _createUserBdoc(voteId, userId, voteOptions, certificate, 'base64', transaction)
            .then(function (xades) {
                const signableData = xades.signableHash;

                return mobileId
                    .getCertUserData(certificate, 'base64')
                    .then(function (personalInfo) {
                        return mobileId
                            .signature(pid, phoneNumber, signableData.toString('base64'))
                            .then(function (response) {
                                return Signature
                                    .create({data: xades.toString()})
                                    .then(function (signatureData) {
                                        response.signatureId = signatureData.id
                                        response.personalInfo = personalInfo;

                                        return response;
                                    });
                            });
                    });
            });
    };

    /**
     * Initialize mobile signing
     *
     * Creates the User BDOC container and initiates signing with mobile ID
     *
     * @param {string} voteId Vote ID
     * @param {string} userId User ID
     * @param {Object[]} voteOptions Array of selected vote options
     * @param {string} pid Personal identification code
     * @param {string} phoneNumber Phone number
     * @param {Object} transaction Sequelize Transaction
     *
     * @return {Promise<Object>} Sign init response
     *
     * @private
     */
    const _signInitSmartId = function (voteId, userId, voteOptions, pid, countryCode, certificate, transaction) {
        return _createUserBdoc(voteId, userId, voteOptions, certificate, 'base64', transaction)
            .then(function (xades) {
                const signableData = xades.signableHash;

                return smartId
                    .getCertUserData(certificate)
                    .then(function (personalInfo) {
                        return smartId
                            .signature(pid, countryCode, signableData.toString('base64'))
                            .then(function (response) {
                                return Signature
                                    .create({data: xades.toString()})
                                    .then(function (signatureData) {
                                        response.signatureId = signatureData.id
                                        response.personalInfo = personalInfo;

                                        return response;
                                    });
                            });
                    });
                });
    };

    const _handleSigningResult = function (voteId, userId, voteOptions, signableHash, signatureId, signature) {
        return Signature
                .findOne({
                    where: {
                        id: signatureId
                    }
                })
                .then(function (signatureData) {
                    const xades = Xades.parse(signatureData.data);
                    xades.setSignature(Buffer.from(signature, 'base64'));
                    return hades.timemark(xades)
                        .then(function(timemark) {
                            xades.setOcspResponse(timemark);

                            return _getUserContainer(voteId, userId, voteOptions)
                                .then(function (container) {
                                    return new Promise (function (resolve) {
                                        const chunks = [];
                                        container.addSignature(xades);
                                        const streamData = container.toStream();

                                        streamData.on('data', function (data) {
                                            chunks.push(data);
                                        })

                                        streamData.on('end', function () {
                                            const buff = Buffer.concat(chunks);

                                            return resolve(buff);
                                        })
                                        container.end();
                                    });
                                })
                                .then(function (container) {
                                    return {
                                        signedDocData: container
                                    }
                                })
                                .catch(function (e) {
                                    return Promise.reject(e);
                                })
                        });
                });
    };

    const _getSmartIdSignedDoc = function (sessionId, signableHash, signatureId, voteId, userId, voteOptions) {
        return smartId.statusSign(sessionId, 5000)
            .then(function(signResult) {
                if (signResult.signature) {
                    return _handleSigningResult(voteId, userId, voteOptions, signableHash, signatureId, signResult.signature.value);
                }
                logger.error(signResult);

                return Promise.reject(signResult);
            });
    };

    const _getMobileIdSignedDoc = function (sessionId, signableHash, signatureId, voteId, userId, voteOptions) {
        return mobileId.statusSign(sessionId, 5000)
            .then(function(signResult) {
                if (signResult.signature) {
                    return _handleSigningResult(voteId, userId, voteOptions, signableHash, signatureId, signResult.signature.value);
                }
                logger.error(signResult);

                return Promise.reject(signResult);
            });
    };

    const _signUserBdoc = function (voteId, userId, voteOptions, signableHash, signatureId, signatureValue) {
        return _handleSigningResult(voteId, userId, voteOptions, signableHash, signatureId, signatureValue);
    };

    const _generateFinalContainer = function (topicId, voteId, type, wrap) {
        const voteFileDir = _getVoteFileDir(topicId, voteId);
        const finalContainerPath = voteFileDir + '/final.' + type;
        const finalZipPath = voteFileDir + '/final.7z';

        let finalContainerFileStream; // File write stream
        let finalContainer;

        const finalContainerDownloadPath = wrap ? finalZipPath : finalContainerPath;

        return fs
            .accessAsync(finalContainerDownloadPath, fs.R_OK)
            .then(function () {
                logger.info('_generateFinalContainer', 'Cache hit for final BDOC file', finalContainerDownloadPath);

                return fs.createReadStream(finalContainerDownloadPath);
            }, function () {
                logger.info('_generateFinalContainer', 'Cache miss for final BDOC file', finalContainerDownloadPath);

                return fsExtra
                    .mkdirsAsync(voteFileDir)
                    .then(function () {
                        finalContainerFileStream = fs.createWriteStream(finalContainerPath);
                        finalContainer = new Bdoc(finalContainerFileStream);

                        logger.debug('_generateFinalContainer', 'Vote file dir created', voteFileDir);

                        return VoteContainerFile
                            .findAll({
                                where: {
                                    voteId: voteId
                                }
                            });
                    })
                    .each(function (voteContainerFile) {
                        const fileName = voteContainerFile.fileName;
                        const mimeType = voteContainerFile.mimeType;
                        const content = voteContainerFile.content;

                        logger.debug('_generateFinalContainer', 'Adding file to final BDOC', fileName, mimeType, content.length);

                        return finalContainer.append(content, {
                            name: fileName,
                            mimeType: mimeType
                        });
                    })
                    .then(function () {
                        if (type === 'bdoc') {
                            logger.debug('_generateFinalContainer', 'Adding User votes to final BDOC');

                            const connectionManager = db.connectionManager;

                            return connectionManager
                                .getConnection()
                                .then(function (connection) {
                                    logger.debug('_generateFinalContainer', 'Run query stream for User vote containers');

                                    return new Promise(function (resolve, reject) {
                                        const query = new QueryStream(
                                            '\
                                                SELECT DISTINCT ON (o."connectionUserId") \
                                                    o.* \
                                                    FROM ( \
                                                        SELECT \
                                                            vuc.container, \
                                                            uc."connectionUserId" \
                                                        FROM "VoteUserContainers" vuc \
                                                        JOIN "UserConnections" uc ON (vuc."userId" = uc."userId") \
                                                        WHERE vuc."voteId" = $1 \
                                                        AND uc."connectionId" = $2 \
                                                        ORDER BY vuc."updatedAt" DESC \
                                                    ) o \
                                            ;',
                                            [voteId, UserConnection.CONNECTION_IDS.esteid]
                                        );
                                        const stream = connection.query(query);

                                        stream.on('data', function (data) {
                                            logger.debug('_generateFinalContainer', 'Add data', data.container.length);

                                            const pid = data.connectionUserId;
                                            const userbdocContainer = data.container;

                                            finalContainer.append(userbdocContainer, {
                                                name: USER_BDOC_FILE.name.replace(':pid', pid),
                                                mimeType: USER_BDOC_FILE.mimeType
                                            });
                                        });

                                        finalContainerFileStream.on('error', function (err) {
                                            logger.error('_generateFinalContainer', 'Adding files to final BDOC FAILED', err);

                                            return reject(err);
                                        });

                                        stream.on('error', function (err) {
                                            connectionManager.releaseConnection(connection);

                                            logger.error('_generateFinalContainer', 'Reading PG query stream failed', err);

                                            return reject(err);
                                        });

                                        stream.on('end', function () {
                                            connectionManager.releaseConnection(connection);

                                            logger.debug('_generateFinalContainer', 'Adding files to final BDOC ENDED');

                                            return resolve();
                                        });
                                    });
                                });
                        }
                    })
                    .then(function () {
                        logger.debug('_generateFinalContainer', 'Generating vote CSV');

                        const connectionManager = db.connectionManager;

                        return connectionManager
                            .getConnection()
                            .then(function (connection) {
                                let fromSql;

                                switch (type) {
                                    case 'bdoc':
                                        fromSql = 'SELECT DISTINCT ON (o."PID") \
                                            o.* FROM ( \
                                            SELECT \
                                            row_number() OVER() AS "rowNumber", \
                                            v."createdAt" as "timestamp", \
                                            uc."connectionUserId" as "PID", \
                                                (uc."connectionData"::json->>\'firstName\') || \' \' || (uc."connectionData"::json->>\'lastName\') as "fullName", \
                                                vo.value as "optionValue" \
                                            FROM votes v \
                                                JOIN "UserConnections" uc ON (uc."userId" = v."userId" AND uc."connectionId" = \'esteid\') \
                                            JOIN "VoteOptions" vo ON (vo."id" = v."optionId") \
                                        ORDER BY v."createdAt" DESC) o ';
                                        break;
                                    case 'zip':
                                        fromSql = 'SELECT \
                                            row_number() OVER() AS "rowNumber", \
                                            v."createdAt" as "timestamp", \
                                            v."userId" as "userId", \
                                            u.name as "name", \
                                            vo.value as "optionValue" \
                                        FROM votes v \
                                            JOIN "Users" u ON (u.id = v."userId") \
                                            JOIN "VoteOptions" vo ON (vo."id" = v."optionId") \
                                        ORDER BY vo.value DESC ';
                                        break;
                                }

                                const query = new QueryStream(
                                    ' \
                                        WITH \
                                            vote_groups("voteId", "userId", "optionGroupId", "updatedAt") AS ( \
                                                SELECT DISTINCT ON("voteId","userId") \
                                                    vl."voteId", \
                                                    vl."userId", \
                                                    vl."optionGroupId", \
                                                    vl."updatedAt" \
                                                FROM "VoteLists" vl \
                                                WHERE vl."voteId" = $1 \
                                                AND vl."deletedAt" IS NULL \
                                                ORDER BY "voteId", "userId", "createdAt" DESC, "optionGroupId" ASC \
                                            ), \
                                            votes("voteId", "userId", "optionId", "optionGroupId") AS ( \
                                                SELECT \
                                                    vl."voteId", \
                                                    vl."userId", \
                                                    vl."optionId", \
                                                    vl."optionGroupId", \
                                                    vl."createdAt" \
                                                FROM "VoteLists" vl \
                                                JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."userId" = vg."userId" AND vl."optionGroupId" = vg."optionGroupId") \
                                                WHERE vl."voteId" = $1 \
                                            ) \
                                            '+ fromSql+ '\
                                    ;',
                                    [voteId]
                                );

                                const stream = connection.query(query);

                                const csvStream = fastCsv.createWriteStream({
                                    headers: true,
                                    rowDelimiter: '\r\n'
                                });
                                finalContainer.append(csvStream, {
                                    name: VOTE_RESULTS_FILE.name,
                                    mimeType: VOTE_RESULTS_FILE.mimeType
                                });

                                stream.on('data', function (voteResult) {
                                    voteResult.optionFileName = _getVoteOptionFileName({value: voteResult.optionValue});
                                    csvStream.write(voteResult);
                                });

                                stream.on('error', function (err) {
                                    logger.error('_generateFinalContainer', 'Generating vote CSV FAILED', err);

                                    csvStream.end();
                                    finalContainer.finalize();
                                    connectionManager.releaseConnection(connection);
                                });

                                stream.on('end', function () {
                                    logger.debug('_generateFinalContainer', 'Generating vote CSV succeeded');

                                    csvStream.end();
                                    finalContainer.finalize();
                                    connectionManager.releaseConnection(connection);
                                });

                                return util.streamToPromise(finalContainerFileStream);
                            })
                            .then(function () {
                                if (wrap) {
                                    logger.debug('_generateFinalContainer', 'Wrapping final BDOC');

                                    // Wrap the BDOC in 7Zip
                                    const zip = new SevenZip();

                                    return zip
                                        .add(finalZipPath, [finalContainerPath])
                                        .then(function () {
                                            logger.debug('_generateFinalContainer', 'Wrapping final BDOC succeeded', finalZipPath);

                                            return finalZipPath;
                                        });
                                } else {
                                    logger.debug('_generateFinalContainer', 'Not wrapping final BDOC', finalContainerPath);

                                    return finalContainerPath;
                                }
                            })
                            .then(function (docPath) {
                                logger.debug('_generateFinalContainer', 'Final BDOC generated successfully', docPath);

                                return fs.createReadStream(docPath);
                            })
                            .catch(function (err) {
                                logger.error('Failed to generate final BDOC', err);

                                // Clean up zip file that was created as it may be corrupted, best effort removing the file
                                fs.unlink(finalContainerPath);
                                fs.unlink(finalZipPath);

                                throw err;
                            });
                        });
                });
    };

    /**
     * Get the final BDOC container
     *
     * @param {string} topicId Topic ID
     * @param {string} voteId Vote ID
     * @param {boolean} [wrap=false] Wrap in 7zip archive
     *
     * @return {Promise<Stream.Readable>} Final BDOC file stream
     *
     * @private
     */
    const _getFinalBdoc = function (topicId, voteId, wrap) {
        return _generateFinalContainer(topicId, voteId, 'bdoc', wrap);
    };

    /**
     * Get the final zip container
     *
     * @param {string} topicId Topic ID
     * @param {string} voteId Vote ID
     *
     * @return {Promise<Stream.Readable>} Final zip file stream
     *
     * @private
     */

    const _getFinalZip = function (topicId, voteId) {
        return _generateFinalContainer(topicId, voteId, 'zip');
    };

    /**
     * Delete the generated final BDOC container from the disk.
     *
     * @param {string} topicId Topic ID
     * @param {string} voteId Vote ID
     *
     * @return {Promise} Deletion result
     *
     * @private
     */
    const _deleteFinalBdoc = function (topicId, voteId) {
        const voteFileDir = _getVoteFileDir(topicId, voteId);
        const finalBdocPath = voteFileDir + '/final.bdoc';

        return fs
            .statAsync(finalBdocPath)
            .then(
                function () {
                    return fs.unlinkAsync(finalBdocPath);
                },
                function () {
                    return Promise.resolve(); // Well, if it did not exists, we're ok.
                }
            );
    };

    return {
        signInitIdCard: _signInitIdCard,
        signInitSmartId: _signInitSmartId,
        signInitMobile: _signInitMobile,
        signUserBdoc: _signUserBdoc,
        getSmartIdSignedDoc: _getSmartIdSignedDoc,
        getMobileIdSignedDoc: _getMobileIdSignedDoc,
        getFinalBdoc: _getFinalBdoc,
        getFinalZip: _getFinalZip,
        deleteFinalBdoc: _deleteFinalBdoc,
        createVoteFiles: _createVoteFiles
    };
};