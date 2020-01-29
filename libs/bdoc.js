'use strict';

var archiver = require('archiver');

/**
 * BDOC
 *
 * For creating UNSIGNED BDOC containers
 *
 * @param {Stream.Writable} writableStream Writable stream
 *
 * @see {@link http://www.id.ee/public/bdoc-spec21.pdf} BDOC Spec
 * @see {@link https://github.com/archiverjs/node-archiver} Node-archiver
 */

var Bdoc = function (writableStream) {
    this.archive = archiver('zip', {store: true});
    this.archive.pipe(writableStream);

    // Add compulsory 'mimetype' file
    this.archive.append('application/vnd.etsi.asic-e+zip', {name: 'mimetype'});

    // META-INF/manifest.xml
    this.manifestFileHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>' +
        '\n<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">' +
        '\n    <manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.etsi.asic-e+zip"/>';
    this.manifestFileInfoTemplate = '\n    <manifest:file-entry manifest:full-path="{{name}}" manifest:media-type="{{mimeType}}"/>';
    this.manifestFileFooter = '\n</manifest:manifest>';
    this.manifestFileContents = this.manifestFileHeader;
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

    this.archive.append(input, data);
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

module.exports = Bdoc;