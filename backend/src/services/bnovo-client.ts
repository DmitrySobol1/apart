import axios from "axios";
import { config } from "../config";

const client = axios.create({
  baseURL: config.bnovo.apiBase,
  timeout: 10_000,
});

export const bnovoClient = {
  getRooms: (dfrom: string, dto: string) =>
    client.get("/rooms", {
      params: { account_id: config.bnovo.accountId, dfrom, dto },
    }),

  getPlans: () =>
    client.get("/plans", {
      params: { account_id: config.bnovo.accountId },
    }),

  getAmenities: () => client.get("/amenities"),

  getAccount: () =>
    client.get("/accounts", {
      params: { uid: config.bnovo.uid },
    }),
};
