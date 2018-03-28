'use strict';

/**
 * Translations
 *
 * @param {string} translationFileDir Directory where all the translation JSON files reside. File name should be ISO 2 char language code.
 *
 * @returns {object} {langCode: translations}
 */

var fs = require('fs');

module.exports = function (translationFileDir) {
    var translations = {};

    var files = fs.readdirSync(translationFileDir); // eslint-disable-line no-sync
    files.forEach(function (file) {
        var lang = file.split('.')[0];
        translations[lang] = require(translationFileDir + '/' + file);
    });

    return translations;
};
