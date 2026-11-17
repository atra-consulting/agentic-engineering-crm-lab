# CRM Backend Specification

For signatures, the API contract (`openapi/`) wins.

Node.js/TypeScript backend. Express 4.21 on port 7070. SQLite file database via Drizzle ORM + `@libsql/client`. Session-based authentication.

## Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.19+ |
| Language | TypeScript | 5.8 |
| Framework | Express | 4.21 |
| ORM | Drizzle ORM | 0.45 |
| Database driver | @libsql/client (async, promise-based) | 0.17.3 |
| Validation | Ajv 2020 (contract schemas; one factory, `unicode: false`, custom `email`/`uri` formats, no `ajv-formats`) | — |
| Auth | express-session + bcryptjs | 1.18 / 2.4 |
| Session store | LibsqlSessionStore (custom, persists to `sessions` table) | — |
| Dev runner | tsx --watch | 4.19 |

Ajv factory: `backend/src/openapi/ajv.ts`. The custom `email` and `uri` formats reproduce the verdicts of the former Zod 4 checks.

Database file: `backend/data/crmdb.sqlite`. Created on first startup. When `TURSO_DATABASE_URL` is set the remote Turso URL is used instead.

## Startup Sequence

Startup runs: `runMigrations()` → `runDataMigration()` → `app.listen(7070)`. Full detail: see [SPECS-infrastructure.md](SPECS-infrastructure.md).

## Entities

Table definitions and column specs: see [SPECS-database.md](SPECS-database.md).

Computed DTO fields (not stored in DB):

- **Firma** DTO adds `personenCount`, `abteilungenCount` (subquery counts).

## API Endpoints

The contract in `openapi/` lists every route: method, path, params, bodies, answers, errors, guards. This file does not repeat them.

Base URL: `http://localhost:7070/api`

| Area | Contract file | Covers |
|------|---------------|--------|
| Auth | [`openapi/paths/auth.yaml`](../../openapi/paths/auth.yaml) | Login, logout, current user, test-login (development/test only) |
| Health | [`openapi/paths/health.yaml`](../../openapi/paths/health.yaml) | Public health check |
| Firmen | [`openapi/paths/firmen.yaml`](../../openapi/paths/firmen.yaml) | CRUD, plus Personen and Abteilungen per Firma |
| Personen | [`openapi/paths/personen.yaml`](../../openapi/paths/personen.yaml) | CRUD, `abteilungId` filter |
| Abteilungen | [`openapi/paths/abteilungen.yaml`](../../openapi/paths/abteilungen.yaml) | CRUD, per-Firma list, Personen per Abteilung |
| Adressen | [`openapi/paths/adressen.yaml`](../../openapi/paths/adressen.yaml) | CRUD, `search` on city |
| Aktivitaeten | [`openapi/paths/aktivitaeten.yaml`](../../openapi/paths/aktivitaeten.yaml) | CRUD |
| Chancen | [`openapi/paths/chancen.yaml`](../../openapi/paths/chancen.yaml) | CRUD, `search` and `phase` filter |
| Dashboard | [`openapi/paths/dashboard.yaml`](../../openapi/paths/dashboard.yaml) | Dashboard numbers |
| Szenarien | [`openapi/paths/szenarien.yaml`](../../openapi/paths/szenarien.yaml) | Saved Produktivität-Rechner scenarios. Array lengths live in the contract |
| Agent tasks | [`openapi/paths/agent-tasks.yaml`](../../openapi/paths/agent-tasks.yaml) | Agent work queue. Lifecycle `OPEN → IN_PROGRESS → DONE \| REJECTED` |
| Tickets | [`openapi/paths/tickets.yaml`](../../openapi/paths/tickets.yaml) | Kanban board. Status `DEFINITION → TODO → IN_PROGRESS → ON_HOLD → DONE` |
| Cron | [`openapi/paths/cron.yaml`](../../openapi/paths/cron.yaml) | Cron triggers and run history |

Standard CRUD resources (Firmen, Personen, Abteilungen, Adressen, Aktivitaeten, Chancen) share one shape: paginated list, `/all`, single read, create (201), update, delete (204). Unknown id → 404. Details per area: the files above.

More background:

