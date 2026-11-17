# Agent Tasks API

Machine-facing and admin API for the autonomous task sources feature. Base path: **`/api/agent-tasks`**.

For signatures, the API contract wins. Paths, bodies, answers, status codes: [`openapi/paths/agent-tasks.yaml`](../../openapi/paths/agent-tasks.yaml), [`openapi/paths/cron.yaml`](../../openapi/paths/cron.yaml), [`openapi/schemas/agent-tasks.yaml`](../../openapi/schemas/agent-tasks.yaml), [`openapi/schemas/cron.yaml`](../../openapi/schemas/cron.yaml). This doc covers concepts, auth, and workflow.

Source of truth for behavior: `backend/src/routes/agentTasks.ts` and `backend/src/services/agentTaskService.ts`. Full requirement-level spec: `docs/prds/PRD-AUTONOMOUS-TASK-SOURCES.md` (REQ-008 … REQ-012b).

---

## Concepts

A task (`agent_task` row) comes from one of four **sources** and moves through a **status** lifecycle:

```
source:  EMAIL | GITHUB_ISSUE | APP_LOG | ERROR_REPORT
status:  OPEN ──(GET /next OR POST /:id/start)──▶ IN_PROGRESS ──(POST /done)──▶ DONE
                                          └──(POST /reject)─▶ REJECTED
         (POST /reset re-arms every task back to OPEN)
```

- `GET /next?source=…` claims the oldest `OPEN` task of that source. The status flip is the claim guard, so two callers never grab the same task. `204` means none left.
- `POST /:id/start` does the same flip for a known id.
- `POST /:id/done` and `POST /:id/reject` work from `OPEN` or `IN_PROGRESS`. `reject` needs a comment. Both return `409` for a task already `DONE` or `REJECTED`.
- `POST /reset` (admin) sets every task back to `OPEN` and clears `comment`, `pickedUpAt`, `resolvedAt`. Use it to re-run the workshop without `--reset-db`.
- `GET /:id` is read-only. It never changes a task.
- `metadata` is a JSON **string** (source-specific fields), or `null`.

Admin endpoints: list, summary, reset. List and summary serve the dashboard at `/admin/agent-tasks`. Summary always returns all four sources.

---

## Authentication

Two main schemes. `GET /:id` accepts all three (see below).

### Agent token (machine endpoints: `/next`, `/:id/start`, `/:id/reject`, `/:id/done`)

Send the shared secret in **either** header:

```
Authorization: Bearer <AGENT_API_TOKEN>
# or
X-Agent-Token: <AGENT_API_TOKEN>
```

- The server compares it to the `AGENT_API_TOKEN` env var using SHA-256 + constant-time `timingSafeEqual`.
- If `AGENT_API_TOKEN` is **unset/empty**, every agent endpoint returns **401** (no default token).
- Missing or wrong token → **401**.
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

### Admin session (admin endpoints: `/`, `/summary`, `/reset`)

Standard browser session cookie + role `ADMIN` (`requireAuth` + `requireRole('ADMIN')`).

- No session → **401**. Authenticated but not admin → **403**.

### `GET /:id` (all three, first match wins)

Loopback bypass · agent token · admin session. On localhost with `AGENT_AUTH_ALLOW_LOOPBACK=1`, skills read a task without a token. In production, send the agent token or use an admin session.

### Path ids and unknown paths

- Path ids must be positive integers. Anything else → **400** `Ungültige ID`.
- Unknown `/api` paths return a JSON **404**.

---

## Endpoints

List, request bodies, answers, and status codes live in the [contract](../../openapi/paths/agent-tasks.yaml). Short usage examples:

```bash
# Claim the next EMAIL task
curl -s -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$APP_BASE_URL/api/agent-tasks/next?source=EMAIL"

# Reject with a mandatory comment
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Too vague — no concrete change described."}' \
  "$APP_BASE_URL/api/agent-tasks/3/reject"

# Finish with an optional comment
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"comment":"Implemented in PR #62"}' \
  "$APP_BASE_URL/api/agent-tasks/9/done"

# Start a known task
curl -s -X POST -H "Authorization: Bearer $AGENT_API_TOKEN" \
  "$APP_BASE_URL/api/agent-tasks/3/start"
```

---

## Error response shape

All errors use the app-wide handler: `{ status, message, timestamp, fieldErrors }`. Schema: `ErrorResponse` in [`openapi/common.yaml`](../../openapi/common.yaml).

---

## Cron Runner API

Turns the agent-task queue into a scheduled, self-driving loop. An external cron (or the admin "Run now" button) hits the dispatcher; it fires a GitHub `repository_dispatch` that runs `.github/workflows/agent-task-runner.yml`, which drains every source and calls back to close the audit row. Base path: **`/api/cron`**.

