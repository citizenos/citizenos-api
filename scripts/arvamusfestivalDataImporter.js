'use strict';
var Promise = require('bluebird');

var path = require('path');
var config = require('config');
var superagent = require('superagent');

var log4js = require('log4js');
log4js.configure(config.logging.log4js);
var logger = log4js.getLogger(path.basename(__filename));

var db = require('../libs/sequelize/sequelize')(config.db.uri, config.db.options, logger);

var Topic = db.import('../models/Topic');
var Partner = db.import('../models/Partner');
var User = db.import('../models/User');

var urlApi = config.url.api;
var userEmail = process.env.CITIZENOS_ARVAMUSFESTIVAL_DATA_IMPORTER_USER_EMAIL;
var userPassword = process.env.CITIZENOS_ARVAMUSFESTIVAL_DATA_IMPORTER_USER_PASSWORD;

var partnerWebsite = 'https://arvamusfestival.ee'

if (!urlApi || !userEmail || !userPassword) {
    return logger.error('Missing required parameters - API url or User email or password!', urlApi, userEmail);
}

var user;
var partner;
var userAgent;

var stats = {
    total: 0,
    updated: 0,
    created: 0,
    failed: 0,
    ignored: 0
}

Partner
    .findOrCreate({
        where: {
            website: partnerWebsite
        },
        defaults: {
            website: partnerWebsite,
            redirectUriRegexp: '^https:\/\/([^\.]*\.)?arvamusfestival.ee(:[0-9]{2,5})?\/.*' //eslint-disable-line no-useless-escape
        }
    })
    .then(function (partnerResult) {
        partner = partnerResult[0];

        if (partnerResult[1]) {
            logger.info('Created new Partner', partnerResult[0].toJSON());
        } else {
            logger.info('Using existing Partner', partnerResult[0].toJSON());
        }

        return User
            .findOrCreate({
                where: {
                    email: userEmail
                },
                defaults: {
                    email: userEmail,
                    password: userPassword,
                    emailIsVerified: true,
                    name: 'Arvamusfestival 2018',
                    company: 'MTÜ Arvamusfestival',
                    language: 'et',
                    source: User.SOURCES.citizenosSystem
                }
            })
    })
    .then(function (userResult) {
        user = userResult[0];

        if (userResult[1]) {
            logger.info('Created new User', userResult[0].toJSON());
        } else {
            logger.info('Using existing User', userResult[0].toJSON());
        }
    })
    .then(function () {
        userAgent = superagent.agent();

        return userAgent
            .post(urlApi + '/api/auth/login')
            .set('Content-Type', 'application/json')
            .send({
                email: userEmail,
                password: userPassword
            });
    })
    .then(function () {
        return superagent.agent()
            .post('https://www.arvamusfestival.ee/api/?events')
            .send('app_secret=mGPQztP3ByOEqT4eX')
            .set('Accept', 'application/json');
    })
    .then(function (resultEvents) {
        // AF API returns JSON but response content type is text/html thus Superagent does not parse JSON
        var events = JSON.parse(resultEvents.text).events;
        logger.debug('AF API responded with', events.length);

        stats.total = events.length;

        var topicCreatePromises = [];

        return Promise
            .each(events, function (event, index, length) {
                var title = event.name_est;
                var description = event.short_description_est;

                if (title && description) {
                    return Topic
                        .findOne({
                            where: {
                                sourcePartnerId: partner.id,
                                sourcePartnerObjectId: String(event.event_id),
                                creatorId: user.id
                            }
                        })
                        .then(function (topic) {
                            if (!topic) { // create Topic
                                logger.info('Creating a new Topic', event.event_id);

                                return userAgent
                                    .post(urlApi + '/api/users/self/topics')
                                    .set('x-partner-id', partner.id)
                                    .send({
                                        description: '<!DOCTYPE HTML><html><body><<h1>' + title + '</h1><p>' + description + '</p></body>',
                                        visibility: Topic.VISIBILITY.public,
                                        categories: ['arvamusfestival2018'],
                                        sourcePartnerObjectId: event.event_id
                                    })
                                    .then(function () {
                                        logger.info('Done inserting Topic', event.event_id);

                                        stats.created++;
                                    });
                            } else { // update Topic
                                logger.info('Updating a Topic', topic.id, event.event_id);

                                // FIXME: Every update will trigger a new update event, we need to avoid that if content has not changed?

                                return userAgent
                                    .put(urlApi + '/api/users/self/topics/' + topic.id)
                                    .set('x-partner-id', partner.id)
                                    .send({
                                        description: '<!DOCTYPE HTML><html><body><<h1>' + title + '</h1><p>' + description + '</p></body>'
                                    })
                                    .then(function () {
                                        logger.info('Done updating Topic', event.event_id);

                                        stats.updated++;
                                    });
                            }
                        })
                        .catch(function (err) {
                            logger.error('Failed to import Topic', event.event_id, err);

                            stats.failed++;
                        });
                } else {
                    logger.warn('Ignoring AF event due to lack of information', event);

                    stats.ignored++;
                }
            });
    })
    .then(function () {
        logger.info('Data import finished!', stats);
    })
    .catch(function (err) {
        logger.error('Data import failed', err, stats);
    });