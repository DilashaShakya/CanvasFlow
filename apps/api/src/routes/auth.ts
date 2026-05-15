import { Router } from "express";

import { guestSessionSchema, loginSchema, registerSchema } from "@canvasflow/shared";

import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { authService } from "../services/auth-service";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), async (request, response, next) => {
  try {
    response.status(201).json(await authService.register(request.body));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", validateBody(loginSchema), async (request, response, next) => {
  try {
    response.json(await authService.login(request.body));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/guest", validateBody(guestSessionSchema), async (request, response, next) => {
  try {
    response.status(201).json(await authService.createGuestSession(request.body.displayName));
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (request, response) => {
  response.json({ user: request.authUser });
});
