# Implementation Plan: OPENAPI-SPEC-SSOT

## Summary

### Business Summary
This plan splits the approved API contract work into small work packages. The team first records how the system behaves today. Then it writes the contract, and the existing automatic tests prove that the contract matches reality. Only after that does the server check input against the contract and the web app take its data shapes from it. Documentation, AI agent instructions, an optional browsable API page and a final security review come last.

### Technical Summary
The work runs in ten phases:
- **0** Baseline and golden capture of today's Zod errors.
- **1** Contract: an opus foundation with the full operationId table and the tooling trial, five parallel area slices, then integration plus the CI drift step.
- **2** Ajv 2020 runtime core, `createApp(mode)`, the response check, and the approved decisions D1–D6.
- **3** Contract tests: routes, access, lists, coverage.
- **4** Switch every route to `specValidate` (it runs after the guards), then remove Zod.
- **5** Generated server types.
- **6** Frontend: aliases and the typed `ApiClient`, in a strict sequence.
- **7** Docs and agent files.
- **8** Swagger UI.
- **9** Security review and verification.

Main risk: the hand-written contract does not match real responses. Mitigation: the response check runs against the unchanged suite first, with a fix loop (groups 17 and 18). Second risk: error texts drift from today's. Mitigation: a golden fixture recorded from Zod before removal, with its own fix loop (groups 29 and 30).

**Rules for every worker**
- Commit only your own paths with `git add <exact paths>`. Never use `-A`, `.` or `-a`. Never push.
- End every commit message with the line `PRD: docs/prds/PRD-OPENAPI-SPEC-SSOT.md`.
- Never stage or modify the user's unrelated uncommitted files: `docs/plans/PLAN-KANBAN-TICKET-SYSTEM.md`, `docs/plans/PLAN-UPDATE-OSM-FIRMENKARTE.md`, `docs/prds/PRD-KANBAN-TICKET-SYSTEM.md`.
- Coding and review agents never run test suites. Runner agents (`*-test-runner`) only run commands and report. They never edit or commit.
- A runner group starts only after every coder group it depends on has committed. `api:check` reads `git status`, so uncommitted work makes it fail.
- Never run two of these at once: the Playwright suite, the bench script, `start.sh`, the smoke run, the drift demos. They share port 7070 and `crmdb.test.sqlite`. Karma may run in parallel with them.
- Report every finding where code and contract or docs disagree in your final message. The orchestrator records each one in PRD Decisions (c).
- Decisions D1–D6 are approved. The orchestrator also fixed two rules:
  - Frontend nullability: forms keep `null`; templates change only where the compiler forces it.
  - In a fix loop, the contract documents the actual code behavior.
- `original_head` = `75de728b623fb679563baa8927a1ca70e3e65d5e`.
- If a contract change after group 37 touches `frontend/src/app/core/api/api-types.ts`, rerun group 44.
- The orchestrator fills the PRD section `## Implementierung` after the PR exists.

**Parallelism overview**

| Phase | Groups | Order |
|---|---|---|
| 0 Baseline | 1–4 | 1 ∥ 2; 3 after 1 and 2; 4 after 3 |
| 1 Contract | 5–11 | 5 after 4; 6 ∥ 7 ∥ 8 ∥ 9 ∥ 10 after 5; 11 after 6–10 |
| 2 Runtime + D1–D5 | 12–18 | 12 after 5; 13 after 12; 14 after 13; 15 any time (no deps); 16 after 11 and 14; 17 after 16; 18 ↔ 17 loop until green |
| 3 Contract tests | 19–20 | 19 after 11 and 14 (∥ 16); 20 after the 17/18 loop is green and 19 |
| 4 Switch | 21–30 | 21 after 12; 22–26 in parallel after 20 and 21; 27 after 22–26; 28 after 4, 13, 21 (∥ 22–27); 29 after 27 and 28; 30 ↔ 29 loop until green |
| 5 Server types | 31–34 | 31 ∥ 32 ∥ 33 after 30; 34 after 31–33 |
| 6 Web app | 35–44 | 35 after 11; 36 after 20; then strictly in sequence: 37 → 38 → 39 → 40 → 41 → 42 → 43 → 44. Runs in parallel with phases 4–5. |
| 7 Docs + agents | 45–49 | all in parallel after 34 and 44 |
| 8 Docs page (Should) | 50–52 | 50 after 34; 51 after 50; 52 after 45, 46 and 50 |
| 9 Final | 53–57 | 53 after everything else; 54 ∥ 55 after 53; 56 after 54 and 55; 57 after 56 |

**Phase reviews**

| Groups | Reviewer | Model | Why |
|---|---|---|---|
| Contract: 5–11, 18 | be-reviewer | sonnet | One tier below opus. Contract accuracy against the code. |
| Runtime + D-changes: 12–14 | be-reviewer | sonnet | Security floor: stripping, gating, error shapes. |
| Start scripts: 15 | shell-reviewer | haiku | Two small edits. |
| Backend tests: 16, 19, 28, 51 | be-test-reviewer | sonnet | Security floor: access and mode tests. |
| Switch + fix loop: 21–27, 30 | be-reviewer | sonnet | Security floor: input validation on every route. |
| Server types: 31–33 | be-reviewer | haiku | Type-only refactor. |
| ApiClient: 35 | fe-reviewer | sonnet | Type-level code that every service depends on. |
| Web app: 37, 39, 41, 42 | fe-reviewer | haiku | One tier below sonnet. |
| Frontend tests: 36, 38, 40, 43 | fe-test-reviewer | haiku | One tier below sonnet. |
| Docs: 45–48, 52 | ba-reviewer | haiku | One tier below sonnet. |
| Agents: 49 | skill-reviewer | haiku | One tier below sonnet. |
| Docs page: 50 | be-reviewer | sonnet | Security floor: exposure gating. |
| Final security sign-off | group 53 | opus | Security-relevant sign-off for R11, R14 and R18. |

## Test Command
`cd backend && npm run api:check && npx tsc --noEmit && npx playwright test` and `cd frontend && npm run test:ci && npx ng build`. Leave out `npm run api:check` until group 11 lands.

## Tasks

### 1. Baseline benchmark script
**Agent:** be-coder
**Model:** sonnet — small Node script with a clear spec
**Depends on:** none   **Parallel with:** 2

- [ ] Create `backend/scripts/bench-api.mjs`: plain Node ESM, no new dependencies. Do not edit `backend/package.json`.
- [ ] Setup:
  - Delete `backend/data/crmdb.test.sqlite` and its `-journal`, `-wal` and `-shm` files.
  - Spawn `backend/node_modules/.bin/tsx src/index.ts` with cwd `backend` and env `NODE_ENV=test`, `PORT=7071`, `AGENT_API_TOKEN=bench-token`.
  - Flag `--response-check=off` adds `CONTRACT_RESPONSE_CHECK=off` to the child env. The default is on. Today the flag has no effect.
  - Never set `CONTRACT_COVERAGE_FILE`.
- [ ] Measure startup in ms, from spawn until the first `200` on `GET /api/health`.
- [ ] Log in with `POST /api/auth/login` (`admin`/`admin123`) and keep the `JSESSIONID` cookie by hand.
- [ ] Send 50 warm-up requests. Then send 300 sequential requests for each scenario:
  - `GET /api/firmen/1`
  - `GET /api/firmen?page=0&size=20`
  - `POST /api/firmen` with a valid body and a unique name per request
  - `POST /api/firmen` with `{}`; expect 400
  - `PUT /api/szenarien/1`: read it once with GET, then send back only `name` and the four `*Steps` fields
- [ ] Print one JSON object: `startupMs` plus median and p95 in ms for each scenario. Kill the child process. Exit non-zero on any unexpected status.
- [ ] Acceptance: `cd backend && node scripts/bench-api.mjs` prints the JSON, leaves no process on port 7071, and never touches `crmdb.sqlite`.
- [ ] Commit `backend/scripts/bench-api.mjs`.

### 2. Test Implementation — golden and format-parity recorder
**Agent:** be-test-coder
**Model:** sonnet — corpus design from a spelled-out rule set
**Depends on:** none   **Parallel with:** 1

- [ ] Create `backend/src/test/fixtures/golden-corpus.ts`. It exports cases shaped `{ id, method, path, auth: 'admin'|'agent'|'none', body?, rawBody?, query?, expectGerman? }`.
- [ ] Cover every body validated today:
  - POST and PUT on `/api/firmen`, `/api/personen`, `/api/abteilungen`, `/api/adressen`, `/api/aktivitaeten`, `/api/chancen`, `/api/szenarien`
  - `POST /api/tickets`; `PATCH /api/tickets/1/status`; `PATCH /api/tickets/1/owner`; `POST /api/tickets/1/ask`; `POST /api/tickets/1/done`; `POST /api/tickets/1/wont-do`; `POST /api/tickets/1/comments`
  - `POST /api/agent-tasks/1/reject`; `POST /api/agent-tasks/1/done`
  - `POST /api/cron/runs/1/complete`
- [ ] Cases per body:
  - each required field missing
  - each required string empty
  - each field with a wrong type: number for string, string for number, string for boolean
  - each max-length string one character too long
  - an invalid email
  - an invalid enum value
  - latitude 9999 and longitude -9999
  - wahrscheinlichkeit 101 and 1.5
  - Szenario: works with 18 items, waits with 17, an item of -1, 479521, 1.5 and `"x"`, and one process missing
  - body `[]`
- [ ] Query cases:
  - `GET /api/agent-tasks/next` with `source` missing, and with `source=BOGUS`
  - `GET /api/agent-tasks?status=BOGUS`
  - `GET /api/tickets?type=X`, `?status=X`, `?owner=X`
  - `GET /api/tickets/next?type=X`
  - `GET /api/firmen?sort=bogus,asc`
- [ ] Every case must be invalid, so nothing changes state.
- [ ] Set `expectGerman` (field → text, or `_`) wherever Zod answers in English today. The approved D6 rules:
  - A field missing or wrongly typed, where a German text exists → that text:
    - name "Name ist erforderlich"; firstName "Vorname ist erforderlich"; lastName "Nachname ist erforderlich"
    - firmaId "Firma ist erforderlich"; subject "Betreff ist erforderlich"; datum "Datum ist erforderlich"
    - titel and ticket title "Titel ist erforderlich"; ticket body "Beschreibung ist erforderlich"
    - question "Frage ist erforderlich"; comment body "Kommentar-Text ist erforderlich"
    - email "Ungültige E-Mail-Adresse", also for invalid email strings
  - Too long → "Maximal {limit} Zeichen".
  - latitude, longitude or wahrscheinlichkeit out of range → "Muss zwischen {min} und {max} liegen".
  - A number that is not whole, with no German text today → "Muss eine ganze Zahl sein".
  - Negative tasksSolved or tasksRejected → "Darf nicht negativ sein".
  - abteilungId, personId, kontaktPersonId or agentTaskId with a wrong type, not whole, or ≤ 0 → "Ungültige ID".
  - handBackToAi, clearFullyReady or fullyReady with a wrong type → "Muss true oder false sein".
  - Agent-task reject `comment` missing or empty → "Kommentar ist erforderlich".
  - Cron `status` invalid or missing → "Ungültiger Status"; `githubRunUrl` invalid or missing → "Ungültige URL".
  - Any other English default → "Ungültiger Wert".
  - Body `[]` → `_`: "Ungültige Anfrage".
- [ ] Create `backend/src/test/fixtures/format-corpus.ts`.
  - About 30 email strings: valid ones, `a@b`, `a@b.c`, a quoted local part, `ä@x.de`, `a@[127.0.0.1]`, `a..b@x.de`, leading and trailing spaces, a 70-character local part.
  - About 20 URL strings: a GitHub Actions run URL, `http://x`, `ftp://x`, `mailto:a@b`, `github.com/x`, `https://`, `https://ex ample.com`, `/x`, `javascript:alert(1)`.
- [ ] Create `backend/src/test/golden-record.spec.ts`. It is skipped unless `GOLDEN_RECORD=1`.
  - Admin requests use `loginCtx('admin','admin123')` from `helpers.ts`. Agent requests send `Authorization: Bearer <TEST_AGENT_TOKEN>` from `globalSetup.ts`.
  - It writes `backend/src/test/fixtures/golden-errors.json` as `{ id: { status, message, fieldErrors } }`: sorted keys, 2-space indent, no timestamp.
  - In the same process it records Zod verdicts for the format corpus to `backend/src/test/fixtures/format-parity.json`. It loads `z.string().email()` and `z.string().url()` through `await import('zod')`.
  - It fails if any case returns 2xx.
- [ ] Acceptance: a normal `npx playwright test` skips the recorder, and `npx tsc --noEmit` passes.
- [ ] Commit the three new `.ts` files.

### 3. Baseline measurement run
**Agent:** be-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 1, 2   **Parallel with:** none

- [ ] Start only after groups 1 and 2 have committed.
- [ ] Run `cd backend && node scripts/bench-api.mjs` three times. Report the median of the three medians per scenario and `startupMs`.
- [ ] Run `cd backend && time npx playwright test`. Report the wall time and the pass count. If the suite is red, stop and report: the baseline is invalid.
- [ ] Run these commands one after another, never in parallel. Do not edit or commit anything.

### 4. Record golden fixtures
**Agent:** be-test-coder
**Model:** haiku — runs one recorder spec, checks output, commits two files
**Depends on:** 3   **Parallel with:** none

- [ ] Run `cd backend && GOLDEN_RECORD=1 npx playwright test golden-record`. No other Playwright run may be active.
- [ ] Check that `backend/src/test/fixtures/golden-errors.json` and `backend/src/test/fixtures/format-parity.json` exist, are not empty, and hold one entry per corpus case.
- [ ] Commit only those two files.

### 5. Contract foundation and tooling trial
**Agent:** be-coder
**Model:** opus — architecture-sensitive: sets layout, refs, naming and the Ajv setup for every other slice; tooling compatibility with 3.1 is unproven
**Depends on:** 4   **Parallel with:** none

