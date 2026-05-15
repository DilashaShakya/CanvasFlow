"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OwlLogo } from "@/components/owl-logo";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

type JoinRoomClientProps = {
  roomId: string;
};

export function JoinRoomClient({ roomId }: JoinRoomClientProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const setSession = useAuthStore((state) => state.setSession);
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedAutoJoinRef = useRef(false);

  async function joinRoom(authToken: string) {
    setJoining(true);
    setError(null);

    try {
      const response = await api.boards.join(authToken, roomId);
      router.replace(`/boards/${response.board.id}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not join this room");
      setJoining(false);
    }
  }

  async function continueAsGuest() {
    const name = displayName.trim();

    if (name.length < 2) {
      setError("Enter a display name with at least 2 characters.");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const response = await api.guest({ displayName: name });
      setSession(response.token, response.user);
      await joinRoom(response.token);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not join this room");
      setJoining(false);
    }
  }

  useEffect(() => {
    if (hydrated && token && user && !joining && !attemptedAutoJoinRef.current) {
      attemptedAutoJoinRef.current = true;
      void joinRoom(token);
    }
  }, [hydrated, joining, token, user]);

  if (!hydrated || (token && user && joining)) {
    return <main className="grid min-h-screen place-items-center text-zinc-400">Joining shared room...</main>;
  }

  if (token && user) {
    return <main className="grid min-h-screen place-items-center text-zinc-400">Opening board...</main>;
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <Card className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <OwlLogo showText={false} />
          <div>
            <p className="text-sm text-[#C8AA82]">Shared CanvasFlow room</p>
            <h1 className="text-2xl font-semibold text-[#FFF5DF]">Join room {roomId}</h1>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <Input placeholder="Your display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <Button className="w-full" onClick={continueAsGuest} disabled={joining}>
            <LogIn className="mr-2 h-4 w-4" />
            {joining ? "Joining..." : "Join board"}
          </Button>
        </div>

        <p className="mt-5 text-center text-sm text-[#BFA07B]">
          Already signed in? This page will take you directly to the board.{" "}
          <Link className="text-[#F8E8C8] hover:text-[#D8943B]" href="/login">
            Log in
          </Link>
        </p>
      </Card>
    </main>
  );
}
