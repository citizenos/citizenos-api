'use strict';

module.exports = function (app) {

    var config = app.get('config');
    var loginCheck = app.get('middleware.loginCheck');

    var AWS = require('aws-sdk');
    var uuid = app.get('uuid');
    var Promise = app.get('Promise');
    var Busboy = app.get('busboy');
    var StreamUpload = app.get('stream_upload');
    var path = require('path');
    var url = require('url');
    var logger = app.get('logger');

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
    app.get('/api/upload/signdownload', function (req, res, next) {
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

    var drainStream = function (stream) {
        stream.on('readable', stream.read.bind(stream));
    };

    app.post('/api/users/:userId/upload', function (req, res, next) {
        var appDir = __dirname.replace('/routes/api', '/public/uploads');

        var baseFolder = config.storage.baseFolder || appDir;
        var baseURL = config.storage.baseURL || (config.url.api + '/uploads/');

        var subFolder = req.params.padId || ''; // topic ID
        var imageUpload = new StreamUpload({
            extensions: config.storage.allowedFileTypes,
            maxSize: config.storage.maxFileSize,
            baseFolder: baseFolder,
            storage: config.storage
        });
        var storageConfig = config.storage;
        if (storageConfig) {
            try {
                var busboy = new Busboy({
                    headers: req.headers,
                    limits: {
                        fileSize: config.maxFileSize
                    }
                });
            } catch (error) {
                logger.error('UPLOAD ERROR', error);

                return next(error);
            }
            
            var isDone;
            var done = function (error) {
                logger.error('UPLOAD ERROR', error);

                if (isDone) return;
                isDone = true;
                
                res.status(error.statusCode || 500).json(error);
                req.unpipe(busboy);
                drainStream(req);
                busboy.removeAllListeners();
            };
            var uploadResult;
            var newFileName = uuid.v4();
            var accessPath = '';
            busboy.on('field', function (fieldname, data) {
                if (fieldname === 'folder') {
                    subFolder = data;
                }
            });

            busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                var savedFilename = path.join(subFolder, newFileName + path.extname(filename));
                if (!config.storage.type || config.storage.type === 'local') {
                    accessPath = url.resolve(baseURL, savedFilename);
                    savedFilename = path.join(baseFolder, savedFilename);
                }
                file.on('limit', function () {
                    var error = new Error('File is too large');
                    error.type = 'fileSize';
                    error.statusCode = 403;
                    busboy.emit('error', error);
                    imageUpload.deletePartials();
                });
                file.on('error', function (error) {
                    busboy.emit('error', error);
                });

                uploadResult = imageUpload
                    .upload(file, {type: mimetype, filename: savedFilename});
                
            });

            busboy.on('error', done);
            busboy.on('finish', function () {
                if (uploadResult) {
                    uploadResult
                        .then(function (data) {
                            
                            if (accessPath) {
                                data = accessPath;
                            }
                            
                            return res.status(201).json(data);
                        })
                        .catch(function (err) {
                            return res.status(500).json(err);
                        });
                }
                
            });
            req.pipe(busboy);
        }

        
    });
};
