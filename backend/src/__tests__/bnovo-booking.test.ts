import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UID = "test-uid";
const BOOKING_NUMBER = "12345_081026";
const AMOUNT_STR = "5500";
const PAYMENT_URL = "https://payment.bnovo.ru/v2/?transaction=book_abc123";

/**
 * Build a valid Location header value that the service would receive from Bnovo.
 * redirectUrl is a URL-encoded path+query that contains away_url as a query param.
 */
function buildLocation(opts: {
  bookingNumber?: string;
  amount?: string;
  redirectUrl?: string;
  omitBookingNumber?: boolean;
  omitAmount?: boolean;
  omitRedirectUrl?: boolean;
}): string {
  const awayPath = `/away/index/${UID}?away_url=${encodeURIComponent(PAYMENT_URL)}`;
  const redirectUrl = opts.redirectUrl ?? awayPath;

  const params = new URLSearchParams();
  if (!opts.omitBookingNumber) {
    params.set("bookingNumber", opts.bookingNumber ?? BOOKING_NUMBER);
  }
  if (!opts.omitAmount) {
    params.set("bookingAccommodationAmount", opts.amount ?? AMOUNT_STR);
  }
  if (!opts.omitRedirectUrl) {
    params.set("redirectUrl", redirectUrl);
  }

  return `/bookings/preSuccess/${UID}?${params.toString()}`;
}

/**
 * Create a minimal fetch mock that returns a 302 with the given Location header.
 */
function make302Response(location: string): Response {
  return {
    status: 302,
    headers: {
      get: (name: string) => (name.toLowerCase() === "location" ? location : null),
    },
    text: () => Promise.resolve(""),
  } as unknown as Response;
}

/**
 * Create a minimal fetch mock that returns a non-302 response.
 */
function makeNon302Response(status: number, body: string = ""): Response {
  return {
    status,
    headers: { get: () => null },
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

const GUEST = { name: "A", surname: "B", phone: "+79991234567", email: "a@b.com" };
const BASE_PARAMS = {
  dfrom: "08-10-2026",
  dto: "09-10-2026",
  planId: 128501,
  adults: 2,
  roomTypeId: "274552",
  guest: GUEST,
};

// ---------------------------------------------------------------------------
// Unit tests: createBooking service (real module, mocked global fetch)
// ---------------------------------------------------------------------------

describe("createBooking service", () => {
  // Import the real module once — vi.mock is NOT used in this describe block.
  // We stub global.fetch per test to avoid real network calls.
  let createBooking: (params: typeof BASE_PARAMS) => Promise<unknown>;

  beforeEach(async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn());
    // Dynamic import inside beforeEach ensures we get a fresh reference.
    const mod = await import("../services/bnovo-booking.js");
    createBooking = mod.createBooking;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with correct bookingNumber, paymentUrl, and amount on valid 302", async () => {
    const location = buildLocation({});
    vi.mocked(fetch).mockResolvedValueOnce(make302Response(location));

    const result = await createBooking({
      ...BASE_PARAMS,
      guest: {
        name: "Иван",
        surname: "Иванов",
        phone: "+79991234567",
        email: "ivan@mail.ru",
        notes: "",
      },
    });

    expect((result as { bookingNumber: string }).bookingNumber).toBe(BOOKING_NUMBER);
    expect((result as { paymentUrl: string }).paymentUrl).toBe(PAYMENT_URL);
    expect((result as { amount: number }).amount).toBe(5500);
  });

  it("sends correct form fields in request body", async () => {
    const location = buildLocation({});
    vi.mocked(fetch).mockResolvedValueOnce(make302Response(location));

    await createBooking({
      dfrom: "08-10-2026",
      dto: "09-10-2026",
      planId: 128501,
      adults: 2,
      roomTypeId: "274552",
      guest: {
        name: "Иван",
        surname: "Иванов",
        phone: "+79991234567",
        email: "ivan@mail.ru",
      },
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [, options] = vi.mocked(fetch).mock.calls[0];
    const body = options?.body as URLSearchParams;

    expect(body.get("dfrom")).toBe("08-10-2026");
    expect(body.get("dto")).toBe("09-10-2026");
    expect(body.get("planId")).toBe("128501");
    expect(body.get("adults")).toBe("2");
    expect(body.get("warrantyType")).toBe("onlinepay");
    expect(body.get("roomTypes")).toBe(JSON.stringify({ "274552": { c: 1, bv: 3 } }));
    expect(body.get("customer[name]")).toBe("Иван");
    expect(body.get("customer[surname]")).toBe("Иванов");
    expect(body.get("customer[phone]")).toBe("+79991234567");
    expect(body.get("customer[email]")).toBe("ivan@mail.ru");
  });

  it("throws when Bnovo returns non-302 status", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(makeNon302Response(200, "<html>Error</html>"));

    await expect(createBooking(BASE_PARAMS)).rejects.toThrow("unexpected response status 200");
  });

  it("throws when Location header is missing from 302 response", async () => {
    const response = {
      status: 302,
      headers: { get: () => null },
      text: () => Promise.resolve(""),
    } as unknown as Response;
    vi.mocked(fetch).mockResolvedValueOnce(response);

    await expect(createBooking(BASE_PARAMS)).rejects.toThrow("Location header missing");
  });

  it("throws when Location header is missing required query params", async () => {
    const location = `/bookings/preSuccess/${UID}?irrelevant=1`;
    vi.mocked(fetch).mockResolvedValueOnce(make302Response(location));

    await expect(createBooking(BASE_PARAMS)).rejects.toThrow("could not parse redirect");
  });

  it("throws when bookingAccommodationAmount is not a number", async () => {
    const location = buildLocation({ amount: "abc" });
    vi.mocked(fetch).mockResolvedValueOnce(make302Response(location));

    await expect(createBooking(BASE_PARAMS)).rejects.toThrow(
      "bookingAccommodationAmount is not a number",
    );
  });

  it("throws when redirectUrl contains no away_url param", async () => {
    const redirectUrlWithoutAwayUrl = `/away/index/${UID}?other=value`;
    const location = buildLocation({ redirectUrl: redirectUrlWithoutAwayUrl });
    vi.mocked(fetch).mockResolvedValueOnce(make302Response(location));

    await expect(createBooking(BASE_PARAMS)).rejects.toThrow(
      "payment URL is empty or unparseable",
    );
  });

  it("propagates network error when fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network connection refused"));

    await expect(createBooking(BASE_PARAMS)).rejects.toThrow("Network connection refused");
  });
});

