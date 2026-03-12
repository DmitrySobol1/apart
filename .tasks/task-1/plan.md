# Task-1 — Apart-Hotel Online Booking Widget (Final Implementation Plan)

## Summary

Build a custom online booking widget for apart-nn.ru replacing the Bnovo widget. Embedded via iframe. MVP delivers a 4-step flow: search available rooms by dates/guests → browse room catalog with photos/amenities/rate plans → fill guest form → see "Request received" stub. Backend proxies GET requests to the Bnovo public API (avoids CORS, hides credentials). POST booking creates no real reservation — just logs and acknowledges. Real Bnovo booking and payment are deferred post-MVP.

## Goals

- Frontend widget (React 18 + TypeScript + Vite + Tailwind CSS) with 4-step SPA flow embedded via iframe.
- Backend proxy (Node.js 18 + Express + TypeScript) forwarding GET requests to `public-api.reservationsteps.ru` and exposing a POST `/api/booking` stub.
- All Bnovo identifiers (UID, account_id) stored server-side in `.env`, never exposed to the client.
- POST `/api/booking` logs received data and returns `{ success: true }` — no real booking (MVP).
- Widget loads inside `<iframe>` on `apart-nn.ru`; development and testing on localhost.

## Context & Principles

- Commercial project for a real apart-hotel; keep code production-quality but MVP-scoped.
- Desktop-only layout for MVP (responsive is post-MVP).
- Design references the current Bnovo widget appearance.
- No analytics, no auth, no admin panel in MVP.
- Favor straightforward patterns; avoid over-abstraction.

## Scope (MVP)

**In scope:**
- Search form: check-in/check-out dates, guest count, "Search" button.
- Room catalog: cards with photo gallery, name, area, amenities, rate plan selector, price, availability.
- Guest form: name, surname, phone, email, notes + validation.
- Confirmation stub: "Request received" page.
- Backend proxy for 4 Bnovo GET endpoints + 1 POST stub.
- iframe embedding with `postMessage`-based auto-height (lightweight, not a full loader.js).

