---
description: Index of all project documentation files in .memory-bank/project_docs/
status: current
version: 1.0.0
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

**task-1 MVP** — Audit passed 2026-03-12. 22/22 backend tests pass. Zero critical or major issues. See `.tasks/task-1/audits/audit-20260312-000000.md` for the full audit report.

**What is implemented:**
- 4-step booking flow: search → rooms catalog → guest form → confirmation stub
- Backend proxy for Bnovo API (GET routes + POST booking stub)
- In-memory cache for room availability (5-minute TTL)
- iframe auto-height via `postMessage`
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

**task-1 MVP** завершён. Аудит пройден 2026-03-12. 22/22 тестов бэкенда проходят. Нет критических или серьёзных проблем.

Реализовано: 4-шаговый поток бронирования, прокси Bnovo API, кэш доступности номеров (5 мин), авторесайз iframe, валидация на клиенте и сервере, TypeScript strict mode, ESLint, Prettier.

Отложено на пост-MVP: реальное создание бронирования в Bnovo, адаптивная верстка, оплата, аналитика, личный кабинет.
