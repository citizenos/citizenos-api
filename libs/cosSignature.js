'use strict';

module.exports = function (app) {
    var models = app.get('models');
    var fs = app.get('fs');
    var fsExtra = app.get('fsExtra');
    var mu = app.get('mu');
    var sanitizeFilename = app.get('sanitizeFilename');
    var hades = require("./js-undersign/xades");
    var smartId = app.get('smartId');
    var mobileId = app.get('mobileId');
    var Crypto = require("crypto");
    var Certificate = require("./js-undersign/lib/certificate");
    var Ocsp = require('./js-undersign/lib/ocsp');
    var Timestamp = require('./js-undersign/lib/timestamp');
    var Asic = require('./js-undersign/lib/asic');
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
                console.log(e)
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
                var xades = new hades(certificate, files);

                return Promise.resolve(xades);
            }).catch(function (e) {
                console.log(e)
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
    var _signInitIdCard = function (voteId, userId, voteOptions, certificate, transaction) {
        return _createUserBdoc(voteId, userId, voteOptions, certificate, 'hex', transaction)
            .then(function (xades) {
                const cert = new Certificate(Buffer.from(certificate, 'hex'));
                const issuer = new Certificate(getCertOcspCertificate(cert));
                const signableData = xades.signable;

                return Ocsp.request(issuer, cert, {url: 'http://aia.sk.ee/esteid2015', nonce: signableData})
                    .then(function (ocspResult) {
                        xades.setOcspResponse(Ocsp.parse(ocspResult));

                        return mobileId
                            .getCertUserData(certificate, 'hex')
                            .then(function (personalInfo) {
                                console.log(personalInfo);
                                xades = xades.toString();

                                return {
                                    statusCode: 0,
                                    personalInfo,
                                    signableHash: signableData.toString('base64'),
                                    xades
                                };
                            });
                        }).catch(function (e) {
                            console.log('ERROR', e);
                        })
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
                const cert = new Certificate(Buffer.from(certificate, 'base64'));
                const issuer = getCertOcspCertificate(cert);
                const signableData = xades.signable;

                return Ocsp.request(issuer, cert)
                    .then(function (ocspResult) {
                        xades.setOcspResponse(Ocsp.parse(ocspResult));

                        return mobileId
                            .getCertUserData(certificate, 'base64')
                            .then(function (personalInfo) {
                                return mobileId
                                    .signature(pid, phoneNumber, signableData.toString('base64'))
                                    .then(function (response) {
                                        response.xades = xades.toString();
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
    var _signInitSmartId = function (voteId, userId, voteOptions, pid, countryCode, certificate, transaction) {
        return _createUserBdoc(voteId, userId, voteOptions, certificate, 'base64', transaction)
            .then(function (xades) {
                const cert = new Certificate(Buffer.from(certificate, 'base64'));
                const issuer = getCertOcspCertificate(cert);

                return Ocsp.request(issuer, cert)
                    .then(function (ocspResult) {
                        xades.setOcspResponse(Ocsp.parse(ocspResult));
                        var signableData = xades.signable;

                        return smartId
                            .getCertUserData(certificate)
                            .then(function (personalInfo) {
                                return smartId
                                    .signature(pid, countryCode, signableData.toString('base64'))
                                    .then(function (response) {
                                        response.xades = xades.toString();
                                        response.personalInfo = personalInfo;

                                        return response;
                                    });
                            });
                        });
            });
    };

    var getCertOcspCertificate = function (cert) {
        if (!cert.issuer || !cert.issuer.publicKey) {
            const issuerName = cert.issuerRfc4514Name;
            const certfileName = issuerName.split(',').find(function (item) {
                if (item.indexOf('CN=') > -1) {
                    return item;
                }
            }).replace(/ /gi, '_').replace('CN=', '') + '.pem.crt';
            const exists = fs.existsSync('./config/certs/' + certfileName)
            if (exists) {
                const certdata = fs.readFileSync('./config/certs/' + certfileName);
                const b64 = certdata.toString().replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, '')

                // Now that we have decoded the cert it's now in DER-encoding
                const der = Buffer.from(b64, 'base64')
                return new Certificate(der);
            }
        }

        return cert.issuer;
    };

    const _handleSigningResult = function (voteId, userId, voteOptions, signableHash, xadesXml, signature) {
            const xades = hades.parse(xadesXml);
            xades.setSignature(Buffer.from(signature, 'base64'));
            return Timestamp.read('http://dd-at.ria.ee/tsa', Buffer.from(signableHash, 'base64'))
                .then(function (timestamp) {
                    xades.setTimestamp(timestamp);

                    return _getUserContainer(voteId, userId, voteOptions)
                        .then(function (container) {
                            return new Promise (function (resolve) {
                                var chunks = [];
                                container.addSignature(xades);
                                var streamData = container.toStream();

                                streamData.on('data', function (data) {
                                    chunks.push(data);
                                })

                                streamData.on('end', function () {
                                    var buff = Buffer.concat(chunks);

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
    };

    const _getSmartIdSignedDoc = function (sessionId, signableHash, xadesXml, voteId, userId, voteOptions) {
        return smartId.statusSign(sessionId)
            .then(function(signResult) {
                return _handleSigningResult(voteId, userId, voteOptions, signableHash, xadesXml, signResult.signature.value);
            });
    };

    const _getMobileIdSignedDoc = function (sessionId, signableHash, xadesXml, voteId, userId, voteOptions) {
        return mobileId.statusSign(sessionId)
            .then(function(signResult) {
                return _handleSigningResult(voteId, userId, voteOptions, signableHash, xadesXml, signResult.signature.value);
            });
    };

    var _signUserBdoc = function (voteId, userId, voteOptions, signableHash, xadesXml, signatureValue) {
        return _handleSigningResult(voteId, userId, voteOptions, signableHash, xadesXml, signatureValue);
    };

    return {
        signInitIdCard: _signInitIdCard,
        signInitSmartId: _signInitSmartId,
        signInitMobile: _signInitMobile,
        signUserBdoc: _signUserBdoc,
        getSmartIdSignedDoc: _getSmartIdSignedDoc,
        getMobileIdSignedDoc: _getMobileIdSignedDoc,
    }
};