'use strict';

/**
 * cosBdoc
 *
 * TODO: RENAME: Contains also not-BDOC related functions, simplifications on top of DDS
 *
 * All functionality related to BDOC container creation
 */

module.exports = function (app) {
    var logger = app.get('logger');
    var Promise = app.get('Promise');
    var util = app.get('util');
    var fs = app.get('fs');
    var fsExtra = app.get('fsExtra');
    var mu = app.get('mu');
    var sanitizeFilename = app.get('sanitizeFilename');
    var nodeForge = app.get('nodeForge');
    var config = app.get('config');
    var DigiDocServiceClient = app.get('ddsClient');
    var stream = app.get('stream');
    var models = app.get('models');
    var db = models.sequelize;
    var QueryStream = app.get('QueryStream');
    var fastCsv = app.get('fastCsv');
    var Bdoc = app.get('Bdoc');
    var smartId = app.get('smartId');
    var SevenZip = app.get('SevenZip');
    var CosHtmlToDocx = app.get('cosHtmlToDocx');
    var archiver = require('archiver');

    var VoteContainerFile = models.VoteContainerFile;
    var UserConnection = models.UserConnection;

    var FILE_CREATE_MODE = '0760';

    var TOPIC_FILE = {
        template: 'bdoc/document.html',
        name: 'document.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    var METAINFO_FILE = {
        template: 'bdoc/metainfo.html',
        name: '__metainfo.html',
        mimeType: 'text/html'
    };

    var VOTE_OPTION_FILE = {
        template: 'bdoc/voteOption.html',
        name: ':value.html', // ":value" is a placeholder to replace with sanitized file name
        mimeType: 'text/html'
    };

    var USERINFO_FILE = {
        template: 'bdoc/userinfo.html',
        name: '__userinfo.html',
        mimeType: 'text/html'
    };

    var VOTE_RESULTS_FILE = {
        name: 'votes.csv',
        mimeType: 'text/csv'
    };

    var USER_BDOC_FILE = {
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
    var _getTopicFileDir = function (topicId) {
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
    var _getVoteFileDir = function (topicId, voteId) {
        return _getTopicFileDir(topicId) + '/' + voteId;
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
    var _getVoteFileSourceDir = function (topicId, voteId) {
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
    var _createTopicFile = function (topic, vote, transaction) {
        var destinationDir = _getVoteFileSourceDir(topic.id, vote.id);

        var filePath;

        return fsExtra
            .mkdirsAsync(destinationDir, FILE_CREATE_MODE)
            .then(function () {
                filePath = destinationDir + '/' + TOPIC_FILE.name;
                var doc = new CosHtmlToDocx(topic.description, topic.title, filePath);

                return doc.processHTML();
            })
            .then(function () {
                var docxReadStream = fs.createReadStream(filePath);

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
    var _createMetainfoFile = function (topic, vote, transaction) {
        var templateStream = mu.compileAndRender(METAINFO_FILE.template, {
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
     * Get the file name for specific VoteOption
     *
     * @param {Object} voteOption VoteOption Sequelize instance
     *
     * @returns {string} File name
     *
     * @private
     */
    var _getVoteOptionFileName = function (voteOption) {
        var sanitizedfileName = sanitizeFilename(voteOption.value);

        if (!sanitizedfileName.length) {
            throw Error('Nothing left after sanitizing the optionValue: ' + voteOption.value);
        }

        return VOTE_OPTION_FILE.name.replace(':value', sanitizedfileName);
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
    var _createVoteOptionFile = function (vote, voteOption, transaction) {
        var templateStream = mu.compileAndRender(VOTE_OPTION_FILE.template, voteOption);

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
    var _createVoteFiles = function (topic, vote, voteOptions, transaction) {
        if (!topic || !vote || !voteOptions) {
            throw Error('Missing one or more required parameters!');
        }

        var promisesToResolve = [];

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

    /**
     * Create the User specific BDOC container which will be signed
     *
     * @param {Object} ddsClient DigiDocService client
     * @param {string} topicId Topic ID
     * @param {string} voteId Vote ID
     * @param {string} userId User ID
     * @param {Object[]} voteOptions Array of selected vote options
     * @param {Object} transaction Sequelize Transaction
     *
     * @return {Promise<Object>} BDOC response
     *
     * @private
     */
    var _createUserBdoc = function (topicId, voteId, userId, voteOptions, transaction) {
        let docPath = './files/'+ topicId +'/'+ voteId +'/' + userId;
        if (!fs.existsSync(docPath)){
            fs.mkdirSync(docPath);
        }
        docPath += '/vote.bdoc';
        const container = new Bdoc(docPath);

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
                
                return container.append(content, {name: fileName, mimeType});
         /*       var voteContainerFileStream = new stream.PassThrough();
                voteContainerFileStream.end(content);

                return ddsClient.addDataFileEmbeddedBase64(voteContainerFileStream, fileName, mimeType);*/
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
                            container.append(Buffer.from(finalData), {
                                name: USERINFO_FILE.name,
                                mimeType: 'text/html'
                            });
                            return resolve();
                        });
                });
            /*    const templateStream = mu.compileAndRender(USERINFO_FILE.template, {user: {id: userId}});
                return ddsClient.addDataFileEmbeddedBase64(templateStream, USERINFO_FILE.name, USERINFO_FILE.mimeType);*/
            })
            .then(function () {
                return new Promise(function (resolve) {
                   return resolve(container);
                });
            }).catch(function (e) {
                console.log(e)
            })
/*
        return ddsClient.startSession(null, null, true)
            .then(function () {
                /*var format = DigiDocServiceClient.DOCUMENT_FORMATS.BDOC;

                return ddsClient.createSignedDoc(format.name, format.version);
            })
            .then(function () {
                return VoteContainerFile
                    .findAll({
                        where: {
                            voteId: voteId
                        },
                        transaction: transaction
                    });
            })
            .each(function (voteContainerFile) {
                var fileName = voteContainerFile.fileName;
                var mimeType = voteContainerFile.mimeType;
                var content = voteContainerFile.content;

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
                
                return bdoc.append(content, {name: fileName, mimeType});
                var voteContainerFileStream = new stream.PassThrough();
                voteContainerFileStream.end(content);

                return ddsClient.addDataFileEmbeddedBase64(voteContainerFileStream, fileName, mimeType);
            })
            .then(function () {
                var templateStream = mu.compileAndRender(USERINFO_FILE.template, {user: {id: userId}});

                return ddsClient.addDataFileEmbeddedBase64(templateStream, USERINFO_FILE.name, USERINFO_FILE.mimeType);
            });*/
    };

    /**
     * Initialize ID-card signing
     *
     * Creates the User BDOC container and initiates signing with ID card
     *
     * @param {string} topicId Topic ID
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
    var _signInitIdCard = function (topicId, voteId, userId, voteOptions, certificate, transaction) {
        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);

        return _createUserBdoc(ddsClient, topicId, voteId, userId, voteOptions, transaction)
            .then(function () {
                return ddsClient.prepareSignature(certificate, '');
            })
            .spread(function (result) {
                return {
                    sesscode: ddsClient.getSesscode(),
                    statusCode: 0,
                    signatureId: result.SignatureId.$value,
                    signedInfoDigest: result.SignedInfoDigest.$value
                };
            })
            .catch(DigiDocServiceClient.SoapFault, function (err) {
                return {
                    sesscode: ddsClient.getSesscode(),
                    status: err.message,
                    statusCode: err.code
                };
            });
    };

    /**
     * Initialize mobile signing
     *
     * Creates the User BDOC container and initiates signing with mobile ID
     *
     * @param {string} topicId Topic ID
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
    var _signInitMobile = function (topicId, voteId, userId, voteOptions, pid, phoneNumber, transaction) {
        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);


        return _createUserBdoc(ddsClient, topicId, voteId, userId, voteOptions, transaction)
            .then(function () {
                // Call DDS mobile sign
                var additionalData = 'CitizenOS'; // FIXME: Do we want a personalized message?
                var language = 'ENG'; // FIXME: User session 2 letter code to 3 letter code conversion

                return ddsClient.mobileSign(pid, null, phoneNumber, additionalData, language, null, null, null, null, null, null, DigiDocServiceClient.MESSAGING_MODES.ASYNCH_CLIENT_SERVER, null, true, false);
            })
            .spread(function (result) {
                return {
                    sesscode: ddsClient.getSesscode(),
                    statusCode: 0,
                    status: result.Status.$value,
                    challengeID: result.ChallengeID.$value
                };
            })
            .catch(DigiDocServiceClient.SoapFault, function (err) {
                return {
                    sesscode: ddsClient.getSesscode(),
                    status: err.message,
                    statusCode: err.code
                };
            });
    };

    /**
     * Initialize mobile signing
     *
     * Creates the User BDOC container and initiates signing with mobile ID
     *
     * @param {string} topicId Topic ID
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
    var _signInitSmartId = function (topicId, voteId, userId, voteOptions, pid, countryCode, certificate, transaction) {
        return _createUserBdoc(topicId, voteId, userId, voteOptions, transaction)
            .then(function (bdoc) {
                bdoc.addSigningCertificate(certificate);
                return smartId.signature(pid, countryCode, bdoc.getDataToSign());
            })
      /*      .spread(function (result) {
                return {
                    sesscode: ddsClient.getSesscode(),
                    statusCode: 0,
                    status: result.Status.$value,
                    challengeID: result.ChallengeID.$value
                };
            })
            .catch(DigiDocServiceClient.SoapFault, function (err) {
                return {
                    sesscode: ddsClient.getSesscode(),
                    status: err.message,
                    statusCode: err.code
                };
            });*/
    };

    /**
     * Initialize Mobiil-ID log in
     *
     * @param {string} pid Personal identification code
     * @param {string} phoneNumber Phone number
     * @param {string} language 2 letter ISO language code
     *
     * @return {Promise<Object>} Login init response
     *
     * @private
     */
    var _loginMobileInit = function (pid, phoneNumber, language) {
        language = 'ENG'; // FIXME: User session 2 letter code to 3 letter code conversion

        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);

        return ddsClient
            .mobileAuthenticate(pid, null, phoneNumber, language, null, null, DigiDocServiceClient.MESSAGING_MODES.ASYNCH_CLIENT_SERVER, null, false, false)
            .spread(function (mobileAuthenticateResult) {
                return {
                    sesscode: mobileAuthenticateResult.Sesscode.$value,
                    statusCode: 0,
                    personalInfo: {
                        pid: mobileAuthenticateResult.UserIDCode.$value,
                        firstName: mobileAuthenticateResult.UserGivenname.$value,
                        lastName: mobileAuthenticateResult.UserSurname.$value,
                        countryCode: mobileAuthenticateResult.UserCountry.$value // UPPERCASE ISO-2 letter
                    },
                    challengeID: mobileAuthenticateResult.ChallengeID.$value
                };
            })
            .catch(DigiDocServiceClient.SoapFault, function (err) {
                return {
                    sesscode: ddsClient.getSesscode(),
                    status: err.message,
                    statusCode: err.code
                };
            });
    };

    /**
     * Check Mobiil-ID login status
     *
     * @param {string} sesscode DDS session code
     *
     * @returns {Promise<string>} Login status code
     *
     * @private
     */
    var _loginMobileStatus = function (sesscode) {
        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);
        ddsClient.setSesscode(sesscode);

        return ddsClient
            .getMobileAuthenticateStatus(sesscode, false)
            .spread(function (getMobileAuthenticateStatusResult) {
                var statusCode = getMobileAuthenticateStatusResult.Status.$value;

                return Promise.resolve(statusCode);
            });
    };

    /**
     * Check certificate
     *
     * @param {string} certificate User certificate in PEM format
     * @param {boolean} [returnRevocationData=false] If TRUE, certificate’s validity information is returned on RevocationData field in response.
     *
     * @returns {Promise} Check certificate response
     *
     * @private
     */
    var _checkCertificate = function (certificate, returnRevocationData) {
        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);

        return ddsClient.checkCertificate(certificate, returnRevocationData || false);
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
    var _deleteFinalBdoc = function (topicId, voteId) {
        var voteFileDir = _getVoteFileDir(topicId, voteId);
        var finalBdocPath = voteFileDir + '/final.bdoc';

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

    /**
     * Get personal info from certificate
     *
     * @param {string} certificate Certificate string
     * @param {string} [format='der'] The certificate format - 'der' for hex encoded der and 'pem' for PEM
     *
     * @returns {Promise<Array>} Status on SK side and Object that contains lastName, firstName, pid, countryCode. All of them uppercase. Make sure to use spread();
     *
     * @private
     */
    var _getPersonalInfoFromCertificate = function (certificate, format) {
        if (!format) {
            format = 'der';
        }

        var pem;

        switch (format) {
            case 'der':
                // DDS PrepareSignature accepts HEX encoded DER, but CheckCertificate accepts PEM.
                var der = Buffer.from(certificate, 'hex').toString('binary');
                var msg = {
                    type: 'CERTIFICATE',
                    body: der
                };
                pem = nodeForge.pem.encode(msg);
                break;
            case 'pem':
                pem = certificate;
                break;
            default:
                throw new Error('Invalid parameter "format". Must be "der" or "pem"');
        }

        return _checkCertificate(pem)
            .spread(function (checkCertificateResult) {
                var status = checkCertificateResult.Status.$value;
                var personalInfo = {
                    pid: checkCertificateResult.UserIDCode.$value,
                    firstName: checkCertificateResult.UserGivenname.$value,
                    lastName: checkCertificateResult.UserSurname.$value,
                    countryCode: checkCertificateResult.UserCountry.$value // UPPERCASE ISO-2 letter
                };

                return Promise.resolve([status, personalInfo]);
            });
    };

    /**
     * Parse user info from certificate common name
     *
     * @param {string} cn Certificate common name field
     *
     * @returns {Object} {{lastName: *, firstName: *, pid: *}}
     *
     * @private
     */
    var _getPersonalInfoFromCommonName = function (cn) {
        var cnParts = cn.split(',');

        if (cnParts.length !== 3) {
            throw Error('Invalid common name (CN) in certificate. Got: ' + cn);
        }

        return {
            lastName: cnParts[0],
            firstName: cnParts[1],
            pid: cnParts[2]
        };
    };

    /**
     * Get mobile certificate
     *
     * @param {string} pid Personal identification code
     * @param {string} phoneNumber Phone number
     * @param {string} returnCertData Which certificate - "sign", "auth" or "both"
     *
     * @returns {Promise<Object>} Status and certificate string in a relevant property based on returnCertData value. Use .sperad!
     *
     * @see http://sk-eid.github.io/dds-documentation/api/api_docs/#getmobilecertificate
     *
     * @private
     */
    var _getMobileCertificate = function (pid, phoneNumber, returnCertData) {
        var validReturnCertDataValues = ['auth', 'sign', 'both'];

        if (validReturnCertDataValues.indexOf(returnCertData) < 0) {
            throw new Error('Invalid "returnCertData" value, must be one of ' + validReturnCertDataValues);
        }

        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);

        return ddsClient.getMobileCertificate(pid, null, phoneNumber, returnCertData)
            .spread(function (response) {
                var certInfo = {
                    statusCode: 0
                };

                switch (returnCertData) {
                    case 'auth':
                        certInfo.auth = response.AuthCertData.$value;
                        break;
                    case 'sign':
                        certInfo.sign = response.SignCertData.$value;
                        break;
                    case 'both':
                        certInfo.auth = response.AuthCertData.$value;
                        certInfo.sign = response.SignCertData.$value;
                        break;
                    default:
                        // Should never happen!
                        throw new Error('Should never happen! (tm)');
                }

                return certInfo;
            })
            .catch(DigiDocServiceClient.SoapFault, function (err) {
                return {
                    status: err.message,
                    statusCode: err.code
                };
            });
    };

    /**
     * Sign the BDOC
     *
     * @param {string} sesscode DigiDocService session ID
     * @param {string} signatureId The unique identifier of the signature which was returned as the result of PrepareSignature method.
     * @param {string} signatureValue Value of the signature (signed hash) as a HEX string. The signing software returns the value.
     *
     * @return {Promise<Buffer>} Buffer containing the signed document
     *
     * @private
     */
    var _signUserBdoc = function (sesscode, signatureId, signatureValue) {
        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);
        ddsClient.setSesscode(sesscode);

        return ddsClient
            .startSession()
            .then(function () {
                return ddsClient.finalizeSignature(signatureId, signatureValue);
            })
            .spread(function () {
                return ddsClient.getSignedDoc();
            })
            .spread(function (signedDocResult) {
                var signedDocument = signedDocResult.SignedDocData.$value;

                //Buffer.from(signedDocument, 'base64');
                return signedDocument;
            });
    };

    /**
     * Get doc signed with mobile
     *
     * It is going to wait until User signs the document. It may take a minute or 2
     *
     * @param {string} sesscode Session code
     *
     * @return {Promise<Object>} {signedDocData<Buffer>, signerInfo<Object>}
     *
     * @private
     */
    var _getMobileSignedDoc = function (sesscode) {
        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);
        ddsClient.setSesscode(sesscode);

        return ddsClient
            .startSession()
            .then(function () {
                return ddsClient.getStatusInfo(true, false);
            })
            .spread(function (getStatusInfoResult) {
                var statusCode = getStatusInfoResult.StatusCode.$value;
                switch (statusCode) {
                    // OK
                    case 'SIGNATURE':
                        return ddsClient.getSignedDoc();
                    // Recoverable
                    default:
                        return Promise.reject(statusCode);
                }
            })
            .spread(function (signedDocResult) {
                return ddsClient
                    .getSignedDocInfo()
                    .spread(function (signedDocInfoResult) {
                        return {
                            signedDocData: Buffer.from(signedDocResult.SignedDocData.$value, 'base64'),
                            signerInfo: _getPersonalInfoFromCommonName(signedDocInfoResult.SignedDocInfo.SignatureInfo[0].Signer.CommonName.$value)
                        };
                    });
            });
    };

    /**
     * Get doc signed with mobile
     *
     * It is going to wait until User signs the document. It may take a minute or 2
     *
     * @param {string} sesscode Session code
     *
     * @return {Promise<Object>} {signedDocData<Buffer>, signerInfo<Object>}
     *
     * @private
     */
    var _getSmartIdSignedDoc = function (sesscode) {        
        return smartId.statusSign(sesscode);
        /*var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);
        ddsClient.setSesscode(sesscode);

        return ddsClient
            .startSession()
            .then(function () {
                return ddsClient.getStatusInfo(true, false);
            })
            .spread(function (getStatusInfoResult) {
                var statusCode = getStatusInfoResult.StatusCode.$value;
                switch (statusCode) {
                    // OK
                    case 'SIGNATURE':
                        return ddsClient.getSignedDoc();
                    // Recoverable
                    default:
                        return Promise.reject(statusCode);
                }
            })
            .spread(function (signedDocResult) {
                return ddsClient
                    .getSignedDocInfo()
                    .spread(function (signedDocInfoResult) {
                        return {
                            signedDocData: Buffer.from(signedDocResult.SignedDocData.$value, 'base64'),
                            signerInfo: _getPersonalInfoFromCommonName(signedDocInfoResult.SignedDocInfo.SignatureInfo[0].Signer.CommonName.$value)
                        };
                    });
            });*/
    };

    /**
     * Get the final Zip container
     *
     * @param {string} topicId Topic ID
     * @param {string} voteId Vote ID
     *
     * @return Promise<Stream.Readable> Final Zip file stream
     *
     * @private
     */

    var _getFinalZip = function (topicId, voteId) {
        var voteFileDir = _getVoteFileDir(topicId, voteId);
        var finalZipPath = voteFileDir + '/final.zip';

        var finalZipFileStream; // File write stream
        var finalZip; // Bdoc instance

        return fs
            .accessAsync(finalZipPath, fs.R_OK)
            .then(function () {
                logger.info('Cache hit for final BDOC file', finalZipPath);

                return fs.createReadStream(finalZipPath);
            }, function () {
                logger.info('Cache miss for final BDOC file', finalZipPath);

                return fsExtra
                    .mkdirsAsync(voteFileDir)
                    .then(function () {
                        finalZipFileStream = fs.createWriteStream(finalZipPath);
                        finalZip = archiver('zip', {
                            store: true
                        });
                        finalZip.pipe(finalZipFileStream);

                        return VoteContainerFile
                            .findAll({
                                where: {
                                    voteId: voteId
                                }
                            });
                    })
                    .each(function (voteContainerFile) {
                        var fileName = voteContainerFile.fileName;
                        var mimeType = voteContainerFile.mimeType;
                        var content = voteContainerFile.content;

                        return finalZip.append(content, {
                            name: fileName,
                            mimeType: mimeType
                        });
                    })
                    .then(function () {
                        var connectionManager = db.connectionManager;

                        return connectionManager
                            .getConnection()
                            .then(function (connection) {
                                var query = new QueryStream(
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
                                        SELECT \
                                            row_number() OVER() AS "rowNumber", \
                                            v."createdAt" as "timestamp", \
                                            v."userId" as "userId", \
                                            u.name as "name", \
                                            vo.value as "optionValue" \
                                        FROM votes v \
                                            JOIN "VoteOptions" vo ON (vo."id" = v."optionId") \
                                            JOIN "Users" u ON (u.id = v."userId") \
                                        ORDER BY vo.value DESC \
                                    ;',
                                    [voteId]
                                );

                                var stream = connection.query(query);

                                var csvStream = fastCsv.createWriteStream({
                                    headers: true,
                                    rowDelimiter: '\r\n'
                                });
                                finalZip.append(csvStream, {
                                    name: VOTE_RESULTS_FILE.name,
                                    mimeType: VOTE_RESULTS_FILE.mimeType
                                });

                                stream.on('data', function (voteResult) {
                                    voteResult.optionFileName = _getVoteOptionFileName({value: voteResult.optionValue});
                                    csvStream.write(voteResult);
                                });

                                stream.on('error', function () {
                                    csvStream.end();
                                    finalZip.finalize();
                                    connectionManager.releaseConnection(connection);

                                    return fs.createReadStream(finalZipPath);
                                });

                                stream.on('end', function () {
                                    csvStream.end();
                                    finalZip.finalize();
                                    connectionManager.releaseConnection(connection);

                                    return fs.createReadStream(finalZipPath);
                                });

                            });
                    })
                    .catch(function (err) {
                        logger.error('Failed to generate final ZIP', err);
                        // Clean up zip file that was created as it may be corrupted, best effort removing the file
                        fs.unlink(finalZipPath);

                        throw err;
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
    var _getFinalBdoc = function (topicId, voteId, wrap) {
        var voteFileDir = _getVoteFileDir(topicId, voteId);
        var finalBdocPath = voteFileDir + '/final.bdoc';
        var finalZipPath = voteFileDir + '/final.7z';

        var finalBdocFileStream; // File write stream
        var finalBdoc; // Bdoc instance

        var finalDocDownloadPath = wrap ? finalZipPath : finalBdocPath;

        return fs
            .accessAsync(finalDocDownloadPath, fs.R_OK)
            .then(function () {
                logger.info('_getFinalBdoc', 'Cache hit for final BDOC file', finalDocDownloadPath);

                return fs.createReadStream(finalDocDownloadPath);
            }, function () {
                logger.info('_getFinalBdoc', 'Cache miss for final BDOC file', finalDocDownloadPath);

                return fsExtra
                    .mkdirsAsync(voteFileDir)
                    .then(function () {
                        finalBdocFileStream = fs.createWriteStream(finalBdocPath);
                        finalBdoc = new Bdoc(finalBdocFileStream);

                        logger.debug('_getFinalBdoc', 'Vote file dir created', voteFileDir);

                        return VoteContainerFile
                            .findAll({
                                where: {
                                    voteId: voteId
                                }
                            });
                    })
                    .each(function (voteContainerFile) {
                        var fileName = voteContainerFile.fileName;
                        var mimeType = voteContainerFile.mimeType;
                        var content = voteContainerFile.content;

                        logger.debug('_getFinalBdoc', 'Adding file to final BDOC', fileName, mimeType, content.length);

                        return finalBdoc.append(content, {
                            name: fileName,
                            mimeType: mimeType
                        });
                    })
                    .then(function () {
                        logger.debug('_getFinalBdoc', 'Adding User votes to final BDOC');

                        var connectionManager = db.connectionManager;

                        return connectionManager
                            .getConnection()
                            .then(function (connection) {
                                logger.debug('_getFinalBdoc', 'Run query stream for User vote containers');

                                return new Promise(function (resolve, reject) {
                                    var query = new QueryStream(
                                        '\
                                            SELECT \
                                                vuc.container, \
                                                uc."connectionUserId" \
                                            FROM "VoteUserContainers" vuc \
                                            JOIN "UserConnections" uc ON (vuc."userId" = uc."userId") \
                                            WHERE vuc."voteId" = $1 \
                                            AND uc."connectionId" = $2 \
                                        ;',
                                        [voteId, UserConnection.CONNECTION_IDS.esteid]
                                    );
                                    var stream = connection.query(query);

                                    stream.on('data', function (data) {
                                        logger.debug('_getFinalBdoc', 'Add data', data.container.length);

                                        var pid = data.connectionUserId;
                                        var userbdocContainer = data.container;

                                        finalBdoc.append(userbdocContainer, {
                                            name: USER_BDOC_FILE.name.replace(':pid', pid),
                                            mimeType: USER_BDOC_FILE.mimeType
                                        });
                                    });

                                    finalBdocFileStream.on('error', function (err) {
                                        logger.error('_getFinalBdoc', 'Adding files to final BDOC FAILED', err);

                                        return reject(err);
                                    });

                                    stream.on('error', function (err) {
                                        connectionManager.releaseConnection(connection);

                                        logger.error('_getFinalBdoc', 'Reading PG query stream failed', err);

                                        return reject(err);
                                    });

                                    stream.on('end', function () {
                                        connectionManager.releaseConnection(connection);

                                        logger.debug('_getFinalBdoc', 'Adding files to final BDOC ENDED');

                                        return resolve();
                                    });
                                });
                            });
                    })
                    .then(function () {
                        logger.debug('_getFinalBdoc', 'Generating vote CSV');

                        var connectionManager = db.connectionManager;

                        return connectionManager
                            .getConnection()
                            .then(function (connection) {
                                var query = new QueryStream(
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
                                        SELECT \
                                            row_number() OVER() AS "rowNumber", \
                                            v."createdAt" as "timestamp", \
                                            uc."connectionUserId" as "PID", \
                                            (uc."connectionData"::json->>\'firstName\') || \' \' || (uc."connectionData"::json->>\'lastName\') as "fullName", \
                                            vo.value as "optionValue" \
                                        FROM votes v \
                                            JOIN "UserConnections" uc ON (uc."userId" = v."userId" AND uc."connectionId" = \'esteid\') \
                                            JOIN "VoteOptions" vo ON (vo."id" = v."optionId") \
                                        ORDER BY vo.value DESC \
                                    ;',
                                    [voteId]
                                );

                                var stream = connection.query(query);

                                var csvStream = fastCsv.createWriteStream({
                                    headers: true,
                                    rowDelimiter: '\r\n'
                                });
                                finalBdoc.append(csvStream, {
                                    name: VOTE_RESULTS_FILE.name,
                                    mimeType: VOTE_RESULTS_FILE.mimeType
                                });

                                stream.on('data', function (voteResult) {
                                    voteResult.optionFileName = _getVoteOptionFileName({value: voteResult.optionValue});
                                    csvStream.write(voteResult);
                                });

                                stream.on('error', function (err) {
                                    logger.error('_getFinalBdoc', 'Generating vote CSV FAILED', err);

                                    csvStream.end();
                                    finalBdoc.finalize();
                                    connectionManager.releaseConnection(connection);
                                });

                                stream.on('end', function () {
                                    logger.debug('_getFinalBdoc', 'Generating vote CSV succeeded');

                                    csvStream.end();
                                    finalBdoc.finalize();
                                    connectionManager.releaseConnection(connection);
                                });

                                return util.streamToPromise(finalBdocFileStream);
                            });
                    })
                    .then(function () {
                        if (wrap) {
                            logger.debug('_getFinalBdoc', 'Wrapping final BDOC');

                            // Wrap the BDOC in 7Zip
                            var zip = new SevenZip();

                            return zip
                                .add(finalZipPath, [finalBdocPath])
                                .then(function () {
                                    logger.debug('_getFinalBdoc', 'Wrapping final BDOC succeeded', finalZipPath);

                                    return finalZipPath;
                                });
                        } else {
                            logger.debug('_getFinalBdoc', 'Not wrapping final BDOC', finalBdocPath);

                            return finalBdocPath;
                        }
                    })
                    .then(function (docPath) {
                        logger.debug('_getFinalBdoc', 'Final BDOC generated successfully', docPath);

                        return fs.createReadStream(docPath);
                    })
                    .catch(function (err) {
                        logger.error('Failed to generate final BDOC', err);

                        // Clean up zip file that was created as it may be corrupted, best effort removing the file
                        fs.unlink(finalBdocPath);
                        fs.unlink(finalZipPath);

                        throw err;
                    });
            });
    };


    return {
        createVoteFiles: _createVoteFiles,
        signInitIdCard: _signInitIdCard,
        signInitMobile: _signInitMobile,
        signInitSmartId: _signInitSmartId,
        loginMobileInit: _loginMobileInit,
        loginMobileStatus: _loginMobileStatus,
        checkCertificate: _checkCertificate,
        getMobileCertificate: _getMobileCertificate,
        signUserBdoc: _signUserBdoc,
        getMobileSignedDoc: _getMobileSignedDoc,
        getSmartIdSignedDoc: _getSmartIdSignedDoc,
        getFinalBdoc: _getFinalBdoc,
        getFinalZip: _getFinalZip,
        deleteFinalBdoc: _deleteFinalBdoc,
        getPersonalInfoFromCertificate: _getPersonalInfoFromCertificate
    };
};
