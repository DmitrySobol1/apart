import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { bnovoClient } from "../services/bnovo-client";
import { applyRoomRanking } from "../services/room-ranking";
import { AppError } from "../middleware/error-handler";

const router = Router();

const DD_MM_YYYY = /^\d{2}-\d{2}-\d{4}$/;

const querySchema = z.object({
  dfrom: z.string().regex(DD_MM_YYYY, "dfrom must be in DD-MM-YYYY format"),
  dto: z.string().regex(DD_MM_YYYY, "dto must be in DD-MM-YYYY format"),
});

function parseDate(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split("-");
  return new Date(`${yyyy}-${mm}-${dd}`);
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  const parsed = querySchema.safeParse(req.query);

  if (!parsed.success) {
    const err: AppError = new Error(parsed.error.errors[0].message);
    err.statusCode = 400;
    return next(err);
  }

  const { dfrom, dto } = parsed.data;

  if (parseDate(dto) <= parseDate(dfrom)) {
    const err: AppError = new Error("dto must be after dfrom");
    err.statusCode = 400;
    return next(err);
  }

  const cacheKey = `${dfrom}+${dto}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

  try {
    const response = await bnovoClient.getRooms(dfrom, dto);
    const rawRooms = response.data.rooms ?? [];
    const rooms = await applyRoomRanking(rawRooms);
    cache.set(cacheKey, { data: rooms, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.json(rooms);
  } catch (err) {
    return next(err);
  }
});

export default router;
