'use strict';

/**
 * TopicInviteUser
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

    // NOTE: TopicInviteUser extends TopicInvite
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
            as: 'topic',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        TopicInviteUser.belongsTo(models.User, {
            foreignKey: 'creatorId',
            as: 'creator',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        TopicInviteUser.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    };

    TopicInviteUser.prototype.toJSON = function () {
        const data = {
            id: this.dataValues.id,
            topicId: this.dataValues.topicId,
            userId: this.dataValues.userId,
            creatorId: this.dataValues.creatorId,
            level: this.dataValues.level,
            expiresAt: this.dataValues.expiresAt,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt
        };

        if (this.dataValues.topic) {
            data.topic = this.dataValues.topic;
        }

        if (this.dataValues.creator) {
            data.creator = this.dataValues.creator;
        }

        if (this.dataValues.user) {
            data.user = this.dataValues.user;
            // FIXME: REMOVE THIS COMMENT IF we have a green light to show full e-mail - https://github.com/citizenos/citizenos-fe/issues/657#issuecomment-829314888
            // if (data.user.email) {
            //     data.user.email = util.emailToMaskedEmail(data.user.email);
            // }
        }

        return data;
    };

    TopicInviteUser.VALID_DAYS = 14; // How many days an invite is considered valid, over that is expired

    return TopicInviteUser;
};
