---
description: System architecture overview for the Apart-NN booking widget (task-1 MVP)
status: current
version: 1.0.0
---

# Architecture — Apart-NN Booking Widget

## Overview

The booking widget is a React SPA delivered inside an `<iframe>` on `apart-nn.ru`. A Node.js/Express backend acts as a proxy between the widget and the Bnovo public API, keeping all hotel credentials server-side.

```
apart-nn.ru (parent page)
  └── <iframe src="http://widget-domain">
        └── React SPA (frontend/)
              └── HTTP /api/* ──→ Express backend (backend/)
                                    └── HTTPS ──→ public-api.reservationsteps.ru/v1/api
```

---

## Tech Stack

### Backend (`backend/`)

| Package | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | ^4.21.2 | HTTP server |
| TypeScript | ^5.7.3 | Type safety |
| tsx | ^4.19.2 | Dev runner (watch mode) |
| axios | ^1.7.9 | HTTP client for Bnovo API |
| zod | ^3.24.1 | Runtime validation (config, booking body) |
| dotenv | ^16.4.7 | `.env` loading |
| cors | ^2.8.5 | CORS middleware |
| vitest | ^4.0.18 | Test runner |
| supertest | ^7.2.2 | HTTP integration tests |

### Frontend (`frontend/`)

| Package | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI library |
| TypeScript | ^5.7.3 | Type safety |
| Vite | ^6.1.0 | Build tool, dev server |
| react-router-dom | ^6.28.1 | Client-side routing |
| axios | ^1.7.9 | HTTP client |
| Tailwind CSS | ^3.4.17 | Utility-first styling |

Both packages use ESLint + Prettier with `strict: true` TypeScript.

---

## Directory Structure

```
apart-nn-develop/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express app entry point
│   │   ├── config.ts                 # Zod-validated env config
│   │   ├── services/
│   │   │   └── bnovo-client.ts       # Axios client for Bnovo API
│   │   ├── routes/
│   │   │   ├── rooms.ts              # GET /api/rooms (with cache)
│   │   │   ├── plans.ts              # GET /api/plans
│   │   │   ├── amenities.ts          # GET /api/amenities
│   │   │   ├── account.ts            # GET /api/account
│   │   │   └── booking.ts            # POST /api/booking
│   │   ├── middleware/
│   │   │   └── error-handler.ts      # Express error middleware
│   │   └── __tests__/
│   │       ├── api.test.ts           # 22 integration tests
│   │       └── setup.ts              # Vitest env setup
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   └── .env                          # Not committed (gitignored)
├── frontend/
│   ├── src/
│   │   ├── main.tsx                  # React entry point
│   │   ├── App.tsx                   # Router, guards, iframe hook
│   │   ├── types/
│   │   │   └── index.ts              # All TypeScript interfaces
│   │   ├── api/
│   │   │   └── client.ts             # Axios instance + error interceptor
│   │   ├── context/
│   │   │   └── BookingContext.tsx    # Global booking state
│   │   ├── pages/
│   │   │   ├── SearchPage.tsx        # Step 1: date + guest search
│   │   │   ├── RoomsPage.tsx         # Step 2: room catalog
│   │   │   ├── BookingPage.tsx       # Step 3: guest form
│   │   │   └── ConfirmationPage.tsx  # Step 4: success screen
│   │   ├── components/
│   │   │   ├── date-picker.tsx
│   │   │   ├── guest-counter.tsx
│   │   │   ├── room-card.tsx
│   │   │   ├── photo-gallery.tsx
│   │   │   ├── amenity-list.tsx
│   │   │   ├── plan-selector.tsx
│   │   │   ├── guest-form.tsx
│   │   │   ├── booking-summary.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   └── error-message.tsx
│   │   └── index.css                 # Tailwind base + page-enter animation
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── fixtures/
│   ├── README.md                     # Bnovo API data structure reference
│   ├── bnovo-rooms.json
│   ├── bnovo-plans.json
│   ├── bnovo-amenities.json
│   ├── bnovo-roomtypes.json
│   └── bnovo-accounts.json
├── test-iframe.html                  # Standalone iframe embedding test
└── .memory-bank/project_docs/       # This documentation
```

---

## Data Flow

### Search Flow

