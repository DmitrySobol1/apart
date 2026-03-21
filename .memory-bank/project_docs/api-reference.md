---
description: Backend API endpoint reference for the Apart-NN booking widget and admin panel
status: current
version: 4.0.0
---

# API Reference — Apart-NN Backend

Base URL in development: `http://localhost:3000`

The frontend Vite dev server proxies `/api/*` to `http://localhost:3000`. The admin panel Vite dev server does the same on port 5174.

---

## Booking Widget Endpoints

### GET /health

Health check. No authentication required.

**Response 200:**
```json
{ "status": "ok" }
```

---

### GET /api/rooms

Fetches available room types from Bnovo for the given date range, enriches each room with a ranking score from MongoDB, and returns the result. Results are cached in memory for 5 minutes per `dfrom+dto` key.

**Query parameters:**

| Parameter | Required | Format | Description |
|---|---|---|---|
| `dfrom` | Yes | `DD-MM-YYYY` | Check-in date |
| `dto` | Yes | `DD-MM-YYYY` | Check-out date (must be after `dfrom`) |

**Validation rules:**
- Both `dfrom` and `dto` must match the regex `^\d{2}-\d{2}-\d{4}$`
- `dto` must be strictly after `dfrom`

**Response 200** — A plain JSON array (the backend unwraps the Bnovo `{"rooms": [...]}` envelope):

```json
[
  {
    "id": "274552",
    "name": "Студия",
    "name_ru": "Студия",
    "description_ru": "...",
    "adults": 2,
    "children": 0,
    "available": 3,
    "order": 1,
    "photos": [
      {
        "id": 1568114,
        "order": 0,
        "url": "https://storage.reservationsteps.ru/hash_1050x600.jpg",
        "thumb": "https://storage.reservationsteps.ru/hash_1050x600.jpg",
        "original_url": "https://storage.reservationsteps.ru/hash.jpg",
        "roomtype_id": "274552"
      }
    ],
    "amenities": {
      "1": { "value": "32" },
      "8": { "value": "" }
    },
    "plans": {
      "536495": {
        "id": 536495,
        "name": "Невозвратный",
        "name_ru": null,
        "cancellation_rules": "...",
        "enabled": 1,
        "prices": { "2026-03-01": "2800.00", "2026-03-02": "2800.00" },
        "price": 5600
      }
    },
    "numToShowOnFrontend": 4.5
  }
]
```

**`numToShowOnFrontend`:** Added by `applyRoomRanking()` — the sum of `coefficient1 + coefficient2 + coefficient3` for the room from the `coefficients` MongoDB collection. Default value `3` is used when no coefficient record exists or when MongoDB is unavailable. The frontend sorts rooms by this field descending.

**Caching:** In-memory, keyed by `dfrom+dto`, TTL 5 minutes. Cache stores the enriched rooms (including `numToShowOnFrontend`). Cache is per server process (resets on restart).

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 400 | Missing or malformed `dfrom`/`dto` | `{ "error": "dfrom must be in DD-MM-YYYY format" }` |
| 400 | `dto` ≤ `dfrom` | `{ "error": "dto must be after dfrom" }` |
| 502 | Bnovo API returned an error | `{ "error": "Upstream API error" }` |
| 504 | Bnovo API timed out (10s limit) | `{ "error": "Upstream API timeout" }` |

**curl example:**
```bash
curl "http://localhost:3000/api/rooms?dfrom=01-06-2026&dto=05-06-2026"
```

---

### GET /api/plans

Returns all rate plan definitions from Bnovo. No query parameters.

**Response 200:**
```json
{
  "plans": [
    {
      "id": 536495,
      "name": "Невозвратный",
      "cancellation_rules": "...",
      "enabled": 1
    }
  ]
}
```

Prices are not here — they are embedded in the `/api/rooms` response inside each room's `plans` map.

**Error responses:** 502 (upstream error), 504 (timeout).

**curl example:**
```bash
curl "http://localhost:3000/api/plans"
```

---

### GET /api/amenities

Returns all amenity definitions grouped by category. No query parameters.

**Response 200:**
```json
{
  "amenities": {
    "1": {
      "name_ru": "Оснащение номера и мебель",
      "amenities": {
        "1": {
          "name_ru": "Площадь",
          "name_en": "Area",
          "type": "int",
          "unit": "m2",
          "icon": "https://..."
        }
      }
    }
  }
}
```

