'use strict';

/**
 * Handle invite links in e-mails
 *
 * Created so that e-mails would not have hard-coded links with specific action.
 * Instead we can change the behaviour of the links in the future as we need if we have a proxy API
 */

module.exports = function (app) {
    const models = app.get('models');
    const config = app.get('config');
    const urlLib = app.get('urlLib');
    const db = models.Sequelize;
    const User = models.User;
    const UserConnection = models.UserConnection;

    /**
     * View the invite
     *
     * The link is used in e-mails or other invite channels and handles redirection logic based on info sent.
     */
    app.get('/api/invite/view', async function (req, res) {
        const email = req.query.email;
        const topicId = req.query.topicId;
        const groupId = req.query.groupId;

        let userLoggedIn = null;

        const userByEmail = await User
            .findOne({
                where: db.where(db.fn('lower', db.col('email')), db.fn('lower',email)),
                include: [UserConnection]
            });

        // There is a User logged in?
        if (req.user && req.user.userId) { // TODO: Move the check to some library
            userLoggedIn = await User
                .findOne({
                    where: {
                        id: req.user.userId
                    }
                });
        }

        if (userLoggedIn && email && userLoggedIn.email !== email.toLowerCase()) {
            // TODO: Duplicate code with POST /api/auth/logout
            // Log out the currently logged in User
            res.clearCookie(config.session.name, {
                path: config.session.cookie.path,
                domain: config.session.cookie.domain
            });
            res.clearCookie('express_sid'); // FIXME: Absolutely hate this solution. This deletes the EP session, so that on logout also EP session is destroyed. - https://trello.com/c/CkkFUz5D/235-ep-api-authorization-the-way-ep-session-is-invalidated-on-logout

            userLoggedIn = null;
        }

        let objectUrl = null;

        if (topicId) {
            objectUrl = urlLib.getFe('/topics/:topicId', {topicId: topicId});
        } else if (groupId) {
            objectUrl = urlLib.getFe('/my/groups/:groupId', {groupId: groupId});
        }

        // User does not exist or was created via invite and the signup has not been completed.
        if (!userByEmail || (!userByEmail.password && userByEmail.source === User.SOURCES.citizenos && !userByEmail.UserConnections.length)) {
            if (userByEmail) {
                userByEmail.emailIsVerified = true;
                await userByEmail.save({fields: ['emailIsVerified'], validate: false}); //By using the invite link we can confirm the user as owner to this e-mail
            }
            const redirectUrl = urlLib.getFe('/account/login', null, {email: email, redirectSuccess: objectUrl || ''});

            return res.redirect(302, redirectUrl);
        }

        if (userLoggedIn) { // Logged in
            return res.redirect(302, objectUrl);
        } else {
            return res.redirect(302, urlLib.getFe('/account/login', null, {
                email: email,
                redirectSuccess: objectUrl || ''
            }));
        }

    });

};
