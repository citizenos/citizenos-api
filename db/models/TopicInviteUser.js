'use strict';

const _ = require('lodash');

/**
 * TopicInvite
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @extends {object} Invite Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    // Parent model for this model
    const Invite = require('./_Invite').model(sequelize, DataTypes);
    const TopicMember = require('./_TopicMember').model(sequelize, DataTypes);

    // NOTE: TopicMemberUser extends TopicMember
    const attributes = _.extend({
        topicId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Topic to which User is invited to.',
            references: {
                model: 'Topics',
                key: 'id'
            }
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who is invited.',
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        level: {
            type: DataTypes.ENUM,
            values: _.values(TopicMember.LEVELS),
            allowNull: false,
            defaultValue: TopicMember.LEVELS.read,
            comment: 'User membership level.'
        }
    }, Invite.attributes);

    const TopicInvite = sequelize.define('TopicInvite', attributes);

    TopicInvite.associate = function (models) {
        TopicInvite.belongsTo(models.Topic, {
            foreignKey: 'topicId',
            as: 'topic'
        });

        TopicInvite.belongsTo(models.User, {
            foreignKey: 'creatorId',
            as: 'creator'
        });
    };

    TopicInvite.prototype.toJSON = function () {
        const data = {
            // id: this.dataValues.id, - DO NOT EXPOSE BY DEFAULT, as the whole invite system relies on the secrecy of the id
            userId: this.dataValues.userId,
            level: this.dataValues.level,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt
        };

        if (this.dataValues.creator) {
            data.creator = this.dataValues.creator;
        } else {
            data.creator = {};
            data.creator.id = this.dataValues.creatorId;
        }

        if (this.dataValues.topic) {
            data.topic = this.dataValues.topic;
        } else {
            data.topic = {};
            data.topic.id = this.dataValues.topicId;
        }

        return data;
    };

    return TopicInvite;
};
