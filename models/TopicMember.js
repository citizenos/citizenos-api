'use strict';

/**
 * Topic Member
 *
 * A parent "Model" for all the TopicMember* models so that consistency is guaranteed.
 *
 * NOT a full blown Sequelize model as Sequelize does not support extending models.
 *
 * @see https://github.com/sequelize/sequelize/wiki/Suggestion-for-Inheritance-API
 * @see http://stackoverflow.com/questions/19682171/how-to-extend-sequelize-model#answer-19684348
 */

var _ = require('lodash');

var LEVELS = {
    none: 'none', // Enables to override inherited permissions.
    read: 'read',
    edit: 'edit',
    admin: 'admin'
};

module.exports.LEVELS = LEVELS;

module.exports.model = function (sequelize, DataTypes) {

    var TopicMember = {
        attributes: {
            topicId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Topic to which member belongs.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                primaryKey: true
            },
            level: {
                type: DataTypes.ENUM,
                values: _.values(LEVELS),
                allowNull: false,
                defaultValue: LEVELS.read,
                comment: 'User membership level.'
            }
        },
        options: {
            // Can have hooks and stuff here.. - http://sequelizejs.com/docs/latest/models#expansion-of-models
        }
    };

    return TopicMember;
};
