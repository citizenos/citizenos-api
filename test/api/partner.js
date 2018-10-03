'use strict';

var assert = require('chai').assert;
var request = require('supertest');
var app = require('../../app');
var models = app.get('models');

var shared = require('../utils/shared');
var userLib = require('./lib/user')(app);
var topicLib = require('./topic');

var Topic = models.Topic;
var Partner = models.Partner;

var _partnerTopicRead = function (agent, partnerId, sourcePartnerObjectId, expectedHttpCode, callback) {
    var path = '/api/partners/:partnerId/topics/:sourcePartnerObjectId'
        .replace(':partnerId', partnerId)
        .replace(':sourcePartnerObjectId', sourcePartnerObjectId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var partnerTopicRead = function (agent, partnerId, sourcePartnerObjectId, callback) {
    _partnerTopicRead(agent, partnerId, sourcePartnerObjectId, 200, callback);
};

suite('Partners', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .finally(done);
    });

    suiteTeardown(function (done) {
        shared
            .closeDb()
            .finally(done);
    });

    suite('Topics', function () {

        suite('Read', function () {
            var agent = request.agent(app);

            var user;
            var partner;
            var partnerObjectId = Math.random().toString(36).substring(16);
            var topic;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    user = res;

                    Partner
                        .findOrCreate({
                            where: {
                                website: 'notimportant'
                            },
                            defaults: {
                                website: 'notimportant',
                                redirectUriRegexp: 'notimportant'
                            }
                        })
                        .then(function (resultPartner) {
                            partner = resultPartner[0];

                            topicLib
                                .topicCreate(agent, user.id, null, null, null, null, null, function (err, resultTopic) {
                                    if (err) {
                                        return done(err);
                                    }

                                    topic = resultTopic.body.data;

                                    Topic
                                        .update(
                                            {
                                                sourcePartnerId: partner.id,
                                                sourcePartnerObjectId: partnerObjectId
                                            },
                                            {
                                                where: {
                                                    id: topic.id
                                                }
                                            }
                                        )
                                        .then(function () {
                                            done();
                                        })
                                        .catch(done);
                                });
                        })
                        .catch(done);
                });
            });

            test('Success', function (done) {
                partnerTopicRead(request.agent(app), partner.id, partnerObjectId, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var expectedResult = {
                        id: topic.id,
                        sourcePartnerObjectId: partnerObjectId
                    };

                    assert.deepEqual(res.body.data, expectedResult);

                    done();
                });
            });

            test('Fail - 404', function (done) {
                _partnerTopicRead(request.agent(app), partner.id, 'DOESNOTEXIST', 404, done);
            });

        });

    });

});
