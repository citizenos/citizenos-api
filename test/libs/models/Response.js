'use strict';

var assert = require('chai').assert;
var Response = require('../../../libs/models/Response');

suite('Response', function () {

    suite('Success', function () {
        test('Construct - httpCode', function (done) {
            var expected = {
                status: {
                    code: 20000
                }
            };

            var response = new Response.Success(200);

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, statusMessage', function (done) {
            var expected = {
                status: {
                    code: 20000,
                    message: 'OK'
                }
            };

            var response = new Response.Success(200, 'OK');

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, data', function (done) {
            var expected = {
                status: {
                    code: 20000
                },
                data: {
                    foo: 'bar'
                }
            };

            var response = new Response.Success(200, {foo: 'bar'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, data (array)', function (done) {
            var expected = {
                status: {
                    code: 20000
                },
                data: [
                    {
                        foo: 'bar'
                    }
                ]
            };

            var response = new Response.Success(200, [
                {
                    foo: 'bar'
                }
            ]);

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });


        test('Construct - httpCode, statusMessage, data', function (done) {
            var expected = {
                status: {
                    code: 20000,
                    message: 'OK'
                },
                data: {
                    foo: 'bar'
                }
            };

            var response = new Response.Success(200, 'OK', {foo: 'bar'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, statusMessage, statusCode, data', function (done) {
            var expected = {
                status: {
                    code: 20010,
                    message: 'OK'
                },
                data: {
                    foo: 'bar'
                }
            };

            var response = new Response.Success(200, 'OK', 10, {foo: 'bar'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });
    });

    suite('Error', function () {
        test('Construct - httpCode', function (done) {
            var expected = {
                status: {
                    code: 40000
                }
            };

            var response = new Response.Error(400);

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, statusMessage', function (done) {
            var expected = {
                status: {
                    code: 40000,
                    message: 'Bad Request'
                }
            };

            var response = new Response.Error(400, 'Bad Request');

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, errors', function (done) {
            var expected = {
                status: {
                    code: 40000
                },
                errors: {
                    field1: 'Error msg'
                }
            };

            var response = new Response.Error(400, {field1: 'Error msg'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, statusMessage, errors', function (done) {
            var expected = {
                status: {
                    code: 40000,
                    message: 'Bad Request'
                },
                errors: {
                    field1: 'Error msg'
                }
            };

            var response = new Response.Error(400, 'Bad Request', {field1: 'Error msg'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, statusMessage, statusCode, errors', function (done) {
            var expected = {
                status: {
                    code: 40010,
                    message: 'Bad Request'
                },
                errors: {
                    field1: 'Error msg'
                }
            };

            var response = new Response.Error(400, 'Bad Request', 10, {field1: 'Error msg'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });

        test('Construct - httpCode, statusMessage - 50000', function (done) {
            var expected = {
                status: {
                    code: 50000,
                    message: 'Internal Server Error'
                }
            };

            var response = new Response.Error(500, 'Internal Server Error');

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);

            done();
        });
    });

});
