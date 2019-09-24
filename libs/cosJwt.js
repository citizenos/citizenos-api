'use strict';

/**
 * Citizen OS specific JWT logic
 *
 * @param {Object} app Express app
 *
 * @returns {Function} Function
 */
module.exports = function (app) {

    var config = app.get('config');
    var jwt = app.get('jwt');

    var TOKEN_OPTIONS_SIGN_DEFAULTS = {
        algorithm: config.session.algorithm
    };

    var TOKEN_OPTIONS_VERIFY_DEFAULTS = {
        algorithms: [config.session.algorithm]
    };

    /**
     * Get restricted use token
     *
     * @param {Object} payload Payload object to sign, note that "audience" property is reserved and will throw an error!
     * @param {Array|String} audience Array of allowed audiences (usage scopes, paths with methods). For ex:  ["POST /api/new/stuff", "GET /api/foo/bar"]. Audience is originally part of the jwt.sign options, but bringing it out separately as it is required by all tokens we issue.
     * @param {Object} [options] jwt.sign options like expiresIn etc (https://github.com/auth0/node-jsonwebtoken/tree/cb33aabc432408ed7f3826c2f5b5930313b63f1e)
     *
     * @private
     *
     * @returns {String} String Token
     */
    var _getTokenRestrictedUse = function (payload, audience, options) {
        if (!payload) {
            throw new Error('Missing required parameter "payload"');
        }

        if (!audience || !audience.length) {
            throw new Error('Missing required parameter "audience". Please specify scope to which the usage is restricted!');
        }

        if (options && options.audience) {
            throw new Error('Property "audience" is reserved for specifying usage scope of the token. Use "audience" parameter to specify the audience (scope).');
        }

        var effectiveOptions = Object.assign({}, TOKEN_OPTIONS_SIGN_DEFAULTS, options);
        effectiveOptions.audience = typeof audience === 'string' ? [audience] : audience;

        effectiveOptions.audience.forEach(function (aud) {
            if (!(/^(GET|POST|PUT|DELETE|PATCH) \/.*/).test(aud)) {
                throw new Error('Invalid value in "audience" parameter detected - "' + aud + '"');
            }
        });

        return jwt.sign(payload, config.session.privateKey, effectiveOptions);
    };

    /**
     * Verify a restricted use token
     *
     * @param {string} token JWT token
     * @param {string} audience Audience that is required. The format is "METHOD PATH". For example "POST /api/new/stuff". Audience is originally part of the jwt.verify options, but bringing it out separately as it is required by all tokens we issue.
     * @param {Object} [options] jwt.verify options.
     *
     * @private
     *
     * @returns {Object} Decoded JWT token
     */
    var _verifyTokenRestrictedUse = function (token, audience, options) {
        var effectiveOptions = Object.assign({}, TOKEN_OPTIONS_VERIFY_DEFAULTS, options);

        effectiveOptions.audience = audience;

        return jwt.verify(token, config.session.publicKey, effectiveOptions);
    };

    return {
        getTokenRestrictedUse: _getTokenRestrictedUse,
        verifyTokenRestrictedUse: _verifyTokenRestrictedUse
    };
};
