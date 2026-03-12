import { Request, Response, NextFunction } from "express";
import axios from "axios";

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
      console.error(`[${timestamp}] Upstream API timeout:`, err.message);
      res.status(504).json({ error: "Upstream API timeout" });
      return;
    }
    console.error(`[${timestamp}] Upstream API error:`, err.message);
    res.status(502).json({ error: "Upstream API error" });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  console.error(`[${timestamp}] Error ${statusCode}:`, err.message);
  res.status(statusCode).json({ error: err.message });
}
