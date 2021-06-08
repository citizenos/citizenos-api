'use strict';

const assert = require('chai').assert;
const request = require('supertest');
const app = require('../../app');
const models = app.get('models');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const topicLib = require('./topic');

const Topic = models.Topic;
const Partner = models.Partner;

const _partnerRead = async function (agent, partnerId, expectedHttpCode) {
    const path = '/api/partners/:partnerId'
        .replace(':partnerId', partnerId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const partnerRead = async function (agent, partnerId) {
    return _partnerRead(agent, partnerId, 200);
};


const _partnerTopicRead = async function (agent, partnerId, sourcePartnerObjectId, expectedHttpCode) {
    const path = '/api/partners/:partnerId/topics/:sourcePartnerObjectId'
        .replace(':partnerId', partnerId)
        .replace(':sourcePartnerObjectId', sourcePartnerObjectId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const partnerTopicRead = async function (agent, partnerId, sourcePartnerObjectId) {
    return _partnerTopicRead(agent, partnerId, sourcePartnerObjectId, 200);
};

suite('Partners', function () {

    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    suite('Read', function () {
        let partner;

        suiteSetup(async function () {
            return Partner
                .findOrCreate({
                    where: {
                        website: 'notimportant'
                    },
                    defaults: {
                        website: 'notimportant',
                        redirectUriRegexp: 'notimportant'
                    }
                })
                .then(function (resultPartner) {
                    partner = resultPartner[0].toJSON();
                });
        });

        test('Success', async function () {
            partner.createdAt = null;
            partner.updatedAt = null;
            const resPartnerInfo = (await partnerRead(request.agent(app), partner.id)).body.data;
            resPartnerInfo.createdAt = null;
            resPartnerInfo.updatedAt = null;
            assert.deepEqual(resPartnerInfo, partner);
        });

        test('Fail - 40400 - Not found', async function () {
            return _partnerRead(request.agent(app), 'b4ab4adb-f76c-4093-a0be-2006ad66ab0f', 404);
        });
    });

    suite('Topics', function () {

        suite('Read', function () {
            const agent = request.agent(app);

            let user;
            let partner;
            const partnerObjectId = Math.random().toString(36).substring(0, 16);
            let topic;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, null, null, null);
                return Partner
                    .findOrCreate({
                        where: {
                            website: 'notimportant'
                        },
                        defaults: {
                            website: 'notimportant',
                            redirectUriRegexp: 'notimportant'
                        }
                    })
                    .then(async function (resultPartner) {
                        partner = resultPartner[0];
                        topic = (await topicLib.topicCreate(agent, user.id, null, null, null, null, null)).body.data;

                        return Topic
                            .update(
                                {
                                    sourcePartnerId: partner.id,
                                    sourcePartnerObjectId: partnerObjectId
                                },
                                {
                                    where: {
                                        id: topic.id
                                    }
                                }
                            );
                    });
            });

            test('Success', async function () {
                const partnerTopic = (await partnerTopicRead(request.agent(app), partner.id, partnerObjectId)).body.data;
                const expectedResult = {
                    id: topic.id,
                    sourcePartnerObjectId: partnerObjectId
                };

                assert.deepEqual(partnerTopic, expectedResult);
            });

            test('Fail - 404', async function () {
                return _partnerTopicRead(request.agent(app), partner.id, 'DOESNOTEXIST', 404);
            });

        });

    });

});
