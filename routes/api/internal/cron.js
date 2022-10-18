const cron = require('node-cron');

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const Sequelize = require('sequelize');
    const Vote = models.Vote;
    const Topic = models.Topic;
    const emailLib = app.get('email');
    const moment = require('moment');

    const getTopicMembers = async (topicId) => {
        try {
            const users = await db
                .query(
                    `
                    SELECT
                      u.id,
                      u.name,
                      u.email,
                      u.language
                      FROM (
                          SELECT DISTINCT ON(id)
                              tm."memberId" as id,
                              tm."level",
                              t.id as "topicId",
                              u.name,
                              u.company,
                              u."imageUrl",
                              u.email
                          FROM "Topics" t
                          JOIN (
                              SELECT
                                  tmu."topicId",
                                  tmu."userId" AS "memberId",
                                  tmu."level"::text,
                                  1 as "priority"
                              FROM "TopicMemberUsers" tmu
                              WHERE tmu."deletedAt" IS NULL
                              UNION
                              SELECT
                                  tmg."topicId",
                                  gm."userId" AS "memberId",
                                  tmg."level"::text,
                                  2 as "priority"
                              FROM "TopicMemberGroups" tmg
                              LEFT JOIN "GroupMemberUsers" gm ON (tmg."groupId" = gm."groupId")
                              WHERE tmg."deletedAt" IS NULL
                              AND gm."deletedAt" IS NULL
                          ) AS tm ON (tm."topicId" = t.id)
                          JOIN "Users" u ON (u.id = tm."memberId")
                          WHERE t.id = :topicId
                          ORDER BY id, tm.priority, tm."level"::"enum_TopicMemberUsers_level" DESC
                      ) tm
                      LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm.id AND tmu."topicId" = :topicId)
                      LEFT JOIN (
                          SELECT gm."userId", tmg."groupId", tmg."topicId", tmg.level, g.name
                          FROM "GroupMemberUsers" gm
                          LEFT JOIN "TopicMemberGroups" tmg ON tmg."groupId" = gm."groupId"
                          LEFT JOIN "Groups" g ON g.id = tmg."groupId" AND g."deletedAt" IS NULL
                          WHERE gm."deletedAt" IS NULL
                          AND tmg."deletedAt" IS NULL
                      ) tmg ON tmg."topicId" = :topicId AND (tmg."userId" = tm.id)
                      JOIN "Users" u ON u.id = tm.id
                      GROUP BY tm.id, u.id, tm.level, tmu.level, tm.name, tm.company, tm."imageUrl", tm.email, tm."topicId"
                   ;`,
                    {
                        replacements: {
                            topicId: topicId
                        },
                        type: db.QueryTypes.SELECT,
                        raw: true,
                        nest: true
                    }
                );
            return users;
        } catch (err) {
            console.log(err);
        }
    };
    const sendVoteReminder = async function () {
        try {
            const votes = await Vote.findAll({
                where: {
                    reminderTime: {
                        [Sequelize.Op.lte]: new Date()
                    },
                    reminderSent: null
                },
                include: [Topic]
            });

            votes.forEach(async vote => {
                const users = await getTopicMembers(vote.Topics[0].id);
                emailLib.sendVoteReminder(users, vote, vote.Topics[0].id);
                vote.reminderSent = moment();
                vote.save();
            });
        } catch (err) {
            console.error('Cron error: ', err);
        }
    }
    cron.schedule('* * * * *', async () => {
        /* Send Vote reminder notifications*/
        sendVoteReminder();
    });

    app.get('/api/test', async (req, res) => {
        sendVoteReminder();
        res.ok();
    });
};