# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm start          # Start development server (NODE_ENV=development, https://dev.api.citizenos.com:3003)
npm test           # Run full Mocha test suite (NODE_ENV=test)
npm run eslint     # Lint via Grunt/ESLint
npm run dbmigrate  # Run Sequelize DB migrations
npm run dbrollback # Undo last migration
npm run dbstatus   # Check migration status
npm run dbcreate   # Create DB schema from scratch (requires DATABASE_URL env var)
```

Run a single test file or grep specific tests:
```sh
NODE_ENV=test NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/mocha --ui tdd --no-exit test/api/topic.js
NODE_ENV=test NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/mocha --ui tdd --no-exit --grep "POST /api/v1/topics" test/api/topic.js
```

## Architecture

### Service-based Express app

`app.js` is the entry point. It follows a **dependency injection via `app.set/get`** pattern — every shared object (models, logger, config, libraries, middleware) is stored on the Express `app` instance and retrieved with `app.get('key')` inside route/service modules.

All route and service modules export `function(app) { ... }` and are auto-loaded at startup:
- `routes/api/*.js` — public REST API endpoints
- `routes/api/internal/*.js` — internal endpoints (API key auth only)
- `services/*.js` — shared business logic used by multiple route files

### Request/Response conventions

Every response goes through `libs/middleware/response.js`, which adds these helper methods to `res`:
- `res.ok(msg?, statusCode?, data)` — 200
- `res.created(msg?, statusCode?, data)` — 201
- `res.badRequest(msg?, statusCode?, errors)` — 400
- `res.unauthorised(msg?)` — 401
- `res.forbidden(msg?)` — 403
- `res.notFound(msg?)` — 404
- `res.internalServerError(msg?)` — 500

Response body shape:
```json
{ "status": { "code": 20000 }, "data": { ... } }   // success
{ "status": { "code": 40000, "message": "..." }, "errors": { ... } }  // error
```
Status code is a 5-digit number: HTTP code × 100 + optional sub-code.

### Authentication

Passport.js with strategies in `libs/passport/index.js`:
- **Local** (email/password)
- **Google OAuth2** (`passport-google-oauth20`)
- **Facebook** (`passport-facebook`)
- **Estonian e-ID**: Smart-ID (`libs/`) and Mobiil-ID (`libs/`) — REST clients, initialized in `app.js`

Auth token parsing for API calls is in `libs/middleware/authTokenParser.js`. `loginCheck` middleware enforces authentication and optional scope checks. `authTokenRestrictedUse` handles limited-purpose JWT tokens (e.g. invite links).

### Database

Sequelize 6 with PostgreSQL. All models live in `db/models/`. The index (`db/models/index.js`) auto-loads every model file and sets up associations.

Key domain models: `Topic`, `Group`, `User`, `Vote`, `VoteOption`, `Comment`, `Discussion`, `Ideation`, `Idea`, `Attachment`, `Activity`.

Join/membership models follow the pattern `{Entity}Member{User|Group}` (e.g. `TopicMemberUser`, `GroupMemberUser`).

Models prefixed with `_` (e.g. `_TopicInvite`, `_GroupInvite`) are base/abstract models not used directly.

All models use `paranoid: true` (soft delete via `deletedAt`).

### Async route handlers

Use the `asyncMiddleware` wrapper (`app.get('middleware.asyncMiddleware')`) for `async` route handlers so unhandled rejections are forwarded to Express error handling:
```js
router.get('/path', asyncMiddleware(async (req, res) => { ... }));
```

### Configuration

Uses `node-config`. Priority order: `config/default.json` → `config/{NODE_ENV}.json` → `config/local.json` → env vars (see `config/custom-environment-variables.json`).

Create `config/local.json` from `config/default.json` for local overrides — it is `.gitignore`d.

### External services

Configured in `config/*.json` under `services.*`:
- **Etherpad**: collaborative document editing, client at `libs/cosEtherpad.js`
- **Redis**: rate limiting and session store (`libs/redis/`), supports `REDIS_TLS_URL`/`REDIS_URL` env vars
- **S3**: file storage (`libs/cosS3.js`), used when `config.storage.type === 's3'`
- **Email**: Campaign + Nodemailer via `libs/email.js` and `libs/campaign/emailClient.js`; templates in `views/emails/` with local overrides in `config/emails/`

### Rate limiting

`rateLimiter(allowedRequests, blockTime, skipSuccess)` and `speedLimiter(...)` are set on `app` and consumed by individual routes. Both are no-ops in `test` environment unless `ENABLE_RATE_LIMIT=true`.

### Testing

Tests use Mocha (TDD UI) + Chai + Supertest. Each test file in `test/api/` matches a route file. Tests define helper functions like `_topicCreate(agent, ...)` (which assert a specific HTTP code) and `topicCreate(agent, ...)` (which defaults to the happy-path HTTP code). Run the full suite before committing.

### Git conventions

Conventional Commits: `type(scope): description` — e.g. `feat(topic): add co-author support`.
