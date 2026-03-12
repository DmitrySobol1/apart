# Apart-Hotel Booking Widget — Data Model

## MVP (Task-1)

MVP does not use a database. Booking data is logged to console on the backend.

## Post-MVP — MongoDB + Mongoose

Database will be introduced in post-MVP phase for:
- Storing bookings created through the widget
- Admin panel settings (colors, texts, toggles)
- Booking journal / monitoring

### Planned Collections (to be designed when MongoDB is introduced)

- **bookings** — guest data, dates, room type, rate plan, status, timestamps
- **settings** — widget configuration (colors, logo, texts, enabled blocks)
- **logs** — API interaction logs, errors

> **Note:** This document is a placeholder. The full schema will be designed and documented when MongoDB integration is implemented (post-MVP). See subtask stt-010 in `.tasks/task-1/subtasks/index.md`.
