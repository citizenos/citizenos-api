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
    const conversion = require("phantom-html-to-pdf")();

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
    const Vote = models.Vote;
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

    const VOTE_RESULTS_GRAPH_FILE = {
        template: 'bdoc/results_graph.html',
        name: 'graph.pdf',
        mimeType: 'application/pdf'
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
    const _getVoteFileDir = function (topicId, voteId, include) {
        const path = _getTopicFileDir(topicId) + '/' + voteId;
        if (include && Array.isArray(include) && include.indexOf('csv') > -1) {
            return path + '/includecsv';
        }

        return path;
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
    const _createTopicFile = async function (topic, vote, transaction) {
        const destinationDir = _getVoteFileSourceDir(topic.id, vote.id);

        await fsExtra
            .mkdirsAsync(destinationDir, FILE_CREATE_MODE);
        const filePath = destinationDir + '/' + TOPIC_FILE.name;
        const doc = new CosHtmlToDocx(topic.description, topic.title, filePath);

        const docxBuffer = await doc.processHTML();

        await VoteContainerFile.create(
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

        return fsExtra
            .removeAsync(function () {
                return _getTopicFileDir(topic.id);
            })
            .catch(function () {
                logger.warn('Failed to clean up temporary Topic files', destinationDir);
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
    const _createMetainfoFile = async function (topic, vote, transaction) {
        const templateStream = mu.compileAndRender(METAINFO_FILE.template, {
            topic: topic,
            vote: vote
        });

        const templateBuffer = await util.streamToBuffer(templateStream);

        return VoteContainerFile.create(
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
    const _createVoteOptionFile = async function (vote, voteOption, transaction) {
        const templateStream = mu.compileAndRender(VOTE_OPTION_FILE.template, voteOption);

        const templateBuffer = await util.streamToBuffer(templateStream);

        return VoteContainerFile.create(
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
    const _createVoteFiles = async function (topic, vote, voteOptions, transaction) {
        if (!topic || !vote || !voteOptions) {
            throw Error('Missing one or more required parameters!');
        }

        // Topic (document file)
        await _createTopicFile(topic, vote, transaction);

        // Metainfo file
        await _createMetainfoFile(topic, vote, transaction);

        // Each option file
        for await (const voteOption of voteOptions) {
            await _createVoteOptionFile(vote, voteOption, transaction);
        }

    };

    const _getUserContainer = async function (voteId, userId, voteOptions) {
        const container = new Asic();
        const chosenVoteOptionFileNames = voteOptions.map(_getVoteOptionFileName);

        const voteContainerFiles = await VoteContainerFile
            .findAll({
                where: {
                    voteId: voteId
                }
            })
        voteContainerFiles.forEach(function (voteContainerFile) {
            const fileName = voteContainerFile.fileName;
            const mimeType = voteContainerFile.mimeType;
            const content = voteContainerFile.content;

            switch (voteContainerFile.fileName) {
                case TOPIC_FILE.name:
                case METAINFO_FILE.name:
                    break;
                default:
                    // Must be option file
                    if (chosenVoteOptionFileNames.indexOf(fileName) === -1) {
                        //Skip the option that User did not choose
                        return;
                    }
            }
            container.add(fileName, content, mimeType);
        });

        return new Promise(function (resolve) {
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
    };

    const _createUserBdoc = async function (voteId, userId, voteOptions, cert, certFormat, transaction) {
        try {
            let containerFiles = [];
            const certificate = new Certificate(Buffer.from(cert, certFormat));
            const chosenVoteOptionFileNames = voteOptions.map(_getVoteOptionFileName);

            const voteContainerFiles = await VoteContainerFile
                .findAll({
                    where: {
                        voteId: voteId
                    },
                    transaction
                })

            voteContainerFiles.forEach(function (voteContainerFile) {
                const fileName = voteContainerFile.fileName;
                const mimeType = voteContainerFile.mimeType;
                const content = voteContainerFile.content;
                switch (voteContainerFile.fileName) {
                    case TOPIC_FILE.name:
                    case METAINFO_FILE.name:
                        break;
                    default:
                        // Must be option file
                        if (chosenVoteOptionFileNames.indexOf(fileName) === -1) {
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

            const files= await new Promise(function (resolve) {
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

            return hades.new(certificate, files, {policy: "bdoc"});
        } catch(e) {
            logger.error(e)
        }
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
    const _signInitIdCard = async function (voteId, userId, voteOptions, certificate, transaction) {
        const xades = await _createUserBdoc(voteId, userId, voteOptions, certificate, 'hex', transaction);
        const signableData = xades.signableHash;

        const personalInfo = await mobileId.getCertUserData(certificate, 'hex');

        const xadesString = xades.toString();

        const signatureData = await Signature.create({data: xadesString});

        return {
            statusCode: 0,
            personalInfo,
            signableHash: signableData.toString('hex'),
            signatureId: signatureData.id
        };
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
    const _signInitMobile = async function (voteId, userId, voteOptions, pid, phoneNumber, certificate, transaction) {
        const xades = await _createUserBdoc(voteId, userId, voteOptions, certificate, 'base64', transaction);
        const signableData = xades.signableHash;

        const personalInfo = await mobileId.getCertUserData(certificate, 'base64');
        const response = await mobileId.signature(pid, phoneNumber, signableData.toString('base64'));
        const signatureData = await Signature.create({data: xades.toString()});
        response.signatureId = signatureData.id
        response.personalInfo = personalInfo;

        return response;
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
    const _signInitSmartId = async function (voteId, userId, voteOptions, pid, countryCode, certificate, transaction) {
        const xades = await _createUserBdoc(voteId, userId, voteOptions, certificate, 'base64', transaction);
        const signableData = xades.signableHash;
        const personalInfo = await smartId.getCertUserData(certificate);
        const response = await smartId.signature(pid, countryCode, signableData.toString('base64'))
        const signatureData = await Signature.create({data: xades.toString()});
        response.signatureId = signatureData.id
        response.personalInfo = personalInfo;

        return response;
    };

    const _handleSigningResult = async function (voteId, userId, voteOptions, signableHash, signatureId, signature) {
        const signatureData= await Signature
            .findOne({
                where: {
                    id: signatureId
                }
            });

        const xades = Xades.parse(signatureData.data);
        xades.setSignature(Buffer.from(signature, 'base64'));
        const timemark = await hades.timemark(xades);
        xades.setOcspResponse(timemark);

        const container = await _getUserContainer(voteId, userId, voteOptions)

        const signedDocData = await new Promise(function (resolve) {
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

        return {
            signedDocData
        }
    };

    const _getSmartIdSignedDoc = async function (sessionId, signableHash, signatureId, voteId, userId, voteOptions, timeoutMs) {
        try {
            const signResult = await smartId.statusSign(sessionId, timeoutMs);
            if (signResult.signature) {
                return _handleSigningResult(voteId, userId, voteOptions, signableHash, signatureId, signResult.signature.value);
            }

            logger.error(signResult);
            return Promise.reject(signResult);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    };

    const _getMobileIdSignedDoc = async function (sessionId, signableHash, signatureId, voteId, userId, voteOptions, timeoutMs) {
        try {
            const signResult = await mobileId.statusSign(sessionId, timeoutMs)
            if (signResult.signature) {
                return _handleSigningResult(voteId, userId, voteOptions, signableHash, signatureId, signResult.signature.value);
            }

            logger.error(signResult);
            return Promise.reject(signResult);
        } catch (error) {
            logger.error(error);
            throw error;
        }
    };

    const _signUserBdoc = function (voteId, userId, voteOptions, signableHash, signatureId, signatureValue) {
        return _handleSigningResult(voteId, userId, voteOptions, signableHash, signatureId, signatureValue);
    };

    const _generateFinalCSV = async function (voteId, type, finalContainer) {
        let fromSql;
        const connectionManager = db.connectionManager;
        const connection = await connectionManager.getConnection();

        switch (type) {
            case 'bdoc':
                fromSql = `SELECT
                    o."timestamp",
                    o."PID",
                    o."fullName",
                    array_agg(o."optionValue") AS "optionValues"
                    FROM (
                        SELECT
                            v."createdAt" as "timestamp",
                            uc."connectionUserId" as "PID",
                            (uc."connectionData"::json->>'firstName') || ' ' || (uc."connectionData"::json->>'lastName') as "fullName",
                            vo.value as "optionValue"
                        FROM votes v
                        JOIN "UserConnections" uc ON (uc."userId" = v."userId" AND uc."connectionId" = 'esteid')
                        JOIN "VoteOptions" vo ON (vo."id" = v."optionId")
                        ORDER BY v."createdAt" DESC
                    ) o
                    GROUP BY o."timestamp", o."PID", o."fullName"`;
                break;
            case 'zip':
                fromSql = `SELECT
                    o."timestamp",
                    o."userId",
                    o.name,
                    array_agg(o."optionValue") AS "optionValues"
                    FROM (
                        SELECT
                            v."createdAt" as "timestamp",
                            v."userId",
                            u.name,
                            vo.value as "optionValue"
                            FROM votes v
                            JOIN "Users" u ON (u.id = v."userId")
                            JOIN "VoteOptions" vo ON (vo."id" = v."optionId")
                        ORDER BY v."createdAt" DESC
                    ) o
                    GROUP BY o."timestamp", o."userId", o.name`;
                break;
        }

        const query = new QueryStream(
            `WITH
            vote_groups("voteId", "userId", "optionGroupId", "updatedAt") AS (
                SELECT DISTINCT ON (vl."userId") vl."voteId", vl."userId", vli."optionGroupId", vl."updatedAt"
                FROM (
                    SELECT DISTINCT ON (vl."userId", MAX(vl."updatedAt"))
                    vl."userId",
                    vl."voteId",
                    MAX(vl."updatedAt") as "updatedAt"
                    FROM "VoteLists" vl
                    WHERE vl."voteId" = $1
                    AND vl."deletedAt" IS NULL
                    GROUP BY
                        vl."userId",
                        vl."voteId"
                    ORDER BY MAX(vl."updatedAt") DESC
                ) vl
                JOIN "VoteLists" vli
                    ON vli."userId" = vl."userId"
                    AND vl."voteId" = vli."voteId"
                    AND vli."updatedAt" = vl."updatedAt"
                LEFT JOIN "UserConnections" uc
                ON uc."userId" = vl."userId"
                AND uc."connectionId" = 'esteid'
                WHERE vl."voteId" = $1
                    AND vl."userId" NOT IN
                    (
                    SELECT DISTINCT
                            uc."connectedUser"
                            FROM (
                                SELECT
                                    vl."userId",
                                    vl."updatedAt"
                                FROM "VoteLists" vl
                                WHERE vl."voteId" = $1
                                AND vl."deletedAt" IS NULL
                                ORDER BY vl."updatedAt" DESC
                            ) vl
                            JOIN (
                                SELECT DISTINCT ON (uc."userId")
                                    uc."userId",
                                    uci."userId" as "connectedUser",
                                    uc."connectionId", uc."connectionUserId"
                                FROM "UserConnections" uc
                                JOIN "UserConnections" uci
                                    ON uc."connectionId" = uci."connectionId"
                                    AND uc."connectionUserId" = uci."connectionUserId"
                                    AND uc."userId" <> uci."userId"
                            ) uc ON uc."userId" = vl."userId"
                            JOIN (
                                SELECT
                                    vl."userId",
                                    vl."updatedAt"
                                FROM "VoteLists" vl
                                WHERE vl."voteId" = $1
                                AND vl."deletedAt" IS NULL
                                ORDER BY vl."updatedAt" DESC
                            ) vli
                            ON uc."connectedUser" = vli."userId"
                            AND vli."updatedAt" < vl."updatedAt"
                    )
            ),
            votes("voteId", "userId", "optionId", "optionGroupId") AS (
                SELECT
                    vl."voteId",
                    vl."userId",
                    vl."optionId",
                    vl."optionGroupId",
                    vl."createdAt"
                FROM "VoteLists" vl
                JOIN vote_groups vg ON (vl."voteId" = vg."voteId" AND vl."userId" = vg."userId" AND vl."optionGroupId" = vg."optionGroupId")
                WHERE vl."voteId" = $1
            )
                ${fromSql}
            ;`,
            [voteId]
        );

        const stream = connection.query(query);

        const csvStream = fastCsv.format({
            headers: true,
            rowDelimiter: '\r\n'
        });

        finalContainer.append(csvStream, {
            name: VOTE_RESULTS_FILE.name,
            mimeType: VOTE_RESULTS_FILE.mimeType
        });

        stream.on('data', function (voteResult) {
            voteResult.optionFileName = [];

            for(const optionValue of voteResult.optionValues) {
                voteResult.optionFileName.push(_getVoteOptionFileName({value: optionValue}));

            }

            csvStream.write(voteResult);
        });

        stream.on('error', function (err) {
            logger.error('_generateFinalContainer', 'Generating vote CSV FAILED', err);

            csvStream.end();
            connectionManager.releaseConnection(connection);
        });

        stream.on('end', function () {
            logger.debug('_generateFinalContainer', 'Generating vote CSV succeeded');

            csvStream.end();
            connectionManager.releaseConnection(connection);
        });
    };

    const _generateResultGraphPDF = async function (voteId, finalContainer) {
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
                    COALESCE(SUM(v."voteCount"), 0) as "voteCount",
                    v."optionId",
                    vo."value"
                FROM "VoteOptions" vo
                LEFT JOIN (
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
                ON (v."optionId" = vo."id")
                WHERE vo."voteId" = :voteId
                GROUP BY v."optionId", v."voteId", vo."value"
        ;`;

        const voteResult = await db.query(
            sql,
            {
                replacements: {
                    voteId: voteId
                },
                type: db.QueryTypes.SELECT,
                raw: true
            }
        );
        const topic = await db.query(
            `SELECT
                t.title
            FROM "Topics" t
            JOIN "TopicVotes" tv ON t.id = tv."topicId"
            WHERE tv."voteId" = :voteId
            ;`,
            {
                replacements: {
                    voteId: voteId
                },
                type: db.QueryTypes.SELECT,
                raw: true
            }
        );

        return new Promise (function (resolve) {
            let rows = '';
            let longText = '';
            let totalVotes = 0;
            let winner;
            voteResult.forEach(function (row) {
                row.voteCount = parseInt(row.voteCount);
                if (!winner || row.voteCount > winner) {
                    winner = row.voteCount
                }

                totalVotes += row.voteCount;
            });

            voteResult.forEach(function (row, index) {
                let activeClass = '';
                if (row.voteCount === winner) {
                    activeClass = 'active';
                }
                const letter = String.fromCharCode(65 + index);
                const percentage = ((row.voteCount/totalVotes)*100);

                rows += `
                    <div class="graph_row ${activeClass}">
                        <div class="graph_row_fill" style="width: ${percentage}%;">
                            <div class="graph_row_text_wrap">
                                <div class="table_cell">
                                    <div class="graph_row_text">
                                        <span>${row.value}</span><br>
                                        <span class="bold">${row.voteCount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;

                longText += `
                    <div class="long_text ${activeClass}">
                        <span class="bold">${letter}.</span> <span>${row.value}</span>
                    </div>`;
            })

            let finalData = '';
            const mufileStream = mu
                .compileAndRender(VOTE_RESULTS_GRAPH_FILE.template, {rows: rows, title: topic[0].title, longText: longText})

            mufileStream
                .on('data', function (data) {
                    finalData += data.toString();
                });

            mufileStream
                .on('end', function () {
                    conversion({ html: finalData }, async function(err, pdf) {
                        const buffer = await streamToBuffer(pdf.stream);
                        finalContainer.append(buffer, {
                            name: VOTE_RESULTS_GRAPH_FILE.name,
                            mimeType: VOTE_RESULTS_GRAPH_FILE.mimeType
                        });
                        return resolve();
                      });
                });
        });
    }
    const streamToBuffer = async (stream) => {
        return new Promise((resolve, reject) => {
          const data = [];

          stream.on('data', (chunk) => {
            data.push(chunk);
          });

          stream.on('end', () => {
            resolve(Buffer.concat(data))
          })

          stream.on('error', (err) => {
            reject(err)
          })

        })
    }

    const _generateFinalContainer = async function (topicId, voteId, type, include, wrap) {
        const voteFileDir = _getVoteFileDir(topicId, voteId, include);
        const finalContainerPath = `${voteFileDir}/final.${type}`;
        const finalZipPath = `${voteFileDir}/final.7z`;

        let finalContainerFileStream; // File write stream
        let finalContainer;

        const finalContainerDownloadPath = wrap ? finalZipPath : finalContainerPath;
        try {
            await fs.accessAsync(finalContainerDownloadPath, fs.R_OK);
            logger.info('_generateFinalContainer', 'Cache hit for final BDOC file', finalContainerDownloadPath);

            return fs.createReadStream(finalContainerDownloadPath);
        } catch (err) {
            try {
                logger.info('_generateFinalContainer', 'Cache miss for final BDOC file', finalContainerDownloadPath);
                await fsExtra.mkdirsAsync(voteFileDir);

                finalContainerFileStream = fs.createWriteStream(finalContainerPath);
                finalContainer = new Bdoc(finalContainerFileStream);

                logger.debug('_generateFinalContainer', 'Vote file dir created', voteFileDir);

                const voteContainerFiles = await VoteContainerFile.findAll({
                    where: {
                        voteId: voteId
                    }
                });

                voteContainerFiles.forEach(function (voteContainerFile) {
                    const fileName = voteContainerFile.fileName;
                    const mimeType = voteContainerFile.mimeType;
                    const content = voteContainerFile.content;

                    logger.debug('_generateFinalContainer', 'Adding file to final BDOC', fileName, mimeType, content.length);

                    return finalContainer.append(content, {
                        name: fileName,
                        mimeType: mimeType
                    });
                });

                const connectionManager = db.connectionManager;
                const connection = await connectionManager.getConnection();

                if (type === 'bdoc') {
                    logger.debug('_generateFinalContainer', 'Adding User votes to final BDOC');

                    logger.debug('_generateFinalContainer', 'Run query stream for User vote containers');

                    await new Promise(function (resolve, reject) {
                        const query = new QueryStream(`
                            SELECT
                                container,
                                "PID"
                            FROM "VoteUserContainers"
                            WHERE "voteId" = $1
                            ORDER BY "updatedAt" DESC
                            ;`,
                            [voteId]
                        );
                        const stream = connection.query(query);

                        stream.on('data', function (data) {
                            logger.debug('_generateFinalContainer', 'Add data', data.container.length);

                            const pid = data.PID;
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
                }

                logger.debug('_generateFinalContainer', 'Generating vote CSV');

                if (type !== 'bdoc' || (include && include.indexOf('csv') > -1)) {
                    await _generateFinalCSV(voteId, type, finalContainer);
                    await _generateResultGraphPDF(voteId, finalContainer);

                    finalContainer.finalize();
                } else {
                    finalContainer.finalize();
                }

                await util.streamToPromise(finalContainerFileStream);
                let docPath = finalContainerPath;

                if (wrap) {
                    logger.debug('_generateFinalContainer', 'Wrapping final BDOC');

                    // Wrap the BDOC in 7Zip
                    await util.streamToPromise(SevenZip.add(finalZipPath, [finalContainerPath]));
                    logger.debug('_generateFinalContainer', 'Wrapping final BDOC succeeded', finalZipPath);
                    docPath = finalZipPath;
                } else {
                    logger.debug('_generateFinalContainer', 'Not wrapping final BDOC', finalContainerPath);
                }

                logger.debug('_generateFinalContainer', 'Final BDOC generated successfully', docPath);

                return fs.createReadStream(docPath);
            } catch(err) {
                logger.error('Failed to generate final BDOC', err);

                // Clean up zip file that was created as it may be corrupted, best effort removing the file
                fs.unlink(finalContainerPath);
                fs.unlink(finalZipPath);

                throw err;
            }
        }
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
    const _getFinalBdoc = function (topicId, voteId, include, wrap) {
        return _generateFinalContainer(topicId, voteId, 'bdoc', include, wrap);
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
    const _deleteFinalBdoc = async function (topicId, voteId) {
        const voteFileDir = _getVoteFileDir(topicId, voteId);
        const voteFileDirCsv = _getVoteFileDir(topicId, voteFileDir, ['csv']);
        [voteFileDir, voteFileDirCsv].forEach( async (dir) => {
            const finalBdocPath = dir + '/final.bdoc';

            try {
                await fs.statAsync(finalBdocPath);
                await fs.unlinkAsync(finalBdocPath);
            } catch (e) {
                logger.log(e.message);
            }
        });

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
