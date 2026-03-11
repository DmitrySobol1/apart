---
description: Frontend component hierarchy, state management, routing, and styling reference
status: current
version: 1.0.0
---

# Frontend Guide — Apart-NN Booking Widget

## Component Hierarchy and Page Flow

```
App
├── BrowserRouter
│   └── BookingProvider (BookingContext)
│       └── AppRoutes
│           └── PageWrapper (useIframeResize, page-enter class)
│               └── Routes
│                   ├── /                → SearchPage
│                   ├── /rooms           → GuardedRoute → RoomsPage
│                   ├── /booking         → GuardedRoute → BookingPage
│                   └── /confirmation    → ConfirmationPage
```

Pages map directly to the 4-step booking flow:

| Route | Page | Step |
|---|---|---|
| `/` | `SearchPage` | 1 — Enter dates and guest count |
| `/rooms` | `RoomsPage` | 2 — Browse available rooms |
| `/booking` | `BookingPage` | 3 — Fill guest form |
| `/confirmation` | `ConfirmationPage` | 4 — Success screen |

---

## BookingContext — State Management

File: `src/context/BookingContext.tsx`

All booking state lives in a single React context. Pages read from and write to context via the `useBooking()` hook.

### State Shape

```typescript
interface BookingState {
  searchParams: SearchParams | null;   // { dfrom, dto, adults } in DD-MM-YYYY
  rooms: Room[] | null;                // rooms returned from /api/rooms
  selectedRoom: Room | null;           // room chosen on RoomsPage
  selectedPlan: RoomPlan | null;       // plan chosen on RoomsPage
  guest: GuestData | null;             // guest data after successful POST /api/booking
}
```

Initial state: all fields are `null`.

### Actions

| Action | Signature | Called by |
|---|---|---|
| `setSearchParams` | `(params: SearchParams) => void` | SearchPage after successful search |
| `setRooms` | `(rooms: Room[]) => void` | SearchPage after successful search |
| `selectRoom` | `(room: Room) => void` | RoomCard "Book" button |
| `selectPlan` | `(plan: RoomPlan) => void` | RoomCard "Book" button |
| `setGuest` | `(guest: GuestData) => void` | BookingPage after successful POST |
| `reset` | `() => void` | ConfirmationPage "Back to search" |

`reset()` sets all state back to the initial `null` state and navigates to `/`.

### Usage

```typescript
import { useBooking } from "../context/BookingContext";

function MyComponent() {
  const { searchParams, rooms, selectRoom, reset } = useBooking();
  // ...
}
```

`useBooking()` throws if called outside `<BookingProvider>`.

---

## Route Guards and Navigation Logic

File: `src/App.tsx`

### GuardedRoute

```typescript
function GuardedRoute({ children }: { children: JSX.Element }) {
  const { searchParams } = useBooking();
  if (!searchParams) return <Navigate to="/" replace />;
  return children;
}
```

Guards `/rooms` and `/booking`. If `searchParams` is `null` (user navigates directly by URL without searching), they are redirected to `/`.

`/confirmation` is not guarded. Direct navigation shows the confirmation page with conditional rendering (room/guest info only appears if context has values).

### Navigation Flow

```
/ (SearchPage)
  → on search success: navigate("/rooms")

/rooms (RoomsPage)
  → on "Book" click: navigate("/booking")
  → "← Изменить параметры" link: navigate("/")

/booking (BookingPage)
  → on POST success: navigate("/confirmation")
  → "← Назад к номерам" link: navigate("/rooms")

/confirmation (ConfirmationPage)
  → "Вернуться к поиску" button: reset() + navigate("/")
```

---

## API Client

File: `src/api/client.ts`

Axios instance configured with:
- `baseURL`: `import.meta.env.VITE_API_BASE_URL ?? "/api"` (falls back to `/api` for production)
- `Content-Type: application/json` header

**Response error interceptor** maps HTTP errors to user-friendly `Error` objects:

| Condition | Error message |
|---|---|
| No `error.response` (network error) | `"Connection error. Check your internet and try again."` |
| 400 | `"Invalid request. Please check your input."` |
| 502 or 504 | `"Service temporarily unavailable. Please try again in a moment."` |
| 500+ | `"Something went wrong. Please try again."` |

All pages catch errors as `err instanceof Error ? err.message : "..."` and display them inline via `<ErrorMessage>`.

---

## Pages

### SearchPage (`src/pages/SearchPage.tsx`)

**On mount:** Fetches hotel name from `GET /api/account` and displays it as `<h1>` if available. Errors are silently ignored.

**Local state:**
- `checkIn` — ISO date string, default: today
- `checkOut` — ISO date string, default: tomorrow
- `guests` — number, default: 2
- `loading` / `error`

