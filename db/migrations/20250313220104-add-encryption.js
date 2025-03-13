'use strict';
const config = require('config');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    if (!config.get('db.passphrase')) {
      throw new Error('Passphrase is not set');
    }

    const passphrase = config.get('db.passphrase');

    await queryInterface.sequelize.transaction(async (t) => {
      // First ensure pgcrypto extension is available
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;', { transaction: t });

      // Add new encrypted columns
      await queryInterface.addColumn('Users', 'emailEncrypted', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('UserConnections', 'connectionUserIdEncrypted', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('UserConnections', 'connectionUserDataEncrypted', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction: t });

      // Encrypt existing data
      await queryInterface.sequelize.query(`
        UPDATE "Users"
        SET "emailEncrypted" = pgp_sym_encrypt(email::text, :passphrase, 'cipher-algo=aes256')
        WHERE email IS NOT NULL;
      `, {
        replacements: { passphrase },
        transaction: t
      });

      await queryInterface.sequelize.query(`
        UPDATE "UserConnections"
        SET
          "connectionUserIdEncrypted" = pgp_sym_encrypt("connectionUserId"::text, :passphrase, 'cipher-algo=aes256'),
          "connectionUserDataEncrypted" = pgp_sym_encrypt("connectionData"::text, :passphrase, 'cipher-algo=aes256')
        WHERE "connectionUserId" IS NOT NULL OR "connectionData" IS NOT NULL;
      `, {
        replacements: { passphrase },
        transaction: t
      });

      // Verify data was encrypted successfully
      const [[{ count: usersCount }]] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM "Users"
        WHERE email IS NOT NULL AND "emailEncrypted" IS NULL;
      `, { transaction: t });

      const [[{ count: connectionsCount }]] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM "UserConnections"
        WHERE ("connectionUserId" IS NOT NULL AND "connectionUserIdEncrypted" IS NULL)
        OR ("connectionData" IS NOT NULL AND "connectionUserDataEncrypted" IS NULL);
      `, { transaction: t });

      if (usersCount > 0 || connectionsCount > 0) {
        throw new Error('Some records failed to encrypt');
      }

      // Rename columns to preserve the original names
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

  async down (queryInterface, Sequelize) {
    if (!config.get('db.passphrase')) {
      throw new Error('Passphrase is not set');
    }
    const passphrase = config.get('db.passphrase');

    await queryInterface.sequelize.transaction(async (t) => {
      // Add temporary columns for decrypted data
      await queryInterface.addColumn('Users', 'email_new', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('UserConnections', 'connectionUserId_new', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction: t });

      await queryInterface.addColumn('UserConnections', 'connectionData_new', {
        type: Sequelize.JSONB,
        allowNull: true
      }, { transaction: t });

      // Decrypt data
      await queryInterface.sequelize.query(`
        UPDATE "Users"
        SET email_new = pgp_sym_decrypt(email::bytea, :passphrase)::text
        WHERE email IS NOT NULL;
      `, {
        replacements: { passphrase },
        transaction: t
      });

      await queryInterface.sequelize.query(`
        UPDATE "UserConnections"
        SET
          connectionUserId_new = pgp_sym_decrypt("connectionUserId"::bytea, :passphrase)::text,
          connectionData_new = pgp_sym_decrypt("connectionData"::bytea, :passphrase)::jsonb
        WHERE "connectionUserId" IS NOT NULL OR "connectionData" IS NOT NULL;
      `, {
        replacements: { passphrase },
        transaction: t
      });

      // Rename columns back
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
