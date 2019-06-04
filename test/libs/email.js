'use strict';

var assert = require('chai').assert;
var request = require('supertest');
var app = require('../../app');
var emailLib = app.get('email');

var shared = require('../utils/shared');
var userLib = require('../api/lib/user')(app);
var topicLib = require('../api/topic');

var models = app.get('models');
var TopicReport = models.TopicReport;


suite('Email', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .finally(done);
    });

    suite('sendTopicReport', function () {
        var agent = request.agent(app);
        var user;
        var topic;
        var report;

        var reportType = TopicReport.TYPES.spam;
        var reportText = 'Test reporting spam';


        suiteSetup(function (done) {
            userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                if (err) {
                    return done(err);
                }

                user = res;

                topicLib.topicCreate(agent, user.id, null, null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    topic = res.body.data;

                    TopicReport
                        .create({
                            topicId: topic.id,
                            type: reportType,
                            text: reportText,
                            creatorId: user.id,
                            creatorIp: '127.0.0.1'
                        })
                        .then(function (topicReport) {
                            report = topicReport;

                            done();
                        })
                        .catch(done);
                });
            });
        });

        test('Success', function (done) {
            emailLib
                .sendTopicReport(report)
                .then(function () {
                    done();
                })
                .catch(done);
        });

    });

    suite('sendToParliament', function () {

        test('Success', function (done) {
            var topic = {
                id: 'eb4344db-7c8e-4abd-9a60-c0e84dc22492',
                title: 'TEST TOPIC'
            };

            var contact = {
                name: 'Test Full Name',
                phone: '+372510000000',
                email: 'citizenos.est.dev@mailinator.com'
            };

            var linkDownloadBdocFinal = 'https://test.citizenos.com/here/is/the/final/bdoc';
            var linkAddEvent = 'https://test.rahvaalgatus.ee/here/is/the/url/to/add/events';

            emailLib
                .sendToParliament(topic, contact, linkDownloadBdocFinal, new Date(), linkAddEvent)
                .then(function () {
                    done();
                })
                .catch(done);
        });


        test('Fail - missing or invalid parameters', function (done) {
            emailLib
                .sendToParliament(null, null, null, null, null)
                .then(
                    function () {
                        throw new Error('Should not succeed!');
                    },
                    function (err) {
                        assert.equal(err.message, 'Missing one or more required parameters');
                        done();
                    }
                );
        });

    });

});
