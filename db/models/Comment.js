'use strict';

const _ = require('lodash');
const hooks = require('../../libs/sequelize/hooks');

/**
 * Comment
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {
    const TYPES = {
        pro: 'pro',
        con: 'con',
        poi: 'poi', // Point of Information - https://github.com/citizenos/citizenos-fe/issues/329
        reply: 'reply'
    };

    const TYPE_LENGTH_LIMIT = {
        pro: 2048,
        con: 2048,
        poi: 500,
        reply: 2048
    };

    const DELETE_REASON_TYPES = { // Copy of Report reason types until Sequelize supports ENUM reuse - https://github.com/sequelize/sequelize/issues/2577
        abuse: 'abuse', // is abusive or insulting
        obscene: 'obscene', // contains obscene language
        spam: 'spam', // contains spam or is unrelated to topic
        hate: 'hate', // contains hate speech
        netiquette: 'netiquette', // infringes (n)etiquette
        duplicate: 'duplicate' // duplicate
    };

    const Comment = sequelize.define(
        'Comment',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            type: {
                type: DataTypes.ENUM,
                values: _.values(TYPES),
                allowNull: false
            },
            parentId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Parent comment id. Replies to comments have a parent.',
                references: {
                    model: 'Comments',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            parentVersion: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
                comment: 'Edit version'
            },
            subject: {
                type: DataTypes.STRING(128),
                allowNull: true, // Can be null for replies
                validate: {
                    len: {
                        args: [1, 128],
                        msg: 'Subject can be 1 to 128 characters long.'
                    }
                }
            },
            text: {
                type: DataTypes.STRING(2048),
                allowNull: false,
                validate: {
                    len: function (value) {
                        const maxLength = TYPE_LENGTH_LIMIT[this.type];
                        const length = Buffer.byteLength(value);

                        if (!value || length > maxLength) {
                            throw new Error(`Text can be 1 to ${maxLength} characters long.`);
                        }
                    }
                }
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
            deletedById: {
                type: DataTypes.UUID,
                comment: 'User ID of the person who deleted the Comment',
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            deletedReasonType: {
                type: DataTypes.ENUM,
                values: _.values(DELETE_REASON_TYPES),
                allowNull: true,
                comment: 'Delete reason type which is provided in case deleted by moderator due to a user report'
            },
            deletedReasonText: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                validate: {
                    len: {
                        args: [1, 2048],
                        msg: 'Text can be 1 to 2048 characters long.'
                    }
                },
                comment: 'Free text with reason why the comment was deleted'
            },
            deletedByReportId: {
                type: DataTypes.UUID,
                comment: 'Report ID due to which comment was deleted',
                allowNull: true,
                references: {
                    model: 'Reports',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            edits: {
                type: DataTypes.JSONB,
                comment: 'Comment versions in JSONB array',
                allowNull: true
            }
        }
    );

    Comment.associate = function (models) {
        Comment.belongsToMany(models.Report, {
            through: models.CommentReport,
            foreignKey: 'commentId',
            constraints: true
        });

        // TODO: funky association for cascade delete and right commentId reference
        Comment.belongsToMany(models.Topic, {
            through: models.TopicComment,
            foreignKey: 'commentId',
            constraints: true
        });
    };

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    Comment.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.

        const data = {
            id: this.dataValues.id,
            type: this.dataValues.type,
            text: this.dataValues.text,
            edits: this.dataValues.edits,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt,
            deletedAt: this.dataValues.deletedAt,
            deletedReasonType: this.dataValues.deletedReasonType,
            deletedReasonText: this.dataValues.deletedReasonText
        };

        if (this.dataValues.type !== TYPES.reply) { // Replies are not supposed to have a subject
            data.subject = this.dataValues.subject;
        }

        if (this.dataValues.creator) {
            data.creator = this.dataValues.creator;
        } else {
            data.creator = {};
            data.creator.id = this.dataValues.creatorId;
        }

        if (this.dataValues.deletedBy) {
            data.deletedBy = this.dataValues.deletedBy;
        } else {
            data.deletedBy = {};
            data.deletedBy.id = this.dataValues.deletedById;
        }

        if (this.dataValues.report) {
            data.report = this.dataValues.report;
        } else {
            data.report = {};
            data.report.id = this.dataValues.deletedByReportId;
        }

        if (this.dataValues.parent) {
            data.parent = this.dataValues.parent;
        } else {
            data.parent = {};
            data.parent.id = this.dataValues.parentId;
            data.parent.version = this.dataValues.parentVersion;
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
    Comment.addHook('beforeValidate', function (comment) {
        if (!comment.parentId) {
            comment.parentId = comment.id;
        }
    });
    Comment.beforeValidate(hooks.trim);

    Comment.TYPES = TYPES;
    Comment.TYPE_LENGTH_LIMIT = TYPE_LENGTH_LIMIT;
    Comment.DELETE_REASON_TYPES = DELETE_REASON_TYPES;

    return Comment;
};
