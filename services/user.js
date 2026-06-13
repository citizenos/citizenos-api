'use strict';

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const User = models.User;
    const UserConsent = models.UserConsent;
    const UserConnection = models.UserConnection;
    const UserNotificationSettings = models.UserNotificationSettings;

    const logger = app.get('logger');
    const emailLib = app.get('email');
    const config = app.get('config');
    const cosActivities = app.get('cosActivities');
    const jwt = app.get('jwt');
    const uuid = app.get('uuid');
    const moment = app.get('moment');
    const cryptoLib = app.get('cryptoLib');
    const cosUpload = app.get('cosUpload');
    const validator = app.get('validator');
    const authUser = require('../routes/api/auth')(app);

    const fs = require('fs');
    const path = require('path');
    const Op = db.Sequelize.Op;

    return {
        async uploadImage(req, user) {
            let imageUrl;
            try {
                imageUrl = await cosUpload.upload(req, 'users', user.id);
            } catch (err) {
                if (err.type && (err.type === 'fileSize' || err.type === 'fileType')) {
                    const error = new Error(err.message);
                    error.status = 403;
                    throw error;
                } else {
                    throw err;
                }
            }

            await User.update(
                {
                    imageUrl: imageUrl.link
                },
                {
                    where: { id: user.id },
                    limit: 1,
                    returning: true
                }
            );

            return imageUrl;
        },

        async updateUser(user, data, partnerId, redirectSuccess) {
            const fields = ['name', 'company', 'email', 'language', 'imageUrl', 'termsVersion', 'preferences'];
            if (!partnerId && data.password && data.newPassword) { // Allow only our own app change the password
                fields.push('password');
            }
            let updateEmail = false;

            if (data.email && data.email !== user.email) {
                updateEmail = true;
                fields.push('emailIsVerified');
                fields.push('emailVerificationCode');
                data.emailIsVerified = false;
                data.emailVerificationCode = uuid.v4(); // Generate new emailVerificationCode
            }
            if (data.termsVersion && data.termsVersion !== user.termsVersion) {
                fields.push('termsAcceptedAt');
                data.termsAcceptedAt = moment().format();
            }

            if ((user.email && updateEmail) || data.newPassword) {
                if (!data.password || user.password !== cryptoLib.getHash(data.password, 'sha256')) {
                    const error = new Error('Invalid password');
                    error.status = 400;
                    throw error;
                }
                if (data.newPassword) {
                    data.password = data.newPassword;
                }
            }

            if (Object.keys(data).indexOf('imageUrl') > -1 && !data.imageUrl && user.imageUrl) {
                const currentImageURL = new URL(user.imageUrl);
                if (config.storage?.type.toLowerCase() === 's3' && currentImageURL.href.indexOf(`https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/users/${user.id}`) === 0) {
                    await cosUpload.delete(currentImageURL.pathname)
                } else if (config.storage?.type.toLowerCase() === 'local' && currentImageURL.hostname === (new URL(config.url.api)).hostname) {
                    const appDir = path.resolve(__dirname, '../public/uploads/users');
                    const baseFolder = config.storage.baseFolder || appDir;
                    try {
                        fs.unlinkSync(`${baseFolder}/${path.parse(currentImageURL.pathname).base}`);
                    } catch(e) {
                        logger.error('Failed to delete user image', e);
                    }
                }
            }
            const results = await User.update(
                data,
                {
                    where: { id: user.id },
                    fields: fields,
                    limit: 1,
                    returning: true
                }
            );

            if (!results[1]) {
                return null;
            }

            const updatedUser = results[1][0];

            if (updateEmail) {
                await UserConnection.update({
                    connectionData: updatedUser
                }, {
                    where: {
                        connectionId: UserConnection.CONNECTION_IDS.citizenos,
                        userId: updatedUser.id
                    }
                });
                const tokenData = { redirectSuccess };
                const token = jwt.sign(tokenData, config.session.privateKey, { algorithm: config.session.algorithm });
                await emailLib.sendAccountVerification(updatedUser.email, updatedUser.emailVerificationCode, token);
            }

            return updatedUser;
        },

        async getUser(userId) {
            return await User.findOne({ where: { id: userId } });
        },

        async updateUserAuthorId(userId, authorId) {
            return await User.update(
                { authorId: authorId },
                {
                    where: { id: userId },
                    limit: 1,
                    returning: true
                }
            );
        },

        async deleteUser(userId) {
            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                return false;
            }

            await db.transaction(async function (t) {
                await User.update(
                    {
                        name: 'Anonymous',
                        email: null,
                        company: null,
                        imageUrl: null,
                        sourceId: null
                    },
                    {
                        where: { id: userId },
                        limit: 1,
                        returning: true,
                        transaction: t
                    }
                );

                await User.destroy({
                    where: { id: userId },
                    transaction: t
                });

                await UserConnection.destroy({
                    where: { userId: userId },
                    force: true,
                    transaction: t
                });
            });

            return true;
        },

        async createConsent(userId, partnerId, reqInfo) {
            await db.transaction(async function (t) {
                const created = await UserConsent.upsert(
                    { userId: userId, partnerId: partnerId },
                    { transaction: t }
                );

                if (created) {
                    const userConsent = UserConsent.build({ userId: userId, partnerId: partnerId });
                    await cosActivities.createActivity(
                        userConsent,
                        null,
                        reqInfo,
                        reqInfo.method + ' ' + reqInfo.path,
                        t
                    );
                }
            });
        },

        async getConsents(userId) {
            const results = await db.query(
                `
                SELECT
                    p.id,
                    p.website,
                    p."createdAt",
                    p."updatedAt"
                FROM "UserConsents" uc
                LEFT JOIN "Partners" p ON (p.id = uc."partnerId")
                WHERE uc."userId" = :userId
                    AND uc."deletedAt" IS NULL
                ;`,
                {
                    replacements: { userId: userId },
                    type: db.QueryTypes.SELECT,
                    raw: true,
                    nest: true
                }
            );
            return results;
        },

        async deleteConsent(userId, partnerId, reqInfo) {
            await db.transaction(async function (t) {
                await UserConsent.destroy(
                    {
                        where: { userId: userId, partnerId: partnerId },
                        limit: 1,
                        force: true
                    },
                    { transaction: t }
                );

                const consent = UserConsent.build({ userId: userId, partnerId: partnerId });
                await cosActivities.deleteActivity(
                    consent,
                    null,
                    reqInfo,
                    reqInfo.method + ' ' + reqInfo.path,
                    t
                );
            });
        },

        async getUserConnections(userIdParam) {
            let where;
            if (validator.isUUID(userIdParam)) {
                const user = await User.findOne({
                    where: { id: userIdParam },
                    attributes: ['id']
                });
                if (!user) return null;
                where = { userId: userIdParam };
            } else if (validator.isEmail(userIdParam)) {
                const user = await User.findOne({
                    where: { email: userIdParam },
                    attributes: ['id']
                });
                if (!user) return null;
                where = { userId: user.id };
            } else {
                const error = new Error('Invalid userId');
                error.status = 400;
                throw error;
            }

            const userConnections = await UserConnection.findAll({
                where: where,
                attributes: ['connectionId'],
                order: [[db.cast(db.col('connectionId'), 'TEXT'), 'ASC']]
            });
            return userConnections;
        },

        async createConnection(req, res, userId, connection, token, cert, timeoutMs) {
            let personalInfo;
            if ([UserConnection.CONNECTION_IDS.esteid, UserConnection.CONNECTION_IDS.smartid].indexOf(connection) > -1) {
                if (config.services.idCard && cert) {
                    logger.error('X-SSL-Client-Cert header is not allowed when ID-card service is enabled. IF you trust your proxy, sending the X-SSL-Client-Cert, delete the services.idCard from your configuration.');
                    const error = new Error('X-SSL-Client-Cert header is not allowed when ID-card proxy service is enabled.');
                    error.status = 400;
                    throw error;
                }
                if (!token && !cert) {
                    logger.warn('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!', req.path, req.headers);
                    const error = new Error('Missing required parameter "token" OR certificate in X-SSL-Client-Cert header. One must be provided!');
                    error.status = 400;
                    throw error;
                }
                if (cert || token.indexOf('.') === -1) {
                    personalInfo = await authUser.getIdCardCertStatus(res, token, cert);
                } else {
                    personalInfo = await authUser.getAuthReqStatus(connection, token, timeoutMs);
                }

                if (personalInfo === 'RUNNING') {
                    return 'RUNNING';
                }

                let personId = personalInfo.pid;
                if (personalInfo.pid.indexOf('PNO') > -1) {
                    personId = personId.split('-')[1];
                }
                const countryCode = personalInfo.country || personalInfo.countryCode;
                const connectionUserId = `PNO${countryCode}-${personId}`;

                let isForbidden = false;

                await db.transaction(async function (t) {
                    const userConnectionInfo = await UserConnection.findOne({
                        where: {
                            connectionId: {
                                [Op.in]: [
                                    UserConnection.CONNECTION_IDS.esteid,
                                    UserConnection.CONNECTION_IDS.smartid
                                ]
                            },
                            userId: userId
                        },
                        order: [['createdAt', 'ASC']],
                        include: [User],
                        transaction: t
                    });

                    if (!userConnectionInfo) {
                        await UserConnection.create(
                            {
                                userId: userId,
                                connectionId: connection,
                                connectionUserId: connectionUserId,
                                connectionData: personalInfo
                            },
                            { transaction: t }
                        );
                    } else if (userConnectionInfo.connectionUserId !== connectionUserId) {
                        await authUser.clearSessionCookies(req, res);
                        isForbidden = true;
                    }
                });

                if (isForbidden) {
                    const error = new Error('Forbidden');
                    error.status = 403;
                    throw error;
                }

                return await this.getUserConnections(userId); // returns rows
            } else {
                const error = new Error('Bad request');
                error.status = 400;
                throw error;
            }
        },

        async getNotifications(userId, type) {
            const where = { userId: userId };
            if (type) {
                where.type = type;
            }
            return await UserNotificationSettings.findAll({ where });
        }
    };
};
