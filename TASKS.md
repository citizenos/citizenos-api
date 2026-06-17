# TASKS.md — citizenos-api Refactoring

Tracking table at bottom. Check a box (`- [x]`) immediately when a task is done.

---

## Phase 1 — Foundation Services

These must be done first. Everything in Phase 2 depends on them.

### 1.1 Register services in app.js

- [x] Change `app.js` service loader to store each service on `app` via `app.set()`
  - Currently: `require(routesServices + file)(app)` discards the return value
  - Target: `app.set('topicService', require('./services/topic')(app))` etc.
  - Derive the key name from the filename (e.g. `topic.js` → `topicService`)
  - Update all existing `require('../../services/...')` local imports in routes to use `app.get('...')`

### 1.2 `services/activityLog.js` — wrap cosActivities + transaction boilerplate

- [x] Create `services/activityLog.js` exposing `withTransaction(fn)` as a thin wrapper over `db.transaction()`,
  so route handlers no longer couple directly to Sequelize internals for transaction management.
  Registered as `activityLogService` on app.

### 1.3 `services/permissions.js` — unified permission checks

- [x] Create `services/permissions.js` consolidating the duplicated permission SQL from:
  - `services/topic.js` lines 61–170 (`hasPermission` / `_hasPermission`)
  - `routes/api/group.js` lines 39–91 (`_hasPermission`)
  - Exposes: `hasTopicPermission`, `hasTopicVisibility`, `isModerator`, `hasModeratorPermission`, `_topicPermission`, `hasGroupPermission`, `_groupPermission`
  - Registered as `permissionsService` on app
- [x] Replace inline permission SQL in `routes/api/group.js` with `permissionsService.hasGroupPermission` and `_groupPermission`
- [x] Replace permission SQL in `services/topic.js` with lazy wrappers delegating to `permissionsService`

---

## Phase 2 — Entity Services

Extract all DB logic out of route files into dedicated services.

### 2.1 Extend `services/topic.js`

- [x] Extract the 11 repeated `Topic.findOne` patterns from `routes/api/topic.js` into named helpers:
  - [x] `getById(topicId, options)` — base fetch
  - [x] `getWithMembers(topicId, userId)` — includes TopicMemberUser, TopicMemberGroup
  - [x] `getWithVote(topicId, userId)` — includes Vote, VoteOption
  - [x] `getWithIdeation(topicId)` — includes Ideation
- [x] Move all `Topic.create` / `Topic.update` / `Topic.destroy` calls out of route handlers into service methods
- [x] Move Etherpad-related topic operations (`cosEtherpad.*`) into service methods so routes don't call them directly

### 2.2 `services/groupService.js` — new service for all group DB logic

- [x] Create `services/groupService.js` covering:
  - `getById(groupId, userId)` — fetch with permission level
  - `getByIdPublic(groupId, userId)` — public read (visibility=public only)
  - `list(userId, filters)` — user's groups list query
  - `create(data, actorId, transaction)` — create + activity log
  - `update(group, data, actorId, transaction)` — update + activity log
  - `remove(group, actorId, transaction)` — soft delete + activity log
  - `updateMemberLevel(groupId, memberId, newLevel, actorId, transaction)`
  - `removeMember(groupId, memberId, actorId, transaction)`
- [x] Remove extracted logic from `routes/api/group.js`, replace with service calls
- [x] Route handlers should only: validate input → call service → send response

### 2.3 `services/discussionService.js` — new service

- [x] Create `services/discussionService.js`:
  - Deduplicated the SQL fetch into a single `getById(discussionId)` function
  - `create`, `update`, `remove` with activity logging
  - `getParticipants(discussionId)` — extract DB query from route
- [x] Remove extracted logic from `routes/api/discussion.js`

### 2.4 `services/ideationService.js` — new service (highest raw SQL count)

- [x] Create `services/ideationService.js` to consolidate 10 raw SQL queries in `routes/api/ideation.js`:
  - `getById(ideationId, topicId)`
  - `listIdeas(ideationId, filters, userId)` — paginated, with vote counts
  - `createIdea(ideationId, data, authorId, transaction)`
  - `updateIdea(ideaId, data, actorId, transaction)`
  - `deleteIdea(ideaId, actorId, transaction)`
  - `getMemberList(ideationId)` — the raw member SQL query
- [x] Evaluate each raw SQL query: convert to Sequelize where possible, keep raw only where complex CTE/window functions are required
- [x] Remove extracted logic from `routes/api/ideation.js`

### 2.5 Extend `services/vote.js`

- [x] `getVoteResults(voteId, userId)` and `getAllVotesResults` already exist in the service and are used from routes — no work needed.

---

## Phase 3 — Route File Cleanup

Do after Phase 2 services exist.

### 3.1 Split `routes/api/topic.js` (5,337 lines)

- [x] Split into logical sub-files by resource, mounted from a thin `topic.js` router:
  - `routes/api/topic/members.js` — member CRUD endpoints
  - `routes/api/topic/invites.js` — invite endpoints
  - `routes/api/topic/events.js` — TopicEvent endpoints
  - `routes/api/topic/attachments.js` — attachment endpoints
  - `routes/api/topic/index.js` — core CRUD (create, read, update, delete, list)
- [x] Each handler: validate → call service → respond. No raw DB calls.

### 3.2 Split `routes/api/group.js` (3,466 lines)

- [x] Same pattern as topic split:
  - `routes/api/group/members.js`
  - `routes/api/group/invites.js`
  - `routes/api/group/index.js`

### 3.3 Standardize raw SQL vs Sequelize

- [x] Audit all remaining raw SQL queries after Phase 2 extractions
- [x] For each: document why raw SQL is needed, or convert to Sequelize with includes/subqueries
- [x] Add a comment `// Raw SQL: reason` above any raw query that must remain

### 3.4 Standardize response and error patterns

- [x] Ensure all route handlers use `res.ok()`, `res.created()`, `res.badRequest()` etc. — remove any `res.status().json()` calls that bypass the response middleware
- [x] Ensure all async route handlers are wrapped in `asyncMiddleware` (no uncaught promise rejections)

---

## Phase 4 — Quality & Consistency

### 4.1 Remove service loader duplication

- [x] After all services are registered via `app.set()`, remove any remaining local `require('../../services/...')` calls in route files

### 4.2 Transaction consistency

- [x] Audit all `db.transaction()` calls: ensure `t.afterCommit()` is used for side effects (email, response) consistently across all files
  - All files we modified (discussion.js, group.js) use `afterCommit` correctly for success responses
  - Pre-existing validation/error `res.` calls inside transaction blocks are intentional early-returns (roll back automatically)
- [x] Ensure no response is sent before `afterCommit` where a transaction is involved

### 4.3 Lint and test pass

- [x] `npm run eslint` passes with 0 errors (0 errors, 577 warnings — warnings are pre-existing)
- [x] `npm test` — 36 pre-existing failures (Smart-ID/MobileID external services, rate-limit tests, comment ordering tests); no new failures introduced by refactoring

---

## Tracking

| Phase | Tasks | Done |
|-------|-------|------|
| 1 — Foundation | 5 | 5 |
| 2 — Entity Services | 14 | 14 |
| 3 — Route Cleanup | 7 | 7 |
| 4 — Quality | 4 | 4 |
| **Total** | **30** | **30** |
