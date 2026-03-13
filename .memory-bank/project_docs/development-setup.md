---
description: Local development setup, environment variables, npm scripts, and testing instructions
status: current
version: 2.0.0
---

# Development Setup

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- MongoDB 6+ (local instance for development)
- Git

---

## Repository Structure

The project is a monorepo with three independent npm packages:

```
apart-nn-develop/
├── backend/     # Node.js + Express backend
├── frontend/    # React + Vite booking widget
└── admin/       # React + Vite + MUI admin panel
```

Each package has its own `package.json` and `node_modules`. There is no root-level package manager.

---

## Initial Setup

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd frontend && npm install

# Install admin panel dependencies
cd admin && npm install
```

---

## Environment Variables

The backend requires a `.env` file at `backend/.env`. Copy from the example:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with real values:

```env
BNOVO_UID=your-hotel-uid
BNOVO_ACCOUNT_ID=your-account-id
BNOVO_API_BASE=https://public-api.reservationsteps.ru/v1/api
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/apart-nn
ADMIN_URL=http://localhost:5174
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `BNOVO_UID` | Yes | — | Hotel UID for `/accounts` endpoint |
| `BNOVO_ACCOUNT_ID` | Yes | — | Account ID for `/rooms`, `/plans` endpoints |
| `BNOVO_API_BASE` | Yes | — | Bnovo API base URL (include `/v1/api`) |
| `PORT` | No | `3000` | Backend listen port |
| `NODE_ENV` | No | `development` | Node environment |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin for the booking widget |
| `MONGODB_URI` | No | `mongodb://localhost:27017/apart-nn` | MongoDB connection string |
| `ADMIN_URL` | No | — | Allowed CORS origin for the admin panel |

The backend validates all variables with Zod at startup and exits immediately if required ones are missing.

If MongoDB is unreachable at startup, the backend logs a warning and continues running — booking widget endpoints (which do not use MongoDB) remain available. Admin API endpoints return `503` until MongoDB is connected.

**Frontend variable (optional):**

```env
VITE_API_BASE_URL=http://localhost:3000
```

Only needed if the frontend is served separately from the Vite dev proxy. When using `npm run dev` in `frontend/`, the Vite proxy forwards `/api/*` to `http://localhost:3000` automatically.

The admin panel has no `.env` file — it always proxies `/api/*` to `http://localhost:3000` via its Vite config.

---

## Running Locally

Start MongoDB, then start the backend and both frontends in separate terminals.

**Terminal 1 — MongoDB (if not running as a service):**
```bash
mongod --dbpath /your/data/path
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run dev
```

Output: `Server running on http://localhost:3000`

Uses `tsx watch` for TypeScript execution with file watching.

**Terminal 3 — Booking Widget:**
```bash
cd frontend
npm run dev
```

Output: `VITE ... Local: http://localhost:5173/`

**Terminal 4 — Admin Panel:**
```bash
cd admin
npm run dev
```

Output: `VITE ... Local: http://localhost:5174/`

---

## Seeding the Database

The room sync script populates the `rooms` and `coefficients` collections by querying the Bnovo API across 10 date ranges.

```bash
cd backend
npm run seed:rooms
```

This runs `src/scripts/seed-rooms.ts` which calls `syncRooms()`. The script:
1. Queries Bnovo `/rooms` for 10 date ranges (offsets from today: +7, +14, +21, +30, +45, +60, +75, +90, +105, +120 days).
2. Waits 1–2 seconds between requests.
3. Upserts unique rooms into the `rooms` collection.
4. Creates `coefficients` documents (defaults: all `1`) for newly discovered rooms.

Re-running is safe — the sync is idempotent. Existing coefficient values are not overwritten.

Expected output:
```
[room-sync] Done. Total unique rooms: 12, new: 12, errors: 0
```

**Prerequisites:** MongoDB must be running and `BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE` must be set in `backend/.env`.

---

## Available npm Scripts

### Backend (`backend/package.json`)

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Start with file watching |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run compiled output |
| `test` | `vitest run` | Run all tests once |
| `lint` | `eslint src` | Run ESLint |
| `type-check` | `tsc --noEmit` | TypeScript type check without emit |
| `qc` | `npm run lint && npm run type-check` | Full quality check |
| `format` | `prettier --write src` | Format source files |
| `seed:rooms` | `tsx src/scripts/seed-rooms.ts` | Populate rooms + coefficients from Bnovo |

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start Vite dev server (port 5173) |
| `build` | `tsc && vite build` | Type-check then build to `dist/` |
| `preview` | `vite preview` | Serve the production build locally |
| `test:bundle` | `npm run build && node scripts/check-bundle-credentials.mjs` | Build and scan bundle for credential strings |
| `lint` | `eslint src` | Run ESLint |
| `type-check` | `tsc --noEmit` | TypeScript type check without emit |
| `qc` | `npm run lint && npm run type-check` | Full quality check |
| `format` | `prettier --write src` | Format source files |

