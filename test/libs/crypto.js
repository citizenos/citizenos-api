'use strict';

var assert = require('chai').assert;
var cryptoLib = require('../../libs/crypto');

suite('Crypto', function () {

    test('getAtHash', function (done) {
        var data = 'asdasdasd21321321321312321';
        var algorithm = 'sha256';
        var hash = cryptoLib.getAtHash(data, algorithm);

        assert.equal(hash, 'YWIxMTY2ODEwYjcxZDcwODVlOTUyZTA3YWJmYzQ5YmI');

        done();
    });

});
