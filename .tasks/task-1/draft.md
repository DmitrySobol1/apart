# Task-1 — Apart-Hotel Online Booking Widget (MVP)

> **NOTE:** Этот документ — черновик. Актуальный план реализации находится в [plan.md](./plan.md). Декомпозиция подзадач — в [subtasks/index.md](./subtasks/index.md).

## Summary

Build a custom online booking widget for the apart-hotel (apart-nn.ru) to replace the current Bnovo widget. The widget is embedded via iframe. The MVP provides: room availability search by dates/guests, room catalog with photos/amenities/rate plans, guest data form, and a "Request received" stub page. Real booking submission to Bnovo and payment integration are deferred to future versions. Backend proxies all GET requests to the Bnovo public API to avoid CORS issues and keep credentials server-side.

## Goals

- Frontend widget (React + TypeScript + Vite + Tailwind) with 4-step flow: Search → Room catalog → Guest form → Confirmation stub.
- Backend proxy (Node.js + Express + TypeScript) forwarding GET requests to `public-api.reservationsteps.ru` and exposing a POST `/api/booking` stub.
- Widget is embeddable via iframe on `apart-nn.ru`.
- All Bnovo identifiers (UID, account_id) are stored server-side in `.env`, never exposed to the client.
- POST `/api/booking` logs the received data and returns `{ success: true }` — no real booking is created in Bnovo (MVP).

## Architecture

### MVP Architecture

```
┌─────────────────────────────────────────────┐
│  Site apart-nn.ru                           │
│  <iframe src="https://widget.apart-nn.ru/"> │
│  ┌───────────────────────────────────────┐  │
│  │  Frontend (React)                     │  │
│  │  Booking Widget                       │  │
│  └──────────────┬────────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Backend (Node.js)                          │
│  - Proxy GET → Bnovo public API             │
│  - POST /api/booking → stub (MVP)           │
│  - Serve frontend static files              │
└──────────────┬──────────────────────────────┘
               │
         GET requests
               │
               ▼
┌──────────────────────────────────────────────┐
│  Bnovo Public API                            │
│  public-api.reservationsteps.ru (JSON)       │
│  No authorization required                   │
└──────────────────────────────────────────────┘
```

### Post-MVP Architecture (future)

```
Backend additionally:
  - POST /api/booking → POST reservationsteps.ru/bookings/post/{uid}
  - Parse response → booking number + payment link
  - Redirect user to payment.bnovo.ru
```

### Why a backend proxy is needed

1. **CORS** — direct browser requests to `public-api.reservationsteps.ru` may be blocked.
2. **Security** — UID and account_id must not be hardcoded on the client.
3. **Control** — ability to log, validate, and transform data.
4. **Future** — entry point for POST booking, admin panel, and custom logic.

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| React 18+ | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| React Router | SPA navigation between steps |
| Axios | HTTP requests to backend |

### Backend

| Technology | Purpose |
|-----------|---------|
| Node.js 18+ | Server platform |
| Express | HTTP framework |
| TypeScript | Type safety |
| node-fetch / axios | Requests to Bnovo API |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| dotenv | Configuration (UID, account_id) |

## API Interaction with Bnovo

### Reading Data (Public API)

**Base URL:** `https://public-api.reservationsteps.ru/v1/api/`

| Endpoint | MVP Purpose | Parameters |
|----------|------------|-----------|
| `GET /rooms` | Room list with prices | `account_id`, `dfrom` (d-m-Y), `dto` (d-m-Y) |
| `GET /roomtypes` | Room type catalog | `account_id` |
| `GET /plans` | Rate plans | `account_id` |
| `GET /amenities` | Amenities (icons, names) | — |
| `GET /accounts` | Hotel information | `uid` |

### Booking Creation (NOT in MVP — future version)

> **MVP:** clicking "Book" shows a "Request received" stub.
> Real Bnovo submission will be implemented in the next version.

**Reference for future implementation** (details in info.md, section 10):
- `POST https://reservationsteps.ru/bookings/post/{uid}` (form-urlencoded)
- No auth, no CSRF
- Response: 302 → preSuccess with booking number and payment link
- Payment via redirect to `payment.bnovo.ru`

## Backend API (Our Server)