- [ ] Install in `backend/`:
  - devDependencies `@redocly/cli` and `openapi-typescript@^7`
  - dependencies `ajv@^8` and `ajv-formats@^3`
- [ ] Create `openapi/openapi.yaml`:
  - `openapi: 3.1.0`, `servers: [{ url: /api }]`, one tag per area.
  - Security schemes:
    - `sessionCookie`: apiKey, in cookie, name `JSESSIONID`
    - `agentBearer`: http bearer
    - `agentHeader`: apiKey, in header, name `X-Agent-Token`
    - `cronBearer`: http bearer (`CRON_SECRET`)
- [ ] Add the full `paths` index: every path from the table below, each a `$ref` to `paths/<area>.yaml#/<JSON-pointer-escaped path>`.
- [ ] Add the full `components.schemas` index, each name a `$ref` into its area schema file:
  - common: ErrorResponse, PageMeta, EmptyObject
  - health: Health
  - auth: LoginRequest, LoginResponse, BenutzerInfo, TestLoginRequest, Rolle, Permission
  - firmen: Firma, FirmaInput, FirmaAdresse, FirmaPage
  - personen: Person, PersonInput, PersonPage
  - abteilungen: Abteilung, AbteilungInput, AbteilungPage
  - adressen: Adresse, AdresseInput, AdressePage
  - aktivitaeten: Aktivitaet, AktivitaetInput, AktivitaetPage, AktivitaetTyp
  - chancen: Chance, ChanceInput, ChancePage, ChancePhase
  - dashboard: DashboardData, RecentChance, RecentAktivitaet
  - szenarien: Szenario, SzenarioInput, ProzessDauer
  - agent-tasks: AgentTask, AgentTaskPage, AgentTaskSummary, AgentTaskSource, AgentTaskStatus, AgentTaskRejectInput, AgentTaskDoneInput, AgentTaskResetResult
  - cron: CronRun, CronRunPage, CronJob, CronJobLastRun, CronRunStatus, CronTrigger, CronRunCompleteInput
  - tickets: TicketDetail, TicketListItem, TicketListItemPage, TicketBoard, TicketSummary, TicketComment, TicketCreateInput, TicketStatusInput, TicketOwnerInput, TicketAskInput, TicketDoneInput, TicketWontDoInput, TicketCommentInput, TicketResetResult, TicketOwner, TicketType, TicketStatus, TicketSolution, TicketCommentAuthor
- [ ] **OperationId table.** These 79 ids are binding. Copy the table into `openapi/README.md`.

| Area | METHOD path → operationId |
|---|---|
| health | GET /health → getHealth |
| auth | POST /auth/login → login; POST /auth/logout → logout; GET /auth/me → getCurrentUser; POST /auth/test-login → testLogin |
| firmen | GET /firmen → listFirmen; GET /firmen/all → listAllFirmen; GET /firmen/{id} → getFirma; POST /firmen → createFirma; PUT /firmen/{id} → updateFirma; DELETE /firmen/{id} → deleteFirma; GET /firmen/{id}/personen → listFirmaPersonen; GET /firmen/{id}/abteilungen → listFirmaAbteilungen |
| personen | GET /personen → listPersonen; GET /personen/all → listAllPersonen; GET /personen/{id} → getPerson; POST /personen → createPerson; PUT /personen/{id} → updatePerson; DELETE /personen/{id} → deletePerson |
| abteilungen | GET /abteilungen → listAbteilungen; GET /abteilungen/all → listAllAbteilungen; GET /abteilungen/firma/{firmaId} → listAbteilungenByFirma; GET /abteilungen/{id} → getAbteilung; POST /abteilungen → createAbteilung; PUT /abteilungen/{id} → updateAbteilung; DELETE /abteilungen/{id} → deleteAbteilung; GET /abteilungen/{id}/personen → listAbteilungPersonen |
| adressen | GET /adressen → listAdressen; GET /adressen/all → listAllAdressen; GET /adressen/{id} → getAdresse; POST /adressen → createAdresse; PUT /adressen/{id} → updateAdresse; DELETE /adressen/{id} → deleteAdresse |
| aktivitaeten | GET /aktivitaeten → listAktivitaeten; GET /aktivitaeten/all → listAllAktivitaeten; GET /aktivitaeten/{id} → getAktivitaet; POST /aktivitaeten → createAktivitaet; PUT /aktivitaeten/{id} → updateAktivitaet; DELETE /aktivitaeten/{id} → deleteAktivitaet |
| chancen | GET /chancen → listChancen; GET /chancen/all → listAllChancen; GET /chancen/{id} → getChance; POST /chancen → createChance; PUT /chancen/{id} → updateChance; DELETE /chancen/{id} → deleteChance |
| dashboard | GET /dashboard → getDashboard |
| szenarien | GET /szenarien → listSzenarien; GET /szenarien/{id} → getSzenario; POST /szenarien → createSzenario; PUT /szenarien/{id} → updateSzenario; DELETE /szenarien/{id} → deleteSzenario |
| agent-tasks | GET /agent-tasks/next → claimNextAgentTask; GET /agent-tasks/summary → getAgentTaskSummary; POST /agent-tasks/reset → resetAgentTasks; POST /agent-tasks/{id}/start → startAgentTask; POST /agent-tasks/{id}/reject → rejectAgentTask; POST /agent-tasks/{id}/done → completeAgentTask; GET /agent-tasks/{id} → getAgentTask; GET /agent-tasks → listAgentTasks |
| tickets | GET /tickets/next → claimNextTicket; GET /tickets/board → getTicketBoard; GET /tickets/summary → getTicketSummary; POST /tickets/reset → resetTickets; GET /tickets → listTickets; POST /tickets → createTicket; GET /tickets/{id} → getTicket; PATCH /tickets/{id}/status → setTicketStatus; PATCH /tickets/{id}/owner → setTicketOwner; POST /tickets/{id}/start → startTicket; POST /tickets/{id}/done → completeTicket; POST /tickets/{id}/ask → askTicketQuestion; POST /tickets/{id}/wont-do → markTicketWontDo; POST /tickets/{id}/hand-to-ai → handTicketToAi; POST /tickets/{id}/comments → addTicketComment |
| cron | GET /cron/agent-tasks → triggerAgentTasksRun; GET /cron/github-issues → triggerGithubIssuesRun; POST /cron/runs/{id}/complete → completeCronRun; GET /cron/runs → listCronRuns; GET /cron/jobs → listCronJobs |

- [ ] Create `openapi/common.yaml`:
  - `ErrorResponse`: `status` integer, `message` string, `timestamp` string without a format, `fieldErrors` an object of strings. All four required. `additionalProperties: false`.
  - `PageMeta`: totalElements, totalPages, size, number, first, last.
  - `EmptyObject`: an object with no declared properties.
  - Parameters:
    - `IdPath` (name `id`) and `FirmaIdPath` (name `firmaId`): `type: string`, `pattern: ^[1-9][0-9]*$`, no coercion, `x-error-messages` "Ungültige ID".
    - `PageQuery`, `SizeQuery`, `SortQuery`, `SearchQuery`: plain declarations. The `SortQuery` description says: "field,direction; direction in any case (asc/ASC/desc/DESC)".
  - Responses: `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, each pointing to `ErrorResponse`.
- [ ] Stub every other area: `openapi/paths/<area>.yaml` with its path keys as empty path items, and `openapi/schemas/<area>.yaml` with its schema names as empty schemas.
- [ ] Fully write the **health** and **firmen** areas as samples:
  - Sources: `backend/src/app.ts`, `backend/src/routes/firmen.ts`, `backend/src/services/firmaService.ts`, `backend/src/utils/validation.ts`.
  - Use `x-sort-fields` and `x-default-sort` on `listFirmen`.
  - FirmaInput carries `x-error-messages`. Its email field: `type: [string, null]` plus `anyOf` (format email | const `''`), with "Ungültige E-Mail-Adresse".
- [ ] Create `openapi/redocly.yaml`:
  - Extends `recommended`.
  - Errors: `operation-operationId`, `operation-summary`, `security-defined`, `operation-4xx-response`.
  - Configurable rules:
    1. an operation with a `sort` query param has a non-empty `x-sort-fields` and an `x-default-sort`
    2. no `allOf` in requestBody schemas
    3. the only allowed formats are `email` and `uri`
    4. non-empty security → declares 401
    5. `x-loopback-bypass` only where security includes `agentBearer`
  - Put any rule that Redocly cannot express as a JS check in `api-check.ts`.
- [ ] Create `openapi/README.md` with:
  - the operationId table and the schema names
  - nullable as type arrays
  - response objects use `additionalProperties: false`; pages use `allOf` with `PageMeta` plus `unevaluatedProperties: false`
  - inputs: no `allOf`, no `additionalProperties: false`
  - `x-error-messages` on the property, keyed by Ajv keyword
  - the vendor keywords `x-sort-fields`, `x-default-sort`, `x-skip-request-validation`, `x-loopback-bypass`, `x-environments`
  - optional bodies: `logout`, `handTicketToAi`, `resetTickets`, `resetAgentTasks`, `startTicket` and `startAgentTask` declare an optional `EmptyObject` body; `completeTicket`, `markTicketWontDo` and `completeAgentTask` declare an optional object with optional `comment`
  - the security mapping:
    - public → `[]`
    - `requireAuth` → `sessionCookie`
    - `requireAuth` + `requireRole('ADMIN')` → `sessionCookie: [ADMIN]`
    - `requireAgentToken` → `agentBearer` or `agentHeader`
    - `requireAgentTokenOrAdminSession` → those two, or `sessionCookie: [ADMIN]`
    - `requireAgentTokenOrSession` → those two, or `sessionCookie`
    - `requireCronAuth` → `cronBearer` or `sessionCookie: [ADMIN]`
  - the workflow: edit the contract, run `npm run api:generate`, implement, run tests
  - contributor rules: when the check fails, regenerate and commit; on merge conflicts in generated files, regenerate and never hand-merge
  - the Ajv setup chosen in the trial (see below)
- [ ] Create `backend/scripts/api-generate.ts` (run with `tsx`). Resolve all paths from `import.meta.url`, never from cwd.
  1. Redocly-bundle `openapi/openapi.yaml`.
  2. Add the top-level key `x-generated: "GENERATED — do not edit. Rebuild: cd backend && npm run api:generate"`.
  3. Write `backend/src/generated/openapi.json` with a 2-space indent and a trailing newline.
  4. Run openapi-typescript on the bundle with default options (no `enum`, `arrayLength` or `rootTypes`).
  5. Prepend the same header as a comment.
  6. Write identical files to `backend/src/generated/api-types.ts` and `frontend/src/app/core/api/api-types.ts`.

  Output must be deterministic.
- [ ] Create `backend/scripts/api-check.ts`:
  1. Redocly lint with `--config` pointing at `openapi/redocly.yaml`.
  2. Run generate.
  3. Run the JS rules.
  4. Compile the whole bundle with the runtime Ajv setup.
  5. Run `git status --porcelain -- backend/src/generated frontend/src/app/core/api/api-types.ts` from the repo root. Any output → print it and exit 1. This catches both changed and untracked files.
- [ ] Trial: prove an Ajv 2020 setup and state it in the README:
  - `ajv/dist/2020`, `strict: false`, `allowUnionTypes: true`, `allErrors: true`, `verbose: true`
  - `ajv-formats` with `email` and `uri` only
  - `addSchema(bundle, 'spec')`, then compile fragments by ref (for example `getSchema('spec#/components/schemas/FirmaInput')`, or compile `{ $ref: 'spec#/paths/…' }`)
- [ ] npm scripts:
  - `backend/package.json`: `api:generate` → `tsx scripts/api-generate.ts`; `api:check` → `tsx scripts/api-check.ts`
  - `frontend/package.json`: `api:generate` → `npm --prefix ../backend run api:generate`
- [ ] New `.gitattributes`: mark the three generated paths `linguist-generated=true`.
- [ ] Acceptance:
  - `npm run api:generate` writes all three files.
  - The TS output has `components['schemas']['Firma']` with `industry: string | null`.
  - The bundle refs say `#/components/schemas/Firma`, with no `Firma-2` duplicates.
  - Ajv compiles the whole bundle.
  - `cd frontend && npx ng build` passes.
  - After commit, `npm run api:check` exits 0. It exits 1 after an edit to a generated file, and after an untracked file appears in `backend/src/generated/`.
  - If 3.1 blocks any tool, stop and report.
- [ ] Commit:
  - `openapi/**`
  - both scripts
  - `backend/package.json`, `backend/package-lock.json`, `frontend/package.json`
  - `.gitattributes`
  - the three generated files

### 6. Contract — Personen, Abteilungen, Adressen
**Agent:** be-coder
**Model:** sonnet — well-specified transcription with templates in place
**Depends on:** 5   **Parallel with:** 7, 8, 9, 10

- [ ] Edit only `openapi/paths/{personen,abteilungen,adressen}.yaml` and `openapi/schemas/{personen,abteilungen,adressen}.yaml`. Never edit `openapi/openapi.yaml` or the generated files, and do not run `api:generate`. Report any missing index entry instead.
- [ ] Sources:
  - `backend/src/routes/{personen,abteilungen,adressen}.ts`
  - `backend/src/services/{personService,abteilungService,adresseService}.ts` (DTOs, `toDTO`, NotFound and Conflict errors)
  - `backend/src/utils/validation.ts`, `backend/src/utils/pagination.ts`
  - `openapi/README.md`, with the firmen files as the template
- [ ] OperationIds, exactly as listed:
  - listPersonen, listAllPersonen, getPerson, createPerson, updatePerson, deletePerson
  - listAbteilungen, listAllAbteilungen, listAbteilungenByFirma, getAbteilung, createAbteilung, updateAbteilung, deleteAbteilung, listAbteilungPersonen
  - listAdressen, listAllAdressen, getAdresse, createAdresse, updateAdresse, deleteAdresse
