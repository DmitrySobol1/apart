---
description: Frontend component hierarchy, state management, routing, and styling reference for the booking widget and admin panel
status: current
version: 3.0.0
---

# Frontend Guide — Apart-NN

This document covers two separate frontend applications:
- [Booking Widget (`frontend/`)](#booking-widget)
- [Admin Panel (`admin/`)](#admin-panel)

---

## Booking Widget

### Component Hierarchy and Page Flow

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
| `/booking` | `BookingPage` | 3 — Fill guest form and submit booking |
| `/confirmation` | `ConfirmationPage` | 4 — Payment redirect screen |

---

### BookingContext — State Management

File: `src/context/BookingContext.tsx`

All booking state lives in a single React context. Pages read from and write to context via the `useBooking()` hook.

**State shape:**
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

**Actions:**

| Action | Signature | Called by |
|---|---|---|
| `setSearchParams` | `(params: SearchParams) => void` | SearchPage after successful search |
| `setRooms` | `(rooms: Room[]) => void` | SearchPage after successful search |
| `selectRoom` | `(room: Room) => void` | RoomCard "Book" button |
| `selectPlan` | `(plan: RoomPlan) => void` | RoomCard "Book" button |
| `setGuest` | `(guest: GuestData) => void` | BookingPage after successful POST |
| `reset` | `() => void` | Called on full flow restart |

`reset()` sets all state back to the initial `null` state and navigates to `/`.

```typescript
import { useBooking } from "../context/BookingContext";

function MyComponent() {
  const { searchParams, rooms, selectRoom, reset } = useBooking();
}
```

`useBooking()` throws if called outside `<BookingProvider>`.

---

### Route Guards and Navigation Logic

File: `src/App.tsx`

**GuardedRoute:**
```typescript
function GuardedRoute({ children }: { children: JSX.Element }) {
  const { searchParams } = useBooking();
  if (!searchParams) return <Navigate to="/" replace />;
  return children;
}
```

Guards `/rooms` and `/booking`. If `searchParams` is `null`, the user is redirected to `/`.

`/confirmation` is not guarded — direct navigation to `/confirmation` without Router state (no `paymentUrl`) triggers an immediate redirect to `/` inside the component itself.

**Navigation flow:**
```
/ (SearchPage)
  → on search success: navigate("/rooms")

/rooms (RoomsPage)
  → on "Book" click: navigate("/booking")
  → "← Изменить параметры" link: navigate("/")

/booking (BookingPage)
  → on POST success: navigate("/confirmation", { state: { paymentUrl, bookingNumber, amount } })
  → on POST error: stay on page, show error + "Повторить" button
  → "← Назад к номерам" link: navigate("/rooms")

/confirmation (ConfirmationPage)
  → if no paymentUrl in state: navigate("/", { replace: true })
  → after 500ms: window.top.location.href = paymentUrl
```

---

### API Client (Booking Widget)

File: `src/api/client.ts`

Axios instance configured with:
- `baseURL`: `import.meta.env.VITE_API_BASE_URL ?? "/api"`
- `Content-Type: application/json` header

**Response error interceptor** maps HTTP errors to user-friendly `Error` objects:

| Condition | Error message |
|---|---|
| No `error.response` (network error) | `"Connection error. Check your internet and try again."` |
| 400 | `"Invalid request. Please check your input."` |
| 502 or 504 | `"Service temporarily unavailable. Please try again in a moment."` |
| 500+ | `"Something went wrong. Please try again."` |

---

### TypeScript Types (Booking Widget)

File: `src/types/index.ts`

```typescript
interface BookingResponse {
  success: boolean;
  message?: string;
  bookingNumber?: string;
  paymentUrl?: string;
  amount?: number;
}

interface BookingRequest {
  dfrom: string;
  dto: string;
  planId: number;
  adults: number;
  roomTypeId: string;
  guest: GuestData;
}

interface GuestData {
  name: string;
  surname: string;
  phone: string;
  email: string;
  notes: string;
}

interface SearchParams {
  dfrom: string;
  dto: string;
  adults: number;
}
```

`BookingResponse` was updated in task-3 to include `bookingNumber?`, `paymentUrl?`, and `amount?`. Previously it only had `success` and `message?`.

---

### Pages

**SearchPage** (`src/pages/SearchPage.tsx`)
- On mount: fetches hotel name from `GET /api/account`, displays as `<h1>`.
- User selects dates (default: today/tomorrow) and guest count (default: 2).
- On search: converts ISO dates to DD-MM-YYYY → `GET /api/rooms` → stores `searchParams` + `rooms` in context → navigate to `/rooms`.

**RoomsPage** (`src/pages/RoomsPage.tsx`)
- On mount: fetches amenity definitions from `GET /api/amenities`, flattens them by ID.
- Filters rooms: `available > 0 && adults >= searchParams.adults`. Sorts by minimum plan price ascending.
- Each room rendered as `<RoomCard>`.

**BookingPage** (`src/pages/BookingPage.tsx`)
- 2-column layout: `<GuestForm>` + agreement checkbox + submit button on the left; `<BookingSummary>` on the right.
- Submit enabled only when `formValid && agreed && !loading`.
- **Double-submit guard:** `submittingRef` (`useRef<boolean>`) is checked synchronously at the top of `handleSubmit` before any state update. Set to `true` immediately on click, reset in `finally`. Also sets `loading: true` to disable the button visually.
- **On submit success:** calls `setGuest(guestData)`, then `navigate('/confirmation', { state: { paymentUrl, bookingNumber, amount } })`.
- **On error** (network error or `success: false` in response): sets `error` state — displays `<ErrorMessage>` and a "Повторить" button. The user stays on the same page without re-entering data.

**ConfirmationPage** (`src/pages/ConfirmationPage.tsx`)
- Reads `paymentUrl`, `bookingNumber`, `amount` from `useLocation().state`.
- If no `paymentUrl`: immediately navigates to `/` with `replace: true` and renders `null`.
- Displays booking number (`Бронирование #...`) and formatted amount (`Сумма: X XXX руб.`) using `toLocaleString("ru-RU")`.
- Shows "Перенаправляем на оплату..." heading.
- `useEffect` with 500ms `setTimeout` calls `window.top!.location.href = paymentUrl`. Wrapped in `try/catch` — falls back to `window.location.href` if a cross-origin restriction blocks top-frame navigation.
- Displays a manual fallback link with `target="_top"`: "Перейти к оплате →".
- The 500ms delay allows React to render the page before the redirect fires.

---

### Components

**DatePicker** (`src/components/date-picker.tsx`)
Props: `checkIn: string`, `checkOut: string`, `onChange: (checkIn, checkOut) => void`, `disabled?: boolean`
Native `<input type="date">`. Auto-correction: if `checkIn >= checkOut`, `checkOut` is auto-set to `checkIn + 1 day`. Dates are ISO (`YYYY-MM-DD`) internally; conversion to `DD-MM-YYYY` happens in `SearchPage`.

**GuestCounter** (`src/components/guest-counter.tsx`)
Props: `value: number`, `onChange: (value: number) => void`, `disabled?: boolean`
Range: 1–10. +/- buttons disabled at the limits.

**PhotoGallery** (`src/components/photo-gallery.tsx`)
Props: `photos: RoomPhoto[]`
256×192 px container. Sorts photos by `order` field (immutable copy). Prev/next arrows on hover, circular navigation, dot indicators. Empty state: grey placeholder.

**RoomCard** (`src/components/room-card.tsx`)
Props: `room: Room`, `amenityDefs: Record<string, Amenity>`
Horizontal card: `<PhotoGallery>` left, room info right. Includes name, max guests, availability, `<AmenityList>`, `<PlanSelector>`, price, "Забронировать" button. On click: `selectRoom + selectPlan + navigate("/booking")`.

**AmenityList** (`src/components/amenity-list.tsx`)
Props: `amenityIds: Record<string, { value: string }>`, `definitions: Record<string, Amenity>`
Resolves amenity IDs against definitions. Amenity ID `"1"` (area) renders as `"32 m²"`. Icons rendered as `<img>`.

**PlanSelector** (`src/components/plan-selector.tsx`)
Props: `plans: Record<string, RoomPlan>`, `selectedPlanId: string`, `onChange: (planId: string) => void`
`<select>` with one `<option>` per plan. Label: `plan.name_ru ?? plan.name`.

**GuestForm** (`src/components/guest-form.tsx`)
Props: `onValidChange: (valid: boolean, data: GuestData | null) => void`, `disabled?: boolean`
Fields: name, surname, phone, email, notes (optional). Phone formatted as `+7(XXX) XXX-XX-XX` during input, stripped to `+7XXXXXXXXXX` before passing to callback. Errors shown on blur. `onValidChange(true, data)` when all fields valid.

**BookingSummary** (`src/components/booking-summary.tsx`)
Props: `room: Room`, `plan: RoomPlan`, `searchParams: SearchParams`
Sidebar: room photo, name, dates, guest count, plan name, total price.

**LoadingSpinner** (`src/components/loading-spinner.tsx`)
Props: `size?: "sm" | "md"`. Animated SVG spinner.

**ErrorMessage** (`src/components/error-message.tsx`)
Props: `message: string`, `onRetry?: () => void`. Error text block with optional retry link.

---

### Styling

Framework: Tailwind CSS v3.

Color palette:
- Primary: `blue-600` / `blue-700` (buttons, links)
- Background: `gray-50` (page), `white` (cards)
- Text: `gray-900` (headings), `gray-700` (labels), `gray-600` (secondary)
- Error: `red-400` / `red-500`

Page transitions: `PageWrapper` applies the `page-enter` CSS class on each route change via `key={location.pathname}`.

Desktop-only layout for MVP. No responsive breakpoints.

---

### iframe Auto-Height Hook

Defined in `src/App.tsx` as `useIframeResize()`. Observes `#root` (not `document.body`) to avoid a feedback loop inside iframes where `body.scrollHeight === iframe height`.

```typescript
function useIframeResize() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    const sendHeight = () => {
      window.parent.postMessage({ type: "resize", height: root.scrollHeight }, "*");
    };
    const observer = new ResizeObserver(sendHeight);
    observer.observe(root);
    sendHeight();
    return () => observer.disconnect();
  }, []);
}
```

`PageWrapper` fires additional messages on every route change (resize + `scrollToWidget`).

**Iframe detection** (`src/main.tsx`):
```tsx
if (window.self !== window.top) {
  document.body.classList.add("in-iframe");
}
```
`in-iframe` class activates `overflow: hidden` (in `index.css`), preventing double scrollbars.

**Page height:** No page uses `min-h-screen` — `100vh` inside an iframe equals the iframe height, which would prevent the iframe from shrinking.

**Payment redirect and iframe:** When `ConfirmationPage` redirects to the payment URL, it uses `window.top.location.href` to break out of the iframe. This is required because Alfa-Bank payment cookies use `SameSite=Lax`, which does not work inside an iframe. The top-frame navigation replaces the whole parent page, not just the iframe.

---

## Admin Panel

File locations: `admin/src/`

### App Structure

```
App (admin/src/App.tsx)
└── ThemeProvider (MUI default theme)
    └── BrowserRouter
        ├── Navbar
        └── Routes
            ├── /          → CoefficientsPage
            └── /settings  → SettingsPage ("Coming soon" placeholder)
```

Entry point: `admin/src/main.tsx`. Dev server on port 5174. The Vite dev proxy forwards all `/api/*` requests to `http://localhost:3000`.

---

### Navbar (`admin/src/components/Navbar.tsx`)

MUI `AppBar` with a `Toolbar` containing the app title and a `Tabs` component. Tab routes:

| Tab label | Path |
|---|---|
| Коэффициенты | `/` |
| Настройки | `/settings` |

Tab navigation uses `useNavigate`. Active tab is resolved from `useLocation().pathname` with a fallback to tab 0 for unknown paths.

---

### CoefficientsPage (`admin/src/pages/CoefficientsPage.tsx`)

The main admin view. Displays all rooms in an editable MUI table with auto-save on blur.

**State:**

| State | Type | Description |
|---|---|---|
| `coefficients` | `Coefficient[]` | Loaded data, sorted by `roomName` (`ru` locale) |
| `tableState` | `TableState` | Per-cell edit state (value, status, error) |
| `loading` | `boolean` | Initial load in progress |
| `loadError` | `boolean` | Initial load failed |
| `snackbar` | `{ open, message }` | Error notification |

`TableState = Record<string, RowState>` — keyed by `bnovoId` (string).
`RowState = Record<CoefKey, CellState>` — one entry per coefficient column.
`CellState = { value: string; status: 'idle' | 'success' | 'error'; error: string }`.

**Data load:**
- On mount, `getCoefficients()` is called.
- Data is sorted by `roomName` with `localeCompare('ru')`.
- On error, a "Повторить" button re-triggers the load.
- Loading state shows MUI `Skeleton` rows.

**Edit and auto-save:**
- Each coefficient cell renders a MUI `TextField` (size="small", width 80px).
- `handleChange` updates the cell value in `tableState` without saving.
- `handleBlur` fires on field blur:
  1. If value unchanged (compared to last saved value), no API call is made.
  2. `parseValue()` validates: strips whitespace, normalizes comma to dot, rejects non-positive values.
  3. If invalid: sets `cell.error = 'Введите положительное число'`, no API call.
  4. If valid: calls `patchCoefficient(bnovoId, { [key]: num })`.
  5. On success: updates `coefficients` state, sets `cell.status = 'success'`, clears after 1.5s.
  6. On error: sets `cell.status = 'error'`, opens Snackbar, clears after 1.5s.

**Cell background:**
- `success` → `rgba(76, 175, 80, 0.2)` (green tint)
- `error` → `rgba(244, 67, 54, 0.2)` (red tint)
- `idle` → no background

**Table columns:** Room name (read-only) | Коэф. 1 | Коэф. 2 | Коэф. 3

**Snackbar:** Appears at the bottom-center of the screen on save error. Auto-hides after 4 seconds.

---

### API Client (Admin Panel)

File: `admin/src/api/client.ts`

Axios instance with `baseURL: '/api/admin'`. The Vite proxy routes this to `http://localhost:3000/api/admin`.

```typescript
export const getRooms = (): Promise<Room[]> =>
  api.get<{ data: Room[] }>('/rooms').then((r) => r.data.data);

export const getCoefficients = (): Promise<Coefficient[]> =>
  api.get<{ data: Coefficient[] }>('/coefficients').then((r) => r.data.data);

export const patchCoefficient = (
  bnovoId: string,
  data: Partial<Pick<Coefficient, 'coefficient1' | 'coefficient2' | 'coefficient3'>>,
): Promise<Coefficient> =>
  api.patch<{ data: Coefficient }>(`/coefficients/${bnovoId}`, data).then((r) => r.data.data);
```

All three functions unwrap the `{ data: ... }` response envelope. The generic parameter reflects the actual envelope shape (`{ data: T }`), and `.then(r => r.data.data)` extracts the payload.

---

### Admin TypeScript Types

File: `admin/src/types/index.ts`

```typescript
export interface Room {
  bnovoId: string;
  name: string;
}

export interface Coefficient {
  bnovoId: string;
  roomName: string;
  coefficient1: number;
  coefficient2: number;
  coefficient3: number;
  updatedAt: string;
}
```

`bnovoId` is `string` in both interfaces — matching the Mongoose schema (`type: String`) and the Bnovo API's string room IDs.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Виджет бронирования

4 страницы: SearchPage → RoomsPage → BookingPage → ConfirmationPage. Навигация через React Router v6. Страницы `/rooms` и `/booking` защищены `GuardedRoute` (редирект на `/` при `searchParams === null`). `/confirmation` без guard — при отсутствии `paymentUrl` в Router state редирект на `/` изнутри компонента.

**BookingContext:** глобальное состояние — `searchParams`, `rooms`, `selectedRoom`, `selectedPlan`, `guest`. Все изначально `null`. `reset()` обнуляет и переходит на `/`.

**Тип BookingResponse (обновлён в task-3):** `{ success: boolean; message?: string; bookingNumber?: string; paymentUrl?: string; amount?: number }`. Ранее содержал только `success` и `message?`.

**BookingPage (task-3):**
- Защита от двойной отправки: `submittingRef` (`useRef<boolean>`) проверяется синхронно в начале `handleSubmit`, сбрасывается в `finally`. Плюс `loading` state для визуальной блокировки кнопки.
- При успехе: `setGuest(guestData)` → `navigate('/confirmation', { state: { paymentUrl, bookingNumber, amount } })`.
- При ошибке (`success: false` или сетевая ошибка): показывает сообщение + кнопку «Повторить», пользователь остаётся на странице.

**ConfirmationPage (task-3, перепрофилирован):**
- Читает `paymentUrl`, `bookingNumber`, `amount` из Router state.
- Если `paymentUrl` отсутствует: `navigate('/', { replace: true })`, рендерит `null`.
- Отображает `Бронирование #{bookingNumber}` и `Сумма: {amount} руб.` (`toLocaleString("ru-RU")`).
- Показывает «Перенаправляем на оплату...».
- `useEffect` с setTimeout 500мс вызывает `window.top!.location.href = paymentUrl`, обёрнутый в `try/catch` (fallback на `window.location.href`).
- Резервная ссылка с `target="_top"`: «Перейти к оплате →».

**API-клиент виджета:** Axios с базовым URL `/api`. Интерцептор ошибок: нет сети → понятное сообщение; 400 → «Invalid request»; 502/504 → «Service temporarily unavailable»; 5xx → «Something went wrong».

**Стилизация:** Tailwind CSS v3, только десктоп, переходы через класс `page-enter`.

**Авторесайз iframe:** хук `useIframeResize` следит за `#root` (не `body`) через `ResizeObserver`, отправляет `postMessage({ type: "resize", height })`. `main.tsx` добавляет `in-iframe` к `<body>` при `window.self !== window.top`, активируя `overflow: hidden`.

**Редирект на оплату и iframe:** `window.top.location.href` используется для выхода из iframe на верхний фрейм — это обязательно, так как cookies Альфа-Банка используют `SameSite=Lax`.

## Панель администратора

Отдельное React-приложение в `admin/`. Порт 5174. Vite-прокси: `/api/*` → `localhost:3000`.

**Структура:** `App` → `ThemeProvider` (MUI) → `BrowserRouter` → `Navbar` + `Routes`. Маршруты: `/` → `CoefficientsPage`, `/settings` → заглушка.

**Navbar:** MUI `AppBar` с вкладками «Коэффициенты» и «Настройки». Навигация через `useNavigate`.

**CoefficientsPage:** загружает коэффициенты при монтировании (`getCoefficients()`), сортирует по `roomName` (ru). Отображает редактируемую таблицу MUI. При потере фокуса (`onBlur`): проверяет изменение → валидирует → отправляет `PATCH /api/admin/coefficients/:bnovoId`. Успех → зелёная подсветка на 1.5с. Ошибка → красная подсветка + Snackbar.

**API-клиент панели:** Axios с baseURL `/api/admin`. Все функции распаковывают обёртку `{ data: T }` через `r.data.data`. `bnovoId` везде `string`.
