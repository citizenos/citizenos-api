'use strict';

const hooks = require('../../libs/sequelize/hooks');

/**
 * VoteOption
 *
 * Represents one Option in the Vote.
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    const RESERVED_PREFIX = '__';
    const VALUE_MAX_LENGTH = 200;

    const VoteOption = sequelize.define(
        'VoteOption',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            voteId: {
                type: DataTypes.UUID,
                allowNull: false,
                comment: 'To what Vote this option belongs to.',
                references: {
                    model: 'Votes',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            value: {
                type: DataTypes.STRING(VALUE_MAX_LENGTH),
                allowNull: false,
                comment: 'Option value shown to the voter.',
                validate: {
                    len: {
                        args: [1, VALUE_MAX_LENGTH],
                        msg: `Option value can be 1 to ${VALUE_MAX_LENGTH} characters long.`
                    }
                }
            }
        }
    );

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    VoteOption.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        const data = {
            id: this.dataValues.id,
            value: this.dataValues.value,
            voteCount: this.dataValues.voteCount, // HAX: added by certain queries
            selected: this.dataValues.selected // HAX: added by certain queries
        };

        return data;
    };

    /**
     * BeforeValidate hook
     *
     * Used for trimming all string values and sanitizing input before validators run.
     *
     * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
     */
    VoteOption.beforeValidate(hooks.trim);

    VoteOption.RESERVED_PREFIX = RESERVED_PREFIX;
    VoteOption.VALUE_MAX_LENGTH = VALUE_MAX_LENGTH;

    return VoteOption;
};
