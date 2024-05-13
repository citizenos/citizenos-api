/**
 * FolderIdea
 *
 * @param {object} sequelize DataTypes instance
 * @param {object} DataTypes DataTypes DataTypes
 *
 * @returns {object} DataTypes model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */

module.exports = function (sequelize, DataTypes) {
    const FolderIdea = sequelize.define(
        'FolderIdea',
        {
            folderId: {
                type: DataTypes.UUID,
                comment: 'Folder where idea belongs',
                allowNull: false,
                references: {
                    model: 'Folders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            ideaId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Ideas',
                    key: 'id'
                },
                primaryKey: true,
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            }
        },
        {
            timestamps: false
        }
    );

    return FolderIdea;
}