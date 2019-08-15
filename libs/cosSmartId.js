'use strict';

/**
 * @param {object} app app object
 * @returns {object} CosSmartId object
 */
function CosSmartId (app) {
    var that = this;
    var logger = app.get('logger');
    var crypto = app.get('crypto');
    var sanitizeFilename = app.get('sanitizeFilename');
    var DigiDocServiceClient = app.get('ddsClient');
    var https = require('https');
    var Promise = app.get('Promise');
    var x509 = require('x509.js');
    var encoder = require('utf8');
    var pem = require('pem');
    var mu = app.get('mu');
    var models = app.get('models');
    var db = models.sequelize;
    var config = app.get('config');
    var stream = app.get('stream');

    var VoteContainerFile = models.VoteContainerFile;
    var UserConnection = models.UserConnection;

    var _replyingPartyUUID;
    var _replyingPartyName;
    var _authorizeToken;

    var _hashType;
    var _hostname;
    var _port;
    var _apiPath;
    var _cert;

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

    var _paths = {
        authenticate: '/authentication/pno/:countryCode/:pid',
        status: '/session/:sessionId?timeoutMs=:timeout',
        authenticationDocument: '/authentication/document/:documentNumber',
        signature: '/signature/pno/:countryCode/:pid',
        certificatechoice: '/certificatechoice/pno/:countryCode/:pid'
    };

    var _init = function (options) {
        _replyingPartyUUID = options.relyingPartyUUID;
        _replyingPartyName = options.replyingPartyName;
        _authorizeToken = options.authorizeToken;

        if (options.hostname) {
            var hostData = options.hostname.split(':');
            _hostname = hostData[0];
            _port = hostData[1] || 443;
        }

        _apiPath = options.apiPath;

        return that;
    };

    /**
     *Creates random hash to calculate
     */

    var _createHash = function (input, hashType) {
        input = input || crypto.randomBytes(20).toString('hex');
        _hashType = hashType || 'sha256';

        var hash = crypto.createHash(_hashType);

        hash.update(encoder.encode(input));

        return hash.digest('hex');
    };

    var _buildPath = function (resourceName) {
        return _apiPath + _paths[resourceName];
    };

    var _padLeft = function (input, size, padText) {
        while (input.length < size) {
            input = padText + input;
        }

        return input;
    };

    var _getVerificationCode = function (sessionHash) {
        var enchash = crypto.createHash('sha256');
        enchash.update(Buffer.from(sessionHash, 'hex'));
        var buf = enchash.digest();

        var twoRightmostBytes = buf.slice(-2);
        var buffer = Buffer.from(twoRightmostBytes);
        var positiveInteger = buffer.readUInt16BE();

        positiveInteger = (positiveInteger % 10000).toString().substr(-4);

        return _padLeft(positiveInteger, 4, '0');
    };

    var _setCert = function (cert) {
        var BEGIN_CERT = '-----BEGIN CERTIFICATE-----';
        var END_CERT = '-----END CERTIFICATE-----';
        var match = cert.match(/.{1,64}/g);
        var str = BEGIN_CERT + '\n';
        str += match.join('\n');
        str += '\n' + END_CERT;
        _cert = str;

        return _cert;
    };

    var _parseJSON = function (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return data;
        }
    };

    var _parseCertData = function (cert) {
        return new Promise(function (resolve) {
            var data = x509.parseCert(cert);
            resolve(data);
        });
    };

    var _getUser = function (cert) {
        var subject = cert.subject;
        var user = {};
        user.firstName = encoder.decode(subject.givenName);
        user.lastName = encoder.decode(subject.surname);
        user.countryCode = subject.countryName;
        var pid = subject.serialNumber.match(/PNO[A-Z]{1,2}-([0-9]+)/);
        if (pid && pid[1]) {
            user.pid = pid[1];
        }

        return user;
    };

    //Decrypts response signature and compares it to local hash
    var _verifySignature = function (sessionHash, signature, cert) {
        return new Promise(function (resolve, reject) {
            pem.getPublicKey(
                cert,
                function (err, res) {
                    if (err) {
                        return reject(err);
                    }

                    var pubKey = res.publicKey;

                    var decrypt = crypto.publicDecrypt(pubKey, Buffer.from(signature, 'base64'));
                    var SHA256padding = [0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20];
                    var header = Buffer.from(SHA256padding);
                    var localHash = header.toString('hex') + sessionHash;
                    var validate = decrypt.equals(Buffer.from(localHash, 'hex'));

                    return resolve(validate);
                }
            );

        });
    };

    var _authenticate = function (pid, countryCode) {
        countryCode = countryCode || 'EE'; //defaults to Estonia
        var sessionHash = _createHash();
        var path = _buildPath('authenticate');

        var params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            hash: Buffer.from(sessionHash, 'hex').toString('base64'),
            hashType: _hashType.toUpperCase()
        };

        params = JSON.stringify(params);

        var options = {
            hostname: _hostname,
            path: path.replace(':countryCode', countryCode).replace(':pid', pid),
            method: 'POST',
            port: _port,
            headers: {
                'Authorization': 'Bearer ' + _authorizeToken,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params, 'utf8')
            }
        };

        return new Promise(function (resolve, reject) {
            var request = https.request(options, function (result) {
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    try {
                        var data = JSON.parse(chunk);
                        if (!data.sessionID) {
                            return reject(data);
                        }

                        var verficationCode = _getVerificationCode(sessionHash);

                        return resolve({
                            sessionId: data.sessionID,
                            challengeID: verficationCode,
                            sessionHash: sessionHash
                        });
                    } catch (e) {
                        return reject(e);
                    }

                });
            });

            // write data to request body

            request.write(params);
            request.end();
            request.on('error', function (e) {
                logger.error('problem with request: ', e.message);

                return reject(e);
            });
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

    var _getUserCertificate = function (pid, countryCode) {
        countryCode = countryCode || 'EE'; //defaults to Estonia
        var sessionHash = _createHash();
        var path = _buildPath('certificatechoice');

        var params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            certificateLevel: 'QUALIFIED'
        };

        params = JSON.stringify(params);

        var options = {
            hostname: _hostname,
            path: path.replace(':countryCode', countryCode).replace(':pid', pid),
            method: 'POST',
            port: _port,
            headers: {
                'Authorization': 'Bearer ' + _authorizeToken,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params, 'utf8')
            }
        };

        return new Promise(function (resolve, reject) {
            var request = https.request(options, function (result) {
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    try {
                        var data = JSON.parse(chunk);
                        if (!data.sessionID) {
                            return reject(data);
                        }

                        var verficationCode = _getVerificationCode(sessionHash);

                        return resolve({
                            sessionId: data.sessionID,
                            challengeID: verficationCode,
                            sessionHash: sessionHash
                        });
                    } catch (e) {
                        return reject(e);
                    }

                });
            });

            // write data to request body

            request.write(params);
            request.end();
            request.on('error', function (e) {
                logger.error('problem with request: ', e.message);

                return reject(e);
            });
        });
    }
    var _createUserBdoc = function (topicId, voteId, userId, voteOptions, transaction) {
        var chosenVoteOptionFileNames = voteOptions.map(_getVoteOptionFileName);
        var ddsClient = new DigiDocServiceClient(config.services.digiDoc.serviceWsdlUrl, config.services.digiDoc.serviceName, config.services.digiDoc.token);

        return ddsClient.startSession(null, null, true)
            .then(function () {
                var format = DigiDocServiceClient.DOCUMENT_FORMATS.BDOC;

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

                var voteContainerFileStream = new stream.PassThrough();
                voteContainerFileStream.end(content);

                return ddsClient.addDataFileEmbeddedBase64(voteContainerFileStream, fileName, mimeType);
            })
            .then(function () {
                var templateStream = mu.compileAndRender(USERINFO_FILE.template, {user: {id: userId}});

                return ddsClient.addDataFileEmbeddedBase64(templateStream, USERINFO_FILE.name, USERINFO_FILE.mimeType);
            })
            .then(function () {
                return ddsClient.getSignedDoc();
            })
            .spread(function (signedDocResult) {
                var signedDocument = signedDocResult.SignedDocData.$value;

                return Buffer.from(signedDocument, 'base64').toString('hex');
            });
    };

    var _signature = function (pid, countryCode, data) {
        countryCode = countryCode || 'EE'; //defaults to Estonia
        var sessionHash = _createHash(data);
        var path = _buildPath('signature');
        
        var params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            certificateLevel: 'QUALIFIED',
            hash: Buffer.from(sessionHash, 'hex').toString('base64'),
            hashType: _hashType.toUpperCase(),
            displayText: 'Sign document on CitizenOS',
            requestProperties: {
                'vcChoice': false
            }
        };

        params = JSON.stringify(params);

        var options = {
            hostname: _hostname,
            path: path.replace(':countryCode', countryCode).replace(':pid', pid),
            method: 'POST',
            port: _port,
            headers: {
                'Authorization': 'Bearer ' + _authorizeToken,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params, 'utf8')
            }
        };

        return new Promise(function (resolve, reject) {
            var request = https.request(options, function (result) {
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    try {
                        var data = JSON.parse(chunk);
                        if (!data.sessionID) {
                            return reject(data);
                        }

                        var verficationCode = _getVerificationCode(sessionHash);
                        return resolve({
                            sessionId: data.sessionID,
                            challengeID: verficationCode,
                            sessionHash: sessionHash
                        });
                    } catch (e) {
                        return reject(e);
                    }

                });
            });

            // write data to request body

            request.write(params);
            request.end();
            request.on('error', function (e) {
                logger.error('problem with request: ', e.message);

                return reject(e);
            });
        });
    };

    var _signInitSmartId = function (topicId, voteId, userId, voteOptions, pid, countryCode, transaction) {
        return _createUserBdoc(topicId, voteId, userId, voteOptions, transaction)
            .then(function (data) {
                return _signature(pid, countryCode, data);
            });
    };

    var _status = function (sessionId, sessionHash, timeout) {
        if (!sessionId || !sessionHash) {
            return false;
        }

        timeout = timeout || 1000; //default timeout in ms

        var path = _buildPath('status');

        var options = {
            hostname: _hostname,
            path: path.replace(':sessionId', sessionId).replace(':timeout', timeout),
            method: 'GET',
            port: _port,
            headers: {
                'Authorization': 'Bearer ' + _authorizeToken
            }
        };
        var chunks = '';

        return new Promise(function (resolve, reject) {
            var request = https.request(options, function (result) {

                if (result.statusCode === 480) {
                    return resolve({
                        error: {
                            code: 480,
                            message: 'The client (i.e. client-side implementation of this API) is old and not supported any more. Relying Party must contact customer support.'
                        }
                    });
                } else if (result.statusCode === 580) {
                    return resolve({
                        error: {
                            code: 580,
                            message: 'System is under maintenance, retry later.'
                        }
                    });
                }
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    chunks += chunk;
                });
                result.on('end', function () {
                    var data = _parseJSON(chunks);        
             //       console.log('DATA', data);            
                    if (data.result) {
                        if (data.result.endResult === 'OK') {
                            if (data.cert) {                                
                                var cert = _setCert(data.cert.value);
                //                console.log('DATA', cert);
                                if (data.signature) {
                                    _parseCertData(cert)
                                        .then(function (certData) {
                             //               console.log('certData', certData);
                                                _verifySignature(sessionHash, data.signature.value, _cert)
                                                    .then(function (isValid) {
                                                        if (isValid) {
                                                            var returnData = {
                                                                state: data.state,
                                                                result: data.result
                                                            };

                                                            returnData.result.user = _getUser(certData);

                                                            return resolve(returnData);
                                                        } else {
                                                            return resolve({
                                                                error: {
                                                                    message: 'Invalid signature'
                                                                }
                                                            });
                                                        }
                                                    });                                        
                                            
                                        });
                                } else {
                                    return resolve(cert);
                                }
                            }
                        } else if (data.result.endResult === 'USER_REFUSED') {
                            return resolve({
                                error: {
                                    message: 'User refused',
                                    code: 10
                                }
                            });
                        } else if (data.result.endResult === 'TIMEOUT') {
                            return resolve({
                                error: {
                                    message: 'The transaction has expired',
                                    code: 11
                                }
                            });
                        } else {
                            return resolve(data);
                        }
                    } else {
                        return resolve(data);
                    }
                });
            });
            request.end();
            request.on('error', function (e) {
                logger.error('problem with request: ', e.message);

                return reject(e);
            });
        });
    };

    return {
        init: _init,
        authenticate: _authenticate,
        getUserCertificate: _getUserCertificate,
        signInitSmartId: _signInitSmartId,
        signature: _signature,
        createUserBdoc: _createUserBdoc,
        status: _status,
        getVerificationCode: _getVerificationCode
    };
}

module.exports = CosSmartId;
