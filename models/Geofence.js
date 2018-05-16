'use strict';

/**
 * Geofence
 *
 * Geofence is a virtual geographic boundary.
 *
 * @param {object} sequelize Sequelize instance
 * @param {object} DataTypes Sequelize DataTypes
 *
 * @returns {object} Sequelize model
 *
 * @see http://sequelizejs.com/docs/latest/models
 */
module.exports = function (sequelize, DataTypes) {

    var Geofence = sequelize.define(
        'Geofence',
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                comment: 'Human readable description of the geo-fence. For ex: The Baltic States, South-America'
            },
            sourceId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                comment: 'Id in the source. For example if we import regions of Estonia, it is expected to be EHAK code which is a unique region code in Estonian geoinfo systems'
            },
            source: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: 'Source of the data. The main intention of this is to describe where the geometry info came from. Helps debugging and analyzing data. For ex: https://geoportaal.maaamet.ee/docs/haldus_asustus/omavalitsus_shp.zip?t=20180501012441'
            },
            geometry: {
                type: DataTypes.GEOMETRY,
                allowNull: false,
                comment: 'Geometry of the geo-fence - Polygons, MultiPolygons. SRID 4326 expected - http://spatialreference.org/ref/epsg/wgs-84/'
            }
        }
    );

    return Geofence;
};
