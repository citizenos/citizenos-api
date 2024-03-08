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
        console.log('EP SYNC', req.body, authorData)
        if (authorData.userId && authorData.authorID) {
            try {
                await User
                    .update(
                        { authorId: authorData.authorID },
                        {
                            where: {
                                id: authorData.userId
                            },
                            limit: 1,
                            returning: true
                        }
                    );
            } catch (err) {
                console.log('ERROR /api/internal/users', err);
            }

            return res.ok();
        }
    });
};
