# Code Audit Report — task-1 (Manual Test Fixes)

**Date:** 2026-03-12
**Auditor:** Claude Code
**Scope:** Changes applied during manual browser testing session (BUG-1 through BUG-5 + iframe resize fixes)
**Reference:** `.tasks/task-1/manual_test/manual_test.md`

---

## 1. Summary of Changes Reviewed

Five bugs were identified and fixed during manual testing:

| Bug ID | Severity | File(s) Changed | Description |
|--------|----------|-----------------|-------------|
| BUG-1 | CRITICAL | `backend/src/routes/rooms.ts` | Bnovo response unwrapping — `response.data.rooms ?? []` |
| BUG-2 | MEDIUM | `backend/src/routes/account.ts` | Bnovo response unwrapping — `response.data.account ?? response.data` |
| BUG-3 | MEDIUM | `frontend/src/index.css`, `frontend/src/main.tsx` | Conditional `overflow: hidden` via `in-iframe` class |
| BUG-4 | CRITICAL | `frontend/src/App.tsx`, all 4 pages, `index.css`, `main.tsx`, `test-iframe.html` | iframe resize feedback loop fix — observe `#root`, remove `min-h-screen` |
| BUG-5 | CRITICAL | 17 stale `.js` files deleted | Stale compiled `.js` files shadowing `.tsx` source files |

---

## 2. Subtask-by-Subtask Checklist

### stt-002 — Backend Bnovo proxy (rooms, plans, amenities, account)

- [x] No stub functions
- [x] All business logic fully coded (date validation, caching, timeout, error handler)
- [x] All integration points functional (bnovoClient proxies to Bnovo API)
- [x] All error handling implemented (AppError, errorHandler middleware)
- [x] All interfaces/types/schemas implemented
- [x] BUG-1 FIX verified: `rooms.ts` unwraps `response.data.rooms ?? []` — correct
- [x] BUG-2 FIX verified: `account.ts` unwraps `response.data.account ?? response.data` — correct
- [ ] **MINOR:** `plans.ts` and `amenities.ts` pass raw Bnovo responses through without unwrapping. This is consistent with how the frontend consumes them (`RoomsPage` reads `res.data.amenities`, which is the wrapped object), but it creates an inconsistency with the rooms/account pattern where unwrapping happened to be required. No current bug, but the discrepancy is a latent risk.
- [ ] **MINOR:** `bnovoClient.getAmenities()` does not pass `account_id` as a parameter (unlike `getRooms` and `getPlans`). If the Bnovo API requires it for amenities, this would silently fail or return unexpected data. No test coverage for this edge case.

### stt-003 — Backend booking stub (POST /api/booking)

- [x] No stub functions — MVP stub is intentional and clearly documented
- [x] Zod validation fully implemented (dates, phone regex, email, positive integers)
- [x] Date ordering validation present (`dto > dfrom`)
- [x] Console logging implemented
- [x] Stub response `{ success: true, message: "Request accepted" }` correct per plan

### stt-004 — Frontend types + API client + BookingContext + routing

- [x] All TypeScript types defined (`Room`, `RoomPlan`, `RoomPhoto`, `Amenity`, `AmenityGroup`, `GuestData`, `SearchParams`, `BookingRequest`, `BookingResponse`)
- [x] Axios client with error interceptor implemented
- [x] BookingContext with all state/actions implemented (`setSearchParams`, `setRooms`, `selectRoom`, `selectPlan`, `setGuest`, `reset`)
- [x] React Router with 4 routes and redirect guards implemented
- [x] `GuardedRoute` checks `searchParams` before allowing `/rooms` and `/booking`
- [ ] **MINOR:** `/confirmation` route has no guard — a user can navigate directly to `/confirmation` without completing a booking. `selectedRoom` and `guest` will be `null`, and the page renders with an empty summary block. This is graceful degradation but slightly inconsistent with the guard pattern on other routes.
- [ ] **MINOR:** `client.js` (compiled JS) still exists alongside `client.ts` in `frontend/src/api/`. The BUG-5 fix deleted duplicates where `.tsx` files existed but retained this file. Vite's default `resolve.extensions` order (`['.mjs', '.js', '.ts', '.tsx', '.jsx']`) means `import client from "../api/client"` will resolve to `client.js` (the old compiled file) rather than `client.ts`. The `client.js` content is functionally equivalent to `client.ts` (it is a compiled copy), so this causes no current runtime error, but it is the same class of shadow bug as BUG-5. Any future changes to `client.ts` will be silently ignored.
- [ ] **MINOR:** Same issue applies to `frontend/src/types/index.js`. This file contains only `export {};`, which is harmless (TypeScript type-only exports compile to nothing), but the pattern is inconsistent and should be removed for cleanliness.

### stt-005 — SearchPage

