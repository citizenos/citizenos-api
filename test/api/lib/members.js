'use strict';

/**
 * Lib of convenience methods to make testing easier
 */

module.exports = function (app) {
    const models = app.get('models');

    const TopicMemberUser = models.TopicMemberUser;
    const GroupMemberUser = models.GroupMemberUser;


    const _topicMemberUsersCreate = async (topicId, members) => {
        const createPromises = members.map((member) => {
            return TopicMemberUser
                .findOrCreate({
                    where: {
                        topicId,
                        userId: member.userId
                    },
                    defaults: {
                        level: member.level || TopicMemberUser.LEVELS.read
                    }
                });
        });

        const results = await Promise.all(createPromises);

        return results;
    };

    const _groupMemberUsersCreate = async (groupId, members) => {
        const createPromises = members.map((member) => {
            return GroupMemberUser.findOrCreate({
                where: {
                    groupId,
                    userId: member.userId
                },
                defaults: {
                    level: member.level || GroupMemberUser.LEVELS.read
                }
            });
        });
        const results = await Promise.all(createPromises);

        return results;
    };

    return {
        topicMemberUsersCreate: _topicMemberUsersCreate,
        groupMemberUsersCreate: _groupMemberUsersCreate
    }
}