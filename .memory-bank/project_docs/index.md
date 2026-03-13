---
description: Index of all project documentation files in .memory-bank/project_docs/
status: current
version: 2.0.0
---

# Project Documentation Index

Documentation for the Apart-NN booking widget and admin panel. All documents are under `.memory-bank/project_docs/`.

---

## Documents

[.memory-bank/project_docs/architecture.md]: System architecture overview — three-app structure (booking widget, admin panel, backend), tech stack, directory structure, MongoDB data model, room sync flow, frontend-to-backend-to-Bnovo data flows, admin coefficient update flow, iframe integration, security notes.

[.memory-bank/project_docs/api-reference.md]: Backend API endpoint reference — all 5 booking widget endpoints (GET /api/rooms, /api/plans, /api/amenities, /api/account, POST /api/booking) and 3 admin endpoints (GET /api/admin/rooms, GET /api/admin/coefficients, PATCH /api/admin/coefficients/:bnovoId). Includes request/response shapes, TypeScript types, error codes, caching, MongoDB guard, curl examples.

[.memory-bank/project_docs/frontend-guide.md]: Frontend reference for both apps — booking widget: component hierarchy, BookingContext state and actions, route guards, page-by-page behavior, all component props, styling, iframe auto-height hook; admin panel: App structure, Navbar tabs, CoefficientsPage (MUI table, auto-save logic, cell state machine), API client with envelope unwrapping.

[.memory-bank/project_docs/development-setup.md]: Developer setup guide — prerequisites (including MongoDB), environment variables (MONGODB_URI, ADMIN_URL added in task-2), running all three packages locally, seeding the database (`npm run seed:rooms`), all npm scripts, backend test suite (43 tests across 3 files), iframe testing.

---

## Project Status

**task-1 MVP** — Audit passed 2026-03-12. 22/22 backend tests pass. Full booking flow verified in Chrome (direct access and iframe).

**task-2 — Room Database & Admin Panel** — Audit passed 2026-03-13. All 43 backend tests pass (22 widget + 8 room-sync + 13 admin API).

**What was added in task-2:**
- MongoDB integration with Mongoose (two collections: `rooms`, `coefficients`)
- Room sync service: queries Bnovo across 10 date ranges, upserts rooms, auto-creates coefficient records
- `npm run seed:rooms` script
- Admin API: `GET /api/admin/rooms`, `GET /api/admin/coefficients`, `PATCH /api/admin/coefficients/:bnovoId`
- Admin panel (`admin/`): React + MUI, separate Vite app on port 5174, CoefficientsPage with editable table and auto-save
- `MONGODB_URI` and `ADMIN_URL` environment variables added to backend config

**What is deferred (post-MVP):**
- Real Bnovo booking creation (POST /api/booking currently logs only)
- Admin panel authentication
- Responsive layout (desktop-only for MVP)
- Payment integration

---

## Related Files

`.tasks/task-2/plan.md`: Full implementation plan for task-2.

`.tasks/task-2/audits/audit-2026-03-13-04-48.md`: Re-audit report — all 3 issues from the previous audit resolved (bnovoId type, envelope unwrapping, deprecated Mongoose option). AUDIT_STATUS: PASSED, TEST_STATUS: PASSED.

`.tasks/task-2/subtasks/index.md`: List of all completed subtasks (stt-001 through stt-task-2-fixes-01).

`.tasks/task-1/plan.md`: Full implementation plan for task-1.

`.tasks/task-1/audits/audit-20260312-000000.md`: Task-1 audit report.

`fixtures/README.md`: Bnovo public API data structure reference.

`backend/.env.example`: Template for backend environment variables.

`test-iframe.html`: Standalone HTML page for testing the widget in an iframe.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Документы

- **architecture.md** — Архитектура системы: три приложения (виджет, панель администратора, бэкенд), техстек, структура каталогов, модель данных MongoDB, синхронизация номеров, потоки данных, интеграция iframe.
- **api-reference.md** — Справочник API: 5 эндпоинтов виджета + 3 admin API (`GET /api/admin/rooms`, `GET /api/admin/coefficients`, `PATCH /api/admin/coefficients/:bnovoId`). Форматы запросов/ответов, ошибки, кэш, примеры curl.
- **frontend-guide.md** — Гайд по фронтенду: виджет (BookingContext, компоненты, iframe) + панель администратора (CoeffициentsPage, auto-save, API-клиент).
- **development-setup.md** — Настройка окружения: требования (MongoDB), переменные окружения, запуск всех трёх приложений, заполнение БД (`npm run seed:rooms`), тесты.

## Статус проекта

**task-1 MVP** завершён. Аудит пройден 2026-03-12.

**task-2** завершён. Аудит пройден 2026-03-13. 43/43 тестов проходят.

Добавлено в task-2: MongoDB + Mongoose (коллекции `rooms` и `coefficients`), сервис синхронизации номеров, скрипт `seed:rooms`, Admin API (3 эндпоинта), панель администратора (React + MUI, порт 5174, таблица коэффициентов с авто-сохранением).

Отложено: реальное создание бронирования в Bnovo, авторизация в панели администратора, адаптивная вёрстка, оплата.
