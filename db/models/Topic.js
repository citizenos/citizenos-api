'use strict';

const _ = require('lodash');
const hooks = require('../../libs/sequelize/hooks');
const util = require('util');
const config = require('config');
const Sequelize = require('sequelize');

/**
 * Topic
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    // The order of the status properties is important - you can move from top down (inProgress->voting->followUp..)
    const STATUSES = {
        inProgress: 'inProgress', // Being worked on
        voting: 'voting', // Is being voted which means the Topic is locked and cannot be edited.
        followUp: 'followUp', // Done editing Topic and executing on the follow up plan.
        closed: 'closed' // Final status - Topic is completed and no editing/reopening/voting can occur.
    };

    const VISIBILITY = {
        public: 'public', // Everyone has read-only on the Topic.  Pops up in the searches..
        private: 'private' // No-one can see except collaborators
    };

    // Categories - https://trello.com/c/CydUreyf/69-topics-category-support
    const CATEGORIES = {
        business: 'business', // Business and industry
        transport: 'transport', // Public transport and road safety
        taxes: 'taxes', // Taxes and budgeting
        agriculture: 'agriculture', // Agriculture
        environment: 'environment', // Environment, animal protection
        culture: 'culture', // Culture, media and sports
        health: 'health', // Health care and social care
        work: 'work', // Work and employment
        education: 'education', // Education
        politics: 'politics', // Politics and public administration
        communities: 'communities', // Communities and urban development
        defense: 'defense', //  Defense and security
        integration: 'integration', // Integration and human rights
        varia: 'varia', // Varia,
        youth: 'youth', //Youth
        science: 'science', //Science and Technology
        society: 'society' //Democracy and civil society
    };

    const CATEGORIES_COUNT_MAX = 3; // Maximum of 3 categories allowed at the time.
    let TITLE_LENGTH_MAX = config.topic.titleLengthMax; // Maximum length of "title"
    if (!parseInt(TITLE_LENGTH_MAX, 10) || TITLE_LENGTH_MAX > 1000) {
        TITLE_LENGTH_MAX = 1000;
    }
    const HASHTAG_BYTES_LENGTH_MAX = 59; //Maximum bytelenght of twitter hashtag in search API.

    const Op = Sequelize.Op;

    const Topic = sequelize.define(
        'Topic',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            title: {
                type: DataTypes.STRING(TITLE_LENGTH_MAX),
                comment: 'Title of the Topic.',
                allowNull: true,
                validate: {
                    len: {
                        args: [1, TITLE_LENGTH_MAX],
                        msg: 'Title can be 1 to ' + TITLE_LENGTH_MAX + ' characters long.'
                    }
                }
            },
            description: {
                type: DataTypes.TEXT,
                comment: 'Short description of what the Topic is about.',
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM,
                values: _.values(STATUSES),
                comment: 'Topic statuses.',
                allowNull: false,
                defaultValue: STATUSES.inProgress
            },
            visibility: {
                type: DataTypes.ENUM,
                values: _.values(VISIBILITY),
                comment: 'Who can see (read) the Topic apart from the Members.',
                allowNull: false,
                defaultValue: VISIBILITY.private
            },
            categories: {
                type: DataTypes.ARRAY(DataTypes.STRING), // While Sequelize does not support ARRAY of ENUM I'll use ARRAY of Strings - https://github.com/sequelize/sequelize/issues/1498
                defaultValue: [],
                validate: {
                    isArrayOfCategories: function (value) {
                        if (!value) return; // Since Sequelize 5.x custom validators are run when allowNull is true.

                        if (!Array.isArray(value)) {
                            throw new Error('Must be an array.');
                        }

                        if (value.length > CATEGORIES_COUNT_MAX) {
                            throw new Error(util.format('Maximum of %d categories allowed.', CATEGORIES_COUNT_MAX));
                        }
                    }
                },
                allowNull: true
            },
            sourcePartnerId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'The Partner id of the site from which the Topic was created',
                references: {
                    model: 'Partners',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            sourcePartnerObjectId: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'The Partner object/entity id for mapping'
            },
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID of the creator of the Topic.',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            padUrl: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: 'Etherpad Pad absolute url.',
                validate: {
                    is: /^https?:\/\/.*/
                }
            },
            endsAt: {
                type: DataTypes.DATE,
                allowNull: true,
                comment: 'Deadline for the Topic. If NULL then no deadline at all.',
                validate: {
                    isAfter: {
                        args: [new Date().toString()],
                        msg: 'Topic deadline must be in the future.'
                    }
                }
            },
            hashtag: {
                type: DataTypes.STRING(60),
                comment: 'Hashtag to search related content from external sources.',
                allowNull: true,
                validate: {
                    isDefinedByteLength: function (value) {
                        if (!value) return; // Since Sequelize 5.x custom validators are run when allowNull is true.

                        var length = Buffer.byteLength(value);
                        if (!length || length > HASHTAG_BYTES_LENGTH_MAX) {
                            throw new Error(util.format('Maximum of %d bytes allowed. Currently %d bytes', HASHTAG_BYTES_LENGTH_MAX, length));
                        }
                    }
                },
                defaultValue: null
            },
            authorIds: {
                type: DataTypes.ARRAY(DataTypes.UUID), //User id's of topic authors
                defaultValue: [],
                allowNull: true
            },
        },
        {
            indexes: [
                {
                    fields: ['title', 'deletedAt'],
                    where: {
                        title: {
                            [Op.ne]: null
                        },
                        deletedAt: {
                            [Op.eq]: null
                        }
                    }
                },
                {
                    unique: true,
                    fields: ['sourcePartnerId', 'sourcePartnerObjectId']
                }
            ]
        }
    );

    Topic.associate = function (models) {
        // Every Topic is created by a User whom we call "the Creator"
        Topic.belongsTo(models.User, {
            foreignKey: {
                fieldName: 'creatorId',
                allowNull: false
            },
            as: 'creator'
        });

        // Topic can have many Users as Members (collaborators)
        Topic.belongsToMany(models.User, {
            through: models.TopicMemberUser,
            foreignKey: 'topicId',
            as: {
                singular: 'memberUser',
                plural: 'memberUsers'
            },
            constraints: true
        });

        // Topic can have many Groups as Members
        Topic.belongsToMany(models.Group, {
            through: models.TopicMemberGroup,
            foreignKey: 'topicId',
            as: {
                singular: 'memberGroup',
                plural: 'memberGroups'
            },
            constraints: true
        });

        Topic.belongsToMany(models.Comment, {
            through: models.TopicComment,
            foreignKey: 'topicId',
            constraints: true
        });

        Topic.belongsToMany(models.Attachment, {
            through: models.TopicAttachment,
            foreignKey: 'topicId',
            constraints: true
        });

        Topic.hasMany(models.TopicEvent, {
            foreignKey: 'topicId'
        });

        Topic.hasMany(models.UserNotificationSettings, {
            foreignKey: 'topicId'
        });

        Topic.hasMany(models.TopicReport, {
            foreignKey: 'topicId'
        });

        // Topic can have many Votes - that is Topic Vote, mini-Vote..
        Topic.belongsToMany(models.Vote, {
            through: models.TopicVote,
            foreignKey: 'topicId',
            constraints: true
        });
    };

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    Topic.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        var data = {
            id: this.dataValues.id,
            title: this.dataValues.title,
            description: this.dataValues.description,
            status: this.dataValues.status,
            visibility: this.dataValues.visibility,
            categories: this.dataValues.categories,
            padUrl: this.dataValues.padUrl,
            sourcePartnerId: this.dataValues.sourcePartnerId,
            sourcePartnerObjectId: this.dataValues.sourcePartnerObjectId,
            endsAt: this.dataValues.endsAt,
            hashtag: this.dataValues.hashtag,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt
        };

        if (this.dataValues.creator) {
            data.creator = this.dataValues.creator;
        } else {
            data.creator = {};
            data.creator.id = this.dataValues.creatorId;
        }

        if (this.dataValues.memberGroups) {
            data.members = {
                groups: {
                    count: this.dataValues.memberGroups.length,
                    rows: this.dataValues.memberGroups
                }
            };
        }

        if (this.dataValues.join) { // TopicJoin
            data.join = this.dataValues.join;
        }

        return data;
    };

    /**
     * BeforeValidate hook
     *
     * Used for trimming all string values and sanitizing input before validators run.
     *
     * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
     */
    Topic.beforeValidate(hooks.trim);
    Topic.beforeValidate(hooks.replaceInvalidCharactersinHashtag);

    Topic.STATUSES = STATUSES;
    Topic.VISIBILITY = VISIBILITY;
    Topic.CATEGORIES = CATEGORIES;
    Topic.CATEGORIES_COUNT_MAX = CATEGORIES_COUNT_MAX;
    Topic.TITLE_LENGTH_MAX = TITLE_LENGTH_MAX;

    return Topic;
};
