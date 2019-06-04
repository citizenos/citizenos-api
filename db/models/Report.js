'use strict';

var _ = require('lodash');
var hooks = require('../../libs/sequelize/hooks');

/**
 * Report
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var TYPES = {
        abuse: 'abuse', // is abusive or insulting
        obscene: 'obscene', // contains obscene language
        spam: 'spam', // contains spam or is unrelated to topic
        hate: 'hate', // contains hate speech
        netiquette: 'netiquette', // infringes (n)etiquette
        duplicate: 'duplicate' // duplicate
    };

    var Report = sequelize.define(
        'Report',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            type: {
                type: DataTypes.ENUM,
                values: _.values(TYPES),
                allowNull: false,
                comment: 'Report reason - verbal abuse, obscene content, hate speech etc..'
            },
            text: {
                type: DataTypes.STRING(2048),
                allowNull: false,
                validate: {
                    len: {
                        args: [1, 2048],
                        msg: 'Report text can be 1 to 2048 characters long.'
                    }
                },
                comment: 'Additional comment for the report to provide more details on the violation.'
            },
            creatorId: {
                type: DataTypes.UUID,
                comment: 'User ID of the reporter.',
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            creatorIp: {
                type: DataTypes.STRING(45), // No specific DataType in Sequelize so STRING(45) supports IPv6 and IPv4 notations
                comment: 'IP address of the reporter',
                allowNull: false
            }
        }
    );

    Report.associate = function (models) {
        // TODO: funky association for cascade delete and right reportId reference
        Report.belongsToMany(models.Comment, {
            through: models.CommentReport,
            foreignKey: 'reportId',
            constraints: true
        });
    };

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    Report.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        var data = {
            id: this.dataValues.id,
            type: this.dataValues.type,
            text: this.dataValues.text,
            createdAt: this.dataValues.createdAt
        };

        if (this.dataValues.creator) {
            data.creator = this.dataValues.creator;
        } else {
            data.creator = {};
            data.creator.id = this.dataValues.creatorId;
        }

        return data;
    };

    /**
     * BeforeValidate hook
     *
     * Used for trimming all string values and sanitizing input before validators run.
     *
     * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
     */
    Report.beforeValidate(hooks.trim);

    Report.TYPES = TYPES;

    return Report;
};
