import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(3000),
  nodeEnv: z.string().default("development"),
  frontendUrl: z.string().default("http://localhost:5173"),
  mongodbUri: z.string().default("mongodb://localhost:27017/apart-nn"),
  adminUrl: z.string().optional(),
  bnovoBookingUrl: z.string().default("https://reservationsteps.ru"),
  bnovo: z.object({
    uid: z.string().min(1),
    accountId: z.string().min(1),
    apiBase: z.string().url(),
  }),
});

export const config = configSchema.parse({
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  frontendUrl: process.env.FRONTEND_URL,
  mongodbUri: process.env.MONGODB_URI,
  adminUrl: process.env.ADMIN_URL,
  bnovoBookingUrl: process.env.BNOVO_BOOKING_URL,
  bnovo: {
    uid: process.env.BNOVO_UID,
    accountId: process.env.BNOVO_ACCOUNT_ID,
    apiBase: process.env.BNOVO_API_BASE,
  },
});

export type Config = typeof config;
