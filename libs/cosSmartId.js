'use strict';

/**
 * @returns {object} CosSmartId object
 */
function CosSmartId () {
    const that = this;
    const logger = require('log4js');
    const crypto = require('crypto');
    const Promise = require('bluebird');
    const encoder = require('utf8');
    const https = require('https');
    const Pkijs = require('pkijs');
    const Asn1js = require('asn1js');
    const EC = require('elliptic').ec;
    const NodeRSA = require('node-rsa');


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

    let _replyingPartyUUID;
    let _replyingPartyName;
    let _authorizeToken;

    let _hostname;
    let _apiPath;
    let _port;

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

        return that;
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

    const _prepareCert = function (certificateString, format) {
        format = format || 'base64';
        if (typeof certificateString !== 'string') {
            throw new Error('Expected PEM as string')
        }

        // Now that we have decoded the cert it's now in DER-encoding
        const der = Buffer.from(certificateString, format);

        // And massage the cert into a BER encoded one
        const ber = new Uint8Array(der).buffer;

        // And now Asn1js can decode things \o/
        const asn1 = Asn1js.fromBER(ber);
        const cert = new Pkijs.Certificate({schema: asn1.result});

        return cert;
    };

    const _validateAuthorization = function (authResponse, sessionHash) {
        return new Promise(function (resolve) {
            const cert = _prepareCert(authResponse.cert.value, 'base64');
            if (cert.subjectPublicKeyInfo.parsedKey.x && cert.subjectPublicKeyInfo.parsedKey.y) {
                const ec = new EC('p256');
                const publicKeyData = {
                    x: Buffer.from(cert.subjectPublicKeyInfo.parsedKey.x).toString('hex'),
                    y: Buffer.from(cert.subjectPublicKeyInfo.parsedKey.y).toString('hex')
                };
                const key = ec.keyFromPublic(publicKeyData, 'hex');

                // Splits to 2 halfs
                const m = Buffer.from(authResponse.signature.value, 'base64').toString('hex').match(/([a-f\d]{64})/gi);

                const signature = {
                    r: m[0],
                    s: m[1]
                };

                return resolve(key.verify(sessionHash, signature));
            }
            const parsedData = cert.subjectPublicKeyInfo.parsedKey.toJSON();
            const publicKey = new NodeRSA(parsedData);
         //   console.log(authResponse);
            const verify = crypto.createVerify('sha256WithRSAEncryption');
            var prefix = [0x30, 0x31, 0x30, 0x0d, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01, 0x05, 0x00, 0x04, 0x20];

            var items = [Buffer.from(prefix), Buffer.from(sessionHash, 'hex')];
    //       console.log(authResponse.signature.value);
            verify.update(Buffer.concat(items).toString('hex'));
    //       console.log(verify.verify(publicKey.exportKey('public'), authResponse.signature.value, 'base64'));
            const isValid = publicKey.verify(Buffer.concat(items).toString('hex'), Buffer.from(authResponse.signature.value, 'base64'));
     //       console.log(isValid);// Prints: true or false
            return resolve(isValid); // this is temporary, validation must be fixed
        });
    };

    const _statusAuth = function (sessionId, sessionHash) {
        return new Promise (function (resolve, reject) {
            _getSessionStatusData(sessionId)
                .then(function (result) {
                    const data = result.data;
                   // console.log(data);
                    if (data.state === 'RUNNING') {
                        return resolve(data);
                    }

                    if (data.result.endResult === 'OK') {
                     //   console.log(data.result);
                        return _validateAuthorization(result.data, sessionHash)
                            .then(function (isValid) {
                       //         console.log('isValid', isValid);
                                if (isValid) {
                                    return _getCertUserData(data.cert.value, 'base64')
                                        .then(function (personalInfo) {
                                            data.personalInfo = personalInfo;
                                            return resolve(data);
                                        });
                                }
                            }).catch(function (e) {
                                logger.error(e);
                                console.log('ERROR', e);
                                return reject(e);
                            });
                    }

                    return resolve(data);
                });
        });
    };

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

        return new Promise(function (resolve) {
            return _apiRequest(null, options)
                .then(function (result) {
                    return resolve(result);
                });
        })
    };

    const _getUserCertificate = function (pid, countryCode) {
        countryCode = countryCode || 'EE';
        const path = '/smart-id-rp/v1/certificatechoice/pno/:countryCode/:pid'.replace(':countryCode', countryCode).replace(':pid', pid);

        let params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            certificateLevel: 'ADVANCED',
        };

        params = JSON.stringify(params);

        const options = {
            hostname: _hostname,
            path,
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

                    if (data.sessionID) {
                        return _getSessionStatusData(data.sessionID)
                            .then(function (sessionData) {
                                if (sessionData.data && sessionData.data.cert)
                                    return resolve(sessionData.data.cert.value);

                                return resolve(sessionData);
                            });
                    }

                    return resolve(data);
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

    const _getCertUserData = function (certificate, format) {
        const cert = _prepareCert(certificate, format);
        const subject = getCertValue('subject', cert);

        return Promise.resolve({
            firstName: subject.GivenName,
            lastName: subject.SurName,
            pid: subject.DeviceSerialNumber,
            country: subject.Country
        });
    };

    const _statusSign = function (sessionId) {
        return new Promise (function (resolve) {
            return _getSessionStatusData(sessionId)
                .then(function (result) {
                    const data = result.data;
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
                            sessionHash,

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
