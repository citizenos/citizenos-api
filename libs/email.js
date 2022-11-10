'use strict';

/**
 * All emails sent by the system
 */

module.exports = function (app) {
    const emailClient = app.get('emailClient');
    const logger = app.get('logger');
    const models = app.get('models');
    const db = models.sequelize;
    const Promise = app.get('Promise');
    const urlLib = app.get('urlLib');
    const _ = app.get('lodash');
    const config = app.get('config');
    const util = app.get('util');
    const fs = app.get('fs');
    const path = require('path');
    const moment = app.get('moment');
    const cosJwt = app.get('cosJwt');
    const Mustache = require('mustache');

    const User = models.User;
    const Topic = models.Topic;
    const Group = models.Group;
    const TopicMemberUser = models.TopicMemberUser;

    const templateRoot = app.get('EMAIL_TEMPLATE_ROOT');
    const templateRootLocal = app.get('EMAIL_TEMPLATE_ROOT_LOCAL');

    const emailHeaderLogoName = 'logo.png';
    const emailFooterLogoName = 'logo_footer.png';
    let emailHeaderLogo = path.join(templateRoot, 'images/logo-email.png');
    const emailFooterLogo = path.join(templateRoot, 'images/logo-email-small.png');
    if (fs.existsSync(path.join(templateRootLocal, 'images/logo-email.png'))) { //eslint-disable-line no-sync
        emailHeaderLogo = path.join(templateRootLocal, 'images/logo-email.png');
    }
    logger.debug('Using email header logo from', emailHeaderLogo);

    // Default e-mail sending options common to all e-mails
    // NOTE: ALWAYS CLONE (_.cloneDeep) this, do not modify!
    const EMAIL_OPTIONS_DEFAULT = {
        images: [
            {
                name: emailHeaderLogoName,
                file: emailHeaderLogo
            },
            {
                name: emailFooterLogoName,
                file: emailFooterLogo
            }
        ],
        styles: config.email.styles,
        linkedData: {
            footerLinks: {
                linkToPlatform: config.email.linkToPlatform || urlLib.getFe(),
                linkToPrivacyPolicy: config.email.linkToPrivacyPolicy
            }
        },
        provider: {
            merge: {} // TODO: empty merge required until fix - https://github.com/bevacqua/campaign-mailgun/issues/1
        }
    };


    const templateCache = {};

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
    const resolveTemplate = function (template, language) {
        const lang = language ? language.toLowerCase() : 'en';

        const pathTemplate = ':templateRoot/build/:template_:language.html'
            .replace(':templateRoot', templateRoot)
            .replace(':template', template)
            .replace(':language', lang);

        const pathTemplateFallback = ':templateRoot/:template.html'
            .replace(':templateRoot', templateRoot)
            .replace(':template', template);

        const pathTranslations = ':templateRoot/languages/:language.json'
            .replace(':templateRoot', templateRoot)
            .replace(':language', lang);

        const pathTranslationsFallback = ':templateRoot/languages/:language.json'
            .replace(':templateRoot', templateRoot)
            .replace(':language', 'en');

        const templateObj = {
            body: null,
            translations: null,
            language: lang
        };

        const cachedTemplateObj = templateCache[pathTemplate];
        if (cachedTemplateObj) {
            return cachedTemplateObj;
        }

        // TODO: Rewrite to async FS operations
        try {
            templateObj.body = fs.readFileSync(pathTemplate, {encoding: 'utf8'}); // eslint-disable-line no-sync
        } catch (e) {
            logger.warn('Could not read template using fallback instead!', pathTemplate, pathTemplateFallback);
            templateObj.body = fs.readFileSync(pathTemplateFallback, {encoding: 'utf8'}); // eslint-disable-line no-sync
        }

        // TODO: Rewrite to async FS operations
        try {
            templateObj.translations = JSON.parse(fs.readFileSync(pathTranslations, {encoding: 'utf8'})); // eslint-disable-line no-sync
        } catch (e) {
            logger.warn('Could not read translations using fallback instead!', pathTemplate, pathTemplateFallback);
            templateObj.translations = JSON.parse(fs.readFileSync(pathTranslationsFallback, {encoding: 'utf8'})); // eslint-disable-line no-sync
        }

        templateCache[pathTemplate] = templateObj;

        return templateObj;
    };

    /**
     * Get Topic Member Users, be it directly or through Groups
     *
     * @param {string} topicId Topic Id
     * @param {string} [levelMin=TopicMember.LEVELS.admin] One of TopicMember.LEVELS
     *
     * @returns {Promise<Array>} Array of topic members
     *
     * @private
     */
    const _getTopicMemberUsers = function (topicId, levelMin) {
        let levelMinimum = TopicMemberUser.LEVELS.admin;

        if (levelMin && TopicMemberUser.LEVELS[levelMin]) {
            levelMinimum = levelMin;
        }

        return db
            .query(
                `SELECT
                        tm.id,
                        tm.name,
                        tm.email,
                        tm.language
                    FROM (
                        SELECT DISTINCT ON(id)
                            tm."memberId" as id,
                            tm."level",
                            u.name,
                            u.email,
                            u.language
                        FROM "Topics" t
                        JOIN (
                            SELECT
                                tmu."topicId",
                                tmu."userId" AS "memberId",
                                tmu."level"::text,
                                1 as "priority"
                            FROM "TopicMemberUsers" tmu
                            WHERE tmu."deletedAt" IS NULL
                            UNION
                            (
                                SELECT \
                                    tmg."topicId",
                                    gm."userId" AS "memberId",
                                    tmg."level"::text,
                                    2 as "priority"
                                FROM "TopicMemberGroups" tmg
                                LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                                WHERE tmg."deletedAt" IS NULL
                                AND gm."deletedAt" IS NULL
                                ORDER BY tmg."level"::"enum_TopicMemberGroups_level" DESC
                            ) \
                        ) AS tm ON (tm."topicId" = t.id)
                        JOIN "Users" u ON (u.id = tm."memberId")
                        LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm."memberId" AND tmu."topicId" = t.id)
                        WHERE t.id = :topicId
                        ORDER BY id, tm.priority
                    ) tm
                    WHERE tm.level::"enum_TopicMemberUsers_level" >= :level
                    AND tm.email IS NOT NULL
                    ORDER BY name ASC
                `,
                {
                    replacements: {
                        topicId: topicId,
                        level: levelMinimum
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
    };


    /**
     * Get Moderator list
     *
     * @param {String} [sourcePartnerId] Source partner id - UUID
     *
     * @returns {Promise} Array of incomplete User objects
     *
     * @private
     */
    const _getModerators = function (sourcePartnerId) {
        return db
            .query(
                `SELECT
                        u.id,
                        u."email",
                        u."name",
                        u."language"
                    FROM "Moderators" m
                        JOIN "Users" u ON (u.id = m."userId")
                    WHERE u."email" IS NOT NULL
                    AND (m."partnerId" = :partnerId
                    OR m."partnerId" IS NULL)
                `,
                {
                    replacements: {
                        partnerId: sourcePartnerId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
    };

    const handleAllPromises = function (emailPromises) {
        let errors = [];
        let done = [];
        return Promise.allSettled(emailPromises)
            .each(function (inspection) {
                if (inspection.isRejected()) {
                    logger.error('FAILED:', inspection.reason());
                    errors.push({
                        state: "rejected",
                        value: inspection.reason()
                    });
                } else {
                    if (Array.isArray(inspection.value())) {
                        inspection.value().forEach((result) => {
                            if (result.status === 'ERROR') {
                                logger.error('FAILED:', result.message);
                                errors.push({
                                    state: "rejected",
                                    value: result.message
                                });
                            }
                        })
                    } else {
                        done.push({
                            state: "success",
                            value: inspection.value()
                        });
                    }
                }
            })
            .then(function () {
                return {
                    done,
                    errors
                };
            });
    };

    /**
     * Send help request email
     */

    const _sendHelpRequest = async (debugData) => {
        const template = resolveTemplate('helpRequest');
        const emailOptions = Object.assign(
            _.cloneDeep(EMAIL_OPTIONS_DEFAULT), // Deep clone to guarantee no funky business messing with the class level defaults, cant use Object.assign({}.. as this is not a deep clone.
            {
                subject: 'Help request',
                to: ['support@citizenos.com'],
                replyTo: debugData.email,
                from: "no-reply@citizenos.com",
                linkedData: {
                    translations: template.translations,
                },
                provider: EMAIL_OPTIONS_DEFAULT.provider,
            }
        );

        Object.keys(debugData).forEach(function (key) {
            emailOptions[key] = debugData[key];
        });

        // https://github.com/bevacqua/campaign#email-sending-option
        return emailClient.sendString(template.body, emailOptions);
    }

    /**
     * Send help request email
     */

    const _sendFeedback = async (data) => {
        const template = resolveTemplate('feedback');
        const emailOptions = Object.assign(
            _.cloneDeep(EMAIL_OPTIONS_DEFAULT), // Deep clone to guarantee no funky business messing with the class level defaults, cant use Object.assign({}.. as this is not a deep clone.
            {
                subject: 'Feedback',
                to: ['support@citizenos.com'],
                from: "no-reply@citizenos.com",
                linkedData: {
                    translations: template.translations,
                },
                provider: EMAIL_OPTIONS_DEFAULT.provider,
                message: data.message,
                userId: data.userId
            }
        );

        // https://github.com/bevacqua/campaign#email-sending-option
        return emailClient.sendString(template.body, emailOptions);
    }
    /**
     * Send e-mail verification email.
     *
     * @param {string|Array} to To e-mail(s)
     * @param {string} emailVerificationCode Account verification code
     * @param {string} [token] JWT token representing the state
     *
     * @returns {Promise} Promise
     *
     * @private
     */
    const _sendAccountVerification = function (to, emailVerificationCode, token) {
        return User
            .findAll({
                where: db.where(db.fn('lower', db.col('email')), db.fn('lower', to))
            })
            .then(function (users) {
                const promisesToResolve = [];

                users.forEach((user) => {
                    const template = resolveTemplate('accountVerification', user.language);
                    const linkVerify = urlLib.getApi('/api/auth/verify/:code', {code: emailVerificationCode}, {token: token});

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT), // Deep clone to guarantee no funky business messing with the class level defaults, cant use Object.assign({}.. as this is not a deep clone.
                        {
                            subject: template.translations.ACCOUNT_VERIFICATION.SUBJECT,
                            to: user.email,
                            //Placeholders
                            toUser: user,
                            linkVerify: linkVerify
                        }
                    );

                    emailOptions.linkedData.translations = template.translations;
                    // https://github.com/bevacqua/campaign#email-sending-option
                    const userEmailPromise = emailClient.sendString(template.body, emailOptions);

                    promisesToResolve.push(userEmailPromise);
                });

                return handleAllPromises(promisesToResolve);
            });
    };

    /**
     * Send password reset e-mail
     *
     * @param {(string|Array)} to To e-mail(s)
     * @param {string} passwordResetCode Account password reset code
     *
     * @returns {Promise} Promise
     *
     * @private
     */
    const _sendPasswordReset = function (to, passwordResetCode) {
        return User
            .findAll({
                where: db.where(db.fn('lower', db.col('email')), db.fn('lower', to))
            })
            .then(function (users) {
                const promisesToResolve = [];

                users.forEach((user) => {
                    const template = resolveTemplate('passwordReset', user.language);

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT), // Deep clone to guarantee no funky business messing with the class level defaults, cant use Object.assign({}.. as this is not a deep clone.
                        {
                            subject: template.translations.PASSWORD_RESET.SUBJECT,
                            to: user.email,
                            //Placeholders..
                            toUser: user,
                            linkReset: urlLib.getFe('/account/password/reset/:passwordResetCode', {passwordResetCode: passwordResetCode}, {email: user.email})
                        }
                    );

                    emailOptions.linkedData.translations = template.translations;
                    const userEmailPromise = emailClient.sendString(template.body, emailOptions);

                    promisesToResolve.push(userEmailPromise);
                });

                return handleAllPromises(promisesToResolve);
            });
    };

    /**
     * Send Topic invite e-mail
     *
     * @param {Array<TopicInviteUser>} invites TopicInviteUser instances
     *
     * @returns {Promise} Promise
     *
     * @private
     */
    const _sendTopicMemberUserInviteCreate = async function (invites) {
        if (!invites || !Array.isArray(invites)) {
            return Promise.reject(new Error('Missing one or more required parameters'));
        }

        if (!invites.length) {
            logger.warn('Got empty invites list, no emails will be sent.');

            return Promise.resolve();
        }

        // We assume that all TopicInviteUser instances are created at once, thus having the same topicId and creatorId
        const fromUserPromise = User.findOne({ // From User
            where: {
                id: invites[0].creatorId
            },
            attributes: ['id', 'name']
        });

        const topicPromise = Topic.findOne({
            where: {
                id: invites[0].topicId
            },
            attributes: ['id', 'title', 'visibility']
        });

        const toUsersPromise = User.findAll({
            where: {
                id: invites.map(invite => invite.userId)
            },
            attributes: ['id', 'email', 'language', 'name'],
            raw: true
        });

        const [fromUser, topic, toUsers] = await Promise.all([fromUserPromise, topicPromise, toUsersPromise]);

        let logoFile = emailHeaderLogo;
        let templateName = 'inviteTopic';
        let linkToApplication = urlLib.getFe();
        let message = invites[0].inviteMessage;
        let customStyles = EMAIL_OPTIONS_DEFAULT.styles;

        const emailsSendPromises = toUsers.map(function (toUser) {
            if (!toUser.email) {
                logger.info('Skipping invite e-mail to user as there is no email on the profile', toUser.email);
                return Promise.resolve();
            }

            const template = resolveTemplate(templateName, toUser.language);

            // Handle Partner links
            // TODO: could use Mu here...
            const subject = template.translations.INVITE_TOPIC.SUBJECT
                .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name));
            const invite = invites.find((i) => {return i.userId === toUser.id});
            const linkViewInvite = urlLib.getFe('/topics/:topicId/invites/users/:inviteId', { // FIXME: Do we want to go through /api/invite/view?
                inviteId: invite.id,
                topicId: topic.id
            });

            // In case Topic has no title, just show the full url.
            topic.title = topic.title ? topic.title : linkViewInvite;

            let linkedData = EMAIL_OPTIONS_DEFAULT.linkedData;
            linkedData.translations = template.translations;
            const emailOptions = {
                // from: from, - comes from emailClient.js configuration
                subject: subject,
                to: toUser.email,
                images: [
                    {
                        name: emailHeaderLogoName,
                        file: logoFile
                    },
                    {
                        name: emailFooterLogoName,
                        file: emailFooterLogo
                    }
                ],
                toUser: toUser,
                message,
                fromUser: fromUser,
                topic: topic,
                linkViewTopic: linkViewInvite,
                linkToApplication: linkToApplication,
                provider: EMAIL_OPTIONS_DEFAULT.provider,
                styles: customStyles,
                linkToPlatformText: template.translations.LAYOUT.LINK_TO_PLATFORM,
                linkedData
            };

            return emailClient.sendString(template.body, emailOptions);
        });

        return handleAllPromises(emailsSendPromises);
    };

    /**
     * Send Topic invite e-mail all members of the Groups
     *
     * @param {(string|Array)} toGroupIds Group ID-s for which Members the invite will be sent.
     * @param {string} fromUserId From User ID
     * @param {string} topicId Topic ID
     *
     * @returns {Promise} Promise
     *
     * @private
     */
    const _sendTopicMemberGroupCreate = function (toGroupIds, fromUserId, topicId) {
        if (!toGroupIds || !fromUserId || !topicId) {
            return Promise.reject(new Error('Missing one or more required parameters'));
        }

        if (!Array.isArray(toGroupIds)) {
            toGroupIds = [toGroupIds];
        }

        if (!toGroupIds.length) {
            logger.info('Got empty receivers list, no emails will be sent.');

            return Promise.resolve();
        }

        const toUsersPromise = db
            .query(
                '\
                     SELECT DISTINCT ON (gm."userId") \
                        gm."userId", \
                        u."email", \
                        u."language", \
                        u.name \
                     FROM "GroupMemberUsers" gm \
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

        const fromUserPromise = User.findOne({
            where: {
                id: fromUserId
            }
        });

        const topicPromise = Topic.findOne({
            where: {
                id: topicId
            }
        });

        return Promise
            .all([toUsersPromise, fromUserPromise, topicPromise])
            .then(function (results) {
                const toUsers = results[0];
                const fromUser = results[1].toJSON();
                const topic = results[2].toJSON();

                if (toUsers && toUsers.length) {
                    const promisesToResolve = [];

                    toUsers.forEach((user) => {
                        if (user.email) {
                            const template = resolveTemplate('inviteTopic', user.language);
                            // TODO: Could use Mu here....
                            const subject = template.translations.INVITE_TOPIC.SUBJECT
                                .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name));

                            const linkViewTopic = urlLib.getApi('/api/invite/view', null, {
                                email: user.email,
                                topicId: topic.id
                            });

                            // In case Topic has no title, just show the full url.
                            topic.title = topic.title ? topic.title : linkViewTopic;

                            const emailOptions = Object.assign(
                                _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                                {
                                    subject: subject,
                                    to: user.email,
                                    toUser: user,
                                    fromUser: fromUser,
                                    topic: topic,
                                    linkViewTopic: linkViewTopic
                                }
                            );
                            emailOptions.linkedData.translations = template.translations;
                            const sendEmailPromise = emailClient.sendString(template.body, emailOptions);

                            promisesToResolve.push(sendEmailPromise);
                        }
                    });

                    return handleAllPromises(promisesToResolve);
                } else {
                    logger.info('No Topic Group member User invite emails to be sent as filtering resulted in empty e-mail address list.');
                }
            });

    };


    /**
     * Send Group invite e-mail
     *
     * @param {Array<GroupInviteUser>} invites GroupInviteUser instances
     *
     * @returns {Promise} Promise
     *
     * @private
     */
    const _sendGroupMemberUserInviteCreate = async function (invites) {
        if (!invites || !Array.isArray(invites)) {
            return Promise.reject(new Error('Missing one or more required parameters'));
        }

        if (!invites.length) {
            logger.warn('Got empty invites list, no emails will be sent.');

            return Promise.resolve();
        }

        // We assume that all TopicInviteUser instances are created at once, thus having the same topicId and creatorId
        const fromUserPromise = User.findOne({ // From User
            where: {
                id: invites[0].creatorId
            },
            attributes: ['id', 'name']
        });

        const groupPromise = Group.findOne({
            where: {
                id: invites[0].groupId
            },
            attributes: ['id', 'name', 'visibility']
        });

        const toUsersPromise = User.findAll({
            where: {
                id: invites.map(invite => invite.userId)
            },
            attributes: ['id', 'email', 'language', 'name'],
            raw: true
        });

        const [fromUser, group, toUsers] = await Promise.all([fromUserPromise, groupPromise, toUsersPromise]);

        let logoFile = emailHeaderLogo;
        let templateName = 'inviteGroup';
        let linkToApplication = urlLib.getFe();
        let message = invites[0].inviteMessage;
        let customStyles = EMAIL_OPTIONS_DEFAULT.styles;

        const emailsSendPromises = toUsers.map(function (toUser) {
            if (!toUser.email) {
                logger.info('Skipping invite e-mail to user as there is no email on the profile', toUser.email);
                return Promise.resolve();
            }

            const template = resolveTemplate(templateName, toUser.language);

            // TODO: could use Mu here...
            const subject = template.translations.INVITE_GROUP.SUBJECT
                .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name))
                .replace('{{group.name}}', util.escapeHtml(group.name));
            const invite = invites.find((i) => {return i.userId === toUser.id});
            const linkViewInvite = urlLib.getFe('/groups/:groupId/invites/users/:inviteId', {
                inviteId: invite.id,
                groupId: group.id
            });

            // In case Topic has no title, just show the full url.
            group.name = group.name ? group.name : linkViewInvite;

            let linkedData = EMAIL_OPTIONS_DEFAULT.linkedData;
            linkedData.translations = template.translations;
            const emailOptions = {
                // from: from, - comes from emailClient.js configuration
                subject: subject,
                to: toUser.email,
                images: [
                    {
                        name: emailHeaderLogoName,
                        file: logoFile
                    },
                    {
                        name: emailFooterLogoName,
                        file: emailFooterLogo
                    }
                ],
                toUser: toUser,
                message,
                fromUser: fromUser,
                group: group,
                linkViewGroup: linkViewInvite,
                linkToApplication: linkToApplication,
                provider: EMAIL_OPTIONS_DEFAULT.provider,
                styles: customStyles,
                linkToPlatformText: template.translations.LAYOUT.LINK_TO_PLATFORM,
                linkedData
            };

            return emailClient.sendString(template.body, emailOptions);
        });

        return handleAllPromises(emailsSendPromises);
    };

    /**
     * Send Group invite e-mail
     *
     * @param {(string|Array)} toUserIds User ID-s
     * @param {string} fromUserId From User ID
     * @param {string} groupId Group ID
     *
     * @returns {Promise} Promise
     *
     * @private
     */
    const _sendGroupMemberUserCreate = function (toUserIds, fromUserId, groupId) {
        if (!toUserIds || !fromUserId || !groupId) {
            return Promise.reject(new Error('Missing one or more required parameters'));
        }

        if (!Array.isArray(toUserIds)) {
            toUserIds = [toUserIds];
        }

        if (!toUserIds.length) {
            logger.info('Got empty receivers list, no emails will be sent.');

            return;
        }

        const toUsersPromise = User.findAll({
            where: {
                id: toUserIds
            },
            attributes: ['email', 'language', 'name'],
            raw: true
        });

        const fromUserPromise = User.findOne({
            where: {
                id: fromUserId
            }
        });

        const groupPromise = Group.findOne({
            where: {
                id: groupId
            }
        });

        return Promise
            .all([toUsersPromise, fromUserPromise, groupPromise])
            .then(function (results) {
                const toUsers = results[0];
                const fromUser = results[1].toJSON();
                const group = results[2].toJSON();

                if (toUsers && toUsers.length) {
                    const promisesToResolve = [];

                    toUsers.forEach((user) => {
                        if (user.email) {
                            const template = resolveTemplate('inviteGroup', user.language);

                            // TODO: could use Mu here...
                            const subject = template.translations.INVITE_GROUP.SUBJECT
                                .replace('{{fromUser.name}}', util.escapeHtml(fromUser.name))
                                .replace('{{group.name}}', util.escapeHtml(group.name));

                            const emailOptions = Object.assign(
                                _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                                {
                                    subject: subject,
                                    to: user.email,
                                    //Placeholders..
                                    toUser: user,
                                    fromUser: fromUser,
                                    group: group,
                                    linkViewGroup: urlLib.getApi(
                                        '/api/invite/view',
                                        null,
                                        {
                                            email: user.email,
                                            groupId: group.id
                                        }
                                    )
                                }
                            );
                            emailOptions.linkedData.translations = template.translations;
                            const userEmailPromise = emailClient.sendString(template.body, emailOptions);

                            promisesToResolve.push(userEmailPromise);
                        }
                    });

                    return handleAllPromises(promisesToResolve);
                } else {
                    logger.info('No Group member User invite emails to be sent as filtering resulted in empty e-mail address list.');

                    return Promise.resolve();
                }
            });
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
    const _sendCommentReport = function (commentId, report) {
        return db
            .query(
                `
                    SELECT
                        tc."commentId" as "comment.id",
                        c."subject" as "comment.subject",
                        c."text" as "comment.text",
                        c."updatedAt" as "comment.updatedAt",
                        u."name" as "comment.creator.name",
                        u."email" as "comment.creator.email",
                        u."language" as "comment.creator.language",
                        t."id" as "topic.id",
                        t."sourcePartnerId" as "topic.sourcePartnerId",
                        t."visibility" as "topic.visibility"
                    FROM "TopicComments" tc
                        JOIN "Topics" t ON (t.id = tc."topicId")
                        JOIN "Comments" c ON (c.id = tc."commentId")
                        JOIN "Users" u ON (u.id = c."creatorId")
                    WHERE tc."commentId" = :commentId
                `,
                {
                    replacements: {
                        commentId: commentId
                    },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            )
            .then(function ([commentInfo]) {
                if (commentInfo.topic.visibility === Topic.VISIBILITY.public) {
                    logger.debug('Topic is public, sending e-mails to registered partner moderators', commentInfo);

                    return _getModerators(commentInfo.topic.sourcePartnerId)
                        .then(function (moderators) {
                            return [commentInfo, moderators];
                        });
                } else {
                    logger.debug('Topic is NOT public, sending e-mails to Users with admin permissions', commentInfo);
                    // Private Topics will have moderation by admin Users

                    return _getTopicMemberUsers(commentInfo.topic.id, TopicMemberUser.LEVELS.admin)
                        .then(function (moderators) {
                            return [commentInfo, moderators];
                        });
                }
            })
            .then(function ([commentInfo, moderators]) {
                const promisesToResolve = [];

                // Comment creator e-mail - TODO: Comment back in when comment editing goes live!
                let commentCreatorInformed = true;
                if (commentInfo.comment.creator.email) {
                    const template = resolveTemplate('reportCommentCreator', commentInfo.comment.creator.language);
                    const linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: commentInfo.topic.id});

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                        {
                            subject: template.translations.REPORT_COMMENT_CREATOR.SUBJECT,
                            to: commentInfo.comment.creator.email,
                            //Placeholders
                            comment: commentInfo.comment,
                            report: {
                                type: template.translations.REPORT_COMMENT.REPORT_TYPE[report.type.toUpperCase()],
                                text: report.text
                            },
                            linkViewTopic: linkViewTopic
                        }
                    );

                    emailOptions.linkedData.translations = template.translations;
                    const promiseCreatorEmail = emailClient.sendString(template.body, emailOptions);

                    promisesToResolve.push(promiseCreatorEmail);
                } else {
                    logger.info('Comment reported, but no e-mail could be sent to creator as there is no e-mail in the profile', commentInfo);
                    commentCreatorInformed = false;
                }

                if (moderators) {
                    const linkModerate = urlLib.getFe(
                        '/topics/:topicId/comments/:commentId/reports/:reportId/moderate',
                        {
                            topicId: commentInfo.topic.id,
                            commentId: commentInfo.comment.id,
                            reportId: report.id
                        }
                    );

                    moderators.forEach(function (moderator) {
                        if (moderator.email) {
                            const template = resolveTemplate('reportCommentModerator', moderator.language);

                            const token = cosJwt.getTokenRestrictedUse(
                                {
                                    userId: moderator.id
                                },
                                [
                                    'POST /api/topics/:topicId/comments/:commentId/reports/:reportId/moderate'
                                        .replace(':topicId', commentInfo.topic.id)
                                        .replace(':commentId', commentInfo.comment.id)
                                        .replace(':reportId', report.id),
                                    'GET /api/topics/:topicId/comments/:commentId/reports/:reportId'
                                        .replace(':topicId', commentInfo.topic.id)
                                        .replace(':commentId', commentInfo.comment.id)
                                        .replace(':reportId', report.id)
                                ]
                            );

                            const emailOptions = Object.assign(
                                _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                                {
                                    subject: template.translations.REPORT_COMMENT_MODERATOR.SUBJECT,
                                    to: moderator.email,
                                    //Placeholders...
                                    comment: commentInfo.comment,
                                    report: {
                                        type: template.translations.REPORT_COMMENT.REPORT_TYPE[report.type.toUpperCase()],
                                        text: report.text
                                    },
                                    linkModerate: linkModerate + '?token=' + encodeURIComponent(token),
                                    isUserNotified: commentCreatorInformed
                                }
                            );
                            emailOptions.linkedData.translations = template.translations;
                            const promiseModeratorEmail = emailClient.sendString(template.body, emailOptions);

                            promisesToResolve.push(promiseModeratorEmail);
                        }
                    });
                }

                return handleAllPromises(promisesToResolve);
            });
    };

    /**
     * Send Topic report related e-mails
     *
     * @param {object} topicReport TopicReport Sequelize instance
     *
     * @returns {Promise} Topic report result
     *
     * @private
     *
     * @see Citizen OS Topic moderation 1 - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce
     *
     */
    const _sendTopicReport = async function (topicReport) {
        const infoFetchPromises = [];

        // Get the topic info
        infoFetchPromises.push(Topic.findOne({
            where: {
                id: topicReport.topicId
            }
        }));

        // Get reporters info
        infoFetchPromises.push(User.findOne({
            where: {
                id: topicReport.creatorId
            }
        }));

        // Get Topic edit/admin Member list
        infoFetchPromises.push(_getTopicMemberUsers(topicReport.topicId, TopicMemberUser.LEVELS.edit));

        const [topic, userReporter, topicMemberList] = await Promise.all(infoFetchPromises);
        const topicModerators = await _getModerators(topic.sourcePartnerId);

        const linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

        const sendEmailPromises = [];

        if (userReporter.email) {
            // 1.1 To the User (reporter) who reported the topic - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce
            const sendReporterEmail = async function () {
                const template = resolveTemplate('reportTopicReportReporter', userReporter.language);
                const subject = template.translations.REPORT_TOPIC_REPORT_REPORTER.SUBJECT
                    .replace('{{report.id}}', topicReport.id);

                const emailOptions = Object.assign(
                    _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                    {
                        subject: subject,
                        to: userReporter.email,
                        //Placeholders
                        userReporter: userReporter,
                        report: {
                            id: topicReport.id,
                            type: template.translations.REPORT.REPORT_TYPE[topicReport.type.toUpperCase()],
                            text: topicReport.text
                        },
                        topic: topic,
                        linkViewTopic: linkViewTopic,
                        linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                    }
                );
                emailOptions.linkedData.translations = template.translations;

                return await emailClient.sendString(template.body, emailOptions);
            };
            sendEmailPromises.push(sendReporterEmail());
        } else {
            logger.info('Could not send e-mail to Topic reporter because e-mail address does not exist', userReporter.id);
        }

        // 1.2. To admin/edit Members of the topic - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce?argumentsPage=1
        topicMemberList.forEach(function (topicMemberUser) {
            if (topicMemberUser.email) {
                const sendTopicMemberEmail = async function () {
                    const template = resolveTemplate('reportTopicReportMember', topicMemberUser.language);
                    const subject = template.translations.REPORT_TOPIC_REPORT_MEMBER.SUBJECT
                        .replace('{{report.id}}', topicReport.id);

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                        {
                            subject: subject,
                            to: topicMemberUser.email,
                            //Placeholders
                            userMember: topicMemberUser,
                            report: {
                                id: topicReport.id,
                                type: template.translations.REPORT.REPORT_TYPE[topicReport.type.toUpperCase()],
                                text: topicReport.text
                            },
                            topic: topic,
                            linkViewTopic: linkViewTopic,
                            linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                        }
                    );
                    emailOptions.linkedData.translations = template.translations;

                    return await emailClient.sendString(template.body, emailOptions);
                };
                sendEmailPromises.push(sendTopicMemberEmail());
            } else {
                logger.info('Could not send e-mail to Topic member because e-mail address does not exist', topicMemberUser.id);
            }
        });

        // 1.3 To the Moderators - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce?argumentsPage=1
        topicModerators.forEach(function (userModerator) {
            if (userModerator.email) {
                const sendTopicModeratorEmail = async function () {
                    const template = resolveTemplate('reportTopicReportModerator', userModerator.language);
                    const subject = template.translations.REPORT_TOPIC_REPORT_MODERATOR.SUBJECT
                        .replace('{{report.id}}', topicReport.id);

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                        {
                            subject: subject,
                            to: userModerator.email,
                            //Placeholders
                            userModerator: userModerator,
                            report: {
                                id: topicReport.id,
                                type: template.translations.REPORT.REPORT_TYPE[topicReport.type.toUpperCase()],
                                text: topicReport.text
                            },
                            topic: topic,
                            linkViewTopic: linkViewTopic,
                            linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                        }
                    );
                    emailOptions.linkedData.translations = template.translations;

                    return await emailClient.sendString(template.body, emailOptions);
                };
                sendEmailPromises.push(sendTopicModeratorEmail());
            } else {
                logger.info('Could not send e-mail to Topic Moderator because e-mail address does not exist', userModerator.id);
            }
        });

        return handleAllPromises(sendEmailPromises);
    };

    /**
     * Send Topic report moderation related e-mails
     *
     * @param {object} topicReport TopicReport Sequelize instance
     *
     * @returns {Promise} Topic report moderate email sending result
     *
     * @private
     *
     * @see Citizen OS Topic moderation 2 - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce
     *
     */
    const _sendTopicReportModerate = async function (topicReport) {
        const infoFetchPromises = [];
        const topic = topicReport.topic;

        // Get reporters info
        infoFetchPromises.push(User.findOne({
            where: {
                id: topicReport.creator.id
            }
        }));

        // Get Topic member Users
        infoFetchPromises.push(_getTopicMemberUsers(topic.id, TopicMemberUser.LEVELS.edit));

        const [userReporter, topicMemberList] = await Promise.all(infoFetchPromises);

        const linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: topic.id});

        const sendEmailPromiseses = [];

        // 2.1 To the User (reporter) who reported the topic - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce
        if (userReporter.email) {
            const sendReporterEmail = async function () {
                const template = resolveTemplate('reportTopicModerateReporter', userReporter.language);
                const subject = template.translations.REPORT_TOPIC_MODERATE_REPORTER.SUBJECT
                    .replace('{{report.id}}', topicReport.id);

                const emailOptions = Object.assign(
                    _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                    {
                        subject: subject,
                        to: userReporter.email,
                        //Placeholders
                        userReporter: userReporter,
                        report: {
                            id: topicReport.id,
                            moderatedReasonType: template.translations.REPORT.REPORT_TYPE[topicReport.moderatedReasonType.toUpperCase()],
                            moderatedReasonText: topicReport.moderatedReasonText,
                            createdAt: moment(topicReport.createdAt).locale(template.language).format('LLL Z')
                        },
                        topic: topic,
                        linkViewTopic: linkViewTopic,
                        linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                    }
                );
                emailOptions.linkedData.translations = template.translations;

                return await emailClient.sendString(template.body, emailOptions);
            };
            sendEmailPromiseses.push(sendReporterEmail());
        } else {
            logger.info('Could not send e-mail to Topic reporter because e-mail address does not exist', userReporter.id);
        }

        // 2.2 To admin/edit Members of the topic - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce?argumentsPage=1
        topicMemberList.forEach(function (topicMemberUser) {
            if (topicMemberUser.email) {
                const sendTopicMemberEmail = async function () {
                    const template = resolveTemplate('reportTopicModerateMember', topicMemberUser.language);
                    const subject = template.translations.REPORT_TOPIC_MODERATE_MEMBER.SUBJECT
                        .replace('{{report.id}}', topicReport.id);

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                        {
                            subject: subject,
                            to: topicMemberUser.email,
                            //Placeholders
                            userMember: topicMemberUser,
                            report: {
                                id: topicReport.id,
                                moderatedReasonType: template.translations.REPORT.REPORT_TYPE[topicReport.moderatedReasonType.toUpperCase()],
                                moderatedReasonText: topicReport.moderatedReasonText,
                                createdAt: moment(topicReport.createdAt).locale(template.language).format('LLL Z')
                            },
                            topic: topic,
                            linkViewTopic: linkViewTopic,
                            linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                        }
                    );
                    emailOptions.linkedData.translations = template.translations;

                    return await emailClient.sendString(template.body, emailOptions);
                };
                sendEmailPromiseses.push(sendTopicMemberEmail());
            } else {
                logger.info('Could not send e-mail to Topic member because e-mail address does not exist', topicMemberUser.id);
            }
        });

        return handleAllPromises(sendEmailPromiseses);
    };

    /**
     * Send Topic report review related e-mails
     *
     * @param {object} topicReport TopicReport Sequelize instance
     * @param {string} reviewRequestText Review request text
     *
     * @returns {Promise} Topic report review email result
     *
     * @private
     *
     * @see Citizen OS Topic moderation 3 - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce
     */
    const _sendTopicReportReview = async function (topicReport, reviewRequestText) {
        const topic = await Topic.findOne({
            where: {
                id: topicReport.topicId
            }
        });

        const topicModerators = await _getModerators(topic.sourcePartnerId);

        const linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: topic.id});
        const sendEmailPromises = [];

        topicModerators.forEach(function (userModerator) {
            if (userModerator.email) {
                const sendTopicModeratorEmail = async function () {
                    const template = resolveTemplate('reportTopicReportReviewModerator', userModerator.language);
                    const subject = template.translations.REPORT_TOPIC_REPORT_REVIEW_MODERATOR.SUBJECT
                        .replace('{{report.id}}', topicReport.id);

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                        {
                            subject: subject,
                            to: userModerator.email,
                            //Placeholders
                            userModerator: userModerator,
                            report: {
                                id: topicReport.id,
                                moderatedReasonType: template.translations.REPORT.REPORT_TYPE[topicReport.moderatedReasonType.toUpperCase()],
                                moderatedReasonText: topicReport.moderatedReasonText
                            },
                            topic: topic,
                            reviewRequestText: reviewRequestText,
                            linkViewTopic: linkViewTopic,
                            linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                        }
                    );
                    emailOptions.linkedData.translations = template.translations;

                    return emailClient.sendString(template.body, emailOptions);
                };
                sendEmailPromises.push(sendTopicModeratorEmail());
            } else {
                logger.info('Could not send e-mail to Topic Moderator because e-mail address does not exist', userModerator.id);
            }
        });

        return await Promise.all(sendEmailPromises);
    };

    /**
     * Send Topic report resolve related e-mails
     *
     * @param {object} topicReport TopicReport Sequelize instance
     *
     * @returns {Promise} Topic report resolve email result
     *
     * @private
     *
     * @see Citizen OS Topic moderation 4 - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce
     */
    const _sendTopicReportResolve = async function (topicReport) {
        const infoFetchPromises = [];

        // Topic info
        infoFetchPromises.push(Topic.findOne({
            where: {
                id: topicReport.topicId
            }
        }));

        // Get reporters info
        infoFetchPromises.push(User.findOne({
            where: {
                id: topicReport.creatorId
            }
        }));

        // Get Topic edit/admin Member list
        infoFetchPromises.push(_getTopicMemberUsers(topicReport.topicId, TopicMemberUser.LEVELS.edit));

        const [topic, userReporter, topicMemberList] = await Promise.all(infoFetchPromises);

        const linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: topic.id});


        const sendEmailPromises = [];

        // 4.1 To the User (reporter) who reported the topic - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce
        if (userReporter.email) {
            const sendReporterEmail = async function () {
                const template = resolveTemplate('reportTopicReportResolveReporter', userReporter.language);
                const subject = template.translations.REPORT_TOPIC_REPORT_RESOLVE_REPORTER.SUBJECT
                    .replace('{{report.id}}', topicReport.id);

                const emailOptions = Object.assign(
                    _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                    {
                        subject: subject,
                        to: userReporter.email,
                        //Placeholders
                        userReporter: userReporter,
                        report: {
                            createdAt: moment(topicReport.createdAt).locale(template.language).format('LLL Z')
                        },
                        topic: topic,
                        linkViewTopic: linkViewTopic,
                        linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                    }
                );
                emailOptions.linkedData.translations = template.translations;

                return await emailClient.sendString(template.body, emailOptions);
            };
            sendEmailPromises.push(sendReporterEmail());
        } else {
            logger.info('Could not send e-mail to Topic reporter because e-mail address does not exist', userReporter.id);
        }


        // 4.2 To admin/edit Members of the topic - https://app.citizenos.com/en/topics/ac8b66a4-ca56-4d02-8406-5e19da73d7ce?argumentsPage=1
        topicMemberList.forEach(function (topicMemberUser) {
            if (topicMemberUser.email) {
                const sendTopicMemberEmail = async function () {
                    const template = resolveTemplate('reportTopicReportResolveMember', topicMemberUser.language);
                    const subject = template.translations.REPORT_TOPIC_REPORT_RESOLVE_MEMBER.SUBJECT
                        .replace('{{report.id}}', topicReport.id);

                    const emailOptions = Object.assign(
                        _.cloneDeep(EMAIL_OPTIONS_DEFAULT),
                        {
                            subject: subject,
                            to: topicMemberUser.email,
                            //Placeholders
                            userMember: topicMemberUser,
                            topic: topic,
                            linkViewTopic: linkViewTopic,
                            linkViewModerationGuidelines: config.email.linkViewModerationGuidelines
                        }
                    );
                    emailOptions.linkedData.translations = template.translations;

                    return await emailClient.sendString(template.body, emailOptions);
                };
                sendEmailPromises.push(sendTopicMemberEmail());
            } else {
                logger.info('Could not send e-mail to Topic member because e-mail address does not exist', topicMemberUser.id);
            }
        });

        return await handleAllPromises(sendEmailPromises);
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
    const _sendToParliament = function (topic, contact, linkDownloadBdocFinal, linkDownloadBdocFinalExpiryDate, linkAddEvent) {
        if (!topic || !contact || !linkDownloadBdocFinal || !linkDownloadBdocFinalExpiryDate || !linkAddEvent) {
            return Promise.reject(new Error('Missing one or more required parameters'));
        }

        const template = resolveTemplate('toParliament', 'et'); // Estonian Gov only accepts et
        const linkToApplication = config.features.sendToParliament.urlPrefix;

        const from = config.features.sendToParliament.from;
        const to = config.features.sendToParliament.to;
        const subject = template.translations.TO_PARLIAMENT.SUBJECT.replace('{{topic.title}}', util.escapeHtml(topic.title));
        const linkViewTopic = linkToApplication + '/initiatives/:topicId'.replace(':topicId', topic.id);
        const logoFile = templateRoot + '/images/logo-email_rahvaalgatus.ee.png';

        const promisesToResolve = [];
        const customStyles = {
            headerBackgroundColor: '#004892',
            logoWidth: 360,
            logoHeight: 51
        };

        // Email to Parliament
        let linkedData = EMAIL_OPTIONS_DEFAULT.linkedData;
        linkedData.translations = template.translations;

        const emailToParliamentPromise = emailClient
            .sendString(
                template.body,
                {
                    from: from,
                    subject: subject,
                    to: to,
                    images: [
                        {
                            name: emailHeaderLogoName,
                            file: logoFile
                        },
                        {
                            name: emailFooterLogoName,
                            file: emailFooterLogo
                        }
                    ],
                    //Placeholders..
                    linkViewTopic: linkViewTopic,
                    linkDownloadBdocFinal: linkDownloadBdocFinal,
                    linkDownloadBdocFinalExpiryDate: moment(linkDownloadBdocFinalExpiryDate).locale('et').format('LL'),
                    linkAddEvent: linkAddEvent,
                    linkToApplication: linkToApplication,
                    topic: topic,
                    contact: contact,
                    provider: EMAIL_OPTIONS_DEFAULT.provider,
                    styles: customStyles,
                    linkedData
                }
            )
            .then(function () {
                logger.info('Sending Parliament e-mail succeeded', topic.id);
            })
            .catch(function (err) {
                logger.error('Sending Parliament e-mail failed', topic.id, err);

                return Promise.reject(err);
            });

        promisesToResolve.push(emailToParliamentPromise);

        // Email to Topic creator
        const emailToTopicCreatorPromise = emailClient
            .sendString(
                template.body,
                {
                    from: from,
                    subject: subject,
                    to: contact.email,
                    images: [
                        {
                            name: emailHeaderLogoName,
                            file: logoFile
                        },
                        {
                            name: emailFooterLogoName,
                            file: emailFooterLogo
                        }
                    ],
                    //Placeholders..
                    linkViewTopic: linkViewTopic,
                    linkDownloadBdocFinal: config.features.sendToParliament.sendContainerDownloadLinkToCreator ? linkDownloadBdocFinal : null,
                    linkDownloadBdocFinalExpiryDate: config.features.sendToParliament.sendContainerDownloadLinkToCreator ? moment(linkDownloadBdocFinalExpiryDate).locale('et').format('LL') : null,
                    linkAddEvent: null,
                    linkToApplication: linkToApplication,
                    topic: topic,
                    contact: contact,
                    provider: EMAIL_OPTIONS_DEFAULT.provider,
                    styles: customStyles,
                    linkedData
                }
            )
            .then(function () {
                logger.info('Sending Parliament e-mail to creator succeeded', topic.id);
            })
            .catch(function (err) {
                logger.error('Sending Parliament e-mail to creator failed', topic.id, err);

                return Promise.reject(err);
            });

        promisesToResolve.push(emailToTopicCreatorPromise);

        return handleAllPromises(promisesToResolve);
    };
    const flattenObj = (obj, parent, res = {}) => {
        for (const key of Object.keys(obj)) {
          const propName = parent ? parent + '.' + key : key;
          if (typeof obj[key] === 'object') {
            flattenObj(obj[key], propName, res);
          } else {
            res[propName] = obj[key];
          }
        }
        return res;
    }
    const handleTranslation = function (translations, key) {
        if (!translations || !key) return false;
        let translationsUsed = flattenObj(translations);
        const translation = translationsUsed[key];
        if (translation && translation.indexOf('@:') === 0) {
            return translationsUsed[translation.substring(2)];
        }
        if (translation === undefined) return '';

        return translation;
    }
    const _sendTopicNotification = async (notification, users) => {
        const promisesToResolve = [];
        let linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: notification.topicIds[0]});

        const linkGeneralNotificationSettings= `${urlLib.getFe('/myaccount')}?tab=notifications`;
        const linkTopicNotificationSettings = `${linkViewTopic}?notificationSettings`;
        if (['Comment', 'CommentVote'].indexOf(notification.data.object['@type']) > -1) {
            linkViewTopic += `?commentId=${notification.data.object.commentId || notification.data.object.id}`;
        }
        users.forEach((user) => {
            const template = resolveTemplate('topicNotification', user.language || 'en');
            const translateValues = notification.values;
            let notificationText = '';
            for (const [key, value] of Object.entries(notification.values)) {
                translateValues[key] = handleTranslation(template.translations, value) || value;
            }
            notificationText += Mustache.render(handleTranslation(template.translations, notification.string), translateValues);
            if (notification.values.groupItems && Object.keys(notification.values.groupItems).length > 1) {
                for (const [field] of Object.keys(notification.values.groupItems)) {
                    translateValues.fieldName = template.translations[field];
                    const string = notification.string.replace('_USERACTIVITYGROUP', '');
                    notificationText += '<p>' + Mustache.render(handleTranslation(template.translations, string), translateValues) + '</p>';
                }
            }

            const emailOptions = Object.assign(
                _.cloneDeep(EMAIL_OPTIONS_DEFAULT), // Deep clone to guarantee no funky business messing with the class level defaults, cant use Object.assign({}.. as this is not a deep clone.
                {
                    subject: Mustache.render(handleTranslation(template.translations, 'NOTIFICATIONS.SUBJECT'), translateValues),
                    to: user.email,
                    toUser: user,
                    userName: user.name,
                    linkViewTopic,
                    linkTopicNotificationSettings,
                    linkGeneralNotificationSettings,
                    notificationText
                }
            );

            emailOptions.linkedData.translations = template.translations;
            const userEmailPromise = emailClient.sendString(template.body, emailOptions);

            promisesToResolve.push(userEmailPromise);
        });
        return handleAllPromises(promisesToResolve);
    };

    const _sendVoteReminder = async (users, vote, topicId) => {
        let topic = vote.Topic;
        if (!topic) {
            topic = await Topic
                .findOne({where:{ id: topicId }});
        }
        const linkViewTopic = urlLib.getFe('/topics/:topicId', {topicId: topicId});
        const linkToApplication = urlLib.getFe();
        const logoFile = emailHeaderLogo;
        let templateName = 'voteReminder';
        let customStyles = EMAIL_OPTIONS_DEFAULT.styles;

        const emailsSendPromises = users.map(function (toUser) {
            if (!toUser.email) {
                logger.info('Skipping invite e-mail to user as there is no email on the profile', toUser.email);
                return Promise.resolve();
            }

            const template = resolveTemplate(templateName, toUser.language);

            // Handle Partner links
            // TODO: could use Mu here...
            const subject = template.translations.VOTE_REMINDER.SUBJECT

            // In case Topic has no title, just show the full url.
            topic.title = topic.title ? topic.title : linkViewTopic;

            let linkedData = EMAIL_OPTIONS_DEFAULT.linkedData;
            linkedData.translations = template.translations;
            const emailOptions = {
                // from: from, - comes from emailClient.js configuration
                subject: subject,
                to: toUser.email,
                images: [
                    {
                        name: emailHeaderLogoName,
                        file: logoFile
                    },
                    {
                        name: emailFooterLogoName,
                        file: emailFooterLogo
                    }
                ],
                toUser: toUser,
                topic: topic,
                voteEndsAt: moment(vote.endsAt).locale(toUser.language).format('LLL'),
                linkViewTopic: linkViewTopic,
                linkToApplication: linkToApplication,
                provider: EMAIL_OPTIONS_DEFAULT.provider,
                styles: customStyles,
                linkToPlatformText: template.translations.LAYOUT.LINK_TO_PLATFORM,
                linkedData
            };

            return emailClient.sendString(template.body, emailOptions);
        });

        return handleAllPromises(emailsSendPromises);
    };

    return {
        sendAccountVerification: _sendAccountVerification,
        sendPasswordReset: _sendPasswordReset,
        sendTopicMemberUserInviteCreate: _sendTopicMemberUserInviteCreate,
        sendTopicMemberGroupCreate: _sendTopicMemberGroupCreate,
        sendGroupMemberUserInviteCreate: _sendGroupMemberUserInviteCreate,
        sendTopicReport: _sendTopicReport,
        sendTopicReportModerate: _sendTopicReportModerate,
        sendTopicReportReview: _sendTopicReportReview,
        sendTopicReportResolve: _sendTopicReportResolve,
        sendGroupMemberUserCreate: _sendGroupMemberUserCreate,
        sendCommentReport: _sendCommentReport,
        sendToParliament: _sendToParliament,
        sendHelpRequest: _sendHelpRequest,
        sendVoteReminder: _sendVoteReminder,
        sendTopicNotification: _sendTopicNotification,
        sendFeedback: _sendFeedback
    };
};