**Error responses:** 502 (upstream error), 504 (timeout).

**curl example:**
```bash
curl "http://localhost:3000/api/amenities"
```

---

### GET /api/account

Returns hotel account information. No query parameters.

**Response 200** — A flat object (the backend unwraps the Bnovo `{"account": {...}}` envelope):
```json
{
  "name": "Апарт отель - 9 ночей Нижний Новгород",
  "phone": "...",
  "email": "...",
  "address": "...",
  "checkin": "14:00",
  "checkout": "12:00",
  "currency": { "iso_4217": "RUB", "sign": "₽" },
  "website": "https://apart-nn.ru/"
}
```

**Error responses:** 502 (upstream error), 504 (timeout).

**curl example:**
```bash
curl "http://localhost:3000/api/account"
```

---

### POST /api/booking

Creates a real reservation in Bnovo via `reservationsteps.ru/bookings/post/{uid}`. Validates the request body, sends a form POST to Bnovo, parses the 302 redirect response, and returns booking number, payment URL, and amount.

**Request body** (`Content-Type: application/json`):

```typescript
{
  dfrom: string;        // DD-MM-YYYY
  dto: string;          // DD-MM-YYYY, must be after dfrom
  planId: number;       // positive integer
  adults: number;       // integer >= 1
  roomTypeId: string;   // non-empty string
  guest: {
    name: string;       // non-empty
    surname: string;    // non-empty
    phone: string;      // matches /^\+7\d{10}$/
    email: string;      // valid email format
    notes?: string;     // optional
  };
}
```

**Response 200:**
```json
{
  "success": true,
  "bookingNumber": "12345_081026",
  "paymentUrl": "https://payment.bnovo.ru/v2/?transaction=book_abc123",
  "amount": 5500
}
```

- `bookingNumber` — Bnovo booking identifier (format: `{id}_{DDMMYY}`)
- `paymentUrl` — full URL to Bnovo/Alfa-Bank payment page; must be opened at top-frame level
- `amount` — total booking amount in rubles (number, from `bookingAccommodationAmount` in Bnovo redirect)

**TypeScript types:**

```typescript
interface BookingResponse {
  success: boolean;
  message?: string;
  bookingNumber?: string;
  paymentUrl?: string;
  amount?: number;
}
```

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 400 | Zod validation failure | `{ "errors": { "fieldName": ["error message"] } }` |
| 400 | `dto` ≤ `dfrom` (post-schema check) | `{ "errors": { "dto": ["dto must be after dfrom"] } }` |
| 500 | Bnovo returned non-302 response | `{ "success": false, "message": "Bnovo booking failed: unexpected response status N" }` |
| 500 | Location header missing or malformed | `{ "success": false, "message": "Bnovo booking failed: could not parse redirect" }` |
| 500 | Payment URL empty or unparseable | `{ "success": false, "message": "Bnovo booking failed: payment URL is empty or unparseable" }` |
| 500 | Network timeout to Bnovo (15s) | `{ "success": false, "message": "..." }` |

All errors are logged with `console.error` including ISO timestamp.

**Logging:** On booking attempt, logs `{ roomTypeId, dfrom, dto, email }`. On success, logs `{ bookingNumber, amount }`.

**curl example:**
```bash
curl -X POST http://localhost:3000/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "dfrom": "08-10-2026",
    "dto": "09-10-2026",
    "planId": 128501,
    "adults": 2,
    "roomTypeId": "274552",
    "guest": {
      "name": "Иван",
      "surname": "Петров",
      "phone": "+79001234567",
      "email": "ivan@example.com"
    }
  }'
```

---

## Bnovo Booking Service

File: `backend/src/services/bnovo-booking.ts`

### createBooking(params)

```typescript
interface BookingParams {
  dfrom: string;
  dto: string;
  planId: number;
  adults: number;
  roomTypeId: string;
  guest: {
    name: string;
    surname: string;
    phone: string;
    email: string;
    notes?: string;
  };
}

interface BookingResult {
  bookingNumber: string;
  paymentUrl: string;
  amount: number;
}

function createBooking(params: BookingParams): Promise<BookingResult>
```

