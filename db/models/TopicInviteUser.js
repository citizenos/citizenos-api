'use strict';

const util = require('../../libs/util');

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
    const TopicInvite = require('./_TopicInvite').model(sequelize, DataTypes);

    // NOTE: TopicMemberUser extends TopicMember
    const attributes = Object.assign({
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'User who is invited.',
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, TopicInvite.attributes);

    const TopicInviteUser = sequelize.define('TopicInviteUser', attributes);

    TopicInviteUser.associate = function (models) {
        TopicInviteUser.belongsTo(models.Topic, {
            foreignKey: 'topicId',
            as: 'topic'
        });

        TopicInviteUser.belongsTo(models.User, {
            foreignKey: 'creatorId',
            as: 'creator'
        });

        TopicInviteUser.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    TopicInviteUser.prototype.toJSON = function () {
        const data = {
            id: this.dataValues.id,
            level: this.dataValues.level,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt
        };

        if (this.dataValues.topic) {
            data.topic = this.dataValues.topic;
        } else {
            data.topic = {};
            data.topic.id = this.dataValues.topicId;
        }

        if (this.dataValues.creator) {
            data.creator = this.dataValues.creator;
        } else {
            data.creator = {};
            data.creator.id = this.dataValues.creatorId;
        }

        if (this.dataValues.user) {
            data.user = this.dataValues.user;
        } else {
            data.user = {};
            data.user.id = this.dataValues.userId;
        }

        // MASK THE EMAIL, we don't want to show complete email
        if (data.user.email) {
            data.user.email = util.emailToMaskedEmail(data.user.email);
        }

        return data;
    };

    TopicInviteUser.VALID_DAYS = 14; // How many days an invite is considered valid, over that is expired

    return TopicInviteUser;
};
