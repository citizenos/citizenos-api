'use strict';

module.exports = (sequelize, DataTypes) => {

  const UserNotificationSettings = sequelize.define(
      'UserNotificationSettings',
      {
          userId: {
              type: DataTypes.UUID,
              allowNull: false,
              comment: 'Id of the User whom the connection belongs to.',
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
            references: {
                model: 'Topics',
                key: 'id'
            },
            primaryKey: true
          },
          groupId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Groups',
                key: 'id'
            },
            primaryKey: true
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
      }
  );
  return UserNotificationSettings;
};