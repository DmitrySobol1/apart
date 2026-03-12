# Web Dashboard — ASCII Wireframes (MVP)

These sketches show the intended UI/UX for the MVP: channels list → channel posts → post detail with hourly metrics. Layout is minimal, utility‑first styling via Tailwind.

## Global Layout
```
+----------------------------------------------------------------------------+
| TG Channel Stats                                                (read-only) |
+----------------------------------------------------------------------------+
| [Home]                                                          [About]     |
+----------------------------------------------------------------------------+
|                                                                            |
|  (Route content renders below)                                             |
|                                                                            |
+----------------------------------------------------------------------------+
```

## 1) Channels List (`/`)
```
+----------------------------------------------------------------------------+
| Channels                                                       [Refresh]    |
+----------------------------------------------------------------------------+
| Search: [                                 ]  (optional)                    |
+----------------------------------------------------------------------------+
| Username           | Title                              | Added At         |
|--------------------+------------------------------------+------------------|
| @ai_architect      | The AI Architect                   | 2025-10-20 12:00 |
| @my_channel        | My Channel                         | 2025-10-18 09:31 |
| @another_one       | Another One                        | 2025-10-10 18:45 |
+----------------------------------------------------------------------------+
| (Click a row → navigate to that channel's posts)                           |
+----------------------------------------------------------------------------+
```

Empty state
```
+----------------------------------------------------------------------------+
| No channels yet.                                                           |
|                                                                            |
| Ingest a channel via backend admin API, then refresh.                      |
+----------------------------------------------------------------------------+
```

Loading/error
```
[ ⏳ Loading channels... ]     or     [ ⚠️ Failed to load.  (Retry) ]
```

## 2) Channel Posts (`/channels/:username`)
```
+----------------------------------------------------------------------------+
| Channels / @ai_architect                                       [Back]      |
| Title: The AI Architect                                                     |
+----------------------------------------------------------------------------+
| Range: From [YYYY-MM-DD]  To [YYYY-MM-DD]  [Apply] [Reset]                 |
+----------------------------------------------------------------------------+
| Date & Time        | Title / Snippet                 | M | Views | React |  |
|--------------------+---------------------------------+---+-------+-------+--|
| 2025-10-20 15:42   | LLMs beyond next token...       | 📎| 12,345|   210 |  |
| 2025-10-20 12:10   | Release notes v0.2              |   |  4,321|    45 |  |
| 2025-10-19 08:03   | Weekend reading list            | 🖼 |  1,234|     9 |  |
+----------------------------------------------------------------------------+
| [ Load more ]                                                    (page 1/∞) |
+----------------------------------------------------------------------------+
| Legend: M = media indicator (📎 doc / 🖼 image / 🎞 video / etc.)           |
+----------------------------------------------------------------------------+
```

Empty state (with active filters)
```
+----------------------------------------------------------------------------+
| No posts for the selected range. Try resetting filters.                    |
+----------------------------------------------------------------------------+
```

Loading/error
```
[ ⏳ Loading posts... ]     or     [ ⚠️ Failed to load.  (Retry) ]
```

Interaction
- Click a post row → navigates to Post Detail.
- Range controls update URL query (`from`, `to`), trigger refetch.
- “Load more” increases `offset` preserving current range.

## 3) Post Detail (`/channels/:username/posts/:messageId`)
```
+----------------------------------------------------------------------------+
| Channels / @ai_architect / #12345                              [Back]      |
| Title: LLMs beyond next token...                                           |
+----------------------------------------------------------------------------+
| Range: From [YYYY-MM-DD]  To [YYYY-MM-DD]   [Apply] [Reset]                |
+----------------------------------------------------------------------------+
| +----------+  +----------+  +----------+  +----------+                     |
| |  Views   |  |Reactions |  | Forwards |  | Replies  |                     |
| | 12,345   |  |   210    |  |   34     |  |   6      |                     |
| +----------+  +----------+  +----------+  +----------+                     |
+----------------------------------------------------------------------------+
| Metrics (hourly)                                                            |
|                                                                            |
|   views ────╮                                                               |
|             │      ╭───╮                                                   |
|             ╰──────╯   ╰─────╮                                             |
|   reactions  ····································                           |
|   forwards   ··╮·········╮······················                           |
|               ││         ││                                               |
|   replies    ··╰·········╯······················                           |
|                                                                            |
|  [ legend: ◼ views  ◼ reactions  ◼ forwards  ◼ replies ]                   |
+----------------------------------------------------------------------------+
| Content (excerpt):                                                          |
|  "LLMs beyond next token..."                                               |
+----------------------------------------------------------------------------+
```

Error/loading states
```
[ ⏳ Loading metrics... ]    or    [ ⚠️ Failed to load metrics. (Retry) ]
```

Notes
- All times displayed in UTC (or local, but consistent across pages).
- Chart shows hourly buckets between `from`–`to` (backend clamps to 365 days).
- KPI values reflect latest counters from post row; chart reflects history.

## Mobile (simplified sketch)
```
[ TG Channel Stats ]

(1) Channels: single-column list
@ai_architect — The AI Architect
@my_channel   — My Channel

(2) Posts: filters collapse into a drawer; table becomes card list
[2025-10-20 15:42]
LLMs beyond next token...
Media: 📎   Views: 12,345   React: 210

(3) Post: KPIs stacked, chart full width, legend tap-to-toggle
```

---
This is a schematic guide, not pixel-perfect. Tailwind utility classes will implement spacing/typography/layout with these blocks as reference.
