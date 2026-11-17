# API contract (OpenAPI 3.1)

Single source of truth for the backend (Express) and the web app (Angular). Hand-written. For signatures, the contract wins over every Markdown spec.

PRD: [`docs/prds/PRD-OPENAPI-SPEC-SSOT.md`](../docs/prds/PRD-OPENAPI-SPEC-SSOT.md).

## Layout

| File | Content |
|---|---|
| `openapi.yaml` | Root: info, `servers: [/api]`, tags, security schemes, the `paths` index, the `components` index (schemas, parameters, responses). |
| `paths/<area>.yaml` | Operations of one area. Top-level keys are the full paths (`/firmen/{id}`). |
| `schemas/<area>.yaml` | Schemas of one area. Top-level keys are the schema names. |
| `common.yaml` | `schemas` (ErrorResponse, PageMeta, EmptyObject), `parameters`, `responses`. |
| `redocly.yaml` | Lint rules. |
| `.redocly.lint-ignore.yaml` | Lint exemptions, each with a reason. Edit by hand. |

13 areas: health, auth, firmen, personen, abteilungen, adressen, aktivitaeten, chancen, dashboard, szenarien, agent-tasks, tickets, cron. One tag per area. `paths/firmen.yaml` and `schemas/firmen.yaml` are the templates.

Generated and committed (never edit):

- `backend/src/generated/openapi.json`: the bundle. The runtime reads it.
- `backend/src/generated/api-types.ts`: types for the backend.
- `frontend/src/app/core/api/api-types.ts`: byte-identical copy for the web app.

## Workflow

Adding an entity or endpoint:

1. Edit the contract: paths and schemas with `operationId`, `security`, `x-error-messages`, `x-sort-fields` / `x-default-sort`. New schema name → add it to `components.schemas` in `openapi.yaml`.
2. `cd backend && npm run api:generate` (or `cd frontend && npm run api:generate`, which delegates).
3. Drizzle schema and `migrate.ts`.
4. Service with the generated types (`Schema<'Firma'>`, `RequestBody<'createFirma'>`, `JsonResponse<'op', 200>`).
5. Route: guard, then `specValidate`, then the handler.
6. Web app: model alias of the generated type. Service calls `ApiClient` with the literal spec path.
7. Tests. In test mode the response check turns a contract violation into 500. `contract-coverage` needs each operation to answer 2xx once.
8. `cd backend && npm run api:check` must pass.
9. Commit the contract and the three generated files together.

`ng build`, `ng serve`, Karma and `start.sh` never regenerate.

## Contributor rules

- `api:check` fails → run `npm run api:generate`, commit the result.
- Merge conflict in a generated file → resolve the conflict in `openapi/`, then run `npm run api:generate`. Never hand-merge generated files.
- Never edit generated files.
- Describe today's code, not a redesign. Code and old docs disagree → the code wins. Report the deviation.

## `api:check`

`cd backend && npm run api:check` runs five steps and stops at the first failure:

1. Redocly lint with `redocly.yaml`. Zero errors.
2. `api:generate`.
3. Project rules (JS, in `backend/scripts/api-check.ts`):
   - every operation matches the operationId table below (method, path, id)
   - a `sort` query param needs `x-sort-fields` (non-empty) and `x-default-sort` (`field,ASC|DESC`, field in the list), and vice versa
   - `x-loopback-bypass: true` only where `security` includes `agentBearer`
   - no `allOf` anywhere inside a request body schema, also nested and behind `$ref`
   - component names are PascalCase (catches hoisted refs such as `200` and renamed duplicates such as `Firma-2`)
   - only the vendor keywords listed below, in the right place; `x-error-messages` keys are Ajv keywords; placeholders are `{limit}`, `{min}`, `{max}`, `{value}`
4. Compile the whole bundle with the runtime Ajv setup (below).
5. Drift. Fails when step 2 had to rewrite a generated file (stale, or hand-edited even without a commit), or when `git status --porcelain` shows a changed or untracked file under the generated paths. So uncommitted generated files also fail: commit first, then check.

Redocly rules (`redocly.yaml`): `recommended`, plus errors for `operation-operationId`, `operation-summary`, `security-defined`, `operation-4xx-response`, plus three configurable rules:

