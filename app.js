'use strict';

var config = require('config');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var log4js = require('log4js');
var models = require('./db/models');
var QueryStream = require('pg-query-stream');
var morgan = require('morgan');
var lodash = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var mu = require('mu2');
var fs = require('fs');
var querystring = require('querystring');
var stream = require('stream');
var fsExtra = require('fs-extra');
var sanitizeFilename = require('sanitize-filename');
var nodeForge = require('node-forge');
var uuid = require('uuid');
var jwt = require('jsonwebtoken');
var objectEncrypter = require('object-encrypter');
var fastCsv = require('fast-csv');
var Bdoc = require('./libs/bdoc');
var cosHtmlToDocx = require('./libs/cosHtmlToDocx');
var superagent = require('superagent');
var CachemanMemory = require('cacheman-memory');
var Cacheman = require('cacheman');
var Entities = require('html-entities').AllHtmlEntities;
var striptags = require('striptags');
var device = require('express-device');
var SevenZip = require('node-7z');
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('./swagger.json');
var Busboy = require('busboy');
var StreamUpload = require('stream_upload');
var app = express();

// Express settings
// TODO: Would be nice if conf had express.settings.* and all from there would be set
if (app.get('env') === 'production' || app.get('env') === 'test') {
    app.set('trust proxy', true); // http://expressjs.com/guide/behind-proxies.html
}

app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
var prerender = require('prerender-node');
prerender.set('prerenderServiceUrl', config.services.prerender.serviceUrl).set('prerenderToken', config.services.prerender.apiKey);
app.use(prerender);

app.set('x-powered-by', false);

// App settings
var APP_ROOT = __dirname;
var PUBLIC_ROOT = path.join(APP_ROOT, 'public');
var FILE_ROOT = path.join(APP_ROOT, 'files');
var TEMPLATE_ROOT = path.join(APP_ROOT, 'views');
var EMAIL_TEMPLATE_ROOT = path.join(APP_ROOT, 'views/emails');
var EMAIL_TEMPLATE_ROOT_LOCAL = path.join(APP_ROOT, 'config/emails');

app.set('APP_ROOT', APP_ROOT);
app.set('PUBLIC_ROOT', PUBLIC_ROOT);
app.set('FILE_ROOT', FILE_ROOT);
app.set('TEMPLATE_ROOT', TEMPLATE_ROOT);
app.set('EMAIL_TEMPLATE_ROOT', EMAIL_TEMPLATE_ROOT);
app.set('EMAIL_TEMPLATE_ROOT_LOCAL', EMAIL_TEMPLATE_ROOT_LOCAL);

//Set app view engine
app.use(device.capture());

// Init "services"
if (typeof config.logging === 'string') {
    config.logging = JSON.parse(config.logging); // Support JSON string from ENV
}
log4js.configure(config.logging.log4js);
var logger = log4js.getLogger(app.settings.env);
app.set('logger', logger);
app.set('config', config);

var reqLogger = morgan(config.logging.morgan.format, { // HTTP request logger - https://github.com/expressjs/morgan
    stream: {
        write: function (str) {
            logger.info(str);
        }
    }
});
app.use(reqLogger);

var etherpadClient = require('etherpad-lite-client').connect(config.services.etherpad);

var twitter = require('twit')(config.services.twitter);
var options = {
    ttl: '-1',
    engine: new CachemanMemory({count: 50})
};
var hashtagCache = new Cacheman('hashtagCache', options);

// Promisifications
Promise.promisifyAll(fs);
Promise.promisifyAll(fsExtra);
Promise.promisifyAll(mu);
Promise.promisifyAll(etherpadClient);
Promise.promisifyAll(twitter);

// Check Etherpad availability, warn if Etherpad is not running, but continue.
etherpadClient.checkTokenAsync()
    .then(function () {
        logger.info('Connected to Etherpad', etherpadClient.options.host, etherpadClient.options.port);
    })
    .catch(function (err) {
        logger.error('Failed to connect to Etherpad. Error was: ' + err.message + '. Etherpad configuration is ' + JSON.stringify(etherpadClient.options));
    });

app.set('url', require('url'));
app.set('lodash', lodash);
app.set('async', require('async'));
app.set('validator', require('validator'));
app.set('Promise', Promise);
app.set('fs', fs);
app.set('crypto', require('crypto'));
app.set('querystring', querystring);
app.set('stream', stream);
app.set('fsExtra', fsExtra);
app.set('sanitizeFilename', sanitizeFilename);
app.set('nodeForge', nodeForge);
app.set('uuid', uuid);
app.set('jwt', jwt);
app.set('objectEncrypter', objectEncrypter);
app.set('fastCsv', fastCsv);
app.set('Bdoc', Bdoc);
app.set('cosHtmlToDocx', cosHtmlToDocx);
app.set('etherpadClient', etherpadClient);
app.set('superagent', superagent);
app.set('moment', moment);
app.set('twitter', twitter);
app.set('hashtagCache', hashtagCache);
app.set('encoder', new Entities());
app.set('striptags', striptags);
app.set('SevenZip', SevenZip);
app.set('busboy', Busboy);
app.set('stream_upload', StreamUpload);

mu.root = TEMPLATE_ROOT;
app.set('mu', mu);

app.set('models', models);
app.set('QueryStream', QueryStream);