Contract: [`openapi/paths/cron.yaml`](../../openapi/paths/cron.yaml). Source of truth for behavior: `backend/src/routes/cron.ts`, `backend/src/services/cronService.ts`, `backend/src/config/cronJobs.ts`.

A `cron_run` row is the audit record of one run. `status`: `RUNNING | SUCCESS | FAILED | SKIPPED`. `trigger`: `CRON | MANUAL`. `result` is a JSON **string** (or `null`).

### Authentication

- `GET /api/cron/agent-tasks` and `GET /api/cron/github-issues` accept **either** `Authorization: Bearer <CRON_SECRET>` (external cron → trigger `CRON`) **or** an admin session (the "Run now" button → trigger `MANUAL`).
  - A wrong `CRON_SECRET` falls through to the admin session check.
  - A non-admin session → **401**.
  - Unset `CRON_SECRET` disables the bearer path.
- `POST /api/cron/runs/:id/complete` uses the agent token (`AGENT_API_TOKEN`), same scheme as `/api/agent-tasks/*`.
- `GET /api/cron/runs` and `GET /api/cron/jobs` use an admin session (`requireAuth` + `requireRole('ADMIN')`).

### GET `/api/cron/agent-tasks` — heartbeat + dispatcher
Single-flight + skip-when-idle, then dispatch:
- A run already `RUNNING` (orphans older than 30 min are auto-expired first) → records a `SKIPPED` run.
- No OPEN tasks across any source → records a `SKIPPED` run.
- Otherwise creates a `RUNNING` run and fires `repository_dispatch` (`solve-agent-tasks`, `client_payload.cronRunId`). Dispatch failure → the run is marked `FAILED`.
- Always answers with the `cron_run` object, never an error status. An error could make a cron scheduler retry and create duplicate runs.

### GET `/api/cron/github-issues` — GitHub-issue agent dispatcher
Same auth as `/agent-tasks` (admin session via the per-job "Jetzt ausführen" button, or `CRON_SECRET`). Manual-only — no scheduled cron for it.
- A `solve-github-issues` run already `RUNNING` → records a `SKIPPED` run.
- Otherwise creates a `RUNNING` run and fires `repository_dispatch` (`solve-github-issues`, `client_payload.cronRunId`) → the [`github-issue-agent.yml`](../../.github/workflows/github-issue-agent.yml) workflow. Dispatch failure → `FAILED`.
- No work-queue pre-check (the issues live on GitHub): it always dispatches; the agent reports the outcome via the same `/runs/:id/complete` callback (`tasksSolved=1` implemented, `tasksRejected=1` input-needed, both `0` if no issue was open).
- Always answers with the `cron_run` object.

### POST `/api/cron/runs/:id/complete` — runner callback
Agent token. Closes the run: sets `finishedAt`, `durationMs`, `status`, `githubRunUrl`, `result`.

### GET `/api/cron/runs` and `/api/cron/jobs` (admin)
`runs` is the paginated history. `jobs` lists each configured job with its newest run attached.

Each job renders as its own card in `/admin/cron` with a dedicated "Jetzt ausführen" button. `solve-tasks` drains the in-app `agent_task` queue; `solve-github-issues` works ONE real GitHub issue labelled `Refinement needed` (see below).

---

## Environment Variables

| Var | Where | Used by |
|-----|-------|---------|
| `AGENT_API_TOKEN` | App env **and** GitHub repo secret (same value) | agent-task API + cron callback auth |
| `CRON_SECRET` | App env only | validates an external cron's `Authorization: Bearer` header |
| `GH_DISPATCH_TOKEN` | App env only | the dispatcher's `repository_dispatch` call (fine-grained PAT: Contents R/W + Actions R/W) |
| `GH_DISPATCH_REPO` | App env only (optional) | overrides the dispatch target; defaults to `atra-consulting/coding-with-ai-lab` |
| `APP_BASE_URL` | GitHub repo secret | runner → app base URL for the callback |
| `ANTHROPIC_API_KEY` | GitHub repo secret | Claude CLI in the agent-task runner |
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub repo secret | Claude CLI auth in the GitHub-issue agent (subscription token via `claude setup-token`; use **instead of** `ANTHROPIC_API_KEY`) |
| `GH_PROJECT_TOKEN` | GitHub repo secret | **GitHub-issue agent only.** Classic PAT with scopes `repo`, `project`, `read:org`. Used by `gh` + `git` for issue/label/PR/push **and** moving the issue on Project board #7. The default `GITHUB_TOKEN` cannot write Projects v2. |

All are read from `process.env`; never commit values. Schedules (`backend/src/config/cronJobs.ts`): `solve-tasks` runs daily at 02:00 UTC (`agent-task-runner.yml` also has a `0 2 * * *` schedule as a legacy fallback). `solve-github-issues` runs manually only. The admin "Run now" button (`/admin/cron`) triggers the dispatch on demand, also locally.

