import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config";
import roomsRouter from "./routes/rooms";
import plansRouter from "./routes/plans";
import amenitiesRouter from "./routes/amenities";
import accountRouter from "./routes/account";
import bookingRouter from "./routes/booking";
import { errorHandler } from "./middleware/error-handler";
import adminRouter from "./routes/admin";

const app = express();

const allowedOrigins = [config.frontendUrl, config.adminUrl].filter(
  (origin): origin is string => Boolean(origin),
);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/rooms", roomsRouter);
app.use("/api/plans", plansRouter);
app.use("/api/amenities", amenitiesRouter);
app.use("/api/account", accountRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);

mongoose.connect(config.mongodbUri).catch((err: unknown) => {
  console.warn("MongoDB connection failed, continuing without DB:", err);
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
