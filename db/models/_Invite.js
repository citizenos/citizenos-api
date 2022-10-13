'use strict';

/**
 * Invite
 *
 * A parent "Model" for all the *Invite models so that consistency is guaranteed.
 *
 * NOT a full blown Sequelize model as Sequelize does not support extending models.
 *
 * @see https://github.com/sequelize/sequelize/wiki/Suggestion-for-Inheritance-API
 * @see http://stackoverflow.com/questions/19682171/how-to-extend-sequelize-model#answer-19684348
 */

module.exports.model = function (sequelize, DataTypes) {

    const Invite = {
        attributes: {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            creatorId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'User who created the invite.',
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: function () {
                    const time = new Date();
                    time.setDate(time.getDate() + Invite.VALID_DAYS);
                    return time;
                },
                comment: 'Invite expiration time.',
                validate: {
                    isAfter: {
                        args: [new Date().toString()],
                        msg: 'Expiration deadline must be in the future.'
                    }
                }
            },
        }
    };

    Invite.VALID_DAYS = 14; // How many days an invite is considered valid, over that is expired

    return Invite;
};
