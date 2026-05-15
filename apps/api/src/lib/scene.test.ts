import { describe, expect, it } from "vitest";

import type { BoardScene } from "@canvasflow/shared";

import { emptyScene, mergeScene } from "./scene";

describe("scene helpers", () => {
  it("creates an empty board scene", () => {
    const scene = emptyScene("board-1");

    expect(scene.boardId).toBe("board-1");
    expect(scene.shapes).toEqual([]);
  });

  it("merges the latest version of shapes by id", () => {
    const baseShape = {
      id: "shape-1",
      type: "rectangle" as const,
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      rotation: 0,
      stroke: "#000",
      strokeWidth: 2,
      fill: "transparent",
      version: 1,
      createdBy: "user-1",
      updatedAt: new Date().toISOString(),
    };

    const current: BoardScene = {
      boardId: "board-1",
      version: 1,
      updatedAt: new Date().toISOString(),
      shapes: [baseShape],
    };

    const incoming: BoardScene = {
      ...current,
      version: 2,
      shapes: [
        {
          ...baseShape,
          version: 2,
          x: 40,
        },
      ],
    };

    const merged = mergeScene(current, incoming);

    expect(merged.version).toBe(2);
    expect(merged.shapes[0]?.x).toBe(40);
  });
});
