import type { NextFunction, Request, Response } from "express";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  const status = typeof error === "object" && error !== null && "statusCode" in error ? Number(error.statusCode) : 500;
  const message = typeof error === "object" && error !== null && "message" in error ? String(error.message) : "Unexpected error";

  response.status(status).json({
    error: {
      message,
      status,
    },
  });
}
