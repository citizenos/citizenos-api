'use strict';

/**
 * Middleware to map partner topicId-s to local topicId-s. This modifies req.params to replace incoming partner topicId with local topicId for further handling
 */
module.exports = function (req, res, next) {
    var app = req.app;
    var Topic = app.get('models.Topic');
    var validator = app.get('validator')
    var topicId = req.params.topicId;
    var sourcePartnerId = null;

    if (req.user) {
        sourcePartnerId = req.user.partnerId;
    }
    
    sourcePartnerId = sourcePartnerId || req.query.partnerId;

    if (topicId && topicId.indexOf('p.') === 0 && sourcePartnerId) {
        return Topic.findOne({
            fields: ['id'],
            where: {
                sourcePartnerId: sourcePartnerId,
                sourcePartnerObjectId: topicId.substr(2)
            }
        }).then(function (topic) {
            if (topic) {
                req.params.topicId = topic.id;

                return next();
            } else {
                
                return res.notFound();
            }
        })
            .catch(next);

    } else {
        if (topicId && validator.isUUID(topicId, 4)) {
            return next();
        }

        return res.notFound();
    }
};