app.set('cosActivities', require('./libs/cosActivities')(app));
app.set('urlLib', require('./libs/url')(config));
app.set('util', require('./libs/util'));
app.set('ddsClient', require('./libs/ddsClient'));
app.set('cosBdoc', require('./libs/cosBdoc')(app));
app.set('cosEtherpad', require('./libs/cosEtherpad')(app));
app.set('cosJwt', require('./libs/cosJwt')(app));

//Config smartId 
var smartId = require('./libs/cosSmartId')(app);
smartId.init({
    hostname: config.services.smartId.hostname,
    apiPath: config.services.smartId.apiPath,
    authPath: config.services.smartId.authPath,
    authorizeToken: config.services.smartId.authorizeToken,
    relyingPartyUUID: config.services.smartId.relyingPartyUUID,
    replyingPartyName: config.services.smartId.replyingPartyName,
    statusPath: config.services.smartId.statusPath
});
app.set('smartId', smartId);

if (typeof config.email === 'string') {
    config.email = JSON.parse(config.email); // Support JSON string from ENV
}
config.email.layout = config.email.layout || path.join(EMAIL_TEMPLATE_ROOT, 'layouts/default.html');
app.set('emailClient', require('./libs/campaign/emailClient')(config.email));
app.set('email', require('./libs/email')(app));

app.set('cryptoLib', require('./libs/crypto'));

// Authentication with Passport - http://passportjs.org/guide/
var passport = require('passport');
app.set('passport', passport);
require('./libs/passport/index')(app).init();

// Configure middleware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// CORS
var corsOptions = config.api.cors;
var corsPaths = lodash.cloneDeep(config.api.cors.paths);
delete corsOptions.paths; // Remove the paths just in case it will conflict with CORS MW options now or in the future
corsOptions.origin.forEach(function (pattern, i) {
    corsOptions.origin[i] = new RegExp(pattern, 'i');
});
var corsMiddleware = cors(corsOptions);
app.use(corsPaths, corsMiddleware); // CORS
app.options(corsPaths, corsMiddleware); // Enable CORS preflight - https://github.com/expressjs/cors#enabling-cors-pre-flight

// Static
app.use(express.static(PUBLIC_ROOT));
app.use('/static', express.static(PUBLIC_ROOT)); // If you move static below session definition, static will also generate a session

// Response handler
app.use(require('./libs/middleware/response'));

// Load public and private key to config. Keys are used for signing JWT tokens
var sessionPrivateKey = config.session.privateKey;
if (!sessionPrivateKey || sessionPrivateKey.indexOf('PRIVATE KEY') < 0) {
    throw new Error('Invalid configuration! Invalid value for "session.privateKey". Was: "' + sessionPrivateKey + '"');
}

var sessionPublicKey = config.session.publicKey;
if (!sessionPublicKey || sessionPublicKey.indexOf('PUBLIC KEY') < 0) {
    throw new Error('Invalid configuration! Invalid value for "session.publicKey". Was: "' + sessionPublicKey + '"');
}

var cookieSecret = config.session.secret;
if (!cookieSecret) {
    throw new Error('Invalid configuration! Invalid value for "session.secret". Was: "' + cookieSecret + '". See https://github.com/expressjs/session#secret');
}

var cosApiKey = config.api.key;
if (!cosApiKey) {
    throw new Error('Invalid configuration! Invalid value for "api.key". Was: "' + cosApiKey + '". Must be something unique. This value is used for authenticating to webhooks ("/routes/api/internal") and originally used by Etherpad');
}

// Cache control for API requests, fixes IE not re-validating eTags - https://trello.com/c/t45AGz4y/372-bug-mobiil-id-login-and-signing-does-not-work-on-ie11-due-to-caching-issues
app.use(/^\/api\/.*/, function (req, res, next) {
    res.set('Expires', -1);
    res.set('Cache-Control', 'must-revalidate, private');
    next();
});

// Enable sessions for API path
app.use(/^\/api\/.*/, require('./libs/middleware/authTokenParser'));
app.use(/^\/api\/auth\/.*/, passport.initialize());
app.set('middleware.loginCheck', require('./libs/middleware/loginCheck'));
app.set('middleware.authApiKey', require('./libs/middleware/authApiKey'));
app.set('middleware.authTokenRestrictedUse', require('./libs/middleware/authTokenRestrictedUse'));
app.set('middleware.partnerParser', require('./libs/middleware/partnerParser')(app));
app.set('middleware.uuidValidator', require('./libs/middleware/uuidValidator')(app));

// Bot header logger
app.use(require('./libs/middleware/botHeaderLogger'));

// Load all API routes
var routesApi = './routes/api/';
fs.readdirSync(routesApi).forEach(function (file) {
    if (!file.match(/\.js$/)) { // Exclude folders
        return;
    }
    require(routesApi + file)(app);
});

// Load all internal API routes
var routesApiInternal = './routes/api/internal/';
fs.readdirSync(routesApiInternal).forEach(function (file) {
    if (!file.match(/\.js$/)) { // Exclude folders
        return;
    }
    require(routesApiInternal + file)(app);
});

app.get('/favicon.ico', function (req, res) {
    res.sendFile(path.join(PUBLIC_ROOT, 'imgs/favicon.ico'));
});

// Allow direct linking in the FE
app.get('/', function (req, res) {
    res.sendFile(path.join(PUBLIC_ROOT, 'index.html'));
});

// Error handling middleware. Must be the last in the chain
app.use(require('./libs/sequelize/middleware/error')); //  Map Sequelize errors to user friendly responses.
app.use(require('./libs/middleware/error'));

module.exports = app;
