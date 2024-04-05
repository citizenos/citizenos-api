/**
 * TopicIdeation
 *
 * @param {object} sequelize DataTypes instance
 * @param {object} DataTypes DataTypes DataTypes
 *
 * @returns {object} DataTypes model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */

module.exports = function (sequelize, DataTypes) {
    const TopicIdeation = sequelize.define(
        'TopicIdeation',
        {
            topicId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Topic this Ideation belongs to.',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            ideationId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Ideation id.',
                references: {
                    model: 'Ideations',
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

    return TopicIdeation;
}