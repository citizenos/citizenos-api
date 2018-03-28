'use strict';

var Promise = require('bluebird');
var soap = require('soap');
var crypto = require('crypto');

/**
 * DigiDocService (DDS) client implementation
 *
 * First implemented for DigiDocService version 3.8.1.
 *
 * @param {string} serviceWsdlUrl DDS service WSDL url
 * @param {string} serviceName Used only in case of mobile-ID. Defined between you and SK when signing the service contract
 * @param {string} token Service access token sent for Bearer authorization. Not required by SK by default, but we use it for the proxy to verify that our app is using it and random people are not proxying through
 *
 * @constructor
 *
 * @see {@link http://id.ee/?lang=en&id=30469} ID.ee developer documentation
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification
 */
var DigiDocServiceClient = function (serviceWsdlUrl, serviceName, token) {
    this.serviceWsdlUrl = serviceWsdlUrl;
    this.serviceName = serviceName;
    this.token = token;

    // Forces SOAP Client to ignore service url inside the WSDL. The trick is that we use proxy and we want to go through that proxy
    // BUT - this may brake in case service url does not conform to standard.
    this.soapClientCreateOptions = { // https://github.com/vpulim/node-soap#soapcreateclienturl-options-callback---create-a-new-soap-client-from-a-wsdl-url-also-supports-a-local-filesystem-path
        endpoint: serviceWsdlUrl.match(/^(([a-z]+:\/\/)?[^/]+\/).*$/)[1]
    };

    // Support for Bearer authorization. SK does not want this, but my SK proxy does.
    if (token) {
        this.soapClientCreateOptions.wsdl_headers = {
            'Authorization': 'Bearer ' + token
        };
    }

    this.soapClient = null;
    this.ddsSesscode = null;

    this.documentFormat = null;
};

DigiDocServiceClient.SoapFault = function (code, message) {
    this.name = this.constructor.name;
    this.message = message;
    this.code = code;
};
DigiDocServiceClient.SoapFault.prototype = new Error();

/**
 * Supported document formats
 *
 * @type {{DDOC: {name: string, version: string, digestType: string}, BDOC: {name: string, version: string, digestType: string}}}
 */
DigiDocServiceClient.DOCUMENT_FORMATS = {
    DDOC: {
        name: 'DIGIDOC-XML',
        version: '1.3',
        digestType: 'sha1',
        encoding: 'base64'
    },
    BDOC: {
        name: 'BDOC',
        version: '2.1',
        digestType: 'sha256',
        encoding: 'base64'
    }
};

/**
 * Supported content types
 *
 * @type {{HASHCODE: string, EMBEDDED_BASE64: string}}
 */
DigiDocServiceClient.CONTENT_TYPES = {
    HASHCODE: 'HASHCODE',
    EMBEDDED_BASE64: 'EMBEDDED_BASE64'
};


/**
 * Supported messaging modes (MessagingMode)
 *
 * @type {{ASYNCH_CLIENT_SERVER: string, ASYNCH_SERVER_SERVER: string}}
 */
DigiDocServiceClient.MESSAGING_MODES = {
    ASYNCH_CLIENT_SERVER: 'asynchClientServer',
    ASYNCH_SERVER_SERVER: 'asynchServerServer'
};

/**
 * Start DDS transaction (StartSession)
 *
 * In most cases the transaction with the service is started using the StartSession
 * method. It possible to also send data files with this operation; such files will be
 * stored in session and can be operated on later. More precisely, there are 3
 * different ways to use StartSession:
 *
 * 1) The request can contain a DigiDoc or BDOC container. This is useful for
 * signing and verifying existing containers, for adding or removing data files
 * from the container, and also for extracting data file contents. To use this
 * option, use the “SigDocXML” parameter. (Conversely, the “datafile”
 * parameter should be left empty.)
 *
 * 2) A session can also be started without any data files. This is useful for
 * example for creating new BDOC containers (which can be accomplished
 * by invoking the “CreateSignedDoc” operation next). In this case, both
 * parameters should be empty: “SigDocXML” and “datafile”.
 *
 * 3) There is also an option for creating DigiDoc containers directly from this
 * operation (this option only works for DigiDoc containers; BDOC can be
 * created with the “CreateSignedDoc” operation). To use this operation,
 * “SigDocXML” parameter should be empty, “datafile” parameter should be
 * filled.
 *
 * In the course of the StartSession’s query a unique session identifier is returned,
 * which should be added to every procedure called within the transaction.
 *
 *
 * @param {string} [signingProfile] This value is currently ignored and may be empty.
 * @param {string} [sigDocXml] BDOC or DDOC document. A DigiDoc in XML transformed to HTML-Escaped format. For example “<DataFile>” should be transformed to „&lt;DataFile&gt;“. The container in BDOC format should be coded to BASE64 before it is delivered to the service.
 * @param {boolean} [bHoldSession=false] A flag that indicates whether the data sent within the StartSession should be stored or the session should be closed deleting all the temporary files straight after response. The default value is “false”.
 * @param {DataFile} [datafile] Given parameter enables to send to service a data file within the StartSession request. Based on the file a DigiDoc container is created. (The BDOC format is not supported in this use case – please see the “CreateSignedDoc” operation). For example, when sending a “cv.pdf”, a “cv.ddoc” is created which contains the “cv.pdf“ only. The structure of a datafile element is described in chapter 9.3. While adding the datafile it’s unnecessary to determine the identifier. By default, DIGIDOC-XML 1.3 format fis created.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.1
 */
