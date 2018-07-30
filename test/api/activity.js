'use strict';

var _activitiesRead = function (agent, userId, filters, expectedHttpCode, callback) {
    var path = '/api/users/:userId/activities'.replace(':userId', userId);

    agent
        .get(path)
        .query(filters)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var activitiesRead = function (agent, userId, filters, callback) {
    _activitiesRead(agent, userId, filters, 200, callback);
};

var _activitiesReadUnauth = function (agent, filters, expectedHttpCode, callback) {
    var path = '/api/activities';

    agent
        .get(path)
        .query(filters)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var activitiesReadUnauth = function (agent, filters, callback) {
    _activitiesReadUnauth(agent, filters, 200, callback);
};

module.exports.activitiesRead = activitiesRead;
module.exports.activitiesReadUnauth = activitiesReadUnauth;

var chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
var assert = chai.assert;
var request = require('supertest');
var app = require('../../app');

var async = app.get('async');
var shared = require('../utils/shared')(app);
var userLib = require('./lib/user')(app);
var topicLib = require('./topic');
var Partner = app.get('models.Partner');
var Topic = app.get('models.Topic');
var TopicMember = app.get('models.TopicMember');


// API - /api/users*
suite('Users', function () {

    suiteSetup(function (done) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        shared
            .syncDb()
            .then(done)
            .catch(done);
    });

    // API - /api/users/:userId/activities*
    suite('Activities', function () {

        suite('Read', function () {
            var agent = request.agent(app);

            var user;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) return done(err);

                    user = res;

                    topicLib.topicCreate(agent, user.id, null, null, null, null, null, function (err) {
                        if (err) return done(err);

                        done();
                    });
                });
            });

            test('Success', function (done) {
                activitiesRead(agent, user.id, null, function (err, res) {
                    if (err) return done(err);

                    var activities = res.body.data;
                    assert.equal(activities.length, 3);
                    activities.forEach(function (activity) {
                        assert.notProperty(activity.data.actor, 'email');
                        assert.notProperty(activity.data.actor, 'imageUrl');
                        assert.notProperty(activity.data.actor, 'language');
                    });
                    done();
                });
            });

            test('Success - filter', function (done) {
                activitiesRead(agent, user.id, {filter: 'Topic'}, function (err, res) {
                    if (err) return done(err);

                    var activities = res.body.data;
                    assert.equal(activities.length, 1);
                    activities.forEach(function (activity) {
                        assert.notProperty(activity.data.actor, 'email');
                        assert.notProperty(activity.data.actor, 'imageUrl');
                        assert.notProperty(activity.data.actor, 'language');
                    });
                    done();
                });
            });
        });

    });
});

//API: Activities
suite('Activities', function () {
    suiteSetup(function (done) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        shared
            .syncDb()
            .then(done)
            .catch(done);
    });

    suite('Read', function () {
        var agent = request.agent(app);
        var agent2 = request.agent(app);

        var topic;
        var user;
        var user2;
        var partner;

        suiteSetup(function (done) {
            userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                if (err) return done(err);

                user = res;

                async
                    .parallel(
                        [
                            function (cb) {
                                topicLib.topicCreate(agent, user.id, 'public', null, null, '<html><head></head><body><h2>TEST</h2></body></html>', null, cb);
                            },
                            function (cb) {
                                topicLib.topicCreate(agent, user.id, 'public', null, null, '<html><head></head><body><h2>TEST2</h2></body></html>', null, cb);
                            },
                            function (cb) {
                                userLib.createUser(agent2, null, null, null, cb);
                            }
                        ]
                        , function (err, results) {
                            if (err) return done(err);

                            topic = results[1].body.data;
                            user2 = results[2];

                            Partner
                                .create({
                                    website: 'notimportant',
                                    redirectUriRegexp: 'notimportant'
                                })
                                .then(function (res) {
                                    partner = res;

                                    return Topic
                                        .update(
                                            {
                                                sourcePartnerId: partner.id
                                            },
                                            {
                                                where: {
                                                    id: topic.id
                                                }
                                            }
                                        );
                                })
                                .then(function () {
                                    topicLib.topicMemberUsersCreate(
                                        agent,
                                        user.id,
                                        topic.id,
                                        [
                                            {
                                                userId: user2.id,
                                                level: TopicMember.LEVELS.read
                                            }
                                        ],
                                        function (err) {
                                            if (err) return done(err);

                                            done();
                                        }
                                    );
                                });
                        }
                    );

            });
        });

        test('Success', function (done) {
            activitiesReadUnauth(agent2, {sourcePartnerId: partner.id}, function (err, res) {
                if (err) return done(err);

                var activities = res.body.data;

                assert.equal(activities.length, 3);
                activities.forEach(function (activity) {
                    assert.notProperty(activity.data.actor, 'email');
                    assert.notProperty(activity.data.actor, 'imageUrl');
                    assert.notProperty(activity.data.actor, 'language');

                    if (activity.data.object['@type'] === 'User') {
                        assert.notProperty(activity.data.object, 'email');
                        assert.notProperty(activity.data.object, 'imageUrl');
                        assert.notProperty(activity.data.object, 'language');                            
                    } else {
                        assert.equal(activity.data.object.id, topic.id);
                        assert.equal(activity.data.object.sourcePartnerId, partner.id);
                    }
                });

                done();
            });
        });

        test('Success - filter', function (done) {
            activitiesReadUnauth(agent2, {sourcePartnerId: partner.id, filter: ['User']}, function (err, res) {
                if (err) return done(err);

                var activities = res.body.data;

                assert.equal(activities.length, 1);
                activities.forEach(function (activity) {
                    assert.notProperty(activity.data.actor, 'email');
                    assert.notProperty(activity.data.actor, 'imageUrl');
                    assert.notProperty(activity.data.actor, 'language');

                    if (activity.data.object['@type'] === 'User') {
                        assert.notProperty(activity.data.object, 'email');
                        assert.notProperty(activity.data.object, 'imageUrl');
                        assert.notProperty(activity.data.object, 'language');                            
                    } else {
                        assert.equal(activity.data.object.id, topic.id);
                        assert.equal(activity.data.object.sourcePartnerId, partner.id);
                    }
                });

                done();
            });
        });

        test('Success - without partnerId', function (done) {
            activitiesReadUnauth(agent2, null, function (err, res) {
                if (err) return done(err);

                var activities = res.body.data;
                activities.forEach(function (activity) {
                    assert.notProperty(activity.data.actor, 'email');
                    assert.notProperty(activity.data.actor, 'imageUrl');
                    assert.notProperty(activity.data.actor, 'language');

                    if (activity.data.object['@type'] === 'User') {
                        assert.notProperty(activity.data.object, 'email');
                        assert.notProperty(activity.data.object, 'imageUrl');
                        assert.notProperty(activity.data.object, 'language');                            
                    }
                });
                assert.equal(activities.length, 5);

                done();
            });
        });
    });
});
