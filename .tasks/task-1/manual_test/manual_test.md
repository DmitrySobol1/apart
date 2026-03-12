# Manual Browser Test Report

**Date:** 2026-03-12
**Environment:** localhost (backend :3000, frontend :5176 via Vite dev)
**Browser:** Chrome (via Claude-in-Chrome extension)
**Tester:** Claude Code (automated browser testing)

---

## Test Results Summary

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1 | SearchPage loads | PASS (after fix) | Hotel name was not displayed before fix |
| 2 | Search rooms | PASS (after fix) | Crashed with `TypeError` before fix |
| 3 | RoomsPage displays room cards | PASS | Photos, amenities, plans, prices all correct |
| 4 | Photo gallery navigation | PASS | Dot indicators visible, multiple photos per room |
| 5 | Amenities display | PASS | Icons and names rendered from API |
| 6 | Plan selector & pricing | PASS | Tariff name and price shown correctly |
| 7 | BookingPage form | PASS | All fields work, phone auto-formatting works |
| 8 | Form validation | PASS | Button disabled until form valid + checkbox checked |
| 9 | Booking submission | PASS | POST /api/booking returns success |
| 10 | ConfirmationPage | PASS | Shows booking summary with guest name |
| 11 | "Back to search" button | PASS | Resets state and navigates to `/` |
| 12 | Console errors | WARNING | React Router v7 future flag warnings (non-critical) |
| 13 | Scroll on /rooms page | PASS (after fix) | Mouse wheel scroll was disabled by `overflow: hidden` on body |
| 14 | "Изменить параметры" in iframe | PASS (after fix) | White screen due to `body.scrollHeight` feedback loop in iframe resize |
| 15 | Stale .js files shadowing .tsx | PASS (after fix) | Vite resolved .js before .tsx, ignoring all .tsx changes |

---

## Bugs Found & Fixed

### BUG-1: CRITICAL — Backend `/api/rooms` response format mismatch

**Symptom:** After clicking "Search", the `/rooms` page is blank (white screen).
Console error: `TypeError: rooms.filter is not a function` at `RoomsPage.tsx:58`.

**Root Cause:** The Bnovo API returns `{"rooms": [...]}` (object with `rooms` key), but the backend route (`backend/src/routes/rooms.ts`) passed the raw response through to the frontend via `res.json(data)`. The frontend `SearchPage.tsx:58` called `setRooms(res.data)` expecting an array, but received an object. Then `RoomsPage` tried `rooms.filter(...)` on the object, causing the crash.

**Fix:** Modified `backend/src/routes/rooms.ts` to unwrap the Bnovo response:
```diff
-    const data = response.data;
-    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
-    return res.json(data);
+    const rooms = response.data.rooms ?? [];
+    cache.set(cacheKey, { data: rooms, expiresAt: Date.now() + CACHE_TTL_MS });
+    return res.json(rooms);
```

**File:** `backend/src/routes/rooms.ts` (line 54-56)

---

### BUG-2: MEDIUM — Backend `/api/account` response format mismatch

**Symptom:** Hotel name not displayed on the SearchPage. The `<h1>` element with hotel name never appears.

**Root Cause:** The Bnovo API returns `{"account": {"id": ..., "name": ...}}` (nested object), but the backend route (`backend/src/routes/account.ts`) passed the raw response through. The frontend `SearchPage.tsx:41` called `setHotelName(res.data.name)`, but `res.data` was `{account: {...}}`, so `res.data.name` was `undefined`.

**Fix:** Modified `backend/src/routes/account.ts` to unwrap the Bnovo response:
```diff
-    res.json(response.data);
+    res.json(response.data.account ?? response.data);
```

**File:** `backend/src/routes/account.ts` (line 9)

---

### WARNING-1: NON-CRITICAL — React Router v7 future flag warnings

**Symptom:** Two console warnings on every page load:
1. `React Router Future Flag Warning: v7_startTransition`
2. `React Router Future Flag Warning: v7_relativeSplatPath`

