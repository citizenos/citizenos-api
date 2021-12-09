'use strict';

module.exports = function (app) {
    const loginCheck = app.get('middleware.loginCheck');
    const cosS3 = app.get('cosS3');
    const uuid = app.get('uuid');

    /**
     * Sign upload
     */

    app.get('/api/users/:userId/upload/sign', loginCheck(['partner']), async function (req, res, next) {
        try {
            let filename = uuid.v4();
            const filetype = req.query.filetype;
            const folder = req.query.folder;

            if (folder) {
                filename = `${folder}/${filename}`;
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
                filename = `${folder}/${filename}`;
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

};
