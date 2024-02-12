const cron = require('node-cron');

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const Sequelize = require('sequelize');
    const Vote = models.Vote;
    const TopicVote = models.TopicVote;
    const emailLib = app.get('email');
    const topicLib = require('../topic')(app);
    const moment = require('moment');

    const getTopicMembers = async (voteId) => {
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
                              tv."topicId" as "topicId",
                              u.name,
                              u.company,
                              u."imageUrl",
                              u.email
                          FROM "TopicVotes" tv
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
                          ) AS tm ON (tm."topicId" = tv."topicId")
                          JOIN "Users" u ON (u.id = tm."memberId")
                          WHERE tv."voteId" = :voteId
                          ORDER BY id, tm.priority, tm."level"::"enum_TopicMemberUsers_level" DESC
                      ) tm
                      JOIN "TopicVotes" tv ON tv."voteId"=:voteId
                      LEFT JOIN "TopicMemberUsers" tmu ON (tmu."userId" = tm.id AND tmu."topicId" = tv."topicId")
                      LEFT JOIN (
                          SELECT gm."userId", tmg."groupId", tmg."topicId", tmg.level, g.name
                          FROM "GroupMemberUsers" gm
                          LEFT JOIN "TopicMemberGroups" tmg ON tmg."groupId" = gm."groupId"
                          LEFT JOIN "Groups" g ON g.id = tmg."groupId" AND g."deletedAt" IS NULL
                          WHERE gm."deletedAt" IS NULL
                          AND tmg."deletedAt" IS NULL
                      ) tmg ON tmg."topicId" = tv."topicId" AND (tmg."userId" = tm.id)
                      JOIN "Users" u ON u.id = tm.id
                      GROUP BY tm.id, u.id, tm.level, tmu.level, tm.name, tm.company, tm."imageUrl", tm.email, tm."topicId"
                   ;`,
                    {
                        replacements: {
                            voteId: voteId
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
                    [Sequelize.Op.or]: [
                        {endsAt: {[Sequelize.Op.gt]: new Date()}},
                        {endsAt: null},
                    ],
                    reminderSent: null
                }
            });

            votes.forEach(async vote => {
                const users = await getTopicMembers(vote.id);
                const voteResult = await topicLib.getVoteResults(vote.id);
                vote.votersCount = 0;
                if (voteResult.length) {
                    vote.votersCount = voteResult[0].votersCount;
                }
                if (users && users.length) {
                    const topicVote = await TopicVote.findOne({ where: { voteId: vote.id } });
                    emailLib.sendVoteReminder(users, vote, topicVote.topicId);
                }

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