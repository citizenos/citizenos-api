'use strict';

module.exports = function (app) {
    const config = app.get('config');
    const logger = app.get('logger');

    const {
        getSignedUrl
    } = require('@aws-sdk/s3-request-presigner');

    const {
        PutObjectCommand,
        DeleteObjectCommand,
        S3Client,
        S3
    } = require('@aws-sdk/client-s3');

    const credentials = {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey
    };

    const _getSignedUrl = async function (filename, params) {
        try {
            const s3 = new S3(credentials);
            const bucket = config.storage.bucket;

            const s3Params = {
                Bucket: bucket,
                Key: filename
            };

            const data = await getSignedUrl(s3, new PutObjectCommand(Object.assign(s3Params, params)), {
                expiresIn: '/* add value from \'Expires\' from v2 call if present, else remove */'
            });

            return {
                signedRequest: data,
                url: 'https://' + bucket + '.s3.amazonaws.com/' + filename,
                filename: filename
            };
        } catch (err) {
            logger.error(err);
            return err;
        }

    };

    const _deleteFile = async function (filename) {
        const conf = {
            credentials: credentials,
            region: config.storage.region
        };
        const s3Client = new S3Client(conf);
        const bucket = config.storage.bucket;

        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: filename
        });

        return s3Client.send(command);
    };


    return {
        getSignedUrl: _getSignedUrl,
        deleteFile: _deleteFile
    }
};