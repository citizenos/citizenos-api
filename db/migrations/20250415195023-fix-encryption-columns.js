'use strict';
const config = require('config');
const cryptoLib = require('../../libs/crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Starting to fix encryption columns...');

      // Verify encryption key is configured
      if (!config.get('db.privateKey')) {
        throw new Error('Encryption key is not set in configuration (db.privateKey)');
      }

      // Step 1: Check the current state of the tables
      // For Users table
      const usersColumns = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'Users'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const userColumnsMap = {};
      usersColumns.forEach(col => userColumnsMap[col.column_name] = true);

      // For UserConnections table
      const userConnectionsColumns = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'UserConnections'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const userConnectionsColumnsMap = {};
      userConnectionsColumns.forEach(col => userConnectionsColumnsMap[col.column_name] = true);

      console.log('Current state detected:');
      console.log('Users columns:', Object.keys(userColumnsMap).filter(col => col.includes('email')));
      console.log('UserConnections columns:', Object.keys(userConnectionsColumnsMap).filter(col => col.includes('connection')));

      // Step 2: Fix Users table
      if (userColumnsMap.email && userColumnsMap.emailEncrypted) {
        console.log('Both email and emailEncrypted columns exist in Users table');

        // Check if data needs to be encrypted
        const [{ count: notEncryptedCount }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "Users" WHERE "email" IS NOT NULL AND "emailEncrypted" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (parseInt(notEncryptedCount) > 0) {
          console.log(`Encrypting ${notEncryptedCount} user emails...`);

          const BATCH_SIZE = 1000;
          let processedUsers = 0;
          let failedUsers = [];

          while (processedUsers < parseInt(notEncryptedCount)) {
            const users = await queryInterface.sequelize.query(
              `SELECT id, email FROM "Users" WHERE "email" IS NOT NULL AND "emailEncrypted" IS NULL LIMIT :limit`,
              {
                replacements: { limit: BATCH_SIZE },
                type: Sequelize.QueryTypes.SELECT,
                transaction
              }
            );

            if (users.length === 0) break;

            for (const user of users) {
              try {
                const encrypted = cryptoLib.privateEncrypt(user.email);
                await queryInterface.sequelize.query(
                  `UPDATE "Users" SET "emailEncrypted" = :encrypted WHERE id = :id`,
                  {
                    replacements: { encrypted, id: user.id },
                    transaction
                  }
                );
                processedUsers++;

                if (processedUsers % 1000 === 0) {
                  console.log(`Processed ${processedUsers} user emails`);
                }
              } catch (err) {
                console.error(`Failed to encrypt email for user ${user.id}:`, err);
                failedUsers.push({ id: user.id, error: err.message });
              }
            }
          }

          if (failedUsers.length > 0) {
            console.error(`Failed to encrypt ${failedUsers.length} users`);
            throw new Error(`Failed to encrypt ${failedUsers.length} users. Aborting.`);
          }
        } else {
          console.log('All user emails are already encrypted');
        }

        // Rename columns if they haven't been renamed yet
        if (!userColumnsMap.email_old) {
          console.log('Renaming email columns in Users table...');
          await queryInterface.renameColumn('Users', 'email', 'email_old', { transaction });
          await queryInterface.renameColumn('Users', 'emailEncrypted', 'email', { transaction });

          // Set constraints
          await queryInterface.changeColumn('Users', 'email', {
            type: Sequelize.TEXT,
            allowNull: false
          }, { transaction });
        } else {
          console.log('Email columns have already been renamed');
        }
      }

      // Step 3: Fix UserConnections table
      if (userConnectionsColumnsMap.connectionUserId && userConnectionsColumnsMap.connectionUserIdEncrypted) {
        console.log('Both connectionUserId and connectionUserIdEncrypted columns exist in UserConnections table');

        // Check if data needs to be encrypted
        const [{ count: notEncryptedUserIdCount }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "UserConnections" WHERE "connectionUserId" IS NOT NULL AND "connectionUserIdEncrypted" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (parseInt(notEncryptedUserIdCount) > 0) {
          console.log(`Encrypting ${notEncryptedUserIdCount} connection user IDs...`);

          const BATCH_SIZE = 1000;
          let processedConnections = 0;
          let failedConnections = [];

          while (processedConnections < parseInt(notEncryptedUserIdCount)) {
            const connections = await queryInterface.sequelize.query(
              `SELECT "userId", "connectionId", "connectionUserId" FROM "UserConnections"
               WHERE "connectionUserId" IS NOT NULL AND "connectionUserIdEncrypted" IS NULL LIMIT :limit`,
              {
                replacements: { limit: BATCH_SIZE },
                type: Sequelize.QueryTypes.SELECT,
                transaction
              }
            );

            if (connections.length === 0) break;

            for (const conn of connections) {
              try {
                const encrypted = cryptoLib.privateEncrypt(conn.connectionUserId);
                await queryInterface.sequelize.query(
                  `UPDATE "UserConnections" SET "connectionUserIdEncrypted" = :encrypted
                   WHERE "userId" = :userId AND "connectionId" = :connectionId`,
                  {
                    replacements: {
                      encrypted,
                      userId: conn.userId,
                      connectionId: conn.connectionId
                    },
                    transaction
                  }
                );
                processedConnections++;

                if (processedConnections % 1000 === 0) {
                  console.log(`Processed ${processedConnections} connection user IDs`);
                }
              } catch (err) {
                console.error(`Failed to encrypt connectionUserId for connection ${conn.userId}/${conn.connectionId}:`, err);
                failedConnections.push({ userId: conn.userId, connectionId: conn.connectionId, error: err.message });
              }
            }
          }

          if (failedConnections.length > 0) {
            console.error(`Failed to encrypt ${failedConnections.length} connections`);
            throw new Error(`Failed to encrypt ${failedConnections.length} connections. Aborting.`);
          }
        } else {
          console.log('All connection user IDs are already encrypted');
        }

        // Fix connectionData if needed
        if (userConnectionsColumnsMap.connectionData && userConnectionsColumnsMap.connectionUserDataEncrypted) {
          const [{ count: notEncryptedDataCount }] = await queryInterface.sequelize.query(
            `SELECT COUNT(*) as count FROM "UserConnections" WHERE "connectionData" IS NOT NULL AND "connectionUserDataEncrypted" IS NULL`,
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );

          if (parseInt(notEncryptedDataCount) > 0) {
            console.log(`Encrypting ${notEncryptedDataCount} connection data...`);

            const BATCH_SIZE = 1000;
            let processedConnections = 0;
            let failedConnections = [];

            while (processedConnections < parseInt(notEncryptedDataCount)) {
              const connections = await queryInterface.sequelize.query(
                `SELECT "userId", "connectionId", "connectionData" FROM "UserConnections"
                 WHERE "connectionData" IS NOT NULL AND "connectionUserDataEncrypted" IS NULL LIMIT :limit`,
                {
                  replacements: { limit: BATCH_SIZE },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              );

              if (connections.length === 0) break;

              for (const conn of connections) {
                try {
                  const encrypted = cryptoLib.privateEncrypt(JSON.stringify(conn.connectionData));
                  await queryInterface.sequelize.query(
                    `UPDATE "UserConnections" SET "connectionUserDataEncrypted" = :encrypted
                     WHERE "userId" = :userId AND "connectionId" = :connectionId`,
                    {
                      replacements: {
                        encrypted,
                        userId: conn.userId,
                        connectionId: conn.connectionId
                      },
                      transaction
                    }
                  );
                  processedConnections++;

                  if (processedConnections % 1000 === 0) {
                    console.log(`Processed ${processedConnections} connection data`);
                  }
                } catch (err) {
                  console.error(`Failed to encrypt connectionData for connection ${conn.userId}/${conn.connectionId}:`, err);
                  failedConnections.push({ userId: conn.userId, connectionId: conn.connectionId, error: err.message });
                }
              }
            }

            if (failedConnections.length > 0) {
              console.error(`Failed to encrypt ${failedConnections.length} connection data`);
              throw new Error(`Failed to encrypt ${failedConnections.length} connection data. Aborting.`);
            }
          } else {
            console.log('All connection data is already encrypted');
          }
        } else if (userConnectionsColumnsMap.connectionData && !userConnectionsColumnsMap.connectionUserDataEncrypted) {
          console.log('Adding connectionUserDataEncrypted column...');
          await queryInterface.addColumn('UserConnections', 'connectionUserDataEncrypted', {
            type: Sequelize.TEXT,
            allowNull: true
          }, { transaction });

          // Encrypt the data
          const [{ count: totalDataCount }] = await queryInterface.sequelize.query(
            `SELECT COUNT(*) as count FROM "UserConnections" WHERE "connectionData" IS NOT NULL`,
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );

          if (parseInt(totalDataCount) > 0) {
            console.log(`Encrypting ${totalDataCount} connection data...`);

            const BATCH_SIZE = 1000;
            let processedConnections = 0;
            let failedConnections = [];

            while (processedConnections < parseInt(totalDataCount)) {
              const connections = await queryInterface.sequelize.query(
                `SELECT "userId", "connectionId", "connectionData" FROM "UserConnections"
                 WHERE "connectionData" IS NOT NULL LIMIT :limit OFFSET :offset`,
                {
                  replacements: { limit: BATCH_SIZE, offset: processedConnections },
                  type: Sequelize.QueryTypes.SELECT,
                  transaction
                }
              );

              if (connections.length === 0) break;

              for (const conn of connections) {
                try {
                  const encrypted = cryptoLib.privateEncrypt(JSON.stringify(conn.connectionData));
                  await queryInterface.sequelize.query(
                    `UPDATE "UserConnections" SET "connectionUserDataEncrypted" = :encrypted
                     WHERE "userId" = :userId AND "connectionId" = :connectionId`,
                    {
                      replacements: {
                        encrypted,
                        userId: conn.userId,
                        connectionId: conn.connectionId
                      },
                      transaction
                    }
                  );
                } catch (err) {
                  console.error(`Failed to encrypt connectionData for connection ${conn.userId}/${conn.connectionId}:`, err);
                  failedConnections.push({ userId: conn.userId, connectionId: conn.connectionId, error: err.message });
                }
              }

              processedConnections += connections.length;
              console.log(`Processed ${processedConnections} of ${totalDataCount} connection data`);
            }

            if (failedConnections.length > 0) {
              console.error(`Failed to encrypt ${failedConnections.length} connection data`);
              throw new Error(`Failed to encrypt ${failedConnections.length} connection data. Aborting.`);
            }
          }
        }

        // Rename columns if needed
        const needsRenaming = !userConnectionsColumnsMap.connectionUserId_old;
        if (needsRenaming) {
          console.log('Renaming columns in UserConnections table...');

          // Rename connectionUserId to connectionUserId_old and connectionUserIdEncrypted to connectionUserId
          await queryInterface.renameColumn('UserConnections', 'connectionUserId', 'connectionUserId_old', { transaction });
          await queryInterface.renameColumn('UserConnections', 'connectionUserIdEncrypted', 'connectionUserId', { transaction });

          // If connectionData column exists and connectionUserDataEncrypted exists
          if (userConnectionsColumnsMap.connectionData && userConnectionsColumnsMap.connectionUserDataEncrypted) {
            // Rename connectionData to connectionData_old and connectionUserDataEncrypted to connectionData
            await queryInterface.renameColumn('UserConnections', 'connectionData', 'connectionData_old', { transaction });
            await queryInterface.renameColumn('UserConnections', 'connectionUserDataEncrypted', 'connectionData', { transaction });
          }

          // Set constraints
          await queryInterface.changeColumn('UserConnections', 'connectionUserId', {
            type: Sequelize.TEXT,
            allowNull: false
          }, { transaction });

          if (userConnectionsColumnsMap.connectionUserDataEncrypted) {
            await queryInterface.changeColumn('UserConnections', 'connectionData', {
              type: Sequelize.TEXT,
              allowNull: true
            }, { transaction });
          }
        } else {
          console.log('UserConnections columns have already been renamed');
        }
      }

      // Step 4: Clean up any inconsistencies

      // Check if we need to handle special case with connectionUserId_encrypted (notice the underscore)
      if (userConnectionsColumnsMap.connectionUserId_encrypted) {
        console.log('Detected legacy column "connectionUserId_encrypted", handling special case...');

        // Check if there's data in this column that isn't in connectionUserId
        const [{ count: legacyDataCount }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "UserConnections"
           WHERE "connectionUserId_encrypted" IS NOT NULL AND "connectionUserId" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (parseInt(legacyDataCount) > 0) {
          console.log(`Copying ${legacyDataCount} legacy encrypted values...`);
          await queryInterface.sequelize.query(
            `UPDATE "UserConnections" SET "connectionUserId" = "connectionUserId_encrypted"
             WHERE "connectionUserId_encrypted" IS NOT NULL AND "connectionUserId" IS NULL`,
            { transaction }
          );
        }

        // Check if we can drop this column
        const [{ count: allMigratedCount }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "UserConnections"
           WHERE "connectionUserId_encrypted" IS NOT NULL AND "connectionUserId" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (parseInt(allMigratedCount) === 0) {
          console.log('All data migrated from legacy column, dropping it...');
          await queryInterface.removeColumn('UserConnections', 'connectionUserId_encrypted', { transaction });
        } else {
          console.warn(`Warning: ${allMigratedCount} rows still have data in legacy column only`);
        }
      }

      // Clean up old columns if possible
      if (userColumnsMap.email_old) {
        // Check if we can drop email_old
        const [{ count: usersWithOldEmail }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "Users" WHERE "email_old" IS NOT NULL AND "email" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (parseInt(usersWithOldEmail) === 0) {
          console.log('All user emails migrated, dropping email_old column...');
          await queryInterface.removeColumn('Users', 'email_old', { transaction });
        } else {
          console.warn(`Warning: ${usersWithOldEmail} users still have data in old column only`);
        }
      }

      // Similar for UserConnections
      if (userConnectionsColumnsMap.connectionUserId_old) {
        const [{ count: connectionsWithOldId }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "UserConnections"
           WHERE "connectionUserId_old" IS NOT NULL AND "connectionUserId" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (parseInt(connectionsWithOldId) === 0) {
          console.log('All connectionUserIds migrated, dropping connectionUserId_old column...');
          await queryInterface.removeColumn('UserConnections', 'connectionUserId_old', { transaction });
        } else {
          console.warn(`Warning: ${connectionsWithOldId} connections still have data in old column only`);
        }
      }

      if (userConnectionsColumnsMap.connectionData_old) {
        const [{ count: connectionsWithOldData }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "UserConnections"
           WHERE "connectionData_old" IS NOT NULL AND "connectionData" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        if (parseInt(connectionsWithOldData) === 0) {
          console.log('All connectionData migrated, dropping connectionData_old column...');
          await queryInterface.removeColumn('UserConnections', 'connectionData_old', { transaction });
        } else {
          console.warn(`Warning: ${connectionsWithOldData} connections still have data in old column only`);
        }
      }

      console.log('Migration completed successfully!');
      await transaction.commit();
    } catch (error) {
      console.error('Migration failed:', error.message);
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Rolling back encryption changes...');

      // Check current state
      const usersColumns = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'Users'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const userColumnsMap = {};
      usersColumns.forEach(col => userColumnsMap[col.column_name] = true);

      const userConnectionsColumns = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'UserConnections'`,
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const userConnectionsColumnsMap = {};
      userConnectionsColumns.forEach(col => userConnectionsColumnsMap[col.column_name] = true);

      // Handle Users table rollback
      if (userColumnsMap.email && !userColumnsMap.email_old) {
        // Add back email_old column
        await queryInterface.addColumn('Users', 'email_old', {
          type: Sequelize.STRING(254),
          allowNull: true
        }, { transaction });

        // Decrypt data
        console.log('Decrypting user emails...');
        const BATCH_SIZE = 1000;
        const [{ count: totalUserCount }] = await queryInterface.sequelize.query(
          'SELECT COUNT(*) as count FROM "Users" WHERE email IS NOT NULL',
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        let processedUsers = 0;
        while (processedUsers < parseInt(totalUserCount)) {
          const users = await queryInterface.sequelize.query(
            'SELECT id, email FROM "Users" WHERE email IS NOT NULL LIMIT :limit OFFSET :offset',
            {
              replacements: { limit: BATCH_SIZE, offset: processedUsers },
              type: Sequelize.QueryTypes.SELECT,
              transaction
            }
          );

          if (users.length === 0) break;

          for (const user of users) {
            try {
              if (user.email) {
                const decrypted = cryptoLib.privateDecrypt(user.email);
                await queryInterface.sequelize.query(
                  'UPDATE "Users" SET email_old = :decrypted WHERE id = :id',
                  {
                    replacements: { decrypted, id: user.id },
                    transaction
                  }
                );
              }
            } catch (err) {
              console.error(`Failed to decrypt email for user ${user.id}:`, err);
            }
          }

          processedUsers += users.length;
          console.log(`Decrypted ${processedUsers} of ${totalUserCount} users`);
        }

        // Rename columns back
        await queryInterface.renameColumn('Users', 'email', 'emailEncrypted', { transaction });
        await queryInterface.renameColumn('Users', 'email_old', 'email', { transaction });
      }

      // Handle UserConnections table rollback
      if (userConnectionsColumnsMap.connectionUserId && !userConnectionsColumnsMap.connectionUserId_old) {
        // Add back connectionUserId_old column
        await queryInterface.addColumn('UserConnections', 'connectionUserId_old', {
          type: Sequelize.STRING(255),
          allowNull: true
        }, { transaction });

        // Decrypt data
        console.log('Decrypting connection user IDs...');
        const BATCH_SIZE = 1000;
        const [{ count: totalConnectionCount }] = await queryInterface.sequelize.query(
          'SELECT COUNT(*) as count FROM "UserConnections" WHERE "connectionUserId" IS NOT NULL',
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        let processedConnections = 0;
        while (processedConnections < parseInt(totalConnectionCount)) {
          const connections = await queryInterface.sequelize.query(
            'SELECT "userId", "connectionId", "connectionUserId" FROM "UserConnections" WHERE "connectionUserId" IS NOT NULL LIMIT :limit OFFSET :offset',
            {
              replacements: { limit: BATCH_SIZE, offset: processedConnections },
              type: Sequelize.QueryTypes.SELECT,
              transaction
            }
          );

          if (connections.length === 0) break;

          for (const conn of connections) {
            try {
              if (conn.connectionUserId) {
                const decrypted = cryptoLib.privateDecrypt(conn.connectionUserId);
                await queryInterface.sequelize.query(
                  'UPDATE "UserConnections" SET "connectionUserId_old" = :decrypted WHERE "userId" = :userId AND "connectionId" = :connectionId',
                  {
                    replacements: {
                      decrypted,
                      userId: conn.userId,
                      connectionId: conn.connectionId
                    },
                    transaction
                  }
                );
              }
            } catch (err) {
              console.error(`Failed to decrypt connectionUserId for connection ${conn.userId}/${conn.connectionId}:`, err);
            }
          }

          processedConnections += connections.length;
          console.log(`Decrypted ${processedConnections} of ${totalConnectionCount} connections`);
        }

        // Handle connectionData if it exists and appears to be encrypted
        if (userConnectionsColumnsMap.connectionData && !userConnectionsColumnsMap.connectionData_old) {
          await queryInterface.addColumn('UserConnections', 'connectionData_old', {
            type: Sequelize.JSONB,
            allowNull: true
          }, { transaction });

          console.log('Decrypting connection data...');
          const [{ count: totalDataCount }] = await queryInterface.sequelize.query(
            'SELECT COUNT(*) as count FROM "UserConnections" WHERE "connectionData" IS NOT NULL',
            { type: Sequelize.QueryTypes.SELECT, transaction }
          );

          let processedData = 0;
          while (processedData < parseInt(totalDataCount)) {
            const connections = await queryInterface.sequelize.query(
              'SELECT "userId", "connectionId", "connectionData" FROM "UserConnections" WHERE "connectionData" IS NOT NULL LIMIT :limit OFFSET :offset',
              {
                replacements: { limit: BATCH_SIZE, offset: processedData },
                type: Sequelize.QueryTypes.SELECT,
                transaction
              }
            );

            if (connections.length === 0) break;

            for (const conn of connections) {
              try {
                if (conn.connectionData) {
                  const decryptedDataRaw = cryptoLib.privateDecrypt(conn.connectionData);
                  if (decryptedDataRaw) {
                    try {
                      const decryptedData = JSON.parse(decryptedDataRaw);
                      await queryInterface.sequelize.query(
                        'UPDATE "UserConnections" SET "connectionData_old" = :decryptedData WHERE "userId" = :userId AND "connectionId" = :connectionId',
                        {
                          replacements: {
                            decryptedData,
                            userId: conn.userId,
                            connectionId: conn.connectionId
                          },
                          transaction
                        }
                      );
                    } catch (jsonErr) {
                      console.error('Failed to parse decrypted JSON:', jsonErr);
                    }
                  }
                }
              } catch (err) {
                console.error(`Failed to decrypt connectionData for connection ${conn.userId}/${conn.connectionId}:`, err);
              }
            }

            processedData += connections.length;
            console.log(`Decrypted ${processedData} of ${totalDataCount} connection data`);
          }

          // Rename columns
          await queryInterface.renameColumn('UserConnections', 'connectionData', 'connectionUserDataEncrypted', { transaction });
          await queryInterface.renameColumn('UserConnections', 'connectionData_old', 'connectionData', { transaction });
        }

        // Rename connectionUserId columns back
        await queryInterface.renameColumn('UserConnections', 'connectionUserId', 'connectionUserIdEncrypted', { transaction });
        await queryInterface.renameColumn('UserConnections', 'connectionUserId_old', 'connectionUserId', { transaction });
      }

      console.log('Rollback completed successfully!');
      await transaction.commit();
    } catch (error) {
      console.error('Rollback failed:', error.message);
      await transaction.rollback();
      throw error;
    }
  }
};