**Out of scope (post-MVP):**
- Real booking creation (POST to reservationsteps.ru) and payment redirect.
- Responsive layout (mobile).
- Admin panel, promo codes, additional services.
- Calendar min prices / closed dates.
- Full loader script (loader.js) with dynamic configuration.
- Multilingual support, A/B testing.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Site apart-nn.ru                           │
│  <iframe src="https://widget.apart-nn.ru/"> │
│  ┌───────────────────────────────────────┐  │
│  │  Frontend (React SPA)                 │  │
│  │  localhost:5173 (dev)                 │  │
│  └──────────────┬────────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │ /api/*
                  ▼
┌─────────────────────────────────────────────┐
│  Backend (Express)                          │
│  localhost:3000 (dev)                       │
│  ┌────────────────────────────────────────┐ │
│  │ GET /api/rooms      → proxy Bnovo      │ │
│  │ GET /api/plans      → proxy Bnovo      │ │
│  │ GET /api/amenities  → proxy Bnovo      │ │
│  │ GET /api/account    → proxy Bnovo      │ │
│  │ POST /api/booking   → log + stub       │ │
│  └────────────────────────────────────────┘ │
│  Serves frontend static files (production) │
└──────────────┬──────────────────────────────┘
               │ GET (no auth required)
               ▼
┌──────────────────────────────────────────────┐
│  Bnovo Public API                            │
│  public-api.reservationsteps.ru/v1/api/      │
│  JSON responses, no authorization            │
└──────────────────────────────────────────────┘
```

## Config & Env

File: `.env` (from `.env.example`)

| Variable | Example | Description |
|----------|---------|-------------|
| `BNOVO_UID` | `d0ce239f-df14-4aa8-8ccf-83036c8cbb01` | Bnovo hotel UID |
| `BNOVO_ACCOUNT_ID` | `22720` | Bnovo account ID |
| `BNOVO_API_BASE` | `https://public-api.reservationsteps.ru/v1/api` | Bnovo public API base URL |
| `PORT` | `3000` | Backend server port |
| `NODE_ENV` | `development` | Environment |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend origin (for CORS in dev) |

Frontend env (Vite):

| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Backend API origin |

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18+ | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| React Router v6 | SPA navigation between 4 steps |
| Axios | HTTP client for backend API |
| react-datepicker | Date selection (check-in/check-out) |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js 18+ | Server platform |
| Express | HTTP framework |
| TypeScript | Type safety |
| Axios | HTTP client for Bnovo API |
| dotenv | Environment configuration |
| cors | CORS middleware |
| zod | Input validation |

> **Note:** No database in MVP. POST `/api/booking` only logs to console. MongoDB can be added later if booking persistence is needed.

## Data & API

### Bnovo Public API (upstream)

**Base URL:** `https://public-api.reservationsteps.ru/v1/api/`

| Endpoint | MVP Usage | Key Parameters |
|----------|----------|----------------|
| `GET /rooms` | Available rooms with prices for date range | `account_id`, `dfrom` (d-m-Y), `dto` (d-m-Y) |
| `GET /roomtypes` | Room type catalog (names, descriptions, photos, amenities) | `account_id` |
| `GET /plans` | Rate plans (names, prices) | `account_id` |
| `GET /amenities` | Amenity definitions (icons, names) | — |
| `GET /accounts` | Hotel info (name, address, etc.) | `uid` |

### Our Backend API

| Method | Path | Query/Body | Response | Proxies to |
|--------|------|-----------|----------|-----------|
| `GET` | `/api/rooms` | `?dfrom=DD-MM-YYYY&dto=DD-MM-YYYY` | Bnovo rooms JSON | `/rooms?account_id={env}&dfrom=...&dto=...` |
| `GET` | `/api/plans` | — | Bnovo plans JSON | `/plans?account_id={env}` |
| `GET` | `/api/amenities` | — | Bnovo amenities JSON | `/amenities` |
| `GET` | `/api/account` | — | Bnovo account JSON | `/accounts?uid={env}` |
| `POST` | `/api/booking` | JSON body (see below) | `{ success: true, message: "Request accepted" }` | MVP: log only |

### POST /api/booking — Request Body

```json
{
  "dfrom": "01-03-2026",
  "dto": "03-03-2026",
  "planId": 128501,
  "adults": 2,
  "roomTypeId": "357520",
  "guest": {
    "name": "Ivan",
    "surname": "Ivanov",
    "phone": "+7(999)123-4567",
    "email": "ivan@mail.ru",
    "notes": "Late check-in"
  }
}
```

Validation:
- `dfrom`, `dto`: required, format `DD-MM-YYYY`, `dto > dfrom`.
- `planId`: required, positive integer.
- `adults`: required, integer >= 1.
- `roomTypeId`: required, non-empty string.
- `guest.name`, `guest.surname`: required, non-empty strings.
- `guest.phone`: required, format `+7XXXXXXXXXX` (mask forces `+7` prefix, 10 digits after prefix). Frontend strips formatting before sending; backend validates clean `+7XXXXXXXXXX` format.
- `guest.email`: required, valid email format.
- `guest.notes`: optional string.

### Key Data Mapping (from Bnovo response)

- Room name: `name_ru || name` (fallback).
- Room description: `description_ru || description` (fallback, may be empty).
- Area: `amenities["1"].value` (m²).
- Photos: `photos[].url` for card thumbnails (1050x600), `photos[].original_url` for full-size. Sort by `order` field.
- Room ID: **string type**, not number.
- Availability: `available` field; show room only if `available > 0`.
- Price: from the selected rate plan for the given date range.

### Rooms API Response Handling (~1.5 MB)

- Backend caches the Bnovo `/rooms` response for 5 minutes (in-memory, keyed by `dfrom+dto`). Note: `adults` is not in the cache key because Bnovo `/rooms` does not accept a guest count parameter — it returns all rooms regardless.
- Backend strips unnecessary fields before forwarding to frontend (optional optimization).
- Frontend renders only rooms with `available > 0` **and** `maxGuests >= searchParams.adults` (client-side guest capacity filtering).

## UI Structure & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | SearchPage | Step 1: date/guest search form |
| `/rooms` | RoomsPage | Step 2: room catalog cards |
| `/booking` | BookingPage | Step 3: guest data form + summary |
| `/confirmation` | ConfirmationPage | Step 4: "Request received" stub |

Navigation: linear flow (1 → 2 → 3 → 4), with "Back" navigation at each step. "Back to Search" from confirmation resets state.

## Screen Specs

### Step 1: Search Form (`/`)

- **Layout:** Centered form card. Header: hotel name (from `/api/account`). Form fields vertically stacked.
- **Controls:**
  - Check-in date picker (required, default: today).
  - Check-out date picker (required, default: today + 1).
  - Guest count selector (integer, min 1, max 10, default 2).
  - "Search" button.
- **Interactions:**
  - Check-out must be > check-in; auto-adjust if needed.
  - On "Search": call `GET /api/rooms?dfrom=...&dto=...`; on success, navigate to `/rooms`.
  - Store search params + results in React Context.
- **Loading:** Spinner on button, disable form while loading.
- **Error:** Inline error message below form ("Failed to load rooms. Please try again.") with retry.
- **Empty:** If API returns 0 available rooms, navigate to `/rooms` which shows empty state.

### Step 2: Room Catalog (`/rooms`)

- **Layout:** Vertical list of room cards. Header with search summary ("Check-in: ..., Check-out: ..., Guests: ..."). "Back to Search" link.
- **Room Card Layout:**
  - Left: photo gallery (horizontal scroll or arrows, first photo visible).
  - Right: room name, area (m²), max guests, amenity icons, rate plan selector (dropdown if multiple), total price for period, available count, "Book" button.
- **Controls:**
  - Photo gallery navigation (prev/next arrows).
  - Rate plan selector (dropdown, default: first plan).
  - "Book" button per card.
- **Interactions:**
  - Selecting a plan updates the displayed price.
  - "Book" stores selected room + plan in Context, navigates to `/booking`.
- **Loading:** Skeleton cards while data loads (if navigated directly).
- **Empty:** "No rooms available for selected dates. Try different dates." with "Back to Search" link.
- **Data:** Rooms filtered to `available > 0` and `maxGuests >= searchParams.adults`, sorted by price ascending.

### Step 3: Guest Form (`/booking`)

- **Layout:** Two columns — left: guest form; right: booking summary card.
- **Guest Form Fields:**
  - First name (required, text).
  - Last name (required, text).
  - Phone (required, masked input `+7(___) ___-__-__`). Mask forces `+7` prefix; before submission, formatting is stripped to clean `+7XXXXXXXXXX`.
  - Email (required, email format).
  - Notes (optional, textarea).
- **Booking Summary (right sidebar):**
  - Room photo (first from gallery).
  - Room name.
  - Check-in / check-out dates.
  - Number of guests.
  - Rate plan name.
  - Total price.
- **Controls:**
  - Agreement checkbox ("I agree to the terms", required).
  - "Book" button (disabled until form is valid + checkbox checked).
  - "Back to Rooms" link.
- **Validation:** Client-side, on blur + on submit. Errors shown below each field.
- **Loading:** Spinner on "Book" button; disable form during submission.
- **Error:** Inline error if POST fails. "Booking request failed. Please try again."

### Step 4: Confirmation (`/confirmation`)

- **Layout:** Centered success card.
- **Content:**
  - Checkmark icon.
  - "Request Received!" heading.
  - "Thank you for your request. We will contact you shortly."
  - Booking summary (room, dates, guest name).
  - "Back to Search" button (resets all state, navigates to `/`).
- **No loading/error states** (page is static after navigation).

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `DatePicker` | `components/DatePicker.tsx` | Check-in/check-out date selection |
| `GuestCounter` | `components/GuestCounter.tsx` | +/- guest count selector |
| `RoomCard` | `components/RoomCard.tsx` | Single room card in catalog |
| `PhotoGallery` | `components/PhotoGallery.tsx` | Horizontal photo carousel with prev/next |
| `AmenityList` | `components/AmenityList.tsx` | Row of amenity icons with tooltips |
| `PlanSelector` | `components/PlanSelector.tsx` | Dropdown rate plan selector |
| `GuestForm` | `components/GuestForm.tsx` | Guest data form with validation |
| `BookingSummary` | `components/BookingSummary.tsx` | Selected room/dates/price summary |
| `LoadingSpinner` | `components/LoadingSpinner.tsx` | Reusable spinner |
| `ErrorMessage` | `components/ErrorMessage.tsx` | Inline error with optional retry button |

## State Management

- **React Context** (`BookingContext`): single context holding the full booking state.
  ```ts
  interface BookingState {
    searchParams: { dfrom: string; dto: string; adults: number } | null;
    rooms: Room[] | null;
    selectedRoom: Room | null;
    selectedPlan: RoomPlan | null;
    guest: GuestData | null;
  }
  ```
- Context provides `setSearchParams`, `setRooms`, `selectRoom`, `selectPlan`, `setGuest`, `reset`.
- No external state library; local component state for form inputs, context for cross-page data.
- On "Back to Search" from confirmation: call `reset()` to clear all state.

## Data Fetching

- **Axios instance** (`api/client.ts`):
  - Base URL from `VITE_API_BASE_URL` (or relative `/api` in production).
  - JSON content type.
  - Response interceptor for error mapping (network errors, 4xx/5xx → user-friendly messages).
- **No SWR/React Query** for MVP — simple `useEffect` + `useState` in pages, since data is fetched once per user action (search), not continuously.
- **Caching:** None on frontend (backend caches Bnovo responses).

## TypeScript Types

File: `frontend/src/types/index.ts`

```ts
interface Room {
  id: string;               // string, not number
  name: string;             // name_ru || name
  description: string;      // description_ru || description
  area: number | null;      // amenities["1"].value
  maxGuests: number;
  photos: RoomPhoto[];
  amenities: Amenity[];
  plans: RoomPlan[];
  available: number;
}

interface RoomPhoto {
  url: string;              // 1050x600 thumbnail
  originalUrl: string;      // full-size
  order: number;
}

interface Amenity {
  id: string;
  name: string;
  icon: string | null;
}

interface RoomPlan {
  id: number;
  name: string;
  totalPrice: number;       // for the selected date range
}

interface GuestData {
  name: string;
  surname: string;
  phone: string;
  email: string;
  notes: string;
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

## Styling

- Tailwind CSS setup: `tailwind.config.ts` with content paths `["./index.html", "./src/**/*.{ts,tsx}"]`.
- Base styles in `src/styles/globals.css`: Tailwind directives + minimal custom CSS.
- Design: clean, modern, white background, blue accent (similar to Bnovo reference widget).
- No custom component library; pure Tailwind utility classes.
- Font: system font stack (no external fonts for MVP).

## Dev/Build Config

- **Frontend (Vite):**
  - Dev server: `localhost:5173`.
  - Proxy `/api` to backend (`http://localhost:3000`) in `vite.config.ts` to avoid CORS in dev.
  - Build output: `frontend/dist/` (static files).
  - `base: '/'` (widget served from root of its domain).
- **Backend (Express + tsx):**
  - Dev: `tsx watch src/index.ts`.
  - Production: compile to JS, serve `frontend/dist/` as static files, run with `node`.
  - CORS middleware: allow `FRONTEND_URL` origin in dev; in production, frontend is served from same origin.
- **Scripts (package.json):**
  - `frontend/`: `dev`, `build`, `preview`.
  - `backend/`: `dev`, `build`, `start`.
  - Root: optional `dev` script running both concurrently.

## Error Handling

- **Backend:**
  - Bnovo API errors: catch, log, return 502 with `{ error: "Upstream API error" }`.
  - Bnovo timeout (10s): return 504 with `{ error: "Upstream API timeout" }`.
  - Validation errors: return 400 with `{ error: "..." }`.
  - All errors logged with timestamp and details.
- **Frontend:**
  - Axios interceptor maps HTTP errors to user-friendly messages.
  - Network errors: "Connection error. Check your internet and try again."
  - 400: "Invalid request. Please check your input."
  - 502/504: "Service temporarily unavailable. Please try again in a moment."
  - 5xx: "Something went wrong. Please try again."
  - Each page handles errors inline (no global error boundary for MVP).

