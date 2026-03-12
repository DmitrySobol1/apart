# Implementation Plan — Posts Stats (Minimal + 1y History)

Scope (agreed)

- Ingest posts via MTProto userbot (gram.js), sync execution.
- Add new posts; update existing posts (views, reactions, content).
- Private endpoints secured with Basic Auth only (no tests now).
- Channel ref format: `@username`.
- Keep only must-haves; include minimal time‑series for UI trends (no retention/purge for now).

Data Model (use existing schema)

- `channels`: use `tgId`, optional `accessHash`, `username`, `title`.
- `posts`: upsert by `(channel_id, message_id)`; update latest counters and content.
- `post_metrics_hourly`: hourly snapshots with counters (no retention/purge logic for now).

History (1-year view)

- Snapshot on each ingestion run for processed posts into `post_metrics_hourly` with `ts_hour = floor(nowUTC/3600)*3600`.
- UI/query layer clamps to last 365 days when requesting metrics (storage is unbounded for now).
- Note: Telegram does not expose past snapshots. The series begins at first observation; history accrues going forward.

API (v1, minimal)

- POST `/admin/ingest/:username`
  - Auth: Basic Auth.
  - Params: `:username` without `@` in the path (client still supplies `@foo`, server strips `@`).
    - Body (optional): `{ maxMessages?: number, rescanLatest?: number }`
        - `maxMessages` default: unlimited (beware heavy); can set e.g. 5000 for safety.
        - `rescanLatest` default: 200 (re‑fetch newest N to refresh counters/content).
    - Response 200: `{ ok: true, channel: { id, tgId, username, title }, added: number, updated: number }`.
- GET `/channels`
    - Returns tracked channel rows (id, tgId, username, title, addedAt, isTracked).
- GET `/channels/:username/posts?limit=50&offset=0&from&to`
    - Returns posts with latest counters for the channel. Minimal fields for list: `{ channelId, messageId, date, title, hasMedia, viewsLatest, forwardsLatest, repliesLatest, reactionsLatestTotal }`.
- GET `/channels/:username/posts/:messageId/metrics?from&to&bucket=hour`
    - Returns hourly time series from `post_metrics_hourly`. Default `from = post date` and `to = now` (clamped to 365 days).

Auth

- Basic Auth on all `/admin/*` routes.
- Env: `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`.

Config & Env

- MTProto: `API_ID`, `API_HASH`, `SESSION_FILE` or `SESSION_STRING`.
- DB: `DB_PATH` (default `./data/stats.sqlite`).

Schema & Validation

- Source of truth: `packages/database/src/schema.ts` (Drizzle).
- Use `drizzle-zod` to derive Zod schemas from tables:
  - `ChannelRowSchema = createSelectSchema(channels)`
  - `PostRowSchema = createSelectSchema(posts)`
  - `PostMetricsHourlyRowSchema = createSelectSchema(postMetricsHourly)`
  - Context-specific DTOs must be derived via `.pick()` / `.omit()`:
    - `PostListItemSchema = PostRowSchema.pick({ channelId: true, messageId: true, date: true, title: true, hasMedia: true, viewsLatest: true, forwardsLatest: true, repliesLatest: true, reactionsLatestTotal: true })`
    - `PostMetricsPointSchema = PostMetricsHourlyRowSchema.pick({ tsHour: true, views: true, forwards: true, replies: true, reactionsTotal: true })`
  - Request validation:
    - `UsernameParamSchema = z.object({ username: z.string().regex(/^@?[A-Za-z0-9_]{5,}$/) })`
    - `IngestBodySchema = z.object({ maxMessages: z.number().int().positive().optional(), rescanLatest: z.number().int().min(0).max(5000).optional() })`
    - `MetricsQuerySchema = z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional(), bucket: z.enum(['hour']).default('hour') })`
- Types are inferred from Zod: `type PostListItem = z.infer<typeof PostListItemSchema>`.
- Rule: If accessing data-model fields, either reuse an existing derived schema or create a new one from the existing derived schema; do not handcraft shapes.

Ingestion Flow (sync, minimal)

1. Resolve `@username` → MTProto peer:
    - Try cached `channels` row by `username`; if missing or hash invalid, resolve via `contacts.resolveUsername` or list dialogs.
    - Upsert `channels` with `tgId`, `accessHash`, `username`, `title`.
2. Determine boundaries:
    - `highestInDb = max(posts.message_id) for channel` (or 0 if none).
    - `rescanLatest = body.rescanLatest ?? 200`.
3. Fetch newest → oldest in pages (e.g., 100):
    - For each message:
        - Map fields: `date`, `editDate`, `message_type`, `has_media`, `media_kind`, `content_text`, short `title`.
        - Counters: `views`, `forwards`, `replies?.replies`, `reactions?.results` (sum + JSON breakdown with keys: emoji or `custom:<documentId>`).
        - Upsert `posts` by `(channel_id, message_id)`:
            - Insert new posts if `message_id > highestInDb` (count as `added`).
            - Update existing posts when within `rescanLatest` newest messages (count as `updated`).
        - Snapshot: upsert `(channel_id, message_id, ts_hour)` into `post_metrics_hourly` with the counters observed now.
    - Stop when `maxMessages` reached (if provided) or channel history ends.
4. Return summary `{ added, updated }`.

Error Handling (minimal)

- `ACCESS_HASH_INVALID` → re‑resolve peer, update `channels.accessHash`, retry once.
- `FLOOD_WAIT_X` → basic sleep X seconds, then resume current page.
- Any fatal error → 500 with `{ ok: false, error }`.

Implementation Steps

- Backend
  - Add Basic Auth middleware reading `BASIC_AUTH_USER/PASS`; protect `/admin/*`.
  - Routes: `POST /admin/ingest/:username`, `GET /channels`, `GET /channels/:username/posts`, `GET /channels/:username/posts/:messageId/metrics`.
  - Parameter validation: ensure `:username` starts with `@` or strip if present.
  - Validation: add `drizzle-zod` + `zod`; derive DTO schemas from database tables and use `.pick()`/`.omit()` for endpoint-specific shapes.
- Userbot service
  - Initialize `TelegramClient` from existing prototype (`scripts/userbot-fetch-messages.ts`).
  - Implement `resolveChannel(username)` and `iterMessages(peer, opts)` helpers.
  - Implement `upsertChannel` and `upsertPost` using Drizzle.
  - Implement `mapReactions(results)` to JSON array per data model.
  - Implement snapshot write to `post_metrics_hourly` (no purge/retention logic now).
- Persistence
    - Use existing schema; no migrations for v1.
- Logging
    - Basic progress logs: channel, pages processed, added/updated counts.

Acceptance (v1)

- POST `/admin/ingest/@mychannel` ingests and updates posts synchronously; returns added/updated counts.
- GET `/channels` lists the ingested channel.
- GET `/channels/@mychannel/posts` returns posts with latest counters.
- GET `/channels/@mychannel/posts/:messageId/metrics` returns hourly points within requested range (up to 1 year).

Out of Scope (v1)

- Async ingestion, job queues.
- Tests and CI.
- OAuth/JWT; keep Basic Auth only.
