'use strict';
const config = require('config');
const cryptoLib = require('../../libs/crypto');
const path = require('path');
const log4js = require('log4js');
log4js.configure(config.logging.log4js);
const logger = log4js.getLogger(path.basename(__filename));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Verify encryption key is configured
      if (!config.get('db.privateKey')) {
        throw new Error('Encryption key is not set in configuration (db.privateKey)');
      }

      logger.info('Starting encryption migration...');

      // Step 1: Check and add encrypted columns if they don't exist
      // For Users table
      const userEmailExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'Users' AND column_name = 'emailEncrypted'`,
        { transaction }
      );

      if (!userEmailExists[0].length) {
        console.log('Adding emailEncrypted column to Users table');
        await queryInterface.addColumn(
          'Users',
          'emailEncrypted',
          {
            type: Sequelize.TEXT,
            allowNull: true
          },
          { transaction }
        );
        logger.info('Added emailEncrypted column to Users table');
      } else {
        logger.info('Users.emailEncrypted column already exists');
      }

      // For UserConnections table - connectionUserIdEncrypted
      const connectionUserIdEncryptedExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'UserConnections' AND column_name = 'connectionUserIdEncrypted'`,
        { transaction }
      );

      if (!connectionUserIdEncryptedExists[0].length) {
        console.log('Adding connectionUserIdEncrypted column to UserConnections table');
        await queryInterface.addColumn(
          'UserConnections',
          'connectionUserIdEncrypted',
          {
            type: Sequelize.TEXT,
            allowNull: true
          },
          { transaction }
        );
        logger.info('Added connectionUserIdEncrypted column to UserConnections table');
      } else {
        logger.info('UserConnections.connectionUserIdEncrypted column already exists');
      }

      // For UserConnections table - connectionUserDataEncrypted
      const connectionUserDataEncryptedExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'UserConnections' AND column_name = 'connectionUserDataEncrypted'`,
        { transaction }
      );

      if (!connectionUserDataEncryptedExists[0].length) {
        console.log('Adding connectionUserDataEncrypted column to UserConnections table');
        await queryInterface.addColumn(
          'UserConnections',
          'connectionUserDataEncrypted',
          {
            type: Sequelize.TEXT,
            allowNull: true
          },
          { transaction }
        );
        logger.info('Added connectionUserDataEncrypted column to UserConnections table');
      } else {
        logger.info('UserConnections.connectionUserDataEncrypted column already exists');
      }

      // Step 2: Encrypt data from original columns to encrypted columns
      // Using the application's cryptoLib.privateEncrypt method
      console.log('Running encryption process for Users table...');
      const BATCH_SIZE = 1000;
      const [{ count: totalUserCount }] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "Users" WHERE email IS NOT NULL AND "emailEncrypted" IS NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Total users to process: ${totalUserCount}`);
      let processedUsers = 0;
      let failedUsers = [];

      // Special handling for already encrypted emails
      const emailCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM "Users" WHERE "email" IS NOT NULL`,
        { transaction }
      );

      const totalEmails = emailCount[0][0].count;
      logger.info(`Found ${totalEmails} emails to process`);

      while (processedUsers < totalUserCount) {
        const users = await queryInterface.sequelize.query(
          'SELECT id, email FROM "Users" WHERE email IS NOT NULL AND "emailEncrypted" IS NULL LIMIT :limit',
          {
            replacements: { limit: BATCH_SIZE },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        if (users.length === 0) break;

        for (const user of users) {
          try {
            // Skip if already properly encrypted
            if (user.emailEncrypted) {
              continue;
            }

            // Check if email is already in an encrypted format (starts with '20')
            const isAlreadyEncrypted = typeof user.email === 'string' && user.email.startsWith('20');

            // If the email is already encrypted but in a different format,
            // we need to handle it as a special case - for now, just encrypt it as is
            // because we can't decrypt the old format
            const emailEncrypted = cryptoLib.privateEncrypt(user.email);

            if (isAlreadyEncrypted) {
                logger.info(`User ${user.id} email appears to be already encrypted in a different format. Re-encrypting with current method.`);
            }

            await queryInterface.sequelize.query(
              'UPDATE "Users" SET "emailEncrypted" = :encrypted WHERE id = :id',
              {
                replacements: { encrypted: emailEncrypted, id: user.id },
                transaction
              }
            );
            processedUsers++;

            if (processedUsers % 1000 === 0) {
              console.log(`Processed ${processedUsers} of ${totalUserCount} users`);
            }
          } catch (err) {
            console.error(`Failed to encrypt email for user ${user.id}:`, err);
            failedUsers.push({ id: user.id, email: user.email, error: err.message });
          }
        }
      }

      // Process UserConnections table
      console.log('Running encryption process for UserConnections table...');
      const [{ count: totalConnectionCount }] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "UserConnections" WHERE ("connectionUserId" IS NOT NULL AND "connectionUserIdEncrypted" IS NULL) OR ("connectionData" IS NOT NULL AND "connectionUserDataEncrypted" IS NULL)',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Total connections to process: ${totalConnectionCount}`);
      let processedConnections = 0;
      let failedConnections = [];

      while (processedConnections < totalConnectionCount) {
        const connections = await queryInterface.sequelize.query(
          'SELECT "userId", "connectionId", "connectionUserId", "connectionData" FROM "UserConnections" WHERE ("connectionUserId" IS NOT NULL AND "connectionUserIdEncrypted" IS NULL) OR ("connectionData" IS NOT NULL AND "connectionUserDataEncrypted" IS NULL) LIMIT :limit',
          {
            replacements: { limit: BATCH_SIZE },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        if (connections.length === 0) break;

        for (const conn of connections) {
          try {
            const updates = [];
            const replacements = { userId: conn.userId, connectionId: conn.connectionId };

            if (conn.connectionUserId && !conn.connectionUserIdEncrypted) {
              updates.push('"connectionUserIdEncrypted" = :encryptedUserId');
              replacements.encryptedUserId = cryptoLib.privateEncrypt(conn.connectionUserId);
            }

            if (conn.connectionData && !conn.connectionUserDataEncrypted) {
              updates.push('"connectionUserDataEncrypted" = :encryptedData');
              replacements.encryptedData = cryptoLib.privateEncrypt(JSON.stringify(conn.connectionData));
            }

            if (updates.length > 0) {
              await queryInterface.sequelize.query(
                `UPDATE "UserConnections" SET ${updates.join(', ')} WHERE "userId" = :userId AND "connectionId" = :connectionId`,
                {
                  replacements,
                  transaction
                }
              );
            }
            processedConnections++;

            if (processedConnections % 1000 === 0) {
              console.log(`Processed ${processedConnections} of ${totalConnectionCount} connections`);
            }
          } catch (err) {
            console.error(`Failed to encrypt connection for userId=${conn.userId}, connectionId=${conn.connectionId}:`, err);
            failedConnections.push({ userId: conn.userId, connectionId: conn.connectionId, error: err.message });
          }
        }
      }

      // Step 3: Verify encryption was successful by checking for NULL values
      const notEncryptedUsersCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) FROM "Users"
         WHERE "email" IS NOT NULL AND "emailEncrypted" IS NULL`,
        { transaction }
      );

      const notEncryptedConnectionsUserIdCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) FROM "UserConnections"
         WHERE "connectionUserId" IS NOT NULL AND "connectionUserIdEncrypted" IS NULL`,
        { transaction }
      );

      const notEncryptedConnectionsUserDataCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) FROM "UserConnections"
         WHERE "connectionData" IS NOT NULL AND "connectionUserDataEncrypted" IS NULL`,
        { transaction }
      );

      console.log('Verification Results:');
      console.log(`- Users with non-encrypted email: ${notEncryptedUsersCount[0][0].count}`);
      console.log(`- UserConnections with non-encrypted connectionUserId: ${notEncryptedConnectionsUserIdCount[0][0].count}`);
      console.log(`- UserConnections with non-encrypted connectionUserData: ${notEncryptedConnectionsUserDataCount[0][0].count}`);

      if (failedUsers.length > 0 || failedConnections.length > 0) {
        console.error('Encryption failures summary:');
        console.error(`Failed Users (${failedUsers.length}):`, failedUsers);
        console.error(`Failed Connections (${failedConnections.length}):`, failedConnections);
        throw new Error(`Failed to encrypt ${failedUsers.length} users and ${failedConnections.length} connections. Check logs for details.`);
      }

      if (
        Number(notEncryptedUsersCount[0][0].count) > 0 ||
        Number(notEncryptedConnectionsUserIdCount[0][0].count) > 0 ||
        Number(notEncryptedConnectionsUserDataCount[0][0].count) > 0
      ) {
        throw new Error('Not all records were encrypted successfully. Aborting migration.');
      }

      // Step 4: Rename original columns to _old and encrypted columns to original names
      console.log('Renaming columns for Users table...');

      // Check if email_old column already exists
      const emailOldExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'Users' AND column_name = 'email_old'`,
        { transaction }
      );

      if (!emailOldExists[0].length) {
        await queryInterface.renameColumn('Users', 'email', 'email_old', { transaction });
        await queryInterface.renameColumn('Users', 'emailEncrypted', 'email', { transaction });
      } else {
        console.log('Column email_old already exists, skipping rename operations for Users table');
      }

      // Repeat for UserConnections table
      console.log('Renaming columns for UserConnections table...');

      // Check if connectionUserId_old column already exists
      const connectionUserIdOldExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'UserConnections' AND column_name = 'connectionUserId_old'`,
        { transaction }
      );

      if (!connectionUserIdOldExists[0].length) {
        await queryInterface.renameColumn('UserConnections', 'connectionUserId', 'connectionUserId_old', { transaction });
        await queryInterface.renameColumn('UserConnections', 'connectionUserIdEncrypted', 'connectionUserId', { transaction });
      } else {
        console.log('Column connectionUserId_old already exists, skipping rename for this column');
      }

      // Check if connectionData_old column already exists
      const connectionDataOldExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'UserConnections' AND column_name = 'connectionData_old'`,
        { transaction }
      );

      if (!connectionDataOldExists[0].length) {
        await queryInterface.renameColumn('UserConnections', 'connectionData', 'connectionData_old', { transaction });
        await queryInterface.renameColumn('UserConnections', 'connectionUserDataEncrypted', 'connectionData', { transaction });
      } else {
        console.log('Column connectionData_old already exists, skipping rename for this column');
      }

      // Step 5: Set NOT NULL constraints on encrypted columns
      console.log('Setting NOT NULL constraints...');

      // First handle any potential NULL values in the email column
      console.log('Checking for NULL email values...');
      const [{ count: nullEmailCount }] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "Users" WHERE "email" IS NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (parseInt(nullEmailCount) > 0) {
        console.log(`Found ${nullEmailCount} users with NULL email. Setting empty string instead.`);
        // Set empty string for null emails - this will allow NOT NULL constraint to be set
        await queryInterface.sequelize.query(
          'UPDATE "Users" SET "email" = \'\' WHERE "email" IS NULL',
          { transaction }
        );
      }

      await queryInterface.changeColumn(
        'Users',
        'email',
        {
          type: Sequelize.TEXT,
          allowNull: false
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'UserConnections',
        'connectionUserId',
        {
          type: Sequelize.TEXT,
          allowNull: false
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'UserConnections',
        'connectionData',
        {
          type: Sequelize.TEXT,
          allowNull: true // This one should be nullable, as connectionData is optional
        },
        { transaction }
      );

      console.log('Migration completed successfully!');
      await transaction.commit();

      logger.info(`Migration completed successfully. Encrypted ${processedUsers} emails and ${processedConnections} connections.`);

      if (failedUsers.length > 0) {
        logger.warn(`Failed to encrypt ${failedUsers.length} emails.`);
      }

      if (failedConnections.length > 0) {
        logger.warn(`Failed to encrypt ${failedConnections.length} connection user IDs.`);
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Migration failed:', error.message);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Reverse all changes: rename columns back and drop the _old columns

      // Check if email_old column exists (to confirm we need to rollback)
      const emailOldExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'Users' AND column_name = 'email_old'`,
        { transaction }
      );

      if (emailOldExists[0].length) {
        // Rollback Users table changes
        await queryInterface.renameColumn('Users', 'email', 'emailEncrypted', { transaction });
        await queryInterface.renameColumn('Users', 'email_old', 'email', { transaction });

        // Drop encrypted column
        await queryInterface.removeColumn('Users', 'emailEncrypted', { transaction });
      }

      // Check if connectionUserId_old column exists
      const connectionUserIdOldExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'UserConnections' AND column_name = 'connectionUserId_old'`,
        { transaction }
      );

      if (connectionUserIdOldExists[0].length) {
        // Rollback UserConnections connectionUserId changes
        await queryInterface.renameColumn('UserConnections', 'connectionUserId', 'connectionUserIdEncrypted', { transaction });
        await queryInterface.renameColumn('UserConnections', 'connectionUserId_old', 'connectionUserId', { transaction });

        // Drop encrypted column
        await queryInterface.removeColumn('UserConnections', 'connectionUserIdEncrypted', { transaction });
      }

      // Check if connectionData_old column exists
      const connectionDataOldExists = await queryInterface.sequelize.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'UserConnections' AND column_name = 'connectionData_old'`,
        { transaction }
      );

      if (connectionDataOldExists[0].length) {
        // Rollback UserConnections connectionData changes
        await queryInterface.renameColumn('UserConnections', 'connectionData', 'connectionUserDataEncrypted', { transaction });
        await queryInterface.renameColumn('UserConnections', 'connectionData_old', 'connectionData', { transaction });

        // Drop encrypted column
        await queryInterface.removeColumn('UserConnections', 'connectionUserDataEncrypted', { transaction });
      }

      console.log('Rollback completed successfully!');
      await transaction.commit();

      logger.info('Rollback completed successfully.');

      return Promise.resolve();
    } catch (error) {
      console.error('Rollback failed:', error.message);
      await transaction.rollback();
      throw error;
    }
  }
};
