import { Router, Request, Response } from "express";
import { z } from "zod";
import { createBooking } from "../services/bnovo-booking.js";

const router = Router();

const DD_MM_YYYY = /^\d{2}-\d{2}-\d{4}$/;
const PHONE_RU = /^\+7\d{10}$/;

function parseDate(ddmmyyyy: string): Date {
  const [dd, mm, yyyy] = ddmmyyyy.split("-");
  return new Date(`${yyyy}-${mm}-${dd}`);
}

const bookingSchema = z.object({
  dfrom: z.string().regex(DD_MM_YYYY, "dfrom must be in DD-MM-YYYY format"),
  dto: z.string().regex(DD_MM_YYYY, "dto must be in DD-MM-YYYY format"),
  planId: z.number().int().positive(),
  adults: z.number().int().min(1),
  roomTypeId: z.coerce.string().min(1, "roomTypeId must be a non-empty string"),
  guest: z.object({
    name: z.string().min(1, "guest.name must be a non-empty string"),
    surname: z.string().min(1, "guest.surname must be a non-empty string"),
    phone: z.string().regex(PHONE_RU, "guest.phone must be in +7XXXXXXXXXX format"),
    email: z.string().email("guest.email must be a valid email"),
    notes: z.string().optional(),
  }),
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = bookingSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    return;
  }

  const { dfrom, dto, planId, adults, roomTypeId, guest } = parsed.data;

  if (parseDate(dto) <= parseDate(dfrom)) {
    res.status(400).json({ errors: { dto: ["dto must be after dfrom"] } });
    return;
  }

  console.log(new Date().toISOString(), "booking attempt", { roomTypeId, dfrom, dto, email: guest.email });

  try {
    const { bookingNumber, paymentUrl, amount } = await createBooking({ dfrom, dto, planId, adults, roomTypeId, guest });
    console.log(new Date().toISOString(), "booking success", { bookingNumber, amount });
    res.json({ success: true, bookingNumber, paymentUrl, amount });
  } catch (err) {
    console.error(new Date().toISOString(), "booking error", err);
    const message = err instanceof Error ? err.message : "Bnovo booking failed: unknown error";
    res.status(500).json({ success: false, message });
  }
});

export default router;
