'use strict';

/**
 * Url service
 *
 * @param {object} config
 *  - {object} url
 *    - {string} fe Front-end (FE) base url
 *    - {string} api API base url
 *
 * @returns {object} Public interface
 */
module.exports = function (config) {

    var _getAbsoluteUrl = function (baseUrl, path, params, query) {
        if (!path) {
            return baseUrl;
        }

        if (params) {
            Object.keys(params).forEach(function (key) {
                path = path.replace(':' + key, params[key]);
            });
        }

        var queryString = '';
        if (query) {
            Object.keys(query).forEach(function (key) {
                var value = query[key];
                if (value) {
                    queryString += key + '=' + encodeURIComponent(value) + '&';
                }
            });
            if (queryString.length) {
                queryString = '?' + queryString.slice(0, -1);
            }
        }

        return baseUrl + path + queryString;
    };

    /**
     * Get absolute API url
     *
     * @param {string} [path] Path
     * @param {object} [params] Parameters to be replace in the url
     * @param {object} [query] Query parameters to be added to the url
     *
     * @returns {string} Absolute url
     *
     * @private
     */
    var _getApi = function (path, params, query) {
        return _getAbsoluteUrl(config.url.api, path, params, query);
    };

    /**
     * Get absolute FE url
     *
     * @param {string} [path] Path
     * @param {object} [params] Parameters to be replace in the url
     * @param {object} [query] Query parameters to be added to the url
     *
     * @returns {string} Absolute url
     *
     * @private
     */
    var _getFe = function (path, params, query) {
        return _getAbsoluteUrl(config.url.fe, path, params, query);
    };

    return {
        getApi: _getApi,
        getFe: _getFe
    };
};
