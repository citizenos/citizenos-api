'use strict';

const _ = require('lodash');
const cryptoLib = require('../../libs/crypto');
const hooks = require('../../libs/sequelize/hooks');
const Sequelize = require('sequelize');

/**
 * User
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    const SOURCES = {
        citizenos: 'citizenos',
        citizenosSystem: 'citizenosSystem', // Created by CitizenOS systems - migrations, data import etc.
        google: 'google',
        facebook: 'facebook'
    };

    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            name: {
                type: DataTypes.STRING(255),
                comment: 'Full name of the user.',
                validate: {
                    len: {
                        args: [1, 255],
                        msg: 'Name can be 1 to 255 characters long.'
                    }
                }
            },
            company: {
                type: DataTypes.STRING(255),
                comment: 'Company name.',
                len: {
                    args: [1, 255],
                    msg: 'Company name can be 1 to 255 characters long.'
                }
            },
            language: {
                type: DataTypes.STRING(5),
                comment: 'Language code.',
                defaultValue: 'en',
                validate: {
                    is: /[a-z]{2}/i
                },
                set: function (val) {
                    if (!val) {
                        return;
                    }

                    return this.setDataValue('language', val.toLowerCase());
                }
            },
            email: {
                type: DataTypes.STRING(254),
                comment: 'User registration email.',
                set: function (v) {
                    if (v && typeof v.toLowerCase === 'function') {
                        this.setDataValue('email', v.toLowerCase());
                    } else {
                        this.setDataValue('email', v);
                    }
                },
                unique: {
                    msg: 'The email address is already in use.'
                },
                validate: {
                    isEmail: {
                        msg: 'Invalid email.'
                    }
                }
            },
            password: {
                type: DataTypes.STRING(64),
                comment: 'Password hash. NULL if User was created on invitation OR with another method like ESTEID, FB, Google.',
                validate: {
                    isValidPassword: function (v) {
                        const passwordRegexp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
                        if (!passwordRegexp.test(v)) {
                            throw Error('Password must be at least 6 character long, containing at least 1 digit, 1 lower and upper case character.');
                        }
                    }
                }
            },
            passwordResetCode: {
                type: DataTypes.UUID,
                allowNull: true,
                set: function (v) {
                    // Magic setter - if non-null value is passed, new UUID is generated
                    if (!v) {
                        return;
                    }

                    const uuid = Sequelize.Utils.toDefaultValue(DataTypes.UUIDV4());

                    this.setDataValue('passwordResetCode', uuid);
                }
            },
            emailIsVerified: {
                type: DataTypes.BOOLEAN,
                comment: 'Flag indicating if e-mail verification has been completed.',
                allowNull: false,
                defaultValue: false
            },
            emailVerificationCode: {
                type: DataTypes.UUID,
                comment: 'E-mail verification code that is sent out with e-mail as a link.',
                unique: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            // TODO: Move to separate table - https://trello.com/c/71sCR1zZ/178-api-refactor-move-user-source-to-separate-usersources-table-so-i-can-store-all-connections-also-esteid-could-be-another-source-w
            source: {
                type: DataTypes.ENUM,
                values: _.values(SOURCES),
                allowNull: false,
                comment: 'User creation source.'
            },
            sourceId: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'User id in the source system. For Facebook their user id, for Google their user id and so on. Null is allowed as there is not point for CitizenOS to provide one.'
            },
            imageUrl: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'User profile image url.'
            },
            termsVersion: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Version identifier of user terms accepted by user'
            },
            termsAcceptedAt: {
                type: DataTypes.DATE,
                comment: 'Time when the terms were accepted',
                allowNull: true
            },
            authorId: {
                type: DataTypes.STRING,
                allowNull: true,
                comment: 'Etherpad authorID for the user'
            },
            preferences: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'User preferences JSON object',
                set (value) {
                    let final = {};
                    const allowedFields = ['showInSearch'];
                    if (value) {
                        allowedFields.forEach((field) => {
                            final[field] = value[field];
                        });
                    }

                    this.setDataValue('preferences', final);
                }
            }
        }
    );

    User.associate = function (models) {
        User.hasMany(models.UserConnection, {
            foreignKey: 'userId'
        });

        User.hasMany(models.UserConsent, {
            foreignKey: 'userId'
        });

        User.belongsToMany(models.Group, {
            through: models.GroupMemberUser,
            foreignKey: 'userId',
            constraints: true
        });

        User.belongsToMany(models.Topic, {
            through: models.TopicMemberUser,
            foreignKey: 'userId',
            constraints: true
        });

        User.hasMany(models.UserNotificationSettings, {
            foreignKey: 'userId'
        });
    };

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    User.prototype.toJSON = function () {
        // Using whitelist instead of blacklist, so that no accidents occur when adding new properties.
        const user = {
            id: this.dataValues.id,
            name: this.dataValues.name,
            company: this.dataValues.company,
            language: this.dataValues.language,
            email: this.dataValues.email, //TODO: probably should take this out of the responses, is email sensitive? Seems a bit so as used for log-in.
            imageUrl: this.dataValues.imageUrl
        };

        return user;
    };

    /**
     * BeforeValidate hook
     *
     * Used for trimming all string values and sanitizing input before validators run.
     *
     * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
     */
    User.beforeValidate(hooks.trim);


    /**
     * AfterValidate hook
     *
     * Initially used to hash the "password". Not using "set" function on the "password" field because validators are run _after_ the "set".
     *
     * @see http://sequelize.readthedocs.org/en/latest/docs/hooks/
     */
    User.afterValidate(function (user, options) {
        if (!user.password) {
            return;
        }

        user.password = cryptoLib.getHash(user.password, 'sha256');
        options.validate = false; // Stop validation from running twice!
    });

    User.SOURCES = SOURCES;

    return User;
};
