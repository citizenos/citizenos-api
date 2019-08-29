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
    var https = require('https');
    var Promise = app.get('Promise');
    var x509 = require('x509.js');
    var encoder = require('utf8');
    var pem = require('pem');
    var mu = app.get('mu');
    var models = app.get('models');
    var fs = app.get('fs');
    var java = require('java');
    
    var javaLibsPath = './libs/java';
    var dependencies = fs.readdirSync(javaLibsPath);

    dependencies.forEach(function(dependency){
        java.classpath.push(javaLibsPath + '/' + dependency);
    });

    var VoteContainerFile = models.VoteContainerFile;
    var UserConnection = models.UserConnection;

    //Load java classes
    var SmartIdClient = java.import('ee.sk.smartid.SmartIdClient');
    var HashType = java.import('ee.sk.smartid.HashType');
    var SmartIdSignatureToken = java.import('ee.sk.smartid.digidoc4j.SmartIdSignatureToken');
    var NationalIdentity = java.import('ee.sk.smartid.rest.dao.NationalIdentity');
    var DigestAlgorithm = java.import('org.digidoc4j.DigestAlgorithm');
    var SignatureBuilder = java.import('org.digidoc4j.SignatureBuilder');
    var AuthenticationResponseValidator = java.import('ee.sk.smartid.AuthenticationResponseValidator');
    var Configuration = java.import('org.digidoc4j.Configuration');
    var Helper = java.import('org.digidoc4j.utils.Helper');
    var ContainerBuilder = java.import('org.digidoc4j.ContainerBuilder');
    var SmartIdAuthenticationResponse = java.import('ee.sk.smartid.SmartIdAuthenticationResponse');
    var CertificateParser = java.import('ee.sk.smartid.CertificateParser'); 
    var SmartIdRestConnector = java.import('ee.sk.smartid.rest.SmartIdRestConnector');

    var _replyingPartyUUID;
    var _replyingPartyName;
    var _authorizeToken;

    var _hashType;
    var _hostname;
    var _port;
    var _apiPath;
    var _cert;
    var _client;
    var _endpointUrl;

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
/*
    var VOTE_RESULTS_FILE = {
        name: 'votes.csv',
        mimeType: 'text/csv'
    };

    var USER_BDOC_FILE = {
        name: ':pid.bdoc',
        mimeType: 'application/vnd.etsi.asic-e+zip'
    };*/

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
        _endpointUrl = 'https://'+_hostname+_apiPath;

        _client = new SmartIdClient();
        _client.setRelyingPartyUUIDSync(_replyingPartyUUID);
        _client.setRelyingPartyNameSync(_replyingPartyName);
        _client.setHostUrlSync(_endpointUrl);

        return that;
    };

    /**
     *Creates random hash to calculate
     */
