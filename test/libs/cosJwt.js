'use strict';

suite('cosJwt', function () {
    const assert = require('chai').assert;

    const app = require('../../app');
    const cosJwt = app.get('cosJwt');
    const jwt = app.get('jwt');
    const config = app.get('config');

    test('Success', async function () {
        const testPayload = {foo: 'bar'};
        const testAudience = 'POST /api/foo/bar';

        const token = cosJwt.getTokenRestrictedUse(testPayload, testAudience);
        const decoded = cosJwt.verifyTokenRestrictedUse(token, testAudience);

        assert.equal(decoded.foo, testPayload.foo);
        assert.deepEqual(decoded.aud, [testAudience]);
    });

    test('Success - multiple audiences (scopes)', async function () {
        const testPayload = {foo: 'bar'};
        const testAudiences = ['GET /asd', 'POST /api/foo/bar'];

        const token = cosJwt.getTokenRestrictedUse(testPayload, testAudiences);

        const decoded1 = cosJwt.verifyTokenRestrictedUse(token, testAudiences[0]);

        assert.equal(decoded1.foo, testPayload.foo);
        assert.deepEqual(decoded1.aud, testAudiences);

        const decoded2 = cosJwt.verifyTokenRestrictedUse(token, testAudiences[1]);

        assert.equal(decoded2.foo, testPayload.foo);
        assert.deepEqual(decoded2.aud, testAudiences);
    });


    test('Success - expiry', async function () {
        const testPayload = {foo: 'bar'};
        const testAudience = 'POST /api/foo/bar';
        const testOptions = {
            expiresIn: '1m'
        };

        const token = cosJwt.getTokenRestrictedUse(testPayload, testAudience, testOptions);
        const decoded = cosJwt.verifyTokenRestrictedUse(token, testAudience);

        assert.equal(decoded.foo, testPayload.foo);
        assert.property(decoded, 'exp');
    });

    test('Fail - expired token', async function () {
        const testPayload = {foo: 'bar'};
        const testAudience = 'POST /api/foo/bar';
        const testOptions = {
            expiresIn: '1ms'
        };

        const token = cosJwt.getTokenRestrictedUse(testPayload, testAudience, testOptions);

        try {
            cosJwt.verifyTokenRestrictedUse(token, testAudience);

            throw new Error('Should fail due to token expiry!');
        } catch (err) {
            assert.instanceOf(err, jwt.TokenExpiredError);
        }
    });

    test('Fail - invalid audience (scope)', async function () {
        const testPayload = {foo: 'bar'};
        const testAudience = 'POST /api/foo/bar';
        const testInvalidAudience = 'POST /api/invalid';
        const testOptions = {
            expiresIn: '1m'
        };

        const token = cosJwt.getTokenRestrictedUse(testPayload, testAudience, testOptions);

        try {
            cosJwt.verifyTokenRestrictedUse(token, testInvalidAudience);

            throw new Error('Should fail due to invalid audience!');
        } catch (err) {
            assert.instanceOf(err, jwt.JsonWebTokenError);
            assert.equal(err.message, 'jwt audience invalid. expected: ' + testInvalidAudience);
        }
    });

    test('Fail - missing audience (scope)', async function () {
        const testAudience = 'GET /foo/bar';
        const testPayload = {
            foo: 'bar'
        };

        const token = jwt.sign(
            testPayload,
            config.session.privateKey,
            {
                algorithm: config.session.algorithm
            }
        );

        try {
            cosJwt.verifyTokenRestrictedUse(token, testAudience);

            throw new Error('Should fail due to invalid audience!');
        } catch (err) {
            assert.instanceOf(err, jwt.JsonWebTokenError);
            assert.equal(err.message, 'jwt audience invalid. expected: ' + testAudience);
        }
    });

    suite('getTokenRestrictedUse', function () {

        test('Fail - missing required parameters - payload', async function () {
            try {
                cosJwt.getTokenRestrictedUse();

                throw new Error('Should throw an error if payload parameter is missing!');
            } catch (err) {
                return;
            }
        });

        test('Fail - missing required parameters - audience', async function () {
            try {
                cosJwt.getTokenRestrictedUse({foo: 'bar'});
                throw new Error('Should throw an error if audience parameter is missing!');
            } catch (err) {
                return;
            }
        });

        test('Fail - invalid parameters - audience in wrong format', async function () {
            try {
                cosJwt.getTokenRestrictedUse({foo: 'bar'}, ['/no/method/for/path']);

                throw new Error('Should throw an error if audience parameter value is in invalid format!');
            } catch (err) {
                return;
            }
        });

    });
});
