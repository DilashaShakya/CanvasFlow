import { z } from "zod";

export const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const shapeBaseSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  stroke: z.string(),
  strokeWidth: z.number().min(1).max(24),
  fill: z.string(),
  version: z.number().int().nonnegative(),
  createdBy: z.string(),
  updatedAt: z.string(),
});

export const pathShapeSchema = shapeBaseSchema.extend({
  type: z.literal("path"),
  points: z.array(pointSchema).min(1),
});

export const rectangleShapeSchema = shapeBaseSchema.extend({
  type: z.literal("rectangle"),
  width: z.number(),
  height: z.number(),
});

export const ellipseShapeSchema = shapeBaseSchema.extend({
  type: z.literal("ellipse"),
  radiusX: z.number(),
  radiusY: z.number(),
});

export const textShapeSchema = shapeBaseSchema.extend({
  type: z.literal("text"),
  text: z.string(),
  fontSize: z.number().min(10).max(96),
});

export const boardShapeSchema = z.discriminatedUnion("type", [
  pathShapeSchema,
  rectangleShapeSchema,
  ellipseShapeSchema,
  textShapeSchema,
]);

export const boardSceneSchema = z.object({
  boardId: z.string(),
  version: z.number().int().nonnegative(),
  shapes: z.array(boardShapeSchema),
  updatedAt: z.string(),
});

export const collaboratorPresenceSchema = z.object({
  userId: z.string(),
  username: z.string(),
  color: z.string(),
  isEditing: z.boolean(),
  lastSeenAt: z.string(),
});

export const cursorStateSchema = z.object({
  userId: z.string(),
  username: z.string(),
  color: z.string(),
  x: z.number(),
  y: z.number(),
  boardId: z.string(),
  updatedAt: z.string(),
});
