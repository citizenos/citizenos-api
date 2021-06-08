'use strict';

const assert = require('chai').assert;
const request = require('supertest');
const app = require('../../app');
const emailLib = app.get('email');

const shared = require('../utils/shared');
const userLib = require('../api/lib/user')(app);
const topicLib = require('../api/topic');

const models = app.get('models');
const TopicReport = models.TopicReport;


suite('Email', function () {

    suiteSetup(async function () {
        return shared.syncDb();
    });

    suite('sendTopicReport', function () {
        const agent = request.agent(app);
        let user;
        let topic;
        let report;

        const reportType = TopicReport.TYPES.spam;
        const reportText = 'Test reporting spam';


        suiteSetup(async function () {
            user = await userLib.createUserAndLogin(agent, null, null, null);
            topic = (await topicLib.topicCreate(agent, user.id, null, null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null)).body.data;

            report = await TopicReport.create({
                topicId: topic.id,
                type: reportType,
                text: reportText,
                creatorId: user.id,
                creatorIp: '127.0.0.1'
            });
        });

        test('Success', async function () {
            return emailLib.sendTopicReport(report);
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

            return emailLib.sendToParliament(topic, contact, linkDownloadBdocFinal, new Date(), linkAddEvent);
        });


        test('Fail - missing or invalid parameters', async function () {
            try {
                await emailLib.sendToParliament(null, null, null, null, null);
            } catch (err) {
                assert.equal(err.message, 'Missing one or more required parameters');
            }
        });

    });

});
