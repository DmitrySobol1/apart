---
description: System architecture overview for the Apart-NN booking widget and admin panel
status: current
version: 4.0.0
---

# Architecture — Apart-NN Booking Widget

## Overview

The system has three separate applications sharing a single backend:

1. **Booking widget** (`frontend/`) — React SPA delivered inside an `<iframe>` on `apart-nn.ru`. End-customer facing.
2. **Admin panel** (`admin/`) — React SPA for hotel staff. Manages per-room pricing coefficients.
3. **Backend** (`backend/`) — Node.js/Express server. Proxies Bnovo API for the widget, creates real bookings in Bnovo, serves admin API for the panel, persists data in MongoDB.

```
apart-nn.ru (parent page)
  └── <iframe src="http://widget-domain">
        └── React SPA (frontend/)
              └── HTTP /api/* ──→ Express backend (backend/)    ←── MongoDB
                                    ├── HTTPS ──→ public-api.reservationsteps.ru/v1/api
                                    └── HTTPS ──→ reservationsteps.ru/bookings/post/{uid}

Admin browser
  └── React SPA (admin/)   port 5174 (dev)
        └── HTTP /api/admin/* ──→ Express backend (backend/)   ←── MongoDB
```

---

## Tech Stack

### Backend (`backend/`)

| Package | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime (includes native `fetch` for booking POST) |
| Express | ^4.21.2 | HTTP server |
| TypeScript | ^5.7.3 | Type safety |
| tsx | ^4.19.2 | Dev runner (watch mode) |
| Mongoose | ^9.3.0 | MongoDB ODM |
| axios | ^1.7.9 | HTTP client for Bnovo public API |
| zod | ^3.24.1 | Runtime validation (config, request bodies) |
| dotenv | ^16.4.7 | `.env` loading |
| cors | ^2.8.5 | CORS middleware |
| vitest | ^4.0.18 | Test runner |
| supertest | ^7.2.2 | HTTP integration tests |
| mongodb-memory-server | ^11.0.1 | In-process MongoDB for tests |

Note: booking creation uses Node.js built-in `fetch` (no external HTTP library). No new dependencies were added in task-3.

### Frontend (`frontend/`)

| Package | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI library |
| TypeScript | ^5.7.3 | Type safety |
| Vite | ^6.1.0 | Build tool, dev server |
| react-router-dom | ^6.28.1 | Client-side routing |
| axios | ^1.7.9 | HTTP client |
| Tailwind CSS | ^3.4.17 | Utility-first styling |

### Admin Panel (`admin/`)

| Package | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI library |
| TypeScript | ^5.7.3 | Type safety |
| Vite | ^6.1.0 | Build tool, dev server |
| react-router-dom | ^6.28.1 | Client-side routing |
| @mui/material | ^6.1.6 | Material UI component library |
| @emotion/react, @emotion/styled | ^11.x | MUI peer dependencies |
| axios | ^1.7.9 | HTTP client |

All packages use ESLint + TypeScript `strict: true`.

---

## Directory Structure

