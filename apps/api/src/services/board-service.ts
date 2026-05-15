import { BoardEventType, type BoardVisibility } from "@prisma/client";
import createHttpError from "http-errors";
import { customAlphabet } from "nanoid";

import type { AuthUser, BoardScene } from "@canvasflow/shared";

import {
  createBoardEvent,
  createBoardRecord,
  createBoardSnapshot,
  ensureMembership,
  extractScene,
  getBoardByRoom,
  getBoardWithRelations,
  listBoardsForUser,
  updateBoardRecord,
} from "../db/repositories/board-repository";
import { emptyScene } from "../lib/scene";
import { env } from "../config/env";

const createRoomId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 10);

type BoardSummary = {
  id: string;
  title: string;
  roomSlug: string;
  visibility: "private" | "shared";
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastSnapshotVersion: number;
};

type AutosaveEntry = {
  scene: BoardScene;
  timer: NodeJS.Timeout;
  actorId?: string;
  actorName: string;
};

const sceneCache = new Map<string, BoardScene>();
const autosaveQueue = new Map<string, AutosaveEntry>();

function serializeBoard(board: {
  id: string;
  title: string;
  roomSlug: string;
  visibility: BoardVisibility;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSnapshotVersion: number;
}): BoardSummary {
  return {
    id: board.id,
    title: board.title,
    roomSlug: board.roomSlug,
    visibility: board.visibility,
    ownerId: board.ownerId,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
    lastSnapshotVersion: board.lastSnapshotVersion,
  };
}

async function flushAutosave(boardId: string) {
  const entry = autosaveQueue.get(boardId);
  if (!entry) {
    return;
  }

  autosaveQueue.delete(boardId);
  clearTimeout(entry.timer);

  await createBoardSnapshot({
    boardId,
    version: entry.scene.version,
    scene: entry.scene,
    actorId: entry.actorId,
  });

  await updateBoardRecord(boardId, {
    lastSnapshotVersion: entry.scene.version,
  });

  sceneCache.set(boardId, entry.scene);
}

function queueAutosave(boardId: string, scene: BoardScene, actor: Pick<AuthUser, "id" | "displayName">) {
  const existing = autosaveQueue.get(boardId);
  if (existing) {
    clearTimeout(existing.timer);
  }

  const timer = setTimeout(() => {
    void flushAutosave(boardId);
  }, env.AUTO_SAVE_DEBOUNCE_MS);

  autosaveQueue.set(boardId, {
    scene,
    timer,
    actorId: actor.id,
    actorName: actor.displayName,
  });
}

function canAccessBoard(board: Awaited<ReturnType<typeof getBoardWithRelations>>, user: AuthUser) {
  if (!board) {
    return false;
  }

  if (board.ownerId === user.id) {
    return true;
  }

  if (board.visibility === "shared") {
    return true;
  }

  return board.members.some((member) => member.userId === user.id);
}

export const boardService = {
  async listForUser(userId: string) {
    const boards = await listBoardsForUser(userId);
    return boards.map(serializeBoard);
  },

  async create(input: { ownerId: string; title: string; visibility: "private" | "shared" }) {
    const board = await createBoardRecord({
      ownerId: input.ownerId,
      title: input.title,
      visibility: input.visibility,
      roomSlug: createRoomId(),
    });

    const scene = emptyScene(board.id);
    await createBoardSnapshot({
      boardId: board.id,
      version: scene.version,
      scene,
      actorId: input.ownerId,
    });
    sceneCache.set(board.id, scene);

    return serializeBoard(board);
  },

  async update(boardId: string, user: AuthUser, patch: Partial<{ title: string; visibility: "private" | "shared" }>) {
    const board = await getBoardWithRelations(boardId);
    if (!board) {
      throw createHttpError(404, "Board not found");
    }

    if (board.ownerId !== user.id) {
      throw createHttpError(403, "Only the owner can update this board");
    }

    const updated = await updateBoardRecord(boardId, patch);
    return serializeBoard(updated);
  },

  async getBootstrap(boardId: string, user: AuthUser) {
    const board = await getBoardWithRelations(boardId);
    if (!board || !canAccessBoard(board, user)) {
      throw createHttpError(404, "Board not found");
    }

    await ensureMembership({
      boardId,
      userId: user.isGuest ? undefined : user.id,
      guestName: user.isGuest ? user.displayName : undefined,
      role: user.isGuest ? "guest" : "editor",
    });

    const scene = await this.getScene(boardId);

    return {
      board: serializeBoard(board),
      scene,
      collaborators: [],
    };
  },

  async joinByRoom(roomId: string, user: AuthUser) {
    const board = await getBoardByRoom(roomId);
    if (!board) {
      throw createHttpError(404, "Room not found");
    }

    if (board.visibility === "private" && board.ownerId !== user.id) {
      throw createHttpError(403, "This board is private");
    }

    await ensureMembership({
      boardId: board.id,
      userId: user.isGuest ? undefined : user.id,
      guestName: user.isGuest ? user.displayName : undefined,
      role: user.isGuest ? "guest" : "editor",
    });

    return serializeBoard(board);
  },

  async getScene(boardId: string) {
    const cached = sceneCache.get(boardId);
    if (cached) {
      return cached;
    }

    const board = await getBoardWithRelations(boardId);
    if (!board) {
      throw createHttpError(404, "Board not found");
    }

    const snapshotScene = extractScene(board.snapshots[0]);
    const scene = snapshotScene ?? emptyScene(board.id);
    sceneCache.set(boardId, scene);
    return scene;
  },

  async applyScenePatch(input: {
    boardId: string;
    scene: BoardScene;
    actor: AuthUser;
  }) {
    const currentScene = await this.getScene(input.boardId);
    const nextScene =
      input.scene.version >= currentScene.version
        ? {
            ...input.scene,
            version: Math.max(currentScene.version + 1, input.scene.version),
            updatedAt: new Date().toISOString(),
          }
        : currentScene;

    sceneCache.set(input.boardId, nextScene);
    queueAutosave(input.boardId, nextScene, input.actor);

    await createBoardEvent({
      boardId: input.boardId,
      version: nextScene.version,
      actorId: input.actor.id,
      actorName: input.actor.displayName,
      eventType: BoardEventType.shape_update,
      payloadJson: { shapeCount: nextScene.shapes.length },
    });

    return nextScene;
  },

  async flush(boardId: string) {
    await flushAutosave(boardId);
  },
};
