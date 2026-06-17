'use strict';

/**
 * Group API-s (/api/../groups/..)
 */

module.exports = function (app) {
    const indexResult = require('./group/index')(app);
    require('./group/members')(app);
    require('./group/invites')(app);
    return indexResult;
};
