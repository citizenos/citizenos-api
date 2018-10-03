'use strict';

module.exports = function (app) {
    var models = app.get('models');
    
    var Topic = models.Topic;

    /**
     * Get Partner Topic mapping
     *
     * Enables Partner to map its object id to CitizenOS topic
     */
    app.get('/api/partners/:partnerId/topics/:sourcePartnerObjectId', function (req, res, next) {
        var partnerId = req.params.partnerId;
        var sourcePartnerObjectId = req.params.sourcePartnerObjectId;

        Topic
            .findOne({
                where: {
                    sourcePartnerId: partnerId,
                    sourcePartnerObjectId: sourcePartnerObjectId
                }
            })
            .then(function (topic) {
                if (!topic) {
                    return res.notFound();
                }

                return res.ok({
                    id: topic.id,
                    sourcePartnerObjectId: topic.sourcePartnerObjectId
                });
            })
            .catch(next);
    });
};
