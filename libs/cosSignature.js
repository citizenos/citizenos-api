module.export = function (app) {
    var models = app.get('models');
    var fs = app.get('fs');
    var fsExtra = app.get('fsExtra');
    var mu = app.get('mu');
    var sanitizeFilename = app.get('sanitizeFilename');
    var Xades = require("undersign/xades");
    var smartId = app.get('smartId');
    var Crypto = require("crypto");
    var Certificate = require("undersign/lib/certificate");
  /*  var certificate = Certificate.parse(Fs.readFileSync("./mary.pem"))
    var document = Fs.readFileSync("./document.txt")*/

    var VoteContainerFile = models.VoteContainerFile;

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

    const _createUserBdoc = function (topicId, voteId, userId, voteOptions, transaction) {
        let containerFiles = [];
    //    const container = new Bdoc(docPath);

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
                    hash: Crypto.createHash('Sha256').update(content).digest()
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
                                mimeType: 'text/html',
                                hash: Crypto.createHash('Sha256').update(Buffer.from(finalData)).digest();
                            })
                            return resolve(containerFiles);
                        });
                });
            })
            .then(function (files) {
                var xades = hades.new(certificate, files);

                return xades;
            }).catch(function (e) {
                console.log(e)
            });
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
        return _createUserBdoc(ddsClient, topicId, voteId, userId, voteOptions, transaction)
            .then(function (xades) {
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
            .then(function (xades) {
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
            .then(function (xades) {
                bdoc.addSigningCertificate(certificate);
                var signableData = xades.signable
                return smartId.signature(pid, countryCode, signableData);
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
    /*
    var xades = hades.new(certificate, [{
    path: "document.txt",
    type: "text/plain",
    hash: Crypto.createHash("sha256").update(document).digest()
    }])
*/
    return {
        signInitIdCard: _signInitIdCard,
        signInitSmartId: _signInitSmartId,
        signInitMobile: _signInitMobile
    }
};