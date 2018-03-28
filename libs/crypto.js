'use strict';

var HASH_TYPES = {
    sha1: {
        name: 'SHA-1',
        length: 40
    },
    sha224: {
        name: 'SHA-224',
        length: 56
    },
    sha256: {
        name: 'SHA-256',
        length: 64
    },
    sha384: {
        name: 'SHA-384',
        length: 96
    },
    sha512: {
        name: 'SHA-512',
        length: 128
    }
};

var crypto = require('crypto');
var base64url = require('base64-url');

/**
 * Get a hash of string
 *
 * @param {string} data Data to be hashed
 * @param {string} algorithm Algorithm to be used (sha1, md5, sha256, sha512..)
 *
 * @returns {string} Hash
 */
var _getHash = function (data, algorithm) {
    if (data === null) {
        return null;
    }

    var sum = crypto.createHash(algorithm);
    sum.update(data);

    return sum.digest('hex');
};

/**
 * Get OpenID "at_hash"
 *
 * @param {string} data Data to be hashed
 * @param {string} algorithm Hash algorithm
 *
 * @returns {string} OpenID "at_hash"
 *
 * @see http://openid.net/specs/openid-connect-implicit-1_0.html#IDToken
 */
var _getAtHash = function (data, algorithm) {
    if (data === null) {
        return null;
    }

    var sum = crypto.createHash(algorithm);
    sum.update(data);

    var hash = sum.digest();

    return base64url.encode(hash.slice(0, 16).toString('hex'));
};

/**
 * Check if string is hex or not
 *
 * @param {string} string String to check
 *
 * @returns {boolean} True if is hex string
 *
 * @private
 */
var _isHexString = function (string) {
    var regexp = /^[0-9a-fA-F]+$/;

    return regexp.test(string);
};

/**
 * Find out out the type of hash
 *
 * Port from CertificateHelper bundled with DigiDocService sample application
 *
 * @param {string} hash Hash in HEX encoding
 *
 * @return {string|null} Hash type SHA-1, SHA-256... or null detection failed
 *
 * @throws {Error} IF hash is not HEX encoded
 *
 * @private
 */
var _getHashType = function (hash) {
    if (!_isHexString(hash)) {
        throw Error('Hash must be in HEX encoding!');
    }

    for (var type in HASH_TYPES) {
        if (Object.prototype.hasOwnProperty.call(HASH_TYPES, type)) {
            var typeO = HASH_TYPES[type];
            if (hash.length === typeO.length) {
                return typeO.name;
            }
        }
    }

    return null;
};

module.exports = {
    getHash: _getHash,
    getAtHash: _getAtHash,
    getHashType: _getHashType
};