DigiDocServiceClient.prototype.startSession = function (signingProfile, sigDocXml, bHoldSession, datafile) {
    if (this.soapClient) {
        throw new Error('DDS session already started by calling startSession or the session has been closed by calling closeSession');
    }

    var that = this;

    return new Promise(function (resolve, reject) {
        soap.createClient(that.serviceWsdlUrl, that.soapClientCreateOptions, function (err, soapClient) {
            if (err) {
                return reject(err);
            }

            that.soapClient = soapClient;

            if (that.token) {
                soapClient.setSecurity(new soap.BearerSecurity(that.token));
            }

            // Datafile is only supported by DDOC, so lets set the format accordingly
            if (datafile) {
                that.documentFormat = DigiDocServiceClient.DOCUMENT_FORMATS.DDOC;
            }

            // Sesscode already set by calling setSesscode, so we use it and no need to call StartSession
            if (that.ddsSesscode) {
                return resolve();
            }

            var requestData = {
                SigningProfile: signingProfile,
                SigDocXML: sigDocXml,
                bHoldSession: bHoldSession,
                datafile: datafile
            };

            return that._performSoapRequest('StartSession', requestData)
                .spread(function (result, soapResponse, soapHeader, soapRequest) {
                    that.ddsSesscode = result.Sesscode.$value;

                    return resolve([result, soapResponse, soapHeader, soapRequest]);
                });
        });
    });
};

/**
 * Check certificate (CheckCertificate)
 *
 * Given method can be used to check the validity of certificates (including ID-card and other smartcard certificates and also digital stamp certificates issued by AS Sertifitseerimiskeskus) and number of foreign Certification Authorities. Additional info is available from the sales department of Sertifitseerimiskeskus.
 *
 * Additionally, this operation returns the values of the most important fields from the certificate.
 *
 * @param {string} certificate Certificate to be checked for validity, in Base64 format. May include „---BEGIN CERTIFICATE---„ and „---END CERTIFICATE---„ lines (according to PEM format)
 * @param {boolean} [returnRevocationData=false] If TRUE, certificate’s validity information is returned on RevocationData field in response.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 7.3
 */
DigiDocServiceClient.prototype.checkCertificate = function (certificate, returnRevocationData) {
    if (!certificate) {
        throw new Error('Certificate is required when calling CheckCertificate');
    }
    if (!returnRevocationData) {
        returnRevocationData = false;
    }

    var requestData = {
        Certificate: certificate,
        ReturnRevocationData: returnRevocationData
    };

    if (!this.soapClient) {
        var that = this;

        return new Promise(function (resolve, reject) {
            soap.createClient(that.serviceWsdlUrl, that.soapClientCreateOptions, function (err, soapClient) {
                if (err) {
                    return reject(err);
                }

                that.soapClient = soapClient;

                if (that.token) {
                    soapClient.setSecurity(new soap.BearerSecurity(that.token));
                }

                that
                    ._performSoapRequest('CheckCertificate', requestData)
                    .then(resolve, reject);
            });
        });
    } else {
        return this._performSoapRequest('CheckCertificate', requestData);
    }
};

