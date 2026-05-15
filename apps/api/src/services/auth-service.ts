import bcrypt from "bcryptjs";
import createHttpError from "http-errors";

import type { AuthResponse } from "@canvasflow/shared";

import { prisma } from "../db/client";
import { pickAvatarColor } from "../lib/colors";
import { signAccessToken } from "../lib/jwt";

export const authService = {
  async register(input: { email: string; password: string; displayName: string }): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw createHttpError(409, "Email already registered");
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 10),
        displayName: input.displayName,
        avatarColor: pickAvatarColor(input.displayName),
        isGuest: false,
      },
    });

    const authUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isGuest: user.isGuest,
    };

    return {
      token: signAccessToken(authUser),
      user: authUser,
    };
  },

  async login(input: { email: string; password: string }): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user?.passwordHash) {
      throw createHttpError(401, "Invalid email or password");
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      throw createHttpError(401, "Invalid email or password");
    }

    const authUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isGuest: user.isGuest,
    };

    return {
      token: signAccessToken(authUser),
      user: authUser,
    };
  },

  async createGuestSession(displayName: string): Promise<AuthResponse> {
    const user = await prisma.user.create({
      data: {
        displayName,
        avatarColor: pickAvatarColor(displayName),
        isGuest: true,
      },
    });

    const authUser = {
      id: user.id,
      email: null,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      isGuest: user.isGuest,
    };

    return {
      token: signAccessToken(authUser),
      user: authUser,
    };
  },
};