- `rule/no-allof-in-request-body`: `allOf` on the schema a request body references
- `rule/allowed-formats`: `format` only `email` or `uri`
- `rule/secured-operation-declares-401`: non-empty `security` → a `401` response

Manual lint: `cd backend && npx redocly lint --config ../openapi/redocly.yaml ../openapi/openapi.yaml`. Always pass `--config`: `redocly.yaml` sets `telemetry: 'off'`. The scripts also set `REDOCLY_TELEMETRY=off` and `REDOCLY_SUPPRESS_UPDATE_NOTICE=true`.

## Writing rules

### References

- Schemas: `$ref: '../schemas/<area>.yaml#/<Name>'` from a path file, `'#/<Name>'` inside the same schema file.
- Shared parts: `'../common.yaml#/parameters/IdPath'`, `'../common.yaml#/responses/NotFound'`, `'../common.yaml#/schemas/EmptyObject'`.
- Never `$ref` into another path item. Redocly would hoist it as a component named `200`.
- Every schema name used anywhere sits in the `openapi.yaml` index. The bundle then refers to `#/components/schemas/<Name>`.

### Operations

- Each operation: `operationId` (from the table), `summary`, `description` where useful, `tags: [<area>]`, `security`, `responses`.
- Declare `parameters` on the operation, not on the path item.
- `{id}` → `IdPath`; `{firmaId}` → `FirmaIdPath`. Both are strings with `pattern: '^[1-9][0-9]*$'` and "Ungültige ID". No coercion.
- Every `{id}` operation declares `400` (invalid id, D2).
- Lists: `PageQuery`, `SizeQuery`, `SortQuery`, `SearchQuery` as the route reads them. The code handles query params leniently. Nothing validates them at runtime.
- Every guarded operation declares `401`; admin-only adds `403`; every operation declares at least one 4xx (exemptions in `.redocly.lint-ignore.yaml`).
- `204` answers have no `content`.
- English summaries and descriptions. Error texts stay German, as the server sends them.

### Schemas

- Nullable: type arrays. Quote `'null'` in YAML. Unquoted `null` is a YAML null, not the JSON Schema type.

  ```yaml
  industry:
    type: [string, 'null']
  ```

- Response objects: `additionalProperties: false`, every field in `required` that the DTO always sends (also when it can be null).
- Pages: `allOf` with `PageMeta` plus `unevaluatedProperties: false`:

  ```yaml
  FirmaPage:
    type: object
    allOf:
      - $ref: '../common.yaml#/schemas/PageMeta'
      - type: object
        required: [content]
        properties:
          content:
            type: array
            items:
              $ref: '#/Firma'
    unevaluatedProperties: false
  ```

- Inputs: no `allOf`, no `additionalProperties: false`. The runtime strips unknown fields (`removeAdditional: 'all'`).
- `anyOf` / `oneOf`: every branch carries its own `type`. An untyped branch becomes `unknown` in TypeScript and swallows the whole union. Optional email (valid email, `''` or null):

  ```yaml
  email:
    type: [string, 'null']
    anyOf:
      - type: string
        format: email
      - type: string
        const: ''
      - type: 'null'
    x-error-messages:
      type: Ungültige E-Mail-Adresse
      anyOf: Ungültige E-Mail-Adresse
      format: Ungültige E-Mail-Adresse
      const: Ungültige E-Mail-Adresse
  ```

- Formats: only `email` and `uri`. No `date-time` or `date`: stored timestamps use a space separator, error timestamps have no `Z`.
- `pattern`: must compile as a JavaScript regex with the `u` flag.
- Closed value lists: `enum`. Free text stays `string` (for example Adresse `typ`, `maxLength: 50`).

### Optional bodies

`requestBody.required: false` on:

- `logout`, `handTicketToAi`, `resetTickets`, `resetAgentTasks`, `startTicket`, `startAgentTask`: schema `EmptyObject`
- `completeTicket`, `markTicketWontDo`, `completeAgentTask`: an object with an optional `comment`

### Error texts: `x-error-messages`

