---
description: Index of all project documentation files in .memory-bank/project_docs/
status: current
version: 1.1.0
---

# Project Documentation Index

Documentation for the Apart-NN booking widget (task-1 MVP). All documents are under `.memory-bank/project_docs/`.

---

## Documents

[.memory-bank/project_docs/architecture.md]: System architecture overview — tech stack, directory structure, frontend-to-backend-to-Bnovo data flow, iframe integration mechanism, security notes.

[.memory-bank/project_docs/api-reference.md]: Backend API endpoint reference — all 5 endpoints (GET /api/rooms, /api/plans, /api/amenities, /api/account, POST /api/booking), request parameters, response shapes, error codes, caching behavior, curl examples, TypeScript types.

[.memory-bank/project_docs/frontend-guide.md]: Frontend reference — component hierarchy, BookingContext state and actions, route guards, page-by-page behavior, all component props and logic, styling approach, iframe auto-height hook.

[.memory-bank/project_docs/development-setup.md]: Developer setup guide — prerequisites, environment variables, running both packages locally, all npm scripts (dev/build/test/lint/qc/format), backend test suite coverage, iframe testing with test-iframe.html.

---

## Project Status

**task-1 MVP** — Audit passed 2026-03-12. Manual browser test completed 2026-03-12. 22/22 backend tests pass. Full flow verified end-to-end in Chrome (direct access and iframe). See `.tasks/task-1/audits/audit-20260312-000000.md` for the full audit report and `.tasks/task-1/manual_test/manual_test.md` for the manual test report.

**What is implemented:**
- 4-step booking flow: search → rooms catalog → guest form → confirmation stub
- Backend proxy for Bnovo API (GET routes + POST booking stub)
  - `/api/rooms` returns a plain array (backend unwraps Bnovo's `{"rooms": [...]}` envelope)
  - `/api/account` returns a flat object (backend unwraps Bnovo's `{"account": {...}}` envelope)
- In-memory cache for room availability (5-minute TTL)
- iframe auto-height via `postMessage` (ResizeObserver on `#root`, not `body`)
- Iframe detection in `main.tsx` — adds `in-iframe` class to `<body>` for conditional `overflow: hidden`
- `scrollToWidget` postMessage on route change (parent page scrolls to widget)
- Client-side and server-side validation
- TypeScript strict mode, ESLint, Prettier across both packages

**What is deferred (post-MVP):**
- Real Bnovo booking creation (POST /api/booking currently logs only)
- Responsive layout (desktop-only for MVP)
- Payment integration
- Analytics, admin panel, auth

---

## Related Files

`.tasks/task-1/plan.md`: Full implementation plan for task-1.

`.tasks/task-1/audits/audit-20260312-000000.md`: Audit report with subtask-by-subtask checklist, acceptance criteria verification, and minor issues list.

`.tasks/task-1/manual_test/manual_test.md`: Manual browser test report — 15 test cases, 5 bugs found and fixed (API response unwrapping, iframe resize feedback loop, stale .js files, overflow CSS).

`.tasks/task-1/subtasks/index.md`: List of all 12 completed subtasks (stt-000 through stt-task-1-fixes-01).

`fixtures/README.md`: Bnovo public API data structure reference — field names, response shapes, and deviations from plan assumptions discovered during API exploration (stt-000).

`backend/.env.example`: Template for backend environment variables.

`test-iframe.html`: Standalone HTML page for testing the widget in an iframe with auto-height.

---

---

# Русский перевод (Russian Translation)

> **NOTE:** Этот раздел — перевод на русский язык для удобства владельца проекта. Агент разработки использует только английскую секцию выше.

## Документы

- **architecture.md** — Архитектура системы: техстек, структура каталогов, потоки данных (поиск, бронирование), механизм iframe.
- **api-reference.md** — Справочник API бэкенда: все 5 эндпоинтов, параметры запросов, форматы ответов, коды ошибок, кэширование, примеры curl, TypeScript-типы.
- **frontend-guide.md** — Гайд по фронтенду: иерархия компонентов, BookingContext, защита маршрутов, поведение страниц и компонентов, стилизация, хук авторесайза iframe.
- **development-setup.md** — Настройка окружения разработки: требования, переменные окружения, запуск обоих пакетов, все npm-скрипты, тестирование, тестирование iframe.

## Статус проекта

**task-1 MVP** завершён. Аудит пройден 2026-03-12. Ручное тестирование в браузере завершено 2026-03-12. 22/22 тестов бэкенда проходят. Весь flow проверен сквозным тестом в Chrome (прямой доступ и iframe).

Реализовано: 4-шаговый поток бронирования, прокси Bnovo API (с распаковкой ответов: `/api/rooms` → массив, `/api/account` → плоский объект), кэш доступности номеров (5 мин), авторесайз iframe (ResizeObserver на `#root`), определение iframe через `main.tsx` и класс `in-iframe`, `scrollToWidget` при смене маршрута, валидация на клиенте и сервере, TypeScript strict mode, ESLint, Prettier.

Отложено на пост-MVP: реальное создание бронирования в Bnovo, адаптивная верстка, оплата, аналитика, личный кабинет.