```
apart-nn-develop/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express app entry point, MongoDB connect
│   │   ├── config.ts                 # Zod-validated env config (incl. bnovoBookingUrl)
│   │   ├── types/
│   │   │   └── index.ts              # AdminRoomResponse, AdminCoefficientResponse
│   │   ├── models/
│   │   │   ├── Room.ts               # Mongoose Room model (bnovoId, name)
│   │   │   └── Coefficient.ts        # Mongoose Coefficient model (3 coefficients)
│   │   ├── services/
│   │   │   ├── bnovo-client.ts       # Axios client for Bnovo public API
│   │   │   ├── bnovo-booking.ts      # Booking creation: POST to reservationsteps.ru, parse 302
│   │   │   ├── room-ranking.ts       # Room ranking: query coefficients, attach numToShowOnFrontend
│   │   │   └── room-sync.ts          # Room sync: 10 date ranges → upsert rooms+coefficients
│   │   ├── routes/
│   │   │   ├── rooms.ts              # GET /api/rooms (with cache)
│   │   │   ├── plans.ts              # GET /api/plans
│   │   │   ├── amenities.ts          # GET /api/amenities
│   │   │   ├── account.ts            # GET /api/account
│   │   │   ├── booking.ts            # POST /api/booking (real Bnovo booking)
│   │   │   └── admin.ts              # GET/PATCH /api/admin/*
│   │   ├── scripts/
│   │   │   └── seed-rooms.ts         # Entry point for `npm run seed:rooms`
│   │   ├── middleware/
│   │   │   └── error-handler.ts      # Express error middleware
│   │   └── __tests__/
│   │       ├── api.test.ts           # 22 booking widget API tests
│   │       ├── bnovo-booking.test.ts # 13 booking service + route tests
│   │       ├── room-sync.test.ts     # 8 room sync unit tests
│   │       ├── admin-api.test.ts     # 13 admin API integration tests
│   │       ├── room-ranking.test.ts  # 5 room ranking unit tests
│   │       └── setup.ts              # Vitest env setup
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   └── .env                          # Not committed (gitignored)
├── frontend/
│   ├── src/
│   │   ├── main.tsx                  # React entry point, iframe detection
│   │   ├── App.tsx                   # Router, guards, iframe resize hook
│   │   ├── types/
│   │   │   └── index.ts              # All TypeScript interfaces (incl. BookingResponse)
│   │   ├── api/
│   │   │   └── client.ts             # Axios instance + error interceptor
│   │   ├── context/
│   │   │   └── BookingContext.tsx    # Global booking state
│   │   ├── pages/
│   │   │   ├── SearchPage.tsx        # Step 1: date + guest search
│   │   │   ├── RoomsPage.tsx         # Step 2: room catalog
│   │   │   ├── BookingPage.tsx       # Step 3: guest form + booking POST
│   │   │   └── ConfirmationPage.tsx  # Step 4: payment redirect screen
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
├── admin/
│   ├── src/
│   │   ├── main.tsx                  # React entry point
│   │   ├── App.tsx                   # ThemeProvider, BrowserRouter, Routes
│   │   ├── types/
│   │   │   └── index.ts              # Room, Coefficient interfaces
│   │   ├── api/
│   │   │   └── client.ts             # Axios instance, getRooms/getCoefficients/patchCoefficient
│   │   ├── components/
│   │   │   └── Navbar.tsx            # AppBar with tab navigation
│   │   └── pages/
│   │       └── CoefficientsPage.tsx  # MUI table, editable coefficients, auto-save
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts                # Port 5174, proxy /api → localhost:3000
├── .memory-bank/fixtures/
│   ├── README.md
│   ├── bnovo-rooms.json
│   ├── bnovo-plans.json
│   ├── bnovo-amenities.json
│   ├── bnovo-roomtypes.json
│   └── bnovo-accounts.json
├── test-iframe.html                  # Standalone iframe embedding test
└── .memory-bank/project_docs/       # This documentation
```

---

## MongoDB Data Model

Two collections managed via Mongoose:

### `rooms` collection

Populated by the room sync script. One document per unique room type from Bnovo.

| Field | Type | Notes |
|---|---|---|
| `bnovoId` | String | Unique. Bnovo room type ID (`id` field from API). |
| `name` | String | Room display name (`name_ru` from Bnovo). |
| `createdAt` | Date | Auto (Mongoose timestamps). |
| `updatedAt` | Date | Auto (Mongoose timestamps). |

### `coefficients` collection

One document per room, created automatically when a new room is discovered by the sync script.

| Field | Type | Notes |
|---|---|---|
| `roomId` | ObjectId | Ref to `Room._id`. |
| `bnovoId` | String | Unique. Matches `rooms.bnovoId`. |
| `coefficient1` | Number | Default: 1. |
| `coefficient2` | Number | Default: 1. |
| `coefficient3` | Number | Default: 1. |
| `updatedAt` | Date | Auto (Mongoose `{ timestamps: { createdAt: false, updatedAt: true } }`). |

---

## Room Sync Flow

The `syncRooms()` service discovers all rooms by querying the Bnovo API across 10 date ranges to maximize coverage (rooms vary by availability period).

```
npm run seed:rooms
  └── syncRooms()
        ├── Build 10 date ranges (offsets: +7, +14, +21, +30, +45, +60, +75, +90, +105, +120 days)
        ├── For each range:
        │     ├── GET Bnovo /rooms?dfrom=...&dto=...
        │     ├── Collect room.id + room.name_ru into a Map (deduplication)
        │     └── 1–2s random delay between requests
        └── For each unique room:
              ├── Room.findOneAndUpdate({ bnovoId }, { name }, { upsert, returnDocument: 'before' })
              └── If new room: Coefficient.updateOne({ $setOnInsert: {...defaults} }, { upsert })
```