### Admin Panel (`admin/package.json`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start Vite dev server (port 5174) |
| `build` | `tsc && vite build` | Type-check then build to `dist/` |
| `preview` | `vite preview` | Serve the production build locally |
| `type-check` | `tsc --noEmit` | TypeScript type check without emit |

---

## Testing

### Backend Tests

The test suite uses Vitest and Supertest. MongoDB integration tests use `mongodb-memory-server` — an in-process MongoDB instance. No real `.env` or external services required.

```bash
cd backend && npm test
```

Expected output (43 tests, 3 files):
```
Test Files  3 passed (3)
     Tests  43 passed (43)
```

**Test files:**

| File | Tests | Coverage |
|---|---|---|
| `api.test.ts` | 22 | Booking widget endpoints: GET rooms/plans/amenities/account, POST booking, date validation, credential isolation |
| `room-sync.test.ts` | 8 | Room sync: upsert logic, coefficient defaults, idempotency, partial failures, deduplication |
| `admin-api.test.ts` | 13 | Admin endpoints: GET rooms/coefficients, PATCH partial update, comma normalization, 404/400 validation |

**Test environment setup** (`backend/src/__tests__/setup.ts`): Sets all required env vars before tests run to avoid Zod config validation errors.

### Frontend Quality Check

The frontend has no test runner. Quality is checked via:

```bash
cd frontend && npm run qc
```

Runs ESLint + TypeScript strict type check.

### Admin Panel Quality Check

```bash
cd admin && npm run type-check
```

TypeScript strict type check only (no ESLint configured).

### Credential Isolation Check

Verifies the compiled frontend bundle contains no `BNOVO_UID` or `BNOVO_ACCOUNT_ID` strings:

```bash
cd frontend && npm run test:bundle
```

---

## iframe Testing

`test-iframe.html` at the project root tests the booking widget in an iframe with auto-height behavior.

1. Start the frontend dev server (`cd frontend && npm run dev`)
2. Open `test-iframe.html` directly in a browser (file:// or any local server)
3. The iframe loads `http://localhost:5173` and auto-resizes via `postMessage`

---

## Production Build

```bash
# Backend
cd backend && npm run build
# Output: backend/dist/
cd backend && npm start   # runs node dist/index.js

# Booking widget
cd frontend && npm run build
# Output: frontend/dist/

# Admin panel
cd admin && npm run build
# Output: admin/dist/
```

In production:
- Set `MONGODB_URI` in `backend/.env` (or environment) to the production MongoDB connection string.
- Set `FRONTEND_URL` and `ADMIN_URL` to the deployed origin URLs.
- Set `VITE_API_BASE_URL` when building `frontend/` to point to the deployed backend URL.
- `frontend/dist/` and `admin/dist/` can each be served from any static file server or CDN.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Требования

Node.js 18+, npm, MongoDB 6+ (локальный экземпляр), Git.

## Начальная настройка

```bash
cd backend && npm install
cd frontend && npm install
cd admin && npm install
cp backend/.env.example backend/.env
# Заполните .env: BNOVO_UID, BNOVO_ACCOUNT_ID, BNOVO_API_BASE (обязательны)
# Опционально: MONGODB_URI, ADMIN_URL, FRONTEND_URL, PORT
```

## Запуск в разработке

4 терминала:
1. MongoDB: `mongod --dbpath /path`
2. `cd backend && npm run dev` → `http://localhost:3000`
3. `cd frontend && npm run dev` → `http://localhost:5173`
4. `cd admin && npm run dev` → `http://localhost:5174`

Vite автоматически проксирует `/api/*` на `localhost:3000` в обоих фронтенд-приложениях.

## Заполнение базы данных

```bash
cd backend && npm run seed:rooms
```

Скрипт запрашивает Bnovo по 10 диапазонам дат, дедуплицирует номера, делает upsert в коллекцию `rooms` и создаёт записи `coefficients` (по умолчанию = 1) для новых номеров. Идемпотентен. Требует запущенного MongoDB и заполненного `.env`.

## Переменные окружения

Обязательные: `BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE`. Опциональные: `PORT` (3000), `MONGODB_URI` (localhost:27017/apart-nn), `FRONTEND_URL`, `ADMIN_URL`. При отсутствии MongoDB — бэкенд запускается, admin API возвращает 503.

## Тесты

```bash
cd backend && npm test  # 43 теста: 22 виджет API + 8 room-sync + 13 admin API
```

MongoDB-тесты используют `mongodb-memory-server` — реальная база не нужна.

Качество кода:
```bash
cd backend && npm run qc    # ESLint + TypeScript
cd frontend && npm run qc   # ESLint + TypeScript
cd admin && npm run type-check  # TypeScript
```
