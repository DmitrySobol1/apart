import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

vi.mock("../services/bnovo-client", () => ({
  bnovoClient: {
    getRooms: vi.fn().mockResolvedValue({ data: { rooms: [{ id: "room-1", name: "Suite" }] } }),
    getPlans: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Standard" }] }),
    getAmenities: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "WiFi" }] }),
    getAccount: vi.fn().mockResolvedValue({ data: { account: { name: "Apart NN" } } }),
  },
}));

vi.mock("../services/room-ranking", () => ({
  applyRoomRanking: vi.fn().mockImplementation((rooms: unknown[]) =>
    Promise.resolve(rooms.map((r) => ({ ...(r as Record<string, unknown>), numToShowOnFrontend: 3 }))),
  ),
}));

vi.mock("../services/bnovo-booking", () => ({
  createBooking: vi.fn().mockResolvedValue({
    bookingNumber: "12345_010626",
    paymentUrl: "https://payment.bnovo.ru/v2/?transaction=book_test",
    amount: 5500,
  }),
}));

async function buildApp(): Promise<express.Express> {
  const app = express();
  app.use(express.json());

  const [
    roomsRouter,
    plansRouter,
    amenitiesRouter,
    accountRouter,
    bookingRouter,
    { errorHandler },
  ] = await Promise.all([
    import("../routes/rooms").then((m) => m.default),
    import("../routes/plans").then((m) => m.default),
    import("../routes/amenities").then((m) => m.default),
    import("../routes/account").then((m) => m.default),
    import("../routes/booking").then((m) => m.default),
    import("../middleware/error-handler"),
  ]);

  app.use("/api/rooms", roomsRouter);
  app.use("/api/plans", plansRouter);
  app.use("/api/amenities", amenitiesRouter);
  app.use("/api/account", accountRouter);
  app.use("/api/booking", bookingRouter);
  app.use(errorHandler);

  return app;
}

describe("Backend API", () => {
  let app: express.Express;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("GET proxy endpoints return data", () => {
    it("GET /api/plans returns array data", async () => {
      const res = await request(app).get("/api/plans");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("GET /api/amenities returns array data", async () => {
      const res = await request(app).get("/api/amenities");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("GET /api/account returns object data", async () => {
      const res = await request(app).get("/api/account");

      expect(res.status).toBe(200);
      expect(typeof res.body).toBe("object");
    });

    it("GET /api/rooms with valid dates returns array data", async () => {
      const res = await request(app).get("/api/rooms?dfrom=01-06-2026&dto=05-06-2026");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/rooms date validation", () => {
    it.each([
      ["missing dfrom", "/api/rooms?dto=05-06-2026"],
      ["missing dto", "/api/rooms?dfrom=01-06-2026"],
      ["wrong dfrom format", "/api/rooms?dfrom=2026-06-01&dto=05-06-2026"],
      ["wrong dto format", "/api/rooms?dfrom=01-06-2026&dto=2026-06-05"],
    ])("returns 400 when %s", async (_label, path) => {
      const res = await request(app).get(path);

      expect(res.status).toBe(400);
    });

    it("returns 400 when dto is same as dfrom", async () => {
      const res = await request(app).get("/api/rooms?dfrom=01-06-2026&dto=01-06-2026");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("dto must be after dfrom");
    });

    it("returns 400 when dto is before dfrom", async () => {
      const res = await request(app).get("/api/rooms?dfrom=05-06-2026&dto=01-06-2026");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("dto must be after dfrom");
    });
  });

  describe("POST /api/booking validation", () => {
    const validBooking = {
      dfrom: "01-06-2026",
      dto: "05-06-2026",
      planId: 1,
      adults: 2,
      roomTypeId: "room-type-abc",
      guest: {
        name: "Ivan",
        surname: "Petrov",
        phone: "+79001234567",
        email: "ivan@example.com",
      },
    };

    it("returns 200 with valid booking payload", async () => {
      const res = await request(app).post("/api/booking").send(validBooking);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it.each([
      ["missing guest name", { ...validBooking, guest: { ...validBooking.guest, name: "" } }],
      ["missing guest surname", { ...validBooking, guest: { ...validBooking.guest, surname: "" } }],
      [
        "invalid phone format",
        { ...validBooking, guest: { ...validBooking.guest, phone: "89001234567" } },
      ],
      [
        "invalid email",
        { ...validBooking, guest: { ...validBooking.guest, email: "not-an-email" } },
      ],
      ["negative adults", { ...validBooking, adults: 0 }],
      ["empty roomTypeId", { ...validBooking, roomTypeId: "" }],
      ["invalid dfrom format", { ...validBooking, dfrom: "2026-06-01" }],
    ])("returns 400 when %s", async (_label, payload) => {
      const res = await request(app).post("/api/booking").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("returns 400 when dto is not after dfrom", async () => {
      const payload = { ...validBooking, dfrom: "05-06-2026", dto: "01-06-2026" };
      const res = await request(app).post("/api/booking").send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe("Credential isolation", () => {
    it("GET /api/plans response body does not contain BNOVO_UID", async () => {
      const res = await request(app).get("/api/plans");
      const body = JSON.stringify(res.body);

      expect(body).not.toContain("BNOVO_UID");
      expect(body).not.toContain("test-uid");
    });

    it("GET /api/rooms response body does not contain BNOVO_ACCOUNT_ID", async () => {
      const res = await request(app).get("/api/rooms?dfrom=01-06-2026&dto=05-06-2026");
      const body = JSON.stringify(res.body);

      expect(body).not.toContain("BNOVO_ACCOUNT_ID");
      expect(body).not.toContain("test-account-id");
    });

    it("POST /api/booking response body does not contain Bnovo credentials", async () => {
      const res = await request(app)
        .post("/api/booking")
        .send({
          dfrom: "01-06-2026",
          dto: "05-06-2026",
          planId: 1,
          adults: 2,
          roomTypeId: "room-type-abc",
          guest: {
            name: "Ivan",
            surname: "Petrov",
            phone: "+79001234567",
            email: "ivan@example.com",
          },
        });
      const body = JSON.stringify(res.body);

      expect(body).not.toContain("BNOVO_UID");
      expect(body).not.toContain("BNOVO_ACCOUNT_ID");
    });
  });
});
