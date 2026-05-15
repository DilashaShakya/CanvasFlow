import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(40),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const guestSessionSchema = z.object({
  displayName: z.string().min(2).max(40),
});

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  displayName: z.string(),
  avatarColor: z.string(),
  isGuest: z.boolean(),
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
