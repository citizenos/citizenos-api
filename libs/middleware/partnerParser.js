'use strict';

/**
 * Middleware to parse partnerId from the request and sets it in req.locals.partnerId for further use
 *
 * @param {object} app Express app
 *
 * @returns {function} Express middleware function
 */
module.exports = function (app) {
    var logger = app.get('logger');
    var Promise = app.get('Promise');
    var _ = app.get('lodash');
    var models = app.get('models');

    var Partner = models.Partner;

    // Local cache for the Partner config
    var partners;

    // Fetch and cache Partner config
    var getPartnerConfig = function () {
        if (partners) {
            return Promise.resolve(partners);
        } else {
            return Partner
                .findAll()
                .then(function (partnerArr) {
                    partners = partnerArr;

                    return Promise.resolve(partners);
                });
        }
    };

    return function (req, res, next) {
        getPartnerConfig()
            .then(function (partners) {
                var partnerId = req.query.partnerId || req.headers['x-partner-id'];
                var sourceUrl = req.headers.origin || req.headers.referer;

                logger.info('partnerParser', partnerId, sourceUrl, req.headers);

                if (!req.locals) {
                    req.locals = {};
                }

                // source url to always override partnerId sent in headers/params to avoid funky business with SPA-s
                if (sourceUrl) {
                    for (var i = 0; i < partners.length; i++) {
                        if (sourceUrl.indexOf(partners[i].website) > -1) {
                            partnerId = partners[i].id;
                            break;
                        }
                    }
                }

                // If User is authenticated with Partner token, it has "partnerId", this will override everything
                if (req.user && req.user.partnerId) {
                    // Deny cross-usage of tokens for different Partners.
                    if (partnerId && req.user.partnerId !== partnerId) {
                        logger.error('Detected Partner id does not match the one in the token. Denying request. Detected', partnerId, ', token', req.user.partnerId);

                        return res.forbidden();
                    }
                    partnerId = req.user.partnerId;
                }

                if (partnerId) {
                    var partner = _.find(partners, {id: partnerId});
                    if (partner) {
                        req.locals.partner = partner;
                        res.set('Vary', 'X-Partner-Id');
                    } else {
                        logger.warn('Could not find Partner for id', partnerId);
                    }
                }

                next();
            });
    };
};
