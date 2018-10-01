'use strict';

var hooks = require('../libs/sequelize/hooks');

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
const VoteOption = function (sequelize, DataTypes) {

    var RESERVED_PREFIX = '__';

    var VoteOption = sequelize.define(
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
                }
            },
            value: {
                type: DataTypes.STRING(100),
                allowNull: false,
                comment: 'Option value shown to the voter.',
                validate: {
                    len: {
                        args: [1, 100],
                        msg: 'Option value can be 1 to 100 characters long.'
                    }
                }
            }
        }
    );

    /**
     * BeforeValidate hook
     *
     * Used for trimming all string values and sanitizing input before validators run.
     *
     * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
     */
    VoteOption.beforeValidate(hooks.trim);

    VoteOption.RESERVED_PREFIX = RESERVED_PREFIX;

    return VoteOption;
};

// Overrides the default toJSON() to avoid sensitive data from ending up in the output.
// Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
VoteOption.prototype.toJSON = function () {
    // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
    var data = {
        id: this.dataValues.id,
        value: this.dataValues.value,
        voteCount: this.dataValues.voteCount, // HAX: added by certain queries
        selected: this.dataValues.selected // HAX: added by certain queries
    };

    return data;
};

module.exports = VoteOption;
