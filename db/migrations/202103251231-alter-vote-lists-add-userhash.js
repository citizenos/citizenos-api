'use strict';
const config = require('config');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('VoteLists', 'userHash', {
                    type: Sequelize.STRING(64),
                    comment:  'Hash from users PID that allows filtering votes from different users, but same person'
                }, { transaction: t }),
                queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`, {transaction: t}),
                queryInterface.sequelize.query(`UPDATE "VoteLists" vlt SET "userHash" = encode(hmac(v.id || uc."connectionUserId", '${config.encryption.salt}', 'sha256'), 'hex') FROM "VoteLists" vl JOIN "Votes" v ON v.id = vl."voteId" AND v."authType" = 'hard' JOIN "UserConnections" uc ON uc."userId"::text = vl."userId"::text AND uc."connectionId" = 'esteid' WHERE vl."optionGroupId" = vlt."optionGroupId" AND vl."optionId" = vlt."optionId";`, {transaction: t})
            ])
        })
    },
    down: (queryInterface) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeColumn('VoteLists', 'userHash', { transaction: t })
            ])
        })
    }
};
