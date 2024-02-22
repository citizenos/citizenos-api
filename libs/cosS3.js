'use strict';

module.exports = function (app) {
    const config = app.get('config');
    const logger = app.get('logger');

    const {
        getSignedUrl
    } = require('@aws-sdk/s3-request-presigner');

    const {
        PutObjectCommand,
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
        const s3 = new S3(credentials);
        const bucket = config.storage.bucket;
        const region = config.storage.region;

        console.log(bucket, region)
        const params = {
            Bucket: bucket,
            region: region,
            Key: filename
        };

        return s3.deleteObject(params);
    };


    return {
        getSignedUrl: _getSignedUrl,
        deleteFile: _deleteFile
    }
};