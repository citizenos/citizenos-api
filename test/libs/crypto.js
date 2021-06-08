'use strict';

const assert = require('chai').assert;
const cryptoLib = require('../../libs/crypto');

suite('Crypto', function () {

    test('getAtHash', async function () {
        const data = 'asdasdasd21321321321312321';
        const algorithm = 'sha256';
        const hash = cryptoLib.getAtHash(data, algorithm);

        assert.equal(hash, 'YWIxMTY2ODEwYjcxZDcwODVlOTUyZTA3YWJmYzQ5YmI');
    });

});
