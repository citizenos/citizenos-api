'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const models = app.get('models');
    const db = models.sequelize;
    const cosActivities = app.get('cosActivities');
    const authTokenRestrictedUse = app.get('middleware.authTokenRestrictedUse');
    const emailLib = app.get('email');

    const Idea = models.Idea;
    const IdeaComment = models.IdeaComment;
    const Report = models.Report;
    const IdeaReport = models.IdeaReport;

    const ideationService = app.get('ideationService');
    const commentsService = app.get('commentsService');

    const commentsLib = commentsService({
        parentModel: Idea,
        parentIdParam: 'ideaId',
        joinModel: IdeaComment,
        joinParentIdField: 'ideaId',
        contextName: 'Idea',
        listByTopic: false
    });

    /**
     * Idea Reports
     */
    const ideaReportsCreate = async (req, res, next) => {
        try {
            const idea = await Idea.findByPk(req.params.ideaId);
            if (!idea) return res.notFound();
            const userId = req.user.userId || req.user.id;

            await db.transaction(async (t) => {
                const report = await Report.create({
                    type: req.body.type,
                    text: req.body.text,
                    creatorId: userId,
                    creatorIp: req.ip
                }, { transaction: t });

                await IdeaReport.create({ ideaId: idea.id, reportId: report.id }, { transaction: t });
                await cosActivities.addActivity(report, { type: 'User', id: userId, ip: req.ip }, null, idea, req.method + ' ' + req.path, t);

                await emailLib.sendIdeaReport(idea.id, report);
                t.afterCommit(() => res.ok(report));
            });
        } catch (err) {
            next(err);
        }
    };

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports', loginCheck(['partner']), ideaReportsCreate);
    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports', loginCheck(['partner']), ideaReportsCreate);

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId', authTokenRestrictedUse, async (req, res, next) => {
        try {
            const ideaReport = await ideationService.getReportById(req.params.reportId, req.params.ideaId);
            if (!ideaReport) return res.notFound();
            return res.ok(ideaReport);
        } catch (err) {
            next(err);
        }
    });
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId', authTokenRestrictedUse, async (req, res, next) => {
        try {
            const ideaReport = await ideationService.getReportById(req.params.reportId, req.params.ideaId);
            if (!ideaReport) return res.notFound();
            return res.ok(ideaReport);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/reports/:reportId/moderate', authTokenRestrictedUse, async (req, res, next) => {
        try {
            if (!req.body.type) return res.badRequest({ type: 'Property type is required' });
            await ideationService.moderateIdeaReport(req.params.reportId, req.params.ideaId, req.params.topicId, req.body, req.locals.tokenDecoded.userId, { ip: req.ip, path: req.method + ' ' + req.path });
            return res.ok();
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports', loginCheck(['partner']), commentsLib.createReport);
    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports', loginCheck(['partner']), commentsLib.createReport);

    app.get('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId', authTokenRestrictedUse, commentsLib.readReport);
    app.get('/api/users/:userId/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId', authTokenRestrictedUse, commentsLib.readReport);

    app.post('/api/topics/:topicId/ideations/:ideationId/ideas/:ideaId/comments/:commentId/reports/:reportId/moderate', authTokenRestrictedUse, commentsLib.moderateReport);
};