- Ticket board mechanics: [SPEC-API-TICKETS.md](SPEC-API-TICKETS.md).
- Agent task lifecycle: [SPEC-API-TASKS.md](SPEC-API-TASKS.md).
- `AgentTaskDTO.ticketId` is derived. Never stored. The newest ticket that points back at the task. The list query pages first, then computes `ticketId` for the page rows only.

### Access rules

| Who | Routes |
|-----|--------|
| Public | `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/test-login` (development/test only) |
| Any logged-in user | CRM entities, Dashboard, Szenarien, `GET /api/auth/me`, `GET /api/tickets/summary` |
| Agent token or any logged-in user | `GET /api/tickets/board`, `GET /api/tickets/:id` |
| Agent token or admin session | `GET /api/agent-tasks/:id`, ticket create, status, owner, start, done, ask, comments |
| Agent token only | `GET /api/agent-tasks/next`, `GET /api/tickets/next`, agent-task start/reject/done, `POST /api/cron/runs/:id/complete` |
| Admin only | Agent-task list, summary and reset; ticket list, reset, wont-do, hand-to-ai; cron runs and jobs |
| Cron secret or admin session | `GET /api/cron/agent-tasks`, `GET /api/cron/github-issues` |

Unauthenticated requests get `401`. Wrong role gets `403`. The contract names the exact guard per operation.

## Pagination

All paginated endpoints use the Spring Data Page response format for frontend compatibility.

Response shape:
```json
{
  "content": [...],
  "totalElements": 42,
  "totalPages": 5,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

`number` is 0-indexed. `size` defaults to 10, max 200.

Sort query param format: `sort=field,asc` or `sort=field,desc`.

Sort fields are validated against a per-entity whitelist in `src/utils/pagination.ts`. Invalid field names return `400`. Defaults and allowed fields per area: see the contract.

## Security

### Runtime modes

`NODE_ENV` picks the mode. Allow-list: only the exact values `development` and `test` count. Anything else is production. That includes unset, empty, `Development`, and `staging`.

| Feature | development | test | production |
|---------|-------------|------|------------|
| `POST /api/auth/test-login` | yes | yes | no |
| `/api/docs` + `/api/openapi.json` | yes | yes | no |
| Response check against the contract | Logs. Adds `X-Contract-Violation` header | Rewrites the answer to 500 `Antwort verletzt API-Vertrag …` | off |
| `CONTRACT_RESPONSE_CHECK=off` | ignored | switches check off (benchmarks only) | ignored |

`createApp(mode)` in `src/app.ts` takes the mode. Default: read from `NODE_ENV`. Start scripts set `development`.

### Session auth

- `express-session` with `LibsqlSessionStore` — a custom `express-session` Store subclass that persists sessions to the `sessions` table in the same libsql/Turso database. Expired rows are swept lazily on first request per process lifetime.
- Cookie name: `JSESSIONID`. HttpOnly. SameSite: lax. MaxAge: 24 hours. `secure: true` in production.
- Session secret from env var `SESSION_SECRET`. Falls back to `crm-dev-secret-key` in development (prints a warning in production).
- Login: `bcryptjs.compareSync()` compares submitted password to stored hash.
- Session fixation protection: `req.session.regenerate()` on successful login.
- Logout: `req.session.destroy()` + clear cookie.
- `app.set('trust proxy', 1)` is set so that `cookie.secure` works correctly behind a reverse proxy.

### Users

Hardcoded in `src/config/users.ts`. No database table. No user management API.

| Username | Password | Roles | Permissions |
|----------|----------|-------|-------------|
| admin | admin123 | ADMIN | All |
| user | test123 | USER | All |
| demo | demo1234 | ADMIN | All |

Passwords stored as bcrypt hashes (cost factor 10). Generated once at build time.

All 3 users currently hold all 7 permissions: `FIRMEN`, `PERSONEN`, `ABTEILUNGEN`, `ADRESSEN`, `AKTIVITAETEN`, `CHANCEN`, `BENUTZERVERWALTUNG`.

`CrmUser` interface fields: `id`, `benutzername`, `vorname`, `nachname`, `passwordHash`, `roles[]`, `permissions[]`.

### Auth middleware

`requireAuth` (in `src/middleware/auth.ts`):

1. Reads `req.session.userId`.
2. Looks up user in the hardcoded list via `findById()`.
3. Sets `req.currentUser` on the request.
4. If the session references a user that no longer exists, calls `req.session.destroy()` then calls `next(new UnauthorizedError())`.
5. Calls `next(new UnauthorizedError())` if the session is missing.

`requireRole(...roles)` (in `src/middleware/auth.ts`): checks that `req.currentUser` exists and that at least one of the user's roles matches. Returns 403 otherwise.

`auth.ts` exports only these two functions. There is no `requirePermission` function.

### Agent token auth

`requireAgentToken` (in `src/middleware/agentAuth.ts`):

- Reads the token from `Authorization: Bearer <token>` first, then falls back to the `X-Agent-Token` header.
- Compares SHA-256 hashes of the incoming and configured (`AGENT_API_TOKEN` env var) tokens using `timingSafeEqual` to prevent timing attacks.
- Returns 401 if the env var is not set, the header is absent, or the token does not match.
- **Loopback bypass (dev only).** When env var `AGENT_AUTH_ALLOW_LOOPBACK=1`, a request from `127.0.0.1` / `::1` / `::ffff:127.0.0.1` with **no** auth header and **no** proxy-forwarding header (`X-Forwarded-For`, `X-Real-IP`, `Forwarded`) skips the token check. Never set this in production. The forwarding-header refusal stops a same-host reverse proxy (which appears as `127.0.0.1` on the socket) from opening the bypass.

Two more guards share one implementation in `src/middleware/agentAuth.ts`. Both check in this order. First match wins:

1. Loopback bypass — same gating as above (also requires `AGENT_API_TOKEN` set).
2. Agent token — if a token header is present, it must match. A wrong token gets 401. It never falls through to the session.
3. Session — see the table.

| Guard | Session step | Used on |
|-------|--------------|---------|
| `requireAgentTokenOrAdminSession` | Session must resolve to a user with role `ADMIN`, else 403 | `GET /api/agent-tasks/:id`. Ticket write endpoints: create, status, owner, start, done, ask, comments |
| `requireAgentTokenOrSession` | Any logged-in user passes | `GET /api/tickets/board`, `GET /api/tickets/:id`. Non-admin workshop participants follow the board |

No session and no token: 401.

`GET /api/tickets/summary` is different. It uses `requireAuth` only. It takes no agent token and needs no admin role.

### Cron auth

`requireCronAuth` (defined inline in `routes/cron.ts`) accepts either a `CRON_SECRET` bearer token (external cron) or a valid admin session. It sets `req.cronTrigger` to `'CRON'` or `'MANUAL'`. If the bearer token does not match the secret, the request falls through to the admin-session check.

### CORS

Configured in `src/middleware/cors.ts`. Allowed origins from env var `CORS_ORIGINS`. Default: `http://localhost:7200`. Credentials allowed. Methods: GET, POST, PUT, DELETE, OPTIONS.