| Method | Path | Description | Proxies to |
|--------|------|-------------|-----------|
| `GET` | `/api/rooms` | Available rooms with prices | `public-api.../rooms?account_id=...&dfrom=...&dto=...` |
| `GET` | `/api/plans` | Rate plans | `public-api.../plans?account_id=...` |
| `GET` | `/api/amenities` | Amenities (icons) | `public-api.../amenities` |
| `GET` | `/api/account` | Hotel information | `public-api.../accounts?uid=...` |
| `POST` | `/api/booking` | Accept request (MVP: stub) | MVP: log + respond "accepted". Future: `reservationsteps.ru/bookings/post/{uid}` |

### POST /api/booking (MVP — stub)

**Input (from frontend):**
```json
{
  "dfrom": "01-03-2026",
  "dto": "03-03-2026",
  "planId": 128501,
  "adults": 2,
  "roomTypes": { "357520": { "c": 1, "bv": 3 } },
  "guest": {
    "name": "Ivan",
    "surname": "Ivanov",
    "phone": "+7(999)123-4567",
    "email": "ivan@mail.ru",
    "notes": ""
  }
}
```

**Output (MVP):**
```json
{
  "success": true,
  "message": "Request accepted"
}
```
> Backend logs the received data (console.log). Real Bnovo submission — in future version.

## User Flow (MVP)

### Step 1: Search Form

```
┌─────────────────────────────────┐
│  Check-in        Check-out      │
│  [  01.03.26 ]   [  03.03.26 ] │
│                                 │
│  Guests: [ 2 ]                  │
│                                 │
│        [ Search ]               │
└─────────────────────────────────┘
```
- User selects dates and number of guests
- Clicks "Search"
- Frontend sends GET to our backend → backend queries `/rooms` from Bnovo
- Returns list of available rooms with prices

### Step 2: Room Selection

```
┌─────────────────────────────────┐
│  [Photo]   Studio Deluxe        │
│  28 m² · up to 4 guests        │
│  WiFi, AC, kitchen...           │
│                                 │
│  Plan: Online booking           │
│  8,800 RUB for 2 nights        │
│  Available: 2 rooms             │
│                                 │
│  [ Book ]                       │
├─────────────────────────────────┤
│  [Photo]   Studio Standard      │
│  ...                            │
└─────────────────────────────────┘
```
- Room cards: photo gallery, name, description, area, amenities
- Rate plan selection (if multiple)
- Price for the entire period
- Available room count
- "Book" button

### Step 3: Guest Data & Confirmation

```
┌─────────────────────────────────┐
│  First name: [ Ivan           ] │
│  Last name:  [ Ivanov         ] │
│  Phone:      [ +7(999)123-45  ] │
│  Email:      [ ivan@mail.ru   ] │
│  Notes:      [ Late check-in  ] │
│                                 │
│  Total: 8,800 RUB for 2 nights │
│  Studio Deluxe, 01-03.03.2026  │
│                                 │
│  [x] I agree to the terms       │
│                                 │
│  [ Book ]                       │
└─────────────────────────────────┘
```
- Guest data form
- Total cost, selected room and dates
- Agreement checkbox
- Confirmation button

### Step 4: "Request Received" Stub (MVP)

```
┌─────────────────────────────────┐
│                                 │
│      Request Received!          │
│                                 │
│  Thank you for your request.    │
│  We will contact you shortly.   │
│                                 │
│  [ Back to Search ]             │
└─────────────────────────────────┘
```
- Frontend sends data to backend (POST /api/booking)
- Backend saves data to log (console.log / file) — for debugging
- **No booking is created in Bnovo** (MVP)
- User sees a "Request received" stub page

> **Future version:** backend sends POST to reservationsteps.ru, gets booking number and payment link, redirects user to payment.bnovo.ru

## Key Technical Decisions

### Room Data
- Description: `description_ru || description` (fallback, inconsistent filling)
- Name: `name_ru || name`
- Area: `amenities["1"].value` (m²)
- Photos: `photos[].url` for cards (1050x600), `photos[].original_url` for lightbox
- Photo sorting by `order`
- Room ID is a **string**, not a number

### Date Formats
- For `/rooms`: `d-m-Y` (01-03-2026)
- For `/min_prices`, `/closed_dates_with_reasons`: `YYYY-MM-DD` (future versions)

### Booking (MVP)
- On "Book" click — POST to our backend, backend logs data
- Show "Request received" stub
- Payment and real Bnovo booking — in future version

### Rooms API Response (~1.5 MB)
- Large data — backend should cache the response for a few minutes
- Frontend should display only rooms with `available > 0`

## Project Structure

