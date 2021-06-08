'use strict';

const assert = require('chai').assert;
const Response = require('../../../libs/models/Response');

suite('Response', function () {

    suite('Success', function () {
        test('Construct - httpCode', async function () {
            const expected = {
                status: {
                    code: 20000
                }
            };

            const response = new Response.Success(200);

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, statusMessage', async function () {
            const expected = {
                status: {
                    code: 20000,
                    message: 'OK'
                }
            };

            const response = new Response.Success(200, 'OK');

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, data', async function () {
            const expected = {
                status: {
                    code: 20000
                },
                data: {
                    foo: 'bar'
                }
            };

            const response = new Response.Success(200, {foo: 'bar'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, data (array)', async function () {
            const expected = {
                status: {
                    code: 20000
                },
                data: [
                    {
                        foo: 'bar'
                    }
                ]
            };

            const response = new Response.Success(200, [
                {
                    foo: 'bar'
                }
            ]);

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });


        test('Construct - httpCode, statusMessage, data', async function () {
            const expected = {
                status: {
                    code: 20000,
                    message: 'OK'
                },
                data: {
                    foo: 'bar'
                }
            };

            const response = new Response.Success(200, 'OK', {foo: 'bar'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, statusMessage, statusCode, data', async function () {
            const expected = {
                status: {
                    code: 20010,
                    message: 'OK'
                },
                data: {
                    foo: 'bar'
                }
            };

            const response = new Response.Success(200, 'OK', 10, {foo: 'bar'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });
    });

    suite('Error', function () {
        test('Construct - httpCode', async function () {
            const expected = {
                status: {
                    code: 40000
                }
            };

            const response = new Response.Error(400);

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, statusMessage', async function () {
            const expected = {
                status: {
                    code: 40000,
                    message: 'Bad Request'
                }
            };

            const response = new Response.Error(400, 'Bad Request');

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, errors', async function () {
            const expected = {
                status: {
                    code: 40000
                },
                errors: {
                    field1: 'Error msg'
                }
            };

            const response = new Response.Error(400, {field1: 'Error msg'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, statusMessage, errors', async function () {
            const expected = {
                status: {
                    code: 40000,
                    message: 'Bad Request'
                },
                errors: {
                    field1: 'Error msg'
                }
            };

            const response = new Response.Error(400, 'Bad Request', {field1: 'Error msg'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, statusMessage, statusCode, errors', async function () {
            const expected = {
                status: {
                    code: 40010,
                    message: 'Bad Request'
                },
                errors: {
                    field1: 'Error msg'
                }
            };

            const response = new Response.Error(400, 'Bad Request', 10, {field1: 'Error msg'});

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });

        test('Construct - httpCode, statusMessage - 50000', async function () {
            const expected = {
                status: {
                    code: 50000,
                    message: 'Internal Server Error'
                }
            };

            const response = new Response.Error(500, 'Internal Server Error');

            assert.deepEqual(JSON.parse(JSON.stringify(response)), expected);
        });
    });

});