## Architecture

Table definitions and column specs: see [SPECS-database.md](SPECS-database.md).

```
src/
  index.ts          — entry point: migrate → seed → listen
  app.ts            — createApp(mode): Express wiring (middleware order, route mounting)
  config/
    db.ts           — @libsql/client setup; exports `client` and `db` (Drizzle)
    migrate.ts      — CREATE TABLE IF NOT EXISTS + PRAGMA foreign_keys = ON
    users.ts        — hardcoded user list
    cronJobs.ts     — static list of configured cron job names
  db/schema/
    schema.ts       — Drizzle table definitions
    enums.ts        — TypeScript enum arrays and types
  openapi/
    ajv.ts          — single Ajv 2020 factory
    contract.ts     — loads the contract, finds operations
    specValidate.ts — request validation middleware
    errorMapper.ts  — Ajv errors → fieldErrors, default German texts
    responseCheck.ts — response check (development/test)
    runtimeMode.ts  — NODE_ENV → development | test | production
    types.ts        — RequestBody, JsonResponse, Schema helper types
  generated/        — types generated from the contract
  middleware/
    auth.ts               — requireAuth, requireRole
    agentAuth.ts          — requireAgentToken, requireAgentTokenOrAdminSession, requireAgentTokenOrSession (+ AGENT_AUTH_ALLOW_LOOPBACK bypass)
    cors.ts               — CORS config
    errorHandler.ts       — global error handler (last middleware)
    libsqlSessionStore.ts — custom express-session Store backed by `sessions` table
    session.ts            — express-session config (uses LibsqlSessionStore)
  routes/           — one file per entity (Express Router)
  services/         — one file per entity (async functions, raw SQL via @libsql/client)
  utils/
    asyncHandler.ts  — wraps async route handlers; forwards rejected Promises to next()
    errors.ts        — typed error classes
    pagination.ts    — parsePaginationParams, parseSort, buildPage
  seed/
    dataMigration.ts  — loads fixture.json into the DB when empty (CRM entities only)
    fixture.json      — fixed seed data (25 Firmen, 50 Abteilungen, 100 Personen, 100 Adressen, 75 Aktivitaeten, 40 Chancen)
    agentTaskSeed.ts  — idempotent agent_task seeding (INSERT OR IGNORE, ids 1–16); called at end of runMigrations()
    build-fixture.ts  — dev tool to regenerate fixture.json after schema changes (not called at runtime)
```

