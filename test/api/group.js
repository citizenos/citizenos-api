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

var _groupRead = function (agent, userId, groupId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    agent
        .get(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupRead = function (agent, userId, groupId, callback) {
    _groupRead(agent, userId, groupId, 200, callback);
};

var _groupUpdate = function (agent, userId, groupId, name, parentId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    agent
        .put(path)
        .set('Content-Type', 'application/json')
        .send({
            name: name,
            parentId: parentId
        })
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupUpdate = function (agent, userId, groupId, name, parentId, callback) {
    _groupUpdate(agent, userId, groupId, name, parentId, 200, callback);
};

var _groupDelete = function (agent, userId, groupId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    agent
        .delete(path)
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupDelete = function (agent, userId, groupId, callback) {
    _groupDelete(agent, userId, groupId, 200, callback);
};

var _groupList = function (agent, userId, include, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups'.replace(':userId', userId);

    agent
        .get(path)
        .query({include: include})
        .set('Content-Type', 'application/json')
        .expect(expectedHttpCode)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupList = function (agent, userId, include, callback) {
    _groupList(agent, userId, include, 200, callback);
};

var _groupsListUnauth = function (agent, statuses, orderBy, offset, limit, sourcePartnerId, expectedHttpCode, callback) {
    var path = '/api/groups';

    agent
        .get(path)
        .query({
            statuses: statuses,
            orderBy: orderBy,
            offset: offset,
            limit: limit,
            sourcePartnerId: sourcePartnerId
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupsListUnauth = function (agent, status, orderBy, offset, limit, sourcePartnerId, callback) {
    _groupsListUnauth(agent, status, orderBy, offset, limit, sourcePartnerId, 200, callback);
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

var _groupMembersTopicsList = function (agent, userId, groupId, expectedHttpCode, callback) {
    var path = '/api/users/:userId/groups/:groupId/members/topics'
        .replace(':userId', userId)
        .replace(':groupId', groupId);

    agent
        .get(path)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(callback);
};

var groupMembersTopicsList = function (agent, userId, groupId, callback) {
    return _groupMembersTopicsList(agent, userId, groupId, 200, callback);
};

module.exports.create = groupCreate;
module.exports.update = groupUpdate;
module.exports.delete = groupDelete;
module.exports.list = groupList;
module.exports.membersCreate = groupMembersCreate;
module.exports.membersUpdate = groupMembersUpdate;
module.exports.membersDelete = groupMembersDelete;

var assert = require('chai').assert;
var request = require('supertest');
var app = require('../../app');

var async = app.get('async');

var shared = require('../utils/shared')(app);
var userLib = require('./lib/user')(app);
var topicLib = require('./topic');

var User = app.get('models.User');

var Group = app.get('models.Group');
var GroupMember = app.get('models.GroupMember');

var TopicMember = app.get('models.TopicMember');

suite('Users', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .then(done)
            .catch(done);
    });

    suite('Groups', function () {

        suite('Create', function () {
            var agent = request.agent(app);
            var email = 'test_groupc_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var groupName = 'Test GROUP for masses';

            var user;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    user = res;

                    done();
                });
            });

            test('Success', function (done) {
                groupCreate(agent, user.id, groupName, null, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var group = res.body.data;
                    assert.property(group, 'id');
                    assert.equal(group.creator.id, user.id);
                    assert.equal(group.name, groupName);
                    assert.isNull(group.parentId);

                    done();
                });
            });

            test('Success - non-default visibility', function (done) {
                groupCreate(agent, user.id, groupName, null, Group.VISIBILITY.public, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var group = res.body.data;
                    assert.property(group, 'id');
                    assert.equal(group.creator.id, user.id);
                    assert.equal(group.name, groupName);
                    assert.equal(group.visibility, Group.VISIBILITY.public);
                    assert.isNull(group.parentId);

                    done();
                });
            });

            test('Fail - Unauthorized', function (done) {
                _groupCreate(request.agent(app), user.id, groupName, null, null, 401, function (err) {
                    if (err) {
                        return done(err);
                    }

                    done();
                });
            });

            test('Fail - Bad Request - name is NULL', function (done) {
                _groupCreate(agent, user.id, null, null, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var errors = res.body.errors;
                    assert.property(errors, 'name');
                    assert.equal(errors.name, 'name cannot be null');

                    done();
                });
            });

            test('Fail - Bad Request - name is empty', function (done) {
                _groupCreate(agent, user.id, '   ', null, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var errors = res.body.errors;
                    assert.property(errors, 'name');
                    assert.equal(errors.name, 'Group name can be 2 to 255 characters long.');

                    done();
                });
            });

        });

        suite('Read', function () {
            var agent = request.agent(app);
            var email = 'test_groupr_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var groupName = 'Test GROUP for masses to read';

            var user;
            var group;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, ures) {
                    if (err) {
                        return done(err);
                    }
                    user = ures;

                    groupCreate(agent, user.id, groupName, null, null, function (err, gres) {
                        if (err) {
                            return done(err);
                        }

                        group = gres.body.data;

                        done();
                    });
                });
            });

            test('Success', function (done) {
                groupRead(agent, user.id, group.id, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var groupRead = res.body.data;

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

                    done();
                });
            });

            test('Fail - Forbidden - at least read permission required', function (done) {
                var agent = request.agent(app);
                var email = 'test_grouprf_' + new Date().getTime() + '@test.ee';
                var password = 'testPassword123';

                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    _groupRead(agent, res.id, group.id, 403, function (err) {
                        if (err) {
                            return done(err);
                        }

                        done();
                    });
                });
            });

        });

        suite('Update', function () {
            var agent = request.agent(app);
            var email = 'test_groupu_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var groupName = 'Test GROUP for masses before change';
            var groupNameNew = 'Test GROUP for masses after change';

            var user;
            var group;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, ures) {
                    if (err) {
                        return done(err);
                    }

                    user = ures;

                    groupCreate(agent, user.id, groupName, null, null, function (err, gres) {
                        if (err) {
                            return done(err);
                        }

                        group = gres.body.data;

                        done();
                    });
                });
            });

            test('Success', function (done) {
                groupUpdate(agent, user.id, group.id, groupNameNew, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var returnedGroup = res.body.data;

                    assert.equal(returnedGroup.name, groupNameNew);
                    assert.equal(returnedGroup.id, group.id);

                    groupRead(agent, user.id, group.id, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var expectedGroup = res.body.data;
                        assert.deepEqual(returnedGroup, expectedGroup);

                        done();
                    });
                });
            });

            test('Fail - Group name cannot be null', function (done) {
                _groupUpdate(agent, user.id, group.id, null, null, 400, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var expectedError = {
                        status: {code: 40000},
                        errors: {name: 'name cannot be null'}
                    };
                    assert.equal(res.status, 400);
                    assert.deepEqual(res.body, expectedError);

                    done();
                });
            });

            test('Fail - Forbidden - at least admin permission required', function (done) {
                var agent = request.agent(app);
                var email = 'test_groupuf_' + new Date().getTime() + '@test.ee';
                var password = 'testPassword123';

                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    _groupUpdate(agent, res.id, group.id, 'This we shall try', null, 403, function (err) {
                        if (err) {
                            return done(err);
                        }

                        done(err);
                    });
                });
            });

        });

        suite('Delete', function () {
            var agent = request.agent(app);
            var email = 'test_groupd_' + new Date().getTime() + '@test.ee';
            var password = 'testPassword123';
            var groupName = 'Test GROUP for masses to be deleted.';

            var user;
            var group;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    user = res;
                    groupCreate(agent, user.id, groupName, null, null, function (err, gres) {
                        if (err) {
                            return done(err);
                        }

                        group = gres.body.data;

                        done();
                    });
                });
            });

            test('Success', function (done) {
                groupDelete(agent, user.id, group.id, function (err) {
                    if (err) {
                        return done(err);
                    }

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
                            done();
                        })
                        .catch(done);
                });
            });

            test('Fail - Forbidden - at least admin permissions required', function (done) {
                var agent = request.agent(app);
                var email = 'test_groupdf_' + new Date().getTime() + '@test.ee';
                var password = 'testPassword123';

                userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    _groupDelete(agent, res.id, group.id, 403, function (err) {
                        if (err) {
                            return done(err);
                        }

                        done(err);
                    });
                });
            });

        });

        suite('List', function () {
            var agent = request.agent(app);
            var groupName = 'Test GROUP for masses List';

            var user;
            var member;
            var member2;
            var group;
            var topic;

            suiteSetup(function (done) {
                async
                    .parallel(
                        [
                            function (cb) {
                                userLib.createUser(request.agent(app), null, null, 'et', cb);
                            },
                            function (cb) {
                                userLib.createUserAndLogin(agent, null, null, null, cb);
                            },
                            function (cb) {
                                userLib.createUser(request.agent(app), null, null, 'et', cb);
                            }
                        ],
                        function (err, results) {
                            if (err) {
                                return done(err);
                            }

                            member = results[0];
                            user = results[1];
                            member2 = results[2];

                            groupCreate(agent, user.id, groupName, null, null, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                group = res.body.data;

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

                                async
                                    .parallel(
                                        [
                                            function (cb) {
                                                groupMembersCreate(agent, user.id, group.id, members, cb);
                                            },
                                            function (cb) {
                                                topicLib.topicCreate(agent, null, user.id, null, null, null, null, null, cb);
                                            }
                                        ],
                                        function (err, results) {
                                            if (err) {
                                                return done(err);
                                            }

                                            topic = results[1].body.data;

                                            var memberGroup = {
                                                groupId: group.id,
                                                level: TopicMember.LEVELS.read
                                            };

                                            topicLib.topicMemberGroupsCreate(agent, user.id, topic.id, memberGroup, function (err) {
                                                if (err) {
                                                    return done(err);
                                                }

                                                done();
                                            });
                                        }
                                    );
                            });
                        }
                    );
            });

            test('Success', function (done) {
                groupList(agent, user.id, null, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var groupList = res.body.data;

                    assert.equal(groupList.count, 1);
                    assert.isArray(groupList.rows);
                    assert.equal(groupList.rows.length, 1);

                    var group = groupList.rows[0];
                    assert.property(group, 'id');
                    assert.equal(group.name, groupName);
                    assert.isNull(group.parent.id);

                    var creator = group.creator;
                    assert.equal(creator.id, user.id);
                    assert.equal(creator.name, user.name);
                    assert.equal(creator.email, user.email);

                    var permission = group.permission;
                    assert.equal(permission.level, GroupMember.LEVELS.admin); // Creator has Admin permission.

                    var members = group.members;
                    assert.equal(members.users.count, 3);

                    var topics = group.members.topics;
                    assert.equal(topics.count, 1);
                    assert.equal(topics.latest.id, topic.id);
                    assert.equal(topics.latest.title, topic.title);

                    done();
                });
            });

            test('Success - non-authenticated User - show "public" Groups', function (done) {
                var groupName2 = 'Test group 2';

                groupCreate(agent, user.id, groupName2, null, Group.VISIBILITY.public, function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var group2 = res.body.data;
                    assert.property(group2, 'id');
                    assert.equal(group2.creator.id, user.id);
                    assert.equal(group2.name, groupName2);
                    assert.isNull(group2.parentId);
                    groupsListUnauth(agent, null, null, null, null, null, function (err, res) {
                        if (err) {
                            return done(err);
                        }

                        var groupList = res.body.data;

                        assert.equal(groupList.count, 2);
                        assert.isArray(groupList.rows);
                        assert.equal(groupList.rows.length, 2);

                        var group = groupList.rows[0];
                        assert.property(group, 'id');
                        assert.equal(group.name, groupName2);
                        assert.isNull(group.parentId);

                        var creator = group.creator;
                        assert.equal(creator.id, user.id);
                        assert.equal(creator.name, user.name);
                        assert.equal(creator.email, user.email);

                        done();
                    });
                });
            });

            test('Success - non-authenticated User - show "public" Groups with sourcePartnerId', function (done) {
                groupsListUnauth(agent, null, null, null, null, '4b511ad1-5b20-4c13-a6da-0b95d07b6900', function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    assert.property(res.body.data, 'countTotal');

                    var topicList = res.body.data.rows;

                    assert.equal(res.body.data.count, topicList.length);
                    assert.equal(topicList.length, 0);

                    done();
                });
            });

            test('Success - include users and topics', function (done) {
                groupList(agent, user.id, ['member.user', 'member.topic'], function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var groupList = res.body.data;
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

                    done();
                });
            });

            test('Success - include only users', function (done) {
                groupList(agent, user.id, 'member.user', function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var groupList = res.body.data;

                    groupList.rows.forEach(function (group) {
                        assert.isAbove(group.members.users.count, 0);
                        assert.equal(group.members.users.count, group.members.users.rows.length);
                        assert.notProperty(group.members.topics, 'rows');
                    });
                    done();
                });
            });

            test('Success - include only topics', function (done) {
                groupList(agent, user.id, 'member.topic', function (err, res) {
                    if (err) {
                        return done(err);
                    }

                    var groupList = res.body.data;
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
                    done();
                });
            });

            test('Fail - Unauthorized', function (done) {
                _groupList(request.agent(app), user.id, null, 401, function (err) {
                    if (err) {
                        return done(err);
                    }

                    done();
                });
            });

        });

        suite('Members', function () {

            suite('Users', function () {

                suite('Create', function () {
                    var agent = request.agent(app);
                    var creator;
                    var member;
                    var group;

                    setup(function (done) {
                        userLib.createUser(agent, null, null, null, function (err, m) {
                            if (err) {
                                return done(err);
                            }

                            member = m;
                            userLib.createUserAndLogin(agent, null, null, null, function (err, c) {
                                if (err) {
                                    return done(err);
                                }

                                creator = c;
                                groupCreate(agent, creator.id, 'Test Group add members', null, null, function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    group = res.body.data;

                                    done();
                                });
                            });
                        });
                    });

                    test('Success - add member with User id', function (done) {
                        var members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                            if (err) {
                                return done(err);
                            }

                            groupRead(agent, creator.id, group.id, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                var groupRead = res.body.data;

                                assert.equal(groupRead.id, group.id);
                                assert.equal(groupRead.members.count, 2);

                                done();
                            });
                        });
                    });

                    test('Success - add same member with User id twice', function (done) {
                        var members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                            if (err) {
                                return done(err);
                            }

                            // Change Member level
                            var addedMember = members[0];
                            addedMember.level = GroupMember.LEVELS.admin;

                            groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                                if (err) {
                                    return done(err);
                                }

                                GroupMember
                                    .findOne({
                                        where: {
                                            groupId: group.id,
                                            userId: addedMember.userId
                                        }
                                    })
                                    .then(function (member) {
                                        // No changing level! https://trello.com/c/lWnvvPq5/47-bug-invite-members-can-create-a-situation-where-0-admin-members-remain-for-a-topic
                                        assert.notEqual(member.level, addedMember.level);
                                        done();
                                    })
                                    .catch(done);
                            });
                        });
                    });

                    test('Success - add members with User id and e-mail', function (done) {
                        var members = [
                            {
                                userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists@test.com',
                                level: GroupMember.LEVELS.admin
                            },
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                            if (err) {
                                return done(err);
                            }

                            groupRead(agent, creator.id, group.id, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                var groupRead = res.body.data;

                                assert.equal(groupRead.id, group.id);
                                assert.equal(groupRead.members.count, 3);

                                done();
                            });
                        });
                    });

                    test('Success - add member with e-mail and level and language', function (done) {
                        var members = [
                            {
                                userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists@test.com',
                                level: GroupMember.LEVELS.admin,
                                language: 'et'
                            }
                        ];

                        groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                            if (err) {
                                return done(err);
                            }

                            groupRead(agent, creator.id, group.id, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                var groupRead = res.body.data;

                                assert.equal(groupRead.id, group.id);
                                assert.equal(groupRead.members.count, 2);

                                // Verify that the User was created in expected language
                                User
                                    .findOne({
                                        where: {
                                            email: members[0].userId
                                        }
                                    })
                                    .then(function (user) {
                                        assert.equal(user.language, members[0].language);
                                        done();
                                    })
                                    .catch(done);
                            });
                        });
                    });

                    test('Success - add member with e-mail only - level should default to "read"', function (done) {
                        var members = [
                            {
                                userId: 'test_' + Math.random().toString(36).replace(/[^a-z0-9]+/g, '') + 'A1_notexists@test.com'
                            }
                        ];

                        groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                            if (err) {
                                return done(err);
                            }

                            groupRead(agent, creator.id, group.id, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                var groupRead = res.body.data;

                                assert.equal(groupRead.id, group.id);
                                assert.equal(groupRead.members.count, 2);

                                done();
                            });
                        });
                    });

                    test('Success - add member, remove and add the same member back again', function (done) {
                        var members = [
                            {
                                userId: member.id,
                                level: GroupMember.LEVELS.read
                            }
                        ];

                        groupMembersCreate(agent, creator.id, group.id, members, function () {
                            groupMembersDelete(agent, creator.id, group.id, member.id, function () {
                                groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                                    if (err) {
                                        return done(err);
                                    }

                                    done();
                                });
                            });
                        });
                    });


                    test('Fail - Forbidden - at least admin permissions required', function (done) {
                        var agent = request.agent(app);
                        var email = 'test_groupdf_' + new Date().getTime() + '@test.ee';
                        var password = 'testPassword123';

                        var members = [
                            {
                                userId: 'adsads', // Foobar is OK as validation is before insert..
                                level: GroupMember.LEVELS.admin
                            }
                        ];

                        userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            _groupMembersCreate(agent, res.id, group.id, members, 403, function () {
                                if (err) {
                                    return done(err);
                                }

                                done(err);
                            });
                        });
                    });

                });

                suite('List', function () {

                    test.skip('Success', function (done) {
                        // TODO: Implement member list tests
                        done();
                    });

                });

                suite('Update', function () {

                    var agent = request.agent(app);
                    var creatorEmail = 'test_gmembersgu_c_' + new Date().getTime() + '@test.ee';
                    var creatorPassword = 'testPassword123';

                    var memberEmail = 'test_gmembersgu_m_' + new Date().getTime() + '@test.ee';
                    var memberPassword = 'testPassword123';

                    var creator;
                    var member;
                    var group;

                    suiteSetup(function (done) {
                        userLib.createUser(agent, memberEmail, memberPassword, null, function (err, m) {
                            if (err) {
                                return done(err);
                            }

                            member = m;

                            userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null, function (err, c) {
                                if (err) {
                                    return done(err);
                                }

                                creator = c;
                                groupCreate(agent, creator.id, 'Test Group edit members', null, null, function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    group = res.body.data;

                                    var members = [
                                        {
                                            userId: member.id,
                                            level: GroupMember.LEVELS.read
                                        }
                                    ];

                                    groupMembersCreate(agent, res.id, group.id, members, function (err) {
                                        if (err) {
                                            return done(err);
                                        }

                                        done(err);
                                    });
                                });
                            });
                        });
                    });

                    test('Success', function (done) {
                        groupMembersUpdate(agent, creator.id, group.id, member.id, GroupMember.LEVELS.admin, function (err) {
                            if (err) {
                                return done(err);
                            }

                            GroupMember
                                .findOne({
                                    where: {
                                        groupId: group.id,
                                        userId: member.id
                                    }
                                })
                                .then(function (gm) {
                                    assert.equal(gm.userId, member.id);
                                    assert.equal(gm.level, GroupMember.LEVELS.admin);
                                    done();
                                })
                                .catch(done);
                        });
                    });

                    test('Fail - Forbidden - must have at least admin level to edit member permissions', function (done) {
                        var agent = request.agent(app);
                        var email = 'test_gmembersuf_' + new Date().getTime() + '@test.ee';
                        var password = 'testPassword123';

                        userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            _groupMembersUpdate(agent, res.id, group.id, member.id, GroupMember.LEVELS.read, 403, function (err) {
                                if (err) {
                                    return done(err);
                                }

                                done(err);
                            });
                        });
                    });


                    test('Fail - Bad Request - cannot revoke admin permissions from the last admin user', function (done) {
                        groupCreate(agent, creator.id, 'Test Group edit members fail', null, null, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            var g = res.body.data;

                            // Add one non-admin member just to mix the water a bit...
                            var members = [
                                {
                                    userId: member.id,
                                    level: GroupMember.LEVELS.read
                                }
                            ];

                            groupMembersCreate(agent, creator.id, g.id, members, function (err) {
                                if (err) {
                                    return done(err);
                                }

                                // Creator tries to degrade his own permissions while being the last admin user
                                _groupMembersUpdate(agent, creator.id, g.id, creator.id, GroupMember.LEVELS.read, 400, function (err) {
                                    if (err) {
                                        return done(err);
                                    }

                                    done(err);
                                });
                            });
                        });
                    });
                });

                suite('Delete', function () {
                    var agent = request.agent(app);
                    var creatorEmail = 'test_gmembersgd_c_' + new Date().getTime() + '@test.ee';
                    var creatorPassword = 'testPassword123';

                    var memberEmail = 'test_gmembersgd_m_' + new Date().getTime() + '@test.ee';
                    var memberPassword = 'testPassword123';

                    var creator;
                    var member;
                    var group;

                    suiteSetup(function (done) {
                        userLib.createUser(agent, memberEmail, memberPassword, null, function (err, m) {
                            if (err) {
                                return done(err);
                            }

                            member = m;
                            userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null, function (err, c) {
                                if (err) {
                                    return done(err);
                                }

                                creator = c;
                                groupCreate(agent, creator.id, 'Test Group add members', null, null, function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    group = res.body.data;

                                    var members = [
                                        {
                                            userId: member.id,
                                            level: GroupMember.LEVELS.read
                                        }
                                    ];

                                    groupMembersCreate(agent, creator.id, group.id, members, function () {
                                        groupRead(agent, creator.id, group.id, function (err, res) {
                                            if (err) {
                                                return done(err);
                                            }

                                            var group = res.body.data;
                                            assert.equal(group.members.count, 2);

                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });

                    test('Success', function (done) {
                        groupMembersDelete(agent, creator.id, group.id, member.id, function (err) {
                            if (err) {
                                return done(err);
                            }

                            groupRead(agent, creator.id, group.id, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                var group = res.body.data;
                                assert.equal(group.members.count, 1);

                                done();
                            });
                        });
                    });

                    test('Success - Member leaves group', function (done) {
                        var deleteAgent = request.agent(app);
                        var deleteMemberEmail = 'test_gmembersgd_m2_' + new Date().getTime() + '@test.ee';
                        var deleteMemberPassword = 'testPassword123';
                        var deleteMember;

                        userLib.createUserAndLogin(deleteAgent, deleteMemberEmail, deleteMemberPassword, null, function (err, m2) {
                            if (err) {
                                return done(err);
                            }

                            deleteMember = m2;
                            var members = [
                                {
                                    userId: deleteMember.id,
                                    level: GroupMember.LEVELS.read
                                }
                            ];

                            groupMembersCreate(agent, creator.id, group.id, members, function () {
                                groupRead(agent, creator.id, group.id, function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    var group = res.body.data;
                                    assert.equal(group.members.count, 2);

                                    groupMembersDelete(deleteAgent, deleteMember.id, group.id, deleteMember.id, function (err) {
                                        if (err) {
                                            return done(err);
                                        }

                                        groupRead(agent, creator.id, group.id, function (err, res) {
                                            if (err) {
                                                return done(err);
                                            }

                                            var group = res.body.data;
                                            assert.equal(group.members.count, 1);

                                            for (var i = 0; i < group.members.length; i++) {
                                                assert.notEqual(group.members[i].id, deleteMember.id);
                                            }

                                            done();
                                        });
                                    });
                                });
                            });
                        });
                    });

                    test('Fail - Forbidden - at least admin permissions required', function (done) {
                        var agent = request.agent(app);
                        var email = 'test_gmembersdf_' + new Date().getTime() + '@test.ee';
                        var password = 'testPassword123';

                        userLib.createUserAndLogin(agent, email, password, null, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            _groupMembersDelete(agent, res.id, group.id, member.id, 403, function (err) {
                                if (err) {
                                    return done(err);
                                }

                                done(err);
                            });
                        });
                    });


                    test('Fail - Bad Request - Cannot delete the last admin member', function (done) {
                        groupCreate(agent, creator.id, 'Test Group delete members fail', null, null, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            var g = res.body.data;

                            // Add one non-admin member just to mix the water a bit...
                            var members = [
                                {
                                    userId: member.id,
                                    level: GroupMember.LEVELS.read
                                }
                            ];

                            groupMembersCreate(agent, creator.id, g.id, members, function () {
                                // Creator tries to degrade his own permissions while being the last admin user
                                _groupMembersDelete(agent, creator.id, g.id, creator.id, 400, function (err) {
                                    if (err) {
                                        return done(err);
                                    }

                                    // Be the error what it is, the member count must remain the same
                                    groupRead(agent, creator.id, g.id, function (err, res) {
                                        if (err) {
                                            return done(err);
                                        }

                                        var group = res.body.data;
                                        assert.equal(group.members.count, 2);

                                        done();
                                    });
                                });
                            });
                        });
                    });
                });

            });

            suite('Topics', function () {

                suite('List', function () {

                    var agent = request.agent(app);

                    var creatorEmail = 'test_gmemberstopicsgd_c_' + new Date().getTime() + '@test.ee';
                    var creatorPassword = 'testPassword123';

                    var creator;
                    var group;

                    suiteSetup(function (done) {
                        userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null, function (err, c) {
                            if (err) {
                                return done(err);
                            }

                            creator = c;

                            groupCreate(agent, creator.id, 'Test Group list member topics', null, null, function (err, res) {
                                if (err) {
                                    return done(err);
                                }

                                group = res.body.data;

                                topicLib.topicCreate(agent, null, creator.id, null, null, null, '<!DOCTYPE HTML><html><body><h1>H1</h1></body></html>', null, function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    var topicCreated = res.body.data;

                                    var memberGroup = {
                                        groupId: group.id,
                                        level: TopicMember.LEVELS.edit
                                    };

                                    topicLib.topicMemberGroupsCreate(agent, creator.id, topicCreated.id, memberGroup, done);
                                });

                            });
                        });
                    });


                    test('Success', function (done) {
                        groupMembersTopicsList(agent, creator.id, group.id, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            assert.equal(res.body.data.rows.length, 1);

                            var groupMemberTopic = res.body.data.rows[0];

                            assert.isNotNull(groupMemberTopic.id);
                            assert.isNotNull(groupMemberTopic.title);

                            var creatorExpected = creator.toJSON();
                            delete creatorExpected.email;
                            delete creatorExpected.language;
                            assert.deepEqual(groupMemberTopic.creator, creatorExpected);

                            assert.equal(groupMemberTopic.permission.level, TopicMember.LEVELS.admin);
                            assert.equal(groupMemberTopic.permission.levelGroup, TopicMember.LEVELS.edit);

                            done();
                        });
                    });

                });

                suite('Delete', function () {
                    var agent = request.agent(app);

                    var creatorEmail = 'test_gmembersgd_c_' + new Date().getTime() + '@test.ee';
                    var creatorPassword = 'testPassword123';

                    var memberEmail = 'test_gmembersgd_m_' + new Date().getTime() + '@test.ee';
                    var memberPassword = 'testPassword123';

                    var creator;
                    var member;
                    var group;

                    suiteSetup(function (done) {
                        userLib.createUser(agent, memberEmail, memberPassword, null, function (err, m) {
                            if (err) {
                                return done(err);
                            }

                            member = m;
                            userLib.createUserAndLogin(agent, creatorEmail, creatorPassword, null, function (err, c) {
                                if (err) {
                                    return done(err);
                                }

                                creator = c;

                                groupCreate(agent, creator.id, 'Test Group add members', null, null, function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    group = res.body.data;

                                    var members = [
                                        {
                                            userId: member.id,
                                            level: GroupMember.LEVELS.read
                                        }
                                    ];

                                    groupMembersCreate(agent, creator.id, group.id, members, function (err) {
                                        if (err) {
                                            return done(err);
                                        }

                                        groupRead(agent, creator.id, group.id, function (err, res) {
                                            if (err) {
                                                return done(err);
                                            }

                                            var groupRead = res.body.data;

                                            assert.equal(groupRead.members.count, 2);

                                            done();
                                        });
                                    });

                                });
                            });
                        });
                    });

                    test('Success - Remove Topic from Group after Topic delete', function (done) {
                        var topic;
                        topicLib.topicCreate(agent, null, member.id, null, null, null, null, null, function (err, res) {
                            if (err) {
                                return done(err);
                            }

                            topic = res.body.data;

                            var memberGroup = {
                                groupId: group.id,
                                level: TopicMember.LEVELS.read
                            };

                            topicLib.topicMemberGroupsCreate(agent, member.id, topic.id, memberGroup, function (err) {
                                if (err) {
                                    return done(err);
                                }

                                groupList(agent, member.id, null, function (err, res) {
                                    if (err) {
                                        return done(err);
                                    }

                                    var groupData = res.body.data;
                                    assert.equal(groupData.rows[0].members.topics.count, 1);

                                    topicLib.topicDelete(agent, member.id, topic.id, function (err) {
                                        if (err) {
                                            return done(err);
                                        }

                                        groupList(agent, member.id, null, function (err, res) {
                                            if (err) {
                                                return done(err);
                                            }

                                            var groupData2 = res.body.data;
                                            assert.equal(groupData2.rows[0].members.topics.count, 0);

                                            done();
                                        });
                                    });

                                });
                            });
                        });
                    });

                });

            });

        });

    });

});
