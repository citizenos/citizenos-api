'use strict';

const assert = require('chai').assert;
const request = require('supertest');
const app = require('../../app');
const emailLib = app.get('email');
const config = require('config');

const shared = require('../utils/shared');
const userLib = require('../api/lib/user')(app);
const topicLib = require('../api/topic');
const groupLib = require('../api/group');

const models = app.get('models');
const TopicReport = models.TopicReport;
const TopicInviteUser = models.TopicInviteUser;
const GroupMemberUser = models.GroupMemberUser;
const GroupInviteUser = models.GroupInviteUser;
const Moderator = models.Moderator;
const Comment = models.Comment;
const Report = models.Report;


suite('Email', function () {

    suiteSetup(async function () {
        return shared.syncDb();
    });

    suite('User', function () {
        const agent = request.agent(app);
        let user;

        suiteSetup(async function () {
            user = await userLib.createUserAndLogin(agent, null, null, null);
        });

        test('Send Account Verification - Success', async function () {
            const token = '123';
            const result = await emailLib.sendAccountVerification(user.email, user.emailVerificationCode, token);
            if (result.errors.length) {
                throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
            }
        });

        test('Send Password Reset - Success', async function () {
            const result = await emailLib.sendPasswordReset(user.email, user.passwordResetCode);
            if (result.errors.length) {
                throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
            }
        });

    });

    suite('Topic', function () {

        suite('Invite', function () {
            const agent = request.agent(app);
            const agent2 = request.agent(app);
            let user;
            let user2;
            let group;
            let topic;

            suiteSetup(async() => {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                user2 = await userLib.createUserAndLogin(agent2);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null)).body.data;
                group = (await groupLib.create(agent, user.id, 'Test Group' + Date.now(), null, null)).body.data;
            });

            test('Send topic member user invite', async function () {
                const invite = await TopicInviteUser.create(
                    {
                        topicId: topic.id,
                        creatorId: user.id,
                        userId: user2.id,
                        level: 'read'
                    }
                );

                const result = await emailLib.sendTopicMemberUserInviteCreate([invite]);
                if (result.errors.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });

            test('Send topic member group invite', async function () {
                await GroupMemberUser.create(
                    {
                        groupId: group.id,
                        userId: user2.id,
                        level: GroupMemberUser.LEVELS['read']
                    }
                );
                const result = await emailLib.sendTopicMemberGroupCreate([group.id], user.id, topic.id);

                if (result.errors.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });
        });

        suite('Report', function () {
            const agent = request.agent(app);
            const agent2 = request.agent(app);
            let user;
            let user2;
            let topic;
            let report;
            let comment;
            let commentReport;

            const reportType = TopicReport.TYPES.spam;
            const reportText = 'Test reporting spam';


            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                user2 = await userLib.createUserAndLogin(agent2, null, null, null);
                topic = (await topicLib.topicCreate(agent, user.id, null, null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null)).body.data;
                comment = (await topicLib.topicCommentCreate(agent, user.id, topic.id, null, null, Comment.TYPES.pro, 'subject', 'text')).body.data;

                report = await TopicReport.create({
                    topicId: topic.id,
                    type: reportType,
                    text: reportText,
                    creatorId: user.id,
                    creatorIp: '127.0.0.1'
                });
                commentReport = await Report.create({
                    type: Report.TYPES.abuse,
                    text: reportText,
                    creatorId: user.id,
                    creatorIp: '127.0.0.1'
                });
                await Moderator.create({
                    userId: user2.id
                });
            });

            test('Send Topic Report - Success', async function () {
                const result = await emailLib.sendTopicReport(report);
                if (result.errors.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });

            test('Send Topic Report Moderate - Success', async function () {
                report.creator = user;
                report.topic = topic;
                report.moderatedReasonType = 'obscene';
                report.moderatedReasonText = 'obscene content';
                const result = await emailLib.sendTopicReportModerate(report);

                if (result.errors.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });

            test('Send Topic Report Review - Success', async function () {
                const result = await emailLib.sendTopicReportReview(report, 'Please review');

                if (!result || result.errors?.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });

            test('Send Comment Report - Success', async function () {
                const result = await emailLib.sendCommentReport(comment.id, commentReport);
                if (result.errors.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });
        });

        suite('sendToParliament', function () {

            test('Success', async function () {
                const topic = {
                    id: 'eb4344db-7c8e-4abd-9a60-c0e84dc22492',
                    title: 'TEST TOPIC'
                };

                const contact = {
                    name: 'Test Full Name',
                    phone: '+372510000000',
                    email: 'citizenos.est.dev@mailinator.com'
                };

                const linkDownloadBdocFinal = 'https://test.citizenos.com/here/is/the/final/bdoc';
                const linkAddEvent = 'https://test.rahvaalgatus.ee/here/is/the/url/to/add/events';

                const result = await emailLib.sendToParliament(topic, contact, linkDownloadBdocFinal, new Date(), linkAddEvent);
                if (result.errors.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });


            test('Fail - missing or invalid parameters', async function () {
                try {
                    await emailLib.sendToParliament(null, null, null, null, null);
                } catch (err) {
                    assert.equal(err.message, 'Missing one or more required parameters');
                }
            });

        });

        suite('Help', function () {
            test('Send Help Request - Success', async function () {
                const result = await emailLib.sendHelpRequest({email: 'test_'+Date.now()+'@test.ee', 'browser': 'random'});
                if (config.email?.provider?.name === 'noop') {
                    assert.property(result, 'to');
                    assert.property(result, 'html');
                }
            });
        });
    });

    suite('Group', function () {
        suite('Invite', function () {
            const agent = request.agent(app);
            const agent2 = request.agent(app);
            let user;
            let user2;
            let group;
            suiteSetup(async() => {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                user2 = await userLib.createUserAndLogin(agent2);
                group = (await groupLib.create(agent, user.id, 'Test Group' + Date.now(), null, null)).body.data;
            });

            test('Send group member user invite', async function () {
                const invite = await GroupInviteUser.create(
                    {
                        groupId: group.id,
                        creatorId: user.id,
                        userId: user2.id,
                        level: 'read'
                    }
                );

                const result = await emailLib.sendGroupMemberUserInviteCreate([invite]);
                if (result.errors.length) {
                    throw new Error('Failed with errors' + JSON.stringify(result.errors, 2));
                }
            });
        });
    });
});
