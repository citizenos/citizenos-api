'use strict';

var assert = require('chai').assert;

suite('Url', function () {

    var config = {
        url: {
            api: 'https://api.citizenos.com',
            fe: 'https://fe.citizenos.com'
        }
    };

    var url = require('../../libs/url')(config);

    suite('getApi', function () {

        test('Without params - return config url.api value', function (done) {
            assert.equal(url.getApi(), config.url.api);
            done();
        });

        test('With params, query string', function (done) {
            var generatedUrl = url.getApi('/users/:userId/topics/:topicId', {userId: '123', topicId: '456'}, {query: '1?', query2: '2?'});
            assert.equal(generatedUrl, 'https://api.citizenos.com/users/123/topics/456?query=1%3F&query2=2%3F');
            done();
        });

        test('Query string contains null value param - param not added to the query', function (done) {
            var generatedUrl = url.getApi('/users', null, {query: null});
            assert.equal(generatedUrl, 'https://api.citizenos.com/users');
            done();
        });

    });

    suite('getFe', function () {

        test('Without params - return config url.fe value', function (done) {
            assert.equal(url.getFe(), config.url.fe);
            done();
        });

        test('With params, query string', function (done) {
            var generatedUrl = url.getFe('/users/:userId/topics/:topicId', {userId: '123', topicId: '456'}, {query: '1?', query2: '2?'});
            assert.equal(generatedUrl, 'https://fe.citizenos.com/users/123/topics/456?query=1%3F&query2=2%3F');
            done();
        });

        test('Query string contains null value param - param not added to the query', function (done) {
            var generatedUrl = url.getFe('/users', null, {query: null});
            assert.equal(generatedUrl, 'https://fe.citizenos.com/users');
            done();
        });

    });

});
