---
description: Backend API endpoint reference for the Apart-NN booking widget
status: current
version: 1.1.0
---

# API Reference — Apart-NN Backend

Base URL in development: `http://localhost:3000`

The frontend Vite dev server proxies `/api/*` to `http://localhost:3000`, so the frontend code uses `/api/*` paths directly.

---

## Endpoints

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

**Response 200** — A plain JSON array of room objects (the backend unwraps the Bnovo `{"rooms": [...]}` envelope before responding):

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

Note: `/rooms` only returns room types with `available > 0` for the requested dates. Rooms with zero availability are absent from the response entirely.

**Implementation note:** The Bnovo upstream API returns `{"rooms": [...]}`. The backend route (`backend/src/routes/rooms.ts`) unwraps this to `response.data.rooms ?? []` before caching and sending to the frontend. The frontend receives and stores a plain array.

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

**Note:** This endpoint returns plan metadata (names, cancellation rules) but **not prices**. Prices are embedded in the `/api/rooms` response inside each room's `plans` map.

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

**Error responses:** 502 (upstream error), 504 (timeout).

**curl example:**
```bash
curl "http://localhost:3000/api/plans"
```

---

### GET /api/amenities

Returns all amenity definitions grouped by category. No query parameters.

**Response 200** — two-level nested structure:

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
        },
        "2": {
          "name_ru": "Кондиционирование",
          "name_en": "Air conditioning",
          "type": "bool",
          "unit": "",
          "icon": "https://..."
        }
      }
    }
  }
}
```

To resolve amenity IDs from room data: flatten both levels by numeric ID. Amenity ID `"1"` is area (m²) — its `value` in the room object is the area in square meters as a string.

**Error responses:** 502 (upstream error), 504 (timeout).

**curl example:**
```bash
curl "http://localhost:3000/api/amenities"
```

---

### GET /api/account

Returns hotel account information. No query parameters. Uses `BNOVO_UID` from env internally.

**Response 200** — A flat account object (the backend unwraps the Bnovo `{"account": {...}}` envelope before responding):
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

The `SearchPage` uses this endpoint to display the hotel name at the top of the search form. It reads `res.data.name` directly from the flat object.

**Implementation note:** The Bnovo upstream API returns `{"account": {...}}`. The backend route (`backend/src/routes/account.ts`) unwraps this to `response.data.account ?? response.data` before responding.

**Error responses:** 502 (upstream error), 504 (timeout).

**curl example:**
```bash
curl "http://localhost:3000/api/account"
```

---

### POST /api/booking

Validates the booking payload, logs it to the console, and returns a stub success response. **No real reservation is created in Bnovo (MVP).**

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

**Example request:**
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
      "email": "ivan@example.com",
      "notes": "Поздний заезд"
    }
  }'
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

The server logs the full payload on success:
```
2026-03-11T12:00:00.000Z booking request { dfrom: '...', dto: '...', ... }
```

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

## TypeScript Types (Frontend)

Defined in `frontend/src/types/index.ts`:

```typescript
interface Room {
  id: string;
  name: string;
  name_ru: string;
  description: string;
  description_ru: string;
  adults: number;
  children: number;
  available: number;
  order: number;
  photos: RoomPhoto[];
  amenities: Record<string, { value: string }>;
  plans: Record<string, RoomPlan>;
}

interface RoomPhoto {
  id: number;
  order: number;
  url: string;
  thumb: string;
  original_url: string;
  roomtype_id: string;
}

interface RoomPlan {
  id: number;
  name: string;
  name_ru: string | null;
  cancellation_rules: string;
  enabled: number;
  prices: Record<string, string>;
  price: number;
}

interface AmenityDefinition {
  name_ru: string;
  name_en: string;
  type: "bool" | "int";
  unit: string;
  icon: string;
}

interface AmenityGroup {
  name_ru: string;
  amenities: Record<string, AmenityDefinition>;
}

interface Amenity extends AmenityDefinition {
  id: string;
}

interface GuestData {
  name: string;
  surname: string;
  phone: string;   // "+7XXXXXXXXXX" format after stripping
  email: string;
  notes: string;
}

interface SearchParams {
  dfrom: string;   // DD-MM-YYYY
  dto: string;     // DD-MM-YYYY
  adults: number;
}

interface BookingRequest {
  dfrom: string;
  dto: string;
  planId: number;
  adults: number;
  roomTypeId: string;
  guest: GuestData;
}

interface BookingResponse {
  success: boolean;
  message: string;
}
```

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Эндпоинты бэкенда

Базовый URL в разработке: `http://localhost:3000`.

### GET /api/rooms
Возвращает доступные типы номеров из Bnovo для указанного диапазона дат. Параметры: `dfrom` и `dto` в формате `DD-MM-YYYY`. Кэш: 5 минут (in-memory, ключ dfrom+dto). Ошибки: 400 (неверный формат/порядок дат), 502 (ошибка Bnovo), 504 (таймаут Bnovo). **Ответ — простой массив `[...]`** (бэкенд распаковывает обёртку `{"rooms": [...]}` от Bnovo перед отправкой клиенту).

### GET /api/plans
Метаданные тарифных планов. Цен не содержит (цены встроены в ответ /api/rooms).

### GET /api/amenities
Определения удобств, двухуровневая структура (группы → удобства). Нужен для отображения названий и иконок удобств в карточках номеров.

### GET /api/account
Информация об отеле (название, контакты, время заезда/выезда). Используется на странице поиска. **Ответ — плоский объект** (бэкенд распаковывает обёртку `{"account": {...}}` от Bnovo). Фронтенд читает `res.data.name` напрямую.

### POST /api/booking
Принимает данные бронирования, валидирует с помощью Zod, логирует в консоль, возвращает `{ success: true, message: "Request accepted" }`. MVP-заглушка — реального бронирования в Bnovo не создаёт. Формат телефона: `+7XXXXXXXXXX`.

## Обработка ошибок

Все неперехваченные ошибки обрабатываются middleware `errorHandler`: таймаут Axios → 504, прочие ошибки Axios → 502, `AppError` со статусом → соответствующий код, остальное → 500.
