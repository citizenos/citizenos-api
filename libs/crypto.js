'use strict';

const HASH_TYPES = {
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

const crypto = require('crypto');
const base64url = require('base64-url');

/**
 * Get a hash of string
 *
 * @param {string} data Data to be hashed
 * @param {string} algorithm Algorithm to be used (sha1, md5, sha256, sha512..)
 *
 * @returns {string} Hash
 */
const _getHash = function (data, algorithm) {
    if (data === null) {
        return null;
    }

    const sum = crypto.createHash(algorithm);
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
const _getAtHash = function (data, algorithm) {
    if (data === null) {
        return null;
    }

    const sum = crypto.createHash(algorithm);
    sum.update(data);

    const hash = sum.digest();

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
const _isHexString = function (string) {
    const regexp = /^[0-9a-fA-F]+$/;

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
const _getHashType = function (hash) {
    if (!_isHexString(hash)) {
        throw Error('Hash must be in HEX encoding!');
    }

    for (let type in HASH_TYPES) {
        if (Object.prototype.hasOwnProperty.call(HASH_TYPES, type)) {
            const typeO = HASH_TYPES[type];
            if (hash.length === typeO.length) {
                return typeO.name;
            }
        }
    }

    return null;
};

const algorithm = 'aes-256-ctr';
const IV_LENGTH = 16;


const _encrypt = (secret, data) => {
    let key = crypto.createHash('sha256').update(String(secret)).digest('base64');
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'base64'), iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const _decrypt = (secret, data) => {
    let key = crypto.createHash('sha256').update(String(secret)).digest('base64');
    let textParts = data.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'base64'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString());
};

module.exports = {
    getHash: _getHash,
    getAtHash: _getAtHash,
    getHashType: _getHashType,
    encrypt: _encrypt,
    decrypt: _decrypt
};
