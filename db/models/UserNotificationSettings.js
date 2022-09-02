'use strict';

module.exports = (sequelize, DataTypes) => {

  const UserNotificationSettings = sequelize.define(
      'UserNotificationSettings',
      {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
          },
          userId: {
              type: DataTypes.UUID,
              allowNull: false,
              comment: 'Id of the User whom the connection belongs to.',
              references: {
                  model: 'Users',
                  key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
          },
          topicId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Topics',
                key: 'id'
            }
          },
          groupId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Groups',
                key: 'id'
            }
          },
          allowNotifications: {
              type: DataTypes.BOOLEAN,
              default: false
          },
          preferences: {
              type: DataTypes.JSON,
              allowNull: true,
              comment: 'Notification pecific data you want to store.'
          }
      }, {
        indexes: [
          {
              unique: true,
              fields: ['userId', 'topicId', 'groupId']
          }
      ]
      }
  );

  UserNotificationSettings.associate = function (models) {
      UserNotificationSettings.belongsTo(models.Topic, {
          foreignKey: 'topicId'
      });
      UserNotificationSettings.belongsTo(models.User, {
         foreignKey: 'userId'
      });
      UserNotificationSettings.belongsTo(models.Group, {
         foreignKey: 'groupId'
      });
  };
  return UserNotificationSettings;
};