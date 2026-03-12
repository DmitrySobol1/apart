# Web Dashboard — Draft Implementation Plan (MVP)

## Context & Principles

- Pet project, single user; keep it simple and lean.
- Read-only dashboard over backend APIs; no frontend auth now.
- Favor minimal deps and straightforward patterns; avoid enterprise complexity.
- Times shown in local timezone; API queries use UTC. See Date & Time Handling.

## Scope (MVP)

- Browse channels → list posts → view per-post hourly metrics.
- Filters by time range on posts list and on post detail.
- Basic UX: loading states, error messages, empty states.

## Data & API

- Endpoints:
  - `GET /channels`
  - `GET /channels/:username/posts?from&to&limit&offset`
  - `GET /channels/:username/posts/:messageId/metrics?from&to&bucket=hour` (bucket=hour only)
- Defaults: backend clamps ranges to <= 365 days. Frontend defaults to last 30 days.
- Contracts doc: see `.tasks/task-2/api-contracts.md` (TS interfaces).

## Tech Stack Decisions

- Framework/build: React + Vite (already present)
- Routing: React Router (`react-router-dom`)
- Data fetching/cache: SWR (stale-while-revalidate, dedupe, focus refetch)
  - Shared `fetcher` in `api.ts` (central point for headers, errors, future auth)
- Styling: Tailwind CSS (utility-first, fast prototyping)
- Charts: Recharts (simple line/area charts for hourly series)
- Dates: native `Date` + `Intl.DateTimeFormat` (no date libs for MVP)
- State management: local component state only (no global store)
- SSR: none; static SPA build

## UI Structure & Routes

- `/` — Channels list
- `/channels/:username` — Posts list for channel (+date range, pagination)
- `/channels/:username/posts/:messageId` — Post detail with hourly charts

## Screen Structure (Specs)

### Channels List (`/`)

- Layout
  - Header: page title “Channels”.
  - Content: simple table.
- Controls
  - None for MVP.
- Data View (columns)
  - `username` (clickable → posts route), `title`, `addedAt`.
- Interactions
  - Row click navigates to `/channels/:username` for channels with public username.
  - Channels with `username = null` are displayed as non-clickable with hint “no public username (unsupported in MVP)”.
  - Keep route state minimal; no pagination expected (list is small).
- Loading/Empty/Error
  - Loading: skeleton row(s).
  - Empty: guidance “Ingest a channel via admin API…”.
  - Error: inline message + Retry button (SWR mutate/revalidate).
- Responsive
  - Stack columns on mobile; primary shown: `title`, `@username`.

### Channel Posts (`/channels/:username`)

- Layout
  - Header: breadcrumb (Channels / @username) + channel title.
  - Filters: From/To date inputs, Apply/Reset.
  - Content: posts table (sorted by date desc) + Load more.
- Controls & Query Params
  - `from`, `to`: ISO date; persisted in URL (query string). Defaults to last 30 days.
  - `limit` (default 50) and `offset` for pagination; `Load more` increments `offset` by `limit`.
- Data View (columns)
  - `date` (publish DT), `title/snippet`, media icon, latest: `views`, `reactions`, `forwards`, `replies`.
- Interactions
  - Clicking a row → `/channels/:username/posts/:messageId` (preserve `from`, `to` in query).
  - Apply: update URL query and revalidate.
  - Reset: clear `from`/`to` to defaults (e.g., last 30 days).
- Loading/Empty/Error
  - Loading: table skeleton rows.
  - Empty: “No posts for selected range. Try resetting filters.”
  - Error: inline message + Retry; allow re-Apply to refetch.
- Responsive
  - Table collapses to cards; show key metrics and date.
- Pagination & Stability
  - Always request posts sorted by `date` desc.
  - On “Load more”, append results; deduplicate by `messageId` when merging pages.
  - Revalidation should not clear already loaded pages; preserve list until new data arrives.

### Post Detail (`/channels/:username/posts/:messageId`)

