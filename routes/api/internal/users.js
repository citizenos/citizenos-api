'use strict';

/**
 * User related internal API-s
 */

module.exports = function (app) {
    const models = app.get('models');

    const authApiKey = app.get('middleware.authApiKey');

    const User = models.User;

    /**
     * Get update user etherpad authorID
     */

    app.put('/api/internal/users/:userId', authApiKey, async function (req, res) {
        const authorData = req.body;
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