/**
 * Get mobile certificate info (GetMobileCertificate)
 *
 * @param {string} iDCode Personal Identification Code of the user
 * @param {string} [countryCode] Country of origin. ISO 3166-type 2-character country codes are used (e.g. EE)
 * @param {string} phoneNo User's phone number with country code in form +xxxxxxxxx (e.g. +3706234566). If both PhoneNo and IDCode parameters are given, correspondence between personal code and phone number is verified and in case of inconsistency SOAP error code 301 is returned. If the element "PhoneNo" has been set, the country attribute set in the prefix is used (independent on the value of the element "Country").
 * @param {string} returnCertData Determines whether and which certificate(s) to return in the response (status info is returned in any case):
 * * auth – request for default authentication certificate;
 * * authRSA – request for authentication RSA certificate, if available;
 * * authECC – request for authentication ECC certificate, if available;
 * * sign – request for default certificate for digital signing;
 * * signRSA – request for RSA certificate for digital signing, if available; signECC – request for ECC certificate for digital signing, if available;
 * * both – request for both (authentication and digital signing) default certificates;
 * * bothRSA – both RSA certificates; "bothECC" – both ECC certificates;
 * * "none – none.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see http://sk-eid.github.io/dds-documentation/api/api_docs/#getmobilecertificate
 */

DigiDocServiceClient.prototype.getMobileCertificate = function (iDCode, countryCode, phoneNo, returnCertData) {
    if (!iDCode) {
        throw new Error('idCode is required when calling GetMobileCertificate');
    }

    if (!phoneNo) {
        throw new Error('phoneNo is required when calling GetMobileCertificate');
    }

    if (!returnCertData) {
        throw new Error('returnCertData is required when calling GetMobileCertificate');
    }

    var requestData = {
        IDCode: iDCode,
        PhoneNo: phoneNo,
        ReturnCertData: returnCertData
    };

    if (countryCode) {
        requestData.Country = countryCode;
    }

    if (!this.soapClient) {
        var that = this;

        return new Promise(function (resolve, reject) {
            soap.createClient(that.serviceWsdlUrl, that.soapClientCreateOptions, function (err, soapClient) {
                if (err) {
                    return reject(err);
                }

                that.soapClient = soapClient;

                if (that.token) {
                    soapClient.setSecurity(new soap.BearerSecurity(that.token));
                }

                that
                    ._performSoapRequest('GetMobileCertificate', requestData)
                    .then(resolve, reject);
            });
        });
    } else {
        return this._performSoapRequest('GetMobileCertificate', requestData);
    }
};

/**
 * Start mobile authentication (MobileAuthenticate)
 *
 * Query for starting authentication session.
 * First, certificate validity of the user’s authentication certificate is verified. In case the certificate is valid, an authentication message is passed to the user’s mobilephone.
 * Otherwise, error message is returned. The resulting response to the query contains information about the user, transaction ID and optionally user’s certificate for authentication and certificate validity information.
 *
 * @param {string} iDCode Personal Identification Code of the user. It is recommended to use both input parameters IDCode and PhoneNo! In case of Lithuanian Mobile-ID both IDCode and PhoneNo are mandatory.
 * @param {string} [countryCode] Country of origin. ISO 3166-type 2-character country codes are used (e.g. EE)
 * @param {string} phoneNo User’s phone number with country code in form +xxxxxxxxx (e.g. +3706234566).. If both PhoneNo and IDCode parameters are given, correspondence between personal code and phone number is verified and in case of inconsistency SOAP error code 301 is returned. It is recommended to use both input parameters IDCode and PhoneNo! In case of Lithuanian Mobile-ID users IDCode and PhoneNo are BOTH mandatory. (see chapter 5.2). If the element "PhoneNo" has been set, the country attribute set in the prefix is used (independent on the value of the element "CountryCode").
 * @param {string} language Language for user dialog in mobile phone. 3-letter capitalized acronyms are used. Possible values: EST, ENG, RUS, LIT
 * @param {string} [messageToDisplay] Text displayed in addition to ServiceName and before asking authentication PIN. Maximum length is 40 bytes. In case of Latin letters, this means also a 40 character long text, but Cyrillic characters may be encoded by two bytes and you will not be able to send more than 20 symbols.
 * @param {string} spChallenge 10-byte random challenge generated by the Application Provider witch would be part of the message for signing by user during authentication. In HEX form. NB! For security reasons it is recommended to always fill this field with a different random value every time. When authentication succeeds, it is recommended to verify that the user signed a message that contains this challenge value. (For more information about signature verification, see the description of the “Signature” element for the “GetMobileAuthenticateStatus” operation.)
 * @param {string} messagingMode Determines the mode how the response of the MobileAuthenticate is returned. Following modes are supported: - “asynchClientServer” – Some additional status request are made after MobileAuthenticate request by the Application Provider - “asynchServerServer” – the response will be sent to the Application Provider by in asynchronous mode (see: parameter AsyncConfiguration)
 * @param {number} [asyncConfiguration] This parameter is required when using “asynchServerServer” messaging mode and identifies configuration mode. This value has to be previously agreed. Currently, Java Message Services (JMS) interface is supported.
 * @param {boolean} [returnCertData=false] If “TRUE”, certificate of the user is returned. Certificate is useful if AP wants to save it and/or independently verify correctness of the signature and validation data.
 * @param {boolean} [returnRevocationData=false] If „TRUE“, OCSP response to the certificate validity query is returned.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 7.1
 */
