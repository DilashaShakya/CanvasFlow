import createHttpError from "http-errors";
import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/jwt";

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(createHttpError(401, "Missing Bearer token"));
  }

  try {
    request.authUser = verifyAccessToken(header.slice("Bearer ".length));
    return next();
  } catch {
    return next(createHttpError(401, "Invalid access token"));
  }
}

export function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    try {
      request.authUser = verifyAccessToken(header.slice("Bearer ".length));
    } catch {
      request.authUser = undefined;
    }
  }

  return next();
}
