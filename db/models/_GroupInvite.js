'use strict';

/**
 * Group Invite
 *
 * A parent "Model" for all the GroupInvite* models so that consistency is guaranteed.
 *
 * NOT a full blown Sequelize model as Sequelize does not support extending models.
 *
 * @see https://github.com/sequelize/sequelize/wiki/Suggestion-for-Inheritance-API
 * @see http://stackoverflow.com/questions/19682171/how-to-extend-sequelize-model#answer-19684348
 */

module.exports.model = function (sequelize, DataTypes) {

    // Parent model for this model
    const Invite = require('./_Invite').model(sequelize, DataTypes);
    const _GroupMember = require('./_GroupMember').model(sequelize, DataTypes);

    // NOTE: Topic invite extends Invite and TopicMember. While it makes code harder to read, it gives consistency guarantees
    const GroupInvite = {
        attributes: Object.assign({}, Invite.attributes, _GroupMember.attributes) // All attributes inherited from parent models Invite and GroupMember
    };

    return GroupInvite;
};
