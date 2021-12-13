'use strict';

const _search = async (agent, params, expectedHttpCode) => {
    const path = '/api/search';

    return agent
        .get(path)
        .query(params)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const search = async (agent, params) => {
    return _search(agent, params, 200)
};

const _searchUsers = async (agent, userId, params, expectedHttpCode) => {
    const path = '/api/users/:userId/search/users'.replace(':userId', userId);

    return agent
        .get(path)
        .query(params)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const searchUsers = async (agent, userId, params) => {
    return _searchUsers(agent, userId, params, 200)
};

const chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
const assert = chai.assert;
const request = require('supertest');
const app = require('../../app');
const models = app.get('models');

const User = models.User;

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const topicLib = require('./topic');

// API - /api/search*
suite('Search', function () {

    suite('Public', async () => {
        // GET /api/search?include=my.topic&include=my.group&include=public.topic&limit=5&str=test

        setup(async function () {
            const agent = request.agent(app);
            const user = await userLib.createUserAndLogin(agent, null, null, null);
            const description = '<!DOCTYPE HTML><html><body><h1>SEARCH TEST 1</h1><br><h2>SEARCH TEST H2</h2></body></html>';
            await topicLib.topicCreate(agent, user.id, null, null, null, description, null);
        });

        test('Success', async function () {
            const agent = request.agent(app);
            const params = {
                str: 'SEARCH TEST',
                include: ['my.topic', 'my.group', 'public.topic'],
                limit: 10
            };
            const expectedResult = {results: {my:{groups: {count: 0, rows: []}, topics: {count: 0, rows: []}}, public: {topics: {count: 0, rows: []}}}};
            const data = (await search(agent, params)).body.data;

            assert.deepEqual(data, expectedResult);
        });

    });

    suite('Authenticated', function() {

        suite('Users', async () => {
            let agent;
            let user;
            let agent2;
            let user2;

            suiteSetup(async () => {
                await shared.syncDb();
                agent = request.agent(app);
                agent2 = request.agent(app);
                user = await userLib.createUser(agent);
                user2 = await userLib.createUserAndLogin(agent2);
            });

            setup(async () => {
                agent = request.agent(app);
            });

            test('Success - show only users with preference "showInSearch" set true', async () => {
                const data = (await searchUsers(agent2, user2.id, {str: 'test_'})).body.data;
                assert.equal(data.results.public.users.count, 0);

                await User.update(
                    {
                        preferences: {
                            showInSearch: true
                        }
                    },
                    {
                        where: {
                            id: user.id
                        }
                    }
                );

                const data2 = (await searchUsers(agent2,user2.id, {str: 'test_'})).body.data;
                assert.equal(data2.results.public.users.count, 1);
                assert.equal(data2.results.public.users.rows[0].email, user.email);
            });

            test('Success - no results if string length under 5', async () => {
                const data = (await searchUsers(agent2, user2.id, {str: 'test'})).body.data;
                assert.equal(data.results.public.users.count, 0);

                await User.update(
                    {
                        preferences: {
                            showInSearch: true
                        }
                    },
                    {
                        where: {
                            id: user.id
                        }
                    }
                );

                const data2 = (await searchUsers(agent2,user2.id, {str: 'test'})).body.data;
                assert.equal(data2.results.public.users.count, 0);
                assert.equal(data2.results.public.users.rows.length, 0);
            });

            test('Fail - unauthorized', async () => {
                const agent = request.agent(app);
                const resBody = (await _searchUsers(agent, 'self', {str: 'test_'}, 401)).body;
                const expectedRespons = {
                    status: {
                        code: 40100,
                        message: 'Unauthorized'
                    }
                };

                assert.deepEqual(resBody, expectedRespons);
            });
        });
    });

});
