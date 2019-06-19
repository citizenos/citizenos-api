#!/usr/bin/env node

'use strict';

var Promise = require('bluebird');

var path = require('path');
var config = require('config');
var superagent = require('superagent');
var moment = require('moment');

var log4js = require('log4js');
log4js.configure(config.logging.log4js);
var logger = log4js.getLogger(path.basename(__filename));

//var db = require('../../libs/sequelize/sequelize')(config.db.url, config.db.options, logger);

var models = require('../../db/models');
var db = models.sequelize;

var Topic = db.import('../../db/models/Topic');
var Partner = db.import('../../db/models/Partner');
var User = db.import('../../db/models/User');

var urlApi = config.url.api;
var userEmail = process.env.CITIZENOS_ARVAMUSFESTIVAL_DATA_IMPORTER_USER_EMAIL;
var userPassword = process.env.CITIZENOS_ARVAMUSFESTIVAL_DATA_IMPORTER_USER_PASSWORD;
var afApiKey = process.env.CITIZENOS_ARVAMUSFESTIVAL_DATA_IMPORTER_AF_API_KEY;

var partnerWebsite = 'https://arvamusfestival.ee';

if (!urlApi || !userEmail || !userPassword || !afApiKey) {
    logger.error('Missing required parameters - API url or User email or password!', urlApi, userEmail);

    return process.exit(1);
}

var user;
var partner;
var userAgent;

var stats = {
    total: 0,
    updated: 0,
    created: 0,
    failed: 0,
    ignored: 0,
    skipped: 0
};

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
                    name: 'Arvamusfestival 2019',
                    company: 'MTÜ Arvamusfestival',
                    language: 'et',
                    source: User.SOURCES.citizenosSystem
                }
            });
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
            .timeout(1000 * 10)
            .send('app_secret=' + afApiKey)
            .send('mode=active\
            ');
    })
    .then(function (resultEvents) {
        // AF API returns JSON but response content type is text/html thus Superagent does not parse JSON
        var events = JSON.parse(resultEvents.text).events;
        logger.debug('AF API responded with', events.length);

        stats.total = events.length;

        return Promise
            .each(events, function (event) {
                if (!Number(event.hide_afoorum)) {                    
                    var title = event.name_est;
                    var description = event.short_description_est;

                    if (title && description && Boolean(title.trim()) && Boolean(description.trim())) {
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
                                    logger.info('Creating a new Topic', event.event_id, event.time_updated);

                                    return userAgent
                                        .post(urlApi + '/api/users/self/topics')
                                        .set('x-partner-id', partner.id)
                                        .send({
                                            description: '<!DOCTYPE HTML><html><body><h1>' + title + '</h1><p>' + description.replace(/\r/g, '').replace(/\n/g, '<br>') + '</p></body>',
                                            visibility: Topic.VISIBILITY.public,
                                            sourcePartnerObjectId: event.event_id
                                        })
                                        .then(function (res) {
                                            var resTopic = res.body.data;

                                            return Topic
                                                .update(
                                                    {
                                                        createdAt: moment.tz(event.time_updated, 'Europe/Tallinn'),
                                                        updatedAt: moment.tz(event.time_updated, 'Europe/Tallinn')
                                                    },
                                                    {
                                                        where: {
                                                            id: resTopic.id
                                                        }
                                                    }
                                                );
                                        })
                                        .then(function () {
                                            stats.created++;
                                        });
                                } else { // update Topic
                                    logger.info('Updating a Topic', topic.id, event.event_id);

                                    return userAgent
                                        .put(urlApi + '/api/users/self/topics/' + topic.id)
                                        .set('x-partner-id', partner.id)
                                        .send({
                                            description: '<!DOCTYPE HTML><html><body><h1>' + title + '</h1><p>' + description.replace(/\r/g, '').replace(/\n/g, '<br>') + '</p></body>'
                                        })
                                        .then(function () {
                                            return Topic
                                                .update(
                                                    {
                                                        updatedAt: moment.tz(event.time_updated, 'Europe/Tallinn')
                                                    },
                                                    {
                                                        where: {
                                                            id: topic.id
                                                        }
                                                    }
                                                );
                                        })
                                        .then(function (res) {
                                            logger.info('Done updating Topic', res.body, event.event_id);

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
                } else {
                    logger.warn('Ignoring AF event due to settings', event);
                    stats.skipped++;
                }
            });
    })
    .then(function () {
        logger.info('Data import finished!', stats);
    })
    .catch(function (err) {
        logger.error('Data import failed', err, stats);
    });
