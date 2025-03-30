'use strict';

/**
 * TopicReport
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    // Parent model for this model
    const Report = require('./Report')(sequelize, DataTypes);

    // NOTE: TopicReport extends Report
    const attributes = {
        topicId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Topics',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true,
            comment: 'Id if the Topic which the Report belongs to.'
        },
        moderatedById: {
            type: DataTypes.UUID,
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
            type: DataTypes.DATE,
            comment: 'Time when the Topic was Moderated',
            allowNull: true
        },
        moderatedReasonType: {
            type: DataTypes.ENUM,
            values: Object.values(Report.TYPES),
            allowNull: true,
            comment: 'Moderation reason - verbal abuse, obscene content, hate speech etc..',
            validate: {
                doNotAllowNullWhenModeratorIsSet(value) {
                    if ((this.moderatedAt || this.moderatedById) && !value) {
                        throw new Error('TopicReport.moderatedReasonType cannot be null when moderator is set');
                    }
                }
            }
        },
        moderatedReasonText: {
            type: DataTypes.STRING(2048),
            allowNull: true,
            validate: {
                doNotAllowNullWhenModeratorIsSet(value) {
                    if ((this.moderatedAt || this.moderatedById) && !value) {
                        throw new Error('TopicReport.moderatedReasonText cannot be null when moderator is set!');
                    }
                },
                len: {
                    args: [1, 2048],
                    msg: 'Text can be 1 to 2048 characters long.'
                }
            },
            comment: 'Additional comment for the Report to provide more details on the Moderator acton.'
        },
        resolvedById: {
            type: DataTypes.UUID,
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
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Time when the Report was marked as resolved.'
        }
        , ...Report.rawAttributes
    };

    const TopicReport = sequelize.define('TopicReport', attributes);

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    TopicReport.prototype.toJSON = function () {
        const data = Report.prototype.toJSON.call(this); // Call parents "toJSON"

        // TopicReport specific white list here
        if (this.dataValues.moderator) {
            data.moderator = this.dataValues.moderator;
        } else {
            data.moderator = {};
            data.moderator.id = this.dataValues.moderatedById;
        }

        data.moderatedReasonText = this.dataValues.moderatedReasonText;
        data.moderatedReasonType = this.dataValues.moderatedReasonType;
        data.moderatedAt = this.dataValues.moderatedAt;

        return data;
    };

    TopicReport.TYPES = Report.TYPES;

    return TopicReport;
};
