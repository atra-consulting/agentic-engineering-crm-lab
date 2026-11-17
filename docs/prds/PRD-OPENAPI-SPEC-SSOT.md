# Specifications: OPENAPI-SPEC-SSOT

## Summary

### Business Summary
The CRM web app and the AI agents read and change data through many server addresses. Today four separate places describe these addresses, and they already disagree in small ways. This work creates one binding description, the "API contract", and makes the server, the web app and the automatic checks follow it. After this, most mismatches stop the automatic build before they reach users. The rest are limited to cases that no automatic test covers.

### Technical Summary
One hand-written OpenAPI 3.1 spec under repo-root `openapi/` describes every registered route exactly as it behaves today. A shared Ajv-based middleware sits after the existing guards in each route chain and validates path params and bodies against the bundled spec. It replaces all Zod schemas. Query params stay lenient in code, and the error contract and German messages stay the same. When `NODE_ENV` is `development` or `test`, the same mechanism also validates responses: test mode turns a mismatch into a 500, and development mode logs it and sets a header. Generated types are committed for both apps, frontend models become aliases, and the hand-written services call through a small typed `HttpClient` helper. CI fails on spec lint errors, on stale or untracked generated files, and on the new contract tests (route stack, access, enums, sort fields, golden errors, coverage).

## Source

- User request (2026-11-17): build one clean OpenAPI spec for the whole backend API and make it the single source of truth for backend and web app. Drift must make CI fail.
- The user already chose the approach: contract first, the server checks it at runtime, and no generated web app client. This PRD does not reopen that choice.
- Task key: OPENAPI-SPEC-SSOT.
- Based on a read of the code on 2026-11-17 (12 route areas plus the health check) and on backend, frontend and business reviews of the first draft.

## Problem Statement

Terms used here:
- **API**: the server addresses that the web app and the AI agents call.
- **API contract**: a set of files that lists every address, what it accepts, what it returns, and who may call it.
- **Drift**: the code and its description no longer match.

Four places describe the API today:
1. The server code.
2. Separate input rules on the server, such as "name is required".
3. The web app's own copies of the data shapes.
4. Three Markdown documents for people and AI agents.

Nothing checks these against each other, and they already drift. Examples:
- The web app says a company's industry, website and phone are always filled. The server can send them empty.
- The web app does not know the ticket field "fully ready" or the address type. The server sends both.
- The backend document says only admins may see the ticket summary. The code lets any logged-in user see it.
- The sales-phase filter returns errors in a different shape from every other error.

The effects:
- Bugs show up late, in the browser.
- AI agents read outdated documents and build against the wrong shape.
- Every new endpoint means editing four places by hand.

**What the result guarantees, and what it does not.**
- Automatic checks guarantee:
  - Every server address is in the contract, and the contract lists nothing extra.
  - The server accepts only input that matches the contract.
  - Every data shape the web app uses comes from the contract.
  - The access rule of every address gets tested.
- Not fully guaranteed:
  - The server checks its own answers only while the automatic tests run. An answer that no test triggers can still drift. The tests call every address at least once to keep this gap small.
  - Query options (paging, sorting, filters) keep their lenient handling in code. Tests compare the code's value lists with the contract, but not every combination.
  - The web app does not check sort values against the contract.

## Requirements

All requirements are "Must" unless marked "Should". The technical details are in the Technical Notes (TN).

### A. The contract

- **R1 — One contract for the whole API.** It covers every route the server registers, including health and the test-only login, which is marked "not in production". An automatic test compares both lists (R17).
- **R2 — Describe today, not a redesign.** Same addresses, field names, answers and access rules. Where the code and the old documents disagree, the code wins. Every deviation found goes to Decisions. No silent fixes.
- **R3 — Complete for each operation.**
  - Inputs: address parts, query options and the request body.
  - Outputs: every answer the operation can give. That includes "nothing to do", "not found", "conflict", input errors and access errors.
  - The shape of each answer, including which fields may be empty.
  - Fixed value lists appear as closed lists (TN6).
- **R4 — Paging and sorting as today.**
  - Page answers keep today's shape.
  - The sort option stays "field,direction", with the direction in any letter case.
  - Each list states its allowed sort fields and its default sort.
- **R5 — An access rule for each operation.** Each operation states exactly one of these rules:
  - public
  - any logged-in user
  - admin only
  - agent key
  - agent key or admin
  - agent key or any logged-in user
  - cron key or admin

  Special cases that the standard format cannot express appear as plain notes (TN5).
- **R6 — Easy to read and edit.** The files are hand-written and live in one top-level folder, one file per area. The format is OpenAPI 3.1 (TN1, TN2).
- **R7 — Quality gate on the contract.** A checker tests the contract against the standard plus project rules:
  - every operation has an ID, a summary, an access rule and its error answers
  - every list has its sort fields and default sort

  The gate requires zero errors.

### B. Server

- **R8 — One shared input check, after the access check.** The server checks address parts and request bodies against the contract. One shared check runs in every route, right after that route's access check. The old hand-written rules and the old validation library go away (TN3, TN4).
- **R9 — Query options stay lenient, in code.** The contract declares every query option and its allowed values. The server keeps today's handling in code: paging defaults, the sort check, and the filter checks with their own messages (TN3).
- **R10 — Error answers stay the same.**
  - Same answer type, same shape, same field names, same top-level messages and same German texts.
  - Proof: before the old rules go, the team records today's answers for a set of bad inputs. Afterwards the new check must give the same answers (TN4).
  - Allowed changes:
    - English default texts become German, as listed in the TN4 table.
    - When one request has two errors at once, a different error may come first.
