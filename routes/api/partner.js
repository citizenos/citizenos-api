'use strict';

module.exports = function (app) {
    var models = app.get('models');

    var Topic = models.Topic;
    var Partner = models.Partner;

    /**
     * Get Partner info
     */
    app.get('/api/partners/:partnerId', function (req, res, next) {
        Partner
            .findOne({
                where: {
                    id: req.params.partnerId
                }
            })
            .then(function (partner) {
                if (partner) {
                    return res.ok(partner.toJSON());
                } else {
                    return res.notFound();
                }
            })
            .catch(next);
    });
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
