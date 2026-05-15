import type { BoardScene, BoardShape } from "@canvasflow/shared";

export function emptyScene(boardId: string): BoardScene {
  return {
    boardId,
    version: 0,
    shapes: [],
    updatedAt: new Date().toISOString(),
  };
}

export function mergeScene(current: BoardScene, incoming: BoardScene): BoardScene {
  const byId = new Map<string, BoardShape>();

  for (const shape of current.shapes) {
    byId.set(shape.id, shape);
  }

  for (const shape of incoming.shapes) {
    const existing = byId.get(shape.id);
    if (!existing || shape.version >= existing.version) {
      byId.set(shape.id, shape);
    }
  }

  return {
    boardId: current.boardId,
    version: Math.max(current.version, incoming.version),
    updatedAt: incoming.updatedAt,
    shapes: [...byId.values()],
  };
}
