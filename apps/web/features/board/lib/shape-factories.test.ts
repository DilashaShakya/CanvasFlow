import { describe, expect, it } from "vitest";

import { createPathShape, createShapeFromDrag, createTextShape } from "./shape-factories";

describe("shape factories", () => {
  const style = {
    stroke: "#5D3521",
    fill: "rgba(93, 53, 33, 0.14)",
    strokeWidth: 3,
    createdBy: "user-1",
  };

  it("creates a rectangle from drag coordinates", () => {
    const shape = createShapeFromDrag("rectangle", { x: 10, y: 20 }, { x: 80, y: 140 }, style);

    expect(shape).toMatchObject({
      type: "rectangle",
      x: 10,
      y: 20,
      width: 70,
      height: 120,
    });
  });

  it("normalizes rectangles when dragging up and left", () => {
    const shape = createShapeFromDrag("rectangle", { x: 80, y: 140 }, { x: 10, y: 20 }, style);

    expect(shape).toMatchObject({
      type: "rectangle",
      x: 10,
      y: 20,
      width: 70,
      height: 120,
    });
  });

  it("uses ellipse center coordinates for Konva rendering", () => {
    const shape = createShapeFromDrag("ellipse", { x: 10, y: 20 }, { x: 80, y: 140 }, style);

    expect(shape).toMatchObject({
      type: "ellipse",
      x: 45,
      y: 80,
      radiusX: 35,
      radiusY: 60,
    });
  });

  it("creates a text shape with the provided content", () => {
    const shape = createTextShape({ x: 40, y: 50 }, "Hello world", style);

    expect(shape.type).toBe("text");
    if (shape.type !== "text") {
      throw new Error("Expected a text shape");
    }

    expect(shape.text).toBe("Hello world");
  });

  it("creates a path shape from collected pencil points", () => {
    const shape = createPathShape(
      [
        { x: 0, y: 0 },
        { x: 12, y: 20 },
      ],
      style,
    );

    expect(shape.type).toBe("path");
    if (shape.type !== "path") {
      throw new Error("Expected a path shape");
    }

    expect(shape).toMatchObject({
      x: 0,
      y: 0,
      points: [
        { x: 0, y: 0 },
        { x: 12, y: 20 },
      ],
    });
  });

  it("stores pencil points relative to the path origin", () => {
    const shape = createPathShape(
      [
        { x: 50, y: 60 },
        { x: 62, y: 80 },
      ],
      style,
    );

    expect(shape).toMatchObject({
      x: 50,
      y: 60,
      points: [
        { x: 0, y: 0 },
        { x: 12, y: 20 },
      ],
    });
  });
});
