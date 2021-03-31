'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('VoteUserContainers', 'PID', {
                    type: Sequelize.TEXT,
                    comment: 'User personal ID'
                }, { transaction: t }),
                queryInterface.sequelize.query(`UPDATE "VoteUserContainers" vuc SET "PID" = vuc."userId"::text WHERE vuc."userId" IS NOT NULL;`, {transaction: t}),
                queryInterface.sequelize.query(`UPDATE "VoteUserContainers" vuc SET "PID" = uc."connectionUserId"::text FROM "UserConnections" uc WHERE uc."userId"::text = vuc."userId"::text AND uc."connectionId" = 'esteid';`, {transaction: t}),
                queryInterface.sequelize.query(`DELETE FROM "VoteUserContainers" a USING (SELECT "voteId", "PID", MAX("createdAt") as "createdAt" FROM "VoteUserContainers" GROUP BY "voteId", "PID") b WHERE a."voteId" = b."voteId" AND a."PID" = b."PID" AND a."createdAt" < b."createdAt";`, {transaction: t}),
                queryInterface.changeColumn('VoteUserContainers', 'PID', {
                    type: Sequelize.TEXT,
                    allowNull: false,
                }, {transaction: t}),
                queryInterface.removeConstraint('VoteUserContainers','VoteUserContainers_pkey', {transaction: t}),
                queryInterface.addConstraint('VoteUserContainers',{
                    fields: ['voteId', 'PID'],
                    type: 'primary key',
                    name: 'VoteUserContainers_pkey',
                    transaction: t
                })
            ])
        })
    },
    down: (queryInterface) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeConstraint('VoteUserContainers','VoteUserContainers_pkey', {transaction: t}),
                queryInterface.addConstraint('VoteUserContainers',{
                    fields: ['voteId', 'userId'],
                    type: 'primary key',
                    name: 'VoteUserContainers_pkey',
                    transaction: t
                }),
                queryInterface.removeColumn('VoteUserContainers', 'PID', { transaction: t })
            ])
        })
    }
};
