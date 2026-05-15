"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Share2 } from "lucide-react";

import type { BoardSummary } from "@canvasflow/shared";

import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { OwlLogo } from "@/components/owl-logo";

export default function DashboardPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [title, setTitle] = useState("Product strategy board");
  const [roomId, setRoomId] = useState("demo-room");
  const [sharedRoomId, setSharedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void api
      .boards
      .list(token)
      .then((data) => setBoards(data.boards))
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Failed to load boards");
      });
  }, [token]);

  useEffect(() => {
    const sharedRoomId = new URLSearchParams(window.location.search).get("room");
    if (sharedRoomId) {
      setRoomId(sharedRoomId);
      setSharedRoomId(sharedRoomId);
    }
  }, []);

  useEffect(() => {
    if (!token || !sharedRoomId) {
      return;
    }

    setLoading(true);
    void api.boards
      .join(token, sharedRoomId)
      .then((response) => router.replace(`/boards/${response.board.id}`))
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Could not join board");
        setLoading(false);
      });
  }, [router, sharedRoomId, token]);

  if (!hydrated) {
    return <main className="grid min-h-screen place-items-center text-zinc-400">Loading CanvasFlow...</main>;
  }

  if (!token || !user) {
    const redirectTo = sharedRoomId ? `/dashboard?room=${encodeURIComponent(sharedRoomId)}` : "/dashboard";

    return (
      <main className="grid min-h-screen place-items-center px-6">
        <AuthForm mode="guest" redirectTo={redirectTo} />
      </main>
    );
  }

  if (sharedRoomId && loading) {
    return <main className="grid min-h-screen place-items-center text-zinc-400">Joining shared room...</main>;
  }

  async function createBoard() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.boards.create(token, { title, visibility: "shared" });
      router.push(`/boards/${response.board.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create board");
    } finally {
      setLoading(false);
    }
  }

  async function joinBoard() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.boards.join(token, roomId);
      router.push(`/boards/${response.board.id}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not join board");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <div className="glass-panel flex items-center justify-between rounded-2xl px-5 py-4">
        <div>
          <OwlLogo />
          <h1 className="mt-3 text-2xl font-semibold text-[#FFF5DF]">Welcome, {user.displayName}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost">Landing</Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              clearSession();
              router.push("/");
            }}
          >
            Sign out
          </Button>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4">
          <h2 className="text-lg font-medium text-[#FFF5DF]">Create a new sketchbook board</h2>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          <Button onClick={createBoard} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Working..." : "Create shared board"}
          </Button>

          <div className="pt-4">
            <h3 className="text-sm font-medium text-[#F8E8C8]">Join by room ID</h3>
            <div className="mt-3 flex gap-3">
              <Input value={roomId} onChange={(event) => setRoomId(event.target.value)} />
              <Button variant="secondary" onClick={joinBoard} disabled={loading}>
                <Share2 className="mr-2 h-4 w-4" />
                Join
              </Button>
            </div>
            <p className="mt-2 text-xs text-[#BFA07B]">Paste a shared room ID or open a direct join link.</p>
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </Card>

        <div className="grid gap-4">
          {boards.length ? (
            boards.map((board) => (
              <Link key={board.id} href={`/boards/${board.id}`}>
                <Card className="transition hover:border-[#D8943B]/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-[#FFF5DF]">{board.title}</h2>
                      <p className="mt-2 text-sm text-[#C8AA82]">Room ID: {board.roomSlug}</p>
                    </div>
                    <span className="rounded-full border border-[#E7C494]/20 px-3 py-1 text-xs text-[#F8E8C8]">
                      v{board.lastSnapshotVersion}
                    </span>
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <p className="text-[#C8AA82]">No boards yet. Create one or join a shared room to start collaborating.</p>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
