import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Coefficient } from "../models/Coefficient";
import { applyRoomRanking } from "../services/room-ranking";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 60_000);

afterEach(async () => {
  await Coefficient.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("applyRoomRanking", () => {
  it("returns empty array for empty input", async () => {
    const result = await applyRoomRanking([]);
    expect(result).toEqual([]);
  });

  it("assigns default score (3) when no coefficient exists", async () => {
    const rooms = [{ id: "room-1", name_ru: "Room room-1" }];
    const result = await applyRoomRanking(rooms);

    expect(result).toHaveLength(1);
    expect(result[0].numToShowOnFrontend).toBe(3);
    expect(result[0].id).toBe("room-1");
  });

  it("sums coefficients from database for matching rooms", async () => {
    await Coefficient.create({
      bnovoId: "room-1",
      coefficient1: 2,
      coefficient2: 1.5,
      coefficient3: 1,
    });

    const rooms = [{ id: "room-1", name_ru: "Room room-1" }];
    const result = await applyRoomRanking(rooms);

    expect(result[0].numToShowOnFrontend).toBe(4.5);
  });

  it("handles mix of rooms with and without coefficients", async () => {
    await Coefficient.create({
      bnovoId: "room-1",
      coefficient1: 4,
      coefficient2: 2,
      coefficient3: 1,
    });

    const rooms = [
      { id: "room-1", name_ru: "Room room-1" },
      { id: "room-2", name_ru: "Room room-2" },
    ];
    const result = await applyRoomRanking(rooms);

    expect(result[0].numToShowOnFrontend).toBe(7);
    expect(result[1].numToShowOnFrontend).toBe(3);
  });

  it("preserves all original room fields", async () => {
    const room = {
      id: "room-1",
      name_ru: "Студия",
      available: 5,
      adults: 2,
      photos: [{ url: "https://example.com/photo.jpg" }],
      plans: [{ id: "plan-1", name: "Standard" }],
      amenities: [{ id: "a-1", name: "Wi-Fi" }],
    };

    const result = await applyRoomRanking([room]);

    expect(result[0]).toMatchObject({
      id: "room-1",
      name_ru: "Студия",
      available: 5,
      adults: 2,
      photos: [{ url: "https://example.com/photo.jpg" }],
      plans: [{ id: "plan-1", name: "Standard" }],
      amenities: [{ id: "a-1", name: "Wi-Fi" }],
      numToShowOnFrontend: 3,
    });
  });
});
