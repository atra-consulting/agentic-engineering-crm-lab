# Tickets API

Machine-facing and admin API for the Kanban ticket system. Base path: **`/api/tickets`**.

For signatures, the API contract wins. Paths, bodies, answers, status codes: [`openapi/paths/tickets.yaml`](../../openapi/paths/tickets.yaml) and [`openapi/schemas/tickets.yaml`](../../openapi/schemas/tickets.yaml). This doc covers concepts, auth, and workflow.

Source of truth for behavior: `backend/src/routes/tickets.ts` and `backend/src/services/ticketService.ts`. Full requirement-level spec: `docs/prds/PRD-KANBAN-TICKET-SYSTEM.md`.

---

## Concepts

A ticket represents a unit of work. It has an **owner** (who acts on it next) and moves through a **status** lifecycle. `status` is a DB-level enum: `DEFINITION`, `TODO`, `IN_PROGRESS`, `ON_HOLD`, `DONE` (a `CHECK` constraint rejects any other value).

```
status:  DEFINITION ─(PATCH /:id/owner {AI})──▶ DEFINITION (owner→AI, "An KI übergeben")
              │      └(POST /:id/hand-to-ai)───▶ TODO (owner→AI, "Nach Bereit")
              ▼
         TODO ──(GET /next OR POST /:id/start)──▶ IN_PROGRESS ──(POST /done)──▶ DONE (solution=DONE)
                                                               └──(POST /ask)───▶ ON_HOLD (owner→HUMAN)
                                                                                  └──(POST /comments + handBackToAi)──▶ TODO (owner→AI)
         (POST /wont-do)  DONE with solution=WONT_DO — owner must be HUMAN, status must not be DONE
         (POST /reset)    deletes all data and re-seeds 12 workshop tickets
```

New tickets start in **`DEFINITION`** — the intake/refinement column (leftmost on the board, shown as "Definition"). A human refines the ticket via the comment thread, then routes it with one of two actions:
- **"An KI übergeben"** — assign the ticket to the AI, but keep it in `DEFINITION` (`PATCH /:id/owner` with `owner=AI`). The AI now owns the refinement; the ticket is not yet ready to build.
- **"Nach Bereit"** — assign to the AI **and** move it to `TODO` (`POST /:id/hand-to-ai` → `owner=AI`, `status=TODO`). The ticket is now ready and claimable.

Agents only ever claim `TODO`+`AI` tickets, so a `DEFINITION` ticket is never auto-claimed. The `TODO` column is labelled **"Bereit"** in the UI.

### Owner model and ask→answer→re-claim flow

- **AI** — the agent picks it up via `GET /next`, works it, and calls `POST /done`.
- **HUMAN** — the agent asked a question via `POST /ask`; the ticket moves `ON_HOLD` with `owner=HUMAN`. An admin answers via `POST /comments` with `handBackToAi: true`, which sets `status=TODO` and `owner=AI` so the agent can claim it again.
- Won't-Do is human-only and only allowed when `owner=HUMAN` (any status except `DONE`).

### Ticket fields with meaning beyond the schema

- `solution` is `null` until resolved. `DONE` or `WONT_DO` when `status=DONE`.
- `pickedUpAt` is set when status → `IN_PROGRESS`. `resolvedAt` is set when status → `DONE`.
- `fullyReady` (default `false`) marks a ticket as complete enough to build without further human input. Set at creation. Only a comment with `clearFullyReady: true` resets it to `false`. Nothing sets it to `true` later. Never shown in the admin UI. It is a signal between automated flows, e.g. a headless ticket-writing flow using the machine API token.
- `agentTaskId` links the ticket to the app-feedback item (an `agent_task` row) that spawned it. Write-once: set at creation, never changed or cleared.
- Single-ticket responses include the `comments` thread. List and board responses include `commentCount` instead.

### Endpoint behavior worth knowing

