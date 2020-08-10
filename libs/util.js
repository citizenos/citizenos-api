'use strict';

/**
 * Utils
 */

const emailToDisplayName = function (email) {
    if (!email || !email.indexOf('@') || email.indexOf('@') < 1) return null;

    let displayName = '';

    email.split('@')[0].split(/[._-]/).forEach(function (val) {
        displayName += val.charAt(0).toUpperCase() + val.substr(1) + ' ';
    });

    return displayName.trim();
};

/**
 * Mask an email address
 *
 * Example: make foo@bar.com to f*o@b*r.com
 *
 * @param {string} email Email
 */
const emailToMaskedEmail = function (email) {
    if (!email || !email.indexOf('@') || email.indexOf('@') < 1) return null;

    let [prefix, domain] = email.split('@');

    return prefix.substring(0, 2) + '******@' + domain;
};

const escapeHtml = function (text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#039;'
    };

    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
};

/**
 * Generate a random string of characters a-zA-Z0-9
 *
 * @param {number} [length=8] Length of the string to generate, defaults to 8
 *
 * @return {string} Random string
 */
const randomString = function (length) {
    const charArr = [];
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    length = length ? length : 8;

    for (let i = 0; i < length; i++) {
        charArr.push(possible.charAt(Math.floor(Math.random() * possible.length))); // Not using string+= as it becomes inefficient for long strings.
    }

    return charArr.join('');
};

/**
 * Get a random number
 *
 * @param {number} min Min value
 * @param {number} max Max value
 *
 * @returns {number} Random number
 */
const randomNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Get a random Personal Identification Code (PID)
 *
 * Valid for Estonia and Lithuania
 *
 * @returns {string} PID
 *
 */
const randomPid = function () {
    const sex = randomNumber(1, 6); // Odd - male, even - female
    const year = ('00' + randomNumber(0, 99)).slice(-2);
    const month = ('00' + randomNumber(1, 12)).slice(-2);
    const day = ('00' + randomNumber(1, 28)).slice(-2);
    const uniq = randomNumber(1000, 9999);

    return sex + year + month + day + uniq;
};

/**
 * Return a promisified stream
 *
 * @param {Stream} stream Stream
 *
 * @returns {Promise} Promise
 *
 * @private
 */
const streamToPromise = function (stream) {
    return new Promise(function (resolve, reject) {
        stream.on('end', resolve); // Readable stream has "end"
        stream.on('finish', resolve); // Writable stream has "finish"
        stream.on('error', reject);
    });
};

/**
 * Read a stream to Buffer
 *
 * @param {Stream.Readable} readableStream Stream
 *
 * @returns {Promise<Buffer>} Buffer of Stream data
 *
 * @private
 */
const streamToBuffer = function (readableStream) {
    return new Promise(function (resolve, reject) {
        let buf;

        readableStream.on('data', function (d) {
            if (typeof d === 'string') { // Mu2 streams send mixed Buffers and Strings as data event parameter
                d = Buffer.from(d);
            }
            if (!buf) {
                buf = d;
            } else {
                buf = Buffer.concat([buf, d]);
            }
        });

        readableStream.on('end', function () {
            return resolve(buf);
        });

        readableStream.on('error', reject);
    });
};


/**
 * Read a stream to String
 *
 * @param {Stream.Readable} readableStream Stream
 *
 * @returns {Promise<String>} Stream data as string
 *
 * @private
 */
const streamToString = function (readableStream) {
    return streamToBuffer(readableStream)
        .then(function (buffer) {
            return buffer.toString();
        });
};

module.exports.emailToDisplayName = emailToDisplayName;
module.exports.emailToMaskedEmail = emailToMaskedEmail;
module.exports.escapeHtml = escapeHtml;
module.exports.randomString = randomString;
module.exports.randomNumber = randomNumber;
module.exports.randomPid = randomPid;
module.exports.streamToPromise = streamToPromise;
module.exports.streamToBuffer = streamToBuffer;
module.exports.streamToString = streamToString;
