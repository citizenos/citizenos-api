'use strict';

/**
 * Translations
 *
 * @param {string} translationFileDir Directory where all the translation JSON files reside. File name should be ISO 2 char language code.
 *
 * @returns {object} {langCode: translations}
 */

const fs = require('fs');

module.exports = function (translationFileDir) {
    const translations = {};

    const files = fs.readdirSync(translationFileDir);
    files.forEach((file) => {
        const lang = file.split('.')[0];
        translations[lang] = require(translationFileDir + '/' + file);
    });

    return translations;
};