---

## GitHub-Issue Agent (real issues, not the `agent_task` queue)

A **second** autonomous agent, separate from the agent-task runner. It works against **real GitHub issues** labelled **`Refinement needed`**, one issue per run, triggered **manually** from the `solve-github-issues` card in `/admin/cron`.

**Pieces**
- **Trigger:** `GET /api/cron/github-issues` (above) → `repository_dispatch` `solve-github-issues`.
- **Workflow:** [`.github/workflows/github-issue-agent.yml`](../../.github/workflows/github-issue-agent.yml) — runs `claude -p` once with the prompt below, then calls `/runs/:id/complete`.
- **Prompt:** [`.claude/prompts/agent-github-refinement.md`](../../.claude/prompts/agent-github-refinement.md).
- **Token:** `GH_PROJECT_TOKEN` (see env table) — needs Projects-v2 write, which the default `GITHUB_TOKEN` lacks.

**Per-run flow**
1. Pick ONE open `Refinement needed` issue (skip ones already `Input needed`; prefer non-`Likely to fail`; tie-break lowest number).
2. **Decide** implement vs ask.
   - **Ask** (info/decision missing, or the issue text says so): comment a precise question + `@dave0688`, add the **`Input needed`** label. Board stays **Backlog**. → `AGENT_RESULT: INPUT_NEEDED`.
   - **Implement** (all info present): move the issue to **In progress** on board #7 → implement it directly (branch, change, build check only, `/local-review embedded`; **no test authoring**) → open a PR against `main` (**never merged**, left for human review) → move to **In review** + comment the PR link. → `AGENT_RESULT: IMPLEMENTED`.
3. If implementation stalls, it falls back to the ask path (Backlog + `Input needed` + comment).

**Status is tracked on the Project board** (#7 "Coding with AI: Fortgeschrittenen-Schulung"), not via labels — except the explicit `Input needed` label that flags issues awaiting a maintainer reply. Project IDs and status-option ids are pinned in the prompt.

---

## For skill authors

A workshop skill drives this API as an agent. Use the **agent endpoints only** — the admin-only endpoints (`summary`, `reset`, list) are for the human dashboard. `GET /:id` accepts the agent token or an admin session.

**Auth.** Send the agent token on every call (`AGENT_API_TOKEN`). Same token and header scheme as the Tickets API:

```
Authorization: Bearer $AGENT_API_TOKEN
# or:
X-Agent-Token: $AGENT_API_TOKEN
```

**The calls a skill needs:**

Request and response shapes: [`openapi/paths/agent-tasks.yaml`](../../openapi/paths/agent-tasks.yaml).

| Step | Purpose | Notes |
|------|---------|-------|
| Claim (`GET /next`) | Take the oldest `OPEN` task of one source | `source` is required. Flips the task to `IN_PROGRESS`. `204` = none for that source. |
| Start (`POST /:id/start`) | Start a task by id | Only from `OPEN`. Use it when you have the id but skipped `/next`. |
| Read (`GET /:id`) | Re-read a task | Agent token, loopback bypass, or admin session. |
| Finish (`POST /:id/done`) | Mark the task `DONE` | Allowed from `OPEN` or `IN_PROGRESS`. A finished task gets `409`. |
| Reject (`POST /:id/reject`) | Mark the task `REJECTED` | Comment required. Allowed from `OPEN` or `IN_PROGRESS`. Use for out-of-scope tasks. |

**Loop shape:**

```
for each source in [EMAIL, GITHUB_ISSUE, APP_LOG, ERROR_REPORT]:
    while GET /next?source=<source> returns 200:
        decide: solve or reject?
        if solve:   POST /:id/done   {comment}
        else:       POST /:id/reject {comment}
    # 204 → this source is drained
```

**What's different from tickets** (see `docs/specs/SPEC-API-TICKETS.md`):

- **Tasks are one-shot.** Claim, then either `done` or `reject` — no conversation. There is no "ask a question" path and no comment thread. If a task lacks information, you `reject` it (with a reason) rather than hand it back.
- **`/next` requires `?source=`.** Tickets have no required parameter (only an optional `?type=`).
- **Lifecycle is `OPEN → IN_PROGRESS → DONE | REJECTED`** — there is no `ON_HOLD` and no owner concept.

**One token, two queues.** This API and the Tickets API share `AGENT_API_TOKEN` and the same header scheme. A single skill can work both — pick the base path (`/api/agent-tasks` vs `/api/tickets`) and the matching verbs.

---

## See also

- `docs/prds/PRD-AUTONOMOUS-TASK-SOURCES.md` — full requirements and acceptance criteria.
- `docs/specs/SPEC-API-TICKETS.md` — Kanban ticket queue (separate system, adds the ask/answer conversation).
- `.claude/prompts/agent-*.md` — the per-source prompts that call this API.