The sync is idempotent. Re-running updates room names and skips existing coefficient records (`$setOnInsert` only fires on insert).

**Date format requirement:** `bnovoClient.getRooms()` expects dates in `DD-MM-YYYY` format. The internal `formatDate()` helper in `room-sync.ts` builds this explicitly with `getDate()`/`getMonth()`/`getFullYear()`. Using `toISOString().slice(0, 10)` instead produces `YYYY-MM-DD`, which the Bnovo API rejects with HTTP 406.

---

## Data Flow

### Widget Search Flow

```
User fills dates + guests → clicks "Search"
  → SearchPage converts YYYY-MM-DD to DD-MM-YYYY
  → GET /api/rooms?dfrom=DD-MM-YYYY&dto=DD-MM-YYYY
    → Backend validates dates (format, dto > dfrom)
    → Checks in-memory cache (key: dfrom+dto, TTL: 5 min)
    → If miss: GET public-api.reservationsteps.ru/v1/api/rooms?...
    → Unwraps response.data.rooms array
    → applyRoomRanking(): queries coefficients collection, adds numToShowOnFrontend to each room
    → Caches enriched rooms[], returns to client
  → BookingContext stores { searchParams, rooms }
  → Navigate to /rooms
```

### Widget Booking Flow

```
User clicks "Забронировать" on a RoomCard
  → selectRoom(room) + selectPlan(plan) stored in context
  → Navigate to /booking
  → User fills GuestForm
  → POST /api/booking { dfrom, dto, planId, adults, roomTypeId, guest }
    → Backend validates with Zod (phone: /^\+7\d{10}$/, dates: DD-MM-YYYY, dto > dfrom)
    → createBooking() builds URLSearchParams body
    → fetch() POST to reservationsteps.ru/bookings/post/{uid}
        with redirect: 'manual' and AbortSignal.timeout(15000)
    → Reads 302 Location header
    → Parses bookingNumber, bookingAccommodationAmount, redirectUrl
    → Decodes redirectUrl → extracts away_url (payment URL)
    → Returns { success: true, bookingNumber, paymentUrl, amount }
  → BookingPage: setGuest(data) → navigate('/confirmation', { state: { paymentUrl, bookingNumber, amount } })
  → ConfirmationPage: displays booking info → window.top.location.href = paymentUrl (after 500ms)
    → Top-level page navigates to payment.bnovo.ru → payment.alfabank.ru
```

### Bnovo Payment Redirect Chain

```
POST reservationsteps.ru/bookings/post/{uid}
  → 302 Location: /bookings/preSuccess/{uid}?bookingNumber=XXXXX_DDMMYY
                    &bookingAccommodationAmount=5500
                    &redirectUrl=/away/index/{uid}?away_url=https%3A%2F%2Fpayment.bnovo.ru%2Fv2%2F%3Ftransaction%3Dbook_HASH

payment.bnovo.ru/v2/?transaction=book_{HASH}
  → 302 → payment.bnovo.ru/v2/?transaction=...&goto_hotel_system_id=7163
    → 302 → payment.alfabank.ru/payment/merchants/ecom2/payment_en.html?mdOrder={ORDER_ID}
```

The payment page must open at the top frame level because Alfa-Bank cookies use `SameSite=Lax`, which prevents them from working inside an iframe. `ConfirmationPage` calls `window.top.location.href` with a `try/catch` that falls back to `window.location.href` if a cross-origin restriction is encountered.

With `warrantyType=onlinepay`, unpaid bookings are automatically cancelled by Bnovo after 2 hours — no cleanup logic is needed on our side.

### Admin Coefficient Update Flow

```
Staff opens admin panel (http://localhost:5174)
  → GET /api/admin/coefficients
    → Backend fetches coefficients + joins roomName from rooms collection
    → Returns { data: AdminCoefficientResponse[] }
  → Admin panel renders editable MUI table
  → Staff edits a coefficient cell and clicks away (blur)
    → PATCH /api/admin/coefficients/:bnovoId { coefficientN: value }
      → Backend validates with Zod (positive number, at least one field)
      → Updates MongoDB coefficient document
      → Returns { success: true, data: AdminCoefficientResponse }
    → Cell turns green on success, red on failure
```

