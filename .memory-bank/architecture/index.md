# Architecture Documentation

This directory contains the core architectural documentation for the Apart-Hotel Booking Widget project (apart-nn.ru).

## Documents

### Data Model
- **[data-model.md](data-model.md)** — Database schema (post-MVP)
  - MVP has no database (booking data logged to console)
  - Post-MVP: MongoDB + Mongoose for bookings, admin panel, analytics

### System Architecture

```
Site apart-nn.ru
  │
  │  <iframe src="https://widget.apart-nn.ru/">
  │
  ▼
┌──────────────────────────────────┐
│  Frontend (React 18 + TS + Vite) │
│  Booking widget inside iframe    │
└───────────┬──────────────────────┘
            │ /api/*
            ▼
┌──────────────────────────────────┐
│  Backend (Node.js + Express + TS)│
│  API proxy + POST stub (MVP)     │
└───────────┬──────────────────────┘
            │ GET (no auth)
            ▼
┌──────────────────────────────────┐
│  Bnovo Public API                │
│  public-api.reservationsteps.ru  │
└──────────────────────────────────┘
```

## Quick Reference

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js 18 + Express + TypeScript + Axios + dotenv
- **Database**: None in MVP. Post-MVP: MongoDB + Mongoose
- **External API**: Bnovo Public API (public-api.reservationsteps.ru/v1/api/)
- **Embedding**: iframe on apart-nn.ru

## Related Documentation

- [Implementation Plan](../../.tasks/task-1/plan.md) — MVP implementation plan
- [Development Conventions](../steerings/development-conventions.md) — Coding standards
- [Project Commands](../steerings/project-commands.md) — CLI commands for agents
