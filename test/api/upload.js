'use strict';

var _uploadFile = function (agent, userId, file, folderName, expectedHttpCode, callback) {
    var path = '/api/users/:userId/upload'.replace(':userId', userId);

    var request = agent
        .post(path);
        
    if (folderName) {
        request.field('folder', folderName);
    }

    request
        .attach('file', file)
        .set('Content-Type', 'multipart/form-data')
        .expect(expectedHttpCode)
        .end(callback);
};

var uploadFile = function (agent, userId, file, folderName, callback) {
    _uploadFile(agent, userId, file, folderName, 201, callback);
};

module.exports.uploadFile = uploadFile;

var chai = require('chai');
chai.use(require('chai-datetime'));
chai.use(require('chai-shallow-deep-equal'));
var assert = chai.assert;
var request = require('supertest');
var app = require('../../app');
var config = app.get('config');
var https = require('https');
var fs = require('fs-extra');
var path = require('path');

var shared = require('../utils/shared');
var userLib = require('./lib/user')(app);


// API - /api/users*
suite('Users', function () {

    suiteSetup(function (done) {
        shared
            .syncDb()
            .finally(done);
    });

    // API - /api/users/:userId/activities*
    suite('Upload', function () {

        suite('File', function () {
            var agent = request.agent(app);

            var user;

            suiteSetup(function (done) {
                userLib.createUserAndLogin(agent, null, null, null, function (err, res) {
                    if (err) return done(err);

                    user = res;

                    done();
                });
            });

            test('Success', function (done) {
                var file = path.join(__dirname, '/uploads/test.txt');
                uploadFile(agent, user.id, file, 'test', function (err, res) {
                    if (err) return done(err);
                    var fileUrl = res.body;
                    assert.include(fileUrl, config.url.api);
                    
                    var file = fs.createWriteStream(path.join(__dirname, '/uploads/return.txt'));

                    https.get(res.body, function (response) {
                        var stream = response.pipe(file);

                        stream.on('finish', function () {
                            fs.readFile(path.join(__dirname, '/uploads/return.txt'), 'utf8', function (err, data) {
                                if (err) return done(err);
                                assert.equal('Test file for upload test.', data);
                                fs.remove(path.join(__dirname, '/uploads/return.txt'));
                                fs.remove(path.join(__dirname.replace('/test/api', '/public/uploads/'), 'test/'));
                                done();
                            });
                        });
                    });
                });
            });
        });

    });
});
