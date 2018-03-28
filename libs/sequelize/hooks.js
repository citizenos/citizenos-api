'use strict';

/**
 * Hook definition that can be reused.
 */

/**
 * Trim all fields which value has trim() function.
 *
 * Main idea was to trim all String values.
 *
 * @param {object} dao Sequelize DAO
 *
 * @returns {void}
 *
 * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
 */
module.exports.trim = function (dao) {
    for (var field in dao.dataValues) {
        if (dao[field] && typeof dao[field].trim === 'function') {
            dao[field] = dao[field].trim();
        }
    }
};

module.exports.replaceInvalidCharactersinHashtag = function (dao) {
    for (var field in dao.dataValues) {
        if (field === 'hashtag' && dao[field] !== null) {
            dao[field] = dao[field].replace(/[#,.:\- ]+/g, '');
            if (!dao[field]) {
                dao[field] = null;
            }
        }
    }
};