## Edge Cases & Behavior

- **No available rooms:** RoomsPage shows empty state with suggestion to change dates. This includes both `available == 0` and `maxGuests < adults`.
- **Guest filtering:** Bnovo `/rooms` does not accept guest count; backend returns all rooms. Frontend filters `maxGuests >= searchParams.adults` client-side.
- **Room ID is a string:** All type definitions and comparisons use `string`.
- **Date validation:** Check-out must be after check-in; backend validates format `DD-MM-YYYY` before forwarding to Bnovo.
- **Large Bnovo response (~1.5 MB):** Backend caches in-memory (5 min TTL, key: `dfrom+dto`). Frontend only processes rooms with `available > 0`.
- **Photos sorting:** Always sort `photos` by `order` before rendering.
- **Missing room data:** Fallback `name_ru → name`, `description_ru → description`. If both empty, show "No description".
- **Single room per booking:** MVP allows selecting exactly 1 room type, quantity 1.
- **Direct URL access:** If user navigates to `/rooms` or `/booking` without context data, redirect to `/` (search page).
- **Browser back button:** Works naturally with React Router. Context state preserved during back navigation within the flow.

## Project Structure

```
apart-nn-develop/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── context/
│   │   │   └── BookingContext.tsx
│   │   ├── pages/
│   │   │   ├── SearchPage.tsx
│   │   │   ├── RoomsPage.tsx
│   │   │   ├── BookingPage.tsx
│   │   │   └── ConfirmationPage.tsx
│   │   ├── components/
│   │   │   ├── DatePicker.tsx
│   │   │   ├── GuestCounter.tsx
│   │   │   ├── RoomCard.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── AmenityList.tsx
│   │   │   ├── PlanSelector.tsx
│   │   │   ├── GuestForm.tsx
│   │   │   ├── BookingSummary.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── rooms.ts
│   │   │   ├── plans.ts
│   │   │   ├── amenities.ts
│   │   │   ├── account.ts
│   │   │   └── booking.ts
│   │   ├── services/
│   │   │   └── bnovoClient.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

## Acceptance Criteria

- Search form accepts check-in/check-out dates and guest count; returns available rooms from Bnovo via backend proxy.
- Room catalog displays cards with photos (sorted by order), name, area, amenities, rate plan selector, total price, and availability count.
- Only rooms with `available > 0` are shown.
- Guest form validates required fields (name, surname, phone, email) and Russian phone format on the client side.
- POST `/api/booking` logs the full booking payload server-side and returns `{ success: true, message: "Request accepted" }`.
- "Request received" stub page is shown after successful form submission.
- Widget loads correctly inside an `<iframe>` with `postMessage`-based auto-height (no double scrollbars).
- All Bnovo identifiers (UID, account_id) are server-side only, not present in frontend bundle or network requests visible to the user.
- Backend proxy correctly forwards GET requests to Bnovo and returns valid JSON to the frontend.
- Navigating directly to `/rooms` or `/booking` without prior search redirects to `/`.

## Risks & Mitigation

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|-----------|
| 1 | CORS on Bnovo public API | High | All requests go through backend proxy (in architecture) |
| 2 | Bnovo changes API response format | Medium | Mapping layer in `bnovoClient.ts` isolates changes; monitor and update quickly |
| 3 | Large /rooms response (~1.5 MB) | — | 5-min in-memory cache on backend; filter `available > 0` on frontend |
| 4 | Bnovo API downtime/slowness | Low | 10s timeout; user-friendly error with retry |

## Future Improvements (Post-MVP)

| # | Task | Priority |
|---|------|---------|
| 1 | Real booking via POST to reservationsteps.ru | High |
| 2 | Payment redirect to payment.bnovo.ru | High |
| 3 | Responsive layout (mobile) | High |
| 4 | Custom pricing logic (Bnovo data processing) | High |
| 5 | Admin panel (widget settings, colors, texts) | High |
| 6 | Promo codes | Medium |
| 7 | Additional services (meals, parking) | Medium |
| 8 | Calendar min prices / closed dates | Medium |
| 9 | Booking journal/monitoring | Medium |
| 10 | Loader script (loader.js) with iframe auto-height | Low |
| 11 | Multilingual support | Low |

## Key Identifiers (Reference)

| Parameter | Value |
|-----------|-------|
| UID | `d0ce239f-df14-4aa8-8ccf-83036c8cbb01` |
| account_id | `22720` |
| Hotel name | Apart-hotel — 9 Nights Nizhny Novgorod |
| Site | apart-nn.ru |
| Widget domain | widget.apart-nn.ru |
| Public API | `public-api.reservationsteps.ru/v1/api/` |
| Booking POST (future) | `reservationsteps.ru/bookings/post/{uid}` |
| Payment (future) | `payment.bnovo.ru/v2/?transaction=book_{HASH}` |

## Decomposed Subtasks

- [ ] stt-000 | Code Implementer | research / Bnovo API exploration — curl endpoints, save fixtures, create .env, document data structure
      Curl all 5 Bnovo public API endpoints (`/rooms`, `/roomtypes`, `/plans`, `/amenities`, `/accounts`) with real `account_id=22720` and `uid=d0ce239f-df14-4aa8-8ccf-83036c8cbb01`. Save raw JSON responses as `fixtures/bnovo-rooms.json`, `fixtures/bnovo-roomtypes.json`, `fixtures/bnovo-plans.json`, `fixtures/bnovo-amenities.json`, `fixtures/bnovo-accounts.json`. Create `backend/.env` (gitignored) with real `BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE`, `PORT`. Document the actual field structure in `fixtures/README.md`: which endpoint contains photos, descriptions, amenities, prices, availability; how room types map to rooms; how rate plans link to prices. Identify whether `/rooms` already includes all data or if `/rooms` + `/roomtypes` merge is needed. **Update the plan** (Data & API, Key Data Mapping, Backend API sections) if real data differs from current assumptions.
      **Post-step:** After completing this task, review and update stt-002 (Backend proxy architecture — routes, merge logic, caching strategy) and stt-004 (Frontend types and data mapping) based on real API data. If the actual data structure differs from assumptions, update those subtask descriptions and acceptance criteria before they are started.
      **Acceptance:** All 5 fixture files saved with real API data. `backend/.env` created and working. `fixtures/README.md` documents data structure and answers: (1) `/rooms` vs `/roomtypes` merge needed? (2) where does `totalPrice` come from? (3) do amenities need a separate endpoint? Plan updated if needed. stt-002 and stt-004 reviewed and updated if real data differs from current assumptions.

- [ ] stt-001 | Code Implementer | infra / Project initialization — monorepo with frontend + backend, env config, tooling
      Set up `frontend/` (Vite + React 18 + TypeScript + Tailwind CSS + React Router v6 + Axios) and `backend/` (Node.js 18 + Express + TypeScript + Axios + dotenv + cors). Create `.env.example` with all variables from Config & Env section. Configure `tsconfig.json` for both packages. Set up Vite dev proxy (`/api` → `http://localhost:3000`). Add `dev` scripts for both packages. Verify both start and frontend proxies to backend.
      **Acceptance:** `npm run dev` starts both servers; `GET http://localhost:5173/api/account` proxies through to backend (can return error if Bnovo not yet wired, but proxy itself works).

- [ ] stt-002 | Code Implementer | feature / Backend Bnovo proxy — bnovoClient + 4 GET routes + caching
      Implement `bnovoClient.ts` reading `BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE` from env. Create 4 proxy routes: `GET /api/rooms?dfrom&dto`, `GET /api/plans`, `GET /api/amenities`, `GET /api/account`. Add input validation for `dfrom`/`dto` (DD-MM-YYYY format). Implement in-memory cache for `/rooms` (5 min TTL, keyed by dfrom+dto). Add error handler middleware returning structured JSON errors. Add 10s timeout on Bnovo requests.
      **Acceptance:** `curl http://localhost:3000/api/rooms?dfrom=01-03-2026&dto=03-03-2026` returns Bnovo room data. Invalid dates return 400. Second identical request served from cache.