- [x] Date pickers with check-out auto-correction implemented
- [x] Guest counter (1–10) implemented
- [x] Hotel name fetched from `/api/account` and displayed
- [x] Search button with loading/error states
- [x] BUG-2 FIX in effect: `setHotelName(res.data.name)` now correctly receives a flat object with `name` field
- [x] No `min-h-screen` (BUG-4 fix applied)
- [ ] **MINOR:** Date picker labels say "Check-in" / "Check-out" in English while all other UI is in Russian. Inconsistent language.

### stt-006 — RoomsPage

- [x] Room cards with photo gallery, amenity icons, plan selector, price, availability
- [x] Client-side filtering (`available > 0`, `adults >= searchParams.adults`)
- [x] Sorted by minimum price
- [x] "Изменить параметры" link navigates back to search
- [x] BUG-1 FIX in effect: `rooms.filter(...)` now operates on an array
- [x] No `min-h-screen` (BUG-4 fix applied)

### stt-007 — BookingPage + ConfirmationPage

- [x] Guest form with +7 phone mask, validation, blur-on-touch error display
- [x] Agreement checkbox required before submit
- [x] Booking summary sidebar with room photo, dates, guests, tariff, total
- [x] POST `/api/booking` on submit with correct payload shape
- [x] ConfirmationPage: green checkmark, booking summary, "Вернуться к поиску" button
- [x] `reset()` called on back-to-search to clear context state
- [x] No `min-h-screen` (BUG-4 fix applied)

### stt-008 — Styling + iframe integration

- [x] BUG-3 FIX verified: `body { overflow: auto }` + `body.in-iframe { overflow: hidden }` in `index.css`
- [x] `main.tsx` correctly sets `in-iframe` class when `window.self !== window.top`
- [x] BUG-4 FIX verified: `useIframeResize()` observes `#root` element, sends `root.scrollHeight`
- [x] `window.scrollTo(0, 0)` and `scrollToWidget` postMessage on route change
- [x] `test-iframe.html` handles both `resize` and `scrollToWidget` messages
- [x] `page-enter` animation applied via `PageWrapper`
- [ ] **MINOR:** `useIframeResize()` always runs (not conditionally for iframe context), meaning non-iframe direct browser access also fires `window.parent.postMessage(...)` on every resize. Since `window.parent === window` in a non-iframe context, `postMessage` fires on `window` itself, which is harmless but generates unnecessary events. Could be guarded with the `in-iframe` class check.
- [ ] **MINOR:** React Router v7 future flag warnings remain (documented in manual test as WARNING-1). Recommendation to add `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` to `<BrowserRouter>` in `App.tsx` was noted but not implemented.

### stt-009 — Integration verification

- [x] Full flow tested and passing (SearchPage → RoomsPage → BookingPage → ConfirmationPage)
- [x] iframe embedding tested and fixed
- [x] Backend caching verified (5-min TTL present in code)
- [x] Credential isolation verified (bundle check script confirms no Bnovo credentials in production JS)
- [x] Backend tests: 22/22 passing

### stt-010 — Tooling & config

- [x] ESLint + Prettier configured for both packages
- [x] QC scripts present (`npm run qc` runs lint + type-check)
- [x] Backend: lint PASS, type-check PASS, build PASS
- [x] Frontend: lint PASS, type-check PASS, build PASS

---

## 3. Issues Found

### CRITICAL

None.

### MAJOR

None.

### MINOR

| # | ID | Location | Description |
|---|-----|----------|-------------|
| M-1 | Shadow risk | `frontend/src/api/client.js` | ~~Stale compiled `.js` file exists alongside `client.ts`.~~ **FIXED:** File deleted. |
| M-2 | Shadow risk | `frontend/src/types/index.js` | ~~Stale `index.js` alongside `index.ts`.~~ **FIXED:** File deleted. |
| M-3 | UX/language | `frontend/src/components/date-picker.tsx` | ~~Labels "Check-in" / "Check-out" in English.~~ **FIXED:** Labels changed to "Заезд" / "Выезд". |
| M-4 | Route guard | `frontend/src/pages/ConfirmationPage.tsx` | No guard on `/confirmation` route. Direct navigation renders page with `null` room/guest data, showing empty summary. Consistent with MVP scope but worth noting. |
| M-5 | postMessage noise | `frontend/src/App.tsx` (useIframeResize) | `postMessage` fires unconditionally even when not in an iframe. Functionally harmless but creates unnecessary events. Could be gated on `window.self !== window.top`. |
| M-6 | Consistency | `backend/src/routes/amenities.ts` and `plans.ts` | Raw Bnovo response passed through (no unwrapping). Consistent with frontend expectations today, but inconsistent with the pattern established by the BUG-1/BUG-2 fixes. Latent risk if Bnovo wraps these responses differently. |
| M-7 | Warnings | `frontend/src/App.tsx` | React Router v7 future flag warnings not suppressed. Non-breaking but noisy in console. |
| M-8 | Test mock alignment | `backend/src/__tests__/api.test.ts` | ~~Mock `getRooms` returned `{ data: [...] }` instead of `{ data: { rooms: [...] } }`.~~ **FIXED:** Mock updated to `{ data: { rooms: [...] } }`. Also fixed `getAccount` mock to `{ data: { account: {...} } }`. All 22 tests pass. |

