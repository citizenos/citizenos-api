/**
 * Idea
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */

module.exports = function (sequelize, DataTypes) {
    const Idea = sequelize.define(
        'Idea',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            authorId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Author of the idea',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            statement: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                comment: 'Main idea statement'
            },
            description: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Idea description'
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Image for the idea'
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

    Idea.associate = function (models) {
        Idea.belongsTo(models.Ideation, {
            through: models.IdeationIdea,
            foreignKey: 'ideaId',
            constraints: true
        });
        Idea.belongsTo(models.User, {
            foreignKey: 'authorId',
            constraints: true
        });

        Idea.hasMany(models.IdeaVote, {
            foreignKey: 'ideaId'
        });

        Idea.belongsTo(models.User, {
            through: models.IdeaFavourite,
            foreignKey: 'ideaId',
            constraints: true
        });
    }

    return Idea;
}