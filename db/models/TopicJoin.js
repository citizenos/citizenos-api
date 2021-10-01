const stringUtil = require('../../libs/util');

/**
 * TopicJoin
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    let TopicMember = require('./_TopicMember').model(sequelize, DataTypes);

    let LEVELS = Object.assign({}, TopicMember.LEVELS); // Clone the object, no reference.
    delete LEVELS[TopicMember.LEVELS.none]; // Level "none" cannot be used with join links

    const TOKEN_LENGTH = 12;

    const generateTokenJoin = function () {
        return stringUtil.randomString(TOKEN_LENGTH);
    };

    const attributes = {
        topicId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Topic to which the Join information belongs.',
            references: {
                model: 'Topics',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
            primaryKey: true
        },
        token: {
            type: DataTypes.STRING(TOKEN_LENGTH),
            comment: 'Token for joining the Topic. Used for sharing public urls for Users to join the Topic.',
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

    const TopicJoin = sequelize.define(
        'TopicJoin',
        attributes
    );

    TopicJoin.generateToken = generateTokenJoin;

    TopicJoin.LEVELS = LEVELS;
    TopicJoin.TOKEN_LENGTH = TOKEN_LENGTH;

    TopicJoin.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        return {
            token: this.dataValues.token,
            level: this.dataValues.level,
        };
    };

    return TopicJoin;
};
