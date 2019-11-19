'use strict';

module.exports = function (message) {
    return function (req, res, next) {
        res.set('CitizenOS-Deprecated', message);
        next();
    };
};
