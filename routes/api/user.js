'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const asyncMiddleware = app.get('middleware.asyncMiddleware');
    const urlLib = app.get('urlLib');
    const userService = app.get('userService');
    const passport = app.get('passport');
    const UserConnection = app.get('models').UserConnection;

    app.post('/api/users/:userId/upload', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const user = await userService.getUser(req.user.id);
        if (user) {
            try {
                const imageUrl = await userService.uploadImage(req, user);
                return res.created(imageUrl);
            } catch (err) {
                if (err.status === 403) return res.forbidden(err.message);
                throw err;
            }
        } else {
            return res.forbidden();
        }
    }));

    /**
     * Update User info
     */
    app.put('/api/users/:userId', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const user = await userService.getUser(req.user.userId);
        if (!user) {
            return res.notFound();
        }

        const data = req.body;
        const redirectSuccess = data.redirectSuccess || urlLib.getFe();
        
        try {
            const updatedUser = await userService.updateUser(user, data, req.user.partnerId, redirectSuccess);
            if (!updatedUser) {
                return res.ok();
            }
            return res.ok(updatedUser.toJSON());
        } catch (err) {
            if (err.status === 400) return res.badRequest(err.message);
            throw err;
        }
    }));

    /**
     * Get User info
     */
    app.get('/api/users/:userId', loginCheck(['partner']), asyncMiddleware(async function (req, res) {
        const user = await userService.getUser(req.user.userId);
        if (!user) {
            return res.notFound();
        }
        return res.ok(user.toJSON());
    }));

    /**
     * Delete User
     */
    app.delete('/api/users/:userId', loginCheck(), asyncMiddleware(async function (req, res) {
        const success = await userService.deleteUser(req.user.userId);
        if (!success) {
            return res.notFound();
        }
        return res.ok();
    }));

    /**
     * Create UserConsent
     */
    app.post('/api/users/:userId/consents', loginCheck(), asyncMiddleware(async function (req, res) {
        const reqInfo = {
            type: 'User',
            id: req.user.userId,
            ip: req.ip,
            method: req.method,
            path: req.path
        };
        await userService.createConsent(req.user.userId, req.body.partnerId, reqInfo);
        return res.ok();
    }));

    /**
     * Read User consents
     */
    app.get('/api/users/:userId/consents', loginCheck(), asyncMiddleware(async function (req, res) {
        const results = await userService.getConsents(req.user.userId);
        return res.ok({
            count: results.length,
            rows: results
        });
    }));

    /**
     * Delete User consent
     */
    app.delete('/api/users/:userId/consents/:partnerId', loginCheck(), asyncMiddleware(async function (req, res) {
        const reqInfo = {
            type: 'User',
            id: req.user.userId,
            ip: req.ip,
            method: req.method,
            path: req.path
        };
        await userService.deleteConsent(req.user.userId, req.params.partnerId, reqInfo);
        return res.ok();
    }));

    /**
     * Get UserConnections
     */
    app.get('/api/users/:userId/userconnections', asyncMiddleware(async function (req, res) {
        try {
            const userConnections = await userService.getUserConnections(req.params.userId);
            if (!userConnections) {
                return res.notFound();
            }
            return res.ok({
                count: userConnections.length,
                rows: userConnections
            });
        } catch (err) {
            if (err.status === 400) return res.badRequest(err.message, 1);
            throw err;
        }
    }));

    app.get('/api/users/:userId/userconnections/:connection', function (req, res, next) {
        const connection = req.params.connection;
        if (connection === UserConnection.CONNECTION_IDS.google) {
            return passport.authenticate('google', {
                scope: ['https://www.googleapis.com/auth/userinfo.email']
            })(req, res, next);
        } else if (connection === UserConnection.CONNECTION_IDS.facebook) {
            passport.authenticate('facebook', {
                scope: ['email'],
                display: req.query.display ? 'popup' : null
            })(req, res, next);
        } else {
            return next();
        }
    });

    app.post('/api/users/:userId/userconnections/:connection', asyncMiddleware(async function (req, res) {
        const connection = req.params.connection;
        const token = req.body.token;
        const cert = req.headers['x-ssl-client-cert'] || req.body.cert;
        const timeoutMs = req.query.timeoutMs || 5000;

        if (!UserConnection.CONNECTION_IDS[connection]) {
            return res.badRequest('Invalid connection');
        }

        try {
            const result = await userService.createConnection(req, res, req.user.id, connection, token, cert, timeoutMs);
            if (result === 'RUNNING') {
                return res.ok('Log in progress', 1);
            }
            
            // Wait, result is userConnections array (for the last return). We should format it.
            // Oh, wait, in original code it queried again but using req.user.id.
            // I changed it to return userConnections. So result is userConnections rows.
            return res.ok({
                count: result.length,
                rows: result
            });
        } catch (err) {
            if (err.status === 400) return res.badRequest(err.message);
            if (err.status === 403) return res.forbidden();
            throw err;
        }
    }));

    /**
     * Read User preferences
     */
    app.get('/api/users/:userId/notifications', loginCheck(), asyncMiddleware(async function (req, res) {
        const preferences = await userService.getNotifications(req.user.userId, req.params.type);
        return res.ok({ preferences });
    }));
};
