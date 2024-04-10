'use strict';
/**
 * Ideation
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, Sequelize) {
    const Ideation = sequelize.define(
        'Ideation',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4
            },
            creatorId: {
                type: Sequelize.UUID,
                allowNull: false,
                comment: 'User who created the ideation.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            question: {
                type: Sequelize.STRING(2048),
                allowNull: true,
                comment: 'Question the ideation is gathering ideas for'
            },

            deadline: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Deadline for the ideation. If NULL then no deadline at all.',
                validate: {
                    isAfter: {
                        args: [new Date().toString()],
                        msg: 'Ideation deadline must be in the future.'
                    }
                }
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deletedAt: {
                allowNull: true,
                type: Sequelize.DATE
            },
        },
    );

    Ideation.associate = function (models) {
        Ideation.belongsToMany(models.Idea, {
            through: models.IdeationIdea,
            foreignKey: 'ideationId',
            constraints: true
        });

        // TODO: funky association for cascade delete and right commentId reference
        Ideation.belongsToMany(models.Topic, {
            through: models.TopicIdeation,
            foreignKey: 'ideationId',
            constraints: true
        });
    };

    Ideation.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        const data = {
            id: this.dataValues.id,
            question: this.dataValues.question,
            creatorId: this.dataValues.creatorId,
            deadline: this.dataValues.deadline,
            createdAt: this.dataValues.createdAt,
            updatedAt: this.dataValues.updatedAt
        };

        return data;
    };

    return Ideation;
};