**Search action:**
1. Converts ISO dates to DD-MM-YYYY via `toApiDate()`
2. `GET /api/rooms?dfrom=...&dto=...`
3. Stores `searchParams` + `rooms` in context
4. Navigates to `/rooms`

Form and button are disabled during loading. Error shows with a retry button.

---

### RoomsPage (`src/pages/RoomsPage.tsx`)

**On mount:** Fetches amenity definitions from `GET /api/amenities`. The response is flattened from two-level groups into a flat `Record<string, Amenity>` by `flattenAmenities()`. Errors are silently ignored (amenity display is non-critical).

**Room filtering and sorting:**
```typescript
const filtered = rooms
  .filter((r) => r.available > 0 && r.adults >= searchParams.adults)
  .sort((a, b) => getMinPrice(a) - getMinPrice(b));

function getMinPrice(room: Room): number {
  return Math.min(...Object.values(room.plans).map((p) => p.price));
}
```

**Empty state:** When no rooms match, shows a message with a "← Вернуться к поиску" link.

Each room is rendered as a `<RoomCard>` receiving `room` and `amenityDefs`.

---

### BookingPage (`src/pages/BookingPage.tsx`)

Layout: 2-column grid. Left column (2/3): `<GuestForm>` + agreement checkbox + submit button. Right column (1/3): `<BookingSummary>`.

Returns `null` immediately if `selectedRoom`, `selectedPlan`, or `searchParams` is null (GuardedRoute handles the redirect case; this is a safety guard for the rendering path).

**Submit button** is enabled only when `formValid && agreed && !loading`.

**POST payload:**
```typescript
{
  dfrom: searchParams.dfrom,
  dto: searchParams.dto,
  planId: selectedPlan.id,
  adults: searchParams.adults,
  roomTypeId: selectedRoom.id,
  guest: guestData   // from GuestForm (phone already stripped to +7XXXXXXXXXX)
}
```

---

### ConfirmationPage (`src/pages/ConfirmationPage.tsx`)

Reads `selectedRoom`, `searchParams`, and `guest` from context. All three are conditionally rendered — the page does not crash if they are null (e.g., on direct URL access).

The "Вернуться к поиску" button calls `reset()` then navigates to `/`.

---

## Components

### DatePicker (`src/components/date-picker.tsx`)

Props: `checkIn: string`, `checkOut: string`, `onChange: (checkIn, checkOut) => void`, `disabled?: boolean`

Uses native `<input type="date">`. Auto-correction: if `checkIn >= checkOut`, `checkOut` is auto-set to `checkIn + 1 day`. The `min` attribute is set on both inputs (`today` for check-in, `checkIn + 1 day` for check-out).

Dates are in ISO format (`YYYY-MM-DD`) internally; conversion to `DD-MM-YYYY` happens in `SearchPage`.

---

### GuestCounter (`src/components/guest-counter.tsx`)

Props: `value: number`, `onChange: (value: number) => void`, `disabled?: boolean`

Range: 1–10. Uses +/- buttons. Buttons are disabled at the limits.

---

### PhotoGallery (`src/components/photo-gallery.tsx`)

Props: `photos: RoomPhoto[]`

Renders a 256×192 px image container. Sorts photos by `order` field (immutable copy via `[...photos].sort()`). Shows prev/next arrows on hover when more than one photo. Navigation is circular. Dot indicators shown at the bottom.

Empty state: grey placeholder with "No photos" text.

---

### RoomCard (`src/components/room-card.tsx`)

Props: `room: Room`, `amenityDefs: Record<string, Amenity>`

Renders a horizontal card: `<PhotoGallery>` on the left, room info on the right. Room info includes: name (`name_ru`), max guests (`adults`), availability count, `<AmenityList>`, `<PlanSelector>`, price, and "Забронировать" button.

On "Забронировать": calls `selectRoom(room)` + `selectPlan(plan)` + `navigate("/booking")`.

Plan defaults to the first key in `room.plans`. Price updates when the selected plan changes.

---

### AmenityList (`src/components/amenity-list.tsx`)

Props: `amenityIds: Record<string, { value: string }>`, `definitions: Record<string, Amenity>`

Resolves each amenity ID against `definitions`. Amenity ID `"1"` (area) is rendered as `"32 m²"`. Boolean amenities render the name only. Icons are rendered as `<img>` from the `icon` URL.

---

### PlanSelector (`src/components/plan-selector.tsx`)

Props: `plans: Record<string, RoomPlan>`, `selectedPlanId: string`, `onChange: (planId: string) => void`

Renders a `<select>` with one `<option>` per plan. Option label: `plan.name_ru ?? plan.name`.

---

### GuestForm (`src/components/guest-form.tsx`)

