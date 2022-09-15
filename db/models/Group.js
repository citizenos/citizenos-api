'use strict';

var _ = require('lodash');

/**
 * Group
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {
    var hooks = require('../../libs/sequelize/hooks');

    var VISIBILITY = {
        public: 'public', // Everyone has read-only on the Group.  Pops up in the searches..
        private: 'private' // No-one can see except collaborators
    };

    var Group = sequelize.define(
        'Group',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            parentId: {
                type: DataTypes.UUID,
                defaultValue: null,
                comment: 'Parent Groups id.'
            },
            name: {
                type: DataTypes.STRING(255),
                comment: 'Name of the Group.',
                allowNull: false,
                validate: {
                    len: {
                        args: [2, 255],
                        msg: 'Group name can be 2 to 255 characters long.'
                    }
                }
            },
            //NOTE: Actually defined in associations (index.js) BUT doubled here so that when you look at the model you know that you have Creator.
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID of the creator of the Group.',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            visibility: {
                type: DataTypes.ENUM,
                values: _.values(VISIBILITY),
                comment: 'Who can see (read) the Group apart from the Members.',
                allowNull: false,
                defaultValue: VISIBILITY.private
            },
            sourcePartnerId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'The Partner id of the site from which the Group was created',
                references: {
                    model: 'Partners',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Group profile image url.'
            },
            description: {
                type: DataTypes.TEXT,
                comment: 'Short description of what the Group is about.',
                allowNull: true
            },
        }
    );

    Group.associate = function (models) {
        // Group can have many Members
        Group.belongsToMany(models.User, {
            through: models.GroupMemberUser,
            foreignKey: 'groupId',
            as: {
                singular: 'member',
                plural: 'members'
            },
            constraints: true
        });

        // Every Group is created by a User whom we call "the Creator"
        Group.belongsTo(models.User, {
            foreignKey: {
                fieldName: 'creatorId',
                allowNull: false
            },
            as: 'creator'
        });

        Group.belongsToMany(models.Topic, {
            through: models.TopicMemberGroup,
            foreignKey: 'groupId',
            constraints: true
        });

        Group.hasMany(models.UserNotificationSettings, {
            foreignKey: 'topicId'
        });
    };

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    Group.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        var data = {
            id: this.dataValues.id,
            parentId: this.dataValues.parentId,
            description: this.dataValues.description,
            imageUrl: this.dataValues.imageUrl,
            name: this.dataValues.name,
            creator: this.dataValues.creator,
            visibility: this.dataValues.visibility
        };

        if (this.dataValues.creator) {
            data.creator = this.dataValues.creator;
        } else {
            data.creator = {};
            data.creator.id = this.dataValues.creatorId;
        }

        if (this.dataValues.members) {
            data.members = {
                count: this.dataValues.members.length,
                rows: this.dataValues.members
            };
        }

        return data;
    };

    /**
     * BeforeValidate hook
     *
     * Used for trimming all string values and sanitizing input before validators run.
     *
     * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
     */
    Group.beforeValidate(hooks.trim);
    Group.VISIBILITY = VISIBILITY;

    return Group;
};