- `GET /next` claims the oldest `TODO` + `owner=AI` ticket. The status flip is the claim guard. Optional `?type=` filter. `204` = queue empty.
- `POST /:id/start`: `TODO` + `owner=AI` → `IN_PROGRESS`. `409` otherwise.
- `POST /:id/done` and `POST /:id/ask`: ticket must be `IN_PROGRESS`, else `409`.
- `PATCH /:id/status` serves board drag-drop. All five columns are valid targets. Moving into `DONE` sets `solution=DONE` and `resolvedAt`. Moving out clears both. It never changes `owner`. The "Nach Bereit" button does **not** use it.
- `PATCH /:id/owner` changes owner only. Status stays.
- `POST /:id/comments`: `author` defaults to `HUMAN`.
  - `author: "AGENT"` works only for agent token or loopback bypass. An admin session gets **403**, so an admin never impersonates the agent.
  - `handBackToAi: true` sets `status=TODO`, `owner=AI`, clears `solution` and `resolvedAt`. Allowed only when ticket is `ON_HOLD` + `owner=HUMAN`, else `409`.
  - `clearFullyReady: true` resets `fullyReady` to `false`. It is independent of `handBackToAi`.
  - A rejected request (`409` or `403`) writes nothing. No comment, no `fullyReady` change.
- `POST /` (create): `owner=HUMAN`, `status=DEFINITION`, no comments. An unknown `agentTaskId` → `400` with `fieldErrors.agentTaskId`.
- `POST /reset` deletes all tickets and comments, then re-seeds the 12 workshop tickets.
- `GET /summary` always includes every enum value (zero if none). `bySolution` counts only resolved tickets.
- `GET /board` groups tickets by status. Each column sorts by `createdAt ASC`.

---

## Authentication

Three schemes. Most endpoints accept more than one.

- **Write and verb endpoints** accept agent token, loopback bypass, or admin session. First match wins.
  - Verbs: `/:id/start`, `/:id/done`, `/:id/ask`.
  - Writes a skill needs: `create`, `/:id/owner`, `/:id/comments`, `/:id/status`.
- **`GET /board` and `GET /:id`** accept agent token, loopback bypass, or any logged-in user. Workshop participants follow the board without an admin account.
- **`GET /summary`** takes any logged-in session only.
- **All reads stay read-only.** Every write needs an admin session or an agent token.
- **`GET /next`** is the exception. It is a GET that changes state (it claims a ticket). It accepts agent token or loopback bypass only. It never accepts an admin session. This avoids a GET-based CSRF risk. A `SameSite=Lax` session cookie still travels on cross-site top-level GET navigation.

### Agent token (used by `/next`, `/:id/start`, `/:id/done`, `/:id/ask`, `POST /`, `GET /:id`, `GET /board`, `PATCH /:id/owner`, `PATCH /:id/status`, `POST /:id/comments`)

Send the shared secret in **either** header:

```
Authorization: Bearer <AGENT_API_TOKEN>
# or
X-Agent-Token: <AGENT_API_TOKEN>
```

- Compared against `AGENT_API_TOKEN` env var via SHA-256 + constant-time `timingSafeEqual`.
- If `AGENT_API_TOKEN` is **unset or empty**, the code skips the agent token and the loopback bypass.
  - The check falls through to the session check.
  - Endpoints that accept a session still work with a valid session.
  - `GET /next` returns **401**.
- A wrong token → **401**. It never falls through to the session check.
- No token and no session → **401**.
- **Localhost bypass:** Set `AGENT_AUTH_ALLOW_LOOPBACK=1` in `backend/.env`. Requests from `127.0.0.1`, `::1`, or `::ffff:127.0.0.1` with no `Authorization` or `X-Agent-Token` header then skip validation. Requests with proxy-forwarding headers (`X-Forwarded-For`, `X-Real-IP`, `Forwarded`) are never bypassed. Local development only — never set in production.
- Locally the backend auto-loads `backend/.env`; in CI set it as a GitHub Actions secret.

**Local setup** (run from repo root):

```bash
# 1. Create backend/.env from the template
cp backend/.env.example backend/.env

# 2. Set your token — open backend/.env and replace the placeholder:
#    AGENT_API_TOKEN=your-secret-token-here  →  AGENT_API_TOKEN=<your-actual-token>

# 3. Export vars in your shell so the curl examples below work
set -a && source backend/.env && set +a
```