DigiDocServiceClient.prototype.mobileAuthenticate = function (iDCode, countryCode, phoneNo, language, messageToDisplay, spChallenge, messagingMode, asyncConfiguration, returnCertData, returnRevocationData) {
    var requestData = {
        IDCode: iDCode,
        CountryCode: countryCode,
        PhoneNo: phoneNo,
        Language: language,
        ServiceName: this.serviceName,
        MessageToDisplay: messageToDisplay,
        SPChallenge: spChallenge,
        MessagingMode: messagingMode,
        AsyncConfiguration: asyncConfiguration,
        ReturnCertData: returnCertData,
        ReturnRevocationData: returnRevocationData
    };


    if (!this.soapClient) {
        var that = this;

        return new Promise(function (resolve, reject) {
            soap.createClient(that.serviceWsdlUrl, that.soapClientCreateOptions, function (err, soapClient) {
                if (err) {
                    return reject(err);
                }

                that.soapClient = soapClient;

                if (that.token) {
                    soapClient.setSecurity(new soap.BearerSecurity(that.token));
                }

                that
                    ._performSoapRequest('MobileAuthenticate', requestData)
                    .then(resolve, reject);
            });
        });
    } else {
        return this._performSoapRequest('MobileAuthenticate', requestData);
    }
};

/**
 * Get mobile authentication status (GetMobileAuthenticateStatus)
 *
 * This method is relevant when asynchClientServer messaging mode is used
 *
 * @param {number} sesscode Session identifier – use the value returned with MobileAuthenticate method
 * @param {boolean} waitSignature "If “TRUE“, then the Service will wait for a response from MSSP before responding. If “FALSE” then response is returned immediately and the application should invoke GetMobileAuthenticate again after a small delay (2-10 seconds).
 *
 * @returns {Promise} SOAP response
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 7.2
 */
DigiDocServiceClient.prototype.getMobileAuthenticateStatus = function (sesscode, waitSignature) {
    var requestData = {
        Sesscode: sesscode,
        WaitSignature: waitSignature
    };

    if (!this.soapClient) {
        var that = this;

        return new Promise(function (resolve, reject) {
            soap.createClient(that.serviceWsdlUrl, that.soapClientCreateOptions, function (err, soapClient) {
                if (err) {
                    return reject(err);
                }

                that.soapClient = soapClient;

                if (that.token) {
                    soapClient.setSecurity(new soap.BearerSecurity(that.token));
                }

                that
                    ._performSoapRequest('GetMobileAuthenticateStatus', requestData)
                    .then(resolve, reject);
            });
        });
    } else {
        return this._performSoapRequest('GetMobileAuthenticateStatus', requestData);
    }
};

/**
 * Create a signed doc (CreateSignedDoc)
 *
 * If an application desires to define the format and version of the formed
 * container, the CreateSignedDoc request will be used for creating a new
 * container. After the CreateSignedDoc request takes place the AddDataFile
 * request for adding the data. Now the file is ready for digital signing.
 *
 * @param {string} format A format of a document container to be created (currently supported formats are DIGIDOC-XML 1.3 and BDOC 2.1).
 * @param {string} version A version number of the format of a creatable document container (currently the supported versions for DIGIDOC-XML is 1.3 and BDOC 2.1).
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.3
 */
DigiDocServiceClient.prototype.createSignedDoc = function (format, version) {
    format = DigiDocServiceClient.DOCUMENT_FORMATS[format];

    if (!format || format.version !== version) {
        throw new Error('Invalid document format/version combination provided.');
    }

    if (this.documentFormat && this.documentFormat.name !== format) {
        throw new Error('Document format already defined by calling startSession with "datafile" parameter which makes it a DDOC type');
    }

    this.documentFormat = format;

    var requestData = {
        Sesscode: this.ddsSesscode,
        Format: format.name,
        Version: format.version
    };

    return this._performSoapRequest('CreateSignedDoc', requestData);
};

