import type { AuthUser } from "@canvasflow/shared";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