**Impact:** Non-breaking. These are deprecation warnings about upcoming React Router v7 changes.

**Recommendation:** Add future flags to `<BrowserRouter>` in `App.tsx`:
```tsx
<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
```

---

### BUG-3: MEDIUM — Mouse wheel scroll disabled on /rooms page

**Symptom:** On `http://localhost:5173/rooms`, the mouse wheel does not scroll the room list.

**Root Cause:** `frontend/src/index.css` had `body { overflow: hidden; }` applied unconditionally. This is needed for iframe embedding (parent page controls scrolling), but blocks scrolling when accessing the widget directly via browser.

**Fix:** Changed `index.css` to apply `overflow: hidden` only inside an iframe:
```css
body { overflow: auto; }
body.in-iframe { overflow: hidden; }
```
Added iframe detection in `main.tsx`:
```tsx
if (window.self !== window.top) {
  document.body.classList.add("in-iframe");
}
```

**Files:** `frontend/src/index.css`, `frontend/src/main.tsx`

---

### BUG-4: CRITICAL — White screen when navigating back to search in iframe

**Symptom:** In iframe (`test-iframe.html`), after viewing rooms, clicking "← Изменить параметры" shows a blank white screen instead of the search form. The iframe height balloons to 18000+ px.

**Root Cause:** Two issues combined:
1. **Resize feedback loop:** `useIframeResize()` in `App.tsx` observed `document.body` and sent `document.body.scrollHeight`. In an iframe, body expands to fill the viewport (= iframe height), so `body.scrollHeight` always equals the iframe height, creating a runaway feedback loop where the iframe grows endlessly.
2. **`min-h-screen` on pages:** All pages used Tailwind's `min-h-screen` (`min-height: 100vh`). Inside an iframe, `100vh` = iframe height, which prevented the iframe from shrinking when navigating to a page with less content.

**Fix:**
- Changed `ResizeObserver` to observe `#root` element instead of `body`, and send `root.scrollHeight` (actual content height, not viewport-dependent):
```tsx
const root = document.getElementById("root");
const observer = new ResizeObserver(() => {
  window.parent.postMessage({ type: "resize", height: root.scrollHeight }, "*");
});
observer.observe(root);
```
- Removed `min-h-screen` from all pages (`SearchPage`, `RoomsPage`, `BookingPage`, `ConfirmationPage`), replaced with appropriate padding.
- Added `window.scrollTo(0, 0)` and `scrollToWidget` postMessage on route change.
- Updated `test-iframe.html` to handle `scrollToWidget` message.

**Files:** `frontend/src/App.tsx`, `frontend/src/pages/SearchPage.tsx`, `frontend/src/pages/RoomsPage.tsx`, `frontend/src/pages/BookingPage.tsx`, `frontend/src/pages/ConfirmationPage.tsx`, `frontend/src/index.css`, `frontend/src/main.tsx`, `test-iframe.html`

---

### BUG-5: CRITICAL — Stale .js files shadowing .tsx source files

**Symptom:** All code changes to `.tsx` files had no effect. The widget continued running old code.

**Root Cause:** Every `.tsx` source file had a corresponding pre-compiled `.js` duplicate (e.g., `App.js` alongside `App.tsx`). Vite's default module resolution order is `.mjs` → `.js` → `.ts` → `.tsx`, so it resolved `import App from "./App"` to `App.js` (stale compiled code) instead of `App.tsx` (current source). All fixes to `.tsx` files were silently ignored.

**Fix:** Deleted all 17 stale `.js` duplicates that had `.tsx` counterparts. Kept `client.js` and `types/index.js` which had no `.tsx` versions. Cleared Vite cache (`node_modules/.vite`) and restarted dev server.

**Files deleted:**
- `frontend/src/App.js`
- `frontend/src/main.js`
- `frontend/src/context/BookingContext.js`
- `frontend/src/pages/SearchPage.js`, `RoomsPage.js`, `BookingPage.js`, `ConfirmationPage.js`
- `frontend/src/components/date-picker.js`, `guest-counter.js`, `loading-spinner.js`, `error-message.js`, `photo-gallery.js`, `amenity-list.js`, `plan-selector.js`, `room-card.js`, `guest-form.js`, `booking-summary.js`

