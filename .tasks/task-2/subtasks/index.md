- [x] stt-001 | Code Implementer | infra / MongoDB setup — Mongoose connection, Room + Coefficient models — unique indexes, graceful fallback
      Install mongoose in backend. Create Room and Coefficient models with schemas and unique indexes on bnovoId. Add MONGODB_URI and ADMIN_URL to config. Connect to MongoDB on startup (graceful — log warning if fails). Update CORS origins array.

- [x] stt-002 | Code Implementer | feature / Room sync service — Bnovo API 10 date ranges, upsert rooms + coefficients — seed script
      Create room-sync.ts service and seed-rooms.ts script. Query Bnovo GET /rooms with 10 dynamic date ranges, collect unique rooms, upsert into DB, create default coefficient entries for new rooms.

- [x] stt-003 | Code Implementer | feature / Admin API endpoints — GET rooms, GET coefficients, PATCH coefficients/:bnovoId — Zod validation
      Create admin.ts routes with guard middleware (503 if MongoDB down). GET rooms sorted by name. GET coefficients joined with room names. PATCH with Zod validation, comma/dot normalization.

- [x] stt-004 | Code Implementer | infra / Admin panel initialization — Vite + React + MUI + Router — navbar with tabs, API client
      Initialize admin/ directory with Vite + React 18 + TypeScript + Material UI. Build Navbar with tab navigation, API client, TypeScript types. Dev server on port 5174 with proxy to backend.

- [x] stt-005 | Code Implementer | feature / Coefficients page — MUI table with editable cells, auto-save on blur — visual feedback
      Build CoefficientsPage with MUI Table. Editable numeric TextFields (2 decimal places, dot/comma). Auto-save via PATCH on blur. Green highlight on success, error snackbar. Loading skeleton, error state with retry.

- [x] stt-006 | Test Writer | eval / Integration tests — room sync + admin API + coefficient CRUD — Vitest
      Write integration tests for room sync service (mock Bnovo, verify DB), admin API endpoints (supertest), default coefficients, upsert idempotency, decimal normalization, 404/400 validation errors.

- [ ] stt-task-2-fixes-01 | Code Implementer | fix / Admin panel type mismatch and API response unwrapping (audit-2026-03-13-04-45)
      Fix bnovoId type (number→string), API client response envelope unwrapping (r.data→r.data.data), and deprecated Mongoose option in room-sync.ts.