Middleware order in `createApp`: CORS → JSON body parser (100 KB limit) → session → response check (development/test) → routes → unknown `/api` 404 → error handler.

Mounted routers: `/api/auth`, `/api/firmen`, `/api/personen`, `/api/abteilungen`, `/api/adressen`, `/api/aktivitaeten`, `/api/chancen`, `/api/dashboard`, `/api/agent-tasks`, `/api/cron`, `/api/tickets`, `/api/szenarien`. Plus `/api/health` (inline, public).

## Exception Handling

Global error handler in `src/middleware/errorHandler.ts`. Must be the last `app.use()` call.

| Error Class | HTTP Status |
|-------------|------------|
| ValidationError | 400 |
| UnauthorizedError | 401 |
| ForbiddenError | 403 |
| NotFoundError | 404 |
| ConflictError | 409 |
| Unexpected Error | 500 |

All error responses use this shape:
```json
{
  "status": 404,
  "message": "Firma mit ID 99 nicht gefunden",
  "timestamp": "2026-04-15T10:30:00.123",
  "fieldErrors": {}
}
```

`ValidationError` populates `fieldErrors` as `{ "fieldName": "error message" }`. All other errors return an empty `fieldErrors` object.

Timestamp is millisecond-precision ISO-8601 with no timezone suffix (no trailing `Z`).

### Edge-case answers

| Case | Answer |
|------|--------|
| Path id is not a positive integer (`^[1-9][0-9]*$`) | 400 `Validierungsfehler`, `fieldErrors.id` = `Ungültige ID` |
| `phase` filter on Chancen is not a valid phase | 400 in the standard shape, `fieldErrors.phase` |
| Malformed JSON body | 400 `Validierungsfehler`, `fieldErrors` = `{ "_": "Ungültige Anfrage" }` |
| Body larger than 100 KB | 413 `Anfrage zu groß` |
| Unknown `/api` path or method | 404 `Ressource nicht gefunden` (JSON, no 405) |

Production has no `test-login` route. It falls through to the unknown-path 404.

All validation texts are German. They replace the former English Zod defaults.

## Code Pattern

Each entity follows this pattern:

```
Contract (openapi/paths/<area>.yaml + schemas)  — source of truth
Drizzle schema (schema.ts)
  → Service (services/<entity>Service.ts)  — async functions, raw SQL via @libsql/client
  → Route handler (routes/<entity>.ts)     — Express Router: guard(s) → specValidate → asyncHandler
```

Types come from the contract, not from hand-written schemas:

| Helper (`src/openapi/types.ts`) | Use |
|---------------------------------|-----|
| `RequestBody<'opId'>` | Type of a request body |
| `Schema<'X'>` | DTO alias for a contract schema |
| `JsonResponse<'opId', 200>` | Type of an inline answer |

### Service pattern

Services are plain exported objects (not classes). They call `await client.execute({ sql, args })` directly. All service methods are `async` and return Promises.

```typescript
export const firmaService = {
  async findAll(search, page, size, sort): Promise<PageResult<FirmaDTO>> { ... },
  async listAll(): Promise<FirmaDTO[]> { ... },
  async findById(id): Promise<FirmaDTO> { ... },   // throws NotFoundError if missing
  async create(dto): Promise<FirmaDTO> { ... },
  async update(id, dto): Promise<FirmaDTO> { ... }, // calls findById first to get 404 on missing
  async delete(id): Promise<void> { ... },          // calls findById first to get 404 on missing
};
```

