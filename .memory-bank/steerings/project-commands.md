---
description: Project-specific commands for development, validation, testing, and building.
last_updated: 2026-03-12
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

Run in **both** packages after implementation:

```bash
cd frontend && npm run qc
cd backend && npm run qc
```

`qc` = `npm run lint && npm run type-check` (ESLint + TypeScript compilation check)

---

## Build

```bash
cd frontend && npm run build
cd backend && npm run build
```

---

## Run Tests

```bash
cd backend && npm test
```

---

## Format Code

```bash
cd frontend && npm run format
cd backend && npm run format
```

`format` = `prettier --write src`

---

## Development Server

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

Backend runs Express on port 3001 (tsx watch).
Frontend runs Vite dev server on port 5173.

---

## Install Dependencies

```bash
cd frontend && npm install
cd backend && npm install
```