```
apart-nn-develop/
├── frontend/                     <- React app (widget)
│   ├── src/
│   │   ├── main.tsx                      <- React entry point
│   │   ├── App.tsx                       <- Root component + routing
│   │   ├── pages/
│   │   │   ├── SearchPage.tsx            <- Step 1: search form
│   │   │   ├── RoomsPage.tsx             <- Step 2: room list
│   │   │   ├── BookingPage.tsx           <- Step 3: guest data
│   │   │   └── ConfirmationPage.tsx      <- Step 4: confirmation / redirect
│   │   ├── components/
│   │   │   ├── DatePicker.tsx            <- Date selection calendar
│   │   │   ├── GuestCounter.tsx          <- Guest counter
│   │   │   ├── RoomCard.tsx              <- Room card
│   │   │   ├── PhotoGallery.tsx          <- Photo gallery
│   │   │   ├── AmenityList.tsx           <- Amenity list
│   │   │   ├── PlanSelector.tsx          <- Rate plan selector
│   │   │   ├── GuestForm.tsx             <- Guest data form
│   │   │   └── BookingSummary.tsx        <- Booking summary
│   │   ├── api/
│   │   │   └── client.ts                 <- HTTP client for our backend
│   │   ├── types/
│   │   │   └── index.ts                  <- TypeScript types (Room, Plan, Guest, etc.)
│   │   └── styles/
│   │       └── globals.css               <- Tailwind + custom styles
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                      <- Node.js server
│   ├── src/
│   │   ├── index.ts                      <- Express entry point
│   │   ├── routes/
│   │   │   ├── rooms.ts                  <- GET /api/rooms -> proxy to Bnovo
│   │   │   ├── plans.ts                  <- GET /api/plans -> proxy to Bnovo
│   │   │   ├── amenities.ts              <- GET /api/amenities -> proxy to Bnovo
│   │   │   └── booking.ts               <- POST /api/booking -> stub (MVP) / POST reservationsteps.ru (future)
│   │   ├── services/
│   │   │   └── bnovoClient.ts            <- HTTP client for Bnovo API
│   │   └── types/
│   │       └── index.ts                  <- TypeScript types
│   ├── tsconfig.json
│   └── package.json
│
├── loader.js                     <- (future) embedding script
└── .env.example                  <- UID, ACCOUNT_ID, PORT, etc.
```

## Risks & Mitigation

### MVP Risks

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|-----------|
| 1 | CORS: public-api does not allow browser requests | High | All GET requests go through our backend proxy (already in architecture) |
| 2 | Bnovo changes public API response format | Medium | Monitoring, rapid parsing update |
| 3 | Large data volume from /rooms (1.5 MB) | — | Backend caching, lazy photo loading on frontend |

### Future Version Risks (POST booking integration)

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|-----------|
| 4 | Bnovo adds CSRF/CAPTCHA to POST | Medium | Switch to Playwright automation (flow documented in info.md, sections 7-8) |
| 5 | Bnovo blocks IP | Low | IP rotation / switch to Playwright |
| 6 | Bnovo changes POST field format / URL | Medium | Monitoring, rapid update |

## Validation & Tests

- Integration test: full flow Search → Room selection → Guest form → "Request received" stub.
- iframe test: embed on a test page, verify widget loads and functions.
- Test with real Bnovo data (GET requests to public API through backend proxy).
- Validate POST `/api/booking` logs correct data and returns success response.
- Validate client-side form validation (required fields, phone format).

## Edge Cases & Behavior

- No available rooms for selected dates: show "No rooms available" message.
- Bnovo API timeout/error: show user-friendly error, suggest retrying.
- Large photo sets: lazy-load images, use thumbnails in cards.
- Room ID is a string, not a number — ensure all type handling respects this.
- Date format mismatch: backend normalizes dates before forwarding to Bnovo.
- Single room booking only in MVP (one room per request).

## Acceptance Criteria

- Search form accepts check-in/check-out dates and guest count, returns available rooms from Bnovo.
- Room catalog displays cards with photos, name, area, amenities, rate plans, prices, and availability count.
- Only rooms with `available > 0` are shown.
- Guest form validates required fields (name, surname, phone, email) and Russian phone format.
- POST `/api/booking` logs the booking data server-side and returns `{ success: true }`.
- "Request received" stub page is shown after successful form submission.
- Widget loads correctly inside an iframe.
- All Bnovo identifiers (UID, account_id) are server-side only.

## Key Identifiers