- [ ] Details:
  - `listPersonen`: `search`, `abteilungId` (lenient), page, size and sort; default `lastName,ASC`.
  - `listAllPersonen`: optional `abteilungId`.
  - `listAbteilungenByFirma`: a plain array, with `FirmaIdPath`.
  - `listAbteilungen`: default `name,ASC`, no search.
  - `listAbteilungPersonen`: answers `PersonPage`, paging only.
  - `listAdressen`: `search` on city; default `city,ASC`.
  - Use `IdPath` for `{id}`.
  - All operations use `sessionCookie` with 401. Add 400 and 404 where the code can return them.
- [ ] Inputs (follow Zod for max lengths and nullability):
  - PersonInput:
    - firstName "Vorname ist erforderlich" and lastName "Nachname ist erforderlich", on `required`, `type` and `minLength`
    - email: `type: [string, null]` plus `anyOf` (format email | const `''`), with "Ungültige E-Mail-Adresse"
    - firmaId: integer, minimum 1, "Firma ist erforderlich" on `required`, `type` and `minimum`
    - abteilungId: integer or null, minimum 1, "Ungültige ID" on `type` and `minimum`
  - AbteilungInput: name "Name ist erforderlich"; firmaId as above.
  - AdresseInput:
    - every field optional
    - firmaId and personId: "Ungültige ID"
    - latitude from -90 to 90, longitude from -180 to 180
    - `typ`: string or null, maxLength 50
- [ ] Response schemas match DTO nullability exactly. `Adresse` has `typ`, `createdAt` and `updatedAt`. `Abteilung` has its timestamps.
- [ ] Acceptance: `cd backend && npx redocly lint --config ../openapi/redocly.yaml ../openapi/openapi.yaml` reports no errors in your files.
- [ ] Commit only your six files.

### 7. Contract — Aktivitäten, Chancen, Dashboard
**Agent:** be-coder
**Model:** sonnet — well-specified transcription
**Depends on:** 5   **Parallel with:** 6, 8, 9, 10

- [ ] Edit only `openapi/paths/{aktivitaeten,chancen,dashboard}.yaml` and `openapi/schemas/{aktivitaeten,chancen,dashboard}.yaml`. Never edit `openapi/openapi.yaml` or the generated files, and do not run `api:generate`. Report any missing index entry.
- [ ] Sources:
  - `backend/src/routes/{aktivitaeten,chancen,dashboard}.ts`
  - `backend/src/services/{aktivitaetService,chanceService,dashboardService}.ts`
  - `validation.ts`, `pagination.ts`, `backend/src/db/schema/enums.ts`
  - `openapi/README.md`
- [ ] OperationIds:
  - listAktivitaeten, listAllAktivitaeten, getAktivitaet, createAktivitaet, updateAktivitaet, deleteAktivitaet
  - listChancen, listAllChancen, getChance, createChance, updateChance, deleteChance
  - getDashboard
- [ ] Details:
  - `listAktivitaeten`: default `datum,DESC`, no search.
  - `listChancen`:
    - `search` is a string; repeated values are tolerated in code
    - `phase` is an enum filter
    - default `createdAt,DESC`
    - 400 as `ErrorResponse`. After D1 the phase error has the standard shape: message `Ungültiger phase-Wert: X. Erlaubt: …` and `fieldErrors.phase`.
  - `getDashboard`: `sessionCookie` (set with `router.use`), answers `DashboardData`.
  - Use `IdPath` for `{id}`.
- [ ] Inputs:
  - AktivitaetInput:
    - `typ`: enum, "Ungültiger Typ" on `required`, `type` and `enum`
    - subject "Betreff ist erforderlich"
    - datum "Datum ist erforderlich": string, minLength 1, no format
    - firmaId and personId: "Ungültige ID"
  - ChanceInput:
    - titel "Titel ist erforderlich"
    - `phase`: optional, "Ungültige Phase" on `type` and `enum`
    - `currency`: string, maxLength 10, optional, not nullable
    - `wert`: number or null
    - `wahrscheinlichkeit`: integer or null, 0 to 100
    - `erwartetesDatum`: string or null
    - firmaId "Firma ist erforderlich"
    - kontaktPersonId "Ungültige ID"
- [ ] The enums match `enums.ts`. Response nullability matches the DTOs. `Aktivitaet` has `updatedAt`.
- [ ] Acceptance: Redocly lint reports no errors in your files.
- [ ] Commit only your six files.

### 8. Contract — Auth, Szenarien
**Agent:** be-coder
**Model:** sonnet — well-specified transcription
**Depends on:** 5   **Parallel with:** 6, 7, 9, 10

- [ ] Edit only `openapi/paths/{auth,szenarien}.yaml` and `openapi/schemas/{auth,szenarien}.yaml`. Never edit `openapi/openapi.yaml` or the generated files, and do not run `api:generate`.
- [ ] Sources: `backend/src/routes/{auth,szenario}.ts`, `backend/src/services/szenarioService.ts`, `backend/src/config/users.ts`, `validation.ts`.
- [ ] OperationIds: login, logout, getCurrentUser, testLogin, listSzenarien, getSzenario, createSzenario, updateSzenario, deleteSzenario.
- [ ] Auth:
  - `login`: public. LoginRequest has both fields as optional strings, with `x-skip-request-validation: true`. Answers 200 `LoginResponse` with a `Set-Cookie` header, or 401.
  - `logout`: public. Optional `EmptyObject` body. Answers 200 `EmptyObject`.
  - `getCurrentUser`: `sessionCookie`; answers `BenutzerInfo` or 401.
  - `testLogin`: public, `x-environments: [development, test]`, skips validation; answers 200 `LoginResponse` or 401.
  - `Rolle`: `ROLE_ADMIN`, `ROLE_USER`.
  - `Permission`: the 7 values in `users.ts`.
- [ ] Szenarien:
  - All operations use `sessionCookie`. List answers a plain array. Get can answer 404. Create answers 201 or 409 (duplicate name). Update can answer 404 or 409. Delete answers 204.
  - SzenarioInput:
    - name "Name ist erforderlich"
    - `humanSteps` and `agileKiSteps`: works with exactly 19 items, waits with exactly 18
    - `semiAutomatedSteps`: works 11, waits 10
    - `automatedSteps`: works 2, waits 1
    - `x-error-messages` on minItems and maxItems: "Genau N Arbeitszeiten" and "Genau N Wartezeiten", with the real N
    - items: integer from 0 to 479520, with messages only for minimum ("Darf nicht negativ sein") and maximum ("Maximal 999 Tage")
  - Response `Szenario` uses `ProzessDauer`: integer arrays with no length limits.
  - Use `IdPath` for `{id}`.
- [ ] Acceptance: Redocly lint reports no errors in your files.
- [ ] Commit only your four files.

### 9. Contract — Agent tasks, Cron
**Agent:** be-coder
**Model:** sonnet — well-specified transcription
**Depends on:** 5   **Parallel with:** 6, 7, 8, 10

- [ ] Edit only `openapi/paths/{agent-tasks,cron}.yaml` and `openapi/schemas/{agent-tasks,cron}.yaml`. Never edit `openapi/openapi.yaml` or the generated files, and do not run `api:generate`.
- [ ] Sources: `backend/src/routes/{agentTasks,cron}.ts`, `backend/src/services/{agentTaskService,cronService}.ts`, `backend/src/middleware/agentAuth.ts`, `enums.ts`, `pagination.ts`.
- [ ] OperationIds: claimNextAgentTask, getAgentTaskSummary, resetAgentTasks, startAgentTask, rejectAgentTask, completeAgentTask, getAgentTask, listAgentTasks, triggerAgentTasksRun, triggerGithubIssuesRun, completeCronRun, listCronRuns, listCronJobs.
- [ ] Security:
  - `requireAgentToken` → `agentBearer` or `agentHeader`, plus `x-loopback-bypass: true`.
  - `requireAgentTokenOrAdminSession` → those two or `sessionCookie: [ADMIN]`, plus `x-loopback-bypass: true`.
  - Admin-only → `sessionCookie: [ADMIN]` with 401 and 403.
  - Cron triggers → `cronBearer` or `sessionCookie: [ADMIN]`. They declare only 401 (a non-admin session gets 401) and always answer 200 `CronRun`. No `x-loopback-bypass`.
- [ ] Agent tasks:
  - `claimNextAgentTask`: `source` declared as required, but checked in code. Answers 200, 204 or 400.
  - `getAgentTaskSummary`: an array.
  - `resetAgentTasks`: optional `EmptyObject` body; answers `{ reset: integer }`.
  - `startAgentTask`: optional `EmptyObject` body; 404, 409.
  - `rejectAgentTask`: `comment` required, "Kommentar ist erforderlich" on `required`, `type` and `minLength`.
  - `completeAgentTask`: optional body with optional `comment`.
  - `listAgentTasks`: `source` and `status` filters; default `createdAt,DESC`.
  - `AgentTask.ticketId`: integer or null.
  - Use `IdPath` for `{id}`.
- [ ] Cron:
  - `completeCronRun`: agent schemes plus bypass. Body `CronRunCompleteInput`:
    - `status`: SUCCESS or FAILED, "Ungültiger Status" on `required`, `type` and `enum`
    - `tasksSolved`, `tasksRejected`: integer, minimum 0, "Darf nicht negativ sein" on minimum
    - `githubRunUrl`: format uri, "Ungültige URL" on `required`, `type` and `format`
    - plus 404 and any other status the code returns
  - `listCronRuns`: `job` filter; default `startedAt,DESC`.
  - `listCronJobs`: an array.
  - Enums: `CronRunStatus` RUNNING|SUCCESS|FAILED|SKIPPED; `CronTrigger` CRON|MANUAL.
- [ ] Description notes: a wrong agent token never falls through to the session; a wrong `CRON_SECRET` does fall through to the admin session.
- [ ] Acceptance: Redocly lint reports no errors in your files.
- [ ] Commit only your four files.

### 10. Contract — Tickets
**Agent:** be-coder
**Model:** sonnet — largest area, fully specified by `routes/tickets.ts`
**Depends on:** 5   **Parallel with:** 6, 7, 8, 9

- [ ] Edit only `openapi/paths/tickets.yaml` and `openapi/schemas/tickets.yaml`. Never edit `openapi/openapi.yaml` or the generated files, and do not run `api:generate`.
- [ ] Sources: `backend/src/routes/tickets.ts`, `backend/src/services/ticketService.ts`, `agentAuth.ts`, `enums.ts`, `pagination.ts`.
- [ ] OperationIds: claimNextTicket, getTicketBoard, getTicketSummary, resetTickets, listTickets, createTicket, getTicket, setTicketStatus, setTicketOwner, startTicket, completeTicket, askTicketQuestion, markTicketWontDo, handTicketToAi, addTicketComment.
- [ ] Security:
  - `claimNextTicket`: agent schemes only.
  - `getTicketBoard`, `getTicket`: agent schemes, or `sessionCookie` without scope.
  - `getTicketSummary`: `sessionCookie` only.
  - `resetTickets`, `listTickets`, `markTicketWontDo`, `handTicketToAi`: `sessionCookie: [ADMIN]`.
  - All others: agent schemes or `sessionCookie: [ADMIN]`.
  - `x-loopback-bypass: true` on every operation that accepts an agent token.
- [ ] Inputs:
  - Create:
    - `type`: "Ungültiger Ticket-Typ" on `required`, `type` and `enum`
    - title "Titel ist erforderlich"; body "Beschreibung ist erforderlich"
    - `agentTaskId`: integer or null, minimum 1, "Ungültige ID"
    - `fullyReady`: optional boolean
  - Status: "Ungültiger Status". Owner: "Ungültiger Eigentümer".
  - Ask: question "Frage ist erforderlich".
  - Comments:
    - body "Kommentar-Text ist erforderlich"
    - optional booleans `handBackToAi`, `clearFullyReady`
    - `author`: "Ungültiger Autor" on `type` and `enum`
  - `completeTicket`, `markTicketWontDo`: optional body with optional `comment`.
  - `startTicket`, `handTicketToAi`, `resetTickets`: optional `EmptyObject` body.
- [ ] Answers:
  - `TicketDetail` has `comments`; `TicketListItem` has `commentCount`.
  - Board: five columns of list items. List: `TicketListItemPage`.
  - `TicketSummary`: fixed keys per enum.
  - Reset: `{ seeded: integer }`.
  - `claimNextTicket`: 200 or 204.
  - 409 for service conflicts; 400 for an unknown `agentTaskId`.
  - **403 on `addTicketComment`** when `author=AGENT` comes with a session.
  - Use `IdPath` for `{id}`.
- [ ] Acceptance: Redocly lint reports no errors in your files.
- [ ] Commit only your two files.

### 11. Contract integration and CI drift step
**Agent:** be-coder
**Model:** sonnet — cross-file cleanup with clear checks
**Depends on:** 6, 7, 8, 9, 10   **Parallel with:** 12

- [ ] Add every index entry that groups 6–10 reported to `openapi/openapi.yaml`, and fix cross-file refs.
- [ ] Run `cd backend && npm run api:generate`, then lint, then the Ajv compile.
- [ ] Cross-check the contract against the code: every route in `backend/src/routes/*.ts` and `GET /api/health` maps to exactly one operation, and the ids match the operationId table in `openapi/README.md`. Expect 79 operations on 57 paths.
- [ ] Edit `.github/workflows/deploy.yml`:
  - Add the step "Backend — API contract check": `working-directory: backend`, `run: npm run api:check`.
  - Place it right after "Backend — install dependencies" and before "Backend — type-check backend sources".
  - Keep the triggers (`pull_request`, push to `main`) and all other steps unchanged. Confirm both in your report.
- [ ] Acceptance:
  - `cd backend && npm run api:check` exits 0 on a clean tree.
  - `npx tsc --noEmit` passes.
  - `cd frontend && npx ng build` passes.
- [ ] Commit the `openapi/**` changes, the three generated files and `deploy.yml`.

### 12. Contract runtime core
**Agent:** be-coder
**Model:** opus — architecture-sensitive core every route uses; security-relevant body stripping
**Depends on:** 5   **Parallel with:** 6–11

