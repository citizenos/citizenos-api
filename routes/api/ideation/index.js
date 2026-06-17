'use strict';

const { capitalizeFirstLetter } = require('../../../libs/util');

module.exports = function (app) {
    const logger = app.get('logger');
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');
    const db = models.sequelize;
    const fastCsv = app.get('fastCsv');

    const Ideation = models.Ideation;
    const TopicMemberUser = models.TopicMemberUser;
    const Topic = models.Topic;

    const topicService = app.get('topicService');
    const ideationService = app.get('ideationService');

    /**
     * Create an Ideation
     */
    app.post('/api/users/:userId/topics/:topicId/ideations', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft]), async (req, res, next) => {
        try {
            const data = {
                question: req.body.question,
                deadline: req.body.deadline ? new Date(req.body.deadline) : req.body.deadline,
                allowAnonymous: req.body.allowAnonymous || false,
                template: req.body.template,
                demographicsConfig: req.body.demographicsConfig,
                disableReplies: req.body.disableReplies || false
            };

            if (data.allowAnonymous) {
                data.disableReplies = true;
            }

            if (!data.question) {
                return res.badRequest('Ideation question is missing', 1);
            }

            const ideation = await ideationService.create(req.params.topicId, data, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });

            return res.created(ideation.toJSON());
        } catch (err) {
            next(err);
        }
    });

    /**
     * Read an Ideation (Internal helper)
     */
    const _readIdeation = async (req, res, next) => {
        try {
            const ideationInfo = await ideationService.getById(req.params.ideationId);
            if (!ideationInfo) return res.notFound();
            return res.ok(ideationInfo);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Read Ideation Participants (Internal helper)
     */
    const _readIdeationParticipants = async (req, res, next) => {
        try {
            const participants = await ideationService.getParticipants(req.params.ideationId);
            return res.ok(participants);
        } catch (err) {
            next(err);
        }
    };

    /**
     * Routes for Ideation and Participants
     */
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/participants', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeationParticipants(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId/participants', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId } }]
            });
            if (!topic || !topic.Ideations?.length || topic.visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeationParticipants(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        return _readIdeation(req, res, next);
    });

    app.get('/api/topics/:topicId/ideations/:ideationId', async (req, res, next) => {
        try {
            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId } }]
            });
            if (!topic || !topic.Ideations?.length || topic.visibility === Topic.VISIBILITY.private) {
                return res.notFound();
            }
            return _readIdeation(req, res, next);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Download Ideation Ideas
     */
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/download', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.read, true), async (req, res, next) => {
        try {
            const ideationId = req.params.ideationId;
            const connectionManager = db.connectionManager;
            const connection = await connectionManager.getConnection();

            const query = await ideationService.exportIdeas(ideationId);
            const stream = connection.query(query);

            const csvStream = fastCsv.format({
                headers: true,
                rowDelimiter: '\r\n'
            });

            stream.on('data', function (ideaResult) {
                const demographics = ideaResult.Demographics || {};
                delete ideaResult.Demographics;
                delete ideaResult.Status;
                const parsedDemographics = Object.keys(demographics).reduce((acc, key) => ({
                    ...acc,
                    [capitalizeFirstLetter(key)]: demographics[key]
                }), {})

                const csvData = {
                    ...ideaResult,
                    ...parsedDemographics
                };

                csvStream.write(csvData);
            });

            stream.on('error', function (err) {
                logger.error('Generating ideation CSV FAILED', err);
                csvStream.end();
                connectionManager.releaseConnection(connection);
            });

            stream.on('end', function () {
                logger.debug('Generating ideation CSV succeeded');
                csvStream.end();
                connectionManager.releaseConnection(connection);
            });

            res.set('Content-disposition', `attachment; filename=Ideas export.csv`);
            res.set('Content-Type', 'text/csv');

            csvStream.pipe(res);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Update an Ideation
     */
    app.put('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin, null, [Topic.STATUSES.draft, Topic.STATUSES.ideation]), async (req, res, next) => {
        try {
            const fieldsAllowed = ['deadline', 'disableReplies', 'template', 'demographicsConfig'];
            const topic = await topicService.getById(req.params.topicId, null, {
                include: [{ model: Ideation, where: { id: req.params.ideationId } }]
            });

            if (!topic?.Ideations?.length) return res.notFound();

            if (topic.status === Topic.STATUSES.draft) {
                fieldsAllowed.push('question');
                fieldsAllowed.push('allowAnonymous');
            }

            const data = {};
            fieldsAllowed.forEach((field) => {
                if (req.body[field] !== undefined && req.body[field] !== null) {
                    if (field === 'deadline') {
                        data[field] = new Date(req.body[field]);
                    } else {
                        data[field] = req.body[field];
                    }
                }
            });

            const ideation = await ideationService.update(req.params.ideationId, req.params.topicId, data, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });

            return res.ok(ideation);
        } catch (err) {
            next(err);
        }
    });

    /**
     * Delete an Ideation
     */
    app.delete('/api/users/:userId/topics/:topicId/ideations/:ideationId', loginCheck(['partner']), topicService.hasPermission(TopicMemberUser.LEVELS.admin), async (req, res, next) => {
        try {
            await ideationService.destroy(req.params.ideationId, req.params.topicId, req.user.userId || req.user.id, {
                ip: req.ip,
                path: req.method + ' ' + req.path
            });
            return res.ok();
        } catch (err) {
            next(err);
        }
    });
};
