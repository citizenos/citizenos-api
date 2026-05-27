'use strict';

module.exports = function (app) {
    require('./topic/index')(app);
    require('./topic/members')(app);
    require('./topic/invites')(app);
    require('./topic/events')(app);
    require('./topic/attachments')(app);
};