- **R11 — Access check before input check.** As today, a caller without access gets "not logged in" or "forbidden", even when the input is also wrong.
- **R12 — Same tolerance as today.**
  - The server ignores unknown extra fields in a body and removes them before the business logic. Example: an "isAdmin" field has no effect.
  - Missing or bad paging values fall back to the defaults. Page sizes above 200 stop at 200.
  - A login without user name or password gets 401 "Ungültige Anmeldedaten", as today. A test login without a user name gets 401 "benutzername required", as today.
  - Empty bodies stay allowed where they are allowed today: start, done, won't do, hand to AI, reset and logout.
  - Any tightening needs a user decision (Decisions b).
- **R13 — Rules that need the database stay in the server logic.** Examples: "linked feedback entry must exist", "scenario name already taken", invalid ticket or task state changes. The contract lists these answers, and the rules stay in code.
- **R14 — The server checks its own answers in development and test only.**
  - An explicit list of modes switches the check on. Any other mode, or no mode at all, counts as production, and the check stays off (TN9).
  - Test mode: a wrong answer becomes an error answer that names the operation and the field, plus a log line. The tests then fail.
  - Development mode: the server logs the problem and marks the answer, but still sends the real answer.
  - Error answers get checked too. Empty answers do not.
  - The check never crashes the server (TN3).
  - The start scripts run the backend in development mode (D5, done).
  - For the benchmark only, `CONTRACT_RESPONSE_CHECK=off` switches the check off in test mode (Decisions (a) 17).
- **R15 — Server code uses generated types.** Request and answer shapes in the server code come from types generated from the contract. Hand-written copies go away, so the type check fails on drift.
- **R16 — Lists are defined once.** An automatic test fails on any difference between the contract and:
  - the server's value lists (database lists and filter checks)
  - the server's sort whitelist
  - the hardcoded users' roles and permissions
- **R17 — Routes match the contract.** Two automatic tests:
  - one compares every registered route with every contract operation
  - one confirms that every route runs the shared input check after its access check

  Only the docs pages are exempt (TN3).
- **R18 — Access rules get tested for every operation.**
  - The existing access checks stay the only enforcement. The contract describes them.
  - A test generated from the contract calls every operation without valid credentials and expects the refusal the contract names.
  - The same test calls every admin-only operation as a normal user and expects "forbidden". Cron triggers answer "not logged in", as today.
  - The test blocks the agents' local shortcut with forwarding headers or a wrong key. A separate test covers the shortcut itself.
  - A security reviewer signs off (TN5).

### C. Web app

