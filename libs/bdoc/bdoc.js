'use strict';

var archiver = require('archiver');
var crypto = require('crypto');
var xmlbuilder = require('xmlbuilder');
var encoder = require('utf8');
var fs = require('fs');
var moment = require('moment');
var _ = require('lodash');
var openssl = require('openssl-nodejs');
var xadesjs = require('xadesjs');
var Pkijs = require('pkijs');
var Asn1js = require('asn1js');
var Certificate = Pkijs.Certificate;
var asn1js = require('asn1js');

/**
 * BDOC
 *
 * For creating BDOC containers
 *
 * @param {Stream.Writable} writableStream Writable stream
 *
 * @see {@link http://www.id.ee/public/bdoc-spec21.pdf} BDOC Spec
 * @see {@link https://github.com/archiverjs/node-archiver} Node-archiver
 */

var Bdoc = function (docPath) {
    var that = this;
    var randomName = Math.random().toString(36).substring(7);
    this.path = docPath || 'tmp/'+randomName+'.bdoc';
    //console.log(this.path);
    this.containerBdocFileStream = fs.createWriteStream(this.path);
    this.containerBdocFileStream.on('error', function (err) {
        console.log('_getFinalBdoc', 'Adding files to final BDOC FAILED', err);
        throw err;
    });

    this.archive = archiver('zip', {store: true});
    this.archive.pipe(this.containerBdocFileStream);
    this.dataToSign;
    // Add compulsory 'mimetype' file
    this.archive.append('application/vnd.etsi.asic-e+zip', {name: 'mimetype'});

    // META-INF/manifest.xml
    this.manifestFileHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' +
        '\n<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">' +
        '\n    <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.etsi.asic-e+zip"/>';
    this.manifestFileInfoTemplate = '\n    <manifest:file-entry manifest:full-path="{{name}}" manifest:media-type="{{mimeType}}"/>';
    this.manifestFileFooter = '\n</manifest:manifest>';
    this.manifestFileContents = this.manifestFileHeader;
    // Keep files info for signature XML
    this.filesList = [];
    this.signatureCount = 0;
    this.dataToSign = '';

    this.configuration = {};

    this._createHash = function (input = '', hashType) {
        input = input.toString('hex') || crypto.randomBytes(20).toString('hex');
        hashType = hashType || 'sha256';

        var hash = crypto.createHash(hashType);

        hash.update(encoder.encode(input));

        return hash.digest('hex');
    };

    this._prepareCert = function (certificate) {
        
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

    this.decodeCert = function (pem) {
        if(typeof pem !== 'string') {
            throw new Error('Expected PEM as string')
        }
    
        // Load certificate in PEM encoding (base64 encoded DER)
        const b64 = pem.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, '')
    
        // Now that we have decoded the cert it's now in DER-encoding
        const der = Buffer(b64, 'base64')
    
        // And massage the cert into a BER encoded one
        const ber = new Uint8Array(der).buffer
    
        // And now Asn1js can decode things \o/
        const asn1 = Asn1js.fromBER(ber)
        console.log(asn1);
        console.log(asn1.result);
        return new Pkijs.Certificate({ schema: asn1.result })
    };

    var OID = {
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

    this.addSigningCertificate = function (certificate) {
        var cert = this.decodeCert(this._prepareCert(certificate));
        var certDigest = crypto.createHash('sha256').update(this._prepareCert(certificate), 'base64').digest('base64');
        var issuer = that.getCertValue('issuer', cert);
        var serialNumber = cert.serialNumber.valueBlock.toString();
        var timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
        var sigPolicyId = {
            'xades:SigPolicyId': {
                'xades:Identifier': {
                    '@Qualifier': 'OIDAsURN',
                    '#text': ' urn:oid:1.3.6.1.4.1.10015.1000.3.2.1'
                }
            }
        };
        var SigPolicyIdXML = xmlbuilder.create(sigPolicyId).end({ pretty: true}).replace('<?xml version="1.0"?>', '').trim();
        var policyDigest = crypto.createHash('sha256').update(SigPolicyIdXML, 'base64').digest('base64');
        var signedDataFileProperties = [];
        that.filesList.forEach(function (file, index) {
            signedDataFileProperties.push({
                '@ObjectReference': '#S0-ref-' + index,
                'xades:MimeType': file.mimeType
            });
        });

        var signedProperties = {
            'xades:SignedProperties': {
                '@Id': 'S'+that.signatureCount+'-SignedProperties',
                'xades:SignedSignatureProperties': {
                    '@Id': 'S'+that.signatureCount+'-SignedSignatureProperties',
                    'xades:SigningTime': timestamp,
                    'xades:SigningCertificate': {
                        'xades:Cert': {
                            'xades:CertDigest': {
                                'ds:DigestMethod': {
                                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256',
                                    '#text': ' '
                                },
                                'ds:DigestValue': certDigest
                            },
                            'xades:IssuerSerial': {
                                'ds:X509IssuerName': issuer,
                                'ds:X509SerialNumber': serialNumber
                            }
                        }
                    },
                    'xades:SignaturePolicyIdentifier': {
                        'xades:SignaturePolicyId': {
                            'xades:SigPolicyId': {
                                'xades:Identifier': {
                                    '@Qualifier': 'OIDAsURN',
                                    '#text': ' urn:oid:1.3.6.1.4.1.10015.1000.3.2.1'
                                }
                            },
                            'xades:SigPolicyHash': {
                                'ds:DigestMethod': {
                                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256',
                                    '#text':' '
                                },
                                'ds:DigestValue': policyDigest
                            },
                            'xades:SigPolicyQualifiers': {
                                'xades:SigPolicyQualifier': {
                                    'xades:SPURI': {
                                        '#text': ' https://www.sk.ee/repository/bdoc-spec21.pdf'
                                    }
                                }
                            }
                        },
                    },
                    'xades:SignatureProductionPlace': ' ',
                    'xades:SignerRole': {
                        'xades:ClaimedRoles': {
                            'xades:ClaimedRole': ''
                        }
                    }
                },
                'xades:SignedDataObjectProperties': {
                    'xades:DataObjectFormat': signedDataFileProperties
                }
            }
        };
    }
    
    this.getCertValue = function (key, cert, splitter) {
        if (!splitter) splitter = ',';
        var res = [];
        cert[key].typesAndValues.forEach(function (typeAndValue) {
            const type = typeAndValue.type;
            const oid = OID[type.toString()];
            const name2 = oid ? oid.short : null;
            res.push(`${name2 ? name2 : type}=${typeAndValue.value.valueBlock.value}`);
        });

        return res.reverse().join(splitter + " ");
    };

    this._pem2Der = function (certificate) {
        var prefix = '-----BEGIN CERTIFICATE-----';
        var postfix = '\n-----END CERTIFICATE-----\n';
        var pemText = certificate.replace(prefix, '').replace(postfix, '');
        return pemText;
    }

    this.getOCSP = function (certificate) {
        return new Promise(function (resolve, reject) {
            var filename = Math.random().toString(36).substring(9) + '.crt';
                fs.writeFile('openssl/'+filename, certificate,function (err) {
                    if (err) throw err;

                    openssl('openssl x509 -noout -ocsp_uri -in ' + filename, function (err, data) {
                        if(err) console.log(err);
                        var ocsp_uri = data.toString();
                        ocsp_uri = 'http://demo.sk.ee/ocsp';
                        openssl('openssl ocsp -issuer libs/bdoc/configuration/test/certs/bundle.crt -cert openssl/'+filename+' -respout openssl/ocsp_'+filename+' -url '+ocsp_uri+' -header "Host"="'+ocsp_uri.replace('http://', '').replace('https://', '')+'"', function (err, data) {
                            console.log('ERROR', err.toString())
                            if (data) {
                                return resolve('openssl/ocsp_'+filename);
                            }
                            
                        });
                    });
                });
        }).then(function (path) {
            return new Promise(function (resolve, reject) {
                fs.readFile(path, function (err, content) {
                    return resolve(content.toString('base64'));
                });
            });
        });
        
    };

    this.getCertData = function (certificate) {
        return new Promise(function (resolve, reject) {
            var certdata = {}
            var filename = Math.random().toString(36).substring(9) + '.crt';
            fs.writeFile('openssl/'+filename, certificate,function (err) {
                if (err) throw err;
                console.log('The file ' + filename + ' has been saved!');

                openssl('openssl x509 -noout -issuer -in '+filename, function (err, data) {
                    console.log(err);

                    certdata.issuer = data.toString().replace('issuer=', '');

                    openssl('openssl x509 -noout -serial -in '+filename, function (err, data) {
                        console.log(err);

                        certdata.serial = data.toString().replace('serial=', '');
                        return resolve(certdata);
                    });
                });
            });
        });
    };

    this.buildSignatureXML = function (signature, certData) {
        var certValues = [];
        _.forEach(that.configuration.certificateValues, function (value, key ) {
            certValues.push({
                '@Id': 'S'+that.signatureCount+'-'+key,
                '#text': value
            })
        });
        var timestamp = moment().format('YYYY-MM-DDTHH:mm:ssZ');
        var fileReferences = [];
        var signedDataFileProperties = [];
        that.filesList.forEach(function (file, index) {
            fileReferences.push({
                '@Id': 'S0-ref-' + index,
                '@URI': file.name, //file in contaire name
                'ds:DigestMethod': {
                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256'
                },
                'ds:DigestValue': file.digestValue //file hash
            });
            signedDataFileProperties.push({
                '@ObjectReference': '#S0-ref-' + index,
                'xades:MimeType': file.mimeType
            });
        });
        var sigPolicyId = {
            'xades:SigPolicyId': {
                'xades:Identifier': {
                    '@Qualifier': 'OIDAsURN',
                    '#text': ' urn:oid:1.3.6.1.4.1.10015.1000.3.2.1'
                }
            }
        };
        var SigPolicyIdXML = xmlbuilder.create(sigPolicyId).end({ pretty: true}).replace('<?xml version="1.0"?>', '').trim();
        var policyDigest = crypto.createHash('sha256').update(SigPolicyIdXML, 'base64').digest('base64');

        var signedProperties = {'xades:SignedProperties': {
                '@Id': 'S'+that.signatureCount+'-SignedProperties',
                'xades:SignedSignatureProperties': {
                    '@Id': 'S'+that.signatureCount+'-SignedSignatureProperties',
                    'xades:SigningTime': timestamp,
                    'xades:SigningCertificate': {
                        'xades:Cert': {
                            'xades:CertDigest': {
                                'ds:DigestMethod': {
                                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256',
                                    '#text': ' '
                                },
                                'ds:DigestValue': certData.certDigest
                            },
                            'xades:IssuerSerial': {
                                'ds:X509IssuerName': certData.issuer,
                                'ds:X509SerialNumber': certData.serial
                            }
                        }
                    },
                    'xades:SignaturePolicyIdentifier': {
                        'xades:SignaturePolicyId': {
                            'xades:SigPolicyId': {
                                'xades:Identifier': {
                                    '@Qualifier': 'OIDAsURN',
                                    '#text': ' urn:oid:1.3.6.1.4.1.10015.1000.3.2.1'
                                }
                            },
                            'xades:SigPolicyHash': {
                                'ds:DigestMethod': {
                                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256',
                                    '#text':' '
                                },
                                'ds:DigestValue': '3Tl1oILSvOAWomdI9VeWV6IA/32eSXRUri9kPEz1IVs=' //someValue
                            },
                            'xades:SigPolicyQualifiers': {
                                'xades:SigPolicyQualifier': {
                                    'xades:SPURI': {
                                        '#text': ' https://www.sk.ee/repository/bdoc-spec21.pdf'
                                    }
                                }
                            }
                        },
                    },
                    'xades:SignatureProductionPlace': ' ',
                    'xades:SignerRole': {
                        'xades:ClaimedRoles': {
                            'xades:ClaimedRole': ''
                        }
                    }
                },
                'xades:SignedDataObjectProperties': {
                    'xades:DataObjectFormat': signedDataFileProperties
                }
            }
        };

        var signedPropertiesXML = xmlbuilder.create(signedProperties).end({ pretty: true}).replace('<?xml version="1.0"?>', '').trim();
        var signedPropertiesDigest = crypto.createHash('sha256').update(Buffer.from(signedPropertiesXML)).digest('base64');
        fileReferences.push({
            '@Id': 'S'+that.signatureCount+'-ref-sp',
            '@URI':'#S'+that.signatureCount+'-SignedProperties',
            '@Type': 'http://uri.etsi.org/01903#SignedProperties',
            'ds:DigestMethod': {
                '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256'
            },
            'ds:DigestValue': signedPropertiesDigest
        });

        var xmlObject = {
            'asic:XAdESSignatures': {
                '@xmlns:asic': 'http://uri.etsi.org/02918/v1.2.1#',
                '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',                
                '@xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
                'ds:Signature': {
                    '@Id': 'S'+that.signatureCount+'',
                    'ds:SignedInfo': {
                        '@Id': 'S'+that.signatureCount+'-SignedInfo',
                        'ds:CanonicalizationMethod': {
                            '@Algorithm': 'http://www.w3.org/2006/12/xml-c14n11',
                            '#text': ' '
                        },
                        'ds:SignatureMethod': {
                            '@Algorithm':'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256'
                        },
                        'ds:Reference': fileReferences
                    },
                    'ds:SignatureValue': {
                        '@Id': 'S'+that.signatureCount+'-SIG',
                        '#text': signature
                    },
                    'ds:KeyInfo': {
                        '@Id': 'S'+that.signatureCount+'-KeyInfo',
                        'ds:X509Data': {
                            'ds:X509Certificate': certData.content
                        }
                    },
                    'ds:Object': {
                        '@Id': 'S'+that.signatureCount+'-Object-xades',
                        'xades:QualifyingProperties': {
                            '@xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
                            '@Id': 'S'+that.signatureCount+'-QualifyingProperties',
                            '@Target': '#S'+that.signatureCount+'',
                            'xades:SignedProperties': {
                                '@Id': 'S'+that.signatureCount+'-SignedProperties',
                                'xades:SignedSignatureProperties': {
                                    '@Id': 'S'+that.signatureCount+'-SignedSignatureProperties',
                                    'xades:SigningTime': timestamp,
                                    'xades:SigningCertificate': {
                                        'xades:Cert': {
                                            'xades:CertDigest': {
                                                'ds:DigestMethod': {
                                                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256',
                                                    '#text': ' '
                                                },
                                                'ds:DigestValue': certData.certDigest
                                            },
                                            'xades:IssuerSerial': {
                                                'ds:X509IssuerName': certData.issuer,
                                                'ds:X509SerialNumber': certData.serial
                                            }
                                        }
                                    },
                                    'xades:SignaturePolicyIdentifier': {
                                        'xades:SignaturePolicyId': {
                                            'xades:SigPolicyId': {
                                                'xades:Identifier': {
                                                    '@Qualifier': 'OIDAsURN',
                                                    '#text': ' urn:oid:1.3.6.1.4.1.10015.1000.3.2.1'
                                                }
                                            },
                                            'xades:SigPolicyHash': {
                                                'ds:DigestMethod': {
                                                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#sha256',
                                                    '#text':' '
                                                },
                                                'ds:DigestValue': policyDigest
                                            },
                                            'xades:SigPolicyQualifiers': {
                                                'xades:SigPolicyQualifier': {
                                                    'xades:SPURI': {
                                                        '#text': ' https://www.sk.ee/repository/bdoc-spec21.pdf'
                                                    }
                                                }
                                            }
                                        },
                                    },
                                    'xades:SignatureProductionPlace': ' ',
                                    'xades:SignerRole': {
                                        'xades:ClaimedRoles': {
                                            'xades:ClaimedRole': ''
                                        }
                                    }
                                },
                                'xades:SignedDataObjectProperties': {
                                    'xades:DataObjectFormat': signedDataFileProperties
                                }
                            },
                            'xades:UnsignedProperties': {
                                '@Id': 'S'+that.signatureCount+'-UnsignedProperties',
                                'xades:UnsignedSignatureProperties': {
                                    '@Id': 'S'+that.signatureCount+'-UnsigedSignatureProperties',
                                    'xades:CertificateValues': {
                                        '@Id': 'S'+that.signatureCount+'-CertificateValues',
                                        'xades:EncapsulatedX509Certificate':  certValues
                                    },
                                    'xades:RevocationValues': {
                                        '@Id':'S'+that.signatureCount+'-RevocationValues',
                                        'xades:OCSPValues': {
                                            'xades:EncapsulatedOCSPValue':  {
                                                '@Id': 'N0',
                                                '#text': certData.ocspResponse
                                            }
                                        }
                                    }
                                }
                            },
                        }
                    }
                }
            }
        }
        var xml = xmlbuilder.create(xmlObject, { encoding: 'utf-8' }).end({ pretty: true});
        console.log(xml);
        return Buffer.from(xml, 'utf8');
    };
};

/**
 * Append a file
 *
 * @param {String|Buffer|Stream.Readable|null} input Proxies the call to archive.append ({@link https://github.com/archiverjs/node-archiver#appendinput-data})
 * @param {object} data In addition to node-archive append() input takes compulsory 'mimeType'.
 *
 * @returns {void}
 */
Bdoc.prototype.append = function (input, data) {
    if (!input || !data.mimeType || !data.name) {
        throw new Error('Invalid arguments. Missing one or more required arguments', arguments);
    }

    // Add file to manifest file contents
    this.manifestFileContents += this.manifestFileInfoTemplate
        .replace('{{name}}', data.name)
        .replace('{{mimeType}}', data.mimeType);
    console.log(input);
    var digestValue = crypto.createHash('sha256').update(input).digest('base64');
    console.log(data.name, 'digestValue', digestValue);
    this.filesList.push({name: data.name, mimeType: data.mimeType, digestValue});
    this.dataToSign += input.toString('hex');

    this.archive.append(input, data);
};

/**
 * Add signature file
 *
 * @param {String|Buffer|Stream.Readable|null} signature Proxies the call to archive.append ({@link https://github.com/archiverjs/node-archiver#appendinput-data})
 * @param {object} cert In addition to node-archive append() input takes compulsory 'mimeType'.
 *
 * @returns {void}
 */
Bdoc.prototype.addSignature = function (signature, cert) {
    var that = this;
    var certData = {
        content: cert
    };

    var preparedCert = that._prepareCert(cert);
    return that.getOCSP(preparedCert)
        .then(function (ocspResponse) {
            certData.ocspResponse = ocspResponse
        })
        .then(function () {
            var pkicert = that.decodeCert(preparedCert);
            console.log('PARSED', Object.keys(pkicert));
            var certDigest = crypto.createHash('sha256').update(cert, 'base64').digest('base64');
            certData.certDigest = certDigest;
            certData.issuer = that.getCertValue('issuer', pkicert);
            certData.serial = pkicert.serialNumber.valueBlock.toString();
            var signatureXML = that.buildSignatureXML(signature, certData);
    //        console.log('signatureXML', signatureXML);
            that.archive.append(signatureXML, {name: 'META-INF/signatures'+that.signatureCount+'.xml'});
            that.signatureCount++;

            return Promise.resolve();
        }).catch(function (e) {
            console.log(e);
        });
};

/**
 * Finalize BDOC
 *
 * MUST BE CALLED TO GET A VALID BDOC FILE.
 *
 * Creates the BDOC metadata file and closes the ZIP stream by calling archive.finalize() ({@link https://github.com/archiverjs/node-archiver#finalize})
 *
 * @returns {void}
 */
Bdoc.prototype.finalize = function () {
    // Close the manifest and store in the zip
    this.manifestFileContents += this.manifestFileFooter;
    this.archive.append(this.manifestFileContents, {name: 'META-INF/manifest.xml'});

    this.archive.finalize();
};

/**
 * Return BDOC as stream
 *
 * MUST BE CALLED AFTER finalize TO GET A VALID BDOC FILE.
 *
 * Returns the BDOC data as stream
 *
 * @returns {stream}
 */

Bdoc.prototype.getStream = function () {
    return this.finalBdocFileStream;
};

Bdoc.prototype.getDataToSign = function () {
    return Buffer.from(this.dataToSign, 'hex');
};

Bdoc.prototype.setConfiguration = function (type) {
    var that = this;
    if (!type) {
        type = 'production';
    }

    if (type === 'production') {
        this.configuration = {
            certificatePaths: {
                CA_CERT1: 'configuration/prod/certs/EECCRCA.crt'
            },
            certificateValues: {}
        };
    }
    if (type === 'test') {
        this.configuration = {
            certificatePaths: {
                CA_CERT1: 'configuration/test/certs/TEST_of_EID-SK_2016_OCSP_RESPONDER_2018.crt',
                RESPONDER_CERT: 'configuration/test/certs/SK-OCSP-RESPONDER-2011_test.cer',
                CA_CERT3: 'configuration/test/certs/TEST_of_KLASS3-SK_2016.crt'
            },
            certificateValues: {}
        };
    }

    _.forEach(this.configuration.certificatePaths, function (path, key) {
        fs.readFile(__dirname + '/' + path, function (err, content) {
            that.configuration.certificateValues[key] = that._pem2Der(content.toString());
        });
    });
};

module.exports = Bdoc;