- [ ] stt-003 | Code Implementer | feature / Backend booking stub — POST /api/booking with validation and logging
      Implement `POST /api/booking` accepting the BookingRequest body. Validate all required fields (dates, planId, adults, roomTypeId, guest name/surname/phone/email). Phone validation: `+7XXXXXXXXXX` format (12 chars, starts with `+7`). Log the full payload with timestamp to console. Return `{ success: true, message: "Request accepted" }`. Invalid input returns 400 with field-level errors.
      **Acceptance:** Valid POST returns 200 + success JSON; payload appears in server console. Missing `guest.phone` returns 400 with error message.

- [ ] stt-004 | Code Implementer | feature / Frontend foundation — types, API client, BookingContext, routing shell
      Create TypeScript types (`types/index.ts`) per the Types section. Implement Axios client (`api/client.ts`) with `VITE_API_BASE_URL`, JSON defaults, error interceptor. Create `BookingContext` with state and actions per State Management section. Set up React Router with 4 routes and stub pages. Add redirect logic: `/rooms` and `/booking` redirect to `/` if context has no data.
      **Acceptance:** App renders SearchPage at `/`. Navigating to `/rooms` without search redirects to `/`. Axios client configured and importable.

- [ ] stt-005 | Code Implementer | feature / Frontend Step 1 — SearchPage with DatePicker, GuestCounter, search action
      Build SearchPage with DatePicker (check-in/check-out using react-datepicker or native inputs), GuestCounter (+/- buttons, min 1, max 10, default 2), and "Search" button. On search, call `GET /api/rooms`, store results in BookingContext, navigate to `/rooms`. Handle loading state (spinner on button, disabled form) and error state (inline message with retry). Validate check-out > check-in.
      **Acceptance:** User selects dates + guests, clicks "Search", sees loading spinner, then navigates to rooms page with data in context. Bnovo API error shows inline error message.

- [ ] stt-006 | Code Implementer | feature / Frontend Step 2 — RoomsPage with RoomCard, PhotoGallery, AmenityList, PlanSelector
      Build RoomsPage displaying room cards from context. Each RoomCard shows: PhotoGallery (sorted by `order`, prev/next navigation), room name, area, max guests, AmenityList (icons with tooltips), PlanSelector (dropdown if multiple plans), total price for period, available count, "Book" button. Filter rooms to `available > 0` **and** `maxGuests >= searchParams.adults` (client-side guest capacity filtering), sort by price ascending. Header shows search params summary. "Back to Search" link. Empty state if no rooms available.
      **Acceptance:** Rooms page shows filtered/sorted cards (only rooms fitting guest count). Photo gallery navigates between photos. Plan selector changes displayed price. "Book" stores selection and navigates to `/booking`.

- [ ] stt-007 | Code Implementer | feature / Frontend Steps 3-4 — BookingPage + ConfirmationPage
      Build BookingPage: GuestForm (name, surname, phone with `+7` mask, email, notes) with client-side validation (on blur + on submit), BookingSummary sidebar (room photo, name, dates, guests, plan, total price), agreement checkbox, "Book" button (disabled until valid). Phone mask forces `+7(___) ___-__-__` format; before submission, strip formatting to clean `+7XXXXXXXXXX`. On submit, POST to `/api/booking`. On success, navigate to `/confirmation`. Build ConfirmationPage: success icon, "Request Received!" heading, summary, "Back to Search" button (resets context). Handle POST errors inline.
      **Acceptance:** Form validates required fields and `+7` phone format. Valid submission shows confirmation page. Invalid fields show error messages below inputs. "Back to Search" resets state.

- [ ] stt-008 | Code Implementer | feature / Styling, polish & iframe integration — Tailwind theme, postMessage auto-height, iframe test
      Apply consistent Tailwind styling across all pages matching Bnovo widget aesthetic (clean, white background, blue accents). Add LoadingSpinner and ErrorMessage reusable components. Implement `postMessage`-based auto-height: widget sends `window.parent.postMessage({ type: 'resize', height: document.body.scrollHeight })` on route changes and content updates; provide a minimal inline script example for the host page that listens for the message and adjusts iframe height. Test widget inside an iframe on a test HTML page (with the auto-height script). Verify no double scrollbars, proper sizing. Add basic transitions between pages.
      **Acceptance:** Widget looks polished and consistent. Loads correctly inside `<iframe>` with auto-adjusting height. No double scrollbars. Host page example script provided.

- [ ] stt-009 | Test Writer | eval / Integration verification — full flow + iframe + edge cases
      Verify full user flow: search → room catalog → guest form → confirmation. Test with real Bnovo API data through backend proxy. Test edge cases: no available rooms, invalid dates, empty guest fields, direct URL access without context. Test iframe embedding. Verify backend caching works (second request faster). Verify all Bnovo identifiers absent from frontend bundle.
      **Acceptance:** Complete flow works end-to-end. Edge cases handled gracefully. Widget works in iframe. No credentials leak to client.

---
---

# Русский перевод (Russian Translation)

> **NOTE:** This section is a Russian translation provided for the project owner's convenience. The development agent uses only the English section above. Do not modify this section for development purposes.

## Краткое описание

Разработать виджет онлайн-бронирования для apart-nn.ru, заменяющий виджет Bnovo. Встраивается через iframe. MVP: 4-шаговый flow — поиск номеров по датам/гостям → каталог номеров с фото/удобствами/тарифами → форма гостя → заглушка «Запрос принят». Backend проксирует GET-запросы к публичному API Bnovo (обход CORS, скрытие учётных данных). POST бронирования не создаёт реальную бронь — только логирует и подтверждает. Реальное бронирование через Bnovo и оплата — после MVP.

## Цели

- Frontend-виджет (React 18 + TypeScript + Vite + Tailwind CSS) с 4-шаговым SPA flow через iframe.
- Backend-прокси (Node.js 18 + Express + TypeScript), проксирующий GET-запросы к `public-api.reservationsteps.ru` + POST `/api/booking` заглушка.
- Все идентификаторы Bnovo (UID, account_id) хранятся на сервере в `.env`, никогда не передаются клиенту.
- POST `/api/booking` логирует полученные данные и возвращает `{ success: true }` — без реального бронирования (MVP).
- Виджет загружается внутри `<iframe>` на apart-nn.ru; разработка и тесты на localhost.

## Контекст и принципы

- Коммерческий проект для реального апарт-отеля; код production-quality, но в рамках MVP-скоупа.
- Только десктоп для MVP (адаптивная вёрстка — после MVP).
- Дизайн по референсу текущего виджета Bnovo.
- Без аналитики, авторизации, админ-панели в MVP.
- Простые паттерны; без избыточной абстракции.

## Скоуп (MVP)

**Входит:**
- Форма поиска: даты заезда/выезда, количество гостей, кнопка «Искать».
- Каталог номеров: карточки с фото-галереей, названием, площадью, удобствами, выбором тарифа, ценой, доступностью.
- Форма гостя: имя, фамилия, телефон, email, примечания + валидация.
- Заглушка подтверждения: страница «Запрос принят».
- Backend-прокси для 4 GET-эндпоинтов Bnovo + 1 POST заглушка.
- Встраивание через iframe с авто-высотой на основе `postMessage` (лёгкий вариант, не полноценный loader.js).

**Не входит (после MVP):**
- Реальное создание бронирования (POST на reservationsteps.ru) и редирект на оплату.
- Адаптивная вёрстка (мобильные).
- Админ-панель, промокоды, допуслуги.
- Минимальные цены / закрытые даты в календаре.
- Полноценный скрипт-лоадер (loader.js) с динамической конфигурацией.
- Мультиязычность, A/B тестирование.

## Архитектура

