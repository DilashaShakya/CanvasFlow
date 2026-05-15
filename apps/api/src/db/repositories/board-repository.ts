import type { Board, BoardEventType, BoardMemberRole, BoardSnapshot } from "@prisma/client";
import type { BoardScene } from "@canvasflow/shared";

import { prisma } from "../client";

export async function listBoardsForUser(userId: string) {
  return prisma.board.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getBoardWithRelations(boardId: string) {
  return prisma.board.findUnique({
    where: { id: boardId },
    include: {
      owner: true,
      members: {
        include: {
          user: true,
        },
      },
      snapshots: {
        orderBy: {
          version: "desc",
        },
        take: 1,
      },
    },
  });
}

export async function getBoardByRoom(roomSlug: string) {
  return prisma.board.findUnique({
    where: { roomSlug },
    include: {
      owner: true,
    },
  });
}

export async function createBoardRecord(input: {
  ownerId: string;
  title: string;
  roomSlug: string;
  visibility: "private" | "shared";
}) {
  const board = await prisma.board.create({
    data: {
      ownerId: input.ownerId,
      title: input.title,
      roomSlug: input.roomSlug,
      visibility: input.visibility,
      members: {
        create: {
          userId: input.ownerId,
          role: "owner",
        },
      },
    },
  });

  return board;
}

export async function updateBoardRecord(boardId: string, data: Partial<Pick<Board, "title" | "visibility" | "lastSnapshotVersion">>) {
  return prisma.board.update({
    where: { id: boardId },
    data,
  });
}

export async function createBoardSnapshot(input: {
  boardId: string;
  version: number;
  scene: BoardScene;
  actorId?: string;
}) {
  return prisma.boardSnapshot.create({
    data: {
      boardId: input.boardId,
      version: input.version,
      sceneJson: input.scene,
      createdById: input.actorId,
    },
  });
}

export async function createBoardEvent(input: {
  boardId: string;
  version: number;
  actorId?: string;
  actorName: string;
  eventType: BoardEventType;
  payloadJson: object;
}) {
  return prisma.boardEvent.create({
    data: input,
  });
}

export async function ensureMembership(input: {
  boardId: string;
  userId?: string;
  guestName?: string;
  role: BoardMemberRole;
}) {
  const existing = input.userId
    ? await prisma.boardMember.findFirst({
        where: {
          boardId: input.boardId,
          userId: input.userId,
        },
      })
    : null;

  if (existing) {
    return existing;
  }

  return prisma.boardMember.create({
    data: {
      boardId: input.boardId,
      userId: input.userId,
      guestName: input.guestName,
      role: input.role,
    },
  });
}

export function extractScene(snapshot?: Pick<BoardSnapshot, "sceneJson"> | null) {
  return (snapshot?.sceneJson as BoardScene | undefined) ?? null;
}