`FirmaDTO` and friends are aliases: `type FirmaDTO = Schema<'Firma'>`.

`create()` and `update()` set `updatedAt` to `new Date().toISOString()`.

`findById()` throws `NotFoundError` when the row does not exist. Routes do not check for null.

### Route pattern

Order in every route: guard(s) → `specValidate` → `asyncHandler`.

`asyncHandler` (`src/utils/asyncHandler.ts`) forwards any rejected Promise (including thrown errors) to Express's `next()` error chain so the global error handler can format the response. Manual try/catch blocks are not used.

```typescript
router.get(
  '/:id',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params['id']);
    res.json(await firmaService.findById(id));
  }),
);
```

`specValidate` comes after the guards. Unauthenticated callers never see validation errors.

### Validation pattern

`specValidate` (`src/openapi/specValidate.ts`) validates against the contract:

- Path params must match `^[1-9][0-9]*$`. Else 400 `id` `Ungültige ID`.
- Request body must match the operation's schema.
- Unknown body fields get stripped. The handler sees the cleaned body in `req.body`.
- Failures go to the error handler as `ValidationError` with `fieldErrors`.

```typescript
router.post(
  '/',
  requireAuth,
  specValidate,
  asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as RequestBody<'createFirma'>;
    res.status(201).json(await firmaService.create(dto));
  }),
);
```

Error mapping:

- `src/openapi/errorMapper.ts` turns Ajv errors into `fieldErrors`.
- German texts come from `x-error-messages` in the contract. Key = Ajv keyword (`required`, `minLength`, `enum` …).
- Without an entry, `errorMapper.ts` supplies a German default.

Contract values drive limits. Example: the four Szenario process arrays use `minItems`/`maxItems` in the contract. `PROCESS_STEP_COUNTS` no longer exists.

Golden test: `backend/src/test/golden-errors.spec.ts` compares 404 recorded answers of the former Zod validation with today's answers. Intended changes (D1 to D6 below) show up as explicit differences.

Enum values (canonical: contract and [SPECS-database.md](SPECS-database.md)):

<!-- mirror: keep in sync with SPECS-database.md (canonical) -->

| Enum | Values |
|------|--------|
| ChancePhase | NEU, QUALIFIZIERT, ANGEBOT, VERHANDLUNG, GEWONNEN, VERLOREN |
| AktivitaetTyp | ANRUF, EMAIL, MEETING, NOTIZ, AUFGABE |

### Behavior changes from the contract move

| ID | Change |
|----|--------|
| D1 | Invalid Chancen `phase` filter: standard error shape, `fieldErrors.phase` |
| D2 | Bad path ids: 400 `id` `Ungültige ID` |
| D3 | Unknown `/api` paths: JSON 404 `Ressource nicht gefunden`. Production `test-login` stub removed |
| D4 | Malformed JSON: 400 `{ _: 'Ungültige Anfrage' }`. Body over 100 KB: 413 `Anfrage zu groß` |
| D5 | Start scripts set `NODE_ENV=development` |
| D6 | German texts replace former English Zod defaults |

### SQLite / libsql notes

- `PRAGMA foreign_keys = ON` is executed once at startup in `migrate.ts` via `await client.execute('PRAGMA foreign_keys = ON')` as a standalone statement before any DDL. It is **not** set in `db.ts`.
- `@libsql/client` is fully async — every call to `client.execute()` returns a Promise and must be awaited. There is no synchronous API.
- No native `BOOLEAN` — use `INTEGER` (0/1) and convert in the service layer.
- No native `DATE`/`TIMESTAMP` — use `TEXT` with ISO-8601 strings.

### Adding a new entity

Backend changes:

1. Add the paths and schemas to the contract (`openapi/paths/<area>.yaml`). Add `x-error-messages` for field texts. Regenerate the types.
2. Add Drizzle table definition to `src/db/schema/schema.ts`.
3. Add `CREATE TABLE IF NOT EXISTS` to `src/config/migrate.ts`.
4. Add service. DTOs are aliases: `Schema<'X'>`.
5. Add route file: guard(s) → `specValidate` → `asyncHandler`. Type bodies `RequestBody<'opId'>`. Mount the router in `src/app.ts`.
6. Run the tests. In development and test, the response check fails on any answer that breaks the contract.