- [ ] Create `backend/src/openapi/runtimeMode.ts`:
  - `getContractMode(env = process.env)` → `'development' | 'test' | 'production'`. Only an exact `development` or `test` counts. Unset and every other value → `production`.
  - `isDevOrTest(mode)`.
- [ ] Create `backend/src/openapi/contract.ts`:
  - Read `backend/src/generated/openapi.json` with `readFileSync`, resolved relative to the module.
  - Use `ajv/dist/2020` with `strict: false`, `allowUnionTypes: true`, `allErrors: true`, `verbose: true`, and `ajv-formats` limited to `email` and `uri`.
  - Run `addSchema(bundle, 'spec')` once, then compile fragments by ref (`spec#/…`).
  - Two instances:
    - **body**: `removeAdditional: 'all'`, `coerceTypes: false`
    - **plain**: for path params and responses; no coercion, no removal
  - At import, build an operation index. Each entry holds:
    - `operationId`, `method`, `specPath`
    - a path-params validator and a body validator
    - `bodyRequired`, `skipRequestValidation`, `environments`
    - a map of status → response validator
    - a precomputed map of instance-path pattern → `x-error-messages`, walking `properties`, `items`, `anyOf` and resolved `$ref`s
  - `findOperation(method, expressFullPath)` converts `:id` to `{id}`. `specValidate` uses it.
  - `matchOperation(method, originalUrl)`:
    - strips the query and any trailing slash
    - matches regexes compiled from the spec paths, with `{param}` → `[^/]+`
    - tries static paths before templated ones, fewest params first
  - Fail fast with a clear message when the spec is missing or does not compile.
- [ ] Create `backend/src/openapi/errorMapper.ts`. `mapAjvErrors(errors, location: 'body'|'path', op)` returns `Record<string,string>`:
  - Keys:
    - a dot path inside the body (`humanSteps.works.3`)
    - for `required`: the path plus `missingProperty`
    - a root-level body type error: `_`
    - for path errors: the param name
  - One message per key, in this precedence: required/type → const/enum → format/anyOf/pattern → length/range/items → others.
  - Lookup: the property's `x-error-messages[keyword]` first, then these defaults:
    - required → "Ungültiger Wert"
    - integer type when the value is a number → "Muss eine ganze Zahl sein"
    - boolean type → "Muss true oder false sein"
    - other type → "Ungültiger Wert"
    - root `_` → "Ungültige Anfrage"
    - maxLength → "Maximal {limit} Zeichen"
    - minimum and maximum both present → "Muss zwischen {min} und {max} liegen"
    - minimum 0 only → "Darf nicht negativ sein"
    - format uri → "Ungültige URL"
    - any path param error → "Ungültige ID"
    - anything else → "Ungültiger Wert"
  - Placeholders: `{limit}`, `{min}`, `{max}`, `{value}`.
  - Export `toValidationError(fieldErrors)` → `new ValidationError('Validierungsfehler', fieldErrors)`.
- [ ] Create `backend/src/openapi/types.ts`: type-only helpers `Schema<Name>`, `RequestBody<OperationId>`, `JsonResponse<OperationId, Status>` over the generated types.
- [ ] Do not wire anything into routes.
- [ ] Acceptance:
  - `tsc` passes.
  - Importing `contract.ts` compiles every operation present in the bundle (before group 11 only health and firmen are complete).
  - The real compile timing is measured in group 54.
- [ ] Commit the four new files.

### 13. createApp, response check, JSON catch-all (D3)
**Agent:** be-coder
**Model:** sonnet — well-specified wrapper; the "never throw" rule is spelled out
**Depends on:** 12   **Parallel with:** 15

- [ ] Create `backend/src/openapi/responseCheck.ts`:
  - Pure function `checkResponse(mode, op | undefined, status, body)` → `{ ok } | { ok: false, operationId, pointer, reason }`:
    - mode production → ok
    - status 204 → ok
    - status ≥ 500, or no op → validate against `ErrorResponse`
    - a status the op does not declare → violation "undeclared status"
    - validate a JSON round-trip copy of the body
  - Middleware factory `responseCheck(mode)` wraps `res.json` for each request.
    - The op is `res.locals.contractOp` (set by `specValidate` later). Otherwise use `matchOperation(req.method, req.originalUrl)`. Never use `req.baseUrl`.
    - Wrap everything in try/catch. It must **never throw**: login and logout call `res.json` inside session callbacks.
    - Test mode, on violation:
      - log `[contract] <operationId> <status> <pointer>: <reason>`
      - set status 500, then call the **original** bound `res.json` (no recursion)
      - body: the standard shape with message `Antwort verletzt API-Vertrag: <operationId> <status> <pointer> <reason>`, timestamp ISO without `Z` (as in `errorHandler.ts`), and `fieldErrors: {}`
    - Development mode, on violation: log the same line, set `X-Contract-Violation: <operationId> <pointer>`, and send the real body.
  - Coverage. Only when mode is test and env `CONTRACT_COVERAGE_FILE` is set:
    - in `res.on('finish')`, resolve the op as above
    - on any 2xx, including 204, append the operationId to that file once per process
- [ ] `backend/src/app.ts`:
  - `export function createApp(mode = getContractMode())`. Keep `export default createApp()` so `index.ts` stays unchanged.
  - Inside `createApp`:
    - build the 12 routers list `{ basePath, router }` in today's order, mount it in a loop, and store it in `app.locals['apiRouters']`
    - mount `responseCheck(mode)` after `sessionMiddleware`, before the routers, when mode is development, or when mode is test and `process.env['CONTRACT_RESPONSE_CHECK'] !== 'off'`
    - keep health inline
    - after the routers and before `errorHandler`: `app.use('/api', …)` → `next(new NotFoundError('Ressource nicht gefunden'))` for every unknown path and method (no 405)
- [ ] Acceptance:
  - `tsc` passes.
  - With `NODE_ENV=test`, check only health, firmen and the catch-all; other areas may answer 500 until group 11.
  - `GET /api/nope` and `DELETE /api/firmen` → 404 JSON in the standard shape.
  - `GET /api/health` and `GET /api/firmen/1` are unchanged.
- [ ] Commit `backend/src/openapi/responseCheck.ts` and `backend/src/app.ts`.

### 14. Approved changes D1, D3, D4, D5 (server) and test exports
**Agent:** be-coder
**Model:** sonnet — small, fully specified edits
**Depends on:** 13   **Parallel with:** 15

- [ ] D1, `backend/src/routes/chancen.ts`: replace the inline `res.status(400).json(...)` with `throw new ValidationError(msg, { phase: msg })`. Keep `msg` byte-identical: `Ungültiger phase-Wert: ${phaseRaw}. Erlaubt: ${CHANCE_PHASE.join(', ')}`.
- [ ] D3 and D5, `backend/src/routes/auth.ts`: export `createAuthRouter(mode)`. It registers `POST /test-login` only when `isDevOrTest(mode)`. Delete the production `else` stub.
- [ ] `backend/src/app.ts`: `createApp(mode)` mounts `createAuthRouter(mode)` instead of the default auth router.
- [ ] D4, `backend/src/middleware/errorHandler.ts`, before the 500 branch: any error with a numeric `status` from 400 to 499 and a string `type` (a body-parser error) answers in the standard shape:
  - `entity.parse.failed` → 400, `Validierungsfehler`, `fieldErrors: { _: 'Ungültige Anfrage' }`
  - `entity.too.large` → 413, `Anfrage zu groß`, `fieldErrors: {}`
  - any other → its own status, `Ungültige Anfrage`, `fieldErrors: {}`
  - Use the same `timestamp()`.
- [ ] `backend/src/utils/pagination.ts`: export `ALLOWED_SORT_FIELDS`, read-only. No behavior change.
- [ ] Acceptance:
  - `tsc` passes.
  - Invalid phase → 400 in the standard shape with the same message and `fieldErrors.phase`.
  - Malformed JSON on `POST /api/firmen` → 400 with `_`.
  - A 150 KB JSON body → 413.
  - `createApp('production')` has no test-login route.
- [ ] Commit the five files.

### 15. Start scripts set development mode (D5)
**Agent:** shell-coder
**Model:** haiku — two spelled-out edits
**Depends on:** none   **Parallel with:** 12, 13, 14

- [ ] `start.sh`:
  - Start the backend as `NODE_ENV=development npx tsx --watch src/index.ts &`. The variable covers only this command; do not export it.
  - Leave the frontend line unchanged.
  - Comment: "Development mode turns on test-login, contract answer checks and /api/docs."
- [ ] `start.bat`:
  - Add `set "NODE_ENV=development"` directly before the backend `start "CRM-Backend" …` line.
  - Add `set "NODE_ENV="` directly after it, so the frontend does not inherit it.
  - Keep the `tsx --watch src/index.ts` command text unchanged, because the cleanup matches on it.
- [ ] Do not change `backend/package.json` scripts.
- [ ] Acceptance: `bash -n start.sh` passes. Both scripts start the backend with `NODE_ENV=development` and the frontend without it.
- [ ] Commit `start.sh` and `start.bat`.

### 16. Test Implementation — runtime core, modes, approved changes
**Agent:** be-test-coder
**Model:** sonnet — spelled-out cases
**Depends on:** 11, 14   **Parallel with:** 19

- [ ] `backend/src/test/contract-runtime.spec.ts` (unit tests in the runner process):
  - `getContractMode`: `development` → development; `test` → test; unset, `''`, `production`, `staging` and `Development` → production.
  - `matchOperation`:
    - `GET /api/agent-tasks/next` → `claimNextAgentTask`, not `getAgentTask`
    - `GET /api/firmen/1?x=1` → `getFirma`
    - `GET /api/firmen/` → `listFirmen`
  - `mapAjvErrors`, with real ops `createFirma`, `createSzenario`, `completeCronRun` and `getFirma`:
    - missing required field → key plus override text
    - nested missing field → dot key
    - array item → index key
    - body `[]` → `_` "Ungültige Anfrage"
    - integer field with 1.5 → "Muss eine ganze Zahl sein"; with `"x"` → "Ungültiger Wert"
    - maxLength → "Maximal 255 Zeichen"
    - latitude out of range → "Muss zwischen -90 und 90 liegen"
    - `tasksSolved: -1` → "Darf nicht negativ sein"
    - path `id` = `abc` → `id` "Ungültige ID"
    - a type error beats minLength
    - an override beats the default
  - `checkResponse`: valid; missing field → violation with operationId and pointer; undeclared status; 500 checked against `ErrorResponse`; no op → `ErrorResponse`; 204 skipped; production skipped.
- [ ] `backend/src/test/runtime-modes.spec.ts` (in-process, ephemeral ports, no child process):
  - `createApp('production')`: `POST /api/auth/test-login` → 404 JSON in the standard shape; `GET /api/docs` → 404 JSON.
  - A tiny Express app with `responseCheck(mode)` and a route `GET /api/firmen/:id` that returns `{}`:
    - production → 200 with the body unchanged
    - development → 200, body unchanged, header `X-Contract-Violation` present
    - test → 500 in the standard shape naming `getFirma`
  - With `CONTRACT_COVERAGE_FILE` unset, no coverage file appears.
- [ ] `backend/src/test/behavior-changes.spec.ts` (HTTP against the suite backend):
  - D1: invalid phase → 400 with `status`, the unchanged `message`, `timestamp` and `fieldErrors.phase`.
  - D3: `GET /api/does-not-exist` and `DELETE /api/firmen` → 404 in the standard shape, message "Ressource nicht gefunden".
  - D4: raw malformed JSON → 400 "Validierungsfehler" with `_` "Ungültige Anfrage"; a 150 KB body → 413 "Anfrage zu groß".
  - D5: `testLogin` answers 200 in test mode.
- [ ] Acceptance: `npx tsc --noEmit` passes.
- [ ] Commit the three spec files.

### 17. Run backend suite with response checks on
**Agent:** be-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 11, 14, 16 (and 18 on reruns)   **Parallel with:** none

- [ ] Start only after every listed group has committed. No other Playwright, bench or `start.sh` run may be active.
- [ ] Run `cd backend && npm run api:check && npx tsc --noEmit && npx playwright test`.
- [ ] Report pass or fail. For every failure, quote the backend `[contract]` log lines (operationId, status, pointer, reason).
- [ ] Do not fix anything.

### 18. Contract corrections (loop with 17)
**Agent:** be-coder
**Model:** sonnet — known cause: each violation names the operation and the JSON pointer
**Depends on:** 17   **Parallel with:** none

- [ ] For each violation, compare the contract with the route, the service and `toDTO`.
  - Fix `openapi/paths|schemas/*.yaml` so the contract documents what the code really does. The code wins, even when it looks wrong.
  - When it looks wrong, report the operation and the evidence in your final message. The orchestrator records it in PRD Decisions (c).
  - **Never change application code. Never change test assertions.** Never loosen a schema beyond what the code produces.
- [ ] Run `cd backend && npm run api:generate`.
- [ ] Commit the changed `openapi/**` files and the three generated files.
- [ ] Acceptance: the next group 17 run is green. Repeat 17 → 18 until it is.

### 19. Test Implementation — contract tests
**Agent:** be-test-coder
**Model:** sonnet — spelled-out cases; security review by be-test-reviewer (sonnet)
**Depends on:** 11, 14   **Parallel with:** 16

- [ ] `backend/src/test/globalSetup.ts`. Add to the child env:
  - `GH_DISPATCH_TOKEN=''`. `loadEnv` keeps empty real env vars, so no GitHub call happens.
  - `GH_DISPATCH_REPO='invalid/invalid'`
  - `CONTRACT_COVERAGE_FILE` = the absolute path of `backend/data/contract-coverage.7070.test.jsonl`

  Delete that coverage file at setup start and in teardown.
- [ ] `backend/playwright.config.ts`: two projects.
  - `api`: every spec except `contract-coverage.spec.ts`.
  - `contract-coverage`: only that file, with `dependencies: ['api']`.
  - Keep `globalSetup`, `workers: 1` and the `NODE_ENV` line.
