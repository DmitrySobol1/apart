import { config } from "../config.js";

export interface BookingParams {
  dfrom: string;
  dto: string;
  planId: number;
  adults: number;
  roomTypeId: string;
  guest: {
    name: string;
    surname: string;
    phone: string;
    email: string;
    notes?: string;
  };
}

export interface BookingResult {
  bookingNumber: string;
  paymentUrl: string;
  amount: number;
}

export async function createBooking(params: BookingParams): Promise<BookingResult> {
  const { dfrom, dto, planId, adults, roomTypeId, guest } = params;

  const roomTypes = JSON.stringify({ [roomTypeId]: { c: 1, bv: 3 } });

  const body = new URLSearchParams({
    servicemode: "0",
    firstroom: "0",
    dfrom,
    dto,
    planId: String(planId),
    adults: String(adults),
    children: "",
    promoCode: "",
    roomTypes,
    roomtypeUpgrade: "",
    services: "",
    orderItems: "",
    lang: "ru",
    warrantyType: "onlinepay",
    orderid: "",
    moneywall_enabled: "0",
    currency: "",
    mobile_id: "0",
    guarantee: "1",
    "customer[name]": guest.name,
    "customer[surname]": guest.surname,
    "customer[phone]": guest.phone,
    "customer[email]": guest.email,
    "customer[notes]": guest.notes ?? "",
  });

  const url = `${config.bnovoBookingUrl}/bookings/post/${config.bnovo.uid}`;

  const response = await fetch(url, {
    method: "POST",
    redirect: "manual",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(15000),
  });

  if (response.status !== 302) {
    const text = await response.text().catch(() => "");
    console.error(`Bnovo booking failed: unexpected status ${response.status}`, text.slice(0, 500));
    throw new Error(`Bnovo booking failed: unexpected response status ${response.status}`);
  }

  const location = response.headers.get("Location");
  if (!location) {
    throw new Error("Bnovo booking failed: Location header missing in 302 response");
  }

  const base = "https://reservationsteps.ru";
  const locationUrl = new URL(location, base);
  const bookingNumber = locationUrl.searchParams.get("bookingNumber");
  const rawAmount = locationUrl.searchParams.get("bookingAccommodationAmount");
  const rawRedirectUrl = locationUrl.searchParams.get("redirectUrl");

  if (!bookingNumber || rawAmount === null || !rawRedirectUrl) {
    console.error("Bnovo booking failed: could not parse Location header:", location);
    throw new Error("Bnovo booking failed: could not parse redirect");
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount)) {
    console.error("Bnovo booking failed: bookingAccommodationAmount is NaN, Location:", location);
    throw new Error("Bnovo booking failed: bookingAccommodationAmount is not a number");
  }

  const decodedRedirectUrl = decodeURIComponent(rawRedirectUrl);
  const redirectUrl = new URL(decodedRedirectUrl, base);
  const paymentUrl = redirectUrl.searchParams.get("away_url");

  if (!paymentUrl) {
    console.error("Bnovo booking failed: away_url is empty, redirectUrl:", decodedRedirectUrl);
    throw new Error("Bnovo booking failed: payment URL is empty or unparseable");
  }

  return { bookingNumber, paymentUrl, amount };
}