/**
 * Add a file to the container (AddDataFile)
 *
 * AddDataFile request enables to add an additional data file to a DigiDoc container
 * which is in session. If one datafile is added within the StartSession, but the user
 * would like to sign a few more data files in a DigiDoc container, then using this
 * method the rest of the data files will be added before signing. The size limit of 4
 * MB applies for DigiDoc containers and datafiles sent to Service. For bigger files
 * content type HASHCODE could be used. See description below.
 * NB! Adding a data file is possible in the DigiDoc file with no signatures only.
 *
 *
 * @param {string} fileName Name of the data file without the path.
 * @param {string} mimeType Type of the datafile.
 * @param {string} contentType Data file’s content type (HASHCODE, EMBEDDED_BASE64) HASHCODE – To service is sent the hashcode only, not the entire data file’s content. The  method how to calculate the hashcode is described in parameter DigestType and the hashcode itself is in parameter DigestValue.Please see section 8.1. how to calculate hash from the source data file and how to send it to the service.EMBEDDED_BASE64 – The content of the file is in Base64 encoding in Content parameter.
 * @param {number} size The actual size of data file in bytes.
 * @param {string} [digestType] Hash code type of the data file. In case of  DIGIDOC-XML format, "sha1" is supported; in case of BDOC, "sha256" is supported. Required in case of HASHCODE content type of file only
 * @param {string} [digestValue] The value of data file’s hash in Base64 encoding.. Required for HASHCODE content type only. In case of the DIGIDOC-XML format, the hash is calculated over a DigiDoc <Datafile> element, using a canonicalized form (for more  information, see chapter 8.1). In case of BDOC, the has is calculated over the binary data file content.
 * @param {string} [attributes] Arbitrary amount of other attributes (meta data), what’s add to <Datafile> element in DigiDoc file as attributes (in form <name>="<value>").
 * @param {string} content The content of data file in Base64 encoding, is set if ContentType is EMBEDDED_BASE64.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.4
 */
DigiDocServiceClient.prototype.addDataFile = function (fileName, mimeType, contentType, size, digestType, digestValue, attributes, content) {
    var requestData = {
        Sesscode: this.ddsSesscode,
        FileName: fileName,
        MimeType: mimeType,
        ContentType: contentType,
        Size: size,
        DigestType: digestType,
        DigestValue: digestValue,
        Attributes: attributes,
        Content: content
    };

    return this._performSoapRequest('AddDataFile', requestData);
};

/**
 * RemoveDataFile request is for removing datafile from DigiDoc container.
 * NB! Removing datafile is allowed when container to not have any signature.
 * If container has one or more signatures, removing datafile is not possible.
 *
 * @param {string} dataFieldId Anidentifier of a data file. In Dxx format, where xx stands for the sequence number. DataFileId is readable in SignedDocInfo structure. The structure is returned to the user of the service as a result of the StartSession or GetSignedDocInfo request.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.4
 */
DigiDocServiceClient.prototype.removeDataFile = function (dataFieldId) {
    var requestData = {
        Sesscode: this.ddsSesscode,
        DataFileId: dataFieldId
    };

    return this._performSoapRequest('RemoveDataFile', requestData);
};

/**
 * Add data file in HASHCODE mode
 *
 * Simplification on top of the {@link DigiDocServiceClient.prototype.addDataFile}
 *
 * @param {Stream.Readable} readableStream Readable stream of data to add as a file
 * @param {string} fileName Name of the data file without the path.
 * @param {string} mimeType Type of the datafile.
 *
 * @returns {Promise} SOAP response
 */
DigiDocServiceClient.prototype.addDataFileHashcode = function (readableStream, fileName, mimeType) {
    if (!this.documentFormat) {
        throw new Error('Format needs to be defined. Format is set by calling createSignedDoc OR createSession with "datafile" parameter');
    }

    var digestType = this.documentFormat.digestType;
    var encoding = this.documentFormat.encoding;

    var that = this;

    return this._getHash(readableStream, digestType, encoding)
        .spread(function (digestValue, size) {
            return that.addDataFile(fileName, mimeType, DigiDocServiceClient.CONTENT_TYPES.HASHCODE, size, digestType, digestValue);
        });
};

/**
 * Add data file in EMBEDDED_BASE64 mode
 *
 * Simplification on top of the {@link DigiDocServiceClient.prototype.addDataFile}
 *
 * @param {Stream.Readable} readableStream Readable stream of data to add as a file
 * @param {string} fileName Name of the data file without the path.
 * @param {string} mimeType Type of the datafile.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 */
DigiDocServiceClient.prototype.addDataFileEmbeddedBase64 = function (readableStream, fileName, mimeType) {
    if (!this.documentFormat) {
        throw new Error('Format needs to be defined. Format is set by calling createSignedDoc OR createSession with "datafile" parameter');
    }

    var that = this;

    return this._getEncodedString(readableStream, 'base64')
        .spread(function (content, size) {
            return that.addDataFile(fileName, mimeType, DigiDocServiceClient.CONTENT_TYPES.EMBEDDED_BASE64, size, null, null, null, content);
        });
};