- [ ] `backend/src/test/contract-routes.spec.ts`:
  - Use `createApp('test')` from `../app.js`.
  - Build the set `METHOD /api/<path with {param}>` from each router in `app.locals.apiRouters` (`route.path`, `route.methods`) plus the top-level app routes.
  - Compare it with the operations in `backend/src/generated/openapi.json`, using the `/api` prefix.
  - Exempt `/api/docs*` and `/api/openapi.json`.
  - Fail with lists of what is missing and what is extra.
- [ ] `backend/src/test/contract-access.spec.ts`, generated from the bundle. Path params `1`; send body `[]` where an operation has a requestBody.
  - Every op with non-empty security: no cookie, `X-Agent-Token: wrong-token` → 401 in the standard shape.
  - Every op with `x-loopback-bypass`: no cookie, no token, `X-Forwarded-For: 203.0.113.1` → 401 (the bypass is refused).
  - Every op whose `sessionCookie` carries scope `ADMIN`: log in as `user`/`test123`, send `X-Forwarded-For: 203.0.113.1` and no token → 403. Ops that list `cronBearer` → 401.
  - Bypass works: `getTicketBoard` with no auth headers → 200.
  - No fallthrough: admin session plus `X-Agent-Token: wrong` on `getTicket` → 401.
  - Cron falls through: admin session plus `Authorization: Bearer wrong` on `triggerGithubIssuesRun` → 200. The empty `GH_DISPATCH_TOKEN` makes it a FAILED run with no network call.
- [ ] `backend/src/test/contract-lists.spec.ts`:
  - The spec enums equal the `enums.ts` arrays as sets: ChancePhase, AktivitaetTyp, AgentTaskSource, AgentTaskStatus, TicketOwner, TicketType, TicketStatus, TicketSolution, TicketCommentAuthor. The same holds for the enums on the query params `phase`, `source`, `status`, `type` and `owner`.
  - `x-sort-fields` equals the keys of `ALLOWED_SORT_FIELDS`: listFirmen → firma, listPersonen → person, listAbteilungen → abteilung, listAdressen → adresse, listAktivitaeten → aktivitaet, listChancen → chance, listAgentTasks → agentTask, listCronRuns → cronRun, listTickets → ticket.
  - Every op that declares `sort` appears in that map.
  - `x-default-sort` per op: firma `name,ASC`; person `lastName,ASC`; abteilung `name,ASC`; adresse `city,ASC`; aktivitaet `datum,DESC`; chance `createdAt,DESC`; agentTask `createdAt,DESC`; cronRun `startedAt,DESC`; ticket `createdAt,DESC`.
  - `Rolle` = `ROLE_` plus each distinct role in `USERS` from `config/users.ts`. `Permission` = the union of the users' permissions.
- [ ] Coverage:
  - `backend/src/test/contract-coverage.spec.ts` reads the coverage file and fails on any operationId not in it, minus exemptions.
  - `backend/src/test/contract-coverage-exemptions.ts` holds `{ operationId, reason }[]`; the goal is empty.
  - Add minimal success calls in `backend/src/test/contract-smoke.spec.ts` for every op no other test calls, instead of exempting it.
- [ ] Acceptance: `npx tsc --noEmit` passes.
- [ ] Commit all listed files.

### 20. Run contract tests
**Agent:** be-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 19, and the 17/18 loop green   **Parallel with:** 21

- [ ] Start only after every listed group has committed. Run nothing else in parallel.
- [ ] Run `cd backend && npm run api:check && npx tsc --noEmit && npx playwright test` (both projects).
- [ ] Report failures and say for each whether it looks like a contract mismatch (for group 18) or a test bug (back to group 19). Do not fix anything.

### 21. specValidate middleware
**Agent:** be-coder
**Model:** sonnet — thin middleware over the group 12 core
**Depends on:** 12   **Parallel with:** 13–20

- [ ] Create `backend/src/openapi/specValidate.ts` and export the named function `specValidate(req, res, next)`:
  - `op = findOperation(req.method, req.baseUrl + req.route.path)`. This is reliable inside a matched route. If no op is found → `next(new Error('No contract operation for …'))`.
  - Store `res.locals.contractOp = op`.
  - `op.skipRequestValidation` → `next()`.
  - Validate a **copy** of `req.params` without coercion. Path params are strings with pattern `^[1-9][0-9]*$`. On failure → `next(toValidationError(...))` with the `id` or `firmaId` key and "Ungültige ID". Do not overwrite `req.params`.
  - When the op has a requestBody, validate `structuredClone(req.body ?? {})` with the body validator. On success, write the stripped clone back to `req.body`. On failure → `ValidationError`.
  - When the op has no requestBody, leave `req.body` untouched.
- [ ] Acceptance: `tsc` passes. Not wired into any route yet.
- [ ] Commit the file.

### 22. Switch — Firmen, Personen, Abteilungen
**Agent:** be-coder
**Model:** sonnet — repetitive route edits with a clear pattern
**Depends on:** 20, 21   **Parallel with:** 23, 24, 25, 26, 28

- [ ] In `backend/src/routes/{firmen,personen,abteilungen}.ts`:
  - Insert `specValidate` from `../openapi/specValidate.js` immediately before the final `asyncHandler(...)` of **every** route, after the guards.
  - Replace `validate(XCreateSchema, req.body)` with a const typed `RequestBody<'<operationId>'>` (from `../openapi/types.js`), assigned from `req.body`. The operationIds are createFirma, updateFirma, createPerson, updatePerson, createAbteilung, updateAbteilung.
  - Remove the imports from `../utils/validation.js`.
- [ ] In `backend/src/services/{firmaService,personService,abteilungService}.ts`: switch the input DTO types from `utils/validation.js` to the generated types. Logic stays the same.
- [ ] Do not touch `backend/src/utils/validation.ts`.
- [ ] Acceptance:
  - `tsc` passes.
  - Your files contain no `validate(` and no `validation.js`.
  - Every route has `specValidate` right before its final handler.
- [ ] Commit the six files.

### 23. Switch — Adressen, Aktivitäten, Chancen
**Agent:** be-coder
**Model:** sonnet — repetitive route edits with a clear pattern
**Depends on:** 20, 21   **Parallel with:** 22, 24, 25, 26, 28

- [ ] In `backend/src/routes/{adressen,aktivitaeten,chancen}.ts`:
  - Insert `specValidate` from `../openapi/specValidate.js` immediately before the final `asyncHandler(...)` of every route, after the guards.
  - Replace `validate(XCreateSchema, req.body)` with a const typed `RequestBody<'<operationId>'>` from `../openapi/types.js`. The operationIds are createAdresse, updateAdresse, createAktivitaet, updateAktivitaet, createChance, updateChance.
  - Remove the imports from `../utils/validation.js`.
  - Keep the D1 phase check in `chancen.ts` exactly as it is.
- [ ] In `backend/src/services/{adresseService,aktivitaetService,chanceService}.ts`: switch the input DTO types to the generated types. Logic stays the same.
- [ ] Do not touch `backend/src/utils/validation.ts`.
- [ ] Acceptance:
  - `tsc` passes.
  - Your files contain no `validate(` and no `validation.js`.
  - Every route has `specValidate` right before its final handler.
- [ ] Commit the six files.

### 24. Switch — Szenarien, Auth, Dashboard, Health
**Agent:** be-coder
**Model:** sonnet — repetitive route edits plus the login skip flag
**Depends on:** 20, 21 (and 14 for `auth.ts` and `app.ts`)   **Parallel with:** 22, 23, 25, 26, 28

- [ ] `backend/src/routes/szenario.ts`:
  - Insert `specValidate` immediately before the final `asyncHandler(...)` of every route.
  - Replace `validate(SzenarioSchema, …)` with a const typed `RequestBody<'createSzenario'>` or `RequestBody<'updateSzenario'>`.
  - Remove the `validation.js` import.
- [ ] `backend/src/services/szenarioService.ts`: switch the input types to the generated types.
- [ ] `backend/src/routes/auth.ts` (inside `createAuthRouter(mode)`): add `specValidate` before the final handler of every route. It does nothing for `login` and `testLogin` because of `x-skip-request-validation`. Logout keeps working with no body.
- [ ] `backend/src/routes/dashboard.ts`: add `specValidate` on the route. It runs after `router.use(requireAuth)`.
- [ ] `backend/src/app.ts`: add `specValidate` to the inline `GET /api/health` inside `createApp`.
- [ ] Acceptance:
  - `tsc` passes.
  - Login without `passwort` still answers 401 "Ungültige Anmeldedaten".
  - Your files contain no `validation.js`.
- [ ] Commit the five files.

### 25. Switch — Agent tasks, Cron
**Agent:** be-coder
**Model:** sonnet — repetitive route edits with a clear pattern
**Depends on:** 20, 21   **Parallel with:** 22, 23, 24, 26, 28

- [ ] `backend/src/routes/agentTasks.ts`:
  - Delete `RejectBodySchema`, `DoneBodySchema` and the `zod` import.
  - Insert `specValidate` before the final handler of every route.
  - Type bodies as `RequestBody<'rejectAgentTask'>` and `RequestBody<'completeAgentTask'>`.
  - Keep the `source` and `status` query checks with their messages.
- [ ] `backend/src/routes/cron.ts`:
  - Insert `specValidate` before the final handler of every route, after `requireCronAuth`, `requireAgentToken` or `requireAuth` + `requireRole`.
  - Replace `validate(CompleteRunBodySchema, …)` with `RequestBody<'completeCronRun'>`.
- [ ] `backend/src/services/cronService.ts`:
  - Delete `CompleteRunBodySchema`, `CompleteRunBody` and the `zod` import.
  - `completeRun` takes `RequestBody<'completeCronRun'>`.
- [ ] Acceptance: `tsc` passes. Your files contain no `zod` and no `validate(`.
- [ ] Commit the three files.

### 26. Switch — Tickets
**Agent:** be-coder
**Model:** sonnet — repetitive route edits, biggest route file
**Depends on:** 20, 21   **Parallel with:** 22, 23, 24, 25, 28

- [ ] `backend/src/routes/tickets.ts`:
  - Delete all seven inline Zod schemas and the `zod` import.
  - Insert `specValidate` before the final handler of all 15 routes.
  - Type bodies with `RequestBody<'createTicket'>`, `setTicketStatus`, `setTicketOwner`, `askTicketQuestion`, `completeTicket`, `markTicketWontDo`, `addTicketComment`.
  - Keep the query checks with their messages.
  - Keep the 403 check `author === 'AGENT' && req.session.userId` inside the handler.
- [ ] `backend/src/services/ticketService.ts`: switch the input parameter types to the generated types.
- [ ] Acceptance: `tsc` passes. `tickets.ts` contains no `zod` and no `validate(`.
- [ ] Commit the two files.

### 27. Remove Zod
**Agent:** be-coder
**Model:** haiku — mechanical deletion with grep checks
**Depends on:** 22, 23, 24, 25, 26   **Parallel with:** 28

- [ ] Delete `backend/src/utils/validation.ts`. This also removes `PROCESS_STEP_COUNTS`; no other code imports it.
- [ ] Delete `backend/src/test/golden-record.spec.ts`, the only remaining Zod consumer. Keep both fixture files.
- [ ] Run `cd backend && npm uninstall zod`.
- [ ] Acceptance:
  - `grep -rnw --exclude='*.json' 'zod' backend/src` finds nothing (case-sensitive, whole word).
  - `grep -rn 'validation\.js' backend/src` finds nothing.
  - `tsc` passes.
- [ ] Commit `backend/package.json`, `backend/package-lock.json` and both deletions.

### 28. Test Implementation — switch tests
**Agent:** be-test-coder
**Model:** sonnet — spelled-out cases
**Depends on:** 4, 13, 21   **Parallel with:** 22–27

- [ ] `backend/src/test/golden-errors.spec.ts`:
  - Load `fixtures/golden-corpus.ts` and `fixtures/golden-errors.json`, and send every case.
  - `status`, `message` and the `fieldErrors` keys must match exactly.
  - Each text must match the recording, or the case's `expectGerman` when it has one.
  - When the recorded text starts with `Invalid`, `Too`, `Expected` or `Required` and the case has no `expectGerman`, fail with a hint to annotate it under the D6 rules.
- [ ] `backend/src/test/format-parity.spec.ts`:
  - Compare Ajv 2020 plus `ajv-formats` verdicts for `email` and `uri` with `fixtures/format-parity.json`.
  - Keep an `acceptedDifferences` list `{ input, reason }`, empty at first. Entries are added only after an orchestrator decision.
  - Fail on any other difference.
- [ ] `backend/src/test/contract-route-chain.spec.ts`: for every route in `createApp('test').locals.apiRouters` plus the top-level `/api/health`, `specValidate` appears exactly once, immediately before the last handler. Exempt the docs routes. Check only routes present in that app (`testLogin` is absent in production).
- [ ] `backend/src/test/input-validation.spec.ts`:
  - `POST /api/firmen` with an extra `isAdmin: true` → 201. Neither the answer nor `GET /api/firmen/{id}` contains `isAdmin`.
  - `POST /api/personen` with `firmaId: "5"` → 400, `fieldErrors.firmaId` "Firma ist erforderlich".
  - `GET /api/firmen/abc`, `/0`, `/-1` and `/01` → 400 "Validierungsfehler", `fieldErrors.id` "Ungültige ID".
  - `GET /api/abteilungen/firma/abc` → `fieldErrors.firmaId`.
  - These are not rejected with 400:
    - `POST /api/tickets/1/start` with no body (agent token)
    - `POST /api/agent-tasks/1/done` with no body
    - `POST /api/tickets/1/hand-to-ai` with `{}` (admin)
  - `POST /api/auth/logout` with no body → 200.
  - Login without `passwort` → 401 "Ungültige Anmeldedaten". Test-login without `benutzername` → 401 "benutzername required".
  - `POST /api/firmen` with `[]` and no cookie → 401.
  - `POST /api/tickets/reset` as `user` with `X-Forwarded-For` → 403.
  - `GET /api/firmen?page=abc&size=abc` → 200 with `number` 0 and `size` 10.
  - `size=500` → 200 with `size` 200.
  - `sort=bogus,asc` → 400 "Ungültiges Sortierfeld: bogus".
  - `GET /api/chancen?search=a&search=b` → 200.
