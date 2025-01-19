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
    const DELETE_REASON_TYPES = { // Copy of Report reason types until Sequelize supports ENUM reuse - https://github.com/sequelize/sequelize/issues/2577
        abuse: 'abuse', // is abusive or insulting
        obscene: 'obscene', // contains obscene language
        spam: 'spam', // contains spam or is unrelated to topic
        hate: 'hate', // contains hate speech
        netiquette: 'netiquette', // infringes (n)etiquette
        duplicate: 'duplicate' // duplicate
    };

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
                allowNull: true,
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
                type: DataTypes.TEXT,
                allowNull: false,
                comment: 'Idea description'
            },
            imageUrl: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'Image for the idea'
            },
            deletedById: {
                type: DataTypes.UUID,
                comment: 'User ID of the person who deleted the Comment',
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            deletedReasonType: {
                type: DataTypes.ENUM,
                values: Object.values(DELETE_REASON_TYPES),
                allowNull: true,
                comment: 'Delete reason type which is provided in case deleted by moderator due to a user report'
            },
            deletedReasonText: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                validate: {
                    len: {
                        args: [1, 2048],
                        msg: 'Text can be 1 to 2048 characters long.'
                    }
                },
                comment: 'Free text with reason why the comment was deleted'
            },
            deletedByReportId: {
                type: DataTypes.UUID,
                comment: 'Report ID due to which comment was deleted',
                allowNull: true,
                references: {
                    model: 'Reports',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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

    Idea.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.

        const data = {
            id: this.dataValues.id,
            ideationId: this.dataValues.ideationId,
            statement: this.dataValues.statement,
            description: this.dataValues.description,
            imageUrl: this.dataValues.imageUrl,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt,
            deletedAt: this.dataValues.deletedAt,
            deletedReasonType: this.dataValues.deletedReasonType,
            deletedReasonText: this.dataValues.deletedReasonText
        };


        if (this.dataValues.author) {
            data.author = this.dataValues.author;
        } else {
            data.author = {};
            data.author.id = this.dataValues.authorId;
        }

        if (this.dataValues.deletedBy) {
            data.deletedBy = this.dataValues.deletedBy;
        } else {
            data.deletedBy = {};
            data.deletedBy.id = this.dataValues.deletedById;
        }

        if (this.dataValues.report) {
            data.report = this.dataValues.report;
        } else {
            data.report = {};
            data.report.id = this.dataValues.deletedByReportId;
        }

        return data;
    };

    Idea.associate = function (models) {
        Idea.belongsTo(models.User, {
            as:'author',
            foreignKey: 'authorId',
            constraints: true
        });

        Idea.belongsTo(models.Ideation, {
            foreignKey: 'ideationId',
            constraints: true
        });

        Idea.hasMany(models.IdeaVote, {
            foreignKey: 'ideaId'
        });

        Idea.belongsToMany(models.Attachment, {
            through: models.IdeaAttachment,
            foreignKey: 'ideaId',
            constraints: true
        });

        Idea.belongsToMany(models.Report, {
            through: models.IdeaReport,
            foreignKey: 'ideaId',
            constraints: true
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

    Idea.DELETE_REASON_TYPES = DELETE_REASON_TYPES;

    return Idea;
}