/**
 * Prepare signature (PrepareSignature)
 *
 * The request is used for digital signing preparation if signing with smartcard.
 * As a result of the request a new so called half-done signature is added to the
 * DigiDoc container in session and the unique identifier of the signature and the
 * hash to be signed is returned. The hash should be forwarded to the signing
 * module of the user’s computer.
 *
 * @param {string} signersCertificate Signer’s certificate transferred to HEX string format (from binary (DER) format). Mostly the signing software (signing component) in the user’s computer delivers the certificate in a proper format.
 * @param {string} signersTokenId Identifier of the private key’s slot on a smartcard. The signing software defines it’s value within reading the signer’s certificate and forwards it to the signing application.
 * @param {string} [role] The text of the role or resolution defined by the user.
 * @param {string} [city] Name of the city, where it’s signed.
 * @param {string} [state] Name of the state, where it’s signed.
 * @param {string} [postalCode] Postal code of the signing location.
 * @param {string} [country] Name of the country, where it’s signed.
 * @param {string} [signingProfile] “LT_TM" (Long Term with Time Mark): a profile for BDOC-TM (a BDOC signature with time-mark) and DDOC. “LT_TM” is currently the default option. “LT” (Long Term): Used for creating standard BDOC-TS (BDOC with timestamp / ASiC-E) signatures. Currently it is a reserved value that simply returns the error code 101 with the following message: “BDOC-TS signature format is not supported in the current service version. For signing BDOC files with Mobile-ID, please use BDOC-TM
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.16
 */
DigiDocServiceClient.prototype.prepareSignature = function (signersCertificate, signersTokenId, role, city, state, postalCode, country, signingProfile) {
    var requestData = {
        Sesscode: this.ddsSesscode,
        SignersCertificate: signersCertificate,
        SignersTokenId: signersTokenId,
        Role: role,
        City: city,
        State: state,
        PostalCode: postalCode,
        Country: country,
        SigningProfile: signingProfile
    };

    return this._performSoapRequest('PrepareSignature', requestData);
};

/**
 * Finalize signature (FinalizeSignature)
 *
 * The request is used for finalizing the digital signing while signing with smartcard.
 * With FinalizeSignature request the signature prepared at PrepareSignature step
 * is finished. A digitally signed signature is added to DigiDoc file and an OCSP
 * validity confirmation is taken.
 *
 * @param {string} signatureId The unique identifier of the signature which was returned as the result of PrepareSignature method.
 * @param {string} signatureValue Value of the signature (signed hash) as a HEX string. The signing software returns the value.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.17
 */
DigiDocServiceClient.prototype.finalizeSignature = function (signatureId, signatureValue) {
    var requestData = {
        Sesscode: this.ddsSesscode,
        SignatureId: signatureId,
        SignatureValue: signatureValue
    };

    return this._performSoapRequest('FinalizeSignature', requestData);
};


/**
 * Mobile sign (MobileSign)
 *
 * @param {string} signerIDCode Identification number of the signer (personal national ID number). It is recommended to use both input parameters IDCode and PhoneNo! In case of Lithuanian Mobile-ID users SignerIDCode and SignerPhoneNo are mandatory.
 * @param {string} [signersCountry} Country which issued the personal national ID number in ISO 3166-style 2-character format (e.g. “EE”)
 * @param {string} signerPhoneNo Phone number of the signer with the country code in format +xxxxxxxxx (for example +3706234566). If both SignerPhoneNo and SignerIDCode parameters are given, correspondence between personal code and phone number is verified and in case of inconsistency SOAP error code 301 is returned. It is recommended to use both input parameters IDCode and PhoneNo! In case of Lithuanian Mobile-ID users SignerIDCode and SignerPhoneNo are mandatory (see chapter 5.2) . If the element "SignerPhoneNo" has been set, the country attribute set in the prefix is used (independent on the value of the element "SignersCountry").
 * @param {string} [additionalDataToBeDisplayed] Additional text shown to the signer. Optional. Maximum length is 40 bytes. In case of Latin letters, this means also a 40 character long text, but Cyrillic characters may be encoded by two bytes and you will not be able to send more than 20 symbols.
 * @param {string} language Language of the message displayed to the signer’s phone. ISO 639 a 3-character-code in uppercase is used (for example EST, ENG, RUS, LIT).
 * @param {string} [role] The text of the role or resolution defined by the user. Optional.
 * @param {string} [city] Name of the city, where it’s signed. Optional
 * @param {string} [stateOrProvince] Name of the state/province, where it’s signed. Optional.
 * @param {string} [postalCode] Postal code of the signing location. Optional.
 * @param {string} [countryName] Name of the country, where it’s signed. Optional.
 * @param {string} [signingProfile] “LT_TM" (Long Term with Time Mark): a profile for BDOC-TM (a BDOC signature with time-mark) and DDOC. “LT_TM” is currently the default option. “LT” (Long Term): Used for creating standard BDOC-TS (BDOC with timestamp / ASiC-E) signatures. Currently it is a reserved value that simply returns the error code 101 with the following message: “BDOC-TS signature format is not supported in the current service version. For signing BDOC files with Mobile-ID, please use BDOC-TM
 * @param {string} messagingMode Determines the mode how the response of the MobileSign is returned. Following modes are supported: - “asynchClientServer” – Some additional status request are made after MobileSign request by the Application Provider - “asynchServerServer” – After signing or in case of an error the server sends a request to the client-application . The client application should be capable to act in server mode to recieve the signature information request according to the parameters in AsyncConfiguration parameter
 * @param {number} asyncConfiguration Determines configuration used in asynchServerServer messaging mode. This shall be agreed previously between Application Provider and DigiDocService provider
 * @param {boolean} returnDocInfo If the value is true, the DigiDoc file information is returned as a result of the request.
 * @param {boolean} returnDocData If the value is true, the DigiDoc file information is returned as a result of the request.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.5
 */

