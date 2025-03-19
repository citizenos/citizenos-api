'use strict';
const config = require('config');
const cryptoLib = require('../../libs/crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!config.get('db.privateKey')) {
      throw new Error('Key is not set');
    }

    await queryInterface.sequelize.transaction(async (t) => {
      // First: Add new columns
      const columnAdditions = [
        ['Users', 'emailEncrypted', Sequelize.TEXT],
        ['UserConnections', 'connectionUserIdEncrypted', Sequelize.TEXT],
        ['UserConnections', 'connectionUserDataEncrypted', Sequelize.TEXT]
      ];

      for (const [table, column, type] of columnAdditions) {
        await queryInterface.addColumn(table, column, {
          type,
          allowNull: true
        }, { transaction: t });
      }

      // Second: Encrypt data in batches
      const BATCH_SIZE = 1000;
      let offset = 0;

      while (true) {
        const users = await queryInterface.sequelize.query(
          'SELECT id, email FROM "Users" WHERE email IS NOT NULL LIMIT :limit OFFSET :offset',
          {
            replacements: { limit: BATCH_SIZE, offset },
            type: Sequelize.QueryTypes.SELECT,
            transaction: t
          }
        );

        if (users.length === 0) break;
        await Promise.all(users.map(async (user) => {
          if (!user.email) return;
          try {
            const encrypted = cryptoLib.privateEncrypt(user.email);
            await queryInterface.sequelize.query(
              'UPDATE "Users" SET "emailEncrypted" = :encrypted WHERE id = :id',
              {
                replacements: { encrypted, id: user.id },
                transaction: t
              }
            );
          } catch (err) {
            throw new Error(`Failed to encrypt email for user ${user.id}: ${err.message}`);
          }
        }));

        offset += BATCH_SIZE;
      }

      const connections = await queryInterface.sequelize.query(
        'SELECT "userId", "connectionId", "connectionUserId", "connectionData" FROM "UserConnections" WHERE "connectionUserId" IS NOT NULL OR "connectionData" IS NOT NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );

      for (const conn of connections) {
        const updates = [];
        const replacements = { userId: conn.userId, connectionId: conn.connectionId };

        if (conn.connectionUserId) {
          updates.push('"connectionUserIdEncrypted" = :encryptedUserId');
          replacements.encryptedUserId = cryptoLib.privateEncrypt(conn.connectionUserId);
        }

        if (conn.connectionData) {
          updates.push('"connectionUserDataEncrypted" = :encryptedData');
          replacements.encryptedData = cryptoLib.privateEncrypt(JSON.stringify(conn.connectionData));
        }

        if (updates.length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE "UserConnections" SET ${updates.join(', ')} WHERE "userId" = :userId AND "connectionId" = :connectionId`,
            {
              replacements,
              transaction: t
            }
          );
        }
      }

      // Verify with counts before proceeding
      const verificationQueries = [
        ['Users', 'email', 'emailEncrypted'],
        ['UserConnections', 'connectionUserId', 'connectionUserIdEncrypted'],
        ['UserConnections', 'connectionData', 'connectionUserDataEncrypted']
      ];

      for (const [table, oldCol, newCol] of verificationQueries) {
        const [{ count }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "${table}" WHERE "${oldCol}" IS NOT NULL AND "${newCol}" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction: t }
        );

        if (parseInt(count) > 0) {
          throw new Error(`Encryption verification failed for ${table}.${oldCol}`);
        }
      }

      // Finally: Rename and cleanup columns
      await queryInterface.renameColumn('Users', 'email', 'email_old', { transaction: t });
      await queryInterface.renameColumn('Users', 'emailEncrypted', 'email', { transaction: t });

      await queryInterface.renameColumn('UserConnections', 'connectionUserId', 'connectionUserId_old', { transaction: t });
      await queryInterface.renameColumn('UserConnections', 'connectionUserIdEncrypted', 'connectionUserId', { transaction: t });

      await queryInterface.renameColumn('UserConnections', 'connectionData', 'connectionData_old', { transaction: t });
      await queryInterface.renameColumn('UserConnections', 'connectionUserDataEncrypted', 'connectionData', { transaction: t });

      // Drop old columns
      await queryInterface.removeColumn('Users', 'email_old', { transaction: t });
      await queryInterface.removeColumn('UserConnections', 'connectionUserId_old', { transaction: t });
      await queryInterface.removeColumn('UserConnections', 'connectionData_old', { transaction: t });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      // Add temporary columns with NOT NULL constraint removed
      const tempColumns = [
        ['Users', 'email_new', Sequelize.STRING],
        ['UserConnections', 'connectionUserId_new', Sequelize.STRING],
        ['UserConnections', 'connectionData_new', Sequelize.JSONB]
      ];

      for (const [table, column, type] of tempColumns) {
        await queryInterface.addColumn(table, column, {
          type,
          allowNull: true
        }, { transaction: t });
      }

      // Decrypt in batches with proper error handling
      const BATCH_SIZE = 1000;
      let offset = 0;

      while (true) {
        const users = await queryInterface.sequelize.query(
          'SELECT id, email FROM "Users" WHERE email IS NOT NULL LIMIT :limit OFFSET :offset',
          {
            replacements: { limit: BATCH_SIZE, offset },
            type: Sequelize.QueryTypes.SELECT,
            transaction: t
          }
        );

        if (users.length === 0) break;

        await Promise.all(users.map(async (user) => {
          if (!user.email) return;
          try {
            const decrypted = cryptoLib.privateDecrypt(user.email);
            if (decrypted) {
              await queryInterface.sequelize.query(
                'UPDATE "Users" SET email_new = :decrypted WHERE id = :id',
                {
                  replacements: { decrypted, id: user.id },
                  transaction: t
                }
              );
            }
          } catch (err) {
            console.error(`Failed to decrypt email for user ${user.id}:`, err);
          }
        }));

        offset += BATCH_SIZE;
      }

      const connections = await queryInterface.sequelize.query(
        'SELECT "userId", "connectionId", "connectionUserId", "connectionData" FROM "UserConnections" WHERE "connectionUserId" IS NOT NULL OR "connectionData" IS NOT NULL',
        { type: Sequelize.QueryTypes.SELECT, transaction: t }
      );
      for (const conn of connections) {
        const updates = [];
        const replacements = { userId: conn.userId, connectionId: conn.connectionId };

        if (conn.connectionUserId) {
          try {
            const decrypted = cryptoLib.privateDecrypt(conn.connectionUserId);
            if (decrypted) {
              updates.push('"connectionUserId_new" = :decryptedUserId');
              replacements.decryptedUserId = decrypted;
            }
          } catch (err) {
            console.error(`Failed to decrypt connectionUserId for connection ${conn.userId}/${conn.connectionId}:`, err);
          }
        }

        if (conn.connectionData) {
          try {
            const decrypted = cryptoLib.privateDecrypt(conn.connectionData);
            if (decrypted) {
              updates.push('"connectionData_new" = :decryptedData');
              replacements.decryptedData = decrypted;
            }
          } catch (err) {
            console.error(`Failed to decrypt connectionData for connection ${conn.userId}/${conn.connectionId}:`, err);
          }
        }
        if (updates.length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE "UserConnections" SET ${updates.join(', ')} WHERE "userId" = :userId AND "connectionId" = :connectionId`,
            {
              replacements,
              transaction: t
            }
          );
        }
      }

      // Verify decryption before dropping columns
      const verificationQueries = [
        ['Users', 'email', 'email_new'],
        ['UserConnections', 'connectionUserId', 'connectionUserId_new'],
        ['UserConnections', 'connectionData', 'connectionData_new']
      ];

      for (const [table, oldCol, newCol] of verificationQueries) {
        const [{ count }] = await queryInterface.sequelize.query(
          `SELECT COUNT(*) as count FROM "${table}" WHERE "${oldCol}" IS NOT NULL AND "${newCol}" IS NULL`,
          { type: Sequelize.QueryTypes.SELECT, transaction: t }
        );

        if (parseInt(count) > 0) {
          throw new Error(`Decryption verification failed for ${table}.${oldCol}`);
        }
      }

      // Rename and cleanup
      await queryInterface.renameColumn('Users', 'email', 'email_old', { transaction: t });
      await queryInterface.renameColumn('Users', 'email_new', 'email', { transaction: t });

      await queryInterface.renameColumn('UserConnections', 'connectionUserId', 'connectionUserId_old', { transaction: t });
      await queryInterface.renameColumn('UserConnections', 'connectionUserId_new', 'connectionUserId', { transaction: t });

      await queryInterface.renameColumn('UserConnections', 'connectionData', 'connectionData_old', { transaction: t });
      await queryInterface.renameColumn('UserConnections', 'connectionData_new', 'connectionData', { transaction: t });

      // Drop encrypted columns
      await queryInterface.removeColumn('Users', 'email_old', { transaction: t });
      await queryInterface.removeColumn('UserConnections', 'connectionUserId_old', { transaction: t });
      await queryInterface.removeColumn('UserConnections', 'connectionData_old', { transaction: t });
    });
  }
};
