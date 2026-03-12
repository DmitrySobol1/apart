# Task-3 — Admin Ingest “Since Date” (Draft Plan)

## Summary

Add an option to ingest posts “since date X” (ISO datetime) in the admin ingest flow. This complements the current “last N messages” approach, enabling targeted backfills or incremental re-sync by date. Minimal path: early-stop the existing pagination when encountering messages older than `since`. Optional optimization later: seed MTProto history with `offsetDate` to reduce page scans.

## Goals

- Backend supports `since` ISO datetime for `POST /api/admin/ingest?username=`.
- Orchestrator ingests only posts with `date >= since` (UTC), still applying `rescanLatest` policy.
- Web admin UI lets an operator choose “By date” and submit `since`.
- OpenAPI docs and error messages reflect the new parameter.

## API Changes

- Endpoint: `POST /api/admin/ingest?username=<username>` (unchanged)
- Request body (extended):
  - `maxMessages?: number` (existing)
  - `rescanLatest?: number` (existing; default stays as now)
  - `since?: string` — ISO 8601 datetime in UTC or with offset; represents the inclusive lower bound for post publish datetime.
- Validation/precedence:
  - If both `since` and `maxMessages` are provided, treat `maxMessages` as a safety cap (not mutually exclusive). If undesired, we can alternatively decide: `since` takes precedence and `maxMessages` is ignored with a 400 warning — but default recommendation is “cap allowed”.
  - Reject `since` in the future with 400.
  - Normalize to UTC internally.
- OpenAPI/zod:
  - Update `IngestBodySchema` to include `since?: z.string().datetime()` and examples.

## Ingestion Logic (Backend)

- Options:
  - Extend `IngestOptions` with `since?: Date`.
- Paging approach (minimal, safe):
  - Keep current `GetHistory` maxId-based pagination (newest → older).
  - While iterating a page, process only messages with `mapped.date >= since`.
  - Track a `reachedBoundary` flag if any message in the page is older than `since`.
  - After finishing the page, if `reachedBoundary` is true, break the outer loop (older pages will be entirely < since).
  - Continue to honor `rescanLatest` (applies regardless of `since`).
  - Respect `maxMessages` if provided (cap total processed), mainly to protect from huge backfills.
- Optional optimization (phase 2):
  - Use `offsetDate` in `Api.messages.GetHistory` to start near `since` and reduce page count.
  - Consider `minId`/`offsetId` strategies if we ever need forward scans.
- Data model: No schema changes needed. `posts.date` is indexed by `(channelId, date)` and remains the source of truth.

## Web Admin UI Changes

- Parameters component (Home/Admin):
  - Mode toggle: “By count” vs “By date”.
  - “By date” does NOT show a date input; it hardcodes `since` to June 1, 2025 (UTC) and sends it automatically.
  - Use ISO 8601 string `2025-06-01T00:00:00Z` for the hardcoded value.
  - Preserve existing `rescanLatest` control; hide `maxMessages` by default in “By date” mode (optional “Advanced” to show a safety cap).
- API client (`packages/web/src/lib/api.ts`):
  - Extend `IngestChannelParams` with `since?: string` (ISO).
  - Include `since` in POST body when “By date” mode is chosen; value is always `"2025-06-01T00:00:00Z"`.
  - Keep error mapping unchanged.
- UX:
  - Keep current toasts, spinner, and auth prompt behavior.
  - After success, refresh channel list as today.

## Hardcoded UI `since`

- Frontend always passes `since = "2025-06-01T00:00:00Z"` in “By date” mode.
- No date picker is rendered; this eliminates timezone ambiguity in the UI.
- Backend still supports arbitrary `since` for future flexibility and API use.

## Validation & Tests

- Unit (backend):
  - Orchestrator: mocked `GetHistory` data in descending dates; verify early stop at boundary; verify `rescanLatest` still updates recent posts; verify `maxMessages` cap.
  - Input parsing: invalid/future `since` yields 400; ISO parsing OK for `Z` and `±hh:mm`.
