'use strict';

suite('cosJwt', function () {
    var assert = require('chai').assert;
    var shared = require('../utils/shared');

    var app = require('../../app');
    var cosJwt = app.get('cosJwt');

    suiteTeardown(function (done) {
        shared
            .closeDb()
            .finally(done);
    });

    test('Success', function (done) {
        var testPayload = {foo: 'bar'};
        var testAudience = 'POST /api/foo/bar';

        cosJwt
            .getTokenRestrictedUse(testPayload, testAudience)
            .then(function (token) {
                return cosJwt.verifyTokenRestrictedUse(token, testAudience);
            })
            .then(function (decoded) {
                assert.equal(decoded.foo, testPayload.foo);

                return done();
            })
            .catch(done);
    });

});
