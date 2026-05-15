"use client";

import { useEffect, useMemo, useState } from "react";

import type { BoardBootstrap, CursorState } from "@canvasflow/shared";

import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";

import { useBoardStore } from "../store/use-board-store";

export function useBoardRoom(boardId: string) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const bootstrap = useBoardStore((state) => state.bootstrap);
  const setCollaborators = useBoardStore((state) => state.setCollaborators);
  const updateCursor = useBoardStore((state) => state.updateCursor);
  const removeCursor = useBoardStore((state) => state.removeCursor);
  const replaceScene = useBoardStore((state) => state.replaceScene);
  const setConnectionStatus = useBoardStore((state) => state.setConnectionStatus);
  const setSessionId = useBoardStore((state) => state.setSessionId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardMeta, setBoardMeta] = useState<BoardBootstrap["board"] | null>(null);

  const storageKey = useMemo(() => `canvasflow-session:${boardId}`, [boardId]);

  useEffect(() => {
    if (!hydrated || !token || !user) {
      return;
    }

    let active = true;
    const authToken = token;
    const authUser = user;
    const restoredSessionId = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) ?? undefined : undefined;
    const socket = getSocket(authToken, restoredSessionId);

    async function setup() {
      try {
        setLoading(true);
        setError(null);
        const bootstrapPayload = (await api.boards.bootstrap(authToken, boardId)) as BoardBootstrap;
        if (!active) {
          return;
        }

        bootstrap({
          boardId,
          title: bootstrapPayload.board.title,
          scene: bootstrapPayload.scene,
          collaborators: bootstrapPayload.collaborators,
        });
        setBoardMeta(bootstrapPayload.board);

        setConnectionStatus(socket.connected ? "connected" : "connecting");
        if (socket.connected) {
          socket.emit("board:join", { boardId, sessionId: restoredSessionId });
        } else {
          socket.connect();
        }
      } catch (setupError) {
        if (!active) {
          return;
        }

        setError(setupError instanceof Error ? setupError.message : "Failed to load board");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    socket.on("connect", () => {
      setConnectionStatus("connected");
      socket.emit("board:join", { boardId, sessionId: restoredSessionId });
    });

    socket.on("disconnect", () => {
      setConnectionStatus("reconnecting");
    });

    socket.on("presence:update", setCollaborators);
    socket.on("cursor:update", (cursor: CursorState) => updateCursor(cursor));
    socket.on("cursor:remove", ({ userId }: { userId: string }) => removeCursor(userId));
    socket.on("scene:committed", ({ actorId, scene }: { actorId: string; scene: BoardBootstrap["scene"] }) => {
      if (actorId !== authUser.id) {
        replaceScene(scene);
      }
    });
    socket.on("session:ready", ({ sessionId: nextSessionId, scene }: { sessionId: string; scene: BoardBootstrap["scene"] }) => {
      setSessionId(nextSessionId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, nextSessionId);
      }
      replaceScene(scene);
    });
    socket.on("socket:error", ({ message }: { message: string }) => setError(message));

    void setup();

    return () => {
      active = false;
      socket.emit("board:leave", { boardId });
      socket.off("presence:update", setCollaborators);
      socket.off("cursor:update");
      socket.off("cursor:remove");
      socket.off("scene:committed");
      socket.off("session:ready");
      socket.off("socket:error");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [
    boardId,
    bootstrap,
    hydrated,
    removeCursor,
    replaceScene,
    setCollaborators,
    setConnectionStatus,
    setSessionId,
    storageKey,
    token,
    updateCursor,
    user,
  ]);

  return { loading, error, token, user, boardMeta };
}
