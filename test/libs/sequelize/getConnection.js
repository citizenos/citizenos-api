'use strict';

var app = require('../../../app');
var db = app.get('db');
var QueryStream = require('pg-query-stream');
var assert = require('chai').assert;

suite('Sequelize', function () {

    test('connectionManager.getConnection()', function (done) {
        var connectionManager = db.connectionManager;
        connectionManager
            .getConnection()
            .then(function (connection) {
                var seriesSize = 10;
                var rows = 0;

                var query = new QueryStream('SELECT * FROM generate_series(1, $1) num', [seriesSize]);
                var stream = connection.query(query);

                stream.on('data', function () {
                    rows++;
                });

                stream.on('error', done);

                stream.on('end', function () {
                    assert.equal(rows, seriesSize);
                    connectionManager.releaseConnection(connection);
                    done();
                });
            });
    });

});