- [ ] `backend/src/test/input-completeness.spec.ts`: for each entity, create with **every** input field set to a non-default value, then GET by id and assert each sent field comes back:
  - Firma, Person, Abteilung, Adresse (including `typ`, latitude and longitude), Aktivitaet, Chance (all fields), Szenario (all four processes)
  - Ticket create with `agentTaskId` and `fullyReady: true`
  - agent-task reject `comment`

  This catches fields missing from input schemas, which `removeAdditional` would drop silently.
- [ ] Acceptance: `npx tsc --noEmit` passes.
- [ ] Commit the five spec files.

### 29. Run backend after the switch
**Agent:** be-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 27, 28 (and 30 on reruns)   **Parallel with:** none

- [ ] Start only after every listed group has committed. Run nothing else in parallel.
- [ ] Run `cd backend && npm run api:check && npx tsc --noEmit && npx playwright test`.
- [ ] Report the result. For golden and format-parity failures, list the case id with expected and actual values. Do not fix anything.

### 30. Golden and format-parity corrections (loop with 29)
**Agent:** be-coder
**Model:** sonnet — known cause per failing case; escalate to opus only if `errorMapper.ts` needs a rewrite
**Depends on:** 29   **Parallel with:** none

- [ ] For each failing case, choose the right fix:
  - a missing or wrong `x-error-messages` in `openapi/schemas/*.yaml`
  - a mapper rule in `backend/src/openapi/errorMapper.ts`
  - a missing `expectGerman` in `backend/src/test/fixtures/golden-corpus.ts`, only when the D6 rules require it:
    - field missing or wrongly typed with a German text → that text
    - too long → "Maximal {limit} Zeichen"
    - range → "Muss zwischen {min} und {max} liegen"
    - not whole → "Muss eine ganze Zahl sein"
    - negative count → "Darf nicht negativ sein"
    - bad ID → "Ungültige ID"
    - bad yes/no → "Muss true oder false sein"
    - reject comment → "Kommentar ist erforderlich"
    - cron status → "Ungültiger Status"
    - cron URL → "Ungültige URL"
    - any other → "Ungültiger Wert"
    - body `[]` → `_` "Ungültige Anfrage"
- [ ] Never edit `golden-errors.json` or `format-parity.json`. Report format differences for an orchestrator decision.
- [ ] Never change status codes or keys.
- [ ] Regenerate after any contract edit (`npm run api:generate`).
- [ ] Commit the exact changed files.
- [ ] Acceptance: the next group 29 run is green. Repeat 29 → 30 until it is.

### 31. Server types — Firmen, Personen, Abteilungen, Adressen
**Agent:** be-coder
**Model:** sonnet — type refactor with enum narrowing
**Depends on:** 30   **Parallel with:** 32, 33

- [ ] In `backend/src/services/{firmaService,personService,abteilungService,adresseService}.ts`:
  - Replace the exported DTO interfaces with aliases of the generated schemas. Keep the names, for example `export type FirmaDTO = Schema<'Firma'>`.
  - Keep the internal `*Row` types.
  - Fix `toDTO` without `as` casts where you can, narrowing with type guards based on `enums.ts`.
- [ ] `backend/src/utils/pagination.ts`: add a type-only check that `PageResult` keys equal the generated `PageMeta` keys plus `content`.
- [ ] If a type error shows the contract is wrong, stop and report it. That goes to group 18.
- [ ] Acceptance: `tsc` passes. Your services contain no `export interface .*DTO`.
- [ ] Commit the five files.

### 32. Server types — Aktivitäten, Chancen, Dashboard, Szenarien, Auth, Health
**Agent:** be-coder
**Model:** sonnet — type refactor with enum narrowing
**Depends on:** 30   **Parallel with:** 31, 33

- [ ] In `backend/src/services/{aktivitaetService,chanceService,dashboardService,szenarioService}.ts`:
  - Replace the exported DTO interfaces with aliases of the generated schemas, keeping the names.
  - Keep the `*Row` types.
  - Fix `toDTO` without `as` casts where you can.
- [ ] `backend/src/routes/auth.ts`: type the inline answers with `JsonResponse<…>` from `../openapi/types.js`: `login`, `testLogin` and `getCurrentUser` with status 200, and `logout`'s `{}`.
- [ ] `backend/src/app.ts`: type the health answer as `JsonResponse<'getHealth', 200>`.
- [ ] If a type error shows the contract is wrong, stop and report it.
- [ ] Acceptance: `tsc` passes. No hand-written DTO interfaces remain.
- [ ] Commit the six files.

### 33. Server types — Agent tasks, Cron, Tickets
**Agent:** be-coder
**Model:** sonnet — type refactor with enum narrowing
**Depends on:** 30   **Parallel with:** 31, 32

- [ ] In `backend/src/services/{agentTaskService,cronService,ticketService}.ts`, replace the exported DTO interfaces with aliases of the generated schemas:
  - `TicketDTO` → `TicketDetail`
  - `TicketListItemDTO` → `TicketListItem`
  - `TicketBoardDTO` → `TicketBoard`
  - `TicketSummaryDTO` → `TicketSummary`, with fixed keys
  - `CronRunDTO` and `CronJobWithLastRun` → their generated schemas
  - Keep the `*Row` types. Fix `toDTO` without `as` casts where you can.
- [ ] `backend/src/routes/agentTasks.ts` and `backend/src/routes/tickets.ts`: type the inline reset answers with `JsonResponse<'resetAgentTasks', 200>` and `JsonResponse<'resetTickets', 200>`.
- [ ] If a type error shows the contract is wrong, stop and report it.
- [ ] Acceptance: `tsc` passes.
- [ ] Commit the five files.

### 34. Run backend after server types
**Agent:** be-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 31, 32, 33   **Parallel with:** none

- [ ] Start only after every listed group has committed. Run nothing else in parallel.
- [ ] Run `cd backend && npm run api:check && npx tsc --noEmit && npx playwright test`. Report the result. Do not fix anything.

### 35. Typed ApiClient, compile-time checks, Page check
**Agent:** fe-coder
**Model:** sonnet — type-level TS, fully specified below; review by fe-reviewer (sonnet)
**Depends on:** 11   **Parallel with:** phases 2–5

- [ ] Background on `frontend/src/app/core/api/api-types.ts` (openapi-typescript 7 output):
  - `paths['/firmen/{id}']` has one key per HTTP method. Present methods are `operations['getFirma']`. Absent methods are `post?: never`.
  - `parameters` looks like `{ query?: {…}; header?: never; path: {…} | path?: never; cookie?: never }`.
  - `requestBody` comes in three forms: required (`requestBody: { content: { 'application/json': T } }`), optional (`requestBody?: …`) or absent (`requestBody?: never`).
  - `responses` are keyed by numeric literals. JSON answers sit under `content['application/json']`. 204 has `content?: never`.
  - Path params are `string`, because the contract uses a pattern for ids.
- [ ] Create `frontend/src/app/core/api/api-client.ts`. Export these type-only helpers (with `export type`; `isolatedModules` is on). Wrap `[X] extends [never]` checks so `never` and `undefined` don't distribute.
  - `ApiMethod` = `'get' | 'post' | 'put' | 'patch' | 'delete'`.
  - `PathsWith<M>`: keys of `paths` whose `M` entry is an operation (not `undefined` or `never`).
  - `PathParams<P, M>`: the op's `parameters.path` with each value widened to `string | number`; `never` when absent.
  - `QueryOf<P, M>`: `NonNullable` of `parameters.query`; `never` when absent.
  - `RequestBody<P, M>`: the JSON body type; `never` when absent.
  - `BodyRequired<P, M>`: true only when `requestBody` is not optional.
  - `JsonResponse<P, M>`: the union of the 200 and 201 JSON content; `void` when 204 is the only success status.
  - `ApiOptions<P, M>`:
    - `path` required when `PathParams` is not never, else `path?: never`
    - `query?` when a query exists, else `query?: never`
    - `body` required when `BodyRequired`, optional when optional, `body?: never` when absent
  - `NeedsOptions<P, M>`: true when path or body is required.
- [ ] In the same file, add `@Injectable({ providedIn: 'root' }) export class ApiClient` with `private http = inject(HttpClient)`.
  - Methods `get`, `post`, `put`, `patch`, `delete`, each with this signature (M = that method): `get<P extends PathsWith<'get'>>(path: P, ...args: NeedsOptions<P,'get'> extends true ? [opts: ApiOptions<P,'get'>] : [opts?: ApiOptions<P,'get'>]): Observable<JsonResponse<P,'get'>>`.
  - The methods delegate to one private untyped `request(method, path, opts)` that holds the file's only cast. This file is exempt from the no-cast rule.
  - URL: `/api` plus the spec key, with `{param}` replaced by `encodeURIComponent(String(value))`.
  - Query: `HttpParams`, skipping only `undefined` and `null`. Empty strings stay, as today.
  - Send `opts.body` exactly as given. `{}` stays `{}`.
- [ ] Create `frontend/src/app/core/api/api-client.type-check.ts`. `ng build` compiles it (it is in `tsconfig.app.json`). It must have no runtime effect. Declare an unused `ApiClient` value and check its call types:
  - `@ts-expect-error` cases:
    - an unknown path
    - `getFirma` without `path`
    - `post` on `'/firmen/{id}'`
    - a body on `'/firmen'` GET
    - a missing required body on `createFirma`
  - Positive cases:
    - `delete('/firmen/{id}', …)` types as `Observable<void>`
    - `handTicketToAi` without a body compiles, and with `{}` compiles
    - `getFirma` with `id: 5` (a number) compiles
- [ ] `frontend/src/app/core/models/page.model.ts`:
  - Keep `Page<T>`.
  - Add a type-only `Equal<A, B>` helper (mutual assignability).
  - Assert `Page<X>` equals the generated page schema for all nine pages: FirmaPage, PersonPage, AbteilungPage, AdressePage, AktivitaetPage, ChancePage, AgentTaskPage, CronRunPage, TicketListItemPage, each with its item schema.
- [ ] Do not change any services.
- [ ] Acceptance: `cd frontend && npx ng build` passes and `npx tsc -p tsconfig.spec.json --noEmit` passes.
- [ ] Commit the three files.

### 36. Test Implementation — typed model factories
**Agent:** fe-test-coder
**Model:** sonnet — chosen approach (not PRD-mandated): factories cut churn in the spec updates
**Depends on:** 20   **Parallel with:** 35

- [ ] Create `frontend/src/app/core/testing/model-factories.ts`. Type it directly against `components['schemas'][…]` from `../api/api-types`, not against the model files, so it compiles before and after the alias switch.
- [ ] Factories: `makeFirma`, `makePerson`, `makeAbteilung`, `makeAdresse`, `makeAktivitaet`, `makeChance`, `makeBenutzerInfo`, `makeAgentTask`, `makeCronRun`, `makeCronJob`, `makeTicketDetail`, `makeTicketListItem`, `makeSzenario`, `makePage(items)`.
- [ ] Each returns a complete object with realistic defaults and accepts `Partial` overrides.
- [ ] Acceptance: `cd frontend && npx tsc -p tsconfig.spec.json --noEmit` passes.
- [ ] Commit the file.

### 37. Model aliases — CRM, dashboard, auth
**Agent:** fe-coder
**Model:** sonnet — alias swap plus compiler-forced fixes
**Depends on:** 35, 36   **Parallel with:** none (the frontend chain runs in sequence)

- [ ] In `frontend/src/app/core/models/{firma,person,abteilung,adresse,aktivitaet,chance,dashboard,auth}.model.ts`, replace the interfaces with `export type X = components['schemas']['Y']`, importing the type from `../api/api-types`. Keep every exported name:
  - `FirmaCreate` = `FirmaInput`; `FirmaAdresse` = `FirmaAdresse`; `FirmaAdresseTyp` = `NonNullable<FirmaAdresse['typ']>` (now free text)
  - `PersonCreate` = `PersonInput`; `AbteilungCreate` = `AbteilungInput`; `AdresseCreate` = `AdresseInput`
  - `AktivitaetCreate` = `AktivitaetInput`; `ChanceCreate` = `ChanceInput`
  - `ChancePhase`, `AktivitaetTyp` and `DashboardData` stay
  - `LoginRequest`, `LoginResponse` and `BenutzerInfo` stay
- [ ] Fix the non-spec consumers the compiler flags:
  - `features/aktivitaet/aktivitaet-list/aktivitaet-list.component.ts`
  - `features/person/person-list/person-list.component.ts`
  - `features/chance/chance-list/chance-list.component.ts`
  - `features/person/person-detail/person-detail.component.ts`
  - `features/firma/firma-list/firma-list.component.ts`
  - `features/firma/firma-detail/firma-detail.component.ts`
  - `features/dashboard/dashboard.component.ts`
  - `features/chance/chance-detail/chance-detail.component.ts`
  - `features/adresse/adresse-list/adresse-list.component.ts`
  - `features/abteilung/abteilung-list/abteilung-list.component.ts`
  - `features/abteilung/abteilung-detail/abteilung-detail.component.ts`
  - `features/{person,chance,aktivitaet,adresse,abteilung}/*-form/*-form.component.ts`
  - plus any CRM service that fails to compile
- [ ] Nullability rules (binding):
  - Forms keep `null`. Never convert to `''`. Where a typed form control rejects `null`, widen it to `string | null`.
  - Templates: change only what the compiler forces (pipes or inputs that reject `null`). Do **not** add `-` where the UI shows blank today. Leave chance-detail's `{{ wahrscheinlichkeit }}%` as it is.
  - No `!` and no `as` casts in feature code.