Props: `onValidChange: (valid: boolean, data: GuestData | null) => void`, `disabled?: boolean`

Fields: name, surname, phone, email, notes (optional).

**Phone formatting:** As the user types, the phone field is formatted to `+7(XXX) XXX-XX-XX` display format in real time. Before passing to `onValidChange`, the value is stripped back to `+7XXXXXXXXXX` via `stripPhone()`.

**Validation rules:**
- `name`, `surname`: non-empty after trim
- `phone`: must match `/^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/` (display format)
- `email`: must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

Errors shown only on touched fields (on blur). `onValidChange` is called on every field change, passing `(true, guestData)` when all fields are valid, `(false, null)` otherwise.

---

### BookingSummary (`src/components/booking-summary.tsx`)

Props: `room: Room`, `plan: RoomPlan`, `searchParams: SearchParams`

Sidebar card showing: room photo (first by `order`), room name, check-in/out dates, guest count, plan name, and total price.

Note: uses `room.photos.sort()` (in-place mutation — known minor issue from audit).

---

### LoadingSpinner (`src/components/loading-spinner.tsx`)

Props: `size?: "sm" | "md"`. Renders an animated SVG spinner. Used inside buttons and page-level loading states.

---

### ErrorMessage (`src/components/error-message.tsx`)

Props: `message: string`, `onRetry?: () => void`. Renders an error text block. If `onRetry` is provided, a "Try again" link is shown.

---

## Styling

Framework: Tailwind CSS v3 with PostCSS and Autoprefixer.

Color palette used:
- Primary: `blue-600` / `blue-700` (buttons, links, focus rings)
- Background: `gray-50` (page background), `white` (cards)
- Text: `gray-900` (headings), `gray-700` (labels), `gray-600` (secondary), `gray-500` (muted)
- Error: `red-400` / `red-500`
- Success: `green-100` / `green-600` (confirmation checkmark)

Page transitions: `PageWrapper` applies the `page-enter` CSS class (defined in `src/index.css`) on each route change via the `key={location.pathname}` prop.

Desktop-only layout for MVP. No responsive breakpoints implemented.

---

## iframe Auto-Height Hook

Defined in `src/App.tsx` as `useIframeResize()`:

```typescript
function useIframeResize() {
  useEffect(() => {
    const sendHeight = () => {
      window.parent.postMessage(
        { type: "resize", height: document.body.scrollHeight },
        "*"
      );
    };
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    sendHeight();
    return () => observer.disconnect();
  }, []);
}
```

`PageWrapper` also fires a resize message on every route change:
```typescript
useEffect(() => {
  window.parent.postMessage({ type: "resize", height: document.body.scrollHeight }, "*");
}, [location.pathname]);
```

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Иерархия компонентов и поток страниц

Приложение состоит из 4 страниц: SearchPage (поиск), RoomsPage (каталог номеров), BookingPage (форма гостя), ConfirmationPage (подтверждение). Навигация через React Router v6. Страницы `/rooms` и `/booking` защищены `GuardedRoute` — редирект на `/` если `searchParams` = null.

## BookingContext

Глобальное состояние: `searchParams`, `rooms`, `selectedRoom`, `selectedPlan`, `guest`. Все поля — `null` в начале. Действия: `setSearchParams`, `setRooms`, `selectRoom`, `selectPlan`, `setGuest`, `reset`. Хук `useBooking()` возвращает состояние и действия.

## API-клиент

Axios с базовым URL `/api`. Интерцептор ответов преобразует HTTP-ошибки в понятные пользователю сообщения: нет сети → «Connection error», 400 → «Invalid request», 502/504 → «Service temporarily unavailable», 5xx → «Something went wrong».

## Ключевые компоненты

- **DatePicker:** нативный `<input type="date">`, автокоррекция если заезд ≥ выезд.
- **GuestCounter:** +/− кнопки, диапазон 1–10.
- **PhotoGallery:** слайдер с навигацией стрелками, сортировка по `order`.
- **GuestForm:** маска телефона `+7(XXX) XXX-XX-XX`, валидация по blur, отправляет `+7XXXXXXXXXX`.
- **RoomCard:** карточка с фотогалереей, удобствами, PlanSelector, ценой.
- **BookingSummary:** боковая сводка: фото, название, даты, гости, тариф, итого.

## Стилизация

Tailwind CSS v3. Цветовая схема: синий (primary), серый (фоны и текст). Только десктоп (MVP). CSS-класс `page-enter` добавляется на каждую страницу при переходе.

## Авторесайз iframe

Хук `useIframeResize` (ResizeObserver на body) и эффект на смене маршрута отправляют `postMessage({ type: "resize", height })` родительскому окну. Это устраняет двойной скролл внутри iframe.