DigiDocServiceClient.prototype.mobileSign = function (signerIDCode, signersCountry, signerPhoneNo, additionalDataToBeDisplayed, language, role, city, stateOrProvince, postalCode, countryName, signingProfile, messagingMode, asyncConfiguration, returnDocInfo, returnDocData) {
    var requestData = {
        Sesscode: this.ddsSesscode,
        ServiceName: this.serviceName,
        SignerIDCode: signerIDCode,
        SignersCountry: signersCountry,
        SignerPhoneNo: signerPhoneNo,
        AdditionalDataToBeDisplayed: additionalDataToBeDisplayed,
        Language: language,
        Role: role,
        City: city,
        StateOrProvince: stateOrProvince,
        PostalCode: postalCode,
        CountryName: countryName,
        SigningProfile: signingProfile,
        MessagingMode: messagingMode,
        AsyncConfiguration: asyncConfiguration,
        ReturnDocInfo: returnDocInfo,
        ReturnDocData: returnDocData
    };

    return this._performSoapRequest('MobileSign', requestData);
};

/**
 * Get status info (GetStatusInfo)
 *
 * @param {boolean} returnDocInfo If the value is „true”, in response SignedDocInfo is
 * @param {boolean} waitSignature If the value is „true“, response is not sent before message from mobile phone is received or error condition is detected. If the value is “false”, the response is returned immediately and the GetStatusInfo invocation should be repeated after a short time interval (2-10 seconds).
 *
 * @returns {Promise} SOAP response
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification p 8.6
 */
DigiDocServiceClient.prototype.getStatusInfo = function (returnDocInfo, waitSignature) {
    var requestData = {
        Sesscode: this.ddsSesscode,
        ReturnDocInfo: returnDocInfo,
        WaitSignature: waitSignature
    };

    return this._performSoapRequest('GetStatusInfo', requestData);
};

/**
 * Get the signed container (GetSignedDoc)
 *
 * A signed document is returned from the webservice within the GetSignedDoc
 * request. The content of the document is in HTMLencoded format. If there’s a will
 * to receive the document information in structured format in addition to signed
 * document, the GetSignedDocInfo request should be used.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.8
 */
DigiDocServiceClient.prototype.getSignedDoc = function () {
    var requestData = {
        Sesscode: this.ddsSesscode
    };

    return this._performSoapRequest('GetSignedDoc', requestData);
};

/**
 * Get the signed document info - metadata and the contents itself (GetSignedDocInfo)
 *
 * The GetSignedDocInfo method shall be used to retrieve status information and the actual (signed) document from the current signing session.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.7
 */
DigiDocServiceClient.prototype.getSignedDocInfo = function () {
    var requestData = {
        Sesscode: this.ddsSesscode
    };

    return this._performSoapRequest('GetSignedDocInfo', requestData);
};

/**
 * Close the session (CloseSession)
 *
 * A transaction is closed by the CloseSession request. As the result of the request
 * all the information stored in the server within this session will be deleted. To start
 * a new session a StartSession request should be sent once again. It’s always
 * recommended to close a transaction with the CloseSession request. If the
 * application doesn’t close the session itself, it will be closed automatically after
 * timeout.
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @see {@link https://www.sk.ee/upload/files/DigiDocService_spec_eng.pdf} DigiDocService specification 8.2
 */
