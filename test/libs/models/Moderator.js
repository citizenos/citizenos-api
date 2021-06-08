'use strict';

const request = require('supertest');
const app = require('../../../app');
const models = app.get('models');
const assert = require('chai').assert;
const userLib = require('../../api/lib/user')(app);

const Moderator = models.Moderator;
const Partner = models.Partner;

suite('Moderator', function () {
    let agent;
    let user;

    const TEST_PARTNER = {
        id: 'e5fcb764-a635-4858-a496-e43079c7326b',
        website: 'https://citizenospartner.ee',
        redirectUriRegexp: '^https:\\/\\/([^\\.]*\\.)?citizenospartner.ee(:[0-9]{2,5})?\\/.*'
    };

    setup(async function () {
        agent = request.agent(app);
        user = await userLib.createUserAndLogin(agent, null, null, null);
        await Partner.upsert(TEST_PARTNER);
    });

    test('Give User Moderator permissions - Success', async function () {
        const moderator = await Moderator.create({
            userId: user.id,
            partnerId: TEST_PARTNER.id
        });
        assert.equal(moderator.userId, user.id);
        assert.equal(moderator.partnerId, TEST_PARTNER.id);
    });

    test('Give User Global Moderator permissions - Success', async function () {
        const moderator = await Moderator.create({
            userId: user.id

        });
        assert.equal(moderator.userId, user.id);
        assert.equal(moderator.partnerId, null);
    });

    test('Fail - Give User Moderator permissions twice with same partner', async function () {
        const moderator = await Moderator.create({
            userId: user.id,
            partnerId: TEST_PARTNER.id
        });
        assert.equal(moderator.userId, user.id);
        assert.equal(moderator.partnerId, TEST_PARTNER.id);
        try {
            const moderator2 = await Moderator.create({
                        userId: user.id,
                        partnerId: TEST_PARTNER.id
                    });
            assert.equal(moderator2.userId, user.id);
            throw new Error('Same permissions added twice');
        } catch(e) {
            assert.equal(e.message, 'Validation error');
            assert.equal(e.errors[0].message, 'userId must be unique');
            assert.equal(e.errors[1].message, 'partnerId must be unique');
        }
    });

    test('Fail - Give User Global Moderator permissions twice', async function () {
        const moderator = await Moderator.create({
            userId: user.id
        });

        assert.equal(moderator.userId, user.id);
        assert.equal(moderator.partnerId, null);

        try {
            const moderator2 = await Moderator.create({
                userId: user.id
            });
            assert.equal(moderator2.userId, user.id);
            throw new Error('Same permissions added twice');
        } catch(e) {
            assert.equal(e.message, 'Validation error');
            assert.equal(e.errors[0].message, 'userId must be unique');
        }
    });
});