- [ ] Where a form needs stricter values (the address form: street, postalCode and city required), declare its form value type next to the form component as `Required<Pick<AdresseCreate, …>>`.
- [ ] Acceptance:
  - `cd frontend && npx ng build` passes with no NG8102 warnings.
  - The diff adds no `!.`, `as ` or `<any>` in feature code.
  - Run `npx tsc -p tsconfig.spec.json --noEmit` and list the spec errors in your report. Group 38 fixes them next.
- [ ] Commit the changed model, component and template files.

### 38. Test Implementation — CRM spec updates
**Agent:** fe-test-coder
**Model:** sonnet — move spec mocks to the factories
**Depends on:** 37   **Parallel with:** none

- [ ] Update these specs to build model data with `frontend/src/app/core/testing/model-factories.ts`:
  - `features/person/person-list/person-list.component.spec.ts`
  - `features/chance/chance-list/chance-list.component.spec.ts`
  - `features/aktivitaet/aktivitaet-list/aktivitaet-list.component.spec.ts`
  - `core/services/person.service.spec.ts`
  - `core/guards/role.guard.spec.ts` (`BenutzerInfo`)
  - `layout/sidebar/sidebar.component.spec.ts`
- [ ] Keep every assertion's meaning. Change only the mock construction and its types.
- [ ] Acceptance: `cd frontend && npx tsc -p tsconfig.spec.json --noEmit` shows no errors in these files.
- [ ] Commit the changed spec files.

### 39. Model aliases — Agent tasks, Cron, Tickets, Szenario
**Agent:** fe-coder
**Model:** sonnet — alias swap plus the Ticket split
**Depends on:** 38   **Parallel with:** none

- [ ] In `frontend/src/app/core/models/{agent-task,cron,ticket,szenario}.model.ts`, replace the interfaces with `export type X = components['schemas']['Y']`, importing the type from `../api/api-types`. Keep all exported names:
  - `AgentTask`, `AgentTaskSummary`, `AgentTaskSource`, `AgentTaskStatus`
  - `CronRun`, `CronJob`, `CronJobLastRun`, `CronRunStatus`, `CronTrigger`. `cron.model.ts` keeps `export type { Page }`.
  - Add `TicketDetail` and `TicketListItem`. `Ticket` = `TicketDetail`. `TicketBoard` columns hold `TicketListItem`. `TicketSummary` stays. `TicketComment` stays. `TicketCreate` = `TicketCreateInput`. `TicketCommentCreate` = `TicketCommentInput`. The enum names `TicketOwner`, `TicketType`, `TicketStatus`, `TicketSolution`, `TicketCommentAuthor` stay.
  - `Szenario`, `ProzessDauer`; `SzenarioCreate` and `SzenarioUpdate` = `SzenarioInput`. Keep `PROZESS_SZENARIO_FELD` and `SzenarioProzessFeld` unchanged.
- [ ] Fix the consumers the compiler flags:
  - `features/admin/tickets/ticket-board.component.ts`: about 10 `Ticket[]` fields near line 869 become `TicketListItem[]`. Drop `?? 0` on `commentCount` (5 places) now that it is required.
  - `features/admin/tickets/ticket-detail.component.ts`
  - `features/admin/tickets/ticket-create.component.ts`
  - `features/admin/agent-tasks/{agent-tasks-dashboard,agent-task-list,agent-task-detail}.component.ts`
  - `features/admin/cron/cron-dashboard.component.ts`
  - `features/produktivitaet/rechner.component.ts`
  - any admin service signature that fails to compile
- [ ] Nullability rules (binding):
  - Forms keep `null`; widen control types to accept `null`; never convert to `''`.
  - Templates: change only what the compiler forces. Do not add `-` where the UI shows blank today.
  - No `!` and no `as` casts in feature code.
- [ ] Acceptance:
  - `cd frontend && npx ng build` passes with no NG8102 warnings.
  - The diff adds no `!.`, `as ` or `<any>` in feature code.
  - List the spec errors from `npx tsc -p tsconfig.spec.json --noEmit` in your report.
- [ ] Commit the changed files.

### 40. Test Implementation — admin spec updates
**Agent:** fe-test-coder
**Model:** sonnet — move spec mocks to the factories
**Depends on:** 39   **Parallel with:** none

- [ ] Update these specs to use `frontend/src/app/core/testing/model-factories.ts` and the new `TicketListItem`/`TicketDetail` types:
  - `features/admin/tickets/ticket-detail.component.spec.ts`
  - `features/admin/tickets/ticket-board.component.spec.ts`
  - `features/produktivitaet/rechner.component.spec.ts`
  - `features/admin/agent-tasks/{agent-task-list,agent-task-detail,agent-tasks-dashboard}.component.spec.ts`
  - `features/admin/cron/cron-dashboard.component.spec.ts`
  - `core/services/{ticket,agent-task,szenario,cron}.service.spec.ts`
- [ ] Keep every assertion's meaning.
- [ ] Acceptance: `cd frontend && npx tsc -p tsconfig.spec.json --noEmit` passes with zero errors.
- [ ] Commit the changed spec files.

### 41. Services via ApiClient — CRM, dashboard, auth
**Agent:** fe-coder
**Model:** sonnet — repetitive migration with a clear pattern
**Depends on:** 40   **Parallel with:** none

- [ ] In `frontend/src/app/core/services/{firma,person,abteilung,adresse,aktivitaet,chance,dashboard,auth}.service.ts`:
  - Replace every `this.http.*` call with `ApiClient` (`inject(ApiClient)`) and the literal spec path, for example `get('/firmen/{id}', { path: { id } })`.
  - Remove the `baseUrl` fields.
  - Keep public method names and signatures.
  - Keep request URLs, query params and bodies byte-identical to today, including `search=''` and `{}` bodies.
- [ ] No `!` and no `as` casts.
- [ ] Acceptance:
  - `npx ng build` passes.
  - `npx tsc -p tsconfig.spec.json --noEmit` passes.
  - These services contain no `this.http.`.
- [ ] Commit the eight files.

### 42. Services via ApiClient — Agent tasks, Cron, Tickets, Szenario
**Agent:** fe-coder
**Model:** sonnet — repetitive migration with a clear pattern
**Depends on:** 41   **Parallel with:** none

- [ ] In `frontend/src/app/core/services/{agent-task,cron,ticket,szenario}.service.ts`:
  - Replace every `this.http.*` call with `ApiClient` and the literal spec path.
  - Remove the `baseUrl` fields.
  - Keep public method names and signatures.
  - Keep URLs, query params and bodies byte-identical, including `{}` for `handToAi` and `{ comment }` for `wontDo`.
- [ ] `cron.service.ts`: type `TRIGGER_ENDPOINTS` as `Record<string, '/cron/agent-tasks' | '/cron/github-issues'>`. The fallback is the literal `'/cron/agent-tasks'`.
- [ ] Ticket return types:
  - `getBoard` → `TicketBoard`
  - `getAll` → `Page<TicketListItem>`
  - `getSummary` → `TicketSummary`
  - all others → `TicketDetail`
- [ ] No `!` and no `as` casts.
- [ ] Acceptance:
  - `npx ng build` passes.
  - `npx tsc -p tsconfig.spec.json --noEmit` passes.
  - `grep -rn "this\.http\." frontend/src/app/core/services` finds nothing.
- [ ] Commit the four files.

### 43. Test Implementation — ApiClient and service specs
**Agent:** fe-test-coder
**Model:** sonnet — spelled-out cases
**Depends on:** 42   **Parallel with:** none

- [ ] Create `frontend/src/app/core/api/api-client.spec.ts` using `HttpTestingController`:
  - the `/api` prefix
  - `{id}` replacement, with a number and with an encoded string
  - query params: `undefined` left out, `''` kept
  - a POST body
  - an optional body left out, and `{}` sent as `{}`
  - a 204 answer completes with void
- [ ] Adjust the service specs only where an expectation broke and the request is still byte-identical. Report any real URL or body difference instead of hiding it.
- [ ] Acceptance: `cd frontend && npx tsc -p tsconfig.spec.json --noEmit` passes.
- [ ] Commit the changed and new spec files.

### 44. Run frontend
**Agent:** fe-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 43 (rerun after any later change to `api-types.ts`)   **Parallel with:** backend runs

- [ ] Start only after every listed group has committed.
- [ ] `cd frontend && npm run test:ci && npx ng build`. Report any NG8102 warnings.
- [ ] `npx tsc -p tsconfig.spec.json --noEmit`.
- [ ] `cmp backend/src/generated/api-types.ts frontend/src/app/core/api/api-types.ts` must report no difference.
- [ ] `! grep -rn "this\.http\." frontend/src/app/core/services`.
- [ ] Report the results. Do not fix anything.

### 45. CLAUDE.md and openapi/README.md
**Agent:** ba-writer
**Model:** sonnet — prose from given requirements
**Depends on:** 34, 44   **Parallel with:** 46, 47, 48, 49

- [ ] `CLAUDE.md`:
  - "Adding a New Entity", backend steps:
    1. add paths and schemas in `openapi/`
    2. `cd backend && npm run api:generate`
    3. Drizzle schema plus `migrate.ts`
    4. a service using the generated types
    5. a route with its guard, then `specValidate` right before the handler
  - "Adding a New Entity", frontend: the model is an alias of the generated type; the service calls `ApiClient` with spec paths.
  - Coding Conventions → Backend:
    - Add a bullet: `openapi/` is the API source of truth; never hand-write request or answer types; `npm run api:check` must pass.
    - Authorization bullet: add `requireAgentTokenOrSession`.
    - Error responses bullet:
      - input error texts live in `x-error-messages`
      - unknown `/api` paths → 404 JSON
      - malformed JSON → 400; oversized body → 413
      - the phase filter error uses the standard shape
    - Testing bullet: the response check turns contract violations into 500 in test mode; name the contract tests, the coverage project and the golden fixtures.
  - Coding Conventions → Frontend: `ApiClient`, model aliases, and the nullability rule (forms keep `null`; no `!` or `as`).
  - Build & Run:
    - The "Backend only" line becomes `cd backend && NODE_ENV=development npx tsx --watch src/index.ts`.
    - Add `cd backend && npm run api:generate` and `npm run api:check`.
    - Note: `start.sh` and `start.bat` set `NODE_ENV=development` for the backend.
  - Contributor rules: when the check fails, regenerate and commit; on a merge conflict in a generated file, regenerate; never hand-merge.
  - Spec reading lists:
    - If the "Spec Reading Lists" table exists, add a row for `openapi/` (primary for `be-*`, `fe-*`, `be-test-*`, `fe-test-*`).
    - Otherwise add a bullet that names `openapi/` as the primary API source for those agents.
  - Do **not** edit `AGENTS.md`. Do not change the sync-agents CI claim; it is out of scope.
- [ ] `openapi/README.md`: bring the workflow section up to the final state.
- [ ] Commit both files.

### 46. SPECS-backend.md
**Agent:** ba-writer
**Model:** sonnet — larger rewrite with prose
**Depends on:** 34, 44   **Parallel with:** 45, 47, 48, 49

- [ ] `docs/specs/SPECS-backend.md`:
  - Directly under the title: "For signatures, the API contract (`openapi/`) wins."
  - Replace every endpoint table (Auth through Cron, plus Standard CRUD) with links to the area files.
  - Keep the pagination concept and the security mechanics.
  - Fix these errors:
    - `GET /tickets/board` and `GET /tickets/:id` use `requireAgentTokenOrSession` (any session).
    - `GET /tickets/summary` uses `requireAuth` only (no agent token).
    - The public routes are health, login, logout, and test-login in development and test only.
    - Document `requireAgentTokenOrSession`.
  - Stack: Zod → Ajv 2020 plus `ajv-formats`.
  - Rewrite Code Pattern, Validation pattern and "Adding a new entity":
    - `specValidate` after the guards
    - the error mapping and `x-error-messages`
    - the golden test
    - `PROCESS_STEP_COUNTS` → contract `minItems`
  - Describe the runtime modes (the allow-list `development`/`test`; anything else is production) and D1–D4.
- [ ] Commit the file.

### 47. SPEC-API-TASKS.md and SPEC-API-TICKETS.md
**Agent:** ba-writer
**Model:** sonnet — selective trimming with prose
**Depends on:** 34, 44   **Parallel with:** 45, 46, 48, 49

- [ ] In both files:
  - Add "For signatures, the API contract wins" plus links to `openapi/paths/{agent-tasks,cron,tickets}.yaml`.
  - Remove object field tables, per-endpoint request/answer schemas and duplicate JSON examples.
  - Replace the "Error response shape" section with a link to `ErrorResponse`.
  - Keep concepts, state machine, owner flow, seed data, auth mechanics, skill-author guidance and short curl walkthroughs.
- [ ] Commit both files.

### 48. Other specs
**Agent:** ba-writer
**Model:** sonnet — several small edits
**Depends on:** 34, 44   **Parallel with:** 45, 46, 47, 49

- [ ] `docs/specs/SPECS-frontend.md`: the model table becomes a pointer to the generated types plus one sentence on `ApiClient`. Mention the ticket and szenario models.
- [ ] `docs/specs/SPECS-testing.md`:
  - the response check in test mode
  - the contract tests: routes, route chain, access, lists, coverage project, golden, format parity, input completeness, runtime modes
  - how to read `[contract]` lines
  - the frontend model factories
- [ ] `docs/specs/SPECS-infrastructure.md`:
  - structure: `openapi/`, `backend/scripts/`, the generated folders, `.gitattributes`
  - dependencies: `zod` gone; `ajv`, `ajv-formats` (and later `swagger-ui-dist`) at runtime; `@redocly/cli`, `openapi-typescript` as dev tools
  - the CI step
  - a `NODE_ENV` modes table, including `start.sh` and `start.bat`
  - fix the workflow count: three files (`deploy.yml`, `agent-task-runner.yml`, `github-issue-agent.yml`); remove the `do-factory-automatic.yml` row
- [ ] `docs/specs/SPECS-database.md`, around line 245: replace "Validated by Zod on write" with "Validated against the API contract on write. Enum lists must match (contract-lists test)."
- [ ] `docs/specs/SPECS.md`: mention the contract in the index; tech stack Zod → Ajv.
- [ ] Commit the five files.

