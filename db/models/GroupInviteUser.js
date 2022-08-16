'use strict';

/**
 * GroupInviteUser
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
    const GroupInvite = require('./_GroupInvite').model(sequelize, DataTypes);

    // NOTE: GroupInviteUser extends GroupInvite
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
    }, GroupInvite.attributes);

    const GroupInviteUser = sequelize.define('GroupInviteUser', attributes);

    GroupInviteUser.associate = function (models) {
        GroupInviteUser.belongsTo(models.Group, {
            foreignKey: 'groupId',
            as: 'group',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        GroupInviteUser.belongsTo(models.User, {
            foreignKey: 'creatorId',
            as: 'creator',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        GroupInviteUser.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });
    };

    GroupInviteUser.prototype.toJSON = function () {
        const data = {
            id: this.dataValues.id,
            groupId: this.dataValues.groupId,
            userId: this.dataValues.userId,
            creatorId: this.dataValues.creatorId,
            level: this.dataValues.level,
            expiresAt: this.dataValues.expiresAt,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt
        };

        if (this.dataValues.group) {
            data.group = this.dataValues.group;
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

    GroupInviteUser.VALID_DAYS = 14; // How many days an invite is considered valid, over that is expired

    return GroupInviteUser;
};
