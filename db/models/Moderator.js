'use strict';

const Sequelize = require('sequelize');

/**
 * Moderator
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var Op = Sequelize.Op;

    var Moderator = sequelize.define(
        'Moderator',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: sequelize.literal('(md5(((random())::text || (clock_timestamp())::text)))::uuid') // Generate ID on the DB side for now as there is no admin interface and Moderators are created manually
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'Id of the User of the Moderator',
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            partnerId: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Which Partner moderator represents. One User can be a moderator of many Partners',
                references: {
                    model: 'Partners',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            }
        },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['userId', 'partnerId'],
                    where: {
                        partnerId: {
                            [Op.not]: null
                        }
                    }
                },
                {
                    unique: true,
                    fields: ['userId'],
                    where: {
                        partnerId: {
                            [Op.eq]: null
                        }
                    }
                }
            ]
        }
    );

    return Moderator;
};
