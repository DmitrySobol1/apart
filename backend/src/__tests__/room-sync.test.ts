import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Mock bnovo-client before importing anything that uses it
vi.mock("../services/bnovo-client", () => ({
  bnovoClient: {
    getRooms: vi.fn(),
  },
}));

import { bnovoClient } from "../services/bnovo-client";
import { Room } from "../models/Room";
import { Coefficient } from "../models/Coefficient";
import { syncRooms } from "../services/room-sync";

const mockGetRooms = vi.mocked(bnovoClient.getRooms);

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Room.deleteMany({});
  await Coefficient.deleteMany({});
  mockGetRooms.mockReset();
  vi.useRealTimers(); // ensure clean timer state
});

// syncRooms has a 1-2 second delay between each of 10 date range calls.
// We use fake timers to skip those, and run the sync + advance timers concurrently.
async function runSync(): Promise<void> {
  vi.useFakeTimers({ toFake: ["setTimeout"] });
  try {
    const syncPromise = syncRooms();
    await vi.runAllTimersAsync();
    await syncPromise;
  } finally {
    vi.useRealTimers();
  }
}

describe("syncRooms", () => {
  describe("basic upsert behaviour", () => {
    it("creates rooms and coefficient entries from Bnovo API response", async () => {
      mockGetRooms.mockResolvedValue({
        data: { rooms: [{ id: "room-1", name_ru: "Студия" }] },
      } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();

      const rooms = await Room.find().lean();
      expect(rooms).toHaveLength(1);
      expect(rooms[0].bnovoId).toBe("room-1");
      expect(rooms[0].name).toBe("Студия");

      const coefficients = await Coefficient.find().lean();
      expect(coefficients).toHaveLength(1);
      expect(coefficients[0].bnovoId).toBe("room-1");
      expect(coefficients[0].coefficient1).toBe(1);
      expect(coefficients[0].coefficient2).toBe(1);
      expect(coefficients[0].coefficient3).toBe(1);
    }, 30_000);

    it("creates coefficient with default values of 1 for new rooms", async () => {
      mockGetRooms.mockResolvedValue({
        data: {
          rooms: [
            { id: "r-a", name_ru: "Люкс" },
            { id: "r-b", name_ru: "Стандарт" },
          ],
        },
      } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();

      const coefficients = await Coefficient.find().sort({ bnovoId: 1 }).lean();
      expect(coefficients).toHaveLength(2);
      for (const c of coefficients) {
        expect(c.coefficient1).toBe(1);
        expect(c.coefficient2).toBe(1);
        expect(c.coefficient3).toBe(1);
      }
    }, 30_000);
  });

  describe("idempotency", () => {
    it("does not create duplicate rooms on re-sync", async () => {
      mockGetRooms.mockResolvedValue({
        data: { rooms: [{ id: "room-1", name_ru: "Студия" }] },
      } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();
      await runSync();

      const rooms = await Room.find().lean();
      expect(rooms).toHaveLength(1);
    }, 60_000);

    it("does not create duplicate coefficient entries on re-sync", async () => {
      mockGetRooms.mockResolvedValue({
        data: { rooms: [{ id: "room-1", name_ru: "Студия" }] },
      } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();
      await runSync();

      const coefficients = await Coefficient.find().lean();
      expect(coefficients).toHaveLength(1);
    }, 60_000);

    it("does not overwrite existing coefficient values on re-sync", async () => {
      mockGetRooms.mockResolvedValue({
        data: { rooms: [{ id: "room-1", name_ru: "Студия" }] },
      } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();

      // Simulate user update of coefficient
      await Coefficient.updateOne({ bnovoId: "room-1" }, { $set: { coefficient1: 1.5 } });

      // Re-sync should not overwrite the custom value
      await runSync();

      const coef = await Coefficient.findOne({ bnovoId: "room-1" }).lean();
      expect(coef?.coefficient1).toBe(1.5);
    }, 60_000);
  });

  describe("partial failures", () => {
    it("saves rooms from successful ranges when some date ranges fail", async () => {
      mockGetRooms
        .mockRejectedValueOnce(new Error("API timeout"))
        .mockResolvedValue({
          data: { rooms: [{ id: "room-1", name_ru: "Студия" }] },
        } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();

      const rooms = await Room.find().lean();
      expect(rooms).toHaveLength(1);
      expect(rooms[0].bnovoId).toBe("room-1");
    }, 30_000);

    it("skips ranges that return empty rooms and saves rooms from successful ranges", async () => {
      mockGetRooms
        .mockResolvedValueOnce({
          data: { rooms: [] },
        } as Awaited<ReturnType<typeof bnovoClient.getRooms>>)
        .mockResolvedValue({
          data: { rooms: [{ id: "room-1", name_ru: "Студия" }] },
        } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();

      const rooms = await Room.find().lean();
      expect(rooms).toHaveLength(1);
    }, 30_000);

    it("deduplicates rooms that appear in multiple date ranges", async () => {
      mockGetRooms.mockResolvedValue({
        data: { rooms: [{ id: "room-1", name_ru: "Студия" }] },
      } as Awaited<ReturnType<typeof bnovoClient.getRooms>>);

      await runSync();

      const rooms = await Room.find().lean();
      expect(rooms).toHaveLength(1);

      const coefficients = await Coefficient.find().lean();
      expect(coefficients).toHaveLength(1);
    }, 30_000);
  });
});
