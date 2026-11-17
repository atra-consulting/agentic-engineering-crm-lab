# Code Review - openapi-spec-ssot-spec-first-types-validation

**Date**: 2026-11-17
**Branch**: openapi-spec-ssot-spec-first-types-validation
**Base**: 75de728b623fb679563baa8927a1ca70e3e65d5e
**Files Reviewed**: 187 (194 changed; excluded: the user's unrelated uncommitted `docs/plans/PLAN-KANBAN-TICKET-SYSTEM.md`, `docs/plans/PLAN-UPDATE-OSM-FIRMENKARTE.md`, `docs/prds/PRD-KANBAN-TICKET-SYSTEM.md`, and `docs/state/*`)
**Review Rounds**: 3 (max 3)

## Summary

The branch introduces a hand-written OpenAPI 3.1 contract (`openapi/`) as single source of truth. The backend validates path params and bodies against it (`specValidate` after the guards), checks responses in development/test, and derives DTO types from it. Zod is gone. The frontend models are aliases of the generated types and all services call a typed `ApiClient`. CI fails on contract lint errors and on drift.

Before this review, every phase had its own domain review plus an opus security sign-off (PASS). This whole-branch review found no critical issue. It found one real regression (case-sensitive `/api` base path in `findOperation`, round 3) and several consistency and documentation issues. All findings with a planned fix were fixed.

Embedded mode: fix plans were approved automatically (caller drives approval).

## Review Rounds

### Round 1

**Issues found**: 39 | **Fixes applied**: 19 (the rest: accepted as decided, out of scope, or cosmetic)

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `backend/src/test/runtime-modes.spec.ts:225` | Install test compares router layer counts; sleeps used to assert "nothing happened" | be-reviewer | Find layer by name, deterministic waits | be-coder + be-test-coder | Middleware named `contractResponseCheck`; tests find it by name and wait on `finish` | be-coder, be-test-coder |
| 2 | WARNING | `backend/src/test/contract-helpers.ts:12` | Duplicates `BUNDLE_FILE` and the method list | be-reviewer | Import from `contract.ts`, rename subset | be-test-coder | Imports `BUNDLE_FILE`; `CRUD_METHODS` | be-test-coder |
| 3 | WARNING | `backend/scripts/api-check.ts:481` | `api:check` fails while regenerated files are uncommitted | be-reviewer | Document (intended gate) | ba-writer | Contributor rule in `openapi/README.md` | ba-writer |
| 4 | WARNING | `CONTRACT_RESPONSE_CHECK` | Switch not documented | be-reviewer, ba-reviewer | Document in PRD/specs | orchestrator | PRD Decisions (a) 17, R14 | orchestrator |
| 5 | WARNING | `backend/src/test/globalSetup.ts:16` | `BACKEND_ROOT` names the repo root | be-reviewer | — (pre-existing) | — | — | — |
| 6 | SUGGESTION | `backend/src/openapi/ajv.ts:25` | `isZodEmail`/`isZodUrl` names after Zod removal | be-reviewer | Rename | be-coder | `isContractEmail`/`isContractUrl`/`CONTRACT_EMAIL_REGEX` | be-coder |
| 7 | SUGGESTION | `backend/src/openapi/responseCheck.ts` | Header does not say only `res.json` is checked | be-reviewer | Comment | be-coder | Header comment extended | be-coder |
| 8 | SUGGESTION | `backend/src/services/dashboardService.ts` | `{  return {` formatting | db-reviewer | Fix | be-coder | Reformatted | be-coder |
| 9 | WARNING | `backend/src/services/agentTaskService.ts:199` | Summaries skip unknown enum values | db-reviewer | — (decided: summaries count only contract keys, with warning) | — | — | — |
| 10 | SUGGESTION | `frontend/src/app/core/models/page.model.ts:1` | Hand-written `Page<T>` without pointer to its check | fe-reviewer | Comment | fe-coder | Comment added | fe-coder |
| 11 | SUGGESTION | `frontend/src/app/core/services/ticket.service.spec.ts` | `MOCK_LIST_ITEM` built with an IIFE | fe-reviewer | Use factory | fe-coder | `makeTicketListItem` | fe-coder |
| 12 | WARNING | `.claude/agents/{be,db,fe}-coder.md` | Contract contributor rules missing | skill-reviewer | Add | skill-coder | "Contract Rules" sections | skill-coder |
| 13 | WARNING | `.claude/agents/be-coder.md`, `be-test-coder.md` | Coverage rule missing | skill-reviewer | Add | skill-coder | Added | skill-coder |
| 14 | SUGGESTION | `.claude/agents/*.md` | `openapi/common.yaml` not listed | skill-reviewer | Add | skill-coder | Added | skill-coder |
| 15 | WARNING | `docs/prds/PRD-OPENAPI-SPEC-SSOT.md:407` | TN3/N5 still prescribe `ajv-formats` | ba-reviewer | Mark superseded | orchestrator | Marked superseded | orchestrator |
| 16 | WARNING | `docs/prds/PRD-OPENAPI-SPEC-SSOT.md:126` | R18 says the test switches the shortcut off | ba-reviewer | Fix wording | orchestrator | Fixed | orchestrator |
| 17 | WARNING | `docs/prds/PRD-OPENAPI-SPEC-SSOT.md:101` | R12 login texts imprecise | ba-reviewer | Fix wording | orchestrator | Fixed | orchestrator |
| 18 | WARNING | `docs/prds/PRD-OPENAPI-SPEC-SSOT.md:310` | Array-body tightening needs user approval (R12) | ba-reviewer | Move to user decisions | orchestrator | New D7, open for confirmation | orchestrator |
| 19 | WARNING | `docs/specs/SPECS-testing.md:111` | "No test uses test-login" is false | ba-reviewer | Fix | ba-writer | Fixed | ba-writer |
| 20 | WARNING | `docs/specs/SPECS-backend.md:381` | Entity checklist lacks `api:generate`/`api:check`/coverage | ba-reviewer | Add | ba-writer | Added | ba-writer |
| 21 | WARNING | `docs/specs/SPECS-infrastructure.md:178`, `README.MD:119` | Manual backend start without `NODE_ENV` | ba-reviewer | Add `NODE_ENV=development` | ba-writer | Fixed | ba-writer |
| 22 | SUGGESTION | `docs/specs/SPEC-API-TICKETS.md:42` | `fullyReady` wording contradicts reset path | ba-reviewer | Reword | ba-writer | Fixed | ba-writer |
| 23 | SUGGESTION | `openapi/README.md`, `docs/specs/SPECS-backend.md` | Case-insensitive lookup and enum pass-through undocumented | ba-reviewer | Document | ba-writer | Documented | ba-writer |
| 24–39 | SUGGESTION | various | Unused exports, `hasRole` style, strict `Equal`, `BASE_URL` constants, lazy swagger import, CI permissions, route ambiguity note, plan wording, CHECK constraints, layering of `enums.ts` | be/fe/db/ba-reviewer | — (cosmetic, pre-existing or out of scope) | — | — | — |

### Round 2

**Issues found**: 9 | **Fixes applied**: 9

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `.claude/agents/admin.md:47` | Backend start without `NODE_ENV=development` | ba-reviewer | Add mode | skill-coder | Fixed | skill-coder |
| 2 | SUGGESTION | `.claude/agents/be-coder.md:24` | "Test call, not an exemption" stricter than the mechanism | skill-reviewer | Soften | skill-coder | "Prefer a test call; exemption needs a reason" | skill-coder |
| 3 | SUGGESTION | `.claude/agents/{be,db,fe}-coder.md` | Missing `api:check` bullets | skill-reviewer | Add | skill-coder | Added | skill-coder |
| 4 | SUGGESTION | `openapi/README.md:237` | `matchOperation` does not fold to lower case | ba-reviewer | Reword | ba-writer | Reworded | ba-writer |
| 5 | SUGGESTION | `docs/prds/PRD-OPENAPI-SPEC-SSOT.md:323` | D7 message imprecise | ba-reviewer | Exact message | orchestrator | Fixed | orchestrator |
| 6 | SUGGESTION | `docs/specs/SPECS-database.md:49` | `fullyReady` reset path missing | ba-reviewer | Add | ba-writer | Added | ba-writer |
| 7 | SUGGESTION | `docs/prds/PRD-OPENAPI-SPEC-SSOT.md:111,575` | D5 still pending in wording | ba-reviewer | Past tense | orchestrator | Fixed | orchestrator |
| 8 | SUGGESTION | `docs/prds/PRD-OPENAPI-SPEC-SSOT.md:290` | R14 lacks pointer to the benchmark switch | ba-reviewer | Cross-reference | orchestrator | Added | orchestrator |
| 9 | — | backend, frontend | Fix verification | be-reviewer, fe-reviewer | — | — | No findings | — |

### Round 3

**Issues found**: 3 | **Fixes applied**: 3

| # | Severity | File | Issue | Found by | Proposed Fix | Fix by | Applied | Applied by |
|---|----------|------|-------|----------|--------------|--------|---------|------------|
| 1 | WARNING | `backend/src/openapi/contract.ts:545` | `findOperation` compares the `/api` base path case-sensitively → `POST /API/auth/logout` answers 500 in every mode | ba-reviewer | Fold before base-path check | be-coder | Fixed (1517f0d); test for `/API/...` added | be-coder, be-test-coder |
| 2 | WARNING | `.claude/agents/admin.md:100` | Log command starts backend without `NODE_ENV` | skill-reviewer | Add mode | skill-coder | Fixed | skill-coder |
| 3 | SUGGESTION | `.claude/agents/*-coder.md`, `CLAUDE.md:101`, `openapi/README.md:44` | "`api:check` fails → regenerate" too broad | skill-reviewer | Scope to drift | skill-coder, orchestrator | Fixed | skill-coder, orchestrator |

## Remaining Issues

No open issues from this review. Items deliberately not changed (pre-existing, cosmetic or out of scope) are listed in round 1 rows 5, 9 and 24–39 and in PRD Decisions (c). One item needs the user's confirmation: PRD Decision D7 (array bodies on empty-body operations now answer 400).

## Project Context Validation

- **PRD** (`docs/prds/PRD-OPENAPI-SPEC-SSOT.md`): R1–R26 implemented; R26 (docs page, "Should") implemented. Deviations recorded in Decisions (a) 17. Success criteria verified by the final verification groups (suite 791/791, Karma 556/556, coverage 79/79, golden 404/404, format parity 67/67, drift demos 6/6, N1/N2 met, SC3 met). SC19 partly: Node 20.19 not available locally (CI uses 22).
- **CLAUDE.md**: conventions followed (async libsql, `asyncHandler`, error shape, role-based access, standalone Angular, `inject()`, control-flow blocks). "Adding a New Entity" and the new "Contract Contributor Rules" describe the new workflow.

## Next Steps

- Post-review test run (plan-and-do Step 11)
- Confirm D7 in the PR
- Manual UI click-through and "Try it out" in `/api/docs` before merge

---
Generated by the local-review skill v1.8.2
