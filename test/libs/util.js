'use strict';

const assert = require('chai').assert;
const util = require('../../libs/util');

suite('Util', function () {

    suite('emailToDisplayName', function () {

        test('Success - first.lastname@mail.com', async function () {
            const displayName = util.emailToDisplayName('first.lastname@mail.com');
            assert.equal(displayName, 'First Lastname');
        });

        test('Success - someprefix@mail.com', async function () {
            const displayName = util.emailToDisplayName('someprefix@mail.com');
            assert.equal(displayName, 'Someprefix');
        });

        test('Success - first.a-b_lastname@mail.com', async function () {
            const displayName = util.emailToDisplayName('first.a-b_lastname@mail.com');
            assert.equal(displayName, 'First A B Lastname');
        });

        test('Fail - not an email - just an @', async function () {
            const displayName = '@';
            assert.isNull(util.emailToDisplayName(displayName));
        });

        test('Fail - not an email - no @', async function () {
            const displayName = 'noatinthismail';
            assert.isNull(util.emailToDisplayName(displayName));
        });

    });

    suite('emailToMaskedEmail', function() {

        test('Success', async function () {
            const email = 'foo@bar.com';
            assert.equal(util.emailToMaskedEmail(email), 'fo******@bar.com');
        });

    });

    suite('randomString', function () {

        test('Success - default 8 character string', async function () {
            const str = util.randomString();
            assert.match(str, /[A-Za-z0-9]{8}/);
        });

        test('Success - default 16 character string', async function () {
            const str = util.randomString(16);
            assert.match(str, /[A-Za-z0-9]{16}/);
        });

    });

    suite('randomNumber', function () {
        this.timeout(5000);

        test('Success', async function () {
            const min = 23;
            const max = 99999;

            for (let i = 0; i < 100000; i++) {
                const nr = util.randomNumber(min, max);
                assert.isTrue(nr >= min && nr <= max);
            }
        });

    });

    suite('randomPid', function () {

        test('Success', async function () {
            this.timeout(5000);

            for (let i = 0; i < 100000; i++) {
                const str = util.randomPid();
                assert.match(str, /[1-6]{1}[0-9]{10}/);
            }
        });

    });

});
