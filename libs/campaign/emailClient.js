'use strict';

var campaign = require('campaign');
var nodemailer = require('nodemailer');

/**
 * E-mail client
 *
 * @param {object} config Config
 *  - {object} provider
 *      - {string} name Provider name. One of "mailgun", "nodemailer", "terminal"
 *      - {object} options Provider specific options object.
 *  - {string} from From e-mail
 *  - {string|boolean} trap Send all emails to this address instead of recipients.
 *  - {string} headerImage Absolute path to header image
 *  - {string} layout Absolute path to Mustache template
 *
 * @returns {object} Campaign e-mail client.
 *
 * @see https://github.com/bevacqua/campaign
 */

var emailClient = function (config) {

    var provider;

    switch (config.provider.name) {
        case 'mailgun':
            provider = require('campaign-mailgun')(config.provider.options);
            break;
        case 'nodemailer':
            var smtp = nodemailer.createTransport('SMTP', config.provider.options);

            provider = require('campaign-nodemailer')({
                transport: smtp
            });
            break;
        case 'terminal':
            provider = require('campaign-terminal')();
            break;
        case 'noop':
            provider = {
                name: 'noop',
                send: function (model, done) {
                    // NOOP
                    done();
                },
                tweakPlaceholder: function () {
                    // NOOP
                    return null;
                }
            };
            break;
        default:
            throw Error('Unknown provider. Only "mailgun", "nodemailer", "terminal" and "noop" are supported.', config.provider);
    }

    //For full conf - https://github.com/bevacqua/campaign#client-options
    var client = campaign({
        provider: provider,
        from: config.from, // The "from" e-mail. Good old "no-reply@mydomain.com".
        templateEngine: require('campaign-mustache'), // Default is Mustache - https://github.com/janl/mustache.js
        trap: config.trap, // Send to this e-mail instead of the recipients. Useful for debugging.
        headerImage: config.headerImage || null, // Absolute path to header image
        layout: config.layout || null // Layout template. Absolute path to Mustache template. Null comes down to "layout.mu" bundled with Campaign.
    });

    return client;
};

module.exports = emailClient;
