'use strict';

var request = require('supertest');
var app = require('../../../app');
var models = app.get('models');
var assert = require('chai').assert;
var userLib = require('../../api/lib/user')(app);

var Moderator = models.Moderator;
var Partner = models.Partner;

suite('Moderator', function () {
    var agent;
    var user;

    var TEST_PARTNER = {
        id: 'e5fcb764-a635-4858-a496-e43079c7326b',
        website: 'https://citizenospartner.ee',
        redirectUriRegexp: '^https:\\/\\/([^\\.]*\\.)?citizenospartner.ee(:[0-9]{2,5})?\\/.*'
    };

    suiteSetup(function (done) {
        agent = request.agent(app);

        userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
            if (err) {
                return done(err);
            }

            user = res;

            Partner
                .upsert(TEST_PARTNER)
                .then(function () {
                    done();
                })
                .catch(done);
        });
    });

    test('Give User Moderator permissions - Success', function (done) {
        Moderator
            .create({
                userId: user.id,
                partnerId: TEST_PARTNER.id
            })
            .then(function (moderator) {
                assert.equal(moderator.userId, user.id);
                assert.equal(moderator.partnerId, TEST_PARTNER.id);
                done();
            });
    });

    test('Give User Global Moderator permissions - Success', function (done) {
        Moderator
            .create({
                userId: user.id

            })
            .then(function (moderator) {
                assert.equal(moderator.userId, user.id);
                assert.equal(moderator.partnerId, null);
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    test('Fail - Give User Moderator permissions twice with same partner', function (done) {
        Moderator
            .create({
                userId: user.id,
                partnerId: TEST_PARTNER.id
            })
            .then(function (moderator) {
                assert.equal(moderator.userId, user.id);
                assert.equal(moderator.partnerId, TEST_PARTNER.id);
                
                Moderator
                    .create({
                        userId: user.id,
                        partnerId: TEST_PARTNER.id
                    }).then(function (moderator2) {
                        assert.equal(moderator2.userId, user.id);
                        var error = new Error('Same permissions added twice');
                        done(error);
                    });
            }).catch(function (e) {
                assert.equal(e.message, 'Validation error');
                assert.equal(e.errors[0].message, 'userId must be unique');
                assert.equal(e.errors[1].message, 'partnerId must be unique');
                done();
            });
    });

    test('Fail - Give User Global Moderator permissions twice', function (done) {
        Moderator
            .create({
                userId: user.id
            })
            .then(function (moderator) {
                assert.equal(moderator.userId, user.id);
                assert.equal(moderator.partnerId, null);

                Moderator
                    .create({
                        userId: user.id
                    }).then(function (moderator2) {
                        assert.equal(moderator2.userId, user.id);
                        var error = new Error('Same permissions added twice');
                        done(error);
                    });
            }).catch(function (e) {                
                assert.equal(e.message, 'Validation error');
                assert.equal(e.errors[0].message, 'userId must be unique');
                done();
            });
    });
});