**Internal behavior:**
1. Builds `application/x-www-form-urlencoded` body. Maps `roomTypeId` to `roomTypes` JSON: `{ [roomTypeId]: { c: 1, bv: 3 } }`. Fixed fields: `servicemode=0`, `warrantyType=onlinepay`, `lang=ru`, `guarantee=1`, etc.
2. Sends `fetch(url, { method: 'POST', redirect: 'manual', body, headers, signal: AbortSignal.timeout(15000) })`.
3. Asserts `response.status === 302`. If not: logs status + first 500 chars of body, throws.
4. Reads `Location` header. Parses with `new URL(location, 'https://reservationsteps.ru')`.
5. Extracts `bookingNumber`, `bookingAccommodationAmount`, `redirectUrl` from Location query params. If any are missing: logs full Location, throws.
6. Parses `bookingAccommodationAmount` with `parseFloat()`. Throws if `isNaN`.
7. Decodes `redirectUrl`, parses `away_url` query param from it — this is the `paymentUrl`.
8. Returns `{ bookingNumber, paymentUrl, amount }`.

### Bnovo form POST fields

| Field | Value / Source |
|---|---|
| `servicemode` | `0` |
| `firstroom` | `0` |
| `dfrom` | from params (DD-MM-YYYY) |
| `dto` | from params (DD-MM-YYYY) |
| `planId` | from params (string) |
| `adults` | from params (string) |
| `children` | `""` |
| `promoCode` | `""` |
| `roomTypes` | `JSON.stringify({ [roomTypeId]: { c: 1, bv: 3 } })` |
| `roomtypeUpgrade` | `""` |
| `services` | `""` |
| `orderItems` | `""` |
| `lang` | `ru` |
| `warrantyType` | `onlinepay` |
| `orderid` | `""` |
| `moneywall_enabled` | `0` |
| `currency` | `""` |
| `mobile_id` | `0` |
| `guarantee` | `1` |
| `customer[name]` | `guest.name` |
| `customer[surname]` | `guest.surname` |
| `customer[phone]` | `guest.phone` |
| `customer[email]` | `guest.email` |
| `customer[notes]` | `guest.notes ?? ""` |

---

## Room Ranking Service

File: `backend/src/services/room-ranking.ts`

### applyRoomRanking(rooms)

```typescript
function applyRoomRanking(
  rooms: Array<Record<string, unknown>>,
): Promise<Array<Record<string, unknown>>>
```

**Behavior:**
1. Returns an empty array immediately if `rooms` is empty.
2. Queries the `coefficients` collection with `Coefficient.find({}).lean()`.
3. Builds a `Map<bnovoId, score>` where `score = coefficient1 + coefficient2 + coefficient3`.
4. Spreads each room object and adds `numToShowOnFrontend: score ?? 3`. The default `3` applies when a room has no matching coefficient document.
5. On MongoDB error: logs the error with `console.error`, returns all rooms with `numToShowOnFrontend: 3` (graceful degradation — no rooms are lost).

**Called by:** `GET /api/rooms` route, after unwrapping the Bnovo response and before caching.

---

## Admin API Endpoints

All admin endpoints are under `/api/admin`. They require MongoDB to be connected — if not, all return `503`.

**MongoDB guard** (applied to all admin routes):
```
GET/PATCH /api/admin/*
  → if mongoose.connection.readyState !== 1 → 503 { "error": "Database not available" }
```

---

### GET /api/admin/rooms

Returns all rooms from the `rooms` collection, sorted alphabetically by name.

**Response 200:**
```json
{
  "data": [
    {
      "bnovoId": "274552",
      "name": "Студия",
      "createdAt": "2026-03-13T04:00:00.000Z",
      "updatedAt": "2026-03-13T04:00:00.000Z"
    }
  ]
}
```

