'use strict';

const app = require('../../../app');
const db = app.get('models').sequelize;
const QueryStream = require('pg-query-stream');
const assert = require('chai').assert;

suite('Sequelize', function () {

    test('connectionManager.getConnection()', async function () {
        const connectionManager = db.connectionManager;
        const connection = await connectionManager.getConnection();
        const seriesSize = 10;
        let rows = 0;

        const query = new QueryStream('SELECT * FROM generate_series(1, $1) num', [seriesSize]);
        const stream = connection.query(query);

        stream.on('data', function () {
            rows++;
        });

        stream.on('error', Promise.reject);

        stream.on('end', function () {
            assert.equal(rows, seriesSize);
            connectionManager.releaseConnection(connection);
            return Promise.resolve()
        });
    });

});
