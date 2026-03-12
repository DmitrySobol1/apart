- [x] stt-000 | Code Implementer | spike / Bnovo API exploration — fixtures + .env + data docs — 5 endpoints, real credentials
      Curl all 5 Bnovo public API endpoints, save raw JSON as fixtures, create backend/.env, document field structure in fixtures/README.md, update plan if real data differs from assumptions.

- [x] stt-001 | Code Implementer | feature / Project initialization — monorepo frontend + backend — Vite + Express + strict TS
      Set up frontend/ (Vite + React 18 + TS + Tailwind + Router + Axios) and backend/ (Node.js 18 + Express + TS + Axios + dotenv + cors). Configure tsconfig, Vite dev proxy, dev scripts.

- [x] stt-002 | Code Implementer | feature / Backend Bnovo proxy — bnovoClient + 4 GET routes — 5min cache, 10s timeout
      Implement bnovoClient.ts, 4 proxy routes (rooms, plans, amenities, account), date validation, in-memory cache for /rooms (5 min TTL), error handler middleware, 10s timeout.

- [x] stt-003 | Code Implementer | feature / Backend booking stub — POST /api/booking endpoint — zod validation, console log
      Implement POST /api/booking with zod validation (dates, planId, adults, roomTypeId, guest fields, +7 phone format), console logging, stub response.

- [x] stt-004 | Code Implementer | feature / Frontend foundation — types + API client + BookingContext + routing — redirect guards
      Create TypeScript types, Axios client with error interceptor, BookingContext with state/actions, React Router with 4 routes and stub pages, redirect logic for missing context.

- [x] stt-005 | Code Implementer | feature / SearchPage (Step 1) — DatePicker + GuestCounter + search action — date auto-correction
      Build SearchPage with date pickers, guest counter (+/- buttons, 1-10), Search button, loading/error states, check-out > check-in validation, API call and context storage.

- [x] stt-006 | Code Implementer | feature / RoomsPage (Step 2) — RoomCard + PhotoGallery + PlanSelector — client-side filtering
      Build RoomsPage with room cards: photo gallery, room info, amenity icons, rate plan dropdown, price, availability, Book button. Client-side filtering (available > 0, maxGuests >= adults), sort by price.

- [x] stt-007 | Code Implementer | feature / BookingPage + ConfirmationPage (Steps 3-4) — guest form + stub POST — +7 phone mask
      Build BookingPage (guest form with +7 phone mask, validation, booking summary sidebar, agreement checkbox) and ConfirmationPage (success card, summary, reset). POST /api/booking on submit.

- [x] stt-008 | Code Implementer | feature / Styling + iframe integration — Tailwind theme + postMessage auto-height — no double scrollbars
      Apply consistent Tailwind styling, LoadingSpinner/ErrorMessage components, postMessage-based iframe auto-height, test HTML page with auto-height script, page transitions.

- [x] stt-009 | Test Writer | eval / Integration verification — full flow + iframe + edge cases — real Bnovo API
      Verify full user flow end-to-end with real Bnovo API. Test edge cases (no rooms, invalid dates, empty fields, direct URL access). Test iframe embedding, backend caching, credential isolation.

- [x] stt-010 | Code Implementer | infra / Tooling & config alignment — linters + project-commands + agent configs + hooks

- [x] stt-task-1-fixes-01 | Code Implementer | fix / Backend Vitest CommonJS/ESM compatibility
      Fix Vitest module compatibility issue — tests fail with "cannot be imported in CommonJS" error. (Validator fix)
      After stt-001: configure ESLint + Prettier for both packages, create quality check scripts, update project-commands.md with real commands, update hooks.json and agent configs to match apart-nn project.
