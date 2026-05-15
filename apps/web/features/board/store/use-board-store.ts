"use client";

import { create } from "zustand";

import type { BoardScene, BoardShape, CollaboratorPresence, CursorState, ShapeTool, ViewportState } from "@canvasflow/shared";

type SceneHistory = {
  past: BoardScene[];
  future: BoardScene[];
};

type BoardState = {
  boardId: string | null;
  title: string;
  scene: BoardScene | null;
  collaborators: CollaboratorPresence[];
  cursors: Record<string, CursorState>;
  tool: ShapeTool;
  stroke: string;
  fill: string;
  strokeWidth: number;
  selectedShapeId: string | null;
  viewport: ViewportState;
  history: SceneHistory;
  connectionStatus: "connecting" | "connected" | "reconnecting" | "offline";
  sessionId: string | null;
  lastChangeOrigin: "local" | "remote";
  bootstrap: (input: { boardId: string; title: string; scene: BoardScene; collaborators: CollaboratorPresence[] }) => void;
  setTool: (tool: ShapeTool) => void;
  setStyle: (patch: Partial<Pick<BoardState, "stroke" | "fill" | "strokeWidth">>) => void;
  replaceScene: (scene: BoardScene, pushHistory?: boolean) => void;
  upsertShape: (shape: BoardShape) => void;
  removeShape: (shapeId: string) => void;
  setCollaborators: (collaborators: CollaboratorPresence[]) => void;
  updateCursor: (cursor: CursorState) => void;
  removeCursor: (userId: string) => void;
  selectShape: (shapeId: string | null) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  undo: () => void;
  redo: () => void;
  setConnectionStatus: (status: BoardState["connectionStatus"]) => void;
  setSessionId: (sessionId: string) => void;
};

function cloneScene(scene: BoardScene): BoardScene {
  return {
    ...scene,
    shapes: scene.shapes.map((shape) => ({ ...shape })),
  };
}

function normalizeShape(shape: BoardShape): BoardShape {
  if (shape.type === "path") {
    const origin = shape.points[0];

    if (!origin || (origin.x === 0 && origin.y === 0)) {
      return shape;
    }

    return {
      ...shape,
      points: shape.points.map((point) => ({
        x: point.x - origin.x,
        y: point.y - origin.y,
      })),
    };
  }

  if (shape.type === "rectangle" && (shape.width < 0 || shape.height < 0)) {
    return {
      ...shape,
      x: shape.width < 0 ? shape.x + shape.width : shape.x,
      y: shape.height < 0 ? shape.y + shape.height : shape.y,
      width: Math.abs(shape.width),
      height: Math.abs(shape.height),
    };
  }

  return shape;
}

function normalizeScene(scene: BoardScene): BoardScene {
  return {
    ...scene,
    shapes: scene.shapes.map(normalizeShape),
  };
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boardId: null,
  title: "Untitled Board",
  scene: null,
  collaborators: [],
  cursors: {},
  tool: "select",
  stroke: "#18181B",
  fill: "rgba(24, 24, 27, 0.08)",
  strokeWidth: 3,
  selectedShapeId: null,
  viewport: { x: 0, y: 0, scale: 1 },
  history: { past: [], future: [] },
  connectionStatus: "connecting",
  sessionId: null,
  lastChangeOrigin: "remote",
  bootstrap: ({ boardId, title, scene, collaborators }) =>
    set({
      boardId,
      title,
      scene: normalizeScene(scene),
      collaborators,
      viewport: { x: 0, y: 0, scale: 1 },
      history: { past: [], future: [] },
      lastChangeOrigin: "remote",
    }),
  setTool: (tool) => set({ tool }),
  setStyle: (patch) => set(patch),
  replaceScene: (scene, pushHistory = false) =>
    set((state) => ({
      scene: normalizeScene(scene),
      history: pushHistory && state.scene ? { past: [...state.history.past, cloneScene(state.scene)], future: [] } : state.history,
      lastChangeOrigin: pushHistory ? "local" : "remote",
    })),
  upsertShape: (shape) =>
    set((state) => {
      if (!state.scene) {
        return state;
      }

      const previous = cloneScene(state.scene);
      const existingIndex = state.scene.shapes.findIndex((candidate) => candidate.id === shape.id);
      const nextShapes = [...state.scene.shapes];

      if (existingIndex === -1) {
        nextShapes.push(shape);
      } else {
        nextShapes[existingIndex] = shape;
      }

      return {
        scene: {
          ...state.scene,
          shapes: nextShapes,
          version: state.scene.version + 1,
          updatedAt: new Date().toISOString(),
        },
        history: {
          past: [...state.history.past, previous],
          future: [],
        },
        lastChangeOrigin: "local",
      };
    }),
  removeShape: (shapeId) =>
    set((state) => {
      if (!state.scene) {
        return state;
      }

      return {
        scene: {
          ...state.scene,
          shapes: state.scene.shapes.filter((shape) => shape.id !== shapeId),
          version: state.scene.version + 1,
          updatedAt: new Date().toISOString(),
        },
        history: {
          past: [...state.history.past, cloneScene(state.scene)],
          future: [],
        },
        lastChangeOrigin: "local",
      };
    }),
  setCollaborators: (collaborators) => set({ collaborators }),
  updateCursor: (cursor) =>
    set((state) => ({
      cursors: {
        ...state.cursors,
        [cursor.userId]: cursor,
      },
    })),
  removeCursor: (userId) =>
    set((state) => {
      const nextCursors = { ...state.cursors };
      delete nextCursors[userId];
      return { cursors: nextCursors };
    }),
  selectShape: (shapeId) => set({ selectedShapeId: shapeId }),
  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
    })),
  undo: () =>
    set((state) => {
      const previous = state.history.past.at(-1);
      if (!previous || !state.scene) {
        return state;
      }

      return {
        scene: previous,
        history: {
          past: state.history.past.slice(0, -1),
          future: [cloneScene(state.scene), ...state.history.future],
        },
        lastChangeOrigin: "local",
      };
    }),
  redo: () =>
    set((state) => {
      const next = state.history.future[0];
      if (!next || !state.scene) {
        return state;
      }

      return {
        scene: next,
        history: {
          past: [...state.history.past, cloneScene(state.scene)],
          future: state.history.future.slice(1),
        },
        lastChangeOrigin: "local",
      };
    }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSessionId: (sessionId) => set({ sessionId }),
}));
