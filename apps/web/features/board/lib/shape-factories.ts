"use client";

import { nanoid } from "nanoid";

import type { BoardShape, Point, ShapeTool } from "@canvasflow/shared";

type ShapeStyle = {
  stroke: string;
  fill: string;
  strokeWidth: number;
  createdBy: string;
};

export function createShapeFromDrag(tool: ShapeTool, start: Point, end: Point, style: ShapeStyle): BoardShape | null {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const timestamp = new Date().toISOString();

  if (tool === "rectangle") {
    return {
      id: nanoid(),
      type: "rectangle",
      x,
      y,
      width,
      height,
      rotation: 0,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      fill: style.fill,
      version: 1,
      createdBy: style.createdBy,
      updatedAt: timestamp,
    };
  }

  if (tool === "ellipse") {
    return {
      id: nanoid(),
      type: "ellipse",
      x: x + width / 2,
      y: y + height / 2,
      radiusX: width / 2,
      radiusY: height / 2,
      rotation: 0,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      fill: style.fill,
      version: 1,
      createdBy: style.createdBy,
      updatedAt: timestamp,
    };
  }

  return null;
}

export function createTextShape(position: Point, text: string, style: ShapeStyle): BoardShape {
  return {
    id: nanoid(),
    type: "text",
    x: position.x,
    y: position.y,
    rotation: 0,
    stroke: style.stroke,
    strokeWidth: 1,
    fill: "transparent",
    version: 1,
    createdBy: style.createdBy,
    updatedAt: new Date().toISOString(),
    text,
    fontSize: 18,
  };
}

export function createPathShape(points: Point[], style: ShapeStyle): BoardShape {
  const origin = points[0] ?? { x: 0, y: 0 };

  return {
    id: nanoid(),
    type: "path",
    x: origin.x,
    y: origin.y,
    rotation: 0,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    fill: "transparent",
    version: 1,
    createdBy: style.createdBy,
    updatedAt: new Date().toISOString(),
    points: points.map((point) => ({
      x: point.x - origin.x,
      y: point.y - origin.y,
    })),
  };
}