**Response type** (`AdminRoomResponse`):
```typescript
interface AdminRoomResponse {
  bnovoId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 503 | MongoDB not connected | `{ "error": "Database not available" }` |
| 500 | Unexpected server error | `{ "error": "..." }` |

**curl example:**
```bash
curl "http://localhost:3000/api/admin/rooms"
```

---

### GET /api/admin/coefficients

Returns all coefficients joined with room names, sorted alphabetically by room name.

**Response 200:**
```json
{
  "data": [
    {
      "bnovoId": "274552",
      "roomName": "Студия",
      "coefficient1": 1,
      "coefficient2": 1,
      "coefficient3": 1,
      "updatedAt": "2026-03-13T04:00:00.000Z"
    }
  ]
}
```

**Response type** (`AdminCoefficientResponse`):
```typescript
interface AdminCoefficientResponse {
  bnovoId: string;
  roomName: string;
  coefficient1: number;
  coefficient2: number;
  coefficient3: number;
  updatedAt: Date;
}
```

The join is done server-side: the handler fetches all rooms into a `Map<bnovoId, name>` and resolves `roomName` per coefficient. If a room is not found in the map, `roomName` defaults to `""`.

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 503 | MongoDB not connected | `{ "error": "Database not available" }` |
| 500 | Unexpected server error | `{ "error": "..." }` |

**curl example:**
```bash
curl "http://localhost:3000/api/admin/coefficients"
```

---

### PATCH /api/admin/coefficients/:bnovoId

Updates one or more coefficient values for the given room. At least one coefficient field must be provided.

**URL parameter:** `bnovoId` — the Bnovo room type ID string.

**Request body** (all fields optional, but at least one must be present):
```json
{
  "coefficient1": 1.5,
  "coefficient2": 2,
  "coefficient3": "1,25"
}
```

Coefficient values are validated with Zod:
- Preprocessed: comma is normalized to dot (e.g., `"1,25"` → `1.25`)
- Must be a number greater than 0

**Response 200:**
```json
{
  "success": true,
  "data": {
    "bnovoId": "274552",
    "coefficient1": 1.5,
    "coefficient2": 2,
    "coefficient3": 1.25,
    "updatedAt": "2026-03-13T05:00:00.000Z"
  }
}
```

Note: the `data` object in the PATCH response does not include `roomName`, unlike the GET response.

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 503 | MongoDB not connected | `{ "error": "Database not available" }` |
| 400 | Validation failure (invalid value, no fields provided) | `{ "error": [{ "message": "..." }] }` |
| 404 | `bnovoId` not found in `coefficients` collection | `{ "error": "Room not found" }` |
| 500 | Unexpected server error | `{ "error": "..." }` |

**curl examples:**
```bash
# Update one field
curl -X PATCH http://localhost:3000/api/admin/coefficients/274552 \
  -H "Content-Type: application/json" \
  -d '{"coefficient1": 1.5}'

# Update all three fields
curl -X PATCH http://localhost:3000/api/admin/coefficients/274552 \
  -H "Content-Type: application/json" \
  -d '{"coefficient1": 1.5, "coefficient2": 2.0, "coefficient3": 1.25}'
```

---

## Bnovo API Integration Notes

### Date format

All date parameters sent to the Bnovo public API must use `DD-MM-YYYY` format (e.g. `20-03-2026`). The Bnovo API returns HTTP 406 for any other format, including the ISO `YYYY-MM-DD` format.

This applies to every layer that calls `bnovoClient.getRooms()` directly:
- `GET /api/rooms` route — enforces `DD-MM-YYYY` via Zod regex before forwarding.
- `room-sync.ts` service — `formatDate()` produces `DD-MM-YYYY` using explicit `getDate()`/`getMonth()`/`getFullYear()` calls. **Do not replace this with `toISOString().slice(0, 10)`** — that produces `YYYY-MM-DD` and will cause 406 errors.

The booking POST (`reservationsteps.ru`) also expects `DD-MM-YYYY` for `dfrom` and `dto` fields. The frontend sends these in `DD-MM-YYYY` format; the backend passes them through without conversion.

### Booking service URL

```
POST {BNOVO_BOOKING_URL}/bookings/post/{BNOVO_UID}
Content-Type: application/x-www-form-urlencoded
```

Default `BNOVO_BOOKING_URL`: `https://reservationsteps.ru`

No authentication headers, sessions, or CSRF tokens are required for this endpoint.

---

## Error Handler

All unhandled errors pass through the Express `errorHandler` middleware:

