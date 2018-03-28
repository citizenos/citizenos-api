'use strict';

var assert = require('chai').assert;
var util = require('../../libs/util');

suite('Util', function () {

    suite('emailToDisplayName', function () {

        test('Success - first.lastname@mail.com', function (done) {
            var displayName = util.emailToDisplayName('first.lastname@mail.com');
            assert.equal(displayName, 'First Lastname');
            done();
        });

        test('Success - someprefix@mail.com', function (done) {
            var displayName = util.emailToDisplayName('someprefix@mail.com');
            assert.equal(displayName, 'Someprefix');
            done();
        });

        test('Success - first.a-b_lastname@mail.com', function (done) {
            var displayName = util.emailToDisplayName('first.a-b_lastname@mail.com');
            assert.equal(displayName, 'First A B Lastname');
            done();
        });

        test('Fail - not an email - just an @', function (done) {
            var displayName = '@';
            assert.isNull(util.emailToDisplayName(displayName));
            done();
        });

        test('Fail - not an email - no @', function (done) {
            var displayName = 'noatinthismail';
            assert.isNull(util.emailToDisplayName(displayName));
            done();
        });

    });

    suite('randomString', function () {

        test('Success - default 8 character string', function (done) {
            var str = util.randomString();
            assert.match(str, /[A-Za-z0-9]{8}/);
            done();
        });

        test('Success - default 16 character string', function (done) {
            var str = util.randomString(16);
            assert.match(str, /[A-Za-z0-9]{16}/);
            done();
        });

    });

    suite('randomNumber', function () {

        test('Success', function (done) {
            var min = 23;
            var max = 99999;

            for (var i = 0; i < 100000; i++) {
                var nr = util.randomNumber(min, max);
                assert.isTrue(nr >= min && nr <= max);
            }

            done();
        });

    });

    suite('randomPid', function () {

        test('Success', function (done) {

            for (var i = 0; i < 100000; i++) {
                var str = util.randomPid();
                assert.match(str, /[1-6]{1}[0-9]{10}/);
            }

            done();
        });

    });

});
