import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Room } from "../models/Room";
import { Coefficient } from "../models/Coefficient";

let mongoServer: MongoMemoryServer;
let app: express.Express;

async function buildApp(): Promise<express.Express> {
  const instance = express();
  instance.use(express.json());
  const [adminRouter, { errorHandler }] = await Promise.all([
    import("../routes/admin").then((m) => m.default),
    import("../middleware/error-handler"),
  ]);
  instance.use("/api/admin", adminRouter);
  instance.use(errorHandler);
  return instance;
}

async function seedRoom(
  bnovoId: string,
  name: string,
  coefs?: { coefficient1?: number; coefficient2?: number; coefficient3?: number },
): Promise<void> {
  const room = await Room.create({ bnovoId, name });
  await Coefficient.create({
    roomId: room._id,
    bnovoId,
    coefficient1: coefs?.coefficient1 ?? 1,
    coefficient2: coefs?.coefficient2 ?? 1,
    coefficient3: coefs?.coefficient3 ?? 1,
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = await buildApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Room.deleteMany({});
  await Coefficient.deleteMany({});
});

describe("GET /api/admin/rooms", () => {
  it("returns all rooms sorted by name", async () => {
    await seedRoom("r-2", "Стандарт");
    await seedRoom("r-1", "Люкс");
    await seedRoom("r-3", "Апартаменты");

    const res = await request(app).get("/api/admin/rooms");

    expect(res.status).toBe(200);
    const names = res.body.data.map((r: { name: string }) => r.name);
    expect(names).toEqual(["Апартаменты", "Люкс", "Стандарт"]);
  });

  it("returns empty array when no rooms exist", async () => {
    const res = await request(app).get("/api/admin/rooms");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("returns room objects with bnovoId and name fields", async () => {
    await seedRoom("r-1", "Студия");

    const res = await request(app).get("/api/admin/rooms");

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ bnovoId: "r-1", name: "Студия" });
  });
});

describe("GET /api/admin/coefficients", () => {
  it("returns coefficients joined with room names, sorted by room name", async () => {
    await seedRoom("r-2", "Стандарт", { coefficient1: 1.2 });
    await seedRoom("r-1", "Люкс", { coefficient1: 1.5 });

    const res = await request(app).get("/api/admin/coefficients");

    expect(res.status).toBe(200);
    const data = res.body.data as Array<{ bnovoId: string; roomName: string; coefficient1: number }>;
    expect(data[0].roomName).toBe("Люкс");
    expect(data[0].coefficient1).toBe(1.5);
    expect(data[1].roomName).toBe("Стандарт");
    expect(data[1].coefficient1).toBe(1.2);
  });

  it("returns empty array when no coefficients exist", async () => {
    const res = await request(app).get("/api/admin/coefficients");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("PATCH /api/admin/coefficients/:bnovoId", () => {
  it("updates a single coefficient field without affecting others", async () => {
    await seedRoom("r-1", "Студия", { coefficient1: 1, coefficient2: 1.2, coefficient3: 1.3 });

    const res = await request(app)
      .patch("/api/admin/coefficients/r-1")
      .send({ coefficient1: 1.5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coefficient1).toBe(1.5);
    expect(res.body.data.coefficient2).toBe(1.2);
    expect(res.body.data.coefficient3).toBe(1.3);
  });

  it("normalizes comma decimal separator to dot (e.g. '1,5' → 1.5)", async () => {
    await seedRoom("r-1", "Студия");

    const res = await request(app)
      .patch("/api/admin/coefficients/r-1")
      .send({ coefficient1: "1,5" });

    expect(res.status).toBe(200);
    expect(res.body.data.coefficient1).toBe(1.5);
  });

  it("updates multiple coefficient fields in a single PATCH", async () => {
    await seedRoom("r-1", "Студия");

    const res = await request(app)
      .patch("/api/admin/coefficients/r-1")
      .send({ coefficient1: 2, coefficient2: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.coefficient1).toBe(2);
    expect(res.body.data.coefficient2).toBe(3);
    expect(res.body.data.coefficient3).toBe(1); // unchanged default
  });

  it("returns 404 for non-existent bnovoId", async () => {
    const res = await request(app)
      .patch("/api/admin/coefficients/nonexistent")
      .send({ coefficient1: 1.5 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it.each([
    ["negative number", { coefficient1: -1 }],
    ["zero value", { coefficient1: 0 }],
    ["non-numeric string", { coefficient1: "abc" }],
    ["empty body (no fields)", {}],
  ])("returns 400 for invalid input: %s", async (_label, payload) => {
    await seedRoom("r-1", "Студия");

    const res = await request(app)
      .patch("/api/admin/coefficients/r-1")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