- Sits on the property schema (or the path parameter schema). Keys are Ajv keywords: `required`, `type`, `const`, `enum`, `format`, `pattern`, `anyOf`, `oneOf`, `minLength`, `maxLength`, `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, `minItems`, `maxItems`, `uniqueItems`.
- `required` goes on the property, not on the object.
- Placeholders: `{limit}`, `{min}`, `{max}`, `{value}`.
- Write a text only where the mapper default is wrong. Mapper defaults (in `backend/src/openapi/errorMapper.ts`):

| Case | Default |
|---|---|
| `required` | Ungültiger Wert |
| `type` integer, value is a number | Muss eine ganze Zahl sein |
| `type` boolean | Muss true oder false sein |
| other `type` | Ungültiger Wert |
| body not an object (key `_`) | Ungültige Anfrage |
| `maxLength` | Maximal {limit} Zeichen |
| `minimum` and `maximum` both set | Muss zwischen {min} und {max} liegen |
| `minimum: 0` only | Darf nicht negativ sein |
| `format: uri` | Ungültige URL |
| any path parameter error | Ungültige ID |
| anything else | Ungültiger Wert |

### Vendor keywords

Only these. Any other `x-` key fails `api:check`.

| Keyword | Where | Value | Meaning |
|---|---|---|---|
| `x-sort-fields` | operation | string array | Allowed `sort` fields, equal to `ALLOWED_SORT_FIELDS` in `pagination.ts` |
| `x-default-sort` | operation | `field,ASC` or `field,DESC` | Default sort of the route |
| `x-skip-request-validation` | operation | `true` | No body check (`login`, `testLogin`: missing fields keep today's 401) |
| `x-loopback-bypass` | operation | `true` | The agent guard lets loopback calls through when `AGENT_AUTH_ALLOW_LOOPBACK=1` |
| `x-environments` | operation | `[development, test]` | Route exists only in these modes (`testLogin`) |
| `x-error-messages` | property / parameter schema | Ajv keyword → German text | Error texts |
| `x-generated` | bundle root | text | Added by the generator. Never write it. |

## Security mapping

No global `security`. Every operation states one rule.

| Guard in code | `security` | Also | Answers |
|---|---|---|---|
| public | `[]` | | — |
| `requireAuth` | `- sessionCookie: []` | | 401 |
| `requireAuth` + `requireRole('ADMIN')` | `- sessionCookie: [ADMIN]` | | 401, 403 |
| `requireAgentToken` | `- agentBearer: []`<br>`- agentHeader: []` | `x-loopback-bypass: true` | 401 |
| `requireAgentTokenOrAdminSession` | `- agentBearer: []`<br>`- agentHeader: []`<br>`- sessionCookie: [ADMIN]` | `x-loopback-bypass: true` | 401, 403 |
| `requireAgentTokenOrSession` | `- agentBearer: []`<br>`- agentHeader: []`<br>`- sessionCookie: []` | `x-loopback-bypass: true` | 401 |
| `requireCronAuth` | `- cronBearer: []`<br>`- sessionCookie: [ADMIN]` | | 401 only |

Notes for descriptions (OpenAPI cannot say these):

- A wrong agent token never falls through to the session. The caller gets 401.
- A wrong `CRON_SECRET` falls through to the admin session. A non-admin session gets 401, not 403.
- `addTicketComment` answers 403 when `author=AGENT` comes with a session.

## Ajv setup (runtime and `api:check`)

One setup, in `backend/src/openapi/ajv.ts` (`createContractAjvs`). The runtime (`contract.ts`) and `api-check.ts` both use it. Do not build a second one.

```ts
import { createContractAjvs } from './ajv.js';

