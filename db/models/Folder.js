/**
 * Folder
 *
 * @param {object} sequelize DataTypes instance
 * @param {object} DataTypes DataTypes DataTypes
 *
 * @returns {object} DataTypes model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */

module.exports = function (sequelize, DataTypes) {
    const Folder = sequelize.define(
        'Folder',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            ideationId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what ideation the folder belongs to',
                references: {
                    model: 'Ideations',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID who created the folder',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            name: {
                type: DataTypes.STRING(512),
                allowNull: false,
                comment: 'Folder name'
            },
            description: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                comment: 'Folder description'
            },
            createdAt: {
                allowNull: false,
                type: DataTypes.DATE
            },
            updatedAt: {
                allowNull: false,
                type: DataTypes.DATE
            },
            deletedAt: {
                allowNull: true,
                type: DataTypes.DATE
            },
        }
    );
    Folder.associate = function (models) {
        Folder.belongsToMany(models.Idea, {
            through: models.FolderIdea,
            foreignKey: 'folderId',
            constraints: true
        });

        Folder.belongsTo(models.Ideation, {
            foreignKey: 'ideationId',
            constraints: true
        });
    }
    return Folder;
}