'use strict';

/**
 * Group Invite User
 *
 * @see https://github.com/sequelize/sequelize/wiki/Suggestion-for-Inheritance-API
 * @see http://stackoverflow.com/questions/19682171/how-to-extend-sequelize-model#answer-19684348
 */

module.exports.model = function (sequelize, DataTypes) {

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
            as: 'group'
        });

        GroupInviteUser.belongsTo(models.User, {
            foreignKey: 'creatorId',
            as: 'creator'
        });

        GroupInviteUser.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    GroupInviteUser.prototype.toJSON = function () {
        const data = {
            id: this.dataValues.id,
            groupId: this.dataValues.groupId,
            userId: this.dataValues.userId,
            creatorId: this.dataValues.creatorId,
            level: this.dataValues.level,
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
            if (data.user.email) {
                data.user.email = util.emailToMaskedEmail(data.user.email);
            }
        }

        return data;
    };

    GroupInviteUser.VALID_DAYS = 14; // How many days an invite is considered valid, over that is expired

    return GroupInviteUser;
};
