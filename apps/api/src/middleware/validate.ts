import createHttpError from "http-errors";
import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export function validateBody<T>(schema: ZodType<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return next(createHttpError(400, result.error.flatten().formErrors.join(", ") || "Invalid request body"));
    }

    request.body = result.data;
    return next();
  };
}
