import "dotenv/config";
import mongoose from "mongoose";
import { config } from "../config";
import { syncRooms } from "../services/room-sync";

async function main(): Promise<void> {
  await mongoose.connect(config.mongodbUri);
  console.log("[seed-rooms] Connected to MongoDB");

  await syncRooms();

  await mongoose.disconnect();
  console.log("[seed-rooms] Disconnected from MongoDB");
}

main().catch((err) => {
  console.error("[seed-rooms] Fatal error:", err);
  process.exit(1);
});
