'use strict';

const config = require('config');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const log4js = require('log4js');
const models = require('./db/models');
const QueryStream = require('pg-query-stream');
const morgan = require('morgan');
const lodash = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const mu = require('mu2');
const fs = require('fs');
const querystring = require('querystring');
const fsExtra = require('fs-extra');
const sanitizeFilename = require('sanitize-filename');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const fastCsv = require('fast-csv');
const Bdoc = require('./libs/bdoc');
const cosHtmlToDocx = require('./libs/cosHtmlToDocx');
const superagent = require('superagent');
const CachemanMemory = require('cacheman-memory');
const Cacheman = require('cacheman');
const striptags = require('striptags');
const device = require('express-device');
const SevenZip = require('node-7z');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const Busboy = require('busboy');
const StreamUpload = require('stream_upload');
const SlowDown = require('express-slow-down');
const RateLimit = require('express-rate-limit');

let rateLimitStore, speedLimitStore;
if (config.rateLimit && config.rateLimit.storageType === 'redis') {
    const RedisStore = require('rate-limit-redis');
    const Redis = require('ioredis');
    const redisUrl = config.rateLimit.client?.url;
    const redisOptions = config.rateLimit.client?.options;
    const client = new Redis(redisUrl, redisOptions);

    rateLimitStore = new RedisStore({
        client,
        prefix: 'rl'
    });

    speedLimitStore = new RedisStore({
        client,
        prefix: 'sl'
    });
}

const rateLimiter = function (allowedRequests, blockTime, skipSuccess) {
    return new RateLimit({
        store: rateLimitStore,
        windowMs: blockTime || (15 * 60 * 1000), // default 15 minutes
        max: allowedRequests || 100,
        skipSuccessfulRequests: skipSuccess || true,
        onLimitReached: function (req) {
            logger.warn('express-rate-limit', 'RATE LIMIT HIT!', `${req.method} ${req.path}`, req.ip, req.rateLimit);
        }
    });
};

const speedLimiter = function (allowedRequests, skipSuccess, blockTime, delay) {
    return new SlowDown({
        store: speedLimitStore,
        windowMs: blockTime || (15 * 60 * 1000), // default 15 minutes
        delayAfter: allowedRequests || 15, // allow 15 requests per 15 minutes, then...
        delayMs: delay || 1000, // response time increases by default 1s per request
        skipSuccessfulRequests: skipSuccess || true,
        onLimitReached: function (req) {
            logger.warn('express-slow-down', 'RATE LIMIT HIT!', `${req.method} ${req.path}`, req.ip, req.rateLimit);
        }
    })
};

const app = express();

// Express settings
// TODO: Would be nice if conf had express.settings.* and all from there would be set
if (app.get('env') === 'production' || app.get('env') === 'test') {
    app.set('trust proxy', true); // http://expressjs.com/guide/behind-proxies.html
}
app.set('rateLimiter', rateLimiter);
app.set('speedLimiter', speedLimiter);
app.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const prerender = require('prerender-node');
prerender.set('prerenderServiceUrl', config.services.prerender.serviceUrl).set('prerenderToken', config.services.prerender.apiKey);
app.use(prerender);

app.set('x-powered-by', false);

// App settings
const APP_ROOT = __dirname;
const PUBLIC_ROOT = path.join(APP_ROOT, 'public');
const FILE_ROOT = path.join(APP_ROOT, 'files');
const TEMPLATE_ROOT = path.join(APP_ROOT, 'views');
const EMAIL_TEMPLATE_ROOT = path.join(APP_ROOT, 'views/emails');
const EMAIL_TEMPLATE_ROOT_LOCAL = path.join(APP_ROOT, 'config/emails');

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
const logger = log4js.getLogger(app.settings.env);
app.set('logger', logger);
app.set('config', config);

const reqLogger = morgan(config.logging.morgan.format, { // HTTP request logger - https://github.com/expressjs/morgan
    stream: {
        write: function (str) {
            logger.info(str);
        }
    }
});
app.use(reqLogger);

const etherpadClient = require('etherpad-lite-client').connect(config.services.etherpad);

const twitter = require('twit')(config.services.twitter);
const options = {
    ttl: '-1',
    engine: new CachemanMemory({count: 50})
};
const hashtagCache = new Cacheman('hashtagCache', options);

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

if (config.storage?.type.toLowerCase() === 's3') {
    const cosS3 = require('./libs/cosS3')(app);
    app.set('cosS3', cosS3);
}

app.set('url', require('url'));
app.set('lodash', lodash);
app.set('validator', require('validator'));
app.set('Promise', Promise);
app.set('fs', fs);
app.set('crypto', require('crypto'));
app.set('querystring', querystring);
app.set('fsExtra', fsExtra);
app.set('sanitizeFilename', sanitizeFilename);
app.set('uuid', uuid);
app.set('jwt', jwt);
app.set('fastCsv', fastCsv);
app.set('Bdoc', Bdoc);
app.set('cosHtmlToDocx', cosHtmlToDocx);
app.set('etherpadClient', etherpadClient);
app.set('superagent', superagent);
app.set('moment', moment);
app.set('twitter', twitter);
app.set('hashtagCache', hashtagCache);
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
app.set('cosEtherpad', require('./libs/cosEtherpad')(app));
app.set('cosJwt', require('./libs/cosJwt')(app));
app.set('cosUpload', require('./libs/cosUpload')(app));

