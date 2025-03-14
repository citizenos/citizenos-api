'use strict';

/**
 * Middleware to parse partnerId from the request and sets it in req.locals.partnerId for further use
 *
 * @param {object} app Express app
 *
 * @returns {function} Express middleware function
 */
module.exports = function (app) {
    const logger = app.get('logger');
    const models = app.get('models');

    const Partner = models.Partner;

    // Local cache for the Partner config
    let partners;

    // Fetch and cache Partner config
    const getPartnerConfig = async () => {
        if (partners) {
            return partners;
        } else {
            return Partner.findAll();
        }
    };

    return async function (req, res, next) {
        partners = await getPartnerConfig();
        let partnerId = req.query.partnerId || req.headers['x-partner-id'];
        const sourceUrl = req.headers.origin || req.headers.referer;

        logger.info('partnerParser', partnerId, sourceUrl, req.headers);

        if (!req.locals) {
            req.locals = {};
        }

        // source url to always override partnerId sent in headers/params to avoid funky business with SPA-s
        if (sourceUrl) {
            for (const partner of partners) {
                if (sourceUrl.indexOf(partner.website) > -1) {
                    partnerId = partners.id;
                    break;
                }
            }
        }

        // If User is authenticated with Partner token, it has "partnerId", this will override everything
        if (req.user?.partnerId) {
            // Deny cross-usage of tokens for different Partners.
            if (partnerId && req.user.partnerId !== partnerId) {
                logger.error('Detected Partner id does not match the one in the token. Denying request. Detected', partnerId, ', token', req.user.partnerId);

                return res.forbidden();
            }
            partnerId = req.user.partnerId;
        }

        if (partnerId) {
            const partner = partners.find(p => p.id === partnerId);
            if (partner) {
                req.locals.partner = partner;
                res.set('Vary', 'X-Partner-Id');
            } else {
                logger.warn('Could not find Partner for id', partnerId);
            }
        }

        next();
    };
};