const { body, plain } = createContractAjvs(bundle); // bundle = backend/src/generated/openapi.json
const validateInput = body.getSchema('spec#/components/schemas/FirmaInput');
const validatePut = body.compile({
  $ref: 'spec#/paths/~1firmen~1%7Bid%7D/put/requestBody/content/application~1json/schema',
});
```

- Two instances. `body`: `removeAdditional: 'all'`, `coerceTypes: false` (request bodies). `plain`: no coercion, no removal (path params, responses).
- Both register the bundle as `spec` and the formats `email` and `uri`.
- Base options: `strict: false`, `allowUnionTypes: true`, `allErrors: true`, `verbose: true`, `unicode: false`.
- `unicode: false`: lengths count UTF-16 code units, like Zod and JS `.length`. Ajv 8 warns that the option is deprecated. The shared logger drops only that warning. Other Ajv warnings still print.
- Formats: `email` and `uri` are custom formats that reproduce the former Zod 4 behavior (WHATWG URL parsing for `uri`, Zod's email regex). `format-parity.spec.ts` verifies this.
- Import: the named `{ Ajv2020 }` import type-checks under the backend's NodeNext config and runs under tsx.
- Refs: `spec#` plus a JSON pointer. Escape `~` as `~0` and `/` as `~1`. `{id}` works raw or as `%7Bid%7D`.
- Ajv does not follow a `$ref` in the middle of a pointer. Resolve OAS-level refs (parameters, responses, request bodies) in JS first, then compile at the target, for example `spec#/components/responses/BadRequest/content/application~1json/schema`.
- `strict: false`: Ajv ignores `example`, `discriminator`, `xml`, `externalDocs` and every `x-*` keyword. No vocabulary registration needed. Ajv ignores unknown formats. It prints a console warning. Hence the format rule.
- `removeAdditional: 'all'` mutates the data. Validate a deep clone and write the clone back.
- `removeAdditional` strips only on object schemas that declare `properties`. Every input object declares `properties`. `EmptyObject` declares `properties: {}` for this reason.
- `verbose: true`: each error carries `schema`, `parentSchema` and `data`. The mapper does not read texts from `parentSchema`. It reads only the `minimum` and `maximum` numbers from it, for placeholders.
- Error texts: the mapper walks the contract schema along the error's instance path. For each property it reads `x-error-messages` on the property first, then on its `$ref` target. Array items use `items`. `anyOf`, `oneOf` and `allOf` branches count too. A `$ref` next to `x-error-messages` works.
- The mapper drops errors from inside a failed `anyOf`/`oneOf` branch. The union's own error speaks for them, so write its text (for example `anyOf` on an email).
- Patterns compile with the `u` flag.
- 5xx answers are not declared per operation; any 5xx body is validated against `ErrorResponse`.
- Runtime request validation (`specValidate`) runs after each route's auth guard, so 401/403 always come before 400.

## OperationId table (binding, 79 operations, 57 paths)

`api:check` enforces this table.

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

## Schema names (71)

| Area | Schemas |
|---|---|
| common | ErrorResponse, PageMeta, EmptyObject |
| health | Health |
| auth | LoginRequest, LoginResponse, BenutzerInfo, TestLoginRequest, Rolle, Permission |
| firmen | Firma, FirmaInput, FirmaAdresse, FirmaPage |
| personen | Person, PersonInput, PersonPage |
| abteilungen | Abteilung, AbteilungInput, AbteilungPage |
| adressen | Adresse, AdresseInput, AdressePage |
| aktivitaeten | Aktivitaet, AktivitaetInput, AktivitaetPage, AktivitaetTyp |
| chancen | Chance, ChanceInput, ChancePage, ChancePhase |
| dashboard | DashboardData, RecentChance, RecentAktivitaet |
| szenarien | Szenario, SzenarioInput, ProzessDauer |
| agent-tasks | AgentTask, AgentTaskPage, AgentTaskSummary, AgentTaskSource, AgentTaskStatus, AgentTaskRejectInput, AgentTaskDoneInput, AgentTaskResetResult |
| cron | CronRun, CronRunPage, CronJob, CronJobLastRun, CronRunStatus, CronTrigger, CronRunCompleteInput |
| tickets | TicketDetail, TicketListItem, TicketListItemPage, TicketBoard, TicketSummary, TicketComment, TicketCreateInput, TicketStatusInput, TicketOwnerInput, TicketAskInput, TicketDoneInput, TicketWontDoInput, TicketCommentInput, TicketResetResult, TicketOwner, TicketType, TicketStatus, TicketSolution, TicketCommentAuthor |

Shared parameters: IdPath, FirmaIdPath, PageQuery, SizeQuery, SortQuery, SearchQuery. Shared responses: BadRequest, Unauthorized, Forbidden, NotFound, Conflict.
