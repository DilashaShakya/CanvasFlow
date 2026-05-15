import type { Server as HttpServer } from "node:http";

import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { nanoid } from "nanoid";
import { Server } from "socket.io";

import { boardSocketEventsSchema } from "@canvasflow/shared";

import { env } from "../config/env";
import { verifyAccessToken } from "../lib/jwt";
import { boardService } from "../services/board-service";

type PresenceRecord = {
  userId: string;
  username: string;
  color: string;
  isEditing: boolean;
  lastSeenAt: string;
};

const presenceByBoard = new Map<string, Map<string, PresenceRecord>>();
const cursorsByBoard = new Map<string, Map<string, unknown>>();
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const EVENT_RATE_LIMITS = {
  "board:cursor": 1_200,
  default: env.SOCKET_RATE_LIMIT_PER_MINUTE,
} as const satisfies Record<string, number>;

function roomForBoard(boardId: string) {
  return `board:${boardId}`;
}

function getPresence(boardId: string) {
  let presence = presenceByBoard.get(boardId);
  if (!presence) {
    presence = new Map();
    presenceByBoard.set(boardId, presence);
  }

  return presence;
}

function checkRateLimit(socketId: string, eventName = "default") {
  const now = Date.now();
  const key = `${socketId}:${eventName}`;
  const current = rateLimits.get(key);
  const limit = eventName in EVENT_RATE_LIMITS ? EVENT_RATE_LIMITS[eventName as keyof typeof EVENT_RATE_LIMITS] : EVENT_RATE_LIMITS.default;

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, {
      count: 1,
      resetAt: now + 60_000,
    });
    return true;
  }

  current.count += 1;
  return current.count <= limit;
}

export async function createSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  const pubClient = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      const token = String(socket.handshake.auth.token ?? "");
      socket.data.user = verifyAccessToken(token);
      socket.data.sessionId = String(socket.handshake.auth.sessionId ?? nanoid());
      next();
    } catch {
      next(new Error("Unauthorized socket connection"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("board:join", async (payload) => {
      if (!checkRateLimit(socket.id, "board:join")) {
        socket.emit("socket:error", { message: "Rate limit exceeded for board:join" });
        return;
      }

      const parsed = boardSocketEventsSchema.shape["board:join"].safeParse(payload);
      if (!parsed.success) {
        socket.emit("socket:error", { message: "Invalid join payload" });
        return;
      }

      try {
        const bootstrap = await boardService.getBootstrap(parsed.data.boardId, socket.data.user);
        await socket.join(roomForBoard(parsed.data.boardId));
        socket.data.boardId = parsed.data.boardId;
        socket.data.sessionId = parsed.data.sessionId ?? socket.data.sessionId;

        const presence = getPresence(parsed.data.boardId);
        presence.set(socket.data.user.id, {
          userId: socket.data.user.id,
          username: socket.data.user.displayName,
          color: socket.data.user.avatarColor,
          isEditing: false,
          lastSeenAt: new Date().toISOString(),
        });

        io.to(roomForBoard(parsed.data.boardId)).emit("presence:update", [...presence.values()]);
        socket.emit("session:ready", {
          sessionId: socket.data.sessionId,
          scene: bootstrap.scene,
        });
      } catch (error) {
        socket.emit("socket:error", {
          message: error instanceof Error ? error.message : "Unable to join board",
        });
      }
    });

    socket.on("board:leave", (payload) => {
      const parsed = boardSocketEventsSchema.shape["board:leave"].safeParse(payload);
      if (!parsed.success) {
        return;
      }

      const presence = getPresence(parsed.data.boardId);
      presence.delete(socket.data.user.id);
      socket.leave(roomForBoard(parsed.data.boardId));
      io.to(roomForBoard(parsed.data.boardId)).emit("presence:update", [...presence.values()]);
    });

    socket.on("board:cursor", (payload) => {
      if (!checkRateLimit(socket.id, "board:cursor")) {
        // Cursor traffic is lossy presence data. Dropping excess events avoids noisy UI errors.
        return;
      }

      const parsed = boardSocketEventsSchema.shape["board:cursor"].safeParse(payload);
      if (!parsed.success) {
        return;
      }

      let cursors = cursorsByBoard.get(parsed.data.boardId);
      if (!cursors) {
        cursors = new Map();
        cursorsByBoard.set(parsed.data.boardId, cursors);
      }

      cursors.set(socket.data.user.id, parsed.data);
      socket.to(roomForBoard(parsed.data.boardId)).emit("cursor:update", parsed.data);
    });

    socket.on("board:editing", (payload) => {
      if (!checkRateLimit(socket.id, "board:editing")) {
        socket.emit("socket:error", { message: "Rate limit exceeded for board:editing" });
        return;
      }

      const parsed = boardSocketEventsSchema.shape["board:editing"].safeParse(payload);
      if (!parsed.success) {
        return;
      }

      const presence = getPresence(parsed.data.boardId);
      const current = presence.get(socket.data.user.id);
      if (current) {
        current.isEditing = parsed.data.isEditing;
        current.lastSeenAt = new Date().toISOString();
      }

      io.to(roomForBoard(parsed.data.boardId)).emit("presence:update", [...presence.values()]);
    });

    socket.on("board:scene_patch", async (payload) => {
      if (!checkRateLimit(socket.id, "board:scene_patch")) {
        socket.emit("socket:error", { message: "Rate limit exceeded for board:scene_patch" });
        return;
      }

      const parsed = boardSocketEventsSchema.shape["board:scene_patch"].safeParse(payload);
      if (!parsed.success) {
        socket.emit("socket:error", { message: "Invalid scene patch" });
        return;
      }

      try {
        const scene = await boardService.applyScenePatch({
          boardId: parsed.data.boardId,
          scene: parsed.data.scene,
          actor: socket.data.user,
        });

        io.to(roomForBoard(parsed.data.boardId)).emit("scene:committed", {
          boardId: parsed.data.boardId,
          scene,
          actorId: socket.data.user.id,
        });
      } catch (error) {
        socket.emit("socket:error", {
          message: error instanceof Error ? error.message : "Unable to apply scene patch",
        });
      }
    });

    socket.on("board:resync", async (payload) => {
      const parsed = boardSocketEventsSchema.shape["board:resync"].safeParse(payload);
      if (!parsed.success) {
        return;
      }

      const scene = await boardService.getScene(parsed.data.boardId);
      socket.emit("scene:committed", {
        boardId: parsed.data.boardId,
        scene,
        actorId: "server",
      });
    });

    socket.on("disconnect", async () => {
      const boardId = socket.data.boardId as string | undefined;
      for (const key of rateLimits.keys()) {
        if (key.startsWith(`${socket.id}:`)) {
          rateLimits.delete(key);
        }
      }

      if (!boardId) {
        return;
      }

      const presence = getPresence(boardId);
      presence.delete(socket.data.user.id);
      io.to(roomForBoard(boardId)).emit("presence:update", [...presence.values()]);

      const cursors = cursorsByBoard.get(boardId);
      cursors?.delete(socket.data.user.id);
      socket.to(roomForBoard(boardId)).emit("cursor:remove", { userId: socket.data.user.id });

      await boardService.flush(boardId);
    });
  });

  return io;
}
