'use strict';

/**
 * User related internal API-s
 */

module.exports = function (app) {
    var models = app.get('models');

    var authApiKey = app.get('middleware.authApiKey');

    var User = models.User;

    /**
     * Get update user etherpad authorID
     */

    app.put('/api/internal/users/:userId', authApiKey, async function (req, res) {
        var authorData = req.body;
        if (authorData.userId && authorData.authorID) {
            await User
                .update(
                    {authorId: authorData.authorID},
                    {
                        where: {
                            id: authorData.userId
                        },
                        limit: 1,
                        returning: true
                    }
                );

            return res.ok();
        }
    });
};