```
┌─────────────────────────────────────────────┐
│  Сайт apart-nn.ru                          │
│  <iframe src="https://widget.apart-nn.ru/"> │
│  ┌───────────────────────────────────────┐  │
│  │  Frontend (React SPA)                 │  │
│  │  localhost:5173 (dev)                 │  │
│  └──────────────┬────────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │ /api/*
                  ▼
┌─────────────────────────────────────────────┐
│  Backend (Express)                          │
│  localhost:3000 (dev)                       │
│  ┌────────────────────────────────────────┐ │
│  │ GET /api/rooms      → прокси Bnovo     │ │
│  │ GET /api/plans      → прокси Bnovo     │ │
│  │ GET /api/amenities  → прокси Bnovo     │ │
│  │ GET /api/account    → прокси Bnovo     │ │
│  │ POST /api/booking   → лог + заглушка   │ │
│  └────────────────────────────────────────┘ │
│  Раздаёт статику frontend (production)     │
└──────────────┬──────────────────────────────┘
               │ GET (авторизация не требуется)
               ▼
┌──────────────────────────────────────────────┐
│  Bnovo Public API                            │
│  public-api.reservationsteps.ru/v1/api/      │
│  JSON-ответы, без авторизации                │
└──────────────────────────────────────────────┘
```

## Конфигурация и переменные окружения

Файл: `.env` (из `.env.example`)

| Переменная | Пример | Описание |
|------------|--------|----------|
| `BNOVO_UID` | `d0ce239f-df14-4aa8-8ccf-83036c8cbb01` | UID отеля в Bnovo |
| `BNOVO_ACCOUNT_ID` | `22720` | ID аккаунта Bnovo |
| `BNOVO_API_BASE` | `https://public-api.reservationsteps.ru/v1/api` | Базовый URL публичного API Bnovo |
| `PORT` | `3000` | Порт backend-сервера |
| `NODE_ENV` | `development` | Окружение |
| `FRONTEND_URL` | `http://localhost:5173` | Адрес фронтенда (для CORS в dev) |

Frontend env (Vite):

| Переменная | Пример | Описание |
|------------|--------|----------|
| `VITE_API_BASE_URL` | `http://localhost:3000` | Адрес backend API |

## Технологический стек

### Frontend
| Технология | Назначение |
|-----------|---------|
| React 18+ | UI-фреймворк |
| TypeScript | Типобезопасность |
| Vite | Сборщик и dev-сервер |
| Tailwind CSS | Утилитарные стили |
| React Router v6 | SPA-навигация между 4 шагами |
| Axios | HTTP-клиент для backend API |
| react-datepicker | Выбор дат (заезд/выезд) |

### Backend
| Технология | Назначение |
|-----------|---------|
| Node.js 18+ | Серверная платформа |
| Express | HTTP-фреймворк |
| TypeScript | Типобезопасность |
| Axios | HTTP-клиент для Bnovo API |
| dotenv | Конфигурация окружения |
| cors | CORS middleware |
| zod | Валидация входных данных |

> **Примечание:** В MVP нет базы данных. POST `/api/booking` только логирует в консоль. MongoDB можно добавить позже, если потребуется сохранение бронирований.

## Данные и API

### Публичный API Bnovo (upstream)

**Базовый URL:** `https://public-api.reservationsteps.ru/v1/api/`

| Эндпоинт | Использование в MVP | Ключевые параметры |
|----------|---------------------|-------------------|
| `GET /rooms` | Доступные номера с ценами для диапазона дат | `account_id`, `dfrom` (d-m-Y), `dto` (d-m-Y) |
| `GET /roomtypes` | Каталог типов номеров (названия, описания, фото, удобства) | `account_id` |
| `GET /plans` | Тарифные планы (названия, цены) | `account_id` |
| `GET /amenities` | Определения удобств (иконки, названия) | — |
| `GET /accounts` | Информация об отеле (название, адрес и т.д.) | `uid` |

### Наш Backend API

| Метод | Путь | Query/Body | Ответ | Проксирует на |
|-------|------|-----------|-------|--------------|
| `GET` | `/api/rooms` | `?dfrom=DD-MM-YYYY&dto=DD-MM-YYYY` | JSON номеров Bnovo | `/rooms?account_id={env}&dfrom=...&dto=...` |
| `GET` | `/api/plans` | — | JSON тарифов Bnovo | `/plans?account_id={env}` |
| `GET` | `/api/amenities` | — | JSON удобств Bnovo | `/amenities` |
| `GET` | `/api/account` | — | JSON аккаунта Bnovo | `/accounts?uid={env}` |
| `POST` | `/api/booking` | JSON body (см. ниже) | `{ success: true, message: "Request accepted" }` | MVP: только лог |

### POST /api/booking — тело запроса

```json
{
  "dfrom": "01-03-2026",
  "dto": "03-03-2026",
  "planId": 128501,
  "adults": 2,
  "roomTypeId": "357520",
  "guest": {
    "name": "Ivan",
    "surname": "Ivanov",
    "phone": "+7(999)123-4567",
    "email": "ivan@mail.ru",
    "notes": "Late check-in"
  }
}
```

Валидация:
- `dfrom`, `dto`: обязательные, формат `DD-MM-YYYY`, `dto > dfrom`.
- `planId`: обязательный, положительное целое.
- `adults`: обязательное, целое >= 1.
- `roomTypeId`: обязательный, непустая строка.
- `guest.name`, `guest.surname`: обязательные, непустые строки.
- `guest.phone`: обязательный, формат `+7XXXXXXXXXX` (маска форсирует префикс `+7`, 10 цифр после префикса). Фронтенд снимает форматирование перед отправкой; бэкенд валидирует чистый формат `+7XXXXXXXXXX`.
- `guest.email`: обязательный, валидный формат email.
- `guest.notes`: опциональная строка.

### Маппинг данных (из ответа Bnovo)

- Название номера: `name_ru || name` (фолбэк).
- Описание номера: `description_ru || description` (фолбэк, может быть пустым).
- Площадь: `amenities["1"].value` (м²).
- Фото: `photos[].url` для превью карточки (1050x600), `photos[].original_url` для полного размера. Сортировка по полю `order`.
- ID номера: **тип string**, не number.
- Доступность: поле `available`; показывать номер только если `available > 0`.
- Цена: из выбранного тарифного плана для заданного диапазона дат.

### Обработка ответа API номеров (~1,5 МБ)

- Бэкенд кэширует ответ Bnovo `/rooms` на 5 минут (in-memory, ключ: `dfrom+dto`). Примечание: `adults` не входит в ключ кэша, потому что Bnovo `/rooms` не принимает параметр количества гостей — возвращает все номера.
- Бэкенд может убирать лишние поля перед передачей фронтенду (опциональная оптимизация).
- Фронтенд отображает только номера с `available > 0` **и** `maxGuests >= searchParams.adults` (клиентская фильтрация по вместимости).

## Структура UI и маршруты

| Маршрут | Страница | Описание |
|---------|----------|----------|
| `/` | SearchPage | Шаг 1: форма поиска по датам/гостям |
| `/rooms` | RoomsPage | Шаг 2: каталог карточек номеров |
| `/booking` | BookingPage | Шаг 3: форма данных гостя + сводка |
| `/confirmation` | ConfirmationPage | Шаг 4: заглушка «Запрос принят» |

Навигация: линейный flow (1 → 2 → 3 → 4), с кнопкой «Назад» на каждом шаге. «Назад к поиску» с подтверждения сбрасывает состояние.

## Спецификации экранов

### Шаг 1: Форма поиска (`/`)

- **Макет:** Центрированная карточка формы. Заголовок: название отеля (из `/api/account`). Поля формы расположены вертикально.
- **Элементы управления:**
  - Выбор даты заезда (обязательный, по умолчанию: сегодня).
  - Выбор даты выезда (обязательный, по умолчанию: сегодня + 1).
  - Селектор количества гостей (целое, мин. 1, макс. 10, по умолчанию 2).
  - Кнопка «Искать».
- **Взаимодействия:**
  - Дата выезда должна быть > даты заезда; авто-коррекция при необходимости.
  - По нажатию «Искать»: вызов `GET /api/rooms?dfrom=...&dto=...`; при успехе — переход на `/rooms`.
  - Параметры поиска + результаты сохраняются в React Context.
- **Загрузка:** Спиннер на кнопке, форма заблокирована во время загрузки.
- **Ошибка:** Инлайн-сообщение под формой («Не удалось загрузить номера. Попробуйте снова.») с повтором.
- **Пусто:** Если API вернул 0 доступных номеров, переход на `/rooms`, который покажет пустое состояние.

### Шаг 2: Каталог номеров (`/rooms`)

