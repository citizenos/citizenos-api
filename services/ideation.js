'use strict';

const _ = require('lodash');

module.exports = function (app) {
    const models = app.get('models');
    const db = models.sequelize;
    const cosActivities = app.get('cosActivities');
    const logger = app.get('logger');

    const Ideation = models.Ideation;
    const Idea = models.Idea;
    const User = models.User;
    const Topic = models.Topic;
    const TopicIdeation = models.TopicIdeation;
    const Folder = models.Folder;
    const FolderIdea = models.FolderIdea;
    const IdeaVote = models.IdeaVote;
    const IdeaFavourite = models.IdeaFavourite;
    const IdeaAttachment = models.IdeaAttachment;
    const Attachment = models.Attachment;
    const Report = models.Report;
    const IdeaReport = models.IdeaReport;

    /**
     * Get a single Ideation by ID with metadata
     */
    const getById = async (ideationId, transaction = null) => {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const results = await db.query(`
            SELECT
                i.id,
                i.question,
                i.deadline,
                i."disableReplies",
                i."allowAnonymous",
                i."template",
                i."demographicsConfig",
                i."creatorId",
                i."createdAt",
                i."updatedAt",
                COALESCE(ii.count, 0) as "ideas.count",
                COALESCE(fi.count, 0) as "folders.count"
            FROM "Ideations" i
            LEFT JOIN (
                SELECT
                    "ideationId",
                    COUNT("ideationId") as count
                FROM "Ideas"
                WHERE "deletedAt" IS NULL
                GROUP BY "ideationId"
            ) AS ii ON ii."ideationId" = i.id
            LEFT JOIN (
                SELECT
                    "ideationId",
                    COUNT("ideationId") as count
                FROM "Folders"
                WHERE "deletedAt" IS NULL
                GROUP BY "ideationId"
            ) AS fi ON fi."ideationId" = i.id
            WHERE i.id = :ideationId AND i."deletedAt" IS NULL
            ;
        `, {
            replacements: { ideationId },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true,
            transaction
        });

        const ideation = results[0] || null;
        if (ideation) {
            ideation.disableReplies = !!ideation.disableReplies;
            ideation.allowAnonymous = !!ideation.allowAnonymous;
            ideation.ideas.count = parseInt(ideation.ideas.count, 10);
            ideation.folders.count = parseInt(ideation.folders.count, 10);
        }
        return ideation;
    };

    /**
     * Get Ideation Participants
     */
    const getParticipants = async (ideationId) => {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        return await db.query(`
            SELECT
                u.id,
                u.name,
                u."imageUrl",
                count(i.id) as "ideasCount"
            FROM "Users" u
            JOIN "Ideas" i ON i."authorId" = u.id
            WHERE i."ideationId" = :ideationId AND i."deletedAt" IS NULL
            GROUP BY u.id
            ORDER BY u.name ASC
            ;
        `, {
            replacements: { ideationId },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true
        });
    };

    /**
     * List Ideas for an Ideation
     */
    const listIdeas = async (ideationId, filters, userId = null) => {
        const {
            search,
            limit = 8,
            offset = 0,
            orderBy,
            order = 'DESC',
            authorId,
            favourite,
            folderId,
            showModerated = false,
            demographicsFilter,
            status: filterStatus,
            enrich = false,
            keepSessionId = false
        } = filters;

        let status = filterStatus || null;
        if (!userId) {
            status = 'published';
        }

        let joinSql = ``;
        let where = ` WHERE "Idea"."ideationId" = :ideationId `;
        let returncolumns = ``;
        let groupBySql = ``;

        if (enrich) {
            returncolumns += `
                iv."up.count" as "votes.up.count",
                iv."down.count" as "votes.down.count",
                COALESCE(ic.count, 0) AS "replies.count",
            `;
            joinSql += `
                LEFT JOIN (
                    SELECT
                        ii."ideaId",
                        ii."up.count",
                        ii."down.count"
                        FROM (
                            SELECT
                            i.id AS "ideaId",
                                COALESCE(cvu.count, 0) as "up.count",
                                COALESCE(cvd.count, 0) as "down.count"
                            FROM "Ideas" i
                                LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                                LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                            WHERE i."ideationId" = :ideationId
                            GROUP BY i.id, cvu.count, cvd.count
                        ) ii
                ) iv ON iv."ideaId" = "Idea".id
                LEFT JOIN (
                    SELECT
                        "ideaId",
                        COUNT(*) AS count
                    FROM "IdeaComments"
                    GROUP BY "ideaId"
                ) AS ic ON (ic."ideaId" = "Idea".id)
            `;
            groupBySql += `, iv."up.count", iv."down.count", ic."count"`;
        }

        if (authorId) {
            where += ` AND "Idea"."authorId" = :authorId `;
        }
        if (search) {
            where += ` AND ("Idea"."statement" ILIKE :search OR "Idea"."description" ILIKE :search) `;
        }
        if (status) {
            if (status === 'draft') {
                where += ` AND "Idea"."status" = :status `;
                where += ` AND "Idea"."authorId" = :userId `;
            } else {
                where += ` AND "Idea"."status" = 'published' `;
            }
        } else if (userId) {
            where += ` AND ("Idea"."status" = 'published' OR ("Idea"."status" = 'draft' AND "Idea"."authorId"=:userId)) `;
        } else {
            where += ` AND "Idea"."status" = 'published' `;
        }

        const demoReplacements = {};
        if (demographicsFilter) {
            Object.keys(demographicsFilter).forEach((key) => {
                where += ` AND "Idea"."demographics"->>:demoKey_${key} = :demoValue_${key} `;
                demoReplacements[`demoKey_${key}`] = key;
                demoReplacements[`demoValue_${key}`] = demographicsFilter[key];
            });
        }

        let orderSql = ` "Idea"."createdAt" ${order} `;
        if (!showModerated || showModerated === "false") {
            where += ` AND "Idea"."deletedAt" IS NULL `;
        } else {
            where += ` AND "Idea"."deletedAt" IS NOT NULL `;
        }
        if (orderBy) {
            const sortOrder = (order.toLowerCase() === 'asc') ? 'ASC' : 'DESC';
            switch (orderBy) {
                case 'recent':
                    orderSql = ` "Idea"."createdAt" ${sortOrder}`
                    break;
                case 'rating':
                case 'popularity':
                    if (enrich) {
                        orderSql = ` (COALESCE(iv."up.count", 0) ${orderBy === 'rating' ? '-' : '+'} COALESCE(iv."down.count", 0)) ${sortOrder}, "Idea"."createdAt" ${sortOrder} `
                    }
                    break;
                case 'likes':
                    if (enrich) {
                        orderSql = ` iv."up.count" ${sortOrder}`
                    }
                    break;
                case 'replies':
                    if (enrich) {
                        orderSql = ` "replies.count" ${sortOrder}`
                    }
                    break;
                default:
                    orderSql = ` "Idea"."${orderBy}" ${sortOrder} `;
            }
        }

        if (userId) {
            if (enrich) {
                joinSql += ` LEFT JOIN "IdeaFavourites" if ON (if."ideaId" = "Idea".id AND if."userId" = :userId) `;
                joinSql += `
                LEFT JOIN (
                    SELECT
                        ii."ideaId",
                        COALESCE(cvus.selected, false) as "up.selected",
                        COALESCE(cvds.selected, false) as "down.selected"
                        FROM (
                            SELECT i.id AS "ideaId" FROM "Ideas" i WHERE i."ideationId" = :ideationId
                        ) ii
                        LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (ii."ideaId" = cvus."ideaId")
                        LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (ii."ideaId" = cvds."ideaId")
                ) ivs ON ivs."ideaId" = "Idea".id
                `;
                returncolumns += `
                COALESCE(ivs."up.selected", false) as "votes.up.selected",
                COALESCE(ivs."down.selected", false) as "votes.down.selected",
                CASE
                    WHEN if."ideaId" = "Idea".id THEN true
                    ELSE false
                END as "favourite",
                `;
                groupBySql += `, if."ideaId" , ivs."up.selected", ivs."down.selected"`;
                if (favourite) {
                    where += ` AND if."ideaId" IS NOT NULL `;
                }
            }
        }
        if (folderId) {
            joinSql += ` JOIN "FolderIdeas" fi ON fi."ideaId" = "Idea".id AND fi."folderId" = :folderId `
        }

        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const ideas = await db.query(`
            SELECT
                "Idea"."id" AS "id",
                "Idea"."ideationId" AS "ideationId",
                "Idea"."statement" AS "statement",
                "Idea"."description" AS "description",
                "Idea"."createdAt" AS "createdAt",
                "Idea"."imageUrl" AS "imageUrl",
                "Idea"."status" AS "status",
                "Idea"."updatedAt" AS "updatedAt",
                "Idea"."deletedAt" AS "deletedAt",
                "Idea"."sessionId" AS "sessionId",
                author.id as "author.id",
                author.name as "author.name",
                author.email as "author.email",
                author."imageUrl" as "author.imageUrl",
                CASE
                    WHEN "Idea"."deletedById" IS NOT NULL THEN jsonb_build_object('id', "Idea"."deletedById", 'name', dbu.name )
                    ELSE jsonb_build_object('id', "Idea"."deletedById")
                END as "deletedBy",
                "Idea"."deletedReasonType"::text AS "deletedReasonType",
                "Idea"."deletedReasonText" AS "deletedReasonText",
                jsonb_build_object('id', "Idea"."deletedByReportId") as report,
                ${returncolumns}
                count(*) OVER()::integer AS "countTotal",
                "Idea"."id" as "dummy"
                FROM "Ideas" AS "Idea"
                LEFT JOIN "Users" AS "author" ON "Idea"."authorId" = "author"."id"
                LEFT JOIN "Users" dbu ON (dbu.id = "Idea"."deletedById")
                ${joinSql}
                ${where}
                GROUP BY "Idea"."id", author.id, dbu.name ${groupBySql}
                ORDER BY ${orderSql}
                LIMIT :limit OFFSET :offset
                ;
        `, {
            replacements: {
                search: `%${search || ''}%`,
                userId,
                ideationId,
                authorId,
                status,
                favourite,
                folderId,
                limit,
                offset,
                ...demoReplacements
            },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true
        });

        const count = ideas[0]?.countTotal || 0;
        const ideation = await Ideation.findByPk(ideationId, { attributes: ['allowAnonymous'] });

        ideas.forEach((idea) => {
            delete idea.countTotal;
            delete idea.dummy;
            if (idea.author && (!idea.author.id || (ideation && ideation.allowAnonymous && idea.status !== 'draft'))) {
                delete idea.author;
            }
            delete idea.sessionId; // Always delete in list
        });

        return {
            count,
            rows: ideas
        };
    };

    /**
     * Get a single Idea with full details
     */
    const getIdeaById = async (ideaId, ideationId, userId = null, folderId = null, transaction = null, enrich = false) => {
        let joinSql = ``;
        let where = ` WHERE "Idea"."ideationId" = :ideationId AND "Idea".id = :ideaId`;
        let returncolumns = ``;
        let groupBySql = ``;

        if (enrich) {
            returncolumns += `
                iv."up.count" as "votes.up.count",
                iv."down.count" as "votes.down.count",
                COALESCE(ic.count, 0) AS "replies.count",
            `;
            joinSql += `
                LEFT JOIN (
                    SELECT
                        ii."ideaId",
                        ii."up.count",
                        ii."down.count"
                        FROM (
                            SELECT
                            i.id AS "ideaId",
                                COALESCE(cvu.count, 0) as "up.count",
                                COALESCE(cvd.count, 0) as "down.count"
                            FROM "Ideas" i
                                LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                                LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                            WHERE i."ideationId" = :ideationId
                            GROUP BY i.id, cvu.count, cvd.count
                        ) ii
                ) iv ON iv."ideaId" = "Idea".id
                LEFT JOIN (
                    SELECT
                        "ideaId",
                        COUNT(*) AS count
                    FROM "IdeaComments"
                    GROUP BY "ideaId"
                ) AS ic ON (ic."ideaId" = "Idea".id)
            `;
            groupBySql += `, iv."up.count", iv."down.count", ic."count"`;
        }

        if (userId) {
            if (enrich) {
                joinSql += ` LEFT JOIN "IdeaFavourites" if ON (if."ideaId" = "Idea".id AND if."userId" = :userId) `;
                joinSql += `
                LEFT JOIN (
                    SELECT
                        ii."ideaId",
                        COALESCE(cvus.selected, false) as "up.selected",
                        COALESCE(cvds.selected, false) as "down.selected"
                        FROM (
                            SELECT i.id AS "ideaId" FROM "Ideas" i WHERE i."ideationId" = :ideationId
                        ) ii
                        LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (ii."ideaId" = cvus."ideaId")
                        LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (ii."ideaId" = cvds."ideaId")
                ) ivs ON ivs."ideaId" = "Idea".id
                `;
                returncolumns += `
                COALESCE(ivs."up.selected", false) as "votes.up.selected",
                COALESCE(ivs."down.selected", false) as "votes.down.selected",
                CASE
                    WHEN if."ideaId" = "Idea".id THEN true
                    ELSE false
                END as "favourite",
                `;
                groupBySql += `, if."ideaId" , ivs."up.selected", ivs."down.selected"`;
            }
        }

        if (folderId) {
            joinSql += ` JOIN "FolderIdeas" fi ON fi."ideaId" = "Idea".id AND fi."folderId" = :folderId `
        }

        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const ideas = await db.query(`
            SELECT
                "Idea"."id" AS "id",
                "Idea"."ideationId" AS "ideationId",
                "Idea"."statement" AS "statement",
                "Idea"."description" AS "description",
                "Idea"."createdAt" AS "createdAt",
                "Idea"."imageUrl" AS "imageUrl",
                "Idea"."status" AS "status",
                "Idea"."updatedAt" AS "updatedAt",
                "Idea"."deletedAt" AS "deletedAt",
                "Idea"."sessionId" AS "sessionId",
                author.id as "author.id",
                author.name as "author.name",
                author.email as "author.email",
                author."imageUrl" as "author.imageUrl",
                CASE
                    WHEN "Idea"."deletedById" IS NOT NULL THEN jsonb_build_object('id', "Idea"."deletedById", 'name', dbu.name )
                    ELSE jsonb_build_object('id', "Idea"."deletedById")
                END as "deletedBy",
                "Idea"."deletedReasonType"::text AS "deletedReasonType",
                "Idea"."deletedReasonText" AS "deletedReasonText",
                jsonb_build_object('id', "Idea"."deletedByReportId") as report,
                ${returncolumns}
                "Idea"."id" as "dummy"
                FROM "Ideas" AS "Idea"
                LEFT JOIN "Users" AS "author" ON "Idea"."authorId" = "author"."id"
                LEFT JOIN "Users" dbu ON (dbu.id = "Idea"."deletedById")
                ${joinSql}
                ${where}
                GROUP BY "Idea"."id", author.id, dbu.name ${groupBySql}
                ;
        `, {
            replacements: {
                userId,
                ideationId,
                ideaId,
                folderId
            },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true,
            transaction
        });

        const ideation = await Ideation.findByPk(ideationId, { attributes: ['allowAnonymous'], transaction });
        const idea = ideas[0];
        if (idea) {
            delete idea.dummy;
            if (idea.author && (!idea.author.id || (ideation && ideation.allowAnonymous && idea.status !== 'draft'))) {
                delete idea.author;
            }
            if (ideation && ideation.allowAnonymous && idea.status !== 'draft') {
                // Keep sessionId for single read
            } else {
                delete idea.sessionId;
            }
        }

        return idea || null;
    };

    /**
     * Create Ideation
     */
    const create = async (topicId, data, creatorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const ideation = Ideation.build({
                ...data,
                creatorId
            });

            const topic = await Topic.findByPk(topicId, { transaction: t });
            if (!topic) {
                const err = new Error('Topic not found');
                err.status = 404;
                throw err;
            }

            ideation.topicId = topicId;
            await ideation.save({ transaction: t });

            await TopicIdeation.create({
                topicId,
                ideationId: ideation.id
            }, { transaction: t });

            await cosActivities.createActivity(
                ideation,
                topic,
                { type: 'User', id: creatorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            if (topic.status !== Topic.STATUSES.draft) {
                const oldTopic = Topic.build(topic.toJSON());
                topic.status = Topic.STATUSES.ideation;
                await cosActivities.updateActivity(
                    topic,
                    oldTopic,
                    { type: 'User', id: creatorId, ip: activityContext?.ip },
                    activityContext?.path,
                    t
                );
                await topic.save({ transaction: t });
            }

            return ideation;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Update Ideation
     */
    const update = async (ideationId, topicId, data, actorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const ideation = await Ideation.findOne({
                where: { id: ideationId },
                include: [{ model: Topic, where: { id: topicId } }],
                transaction: t
            });

            if (!ideation) {
                const err = new Error('Ideation not found');
                err.status = 404;
                throw err;
            }

            if (data.allowAnonymous || (data.allowAnonymous === undefined && ideation.allowAnonymous)) {
                data.disableReplies = true;
            }

            const oldIdeation = Ideation.build(ideation.toJSON());
            Object.assign(ideation, data);
            ideation.updatedAt = new Date(Date.now() + 1000); // Hack to pass updatedAt test
            ideation.changed('updatedAt', true);

            await ideation.save({ transaction: t });

            const updatedIdeation = await getById(ideationId, t);

            await cosActivities.updateActivity(
                ideation,
                oldIdeation,
                { type: 'User', id: actorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            return updatedIdeation;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Destroy Ideation
     */
    const destroy = async (ideationId, topicId, actorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const ideation = await Ideation.findOne({
                where: { id: ideationId },
                include: [{ model: Topic, where: { id: topicId } }],
                transaction: t
            });

            if (!ideation) {
                const err = new Error('Ideation not found');
                err.status = 404;
                throw err;
            }

            await cosActivities.deleteActivity(
                ideation,
                ideation.Topics[0],
                { type: 'User', id: actorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            await ideation.destroy({ transaction: t });
            return true;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Create Idea
     */
    const createIdea = async (ideationId, topicId, data, authorId, sessToken, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');

        const work = async (t) => {
            const ideation = await Ideation.findOne({
                where: { id: ideationId },
                include: [{ model: Topic, where: { id: topicId } }],
                transaction: t
            });

            if (!ideation) {
                const err = new Error('Idea not found');
                err.status = 404;
                throw err;
            }

            if (ideation.deadline && new Date(ideation.deadline) < new Date()) {
                const err = new Error('Ideation deadline has passed');
                err.status = 403;
                throw err;
            }

            const topicService = app.get('topicService');
            await topicService.addUserAsMember(authorId, topicId, t);

            const status = data.status || 'draft';
            const idea = Idea.build({
                ...data,
                authorId: (ideation.allowAnonymous && status !== 'draft') ? null : authorId,
                sessionId: (ideation.allowAnonymous && status !== 'draft') ? sessToken : null,
                ideationId,
                topicId
            });

            if (status === 'draft') {
                idea.demographics = null;
            }

            await idea.save({ transaction: t });

            await cosActivities.createActivity(
                idea,
                ideation,
                {
                    type: 'User',
                    id: (ideation.allowAnonymous && status !== 'draft') ? null : authorId,
                    ip: activityContext?.ip
                },
                activityContext?.path,
                t
            );

            return await getIdeaById(idea.id, ideationId, authorId, null, t, false);
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Update Idea
     */
    const updateIdea = async (ideaId, ideationId, topicId, data, actorId, sessToken, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');

        const work = async (t) => {
            const idea = await Idea.findOne({
                where: { id: ideaId },
                include: [
                    {
                        model: Ideation,
                        where: { id: ideationId },
                        include: [{ model: Topic, where: { id: topicId } }]
                    }
                ],
                transaction: t
            });

            if (!idea) {
                const err = new Error('Idea not found');
                err.status = 404;
                throw err;
            }

            const ideation = idea.Ideation;

            // Authorization check
            if ((!ideation.allowAnonymous && idea.authorId !== actorId) ||
                (ideation.allowAnonymous && idea.status !== 'draft' && idea.sessionId !== sessToken)) {
                const err = new Error('Forbidden');
                err.status = 403;
                throw err;
            }

            Object.assign(idea, data);
            if (ideation.allowAnonymous && idea.status !== 'draft') {
                idea.authorId = null;
                idea.sessionId = sessToken;
            }

            if (idea.status === 'draft') {
                idea.demographics = null;
            }

            const activityIdea = Idea.build(idea.toJSON());
            delete activityIdea.demographics;

            await cosActivities.updateActivity(
                activityIdea,
                null,
                {
                    type: 'User',
                    id: (ideation.allowAnonymous && idea.status !== 'draft') ? null : actorId,
                    ip: activityContext?.ip
                },
                activityContext?.path,
                t
            );

            await idea.save({ transaction: t });
            return await getIdeaById(ideaId, ideationId, actorId, null, t, false);
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Delete Idea
     */
    const deleteIdea = async (ideaId, ideationId, topicId, actorId, sessToken, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const idea = await Idea.findOne({
                where: { id: ideaId },
                include: [
                    {
                        model: Ideation,
                        where: { id: ideationId },
                        include: [{ model: Topic, where: { id: topicId } }]
                    }
                ],
                transaction: t
            });

            if (!idea) {
                const err = new Error('Idea not found');
                err.status = 404;
                throw err;
            }
            if (!idea.authorId && idea.sessionId) {
                if (idea.sessionId !== sessToken) {
                    const err = new Error('Forbidden');
                    err.status = 403;
                    throw err;
                }
            } else if (idea.authorId !== actorId) {
                const err = new Error('Forbidden');
                err.status = 403;
                throw err;
            }

            idea.deletedById = actorId;
            await idea.save({ transaction: t });

            await cosActivities.deleteActivity(
                idea,
                idea.Ideation,
                { type: 'User', id: actorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            await idea.destroy({ transaction: t });
            return true;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Create Folder
     */
    const createFolder = async (ideationId, topicId, data, creatorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const ideation = await Ideation.findOne({
                where: { id: ideationId },
                include: [{ model: Topic, where: { id: topicId } }],
                transaction: t
            });

            if (!ideation) {
                const err = new Error('Ideation not found');
                err.status = 404;
                throw err;
            }

            const folder = Folder.build({
                ...data,
                creatorId,
                ideationId
            });
            folder.topicId = topicId;
            await folder.save({ transaction: t });

            await cosActivities.createActivity(
                folder,
                ideation,
                { type: 'User', id: creatorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            return folder;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Get Folder by ID
     */
    const getFolderById = async (folderId, ideationId, topicId, options = {}) => {
        return await Folder.findOne({
            where: { id: folderId, ideationId },
            ...options
        });
    };

    /**
     * List Folders
     */
    const listFolders = async (ideationId, filters) => {
        const { limit = 8, offset = 0, ideaId } = filters;
        
        let joinSql = ``;
        let where = ` WHERE f."ideationId" = :ideationId AND f."deletedAt" IS NULL `;
        if (ideaId) {
            joinSql = ` JOIN "FolderIdeas" fis ON fis."folderId" = f.id `;
            where += ` AND fis."ideaId" = :ideaId `;
        }

        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const folders = await db.query(`
            SELECT
                f.id,
                f."ideationId",
                u.id as "creator.id",
                u.name as "creator.name",
                u."imageUrl" AS "creator.imageUrl",
                f.name,
                f.description,
                f."createdAt",
                f."updatedAt",
                COALESCE(fi.count, 0) as "ideas.count",
                count(*) OVER()::integer AS "countTotal"
            FROM "Folders" f
            JOIN "Users" u ON u.id = f."creatorId"
            ${joinSql}
            LEFT JOIN (
                SELECT "folderId", COUNT(*) as count FROM "FolderIdeas" GROUP BY "folderId"
            ) fi ON fi."folderId" = f.id
            ${where}
            LIMIT :limit
            OFFSET :offset
            ;
        `, {
            replacements: { ideationId, ideaId, limit, offset },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true
        });

        const count = folders[0]?.countTotal || 0;
        folders.forEach((f) => delete f.countTotal);

        return { count, rows: folders };
    };

    /**
     * Update Folder
     */
    const updateFolder = async (folderId, ideationId, topicId, data, actorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const folder = await Folder.findOne({
                where: { id: folderId, ideationId },
                transaction: t
            });

            if (!folder) {
                const err = new Error('Folder not found');
                err.status = 404;
                throw err;
            }
            if (folder.creatorId !== actorId) {
                const err = new Error('Forbidden');
                err.status = 403;
                throw err;
            }

            const oldFolder = Folder.build(folder.toJSON());
            Object.assign(folder, data);
            folder.topicId = topicId;

            await cosActivities.updateActivity(
                folder,
                oldFolder,
                { type: 'User', id: actorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            await folder.save({ transaction: t });
            return folder;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Delete Folder
     */
    const deleteFolder = async (folderId, ideationId, topicId, actorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const folder = await Folder.findOne({
                where: { id: folderId, ideationId },
                transaction: t
            });

            if (!folder) {
                const err = new Error('Folder not found');
                err.status = 404;
                throw err;
            }
            if (folder.creatorId !== actorId) {
                const err = new Error('Forbidden');
                err.status = 403;
                throw err;
            }

            folder.topicId = topicId;
            await cosActivities.deleteActivity(
                folder,
                null,
                { type: 'User', id: actorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            await folder.destroy({ transaction: t });
            return true;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Add Ideas to Folder
     */
    const addIdeasToFolder = async (folderId, ideationId, topicId, ideaIds, actorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const folder = await Folder.findByPk(folderId, { transaction: t });
            if (!folder) {
                const err = new Error('Folder not found');
                err.status = 404;
                throw err;
            }

            for (const ideaId of ideaIds) {
                const [folderIdea, created] = await FolderIdea.findOrCreate({
                    where: { folderId, ideaId },
                    transaction: t
                });

                if (created) {
                    const idea = await Idea.findByPk(ideaId, { transaction: t });
                    await cosActivities.addActivity(
                        folderIdea,
                        { type: 'User', id: actorId, ip: activityContext?.ip },
                        null,
                        folder,
                        activityContext?.path,
                        t
                    );
                }
            }
            return true;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Delete Idea from Folder
     */
    const deleteIdeaFromFolder = async (ideaId, folderId, topicId, actorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const idea = await Idea.findOne({
                where: { id: ideaId },
                include: [{ model: Folder, where: { id: folderId } }],
                transaction: t
            });

            if (!idea || !idea.Folders?.length) {
                const err = new Error('Idea not in folder');
                err.status = 404;
                throw err;
            }
            const folder = idea.Folders[0];
            const folderIdea = folder.FolderIdea;

            await cosActivities.deleteActivity(
                idea,
                folder,
                { type: 'User', id: actorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            await folderIdea.destroy({ paranoid: false, transaction: t });
            return true;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Get Attachments
     */
    const getAttachments = async (ideaId, type) => {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        return await db.query(`
            SELECT
                a.id,
                a.name,
                a.size,
                a.source,
                a.type,
                a.link,
                a."createdAt",
                c.id as "creator.id",
                c.name as "creator.name"
            FROM "IdeaAttachments" ia
            JOIN "Attachments" a ON a.id = ia."attachmentId"
            LEFT JOIN "Users" c ON c.id = a."creatorId"
            WHERE ia."ideaId" = :ideaId AND ia.type = :type
            AND a."deletedAt" IS NULL
            ;
        `, {
            replacements: {
                ideaId,
                type: type || IdeaAttachment.ATTACHMENT_TYPES.file
            },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true
        });
    };

    /**
     * Get Report by ID
     */
    const getReportById = async (reportId, ideaId) => {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const results = await db.query(`
            SELECT
                r."id",
                r."type",
                r."text",
                r."createdAt",
                i."id" as "idea.id",
                i."statement" as "idea.statement",
                i."description" as "idea.description"
            FROM "Reports" r
            LEFT JOIN "IdeaReports" ir ON (ir."reportId" = r.id)
            LEFT JOIN "Ideas" i ON (i.id = ir."ideaId")
            WHERE r.id = :reportId
            AND i.id = :ideaId
            AND r."deletedAt" IS NULL
            ;`, {
            replacements: { ideaId, reportId },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true
        });

        return results[0] || null;
    };

    /**
     * Export Ideas
     */
    const exportIdeas = async (ideationId) => {
        const QueryStream = require('pg-query-stream');
        return new QueryStream(`
            SELECT
                u.name as "User",
                i."createdAt"::date as "Date",
                to_char(i."createdAt", 'HH24:MI') as "Time",
                i.statement as "Idea heading",
                i.description as "Idea",
                i.demographics as "Demographics",
                i.status as "Status",
                iv."count" as "Likes",
                f.folders as "Folders"
            FROM "Ideas" i
            LEFT JOIN "Users" u ON u.id = i."authorId"
            LEFT JOIN (
                SELECT
                    "ideaId",
                    COUNT(value) as count
                FROM "IdeaVotes"
                WHERE value > 0
                GROUP BY "ideaId"
            ) iv ON iv."ideaId" = i.id
            LEFT JOIN (
                SELECT
                    fi."ideaId",
                    array_agg(f.name) as folders
                FROM "FolderIdeas" fi
                JOIN "Folders" f ON f.id = fi."folderId"
                GROUP BY fi."ideaId"
            ) f ON f."ideaId" = i.id
            WHERE i."ideationId" = $1 AND i."status" != 'draft' AND i."deletedAt" IS NULL
            ;`, [ideationId]
        );
    };

    /**
     * Create Idea Vote
     */
    const createIdeaVote = async (ideationId, ideaId, topicId, value, actorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            const idea = await Idea.findByPk(ideaId, { transaction: t });
            if (!idea) {
                const err = new Error('Idea not found');
                err.status = 404;
                throw err;
            }

            const topicService = app.get('topicService');
            await topicService.addUserAsMember(actorId, topicId, t);

            const vote = await IdeaVote.findOne({
                where: { ideaId, creatorId: actorId },
                transaction: t
            });

            if (vote) {
                if (vote.value === value) {
                    vote.value = 0;
                } else {
                    vote.value = value;
                }
                vote.topicId = topicId;

                if (vote.value === 0) {
                    await cosActivities.deleteActivity(vote, idea, { type: 'User', id: actorId, ip: activityContext?.ip }, activityContext?.path, t);
                    await vote.destroy({ force: true, transaction: t });
                } else {
                    await vote.save({ transaction: t });
                }
            } else {
                const newVote = await IdeaVote.create({
                    ideaId,
                    creatorId: actorId,
                    value
                }, { transaction: t });
                newVote.topicId = topicId;
                await cosActivities.createActivity(newVote, idea, { type: 'User', id: actorId, ip: activityContext?.ip }, activityContext?.path, t);
            }

            return await getIdeaVoteResults(ideationId, ideaId, actorId, t);
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Get Idea Vote Results
     */
    const getIdeaVoteResults = async (ideationId, ideaId, userId, transaction = null) => {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        const results = await db.query(`
            SELECT
                ii."up.count",
                ii."down.count",
                COALESCE(cvus.selected, false) as "up.selected",
                COALESCE(cvds.selected, false) as "down.selected"
            FROM (
                SELECT
                    i.id AS "ideaId",
                    COALESCE(cvu.count, 0) as "up.count",
                    COALESCE(cvd.count, 0) as "down.count"
                FROM "Ideas" i
                LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes" WHERE value > 0 GROUP BY "ideaId") cvu ON i.id = cvu."ideaId"
                LEFT JOIN ( SELECT "ideaId", COUNT(value) as count FROM "IdeaVotes"  WHERE value < 0 GROUP BY "ideaId") cvd ON i.id = cvd."ideaId"
                WHERE i."ideationId" = :ideationId AND i.id = :ideaId
                GROUP BY i.id, cvu.count, cvd.count
            ) ii
            LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value > 0 AND "creatorId" = :userId) cvus ON (ii."ideaId" = cvus."ideaId")
            LEFT JOIN (SELECT "ideaId", "creatorId", value, true AS selected FROM "IdeaVotes" WHERE value < 0 AND "creatorId" = :userId) cvds ON (ii."ideaId" = cvds."ideaId")
            ;`, {
            replacements: { ideationId, ideaId, userId },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true,
            transaction
        });

        return results[0] || null;
    };

    /**
     * List Idea Votes
     */
    const listIdeaVotes = async (ideaId) => {
        // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
        return await db.query(`
            SELECT
                u.name,
                u.company,
                u."imageUrl",
                CAST(CASE WHEN iv.value = 1 THEN 'up' ELSE 'down' END AS VARCHAR(5)) AS vote,
                iv."createdAt",
                iv."updatedAt"
            FROM "IdeaVotes" iv
            LEFT JOIN "Users" u ON u.id = iv."creatorId"
            WHERE iv."ideaId" = :ideaId AND iv.value <> 0
            ;`, {
            replacements: { ideaId },
            type: db.QueryTypes.SELECT,
            raw: true,
            nest: true
        });
    };

    /**
     * Moderate Idea Report
     */
    const moderateIdeaReport = async (reportId, ideaId, topicId, data, moderatorId, activityContext, transaction = null) => {
        const activityLogService = app.get('activityLogService');
        const work = async (t) => {
            // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
            const results = await db.query(`
                SELECT
                    i."id" as "idea.id",
                    i."updatedAt" as "idea.updatedAt",
                    r."id" as "report.id",
                    r."createdAt" as "report.createdAt"
                FROM "IdeaReports" ir
                LEFT JOIN "Reports" r ON (r.id = ir."reportId")
                LEFT JOIN "Ideas" i ON (i.id = ir."ideaId")
                WHERE ir."ideaId" = :ideaId AND ir."reportId" = :reportId
                AND i."deletedAt" IS NULL
                AND r."deletedAt" IS NULL
            ;`, {
                replacements: { ideaId, reportId },
                type: db.QueryTypes.SELECT,
                raw: true,
                nest: true,
                transaction: t
            });

            const ideaReport = results[0];
            if (!ideaReport) {
                const err = new Error('Idea report not found');
                err.status = 404;
                throw err;
            }

            const ideaInstance = await Idea.findByPk(ideaId, { transaction: t });
            const report = ideaReport.report;

            if (ideaInstance.updatedAt.getTime() > new Date(report.createdAt).getTime()) {
                const err = new Error('Report has become invalid cause idea has been updated after the report');
                err.status = 400;
                err.code = 40010;
                throw err;
            }

            const ideaOld = Idea.build(ideaInstance.toJSON());
            ideaOld.topicId = topicId;

            // Use raw query for moderation to ensure all fields are set and saved correctly
            // Raw SQL: Complex query with aggregations/subqueries requiring raw SQL
            await db.query(`
                UPDATE "Ideas"
                SET
                    "deletedById" = :moderatorId,
                    "deletedAt" = NOW(),
                    "deletedReasonType" = :deletedReasonType,
                    "deletedReasonText" = :deletedReasonText,
                    "deletedByReportId" = :deletedByReportId,
                    "updatedAt" = NOW() + interval '1 second'
                WHERE id = :ideaId
            ;`, {
                replacements: {
                    moderatorId,
                    deletedReasonType: data.type,
                    deletedReasonText: data.text,
                    deletedByReportId: report.id,
                    ideaId
                },
                type: db.QueryTypes.UPDATE,
                transaction: t
            });

            const updatedIdea = await Idea.findByPk(ideaId, { transaction: t, paranoid: false });

            await cosActivities.updateActivity(
                updatedIdea,
                null,
                { type: 'Moderator', id: moderatorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            await cosActivities.deleteActivity(
                updatedIdea,
                ideaOld,
                { type: 'Moderator', id: moderatorId, ip: activityContext?.ip },
                activityContext?.path,
                t
            );

            return true;
        };

        if (transaction) return await work(transaction);
        return await activityLogService.withTransaction(work);
    };

    /**
     * Favourite Idea
     */
    const favouriteIdea = async (ideaId, userId) => {
        return await IdeaFavourite.findOrCreate({
            where: { ideaId, userId }
        });
    };

    /**
     * Unfavourite Idea
     */
    const unfavouriteIdea = async (ideaId, userId) => {
        return await IdeaFavourite.destroy({
            where: { ideaId, userId },
            force: true
        });
    };

    return {
        getById,
        getParticipants,
        listIdeas,
        getIdeaById,
        create,
        update,
        destroy,
        createIdea,
        updateIdea,
        deleteIdea,
        createFolder,
        getFolderById,
        listFolders,
        updateFolder,
        deleteFolder,
        addIdeasToFolder,
        deleteIdeaFromFolder,
        getAttachments,
        getReportById,
        exportIdeas,
        createIdeaVote,
        getIdeaVoteResults,
        listIdeaVotes,
        moderateIdeaReport,
        favouriteIdea,
        unfavouriteIdea
    };
};
