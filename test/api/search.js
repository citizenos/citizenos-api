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
}

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

});
