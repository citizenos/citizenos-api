'use strict';

const _groupCreate = async function (agent, userId, name, parentId, visibility, expectedHttpCode) {
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

const groupCreate = async function (agent, userId, name, parentId, visibility) {
    return _groupCreate(agent, userId, name, parentId, visibility, 201);
};

const _groupRead = async function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupRead = async function (agent, userId, groupId) {
    return _groupRead(agent, userId, groupId, 200);
};

const _groupUpdate = async function (agent, userId, groupId, name, parentId, expectedHttpCode) {
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

const groupUpdate = async function (agent, userId, groupId, name, parentId) {
    return _groupUpdate(agent, userId, groupId, name, parentId, 200);
};

const _groupDelete = async function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupDelete = async function (agent, userId, groupId) {
    return _groupDelete(agent, userId, groupId, 200);
};

const _groupList = async function (agent, userId, include, expectedHttpCode) {
    const path = '/api/users/:userId/groups'.replace(':userId', userId);

    return agent
        .get(path)
        .query({include: include})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupList = async function (agent, userId, include) {
    return _groupList(agent, userId, include, 200);
};

const _groupsListUnauth = async function (agent, statuses, orderBy, offset, limit, sourcePartnerId, expectedHttpCode) {
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

const groupsListUnauth = async function (agent, status, orderBy, offset, limit, sourcePartnerId) {
    return _groupsListUnauth(agent, status, orderBy, offset, limit, sourcePartnerId, 200);
};

const _groupInviteUsersCreate = async function (agent, userId, groupId, invites, expectedHttpCode) {
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

const groupInviteUsersCreate = async function (agent, userId, groupId, invites) {
    return _groupInviteUsersCreate(agent, userId, groupId, invites, 201);
};

const _groupInviteUsersRead = async function (agent, groupId, inviteId, expectedHttpCode) {
    const path = '/api/groups/:groupId/invites/users/:inviteId'
        .replace(':groupId', groupId)
        .replace(':inviteId', inviteId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupInviteUsersRead = async function (agent, groupId, inviteId) {
    return _groupInviteUsersRead(agent, groupId, inviteId, 200);
};

const _groupInviteUsersList = function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/invites/users'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupInviteUsersList = async function (agent, userId, groupId) {
    return _groupInviteUsersList(agent, userId, groupId, 200);
};

const _groupInviteUsersDelete = async function (agent, userId, groupId, inviteId, expectedHttpCode) {
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

const groupInviteUsersDelete = async function (agent, userId, groupId, inviteId) {
    return _groupInviteUsersDelete(agent, userId, groupId, inviteId, 200);
};

const _groupInviteUsersAccept = async function (agent, userId, groupId, inviteId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/invites/users/:inviteId/accept'
        .replace(':userId', userId)
        .replace(':groupId', groupId)
        .replace(':inviteId', inviteId);

    return agent
        .post(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupInviteUsersAccept = async function (agent, userId, groupId, inviteId) {
    return _groupInviteUsersAccept(agent, userId, groupId, inviteId, 201);
};

const _groupMemberUsersList = async function (agent, userId, groupId, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/members/users'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupMemberUsersList = async function (agent, userId, groupId) {
    return _groupMemberUsersList(agent, userId, groupId, 200);
};

const _groupMemberUsersUpdate = async function (agent, userId, groupId, memberId, level, expectedHttpCode) {
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

const groupMemberUsersUpdate = async function (agent, userId, groupId, memberId, level) {
    return _groupMemberUsersUpdate(agent, userId, groupId, memberId, level, 200);
};

const _groupMemberUsersDelete = async function (agent, userId, groupId, memberId, expectedHttpCode) {
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

const groupMemberUsersDelete = async function (agent, userId, groupId, memberId) {
    return _groupMemberUsersDelete(agent, userId, groupId, memberId, 200);
};

const _groupMembersTopicsList = async function (agent, userId, groupId, offset, limit, statuses, visibility, creatorId, pinned, hasVoted, showModerated, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/members/topics'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .get(path)
        .query({
            offset,
            limit,
            statuses,
            visibility,
            creatorId,
            pinned,
            hasVoted,
            showModerated,

        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupMembersTopicsList = async function (agent, userId, groupId, offset, limit, statuses, visibility, creatorId, pinned, hasVoted, showModerated) {
    return _groupMembersTopicsList(agent, userId, groupId, offset, limit, statuses, visibility, creatorId, pinned, hasVoted, showModerated, 200);
};

const _groupUpdateTokenJoin = async function (agent, userId, groupId, level, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/join'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            level: level
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupUpdateTokenJoin = async function (agent, userId, groupId, level) {
    return _groupUpdateTokenJoin(agent, userId, groupId, level, 200);
};

const _groupUpdateTokenJoinLevel = async function (agent, userId, groupId, token, level, expectedHttpCode) {
    const path = '/api/users/:userId/groups/:groupId/join/:token'
        .replace(':userId', userId)
        .replace(':groupId', groupId)
        .replace(':token', token);

    return agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            level: level
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupUpdateTokenJoinLevel = async function (agent, userId, groupId, token, level) {
    return _groupUpdateTokenJoinLevel(agent, userId, groupId, token, level, 200);
};

const _groupJoinJoin = async function (agent, token, expectedHttpCode) {
    const path = '/api/groups/join/:token'
        .replace(':token', token);

    return agent
        .post(path)
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/);
};

const groupJoinJoin = async function (agent, token) {
    return _groupJoinJoin(agent, token, 200);
};

module.exports.create = groupCreate;
module.exports.delete = groupDelete;
module.exports.memberUsersUpdate = groupMemberUsersUpdate;
module.exports.memberUsersDelete = groupMemberUsersDelete;

const assert = require('chai').assert;
const request = require('supertest');
const app = require('../../app');
const models = app.get('models');
const db = models.sequelize;
const cosUtil = app.get('util');

const shared = require('../utils/shared');
const userLib = require('./lib/user')(app);
const memberLib = require('./lib/members')(app);
const topicLib = require('./topic');
const activityLib = require('./activity');

const Group = models.Group;
const GroupJoin = models.GroupJoin;
const Topic = models.Topic;
const GroupMemberUser = models.GroupMemberUser;
const TopicMemberGroup = models.TopicMemberGroup;
const GroupInviteUser = models.GroupInviteUser;
const Moderator = models.Moderator;
const User = models.User;

suite('Users', function () {

    suiteSetup(async function () {
        await shared
            .syncDb();
        return Promise.resolve();
    });

    suite('Groups', function () {
        suite('Create', function () {
            let agent = request.agent(app);
            let email = 'test_groupc_' + new Date().getTime() + '@test.ee';
            let password = 'testPassword123';
            let groupName = 'Test GROUP for masses';

            let user;

            suiteSetup(async function () {
                user = await userLib.createUserAndLogin(agent, email, password, null);
            });

            test('Success', async function () {
                const group = (await groupCreate(agent, user.id, groupName, null, null)).body.data;

                assert.property(group, 'id');
                assert.equal(group.creator.id, user.id);
                assert.equal(group.name, groupName);
                assert.isNull(group.parentId);

                assert.property(group, 'join');
                assert.equal(group.join.level, GroupMemberUser.LEVELS.read);
                assert.match(group.join.token, new RegExp('^[a-zA-Z0-9]{' + GroupJoin.TOKEN_LENGTH + '}$'));
            });

            test('Success - non-default visibility', async function () {
                const group = (await groupCreate(agent, user.id, groupName, null, Group.VISIBILITY.public)).body.data;
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
                const err = (await _groupCreate(request.agent(app), user.id, groupName, null, null, 401)).body;

                assert.deepEqual(err.status, expectedStatus);
            });

            test('Fail - Bad Request - name is NULL', async function () {
                const errors = (await _groupCreate(agent, user.id, null, null, null, 400)).body.errors;
                assert.property(errors, 'name');
                assert.equal(errors.name, 'Group.name cannot be null');
            });

            test('Fail - Bad Request - name is empty', async function () {
                const errors = (await _groupCreate(agent, user.id, '   ', null, null, 400)).body.errors;
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
                user = await userLib.createUserAndLogin(agent, email, password, null);
                group = (await groupCreate(agent, user.id, groupName, null, null)).body.data;
            });

            test('Success', async function () {
                const groupR = (await groupRead(agent, user.id, group.id)).body.data;
                const groupJoin = (await GroupJoin.findOne({
                    where: {
                        groupId: group.id
                    }
                }));

                const expected = {
                    id: group.id,
                    parent: {
                        id: null
                    },
                    name: group.name,
                    description: null,
                    imageUrl: null,
                    visibility: Group.VISIBILITY.private,
                    creator: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        createdAt: JSON.parse(JSON.stringify(user.createdAt)) // In User object the "createdAt" is Date object so to get valid string we stringify and then parse
                    },
                    join: {
                        token: groupJoin.token,
                        level: groupJoin.level
                    },
                    userLevel: "admin",
                    members: {
                        count: 1
                    }
                };

                assert.deepEqual(groupR, expected);
            });

            test('Fail - Forbidden - at least read permission required', async function () {
                const agent = request.agent(app);
                const email = 'test_grouprf_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                const user2 = await userLib.createUserAndLogin(agent, email, password, null);
                const res = await _groupRead(agent, user2.id, group.id, 403);
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
                user = await userLib.createUserAndLogin(agent, email, password, null);
                group = (await groupCreate(agent, user.id, groupName, null, null,)).body.data;
            });

            test('Success', async function () {
                const returnedGroup = (await groupUpdate(agent, user.id, group.id, groupNameNew, null)).body.data;

                assert.equal(returnedGroup.name, groupNameNew);
                assert.equal(returnedGroup.id, group.id);

                const expectedGroup = (await groupRead(agent, user.id, group.id)).body.data;
                delete expectedGroup.join; // Update does not return GroupJoin info

                assert.deepEqual(returnedGroup, expectedGroup);
            });

            test('Fail - Group name cannot be null', async function () {
                const expectedError = {
                    status: {code: 40000},
                    errors: {name: 'Group.name cannot be null'}
                };
                const res = await _groupUpdate(agent, user.id, group.id, null, null, 400);

                assert.equal(res.status, 400);
                assert.deepEqual(res.body, expectedError);
            });

            test('Fail - Forbidden - at least admin permission required', async function () {
                const agent = request.agent(app);
                const email = 'test_groupuf_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                const user = await userLib.createUserAndLogin(agent, email, password, null);

                const res = await _groupUpdate(agent, user.id, group.id, 'This we shall try', null, 403);
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
                user = await userLib.createUserAndLogin(agent, email, password, null);
                group = (await groupCreate(agent, user.id, groupName, null, null)).body.data;
            });

            test('Success', async function () {
                await groupDelete(agent, user.id, group.id);

                const gcount = await Group.count({where: {id: group.id}});
                // Group table should not have any lines for this Group
                assert.equal(gcount, 0);

                // Also if Group is gone so should GroupMembers
                const gmCount = await GroupMemberUser.count({where: {groupId: group.id}});
                assert.equal(gmCount, 0);
            });

            test('Fail - Forbidden - at least admin permissions required', async function () {
                const agent = request.agent(app);
                const email = 'test_groupdf_' + new Date().getTime() + '@test.ee';
                const password = 'testPassword123';

                const user = await userLib.createUserAndLogin(agent, email, password, null);

                const res = await _groupDelete(agent, user.id, group.id, 403);
                assert.equal(res.status, 403);
            });

        });

        suite('List', function () {
            const agentCreator = request.agent(app);
            const groupName = 'Test GROUP for masses List';

            let user, member, member2, group, topic;

            suiteSetup(async function () {
                member = await userLib.createUser(request.agent(app), null, null, 'et');
                user = await userLib.createUserAndLogin(agentCreator, null, null, null);
                member2 = await userLib.createUser(request.agent(app), null, null, 'et');

                group = (await groupCreate(agentCreator, user.id, groupName, null, null)).body.data;
                const members = [
                    {
                        userId: member.id,
                        level: GroupMemberUser.LEVELS.read
                    },
                    {
                        userId: member2.id,
                        level: GroupMemberUser.LEVELS.read
                    }
                ];
                await memberLib.groupMemberUsersCreate(group.id, members);
                topic = (await topicLib.topicCreate(agentCreator, user.id, null, null, null, null, null)).body.data;

                const memberGroup = {
                    groupId: group.id,
                    level: TopicMemberGroup.LEVELS.read
                };

                return await topicLib.topicMemberGroupsCreate(agentCreator, user.id, topic.id, memberGroup);
            });

            test('Success', async function () {
                const list = (await groupList(agentCreator, user.id, null)).body.data;
                assert.equal(list.count, 1);
                assert.isArray(list.rows);
                assert.equal(list.rows.length, 1);

                const group = list.rows[0];
                assert.property(group, 'id');
                assert.equal(group.name, groupName);
                assert.isNull(group.parent.id);

                const creator = group.creator;
                assert.equal(creator.id, user.id);
                assert.equal(creator.name, user.name);
                assert.equal(creator.email, user.email);

                const permission = group.permission;
                assert.equal(permission.level, GroupMemberUser.LEVELS.admin); // Creator has Admin permission.

                const members = group.members;
                assert.equal(members.users.count, 3);

                const topics = group.members.topics;
                assert.equal(topics.count, 1);
                assert.equal(topics.latest.id, topic.id);
                assert.equal(topics.latest.title, topic.title);
            });

            test('Success - non-authenticated User - show "public" Groups', async function () {
                const groupName2 = 'Test group 2';

                const group2 = (await groupCreate(agentCreator, user.id, groupName2, null, Group.VISIBILITY.public)).body.data;
                assert.property(group2, 'id');
                assert.equal(group2.creator.id, user.id);
                assert.equal(group2.name, groupName2);
                assert.isNull(group2.parentId);

                const groupList = (await groupsListUnauth(request.agent(app), null, null, null, null, null)).body.data;
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
                const topicList = (await groupsListUnauth(agentCreator, null, null, null, null, '4b511ad1-5b20-4c13-a6da-0b95d07b6900')).body.data;
                const topicListRow = topicList.rows;
                assert.property(topicList, 'countTotal');
                assert.equal(topicList.count, topicListRow.length);
                assert.equal(topicListRow.length, 0);
            });

            test('Success - include users and topics', async function () {
                const list = (await groupList(agentCreator, user.id, ['member.user', 'member.topic'])).body.data;
                assert.equal(list.count, 2);

                list.rows.forEach(function (memberGroup) {
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
                const list = (await groupList(agentCreator, user.id, 'member.user')).body.data;

                list.rows.forEach(function (group) {
                    assert.isAbove(group.members.users.count, 0);
                    assert.equal(group.members.users.count, group.members.users.rows.length);
                    assert.notProperty(group.members.topics, 'rows');
                });
            });

            test('Success - include only topics', async function () {
                const list = (await groupList(agentCreator, user.id, 'member.topic')).body.data;
                assert.equal(list.count, 2);
                assert.equal(list.rows.length, 2);
                list.rows.forEach(function (memberGroup) {
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
                const res = await _groupList(request.agent(app), user.id, null, 401);
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
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        group = (await groupCreate(agentCreator, userCreator.id, groupName, null, null)).body.data;
                    });

                    test('Success - 20100 - invite a single User with userId', async function () {
                        const userToInvite = await userLib.createUser(request.agent(app), null, null, null);

                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        const inviteCreateResult = (await groupInviteUsersCreate(agentCreator, userCreator, group.id, invitation)).body;

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

                    test('Success - 20100 - invite a single User with non-existing e-mail', async function () {
                        await userLib.createUser(request.agent(app), null, null, null);

                        const invitation = {
                            userId: 'groupInviteTest_' + cosUtil.randomString() + '@invitetest.com',
                            level: GroupMemberUser.LEVELS.admin
                        };

                        const inviteCreateResult = (await groupInviteUsersCreate(agentCreator, userCreator, group.id, invitation)).body;

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
                        assert.equal(createdInvite.level, invitation.level);
                        assert.isNotNull(createdInvite.userId);
                        assert.isNotNull(createdInvite.createdAt);
                        assert.isNotNull(createdInvite.updatedAt);

                        // Make sure the e-mail is converted to lower-case making e-mails case-insensitive - https://github.com/citizenos/citizenos-api/issues/234
                        const userCreated = await User.findOne({
                            where: {
                                id: createdInvite.userId
                            }
                        });

                        assert.equal(userCreated.email, invitation.userId.toLowerCase());
                    });

                    test('Success - 20100 - invite multiple Users - userId (uuidv4) WITHOUT invite message', async function () {
                        const userToInvite = await userLib.createUser(request.agent(app), null, null, null);
                        const userToInvite2 = await userLib.createUser(request.agent(app), null, null, null);

                        const invitation = [
                            {
                                userId: userToInvite.id,
                                level: GroupMemberUser.LEVELS.read
                            },
                            {
                                userId: userToInvite2.id,
                                level: GroupMemberUser.LEVELS.admin
                            }
                        ];

                        const inviteCreateResult = (await groupInviteUsersCreate(agentCreator, userCreator, group.id, invitation)).body;

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

                    test('Success - 20100 - invite multiple Users - userId (uuidv4) WITH invite message', async function () {
                        // NOTE: This test DOES NOT test e-mail itself, it just verifies that there is no syntax error in the e-mail sending code.

                        const userToInvite = await userLib.createUser(request.agent(app), null, null, null);
                        const userToInvite2 = await userLib.createUser(request.agent(app), null, null, null);

                        const invitation = [
                            {
                                userId: userToInvite.id,
                                level: GroupMemberUser.LEVELS.read,
                                inviteMessage: 'TEST invite message in the e-mail.'
                            },
                            {
                                userId: userToInvite2.id,
                                level: GroupMemberUser.LEVELS.admin
                            }
                        ];

                        const inviteCreateResult = (await groupInviteUsersCreate(agentCreator, userCreator, group.id, invitation)).body;

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
                        const userToInvite = await userLib.createUser(request.agent(app), 'TestGroupInviteEmail1_' + cosUtil.randomString() + '@invitetest.com', null, null);
                        const invitation = [
                            {
                                userId: userToInvite.email,
                                level: GroupMemberUser.LEVELS.read
                            },
                            {
                                userId: 'TestGroupInviteEmail2_' + cosUtil.randomString() + '@invitetest.com',
                                level: GroupMemberUser.LEVELS.admin
                            }
                        ];

                        const inviteCreateResult = (await groupInviteUsersCreate(agentCreator, userCreator, group.id, invitation)).body;

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

                        // Make sure the e-mail is converted to lower-case making e-mails case-insensitive - https://github.com/citizenos/citizenos-api/issues/234
                        const userInvited1 = await User.findOne({
                            where: {
                                id: createdInviteUser1.userId
                            }
                        });

                        assert.equal(userInvited1.email, invitation[0].userId.toLowerCase());

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

                        // Make sure the e-mail is converted to lower-case making e-mails case-insensitive - https://github.com/citizenos/citizenos-api/issues/234
                        const userInvited2 = await User.findOne({
                            where: {
                                id: createdInviteUser2.userId
                            }
                        });

                        assert.equal(userInvited2.email, invitation[1].userId.toLowerCase());
                    });

                    test('Fail - 40001 - Invite yourself', async function () {
                        const invitation = {
                            userId: userCreator.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        const inviteCreateResult = (await _groupInviteUsersCreate(agentCreator, userCreator, group.id, invitation, 400)).body;

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
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        const inviteCreateResult = (await _groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation, 400)).body;

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

                        const inviteCreateResult1 = (await _groupInviteUsersCreate(agentCreator, userCreator.id, group.id, '{asdasdas', 400)).body;

                        assert.deepEqual(inviteCreateResult1, expectedResponseBody);

                        const inviteCreateResult2 = (await _groupInviteUsersCreate(agentCreator, userCreator.id, group.id, 'PPPasdasdas', 400)).body;

                        assert.deepEqual(inviteCreateResult2, expectedResponseBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _groupInviteUsersCreate(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', group.id, [], 401);
                    });

                    test('Fail - 40300 - at least admin permissions required', async function () {
                        const agentInvalidUser = request.agent(app);
                        const invalidUser = await userLib.createUserAndLogin(agentInvalidUser, null, null, null);

                        // Try not being part of the group at all
                        await _groupInviteUsersCreate(agentInvalidUser, invalidUser.id, group.id, [], 403);

                        // Create User with "read" level, should not be able to invite.
                        await GroupMemberUser.create({
                            groupId: group.id,
                            userId: invalidUser.id,
                            level: GroupMemberUser.LEVELS.read
                        });

                        // Try to invite with "read" level
                        await _groupInviteUsersCreate(agentInvalidUser, invalidUser.id, group.id, [], 403);
                    });
                });

                suite('Read', function () {

                    const agentCreator = request.agent(app);
                    const agentUserToInvite = request.agent(app);

                    const groupName = 'TESTCASE: Invite Read';

                    let userCreator;
                    let userToInvite;

                    let group;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUserAndLogin(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                    });

                    setup(async function () {
                        group = (await groupCreate(agentCreator, userCreator.id, groupName, null, null)).body.data;
                    });

                    test('Success - 20000', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        const groupInviteCreated = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];

                        const inviteRead = (await groupInviteUsersRead(request.agent(app), group.id, groupInviteCreated.id)).body.data;

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
                            email: userToInvite.email
                        };

                        assert.deepEqual(inviteRead, expectedInvite);
                    });

                    test('Success - 20000 - Multiple invites last one counts', async function () {
                        const invitation1 = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.admin
                        };

                        const invitation2 = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        const groupInviteCreated1 = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation1)).body.data.rows[0];
                        const groupInviteCreated2 = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation2)).body.data.rows[0];

                        const inviteRead1 = (await groupInviteUsersRead(request.agent(app), group.id, groupInviteCreated1.id)).body.data;
                        const inviteRead2 = (await groupInviteUsersRead(request.agent(app), group.id, groupInviteCreated2.id)).body.data;

                        const expectedInvite = Object.assign({}, groupInviteCreated2); // Clone

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
                            email: userToInvite.email
                        };

                        assert.deepEqual(inviteRead1, expectedInvite);
                        assert.deepEqual(inviteRead2, expectedInvite);
                    });

                    // I invite has been accepted (deleted, but User has access)
                    test('Success - 20001', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        const groupInviteCreated = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];

                        const groupMemberUser = (await groupInviteUsersAccept(agentUserToInvite, userToInvite.id, group.id, groupInviteCreated.id)).body.data;

                        assert.equal(groupMemberUser.groupId, group.id);
                        assert.equal(groupMemberUser.userId, userToInvite.id);
                        assert.equal(groupMemberUser.level, groupInviteCreated.level);
                        assert.property(groupMemberUser, 'createdAt');
                        assert.property(groupMemberUser, 'updatedAt');
                        assert.property(groupMemberUser, 'deletedAt');

                        const inviteReadResult = (await groupInviteUsersRead(request.agent(app), group.id, groupInviteCreated.id)).body;
                        const expectedInvite = Object.assign({}, groupInviteCreated);

                        // Accepting the invite changes "updatedAt", thus these are not the same. Verify that the "updatedAt" exists and remove from expected and actual
                        assert.property(inviteReadResult.data, 'updatedAt');
                        delete inviteReadResult.data.updatedAt;
                        delete expectedInvite.updatedAt;

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
                            email: userToInvite.email
                        };

                        const expectedInviteResult = {
                            status: {
                                code: 20001
                            },
                            data: expectedInvite
                        };

                        assert.deepEqual(inviteReadResult, expectedInviteResult);
                    });

                    test('Success - 20002 - NOT existing User by e-mail', async function () {
                        const invitation = {
                            userId: `test_new_user_group_invite_read_${new Date().getTime()}_@citizenostest.com`,
                            level: GroupMemberUser.LEVELS.read
                        };

                        const groupInviteCreated = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];

                        const inviteReadResult = (await groupInviteUsersRead(request.agent(app), group.id, groupInviteCreated.id)).body;
                        const expectedInvite = Object.assign({}, groupInviteCreated);

                        // Accepting the invite changes "updatedAt", thus these are not the same. Verify that the "updatedAt" exists and remove from expected and actual
                        assert.property(inviteReadResult.data, 'updatedAt');
                        delete inviteReadResult.data.updatedAt;
                        delete expectedInvite.updatedAt;

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
                            id: groupInviteCreated.userId,
                            email: invitation.userId
                        };

                        const expectedInviteResult = {
                            status: {
                                code: 20002
                            },
                            data: expectedInvite
                        };

                        assert.deepEqual(inviteReadResult, expectedInviteResult);
                    });


                    test('Fail - 40400 - Not found', async function () {
                        await _groupInviteUsersRead(request.agent(app), group.id, 'f4bb46b9-87a1-4ae4-b6df-c2605ab8c471', 404);
                    });

                    test('Fail - 41001 - Deleted', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        let groupInviteCreated = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];

                        await GroupInviteUser
                            .destroy({
                                where: {
                                    id: groupInviteCreated.id
                                }
                            });

                        const groupInviteRead = (await _groupInviteUsersRead(request.agent(app), group.id, groupInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41001,
                                message: 'The invite has been deleted'
                            }
                        };

                        assert.deepEqual(groupInviteRead, expectedBody);
                    });

                    test('Fail - 41002 - Expired', async function () {
                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        let groupInviteCreated = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];
                        await GroupInviteUser
                            .update(
                                {
                                    expiresAt: db.literal(`NOW()`)
                                },
                                {
                                    where: {
                                        id: groupInviteCreated.id
                                    }
                                }
                            );

                        const groupInviteRead = (await _groupInviteUsersRead(request.agent(app), group.id, groupInviteCreated.id, 410)).body;

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
                    const agentUserToInvite1 = request.agent(app);

                    let userCreator;
                    let userToInvite1;
                    let userToInvite2;

                    let group;

                    let groupInviteCreated1;
                    let groupInviteCreated2;

                    setup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        userToInvite1 = await userLib.createUserAndLogin(agentUserToInvite1, null, null, null);
                        userToInvite2 = await userLib.createUser(request.agent(app), null, null, null);

                        group = (await groupCreate(agentCreator, userCreator.id, 'TEST CASE: User Invites List', null, null)).body.data;

                        const groupInvite1 = {
                            userId: userToInvite1.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        const groupInvite2 = {
                            userId: userToInvite2.id,
                            level: GroupMemberUser.LEVELS.admin
                        };

                        groupInviteCreated1 = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, groupInvite1)).body.data.rows[0];
                        groupInviteCreated2 = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, groupInvite2)).body.data.rows[0];
                    });

                    test('Success - 20000 - list invites - group admin', async function () {
                        const invitesListResult = (await groupInviteUsersList(agentCreator, userCreator.id, group.id)).body.data;
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
                        assert.equal(inviteListInviteUser1.email, userToInvite1.email);
                        assert.notProperty(inviteListInviteUser1, 'pid');
                        assert.property(inviteListInviteUser1, 'phoneNumber');
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
                        assert.notProperty(inviteListInviteUser2, 'pid');
                        assert.property(inviteListInviteUser2, 'phoneNumber');
                        assert.property(inviteListInviteUser2, 'imageUrl');

                        delete inviteListInvite2.user;

                        assert.deepEqual(inviteListInvite2, groupInviteCreated2);
                    });

                    test('Success - 20000 - list invites - group member NOT admin', async function () {
                        // Accept invite to test listing
                        await groupInviteUsersAccept(agentUserToInvite1, userToInvite1.id, group.id, groupInviteCreated1.id);

                        const invitesListResult = (await groupInviteUsersList(agentUserToInvite1, userToInvite1.id, group.id)).body.data;
                        assert.equal(1, invitesListResult.count);

                        const invitesList = invitesListResult.rows;
                        assert.isArray(invitesList);
                        assert.equal(1, invitesList.length); // 1 has been accepted by this user

                        // The list result has User object, otherwise the objects should be equal
                        const inviteListInvite2 = invitesList.find(invite => {
                            return invite.id === groupInviteCreated2.id
                        });
                        const inviteListInviteUser2 = inviteListInvite2.user;

                        assert.equal(inviteListInviteUser2.id, userToInvite2.id);
                        assert.equal(inviteListInviteUser2.name, userToInvite2.name);
                        assert.notProperty(inviteListInviteUser2, 'pid');
                        assert.notProperty(inviteListInviteUser2, 'phoneNumber');
                        assert.property(inviteListInviteUser2, 'imageUrl');

                        delete inviteListInvite2.user;

                        assert.deepEqual(inviteListInvite2, groupInviteCreated2);
                    });

                    test('Success - 20000 - list invites - Moderator', async function () {
                        assert.equal(groupInviteCreated1.level, GroupMemberUser.LEVELS.read, 'This test is ONLY valid if the User is NOT admin member of the Group!');

                        // Accept invite to test listing
                        await groupInviteUsersAccept(agentUserToInvite1, userToInvite1.id, group.id, groupInviteCreated1.id);
                        // Make the User a moderator
                        await Moderator.create({
                            userId: groupInviteCreated1.userId,
                            partnerId: null
                        });

                        const invitesListResult = (await groupInviteUsersList(agentUserToInvite1, groupInviteCreated1.userId, group.id)).body.data;
                        assert.equal(1, invitesListResult.count);

                        const invitesList = invitesListResult.rows;
                        assert.isArray(invitesList);
                        assert.equal(1, invitesList.length); // 1 has been accepted by this user

                        // The list result has User object, otherwise the objects should be equal
                        const inviteListInvite2 = invitesList.find(invite => {
                            return invite.id === groupInviteCreated2.id
                        });
                        const inviteListInviteUser2 = inviteListInvite2.user;
                        assert.equal(inviteListInviteUser2.id, userToInvite2.id);
                        assert.equal(inviteListInviteUser2.name, userToInvite2.name);
                        assert.notProperty(inviteListInviteUser2, 'pid');
                        assert.property(inviteListInviteUser2, 'phoneNumber');
                        assert.property(inviteListInviteUser2, 'imageUrl');

                        delete inviteListInvite2.user;

                        assert.deepEqual(inviteListInvite2, groupInviteCreated2);
                    });

                    test('Success - 20000 - list without duplicate invites', async function () {
                        // Second invite to User 1
                        const groupInvite12 = {
                            userId: userToInvite1.id,
                            level: GroupMemberUser.LEVELS.admin
                        };

                        const groupInviteCreated12 = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, groupInvite12)).body.data.rows[0];

                        const invitesListResult = (await groupInviteUsersList(agentCreator, userCreator.id, group.id)).body.data;

                        const invitesList = invitesListResult.rows;
                        assert.isArray(invitesList);
                        assert.equal(2, invitesList.length);

                        const originalInvite = invitesList.find(invite => {
                            return invite.id === groupInviteCreated1.id
                        });
                        assert.equal(undefined, originalInvite);

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
                                    expiresAt: db.literal(`NOW()`)
                                },
                                {
                                    where: {
                                        id: groupInviteCreated1.id
                                    }
                                }
                            );

                        const invitesListResult = (await groupInviteUsersList(agentCreator, userCreator.id, group.id)).body.data;
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

                        const invitesListResult = (await groupInviteUsersList(agentCreator, userCreator.id, group.id)).body.data;
                        assert.equal(1, invitesListResult.count);

                        const invitesList = invitesListResult.rows;
                        const inviteListInvite2 = invitesList.find(invite => {
                            return invite.id === groupInviteCreated2.id;
                        });
                        assert.isUndefined(inviteListInvite2);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _groupInviteUsersList(request.agent(app), '93857ed7-a81a-4187-85de-234f6d06b011', group.id, 401);
                    });

                    test('Fail - 40300 - at least read permissions required', async function () {
                        await userLib.createUserAndLogin(agentCreator, null, null, null);
                        await _groupInviteUsersList(agentCreator, userCreator.id, group.id, 403);
                    });

                });

                suite('Delete', function () {

                    const agentCreator = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let group;
                    let groupInviteCreated;

                    suiteSetup(async function () {
                        userToInvite = await userLib.createUser(request.agent(app), null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        group = (await groupCreate(agentCreator, userCreator.id, 'TEST CASE: User Invites Delete', null, null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        groupInviteCreated = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20000', async function () {
                        const userDeleteResult = (await groupInviteUsersDelete(agentCreator, userCreator.id, group.id, groupInviteCreated.id)).body;

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
                        const userDeleteResult = (await _groupInviteUsersDelete(agentCreator, userCreator.id, group.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 404)).body;

                        const expectedBody = {
                            status: {
                                code: 40401,
                                message: 'Invite not found'
                            }
                        };

                        assert.deepEqual(userDeleteResult, expectedBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _groupInviteUsersDelete(request.agent(app), '4727aecc-56f7-4802-8f76-2cfaad5cd5f3', group.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 401);
                    });

                    test('Fail - 40300 - at least admin permissions required', async function () {
                        const agentInvalidUser = request.agent(app);
                        const invalidUser = await userLib.createUserAndLogin(agentInvalidUser, null, null, null);

                        await _groupInviteUsersDelete(agentInvalidUser, invalidUser.id, group.id, '094ba349-c03e-4fa9-874e-48a978013b2a', 403);
                    });

                });

                suite('Accept', function () {

                    const agentCreator = request.agent(app);
                    const agentUserToInvite = request.agent(app);

                    let userCreator;
                    let userToInvite;

                    let group;
                    let groupInviteCreated;

                    setup(async function () {
                        userToInvite = await userLib.createUserAndLogin(agentUserToInvite, null, null, null);
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        group = (await groupCreate(agentCreator, userCreator.id, 'TEST CASE: User Invites List', null, null)).body.data;

                        const invitation = {
                            userId: userToInvite.id,
                            level: GroupMemberUser.LEVELS.read
                        };

                        groupInviteCreated = (await groupInviteUsersCreate(agentCreator, userCreator.id, group.id, invitation)).body.data.rows[0];
                    });

                    test('Success - 20100 - New member created', async function () {
                        const groupMemberUser = (await groupInviteUsersAccept(agentUserToInvite, userToInvite.id, group.id, groupInviteCreated.id)).body.data;

                        assert.equal(groupMemberUser.groupId, group.id);
                        assert.equal(groupMemberUser.userId, userToInvite.id);
                        assert.equal(groupMemberUser.level, groupInviteCreated.level);
                        assert.property(groupMemberUser, 'createdAt');
                        assert.property(groupMemberUser, 'updatedAt');
                        assert.property(groupMemberUser, 'deletedAt');

                        const groupR = (await groupRead(agentUserToInvite, userToInvite.id, group.id)).body.data;

                        // Do not return token for people with insufficient permission - https://github.com/citizenos/citizenos-fe/issues/325
                        assert.notProperty(groupR, 'join');
                    });

                    test('Success - 20000 - User already a Member, but accepts an Invite', async function () {
                        await groupInviteUsersAccept(agentUserToInvite, userToInvite.id, group.id, groupInviteCreated.id);
                        const groupMemberUser = (await _groupInviteUsersAccept(agentUserToInvite, userToInvite.id, group.id, groupInviteCreated.id, 200)).body.data;

                        assert.equal(groupMemberUser.groupId, group.id);
                        assert.equal(groupMemberUser.userId, userToInvite.id);
                        assert.equal(groupMemberUser.level, groupInviteCreated.level);
                        assert.property(groupMemberUser, 'createdAt');
                        assert.property(groupMemberUser, 'updatedAt');
                        assert.property(groupMemberUser, 'deletedAt');
                    });

                    test('Fail - 40400 - Cannot accept deleted invite', async function () {
                        await groupInviteUsersDelete(agentCreator, userCreator.id, group.id, groupInviteCreated.id);
                        await _groupInviteUsersAccept(agentUserToInvite, userToInvite.id, group.id, groupInviteCreated.id, 404);
                    });

                    test('Fail - 41002 - Cannot accept expired invite', async function () {
                        await GroupInviteUser
                            .update(
                                {
                                    expiresAt: db.literal(`NOW()`)
                                },
                                {
                                    where: {
                                        id: groupInviteCreated.id
                                    }
                                }
                            );

                        const acceptResult = (await _groupInviteUsersAccept(agentUserToInvite, userToInvite.id, group.id, groupInviteCreated.id, 410)).body;

                        const expectedBody = {
                            status: {
                                code: 41002,
                                message: `The invite has expired. Invites are valid for ${GroupInviteUser.VALID_DAYS} days`
                            }
                        };

                        assert.deepEqual(acceptResult, expectedBody);
                    });

                    test('Fail - 40100 - Unauthorized', async function () {
                        await _groupInviteUsersAccept(request.agent(app), '93857ed7-a81a-4187-85de-234f6d06b011', group.id, groupInviteCreated.id, 401);
                    });

                    test('Fail - 40300 - Forbidden - Cannot accept for someone else', async function () {
                        await _groupInviteUsersAccept(agentCreator, userToInvite.id, group.id, groupInviteCreated.id, 403);
                    });
                });
            });

        });

        suite('Members', function () {

            suite('Users', function () {

                suite('List', function () {
                    let agentCreator = request.agent(app);
                    let agentMemberUser = request.agent(app);

                    let userCreator;
                    let userMember;

                    let group;

                    suiteSetup(async function () {
                        userCreator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                        userMember = await userLib.createUserAndLogin(agentMemberUser, null, null, null);
                        group = (await groupCreate(agentCreator, userCreator.id, 'TEST GROUP USER MEMBERS LIST', null, null)).body.data;

                        await memberLib.groupMemberUsersCreate(group.id, [
                            {
                                userId: userMember.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ]);
                    });

                    test('Success - 20000 - admin', async function () {
                        const memberListRes = (await groupMemberUsersList(agentCreator, userCreator.id, group.id)).body.data;

                        assert.equal(2, memberListRes.countTotal);
                        assert.equal(2, memberListRes.count);
                        assert.equal(2, memberListRes.rows.length);

                        const userCreatorMember = memberListRes.rows.find(function (member) {
                            return member.id === userCreator.id;
                        });

                        const userCreatorMemberExpected = {
                            id: userCreator.id,
                            name: userCreator.name,
                            company: userCreator.company,
                            imageUrl: userCreator.imageUrl,
                            level: GroupMemberUser.LEVELS.admin,
                            email: userCreator.email,
                            phoneNumber: null
                        };

                        assert.deepEqual(userCreatorMember, userCreatorMemberExpected);

                        const userMemberMember = memberListRes.rows.find(function (member) {
                            return member.id === userMember.id;
                        });

                        const userMemberMemberExpected = {
                            id: userMember.id,
                            name: userMember.name,
                            company: userMember.company,
                            imageUrl: userMember.imageUrl,
                            level: GroupMemberUser.LEVELS.read,
                            email: userMember.email,
                            phoneNumber: null
                        };

                        assert.deepEqual(userMemberMember, userMemberMemberExpected);
                    });

                    test('Success - 20000 - member (read) - MUST NOT see extra User info (email, phone etc) - https://github.com/citizenos/citizenos-fe/issues/670', async function () {
                        const memberListRes = (await groupMemberUsersList(agentMemberUser, userMember.id, group.id)).body.data;

                        assert.equal(2, memberListRes.countTotal);
                        assert.equal(2, memberListRes.count);
                        assert.equal(2, memberListRes.rows.length);

                        const userCreatorMember = memberListRes.rows.find(function (member) {
                            return member.id === userCreator.id;
                        });

                        const userCreatorMemberExpected = {
                            id: userCreator.id,
                            name: userCreator.name,
                            company: userCreator.company,
                            imageUrl: userCreator.imageUrl,
                            level: GroupMemberUser.LEVELS.admin
                        };

                        assert.deepEqual(userCreatorMember, userCreatorMemberExpected);

                        const userMemberMember = memberListRes.rows.find(function (member) {
                            return member.id === userMember.id;
                        });

                        const userMemberMemberExpected = {
                            id: userMember.id,
                            name: userMember.name,
                            company: userMember.company,
                            imageUrl: userMember.imageUrl,
                            level: GroupMemberUser.LEVELS.read
                        };

                        assert.deepEqual(userMemberMember, userMemberMemberExpected);
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
                        member = await userLib.createUser(agent, memberEmail, memberPassword, null);

                        creator = await userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null);
                        group = (await groupCreate(agent, creator.id, 'Test Group edit members', null, null)).body.data;

                        const members = [
                            {
                                userId: member.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.groupMemberUsersCreate(group.id, members);
                    });

                    test('Success', async function () {
                        await groupMemberUsersUpdate(agent, creator.id, group.id, member.id, GroupMemberUser.LEVELS.admin);

                        const gm = await GroupMemberUser
                            .findOne({
                                where: {
                                    groupId: group.id,
                                    userId: member.id
                                }
                            });

                        assert.equal(gm.userId, member.id);
                        assert.equal(gm.level, GroupMemberUser.LEVELS.admin);
                    });

                    test('Fail - Forbidden - must have at least admin level to edit member permissions', async function () {
                        const agent = request.agent(app);
                        const email = 'test_gmembersuf_' + new Date().getTime() + '@test.ee';
                        const password = 'testPassword123';

                        const user = await userLib.createUserAndLogin(agent, email, password, null);
                        await _groupMemberUsersUpdate(agent, user.id, group.id, member.id, GroupMemberUser.LEVELS.read, 403);
                    });


                    test('Fail - Bad Request - cannot revoke admin permissions from the last admin user', async function () {
                        const g = (await groupCreate(agent, creator.id, 'Test Group edit members fail', null, null)).body.data;

                        // Add one non-admin member just to mix the water a bit...
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.groupMemberUsersCreate(g.id, members);

                        // Creator tries to degrade his own permissions while being the last admin user
                        await _groupMemberUsersUpdate(agent, creator.id, g.id, creator.id, GroupMemberUser.LEVELS.read, 400);
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
                        member = await userLib.createUser(agent, memberEmail, memberPassword, null);
                        creator = await userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null);
                        group = (await groupCreate(agent, creator.id, 'Test Group add members', null, null)).body.data;
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.groupMemberUsersCreate(group.id, members);
                        const res = (await groupRead(agent, creator.id, group.id)).body.data;
                        assert.equal(res.members.count, 2);
                        return;
                    });

                    test('Success', async function () {
                        await groupMemberUsersDelete(agent, creator.id, group.id, member.id);
                        const groupR = (await groupRead(agent, creator.id, group.id)).body.data;
                        assert.equal(groupR.members.count, 1);
                    });

                    test('Success - Member leaves group', async function () {
                        const deleteAgent = request.agent(app);
                        const deleteMemberEmail = 'test_gmembersgd_m2_' + new Date().getTime() + '@test.ee';
                        const deleteMemberPassword = 'testPassword123';

                        const deleteMember = await userLib.createUserAndLogin(deleteAgent, deleteMemberEmail, deleteMemberPassword, null)
                        const members = [
                            {
                                userId: deleteMember.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.groupMemberUsersCreate(group.id, members);
                        const readGroup1 = (await groupRead(agent, creator.id, group.id)).body.data;
                        assert.equal(readGroup1.members.count, 2);

                        await groupMemberUsersDelete(deleteAgent, deleteMember.id, group.id, deleteMember.id);
                        const readGroup2 = (await groupRead(agent, creator.id, group.id)).body.data;
                        assert.equal(readGroup2.members.count, 1);

                        for (let i = 0; i < readGroup2.members.length; i++) {
                            assert.notEqual(readGroup2.members[i].id, deleteMember.id);
                        }
                    });

                    test('Fail - Forbidden - at least admin permissions required', async function () {
                        const agent = request.agent(app);
                        const email = 'test_gmembersdf_' + new Date().getTime() + '@test.ee';
                        const password = 'testPassword123';

                        const user = await userLib.createUserAndLogin(agent, email, password, null);

                        await _groupMemberUsersDelete(agent, user.id, group.id, member.id, 403);
                    });


                    test('Fail - Bad Request - Cannot delete the last admin member', async function () {
                        const g = (await groupCreate(agent, creator.id, 'Test Group delete members fail', null, null)).body.data;

                        // Add one non-admin member just to mix the water a bit...
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.groupMemberUsersCreate(g.id, members);
                        // Creator tries to degrade his own permissions while being the last admin user
                        await _groupMemberUsersDelete(agent, creator.id, g.id, creator.id, 400);
                        // Be the error what it is, the member count must remain the same
                        const groupR = (await groupRead(agent, creator.id, g.id)).body.data;
                        assert.equal(groupR.members.count, 2);
                    });
                });

            });

            suite('Topics', function () {

                suite('List', function () {

                    const agent = request.agent(app);
                    const userAgent = request.agent(app);

                    const creatorEmail = 'test_gmemberstopicsgd_c_' + cosUtil.randomString() + '@test.ee';
                    const creatorPassword = 'testPassword123';

                    let creator, user, group, topicCreated, topicCreated2;

                    suiteSetup(async () => {
                        creator = await userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null);
                        user = await userLib.createUserAndLogin(userAgent, 'test_gmemberstopicsgd_u_' + cosUtil.randomString() + '@test.ee', creatorPassword, null);

                        group = (await groupCreate(agent, creator.id, 'Test Group list member topics', null, null)).body.data;
                        const members = [
                            {
                                userId: user.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.groupMemberUsersCreate(group.id, members);
                        topicCreated = (await topicLib.topicCreate(agent, creator.id, null, null, null, '<!DOCTYPE HTML><html><body><h1>H1</h1></body></html>', null)).body.data;
                        topicCreated2 = (await topicLib.topicCreate(agent, creator.id, null, null, null, '<!DOCTYPE HTML><html><body><h1>H1</h1></body></html>', null)).body.data;
                        const memberGroup = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.edit
                        };

                        await topicLib.topicMemberGroupsCreate(agent, creator.id, topicCreated.id, memberGroup);
                        const memberGroup2 = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.edit
                        };
                        await topicLib.topicMemberGroupsCreate(agent, creator.id, topicCreated2.id, memberGroup2);
                    });


                    test('Success', async function () {
                        const topicsList = (await groupMembersTopicsList(agent, creator.id, group.id)).body.data;
                        assert.equal(topicsList.rows.length, 2);

                        const groupMemberTopic = topicsList.rows[0];

                        assert.isNotNull(groupMemberTopic.id);
                        assert.isNotNull(groupMemberTopic.title);

                        const creatorExpected = creator.toJSON();
                        delete creatorExpected.email;
                        delete creatorExpected.language;
                        assert.deepEqual(groupMemberTopic.creator, creatorExpected);

                        assert.equal(groupMemberTopic.permission.level, GroupMemberUser.LEVELS.admin);
                        assert.equal(groupMemberTopic.permission.levelGroup, TopicMemberGroup.LEVELS.edit);

                    });

                    test('Success - filter status', async function () {
                        const topicsListInProgress = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, Topic.STATUSES.inProgress)).body.data;
                        assert.equal(topicsListInProgress.rows.length, 2);
                        const topicsListVoting = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, Topic.STATUSES.voting)).body.data;
                        assert.equal(topicsListVoting.rows.length, 0);
                        await Topic
                            .update(
                                {
                                    status: Topic.STATUSES.voting
                                },
                                {
                                    where: {
                                        id: topicCreated.id
                                    }
                                }
                            );

                        const topicsListVoting2 = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, Topic.STATUSES.voting)).body.data;
                        assert.equal(topicsListVoting2.rows.length, 1);
                        const topicsListFollowUp = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, Topic.STATUSES.followUp)).body.data;
                        assert.equal(topicsListFollowUp.rows.length, 0);
                        const topicsListClosed = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, Topic.STATUSES.closed)).body.data;
                        assert.equal(topicsListClosed.rows.length, 0);
                    });

                    test('Success - filters', async function () {
                        const topicsListPrivate = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, null, Topic.VISIBILITY.private)).body.data;
                        assert.equal(topicsListPrivate.rows.length, 2);
                        const topicsListPublic = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, null, Topic.VISIBILITY.public)).body.data;
                        assert.equal(topicsListPublic.rows.length, 0);
                        const topicsListCreator = (await groupMembersTopicsList(userAgent, user.id, group.id, null, null, null, null, null)).body.data;
                        assert.equal(topicsListCreator.rows.length, 2);
                        const topicsListCreator1 = (await groupMembersTopicsList(userAgent, user.id, group.id, null, null, null, null, user.id)).body.data;
                        assert.equal(topicsListCreator1.rows.length, 0);
                        const topicsListCreator2 = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, null, null, creator.id)).body.data;
                        assert.equal(topicsListCreator2.rows.length, 2);
                        assert.equal(topicsListCreator2.rows[0].creator.id, creator.id);
                        await topicLib.topicFavouriteCreate(agent, creator.id, topicCreated.id);
                        const topicsListPinned = (await groupMembersTopicsList(agent, creator.id, group.id, null, null, null, null, null, true)).body.data;
                        assert.equal(topicsListPinned.rows.length, 1);
                        const topicsListPinnedUser = (await groupMembersTopicsList(userAgent, user.id, group.id, null, null, null, null, null, true)).body.data;
                        assert.equal(topicsListPinnedUser.rows.length, 0);
                        const topicsListVoted = (await groupMembersTopicsList(userAgent, user.id, group.id, null, null, null, null, null, null, true)).body.data;
                        assert.equal(topicsListVoted.rows.length, 0);
                        const topicsListModerated = (await groupMembersTopicsList(userAgent, user.id, group.id, null, null, null, null, null, null, null, true)).body.data;
                        assert.equal(topicsListModerated.rows.length, 0);
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
                        member = await userLib.createUser(agent, memberEmail, memberPassword, null);
                        creator = await userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null);
                        group = (await groupCreate(agent, creator.id, 'Test Group add members', null, null)).body.data;
                        const members = [
                            {
                                userId: member.id,
                                level: GroupMemberUser.LEVELS.read
                            }
                        ];

                        await memberLib.groupMemberUsersCreate(group.id, members);
                        const groupR = (await groupRead(agent, creator.id, group.id)).body.data;
                        assert.equal(groupR.members.count, 2);
                    });

                    test('Success - Remove Topic from Group after Topic delete', async function () {
                        const topic = (await topicLib.topicCreate(agent, member.id, null, null, null, null, null)).body.data;
                        const memberGroup = {
                            groupId: group.id,
                            level: TopicMemberGroup.LEVELS.read
                        };
                        await topicLib.topicMemberGroupsCreate(agent, member.id, topic.id, memberGroup);
                        const groupData = (await groupList(agent, member.id, null)).body.data;
                        assert.equal(groupData.rows[0].members.topics.count, 1);
                        await topicLib.topicDelete(agent, member.id, topic.id);
                        const groupData2 = (await groupList(agent, member.id, null)).body.data;
                        assert.equal(groupData2.rows[0].members.topics.count, 0);
                    });

                });

            });

        });

        suite('Join', function () {

            const agentCreator = request.agent(app);
            const agentUser = request.agent(app);

            let creator;
            let user;

            let group;

            suiteSetup(async function () {
                creator = await userLib.createUserAndLogin(agentCreator, null, null, null);
                user = await userLib.createUserAndLogin(agentUser, null, null, null);
            });

            setup(async function () {
                group = (await groupCreate(agentCreator, creator.id, `JOIN TEST GROUP ${new Date().getTime()}`, null, Group.VISIBILITY.private)).body.data;
            });

            test('Success - 20000 - default level (read)', async function () {
                const resActual = (await groupJoinJoin(agentUser, group.join.token)).body;
                assert.equal(GroupMemberUser.LEVELS.read, resActual.data.userLevel);
                delete resActual.data.userLevel;
                const resExpected = {
                    status: {
                        code: 20000
                    },
                    data: group
                };

                assert.deepEqual(resActual, resExpected);
            });

            test('Success - 20000 - default level (read) with double join attempt (admin)', async function () {
                const resGroupJoinRead = (await groupUpdateTokenJoin(agentCreator, creator.id, group.id, GroupJoin.LEVELS.read)).body.data;
                const resJoinRead = await groupJoinJoin(agentUser, resGroupJoinRead.token);

                const userActivities = (await activityLib.activitiesRead(agentUser, user.id)).body.data;
                const groupJoinActivityActual = userActivities[0].data;

                const groupJoinActivityExpected = {
                    type: 'Join',
                    actor: {
                        id: user.id,
                        type: 'User',
                        level: GroupJoin.LEVELS.read,
                        company: user.company,
                        name: user.name
                    },
                    object: {
                        '@type': 'Group',
                        id: group.id,
                        name: group.name,
                        description: null,
                        imageUrl: null,
                        parentId: null,
                        visibility: Group.VISIBILITY.private
                    }
                };
                assert.deepEqual(groupJoinActivityActual, groupJoinActivityExpected);

                const groupExpected = Object.assign({}, group);
                groupExpected.join = resGroupJoinRead;

                const expectedResult = {
                    status: {
                        code: 20000
                    },
                    data: groupExpected
                };
                assert.equal(GroupMemberUser.LEVELS.read, resJoinRead.body.data.userLevel);
                delete resJoinRead.body.data.userLevel;
                assert.deepEqual(resJoinRead.body, expectedResult);

                const groupMembersRead = (await groupMemberUsersList(agentUser, user.id, group.id)).body.data;
                const groupMemberInfo = groupMembersRead.rows.find(function (member) {
                    return member.id === user.id;
                });
                assert.equal(groupMemberInfo.level, GroupMemberUser.LEVELS.read);

                // Modify join token level to admin, same User tries to join, but the level should remain the same (read)
                const resGroupJoinAdmin = (await groupUpdateTokenJoin(agentCreator, creator.id, group.id, GroupJoin.LEVELS.admin)).body.data;
                await groupJoinJoin(agentUser, resGroupJoinAdmin.token);
                const groupMembersReadAfterRejoin = (await groupMemberUsersList(agentUser, user.id, group.id)).body.data;
                const groupMemberInfoAfterRejoin = groupMembersReadAfterRejoin.rows.find(function (member) {
                    return member.id === user.id;
                });
                assert.equal(groupMemberInfoAfterRejoin.level, GroupMemberUser.LEVELS.read);
            });

            test('Fail - 40101 - Matching token not found', async function () {
                const res = await _groupJoinJoin(agentUser, 'nonExistentToken', 400);

                const expectedResult = {
                    status: {
                        code: 40001,
                        message: 'Matching token not found'
                    }
                };
                assert.deepEqual(res.body, expectedResult);
            });

            test('Fail - 40100 - Unauthorized', async function () {
                await _groupJoinJoin(request.agent(app), group.join.token, 401);
            });

            suite('Token', async function () {

                suite('Update', async function () {

                    test('Success - regenerate token', async function () {
                        const resData = (await groupUpdateTokenJoin(agentCreator, creator.id, group.id, GroupJoin.LEVELS.admin)).body.data;

                        assert.match(resData.token, new RegExp('^[a-zA-Z0-9]{' + GroupJoin.TOKEN_LENGTH + '}$'));
                        assert.equal(resData.level, GroupJoin.LEVELS.admin);

                        const userActivities = (await activityLib.activitiesRead(agentCreator, creator.id)).body.data;
                        const tokenJoinUpdateActivityActual = userActivities[0].data;

                        const tokenJoinUpdateActivityExpected = {
                            "type": "Update",
                            "actor": {
                                "type": "User",
                                "id": creator.id,
                                "name": creator.name,
                                "company": creator.company
                            },
                            "object": {
                                "@type": "GroupJoin",
                                "level": group.join.level, // previous level
                                "token": group.join.token.replace(group.join.token.substr(2, 8), '********'), // previous token
                                "groupId": group.id,
                                "groupName": group.name
                            },
                            "origin": {
                                "@type": "GroupJoin",
                                "level": group.join.level, // previous level
                                "token": group.join.token.replace(group.join.token.substr(2, 8), '********'), // previous token
                            },
                            "result": [
                                {
                                    "op": "replace",
                                    "path": "/token",
                                    "value": resData.token.replace(resData.token.substr(2, 8), '********'), // new token
                                },
                                {
                                    "op": "replace",
                                    "path": "/level",
                                    "value": resData.level
                                }
                            ]
                        };

                        assert.deepEqual(tokenJoinUpdateActivityActual, tokenJoinUpdateActivityExpected);
                    });

                    test('Fail - 40001 - Bad request - missing required property "level"', async function () {
                        const resBody = (await _groupUpdateTokenJoin(agentCreator, creator.id, group.id, null, 400)).body;
                        const resBodyExpected = {
                            status: {
                                code: 40001,
                                message: 'Invalid value for property "level". Possible values are read,admin.'
                            }
                        };

                        assert.deepEqual(resBody, resBodyExpected);
                    });

                    test('Fail - 40100 - No permissions', async function () {
                        const resBody = (await _groupUpdateTokenJoin(agentUser, user.id, group.id, null, 403)).body;
                        const resBodyExpected = {
                            status: {
                                code: 40300,
                                message: 'Insufficient permissions'
                            }
                        };

                        assert.deepEqual(resBody, resBodyExpected);
                    });

                    suite('Level', async function () {

                        test('Success', async function () {
                            const token = group.join.token;

                            const resBody = (await groupUpdateTokenJoinLevel(agentCreator, creator.id, group.id, token, GroupJoin.LEVELS.admin)).body;
                            const resBodyExpected = {
                                status: {
                                    code: 20000
                                },
                                data: {
                                    token: token,
                                    level: GroupJoin.LEVELS.admin
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);

                            const userActivities = (await activityLib.activitiesRead(agentCreator, creator.id)).body.data;
                            const tokenJoinLevelUpdateActivityActual = userActivities[0].data;

                            const tokenJoinLevelUpdateActivityExpected = {
                                "type": "Update",
                                "actor": {
                                    "type": "User",
                                    "id": creator.id,
                                    "name": creator.name,
                                    "company": creator.company
                                },
                                "object": {
                                    "@type": "GroupJoin",
                                    "level": group.join.level,
                                    "token": group.join.token.replace(group.join.token.substr(2, 8), '********'),
                                    "groupId": group.id,
                                    "groupName": group.name
                                },
                                "origin": {
                                    "@type": "GroupJoin",
                                    "level": group.join.level,
                                    "token": group.join.token.replace(group.join.token.substr(2, 8), '********'),
                                },
                                "result": [
                                    {
                                        "op": "replace",
                                        "path": "/level",
                                        "value": resBody.data.level
                                    }
                                ]
                            };

                            assert.deepEqual(tokenJoinLevelUpdateActivityActual, tokenJoinLevelUpdateActivityExpected);
                        });

                        test('Fail - 40400 - Not found - invalid token', async function () {
                            const token = GroupJoin.generateToken();

                            const resBody = (await _groupUpdateTokenJoinLevel(agentCreator, creator.id, group.id, token, GroupJoin.LEVELS.read, 404)).body;
                            const resBodyExpected = {
                                status: {
                                    code: 40400,
                                    message: 'Nothing found for groupId and token combination.'
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);
                        });

                        test('Fail - 40001 - Bad request - missing required property "level"', async function () {
                            const resBody = (await _groupUpdateTokenJoinLevel(agentCreator, creator.id, group.id, group.join.token, null, 400)).body;
                            const resBodyExpected = {
                                status: {
                                    code: 40001,
                                    message: 'Invalid value for property "level". Possible values are read,admin.'
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);
                        });

                        test('Fail - 40100 - No permissions', async function () {
                            const resBody = (await _groupUpdateTokenJoinLevel(agentUser, user.id, group.id, group.join.token, null, 403)).body;
                            const resBodyExpected = {
                                status: {
                                    code: 40300,
                                    message: 'Insufficient permissions'
                                }
                            };

                            assert.deepEqual(resBody, resBodyExpected);
                        });

                    });
                });

            });


        });

    });

});