// ---------------------------------------------------------------------------
// Route integration tests: POST /api/booking (mocked createBooking)
// ---------------------------------------------------------------------------

describe("POST /api/booking route", () => {
  const VALID_PAYLOAD = {
    dfrom: "08-10-2026",
    dto: "09-10-2026",
    planId: 128501,
    adults: 2,
    roomTypeId: "274552",
    guest: {
      name: "Иван",
      surname: "Иванов",
      phone: "+79991234567",
      email: "ivan@mail.ru",
    },
  };

  let app: express.Express;
  let mockCreateBooking: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();

    mockCreateBooking = vi.fn();

    // Use doMock (non-hoisted) so we can control the mock per test
    vi.doMock("../services/bnovo-booking.js", () => ({
      createBooking: mockCreateBooking,
    }));

    const instance = express();
    instance.use(express.json());
    const [bookingRouter, { errorHandler }] = await Promise.all([
      import("../routes/booking.js").then((m) => m.default),
      import("../middleware/error-handler.js"),
    ]);
    instance.use("/api/booking", bookingRouter);
    instance.use(errorHandler);
    app = instance;
  });

  afterEach(() => {
    vi.doUnmock("../services/bnovo-booking.js");
  });

  it("returns 200 with bookingNumber, paymentUrl, and amount on success", async () => {
    mockCreateBooking.mockResolvedValueOnce({
      bookingNumber: BOOKING_NUMBER,
      paymentUrl: PAYMENT_URL,
      amount: 5500,
    });

    const res = await request(app).post("/api/booking").send(VALID_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      bookingNumber: BOOKING_NUMBER,
      paymentUrl: PAYMENT_URL,
      amount: 5500,
    });
  });

  it("returns 500 with success:false when createBooking throws", async () => {
    mockCreateBooking.mockRejectedValueOnce(
      new Error("Bnovo booking failed: unexpected response status 200"),
    );

    const res = await request(app).post("/api/booking").send(VALID_PAYLOAD);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Bnovo booking failed");
  });

  it("returns 400 when guest phone format is invalid", async () => {
    const payload = {
      ...VALID_PAYLOAD,
      guest: { ...VALID_PAYLOAD.guest, phone: "89991234567" },
    };

    const res = await request(app).post("/api/booking").send(payload);

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("returns 400 when dto is not after dfrom", async () => {
    const payload = { ...VALID_PAYLOAD, dfrom: "09-10-2026", dto: "08-10-2026" };

    const res = await request(app).post("/api/booking").send(payload);

    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/booking")
      .send({ dfrom: "08-10-2026", dto: "09-10-2026" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});
