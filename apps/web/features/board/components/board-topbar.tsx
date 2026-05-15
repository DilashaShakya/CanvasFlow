"use client";

import Link from "next/link";
import { Check, Copy, Link2, MoonStar, SunMedium, Undo2, Redo2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { OwlLogo } from "@/components/owl-logo";
import { useBoardStore } from "@/features/board/store/use-board-store";

type BoardTopbarProps = {
  roomId: string;
};

export function BoardTopbar({ roomId }: BoardTopbarProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [copied, setCopied] = useState<"id" | "link" | null>(null);
  const title = useBoardStore((state) => state.title);
  const connectionStatus = useBoardStore((state) => state.connectionStatus);
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);

  return (
    <header className="glass-panel flex items-center justify-between rounded-3xl px-5 py-4">
      <div className="flex items-center gap-4">
        <OwlLogo showText={false} markClassName="h-10 w-10 rounded-xl" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#BFA07B]">CanvasFlow</p>
          <h1 className="mt-1 text-xl font-semibold text-[#FFF5DF]">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full border border-[#D8943B]/30 bg-[#D8943B]/10 px-3 py-1 text-xs text-[#F8E8C8]">
          {connectionStatus}
        </span>
        <Button variant="secondary" onClick={undo}>
          <Undo2 className="mr-2 h-4 w-4" />
          Undo
        </Button>
        <Button variant="secondary" onClick={redo}>
          <Redo2 className="mr-2 h-4 w-4" />
          Redo
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(roomId);
            setCopied("id");
            window.setTimeout(() => setCopied(null), 1600);
          }}
        >
          {copied === "id" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied === "id" ? "Copied ID" : "Copy room ID"}
        </Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const shareUrl = `${window.location.origin}/join/${encodeURIComponent(roomId)}`;
            await navigator.clipboard.writeText(shareUrl);
            setCopied("link");
            window.setTimeout(() => setCopied(null), 1600);
          }}
        >
          {copied === "link" ? <Check className="mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />}
          {copied === "link" ? "Copied link" : "Copy share link"}
        </Button>
        <Button variant="ghost" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </Button>
        <Link href="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
      </div>
    </header>
  );
}
