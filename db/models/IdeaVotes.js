/**
 * IdeaVote
 *
 * @param {object} sequelize DataTypes instance
 * @param {object} DataTypes DataTypes DataTypes
 *
 * @returns {object} DataTypes model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */

module.exports = function (sequelize, DataTypes) {
    const IdeaVote = sequelize.define(
        'IdeaVote',
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
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID of the voter',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            value: {
                type: DataTypes.INTEGER,
                comment: 'Vote value. Numeric, can be negative on down-vote.',
                allowNull: false,
                validate: {
                    isIn: {
                        args: [[1, 0, -1]],
                        msg: 'Vote value must be 1 (up-vote), -1 (down-vote) OR 0 to clear vote.'
                    }
                }
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

    return IdeaVote;
}