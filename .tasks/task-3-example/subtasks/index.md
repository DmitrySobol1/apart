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

