---
description: Index of all project documentation files in .memory-bank/project_docs/
status: current
version: 3.0.0
---

# Project Documentation Index

Documentation for the Apart-NN booking widget and admin panel. All documents are under `.memory-bank/project_docs/`.

---

## Documents

[.memory-bank/project_docs/architecture.md]: System architecture overview — three-app structure (booking widget, admin panel, backend), tech stack, directory structure, MongoDB data model, room sync flow, frontend-to-backend-to-Bnovo data flows including real booking creation and payment redirect, admin coefficient update flow, iframe integration, security notes.

[.memory-bank/project_docs/api-reference.md]: Backend API endpoint reference — all 5 booking widget endpoints (GET /api/rooms, /api/plans, /api/amenities, /api/account, POST /api/booking) and 3 admin endpoints (GET /api/admin/rooms, GET /api/admin/coefficients, PATCH /api/admin/coefficients/:bnovoId). Includes request/response shapes, TypeScript types, error codes, caching, MongoDB guard, curl examples. POST /api/booking now returns real booking data (bookingNumber, paymentUrl, amount).

[.memory-bank/project_docs/frontend-guide.md]: Frontend reference for both apps — booking widget: component hierarchy, BookingContext state and actions, route guards, page-by-page behavior, all component props, styling, iframe auto-height hook; BookingPage double-submit guard; ConfirmationPage as payment redirect screen. Admin panel: App structure, Navbar tabs, CoefficientsPage (MUI table, auto-save logic, cell state machine), API client with envelope unwrapping.

[.memory-bank/project_docs/development-setup.md]: Developer setup guide — prerequisites (including MongoDB), environment variables (BNOVO_BOOKING_URL added in task-3), running all three packages locally, seeding the database (`npm run seed:rooms`), all npm scripts, backend test suite (56 tests across 4 files), iframe testing.

[.memory-bank/project_docs/project-commands.md]: Project-specific CLI commands — qc, build, test, format, seed:rooms, dev server, install (all three packages).

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

**Bug fix (2026-03-13):** `room-sync.ts` `formatDate()` was producing `YYYY-MM-DD` (via `toISOString().slice(0, 10)`), causing HTTP 406 errors from the Bnovo API. Fixed to output `DD-MM-YYYY` using explicit `getDate()`/`getMonth()`/`getFullYear()` calls.

**task-3 — Booking Creation & Payment Integration** — Audit passed 2026-03-14. All 56 backend tests pass (22 widget + 8 room-sync + 13 admin API + 13 booking service).

**What was added in task-3:**
- `backend/src/services/bnovo-booking.ts` — booking service: POSTs to `reservationsteps.ru/bookings/post/{uid}` with `redirect: 'manual'`, parses 302 Location header, extracts `bookingNumber`, `paymentUrl`, and `amount`
- `POST /api/booking` route now calls `createBooking()` instead of a stub, returns `{ success, bookingNumber, paymentUrl, amount }`
- `BNOVO_BOOKING_URL` config variable added (default: `https://reservationsteps.ru`)
- Frontend `BookingResponse` type updated: `{ success, message?, bookingNumber?, paymentUrl?, amount? }`
- `BookingPage.tsx`: double-submit guard via `useRef`, error handling with "Повторить" button
- `ConfirmationPage.tsx`: repurposed as "Redirecting to payment..." screen — displays booking number and amount, calls `window.top.location.href = paymentUrl` after 500ms with `try/catch` fallback, shows manual fallback link
- 13 new backend unit tests for booking service and updated route

**What is deferred (post-task-3):**
- Booking journal in MongoDB (logging all bookings)
- Return URL after payment (redirect back to hotel site)
- Booking status verification via Bnovo PMS API
- Email confirmation to guest
- Admin panel authentication
- Responsive layout (desktop-only for MVP)

---

## Related Files

`.tasks/task-3/plan.md`: Full implementation plan for task-3.

`.tasks/task-3/audits/audit-2026-03-14-00-50.md`: Task-3 audit report — AUDIT_STATUS: PASSED, TEST_STATUS: PASSED. 56 tests across 4 files.

`.tasks/task-2/plan.md`: Full implementation plan for task-2.

`.tasks/task-2/audits/audit-2026-03-13-04-48.md`: Task-2 audit report — AUDIT_STATUS: PASSED.

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

- **architecture.md** — Архитектура системы: три приложения (виджет, панель администратора, бэкенд), техстек, структура каталогов, модель данных MongoDB, синхронизация номеров, потоки данных (включая реальное создание бронирования и редирект на оплату), интеграция iframe.
- **api-reference.md** — Справочник API: 5 эндпоинтов виджета + 3 admin API. POST /api/booking теперь возвращает реальные данные бронирования (bookingNumber, paymentUrl, amount). Форматы запросов/ответов, ошибки, кэш, примеры curl.
- **frontend-guide.md** — Гайд по фронтенду: виджет (BookingContext, компоненты, iframe) + BookingPage (защита от двойной отправки) + ConfirmationPage (экран перенаправления на оплату) + панель администратора (CoeffициentsPage, auto-save, API-клиент).
- **development-setup.md** — Настройка окружения: требования (MongoDB), переменные окружения (добавлен BNOVO_BOOKING_URL), запуск всех трёх приложений, заполнение БД, тесты (56 тестов в 4 файлах).
- **project-commands.md** — CLI-команды проекта.

## Статус проекта

**task-1 MVP** завершён. Аудит пройден 2026-03-12.

**task-2** завершён. Аудит пройден 2026-03-13. 43/43 тестов проходят.

**task-3 — Создание бронирования и интеграция оплаты** завершён. Аудит пройден 2026-03-14. 56/56 тестов проходят.

Добавлено в task-3: сервис `bnovo-booking.ts` (HTTP POST на reservationsteps.ru, парсинг 302-редиректа), реальная интеграция `POST /api/booking` (возвращает bookingNumber, paymentUrl, amount), переменная `BNOVO_BOOKING_URL`, обновлённый `BookingResponse`, защита от двойной отправки в BookingPage, ConfirmationPage как экран «Перенаправляем на оплату...» с `window.top.location.href` и резервной ссылкой, 13 новых тестов.

Отложено: журнал бронирований в MongoDB, return URL после оплаты, проверка статуса бронирования, email-подтверждение, авторизация в панели администратора.
