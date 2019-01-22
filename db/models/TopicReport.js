'use strict';

var _ = require('lodash');

/**
 * TopicReport
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    // Parent model for this model
    var Report = require('./Report')(sequelize, DataTypes);

    // NOTE: TopicReport extends Report
    var attributes = _.extend({
        topicId: {
            type: DataTypes.UUID,
            allowNull: false,
            comment: 'Id if the Topic which the Report belongs to.',
            references: {
                model: 'Topics',
                key: 'id'
            },
            primaryKey: true
        }
    }, Report.attributes);

    var TopicReport = sequelize.define('TopicReport', attributes);

    // Overrides the default toJSON() to avoid sensitive data from ending up in the output.
    // Must do until scopes arrive to Sequelize - https://github.com/sequelize/sequelize/issues/1462
    TopicReport.prototype.toJSON = function () {
        var data = Report.prototype.toJSON.call(this); // Call parents "toJSON"

        // TODO add TopicReport specific whitelist here

        return data;
    };

    return TopicReport;
};