| Condition | Status | Body |
|---|---|---|
| Axios timeout (`ECONNABORTED`) | 504 | `{ "error": "Upstream API timeout" }` |
| Any other Axios error | 502 | `{ "error": "Upstream API error" }` |
| `AppError` with `statusCode` | `statusCode` | `{ "error": err.message }` |
| Unclassified error | 500 | `{ "error": err.message }` |

All errors are logged with an ISO timestamp:
```
[2026-03-11T12:00:00.000Z] Upstream API timeout: timeout of 10000ms exceeded
```

Note: booking creation errors are caught in the route handler itself (not passed to the error middleware) and return `{ success: false, message }` with status 500.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Эндпоинты виджета бронирования

- **GET /health** — проверка работоспособности сервера.
- **GET /api/rooms** — доступные номера из Bnovo (параметры `dfrom`, `dto` в формате DD-MM-YYYY). После получения данных из Bnovo вызывается `applyRoomRanking()`, которая добавляет поле `numToShowOnFrontend` (сумма трёх коэффициентов из MongoDB; дефолт: 3). Обогащённый массив кешируется на 5 мин.
- **GET /api/plans** — метаданные тарифных планов (без цен).
- **GET /api/amenities** — определения удобств, двухуровневая структура.
- **GET /api/account** — информация об отеле, плоский объект (бэкенд распаковывает `{"account": {...}}`).
- **POST /api/booking** — создаёт реальное бронирование в Bnovo через `reservationsteps.ru/bookings/post/{uid}`, возвращает `{ success: true, bookingNumber, paymentUrl, amount }`. При ошибке — `{ success: false, message }` со статусом 500.

## Сервис бронирования Bnovo (`bnovo-booking.ts`)

`createBooking(params)` — строит тело `application/x-www-form-urlencoded`, отправляет POST с `redirect: 'manual'` и таймаутом 15 секунд через нативный `fetch`, проверяет статус 302, читает заголовок Location, извлекает `bookingNumber`, `bookingAccommodationAmount` (→ amount через `parseFloat`), декодирует `redirectUrl` и извлекает `away_url` (ссылка на оплату). При любой ошибке логирует через `console.error` и выбрасывает исключение.

Обязательные поля формы POST: `servicemode`, `firstroom`, `dfrom`, `dto`, `planId`, `adults`, `children`, `promoCode`, `roomTypes` (JSON), `warrantyType=onlinepay`, `lang=ru`, `guarantee=1`, поля `customer[*]`.

## Сервис ранжирования номеров (`room-ranking.ts`)

`applyRoomRanking(rooms)` — принимает массив номеров (объекты из Bnovo API), запрашивает коллекцию `coefficients` в MongoDB, строит Map `bnovoId → score` (сумма трёх коэффициентов), добавляет поле `numToShowOnFrontend` к каждому номеру. Если для номера нет записи коэффициентов — используется `3`. При ошибке MongoDB — логирует и возвращает все номера с `numToShowOnFrontend: 3`. Вызывается маршрутом `GET /api/rooms` перед кешированием.

## Admin API эндпоинты (требуют MongoDB)

Все под `/api/admin`. При недоступности MongoDB → 503.

- **GET /api/admin/rooms** — все номера из коллекции `rooms`, отсортированы по имени. Ответ: `{ data: AdminRoomResponse[] }`.
- **GET /api/admin/coefficients** — коэффициенты с именами номеров, отсортированы по имени. Ответ: `{ data: AdminCoefficientResponse[] }`. Объединение с именами делается на сервере через Map.
- **PATCH /api/admin/coefficients/:bnovoId** — обновить один или несколько коэффициентов. Значение > 0, запятая нормализуется в точку. При отсутствии bnovoId → 404. Ответ: `{ success: true, data: { bnovoId, coefficient1/2/3, updatedAt } }`.

## Формат дат Bnovo API

Все параметры дат, передаваемые в Bnovo public API, должны быть в формате `DD-MM-YYYY`. При использовании `YYYY-MM-DD` API возвращает HTTP 406. POST на `reservationsteps.ru` также принимает даты в формате `DD-MM-YYYY`.

## Обработка ошибок

Ошибки бронирования перехватываются в роуте — возвращают `{ success: false, message }` статус 500. Таймаут Axios → 504, прочие ошибки Axios → 502, `AppError` → соответствующий код, остальное → 500.
