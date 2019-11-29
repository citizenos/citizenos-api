'use strict';

var assert = require('chai').assert;
var util = require('../../libs/util');
var fs = require('fs');
var AdmZip = require('adm-zip');
var Bdoc = require('../../libs/bdoc/bdoc');

suite('BDOC', function () {

    suite('Create', function () {
        var bdocPath;

        suiteSetup(function (done) {
            bdocPath = '/tmp/' + util.randomString(8) + '.bdoc';
            done();
        });

        test('Success', function (done) {
            var writeStream = fs.createWriteStream(bdocPath);

            var bdoc = new Bdoc(writeStream);

            bdoc.append('BDOC.Create.contentÕ', {name: 'test.txt', mimeType: 'text/plain'});
            bdoc.append('BDOC.Create.contentÕ2', {name: 'test2.txt', mimeType: 'text/plain2'});

            bdoc.finalize();

            writeStream.on('close', function () {
                var bdocCreated = new AdmZip(bdocPath);

                var files = bdocCreated.getEntries();

                // The BDOC spec clearly states that the 'mimetype' file has to be first in the archive
                var mimeTypeFile = files[0];
                assert.equal(mimeTypeFile.entryName, 'mimetype');
                assert.equal(bdocCreated.readAsText('mimetype'), 'application/vnd.etsi.asic-e+zip');

                // Check the added files
                assert.equal(bdocCreated.readAsText('test.txt'), 'BDOC.Create.contentÕ');
                assert.equal(bdocCreated.readAsText('test2.txt'), 'BDOC.Create.contentÕ2');

                // Check the manifest.xml
                var expectedManifest = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' +
                    '\n<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">' +
                    '\n    <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.etsi.asic-e+zip"/>' +
                    '\n    <manifest:file-entry manifest:full-path="test.txt" manifest:media-type="text/plain"/>' +
                    '\n    <manifest:file-entry manifest:full-path="test2.txt" manifest:media-type="text/plain2"/>' +
                    '\n</manifest:manifest>';
                assert.equal(bdocCreated.readAsText('META-INF/manifest.xml'), expectedManifest);

                done();
            });

            suiteTeardown(function (done) {
                fs.unlinkSync(bdocPath); // eslint-disable-line no-sync
                done();
            });
        });
    });

});
