'use strict';

/**
 * TopicEvent
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {
    var TITLE_LENGTH_MAX = 128; // Maximum length of "title"

    var TopicEvent = sequelize.define(
        'TopicEvent',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                comment: 'Event id',
                defaultValue: DataTypes.UUIDV4
            },
            topicId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Topic this Comment belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            subject: {
                type: DataTypes.STRING(TITLE_LENGTH_MAX),
                comment: 'Subject of the Event.',
                allowNull: true,
                validate: {
                    len: {
                        args: [1, TITLE_LENGTH_MAX],
                        msg: 'Title can be 1 to ' + TITLE_LENGTH_MAX + ' characters long.'
                    }
                }
            },
            text: {
                type: DataTypes.TEXT,
                comment: 'Text of the Event.',
                allowNull: false
            }
        }
    );

    TopicEvent.associate = function (models) {
        TopicEvent.belongsTo(models.Topic, {
            foreignKey: 'topicId'
        });
    };

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    TopicEvent.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        var data = {
            id: this.dataValues.id,
            subject: this.dataValues.subject,
            text: this.dataValues.text,
            createdAt: this.dataValues.createdAt
        };

        return data;
    };

    return TopicEvent;
};
