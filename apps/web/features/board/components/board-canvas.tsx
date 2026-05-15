"use client";

import dynamic from "next/dynamic";

import type { BoardCanvasProps } from "./board-canvas-inner";

const ClientBoardCanvas = dynamic(
  () => import("./board-canvas-inner").then((module) => module.BoardCanvasInner),
  {
    ssr: false,
    loading: () => <div className="sketch-paper sketch-border h-[calc(100vh-10rem)] rounded-[2rem] border-4" />,
  },
);

export function BoardCanvas(props: BoardCanvasProps) {
  return <ClientBoardCanvas {...props} />;
}
