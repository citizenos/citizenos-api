'use strict';
/**
 * Discussion
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, Sequelize) {
    const Discussion = sequelize.define(
        'Discussion',
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
                comment: 'User who created the discussion.',
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
                comment: 'Question the discussion is about'
            },

            deadline: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Deadline for the discussion. If NULL then no deadline at all.',
                validate: {
                    isAfter: {
                        args: [new Date().toString()],
                        msg: 'Discussion deadline must be in the future.'
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

    Discussion.associate = function (models) {
        Discussion.belongsTo(models.User, {
            as:'creator',
            foreignKey: 'creatorId',
            constraints: true
        });

        Discussion.belongsToMany(models.Comment, {
            through: models.DiscussionComment,
            foreignKey: 'discussionId',
            constraints: true
        });

        // TODO: funky association for cascade delete and right commentId reference
        Discussion.belongsToMany(models.Topic, {
            through: models.TopicDiscussion,
            foreignKey: 'discussionId',
            constraints: true
        });
    };

    Discussion.prototype.toJSON = function () {
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

    return Discussion;
};
