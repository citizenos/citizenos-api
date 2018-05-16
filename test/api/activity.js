'use strict';

var _activityRead = function (agent, userId, filters, expectedHttpCode, callback) {
    var path = '/api/users/:userId/activities'.replace(':userId', userId);

    agent
        .get(path)
        .query(filters)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var activityRead = function (agent, userId, filters, callback) {
    _activityRead(agent, userId, filters, 200, callback);
};

module.exports.activityRead = activityRead;

var chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
var assert = chai.assert;
var request = require('supertest');
var app = require('../../app');

var shared = require('../utils/shared')(app);
var userLib = require('./lib/user')(app);
var topicLib = require('./topic');


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
            var email = 'test_topicc_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var user;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) return done(err);

                    user = res;

                    topicLib.topicCreate(agent, null, user.id, null, null, null, null, null, function (err) {
                        if (err) return done(err);

                        done();
                    });
                });
            });

            test('Success', function (done) {
                activityRead(agent, user.id, null, function (err, res) {
                    if (err) return done(err);

                    var activities = res.body.data;
                    assert.equal(activities.length, 3);

                    done();
                });
            });
        });
    });
});