- Layout
  - Header: breadcrumb (Channels / @username / #messageId) + title excerpt.
  - Filters: From/To date inputs with Apply/Reset.
  - KPI strip: latest values (views, reactions, forwards, replies).
  - Chart: hourly multi-series (views, reactionsTotal, forwards, replies).
- Controls & Query Params
  - `from`, `to` (persisted in URL) for metrics query.
  - Bucket hardcoded to `hour` (no selector in MVP).
- Data Sources
  - Time series from `/channels/:username/posts/:messageId/metrics`.
  - KPI values: use the last available point within the selected metrics range; optionally prefill from posts list when navigating from it.
- Interactions
  - Static legend (no toggles in MVP).
  - Back navigates to posts list preserving prior `from`/`to` and scroll.
- Loading/Empty/Error
  - Loading: chart skeleton.
  - Empty: no points → “No metrics in selected range.”
  - Error: inline message + Retry.
- Responsive
  - KPIs stacked; chart full width; breakdown wraps to multiple lines.

## Components (minimal)

- `ChannelList` — list of channels
- `DateRangePicker` — start/end (native `<input type="date">`)
- `PostsTable` — table with: date, title/snippet, hasMedia, latest: views/forwards/replies/reactions
- `MetricsChart` — hourly series: views, forwards, replies, reactionsTotal
- `KPIHeader` — latest counters snapshot on detail page (from metrics last point)
- `PageShell` — basic layout/container

## Data Fetching & Caching

- SWR usage:
  - `useSWR(key, fetcher)` for lists and metrics
  - Keys include query params (username, range, pagination)
  - Revalidation on focus enabled; no interval refetch
- Pagination merge strategy:
  - Maintain accumulated items client-side across offsets.
  - Deduplicate by `messageId` when appending.
- Error handling: show inline message with retry button (revalidate)
- Empty states: friendly text when no channels/posts/metrics

## Styling & Theming

- Tailwind setup:
  - `pnpm add -D tailwindcss postcss autoprefixer`
  - `npx tailwindcss init -p`
  - `tailwind.config.{js,ts}` content: `index.html`, `src/**/*.{ts,tsx}`
  - `src/index.css`: `@tailwind base; @tailwind components; @tailwind utilities;`
- Keep custom CSS minimal; utility classes for layout/spacing/typography

## Auth (Future-proofing)

- No auth in frontend now (reads are public). Admin ingestion stays behind Basic Auth on backend.

## Dev/Build Config

- Env: `VITE_API_BASE_URL` for backend origin.
- Dev proxy: configure Vite to proxy `/api` to `VITE_API_BASE_URL` to avoid CORS in dev. Client fetcher prefixes requests with `/api`.
- Router: `BrowserRouter`. Ensure server (Docker/nginx) serves `index.html` as fallback for SPA routes.
- Base path: if app is served under a subpath, set Vite `base` accordingly and configure router basename.
- Username in URLs: use without `@` (e.g., `/channels/ai_architect`). Display with `@` in UI. Normalize inbound values before requests.
- No codegen; define lightweight TS types aligned with backend schemas.

## Deliverables (MVP)

- Dependencies: `react-router-dom`, `swr`, `recharts`, Tailwind toolchain
- `src/lib/api.ts`: shared fetcher (`fetch` + JSON, error mapping)
- Routes/pages and components listed above
- Basic styles with Tailwind and skeleton loaders
- Vite dev proxy for `/api` and documented `VITE_API_BASE_URL`

## Implementation Checklist (Next Steps)

1. Add deps: `react-router-dom`, `swr`, `recharts`, `tailwindcss` + `postcss` + `autoprefixer`
2. Configure Tailwind and wire `index.css`
3. Add router and route components (shell + pages)
4. Implement `api.ts` + SWR fetcher (prefix `/api`, error mapping, `ApiError` support)
5. Channels page: fetch and render list (non-clickable rows for channels without username)
6. Posts page: date range controls; fetch with `limit/offset`; table; load more with dedupe
7. Post detail: fetch metrics; render multi-series chart; KPI header uses last point from metrics
8. Loading/error/empty states; simple UX polish; scroll restoration and query preservation
9. Wire dev proxy and `VITE_API_BASE_URL`; document dev run commands

## Out of Scope (for MVP)

- Auth, roles, JWT/OAuth
- Complex charts/aggregations beyond hourly
- Per-type reaction charts (can parse from `reactionsLatestJson` later if needed)

## Date & Time Handling

- Display: use local timezone for all dates/times in UI (`Intl.DateTimeFormat`).
- Inputs: `<input type="date">` values are local calendar days.
- Conversion to API params:
  - `from`: local day start (`00:00:00.000` local) → convert to UTC → ISO string.
  - `to`: local day end (`23:59:59.999` local) → convert to UTC → ISO string.
  - Both bounds are inclusive. Backend may clamp to ≤ 365 days.
- Default range: last 30 days on posts list and post detail when no params provided.
- Number formatting: `Intl.NumberFormat(navigator.language, { notation: 'compact' })` for counters.

## Error Handling

- Map HTTP status codes to friendly messages:
  - 400: “Invalid filters”; offer to reset and retry.
  - 404: “Not found” (channel or post); link back to previous page.
  - 5xx/Network: “Internal error”; show Retry.
- If response body matches `ApiError`, display `message`; otherwise, show default text.
- Retry action triggers SWR revalidate for the same key.

## References

- API contracts (TS interfaces): `.tasks/task-2/api-contracts.md`
- UI wireframes (ASCII): `.tasks/task-2/ui-wireframes.md`

## Decomposed Subtasks (Dry Run)

- [ ] stt-001 | Code Implementer | feature / Baseline deps — router, SWR, charts — minimal additions
      Install `react-router-dom`, `swr`, `recharts`, and Tailwind toolchain via pnpm; keep dependencies minimal and consistent with monorepo standards.

- [ ] stt-002 | Code Implementer | feature / Tailwind setup — config + wiring — utility-first styles
      Initialize Tailwind config, wire base styles in `index.css`, verify utility classes render in dev.

- [ ] stt-003 | Code Implementer | feature / App shell & routing — pages wired — SPA routes
      Add `PageShell` and `BrowserRouter` with routes `/`, `/channels/:username`, `/channels/:username/posts/:messageId`; create stub pages.

- [ ] stt-004 | Code Implementer | feature / API fetcher — SWR + error mapping — single entry
      Implement shared `api.ts` fetcher (prefix `/api`, read `VITE_API_BASE_URL`), unify JSON parsing and map errors for UI.

- [ ] stt-005 | Code Implementer | feature / Channels list — table view — handle missing usernames
      Render channels table; disable rows without `username` and show hint; include loading, empty, and error states.

- [ ] stt-006 | Code Implementer | feature / Posts list — date filters + pagination — dedupe on append
      Add From/To date inputs (default last 30 days); fetch with `limit/offset`; enforce date-desc sort; implement Load more and deduplicate by `messageId`.

- [ ] stt-007 | Code Implementer | feature / Post detail — hourly chart + KPI — bucket=hour
      Fetch hourly metrics and render multi-series chart; derive KPIs from the last point in the selected range; handle empty/error states.

- [ ] stt-008 | Code Implementer | feature / UX polish — loading/empty/error — scroll & query persistence
      Add skeletons and friendly messages; preserve `from/to` in URL and restore scroll/back navigation between list and detail.

- [ ] stt-009 | Code Implementer | feature / Dev proxy & config — `/api` proxy — SPA fallback
      Configure Vite proxy to `VITE_API_BASE_URL` for `/api`; ensure SPA fallback for router; add brief run notes to project docs if applicable.

- [ ] stt-010 | Test Writer | eval / Quality check — builds + type checks — ready to demo
      Verify build, type-check, and lint pass; manually validate filters, pagination dedupe, KPI equals last metric point, and Retry triggers SWR revalidation.
