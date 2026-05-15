import { Router } from "express";

import { prisma } from "../db/client";

export const healthRouter = Router();

healthRouter.get("/", async (_request, response, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