---

## 4. Security Assessment

- Bnovo credentials (`BNOVO_UID`, `BNOVO_ACCOUNT_ID`) are stored only in backend `.env` and never sent to the client.
- Production bundle credential check: PASS (no Bnovo credentials found).
- CORS configured to restrict frontend origin only (`config.frontendUrl`).
- `window.parent.postMessage` uses `"*"` as target origin — acceptable for MVP iframe resize but should use a specific origin in production to prevent information leakage.
- No authentication or admin panel (by design, MVP scope).

---

## 5. Build & Test Results

| Package | lint | type-check | build | tests | Result |
|---------|------|------------|-------|-------|--------|
| backend | PASS | PASS | PASS | 22/22 PASS | **PASS** |
| frontend | PASS | PASS | PASS | N/A | **PASS** |

---

## 6. Overall Assessment

**AUDIT_STATUS: PASSED**
**TEST_STATUS: PASSED**

All five bugs identified during manual testing were correctly diagnosed and fixed. The root causes were accurately identified in each case. The fixes are minimal, targeted, and do not introduce regressions. All code is functional with no stub implementations beyond the intentional booking MVP stub.

All previously noted minor issues M-1, M-2, M-3, and M-8 have been fixed in a follow-up pass. Stale `.js` shadow files deleted, DatePicker labels localized to Russian, and test mocks aligned with actual Bnovo response structure. All 22 backend tests pass.

The iframe integration is now robust: the resize feedback loop is eliminated, scroll behavior is correct in both direct-browser and iframe contexts, and the test-iframe.html page correctly handles both resize and scroll-to-widget postMessages.

---

---

# Отчёт об аудите кода — task-1 (Исправления по результатам ручного тестирования)

> NOTE: Русский перевод для удобства владельца проекта. Основной (авторитетный) раздел — английский выше.

**Дата:** 2026-03-12
**Аудитор:** Claude Code
**Область:** Изменения, внесённые в ходе сессии ручного тестирования в браузере (BUG-1 — BUG-5 + исправления iframe)

---

## Краткий итог

В ходе ручного тестирования было выявлено и исправлено 5 багов. Все исправления проверены, функциональный код полон, тесты проходят.

**Статус проверки кода:** PASSED (нет критических и серьёзных замечаний)
**Статус тестов:** PASSED (22/22 тестов бэкенда проходят)

### Найденные замечания

**Критических и серьёзных проблем не найдено.**

**Незначительные замечания (8 штук):**

1. **M-1 (Риск shadow-файла):** ~~`frontend/src/api/client.js`~~ — **ИСПРАВЛЕНО:** файл удалён.

2. **M-2 (Риск shadow-файла):** ~~`frontend/src/types/index.js`~~ — **ИСПРАВЛЕНО:** файл удалён.

3. **M-3 (Язык UI):** ~~Метки "Check-in" / "Check-out" на английском~~ — **ИСПРАВЛЕНО:** заменены на «Заезд» / «Выезд».

4. **M-4 (Охрана маршрута):** Страница `/confirmation` не защищена redirect guard-ом. При прямом переходе отображается пустое резюме, но без ошибки.

5. **M-5 (Лишние события):** `useIframeResize` в `App.tsx` отправляет `postMessage` даже при прямом (не-iframe) открытии. Функционально безвредно, но создаёт лишние события.

6. **M-6 (Непоследовательность):** `amenities.ts` и `plans.ts` возвращают сырой ответ Bnovo без распаковки (в отличие от `rooms.ts` и `account.ts`). Сейчас работает корректно, но создаёт несогласованность.

7. **M-7 (Предупреждения в консоли):** React Router v7 future flag warnings не подавлены. Некритично.

8. **M-8 (Mock в тесте):** ~~Mock не соответствовал реальной структуре ответа Bnovo~~ — **ИСПРАВЛЕНО:** mock `getRooms` обновлён до `{ data: { rooms: [...] } }`, mock `getAccount` обновлён до `{ data: { account: {...} } }`. Все 22 теста проходят.

### Общий вывод

Все баги исправлены корректно. Замечания M-1, M-2, M-3 и M-8 также исправлены: устаревшие JS-файлы удалены, метки DatePicker переведены на русский, моки тестов обновлены под реальную структуру ответов Bnovo. Все 22 теста проходят.
