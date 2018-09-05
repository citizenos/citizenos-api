'use strict';

module.exports = function (app) {

    var config = app.get('config');
    var loginCheck = app.get('middleware.loginCheck');

    var AWS = require('aws-sdk');
    var uuid = app.get('uuid');
    var Promise = app.get('Promise');

    var credentials = {
        accessKeyId: config.storage.accessKeyId, 
        secretAccessKey: config.storage.secretAccessKey
    };

    /**
     * Sign upload
     */

    app.get('/api/users/:userId/upload/sign', loginCheck(['partner']), function (req, res, next) {
        
        var filename = uuid.v4();
        var filetype = req.query.filetype;
        var folder = req.query.folder;
        var bucket = config.storage.bucket;

        if (folder) {
            filename = folder + '/' + filename;
        }

        var s3Params = {
            Bucket: bucket,
            Key: filename,
            Expires: 900,
            ContentType: filetype,
            ACL: 'public-read'
        };

        var s3 = new AWS.S3(credentials);
        s3.getSignedUrl('putObject', s3Params, function (err, data) {
            if (err) {
                return next(err);
            }
            var returnData = {
                signedRequest: data,
                url: 'https://' + bucket + '.s3.amazonaws.com/' + filename,
                filename: filename
            };

            return res.ok(returnData);
        });
    });

    /**
     * Sign download
     */
    app.get('/api/users/:userId/upload/signdownload', loginCheck(['partner']), function (req, res, next) {
        var filename = req.query.filename;
        var filetype = req.query.filetype;
        var downloadName = req.query.downloadName;
        var folder = req.query.folder;
        var bucket = config.storage.bucket;

        if (folder) {
            filename = folder + '/' + filename;
        }

        var responseHeader = 'attachment;';

        if (downloadName) {
            var regEx = new RegExp('.' + filetype, 'gi');
            downloadName = [encodeURIComponent(downloadName.replace(regEx, '')), filetype].join('.');
            responseHeader += 'filename=' + downloadName;
        }

        var s3 = new AWS.S3(credentials);

        var params = {
            Bucket: bucket,
            Key: filename,
            Expires: 60,
            ResponseContentDisposition: responseHeader
        };

        s3.getSignedUrl('getObject', params, function (err, url) {
            if (err) {
                return next(err, req, res);
            }

            return res.ok({url: url});
        });
    });


    var _deleteFromS3 = function (filename, folder) {
        return new Promise(function (resolve, reject) {
            var s3 = new AWS.S3();
            var bucket = config.storage.bucket;

            if (folder) {
                filename = folder + '/' + filename;
            }

            var params = {
                Bucket: bucket,
                Key: filename
            };
            s3.deleteObject(params, function (err) {
                if (err) {
                    return reject(err);
                }

                return resolve();
            });
        });
    };

    app.delete('/api/users/:userId/upload', loginCheck(['partner']), function (req, res, next) {
        var filename = req.query.filename;
        var folder = req.query.folder;

        //FIXME: No delete from DB?
        _deleteFromS3(filename, folder)
            .then(function () {
                res.ok();
            })
            .catch(next);
    });

};
