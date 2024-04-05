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
                allowNull: false,
                primaryKey: true
            },
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID who favourited the idea',
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
                allowNull: true,
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

    return Folder;
}