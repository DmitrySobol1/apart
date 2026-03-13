# Memory Bank Index

This index provides a high-level overview of the documentation stored in the Memory Bank for the Apart-Hotel Booking Widget and Admin Panel project (apart-nn.ru).

## Steerings (General Development Principles)
- [.memory-bank/steerings/code-ownership.md]: Package boundaries, ownership patterns, import rules, shared code management.
- [.memory-bank/steerings/decompose-conventions.md]: Rules for breaking down implementation plans into executable subtasks.
- [.memory-bank/steerings/design-conventions.md]: Planning conventions for system design and implementation planning, emphasizing documentation-first approach.
- [.memory-bank/steerings/development-conventions.md]: Coding standards — TypeScript strict, Zod validation, code style, naming, error handling, file creation policy, implementation philosophy.
- [.memory-bank/steerings/testing-conventions.md]: Testing standards — Vitest, AAA pattern, what to test/not test, anti-overengineering rules, mocking strategy.

## Project Docs (Project-Specific Working Documentation)
- [.memory-bank/project_docs/index.md]: Index of project documentation — links to all docs, project status summary, related files.
- [.memory-bank/project_docs/architecture.md]: System architecture — three apps (widget, admin, backend), tech stack, directory structure, MongoDB data model, room sync, data flows, iframe integration (brief), security notes.
- [.memory-bank/project_docs/api-reference.md]: Backend API reference — 5 widget endpoints + 3 admin endpoints, request/response shapes, error codes, caching, curl examples, TypeScript types.
- [.memory-bank/project_docs/frontend-guide.md]: Frontend reference — booking widget (components, BookingContext, iframe hook) + admin panel (CoefficientsPage, auto-save, MUI).
- [.memory-bank/project_docs/development-setup.md]: Developer setup guide — prerequisites (incl. MongoDB), env variables, running all 3 packages locally, seeding DB, npm scripts, 43 tests, iframe testing.
- [.memory-bank/project_docs/project-commands.md]: Project-specific CLI commands — qc, build, test, format, seed:rooms, dev server, install (all 3 packages).

## Fixtures
- [.memory-bank/fixtures/README.md]: Bnovo Public API data structure reference — field names, response shapes, deviations from plan assumptions.
- [.memory-bank/fixtures/bnovo-rooms.json]: Snapshot of GET /rooms response (41 available room types with photos, amenities, plans, prices).
- [.memory-bank/fixtures/bnovo-roomtypes.json]: Snapshot of GET /roomtypes response (full catalog of 85 room types).
- [.memory-bank/fixtures/bnovo-amenities.json]: Snapshot of GET /amenities response (amenity groups, names, icons).
- [.memory-bank/fixtures/bnovo-plans.json]: Snapshot of GET /plans response (rate plan metadata, no prices).
- [.memory-bank/fixtures/bnovo-accounts.json]: Snapshot of GET /accounts response (hotel info, checkin/checkout times, currency).

## Initial Research (Pre-Project Investigation)
- [.memory-bank/initialResearch/tz.md]: Technical specification (ТЗ) — formal contract appendix defining the full project scope: booking widget functional requirements (calendar, room catalog, booking form, extras, responsive layout), admin panel features (appearance settings, Bnovo connection, booking journal), architecture diagram, hosting requirements.
- [.memory-bank/initialResearch/info.md]: Deep technical research of the existing Bnovo booking system (~86 KB). Contains: full list of all 41 Bnovo PMS API endpoints (read-only, no booking creation), public API endpoint analysis (`public-api.reservationsteps.ru`), reverse-engineering of booking creation flow via `reservationsteps.ru` HTML forms (POST parameters, CSRF protection, endpoint structure), key identifiers (UID, account_id). Essential reference if implementing real booking creation (POST to reservationsteps.ru) in the future.
