'use strict';

module.exports = function (app) {

    const config = app.get('config');
    const loginCheck = app.get('middleware.loginCheck');
    const cosS3 = app.get('cosS3');
    const uuid = app.get('uuid');
    const Busboy = app.get('busboy');
    const StreamUpload = app.get('stream_upload');
    const path = require('path');
    const logger = app.get('logger');

    /**
     * Sign upload
     */

    app.get('/api/users/:userId/upload/sign', loginCheck(['partner']), async function (req, res, next) {
        try {
            let filename = uuid.v4();
            const filetype = req.query.filetype;
            const folder = req.query.folder;

            if (folder) {
                filename = folder + '/' + filename;
            }

            const params = {
                Expires: 900,
                ContentType: filetype,
                ACL: 'public-read'
            }
            const signedUrlData = await cosS3.getSignedUrl(filename, params);

            return res.ok(signedUrlData);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Sign download
     */
    app.get('/api/upload/signdownload', async function (req, res, next) {
        try {
            let filename = req.query.filename;
            const filetype = req.query.filetype;
            let downloadName = req.query.downloadName;
            const folder = req.query.folder;

            if (folder) {
                filename = folder + '/' + filename;
            }

            let responseHeader = 'attachment;';

            if (downloadName) {
                const regEx = new RegExp('.' + filetype, 'gi');
                downloadName = [encodeURIComponent(downloadName.replace(regEx, '')), filetype].join('.');
                responseHeader += 'filename=' + downloadName;
            }

            const params = {
                Expires: 60,
                ResponseContentDisposition: responseHeader
            };

            const url = await cosS3.getSignedUrl(filename, params);

            return res.ok({url: url});
        } catch (err) {
            return next(err);
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
                    };
                }

            });
            req.pipe(busboy);
        }


    });
};
