# Bnovo Public API — Fixtures & Data Structure Reference

Recorded: 2026-03-11. Date range used for /rooms: `dfrom=01-03-2026&dto=03-03-2026` (2 nights).

---

## Endpoints

| Fixture file | Endpoint | Top-level key |
|---|---|---|
| `bnovo-rooms.json` | `GET /rooms?account_id=22720&dfrom=...&dto=...` | `rooms` (array) |
| `bnovo-roomtypes.json` | `GET /roomtypes?account_id=22720` | `rooms` (object keyed `"0"`, `"1"`, …) |
| `bnovo-plans.json` | `GET /plans?account_id=22720` | `plans` (array) |
| `bnovo-amenities.json` | `GET /amenities` | `amenities` (object keyed `"1"`, `"2"`, …) |
| `bnovo-accounts.json` | `GET /accounts?uid=d0ce239f-...` | `account` (single object) |

---

## /rooms — Primary Data Source

Returns an array of **room type** objects (not individual physical units).
Each entry represents one bookable room category, not one physical room.

### Fields of interest

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Room type ID — always a string (e.g. `"274552"`) |
| `name_ru` | `string` | Russian name (primary for UI) |
| `name_en` | `string` | English name (empty in this dataset) |
| `description_ru` | `string` | Full Russian description (may be empty) |
| `adults` | `number` | Maximum adult guests (use as `maxGuests`) |
| `children` | `number` | Max children (typically 0 for studio types) |
| `available` | `number` | Units available for the requested date range. Values observed: 1, 2, 3, 4, 5. No zeros — unavailable rooms are excluded from the response entirely. |
| `photos` | `Photo[]` | Photo objects sorted by `order` |
| `amenities` | `{ [amenityId: string]: { value: string } }` | Amenity IDs present on the room. ID `"1"` is area in m² (value is a numeric string like `"32"`); boolean amenities have `value: ""`. |
| `plans` | `{ [planId: string]: Plan }` | Rate plans available for this room + date range |
| `order` | `number` | Display sort order |

### Photo object

```json
{
  "id": 1568114,
  "order": 0,
  "url": "https://storage.reservationsteps.ru/hash_1050x600.jpg",
  "thumb": "https://storage.reservationsteps.ru/hash_1050x600.jpg",
  "original_url": "https://storage.reservationsteps.ru/hash.jpg",
  "roomtype_id": "274552"
}
```

Use `url` (1050×600) for card thumbnails and gallery. Use `original_url` for full-size modal. Sort by `order`.

### Plan object (inside /rooms)

Each room's `plans` map contains only the plans applicable to that room for the requested date range.
The plan object is a full copy of the plan definition **plus** pricing fields:

```json
{
  "id": 536495,
  "name": "Невозвратный",
  "name_ru": null,
  "cancellation_rules": "...",
  "enabled": 1,
  "prices": {
    "2026-03-01": "2800.00",
    "2026-03-02": "2800.00"
  },
  "price": 5600
}
```

- `price` — total cost for the entire date range (sum of all nightly rates).
- `prices` — per-night breakdown keyed by date `YYYY-MM-DD`.
- In all 41 rooms observed, each room has exactly **1 plan** for the given dates.

### Amenities (inside /rooms)

Room amenity data in `/rooms` is a sparse map:

```json
"amenities": {
  "1": { "value": "32" },
  "8": { "value": "" },
  "9": { "value": "" }
}
```

Only amenity IDs present on the room appear as keys. Boolean amenities have `value: ""` (presence = true). Amenity ID `1` is area in m² — its `value` is the numeric string.

---

## /roomtypes — Catalog (Superset)

Returns **all** room types regardless of availability, including those with no availability for the searched dates. In this fixture: 85 room types total vs 41 available in `/rooms`.

### Key difference vs /rooms

| Field | /rooms | /roomtypes |
|---|---|---|
| `plans` | Present (with prices for date range) | Absent |
| `available` | Present | Absent |
| `photos` | Present (same data) | Present (same data) |
| `amenities` | Present (same data) | Present (same data) |
| `description_ru` | Present | Present (identical) |

The IDs are the same: a room appearing in both has identical `photos`, `amenities`, and `description_ru`.

---

## /plans — Rate Plan Definitions

Returns 11 plans total; 3 are currently `enabled: 1`.

Enabled plans:
- `128501` — Бронирование онлайн
- `137020` — Невозвратный (Скидка 10%)
- `536495` — Невозвратный

