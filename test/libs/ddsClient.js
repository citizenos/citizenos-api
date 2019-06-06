'use strict';

var assert = require('chai').assert;
var DigiDocServiceClient = require('../../libs/ddsClient');
var fs = require('fs');
var Promise = require('bluebird');

suite('DDS Client', function () {
    var serviceWsdlUrl = 'https://tsp.demo.sk.ee/dds.wsdl';
    var serviceName = 'Testimine';
    var token = null;

    var testBdocFilePath = './files/test.bdoc';

    var ddsClient;

    /**
     * Convert a stream to encoded string
     *
     * @param {Stream.Readable} readableStream Readable stream
     * @param {string} encoding Encoding. One of 'base64', 'hex', 'binary' .. ({@link https://nodejs.org/docs/latest-v0.12.x/api/buffer.html#buffer_buffer})
     *
     * @returns {Promise<String>} Stream data
     *
     * @private
     */
    var _streamToEncodedString = function (readableStream, encoding) {
        return new Promise(function (resolve, reject) {
            var buf;

            readableStream.on('data', function (d) {
                if (!buf) {
                    buf = d;
                } else {
                    buf = Buffer.concat([buf, d]);
                }
            });

            readableStream.on('end', function () {
                return resolve(buf.toString(encoding));
            });

            readableStream.on('error', reject);
        });
    };

    var _streamToPromise = function (stream) {
        return new Promise(function (resolve, reject) {
            stream.on('end', resolve);
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
    };


    suiteSetup(function (done) {
        ddsClient = new DigiDocServiceClient(serviceWsdlUrl, serviceName, token);
        done();
    });

    test('StartSession', function (done) {
        ddsClient
            .startSession(null, null, true, null)
            .spread(function () {
                done();
            })
            .catch(done);
    });

    test('CheckCertificate', function (done) {
        var stream = fs.createReadStream('./test/resources/certificates/dds_good_igor_sign.pem');
        _streamToEncodedString(stream)
            .then(function (certHex) {
                return ddsClient.checkCertificate(certHex, false);
            })
            .spread(function (response) {
                assert.equal(response.Status.$value, 'GOOD');
                done();
            })
            .catch(done);
    });

    test('GetMobileCertificate', function (done) {
        var iDCode = '60001019906';
        var phoneNo = '+37200000766';
        var returnCertData = 'sign';

        ddsClient
            .getMobileCertificate(iDCode, null, phoneNo, returnCertData)
            .spread(function (response) {
                assert.equal(response.SignCertStatus.$value, 'OK');
                assert.property(response.SignCertData, '$value');

                done();
            })
            .catch(done);

    });

    test('CreateSignedDoc', function (done) {
        var format = DigiDocServiceClient.DOCUMENT_FORMATS.BDOC;

        ddsClient
            .createSignedDoc(format.name, format.version)
            .spread(function () {
                done();
            })
            .catch(done);
    });

    test('AddDataFileHashcode', function (done) {
        var stream = fs.createReadStream('./test/resources/ddsClient/test.txt');
        ddsClient
            .addDataFileHashcode(stream, 'test.txt', 'text/plain')
            .spread(function () {
                done();
            })
            .catch(done);
    });

    test('AddDataFileHashcode', function (done) {
        var stream = fs.createReadStream('./test/resources/ddsClient/test.txt');
        ddsClient
            .addDataFileHashcode(stream, 'test2.txt', 'text/plain')
            .spread(function () {
                done();
            })
            .catch(done);
    });

    test('PrepareSignature', function (done) {
        var stream = fs.createReadStream('./test/resources/certificates/dds_good_igor_sign_hex_encoded_der.crt');

        _streamToEncodedString(stream)
            .then(function (certHex) {
                var signersTokenId = '';

                return ddsClient.prepareSignature(certHex, signersTokenId);
            })
            .spread(function () {
                done();
            })
            .catch(done);
    });

    test('GetSignedDoc', function (done) {
        ddsClient
            .getSignedDoc()
            .spread(function (response) {
                return Buffer.from(response.SignedDocData.$value, 'base64');
            })
            .then(function (buffer) {
                var stream = fs.createWriteStream(testBdocFilePath);
                var streamPromise = _streamToPromise(stream);
                stream.end(buffer);

                return streamPromise;
            })
            .then(function () {
                done();
            });
    });

    test('CloseSession', function (done) {
        ddsClient
            .closeSession()
            .spread(function () {
                done();
            })
            .catch(done);
    });

    // While trying to add hashcoded and base64 files to same container got error message: "Both Hash and Datafile cannot be in container" so sepperated base64 part
    test('AddDataFileHashcode - base64', function (done) {
        ddsClient
            .startSession(null, null, true, null)
            .spread(function () {
                var format = DigiDocServiceClient.DOCUMENT_FORMATS.BDOC;

                ddsClient
                    .createSignedDoc(format.name, format.version)
                    .spread(function () {
                        var stream = fs.createReadStream('./test/resources/ddsClient/test.txt');
                        ddsClient
                            .addDataFileEmbeddedBase64(stream, 'test2.txt', 'text/plain')
                            .spread(function () {
                                ddsClient
                                    .getSignedDoc()
                                    .spread(function (response) {
                                        return Buffer.from(response.SignedDocData.$value, 'base64');
                                    })
                                    .then(function (buffer) {
                                        var stream = fs.createWriteStream(testBdocFilePath);
                                        var streamPromise = _streamToPromise(stream);
                                        stream.end(buffer);

                                        return streamPromise;
                                    })
                                    .then(function () {
                                        return ddsClient
                                            .closeSession()
                                            .spread(function () {
                                                return done();
                                            });
                                    });
                            });
                    });
            });
    });

    suiteTeardown(function (done) {
        fs.unlink(testBdocFilePath, function () {
            done();
        });
    });

});


