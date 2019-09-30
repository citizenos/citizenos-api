'use strict';

var _ = require('lodash');

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
    var Invite = require('./_Invite').model(sequelize, DataTypes);
    var TopicMember = require('./_TopicMember').model(sequelize, DataTypes);

    // NOTE: TopicMemberUser extends TopicMember
    var attributes = _.extend({
        topicId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Topic to which User is invited to.',
            references: {
                model: 'Topics',
                key: 'id'
            },
            primaryKey: true
        },
        level: {
            type: DataTypes.ENUM,
            values: _.values(TopicMember.LEVELS),
            allowNull: false,
            defaultValue: TopicMember.LEVELS.read,
            comment: 'User membership level.'
        }
    }, Invite.attributes);

    return sequelize.define('TopicInvite', attributes);
};
