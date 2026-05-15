import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  SOCKET_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(240),
  AUTO_SAVE_DEBOUNCE_MS: z.coerce.number().default(1500),
});

export const env = envSchema.parse(process.env);