- **Макет:** Вертикальный список карточек номеров. Заголовок с итогами поиска («Заезд: ..., Выезд: ..., Гости: ...»). Ссылка «Назад к поиску».
- **Макет карточки номера:**
  - Слева: фото-галерея (горизонтальная прокрутка или стрелки, первое фото видно).
  - Справа: название номера, площадь (м²), макс. гостей, иконки удобств, селектор тарифа (выпадающий список, если несколько), итоговая цена за период, количество свободных, кнопка «Забронировать».
- **Элементы управления:**
  - Навигация по фото-галерее (стрелки назад/вперёд).
  - Селектор тарифного плана (выпадающий, по умолчанию: первый план).
  - Кнопка «Забронировать» на каждой карточке.
- **Взаимодействия:**
  - Выбор плана обновляет отображаемую цену.
  - «Забронировать» сохраняет выбранный номер + план в Context, переход на `/booking`.
- **Загрузка:** Скелетоны карточек во время загрузки (при прямом переходе).
- **Пусто:** «Нет доступных номеров на выбранные даты. Попробуйте другие даты.» со ссылкой «Назад к поиску».
- **Данные:** Номера отфильтрованы по `available > 0` и `maxGuests >= searchParams.adults`, отсортированы по цене по возрастанию.

### Шаг 3: Форма гостя (`/booking`)

- **Макет:** Две колонки — слева: форма гостя; справа: карточка сводки бронирования.
- **Поля формы гостя:**
  - Имя (обязательное, текст).
  - Фамилия (обязательная, текст).
  - Телефон (обязательный, маска ввода `+7(___) ___-__-__`). Маска форсирует `+7`; перед отправкой форматирование снимается до чистого `+7XXXXXXXXXX`.
  - Email (обязательный, формат email).
  - Примечания (опционально, textarea).
- **Сводка бронирования (правая колонка):**
  - Фото номера (первое из галереи).
  - Название номера.
  - Даты заезда/выезда.
  - Количество гостей.
  - Название тарифного плана.
  - Итоговая цена.
- **Элементы управления:**
  - Чекбокс согласия («Я принимаю условия», обязательный).
  - Кнопка «Забронировать» (неактивна, пока форма не валидна + чекбокс не отмечен).
  - Ссылка «Назад к номерам».
- **Валидация:** На клиенте, по blur + при отправке. Ошибки показываются под каждым полем.
- **Загрузка:** Спиннер на кнопке «Забронировать»; форма заблокирована во время отправки.
- **Ошибка:** Инлайн-ошибка при неудаче POST. «Не удалось отправить запрос на бронирование. Попробуйте снова.»

### Шаг 4: Подтверждение (`/confirmation`)

- **Макет:** Центрированная карточка успеха.
- **Содержимое:**
  - Иконка галочки.
  - Заголовок «Запрос принят!».
  - «Спасибо за вашу заявку. Мы свяжемся с вами в ближайшее время.»
  - Сводка бронирования (номер, даты, имя гостя).
  - Кнопка «Назад к поиску» (сбрасывает всё состояние, переход на `/`).
- **Нет состояний загрузки/ошибки** (страница статична после перехода).

## Компоненты

| Компонент | Файл | Назначение |
|-----------|------|---------|
| `DatePicker` | `components/DatePicker.tsx` | Выбор дат заезда/выезда |
| `GuestCounter` | `components/GuestCounter.tsx` | Селектор количества гостей +/- |
| `RoomCard` | `components/RoomCard.tsx` | Карточка номера в каталоге |
| `PhotoGallery` | `components/PhotoGallery.tsx` | Горизонтальная фото-карусель с навигацией |
| `AmenityList` | `components/AmenityList.tsx` | Ряд иконок удобств с тултипами |
| `PlanSelector` | `components/PlanSelector.tsx` | Выпадающий селектор тарифного плана |
| `GuestForm` | `components/GuestForm.tsx` | Форма данных гостя с валидацией |
| `BookingSummary` | `components/BookingSummary.tsx` | Сводка выбранного номера/дат/цены |
| `LoadingSpinner` | `components/LoadingSpinner.tsx` | Переиспользуемый спиннер |
| `ErrorMessage` | `components/ErrorMessage.tsx` | Инлайн-ошибка с кнопкой повтора |

## Управление состоянием

- **React Context** (`BookingContext`): единый контекст для всего состояния бронирования.
  ```ts
  interface BookingState {
    searchParams: { dfrom: string; dto: string; adults: number } | null;
    rooms: Room[] | null;
    selectedRoom: Room | null;
    selectedPlan: RoomPlan | null;
    guest: GuestData | null;
  }
  ```
- Контекст предоставляет: `setSearchParams`, `setRooms`, `selectRoom`, `selectPlan`, `setGuest`, `reset`.
- Без внешних библиотек состояния; локальное состояние компонентов для форм, контекст для межстраничных данных.
- «Назад к поиску» с подтверждения: вызов `reset()` для очистки всего состояния.

## Загрузка данных

- **Инстанс Axios** (`api/client.ts`):
  - Базовый URL из `VITE_API_BASE_URL` (или относительный `/api` в продакшене).
  - JSON content type.
  - Response interceptor для маппинга ошибок (сетевые ошибки, 4xx/5xx → пользовательские сообщения).
- **Без SWR/React Query** для MVP — простые `useEffect` + `useState` на страницах, т.к. данные загружаются однократно по действию пользователя (поиск), не непрерывно.
- **Кэширование:** Нет на фронтенде (бэкенд кэширует ответы Bnovo).

## TypeScript типы

Файл: `frontend/src/types/index.ts`

```ts
interface Room {
  id: string;               // string, не number
  name: string;             // name_ru || name
  description: string;      // description_ru || description
  area: number | null;      // amenities["1"].value
  maxGuests: number;
  photos: RoomPhoto[];
  amenities: Amenity[];
  plans: RoomPlan[];
  available: number;
}

interface RoomPhoto {
  url: string;              // превью 1050x600
  originalUrl: string;      // полный размер
  order: number;
}

interface Amenity {
  id: string;
  name: string;
  icon: string | null;
}

interface RoomPlan {
  id: number;
  name: string;
  totalPrice: number;       // за выбранный диапазон дат
}

interface GuestData {
  name: string;
  surname: string;
  phone: string;
  email: string;
  notes: string;
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

## Стилизация

- Настройка Tailwind CSS: `tailwind.config.ts` с путями `["./index.html", "./src/**/*.{ts,tsx}"]`.
- Базовые стили в `src/styles/globals.css`: директивы Tailwind + минимальный кастомный CSS.
- Дизайн: чистый, современный, белый фон, синие акценты (аналогично виджету Bnovo).
- Без кастомной библиотеки компонентов; чистые утилитарные классы Tailwind.
- Шрифт: системный стек (без внешних шрифтов для MVP).

## Конфигурация Dev/Build

- **Frontend (Vite):**
  - Dev-сервер: `localhost:5173`.
  - Прокси `/api` на бэкенд (`http://localhost:3000`) в `vite.config.ts` для обхода CORS в dev.
  - Выход сборки: `frontend/dist/` (статические файлы).
  - `base: '/'` (виджет раздаётся с корня своего домена).
- **Backend (Express + tsx):**
  - Dev: `tsx watch src/index.ts`.
  - Production: компиляция в JS, раздача `frontend/dist/` как статики, запуск через `node`.
  - CORS middleware: разрешает `FRONTEND_URL` в dev; в продакшене фронтенд раздаётся с того же origin.
- **Скрипты (package.json):**
  - `frontend/`: `dev`, `build`, `preview`.
  - `backend/`: `dev`, `build`, `start`.
  - Root: опциональный скрипт `dev`, запускающий оба параллельно.

## Обработка ошибок

- **Backend:**
  - Ошибки Bnovo API: перехват, лог, ответ 502 с `{ error: "Upstream API error" }`.
  - Таймаут Bnovo (10 сек): ответ 504 с `{ error: "Upstream API timeout" }`.
  - Ошибки валидации: ответ 400 с `{ error: "..." }`.
  - Все ошибки логируются с таймстампом и деталями.
