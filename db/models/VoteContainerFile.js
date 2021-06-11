'use strict';

/**
 * VoteContainerFiles
 *
 * Represents the Vote specific files that are to be in the final and user signed BDOC container
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var VoteContainerFile = sequelize.define(
        'VoteContainerFile',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            voteId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Vote these files belong to.',
                references: {
                    model: 'Votes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            fileName: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: 'File name as it will appear in the BDOC container.'
            },
            mimeType: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: 'Mime type of the file.'
            },
            content: {
                type: DataTypes.BLOB,
                allowNull: false,
                comment: 'File content.'
            }
        }
    );

    return VoteContainerFile;
};
