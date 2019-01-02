'use strict';

var _ = require('lodash');

/**
 * Attachments
 *
 * All attachments that have been linked to some content
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var SOURCES = {
        upload: 'upload',
        dropbox: 'dropbox',
        onedrive: 'onedrive',
        googledrive: 'googledrive'
    };

    var Attachment = sequelize.define(
        'Attachment',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'file name to display'
            },
            type: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Files type'
            },
            source: {
                type: DataTypes.ENUM,
                values: _.values(SOURCES),
                allowNull: false
            },
            size: {
                type: DataTypes.BIGINT,
                allowNull: true,
                comment: 'file size in bytes'
            },
            link: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'files location'
            },
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID of the reporter.',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            }
        }
    );

    Attachment.associate = function (models) {
        Attachment.belongsTo(models.User, {
            foreignKey: {
                fieldName: 'creatorId',
                allowNull: false
            },
            as: 'creator'
        });

        // TODO: funky association for cascade delete and right attachmentId reference
        Attachment.belongsToMany(models.Topic, {
            through: models.TopicAttachment,
            foreignKey: 'attachmentId',
            constraints: true
        });
    };

    Attachment.SOURCES = SOURCES;
    
    return Attachment;
};
