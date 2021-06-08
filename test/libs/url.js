'use strict';

const assert = require('chai').assert;

suite('Url', function () {

    const config = {
        url: {
            api: 'https://api.citizenos.com',
            fe: 'https://fe.citizenos.com'
        }
    };

    const url = require('../../libs/url')(config);

    suite('getApi', function () {

        test('Without params - return config url.api value', async function () {
            assert.equal(url.getApi(), config.url.api);
        });

        test('With params, query string', async function () {
            const generatedUrl = url.getApi('/users/:userId/topics/:topicId', {userId: '123', topicId: '456'}, {query: '1?', query2: '2?'});
            assert.equal(generatedUrl, 'https://api.citizenos.com/users/123/topics/456?query=1%3F&query2=2%3F');
        });

        test('Query string contains null value param - param not added to the query', async function () {
            const generatedUrl = url.getApi('/users', null, {query: null});
            assert.equal(generatedUrl, 'https://api.citizenos.com/users');
        });

    });

    suite('getFe', function () {

        test('Without params - return config url.fe value', async function () {
            assert.equal(url.getFe(), config.url.fe);
        });

        test('With params, query string', async function () {
            const generatedUrl = url.getFe('/users/:userId/topics/:topicId', {userId: '123', topicId: '456'}, {query: '1?', query2: '2?'});
            assert.equal(generatedUrl, 'https://fe.citizenos.com/users/123/topics/456?query=1%3F&query2=2%3F');
        });

        test('Query string contains null value param - param not added to the query', async function () {
            const generatedUrl = url.getFe('/users', null, {query: null});
            assert.equal(generatedUrl, 'https://fe.citizenos.com/users');
        });

    });

});
