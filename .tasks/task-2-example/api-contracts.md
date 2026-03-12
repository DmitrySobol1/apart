# API Contracts (MVP)

This file defines TypeScript interfaces for the current backend API. Dates are serialized as ISO 8601 strings (UTC). Counts are integers.

```ts
// Common
export type ISODateString = string; // e.g. "2025-10-20T15:42:00.000Z"

// Routes summary
// GET    /channels
// GET    /channels/:username/posts?from&to&limit&offset
// GET    /channels/:username/posts/:messageId/metrics?from&to&bucket=hour
// POST   /admin/ingest/:username   (body: IngestBody)

// 1) /channels
export interface ChannelListItem {
  id: number;
  tgId: number; // Telegram channel ID (stable)
  username: string | null; // can be null if channel has no public username
  title: string;
  addedAt: ISODateString; // when channel was added to DB
  isTracked: boolean;
}
export type GetChannelsResponse = ChannelListItem[];

// 2) /channels/:username/posts
export interface ChannelPostsQuery {
  limit?: number; // default 50, max 1000
  offset?: number; // default 0, >= 0
  from?: ISODateString; // optional filter lower bound (inclusive)
  to?: ISODateString;   // optional filter upper bound (inclusive)
}
export interface PostListItem {
  channelId: number;
  messageId: number; // Telegram message ID within channel
  date: ISODateString; // post publish datetime
  title: string; // first line or snippet
  hasMedia: boolean;
  viewsLatest: number;
  forwardsLatest: number;
  repliesLatest: number;
  reactionsLatestTotal: number;
}
export type GetChannelPostsResponse = PostListItem[];

// 3) /channels/:username/posts/:messageId/metrics
export type MetricsBucket = 'hour'; // MVP supports only hourly
export interface PostMetricsQuery {
  from?: ISODateString;
  to?: ISODateString;
  bucket?: MetricsBucket; // default 'hour'
}
export interface PostMetricsPoint {
  tsHour: ISODateString; // bucket start time in UTC
  views: number;
  forwards: number;
  replies: number;
  reactionsTotal: number;
}
export type GetPostMetricsResponse = PostMetricsPoint[];

// 4) /admin/ingest/:username (secured via Basic Auth)
export interface IngestBody {
  maxMessages?: number;   // positive integer
  rescanLatest?: number;  // 0..5000
}
export interface IngestResponseChannel {
  id: number;
  tgId: number;
  username: string | null;
  title: string;
}
export interface IngestResponse {
  ok: boolean;
  channel: IngestResponseChannel;
  added: number;   // number of posts inserted
  updated: number; // number of posts updated
}

// Optional: error envelope used by global error handler (500 and some errors)
export interface ApiError {
  error: string;   // e.g., 'Internal Server Error'
  message: string; // human-readable details
}

// Path params (for reference)
export interface UsernameParam {
  username: string; // '@name' or 'name' are accepted by backend
}
export interface PostParam extends UsernameParam {
  messageId: number;
}
```

Notes
- All times are returned as ISO 8601 strings in UTC. UI can format locally.
- Backend clamps metrics range to max 365 days if a wider range is requested.
- Schemas mirror current backend code in packages/backend/src/schemas.