---

## Full Flow Walkthrough

### Step 1: SearchPage (`/`)
- Page loads with date pickers (check-in: today, check-out: tomorrow), guest counter (default: 2), and "Search" button
- After fix: Hotel name displayed as heading
- Guest counter +/- buttons work correctly

### Step 2: RoomsPage (`/rooms`)
- After fix: Room cards render with photos, amenities, tariff info, and prices
- Multiple rooms displayed (4 room types with availability)
- "Изменить параметры" link navigates back to search
- Each card shows: max guests, availability, amenities with icons, tariff name, price in rubles

### Step 3: BookingPage (`/booking`)
- Two-column layout: guest form (left) + booking summary (right)
- Summary shows room photo, dates, guests count, tariff, total price
- Form fields: name, surname, phone (auto-format +7(XXX) XXX-XX-XX), email, notes
- Consent checkbox required
- Button disabled until form valid + checkbox checked
- Successful POST to `/api/booking` logged on backend

### Step 4: ConfirmationPage (`/confirmation`)
- Green checkmark icon
- Booking summary: room name, check-in/out dates, guest name
- "Вернуться к поиску" button resets state and returns to `/`

---

## QC Status

| Package | lint | type-check | Result |
|---------|------|------------|--------|
| backend | PASS | PASS | PASS |
| frontend | PASS | PASS | PASS |

---

---

# Отчёт о ручном тестировании в браузере (RU)

> NOTE: Русский перевод для удобства владельца проекта. Основной раздел — английский выше.

## Краткий итог

Проведено сквозное тестирование 4-шагового flow бронирования в браузере Chrome.

**Найдено 5 багов, все исправлены:**

1. **BUG-1 (CRITICAL):** Backend-маршрут `/api/rooms` возвращал сырой ответ Bnovo `{"rooms": [...]}` вместо массива `[...]`. Фронтенд ожидал массив и падал с ошибкой `rooms.filter is not a function`. **Исправлено** в `backend/src/routes/rooms.ts` — распаковка `response.data.rooms`.

2. **BUG-2 (MEDIUM):** Backend-маршрут `/api/account` возвращал `{"account": {...}}` вместо плоского объекта. Фронтенд обращался к `res.data.name` и получал `undefined` — название отеля не отображалось. **Исправлено** в `backend/src/routes/account.ts` — распаковка `response.data.account`.

3. **BUG-3 (MEDIUM):** На странице `/rooms` не работала прокрутка колесом мыши. Причина: `overflow: hidden` на `body` в CSS применялся безусловно. **Исправлено** — `overflow: hidden` теперь только внутри iframe (класс `in-iframe`), при прямом доступе — `overflow: auto`.

4. **BUG-4 (CRITICAL):** В iframe при переходе "← Изменить параметры" (rooms → search) отображался белый экран. Причина: `ResizeObserver` наблюдал за `body` и отправлял `body.scrollHeight`, что создавало петлю обратной связи (iframe рос до 18000+ px). Также `min-h-screen` на страницах привязывал высоту к viewport iframe. **Исправлено** — observer перенесён на `#root`, `min-h-screen` убран со всех страниц, добавлен `scrollTo(0,0)` при смене маршрута.

5. **BUG-5 (CRITICAL):** Все изменения в `.tsx` файлах не применялись. Причина: рядом с каждым `.tsx` файлом лежал устаревший скомпилированный `.js` дубликат. Vite разрешает `.js` раньше `.tsx`, поэтому использовал старый код. **Исправлено** — удалены 17 устаревших `.js` файлов, очищен кеш Vite.

**Предупреждения:** React Router v7 future flag warnings (некритично, рекомендация — добавить future flags).

**После исправлений:** Весь flow работает корректно как при прямом доступе, так и в iframe — поиск, отображение номеров, навигация между страницами, оформление бронирования, страница подтверждения.
