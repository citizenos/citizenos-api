'use strict';

/**
 * Middleware to find possible uuid values in request and return 404 when mismatch
 *
 * @param {object} app Express app object
 *
 * @returns {void}
 */
module.exports = function (app) {
    var validator = app.get('validator');

    app.param(['topicId', 'groupId', 'memberId', 'partnerId', 'commentId', 'voteId'], function (req, res, next, id) {
        if (!validator.isUUID(id, 4)) {
            return res.notFound();
        }

        next();
    });

};