- **Frontend:**
  - Axios interceptor маппит HTTP-ошибки в пользовательские сообщения.
  - Сетевые ошибки: «Ошибка подключения. Проверьте интернет и попробуйте снова.»
  - 400: «Некорректный запрос. Проверьте введённые данные.»
  - 502/504: «Сервис временно недоступен. Попробуйте через некоторое время.»
  - 5xx: «Что-то пошло не так. Попробуйте снова.»
  - Каждая страница обрабатывает ошибки инлайн (без глобального error boundary для MVP).

## Граничные случаи и поведение

- **Нет доступных номеров:** RoomsPage показывает пустое состояние с предложением сменить даты. Включает `available == 0` и `maxGuests < adults`.
- **Фильтрация по гостям:** Bnovo `/rooms` не принимает количество гостей; бэкенд возвращает все номера. Фронтенд фильтрует `maxGuests >= searchParams.adults` на клиенте.
- **ID номера — строка:** Все определения типов и сравнения используют `string`.
- **Валидация дат:** Дата выезда должна быть после заезда; бэкенд валидирует формат `DD-MM-YYYY` перед передачей в Bnovo.
- **Большой ответ Bnovo (~1,5 МБ):** Бэкенд кэширует in-memory (TTL 5 мин, ключ: `dfrom+dto`). Фронтенд обрабатывает только номера с `available > 0`.
- **Сортировка фото:** Всегда сортировать `photos` по `order` перед отображением.
- **Отсутствующие данные номера:** Фолбэк `name_ru → name`, `description_ru → description`. Если оба пусты — «Без описания».
- **Один номер за бронирование:** MVP позволяет выбрать ровно 1 тип номера, количество 1.
- **Прямой доступ по URL:** Переход на `/rooms` или `/booking` без данных контекста → редирект на `/` (поиск).
- **Кнопка «Назад» браузера:** Работает естественно с React Router. Состояние контекста сохраняется при навигации назад внутри flow.

## Структура проекта

```
apart-nn-develop/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── context/
│   │   │   └── BookingContext.tsx
│   │   ├── pages/
│   │   │   ├── SearchPage.tsx
│   │   │   ├── RoomsPage.tsx
│   │   │   ├── BookingPage.tsx
│   │   │   └── ConfirmationPage.tsx
│   │   ├── components/
│   │   │   ├── DatePicker.tsx
│   │   │   ├── GuestCounter.tsx
│   │   │   ├── RoomCard.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── AmenityList.tsx
│   │   │   ├── PlanSelector.tsx
│   │   │   ├── GuestForm.tsx
│   │   │   ├── BookingSummary.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── rooms.ts
│   │   │   ├── plans.ts
│   │   │   ├── amenities.ts
│   │   │   ├── account.ts
│   │   │   └── booking.ts
│   │   ├── services/
│   │   │   └── bnovoClient.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

## Критерии приёмки

- Форма поиска принимает даты заезда/выезда и количество гостей; возвращает доступные номера из Bnovo через бэкенд-прокси.
- Каталог номеров отображает карточки с фото (отсортированы по order), названием, площадью, удобствами, селектором тарифа, итоговой ценой и количеством доступных.
- Показываются только номера с `available > 0`.
- Форма гостя валидирует обязательные поля (имя, фамилия, телефон, email) и формат российского телефона на клиенте.
- POST `/api/booking` логирует полный payload на сервере и возвращает `{ success: true, message: "Request accepted" }`.
- Страница-заглушка «Запрос принят» показывается после успешной отправки формы.
- Виджет корректно загружается внутри `<iframe>` с авто-высотой через `postMessage` (без двойного скролла).
- Все идентификаторы Bnovo (UID, account_id) только на сервере, не присутствуют в бандле фронтенда или сетевых запросах, видимых пользователю.
- Бэкенд-прокси корректно пересылает GET-запросы в Bnovo и возвращает валидный JSON фронтенду.
- Прямой переход на `/rooms` или `/booking` без предварительного поиска → редирект на `/`.

## Риски и митигация

| # | Риск | Вероятность | Митигация |
|---|------|------------|-----------|
| 1 | CORS на публичном API Bnovo | Высокая | Все запросы через бэкенд-прокси (заложено в архитектуре) |
| 2 | Bnovo изменит формат ответов API | Средняя | Слой маппинга в `bnovoClient.ts` изолирует изменения; мониторим и обновляем быстро |
| 3 | Большой ответ /rooms (~1,5 МБ) | — | In-memory кэш 5 мин на бэкенде; фильтрация `available > 0` на фронте |
| 4 | Недоступность/медленность API Bnovo | Низкая | Таймаут 10 сек; пользовательская ошибка с кнопкой повтора |

## Будущие улучшения (после MVP)

| # | Задача | Приоритет |
|---|--------|----------|
| 1 | Реальное бронирование через POST на reservationsteps.ru | Высокий |
| 2 | Редирект на оплату payment.bnovo.ru | Высокий |
| 3 | Адаптивная вёрстка (мобильные) | Высокий |
| 4 | Кастомная логика ценообразования (обработка данных Bnovo) | Высокий |
| 5 | Админ-панель (настройки виджета, цвета, тексты) | Высокий |
| 6 | Промокоды | Средний |
| 7 | Дополнительные услуги (питание, парковка) | Средний |
| 8 | Минимальные цены / закрытые даты в календаре | Средний |
| 9 | Журнал бронирований / мониторинг | Средний |
| 10 | Скрипт-лоадер (loader.js) с авто-высотой iframe | Низкий |
| 11 | Мультиязычная поддержка | Низкий |

## Ключевые идентификаторы (справка)

| Параметр | Значение |
|----------|---------|
| UID | `d0ce239f-df14-4aa8-8ccf-83036c8cbb01` |
| account_id | `22720` |
| Название отеля | Апарт-отель — 9 Ночей Нижний Новгород |
| Сайт | apart-nn.ru |
| Домен виджета | widget.apart-nn.ru |
| Публичный API | `public-api.reservationsteps.ru/v1/api/` |
| POST бронирования (будущее) | `reservationsteps.ru/bookings/post/{uid}` |
| Оплата (будущее) | `payment.bnovo.ru/v2/?transaction=book_{HASH}` |

## Декомпозиция подзадач

- [ ] stt-000 | Code Implementer | исследование / Изучение API Bnovo — curl эндпоинтов, сохранение fixtures, создание .env, документирование структуры данных
      Выполнить curl ко всем 5 эндпоинтам публичного API Bnovo (`/rooms`, `/roomtypes`, `/plans`, `/amenities`, `/accounts`) с реальными `account_id=22720` и `uid=d0ce239f-df14-4aa8-8ccf-83036c8cbb01`. Сохранить сырые JSON-ответы как `fixtures/bnovo-rooms.json`, `fixtures/bnovo-roomtypes.json`, `fixtures/bnovo-plans.json`, `fixtures/bnovo-amenities.json`, `fixtures/bnovo-accounts.json`. Создать `backend/.env` (gitignored) с реальными `BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE`, `PORT`. Задокументировать реальную структуру полей в `fixtures/README.md`: какой эндпоинт содержит фото, описания, удобства, цены, доступность; как типы номеров связаны с номерами; как тарифные планы привязаны к ценам. Определить, содержит ли `/rooms` все данные или нужна склейка `/rooms` + `/roomtypes`. **Обновить план** (разделы Data & API, Key Data Mapping, Backend API), если реальные данные отличаются от текущих предположений.
      **Пост-шаг:** После выполнения задачи проверить и обновить stt-002 (архитектура бэкенд-прокси — маршруты, логика склейки, стратегия кэширования) и stt-004 (типы фронтенда и маппинг данных) на основе реальных данных API. Если фактическая структура данных отличается от предположений — обновить описания и критерии приёмки этих подзадач до их начала.
      **Приёмка:** Все 5 файлов fixtures сохранены с реальными данными API. `backend/.env` создан и работает. `fixtures/README.md` документирует структуру данных и отвечает на вопросы: (1) нужна ли склейка `/rooms` + `/roomtypes`? (2) откуда берётся `totalPrice`? (3) нужен ли отдельный эндпоинт `/amenities`? План обновлён при необходимости. stt-002 и stt-004 проверены и обновлены, если реальные данные отличаются от текущих предположений.

- [ ] stt-001 | Code Implementer | инфра / Инициализация проекта — monorepo frontend + backend, конфиг окружения, тулинг
      Настроить `frontend/` (Vite + React 18 + TypeScript + Tailwind CSS + React Router v6 + Axios) и `backend/` (Node.js 18 + Express + TypeScript + Axios + dotenv + cors). Создать `.env.example` со всеми переменными из раздела Config & Env. Настроить `tsconfig.json` для обоих пакетов. Настроить Vite dev proxy (`/api` → `http://localhost:3000`). Добавить скрипты `dev` для обоих пакетов. Проверить, что оба запускаются и фронтенд проксирует на бэкенд.
      **Приёмка:** `npm run dev` запускает оба сервера; `GET http://localhost:5173/api/account` проксируется на бэкенд (может вернуть ошибку, если Bnovo ещё не подключён, но сам прокси работает).

