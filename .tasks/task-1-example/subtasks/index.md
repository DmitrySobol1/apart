- [ ] Agent: Code Writer | Task: stt-001 | Foundations (validation + auth)
      Add zod + drizzle-zod, derive base/DTO schemas, and implement Basic Auth for /admin/*.
- [ ] Agent: Code Writer | Task: stt-002 | MTProto client + channel resolver
      Create Telegram MTProto client and resolve @username to channel; upsert into channels.
- [ ] Agent: Code Writer | Task: stt-003 | Post mapping + upsert + snapshot
      Map MTProto messages to posts rows, upsert, and write hourly snapshots.
- [ ] Agent: Code Writer | Task: stt-004 | Sync ingestion orchestrator + admin route
      Implement sync backfill/rescan flow and wire POST /admin/ingest/:username.
- [ ] Agent: Code Writer | Task: stt-005 | Read endpoints (channels + posts)
      Implement GET /channels and GET /channels/:username/posts with filters.
- [ ] Agent: Code Writer | Task: stt-006 | Metrics endpoint (hourly)
      Implement GET /channels/:username/posts/:messageId/metrics with 1y clamp.
- [ ] Agent: Code Writer | Task: stt-007 | Config + minimal logging/errors
      Zod-validated config module and concise logging/error mapping.