- E2E/manual:
  - `curl -u admin:pass -X POST \
    '/api/admin/ingest?username=foo' \
    -H 'Content-Type: application/json' \
    -d '{"since":"2025-10-01T00:00:00Z","rescanLatest":150}'`
  - Confirm added/updated counts; observe WAL growth; spot check post dates ≥ `since`.
- Web:
  - Toggle modes; submit date; observe success toast and server response; retry on error.

## Edge Cases & Behavior

- Timezones: treat `since` as an absolute instant (UTC). UI can collect local datetime and convert to UTC ISO.
- Sparse channels: ingestion may complete quickly with few or no posts ≥ `since`.
- Deleted/service messages: only `Api.Message` items are processed (current behavior). Skipped items do not affect boundary logic.
- Pinned messages out of order: page-level boundary check uses per-message date filter; we process any ≥ `since` within the page, and then break if any < `since` was seen.
- Flood wait: existing retry/sleep logic remains; feature is compatible.

## Rollout Steps

1. Backend: extend zod schema (`IngestBodySchema`) and OpenAPI; wire `since` into route handler options.
2. Orchestrator: add `since` option; implement early-stop logic; keep current paging and `rescanLatest` unchanged.
3. Web: extend API client params and admin UI controls; update form validation.
4. Docs: add examples to `/api/docs` via zod; README snippet (admin ingest by date).
5. Verify with manual E2E; adjust logs if needed.

## Acceptance Criteria

- `POST /api/admin/ingest?username=...` accepts `since` (ISO), ingests only posts with `date >= since`.
- Existing params (`maxMessages`, `rescanLatest`) continue to work; precedence documented and enforced.
- Web admin panel “By date” mode triggers ingestion with hardcoded `since = 2025-06-01T00:00:00Z` and succeeds.
- OpenAPI shows `since` with example; 400 responses for invalid/future dates.

## Future Improvements

- Support both `from`/`to` for bounded date windows.
- Optimize with `offsetDate` to jump near `since` and reduce requests.
- Add server-side cap (e.g., default `maxMessages` when `since` is very old) with override flag.
- Add dry-run/estimate mode returning count of posts ≥ `since` without modifying DB.

## Example Payloads

- Since only (UI hardcoded):
  ```json
  { "since": "2025-06-01T00:00:00Z", "rescanLatest": 150 }
  ```
- Since + cap:
  ```json
  { "since": "2025-06-01T00:00:00Z", "maxMessages": 2000, "rescanLatest": 150 }
  ```

## Decomposed Subtasks (Dry Run)

- [ ] stt-001 | Test Writer | eval / Baseline ingest — record current behavior — API 200 + counters
      Execute current admin ingest (no `since`) against a test channel to capture baseline behavior and outputs (added/updated counts), establishing reference data before changes.

- [ ] stt-002 | Code Implementer | feature / API contract — ingest body accepts `since` — Zod derivation + OpenAPI examples
      Extend `IngestBodySchema` with `since?: z.string().datetime()` (ISO 8601), reject future values, and wire parsing in the route handler. Add OpenAPI examples via Zod annotations.

- [ ] stt-003 | Code Implementer | feature / Orchestrator — since boundary — early-stop by date, clamp `rescanLatest`
      Add `since?: Date` to options; process only messages with `date >= since`; after a page with no qualifying messages, stop further paging. Clamp `rescanLatest` to the [since, now] window when `since` is provided.

- [ ] stt-004 | Code Implementer | feature / Web admin — by-date mode — hardcoded since `2025-06-01T00:00:00Z`
      Add a “By date” mode in the admin UI that always sends `since = "2025-06-01T00:00:00Z"`; update API client params; hide `maxMessages` by default in this mode; keep `rescanLatest` control.

- [ ] stt-005 | Test Writer | eval / API validation — ISO `since` + future-date rejection — 400 mapping
      Add tests to ensure the route rejects non-ISO/future `since` with HTTP 400 and friendly error mapping; verify OpenAPI reflects the new parameter.

- [ ] stt-006 | Test Writer | eval / Orchestrator — boundary + `rescanLatest` + cap — unit tests
      Mock `GetHistory` to validate: (1) early-stop once older-than-since page encountered, (2) updates within rescan window are applied and clamped by `since`, (3) optional `maxMessages` acts as total processed cap.