### Admin session

Standard browser session cookie + role `ADMIN` (`requireAuth` + `requireRole('ADMIN')`).

- No session → **401**. Authenticated but not admin → **403**.

### Access by endpoint

| Access | Endpoints |
|--------|-----------|
| Admin session only | `GET /`, `POST /:id/wont-do`, `POST /:id/hand-to-ai`, `POST /reset` |
| Any logged-in session only | `GET /summary` |
| Agent token or loopback bypass only | `GET /next` |
| Admin session or agent token or loopback bypass | `POST /:id/start`, `POST /:id/done`, `POST /:id/ask`, `POST /` (create), `PATCH /:id/owner`, `PATCH /:id/status`, `POST /:id/comments` |
| Any logged-in session or agent token or loopback bypass | `GET /board`, `GET /:id` |

- "First match wins." A wrong token is rejected outright.
- The write endpoints let a headless skill work and finish a ticket — or file, refine, peek, and move one — without an admin login.
- The read endpoints let a non-admin participant follow the board and open a ticket.
- A logged-in non-admin on a write endpoint → **403**.

### Path ids and unknown paths

- Path ids must be positive integers. Anything else → **400** `Ungültige ID`.
- Unknown `/api` paths return a JSON **404**.

The board UI is at **`/admin/tickets`**. Every logged-in user may open it; a non-admin sees it read-only (no drag-drop, no create, no comment form).

---

## Endpoints

List, request bodies, answers, and status codes live in the [contract](../../openapi/paths/tickets.yaml). Short usage examples:

```bash
# Claim the next FEATURE ticket
curl -s -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$APP_BASE_URL/api/tickets/next?type=FEATURE"

# Finish
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Implemented dark mode toggle in header."}' \
  "$APP_BASE_URL/api/tickets/6/done"

# Ask a question
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Comma or semicolon as CSV separator?"}' \
  "$APP_BASE_URL/api/tickets/5/ask"

# Create (headless skill)
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"BUG","title":"Login button missing on mobile","body":"Reproducible on iOS 17 Safari."}' \
  "$APP_BASE_URL/api/tickets"

# Assign to AI ("An KI übergeben")
curl -s -X PATCH -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"owner":"AI"}' \
  "$APP_BASE_URL/api/tickets/3/owner"

# Comment as AGENT (shown as "KI-Agent" in the UI)
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"Automatisch erkannt: Ticket ist ready.", "author":"AGENT"}' \
  "$APP_BASE_URL/api/tickets/7/comments"
```

---

## State machine

```
                   ┌─────────────────────────────────────────────────────────────────┐
                   │                          DONE                                    │
                   │           solution = DONE | WONT_DO                              │
                   └─────────────────────────────────────────────────────────────────┘
                         ▲ POST /done                    ▲ POST /wont-do (admin)
                         │ solution=DONE                 │ solution=WONT_DO
                         │                               │ owner must be HUMAN
                    IN_PROGRESS                       ON_HOLD  (owner=HUMAN)
                         ▲                               ▲          │
            GET /next    │                 POST /ask     │          │ POST /comments
           OR /start     │                               │          │ handBackToAi=true
           (owner=AI)    │                               │          │ owner→AI
                         │                               │          │
                        TODO  ◀──────────────────────────────────────┘
                     (owner=AI)
                         ▲
                         │ POST /:id/hand-to-ai  ("Nach Bereit", owner→AI)
                         │
                     DEFINITION  ◀── new tickets start here (intake / "Definition")
                     (PATCH /:id/owner {AI} = "An KI übergeben": owner→AI, stays here)
                        PATCH /status sets solution + resolvedAt on → DONE;
                        clears them on exit from DONE.
```

**Summary of transitions:**

