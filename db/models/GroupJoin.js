const stringUtil = require('../../libs/util');

/**
 * GroupJoin
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    let GroupMember = require('./_GroupMember').model(sequelize, DataTypes);

    let LEVELS = GroupMember.LEVELS;

    const TOKEN_LENGTH = 12;

    const generateTokenJoin = function () {
        return stringUtil.randomString(TOKEN_LENGTH);
    };

    const attributes = {
        groupId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Group to which the Join information belongs.',
            references: {
                model: 'Groups',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
        },
        token: {
            type: DataTypes.STRING(TOKEN_LENGTH),
            comment: 'Token for joining the Group. Used for sharing public urls for Users to join the Group.',
            allowNull: false,
            unique: true,
            defaultValue: function () {
                return generateTokenJoin();
            }
        },
        level: {
            type: DataTypes.ENUM,
            values: Object.values(LEVELS),
            allowNull: false,
            defaultValue: LEVELS.read,
            comment: 'Join level, that is what level access will the join token provide'
        }
    };

    const GroupJoin = sequelize.define(
        'GroupJoin',
        attributes
    );

    GroupJoin.generateToken = generateTokenJoin;

    GroupJoin.LEVELS = LEVELS;
    GroupJoin.TOKEN_LENGTH = TOKEN_LENGTH;

    GroupJoin.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        return {
            token: this.dataValues.token,
            level: this.dataValues.level,
        };
    };

    return GroupJoin;
};
