'use strict';

var _ = require('lodash');

module.exports = {
    up: (queryInterface, Sequelize) => {
        var TYPES = {
            abuse: 'abuse', // is abusive or insulting
            obscene: 'obscene', // contains obscene language
            spam: 'spam', // contains spam or is unrelated to topic
            hate: 'hate', // contains hate speech
            netiquette: 'netiquette', // infringes (n)etiquette
            duplicate: 'duplicate' // duplicate
        };

        return queryInterface.createTable(
            'TopicReports',
            {
                id: {
                    type: Sequelize.UUID,
                    primaryKey: true,
                    allowNull: false,
                    defaultValue: Sequelize.UUIDV4
                },
                type: {
                    type: Sequelize.ENUM,
                    values: _.values(TYPES),
                    allowNull: false,
                    comment: 'Report reason - verbal abuse, obscene content, hate speech etc..'
                },
                text: {
                    type: Sequelize.STRING(2048),
                    allowNull: false,
                    validate: {
                        len: {
                            args: [1, 2048],
                            msg: 'Report text can be 1 to 2048 characters long.'
                        }
                    },
                    comment: 'Additional comment for the report to provide more details on the violation.'
                },
                creatorId: {
                    type: Sequelize.UUID,
                    comment: 'User ID of the reporter.',
                    allowNull: false,
                    references: {
                        model: 'Users',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                creatorIp: {
                    type: Sequelize.STRING(45), // No specific DataType in Sequelize so STRING(45) supports IPv6 and IPv4 notations
                    comment: 'IP address of the reporter',
                    allowNull: false
                },
                topicId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: 'Topics',
                        key: 'id'
                    },
                    primaryKey: true,
                    comment: 'Id if the Topic which the Report belongs to.'
                },
                moderatedById: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'Users',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    comment: 'User ID of the person who moderated the Topic on report. That is, a Moderator agreed that Report is valid.'
                },
                moderatedAt: {
                    type: Sequelize.DATE,
                    comment: 'Time when the Topic was Moderated',
                    allowNull: true
                },
                moderatedReasonType: {
                    type: Sequelize.ENUM,
                    values: _.values(TYPES),
                    allowNull: true,
                    comment: 'Moderation reason - verbal abuse, obscene content, hate speech etc..'
                },
                moderatedReasonText: {
                    type: Sequelize.STRING(2048),
                    allowNull: true,
                    comment: 'Additional comment for the Report to provide more details on the Moderator acton.'
                },
                resolvedById: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: 'Users',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE',
                    comment: 'User ID of the person who considered the issue to be resolved thus making the report outdated.'
                },
                resolvedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    comment: 'Time when the Report was marked as resolved.'
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                deletedAt: {
                    type: Sequelize.DATE
                }
            }
        );
    },
    down: (queryInterface) => {
        return queryInterface
            .dropTable('TopicReports')
            .then(function () { // While Sequelize does not support naming ENUMS, it creates duplicates - https://github.com/sequelize/sequelize/issues/2577
                return queryInterface.sequelize
                    .query('DROP TYPE IF EXISTS "enum_TopicReports_moderatedReasonType";');
            })
            .then(function () {
                return queryInterface.sequelize
                    .query('DROP TYPE IF EXISTS "enum_TopicReports_type";');
            });
    }
};
