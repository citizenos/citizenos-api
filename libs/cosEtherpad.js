'use strict';

/**
 * Encapsulate Etherpad (EP) logic that is specific to Toru
 *
 * Created by m on 25.11.15.
 *
 * @see {@link http://etherpad.org/doc/v1.5.7/#index_api_methods}
 */

module.exports = function (app) {
    const etherpadClient = app.get('etherpadClient');
    const models = app.get('models');
    const db = models.sequelize;
    const config = app.get('config');
    const logger = app.get('logger');
    const jwt = app.get('jwt');
    const decode = require('html-entities').decode;
    const cosActivities = app.get('cosActivities');
    const path = require('path');
    const fs = app.get('fs');

    const Topic = models.Topic;
    const User = models.User;

    const TEMPLATE_ROOT = app.get('TEMPLATE_ROOT');

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
    const _createTopic = async function (topicId, language, html) {
        const lang = language ? language : 'en';

        await etherpadClient.createPadAsync({padID: topicId});
        let padHtml = html;
        if (!padHtml) {
            padHtml = (await fs.readFileAsync(path.join(TEMPLATE_ROOT, 'etherpad/build/default_' + lang + '.html'))).toString();
        }

        return etherpadClient.setHTMLAsync({
            padID: topicId,
            html: padHtml
        });
    };


    const _updateTopic = async function (topicId, html) {
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
    const _deleteTopic = async function (topicId) {
        return etherpadClient
            .deletePadAsync({padID: topicId});
    };

    const _createToken = (userId, name) => {
        const jwtPayload = {
            user: {
                id: userId,
                name: name
            }
        };

        return jwt.sign(jwtPayload, config.session.privateKey, {
            expiresIn: '1m',
            algorithm: config.session.algorithm
        });
    }
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

    const _getUserAccessUrl = function (topic, userId, name, language, partner) {

        /**
         * Using JWT to send data to ep_auth_citizenos because:
         * * EP is unable to map User ID -> Author on their side
         * * Not query data from DB again
         * * EP is so locked with using it's own sessionID cookie
         *
         * NOTE: If the payload gets too big, we may hit GET request length limit of 2048 bytes for some browsers!
         */

        const token = _createToken(userId, name);
        let url = topic.padUrl + '?jwt=' + token + '&lang=' + language;

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
    const _getTopicPadUrl = function (topicId) {
        const host = config.services.etherpad.host;
        const port = config.services.etherpad.port;
        const protocol = config.services.etherpad.ssl ? 'https' : 'http';

        let url = protocol + '://' + host + '/p/:topicId';
        if (port !== '443') {
            url = protocol + '://' + host + ':' + port + '/p/:topicId';
        }

        return url.replace(':topicId', topicId);
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
    const _getTopicTitleFromPadContent = function (str) {
        let title;
        const headingMatch = str.match(/(?!<h[1-6]><\/h[1-6]>)<h[1-6]>(.+?)<\/h[1-6]>/i);
        if (headingMatch && headingMatch.length > 0) {
            title = headingMatch[1];
        } else {
            title = str.substr(0, 2550);
        }

        // Remove all HTML tags
        title = title.replace(/<[^>]*>/gm, '');
        // Etherpad has HTML encoded everything, we want it stored not encoded
        title = decode(title);

        if (title.length > Topic.TITLE_LENGTH_MAX) {
            title = title.substr(0, Topic.TITLE_LENGTH_MAX - 1 - 3) + '...';
        }

        // Replace all whitespace characters with ' '
        title = title.replace(/[​\s]+/g, ' '); //eslint-disable-line no-irregular-whitespace

        return title.trim();
    };

    const _getTopicPadAuthors = async function (topicId) {
        const authors = await etherpadClient
            .listAuthorsOfPadAsync({padID: topicId})
            .catch(function (err) {
                logger.error(err);
            });

        if (authors) {
            const authorUsers = await User.findAll({
                where: {
                    authorId: authors.authorIDs
                },
                attributes: ['id'],
                raw: true
            });

            return authorUsers.map(function (user) {
                return user.id
            });
        }

        return;
    };

    const _inlineToClasses = async (html) => {
        return html.replace(/style=/gi, 'class=').replace(/text-align:/gi, '');
    };

    const _syncTopicWithPad = async function (topicId, context, actor, rev, addActivity) {
        logger.info('Sync topic with Pad', topicId, rev);
        const params = {padID: topicId};
        if (rev) {
            params.rev = rev;
        }

        let html = (await etherpadClient.getHTMLAsync(params)).html;
        html = await _inlineToClasses(html);
        const title = _getTopicTitleFromPadContent(html);

        return db.transaction(async function (t) {
            const topic = await Topic.findOne(
                {
                    where: {
                        id: topicId
                    }
                },
                {
                    transaction: t
                }
            );

            topic.title = title;
            topic.description = html;
            if (actor && addActivity) {
                // TODO: ADD CHECK HERE, IF another event not updated (description) has been added then create new else update last description edit updatedAt field
                await cosActivities.updateTopicDescriptionActivity(
                    topic,
                    null,
                    actor,
                    ['id', 'title', 'status', 'visibility', 'sourcePartnerId'],
                    context,
                    t
                );
            }

            return topic.update(
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
    };

    const _getTopicInlineCommentReplies = async (topicId, userId, name) => {
        const token = _createToken(userId, name);
        const options = config.services.etherpad;
        options.rootPath = '/p/:pad/0/'.replace(':pad', topicId);
        const etherpadClient = require('etherpad-lite-client').connect(options);

        return new Promise((resolve, reject) => {
            etherpadClient.call(
                'commentReplies',
                {
                    apiKey: options.apikey,
                    jwt: token
                },
                (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(data);
                }
            );
        });
    };

    const _getTopicInlineComments = async (topicId, userId, name) => {
        const token = _createToken(userId, name);
        const options = config.services.etherpad;
        options.rootPath = '/p/:pad/1.2.15/'.replace(':pad', topicId);
        const etherpadClient = require('etherpad-lite-client').connect(options);

        return new Promise((resolve, reject) => {
            etherpadClient.call('comments', {
                apiKey: options.apikey,
                jwt: token
            }, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    };

    const _createPadCopy = async (sourceTopicId, newtopicId) => {
        try {
            return await etherpadClient
                .copyPadWithoutHistoryAsync({
                    sourceID: sourceTopicId,
                    destinationID: newtopicId
                });
        } catch (err) {
            console.log('_createPadCopy ERR', err);
        }
    };

    return {
        createTopic: _createTopic,
        updateTopic: _updateTopic,
        deleteTopic: _deleteTopic,
        getUserAccessUrl: _getUserAccessUrl,
        getTopicPadUrl: _getTopicPadUrl,
        syncTopicWithPad: _syncTopicWithPad,
        getTopicTitleFromPadContent: _getTopicTitleFromPadContent,
        getTopicPadAuthors: _getTopicPadAuthors,
        getTopicInlineComments: _getTopicInlineComments,
        getTopicInlineCommentReplies: _getTopicInlineCommentReplies,
        createPadCopy: _createPadCopy
    };
};