- **R19 — Web app data shapes come from the contract.**
  - The model files become thin aliases of the generated types, and the import names stay.
  - Parts that exist only in the web app stay hand-written: the process defaults, the scenario field mapping, the generic page helper (with a build check against the contract's page shape), and the form value types (derived from the generated types and kept next to their form).
  - Tickets split into two shapes, "list item" and "detail" (TN7).
- **R20 — Services stay hand-written but checked.**
  - There is no generated client. All calls go through one small typed helper.
  - The build checks the address, the address parts, the query option names, filter values from fixed lists, the body and the answer type. A renamed or removed endpoint breaks the build.
  - Not checked: the sort value, which stays plain text.
  - Migrate one service at a time.
- **R21 — Fix the web app, not the contract.**
  - The aliases expose today's mismatches (TN7 table). Fix them in the web app code.
  - Empty values keep today's display and form behavior. Change only what the type check forces. Forms keep sending empty values as today, so stored data does not change. No forced type casts.
  - Update the unit tests that use model data, and make sure they pass.

### D. Generated files and workflow

- **R22 — Generated files live in the repository.**
  - The bundled contract, the server types and the web app types are committed and marked "generated, do not edit", together with the command that rebuilds them.
  - One command regenerates all three, and the web app offers the same command.
  - The start script and the web app build never regenerate. They use the committed files.
  - Reasons: everything works right after a clone, workshop participants never run the generator unless they change the API, and reviews show API changes as readable diffs.
- **R23 — CI blocks drift.** On every pull request and every push to main, CI fails when any of these happens:
  - the contract fails the quality gate
  - the generated files differ from a fresh generation, or are missing from the repository
  - the server type check fails
  - any test fails
  - the web app build fails

  The drift step runs before the type check and the tests.
- **R24 — Documented workflow and updated instructions.**
  - Workflow: change the contract, regenerate, implement the server, adapt the web app, test.
  - Contributor rules: when the local check fails, regenerate and commit. On a merge conflict in a generated file, regenerate. Never merge generated files by hand.
  - The "Adding a New Entity" recipe in the project instructions starts with the contract.
  - Backend, database, frontend and test agent definitions drop the old library and add the contract to their reading lists and checklists.
  - The CI agent prompts point to the contract for API signatures.
  - After any change to the agent definitions, run the sync script and commit both copies (TN10).

### E. Documentation

- **R25 — Markdown stops listing signatures.**
  - The backend spec and the two API reference documents drop their endpoint tables, field lists and duplicate examples, and link to the contract.
  - They keep what the contract cannot say well: state machines, the ask-and-answer flow, the owner model, seed data, how login and tokens work, guidance for skill authors, and short curl walkthroughs.
  - Each document states at the top: "For signatures, the API contract wins."
  - Fix the documentation errors listed in Decisions (a).
- **R26 (Should) — Interactive API docs, development and test only.** This comes last in the order.
  - A browsable page shows the contract, and the raw contract is available as a download.
  - A logged-in user can try calls through the web app's development address only.
  - It works offline and is off in every other mode (TN8).

## Special Instructions

- Do not reopen the chosen approach: contract first plus runtime checks, and no generated web app client.
- The code is the truth. No API redesign. Exceptions only through approved items in Decisions (b).
- When the contract work uncovers a code bug, record it in Decisions. Do not fix it silently here.
- Access control does not change. The existing checks stay the only enforcement. A security reviewer signs off on R11, R14 and R18.
- Keep the German domain names in addresses, fields and messages.
- Follow the project instructions in `CLAUDE.md`. `AGENTS.md` only points there, so do not edit it.
- "Production" means any server mode outside the allow-list (TN9). The repository has no hosted deployment today.
- Project rule: every commit for this PRD carries the footer "PRD: docs/prds/PRD-OPENAPI-SPEC-SSOT.md". Fill in the "Implementierung" section at the end.

## Implementation Approach (high-level, no code)

The order matters. The existing tests prove the contract right before the old checks go away.

1. **Record today's error answers.** Save the answers for a set of bad inputs as a fixed reference.
2. **Write the contract.** Take every route from the code, not from the old documents. The contract must pass the quality gate.
3. **Generate.** Build the bundled contract, the server types and the web app types. Add the regenerate command and the CI drift step.
4. **Turn on answer checks** in test mode and run the existing tests.
   - Contract wrong: fix the contract.
   - Code wrong: record it in Decisions. Do not fix it silently.
   - Repeat until the tests pass.
5. **Add contract tests:** route match, route chain, access, value lists, sort fields, coverage.
6. **Switch the input checks.** Compare the results with the reference from step 1. Remove the old rules and the old library.
7. **Server types.** Replace the hand-written shapes with generated types.
8. **Web app.** Aliases, the typed helper, fixes and unit test updates. This step can start after step 3. The final fixes wait for the contract corrections from step 4.
9. **Documents and instructions.** Trim the Markdown documents. Update the project instructions, agent definitions, prompts and area specs. Sync the agent copies.
10. **Docs page** (Should).

The decisions made in this PRD are listed in Decisions (a).

## Test Strategy

1. **Golden comparison.** Run the recorded bad inputs against the new check. Answers must match, apart from the approved German texts.
2. **Existing backend tests, unchanged, with answer checks on.** They must pass.
3. **Contract tests:**
   - route match and route chain
   - access: no credentials, normal user on admin-only, local shortcut
   - value lists, sort fields, roles and permissions
   - coverage: every operation gets called at least once with a success answer. A short exemption list is allowed, for example calls that need GitHub, and each entry gives a reason.
4. **Error and tolerance tests:**
   - missing, empty and wrongly typed fields
   - bad email and bad URL
   - a bad value from a fixed list in the body, and in a query option
   - a missing query option and a bad sort field
   - a wrong list length and a number out of range
   - an extra "isAdmin" field: ignored and not stored
   - a login without a password
   - empty bodies
   - refused before the input check
5. **Format comparison.** Run edge-case emails and URLs through the old check and the new one. Any difference goes to Decisions.
6. **Answer check test.** Feed one wrong answer to the check. Expect the error in test mode, the marker in development mode, and no check in production mode or with no mode set.
7. **CI drift step:** run the quality gate, regenerate, and catch changed or untracked files.
8. **Web app:** the strict build passes, and the updated unit tests pass.
9. **Drift demos,** recorded in the PR description:
   - a renamed endpoint breaks the web app build
   - a stale generated file fails CI
   - an untracked generated file fails CI
   - an invalid contract fails CI
10. **Manual smoke test:**
    - Fresh clone, start script, log in, open each area, try one call in the docs page through the web app address.
    - Start in production mode and with no mode: checks and docs page are off.
11. **Speed:** measure the baseline before the work starts and compare afterwards (N1, N2).

## Non-Functional Requirements

- **N1 — Speed.** Under 2 ms median added per request on a developer laptop. The backend test run with answer checks on takes at most 15% longer. Measure the baseline first and report both numbers in the PR.
- **N2 — Startup.** Loading the contract adds under 1 second to server start. Measure and report it the same way.
- **N3 — Platform.** Node.js 20.19 or newer. CI uses the pinned version (22). Commands work on macOS, Linux and WSL.
- **N4 — No new services.** No network calls at runtime and no external content network. Everything works offline.
- **N5 — Libraries.** New runtime libraries only for the input check and the docs page. (Revised: no format add-on; see Decisions (a) 17.) The generator and the linter are developer tools only.
- **N6 — Security.** Who may call what stays the same. The local agent shortcut stays the same. The test login, the docs page and the answer checks are off in production. The contract contains no secrets.
- **N7 — Clarity.** Every generated file says it is generated and names the command that rebuilds it.

## Success Criteria

- **SC1 (R1, R17)** — The route-match test and the route-chain test pass.
- **SC2 (R3–R7)** — The quality gate reports zero errors, with its rules for ID, summary, access rule, error answers and sort fields. There is one source file per area.
- **SC3 (R2)** — The existing backend tests pass with zero changed assertions, apart from approved D-items. Decisions lists every deviation found.
- **SC4 (R8, R10)** — The golden comparison passes. The old validation library is gone from the server code and its dependencies.
- **SC5 (R9, R16)** — The equality tests pass for value lists, sort fields, roles and permissions.
- **SC6 (R11, R18)** — The access test passes for every non-public operation, including "refused before the input check". The shortcut test passes.
- **SC7 (R12)** — The tolerance tests pass.
- **SC8 (R13)** — The tests for database rules pass, and the contract lists those answers.
- **SC9 (R14)** — The answer check test passes in all modes. The existing tests pass with the checks on.
- **SC10 (R15)** — The server type check passes. Routes and services hold no hand-written request or answer shapes.
- **SC11 (R19, R21)** — Model files hold only aliases and web-app-only parts. All imports compile. No forced casts were added. The updated unit tests pass.
- **SC12 (R20)** — All calls in the 12 web app services go through the typed helper. The PR records the renamed-endpoint demo.
- **SC13 (R22)** — A fresh clone plus the start script works without the generator. The web app build does not regenerate.
- **SC14 (R23)** — CI has the drift step. The PR records the CI demos.
- **SC15 (R24)** — "Adding a New Entity" starts with the contract. Agent definitions, prompts and the synced copies are updated and committed.
- **SC16 (R25)** — The Markdown documents hold no signature tables, link to the contract and say "contract wins". The documentation errors from Decisions (a) are fixed.
- **SC17 (R26, Should)** — The docs page works through the web app address in development mode and is absent in the other modes.
- **SC18 (N1, N2)** — The PR reports the baseline and the new numbers, within the limits.
- **SC19 (N3)** — CI passes on the pinned Node version. One manual run on Node 20.19 passes.
- **SC20 (N4, N5)** — The dependency changes add only the allowed runtime libraries. The app works with the network off.
- **SC21 (N6)** — The access test passes. The test login, docs page and answer checks are off in production mode. The contract holds no secrets.
- **SC22 (N7)** — Every generated file names its command.

## Decisions

### (a) Decided in this PRD
1. Format: OpenAPI 3.1 (TN1).
2. Location: one top-level folder, one file per area (TN2).
3. Generated files are committed. The web app build never regenerates (TN2).
4. Tool home: the server project's developer tools. The web app has a command that delegates to them (TN2).
5. Input check: one shared check of our own, after each route's access check. The off-the-shelf validator that runs before all routes is rejected (TN3).
6. Query options: the contract declares them, the code checks them as today, and equality tests guard drift (TN3).
7. Unknown body fields: removed and ignored (TN3).
8. A request with two errors may report a different error first. Accepted.
9. Answer checks: test mode fails, development mode warns, every other mode is off (TN3, TN9). Exception for the benchmark: `CONTRACT_RESPONSE_CHECK=off` in test mode (see 17).
10. Access: the existing checks stay the only enforcement, backed by a generated access test (TN5).
11. The address type stays free text, up to 50 characters.
12. User roles and permissions become closed lists taken from the hardcoded users, with an equality test.
13. Tickets get two shapes, list item and detail (TN6, TN7).
14. Web app sort values stay plain text and are not checked.
15. Interactive docs: "Should", built last (TN8).
16. Documentation errors to fix under R25, no decision needed:
    - The backend spec gives the wrong access rules for the ticket board, ticket detail and ticket summary.
    - The backend spec says "all routes require authentication", which is not true.
    - The backend spec does not mention the "agent key or any user" check.
    - The frontend spec's model table is incomplete.
    - The infrastructure spec gives the wrong workflow count.
    - The database spec still says "validated by Zod".
17. Decided during implementation (2026-11-17):
    - No `ajv-formats` (deviation from TN3). Custom `email` and `uri` formats reproduce the old Zod 4 verdicts. The format-parity test proves it on 67 recorded inputs. Reason: data stored today stays savable.
    - Unknown enum values from the database pass through with a log warning, as before. No crash. Summaries count only contract keys.
    - Lengths count UTF-16 units (`unicode: false`), as Zod did.
    - Contract lookup ignores letter case, like Express routing.
    - Integer ids in bodies get an upper limit (largest safe integer), as Zod's `.int()` did.
    - `CONTRACT_RESPONSE_CHECK=off` turns the answer check off in test mode only. It exists for the benchmark (N1 without the check). Development and production ignore it.
    - The agent definitions no longer recommend `requirePermission`, which does not exist.

### (b) User decisions

The user approved D1–D6 as recommended on 2026-11-17. D7 came up during implementation and is open for confirmation in the PR.

- **D1 — Sales-phase filter error.** Today a wrong phase returns an error in a different shape from all other errors. Proposal: use the standard shape and keep the text. **Recommend: yes.**
- **D2 — Record numbers in addresses.** Today a non-number such as "abc" gives an unclear result: "not found" or a server error. Proposal: return "invalid input" for the field "id" with a German text. Zero and negative numbers get the same answer. **Recommend: yes.**
- **D3 — Unknown addresses.** Today an unknown server address returns a web page, not data. In production the test login also has its own special "not found" answer. Proposal: one standard "not found" answer for every unknown address, and remove the special test-login answer. **Recommend: yes.**
- **D4 — Broken or oversized requests.** Today unreadable data and oversized data both give "server error". Proposal: "invalid input" for unreadable data and "too large" for oversized data, both in the standard shape. **Recommend: yes.**
- **D5 — Development mode switch.** Today the start script sets no mode, and the test login stays open in every mode except production, including when no mode is set. Proposal: the start script sets development mode, and the test login, docs page and answer checks all follow the same allow-list. Effect: without a mode, all three are off. Without this decision, the start script runs with answer checks and the docs page off. **Recommend: yes.**
- **D6 — German texts.** Confirm the replacement table in TN4. **Recommend: accept as written.**
- **D7 — Array bodies on empty-body operations (found during implementation, needs your confirmation).** `logout`, `startTicket`, `startAgentTask`, `resetTickets`, `resetAgentTasks` and `handTicketToAi` take an optional empty object. Today a JSON array as body is ignored. Now it answers 400 "Validierungsfehler" with `fieldErrors._` = "Ungültige Anfrage". No client sends arrays. This is a tightening, so R12 needs your approval. **Recommend: accept.** Alternative: allow arrays in the contract for these six operations.

### (c) Found, out of scope
- The server's cross-origin settings allow neither the PATCH method nor the agent-key header. Same-origin use through the web app address works. That is why the docs page works only there.
- The two cron trigger addresses change data on a plain GET request that carries an admin session cookie. This is a cross-site request risk.
- `CLAUDE.md` claims that CI runs the agent-sync check. The CI workflow has no such step.
- `CLAUDE.md` names Turso cloud as the production database, but the repository has no hosted deployment (Vercel was removed in c8a9ced).
- `CLAUDE.md` names an `engine` workflow input that no workflow has.
- Found while writing the contract (the contract documents today's behavior):
  - Create or update with a `firmaId` that does not exist hits the foreign key and answers 500.
  - `listAbteilungPersonen` answers 404 for an unknown id, `listFirmaPersonen` an empty page.
  - An unknown sort direction silently falls back to the default.
  - A login with a non-string `passwort` answers 500 (bcrypt throws).
  - test-login answers 401 in English ("benutzername required").
  - The dashboard sums won opportunities across currencies without conversion.
  - The dashboard `personName` is null if one name part is missing; the other answers join the parts present.
  - `completeCronRun` overwrites any run status, including finished or skipped runs.
  - Setting a ticket to DONE always sets `solution=DONE`, even for a WONT_DO ticket.
  - `done` and `wont-do` with an empty comment store an empty comment. `completeTicket` stores the comment as AGENT even for an admin caller.
  - The health timestamp ends with `Z`, the error timestamps do not.
  - `personName` on Adresse and Aktivitaet is `""` when the first name is an empty string.
- `session.ts` hardens the cookie and the secret only for literal `NODE_ENV=production`. With no mode set, the contract mode is production, but the session is not hardened.
- The generic 500 handler echoes `err.message`, for example a rejected CORS origin.
- Body validation collects all errors. A large invalid array (up to 100 KB, logged-in routes only) builds many error objects before mapping.
- `githubRunUrl` accepts any URL scheme, as with Zod. The cron dashboard binds it with `[href]`, and Angular sanitizes `javascript:` URLs.
- Seed agent task 13 mentions the removed `validation.ts`. It is workshop content about an already fixed bug, so it stays.

### (d) Later
- A warning at development start when the contract source is newer than the generated files.

## Technical Notes (optional)

**TN1 — Version: OpenAPI 3.1.0.**
- Nullable fields use type arrays, which generate exactly `T | null`.
- In 3.1, Security Requirement Objects may list role names for non-OAuth schemes. So `sessionCookie: [ADMIN]` expresses `requireRole('ADMIN')`.
- Schemas are JSON Schema 2020-12, so the Ajv 2020 dialect compiles them directly.
- Register the OAS keywords `example`, `discriminator`, `xml` and `externalDocs`, and the vendor `x-*` keywords, as annotations.
- Redocly CLI and openapi-typescript 7 support 3.1.
- Fallback to 3.0.3 only if the tooling trial finds a blocker. That changes the nullable notation, the role notation and the Ajv mode.

**TN2 — Layout and tooling.**
- Source:
  - `openapi/openapi.yaml`: info, `servers` set to `/api`, security schemes, tags and path refs.
  - `openapi/paths/<area>.yaml`: one per route file in `backend/src/routes/` (12), plus one for health, which lives inline in `app.ts`.
  - `openapi/schemas/<area>.yaml`.
  - `openapi/common.yaml`: ErrorResponse, PageMeta, the page/size/sort parameters and the standard error responses.
- Generated and committed:
  - `backend/src/generated/openapi.json`, the bundled spec. The runtime reads it with `readFileSync`, the same way `app.ts` reads `package.json`.
  - `backend/src/generated/api-types.ts`.
  - `frontend/src/app/core/api/api-types.ts`.
  - Each file has a header that names the command. Mark all three `linguist-generated` in `.gitattributes`.
- Tooling: Redocly CLI and openapi-typescript 7 as devDependencies in `backend/package.json`, with two scripts.
  - `api:generate` builds all three outputs.
  - `api:check` lints, generates, and then fails on any changed or untracked file under the output paths. It uses `git status --porcelain`, not only `git diff`.
  - `frontend/package.json` gets an `api:generate` script that delegates to the backend script.
  - `ng build`, `ng serve` and Karma never regenerate.

**TN3 — Runtime mechanism.**
- At startup:
  - Load the bundled spec.
  - Compile Ajv (2020 dialect) validators per operation: one for path params, one for the request body, and one for each declared response status.
- Request check:
  - The shared middleware (for example `specValidate`) sits after the guards in each route chain.
  - It finds its operation through `req.baseUrl`, `req.route.path` (Express `:id` maps to spec `{id}`) and the method.
  - A route without a matching operation fails the route-chain test.
- Route-chain test: walk the Express 4 router stack and assert that every `/api` route has `specValidate` after its guards. Only the docs routes are exempt.
- Coercion:
  - Path params are never coerced. They are declared as `type: string` with the pattern `^[1-9][0-9]*$` (revised during planning), so the validated value equals what `parseInt` uses.
  - Bodies are never coerced: a string "5" for `firmaId` stays a 400, as today.
- Unknown fields:
  - Use `removeAdditional: 'all'` on request bodies only.
  - Validate a deep clone and write the stripped clone back to `req.body`.
  - Request-body schemas must not use `allOf`, because `removeAdditional: 'all'` strips properties defined in sibling subschemas.
  - Test with an extra `isAdmin` field: create returns 2xx, and the field is neither stored nor returned.
- Optional bodies: set `requestBody.required: false` for start, done, wont-do, hand-to-ai, reset and logout.
- Login and test-login:
  - The contract declares their fields as optional strings, for the types and the docs.
  - A per-operation flag (for example `x-skip-request-validation`) skips the check.
  - Missing fields keep 401 with today's messages: "Ungültige Anmeldedaten", "benutzername required", "Benutzer nicht gefunden".
- Query params:
  - No generic validation.
  - The contract declares types, enums and `x-sort-fields`.
  - The code keeps `parsePaginationParams`, `parseSort` and the inline enum checks in `agentTasks.ts`, `tickets.ts` and `chancen.ts`, with their value-bearing messages.
  - The R16 tests compare the contract with `enums.ts` and `ALLOWED_SORT_FIELDS`.
- Formats:
  - ~~Use `ajv-formats` for `email` and `uri`.~~ Superseded (Decisions (a) 17): custom `email` and `uri` formats reproduce the Zod 4 verdicts. `email` also accepts the empty string through `anyOf`. `uri` is for the cron `githubRunUrl`, which was `z.string().url()`.
  - Before removing Zod, run an edge-case corpus through both checkers.
- Response check:
  - Wrap `res.json` per request, only in allowed modes.
  - Validate against the schema declared for the actual status. That includes ErrorResponse for 4xx and 5xx, and the catch-all 404.
  - Skip 204 answers and headers.
  - Never throw. Login and logout call `res.json` inside session callbacks, where a throw would be uncaught.
  - Test mode: the wrapper itself sends a 500 in the standard shape, naming the operationId, the JSON pointer and the reason, and logs it.
  - Development mode: log it, set `X-Contract-Violation`, and send the real body.
- Not used for requests: express-openapi-validator, although it supports 3.1 from v5.4 ([repository](https://github.com/cdimascio/express-openapi-validator), [PR #882](https://github.com/cdimascio/express-openapi-validator/pull/882)). Reasons:
  - It mounts at app level, before the in-router guards, so callers would get 400 before 401/403.
  - It rejects loopback-bypass calls.
  - It cannot express either-or auth with fallthrough.
  - The plan may trial it for responses only. Prefer one mechanism of our own for both.

**TN4 — Error mapping.**
- Ajv runs with `allErrors: true`. The mapper keeps one message per path, in this order: required or type, then const or enum, then format, then length, range and items.
- Keys:
  - dot path inside the body, for example `humanSteps.works` or `humanSteps.works.3`
  - a missing property uses its own name
  - a body that is not an object uses `_`
  - path params use their name, for example `id` or `firmaId`
- The top-level message for body and path errors is "Validierungsfehler".
- Texts live in `x-error-messages` on each property, keyed by Ajv keyword, with placeholders for limits.
- Golden fixture:
  - Covers every body schema: the six CRUD bodies, Szenario, ticket create/status/owner/ask/done/wont-do/comments, agent-task reject/done, and cron complete.
  - Capture today's Zod answers before removal and commit them.
  - The new mapper must match status, message, keys and texts, except for the rows below.
- Replacements for today's English Zod defaults (D6):

| Case | Fields | New text |
|---|---|---|
| Field is missing or has the wrong type, where a German "empty" text already exists | name, firstName, lastName, firmaId, subject, datum, titel, title, body (ticket), question, body (comment), email | the existing text, for example "Name ist erforderlich" |
| Text too long | all `maxLength` fields | "Maximal {limit} Zeichen" |
| Number out of range | latitude, longitude, wahrscheinlichkeit | "Muss zwischen {min} und {max} liegen" |
| Whole number expected | wahrscheinlichkeit, tasksSolved, tasksRejected | "Muss eine ganze Zahl sein" |
| Negative count | tasksSolved, tasksRejected | "Darf nicht negativ sein" |
| Positive ID expected | abteilungId, personId, kontaktPersonId, agentTaskId, path `id` (D2) | "Ungültige ID" |
| Yes/no expected | handBackToAi, clearFullyReady, fullyReady | "Muss true oder false sein" |
| Reject comment missing or empty | comment (agent task) | "Kommentar ist erforderlich" |
| Cron callback status | status | "Ungültiger Status" |
| Cron callback URL | githubRunUrl | "Ungültige URL" |
| Any other wrong type | all other fields | "Ungültiger Wert" |
| Body not a JSON object | `_` | "Ungültige Anfrage" |

- Enum fields with a Zod `error` option (typ, phase, type, status, owner, author) already return German for missing values. They keep their texts.
- Service-level `ValidationError`s stay unchanged, for example "Feedback-Eintrag mit ID X nicht gefunden".
- Zod to remove:
  - `backend/src/utils/validation.ts`: the six CRUD schemas, `SzenarioSchema`, `validate()` and `PROCESS_STEP_COUNTS`. No other code imports `PROCESS_STEP_COUNTS`; only `SPECS-backend.md` mentions it.
  - `backend/src/services/cronService.ts`: `CompleteRunBodySchema` and `CompleteRunBody`.
  - `backend/src/routes/agentTasks.ts`: `RejectBodySchema` and `DoneBodySchema`.
  - `backend/src/routes/tickets.ts`: seven inline schemas.
  - Services switch their `*CreateDTO` imports to generated types.
  - Drop `zod` from `backend/package.json`. `ValidationError` and `errorHandler.ts` stay.

**TN5 — Security schemes and the access test.**
- Mapping from today's guards:
  - public → `security: []`
  - `requireAuth` → `sessionCookie` (apiKey, cookie `JSESSIONID`)
  - `requireAuth` + `requireRole('ADMIN')` → `sessionCookie: [ADMIN]`
  - `requireAgentToken` → `agentBearer` (http bearer) or `agentHeader` (apiKey `X-Agent-Token`)
  - `requireAgentTokenOrAdminSession` → `agentBearer`, `agentHeader` or `sessionCookie: [ADMIN]`
  - `requireAgentTokenOrSession` → `agentBearer`, `agentHeader` or `sessionCookie`
  - `requireCronAuth` → `cronBearer` (http bearer, `CRON_SECRET`) or `sessionCookie: [ADMIN]`
- Notes in the operation descriptions, for what OpenAPI cannot express:
  - A wrong agent token never falls through to the session. The caller gets 401.
  - A wrong `CRON_SECRET` does fall through to the admin session. A non-admin session gets 401, not 403.
  - `POST /api/tickets/{id}/comments` returns 403 when `author=AGENT` comes with a session. Add this 403 to the contract.
- `x-loopback-bypass: true` goes only on operations guarded by `requireAgentToken`, `requireAgentTokenOrAdminSession` or `requireAgentTokenOrSession`, not on cron.
- Access test, generated from the bundled spec:
  - Every non-public operation: no cookie, a wrong `X-Agent-Token` and an invalid body. Expect 401.
  - Every `[ADMIN]` operation: a USER session, no token, and `X-Forwarded-For` to block the bypass. Expect 403, or 401 for the cron triggers.
  - A wrong token cannot be used in the 403 case, because it would return 401 first.
  - `globalSetup` sets `AGENT_AUTH_ALLOW_LOOPBACK=1`. One separate test covers the bypass.

**TN6 — Shapes.**
- Pages: a shared `PageMeta` plus one page schema per entity through `allOf`. `allOf` is fine in responses; it is banned only in request bodies.
- Tickets:
  - `TicketDetail` carries `comments`, `TicketListItem` carries `commentCount`.
  - The board and the paged list return list items.
  - `TicketSummary` has fixed keys per enum.
- `Firma.adressen` appears only on the single-record read.
- Services type enum fields as `string` today. The generated types narrow them, so the `toDTO` functions need fixes.
- Szenario arrays use `minItems`/`maxItems`: 19/19/11/2 for the work steps, and one less for the wait steps.
- Answers:
  - 204 for both `/next` endpoints when nothing is left, and for deletes.
  - Logout returns `{}`.
  - Login sends `Set-Cookie`.
- Closed lists and plain strings:
  - Adresse `typ` is a string with `maxLength` 50.
  - `rollen` is a closed list: `ROLE_ADMIN`, `ROLE_USER`.
  - `permissions` is a closed list of the 7 values in `config/users.ts`.
- No `date-time` or `date` formats. Fixture timestamps use a space separator, error timestamps have no `Z`, and `datum` and `erwartetesDatum` accept any non-empty string.

**TN7 — Web app.**
- Alias mapping (schema names are proposals; the plan decides):

| Model file | Generated schema(s) | Notes |
|---|---|---|
| firma | Firma, FirmaInput, FirmaAdresse | FirmaAdresse.typ becomes free text |
| person | Person, PersonInput | — |
| abteilung | Abteilung, AbteilungInput | — |
| adresse | Adresse, AdresseInput | address form keeps a stricter type of its own |
| aktivitaet | Aktivitaet, AktivitaetInput, AktivitaetTyp | — |
| chance | Chance, ChanceInput, ChancePhase | — |
| dashboard | DashboardData, RecentChance, RecentAktivitaet | — |
| auth | LoginRequest, LoginResponse, BenutzerInfo | — |
| agent-task | AgentTask, AgentTaskSummary, enums | — |
| cron | CronRun, CronJob, CronJobLastRun, enums | — |
| ticket | TicketDetail, TicketListItem, TicketBoard, TicketSummary, TicketComment, inputs, enums | `Ticket` splits into two shapes |
| szenario | Szenario, SzenarioInput, ProzessDauer | `PROZESS_SZENARIO_FELD` and `SzenarioProzessFeld` stay |
| page | PageMeta | `Page<T>` stays generic, with a compile-time equality check |
| prozess-defaults | — | web app only |

- Verified mismatches (web app today compared with the code):

| Model | Web app today | Code |
|---|---|---|
| Firma | industry, website, phone, email, notes always text | nullable |
| FirmaAdresse | typ is the closed list HAUPTQUARTIER / NIEDERLASSUNG | free text |
| Adresse | street, houseNumber, postalCode, city, country always text; no typ or timestamps | nullable; has typ and timestamps |
| AdresseCreate | street, postalCode, city required | all optional |
| Person | email, phone, position, notes, firmaName always text | nullable |
| Abteilung | description, firmaName always text; no timestamps | nullable; has timestamps |
| Chance | beschreibung, wert, wahrscheinlichkeit, erwartetesDatum, firmaName always set | nullable |
| ChanceCreate | phase required | optional |
| Aktivitaet | description always text; no updatedAt | nullable; has updatedAt |
| Ticket | one type for detail and list item; no fullyReady | two shapes; fullyReady always present |
| TicketCreate, TicketCommentCreate | no agentTaskId, fullyReady, clearFullyReady, author | optional fields |

  AgentTask, Cron, Dashboard, Auth and Szenario match today. The plan re-checks them.
- Nullability rule (revised after the plan review, 2026-11-17):
  - Change only what the compiler forces, for example pipes or inputs that reject `null`.
  - Templates keep today's output. No new "-" placeholders where the UI shows blank today.
  - Forms keep `null`. Patching `''` would change the stored data from NULL to an empty string.
  - No `!` assertions and no `as` casts in feature code. The typed helper's internals are exempt.
- Ticket service mapping:
  - `getBoard` → TicketBoard, with TicketListItem columns.
  - `getAll` → page of TicketListItem.
  - `getSummary` → TicketSummary.
  - `getById`, `create`, `setStatus`, `setOwner`, `handToAi`, `wontDo` and `addComment` → TicketDetail.
- Typed helper:
  - About 40 lines in `frontend/src/app/core/api/`.
  - Wraps `HttpClient`, so interceptors and `HttpTestingController` keep working.
  - The path argument is the literal spec key, for example `/firmen/{id}`. The helper adds `/api`, and the services drop their `baseUrl` fields.
  - Types cover paths per method, path params, query names and enum values, the request body and the 2xx JSON answer.
  - It handles 204/void answers, optional `{}` bodies and the optional `comment`.
  - It does not use the openapi-fetch runtime.
  - `sort` stays a plain string.
  - About 64 call sites in 12 services. Migrate one service at a time.
- Generator settings:
  - Types only: no runtime enums, and no tuples from `minItems`/`maxItems`.
  - `isolatedModules` is on, so aliases use `export type`.
- Form value types live next to their form and derive from the generated input types through `Required<Pick<…>>`.
- About 18 Karma spec files use typed mocks and will break. fe-test-coder updates them. Consider small typed mock factories per model.

**TN8 — Docs page.**
- Swagger UI from npm (`swagger-ui-express` or `swagger-ui-dist`) at `/api/docs`, plus `/api/openapi.json`.
- Both run only in allow-list modes and are exempt from validation and from the route-match test.
- "Try it out" works only through :7200, the Angular proxy, which is same origin.
- On :7070 directly, the CORS middleware rejects the page's own origin for non-GET calls, which leads to a 500. Fixing CORS is out of scope.

**TN9 — Runtime modes and CI.**
- The allow-list `NODE_ENV ∈ {development, test}` gates the response check, `/api/docs` and `/api/openapi.json`. It fails closed: an unset or unknown value means production behavior.
- Before this change:
  - `start.sh` set no `NODE_ENV`.
  - test-login was registered whenever `NODE_ENV !== 'production'`, so it was open when `NODE_ENV` was unset.
- Done (D5): test-login follows the allow-list, and `start.sh` and `start.bat` start the backend with `NODE_ENV=development`.
- The session cookie's `secure` flag and the secret warning react only to `production`, so they are unaffected.
- Playwright `globalSetup` already sets `NODE_ENV=test`.
- CI:
  - `.github/workflows/deploy.yml` only tests and builds.
  - Add `npm run api:check` right after the backend `npm ci` and before `tsc --noEmit`.

**TN10 — Files to update.**
- `CLAUDE.md`:
  - "Adding a New Entity" (about line 71)
  - Coding Conventions → Backend: validation, error responses, testing
  - the Spec Reading Lists table: add the contract
  - Do not edit `AGENTS.md`.
- Specs:
  - `SPECS-backend.md`: endpoint tables become a link. Update Stack, Code Pattern, Validation pattern and Adding a new entity, and fix the access errors.
  - `SPEC-API-TASKS.md` and `SPEC-API-TICKETS.md`.
  - `SPECS-frontend.md`: the model table becomes a pointer to the generated types plus one sentence on the helper.
  - `SPECS-testing.md`: answer checks and the contract tests.
  - `SPECS-infrastructure.md`: structure, dependencies, CI and modes; fix the workflow count.
  - `SPECS-database.md`: the line "Validated by Zod on write", about line 245.
  - `SPECS.md`.
- Agent definitions in `.claude/agents/`: `be-coder`, `be-reviewer`, `db-coder`, `be-test-coder`, `be-test-reviewer`, `fe-coder`, `fe-reviewer`, `fe-test-coder`, `fe-test-reviewer`. Update reading lists and checklists, then run `node scripts/sync-agents.mjs` and commit `.github/agents/`.
- Prompts: `.claude/prompts/agent-*.md`. Four of the five reference `/api/` or `docs/specs`. Point them to the contract for signatures.

**TN11 — Remaining risk.**
- Response checks see only the answers the tests produce. The coverage gate ensures every operation runs at least once, but not every status code.
- The golden comparison and the error tests cover input errors. The access test covers 401 and 403.
- Web app sort strings stay unchecked.

## Implementierung

- Pull request: [#207](https://github.com/atra-consulting/agentic-engineering-crm-lab/pull/207) (against `main`, not merged; D7 open for confirmation)
- All commits: [`75de728...openapi-spec-ssot-spec-first-types-validation`](https://github.com/atra-consulting/agentic-engineering-crm-lab/compare/75de728...openapi-spec-ssot-spec-first-types-validation)
- Key commits:
  - Tooling: [`f055005`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/f055005) `api:generate` / `api:check`, [`ebc59de`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/ebc59de) full contract + CI drift check
  - Contract: [`aa0bc0c`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/aa0bc0c), [`00a41d2`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/00a41d2), [`e0395cf`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/e0395cf), [`8f11692`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/8f11692), [`65abb15`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/65abb15), [`5b4b2c2`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/5b4b2c2)
  - Runtime: [`b182265`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/b182265) Ajv core, [`286b536`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/286b536) `specValidate`, [`9ca732d`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/9ca732d) `createApp` + response check, [`c670b5c`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/c670b5c) D1/D3/D4/D5
  - Zod removal: [`e3c5026`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/e3c5026), formats [`5f0221c`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/5f0221c)
  - Frontend: [`2a65f60`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/2a65f60) typed `ApiClient`, [`046e152`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/046e152) + [`30f0b7a`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/30f0b7a) model aliases, [`00fefbe`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/00fefbe) + [`ebc59d8`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/ebc59d8) services via `ApiClient`
  - Docs page: [`eda6177`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/eda6177)
  - Review fixes: [`d6cafb0`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/d6cafb0), [`1517f0d`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/1517f0d) case-insensitive lookup; review report [`ccc2dcc`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/ccc2dcc)
  - Doc sync: [`f7c87ef`](https://github.com/atra-consulting/agentic-engineering-crm-lab/commit/f7c87ef)
