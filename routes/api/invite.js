'use strict';

/**
 * Handle invite links in e-mails
 *
 * Created so that e-mails would not have hard-coded links with specific action.
 * Instead we can change the behaviour of the links in the future as we need if we have a proxy API
 */

module.exports = function (app) {
    var models = app.get('models');
    var Promise = app.get('Promise');
    var config = app.get('config');
    var urlLib = app.get('urlLib');

    var User = models.User;
    var UserConnection = models.UserConnection;

    /**
     * View the invite
     *
     * The link is used in e-mails or other invite channels and handles redirection logic based on info sent.
     */
    app.get('/api/invite/view', function (req, res, next) {
        var email = req.query.email;
        var topicId = req.query.topicId;
        var groupId = req.query.groupId;

        var promisesToResolve = [];

        var userByEmailPromise = User
            .findOne({
                where: {
                    email: email
                },
                include: [UserConnection]
            });
        promisesToResolve.push(userByEmailPromise);

        // There is a User logged in?
        if (req.user && req.user.id) { // TODO: Move the check to some library
            var userLoggedInPromise = User
                .findOne({
                    where: {
                        id: req.user.id
                    }
                });
            promisesToResolve.push(userLoggedInPromise);
        }

        Promise
            .all(promisesToResolve)
            .then(function ([userByEmail, userLoggedIn]) {
                if (userLoggedIn && userLoggedIn.email !== req.query.email) {
                    // TODO: Duplicate code with POST /api/auth/logout
                    // Log out the currently logged in User
                    res.clearCookie(config.session.name, {
                        path: config.session.cookie.path,
                        domain: config.session.cookie.domain
                    });
                    res.clearCookie('express_sid'); // FIXME: Absolutely hate this solution. This deletes the EP session, so that on logout also EP session is destroyed. - https://trello.com/c/CkkFUz5D/235-ep-api-authorization-the-way-ep-session-is-invalidated-on-logout

                    userLoggedIn = null;
                }

                // User does not exist or was created via invite and the signup has not been completed.
                if (!userByEmail || (!userByEmail.password && userByEmail.source === User.SOURCES.citizenos && !userByEmail.UserConnections.length)) {
                    var redirectUrl = urlLib.getFe('/account/signup', null, {email: email});

                    return res.redirect(302, redirectUrl);
                }

                var objectUrl = null;

                if (topicId) {
                    objectUrl = urlLib.getFe('/topics/:topicId', {topicId: topicId});
                } else if (groupId) {
                    objectUrl = urlLib.getFe('/my/groups/:groupId', {groupId: groupId});
                }

                if (userLoggedIn) { // Logged in
                    return res.redirect(302, objectUrl);
                } else {
                    return res.redirect(302, urlLib.getFe('/account/login', null, {
                        email: email,
                        redirectSuccess: objectUrl || ''
                    }));
                }
            })
            .catch(next);

    });

};
