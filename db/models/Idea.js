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
            ideationId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what ideation the idea belongs to',
                references: {
                  model: 'Ideations',
                  key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
                allowNull: false,
                comment: 'Main idea statement'
            },
            description: {
                type: DataTypes.STRING,
                allowNull: false,
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
        Idea.belongsTo(models.User, {
            foreignKey: 'authorId',
            constraints: true
        });

        Idea.belongsTo(models.Ideation, {
            foreignKey: 'ideationId',
            constraints: true
        });

        Idea.belongsTo(models.IdeaVote, {
            foreignKey: 'ideaId'
        });

        Idea.belongsToMany(models.User, {
            through: models.IdeaFavourite,
            foreignKey: 'ideaId',
            constraints: true
        });

        Idea.belongsToMany(models.Folder, {
            through: models.FolderIdea,
            foreignKey: 'ideaId',
            constraints: true
        });

        Idea.belongsToMany(models.Comment, {
            through: models.IdeaComment,
            foreignKey: 'ideaId',
            constraints: true
        });
    }

    return Idea;
}