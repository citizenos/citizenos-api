'use strict';

/**
 * @returns {object} CosMobileId object
 */
function CosMobileId () {
    const that = this;
    const crypto = require('crypto');
    const Promise = require('bluebird');
    const https = require('https');
    const logger = require('log4js');
    const Pkijs = require('pkijs');
    const Asn1js = require('asn1js');
    const EC = require('elliptic').ec;


    let _replyingPartyUUID;
    let _replyingPartyName;
    let _authorizeToken;

    let _hostname;
    let _apiPath;
    let _port;
    const LANGUAGES = {
        et: 'EST',
        en: 'ENG',
        ru: 'RUS',
        lt: 'LIT'
    }

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

    const _createHash = function (input = '', hashType) {
        input = input.toString() || crypto.randomBytes(20).toString();
        hashType = hashType || 'sha256';

        const hash = crypto.createHash(hashType);
        hash.update(input);
        return hash.digest('hex');
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

    const _prepareCert = function (certificateString, format) {
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

    const _getUserCertificate = function (nationalIdentityNumber, phoneNumber) {
        return new Promise (function (resolve) {
            const path = _apiPath + '/certificate';

            let params = {
                relyingPartyUUID: _replyingPartyUUID,
                relyingPartyName: _replyingPartyName,
                phoneNumber,
                nationalIdentityNumber
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

            return _apiRequest(params, options)
                .then(function (result) {
                    if (result.data && result.data.cert) {
                        return resolve(result.data.cert);
                    }

                    return resolve(result);
                });
        });
    };

    const _authenticate = function (nationalIdentityNumber, phoneNumber, language) {
        const sessionHash = _createHash();
        const path = _apiPath + '/authentication';
        language = LANGUAGES[language] || LANGUAGES.en;
        const hashType = 'sha256';

        let params = {
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            phoneNumber,
            nationalIdentityNumber,
            language,
            hash: Buffer.from(sessionHash, 'hex').toString('base64'),
            hashType: hashType.toUpperCase()
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

        return _apiRequest(params, options)
            .then(function (result) {
                if (result.data.sessionID) {
                    return Promise.resolve({
                        sessionId: result.data.sessionID,
                        challengeID: _getVerificationCode(sessionHash),
                        sessionHash
                    });
                } else if (result.data.error) {
                    let err = new Error(result.data.error);
                    err.code = result.status;
                    return Promise.reject(err);
                } else {
                    return Promise.resolve(result);
                }
            });
    };

    const _getSessionStatusData = function (type, sessionId, timeout) {

        let path = _apiPath + '/' + type + '/session/:sessionId'.replace(':sessionId', sessionId);
        if (timeout) {
            path += '?timeoutMs=' + timeout;
        }
        const options = {
            hostname: _hostname,
            path: path,
            method: 'GET',
            port: _port,
            requestCert: true,
            requestOCSP: true
        };

        return _apiRequest(null, options);
    };

    const _validateAuthorization = function (authResponse, sessionHash) {
        return new Promise(function (resolve) {
            const cert = _prepareCert(authResponse.cert, 'base64');
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
        });
    };

    const _statusAuth = function (sessionId, sessionHash) {
        return new Promise(function (resolve, reject) {
            return _getSessionStatusData('authentication', sessionId)
                .then(function (result) {
                    const data = result.data;
                    if (data.state === 'COMPLETE' && data.result === 'OK') {
                        return _validateAuthorization(result.data, sessionHash)
                            .then(function (isValid) {
                                if (isValid) {
                                    return _getCertUserData(data.cert, 'base64')
                                        .then(function (personalInfo) {
                                            data.personalInfo = personalInfo;
                                            return resolve(data);
                                        });
                                }
                            }).catch(function (e) {
                                logger.error('ERROR', e);
                            return reject(e);
                        });
                    }
                    if (data.error) {
                        return reject(data);
                    }

                    return resolve(data);
                });
        });
    };

    const _signature = function (nationalIdentityNumber, phoneNumber, sessionHash, language) {
        const hashType = 'sha256';
        language = LANGUAGES[language] || LANGUAGES.en;

        const path = _apiPath + '/signature';
        let params = JSON.stringify({
            relyingPartyUUID: _replyingPartyUUID,
            relyingPartyName: _replyingPartyName,
            phoneNumber,
            nationalIdentityNumber,
            language,
            hash: sessionHash,
            hashType: hashType.toUpperCase()
        });

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

        return _apiRequest(params, options)
            .then(function (result) {
                return new Promise(function (resolve, reject) {
                    if (result.data.sessionID) {
                        const verficationCode = _getVerificationCode(sessionHash);

                        return resolve({
                            sessionId: result.data.sessionID,
                            challengeID: verficationCode,
                            sessionHash: sessionHash
                        });
                    } else if (result.data.error) {
                        let err = new Error(result.data.error);
                        err.code = result.statusCode;

                        return reject(err);
                    } else {
                        return resolve(result);
                    }

                });
            });
    };

    const _statusSign = function (sessionId) {
        return new Promise(function (resolve, reject) {
            return _getSessionStatusData('signature', sessionId)
                .then(function (result) {
                    const data = result.data;
                    if (data.state === 'COMPLETE' && data.result === 'OK') {
                        return resolve(data);
                    }
                    return reject(data);
                });
        });
    };

    return {
        init: _init,
        getUserCertificate: _getUserCertificate,
        getCertUserData: _getCertUserData,
        getVerificationCode: _getVerificationCode,
        authenticate: _authenticate,
        statusAuth: _statusAuth,
        signature: _signature,
        statusSign: _statusSign
    };
}

module.exports = CosMobileId;
