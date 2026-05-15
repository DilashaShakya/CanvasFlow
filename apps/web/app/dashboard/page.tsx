"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus, Share2, Trash2 } from "lucide-react";

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
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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

  async function deleteBoard(boardId: string) {
    if (!token) {
      return;
    }

    try {
      setDeletingBoardId(boardId);
      setError(null);
      await api.boards.delete(token, boardId);
      setBoards((current) => current.filter((board) => board.id !== boardId));
      setConfirmDeleteId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not delete board");
    } finally {
      setDeletingBoardId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFFDF8] px-6 py-8 text-[#2A1810]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#D9CBB8_1.15px,transparent_1.15px)] bg-[size:22px_22px]" />
      <div className="relative z-10 mx-auto max-w-7xl">
      <div className="flex items-center justify-between rounded-[2rem] border-4 border-[#4B2B19] bg-white px-5 py-4 shadow-[8px_8px_0_#6B3F24]">
        <div>
          <OwlLogo className="[&_p:first-of-type]:text-[#3A2115] [&_p:last-of-type]:text-[#8A6A43]" />
          <h1 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#2A1810]">Welcome, {user.displayName}</h1>
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

      <section className="mt-8 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="space-y-5 border-4 border-[#4B2B19] bg-white text-[#2A1810] shadow-[8px_8px_0_#6B3F24]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A2663A]">Workspace</p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#2A1810]">Create a new board</h2>
          </div>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="border-[#C8AA82] bg-[#FFFDF8] text-[#2A1810] placeholder:text-[#9A673D] focus:border-[#A2663A]"
          />
          <Button onClick={createBoard} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Working..." : "Create shared board"}
          </Button>

          <div className="border-t border-[#E7C494] pt-5">
            <h3 className="text-sm font-bold text-[#3A2115]">Join by room ID</h3>
            <div className="mt-3 flex gap-3">
              <Input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                className="border-[#C8AA82] bg-[#FFFDF8] text-[#2A1810] placeholder:text-[#9A673D] focus:border-[#A2663A]"
              />
              <Button variant="secondary" onClick={joinBoard} disabled={loading}>
                <Share2 className="mr-2 h-4 w-4" />
                Join
              </Button>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7B4A2D]">Paste a shared room ID or open a direct join link.</p>
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        </Card>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#A2663A]">Boards</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#2A1810]">Your sketchbooks</h2>
            </div>
            <span className="rounded-full border-2 border-[#4B2B19]/20 bg-white px-3 py-1 text-sm font-semibold text-[#6B3F24]">
              {boards.length} {boards.length === 1 ? "board" : "boards"}
            </span>
          </div>

          <div className="grid gap-4">
          {boards.length ? (
            boards.map((board) => (
                <Card key={board.id} className="border-2 border-[#4B2B19]/18 bg-white text-[#2A1810] shadow-[5px_5px_0_rgba(107,63,36,0.18)] transition hover:-translate-y-0.5 hover:border-[#A2663A]/60">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-[-0.02em] text-[#2A1810]">{board.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#6B3F24]">
                        <span className="rounded-full bg-[#F7E8C8] px-3 py-1">Room {board.roomSlug}</span>
                        <span className="rounded-full bg-[#F7E8C8] px-3 py-1">{board.visibility}</span>
                        <span className="rounded-full bg-[#F7E8C8] px-3 py-1">
                          Updated {new Date(board.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/boards/${board.id}`}>
                        <Button className="h-10">
                          Open
                          <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      {board.ownerId === user.id ? (
                        confirmDeleteId === board.id ? (
                          <>
                            <Button
                              variant="secondary"
                              className="h-10 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              onClick={() => deleteBoard(board.id)}
                              disabled={deletingBoardId === board.id}
                            >
                              {deletingBoardId === board.id ? "Deleting..." : "Confirm delete"}
                            </Button>
                            <Button variant="ghost" className="h-10 text-[#6B3F24]" onClick={() => setConfirmDeleteId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            className="h-10 text-[#8A552F] hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => setConfirmDeleteId(board.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                </Card>
            ))
          ) : (
            <Card className="border-2 border-dashed border-[#4B2B19]/25 bg-white text-[#6B3F24]">
              <p>No boards yet. Create one or join a shared room to start collaborating.</p>
            </Card>
          )}
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}
