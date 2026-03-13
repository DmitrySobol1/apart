---
description: Project-specific commands for development, validation, testing, and building.
last_updated: 2026-03-13
status: active
---

# Project Commands

This file defines all project-specific commands that agents and developers should use.

## Command Reference by Agent

| Agent | Commands | Purpose |
|-------|----------|---------|
| Validator | `qc`, `build` | Verify code quality and build success |
| Code Implementer | `qc` | Validate implementation before commit |
| Code Writer | `qc` | Validate code changes |
| Auditor | `test:run` | Run tests for TEST_STATUS determination |
| Test Writer | (none) | Only writes tests, doesn't execute |

---

## Quality Check

Run in **all** packages after implementation:

```bash
cd frontend && npm run qc
cd backend && npm run qc
cd admin && npm run type-check
```

`qc` = `npm run lint && npm run type-check` (ESLint + TypeScript compilation check)

Admin panel uses `type-check` only (no ESLint configured).

---

## Build

```bash
cd frontend && npm run build
cd backend && npm run build
cd admin && npm run build
```

---

## Run Tests

```bash
cd backend && npm test
```

43 tests across 3 files (22 widget API + 8 room-sync + 13 admin API).

---

## Format Code

```bash
cd frontend && npm run format
cd backend && npm run format
```

`format` = `prettier --write src`

---

## Seed Database

```bash
cd backend && npm run seed:rooms
```

Populates `rooms` and `coefficients` collections from Bnovo API. Requires MongoDB running and `.env` configured.

---

## Development Server

```bash
cd backend && npm run dev
cd frontend && npm run dev
cd admin && npm run dev
```

Backend runs Express on port 3000 (tsx watch).
Frontend (booking widget) runs Vite dev server on port 5173.
Admin panel runs Vite dev server on port 5174.

---

## Install Dependencies

```bash
cd frontend && npm install
cd backend && npm install
cd admin && npm install
```
