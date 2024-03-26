module.exports = function (sequelize, DataTypes) {
    const LEVELS = {
        none: 'none', // Enables to override inherited permissions.
        read: 'read',
        edit: 'edit',
        admin: 'admin'
    };
    const TYPES = {
        addTopicGroup: 'addTopicGroup',
        addGroupTopic: 'addGroupTopic',
        userTopic: 'userTopic',
        userGroup: 'userGroup'
    }

    const Request = sequelize.define(
        'Request',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            creatorId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'User who created the request.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            topicId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Topic related to the request',
                references: {
                    model: 'Topics',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            groupId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Group related to the request.',
                references: {
                    model: 'Groups',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
                primaryKey: true
            },
            level: {
                type: DataTypes.ENUM,
                values: Object.values(LEVELS),
                allowNull: false,
                defaultValue: LEVELS.read,
                comment: 'Permission level related to the request.'
            },
            text: {
                type: DataTypes.STRING(2048),
                allowNull: true,
                comment: 'Additional comment for request, or message to the admin.'
            },
            type: {
                type: DataTypes.ENUM,
                values: Object.values(TYPES),
                allowNull: false,
                comment: 'Type of the request'
            },
            acceptedAt: {
                allowNull: true,
                type: DataTypes.DATE,
                comment: 'Request accepting time'
            },
            rejectedAt: {
                allowNull: true,
                type: DataTypes.DATE,
                comment: 'Request rejection time'
            },
            actorId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'User who accepted or rejected the request.',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            }
        }
    );

    Request.associate = function (models) {
        Request.hasOne(models.User, {
            through: models.User,
            foreignKey: 'creatorId',
            constraints: true
        });

        Request.hasOne(models.User, {
            through: models.User,
            foreignKey: 'actorId',
            constraints: true
        });

        Request.hasOne(models.Topic, {
            through: models.Topic,
            foreignKey: 'topicId',
            constraints: true
        });

        Request.hasOne(models.Group, {
            through: models.Group,
            foreignKey: 'groupId',
            constraints: true
        });

    };

    Request.TYPES = TYPES;
    Request.LEVELS = LEVELS;

    return Request;
}