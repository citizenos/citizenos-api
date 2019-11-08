'use strict';

/**
 * @param {object} app app object
 * @returns {object} CosSmartId object
 */
function CosSmartId (app) {
    var that = this;
    var crypto = app.get('crypto');
    var sanitizeFilename = app.get('sanitizeFilename');
    var Promise = app.get('Promise');
    var mu = app.get('mu');
    var models = app.get('models');
    var fs = app.get('fs');
    var Bdoc = app.get('Bdoc');
    var encoder = require('utf8');
    var https = require('https');
    var x509 = require('x509.js');
    var _ = app.get('lodash');
    var db = models.sequelize;

    var VoteContainerFile = models.VoteContainerFile;
    var VoteUserContainer = models.VoteUserContainer;
    var VoteOption = models.VoteOption;

    var _replyingPartyUUID;
    var _replyingPartyName;
    var _authorizeToken;
    var _dataToSignList = {};

    var _hostname;
    var _apiPath;
    var _client;
    var _endpointUrl;
    var _port;
   // var FILE_CREATE_MODE = '0760';

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

    var _createHash = function (input = '', hashType) {
        input = input.toString() || crypto.randomBytes(20).toString();
        hashType = hashType || 'sha256';

        var hash = crypto.createHash(hashType);

        hash.update(encoder.encode(input));

        return hash.digest('hex');
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
        _endpointUrl = _buildPath();
/*
        _client = new SmartIdClient();
        _client.setRelyingPartyUUIDSync(_replyingPartyUUID);
        _client.setRelyingPartyNameSync(_replyingPartyName);
        _client.setHostUrlSync(_endpointUrl);*/

        return that;
    };

    var _buildPath = function () {
        return 'https://' + _hostname + _apiPath;
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

    var _authenticate = function (pid, countryCode) {
        countryCode = countryCode || 'EE'; //defaults to Estonia
        var sessionHash = _createHash();
        var path = '/smart-id-rp/v1/authentication/pno/:countryCode/:pid';
        var _hashType = 'sha256'

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
          //      logger.error('problem with request: ', e.message);

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

    var _getSessionStatusData = function (sessionId) {
        var path = '/smart-id-rp/v1/session/:sessionId'.replace(':sessionId', sessionId);
        var options = {
            hostname: _hostname,
            path: path,
            method: 'GET',
            port: _port,
            requestCert: true,
            requestOCSP: true
        };

        var data = '';
        return new Promise(function (resolve, reject) {
            var request = https.request(options, function (result) {
                result.setEncoding('utf8');
                result.on('data', function (chunk) {                    
                    try {
                        data += chunk;                     

                    } catch (e) {
                        return reject(e);
                    }

                });
                result.on('end', function (e) {
                    var finalData = {
                        ocsp: result.socket.getSession(),
                        data: JSON.parse(data)
                    }
                    return resolve(finalData);
                });
            });

            request.end();
            request.on('error', function (e) {
                console.log('ERROR REQUEST', e);
                //  logger.error('problem with request: ', e.message);

                return reject(e);
            });
        })
    };

    var _getUserCertificate = function (pid, countryCode) {
        countryCode = countryCode || 'EE';
        var path = '/smart-id-rp/v1/certificatechoice/pno/:countryCode/:pid';

        var params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            certificateLevel: 'ADVANCED',
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
            var data = '';
            var request = https.request(options, function (result) {
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    try {
                        data += chunk;
                    } catch (e) {
                        return reject(e);
                    }

                });
                result.on('end', function () {
                    data = JSON.parse(data);
                    return _getSessionStatusData(data.sessionID)
                        .then(function (sessionData) {
                            return resolve(sessionData.data.cert.value);
                        });
                })
                result.on('error', function (e) {
                    reject(e);
                });
            });

            // write data to request body

            request.write(params);
            request.end();
            request.on('error', function (e) {
                //  logger.error('problem with request: ', e.message);

                return reject(e);
            });
        }).catch(function (e) {
            console.log('ERROR', e);
        })
    }

    var _createUserBdoc = function (topicId, voteId, userId, voteOptions, configuration, transaction) {        
        var docPath = './files/'+ topicId +'/'+ voteId +'/' + userId;
        if (!fs.existsSync(docPath)){
            fs.mkdirSync(docPath);
        }
        docPath += '/vote.bdoc';
        var container = new Bdoc(docPath);
    //    console.log(container);
        container.setConfiguration(configuration);
        var chosenVoteOptionFileNames = voteOptions.map(_getVoteOptionFileName);

        return VoteContainerFile
            .findAll({
                where: {
                    voteId: voteId
                },
                transaction: transaction
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

                container.append(content, {
                    name: fileName,
                    mimeType: mimeType
                });
            })
            .then(function () {
                return new Promise (function (resolve) {
                    var finalData = '';
                    var mufileStream = mu
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
            })
            .then(function () {
                return new Promise(function (resolve) {
                   return resolve(container);
                });
            }).catch(function (e) {
                console.log(e)
            })
    }

    var _prepareCert = function (certificate) {
        
        certificate = certificate.split('');
        if (certificate.indexOf('\n') ===-1) {
            var certParts = [];
            while (certificate.length) {
                certParts.push(certificate.splice(0,64).join(''));
            }
            certificate = certParts.join('\n');
        }
        
        if (certificate.indexOf('-----BEGIN CERTIFICATE-----') === -1) {
            certificate = '-----BEGIN CERTIFICATE-----\n'+certificate+'\n-----END CERTIFICATE-----\n';
        }

        return certificate;
    };
    var _getCertUserData = function (certificate) {
        certificate = _prepareCert(certificate);
        var certData = x509.parseCert(certificate);

        return Promise.resolve({
            lastName: certData.subject.givenName,
            firstName: certData.subject.surname,
            pid: certData.subject.serialNumber
        });
    }

    var _statusSign = function (sessionId, sessionHash, voteId, userId, topicId, voteOptions) {        
        return new Promise (function (resolve, reject) {
            return _getSessionStatusData(sessionId)
                .then(function (result) {
                    var data = result.data;
                    if(data.state === 'COMPLETE') {
                        return db
                            .transaction(function (t) {
                                return VoteOption
                                    .findAll({
                                        where: {id: _.map(voteOptions, 'optionId')},
                                        transaction: t
                                    })
                                    .then(function (voteOptions) {
                                        return _createUserBdoc(topicId, voteId, userId, voteOptions, 'test', t)
                                            .then(function (bdoc) {
                                                bdoc.addSignature(data.signature.value, data.cert.value, result.ocsp)
                                                    .then(function () {
                                                        bdoc.finalize();
                                                        return resolve({
                                                            signedDocData: bdoc.getStream(),
                                                            signerInfo: {firstName: 'TEST', lastName: 'TEST'}
                                                        });
                                                    });
                                            });
                                    });
                            });
                    } else{
                        return resolve(data);
                    }
                    
                })
        });        
    };

    var _signature = function (pid, countryCode, bdoc) {
        countryCode = countryCode || 'EE'; //defaults to Estonia
        var dataToSign = bdoc.getDataToSign();
    //    console.log('DATA TO SIGN', dataToSign);
        var sessionHash = crypto.createHash('sha256').update(dataToSign).digest('base64');
        var hashType = 'sha256';
        
        var path = '/smart-id-rp/v1/signature/pno/:countryCode/:pid';
        var params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            hash: sessionHash,
            hashType: hashType.toUpperCase()
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
                            sessionHash: sessionHash,
                            
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
                console.log('ERROR', e);
              //  logger.error('problem with request: ', e.message);

                return reject(e);
            });
        });
    };

    var _signInitSmartId = function (topicId, voteId, userId, voteOptions, pid, countryCode, certificate, transaction) {
        return _createUserBdoc(topicId, voteId, userId, voteOptions, 'test', transaction)
            .then(function (bdoc) {
                bdoc.addSigningCertificate(certificate);
                bdoc.finalize();
            //    var containerBase64 = _streamToBase64(bdocStream);
             /*   return VoteUserContainer
                    .upsert({
                        userId: userId,
                        voteId: voteId,
                        container: Buffer.from(containerBase64, 'base64')
                    })
                    .then(function () {*/
                        return _signature(pid, countryCode, bdoc);
           //         });                
            });
    };

    var _statusAuth = function (sessionId) {
        return new Promise (function (resolve) {
            var sessionStatus = new SmartIdRestConnector(_endpointUrl);
            
            var status = sessionStatus.getSessionStatusSync(sessionId);
            var authResponse = _getAuthenticationResponse(status);
            if (authResponse.error) {
                return resolve(authResponse);
            }
            var authenticationResult = AuthenticationResponseValidator().validateSync(authResponse);

            var authIdentity = authenticationResult.getAuthenticationIdentitySync();
            var firstName = authIdentity.getGivenNameSync(); // e.g. Mari-Liis"
            var lastName = authIdentity.getSurNameSync(); // e.g. "Männik"
            var pid = authIdentity.getIdentityCodeSync(); // e.g. "47101010033"
            var country = authIdentity.getCountrySync(); // e.g. "EE"

            return resolve({
                state: 'COMPLETE',
                result: {
                    endResult: 'OK',
                    user: {
                        firstName,
                        lastName,
                        pid,
                        country
                    }
                }
            });
        });
    }

    return {
        init: _init,
        authenticate: _authenticate,
        getUserCertificate: _getUserCertificate,
        getCertUserData: _getCertUserData,
        signInitSmartId: _signInitSmartId,
        signature: _signature,
        statusSign: _statusSign,
        createUserBdoc: _createUserBdoc,
        statusAuth: _statusAuth,
        getVerificationCode: _getVerificationCode
    };
}

module.exports = CosSmartId;
