'use strict';

const assert = require('assert').strict;
const path = require('path');

/**
 * @see https://github.com/citizenos/citizenos-api/issues/234#issuecomment-1054482521
 */

module.exports = {
    async up (queryInterface) {
        let runMigration = true;
        let uniqueUsersMigrated = 0;
        let totalUsersMarkedAsDeleted = 0;

        while (runMigration) {
            await queryInterface.sequelize.transaction(async function (t) {
                // Find a User in DB with duplicate e-mails
                const [[userToMigrate]] = await queryInterface.sequelize.query(
                    `
                        SELECT
                            LOWER(u.email) as email,
                            COUNT(u.email) as "countUsers"
                        FROM "Users" u
                        WHERE u.email IS NOT NULL
                          AND u."deletedAt" IS NULL
                        GROUP BY 1
                        HAVING COUNT(u.email) > 1
                        ORDER BY 2 DESC
                        LIMIT 1
                    `,
                    {
                        transaction: t
                    }
                );

                if (!userToMigrate) {
                    runMigration = false;

                    console.log('MIGRATION COMPLETE!');
                    console.log('Unique Users migrated', uniqueUsersMigrated);
                    console.log('Total Users marked as deleted', totalUsersMarkedAsDeleted);

                    return;
                }

                // Find Users alternative accounts, order by the activity, so that we keep the account with highest activity
                const [[userToKeep, ...usersToBeDeleted]] = await queryInterface.sequelize.query(
                    `
                        SELECT
                            u.id,
                            u.email,
                            u.name,
                            (
                                SELECT
                                    COUNT(1)
                                FROM "Activities" a
                                WHERE u.id::text = ANY(a."userIds") AND a.data::text ILIKE '%' || u.id || '%'
                            ) as "countActivities"
                        FROM "Users" u
                        WHERE LOWER(u.email) = LOWER(:email)
                          AND u."deletedAt" IS NULL
                        ORDER BY "countActivities" DESC
                    `,
                    {
                        replacements: {
                            email: userToMigrate.email
                        },
                        transaction: t
                    }
                );

                assert.equal(usersToBeDeleted.length, userToMigrate.countUsers - 1, 'MUST NOT delete all User accounts. MUST keep 1 account. ROLLBACK!');

                for (let i = 0; i < usersToBeDeleted.length; i++) {
                    const userToBeMarkedAsDeleted = usersToBeDeleted[i];

                    const userMarkAsDeleteResult = await queryInterface.sequelize.query(
                        `
                        UPDATE "Users" SET
                            email = (email || '__migrated_${i}'),
                            "updatedAt" = NOW(),
                            "deletedAt" = NOW()
                        WHERE id = :userToBeDeletedId
                        RETURNING id
                        `,
                        {
                            replacements: {
                                userToBeDeletedId: userToBeMarkedAsDeleted.id
                            },
                            transaction: t
                        }
                    );

                    assert.equal(userMarkAsDeleteResult[0].length, 1, `Must update only one row in Users table for User ${userToBeMarkedAsDeleted.id} BUT updated ${userMarkAsDeleteResult[0].length}. ROLLBACK!`);

                    const activityData = `
                        {
                            "type": "Delete",
                            "actor": {
                                "type": "System"
                            },
                            "object": {
                                "@type": "User",
                                "id": "${userToBeMarkedAsDeleted.id}",
                                "name": "${userToBeMarkedAsDeleted.name}",
                                "email": "${userToBeMarkedAsDeleted.email}"
                            },
                            "context": "Migration ${path.basename(__filename)}",
                            "__migratedAt": "___MIGRATION_TIMESTAMP",
                            "__migrationId": "${path.basename(__filename)}"
                        }
                    `;

                    const [, insertActivityCount] = await queryInterface.sequelize.query(
                        `
                        INSERT INTO "Activities" (
                            id, 
                            data,
                            "userIds",
                            "actorType", 
                            "createdAt",
                            "updatedAt"
                        ) VALUES (
                            gen_random_uuid(),
                            replace(
                                :activityData, 
                                '___MIGRATION_TIMESTAMP'
                                , NOW()::text
                            )::jsonb,
                            ARRAY[:userToBeDeletedId],
                            'System',
                            NOW(),
                            NOW()
                        )
                        RETURNING *
                        `,
                        {
                            replacements: {
                                activityData: activityData,
                                userToBeDeletedId: userToBeMarkedAsDeleted.id
                            },
                            transaction: t
                        }
                    );

                    assert.equal(insertActivityCount, 1, `Must add only one row in Activity table for User ${userToBeMarkedAsDeleted.id} BUT inserted  ${insertActivityCount}. ROLLBACK!`);

                    totalUsersMarkedAsDeleted++;
                }

                // In case most active account had cApS in it, update it to lowercase
                const [userToKeepEmailUpdateResult] = await queryInterface.sequelize.query(
                    `
                        UPDATE "Users" SET
                            email = LOWER(email),
                            "updatedAt" = NOW()
                        WHERE id = :userToMigrate
                        RETURNING id, email
                    `,
                    {
                        replacements: {
                            userToMigrate: userToKeep.id
                        },
                        transaction: t
                    }
                );

                assert.equal(userToKeepEmailUpdateResult.length, 1);
                assert.equal(userToKeepEmailUpdateResult[0].id, userToKeep.id);

                console.log('User migrated', userToKeepEmailUpdateResult[0].id, userToKeepEmailUpdateResult[0].email);

                uniqueUsersMigrated++;
            });
        }
    },

    async down () {
        console.log('NO ROLLBACK FOR THIS MIGRATION.');
    }
};
