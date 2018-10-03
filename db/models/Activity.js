'use strict';

/**
 * Activity
 * All acitivities.
 * @param {object} sequelize
 * @param {object} DataTypes
 */

module.exports = function (sequelize, DataTypes) {

    var TYPES = {
        add: 'Add',
        create: 'Create',
        update: 'Update',
        delete: 'Delete',
        invite: 'Invite',
        join: 'Join',
        leave: 'Leave',
        accept: 'Accept',
        view: 'View'
    };

    var Activity = sequelize.define(
        'Activity', {
            id: {
                type: DataTypes.UUID,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
                comment: 'Id of the Activity',
                primaryKey: true
            },
            data: {
                type: DataTypes.JSONB,
                allowNull: false,
                comment: 'Activity content'
            },
            actorType: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            actorId: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            topicIds: {
                name: 'Activities_topicIds',
                type: DataTypes.ARRAY(DataTypes.TEXT),
                defaultValue: []
            },
            groupIds: {
                name: 'Activities_groupIds',
                type: DataTypes.ARRAY(DataTypes.TEXT),
                defaultValue: []
            },
            userIds: {
                name: 'Activities_userIds',
                type: DataTypes.ARRAY(DataTypes.TEXT),
                defaultValue: []
            }
        },
        {
            indexes: [
                {
                    fields: ['data'],
                    using: 'gin',
                    operator: 'jsonb_path_ops'
                },
                {
                    fields: ['topicIds'],
                    using: 'gin'
                },
                {
                    fields: ['groupIds'],
                    using: 'gin'
                },
                {
                    fields: ['userIds'],
                    using: 'gin'
                },
                {
                    fields: ['actorType', 'actorId']
                }
            ]
        }
    );

    Activity.TYPES = TYPES;

    return Activity;
};
