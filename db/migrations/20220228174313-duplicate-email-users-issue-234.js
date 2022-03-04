'use strict';

module.exports = {
    async up (queryInterface) {
        let runMigration = true;

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
                    console.log('NO more users to migrate!');
                    runMigration = false;
                    throw new Error('ROLLBACK! DONE!');
                }

                console.log('userToMigrate', userToMigrate);

                // Find Users alternative accounts, order by the activity, so that we keep the account with highest activity
                const [[userAccountToKeep, ...userAccountsToBeDeleted]] = await queryInterface.sequelize.query(
                    `
                        SELECT
                            u.id,
                            u.email,
                            u.name,
                            u.company,
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

                console.log('userAccounts', userAccountToKeep, userAccountsToBeDeleted);

                throw new Error('ROLLBACK!');
            });

            //
            //     // Mark Users to be deleted by setting the "deletedAt"
            //     // FIXME
            //
            //     // Create delete activity
            //     // FIXME - Activity
            //     // FIXME - migration timestamp
            //     const activityData = `
            //         {
            //             "type": "Delete",
            //             "actor": {
            //                 "type": "System"
            //             },
            //             "object": {
            //                 "@type": "User",
            //                 "id": "a6ca7802-2eae-4950-a8d6-a6f4e665ca57",
            //                 "name": "XName",
            //                 "email": null,
            //                 "company": null,
            //                 "imageUrl": null,
            //                 "language": "en"
            //             },
            //             "context": "Migration ${path.basename(__filename)}",
            //             "__migratedAt": ":MIGRATION_TIMESTAMP",
            //             "__migrationId": "${path.basename(__filename)}"
            //         }
            //     `;
            // }
        }
    },

    async down () {
        console.log('NO ROLLBACK FOR THIS MIGRATION.');
    }
};
