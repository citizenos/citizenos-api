'use strict';

var assert = require('chai').assert;
var app = require('../../app');
var emailLib = app.get('email');


suite('Email', function () {

    suite('sendToParliament', function () {

        test('Success', function (done) {
            var topic = {
                id: 'eb4344db-7c8e-4abd-9a60-c0e84dc22492',
                title: 'TEST TOPIC'
            };

            var contact = {
                name: 'Test Full Name',
                phone: '+372510000000',
                email: 'citizenos.est.dev@mailinator.com'
            };

            var linkDownloadBdocFinal = 'https://test.citizenos.com/here/is/the/final/bdoc';
            var linkAddEvent = 'https://test.rahvaalgatus.ee/here/is/the/url/to/add/events';

            emailLib
                .sendToParliament(topic, contact, linkDownloadBdocFinal, new Date(), linkAddEvent)
                .then(function () {
                    done();
                })
                .catch(done);
        });


        test('Fail - missing or invalid parameters', function (done) {
            emailLib
                .sendToParliament(null, null, null, null, null)
                .then(function () {
                    throw new Error('Should not succeed!');
                }, function (err) {
                    assert.equal(err.message, 'Missing one or more required parameters');
                    done();
                });
        });

    });

});
