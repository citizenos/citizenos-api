'use strict';

/**
 * @returns {object} CosMobileId object
 */
function CosMobileId () {
    const that = this;
    const crypto = require('crypto');
    const encoder = require('utf8');
    const Promise = require('bluebird');
    const https = require('https');
    const logger = require('log4js');
    const Pkijs = require('pkijs');
    const Asn1js = require('asn1js');
    const asn1js = require('asn1.js');
    const fs = require('fs');
    const WebCrypto = require('node-webcrypto-ossl');
    const ECKey = require('ec-key');
    const BN = require('bn.js');
    const java = require('java');
    const EC = require('elliptic').ec;
    var ec = new EC('secp256k1');


    const baseDir = "./libs/java";
    var dependencies = fs.readdirSync(baseDir);

    dependencies.forEach(function(dependency){
        java.classpath.push(baseDir + "/" + dependency);
    })

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
        console.log(input);
        hashType = hashType || 'sha256';

        const hash = crypto.createHash(hashType);
        console.log(encoder.encode(input));
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

    const _prepareCert = function (certificateString) {
        if(typeof certificateString !== 'string') {
            throw new Error('Expected PEM as string')
        }
    
        // Load certificate in PEM encoding (base64 encoded DER)
        const b64 = certificateString.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, '');
    
        // Now that we have decoded the cert it's now in DER-encoding
        const der = Buffer.from(b64, 'base64');
    
        // And massage the cert into a BER encoded one
        const ber = new Uint8Array(der).buffer;
    
        // And now Asn1js can decode things \o/
        const asn1 = Asn1js.fromBER(ber);
        const cert = new Pkijs.Certificate({ schema: asn1.result });

        return cert;
    };

    const _getCertUserData = function (certificate) {
        const cert = _prepareCert(certificate);
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

    const _certificate = function (nationalIdentityNumber, phoneNumber) {
        const sessionHash = _createHash();
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
            .then(function(result) {
                if (!result.data.sessionID) {
                    return result.data;
                }

                const verficationCode = _getVerificationCode(sessionHash);

                return {
                    sessionId: result.data.sessionID,
                    challengeID: verficationCode,
                    sessionHash
                };
            });
    };

    const _authenticate = function (nationalIdentityNumber, phoneNumber, language) {
        const sessionHash = _createHash('abc123');
        console.log(sessionHash);
        const path = _apiPath + '/authentication';
        language = LANGUAGES[language] || LANGUAGES.en;
        const hashType = 'sha256'

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
                    console.log(err);
                    return Promise.reject(err);
                } else {
                    return Promise.resolve(result);
                }
            });
    };

    const _authenticate1 = function (nationalIdentityNumber, phoneNumber, language) {
        const MidClient = java.import('ee.sk.mid.MidClient');       
        const MidLanguage = java.import('ee.sk.mid.MidLanguage');
        const MidAuthenticationHashToSign = java.import('ee.sk.mid.MidAuthenticationHashToSign');
        const MidAuthenticationRequest = java.import('ee.sk.mid.rest.dao.request.MidAuthenticationRequest');
        const MidDisplayTextFormat = java.import('ee.sk.mid.MidDisplayTextFormat');
        const MidAuthenticationResponseValidator = java.import('ee.sk.mid.MidAuthenticationResponseValidator');
    /*    const MidAuthenticationResponse = java.import('ee.sk.mid.rest.dao.response.MidAuthenticationResponse');
        const MidSessionStatus = java. import('ee.sk.mid.rest.dao.MidSessionStatus');*/
        const client = MidClient.newBuilderSync()
            .withHostUrlSync("https://tsp.demo.sk.ee/mid-api")
            .withRelyingPartyUUIDSync("00000000-0000-0000-0000-000000000000")
            .withRelyingPartyNameSync("DEMO")
            .buildSync();

        const authenticationHash = MidAuthenticationHashToSign.generateRandomHashOfDefaultTypeSync();
        console.log('authenticationHash', authenticationHash);
        const verificationCode = authenticationHash.calculateVerificationCodeSync();
        language = LANGUAGES[language] || LANGUAGES.en;
        const request = MidAuthenticationRequest.newBuilderSync()
            .withPhoneNumberSync(phoneNumber)
            .withNationalIdentityNumberSync(nationalIdentityNumber)
            .withHashToSignSync(authenticationHash)
            .withLanguageSync(MidLanguage.ENG)
            .withDisplayTextSync("Log into self-service?")
            .withDisplayTextFormatSync( MidDisplayTextFormat.GSM7)
            .buildSync();
        
        const response = client.getMobileIdConnectorSync().authenticateSync(request);

        const sessionStatus = client.getSessionStatusPollerSync().fetchFinalSessionStatusSync(response.getSessionIDSync(),
            "/authentication/session/{sessionId}");

        const authentication = client.createMobileIdAuthenticationSync(sessionStatus, authenticationHash);
        const validator = new MidAuthenticationResponseValidator();
        const authenticationResult = validator.validateSync(authentication);

    console.log('IS VALID', authenticationResult.isValidSync());
    console.log(authenticationResult.getErrorsSync().isEmptySync());
    };

    const _getSessionStatusData = function (type, sessionId, timeout) {
        
        let path = _apiPath + '/' + type + '/session/:sessionId'.replace(':sessionId', sessionId);
        if (timeout) {
            path+= '?timeoutMs=' + timeout;
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
        var bigInt = require("big-integer");
        return new Promise (function (resolve, reject) {
            fs.writeFileSync('suslik.crt', authResponse.cert);
            const cert = _prepareCert(authResponse.cert);
            console.log(cert.subjectPublicKeyInfo);
            let publicKeyData = cert.subjectPublicKeyInfo.parsedKey.toJSON();
            console.log(cert.subjectPublicKeyInfo.parsedKey);
            publicKeyData.kty = "EC";
            const hashBuffer = Buffer.from(sessionHash, 'hex');
            const signatureVale = Buffer.from(authResponse.signature.value, 'base64');

            const elements = signatureVale.toJSON().data;
            var half_length = Math.ceil(elements.length / 2);
            const rvalues = elements.slice(0,half_length);
            const svalues = elements.slice(half_length, elements.length);
            console.log(svalues);
            var r = new bigInt(Buffer.from(rvalues).toString('hex'), 16);
            var s = new bigInt(Buffer.from(svalues).toString('hex'), 16);
            console.log(r, s)
            var sequence = new Asn1js.Sequence();
            sequence.valueBlock.value.push(new Asn1js.Integer(r));
            sequence.valueBlock.value.push(new Asn1js.Integer(s));
            var sequence_buffer = Buffer.from(sequence.toBER(false));
            console.log(sequence_buffer);
          //  return encodeInAsn1(r, s);

// The converted key and the uncompressed public key should be the same
     //   console.log(uncompressedKey);
      //      var key = new ECKey(publicKeyData);
    //        key = key.asPublicECKey();
        //    const signature = Buffer.from(authResponse.signature.value, 'base64').toString('hex');
        //    var sigData = { r: signature.substr(0, signature.length/2),
         //       s: signature.substr(signature.length/2)
         ///   };
         ///   console.log('SIGDATA', sigData);
       //     const verify = key.createVerify('SHA256');
        //    verify.update(Buffer.from(sessionHash, 'hex'));

            
            // Import public key
            var key2 = ec.keyFromPublic(publicKeyData, 'hex');
            
            // Signature MUST be either:
            // 1) DER-encoded signature as hex-string; or
            // 2) DER-encoded signature as buffer; or
            // 3) object with two hex-string properties (r and s); or
            // 4) object with two buffer properties (r and s
            console.log(key2.verify(Buffer.from(sessionHash, 'hex'), signatureVale));
         //   const verify = crypto.createVerify('SHA256');
         //   verify.update(Buffer.from(sessionHash.data, 'hex'));
            //verify.end();

           // console.log(verify.verify(sequence_buffer));
        });
    };

    const _statusAuth = function (sessionId, sessionHash) {
        return new Promise (function (resolve, reject) {
            return _getSessionStatusData('authentication', sessionId)
                .then(function (result) {
                    const data = result.data;
                    if (data.state === 'COMPLETE' && data.result === 'OK') {
                        console.log('RESPONSE: ', result.data);
                        _validateAuthorization(result.data, sessionHash)
                            .then(function () {
                                return _getCertUserData(data.cert)
                                    .then(function (personalInfo) {
                                        data.personalInfo = personalInfo;
                                        return resolve(data);
                                    });
                            }).catch(function(e) {
                                console.log(e);
                                reject(e);
                            });
                    }
                    if (data.error) {
                        return reject(data);
                    }

                    return resolve(data);
                });
        });
    };

    const _sign = function (nationalIdentityNumber, phoneNumber, language, dataToSign) {
        const sessionHash = crypto.createHash('sha256').update(dataToSign).digest('base64');
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

        return _apiRequest (params, options)
            .then(function (result) {
                return new Promise (function (resolve, reject) {
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
        return new Promise (function (resolve) {
            return _getSessionStatusData('signature', sessionId)
                .then(function (result) {
                    const data = result.data;
                    if (data.state === 'COMPLETE' && data.result === 'OK') {
                        return _getCertUserData(data.cert)
                            .then(function (personalInfo) {
                                data.personalInfo = personalInfo;
                                return resolve(data);
                            });
                    }
                    return resolve(data);
                });
        });
    };

    return {
        init: _init,
        certificate: _certificate,
        getCertUserData: _getCertUserData,
        getVerificationCode: _getVerificationCode,
        authenticate: _authenticate,
        statusAuth: _statusAuth,
        sign: _sign,
        statusSign: _statusSign
    };
}

module.exports = CosMobileId;