- [ ] stt-002 | Code Implementer | фича / Бэкенд-прокси Bnovo — bnovoClient + 4 GET-маршрута + кэширование
      Реализовать `bnovoClient.ts`, читающий `BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE` из env. Создать 4 прокси-маршрута: `GET /api/rooms?dfrom&dto`, `GET /api/plans`, `GET /api/amenities`, `GET /api/account`. Добавить валидацию `dfrom`/`dto` (формат DD-MM-YYYY). Реализовать in-memory кэш для `/rooms` (TTL 5 мин, ключ: dfrom+dto). Добавить middleware обработки ошибок со структурированными JSON-ответами. Добавить таймаут 10 сек на запросы к Bnovo.
      **Приёмка:** `curl http://localhost:3000/api/rooms?dfrom=01-03-2026&dto=03-03-2026` возвращает данные номеров Bnovo. Невалидные даты возвращают 400. Повторный идентичный запрос обслуживается из кэша.

- [ ] stt-003 | Code Implementer | фича / Заглушка бронирования — POST /api/booking с валидацией и логированием
      Реализовать `POST /api/booking`, принимающий тело BookingRequest. Валидировать все обязательные поля (даты, planId, adults, roomTypeId, guest name/surname/phone/email). Валидация телефона: формат `+7XXXXXXXXXX` (12 символов, начинается с `+7`). Логировать полный payload с таймстампом в консоль. Возвращать `{ success: true, message: "Request accepted" }`. Невалидные данные → 400 с ошибками по полям.
      **Приёмка:** Валидный POST возвращает 200 + success JSON; payload появляется в консоли сервера. Отсутствующий `guest.phone` возвращает 400 с сообщением об ошибке.

- [ ] stt-004 | Code Implementer | фича / Основа фронтенда — типы, API-клиент, BookingContext, оболочка роутинга
      Создать TypeScript типы (`types/index.ts`) по разделу Types. Реализовать Axios-клиент (`api/client.ts`) с `VITE_API_BASE_URL`, настройками JSON, error interceptor. Создать `BookingContext` с состоянием и действиями по разделу State Management. Настроить React Router с 4 маршрутами и заглушками страниц. Добавить логику редиректа: `/rooms` и `/booking` перенаправляют на `/`, если в контексте нет данных.
      **Приёмка:** Приложение рендерит SearchPage по `/`. Переход на `/rooms` без поиска → редирект на `/`. Axios-клиент настроен и доступен для импорта.

- [ ] stt-005 | Code Implementer | фича / Фронтенд Шаг 1 — SearchPage с DatePicker, GuestCounter, поисковый запрос
      Собрать SearchPage с DatePicker (заезд/выезд через react-datepicker или нативные инпуты), GuestCounter (кнопки +/-, мин. 1, макс. 10, по умолчанию 2) и кнопкой «Искать». По поиску: вызов `GET /api/rooms`, сохранение результатов в BookingContext, переход на `/rooms`. Обработка загрузки (спиннер на кнопке, заблокированная форма) и ошибки (инлайн-сообщение с повтором). Валидация: выезд > заезд.
      **Приёмка:** Пользователь выбирает даты + гостей, нажимает «Искать», видит спиннер загрузки, затем переходит на страницу номеров с данными в контексте. Ошибка API Bnovo показывает инлайн-сообщение об ошибке.

- [ ] stt-006 | Code Implementer | фича / Фронтенд Шаг 2 — RoomsPage с RoomCard, PhotoGallery, AmenityList, PlanSelector
      Собрать RoomsPage, отображающий карточки номеров из контекста. Каждая RoomCard: PhotoGallery (отсортирована по `order`, навигация назад/вперёд), название номера, площадь, макс. гостей, AmenityList (иконки с тултипами), PlanSelector (выпадающий список, если несколько планов), итоговая цена за период, количество доступных, кнопка «Забронировать». Фильтрация: `available > 0` **и** `maxGuests >= searchParams.adults` (клиентская фильтрация по вместимости), сортировка по цене по возрастанию. Заголовок с итогами поиска. Ссылка «Назад к поиску». Пустое состояние, если нет доступных номеров.
      **Приёмка:** Страница номеров показывает отфильтрованные/отсортированные карточки (только номера, подходящие по вместимости). Фото-галерея переключает фото. Селектор тарифа меняет отображаемую цену. «Забронировать» сохраняет выбор и переходит на `/booking`.

- [ ] stt-007 | Code Implementer | фича / Фронтенд Шаги 3-4 — BookingPage + ConfirmationPage
      Собрать BookingPage: GuestForm (имя, фамилия, телефон с маской `+7`, email, примечания) с клиентской валидацией (по blur + при отправке), BookingSummary сайдбар (фото номера, название, даты, гости, план, итоговая цена), чекбокс согласия, кнопка «Забронировать» (неактивна до валидной формы). Маска телефона форсирует `+7(___) ___-__-__`; перед отправкой форматирование снимается до `+7XXXXXXXXXX`. При отправке — POST на `/api/booking`. При успехе — переход на `/confirmation`. Собрать ConfirmationPage: иконка успеха, заголовок «Запрос принят!», сводка, кнопка «Назад к поиску» (сбрасывает контекст). Обработка ошибок POST инлайн.
      **Приёмка:** Форма валидирует обязательные поля и формат телефона `+7`. Валидная отправка показывает страницу подтверждения. Невалидные поля показывают ошибки под инпутами. «Назад к поиску» сбрасывает состояние.

- [ ] stt-008 | Code Implementer | фича / Стилизация, полировка и интеграция iframe — Tailwind тема, postMessage авто-высота, тест в iframe
      Применить единообразную Tailwind-стилизацию ко всем страницам в эстетике виджета Bnovo (чистый, белый фон, синие акценты). Добавить переиспользуемые компоненты LoadingSpinner и ErrorMessage. Реализовать авто-высоту через `postMessage`: виджет отправляет `window.parent.postMessage({ type: 'resize', height: document.body.scrollHeight })` при смене маршрута и обновлении контента; предоставить минимальный inline-скрипт для хост-страницы, слушающий сообщение и подстраивающий высоту iframe. Протестировать виджет внутри iframe на тестовой HTML-странице (со скриптом авто-высоты). Проверить отсутствие двойного скролла, корректные размеры. Добавить базовые переходы между страницами.
      **Приёмка:** Виджет выглядит аккуратно и единообразно. Корректно загружается внутри `<iframe>` с авто-подстройкой высоты. Нет двойного скролла. Пример скрипта для хост-страницы предоставлен.

- [ ] stt-009 | Test Writer | оценка / Интеграционная проверка — полный flow + iframe + граничные случаи
      Проверить полный пользовательский flow: поиск → каталог номеров → форма гостя → подтверждение. Тест с реальными данными Bnovo API через бэкенд-прокси. Тест граничных случаев: нет доступных номеров, невалидные даты, пустые поля гостя, прямой доступ по URL без контекста. Тест встраивания в iframe. Проверить работу кэширования бэкенда (повторный запрос быстрее). Проверить отсутствие идентификаторов Bnovo в бандле фронтенда.
      **Приёмка:** Полный flow работает end-to-end. Граничные случаи обрабатываются корректно. Виджет работает в iframe. Нет утечки учётных данных на клиент.
