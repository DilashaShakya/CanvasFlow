"use client";

import dynamic from "next/dynamic";

import type { BoardCanvasProps } from "./board-canvas-inner";

const ClientBoardCanvas = dynamic(
  () => import("./board-canvas-inner").then((module) => module.BoardCanvasInner),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[calc(100vh-10rem)] rounded-[2rem] border border-zinc-200"
        style={{
          backgroundColor: "#FFFFFF",
          backgroundImage:
            "linear-gradient(rgba(24, 24, 27, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(24, 24, 27, 0.055) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    ),
  },
);

export function BoardCanvas(props: BoardCanvasProps) {
  return <ClientBoardCanvas {...props} />;
}