DigiDocServiceClient.prototype.closeSession = function () {
    var requestData = {
        Sesscode: this.ddsSesscode
    };

    var that = this;

    return this._performSoapRequest('CloseSession', requestData)
        .then(function (results) {
            that.ddsSesscode = null;
            that.soapClient = null;
            that.documentFormat = null;

            return Promise.resolve(results);
        });
};

/**
 * Set the DDS session code to use for next calls calls
 *
 * @param {string} sesscode An identifier of the active session to use for the next DDS requests
 *
 * @returns {void}
 */
DigiDocServiceClient.prototype.setSesscode = function (sesscode) {
    this.ddsSesscode = sesscode;
};


/**
 * Get the Sesscode
 *
 * @returns {null|string} DDS session code or null if not initialized
 */
DigiDocServiceClient.prototype.getSesscode = function () {
    return this.ddsSesscode;
};

/**
 * Perform actual SOAP request
 *
 * @param {string} soapMethodName DDS SOAP method name to call (StartSession, AddDataFile....)
 * @param {Object} [requestData=null] SOAP request data
 *
 * @returns {Promise} <Promise<Array<Object,String,Object,String>> Make sure to use .spread()
 *
 * @private
 */
DigiDocServiceClient.prototype._performSoapRequest = function (soapMethodName, requestData) {
    if (!this.soapClient) {
        throw new Error('DDS service has not been initialized properly. Please call startSession() to initialize.');
    }

    var that = this;

    return new Promise(function (resolve, reject) {
        that.soapClient[soapMethodName](requestData, function (err, result, soapResponse, soapHeader) {
            if (err) {
                if (result && result.body) {
                    var errorInfo = result.body.match(/<faultstring.*?>([0-9]{3})<.*?<message>([^<]*)<\/message>/);

                    if (!errorInfo || !errorInfo.length) {
                        return reject(new Error('Invalid response from DigiDocService'));
                    }
                    var errorCode = parseInt(errorInfo[1], 10);
                    var errorMessage = errorInfo[2];

                    return reject(new DigiDocServiceClient.SoapFault(errorCode, errorMessage));
                } else {
                    return reject(err); // Don't hide non SOAP faults
                }
            }

            return resolve([result, soapResponse, soapHeader, that.soapClient.lastRequest]);
        });
    });
};

/**
 * Get hash in specified encoding or as a Buffer in specified encoding and original data length in bytes
 *
 * @param {Stream.Readable} readableStream Readable stream to hash.
 * @param {string} algorithm Hashing algorithm used (sha1, md5, sha256) and passed to crypto.createHash.
 * @param {string} [encoding=null] Encoding in which the result is returned. One of 'hex', 'binary' or 'base64'.
 *
 * @returns {Promise<Array<String|Buffer, number>>} IF no {@link encoding} is provided, buffer is returned. Use .spread().
 *
 * @see {@link https://nodejs.org/docs/latest-v0.12.x/api/all.html#all_crypto_createhash_algorithm}
 * @see {@link https://nodejs.org/docs/latest-v0.12.x/api/all.html#all_hash_digest_encoding}
 *
 * @private
 */
DigiDocServiceClient.prototype._getHash = function (readableStream, algorithm, encoding) {
    var sum = crypto.createHash(algorithm);

    return new Promise(function (resolve, reject) {
        var length = 0;

        readableStream.on('data', function (d) {
            length += d.length;
            sum.update(d);
        });

        readableStream.on('end', function () {
            var d = sum.digest(encoding);

            return resolve([d, length]);
        });

        readableStream.on('error', reject);
    });
};

/**
 * Get hash in specified encoding or as a Buffer in specified encoding and original data length in bytes
 *
 * TODO: Make it streaming, right now it buffers all the content to the memory
 *
 * @param {Stream.Readable} readableStream Readable stream to hash.
 * @param {string} encoding Encoding in which the result is returned. One of 'hex', 'binary' or 'base64'.
 *
 * @returns {Promise<Array<String, number>>} Encoded string and it's length
 *
 * @private
 */
DigiDocServiceClient.prototype._getEncodedString = function (readableStream, encoding) {
    return new Promise(function (resolve, reject) {
        var buf;
        var length = 0;

        readableStream.on('data', function (d) {
            if (typeof d === 'string') { // Mu2 streams send mixed Buffers and Strings as data event parameter
                d = new Buffer(d);
            }

            length += d.length;
            if (!buf) {
                buf = d;
            } else {
                buf = Buffer.concat([buf, d]);
            }
        });

        readableStream.on('end', function () {
            return resolve([buf.toString(encoding), length]);
        });

        readableStream.on('error', reject);
    });
};

module.exports = DigiDocServiceClient;
