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

        suite('Users', async () => {
            let agent;
            let user;

            suiteSetup(async () => {
                const agent = request.agent(app);
                await shared.syncDb();
                user = await userLib.createUser(agent);
            });

            setup(async () => {
                agent = request.agent(app);
            });

            test('Success - show only users with preference "showInSearch" set true', async () => {
                const data = (await search(agent, {str: 'test', include: 'public.user'})).body.data;
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

                const data2 = (await search(agent, {str: 'test', include: 'public.user'})).body.data;
                assert.equal(data2.results.public.users.count, 1);
                assert.equal(data2.results.public.users.rows[0].email, user.email);
            });

        });

    });

    suite('Authenticated', function() {

        // GET /api/search?include=my.topic&include=my.group&include=public.topic&limit=5&str=test

        let agent;
        let user;

        setup(async function () {
            agent = request.agent(app);
            user = await userLib.createUserAndLogin(agent, null, null, null);
            const description = '<!DOCTYPE HTML><html><body><h1>SEARCH TEST 1</h1><br><h2>SEARCH TEST H2</h2></body></html>';
            await topicLib.topicCreate(agent, user.id, null, null, null, description, null);
        });

        test('Success', async function () {

            const params = {
                str: 'SEARCH TEST',
                include: ['my.topic', 'my.group', 'public.topic'],
                limit: 10
            };

            await search(agent, params);
        });

    });

});
