'use strict';

suite('cosJwt', function () {
    var assert = require('chai').assert;
    var shared = require('../utils/shared');

    var app = require('../../app');
    var cosJwt = app.get('cosJwt');
    var jwt = app.get('jwt');

    suiteTeardown(function (done) {
        shared
            .closeDb()
            .finally(done);
    });

    test('Success', function (done) {
        var testPayload = {foo: 'bar'};
        var testAudience = 'POST /api/foo/bar';

        var token = cosJwt.getTokenRestrictedUse(testPayload, testAudience);
        var decoded = cosJwt.verifyTokenRestrictedUse(token, testAudience);

        assert.equal(decoded.foo, testPayload.foo);
        assert.deepEqual(decoded.aud, [testAudience]);

        done();
    });

    test('Success - multiple audiences (scopes)', function (done) {
        var testPayload = {foo: 'bar'};
        var testAudiences = ['GET /asd', 'POST /api/foo/bar'];

        var token = cosJwt.getTokenRestrictedUse(testPayload, testAudiences);

        var decoded1 = cosJwt.verifyTokenRestrictedUse(token, testAudiences[0]);

        assert.equal(decoded1.foo, testPayload.foo);
        assert.deepEqual(decoded1.aud, testAudiences);

        var decoded2 = cosJwt.verifyTokenRestrictedUse(token, testAudiences[1]);

        assert.equal(decoded2.foo, testPayload.foo);
        assert.deepEqual(decoded2.aud, testAudiences);

        done();
    });


    test('Success - expiry', function (done) {
        var testPayload = {foo: 'bar'};
        var testAudience = 'POST /api/foo/bar';
        var testOptions = {
            expiresIn: '1m'
        };

        var token = cosJwt.getTokenRestrictedUse(testPayload, testAudience, testOptions);
        var decoded = cosJwt.verifyTokenRestrictedUse(token, testAudience);

        assert.equal(decoded.foo, testPayload.foo);
        assert.property(decoded, 'exp');

        return done();
    });

    test('Fail - expired token', function (done) {
        var testPayload = {foo: 'bar'};
        var testAudience = 'POST /api/foo/bar';
        var testOptions = {
            expiresIn: '1ms'
        };

        var token = cosJwt.getTokenRestrictedUse(testPayload, testAudience, testOptions);

        try {
            cosJwt.verifyTokenRestrictedUse(token, testAudience);

            return done(new Error('Should fail due to token expiry!'));
        } catch (err) {
            assert.instanceOf(err, jwt.TokenExpiredError);

            done();
        }
    });

    test('Fail - invalid audience (scope)', function (done) {
        var testPayload = {foo: 'bar'};
        var testAudience = 'POST /api/foo/bar';
        var testInvalidAudience = 'POST /api/invalid';
        var testOptions = {
            expiresIn: '1m'
        };

        var token = cosJwt.getTokenRestrictedUse(testPayload, testAudience, testOptions);

        try {
            cosJwt.verifyTokenRestrictedUse(token, testInvalidAudience);

            return done(new Error('Should fail due to invalid audience!'));
        } catch (err) {
            assert.instanceOf(err, jwt.JsonWebTokenError);
            assert.equal(err.message, 'jwt audience invalid. expected: ' + testInvalidAudience);

            done();
        }
    });

    suite('getTokenRestrictedUse', function () {

        test('Fail - missing required parameters - payload', function (done) {
            try {
                cosJwt.getTokenRestrictedUse();
            } catch (err) {
                return done();
            }
            done(new Error('Should throw an error if payload parameter is missing!'));
        });

        test('Fail - missing required parameters - audience', function (done) {
            try {
                cosJwt.getTokenRestrictedUse({foo: 'bar'});
            } catch (err) {
                return done();
            }
            done(new Error('Should throw an error if audience parameter is missing!'));
        });

        test('Fail - invalid parameters - audience in wrong format', function (done) {
            try {
                cosJwt.getTokenRestrictedUse({foo: 'bar'}, ['/no/method/for/path']);
            } catch (err) {
                return done();
            }
            done(new Error('Should throw an error if audience parameter value is in invalid format!'));
        });

    });
});
