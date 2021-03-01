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

var _groupMembersCreate = function (agent, userId, groupId, members, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId/members'
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
    const path = '/api/users/:userId/groups/:groupId/members'
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
    var path = '/api/users/:userId/groups/:groupId/members/:memberId'
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
    const path = '/api/users/:userId/groups/:groupId/members/:memberId'
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
    var path = '/api/users/:userId/groups/:groupId/members/:memberId'
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
    const path = '/api/users/:userId/groups/:groupId/members/:memberId'
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

var assert = require('chai').assert;
var request = require('supertest');
var app = require('../../app');
var models = app.get('models');
const db = models.sequelize;

var shared = require('../utils/shared');
var userLib = require('./lib/user')(app);
var topicLib = require('./topic');

var User = models.User;
var Group = models.Group;
var GroupMember = models.GroupMember;
var TopicMemberUser = models.TopicMemberUser;

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
                                    level: TopicMemberUser.LEVELS.read
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
                    let groupName = 'Test GROUP for masses';

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
                            level: TopicMemberUser.LEVELS.read
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
                            level: TopicMemberUser.LEVELS.edit
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
                        assert.equal(groupMemberTopic.permission.levelGroup, TopicMemberUser.LEVELS.edit);

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
                            level: TopicMemberUser.LEVELS.read
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
