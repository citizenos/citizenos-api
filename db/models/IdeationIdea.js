/**
 * IdeationIdea
 *
 * @param {object} sequelize DataTypes instance
 * @param {object} DataTypes DataTypes DataTypes
 *
 * @returns {object} DataTypes model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */

module.exports = function (sequelize, DataTypes) {
    const IdeationIdea = sequelize.define(
        'IdeationIdea',
        {
            ideationId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what ideation the idea belongs to',
                references: {
                    model: 'Ideations',
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
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
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

    return IdeationIdea;
}