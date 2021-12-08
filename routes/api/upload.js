'use strict';

module.exports = function (app) {

    const config = app.get('config');
    const loginCheck = app.get('middleware.loginCheck');

    const AWS = require('aws-sdk');
    const uuid = app.get('uuid');
    const Promise = app.get('Promise');
    const Busboy = app.get('busboy');
    const StreamUpload = app.get('stream_upload');
    const path = require('path');
    const logger = app.get('logger');

    const credentials = {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey
    };

    /**
     * Sign upload
     */

    app.get('/api/users/:userId/upload/sign', loginCheck(['partner']), function (req, res, next) {

        let filename = uuid.v4();
        const filetype = req.query.filetype;
        const folder = req.query.folder;
        const bucket = config.storage.bucket;

        if (folder) {
            filename = folder + '/' + filename;
        }

        const s3Params = {
            Bucket: bucket,
            Key: filename,
            Expires: 900,
            ContentType: filetype,
            ACL: 'public-read'
        };

        const s3 = new AWS.S3(credentials);
        s3.getSignedUrl('putObject', s3Params, function (err, data) {
            if (err) {
                return next(err);
            }
            const returnData = {
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
        let filename = req.query.filename;
        const filetype = req.query.filetype;
        let downloadName = req.query.downloadName;
        const folder = req.query.folder;
        const bucket = config.storage.bucket;

        if (folder) {
            filename = folder + '/' + filename;
        }

        let responseHeader = 'attachment;';

        if (downloadName) {
            const regEx = new RegExp('.' + filetype, 'gi');
            downloadName = [encodeURIComponent(downloadName.replace(regEx, '')), filetype].join('.');
            responseHeader += 'filename=' + downloadName;
        }

        const s3 = new AWS.S3(credentials);

        const params = {
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


    const _deleteFromS3 = function (filename, folder) {
        return new Promise(function (resolve, reject) {
            const s3 = new AWS.S3();
            const bucket = config.storage.bucket;

            if (folder) {
                filename = folder + '/' + filename;
            }

            const params = {
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

    app.delete('/api/users/:userId/upload', loginCheck(['partner']), async function (req, res, next) {
        const filename = req.query.filename;
        const folder = req.query.folder;

        //FIXME: No delete from DB?
        try {
            await _deleteFromS3(filename, folder);

            return res.ok();
        } catch (e) {
            return next(e);
        }
    });

    const drainStream = function (stream) {
        stream.on('readable', stream.read.bind(stream));
    };

    app.post('/api/users/:userId/upload', loginCheck(['partner']), function (req, res, next) {
        const appDir = __dirname.replace('/routes/api', '/public/uploads');

        const baseFolder = config.storage.baseFolder || appDir;
        const baseURL = config.storage.baseURL || (config.url.api + '/uploads/');

        let subFolder = req.params.padId || ''; // topic ID
        const imageUpload = new StreamUpload({
            extensions: config.storage.allowedFileTypes,
            types: config.storage.allowedMimeTypes,
            maxSize: config.storage.maxFileSize,
            baseFolder: baseFolder,
            storage: config.storage
        });

        const storageConfig = config.storage;
        let busboy;
        if (storageConfig) {
            try {
                busboy = new Busboy({
                    headers: req.headers,
                    limits: {
                        fileSize: config.maxFileSize
                    }
                });
            } catch (error) {
                logger.error('UPLOAD ERROR', error);

                return next(error);
            }

            let isDone;
            const done = function (error) {
                logger.error('UPLOAD ERROR', error);

                if (isDone) return;
                isDone = true;

                res.status(error.statusCode || 500).json(error.message);
                req.unpipe(busboy);
                drainStream(req);
                busboy.removeAllListeners();
            };
            let uploadResult;
            const newFileName = uuid.v4();
            let accessPath = '';
            busboy.on('field', function (fieldname, data) {
                if (fieldname === 'folder') {
                    subFolder = data;
                }
            });

            busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                let savedFilename = path.join(subFolder, newFileName + path.extname(filename));
                if (!config.storage.type || config.storage.type === 'local') {
                    accessPath = new URL(savedFilename, baseURL);
                    savedFilename = path.join(baseFolder, savedFilename);
                }
                file.on('limit', function () {
                    const error = new Error('File is too large');
                    error.type = 'fileSize';
                    error.statusCode = 403;
                    busboy.emit('error', error);
                    imageUpload.deletePartials();
                });
                file.on('error', function (error) {
                    busboy.emit('error', error);
                });

                uploadResult = imageUpload.upload(file, {
                    type: mimetype,
                    filename: savedFilename
                });

            });

            busboy.on('error', done);
            busboy.on('finish', async function () {
                if (uploadResult) {
                    try {
                        let data = await uploadResult
                        if (accessPath) {
                            data = accessPath.href;
                        }

                        return res.status(201).json(data);
                    } catch (err) {
                        return res.status(500).json(err);
                    }
                }

            });
            req.pipe(busboy);
        }


    });
};