---

## iframe Integration

The widget runs inside an `<iframe>` on `apart-nn.ru`. Auto-height is achieved via `postMessage` between the widget and the parent page. The widget detects iframe context at startup and adjusts overflow behavior accordingly.

For full implementation details (useIframeResize hook, ResizeObserver, iframe detection, CSS overflow, page height constraints), see `frontend-guide.md` — sections "iframe Auto-Height Hook", "Iframe Detection and Body Overflow", and "Page Height Constraints".

---

## Security Notes

- `BNOVO_UID` and `BNOVO_ACCOUNT_ID` are read from `backend/.env` at startup (Zod-validated). They are never sent to the frontend.
- CORS is configured to allow `FRONTEND_URL` and, when set, `ADMIN_URL`. Both are filtered from a single array, so only truthy values are included.
- Admin panel has no authentication in this iteration (planned for a future task).
- `POST /api/booking` creates real reservations in Bnovo via `reservationsteps.ru`. Unpaid bookings auto-cancel after 2 hours.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Обзор

Система состоит из трёх приложений на одном бэкенде:
1. **Виджет бронирования** (`frontend/`) — React SPA в `<iframe>` на apart-nn.ru.
2. **Панель администратора** (`admin/`) — React SPA для управления коэффициентами номеров.
3. **Бэкенд** (`backend/`) — Node.js/Express: прокси Bnovo API, реальное создание бронирований в Bnovo, Admin API, MongoDB.

## Поток создания бронирования и оплаты

Пользователь нажимает «Забронировать» → POST /api/booking → бэкенд отправляет form POST на `reservationsteps.ru/bookings/post/{uid}` с `redirect: 'manual'` → читает заголовок Location из ответа 302 → извлекает `bookingNumber`, `bookingAccommodationAmount`, `away_url` (ссылка на оплату) → возвращает `{ success, bookingNumber, paymentUrl, amount }` → ConfirmationPage вызывает `window.top.location.href = paymentUrl` (с задержкой 500мс и fallback) → страница оплаты Bnovo → Альфа-Банк.

Страница оплаты должна открываться на уровне верхнего фрейма, так как cookies Альфа-Банка используют `SameSite=Lax`. При `warrantyType=onlinepay` неоплаченные бронирования автоматически отменяются Bnovo через 2 часа.

## Модель данных MongoDB

Две коллекции:
- **rooms** — типы номеров из Bnovo (`bnovoId: String unique`, `name`, timestamps).
- **coefficients** — коэффициенты per-номер (`bnovoId: String unique`, `roomId: ObjectId ref Room`, `coefficient1/2/3: Number default 1`, `updatedAt`).

## Сервис ранжирования номеров (`room-ranking.ts`)

`applyRoomRanking(rooms)` — вызывается в маршруте `GET /api/rooms` после получения данных из Bnovo. Запрашивает коллекцию `coefficients`, суммирует `coefficient1 + coefficient2 + coefficient3` для каждого номера и добавляет поле `numToShowOnFrontend` к каждому объекту комнаты. Если документ коэффициентов для номера отсутствует, используется значение по умолчанию `3`. При ошибке MongoDB также возвращается `3` для всех номеров, исходные поля не теряются. Обогащённый результат кешируется.

## Синхронизация номеров

`npm run seed:rooms` вызывает `syncRooms()`: запрашивает Bnovo API по 10 диапазонам дат с задержкой 1–2с между запросами, дедуплицирует номера, делает upsert в `rooms` и создаёт соответствующие записи в `coefficients`. Идемпотентна.

**Формат дат:** `bnovoClient.getRooms()` принимает даты в формате `DD-MM-YYYY`. Использование `toISOString().slice(0, 10)` даёт `YYYY-MM-DD`, что приводит к HTTP 406 от Bnovo API.

## Технологический стек (дополнение task-3)

Создание бронирования использует встроенный `fetch` Node.js 18+ с `redirect: 'manual'` и `AbortSignal.timeout(15000)`. Новые зависимости не добавлялись.

## Безопасность

Учётные данные Bnovo только в `backend/.env`. CORS разрешает `FRONTEND_URL` и `ADMIN_URL` (если задан). Панель администратора без авторизации (запланировано в будущих задачах). `POST /api/booking` создаёт реальные бронирования в Bnovo.
