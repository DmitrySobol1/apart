import { Router, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Room } from "../models/Room";
import { Coefficient } from "../models/Coefficient";
import type { AdminRoomResponse, AdminCoefficientResponse } from "../types";

const router = Router();

router.use((_req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: "Database not available" });
    return;
  }
  next();
});

router.get("/rooms", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rooms = await Room.find().sort({ name: 1 }).lean();
    const data: AdminRoomResponse[] = rooms.map((r) => ({
      bnovoId: r.bnovoId as string,
      name: r.name as string,
      createdAt: r.createdAt as Date,
      updatedAt: r.updatedAt as Date,
    }));
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.get("/coefficients", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coefficients = await Coefficient.find().populate("roomId").lean();
    const roomMap = new Map<string, string>();
    const allRooms = await Room.find().lean();
    for (const room of allRooms) {
      roomMap.set(room.bnovoId as string, room.name as string);
    }

    const data: AdminCoefficientResponse[] = coefficients
      .map((c) => ({
        bnovoId: c.bnovoId as string,
        roomName: roomMap.get(c.bnovoId as string) ?? "",
        coefficient1: c.coefficient1 as number,
        coefficient2: c.coefficient2 as number,
        coefficient3: c.coefficient3 as number,
        updatedAt: c.updatedAt as Date,
      }))
      .sort((a, b) => a.roomName.localeCompare(b.roomName));

    res.json({ data });
  } catch (err) {
    next(err);
  }
});

const coefValueSchema = z.preprocess(
  (val) => (typeof val === "string" ? Number(val.replace(",", ".")) : val),
  z.number().gt(0),
);

const patchSchema = z
  .object({
    coefficient1: coefValueSchema.optional(),
    coefficient2: coefValueSchema.optional(),
    coefficient3: coefValueSchema.optional(),
  })
  .refine(
    (data) =>
      data.coefficient1 !== undefined ||
      data.coefficient2 !== undefined ||
      data.coefficient3 !== undefined,
    { message: "At least one coefficient field must be provided" },
  );

router.patch(
  "/coefficients/:bnovoId",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors });
      return;
    }

    try {
      const updated = await Coefficient.findOneAndUpdate(
        { bnovoId: req.params.bnovoId },
        { $set: parsed.data },
        { new: true },
      ).lean();

      if (!updated) {
        res.status(404).json({ error: "Room not found" });
        return;
      }

      res.json({
        success: true,
        data: {
          bnovoId: updated.bnovoId,
          coefficient1: updated.coefficient1,
          coefficient2: updated.coefficient2,
          coefficient3: updated.coefficient3,
          updatedAt: updated.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