### 49. Agent definitions and CI prompts
**Agent:** skill-coder
**Model:** sonnet — edits across 9 agents and 4 prompts plus a sync
**Depends on:** 34, 44   **Parallel with:** 45, 46, 47, 48

- [ ] In `.claude/agents/{be-coder,be-reviewer,db-coder,be-test-coder,be-test-reviewer,fe-coder,fe-reviewer,fe-test-coder,fe-test-reviewer}.md`:
  - Replace the Zod lines (be-coder about lines 23, 32 and 39; be-reviewer about 32; db-coder about 66; be-test-reviewer about 46) with contract wording.
  - Add `openapi/` to each `## Specifications` list.
  - Checklists:
    - be-reviewer: `specValidate` after the guards; contract updated and regenerated; no hand-written DTOs
    - fe-reviewer: aliases, `ApiClient`, forms keep `null`, no `!` or `as`
    - test agents: golden and contract tests, typed model factories
- [ ] In `.claude/prompts/agent-{app-log,email,error-report,github-issue}.md`: where a prompt references API endpoints or docs, add "Signatures: `openapi/` (contract wins)."
- [ ] Run `node scripts/sync-agents.mjs`.
- [ ] Commit the exact changed paths under `.claude/agents/`, `.github/agents/` and `.claude/prompts/`.

### 50. Docs page (Should)
**Agent:** be-coder
**Model:** sonnet — small feature with clear gating
**Depends on:** 34   **Parallel with:** 45–49

- [ ] Add the runtime dependency `swagger-ui-dist` in `backend/`.
- [ ] `backend/src/app.ts`, inside `createApp(mode)`, only when `isDevOrTest(mode)`, before the `/api` catch-all:
  - `GET /api/openapi.json` → `res.sendFile` of `backend/src/generated/openapi.json`.
  - `GET /api/docs` serves your own HTML page that loads the local `swagger-ui-bundle.js` and `swagger-ui.css` from `/api/docs/assets/*`.
    - Use a custom inline initializer with `url: '/api/openapi.json'` and `withCredentials: true`.
    - Never use the package's default petstore initializer.
  - Load `swagger-ui-dist` with a dynamic `import()` inside the handler, cached after the first call. Production never loads it.
- [ ] Acceptance:
  - `tsc` passes.
  - Development: `/api/docs` returns HTML with no external asset hosts, and its assets return 200.
  - `/api/openapi.json` equals the generated file.
  - `createApp('production')` answers both paths with 404 JSON.
  - "Try it out" through `http://localhost:7200/api/docs` is a **manual human check** before merge.
- [ ] Commit `backend/src/app.ts`, `backend/package.json` and `backend/package-lock.json`.

### 51. Test Implementation — docs page
**Agent:** be-test-coder
**Model:** haiku — spelled-out additions
**Depends on:** 50   **Parallel with:** 52

- [ ] Create `backend/src/test/docs-page.spec.ts` (in-process, ephemeral ports):
  - `createApp('development')`: `GET /api/docs` → 200 `text/html` with no `http(s)://` asset hosts; asset URLs → 200; `GET /api/openapi.json` deep-equals the generated file.
  - `createApp('production')`: both → 404 JSON.
- [ ] Make sure `contract-routes.spec.ts`, `contract-route-chain.spec.ts` and `contract-coverage.spec.ts` exempt `/api/docs*` and `/api/openapi.json`. Edit their exemption lists only if they don't.
- [ ] Commit the changed spec files.

### 52. Docs page mention
**Agent:** ba-writer
**Model:** haiku — two short additions from given content
**Depends on:** 45, 46, 50   **Parallel with:** 51

- [ ] Add this line to `CLAUDE.md` (Build & Run) and to `docs/specs/SPECS-backend.md`: "Interactive API docs: http://localhost:7200/api/docs (development and test only; use port 7200, because direct calls to 7070 fail on CORS for non-GET requests)."
- [ ] Commit both files.

### 53. Final security review
**Agent:** be-reviewer
**Model:** opus — security-relevant sign-off for access control, validation and exposure gating
**Depends on:** all implementation and test groups (1–52)   **Parallel with:** none

- [ ] Review `git diff 75de728b623fb679563baa8927a1ca70e3e65d5e` for the backend, scripts and workflow. Report an explicit **PASS/FAIL with evidence** for each item:
  - **R11:** `specValidate` sits after the guards on every route; the route-chain and access tests cover it.
  - **R14:** the mode allow-list fails closed; the response check never throws; it is off in production; `CONTRACT_RESPONSE_CHECK=off` only works in test mode; the coverage file is written only when `CONTRACT_COVERAGE_FILE` is set.
  - **R18:** `middleware/auth.ts` and `agentAuth.ts` are unchanged, and the guard lists per route are unchanged; the access test covers every secured op, the loopback negatives and the no-fallthrough case.
  - **Gating:** test-login via `createAuthRouter(mode)`; the docs page only in development and test.
  - **Input:** `removeAdditional` works on a clone; no body coercion; path id pattern; the errorHandler body-parser mapping; the catch-all.
  - **Secrets:** none in `openapi/` or `backend/src/generated/`.
- [ ] Do not edit code. Any FAIL goes back to the owning group.

### 54. Verification — backend, performance, SC3, dependencies
**Agent:** be-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 53   **Parallel with:** 55

- [ ] Start only after every coder group has committed. No other Playwright, bench or `start.sh` run may be active.
- [ ] Run `cd backend && npm run api:check && npx tsc --noEmit && npx playwright test` (both projects).
- [ ] Performance:
  - Run `node scripts/bench-api.mjs --response-check=off` three times, then `node scripts/bench-api.mjs` three times. Never run them in parallel with Playwright.
  - Run `time npx playwright test`.
  - Compare with the group 3 baseline, which the orchestrator provides:
    - N1 with the check off: median delta per scenario under 2 ms.
    - N1 with the check on: report it separately.
    - Suite time at most +15%.
    - N2: startup delta under 1 s.
- [ ] SC3: `git diff --name-status 75de728b623fb679563baa8927a1ca70e3e65d5e -- 'backend/src/test/*.spec.ts'` lists only `A` (added) lines.
- [ ] Dependencies: diff `backend/package.json` against `75de728`.
  - Added runtime dependencies: only `ajv`, `ajv-formats`, `swagger-ui-dist`.
  - `zod` removed.
  - Added devDependencies: only `@redocly/cli`, `openapi-typescript`.
  - `frontend/package.json` dependencies unchanged.
- [ ] Secrets: run `grep -rnE 'test-agent-token|bench-token|ghp_|AGENT_API_TOKEN=|Bearer [A-Za-z0-9]{20,}' openapi backend/src/generated`. Expect no hits.
- [ ] Offline: run `grep -rn "https\?://" backend/src/openapi`. Expect no runtime fetches.
- [ ] Report a Markdown table for the PR description. Do not fix anything.

### 55. Verification — frontend
**Agent:** fe-test-runner
**Model:** haiku — runs fixed commands
**Depends on:** 53   **Parallel with:** 54

- [ ] Run `cd frontend && npm run test:ci && npx ng build` and report any NG8102 warnings.
- [ ] Run `npx tsc -p tsconfig.spec.json --noEmit`.
- [ ] `cmp backend/src/generated/api-types.ts frontend/src/app/core/api/api-types.ts` must report no difference.
- [ ] Run `cd backend && npm run api:check`, only after group 54's Playwright run has finished.
- [ ] `! grep -rn "this\.http\." frontend/src/app/core/services`.
- [ ] Report the results. Do not fix anything.

### 56. Verification — fresh clone, smoke, production start, Node 20.19
**Agent:** admin
**Model:** haiku — scripted local checks
**Depends on:** 54, 55   **Parallel with:** none (port 7070)

- [ ] Run `git worktree add <scratchpad>/fresh HEAD`. Run `npm ci` in `backend/` and `frontend/` there. Do **not** run `api:generate`.
- [ ] In the worktree, run `./start.sh`. It creates a fresh database in the worktree. Through `:7200`:
  - log in as admin
  - call GET on firmen, personen, abteilungen, adressen, aktivitaeten, chancen, dashboard, szenarien, agent-tasks, `tickets/board` and `cron/jobs`
  - expect 200 and no `X-Contract-Violation` header
  - the backend log shows no `[contract]` lines
  - `/api/docs` returns 200

  Stop it with `./end.sh`.
- [ ] `git -C <scratchpad>/fresh status --porcelain` shows no changes to tracked or generated files.
- [ ] In the worktree backend, run `NODE_ENV=production PORT=7073 npx tsx src/index.ts`:
  - `GET /api/health` → 200
  - `POST /api/auth/test-login` → 404 JSON
  - `GET /api/docs` → 404

  Then stop it.
- [ ] If `nvm ls 20.19` exists, run `npx tsc --noEmit` and the backend start check under Node 20.19. Otherwise report "not available".
- [ ] Remove the worktree.
- [ ] Report for the PR. Remind the human to click through the UI and to try "Try it out" once before merge.

### 57. Verification — drift demos for the PR
**Agent:** admin
**Model:** haiku — runs a fixed script in a throwaway worktree
**Depends on:** 56   **Parallel with:** none (port 7070)

- [ ] Run `git worktree add <scratchpad>/demo HEAD`, then `npm ci` in `backend/` and `frontend/`. Never touch the main tree.
- [ ] For each demo, record the command and the last 20 output lines, then run `git -C <scratchpad>/demo checkout -- .` and `git clean -fd` in the worktree:
  1. Rename `/firmen/{id}` to `/firma/{id}` in `openapi/paths/firmen.yaml` and in the `openapi/openapi.yaml` index. Run `cd backend && npm run api:generate`, then `cd frontend && npx ng build`. Expect TS2345 in `firma.service.ts`.
  2. Rename the param `/firmen/{id}` to `/firmen/{firmaId}` in both files. Regenerate, then `ng build`. Expect a type error in `firma.service.ts`.
  3. Append a space to `backend/src/generated/api-types.ts`, then run `npm run api:check`. Expect it to fail.
  4. Create `backend/src/generated/extra.json`, then run `npm run api:check`. Expect it to fail on the untracked file.
  5. Delete one `operationId`, then run `npm run api:check`. Expect a lint failure.
  6. Remove `personenCount` from `toDTO` in `backend/src/services/firmaService.ts`, then run `npx playwright test firmen-crud`. Expect a `[contract]` 500.
- [ ] Remove the worktree. Report a Markdown block for the PR description.

## Tests

### Unit Tests
- [ ] `getContractMode`: only an exact `development` or `test` turns checks on. Unset, `''`, `production`, `staging` and `Development` all mean production.
- [ ] `matchOperation`: static paths win over templated ones; query strings and trailing slashes are stripped.
- [ ] `mapAjvErrors`:
  - key rules: dot path, `missingProperty`, `_`, path param name
  - precedence: type beats length; overrides beat defaults
  - every D6 default text, with placeholders filled
- [ ] `checkResponse`: valid answer; missing field; undeclared status; 5xx and unknown op checked against `ErrorResponse`; 204 skipped; production skipped.
- [ ] `ApiClient`:
  - runtime: `/api` prefix, param encoding, `undefined` query skipped, `''` kept, `{}` sent, 204 gives void
  - compile time (`api-client.type-check.ts`): unknown path, missing path param, wrong method and missing required body all fail to compile
- [ ] `Page<T>` equals all nine generated page schemas (compile time).

### Integration Tests
- [ ] The existing backend suite passes unchanged with response checks on. Pre-existing spec files show only additions in the diff (SC3).
- [ ] Golden: same status, message, keys and texts as the Zod recording, apart from approved D6 replacements.
- [ ] Format parity: Ajv `email` and `uri` verdicts equal Zod's, apart from approved differences.
- [ ] Route match, and route chain (`specValidate` right before the final handler).
- [ ] Access:
  - every secured op returns 401 without credentials, even with an invalid body
  - every loopback-bypass op returns 401 when `X-Forwarded-For` is set
  - every admin op returns 403 for a USER session (cron returns 401)
  - the bypass works; a wrong token never falls through; a wrong cron bearer falls through without a GitHub call
- [ ] Lists: enums, query enums, sort fields, default sorts, roles and permissions match the code.
- [ ] Coverage: every op gets at least one 2xx (204 included), with exemptions listed and justified.
- [ ] Runtime modes in-process:
  - production: no test-login, no docs, broken answers pass through unchanged
  - development: header set, answer kept
  - test: 500
- [ ] Input completeness: every input field round-trips for each entity.
- [ ] Behavior changes D1, D3, D4, D5; docs page by mode.
- [ ] Frontend: strict `ng build` with no NG8102; spec `tsc`; the Karma suite with the factories.

### Edge Cases
- [ ] An extra `isAdmin` field is stripped and never stored or returned.
- [ ] `firmaId: "5"` is not coerced and gives 400.
- [ ] Ids `abc`, `0`, `-1` and `01` give 400 "Ungültige ID".
- [ ] Empty or `{}` bodies on logout, start, done, wont-do, hand-to-ai and reset are accepted.
- [ ] Login without a password gives 401 "Ungültige Anmeldedaten". Test-login without a user name gives 401 "benutzername required".
- [ ] `page=abc&size=abc` falls back to 0 and 10. `size=500` is capped at 200.
- [ ] `sort=bogus,asc` gives 400 "Ungültiges Sortierfeld: bogus".
- [ ] A repeated `search` on Chancen is tolerated.
- [ ] Malformed JSON gives 400 with `_`. A body over 100 KB gives 413. Other body-parser 4xx errors keep their status in the standard shape.
- [ ] Unknown `/api` paths and wrong methods give a JSON 404.
- [ ] `author=AGENT` with a session gives 403, and the contract declares it.
- [ ] A violation inside a session callback (login, logout) never crashes the server.
- [ ] The cron fallthrough test makes no GitHub call (`GH_DISPATCH_TOKEN=''`).
