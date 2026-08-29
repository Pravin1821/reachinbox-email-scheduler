import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error("[error]", err);
  const isDev = process.env.NODE_ENV !== "production";
  res.status(err.status || 500).json({
    error: isDev ? (err.message || "Internal server error") : "Internal server error",
  });
}