```
User fills dates + guests → clicks "Search"
  → SearchPage converts YYYY-MM-DD to DD-MM-YYYY
  → GET /api/rooms?dfrom=DD-MM-YYYY&dto=DD-MM-YYYY
    → Backend validates dates (format, dto > dfrom)
    → Checks in-memory cache (key: dfrom+dto, TTL: 5 min)
    → If miss: GET public-api.reservationsteps.ru/v1/api/rooms?account_id=...&dfrom=...&dto=...
    → Returns rooms[] array
  → BookingContext stores { searchParams, rooms }
  → Navigate to /rooms
  → RoomsPage filters: available > 0 && adults >= searchParams.adults
  → Sorts by minimum plan price ascending
  → Renders RoomCard[] with amenity definitions (fetched from /api/amenities)
```

### Booking Flow

```
User clicks "Забронировать" on a RoomCard
  → selectRoom(room) + selectPlan(plan) stored in context
  → Navigate to /booking
  → BookingPage renders GuestForm + BookingSummary sidebar
  → User fills name, surname, phone (+7 mask), email, notes
  → User checks agreement checkbox
  → "Забронировать" button enabled when form valid + checkbox checked
  → POST /api/booking { dfrom, dto, planId, adults, roomTypeId, guest }
    → Backend validates with Zod (dates, planId, adults, roomTypeId, guest fields)
    → Logs payload with ISO timestamp to console
    → Returns { success: true, message: "Request accepted" }
  → setGuest(guestData) stored in context
  → Navigate to /confirmation
  → ConfirmationPage shows booking summary + "Back to search" button
  → reset() clears all context state → navigate to /
```

---

## iframe Integration

The widget runs inside an `<iframe>` element. To prevent double scrollbars and fit the iframe to its content, the widget sends `postMessage` events to the parent page.

**Widget side** (`App.tsx`):
```
useIframeResize() hook:
  - Creates a ResizeObserver on document.body
  - On any body size change: postMessage({ type: "resize", height: document.body.scrollHeight }, "*")
  - Also fires on route change (via useLocation)
```

**Parent page** (`test-iframe.html`):
```html
<iframe id="widget" src="http://localhost:5173"></iframe>
<script>
  window.addEventListener('message', function(event) {
    if (event.data?.type === 'resize') {
      iframe.style.height = event.data.height + 'px';
    }
  });
</script>
```

The iframe has no fixed height set in HTML. The parent script sets `height` dynamically from messages. This eliminates iframe scrollbars while the parent page scrolls normally.

---

## Security Notes

- `BNOVO_UID` and `BNOVO_ACCOUNT_ID` are read from `backend/.env` at startup (Zod-validated). They are never sent to the frontend.
- CORS is configured to allow only `FRONTEND_URL` (default: `http://localhost:5173`).
- Frontend bundle credential check: `npm run test:bundle` in `frontend/` builds the bundle and scans it for credential strings.
- `POST /api/booking` is a stub: it validates and logs, but creates no real reservation in Bnovo.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Обзор

Виджет бронирования — это React SPA, встроенный через `<iframe>` на `apart-nn.ru`. Бэкенд на Node.js/Express выступает прокси между виджетом и публичным API Bnovo, хранит все учётные данные отеля на стороне сервера.

## Техстек

**Бэкенд:** Node.js 18+, Express ^4.21.2, TypeScript ^5.7.3, Zod, Axios, dotenv, Vitest.

**Фронтенд:** React ^18.3.1, TypeScript ^5.7.3, Vite ^6.1.0, React Router v6, Axios, Tailwind CSS ^3.4.17.

## Поток данных

**Поиск:** Пользователь вводит даты и количество гостей → фронтенд конвертирует даты в формат DD-MM-YYYY → GET /api/rooms → бэкенд проверяет кэш (5 мин, ключ dfrom+dto) → запрашивает Bnovo API → возвращает массив номеров → фронтенд фильтрует и сортирует.

**Бронирование:** Пользователь выбирает номер → заполняет форму гостя → нажимает «Забронировать» → POST /api/booking → бэкенд валидирует (Zod) и логирует → возвращает `{ success: true }` → фронтенд показывает страницу подтверждения.

## Интеграция iframe

Виджет отправляет `postMessage({ type: "resize", height })` родительской странице при каждом изменении размера. Родительская страница устанавливает высоту iframe по этим сообщениям, исключая двойной скролл.

## Безопасность

Учётные данные Bnovo (`BNOVO_UID`, `BNOVO_ACCOUNT_ID`) хранятся только в `backend/.env`, никогда не передаются клиенту. CORS ограничен значением `FRONTEND_URL`. `POST /api/booking` — MVP-заглушка, реального бронирования не создаёт.
