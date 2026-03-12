# Task-3 — Implementation Audit: Admin Ingest "Since Date"

Date: 2025-10-26

## Summary

Overall implementation closely follows the final plan. Backend schema, route, orchestrator logic, tests, and a minimal web admin UI for “By date” are in place. No critical blockers found. A couple of notable issues warrant attention: a type mismatch in the web client (`tgId`), and a conservative early‑stop condition in the orchestrator that can over-scan when the first page has no qualifying messages.

## Pending Changes (uncommitted)

- Modified
  - `.gitignore`
  - `packages/backend/src/index.ts`
  - `packages/backend/src/ingest/orchestrate.ts`
  - `packages/backend/src/routes/admin.ts`
  - `packages/backend/src/schemas/index.ts`
  - `packages/web/src/lib/api.ts`
  - `packages/web/src/pages/HomePage.tsx`
- Added
  - `packages/backend/src/__tests__/admin-ingest.integration.test.ts`
  - `packages/backend/src/ingest/orchestrate.test.ts`
  - `packages/web/src/components/SyncDialog.tsx`
  - `packages/web/src/components/ui/{input.tsx,label.tsx,radio-group.tsx}`
- Untracked misc: `.DS_Store`

## Alignment With Plan & Subtasks

- stt-001 (Baseline ingest docs/tests)
  - Implemented via integration tests documenting current contract and behavior without `since`.
- stt-002 (API contract: `since` + OpenAPI)
  - Implemented. `IngestBodySchema` includes `since?: string().datetime()` with future-date rejection and OpenAPI example. Route accepts and passes `since` to orchestrator.
- stt-003 (Orchestrator since-boundary + early-stop)
  - Implemented. Processes only posts where `(isNewPost || isRescan)` and `date >= since`; early-stops when a page has no qualifying messages (see note under “Major Gaps”).
- stt-004 (Web admin: by-date mode, hardcoded since)
  - Implemented in `SyncDialog` with toggle and hardcoded `since = 2025-06-01T00:00:00Z`. Integrated from `HomePage`.
- stt-005 (API validation tests / 400 mapping)
  - Implemented. Integration tests cover invalid ISO and future dates resulting in 400 with Zod error info; backend global error handler returns consistent JSON.
- stt-006 (Orchestrator unit tests for boundary + caps)
  - Implemented. Unit tests cover early-stop, `maxMessages` behavior, and backward compatibility. Rate-limit path simulation is not present (see Minor Gaps).

## Acceptance Criteria Check

- `POST /api/admin/ingest?username=...` accepts `since` (ISO) and ingests only posts with `date >= since`.
  - Met by schema + route + orchestrator filtering.
- Existing params (`maxMessages`, `rescanLatest`) continue to work; precedence documented.
  - Met; tests exercise combinations. “Clamp” is achieved via filtering instead of pre-adjusting the window (see Minor Gaps).
- Web admin: “By date” sends hardcoded `since = 2025-06-01T00:00:00Z` and succeeds.
  - Met by `SyncDialog` + API client.
- OpenAPI shows `since` with example; invalid/future dates → 400.
  - Met by `@hono/zod-openapi` schema and integration tests.

## Critical Gaps

- None observed.

## Major Gaps

- Orchestrator early-stop condition can over-scan
  - Current logic stops only when `since` is set, the page has no qualifying messages, and `pageCount > 1` (`packages/backend/src/ingest/orchestrate.ts`). If the first page already has zero qualifying messages (e.g., very old/sparse channels or a future `since`), pagination continues into older pages unnecessarily until history ends or a cap is hit. This wastes requests and time.
  - Recommendation: Allow early-stop when `pageCount >= 1` if a page returns no qualifying messages.

- Web API typing mismatch for `tgId`
  - `packages/web/src/lib/api.ts` declares `channel.tgId: string`, but backend returns a number (and tests assert `number`). Inconsistent typing can cause subtle UI issues and incorrect assumptions downstream.
  - Recommendation: Change `tgId` type in `IngestChannelResponse` to `number`.

## Minor Gaps

- 401 mapping in web client
  - `getErrorMessage` lacks a specific 401 case (“Unauthorized”), returning a generic message. `HomePage` clears cached credentials on errors containing “unauthorized”, but user feedback would be clearer with a proper 401 message.
  - Recommendation: Map 401 → `"Unauthorized"` in `packages/web/src/lib/api.ts`.

- “Clamp rescanLatest” not enforced up-front
  - Behavior is correct via per-message `since` filter, but the plan’s “clamp” wording implied pre-adjusting the rescan window. Current approach can count since-filtered messages towards `maxMessages` “scan” budget (not necessarily undesirable, but worth documenting).
  - Recommendation: Either document current semantics (“maxMessages” acts as a scan cap), or clamp the rescan window using date-aware logic before processing.

- Rate-limit path not unit-tested
  - Orchestrator handles `FLOOD_WAIT_*`, but tests don’t simulate a single flood-wait and retry path.
  - Recommendation: Add one unit test to simulate `FLOOD_WAIT_3` and assert a retry with sleep.

- Minor repo hygiene
  - `.DS_Store` is untracked. Consider adding to `.gitignore` (optional) or removing.

## Suggested Fixes (Quick Wins)

1) Orchestrator early-stop: allow stop after first page with no qualifying messages
   - In `packages/backend/src/ingest/orchestrate.ts`, change the condition `pageCount > 1` to `pageCount >= 1` (or remove the check entirely) when `since` is set and `pageHasQualifyingMessages === false`.

2) Fix `tgId` type in web client
   - Update `IngestChannelResponse.channel.tgId` to `number` in `packages/web/src/lib/api.ts`.

3) Improve 401 feedback
   - Add explicit `case 401: return 'Unauthorized'` to `getErrorMessage` in `packages/web/src/lib/api.ts`.

4) Optional: Rate-limit unit test
   - Add a test in `packages/backend/src/ingest/orchestrate.test.ts` that throws `FLOOD_WAIT_3` on first invoke and resolves on retry; assert sleep and successful processing.

## Notes

- OpenAPI exposure looks correct via zod-openapi; `since` is visible with example and description.
- The UI fulfills the “no date picker” constraint by hardcoding the since date in “By date” mode.
- Logging and error mapping remain consistent with prior behavior.

