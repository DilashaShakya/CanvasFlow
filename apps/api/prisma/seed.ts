import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "demo@canvasflow.dev" },
    update: {},
    create: {
      email: "demo@canvasflow.dev",
      passwordHash: await bcrypt.hash("Password123!", 10),
      displayName: "Demo Owner",
      avatarColor: "#8B5CF6",
    },
  });

  const board = await prisma.board.upsert({
    where: { roomSlug: "demo-room" },
    update: {},
    create: {
      ownerId: owner.id,
      title: "CanvasFlow Demo Board",
      roomSlug: "demo-room",
      visibility: "shared",
      members: {
        create: {
          userId: owner.id,
          role: "owner",
        },
      },
    },
  });

  const snapshotCount = await prisma.boardSnapshot.count({
    where: { boardId: board.id },
  });

  if (!snapshotCount) {
    await prisma.boardSnapshot.create({
      data: {
        boardId: board.id,
        version: 1,
        createdById: owner.id,
        sceneJson: {
          boardId: board.id,
          version: 1,
          updatedAt: new Date().toISOString(),
          shapes: [
            {
              id: "shape-hero-1",
              type: "rectangle",
              x: 120,
              y: 160,
              width: 240,
              height: 120,
              rotation: 0,
              stroke: "#8B5CF6",
              strokeWidth: 3,
              fill: "rgba(139,92,246,0.12)",
              version: 1,
              createdBy: owner.id,
              updatedAt: new Date().toISOString(),
            },
            {
              id: "shape-text-1",
              type: "text",
              x: 152,
              y: 200,
              rotation: 0,
              stroke: "#F8FAFC",
              strokeWidth: 1,
              fill: "transparent",
              version: 1,
              createdBy: owner.id,
              updatedAt: new Date().toISOString(),
              text: "Welcome to CanvasFlow",
              fontSize: 24,
            },
          ],
        },
      },
    });

    await prisma.board.update({
      where: { id: board.id },
      data: {
        lastSnapshotVersion: 1,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
