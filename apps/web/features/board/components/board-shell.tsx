"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { useBoardStore } from "@/features/board/store/use-board-store";

import { useBoardRoom } from "../hooks/use-board-room";
import { BoardCanvas } from "./board-canvas";
import { BoardTopbar } from "./board-topbar";
import { CollaboratorsSidebar } from "./collaborators-sidebar";
import { CursorPresence } from "./cursor-presence";
import { Toolbar } from "./toolbar";

type BoardShellProps = {
  boardId: string;
};

export function BoardShell({ boardId }: BoardShellProps) {
  const { loading, error, token, user, boardMeta } = useBoardRoom(boardId);
  const scene = useBoardStore((state) => state.scene);
  const sessionId = useBoardStore((state) => state.sessionId);
  const lastChangeOrigin = useBoardStore((state) => state.lastChangeOrigin);
  const lastSentVersion = useRef<number>(0);

  useEffect(() => {
    if (!token || !scene || lastChangeOrigin !== "local") {
      return;
    }

    if (scene.version <= lastSentVersion.current) {
      return;
    }

    lastSentVersion.current = scene.version;
    getSocket(token, sessionId ?? undefined).emit("board:scene_patch", {
      boardId,
      nextVersion: scene.version,
      scene,
    });
  }, [boardId, lastChangeOrigin, scene, sessionId, token]);

  if (loading) {
    return <main className="grid min-h-screen place-items-center text-[#C8AA82]">Loading collaborative board...</main>;
  }

  if (error || !token || !user || !boardMeta) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="glass-panel max-w-md rounded-3xl p-8 text-center">
          <p className="text-lg font-semibold text-rose-300">{error ?? "You need to sign in first."}</p>
          <p className="mt-3 text-sm text-[#C8AA82]">
            This can happen if the board link is stale or the local database was reset. Create or join a current room from the dashboard.
          </p>
          <Link href="/dashboard">
            <Button className="mt-6">Back to dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-5">
      <div className="space-y-5">
        <BoardTopbar roomId={boardMeta.roomSlug} />
        <div className="grid gap-5 xl:grid-cols-[88px_minmax(0,1fr)_288px]">
          <Toolbar />
          <div className="relative">
            <CursorPresence />
            <BoardCanvas
              boardId={boardId}
              token={token}
              userId={user.id}
              username={user.displayName}
              userColor={user.avatarColor}
            />
          </div>
          <CollaboratorsSidebar />
        </div>
      </div>
    </main>
  );
}
