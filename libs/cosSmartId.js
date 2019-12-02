'use strict';

/**
 * @returns {object} CosSmartId object
 */
function CosSmartId () {
    const that = this;
    const logger = require('log4js');
    const crypto = require('crypto');
    const Promise = require('bluebird');
   /// const Bdoc = app.get('Bdoc');
    const encoder = require('utf8');
    const https = require('https');
    const Pkijs = require('pkijs');
    const Asn1js = require('asn1js');
    const _ = require('lodash');
    const fs = require('fs');
 /*   var Hades = require("js-undersign")
    var Tsl = require("js-undersign/lib/tsl")

    var hades = new Hades({
        tsl: Tsl.parse(fs.readFileSync("./config/tsl/test-estonian-tsl.xml")),
        timemarkUrl: "http://demo.sk.ee/ocsp "
    });
*/
    const OID = {
        "2.5.4.3": {
            short: "CN",
            long: "CommonName",
        },
        "2.5.4.6": {
            short: "C",
            long: "Country",
        },
        "2.5.4.5": {
            long: "DeviceSerialNumber",
        },
        "0.9.2342.19200300.100.1.25": {
            short: "DC",
            long: "DomainComponent",
        },
        "1.2.840.113549.1.9.1": {
            short: "E",
            long: "EMail",
        },
        "2.5.4.42": {
            short: "G",
            long: "GivenName",
        },
        "2.5.4.43": {
            short: "I",
            long: "Initials",
        },
        "2.5.4.7": {
            short: "L",
            long: "Locality",
        },
        "2.5.4.10": {
            short: "O",
            long: "Organization",
        },
        "2.5.4.11": {
            short: "OU",
            long: "OrganizationUnit",
        },
        "2.5.4.8": {
            short: "ST",
            long: "State",
        },
        "2.5.4.9": {
            short: "Street",
            long: "StreetAddress",
        },
        "2.5.4.4": {
            short: "SN",
            long: "SurName",
        },
        "2.5.4.12": {
            short: "T",
            long: "Title",
        },
        "1.2.840.113549.1.9.8": {
            long: "UnstructuredAddress",
        },
        "1.2.840.113549.1.9.2": {
            long: "UnstructuredName",
        },
    };
   /* const db = models.sequelize;*/
/*
    const VoteContainerFile = models.VoteContainerFile;
    const VoteUserContainer = models.VoteUserContainer;
    const VoteOption = models.VoteOption;*/

    let _replyingPartyUUID;
    let _replyingPartyName;
    let _authorizeToken;
    const _dataToSignList = {};

    let _hostname;
    let _apiPath;
    let _client;
    let _endpointUrl;
    let _port;
   // const FILE_CREATE_MODE = '0760';

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

    const _createHash = function (input = '', hashType) {
        input = input.toString() || crypto.randomBytes(20).toString();
        hashType = hashType || 'sha256';

        const hash = crypto.createHash(hashType);

        hash.update(encoder.encode(input));

        return hash.digest('hex');
    };

    const _init = function (options) {
        _replyingPartyUUID = options.relyingPartyUUID;
        _replyingPartyName = options.replyingPartyName;
        _authorizeToken = options.authorizeToken;

        if (options.hostname) {
            const hostData = options.hostname.split(':');
            _hostname = hostData[0];
            _port = hostData[1] || 443;
        }

        _apiPath = options.apiPath;
        _endpointUrl = _buildPath();

        return that;
    };

    const _buildPath = function () {
        return 'https://' + _hostname + _apiPath;
    };

    const _padLeft = function (input, size, padText) {
        while (input.length < size) {
            input = padText + input;
        }

        return input;
    };

    const _apiRequest = function (params, options) {

        return new Promise(function (resolve, reject) {
            const request = https.request(options, function (result) {
                let data = '';
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    data += chunk;
                });

                result.on('end', function () {
                    try {
                        data = JSON.parse(data);
                        return resolve({
                            status: result.statusCode,
                            data: data
                        });
                    } catch (e) {
                        return reject(e);
                    }
                });
            });
            
            if (params) {
                request.write(params);  // write data to request body
            }
            request.end();
            request.on('error', function (e) {
                return reject(e);
            });
        });
    };

    const _getVerificationCode = function (sessionHash) {
        const enchash = crypto.createHash('sha256');
        enchash.update(Buffer.from(sessionHash, 'hex'));
        const buf = enchash.digest();

        const twoRightmostBytes = buf.slice(-2);
        const buffer = Buffer.from(twoRightmostBytes);
        let positiveInteger = buffer.readUInt16BE();

        positiveInteger = (positiveInteger % 10000).toString().substr(-4);

        return _padLeft(positiveInteger, 4, '0');
    };

    const _authenticate = function (pid, countryCode) {
        countryCode = countryCode || 'EE'; //defaults to Estonia
        const sessionHash = _createHash();
        const path = _apiPath + '/authentication/pno/:countryCode/:pid'.replace(':countryCode', countryCode).replace(':pid', pid);
        const _hashType = 'sha256'

        let params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            hash: Buffer.from(sessionHash, 'hex').toString('base64'),
            hashType: _hashType.toUpperCase()
        };

        params = JSON.stringify(params);

        const options = {
            hostname: _hostname,
            path: path,
            method: 'POST',
            port: _port,
            headers: {
                'Authorization': 'Bearer ' + _authorizeToken,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(params, 'utf8')
            }
        };

        return new Promise(function (resolve, reject) {
            _apiRequest(params, options)
                .then(function (result) {
                    if (result.data.sessionID) {
                        const verficationCode = _getVerificationCode(sessionHash);

                        return resolve({
                            sessionId: result.data.sessionID,
                            challengeID: verficationCode,
                            sessionHash: sessionHash
                        });                        
                    } else if (result.data.code && result.data.message) {
                        let e = new Error(result.data.message);
                        e.code = result.data.code;

                        return reject(e);
                    }

                    return reject(result.data);

                    
                });
            });
    };

    const _statusAuth = function (sessionId) {
        return new Promise (function (resolve) {
            _getSessionStatusData(sessionId)
                .then(function (result) {
                    const data = result.data;
                    if (data.state === 'RUNNING') {
                        return resolve(data);
                    }
                    if (data.result.endResult === 'OK') {
                        return _getCertUserData(data.cert.value)
                            .then(function (personalInfo) {
                                data.personalInfo = personalInfo;

                                return resolve(data);
                            });
                    }

                    return resolve(data);
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
   /* const _getVoteOptionFileName = function (voteOption) {
        const sanitizedfileName = sanitizeFilename(voteOption.value);
        
        if (!sanitizedfileName.length) {
            throw Error('Nothing left after sanitizing the optionValue: ' + voteOption.value);
        }
        return VOTE_OPTION_FILE.name.replace(':value', sanitizedfileName);
    };*/

    const _getSessionStatusData = function (sessionId) {
        const path = _apiPath + '/session/:sessionId'.replace(':sessionId', sessionId);
        const options = {
            hostname: _hostname,
            path: path,
            method: 'GET',
            port: _port,
            requestCert: true,
            requestOCSP: true
        };

        return new Promise(function (resolve, reject) {
            return _apiRequest(null, options)
                .then(function (result) {
             //       console.log('sessionId', sessionId);
            //        console.log('status SIGN', sessionId, result);
                    return resolve(result);
                });
         /*   const request = https.request(options, function (result) {
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    data += chunk;
                });

                result.on('end', function () {
                    const finalData = {
                        data: JSON.parse(data)
                    }

                    return resolve(finalData);
                });
            });

            request.end();
            request.on('error', function (e) {
                logger.error('problem with request: ', e.message);

                return reject(e);
            });*/
        })
    };

    const _getUserCertificate = function (pid, countryCode) {
        countryCode = countryCode || 'EE';
        const path = '/smart-id-rp/v1/certificatechoice/pno/:countryCode/:pid';

        let params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            certificateLevel: 'ADVANCED',
        };

        params = JSON.stringify(params);
        
        const options = {
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
            let data = '';
            const request = https.request(options, function (result) {
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                        data += chunk;
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
                logger.error('problem with request: ', e.message);

                return reject(e);
            });
        });
    };
/*
    const _createUserBdoc = function (topicId, voteId, userId, voteOptions, configuration, transaction) {        
        let docPath = './files/'+ topicId +'/'+ voteId +'/' + userId;
        if (!fs.existsSync(docPath)){
            fs.mkdirSync(docPath);
        }
        docPath += '/vote.bdoc';
        const container = new Bdoc(docPath);
    //    console.log(container);
        container.setConfiguration(configuration);
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

                container.append(content, {
                    name: fileName,
                    mimeType: mimeType
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
    }*/

    const _prepareCert = function (certificate) {
        
        certificate = certificate.split('');
        if (certificate.indexOf('\n') ===-1) {
            const certParts = [];
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

    const getCertValue = function (key, cert) {
        let res = {};
        cert[key].typesAndValues.forEach(function (typeAndValue) {
            const type = typeAndValue.type;
            const oid = OID[type.toString()];
            const name2 = oid ? oid.long : null;
            res[`${name2 ? name2 : type}`] = `${typeAndValue.value.valueBlock.value}`;
        });

        return res;
    };

    const _getCertUserData = function (certificate) {        
        if(typeof certificate !== 'string') {
            throw new Error('Expected PEM as string')
        }
    
        // Load certificate in PEM encoding (base64 encoded DER)
        const b64 = certificate.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, '')
    
        // Now that we have decoded the cert it's now in DER-encoding
        const der = Buffer.from(b64, 'base64')
    
        // And massage the cert into a BER encoded one
        const ber = new Uint8Array(der).buffer
    
        // And now Asn1js can decode things \o/
        const asn1 = Asn1js.fromBER(ber)
        const cert = new Pkijs.Certificate({ schema: asn1.result })
        const subject = getCertValue('subject', cert);

        return Promise.resolve({
            firstName: subject.GivenName,
            lastName: subject.SurName,
            pid: subject.DeviceSerialNumber,
            country: subject.Country
        });
    };

    /*const _statusSign = function (sessionId, sessionHash, voteId, userId, topicId, voteOptions) {        
        return new Promise (function (resolve, reject) {
            return _getSessionStatusData(sessionId)
                .then(function (result) {
                    const data = result.data;
                    if(data.state === 'COMPLETE') {
                      /*  return db
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
    };*/

    const _statusSign = function (sessionId) {
        return new Promise (function (resolve) {
            return _getSessionStatusData(sessionId)
                .then(function (result) {
                    const data = result.data;
                  //  console.log('STATUS SIGN', result);
                    if (data.state === 'COMPLETE' && data.result === 'OK') {
                        return resolve(data);
                    }

                    return resolve(data);
                });
        });
    };

    const _signature = function (pid, countryCode, sessionHash) {
        countryCode = countryCode || 'EE'; //defaults to Estonia
        const hashType = 'sha256';
        
        const path = '/smart-id-rp/v1/signature/pno/:countryCode/:pid';
        let params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            hash: sessionHash,
            hashType: hashType.toUpperCase()
        };
        
        params = JSON.stringify(params);
        
        const options = {
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
            const request = https.request(options, function (result) {
                let data = '';
                result.setEncoding('utf8');
                result.on('data', function (chunk) {
                    data += chunk;
                });

                result.on('end', function () {
                    try {
                        data = JSON.parse(data);
                        if (!data.sessionID) {
                            return reject(data);
                        }

                        const verficationCode = _getVerificationCode(sessionHash);

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
                logger.error('problem with request: ', e.message);

                return reject(e);
            });
        });
    };

    return {
        init: _init,
        authenticate: _authenticate,
        getUserCertificate: _getUserCertificate,
        getCertUserData: _getCertUserData,
        signature: _signature,
        statusSign: _statusSign,
        statusAuth: _statusAuth,
        getVerificationCode: _getVerificationCode
    };
}

module.exports = CosSmartId;
