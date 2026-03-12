- [ ] stt-001 | Code Implementer | feature / Baseline deps — router, SWR, charts — minimal additions
      Install react-router-dom, swr, recharts, and Tailwind toolchain via pnpm; keep dependencies minimal and consistent with monorepo standards.

- [ ] stt-002 | Code Implementer | feature / Tailwind setup — config + wiring — utility-first styles
      Initialize Tailwind config and wire base styles in index.css; verify utility classes render in dev.

- [ ] stt-003 | Code Implementer | feature / App shell & routing — pages wired — SPA routes
      Add PageShell and BrowserRouter with routes /, /channels/:username, /channels/:username/posts/:messageId; create stub pages.

- [ ] stt-004 | Code Implementer | feature / API fetcher — SWR + error mapping — single entry
      Implement shared api.ts fetcher (prefix /api) to unify JSON parsing and map errors for UI.

- [ ] stt-005 | Code Implementer | feature / Channels list — table view — handle missing usernames
      Render channels table; disable rows without username and show hint; include loading, empty, and error states.

- [ ] stt-006 | Code Implementer | feature / Posts list — date filters + pagination — dedupe on append
      Add From/To date inputs (default last 30 days); fetch with limit/offset; enforce date-desc sort; implement Load more and deduplicate by messageId.

- [ ] stt-007 | Code Implementer | feature / Post detail — hourly chart + KPI — bucket=hour
      Fetch hourly metrics and render multi-series chart; derive KPIs from the last point in the selected range; handle empty/error states.

- [ ] stt-008 | Code Implementer | feature / UX polish — loading/empty/error — scroll & query persistence
      Add skeletons and friendly messages; preserve from/to in URL and restore scroll/back navigation between list and detail.

- [ ] stt-009 | Code Implementer | feature / Dev proxy & config — /api proxy — SPA fallback
      Configure Vite proxy to VITE_API_BASE_URL for /api; ensure SPA fallback for router.

- [ ] stt-010 | Test Writer | eval / Quality check — builds + type checks — ready to demo
      Verify build, type-check, and lint pass; manually validate filters, pagination dedupe, KPI equals last metric point, and Retry triggers SWR revalidation.

- [ ] stt-011 | Code Implementer | fix / Web dashboard — metrics tsHour alignment + default 30d range — consistent API contracts
      Align frontend metrics time key with backend (`tsHour`) and auto-apply last-30-days defaults when `from`/`to` are absent on posts list and post detail; standardize env var naming/docs for web proxy.