/*
    var _createHash = function (input, hashType) {
        input = input || crypto.randomBytes(20).toString('hex');
        _hashType = hashType || 'sha256';

        var hash = crypto.createHash(_hashType);

        hash.update(encoder.encode(input));

        return hash.digest('hex');
    };*/

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

    var _getAuthenticationResponse = function (status) {
        var endResult = status.getResultSync().getEndResultSync();
        if (endResult === 'OK') {
            var certValue = status.getCertSync().getValueSync();
            var cert = CertificateParser.parseX509CertificateSync(certValue);
            var signature = status.getSignatureSync().getValueSync();

            var responseStatus = new SmartIdAuthenticationResponse();
            responseStatus.setEndResultSync(endResult);
            responseStatus.setCertificateSync(cert);
            responseStatus.setSignatureValueInBase64Sync(signature);
            responseStatus.setHashTypeSync(HashType.SHA256);

            return responseStatus;
        } else {
            return {
                error: {
                    message: endResult
                }
            }
        }
    }
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

    var _authenticate = function (pid, countryCode) {
        return new Promise (function (resolve) {
            var AuthenticationHash = java.import('ee.sk.smartid.AuthenticationHash');
            var nationalIdentity = new NationalIdentity(countryCode, pid);

            // For security reasons a new hash value must be created for each new authentication request
            var authenticationHash = AuthenticationHash.generateRandomHashSync();

            var verificationCode = authenticationHash.calculateVerificationCodeSync();

            var authenticationResponse = _client
                .createAuthenticationSync()
                .withNationalIdentitySync(nationalIdentity)
                .withAuthenticationHashSync(authenticationHash)
                .withDisplayTextSync('Citizen OS Login')
                .withCertificateLevelSync("QUALIFIED") // Certificate level can either be "QUALIFIED" or "ADVANCED"
                .initiateAuthenticationSync();

            return resolve({
                challengeID: verificationCode,
                sessionId: authenticationResponse
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
       // var Base64 = java.import('java.util.Base64');
        return new Promise (function (resolve) {
            countryCode = countryCode || 'EE';
            var identity = new NationalIdentity(countryCode, pid); // identity of the signer
            var smartIdSignatureToken = new SmartIdSignatureToken(_client, identity);
            // Get the signer's certificate
            var signingCert = smartIdSignatureToken.getCertificateSync();
            var cert = Buffer.from(signingCert.getEncodedSync(), 'binary').toString('base64');
           // Base64*/
            return resolve(cert);
        });
    }

    var _createUserBdoc = function (topicId, voteId, userId, voteOptions, transaction) {        
        //Configuration
        var configuration = Configuration.ofSync(Configuration.Mode.TEST);
        configuration.getTSLSync().addTSLCertificateSync(Helper.loadCertificateSync('./config/certs/TEST_of_EID-SK_2016.pem.crt'));

        //Create a container with a text file to be signed
        var container = ContainerBuilder
            .aContainerSync()
            .withConfigurationSync(configuration);
        
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

                var voteContainerFileStream = fs.createWriteStream('./files/'+ topicId +'/'+ voteId +'/'+ fileName);
                voteContainerFileStream.end(content);

                return container.withDataFileSync('./files/'+ topicId +'/'+ voteId  +'/'+ fileName, mimeType);
            })
            .then(function () {
                var templateStream = mu.compileAndRender(USERINFO_FILE.template, {user: {id: userId}});
                var writeStream = fs.createWriteStream('./files/'+ topicId +'/'+ voteId +'/'+ USERINFO_FILE.name);
                templateStream.pipe(writeStream);

                return container.withDataFileSync('./files/'+ topicId +'/'+ voteId +'/'+ USERINFO_FILE.name, USERINFO_FILE.mimeType);
            })
            .then(function () {            
                return container.buildSync();
            });
    }

    var _toByteArray = function (data) {
        return java.newArray(
            "byte",
            data
              .map(function(c) { return java.newByte(Number(c)); }));
    }
    var _statusSign = function (sessionId, containerHash) {
        return new Promise(function (resolve, reject) {
            // Sign the digest
            var containerBytes = _toByteArray(containerHash.split(','));
            var containerStream = java.newInstanceSync('java.io.ByteArrayInputStream', containerBytes);
            var container = ContainerBuilder.aContainerSync().fromStreamSync(containerStream).buildSync();
            
            var sessionStatus = new SmartIdRestConnector(_endpointUrl);
            
            var status = sessionStatus.getSessionStatusSync(sessionId);

            var endResult = status.getResultSync().getEndResultSync();
            if (endResult === 'OK') {
                var certValue = status.getCertSync().getValueSync();
                var cert = CertificateParser.parseX509CertificateSync(certValue);
                var dataToSign = SignatureBuilder
                    .aSignatureSync(container)
                    .withSigningCertificateSync(cert)
                    .withSignatureDigestAlgorithmSync(DigestAlgorithm.SHA256)
                    .buildDataToSignSync();

                var signatureValue = status.getSignatureSync().getValueSync();
                var signature = dataToSign.finalizeSync(_toByteArray(signatureValue.split()));
                console.log('signature', signature);
            } else {
                return resolve({
                    error: endResult
                });
            }

            /*
            var signatureValue = smartIdSignatureToken.signDigestSync(DigestAlgorithm.SHA256, byteArrayDigest);

            // Finalize the signature with OCSP response and timestamp (or timemark)
            
            var signatureValueBytes = _toByteArray(signatureValue.toString().split(","));
            var signature = dataToSign.finalizeSync(signatureValueBytes);
            
            console.log('signature', signature);
            // Add signature to the container*/
            container.addSignatureSync(signature);
            

            return {
                signedDocData: Buffer.from(container.saveAsStreamSync()),
                signerInfo: _getPersonalInfoFromCommonName(signedDocInfoResult.SignedDocInfo.SignatureInfo[0].Signer.CommonName.$value)
            };
        }).catch(function(e) {
            console.log(e);
        })
        
    }

    var _signature = function (pid, countryCode, container) {
        return new Promise (function (resolve) {
            var SignableData = java.import('ee.sk.smartid.SignableData');
            var identity = new NationalIdentity(countryCode, pid);
 
            var certificateResponse = _client
               .getCertificateSync()
               .withNationalIdentitySync(identity)
               .fetchSync();
        
            // get the document number for creating signature
            var documentNumber = certificateResponse.getDocumentNumberSync();
            
            var containerStream = container.saveAsStreamSync();
           // console.log('containerStreamA', containerStream.readSync());
            var targetArray = [];
            while(containerStream.availableSync()) {
                targetArray.push(containerStream.readSync())
            }
            var containerbytes = _toByteArray(targetArray.toString('base64').split(","))
            var dataToSign = new SignableData(containerbytes);
           
      /*     hashToSign.setHashType(HashType.SHA256);
           hashToSign.setHashInBase64("0nbgC2fVdLVQFZJdBbmG7oPoElpCYsQMtrY0c0wKYRg=");;*/
        
           // to display the verificationCode on the web page
            var verificationCode = dataToSign.calculateVerificationCodeSync();
            var sessionId = _client
                .createSignatureSync()
                .withDocumentNumberSync(documentNumber)
                .withSignableDataSync(dataToSign)
                .withCertificateLevelSync("QUALIFIED")
                .initiateSigningSync();
/* -------------------*/
            // For security reasons a new hash value must be created for each new authentication request
          /*  var authenticationHash = AuthenticationHash.generateRandomHashSync();

            var verificationCode = authenticationHash.calculateVerificationCodeSync();

            var authenticationResponse = _client
                .createAuthenticationSync()
                .withNationalIdentitySync(nationalIdentity)
                .withAuthenticationHashSync(authenticationHash)
                .withDisplayTextSync('Citizen OS Login')
                .withCertificateLevelSync("QUALIFIED") // Certificate level can either be "QUALIFIED" or "ADVANCED"
                .initiateAuthenticationSync();
*/
            return resolve({
                challengeID: verificationCode,
                sessionHash: targetArray.toString(),
                sessionId: sessionId
            });
        });
    };

    var _signInitSmartId = function (topicId, voteId, userId, voteOptions, pid, countryCode, transaction) {
        return _createUserBdoc(topicId, voteId, userId, voteOptions, transaction)
            .then(function (bdoc) {
                return _signature(pid, countryCode, bdoc);
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
                    if (data.result) {
                        if (data.result.endResult === 'OK') {
                            if (data.cert) {                                
                                var cert = _setCert(data.cert.value);
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
        statusSign: _statusSign,
        createUserBdoc: _createUserBdoc,
        status: _status,
        statusAuth: _statusAuth,
        getVerificationCode: _getVerificationCode
    };
}

module.exports = CosSmartId;
