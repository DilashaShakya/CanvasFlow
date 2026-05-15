import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { optionalAuth } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { boardsRouter } from "./routes/boards";
import { healthRouter } from "./routes/health";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));
  app.use(optionalAuth);

  app.get("/", (_request, response) => {
    response.json({
      name: "CanvasFlow API",
      status: "ok",
    });
  });

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/boards", boardsRouter);
  app.use(errorHandler);

  return app;
}
