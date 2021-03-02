'use strict';

var _groupCreate = function (agent, userId, name, parentId, visibility, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups'.replace(':userId', userId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            name: name,
            parentId: parentId,
            visibility: visibility
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupCreate = function (agent, userId, name, parentId, visibility, callback) {
    _groupCreate(agent, userId, name, parentId, visibility, 201, callback);
};

const _groupCreatePromised = async function (agent, userId, name, parentId, visibility, expectedHttpCode) {
    const path = '/api/users/:userId/groups'.replace(':userId', userId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send({
            name: name,
            parentId: parentId,
            visibility: visibility
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupCreatePromised = async function (agent, userId, name, parentId, visibility) {
    return _groupCreatePromised(agent, userId, name, parentId, visibility, 201);
};

const _groupReadPromised = async function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupReadPromised = async function (agent, userId, groupId) {
    return _groupReadPromised(agent, userId, groupId, 200);
};

const _groupUpdatePromised = async function (agent, userId, groupId, name, parentId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            name: name,
            parentId: parentId
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

var groupUpdatePromised = async function (agent, userId, groupId, name, parentId) {
    return _groupUpdatePromised(agent, userId, groupId, name, parentId, 200);
};

const _groupDeletePromised = async function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

var groupDeletePromised = async function (agent, userId, groupId) {
    return _groupDeletePromised(agent, userId, groupId, 200);
};

const _groupListPromised = async function (agent, userId, include, expectedHttpCode) {
    const path = '/api/users/:userId/groups'.replace(':userId', userId);

    return agent
        .get(path)
        .query({include: include})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupListPromised = async function (agent, userId, include) {
    return _groupListPromised(agent, userId, include, 200);
};

const _groupsListUnauthPromised = async function (agent, statuses, orderBy, offset, limit, sourcePartnerId, expectedHttpCode) {
    const path = '/api/groups';

    return agent
        .get(path)
        .query({
            statuses: statuses,
            orderBy: orderBy,
            offset: offset,
            limit: limit,
            sourcePartnerId: sourcePartnerId
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupsListUnauthPromised = async function (agent, status, orderBy, offset, limit, sourcePartnerId) {
    return _groupsListUnauthPromised(agent, status, orderBy, offset, limit, sourcePartnerId, 200);
};

const _groupInviteUsersCreatePromised = async function (agent, userId, groupId, invites, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/invites/users'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .post(path)
        .send(invites)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupInviteUsersCreatePromised = async function (agent, userId, groupId, invites) {
    return _groupInviteUsersCreatePromised(agent, userId, groupId, invites, 201);
};

const _groupInviteUsersReadPromised = async function (agent, groupId, inviteId, expectedHttpCode) {
    const path = '/api/groups/:groupId/invites/users/:inviteId'
        .replace(':groupId', groupId)
        .replace(':inviteId', inviteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupInviteUsersReadPromised = async function (agent, groupId, inviteId) {
    return _groupInviteUsersReadPromised(agent, groupId, inviteId, 200);
};

const _groupInviteUsersListPromised = function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/invites/users'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupInviteUsersListPromised = async function (agent, userId, groupId) {
    return _groupInviteUsersListPromised(agent, userId, groupId, 200);
};

const _groupInviteUsersDeletePromised = async function (agent, userId, groupId, inviteId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/invites/users/:inviteId'
        .replace(':userId', userId)
        .replace(':groupId', groupId)
        .replace(':inviteId', inviteId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupInviteUsersDeletePromised = async function (agent, userId, groupId, inviteId) {
    return _groupInviteUsersDeletePromised(agent, userId, groupId, inviteId, 200);
};

var _groupMembersCreate = function (agent, userId, groupId, members, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId/members/users'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(members)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupMembersCreate = function (agent, userId, groupId, members, callback) {
    _groupMembersCreate(agent, userId, groupId, members, 201, callback);
};

const _groupMembersCreatePromised = async function (agent, userId, groupId, members, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/members/users'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .send(members)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupMembersCreatePromised = async function (agent, userId, groupId, members) {
    return _groupMembersCreatePromised(agent, userId, groupId, members, 201);
};

var _groupMembersUpdate = function (agent, userId, groupId, memberId, level, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':groupId', groupId)
        .replace(':memberId', memberId);

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({level: level})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupMembersUpdate = function (agent, userId, groupId, memberId, level, callback) {
    return _groupMembersUpdate(agent, userId, groupId, memberId, level, 200, callback);
};

const _groupMembersUpdatePromised = async function (agent, userId, groupId, memberId, level, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':groupId', groupId)
        .replace(':memberId', memberId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({level: level})
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupMembersUpdatePromised = async function (agent, userId, groupId, memberId, level) {
    return _groupMembersUpdatePromised(agent, userId, groupId, memberId, level, 200);
};

var _groupMembersDelete = function (agent, userId, groupId, memberId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':groupId', groupId)
        .replace(':memberId', memberId);

    agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupMembersDelete = function (agent, userId, groupId, memberId, callback) {
    return _groupMembersDelete(agent, userId, groupId, memberId, 200, callback);
};

const _groupMembersDeletePromised = async function (agent, userId, groupId, memberId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/members/users/:memberId'
        .replace(':userId', userId)
        .replace(':groupId', groupId)
        .replace(':memberId', memberId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupMembersDeletePromised = async function (agent, userId, groupId, memberId) {
    return _groupMembersDeletePromised(agent, userId, groupId, memberId, 200);
};

const _groupMembersTopicsListPromised = async function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/members/topics'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .get(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupMembersTopicsListPromised = async function (agent, userId, groupId) {
    return _groupMembersTopicsListPromised(agent, userId, groupId, 200);
};

module.exports.create = groupCreate;
module.exports.createPromised = groupCreatePromised;
module.exports.deletePromised = groupDeletePromised;
module.exports.membersCreate = groupMembersCreate;
module.exports.membersCreatePromised = groupMembersCreatePromised;
module.exports.membersUpdate = groupMembersUpdate;
module.exports.membersUpdatePromised = groupMembersUpdatePromised;
module.exports.membersDelete = groupMembersDelete;
module.exports.membersDeletePromised = groupMembersDeletePromised;

const assert = require('chai').assert;
const request = require('supertest');
const app = require('../../app');
const models = app.get('models');
const db = models.sequelize;
const cosUtil = app.get('util');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const topicLib = require('./topic');

const User = models.User;
const Group = models.Group;
const GroupMember = models.GroupMember;
const TopicMemberUser = models.TopicMemberUser;
const TopicMemberGroup = models.TopicMemberGroup;
const GroupInviteUser = models.GroupInviteUser;

suite('Users', function () {

    suiteSetup(async function () {
        return shared
            .syncDb();
    });

    suite('Groups', function () {

        suite('Create', function () {
            let agent = request.agent(app);
            let email = 'test_groupc_' + new Date().getTime() + '@test.ee';
            let password = 'testPassword123';
            let groupName = 'Test GROUP for masses';

            let user;

            suiteSetup(async function () {
                user = await userLib.createUserAndLoginPromised(agent, email, password, null);
            });

            test('Success', async function () {
                const group = (await groupCreatePromised(agent, user.id, groupName, null, null)).body.data;
                assert.property(group, 'id');
                assert.equal(group.creator.id, user.id);
                assert.equal(group.name, groupName);
                assert.isNull(group.parentId);
            });

            test('Success - non-default visibility', async function () {
                const group = (await groupCreatePromised(agent, user.id, groupName, null, Group.VISIBILITY.public)).body.data;
                assert.property(group, 'id');
                assert.equal(group.creator.id, user.id);
                assert.equal(group.name, groupName);
                assert.equal(group.visibility, Group.VISIBILITY.public);
                assert.isNull(group.parentId);
            });


            test('Fail - Unauthorized', async function () {
                const expectedStatus = {
                    code: 40100,
                    message: 'Unauthorized'
                };
                const err = (await _groupCreatePromised(request.agent(app), user.id, groupName, null, null, 401)).body;

                assert.deepEqual(err.status, expectedStatus);
            });

            test('Fail - Bad Request - name is NULL', async function () {
                const errors = (await _groupCreatePromised(agent, user.id, null, null, null, 400)).body.errors;
                assert.property(errors, 'name');
                assert.equal(errors.name, 'Group.name cannot be null');
            });

            test('Fail - Bad Request - name is empty', async function () {
                const errors = (await _groupCreatePromised(agent, user.id, '   ', null, null, 400)).body.errors;
                assert.property(errors, 'name');
                assert.equal(errors.name, 'Group name can be 2 to 255 characters long.');
            });

            suiteTeardown(async function () {
                return Group // Remove all public groups so that public test would be accurate
                    .destroy({
                        where: {
                            visibility: Group.VISIBILITY.public
                        }
                    });
            });
        });

        suite('Read', function () {
            const agent = request.agent(app);
            const email = 'test_groupr_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            const groupName = 'Test GROUP for masses to read';

            let user, group;

            suiteSetup(async function () {
                user = await userLib.createUserAndLoginPromised(agent, email, password, null);
                group = (await groupCreatePromised(agent, user.id, groupName, null, null)).body.data;
            });

            test('Success', async function () {
                const groupRead = (await groupReadPromised(agent, user.id, group.id)).body.data;

                var expected = {
                    id: group.id,
                    parent: {
                        id: null
                    },
                    name: group.name,
                    visibility: Group.VISIBILITY.private,
                    creator: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        createdAt: JSON.parse(JSON.stringify(user.createdAt)) // In User object the "createdAt" is Date object so to get valid string we stringify and then parse
                    },
                    members: {
                        count: 1
                    }
                };

                assert.deepEqual(groupRead, expected);
            });

            test('Fail - Forbidden - at least read permission required', async function () {
                const agent = request.agent(app);
                const email = 'test_grouprf_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                const user2 = await userLib.createUserAndLoginPromised(agent, email, password, null);
                const res = await _groupReadPromised(agent, user2.id, group.id, 403);
                const expectedStatus = {
                    code: 40300,
                    message: "Insufficient permissions"
                };

                assert.deepEqual(res.body.status, expectedStatus);
            });

        });

        suite('Update', function () {
            const agent = request.agent(app);
            const email = 'test_groupu_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            const groupName = 'Test GROUP for masses before change';
            const groupNameNew = 'Test GROUP for masses after change';

            let user, group;

            suiteSetup(async function () {
                user = await userLib.createUserAndLoginPromised(agent, email, password, null);
                group = (await groupCreatePromised(agent, user.id, groupName, null, null,)).body.data;
            });

            test('Success', async function () {
                const returnedGroup = (await groupUpdatePromised(agent, user.id, group.id, groupNameNew, null)).body.data;

                assert.equal(returnedGroup.name, groupNameNew);
                assert.equal(returnedGroup.id, group.id);

                const expectedGroup = (await groupReadPromised(agent, user.id, group.id)).body.data;

                assert.deepEqual(returnedGroup, expectedGroup);
            });

            test('Fail - Group name cannot be null', async function () {
                const expectedError = {
                    status: {code: 40000},
                    errors: {name: 'Group.name cannot be null'}
                };
                const res = await _groupUpdatePromised(agent, user.id, group.id, null, null, 400);

                assert.equal(res.status, 400);
                assert.deepEqual(res.body, expectedError);
            });

            test('Fail - Forbidden - at least admin permission required', async function () {
                const agent = request.agent(app);
                const email = 'test_groupuf_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                const user = await userLib.createUserAndLoginPromised(agent, email, password, null);

                const res = await _groupUpdatePromised(agent, user.id, group.id, 'This we shall try', null, 403);
                assert.equal(res.status, 403);
            });

        });

        suite('Delete', function () {
            const agent = request.agent(app);
            const email = 'test_groupd_' + new Date().getTime() + '@test.ee';
            const password = 'testPassword123';
            const groupName = 'Test GROUP for masses to be deleted.';

            let user, group;

            suiteSetup(async function () {
                user = await userLib.createUserAndLoginPromised(agent, email, password, null);
                group = (await groupCreatePromised(agent, user.id, groupName, null, null)).body.data;
            });

            test('Success', async function () {
                await groupDeletePromised(agent, user.id, group.id);

                Group
                    .count({where: {id: group.id}})
                    .then(function (gcount) {
                        // Group table should not have any lines for this Group
                        assert.equal(gcount, 0);

                        // Also if Group is gone so should GroupMembers
                        return GroupMember.count({where: {groupId: group.id}});
                    })
                    .then(function (gmCount) {
                        assert.equal(gmCount, 0);
                    })
                    .catch();
            });

            test('Fail - Forbidden - at least admin permissions required', async function () {
                const agent = request.agent(app);
                const email = 'test_groupdf_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                const user = await userLib.createUserAndLoginPromised(agent, email, password, null);

                const res = await _groupDeletePromised(agent, user.id, group.id, 403);
                assert.equal(res.status, 403);
            });

        });

        suite('List', function () {
            const agentCreator = request.agent(app);
            const groupName = 'Test GROUP for masses List';

            let user, member, member2, group, topic;

            suiteSetup(async function () {
                return Promise.all(
                    [
                        userLib.createUserPromised(request.agent(app), null, null, 'et'),
                        userLib.createUserAndLoginPromised(agentCreator, null, null, null),
                        userLib.createUserPromised(request.agent(app), null, null, 'et')
                    ])
                    .then(async function (results) {
                        member = results[0];
                        user = results[1];
                        member2 = results[2];

                        group = (await groupCreatePromised(agentCreator, user.id, groupName, null, null)).body.data;

                        var members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            },
                            {
                                userId: member2.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        return Promise.all(
                            [
                                groupMembersCreatePromised(agentCreator, user.id, group.id, members),
                                topicLib.topicCreatePromised(agentCreator, user.id, null, null, null, null, null)
                            ])
                            .then(async function (results) {
                                topic = results[1].body.data;
                                var memberGroup = {
                                    groupId: group.id,
                                    level: TopicMemberGroup.LEVELS.read
                                };

                                return await topicLib.topicMemberGroupsCreatePromised(agentCreator, user.id, topic.id, memberGroup);
                            });
                    });
            });

            test('Success', async function () {
                const groupList = (await groupListPromised(agentCreator, user.id, null)).body.data;
                assert.equal(groupList.count, 1);
                assert.isArray(groupList.rows);
                assert.equal(groupList.rows.length, 1);

                const group = groupList.rows[0];
                assert.property(group, 'id');
                assert.equal(group.name, groupName);
                assert.isNull(group.parent.id);

                const creator = group.creator;
                assert.equal(creator.id, user.id);
                assert.equal(creator.name, user.name);
                assert.equal(creator.email, user.email);

                const permission = group.permission;
                assert.equal(permission.level, GroupMember.LEVELS.admin); // Creator has Admin permission.

                const members = group.members;
                assert.equal(members.users.count, 3);

                const topics = group.members.topics;
                assert.equal(topics.count, 1);
                assert.equal(topics.latest.id, topic.id);
                assert.equal(topics.latest.title, topic.title);
            });

            test('Success - non-authenticated User - show "public" Groups', async function () {
                const groupName2 = 'Test group 2';

                const group2 = (await groupCreatePromised(agentCreator, user.id, groupName2, null, Group.VISIBILITY.public)).body.data;
                assert.property(group2, 'id');
                assert.equal(group2.creator.id, user.id);
                assert.equal(group2.name, groupName2);
                assert.isNull(group2.parentId);

                const groupList = (await groupsListUnauthPromised(request.agent(app), null, null, null, null, null)).body.data;

                assert.equal(groupList.count, 1);
                assert.isArray(groupList.rows);
                assert.equal(groupList.rows.length, 1);

                const group = groupList.rows[0];
                assert.property(group, 'id');
                assert.equal(group.name, groupName2);
                assert.isNull(group.parentId);

                const creator = group.creator;
                assert.equal(creator.id, user.id);
                assert.equal(creator.name, user.name);
            });

            test('Success - non-authenticated User - show "public" Groups with sourcePartnerId', async function () {
                const topicList = (await groupsListUnauthPromised(agentCreator, null, null, null, null, '4b511ad1-5b20-4c13-a6da-0b95d07b6900')).body.data;
                const topicListRow = topicList.rows;
                assert.property(topicList, 'countTotal');
                assert.equal(topicList.count, topicListRow.length);
                assert.equal(topicListRow.length, 0);
            });

            test('Success - include users and topics', async function () {
                const groupList = (await groupListPromised(agentCreator, user.id, ['member.user', 'member.topic'])).body.data;
                assert.equal(groupList.count, 2);

                groupList.rows.forEach(function (memberGroup) {
                    assert.isAbove(memberGroup.members.users.count, 0);
                    assert.equal(memberGroup.members.users.count, memberGroup.members.users.rows.length);
                    if (group.id === memberGroup.id) {
                        assert.isAbove(memberGroup.members.topics.count, 0);
                    } else {
                        assert.equal(memberGroup.members.topics.count, 0);
                    }
                    assert.equal(memberGroup.members.topics.count, memberGroup.members.topics.rows.length);
                });
            });

            test('Success - include only users', async function () {
                const groupList = (await groupListPromised(agentCreator, user.id, 'member.user')).body.data;

                groupList.rows.forEach(function (group) {
                    assert.isAbove(group.members.users.count, 0);
                    assert.equal(group.members.users.count, group.members.users.rows.length);
                    assert.notProperty(group.members.topics, 'rows');
                });
            });

            test('Success - include only topics', async function () {
                const groupList = (await groupListPromised(agentCreator, user.id, 'member.topic')).body.data;
                assert.equal(groupList.count, 2);
                assert.equal(groupList.rows.length, 2);
                groupList.rows.forEach(function (memberGroup) {
                    if (group.id === memberGroup.id) {
                        assert.isAbove(memberGroup.members.topics.count, 0);
                    } else {
                        assert.equal(memberGroup.members.topics.count, 0);
                    }
                    assert.equal(memberGroup.members.topics.count, memberGroup.members.topics.rows.length);
                    assert.notProperty(memberGroup.members.users, 'rows');
                });
            });

            test('Fail - Unauthorized', async function () {
                const res = await _groupListPromised(request.agent(app), user.id, null, 401);
                assert.equal(res.status, 401);
            });

            suiteTeardown(async function () {
                return Group // Remove all public groups so that public test would be accurate
                    .destroy({
                        where: {
                            visibility: Group.VISIBILITY.public
                        }
                    });
            });

        });

        suite('Invites', function () {

            suite('Users', function () {

                suite('Create', function () {

                    let agentCreator = request.agent(app);
                    let groupName = 'TESTCASE: Invites Create';

                    let userCreator;
                    let group;

                    setup(async function () {
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        group = (await groupCreatePromised(agentCreator, userCreator.id, groupName, null, null)).body.data;
                    });

                    test('Success - 20100 - invite a single User with userId', async function () {
                        const userToInvite = await userLib.createUserPromised(request.agent(app), null, null, null);

                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMember.LEVELS.read
                        };

                        const inviteCreateResult = (await groupInviteUsersCreatePromised(agentCreator, userCreator, group.id, invitation)).body;

                        assert.deepEqual(
                            inviteCreateResult.status,
                            {
                                code: 20100
                            }
                        );

                        assert.equal(inviteCreateResult.data.count, 1);

                        const createdInvites = inviteCreateResult.data.rows;
                        assert.isArray(createdInvites);
                        assert.equal(createdInvites.length, 1);

                        const createdInvite = createdInvites[0];
                        assert.uuid(createdInvite.id, 'v4');
                        assert.equal(createdInvite.groupId, group.id);
                        assert.equal(createdInvite.creatorId, userCreator.id);
                        assert.equal(createdInvite.userId, invitation.userId);
                        assert.equal(createdInvite.level, invitation.level);
                        assert.isNotNull(createdInvite.createdAt);
                        assert.isNotNull(createdInvite.updatedAt);
                    });

                    test('Success - 20100 - invite multiple Users - userId (uuidv4)', async function () {
                        const userToInvite = await userLib.createUserPromised(request.agent(app), null, null, null);
                        const userToInvite2 = await userLib.createUserPromised(request.agent(app), null, null, null);

                        const invitation = [
                            {
                                userId: userToInvite.id,
                                level: GroupMember.LEVELS.read
                            },
                            {
                                userId: userToInvite2.id,
                                level: GroupMember.LEVELS.admin
                            }
                        ];

                        const inviteCreateResult = (await groupInviteUsersCreatePromised(agentCreator, userCreator, group.id, invitation)).body;

                        assert.deepEqual(
                            inviteCreateResult.status,
                            {
                                code: 20100
                            }
                        );

                        assert.equal(inviteCreateResult.data.count, 2);

                        const createdInvites = inviteCreateResult.data.rows;
                        assert.isArray(createdInvites);
                        assert.equal(createdInvites.length, 2);

                        const createdInviteUser1 = createdInvites.find(function (invite) { // find by level, not by id to keep the code simpler
                            return invite.level === invitation[0].level;
                        });
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.groupId, group.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.equal(createdInviteUser1.userId, invitation[0].userId);
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        const createdInviteUser2 = createdInvites.find(function (invite) { // find by level, not by id to keep the code simpler
                            return invite.level === invitation[1].level;
                        });

                        assert.uuid(createdInviteUser2.id, 'v4');
                        assert.equal(createdInviteUser2.groupId, group.id);
                        assert.equal(createdInviteUser2.creatorId, userCreator.id);
                        assert.equal(createdInviteUser2.userId, invitation[1].userId);
                        assert.equal(createdInviteUser2.level, invitation[1].level);
                        assert.isNotNull(createdInviteUser2.createdAt);
                        assert.isNotNull(createdInviteUser2.updatedAt);
                    });

                    test('Success - 20100 - invite multiple users, 1 existing User and one not existing User - email & email', async function () {
                        const userToInvite = await userLib.createUserPromised(request.agent(app), null, null, null);
                        const invitation = [
                            {
                                userId: userToInvite.email,
                                level: GroupMember.LEVELS.read
                            },
                            {
                                userId: cosUtil.randomString() + '@invitetest.com',
                                level: GroupMember.LEVELS.admin
                            }
                        ];

                        const inviteCreateResult = (await groupInviteUsersCreatePromised(agentCreator, userCreator, group.id, invitation)).body;

                        assert.deepEqual(
                            inviteCreateResult.status,
                            {
                                code: 20100
                            }
                        );

                        assert.equal(inviteCreateResult.data.count, 2);

                        const createdInvites = inviteCreateResult.data.rows;
                        assert.isArray(createdInvites);
                        assert.equal(createdInvites.length, 2);

                        const createdInviteUser1 = createdInvites.find(function (invite) { // find by level, not by id to keep the code simpler
                            return invite.level === invitation[0].level;
                        });
                        assert.uuid(createdInviteUser1.id, 'v4');
                        assert.equal(createdInviteUser1.groupId, group.id);
                        assert.equal(createdInviteUser1.creatorId, userCreator.id);
                        assert.uuid(createdInviteUser1.userId, 'v4');
                        assert.equal(createdInviteUser1.level, invitation[0].level);
                        assert.isNotNull(createdInviteUser1.createdAt);
                        assert.isNotNull(createdInviteUser1.updatedAt);

                        const createdInviteUser2 = createdInvites.find(function (invite) { // find by level, not by id to keep the code simpler
                            return invite.level === invitation[1].level;
                        });
                        assert.uuid(createdInviteUser2.id, 'v4');
                        assert.equal(createdInviteUser2.groupId, group.id);
                        assert.equal(createdInviteUser2.creatorId, userCreator.id);
                        assert.uuid(createdInviteUser2.userId, 'v4');
                        assert.equal(createdInviteUser2.level, invitation[1].level);
                        assert.isNotNull(createdInviteUser2.createdAt);
                        assert.isNotNull(createdInviteUser2.updatedAt);
                    });

                    test('Fail - 40001 - Invite yourself', async function () {
                        const invitation = {
                            userId: userCreator.id,
                            level: GroupMember.LEVELS.read
                        };

                        const inviteCreateResult = (await _groupInviteUsersCreatePromised(agentCreator, userCreator, group.id, invitation, 400)).body;

                        const expectedBody = {
                            status: {
                                code: 40001,
                                message: 'No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.'
                            }
                        };

                        assert.deepEqual(inviteCreateResult, expectedBody);
                    });

                    test('Fail - 40001 - invite a User with invalid userId', async function () {
                        const invitation = [
                            {
                                userId: 'notAnEmailNorUserId',
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        const inviteCreateResult = (await _groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, invitation, 400)).body;

                        const expectedResponseBody = {
                            status: {
                                code: 40001,
                                message: 'No invites were created. Possibly because no valid userId-s (uuidv4s or emails) were provided.'
                            }
                        };

                        assert.deepEqual(inviteCreateResult, expectedResponseBody);
                    });

                    test('Fail - 40000 - invalid JSON in request body', async function () {
                        const expectedResponseBody = {
                            status: {
                                code: 40000,
                                message: 'Invalid JSON in request body'
                            }
                        };

                        const inviteCreateResult1 = (await _groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, '{asdasdas', 400)).body;

                        assert.deepEqual(inviteCreateResult1, expectedResponseBody);

                        const inviteCreateResult2 = (await _groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, 'PPPasdasdas', 400)).body;

                        assert.deepEqual(inviteCreateResult2, expectedResponseBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _groupInviteUsersCreatePromised(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', group.id, [], 401);
                    });

                    test('Fail - 40300 - at least admin permissions required', async function () {
                        const agentInvalidUser = request.agent(app);
                        const invalidUser = await userLib.createUserAndLoginPromised(agentInvalidUser, null, null, null);

                        // Try not being part of the group at all
                        await _groupInviteUsersCreatePromised(agentInvalidUser, invalidUser.id, group.id, [], 403);

                        // Create User with "read" level, should not be able to invite.
                        await GroupMember.create({
                            groupId: group.id,
                            userId: invalidUser.id,
                            level: GroupMember.LEVELS.read
                        });

                        // Try to invite with "read" level
                        await _groupInviteUsersCreatePromised(agentInvalidUser, invalidUser.id, group.id, [], 403);
                    });
                });

                suite('Read', function () {

                    const agentCreator = request.agent(app);
                    const agentUserToInvite = request.agent(app);

                    const groupName = 'TESTCASE: Invite Read';

                    let userCreator;
                    let userToInvite;

                    let group;
                    let groupInviteCreated;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUserAndLoginPromised(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                    });

                    setup(async function () {
                        group = (await groupCreatePromised(agentCreator, userCreator.id, groupName, null, null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMember.LEVELS.read
                        };

                        groupInviteCreated = (await groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20000', async function () {
                        const inviteRead = (await groupInviteUsersReadPromised(request.agent(app), group.id, groupInviteCreated.id)).body.data;

                        const expectedInvite = Object.assign({}, groupInviteCreated); // Clone

                        expectedInvite.group = {
                            id: group.id,
                            name: group.name,
                            creator: {
                                id: userCreator.id
                            }
                        };

                        expectedInvite.creator = {
                            company: null,
                            id: userCreator.id,
                            imageUrl: null,
                            name: userCreator.name
                        };

                        expectedInvite.user = {
                            id: userToInvite.id,
                            email: cosUtil.emailToMaskedEmail(userToInvite.email)
                        };

                        assert.deepEqual(inviteRead, expectedInvite);
                    });

                    // I invite has been accepted (deleted, but User has access)
                    // test('Success - 20001', async function () {
                    //     const topicMemberUser = (await topicInviteUsersAcceptPromised(agentUserToInvite, userToInvite.id, group.id, groupInviteCreated.id)).body.data;
                    //
                    //     assert.equal(topicMemberUser.topicId, group.id);
                    //     assert.equal(topicMemberUser.userId, userToInvite.id);
                    //     assert.equal(topicMemberUser.level, groupInviteCreated.level);
                    //     assert.property(topicMemberUser, 'createdAt');
                    //     assert.property(topicMemberUser, 'updatedAt');
                    //     assert.property(topicMemberUser, 'deletedAt');
                    //
                    //     const inviteReadResult = (await topicInviteUsersReadPromised(request.agent(app), group.id, groupInviteCreated.id)).body;
                    //     const expectedInvite = Object.assign({}, groupInviteCreated);
                    //
                    //     // Accepting the invite changes "updatedAt", thus these are not the same. Verify that the "updatedAt" exists and remove from expected and actual
                    //     assert.property(inviteReadResult.data, 'updatedAt');
                    //     delete inviteReadResult.data.updatedAt;
                    //     delete expectedInvite.updatedAt;
                    //
                    //     expectedInvite.topic = {
                    //         id: group.id,
                    //         title: group.title,
                    //         visibility: group.visibility,
                    //         creator: {
                    //             id: userCreator.id
                    //         }
                    //     };
                    //
                    //     expectedInvite.creator = {
                    //         company: null,
                    //         id: userCreator.id,
                    //         imageUrl: null,
                    //         name: userCreator.name
                    //     };
                    //
                    //     expectedInvite.user = {
                    //         id: userToInvite.id,
                    //         email: cosUtil.emailToMaskedEmail(userToInvite.email)
                    //     };
                    //
                    //     const expectedInviteResult = {
                    //         status: {
                    //             code: 20001
                    //         },
                    //         data: expectedInvite
                    //     };
                    //
                    //     assert.deepEqual(inviteReadResult, expectedInviteResult);
                    // });


                    test('Fail - 40400 - Not found', async function () {
                        await _groupInviteUsersReadPromised(request.agent(app), group.id, 'f4bb46b9-87a1-4ae4-b6df-c2605ab8c471', 404);
                    });

                    test('Fail - 41001 - Deleted', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMember.LEVELS.read
                        };

                        let groupInviteCreated = (await groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];

                        await GroupInviteUser
                            .destroy({
                                where: {
                                    id: groupInviteCreated.id
                                }
                            });

                        const groupInviteRead = (await _groupInviteUsersReadPromised(request.agent(app), group.id, groupInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41001,
                                message: 'The invite has been deleted'
                            }
                        };

                        assert.deepEqual(groupInviteRead, expectedBody);
                    });

                    test('Fail - 41002 - Expired', async function () {
                        await GroupInviteUser
                            .update(
                                {
                                    createdAt: db.literal(`NOW() - INTERVAL '${GroupInviteUser.VALID_DAYS + 1}d'`)
                                },
                                {
                                    where: {
                                        id: groupInviteCreated.id
                                    }
                                }
                            );

                        const groupInviteRead = (await _groupInviteUsersReadPromised(request.agent(app), group.id, groupInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41002,
                                message: `The invite has expired. Invites are valid for ${GroupInviteUser.VALID_DAYS} days`
                            }
                        };

                        assert.deepEqual(groupInviteRead, expectedBody);

                    });

                });

                suite('List', function () {

                    const agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite1;
                    let userToInvite2;

                    let group;

                    let groupInviteCreated1;
                    let groupInviteCreated2;

                    setup(async function () {
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        userToInvite1 = await userLib.createUserPromised(request.agent(app), null, null, null);
                        userToInvite2 = await userLib.createUserPromised(request.agent(app), null, null, null);

                        group = (await groupCreatePromised(agentCreator, userCreator.id, 'TEST CASE: User Invites List', null, null)).body.data;

                        const groupInvite1 = {
                            userId: userToInvite1.id,
                            level: GroupMember.LEVELS.read
                        };

                        const groupInvite2 = {
                            userId: userToInvite2.id,
                            level: GroupMember.LEVELS.admin
                        };

                        groupInviteCreated1 = (await groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, groupInvite1)).body.data.rows[0];
                        groupInviteCreated2 = (await groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, groupInvite2)).body.data.rows[0];
                    });

                    test('Success - 20000 - list invites', async function () {
                        const invitesListResult = (await groupInviteUsersListPromised(agentCreator, userCreator.id, group.id)).body.data;
                        assert.equal(2, invitesListResult.count);

                        const invitesList = invitesListResult.rows;
                        assert.isArray(invitesList);
                        assert.equal(2, invitesList.length);

                        const inviteListInvite1 = invitesList.find(invite => {
                            return invite.id === groupInviteCreated1.id
                        });

                        const inviteListInviteUser1 = inviteListInvite1.user;
                        assert.equal(inviteListInviteUser1.id, userToInvite1.id);
                        assert.equal(inviteListInviteUser1.name, userToInvite1.name);
                        assert.property(inviteListInviteUser1, 'imageUrl');
                        delete inviteListInvite1.user;
                        assert.deepEqual(inviteListInvite1, groupInviteCreated1);

                        // The list result has User object, otherwise the objects should be equal
                        const inviteListInvite2 = invitesList.find(invite => {
                            return invite.id === groupInviteCreated2.id
                        });
                        const inviteListInviteUser2 = inviteListInvite2.user;
                        assert.equal(inviteListInviteUser2.id, userToInvite2.id);
                        assert.equal(inviteListInviteUser2.name, userToInvite2.name);
                        assert.property(inviteListInviteUser2, 'imageUrl');
                        delete inviteListInvite2.user;
                        assert.deepEqual(inviteListInvite2, groupInviteCreated2);
                    });

                    test('Success - 20000 - list duplicate invites', async function () {
                        // Second invite to User 1
                        const groupInvite12 = {
                            userId: userToInvite1.id,
                            level: GroupMember.LEVELS.admin
                        };

                        const groupInviteCreated12 = (await groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, groupInvite12)).body.data.rows[0];

                        const invitesListResult = (await groupInviteUsersListPromised(agentCreator, userCreator.id, group.id)).body.data;

                        const invitesList = invitesListResult.rows;
                        assert.isArray(invitesList);
                        assert.equal(3, invitesList.length);

                        const originalInvite = invitesList.find(invite => {
                            return invite.id === groupInviteCreated1.id
                        });
                        assert.isObject(originalInvite);
                        assert.equal(originalInvite.level, groupInviteCreated1.level);

                        const duplicateInvite = invitesList.find(invite => {
                           return invite.id === groupInviteCreated12.id
                        });
                        assert.isObject(duplicateInvite);
                        assert.equal(duplicateInvite.level, groupInviteCreated12.level);

                    });

                    test('Success - 20000 - do not list expired invites', async function () {
                        // Expire first invite
                        await GroupInviteUser
                            .update(
                                {
                                    createdAt: db.literal(`NOW() - INTERVAL '${GroupInviteUser.VALID_DAYS + 1}d'`)
                                },
                                {
                                    where: {
                                        id: groupInviteCreated1.id
                                    }
                                }
                            );

                        const invitesListResult = (await groupInviteUsersListPromised(agentCreator, userCreator.id, group.id)).body.data;
                        assert.equal(1, invitesListResult.count);

                        const invitesList = invitesListResult.rows;
                        const inviteListInvite1 = invitesList.find(invite => {
                            return invite.id === groupInviteCreated1.id;
                        });
                        assert.isUndefined(inviteListInvite1);
                    });

                    test('Success - 20000 - do not list deleted invites', async function () {
                        // Delete second invite
                        await GroupInviteUser
                            .destroy(
                                {
                                    where: {
                                        id: groupInviteCreated2.id
                                    }
                                }
                            );

                        const invitesListResult = (await groupInviteUsersListPromised(agentCreator, userCreator.id, group.id)).body.data;
                        assert.equal(1, invitesListResult.count);

                        const invitesList = invitesListResult.rows;
                        const inviteListInvite2 = invitesList.find(invite => {
                            return invite.id === groupInviteCreated2.id;
                        });
                        assert.isUndefined(inviteListInvite2);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _groupInviteUsersListPromised(request.agent(app), '93857ed7-a81a-4187-85de-234f6d06b011', group.id, 401);
                    });

                    test('Fail - 40300 - at least read permissions required', async function () {
                        await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        await _groupInviteUsersListPromised(agentCreator, userCreator.id, group.id, 403);
                    });

                });

                suite('Delete', function () {

                    const agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let group;
                    let groupInviteCreated;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUserPromised(request.agent(app), null, null, null);
                        userCreator = await userLib.createUserAndLoginPromised(agentCreator, null, null, null);
                        group = (await groupCreatePromised(agentCreator, userCreator.id, 'TEST CASE: User Invites Delete', null, null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMember.LEVELS.read
                        };

                        groupInviteCreated = (await groupInviteUsersCreatePromised(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20000', async function () {
                        const userDeleteResult = (await groupInviteUsersDeletePromised(agentCreator, userCreator.id, group.id, groupInviteCreated.id)).body;

                        const expectedBody = {
                            status: {
                                code: 20000
                            }
                        };

                        assert.deepEqual(userDeleteResult, expectedBody);

                        const topicInvite = await GroupInviteUser
                            .findOne({
                                where: {
                                    id: groupInviteCreated.id,
                                    groupId: group.id
                                },
                                paranoid: false
                            });

                        assert.isNotNull(topicInvite, 'deletedAt');
                    });

                    test('Fail - 40401 - Invite not found', async function () {
                        const userDeleteResult = (await _groupInviteUsersDeletePromised(agentCreator, userCreator.id, group.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 404)).body;

                        const expectedBody = {
                            status: {
                                code: 40401,
                                message: 'Invite not found'
                            }
                        };

                        assert.deepEqual(userDeleteResult, expectedBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _groupInviteUsersDeletePromised(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', group.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 401);
                    });

                    test('Fail - 40300 - at least admin permissions required', async function () {
                        const agentInvalidUser = request.agent(app);
                        const invalidUser = await userLib.createUserAndLoginPromised(agentInvalidUser, null, null, null);

                        await _groupInviteUsersDeletePromised(agentInvalidUser, invalidUser.id, group.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 403);
                    });

                });

            });

        });

        suite('Members', function () {

            suite('Users', function () {

                suite('Create', function () {
                    const agent = request.agent(app);
                    let creator, member, group;

                    setup(async function () {
                        member = await userLib.createUserPromised(agent, null, null, null);
                        creator = await userLib.createUserAndLoginPromised(agent, null, null, null);
                        group = (await groupCreatePromised(agent, creator.id, 'Test Group add members', null, null)).body.data;
                    });

                    test('Success - add member with User id', async function () {
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);

                        const groupRead = (await groupReadPromised(agent, creator.id, group.id)).body.data;

                        assert.equal(groupRead.id, group.id);
                        assert.equal(groupRead.members.count, 2);
                    });

                    test('Success - add same member with User id twice', async function () {
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];
                        await groupMembersCreatePromised(agent, creator.id, group.id, members);

                        // Change Member level
                        const addedMember = members[0];
                        addedMember.level = GroupMember.LEVELS.admin;

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);

                        return GroupMember
                            .findOne({
                                where: {
                                    groupId: group.id,
                                    userId: addedMember.userId
                                }
                            })
                            .then(function (member) {
                                // No changing level! https://trello.com/c/lWnvvPq5/47-bug-invite-members-can-create-a-situation-where-0-admin-members-remain-for-a-topic
                                assert.notEqual(member.level, addedMember.level);
                            })
                    });

                    test('Success - add members with User id and e-mail', async function () {
                        const members = [
                            {
                                userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists@test.com',
                                level: GroupMember.LEVELS.admin
                            },
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);
                        const groupRead = (await groupReadPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(groupRead.id, group.id);
                        assert.equal(groupRead.members.count, 3);
                    });

                    test('Success - add member with e-mail and level and language', async function () {
                        const members = [
                            {
                                userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists@test.com',
                                level: GroupMember.LEVELS.admin,
                                language: 'et'
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);

                        const groupRead = (await groupReadPromised(agent, creator.id, group.id)).body.data;

                        assert.equal(groupRead.id, group.id);
                        assert.equal(groupRead.members.count, 2);

                        // Verify that the User was created in expected language
                        return User
                            .findOne({
                                where: {
                                    email: db.where(db.fn('lower', db.col('email')), db.fn('lower', members[0].userId))
                                }
                            })
                            .then(function (user) {
                                assert.equal(user.language, members[0].language);
                            });
                    });

                    test('Success - add member with e-mail only - level should default to "read"', async function () {
                        const members = [
                            {
                                userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists@test.com'
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);
                        const groupRead = (await groupReadPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(groupRead.id, group.id);
                        assert.equal(groupRead.members.count, 2);
                    });

                    test('Success - add member, remove and add the same member back again', async function () {
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);
                        await groupMembersDeletePromised(agent, creator.id, group.id, member.id);
                        const res = await groupMembersCreatePromised(agent, creator.id, group.id, members);
                        assert.equal(res.status, 201);
                    });


                    test('Fail - Forbidden - at least admin permissions required', async function () {
                        const agent = request.agent(app);
                        const email = 'test_groupdf_' + new Date().getTime() + '@test.ee';
                        const password = 'testPassword123';

                        const members = [
                            {
                                userId: 'adsads', // Foobar is OK as validation is before insert..
                                level: GroupMember.LEVELS.admin
                            }
                        ];

                        const user = await userLib.createUserAndLoginPromised(agent, email, password, null);

                        const res = await _groupMembersCreatePromised(agent, user.id, group.id, members, 403);
                        assert.equal(res.status, 403);
                    });

                });

                suite('List', function () {

                    test.skip('Success', function () {
                        // TODO: Implement member list tests
                        return;
                    });

                });

                suite('Update', function () {

                    const agent = request.agent(app);
                    const creatorEmail = 'test_gmembersgu_c_' + new Date().getTime() + '@test.ee';
                    const creatorPassword = 'testPassword123';

                    const memberEmail = 'test_gmembersgu_m_' + new Date().getTime() + '@test.ee';
                    const memberPassword = 'testPassword123';

                    let creator, member, group;

                    suiteSetup(async function () {
                        member = await userLib.createUserPromised(agent, memberEmail, memberPassword, null);

                        creator = await userLib.createUserAndLoginPromised(agent, creatorEmail, creatorPassword, null);
                        group = (await groupCreatePromised(agent, creator.id, 'Test Group edit members', null, null)).body.data;

                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);
                    });

                    test('Success', async function () {
                        await groupMembersUpdatePromised(agent, creator.id, group.id, member.id, GroupMember.LEVELS.admin);

                        return GroupMember
                            .findOne({
                                where: {
                                    groupId: group.id,
                                    userId: member.id
                                }
                            })
                            .then(function (gm) {
                                assert.equal(gm.userId, member.id);
                                assert.equal(gm.level, GroupMember.LEVELS.admin);
                            });
                    });

                    test('Fail - Forbidden - must have at least admin level to edit member permissions', async function () {
                        const agent = request.agent(app);
                        const email = 'test_gmembersuf_' + new Date().getTime() + '@test.ee';
                        const password = 'testPassword123';

                        const user = await userLib.createUserAndLoginPromised(agent, email, password, null);
                        await _groupMembersUpdatePromised(agent, user.id, group.id, member.id, GroupMember.LEVELS.read, 403);
                    });


                    test('Fail - Bad Request - cannot revoke admin permissions from the last admin user', async function () {
                        const g = (await groupCreatePromised(agent, creator.id, 'Test Group edit members fail', null, null)).body.data;

                        // Add one non-admin member just to mix the water a bit...
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, g.id, members);

                        // Creator tries to degrade his own permissions while being the last admin user
                        await _groupMembersUpdatePromised(agent, creator.id, g.id, creator.id, GroupMember.LEVELS.read, 400);
                    });
                });

                suite('Delete', function () {
                    const agent = request.agent(app);
                    const creatorEmail = 'test_gmembersgd_c_' + new Date().getTime() + '@test.ee';
                    const creatorPassword = 'testPassword123';

                    const memberEmail = 'test_gmembersgd_m_' + new Date().getTime() + '@test.ee';
                    const memberPassword = 'testPassword123';

                    let creator, member, group;

                    suiteSetup(async function () {
                        member = await userLib.createUserPromised(agent, memberEmail, memberPassword, null);
                        creator = await userLib.createUserAndLoginPromised(agent, creatorEmail, creatorPassword, null);
                        group = (await groupCreatePromised(agent, creator.id, 'Test Group add members', null, null)).body.data;
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);
                        const res = (await groupReadPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(res.members.count, 2);
                        return;
                    });

                    test('Success', async function () {
                        await groupMembersDeletePromised(agent, creator.id, group.id, member.id);
                        const groupRead = (await groupReadPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(groupRead.members.count, 1);
                    });

                    test('Success - Member leaves group', async function () {
                        const deleteAgent = request.agent(app);
                        const deleteMemberEmail = 'test_gmembersgd_m2_' + new Date().getTime() + '@test.ee';
                        const deleteMemberPassword = 'testPassword123';

                        const deleteMember = await userLib.createUserAndLoginPromised(deleteAgent, deleteMemberEmail, deleteMemberPassword, null)
                        const members = [
                            {
                                userId: deleteMember.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);
                        const readGroup1 = (await groupReadPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(readGroup1.members.count, 2);

                        await groupMembersDeletePromised(deleteAgent, deleteMember.id, group.id, deleteMember.id);
                        const readGroup2 = (await groupReadPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(readGroup2.members.count, 1);

                        for (var i = 0; i < readGroup2.members.length; i++) {
                            assert.notEqual(readGroup2.members[i].id, deleteMember.id);
                        }
                    });

                    test('Fail - Forbidden - at least admin permissions required', async function () {
                        const agent = request.agent(app);
                        const email = 'test_gmembersdf_' + new Date().getTime() + '@test.ee';
                        const password = 'testPassword123';

                        const user = await userLib.createUserAndLoginPromised(agent, email, password, null);

                        await _groupMembersDeletePromised(agent, user.id, group.id, member.id, 403);
                    });


                    test('Fail - Bad Request - Cannot delete the last admin member', async function () {
                        const g = (await groupCreatePromised(agent, creator.id, 'Test Group delete members fail', null, null)).body.data;

                        // Add one non-admin member just to mix the water a bit...
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, g.id, members);
                        // Creator tries to degrade his own permissions while being the last admin user
                        await _groupMembersDeletePromised(agent, creator.id, g.id, creator.id, 400);
                        // Be the error what it is, the member count must remain the same
                        const groupRead = (await groupReadPromised(agent, creator.id, g.id)).body.data;
                        assert.equal(groupRead.members.count, 2);
                    });
                });

            });

            suite('Topics', function () {

                suite('List', function () {

                    const agent = request.agent(app);

                    const creatorEmail = 'test_gmemberstopicsgd_c_' + new Date().getTime() + '@test.ee';
                    const creatorPassword = 'testPassword123';

                    let creator, group;

                    suiteSetup(async function () {
                        creator = await userLib.createUserAndLoginPromised(agent, creatorEmail, creatorPassword, null);

                        group = (await groupCreatePromised(agent, creator.id, 'Test Group list member topics', null, null)).body.data;
                        const topicCreated = (await topicLib.topicCreatePromised(agent, creator.id, null, null, null, '<!DOCTYPE HTML><html><body><h1>H1</h1></body></html>', null)).body.data;
                        const memberGroup = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.edit
                        };
                        await topicLib.topicMemberGroupsCreatePromised(agent, creator.id, topicCreated.id, memberGroup);
                    });


                    test('Success', async function () {
                        const topicsList = (await groupMembersTopicsListPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(topicsList.rows.length, 1);

                        const groupMemberTopic = topicsList.rows[0];

                        assert.isNotNull(groupMemberTopic.id);
                        assert.isNotNull(groupMemberTopic.title);

                        const creatorExpected = creator.toJSON();
                        delete creatorExpected.email;
                        delete creatorExpected.language;
                        assert.deepEqual(groupMemberTopic.creator, creatorExpected);

                        assert.equal(groupMemberTopic.permission.level, TopicMemberUser.LEVELS.admin);
                        assert.equal(groupMemberTopic.permission.levelGroup, TopicMemberGroup.LEVELS.edit);

                    });

                });

                suite('Delete', function () {
                    const agent = request.agent(app);

                    const creatorEmail = 'test_gmembersgd_c__' + new Date().getTime() + '@test.ee';
                    const creatorPassword = 'testPassword123';

                    const memberEmail = 'test_gmembersgd_m__' + new Date().getTime() + '@test.ee';
                    const memberPassword = 'testPassword123';

                    let creator, member, group;

                    suiteSetup(async function () {
                        member = await userLib.createUserPromised(agent, memberEmail, memberPassword, null);
                        creator = await userLib.createUserAndLoginPromised(agent, creatorEmail, creatorPassword, null);
                        group = (await groupCreatePromised(agent, creator.id, 'Test Group add members', null, null)).body.data;
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        await groupMembersCreatePromised(agent, creator.id, group.id, members);
                        const groupRead = (await groupReadPromised(agent, creator.id, group.id)).body.data;
                        assert.equal(groupRead.members.count, 2);
                        return;
                    });

                    test('Success - Remove Topic from Group after Topic delete', async function () {
                        const topic = (await topicLib.topicCreatePromised(agent, member.id, null, null, null, null, null)).body.data;
                        const memberGroup = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.read
                        };
                        await topicLib.topicMemberGroupsCreatePromised(agent, member.id, topic.id, memberGroup);
                        const groupData = (await groupListPromised(agent, member.id, null)).body.data;
                        assert.equal(groupData.rows[0].members.topics.count, 1);
                        await topicLib.topicDeletePromised(agent, member.id, topic.id);
                        const groupData2 = (await groupListPromised(agent, member.id, null)).body.data;
                        assert.equal(groupData2.rows[0].members.topics.count, 0);
                    });

                });

            });

        });

    });

});