| Trigger | From | To | Side effects |
|---------|------|----|-------------|
| `PATCH /:id/owner {AI}` (agent · loopback · admin) | any | unchanged | `owner→AI` ("An KI übergeben"). Status does not change |
| `POST /:id/hand-to-ai` (admin) | `DEFINITION` | `TODO` | `owner→AI` ("Nach Bereit") |
| `GET /next` (agent · loopback) | `TODO` + `owner=AI` | `IN_PROGRESS` | sets `pickedUpAt` |
| `POST /start` (agent · loopback · admin) | `TODO` + `owner=AI` | `IN_PROGRESS` | sets `pickedUpAt` |
| `POST /done` (agent · loopback · admin) | `IN_PROGRESS` | `DONE` | `solution=DONE`, `resolvedAt` |
| `POST /ask` (agent · loopback · admin) | `IN_PROGRESS` | `ON_HOLD` | `owner→HUMAN`, AGENT comment |
| `POST /comments` + `handBackToAi` (agent · loopback · admin) | `ON_HOLD` + `owner=HUMAN` | `TODO` | `owner→AI`, `solution`/`resolvedAt` cleared, HUMAN comment |
| `POST /wont-do` (admin) | any (not `DONE`), `owner=HUMAN` | `DONE` | `solution=WONT_DO`, `resolvedAt` |
| `PATCH /status → DONE` (agent · loopback · admin) | any | `DONE` | `solution=DONE`, `resolvedAt` |
| `PATCH /status → non-DONE` (agent · loopback · admin) | any | target status | `solution`/`resolvedAt` cleared |

---

## Error response shape

All errors use the app-wide handler: `{ status, message, timestamp, fieldErrors }`. Schema: `ErrorResponse` in [`openapi/common.yaml`](../../openapi/common.yaml).

---

## Seed data

12 workshop tickets seeded via `backend/src/seed/ticketSeed.ts`. Seed runs inside `POST /reset` (full wipe + re-seed) **and** on every startup: `runMigrations()` calls it unconditionally, same as `seedAgentTasks()`. It is idempotent — `INSERT OR IGNORE` with fixed ids, so rows that already exist are skipped and nothing is duplicated.

| # | Title | Type | Status | Owner |
|---|-------|------|--------|-------|
| 1 | Firmen auf einer Karte anzeigen | FEATURE | DEFINITION | HUMAN |
| 2 | KI-Chat fürs CRM | FEATURE | DEFINITION | HUMAN |
| 3 | Firmendossier aus dem Internet | FEATURE | DEFINITION | HUMAN |
| 4 | KI-Beziehungsanalyse | FEATURE | DEFINITION | HUMAN |
| 5 | Firmen aus Datei importieren | FEATURE | DEFINITION | HUMAN |
| 6 | Dunkelmodus-Umschalter im Header | FEATURE | TODO | AI |
| 7 | CSV-Export für die Firmenliste | FEATURE | ON_HOLD | HUMAN |
| 8 | Icons für Aktivitätstypen | CHORE | TODO | AI |
| 9 | Zähler-Badges im Seitenmenü | FEATURE | ON_HOLD | HUMAN |
| 10 | Chancen-Phase als farbiger Badge | CHORE | TODO | AI |
| 11 | Notiz-Feld für Chancen | FEATURE | TODO | AI |
| 12 | Firmen als Favorit markieren | FEATURE | TODO | AI |

Starting board, by intent:
- **`DEFINITION`** (5, all `HUMAN`): tickets 1–5 — too vague to build. Each carries a seeded `AGENT` comment (`authorName: "KI-Agent"`) asking the human to add detail.
- **`TODO`** / "Bereit" (5, all `AI`): tickets 6, 8, 10, 11, 12 — well-specified and ready. No comments. (Ticket 11 had an open question about the note character limit; the answer — 1000 characters — is baked into its body.)
- **`ON_HOLD`** / "Wartet" (2, `HUMAN`): tickets 7 and 9 — the AI asked a specific question and is waiting for an answer. Each carries the `AGENT` question as a comment.

Seven tickets carry a seeded `AGENT` comment: the five `DEFINITION` tickets (1–5) and the two `ON_HOLD` tickets (7, 9). `POST /reset` deletes all comments and tickets then re-inserts all 12 tickets plus these 7 comments.

