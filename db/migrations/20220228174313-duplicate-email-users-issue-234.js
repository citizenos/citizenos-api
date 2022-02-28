'use strict';

// module.exports = {
//     async up (queryInterface, Sequelize) {
//         while (1) {
//             // Find a User in DB with duplicate e-mails
//             const queryUser = `
//                 SELECT
//                     LOWER(u.email) as email,
//                     COUNT(u.email) as "countUsers"
//                 FROM "Users" u
//                 WHERE u.email IS NOT NULL
//                   AND u."deletedAt" IS NULL
//                 GROUP BY 1
//                 HAVING COUNT(u.email) > 1
//                 ORDER BY 2 DESC
//                 LIMIT 1
//             `;
//
//             const userEmail = 'x@x.com'; // FIXME: Results from above query
//
//             // Find Users to mark to be deleted
//             //NOTE: There is OFFSET 1 in the query, to skip the most used account in the results
//             const queryUsersToMarkDeleted = `
//                 SELECT
//                     u.id,
//                     u.email,
//                     (
//                         SELECT
//                             COUNT(1)
//                         FROM "Activities" a
//                         WHERE u.id::text = ANY(a."userIds") AND a.data::text ILIKE '%' || u.id || '%'
//                     ) as "countActivities"
//                 FROM "Users" u
//                 WHERE LOWER(u.email) = LOWER('${userEmail}')
//                     AND u."deletedAt" IS NULL
//                 ORDER BY "countActivities" DESC
//                 OFFSET 1
//             `;
//
//             // Mark Users to be deleted by setting the "deletedAt"
//             // FIXME
//
//             // Create delete activity
//             // FIXME - Activity
//             // FIXME - migration timestamp
//             const activityData = `
//                 {
//                     "type": "Delete",
//                     "actor": {
//                         "type": "System"
//                     },
//                     "object": {
//                         "@type": "User",
//                         "id": "a6ca7802-2eae-4950-a8d6-a6f4e665ca57",
//                         "name": "XName",
//                         "email": null,
//                         "company": null,
//                         "imageUrl": null,
//                         "language": "en"
//                     },
//                     "context": "Migration ${path.basename(__filename)}",
//                     "__migratedAt": ":MIGRATION_TIMESTAMP",
//                     "__migrationId": "${path.basename(__filename)}"
//                 }
//             `;
//
//         }
//     },
//
//     async down (queryInterface, Sequelize) {
//         console.log('NO ROLLBACK FOR THIS MIGRATION.');
//     }
// };
