'use strict';

module.exports = function (app) {
    require('./ideation/index')(app);
    require('./ideation/ideas')(app);
    require('./ideation/folders')(app);
    require('./ideation/votes')(app);
    require('./ideation/comments')(app);
    require('./ideation/reports')(app);
    require('./ideation/attachments')(app);
};
