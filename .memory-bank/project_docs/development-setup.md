---
description: Local development setup, environment variables, npm scripts, and testing instructions
status: current
version: 1.0.0
---

# Development Setup

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Git

---

## Repository Structure

The project is a monorepo with two independent npm packages:

```
apart-nn-develop/
├── backend/     # Node.js + Express backend
└── frontend/    # React + Vite frontend
```

Each package has its own `package.json`, `node_modules`, and scripts. There is no root-level package manager (no Turborepo, no Nx).

---

## Initial Setup

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd frontend && npm install
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
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `BNOVO_UID` | Yes | — | Hotel UID for `/accounts` endpoint |
| `BNOVO_ACCOUNT_ID` | Yes | — | Account ID for `/rooms`, `/plans` endpoints |
| `BNOVO_API_BASE` | Yes | — | Bnovo API base URL (include `/v1/api`) |
| `PORT` | No | `3000` | Backend listen port |
| `NODE_ENV` | No | `development` | Node environment |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin |

The backend validates all required variables with Zod at startup and exits immediately if any are missing.

**Frontend variable (optional):**

```env
VITE_API_BASE_URL=http://localhost:3000
```

Only needed if the frontend is served separately from the Vite dev proxy. When using `npm run dev` in `frontend/`, the Vite proxy forwards `/api/*` to `http://localhost:3000` automatically, so this variable is not required.

`VITE_API_BASE_URL` is intentionally not prefixed with `BNOVO_` and contains no credentials. The Bnovo `UID` and `ACCOUNT_ID` are never set as frontend environment variables.

---

## Running Locally

Start both processes in separate terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

Output: `Server running on http://localhost:3000`

Uses `tsx watch` for TypeScript execution with file watching.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Output: `VITE ... Local: http://localhost:5173/`

The Vite dev server proxies all `/api/*` requests to `http://localhost:3000`. No CORS configuration is needed during development — the proxy handles it.

Open `http://localhost:5173` in your browser.

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
| `qc` | `npm run lint && npm run type-check` | Full quality check (lint + types) |
| `format` | `prettier --write src` | Format source files |

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Start Vite dev server |
| `build` | `tsc && vite build` | Type-check then build to `dist/` |
| `preview` | `vite preview` | Serve the production build locally |
| `test:bundle` | `npm run build && node scripts/check-bundle-credentials.mjs` | Build and scan bundle for credential strings |
| `lint` | `eslint src` | Run ESLint |
| `type-check` | `tsc --noEmit` | TypeScript type check without emit |
| `qc` | `npm run lint && npm run type-check` | Full quality check (lint + types) |
| `format` | `prettier --write src` | Format source files |

---

## Testing

### Backend Unit/Integration Tests

Tests are in `backend/src/__tests__/api.test.ts`. The test suite has 22 tests using Vitest and Supertest. `bnovoClient` is mocked — tests run without network access and without a real `.env`.

```bash
cd backend && npm test
```

Expected output:
```
 ✓ GET proxy endpoints return data (4)
 ✓ GET /api/rooms date validation (6)
 ✓ POST /api/booking validation (9)
 ✓ Credential isolation (3)

 Test Files  1 passed (1)
 Tests  22 passed (22)
```

**Test coverage:**

| Test group | Count | What is tested |
|---|---|---|
| GET proxy endpoints | 4 | All 4 GET routes return 200 with correct response type |
| GET /api/rooms validation | 6 | Missing params, wrong format, same date, reversed dates |
| POST /api/booking | 9 | Happy path + 7 invalid cases + date order violation |
| Credential isolation | 3 | `BNOVO_UID` and `BNOVO_ACCOUNT_ID` not present in any response body |

**Test environment setup** (`backend/src/__tests__/setup.ts`):
Sets all required env vars (`BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE`, `FRONTEND_URL`) before tests run. This avoids Zod config validation errors in test mode.

### Frontend Quality Check (no test runner)

The frontend has no unit/integration test runner. Quality is checked via:

```bash
cd frontend && npm run qc
```

This runs ESLint + TypeScript strict type check. Both must pass clean.

### Credential Isolation Check

Verifies the compiled frontend bundle contains no `BNOVO_UID` or `BNOVO_ACCOUNT_ID` strings:

```bash
cd frontend && npm run test:bundle
```

This builds the frontend and runs `scripts/check-bundle-credentials.mjs` which scans the output files.

---

## iframe Testing

`test-iframe.html` at the project root tests the widget in an iframe with auto-height behavior.

1. Start the frontend dev server (`cd frontend && npm run dev`)
2. Open `test-iframe.html` directly in a browser (file:// or any local server)
3. The iframe loads `http://localhost:5173` and auto-resizes based on `postMessage` events

The test page listens for `{ type: "resize", height: number }` messages and sets `iframe.style.height` accordingly. This simulates the production embedding on `apart-nn.ru`.

---

## Production Build

```bash
# Build backend
cd backend && npm run build
# Output: backend/dist/

# Build frontend
cd frontend && npm run build
# Output: frontend/dist/
```

Start production backend:
```bash
cd backend && npm start
```

The frontend `dist/` can be served from any static file server or CDN. In production, set `VITE_API_BASE_URL` in the frontend build environment to point to the deployed backend URL.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Требования

Node.js 18+, npm, Git.

## Начальная настройка

```bash
cd backend && npm install
cd frontend && npm install
cp backend/.env.example backend/.env
# Заполните .env реальными значениями (BNOVO_UID, BNOVO_ACCOUNT_ID и др.)
```

## Запуск в разработке

Запустите два процесса в отдельных терминалах:

```bash
# Терминал 1
cd backend && npm run dev   # http://localhost:3000

# Терминал 2
cd frontend && npm run dev  # http://localhost:5173
```

Vite автоматически проксирует `/api/*` на `http://localhost:3000`.

## Переменные окружения

Обязательные (в `backend/.env`): `BNOVO_UID`, `BNOVO_ACCOUNT_ID`, `BNOVO_API_BASE`. Опциональные: `PORT` (по умолчанию 3000), `NODE_ENV`, `FRONTEND_URL`. Бэкенд завершается при старте если обязательные переменные отсутствуют.

## Тесты

```bash
cd backend && npm test   # 22 теста, без реальных запросов к Bnovo
```

Качество кода:
```bash
cd backend && npm run qc   # ESLint + TypeScript
cd frontend && npm run qc  # ESLint + TypeScript
```

Проверка на утечку учётных данных в бандле фронтенда:
```bash
cd frontend && npm run test:bundle
```

## Тестирование iframe

Откройте `test-iframe.html` в браузере при запущенном фронтенде (`localhost:5173`). Страница демонстрирует автоматическую подстройку высоты iframe через `postMessage`.
