'use strict';

suite('cosActivities', function () {
    const assert = require('chai').assert;

    const app = require('../../app');
    const models = app.get('models');
    const cosActivities = app.get('cosActivities');
    const Vote = models.Vote;

    suite('getInstanceChangeSet', function () {

        test('Success', async function () {
            const vote = Vote.build(
                {
                    endsAt: new Date()
                }
            );
            vote.delegationIsAllowed = true;
            vote.maxChoices = 3;
            vote.endsAt = new Date('2022-02-20T13:01:32.050Z');

            const diffExpected = [
                {
                    op: 'replace',
                    path: '/endsAt',
                    value: '2022-02-20T13:01:32.050Z'
                },
                {
                    op: 'replace',
                    path: '/delegationIsAllowed',
                    value: true
                },
                {
                    op: 'replace',
                    path: '/maxChoices',
                    value: 3
                }
            ];

            assert.deepEqual(cosActivities.getInstanceChangeSet(vote), diffExpected);
        });

    });

});