**Important:** `/plans` does NOT contain prices. Prices are only in `/rooms` response (inside each room's `plans` map, per date range). The `/plans` endpoint is useful for plan metadata (names, cancellation rules) but not for pricing.

---

## /amenities — Amenity Definitions

A two-level nested structure: groups of amenities, each group containing individual amenities:

```
amenities: {
  "1": {
    "name_ru": "Оснащение номера и мебель",
    "amenities": {
      "1":  { "name_ru": "Площадь", "type": "int", "unit": "m2", "icon": "..." },
      "2":  { "name_ru": "Кондиционирование/...", "type": "bool", "icon": "..." },
      ...
    }
  },
  "2": { "name_ru": "Ванная комната", "amenities": {...} },
  ...
}
```

6 groups observed: Оснащение номера и мебель, Ванная комната, Кухня, Электроника и развлечения, Вид, Услуги.

Each individual amenity has:
- `name_ru`, `name_en` — localized names
- `type` — `"bool"` or `"int"`
- `unit` — `"m2"` for area, `""` for booleans
- `icon` — absolute URL to SVG icon

**To display amenities in the UI:** look up amenity ID from the room's `amenities` map in the `/amenities` flat definitions (flatten both levels by ID first). Amenity ID `1` = area, its value from the room is the m² count.

---

## /accounts — Hotel Info

Single object under key `account`. Contains:
- `name` — hotel name (Апарт отель - 9 ночей Нижний Новгород)
- `phone`, `email`, `address`
- `checkin`, `checkout` — time strings (`"14:00"`, `"12:00"`)
- `currency` — `{ iso_4217: "RUB", sign: "₽" }`
- `website` — `"https://apart-nn.ru/"`

---

## Answers to Key Architecture Questions

### 1. Is /rooms + /roomtypes merge needed?

**No merge required.** `/rooms` already contains photos, amenities, and descriptions. It is the complete data source for the booking widget. `/roomtypes` is only needed to display all room types including those with no availability (not required for MVP).

### 2. Where does totalPrice come from?

From `rooms[n].plans[planId].price` — this is the pre-calculated total for the full date range. No client-side multiplication needed. The per-night breakdown is in `plans[planId].prices` (object keyed by date).

### 3. Do amenities need a separate endpoint call?

**Yes, a separate call is needed** to resolve amenity IDs to names and icons. The room object only stores `{ [amenityId]: { value: "" } }` — there are no names or icons in the room data. To display amenity labels and icons, the frontend must look up each ID in the flattened `/amenities` response.

However, the amenities catalog is static (rarely changes). It can be fetched once at app load and cached in memory or fetched once by the backend and forwarded to the frontend.

---

## Plan Assumptions vs Actual Data — Deviations for stt-002 and stt-004

| Plan assumption | Actual |
|---|---|
| `name_ru \|\| name` fallback for room name | Confirmed: `name_ru` is always populated; `name` holds the same value. Use `name_ru`. |
| `amenities["1"].value` = area in m² | Confirmed: amenity ID `"1"` is "Площадь" (type `int`, unit `m2`). |
| `photos[].url` for thumbnails, `photos[].original_url` for full-size | Confirmed. `url` and `thumb` are identical (both 1050×600). `original_url` is full-res. |
| Room ID is string type | Confirmed: `"274552"` — always string. |
| `available > 0` to show room | Confirmed. But: `/rooms` only returns rooms with `available > 0`. Rooms with `available === 0` are simply absent from the response. Filter `available > 0` is still correct but will never be false for items in the array. |
| `maxGuests` field | **Deviation:** There is no `maxGuests` field. The equivalent is `adults` (integer). Use `adults` for guest capacity filtering. Update stt-004 types accordingly. |
| Rate plan selector shows multiple plans | **Deviation:** Only 1 plan appears per room for the tested date range. The UI should still support multiple plans (the `plans` map is keyed by plan ID), but most rooms will show a single option in practice. |
| `totalPrice` label for display | `plans[planId].price` is the total. `plans[planId].prices` contains per-night rates. The field name to use in frontend type is `price` (not `totalPrice`). Update stt-004. |
| `/roomtypes` needed for room catalog | **Deviation:** Not needed for MVP. All data (photos, amenities, descriptions) is already in `/rooms`. `/roomtypes` only adds unavailable rooms. Drop the `/api/roomtypes` proxy endpoint from stt-002 scope. |
| `/plans` endpoint provides prices | **Deviation:** `/plans` has no prices. Prices are embedded in `/rooms` per date range. The `/api/plans` proxy is not needed for MVP; plan metadata is already embedded in `/rooms[].plans[planId]`. Evaluate whether to drop `/api/plans` from stt-002. |

---

---

# Русский перевод (для владельца проекта)

> **NOTE:** This section is a Russian translation provided for the project owner's convenience. The development agent uses only the English section above.

## Эндпоинты

Зафиксировано 11 марта 2026 года. Диапазон дат для /rooms: 01-03-2026 — 03-03-2026 (2 ночи).

## /rooms — основной источник данных

Возвращает массив объектов типов номеров. Каждый объект — это категория номера, а не отдельный физический номер. Ответ включает только номера, доступные на запрошенные даты. В данном случае: 41 из 85 типов номеров имеют доступность.

Ключевые поля: `id` (строка), `name_ru`, `description_ru`, `adults` (максимум гостей), `available` (количество свободных юнитов), `photos`, `amenities`, `plans` (тарифы с ценами).

## Цены

Цена за весь период: `rooms[n].plans[planId].price` (целое число, рублей).
Цена по ночам: `rooms[n].plans[planId].prices` (объект `{"2026-03-01": "2800.00", ...}`).

## Фотографии

`photos[].url` — 1050×600 для превью. `photos[].original_url` — оригинал для полного просмотра. Сортировать по полю `order`.

## Удобства

Для отображения названий и иконок удобств необходим отдельный вызов `/amenities`. В данных номера хранятся только ID удобств и значения: `{ "1": { "value": "32" } }`. Amenity ID `1` = площадь в м².

## /roomtypes

Возвращает все 85 типов номеров независимо от доступности. Для MVP не нужен — все данные (фото, удобства, описания) уже есть в `/rooms`.

## /plans

Метаданные тарифных планов. Цен не содержит — цены встроены в ответ `/rooms` для каждого диапазона дат.

## Отличия от допущений плана

- Поля `maxGuests` нет — используется `adults`.
- `/roomtypes` и `/api/plans` не нужны для MVP.
- `/rooms` возвращает только доступные номера (фильтр `available > 0` всегда будет true).
- `totalPrice` в API называется просто `price` (в `plans[planId].price`).
