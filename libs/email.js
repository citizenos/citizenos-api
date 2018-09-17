'use strict';

/**
 * All emails sent by the system
 *
 * TODO: Write all to Promises
 */

module.exports = function (app) {
    var emailClient = app.get('emailClient');
    var logger = app.get('logger');
    var db = app.get('db');
    var Promise = app.get('Promise');
    var urlLib = app.get('urlLib');
    var _ = app.get('lodash');
    var config = app.get('config');
    var util = app.get('util');
    var fs = app.get('fs');
    var path = require('path');
    var moment = app.get('moment');
    var url = app.get('url');
    var jwt = app.get('jwt');

    var User = app.get('models.User');
    var Topic = app.get('models.Topic');
    var Group = app.get('models.Group');
    var TopicMember = app.get('models.TopicMember');

    var templateRoot = app.get('EMAIL_TEMPLATE_ROOT');
    var templateRootLocal = app.get('EMAIL_TEMPLATE_ROOT_LOCAL');

    var emailHeaderLogoName = 'logo.png';
    var emailHeaderLogo = path.join(templateRoot, 'images/logo-email.png');
    if (fs.existsSync(path.join(templateRootLocal, 'images/logo-email.png'))) { //eslint-disable-line no-sync
        emailHeaderLogo = path.join(templateRootLocal, 'images/logo-email.png');
    }
    logger.info('Using email header logo from', emailHeaderLogo);

    var templateCache = {};

    /**
     * Resolve template (body and localization strings) based on template name and language.
     *
     * The *.mu template can have an HTML multiline comment, which contains translation strings like e-mail subject
     *
     * @param {string} template Template name WITHOUT the ".mu" extension
     * @param {string} [language] Language code (en, et). Default 'en'.
     *
     * @return {object} Template object {body: .., translations: }
     *
     * @private
     */
    var resolveTemplate = function (template, language) {
        language = language ? language.toLowerCase() : 'en';

        var pathTemplate = ':templateRoot/build/:template_:language.mu'
            .replace(':templateRoot', templateRoot)
            .replace(':template', template)
            .replace(':language', language);

        var pathTranslations = ':templateRoot/languages/:language.json'
            .replace(':templateRoot', templateRoot)
            .replace(':language', language);

        var templateObj = {
            body: null,
            translations: null
        };

        var cachedTemplateObj = templateCache[pathTemplate];
        if (cachedTemplateObj) {
            return cachedTemplateObj;
        }

        try {
            // TODO: Rewrite to async FS operations
            templateObj.body = fs.readFileSync(pathTemplate, {encoding: 'utf8'}); // eslint-disable-line no-sync
            templateObj.translations = JSON.parse(fs.readFileSync(pathTranslations, {encoding: 'utf8'})); // eslint-disable-line no-sync
            templateCache[pathTemplate] = templateObj;

            return templateObj;
        } catch (e) {
            logger.warn('Template could not be read!', pathTemplate);
        }
    };

    var _defaultCallback = function (err, res) {
        if (err) {
            logger.error('Sending of e-mail failed', err, res);
        } else {
            logger.info('Email sent successfully.', err, res);
        }
    };

    /**
     * Send e-mail verification email.
     *
     * @param {string|Array} to To e-mail(s)
     * @param {string} emailVerificationCode Account verification code
     * @param {string} token JWT token representing the state
     * @param {function} [callback] (err, res)
     *
     * @returns {void}
     *
     * @private
     */
    var _sendVerification = function (to, emailVerificationCode, token, callback) {
        User
            .findAll({
                where: {
                    email: to
                }
            })
            .then(function (users) {
                _.forEach(users, function (user) {
                    var templateObject = resolveTemplate('accountVerification', user.language);

                    var linkVerify = urlLib.getApi('/api/auth/verify/:code', {code: emailVerificationCode}, {token: token});

                    // https://github.com/bevacqua/campaign#email-sending-option
                    emailClient.sendString(templateObject.body, {
                        subject: templateObject.translations.ACCOUNT_VERIFICATION.SUBJECT,
                        to: user.email,
                        social: config.email.social,
                        images: [
                            {
                                name: emailHeaderLogoName,
                                file: emailHeaderLogo
                            }
                        ],
                        //Placeholders
                        toUser: user,
                        linkVerify: linkVerify,
                        linkToApplication: urlLib.getFe(),
                        provider: {
                            merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                        }
                    }, callback || _defaultCallback);
                });
            })
            .catch(callback || _defaultCallback);
    };

    /**
     * Send password reset e-mail
     *
     * @param {(string|Array)} to To e-mail(s)
     * @param {string} passwordResetCode Account password reset code
     * @param {function} [callback] (err, res)
     *
     * @returns {void}
     *
     * @private
     */
    var _sendPasswordReset = function (to, passwordResetCode, callback) {
        User
            .findAll({
                where: {
                    email: to
                }
            })
            .then(function (users) {
                _.forEach(users, function (user) {
                    var template = resolveTemplate('passwordReset', user.language);

                    emailClient.sendString(template.body, {
                        subject: template.translations.PASSWORD_RESET.SUBJECT,
                        to: user.email,
                        images: [
                            {
                                name: emailHeaderLogoName,
                                file: emailHeaderLogo
                            }
                        ],
                        social: config.email.social, // social.name maps to "from_name". I think this should be part of Campaign client config OR at least defaults can be set somewhere in client options
                        //Placeholders..
                        toUser: user,
                        linkReset: urlLib.getFe('/account/password/reset/:passwordResetCode', {passwordResetCode: passwordResetCode}, {email: user.email}),
                        linkToApplication: urlLib.getFe(),
                        provider: {
                            merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                        }
                    }, callback || _defaultCallback);
                });
            })
            .catch(callback || _defaultCallback);
    };

    /**
     * Send Topic invite e-mail
     *
     * @param {(string|Array)} toUserIds User ID-s
     * @param {string} fromUserId From User ID
     * @param {string} topicId Topic ID
     * @param {object|null} partner Partner Sequelize instance
     *
     * @returns {void}
     *
     * @private
     */
    var _sendTopicInvite = function (toUserIds, fromUserId, topicId, partner) {
        if (!toUserIds || !fromUserId || !topicId) {
            throw new Error('Missing one or more required parameters');
        }

        if (!Array.isArray(toUserIds)) {
            toUserIds = [toUserIds];
        }

        if (!toUserIds.length) {
            logger.info('Got empty receivers list, no emails will be sent.');

            return;
        }

        var toUsersPromise = User.findAll({
            where: {
                id: toUserIds
            },
            attributes: ['email', 'language', 'name'],
            raw: true
        });

        var fromUserPromise = User.findOne({
            where: {
                id: fromUserId
            }
        });

        var topicPromise = Topic.findOne({
            where: {
                id: topicId
            }
        });

        Promise
            .all([toUsersPromise, fromUserPromise, topicPromise])
            .then(function (results) {
                var toUsers = results[0];
                var fromUser = results[1].toJSON();
                var topic = results[2].toJSON();

                if (toUsers && toUsers.length) {

                    var from;
                    var logoFile;
                    var templateName;
                    var linkToApplication;

                    var sourceSite;

                    if (partner) {
                        var hostname = url.parse(partner.website).hostname;
                        if (hostname !== url.parse(urlLib.getFe()).hostname) { // For the time CitizenOS is not configured as partner
                            sourceSite = hostname;
                        }
                    }

                    if (!sourceSite) {
                        // Handle CitizenOS links
                        from = config.email.from;
                        logoFile = emailHeaderLogo;
                        templateName = 'inviteTopic';
                        linkToApplication = urlLib.getFe();
                    } else {
                        // Handle Partner links
                        from = 'info@' + sourceSite.match(/[^.]*\.[^.]*$/)[0]; // uuseakus.rahvaalgatus.ee to have from rahvaalgatus.ee so thta Mailgun would not reject it
                        logoFile = templateRoot + '/images/logo-email_' + sourceSite + '.png';
                        templateName = 'inviteTopic_' + sourceSite;
                        linkToApplication = partner.website;
                    }

                    //TODO: we can win performance if we collect together all Users with same language and send these with 1 request to mail provider
                    _.forEach(toUsers, function (user) {
                        var template = resolveTemplate(templateName, user.language);

                        // TODO: Ideally needed only in test, we need to rethink partner template handling...
                        if (!template && sourceSite) { // Fall back to top level domain template if subdomain template is missing (initially written for uuseakus.rahvaalgatus.ee and rahvaalgatus.ee
                            sourceSite = sourceSite.match(/[^.]*\.[^.]*$/)[0];
                            from = 'info@' + sourceSite;
                            template = resolveTemplate('inviteTopic_' + sourceSite, user.language);
                        }

                        var subject;
                        var linkViewTopic;

                        // Handle Partner links
                        if (!sourceSite) {
                            // TODO: could use Mu here...
                            subject = template.translations.INVITE_TOPIC.SUBJECT
                                .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name));
                            linkViewTopic = urlLib.getApi('/api/invite/view', null, {
                                email: user.email,
                                topicId: topic.id
                            });
                        } else {
                            // TODO: could use Mu here...
                            subject = template.translations.INVITE_TOPIC['SUBJECT_' + sourceSite.replace(/\./g, '_')] // Cant use '.' in translation key as it defines nesting
                                .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name));
                            linkViewTopic = linkToApplication + '/topics/:topicId'.replace(':topicId', topic.id);
                        }

                        // In case Topic has no title, just show the full url.
                        topic.title = topic.title ? topic.title : linkViewTopic;

                        emailClient.sendString(template.body, {
                            from: from,
                            subject: subject,
                            to: user.email,
                            images: [
                                {
                                    name: emailHeaderLogoName,
                                    file: logoFile
                                }
                            ],
                            social: config.email.social, // social.name maps to "from_name". I think this should be part of Campaign client config OR at least defaults can be set somewhere in client options
                            toUser: user,
                            fromUser: fromUser,
                            topic: topic,
                            linkViewTopic: linkViewTopic,
                            linkToApplication: linkToApplication,
                            provider: {
                                merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                            }
                        }, _defaultCallback);
                    });
                } else {
                    logger.info('No Topic User invite emails to be sent as filtering resulted in empty e-mail address list.');
                }
            }, _defaultCallback)
            .catch(_defaultCallback);

    };

    /**
     * Send Topic invite e-mail all members of the Groups
     *
     * @param {(string|Array)} toGroupIds Group ID-s for which Members the invite will be sent.
     * @param {string} fromUserId From User ID
     * @param {string} topicId Topic ID
     *
     * @returns {void}
     *
     * @private
     */
    var _sendTopicGroupInvite = function (toGroupIds, fromUserId, topicId) {
        if (!toGroupIds || !fromUserId || !topicId) {
            throw new Error('Missing one or more required parameters');
        }

        if (!Array.isArray(toGroupIds)) {
            toGroupIds = [toGroupIds];
        }

        if (!toGroupIds.length) {
            logger.info('Got empty receivers list, no emails will be sent.');

            return;
        }

        var toUsersPromise = db
            .query(
                '\
                     SELECT DISTINCT ON (gm."userId") \
                        gm."userId", \
                        u."email", \
                        u."language", \
                        u.name \
                     FROM "GroupMembers" gm \
                     LEFT JOIN "Users" u ON (gm."userId" = u.id) \
                     WHERE gm."groupId"::text IN (:toGroupIds) \
                     AND gm."userId" != :fromUserId \
                ;',
                {
                    replacements: {
                        toGroupIds: toGroupIds,
                        fromUserId: fromUserId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );

        var fromUserPromise = User.findOne({
            where: {
                id: fromUserId
            }
        });

        var topicPromise = Topic.findOne({
            where: {
                id: topicId
            }
        });

        Promise
            .all([toUsersPromise, fromUserPromise, topicPromise])
            .then(function (results) {
                var toUsers = results[0];
                var fromUser = results[1].toJSON();
                var topic = results[2].toJSON();

                if (toUsers && toUsers.length) {
                    // TODO: We can gain in performance if we group Users with same language code
                    _.forEach(toUsers, function (user) {
                        var template = resolveTemplate('inviteTopic', user.language);
                        // TODO: Could use Mu here....
                        var subject = template.translations.INVITE_TOPIC.SUBJECT
                            .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name));

                        var linkViewTopic = urlLib.getApi('/api/invite/view', null, {
                            email: user.email,
                            topicId: topic.id
                        });

                        // In case Topic has no title, just show the full url.
                        topic.title = topic.title ? topic.title : linkViewTopic;

                        emailClient.sendString(template.body, {
                            subject: subject,
                            to: user.email,
                            images: [
                                {
                                    name: emailHeaderLogoName,
                                    file: emailHeaderLogo
                                }
                            ],
                            social: config.email.social, // social.name maps to "from_name". I think this should be part of Campaign client config OR at least defaults can be set somewhere in client options
                            toUser: user,
                            fromUser: fromUser,
                            topic: topic,
                            linkViewTopic: linkViewTopic,
                            linkToApplication: urlLib.getFe(),
                            provider: {
                                merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                            }
                        }, _defaultCallback);
                    });
                } else {
                    logger.info('No Topic Group member User invite emails to be sent as filtering resulted in empty e-mail address list.');
                }
            }, _defaultCallback)
            .catch(_defaultCallback);

    };

    /**
     * Send Group invite e-mail
     *
     * @param {(string|Array)} toUserIds User ID-s
     * @param {string} fromUserId From User ID
     * @param {string} groupId Group ID
     *
     * @returns {void}
     *
     * @private
     */
    var _sendGroupInvite = function (toUserIds, fromUserId, groupId) {
        if (!toUserIds || !fromUserId || !groupId) {
            throw new Error('Missing one or more required parameters');
        }

        if (!Array.isArray(toUserIds)) {
            toUserIds = [toUserIds];
        }

        if (!toUserIds.length) {
            logger.info('Got empty receivers list, no emails will be sent.');

            return;
        }

        var toUsersPromise = User.findAll({
            where: {
                id: toUserIds
            },
            attributes: ['email', 'language', 'name'],
            raw: true
        });

        var fromUserPromise = User.findOne({
            where: {
                id: fromUserId
            }
        });

        var groupPromise = Group.findOne({
            where: {
                id: groupId
            }
        });

        Promise
            .all([toUsersPromise, fromUserPromise, groupPromise])
            .then(function (results) {
                var toUsers = results[0];
                var fromUser = results[1].toJSON();
                var group = results[2].toJSON();

                if (toUsers && toUsers.length) {
                    // TODO: We can gain in performance if we group Users with the same language
                    _.forEach(toUsers, function (user) {
                        var template = resolveTemplate('inviteGroup', user.language);
                        // TODO: could use Mu here...
                        var subject = template.translations.INVITE_GROUP.SUBJECT
                            .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name))
                            .replace('{{group.name}}', util.escapeHtml(group.name));

                        emailClient.sendString(template.body, {
                            subject: subject,
                            to: user.email,
                            images: [
                                {
                                    name: emailHeaderLogoName,
                                    file: emailHeaderLogo
                                }
                            ],
                            social: config.email.social, // social.name maps to "from_name". I think this should be part of Campaign client config OR at least defaults can be set somewhere in client options
                            //Placeholders..
                            toUser: user,
                            fromUser: fromUser,
                            group: group,
                            linkViewGroup: urlLib.getApi('/api/invite/view', null, {
                                email: user.email,
                                groupId: group.id
                            }),
                            linkToApplication: urlLib.getFe(),
                            provider: {
                                merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                            }
                        }, _defaultCallback);
                    });
                } else {
                    logger.info('No Group member User invite emails to be sent as filtering resulted in empty e-mail address list.');
                }
            }, _defaultCallback)
            .catch(_defaultCallback);

    };


    /**
     * Send comment report related e-mails
     *
     * @param {string} commentId Comment id
     * @param {object} report Report Sequelize instance
     *
     * @returns {Promise} Comment report result
     *
     * @private
     */
    var _sendCommentReport = function (commentId, report) {
        return db
            .query(
                ' \
                    SELECT \
                        tc."commentId" as "comment.id", \
                        c."subject" as "comment.subject", \
                        c."text" as "comment.text", \
                        c."updatedAt" as "comment.updatedAt",\
                        u."name" as "comment.creator.name", \
                        u."email" as "comment.creator.email", \
                        u."language" as "comment.creator.language", \
                        t."id" as "topic.id", \
                        t."sourcePartnerId" as "topic.sourcePartnerId", \
                        t."visibility" as "topic.visibility"\
                    FROM "TopicComments" tc \
                        JOIN "Topics" t ON (t.id = tc."topicId") \
                        JOIN "Comments" c ON (c.id = tc."commentId") \
                        JOIN "Users" u ON (u.id = c."creatorId") \
                    WHERE tc."commentId" = :commentId \
                ',
                {
                    replacements: {
                        commentId: commentId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .spread(function (commentInfo) {
                if (commentInfo.topic.visibility === Topic.VISIBILITY.public) {
                    logger.debug('Topic is public, sending e-mails to registered partner moderators', commentInfo);

                    return db
                        .query(
                            ' \
                                SELECT \
                                    u.id, \
                                    u."email", \
                                    u."name", \
                                    u."language" \
                                FROM "Moderators" m \
                                    JOIN "Users" u ON (u.id = m."userId") \
                                WHERE u."email" IS NOT NULL \
                                AND (m."partnerId" = :partnerId \
                                OR m."partnerId" IS NULL) \
                            ',
                            {
                                replacements: {
                                    partnerId: commentInfo.topic.sourcePartnerId
                                },
                                type: db.QueryTypes.SELECT,
                                raw: true,
                                nest: true
                            }
                        )
                        .then(function (moderators) {
                            return [commentInfo, moderators];
                        });
                } else {
                    logger.debug('Topic is NOT public, sending e-mails to Users with admin permissions', commentInfo);
                    // Private Topics will have moderation by admin Users

                    return db
                        .query(
                            '\
                                SELECT \
                                    tm.id, \
                                    tm.name, \
                                    tm.email, \
                                    tm.language \
                                FROM ( \
                                    SELECT DISTINCT ON(id) \
                                        tm."memberId" as id, \
                                        tm."level", \
                                        u.name, \
                                        u.email, \
                                        u.language \
                                    FROM "Topics" t \
                                    JOIN ( \
                                        SELECT \
                                            tmu."topicId", \
                                            tmu."userId" AS "memberId", \
                                            tmu."level"::text, \
                                            1 as "priority" \
                                        FROM "TopicMemberUsers" tmu \
                                        WHERE tmu."deletedAt" IS NULL \
                                        UNION \
                                        ( \
                                            SELECT \
                                                tmg."topicId", \
                                                gm."userId" AS "memberId", \
                                                tmg."level"::text, \
                                                2 as "priority" \
                                            FROM "TopicMemberGroups" tmg \
                                            LEFT JOIN "GroupMembers" gm ON (tmg."groupId" = gm."groupId") \
                                            WHERE tmg."deletedAt" IS NULL \
                                            AND gm."deletedAt" IS NULL \
                                            ORDER BY tmg."level"::"enum_TopicMemberGroups_level" DESC \
                                        ) \
                                    ) AS tm ON (tm."topicId" = t.id) \
                                    JOIN "Users" u ON (u.id = tm."memberId") \
                                    LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm."memberId" AND tmu."topicId" = t.id) \
                                    WHERE t.id = :topicId \
                                    ORDER BY id, tm.priority \
                                ) tm \
                                WHERE tm.level::"enum_TopicMemberUsers_level" >= :level \
                                AND tm.email IS NOT NULL \
                                ORDER BY name ASC \
                            ',
                            {
                                replacements: {
                                    topicId: commentInfo.topic.id,
                                    level: TopicMember.LEVELS.admin
                                },
                                type: db.QueryTypes.SELECT,
                                raw: true,
                                nest: true
                            }
                        )
                        .then(function (moderators) {
                            return [commentInfo, moderators];
                        });
                }
            })
            .spread(function (commentInfo, moderators) {
                var promisesToResolve = [];

                // Comment creator e-mail - TODO: Comment back in when comment editing goes live!
                var commentCreatorInformed = true;
                if (commentInfo.comment.creator.email) {
                    var promiseCreatorEmail = new Promise(function (resolve, reject) {
                        var templateObject = resolveTemplate('reportCommentCreator', commentInfo.comment.creator.language);

                        var linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: commentInfo.topic.id});

                        emailClient.sendString(
                            templateObject.body,
                            {
                                subject: templateObject.translations.REPORT_COMMENT_CREATOR.SUBJECT,
                                to: commentInfo.comment.creator.email,
                                social: config.email.social,
                                images: [
                                    {
                                        name: emailHeaderLogoName,
                                        file: emailHeaderLogo
                                    }
                                ],
                                //Placeholders
                                comment: commentInfo.comment,
                                report: {
                                    type: templateObject.translations.REPORT_COMMENT.REPORT_TYPE[report.type.toUpperCase()],
                                    text: report.text
                                },
                                linkViewTopic: linkViewTopic,
                                linkToApplication: urlLib.getFe(),
                                provider: {
                                    merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                                }
                            },
                            function (err, res) {
                                if (err) {
                                    logger.error('Failed to send comment report e-mail to comment creator', err, res);

                                    return reject(err);
                                }
                                logger.info('Sent comment report e-mail to comment creator', commentInfo);

                                return resolve(res);
                            }
                        );
                    });
                    promisesToResolve.push(promiseCreatorEmail);
                } else {
                    logger.info('Comment reported, but no e-mail could be sent to creator as there is no e-mail in the profile', commentInfo);
                    commentCreatorInformed = false;
                }

                if (moderators) {
                    var linkModerate = urlLib.getFe(
                        '/topics/:topicId/comments/:commentId/reports/:reportId/moderate',
                        {
                            topicId: commentInfo.topic.id,
                            commentId: commentInfo.comment.id,
                            reportId: report.id
                        }
                    );

                    moderators.forEach(function (moderator) {
                        var promiseModeratorEmail = new Promise(function (resolve, reject) {
                            var templateObject = resolveTemplate('reportCommentModerator', moderator.language);
                            var token = jwt.sign(
                                {
                                    paths: [
                                        'POST_/api/topics/:topicId/comments/:commentId/reports/:reportId/moderate'
                                            .replace(':topicId', commentInfo.topic.id)
                                            .replace(':commentId', commentInfo.comment.id)
                                            .replace(':reportId', report.id),
                                        'GET_/api/topics/:topicId/comments/:commentId/reports/:reportId'
                                            .replace(':topicId', commentInfo.topic.id)
                                            .replace(':commentId', commentInfo.comment.id)
                                            .replace(':reportId', report.id)
                                    ],
                                    userId: moderator.id
                                },
                                config.session.privateKey,
                                {
                                    algorithm: config.session.algorithm
                                }
                            );

                            emailClient.sendString(
                                templateObject.body,
                                {
                                    subject: templateObject.translations.REPORT_COMMENT_MODERATOR.SUBJECT,
                                    to: moderator.email,
                                    social: config.email.social,
                                    images: [
                                        {
                                            name: emailHeaderLogoName,
                                            file: emailHeaderLogo
                                        }
                                    ],
                                    //Placeholders...
                                    comment: commentInfo.comment,
                                    report: {
                                        type: templateObject.translations.REPORT_COMMENT.REPORT_TYPE[report.type.toUpperCase()],
                                        text: report.text
                                    },
                                    linkModerate: linkModerate + '?token=' + encodeURIComponent(token),
                                    isUserNotified: commentCreatorInformed,
                                    linkToApplication: urlLib.getFe(),
                                    provider: {
                                        merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                                    }
                                },
                                function (err, res) {
                                    if (err) {
                                        logger.error('Failed to send comment report e-mail to moderator', err, res);

                                        return reject(err);
                                    }
                                    logger.info('Sent comment report e-mail to moderator', commentInfo, moderator);

                                    return resolve(res);
                                }
                            );
                        });
                        promisesToResolve.push(promiseModeratorEmail);
                    });
                }

                return Promise.all(promisesToResolve);
            });
    };

    /**
     * Send e-mail to Parliament to process new initiative
     *
     * TODO: This logic is specific to Rahvaalgatus.ee, with next Partner we have to make it more generic - https://trello.com/c/Sj3XRF5V/353-raa-ee-followup-email-to-riigikogu-and-token-access-to-events-api
     *
     * @param {object} topic Topic Sequelize instance
     * @param {object} contact Contact info {name, email, phone}
     * @param {string} linkDownloadBdocFinal Absolute uri to for BDOC download
     * @param {Date} linkDownloadBdocFinalExpiryDate Download link expiry date
     * @param {string} linkAddEvent Absolute uri to a site that enables adding Events.
     *
     * @returns {Promise} Parliament email sending result
     *
     * @private
     */
    var _sendToParliament = function (topic, contact, linkDownloadBdocFinal, linkDownloadBdocFinalExpiryDate, linkAddEvent) {
        return new Promise(function (resolve, reject) {
            if (!topic || !contact || !linkDownloadBdocFinal || !linkDownloadBdocFinalExpiryDate || !linkAddEvent) {
                reject(new Error('Missing one or more required parameters'));
            }

            var template = resolveTemplate('governmentNotification', 'et'); // Estonian Gov only accepts et
            var linkToApplication = config.features.sendToParliament.urlPrefix;

            var from = config.features.sendToParliament.from;
            var to = config.features.sendToParliament.to;
            var subject = template.translations.GOVERNMENT_NOTIFICATION.SUBJECT.replace('{{topic.title}}', util.escapeHtml(topic.title));
            var linkViewTopic = linkToApplication + '/initiatives/:topicId'.replace(':topicId', topic.id);
            var logoFile = templateRoot + '/images/logo-email_rahvaalgatus.ee.png';

            // Email to Parliament - fire and forget
            emailClient.sendString(
                template.body,
                {
                    from: from,
                    subject: subject,
                    to: to,
                    images: [
                        {
                            name: emailHeaderLogoName,
                            file: logoFile
                        }
                    ],
                    social: config.email.social, // social.name maps to "from_name". I think this should be part of Campaign client config OR at least defaults can be set somewhere in client options
                    //Placeholders..
                    linkViewTopic: linkViewTopic,
                    linkDownloadBdocFinal: linkDownloadBdocFinal,
                    linkDownloadBdocFinalExpiryDate: moment(linkDownloadBdocFinalExpiryDate).locale('et').format('LL'),
                    linkAddEvent: linkAddEvent,
                    linkToApplication: linkToApplication,
                    topic: topic,
                    contact: contact,
                    provider: {
                        merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                    }
                },
                function (err) {
                    if (err) {
                        logger.error('Sending Parliament e-mail failed', topic.id, err);
                    }
                    logger.info('Sending Parliament e-mail succeeded', topic.id);
                }
            );

            // Email to Topic creator - fire and forget
            emailClient.sendString(
                template.body,
                {
                    from: from,
                    subject: subject,
                    to: contact.email,
                    images: [
                        {
                            name: emailHeaderLogoName,
                            file: logoFile
                        }
                    ],
                    social: config.email.social, // social.name maps to "from_name". I think this should be part of Campaign client config OR at least defaults can be set somewhere in client options
                    //Placeholders..
                    linkViewTopic: linkViewTopic,
                    linkDownloadBdocFinal: linkDownloadBdocFinal,
                    linkDownloadBdocFinalExpiryDate: moment(linkDownloadBdocFinalExpiryDate).locale('et').format('LL'),
                    linkAddEvent: null,
                    linkToApplication: linkToApplication,
                    topic: topic,
                    contact: contact,
                    provider: {
                        merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
                    }
                },
                function (err) {
                    if (err) {
                        return logger.error('Sending Parliament e-mail to creator failed', topic.id, err);
                    }
                    logger.info('Sending Parliament e-mail to creator succeeded', topic.id);
                }
            );

            return resolve();
        });
    };

    return {
        sendVerification: _sendVerification,
        sendPasswordReset: _sendPasswordReset,
        sendTopicInvite: _sendTopicInvite,
        sendTopicGroupInvite: _sendTopicGroupInvite,
        sendGroupInvite: _sendGroupInvite,
        sendCommentReport: _sendCommentReport,
        sendToParliament: _sendToParliament
    };
};
