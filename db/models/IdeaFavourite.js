/**
 * IdeaFavourite
 *
 * @param {object} sequelize DataTypes instance
 * @param {object} DataTypes DataTypes DataTypes
 *
 * @returns {object} DataTypes model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */

module.exports = function (sequelize, DataTypes) {
    const IdeaFavourite = sequelize.define(
        'IdeaFavourite',
        {
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
            },
            userId: {
                type: DataTypes.UUID,
                comment: 'User ID who favourited the idea',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            }
        }
    );

    return IdeaFavourite;
}