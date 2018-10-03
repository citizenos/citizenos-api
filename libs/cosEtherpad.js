'use strict';

/**
 * Encapsulate Etherpad (EP) logic that is specific to Toru
 *
 * Created by m on 25.11.15.
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_api_methods}
 */

module.exports = function (app) {
    var etherpadClient = app.get('etherpadClient');
    var Promise = app.get('Promise');
    var models = app.get('models');
    var db = models.sequelize;
    var config = app.get('config');
    var logger = app.get('logger');
    var jwt = app.get('jwt');
    var mu = app.get('mu');
    var util = app.get('util');
    var encoder = app.get('encoder');
    var cosActivities = app.get('cosActivities');
    var path = require('path');
    var translations = require('./translations')(path.resolve('./views/etherpad/languages'));

    var Topic = models.Topic;

    /**
     * Create a Topic in Etherpad system.
     *
     * That is:
     * * Create a Group as every session is given to a Group
     * * Create a Pad for the Group, the pad name will be topicId
     *
     * @param {string} topicId Topic id in CitizenOS
     * @param {string} [language='en'] ISO 2 char language code
     * @param {string} [html] Default text of the Topic in Etherpad
     *
     * @returns {Promise<String>} Etherpad groupID
     * @private
     */
    var _createTopic = function (topicId, language, html) {
        var lang = translations[language];
        if (!lang) {
            lang = translations.en;
        }

        return etherpadClient
            .createPadAsync({padID: topicId})
            .then(function () {
                if (html) {
                    return Promise.resolve(html);
                } else {
                    var stream = mu.compileAndRender(
                        'etherpad/default.mu',
                        {
                            title: lang.PLACEHOLDER_TITLE,
                            description: lang.PLACEHOLDER_TOPIC_TEXT
                        }
                    );

                    return util.streamToString(stream);
                }
            })
            .then(function (padHtml) {
                return etherpadClient.setHTMLAsync({
                    padID: topicId,
                    html: padHtml
                });
            });
    };


    var _updateTopic = function (topicId, html) {
        return etherpadClient.setHTMLAsync({
            padID: topicId,
            html: html
        });
    };

    /**
     * Delete Topic from Etherpad system.
     *
     * @param {string} topicId Topic id in CitizenOS
     *
     * @returns {Promise} ethrepadClient delete promise
     * @private
     */
    var _deleteTopic = function (topicId) {
        return etherpadClient
            .deletePadAsync({padID: topicId});
    };

    /**
     * Create JWT token for session handover
     *
     * @param {object} topic Topic Sequelize instance
     * @param {string} userId User id
     * @param {string} name Users name displayed in Etherpad
     * @param {string} language ISO 2 letter language code
     * @param {object} [partner] Partner Sequelize instance
     *
     * @returns {string} JWT token
     *
     * @private
     */
    var _getUserAccessUrl = function (topic, userId, name, language, partner) {

        /**
         * Using JWT to send data to ep_auth_citizenos because:
         * * EP is unable to map User ID -> Author on their side
         * * Not query data from DB again
         * * EP is so locked with using it's own sessionID cookie
         *
         * NOTE: If the payload gets too big, we may hit GET request length limit of 2048 bytes for some browsers!
         */
        var jwtPayload = {
            user: {
                id: userId,
                name: name
            }
        };

        var token = jwt.sign(jwtPayload, config.session.privateKey, {
            expiresIn: '1m',
            algorithm: config.session.algorithm
        });
        var url = topic.padUrl + '?jwt=' + token + '&lang=' + language;

        if (partner) {
            url += '&theme=' + partner.id;
        }

        return url;
    };

    /**
     * Generate public URL for Topics Pad
     *
     * @param {string} topicId Topic ID
     *
     * @returns {string} Absolute url to Pad
     *
     * @private
     */
    var _getTopicPadUrl = function (topicId) {
        var host = config.services.etherpad.host;
        var port = config.services.etherpad.port;
        var protocol = config.services.etherpad.ssl ? 'https' : 'http';

        var url = protocol + '://' + host + '/p/:topicId';
        if (port !== '443') {
            url = protocol + '://' + host + ':' + port + '/p/:topicId';
        }

        return url.replace(':topicId', topicId);
    };

    /**
     * Update Topic with Pad contents
     *
     * @param {string} html Topic html
     *
     * @returns {string} Topic html
     *
     * @private
     */
    var _replaceFsTags = function (html) {
        html = html
            .replace(/<\/?(center|justify|right|left|fs+\d*)\s?.*?>/g, function (match, className) {
                if (match.indexOf('/') > 0) {
                    return '</span>';
                } else {
                    return '<span class="' + className + '" >';
                }
            })
            .replace(/<span class='color:?(\w*)'>|<span data-color="(\w*)">/g, function (match, className, className2) {
                if (!className) {
                    className = className2;
                }

                return '<span class="' + className + '" >';
            });

        return html;
    };

    /**
     * Extract Topic title from Pad contents
     *
     * TODO: Public just for testing, bad design, but oh will do for now
     *
     * @param {string} str (HTML) string to parse for Topic title
     *
     * @returns {string} Title text
     *
     * @private
     */
    var _getTopicTitleFromPadContent = function (str) {
        var title;
        var headingMatch = str.match(/<h[1-6]>([^<]+)<\/h[1-6]>/i);
        if (headingMatch && headingMatch.length > 0) {
            title = headingMatch[1];
        } else {
            title = str.substr(0, 255);
        }

        // Remove all HTML tags
        title = title.replace(/<[^>]*>/gm, '');

        if (title.length > Topic.TITLE_LENGTH_MAX) {
            title = title.substr(0, Topic.TITLE_LENGTH_MAX - 1 - 3) + '...';
        }

        // Etherpad has HTML encoded everything, we want it stored not encoded
        title = encoder.decode(title);

        // Replace all whitespace characters with ' '
        title = title.replace(/[​\s]+/g, ' '); //eslint-disable-line no-irregular-whitespace

        return title;
    };

    var _syncTopicWithPad = function (topicId, context, actor, rev) {
        logger.info('Sync topic with Pad', topicId, rev);

        var params = {padID: topicId};
        if (rev) {
            params.rev = rev;
        }

        return etherpadClient
            .getHTMLAsync(params)
            .then(function (res) {
                var html = _replaceFsTags(res.html);
                var title = _getTopicTitleFromPadContent(html);

                return db.transaction(function (t) {
                    return Topic
                        .findOne({
                            where: {
                                id: topicId
                            }
                        })
                        .then(function (topic) {
                            topic.title = title;
                            topic.description = html;
                            if (!actor) {
                                actor = {type: 'System'};
                            }

                            // TODO: ADD CHECK HERE, IF another event not updated (description) has been added then create new else update last description edit updatedAt field
                            return cosActivities
                                .updateTopicDescriptionActivity(topic, null, actor, ['id', 'title', 'status', 'visibility', 'sourcePartnerId'], context, t)
                                .then(function () {
                                    return topic
                                        .update(
                                            {
                                                title: title,
                                                description: html
                                            },
                                            {
                                                where: {
                                                    id: topicId,
                                                    status: Topic.STATUSES.inProgress // Only in progress Topics can be updated
                                                },
                                                limit: 1
                                            },
                                            {
                                                transaction: t
                                            }
                                        );
                                });
                        });
                });
            });
    };

    return {
        createTopic: _createTopic,
        updateTopic: _updateTopic,
        deleteTopic: _deleteTopic,
        getUserAccessUrl: _getUserAccessUrl,
        getTopicPadUrl: _getTopicPadUrl,
        syncTopicWithPad: _syncTopicWithPad,
        getTopicTitleFromPadContent: _getTopicTitleFromPadContent
    };
};