---

## For skill authors

A workshop skill drives this API as an agent. It uses the **agent-token endpoints** — the claim/finish/ask verbs **plus** the write endpoints a skill needs to file and refine a ticket: `POST /` (create), `PATCH /:id/owner`, and `POST /:id/comments` — **plus** `GET /board` (peek the queue without claiming) and `PATCH /:id/status` (move a ticket to any column, incl. `DEFINITION`). The remaining admin endpoints (`list`, `wont-do`, `hand-to-ai`, `reset`) stay session-only for the human dashboard; `summary` needs any logged-in session.

**Auth.** Send the shared agent token on every call. Same token as the Agent Tasks API (`AGENT_API_TOKEN`):

```
Authorization: Bearer $AGENT_API_TOKEN
# or:
X-Agent-Token: $AGENT_API_TOKEN
```

**The calls a skill needs:**

Request and response shapes: [`openapi/paths/tickets.yaml`](../../openapi/paths/tickets.yaml).

| Step | Purpose | Notes |
|------|---------|-------|
| Peek board (`GET /board`) | Read all columns without claiming | Agent token or loopback bypass. |
| Create (`POST /`) | File a triaged feedback item as an intake ticket | Ticket lands in `DEFINITION` with `owner=HUMAN`. |
| Assign to AI (`PATCH /:id/owner`) | "An KI übergeben" | Flips owner only. Status stays. |
| Comment (`POST /:id/comments`) | Record what a thin ticket misses | Author defaults to `HUMAN`. `author=AGENT` works with the agent token. With a session cookie, `author=AGENT` gets `403`. |
| Set status (`PATCH /:id/status`) | Move a ticket to any column, incl. `DEFINITION` | Sets or clears `solution` and `resolvedAt` on DONE moves. |
| Claim (`GET /next`) | Take the oldest `TODO` ticket owned by `AI` | Optional `type` filter. Flips to `IN_PROGRESS`. `204` = queue empty, stop. Response has the full `comments` thread. |
| Start (`POST /:id/start`) | Start a ticket by id | Only from `TODO` with `owner=AI`. Use it when you skipped `/next`. Response has the full `comments` thread. |
| Read (`GET /:id`) | Re-read a ticket with comments | Agent token or loopback bypass. |
| Finish (`POST /:id/done`) | Close the ticket | Only from `IN_PROGRESS`. Sets `solution=DONE`. |
| Ask (`POST /:id/ask`) | Hand the ticket to a human | Question required. Status `ON_HOLD`, owner `HUMAN`. Question becomes an `AGENT` comment. |

**Loop shape:**

```
while GET /next returns 200:
    read ticket + comments               # the thread carries any prior human answers
    decide: can I finish, or must I ask?
    if finish:  POST /:id/done {comment}
    else:       POST /:id/ask  {question}   # then move on; a human answers later
# 204 → nothing left to claim
```

**What's different from tasks** (see `docs/specs/SPEC-API-TASKS.md`):

- **No `reject`.** A ticket is never thrown away. When you lack a decision, you `ask` — the ticket goes to a human and comes back to the `AI` queue once answered (with your question and their reply in the `comments` thread). Re-claim it later via `GET /next` and continue.
- **`/next` takes no required parameter.** Tasks require `?source=`; tickets only have an optional `?type=`.
- **Read the thread on every claim.** A re-claimed ticket carries the human's answer as the latest `HUMAN` comment. Don't re-ask what's already answered.
- **You cannot resolve a ticket as "Won't Do".** That is a human-only action.

**One token, two queues.** This API and the Agent Tasks API share `AGENT_API_TOKEN` and the same header scheme. A single skill can work both — pick the base path (`/api/tickets` vs `/api/agent-tasks`) and the matching verbs.

---

## See also

- `docs/prds/PRD-KANBAN-TICKET-SYSTEM.md` — full requirements and acceptance criteria.
- `docs/specs/SPEC-API-TASKS.md` — agent-task queue (separate system, different lifecycle).
- `backend/src/seed/ticketSeed.ts` — seed data definitions.
