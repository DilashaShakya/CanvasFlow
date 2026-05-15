import jwt from "jsonwebtoken";

import type { AuthUser } from "@canvasflow/shared";

import { env } from "../config/env";

type TokenPayload = {
  sub: string;
  email: string | null;
  displayName: string;
  avatarColor: string;
  isGuest: boolean;
};

export function signAccessToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isGuest: user.isGuest,
    } satisfies TokenPayload,
    env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

  return {
    id: payload.sub,
    email: payload.email,
    displayName: payload.displayName,
    avatarColor: payload.avatarColor,
    isGuest: payload.isGuest,
  };
}
