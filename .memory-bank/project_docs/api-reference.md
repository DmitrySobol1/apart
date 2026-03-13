---
description: Backend API endpoint reference for the Apart-NN booking widget and admin panel
status: current
version: 2.1.0
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

Fetches available room types from Bnovo for the given date range. Results are cached in memory for 5 minutes per `dfrom+dto` key.

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
    }
  }
]
```

**Caching:** In-memory, keyed by `dfrom+dto`, TTL 5 minutes. Cache is per server process (resets on restart).

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

Validates the booking payload, logs it to the console, and returns a stub success response. **No real reservation is created in Bnovo (MVP stub).**

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
{ "success": true, "message": "Request accepted" }
```

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| 400 | Zod validation failure | `{ "errors": { "fieldName": ["error message"] } }` |
| 400 | `dto` ≤ `dfrom` (post-schema check) | `{ "errors": { "dto": ["dto must be after dfrom"] } }` |

**curl example:**
```bash
curl -X POST http://localhost:3000/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "dfrom": "01-06-2026",
    "dto": "05-06-2026",
    "planId": 536495,
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

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Эндпоинты виджета бронирования

- **GET /health** — проверка работоспособности сервера.
- **GET /api/rooms** — доступные номера из Bnovo (параметры `dfrom`, `dto` в формате DD-MM-YYYY, кэш 5 мин, ответ — плоский массив).
- **GET /api/plans** — метаданные тарифных планов (без цен).
- **GET /api/amenities** — определения удобств, двухуровневая структура.
- **GET /api/account** — информация об отеле, плоский объект (бэкенд распаковывает `{"account": {...}}`).
- **POST /api/booking** — MVP-заглушка: валидирует (Zod), логирует, возвращает `{ success: true }`.

## Admin API эндпоинты (требуют MongoDB)

Все под `/api/admin`. При недоступности MongoDB → 503.

- **GET /api/admin/rooms** — все номера из коллекции `rooms`, отсортированы по имени. Ответ: `{ data: AdminRoomResponse[] }`.
- **GET /api/admin/coefficients** — коэффициенты с именами номеров, отсортированы по имени. Ответ: `{ data: AdminCoefficientResponse[] }`. Объединение с именами делается на сервере через Map.
- **PATCH /api/admin/coefficients/:bnovoId** — обновить один или несколько коэффициентов. Значение > 0, запятая нормализуется в точку. При отсутствии bnovoId → 404. Ответ: `{ success: true, data: { bnovoId, coefficient1/2/3, updatedAt } }`.

## Формат дат Bnovo API

Все параметры дат, передаваемые в Bnovo public API, должны быть в формате `DD-MM-YYYY` (например `20-03-2026`). При использовании любого другого формата, включая ISO `YYYY-MM-DD`, API возвращает HTTP 406. Функция `formatDate()` в `room-sync.ts` использует явные вызовы `getDate()`/`getMonth()`/`getFullYear()` — не заменяйте её на `toISOString().slice(0, 10)`.

## Обработка ошибок

Таймаут Axios → 504, прочие ошибки Axios → 502, `AppError` → соответствующий код, остальное → 500.
