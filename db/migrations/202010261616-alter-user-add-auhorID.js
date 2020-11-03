'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.addColumn('Users', 'authorId', {
                    type: Sequelize.STRING,
                    allowNull: true,
                    comment: 'Etherpad authorID for the user'
                }, { transaction: t }),
                queryInterface.addColumn('Topics', 'authorIds', {
                    type: Sequelize.ARRAY(Sequelize.UUID),
                    allowNull: true,
                    comment: 'Etherpad authorIDs for the topic'
                }, { transaction: t }),
                queryInterface.sequelize.query('DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema=\'public\' AND table_name=\'store\') THEN UPDATE "Users" u SET "authorId" = REPLACE(ua."authorId", \'"\', \'\') FROM (SELECT SPLIT_PART(key, \':\',2) AS "userId", value AS "authorId" FROM "store" WHERE key ILIKE \'mapper2author:%\') ua WHERE ua."userId"=u.id::text; END IF; END $$ ;', {transaction: t})
                    .then(function (res) {
                        console.log(`Updated ${res[1].rowCount} Users!`);

                        return Promise.resolve();
                    }),
                queryInterface.sequelize.query('UPDATE "Topics" SET "authorIds" = ARRAY["creatorId"];', {transaction: t})
                    .then(function (res) {
                        console.log(`Updated ${res[1].rowCount} Topics!`);

                        return Promise.resolve();
                    }),
            ])
        })
    },

    down: (queryInterface) => {
        return queryInterface.sequelize.transaction((t) => {
            return Promise.all([
                queryInterface.removeColumn('Users', 'authorId', { transaction: t }),
                queryInterface.removeColumn('Topics', 'authorIds', { transaction: t })
            ])
        })
    }
};