| Parameter | Value |
|-----------|-------|
| UID | `d0ce239f-df14-4aa8-8ccf-83036c8cbb01` |
| account_id | `22720` |
| Name | Apart-hotel — 9 Nights Nizhny Novgorod |
| Site | apart-nn.ru |
| Public API | `public-api.reservationsteps.ru/v1/api/` |
| Booking POST | `reservationsteps.ru/bookings/post/{uid}` |
| Payment | `payment.bnovo.ru/v2/?transaction=book_{HASH}` |

## Decisions Made

| # | Question | Decision |
|---|---------|---------|
| 1 | Hosting | Virtual server, configured by the Client independently |
| 2 | Domain | `widget.apart-nn.ru`. Development and testing on localhost |
| 3 | Design | Based on current Bnovo widget (reference) |
| 4 | Analytics | Not needed |
| 5 | Phone format | Russian phone number validation |
| 6 | Room quantity | MVP: only 1 room at a time. Later — possibly multiple (TBD) |
| 7 | Test bookings | MVP: not created (stub). Later — to be agreed separately |

## Future Improvements (Post-MVP)

| # | Task | Priority |
|---|------|---------|
| 1 | Real booking creation via POST to reservationsteps.ru | High |
| 2 | Redirect to Bnovo payment page (payment.bnovo.ru) | High |
| 3 | Responsive layout (desktop + mobile) | High |
| 4 | Custom Bnovo data processing algorithm (pricing logic) | High |
| 5 | Admin panel (widget settings, colors, texts) | High |
| 6 | Promo codes (input field + API verification) | Medium |
| 7 | Additional services (meals, parking, projector, etc.) | Medium |
| 8 | Minimum prices in calendar cells (`/min_prices`) | Medium |
| 9 | Closed/unavailable dates in calendar (`/closed_dates`) | Medium |
| 10 | Booking journal (monitoring) | Medium |
| 11 | Loader script (loader.js) with auto-adjusting iframe height | Low |
| 12 | Multilingual support (en) | Low |
| 13 | A/B testing of the interface | Low |

## Decomposed Subtasks (Dry Run)

- [ ] stt-001 | Code Implementer | infra / Project initialization — monorepo setup with frontend (Vite + React + TS + Tailwind) and backend (Node.js + Express + TS), .env config, ESLint, Prettier
      Initialize the monorepo structure with two packages: `frontend` (Vite + React 18 + TypeScript + Tailwind CSS + React Router) and `backend` (Node.js 18 + Express + TypeScript). Create `.env.example` with UID, ACCOUNT_ID, ports. Configure ESLint and Prettier for both packages.

- [ ] stt-002 | Code Implementer | feature / Backend proxy — GET endpoints for Bnovo public API
      Implement the Bnovo HTTP client (`bnovoClient.ts`) and four proxy routes: `GET /api/rooms` (with dfrom, dto, account_id), `GET /api/plans`, `GET /api/amenities`, `GET /api/account`. Add basic input validation and error handling. Server reads UID and account_id from env.

- [ ] stt-003 | Code Implementer | feature / Backend booking stub — POST /api/booking logs data and returns success
      Implement `POST /api/booking` that accepts the booking payload (dates, planId, adults, roomTypes, guest data), validates required fields, logs the full payload to console, and returns `{ success: true, message: "Request accepted" }`.

- [ ] stt-004 | Code Implementer | feature / Frontend search page — Step 1 with DatePicker, GuestCounter, search form
      Build the SearchPage with DatePicker (check-in/check-out), GuestCounter, and "Search" button. Set up React Router for SPA navigation. Create the API client (`client.ts`) to call backend endpoints. On search, fetch rooms and navigate to the catalog page. Set up React Context for shared booking state.

- [ ] stt-005 | Code Implementer | feature / Frontend room catalog — Step 2 with RoomCard, PhotoGallery, AmenityList, PlanSelector
      Build the RoomsPage displaying room cards. Each card shows: photo gallery (sorted by order), room name, area, amenities, rate plan selector, price for the period, available count, and "Book" button. Filter to show only rooms with `available > 0`. Handle room ID as string.

- [ ] stt-006 | Code Implementer | feature / Frontend guest form & confirmation — Steps 3-4 with GuestForm, BookingSummary, ConfirmationPage
      Build the BookingPage with GuestForm (name, surname, phone, email, notes), BookingSummary (room, dates, price), agreement checkbox, and submit button. Validate required fields and Russian phone format. On submit, POST to `/api/booking`. Build the ConfirmationPage showing "Request received" stub with a "Back to Search" link.