//Config smartId
const smartId = require('smart-id-rest')();
smartId.init({
    hostname: config.services.smartId.hostname,
    apiPath: config.services.smartId.apiPath,
    authorizeToken: config.services.smartId.authorizeToken,
    relyingPartyUUID: config.services.smartId.relyingPartyUUID,
    replyingPartyName: config.services.smartId.replyingPartyName,
    issuers: config.services.signature.certificates.issuers
});
app.set('smartId', smartId);
//Config mobiilId
const mobileId = require('mobiil-id-rest')();
mobileId.init({
    hostname: config.services.mobileId.hostname,
    apiPath: config.services.mobileId.apiPath,
    authorizeToken: config.services.mobileId.authorizeToken,
    relyingPartyUUID: config.services.mobileId.relyingPartyUUID,
    replyingPartyName: config.services.mobileId.replyingPartyName,
    issuers: config.services.signature.certificates.issuers
});
app.set('mobileId', mobileId);
app.set('cosSignature', require('./libs/cosSignature')(app));

if (typeof config.email === 'string') {
    config.email = JSON.parse(config.email); // Support JSON string from ENV
}
config.email.layout = config.email.layout || path.join(EMAIL_TEMPLATE_ROOT, 'layouts/default.html');
app.set('emailClient', require('./libs/campaign/emailClient')(config.email));
app.set('email', require('./libs/email')(app));

app.set('cryptoLib', require('./libs/crypto'));

// Authentication with Passport - http://passportjs.org/guide/
const passport = require('passport');
app.set('passport', passport);
require('./libs/passport/index')(app).init();

// Configure middleware
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/json'}));
app.use(bodyParser.json({type: 'application/csp-report'}));
app.use(bodyParser.urlencoded({extended: false}));

// CORS
const corsOptions = config.api.cors;
const corsPaths = lodash.cloneDeep(config.api.cors.paths);
delete corsOptions.paths; // Remove the paths just in case it will conflict with CORS MW options now or in the future
corsOptions.origin.forEach(function (pattern, i) {
    corsOptions.origin[i] = new RegExp(pattern, 'i');
});
const corsMiddleware = cors(corsOptions);
app.use(corsPaths, corsMiddleware); // CORS
app.options(corsPaths, corsMiddleware); // Enable CORS preflight - https://github.com/expressjs/cors#enabling-cors-pre-flight

// Static
app.use(express.static(PUBLIC_ROOT));
app.use('/static', express.static(PUBLIC_ROOT)); // If you move static below session definition, static will also generate a session

// Response handler
app.use(require('./libs/middleware/response'));

// Load public and private key to config. Keys are used for signing JWT tokens
const sessionPrivateKey = config.session.privateKey;
if (!sessionPrivateKey || sessionPrivateKey.indexOf('PRIVATE KEY') < 0) {
    throw new Error('Invalid configuration! Invalid value for "session.privateKey". Was: "' + sessionPrivateKey + '"');
}

const sessionPublicKey = config.session.publicKey;
if (!sessionPublicKey || sessionPublicKey.indexOf('PUBLIC KEY') < 0) {
    throw new Error('Invalid configuration! Invalid value for "session.publicKey". Was: "' + sessionPublicKey + '"');
}

const cookieSecret = config.session.secret;
if (!cookieSecret) {
    throw new Error('Invalid configuration! Invalid value for "session.secret". Was: "' + cookieSecret + '". See https://github.com/expressjs/session#secret');
}

const cosApiKey = config.api.key;
if (!cosApiKey) {
    throw new Error('Invalid configuration! Invalid value for "api.key". Was: "' + cosApiKey + '". Must be something unique. This value is used for authenticating to webhooks ("/routes/api/internal") and originally used by Etherpad');
}
app.use(session(config.session));
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
app.set('middleware.expressRateLimitInput', require('./libs/middleware/expressRateLimitInput')(app));
app.set('middleware.authApiKey', require('./libs/middleware/authApiKey'));
app.set('middleware.authTokenRestrictedUse', require('./libs/middleware/authTokenRestrictedUse'));
app.set('middleware.partnerParser', require('./libs/middleware/partnerParser')(app));
app.set('middleware.uuidValidator', require('./libs/middleware/uuidValidator')(app));
app.set('middleware.deprecated', require('./libs/middleware/deprecated'));
app.set('middleware.asyncMiddleware', require('./libs/middleware/asyncMiddleware'));

// Bot header logger
app.use(require('./libs/middleware/botHeaderLogger'));

// Load all API routes
const routesApi = './routes/api/';
fs.readdirSync(routesApi).forEach(function (file) {
    if (!file.match(/\.js$/)) { // Exclude folders
        return;
    }
    require(routesApi + file)(app);
});

// Load all internal API routes
const routesApiInternal = './routes/api/internal/';
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
