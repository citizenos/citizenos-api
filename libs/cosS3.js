'use strict';

module.exports = function (app) {

    const config = app.get('config');
    const logger = app.get('logger');

    const AWS = require('aws-sdk');
    const credentials = {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey
    };

    const _getSignedUrl = async function (filename, params) {
        try {
            const s3 = new AWS.S3(credentials);
            const bucket = config.storage.bucket;

            const s3Params = {
                Bucket: bucket,
                Key: filename
            };

            const data = await s3.getSignedUrlPromise('putObject', Object.assign(s3Params, params));

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
        const s3 = new AWS.S3(credentials);
        const bucket = config.storage.bucket;

        const params = {
            Bucket: bucket,
            Key: filename
        };

        return s3.deleteObject(params).promise();
    };


    return {
        getSignedUrl: _getSignedUrl,
        deleteFile: _deleteFile
    }
};