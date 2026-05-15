import { z } from "zod";

import { authUserSchema } from "../auth/schemas";
import { boardSceneSchema, collaboratorPresenceSchema, cursorStateSchema } from "../board/schemas";

export const boardSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  roomSlug: z.string(),
  visibility: z.enum(["private", "shared"]),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastSnapshotVersion: z.number().int().nonnegative(),
});

export const boardBootstrapSchema = z.object({
  board: boardSummarySchema,
  scene: boardSceneSchema,
  collaborators: z.array(collaboratorPresenceSchema),
});

export const createBoardSchema = z.object({
  title: z.string().min(3).max(80),
  visibility: z.enum(["private", "shared"]).default("private"),
});

export const updateBoardSchema = z.object({
  title: z.string().min(3).max(80).optional(),
  visibility: z.enum(["private", "shared"]).optional(),
});

export const joinBoardSchema = z.object({
  roomId: z.string().min(4),
});

export const persistSceneSchema = z.object({
  boardId: z.string(),
  scene: boardSceneSchema,
});

export const boardEventSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  type: z.enum(["shape.create", "shape.update", "shape.delete", "selection.change", "presence.editing"]),
  occurredAt: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export const boardSocketEventsSchema = z.object({
  "board:join": z.object({
    boardId: z.string(),
    sessionId: z.string().optional(),
  }),
  "board:leave": z.object({
    boardId: z.string(),
  }),
  "board:cursor": cursorStateSchema,
  "board:editing": z.object({
    boardId: z.string(),
    isEditing: z.boolean(),
  }),
  "board:scene_patch": z.object({
    boardId: z.string(),
    nextVersion: z.number().int().nonnegative(),
    scene: boardSceneSchema,
  }),
  "board:resync": z.object({
    boardId: z.string(),
  }),
});

export const sessionRecoverySchema = z.object({
  boardId: z.string(),
  sessionId: z.string(),
  user: authUserSchema,
});

export type BoardSummary = z.infer<typeof boardSummarySchema>;
export type BoardBootstrap = z.infer<typeof boardBootstrapSchema>;