- [ ] stt-007 | Test Writer | eval / Integration test — full flow search → room selection → guest form → confirmation stub
      Write integration tests covering the full user flow: search with dates/guests, verify room catalog renders, select a room, fill guest form, submit booking, verify confirmation page. Test iframe embedding on a test HTML page. Test with real Bnovo API data through the backend proxy.

---
---

# Русский перевод (Russian Translation)

> **NOTE:** This section is a Russian translation provided for the project owner's convenience. The development agent uses only the English section above. Do not modify this section for development purposes.

## Краткое описание

Разработать собственный виджет онлайн-бронирования номеров апарт-отеля (apart-nn.ru), который заменит текущий виджет Bnovo. Виджет встраивается на сайт через iframe. MVP-версия обеспечивает: поиск доступных номеров по датам/гостям, каталог номеров с фото/удобствами/тарифами, форму данных гостя и страницу-заглушку «Запрос принят». Реальная отправка бронирования в Bnovo и оплата — в следующих версиях. Backend проксирует все GET-запросы к публичному API Bnovo для обхода CORS и хранения учетных данных на сервере.

## Цели

- Frontend-виджет (React + TypeScript + Vite + Tailwind) с 4-шаговым flow: Поиск → Каталог номеров → Форма гостя → Заглушка подтверждения.
- Backend-прокси (Node.js + Express + TypeScript), перенаправляющий GET-запросы на `public-api.reservationsteps.ru` и предоставляющий POST `/api/booking` заглушку.
- Виджет встраивается через iframe на `apart-nn.ru`.
- Все идентификаторы Bnovo (UID, account_id) хранятся на сервере в `.env`, никогда не передаются клиенту.
- POST `/api/booking` логирует полученные данные и возвращает `{ success: true }` — реальное бронирование в Bnovo не создаётся (MVP).

## Критерии приёмки

- Форма поиска принимает даты заезда/выезда и количество гостей, возвращает доступные номера из Bnovo.
- Каталог отображает карточки с фото, названием, площадью, удобствами, тарифами, ценами и количеством свободных номеров.
- Показываются только номера с `available > 0`.
- Форма гостя валидирует обязательные поля (имя, фамилия, телефон, email) и формат российского телефона.
- POST `/api/booking` логирует данные на сервере и возвращает `{ success: true }`.
- Страница-заглушка «Запрос принят» показывается после успешной отправки формы.
- Виджет корректно загружается внутри iframe.
- Все идентификаторы Bnovo (UID, account_id) только на сервере.

## Декомпозиция подзадач

- [ ] stt-001 | Инициализация проекта — настройка monorepo с frontend (Vite + React + TS + Tailwind) и backend (Node.js + Express + TS), конфиг .env, ESLint, Prettier
- [ ] stt-002 | Backend прокси — GET-эндпоинты для публичного API Bnovo (rooms, plans, amenities, account)
- [ ] stt-003 | Backend заглушка бронирования — POST /api/booking логирует данные и возвращает успех
- [ ] stt-004 | Frontend страница поиска — Шаг 1 с DatePicker, GuestCounter, формой поиска
- [ ] stt-005 | Frontend каталог номеров — Шаг 2 с RoomCard, PhotoGallery, AmenityList, PlanSelector
- [ ] stt-006 | Frontend форма гостя и подтверждение — Шаги 3-4 с GuestForm, BookingSummary, ConfirmationPage
- [ ] stt-007 | Интеграционные тесты — полный flow поиск → выбор номера → форма гостя → заглушка подтверждения

## Будущие улучшения (после MVP)

| # | Задача | Приоритет |
|---|--------|-----------|
| 1 | Создание бронирования через POST на reservationsteps.ru | Высокий |
| 2 | Redirect на платёжную страницу Bnovo (payment.bnovo.ru) | Высокий |
| 3 | Адаптивная вёрстка (десктоп + мобильные) | Высокий |
| 4 | Алгоритм обработки данных от Bnovo (кастомная логика) | Высокий |
| 5 | Админ-панель (настройки виджета, цвета, тексты) | Высокий |
| 6 | Промокоды | Средний |
| 7 | Дополнительные услуги (питание, парковка и т.д.) | Средний |
| 8 | Минимальные цены в ячейках календаря | Средний |
| 9 | Закрытые/недоступные даты в календаре | Средний |
| 10 | Журнал бронирований (мониторинг) | Средний |
| 11 | Скрипт-лоадер (loader.js) с автоподстройкой высоты iframe | Низкий |
| 12 | Мультиязычность (en) | Низкий |
| 13 | A/B тестирование интерфейса | Низкий |
