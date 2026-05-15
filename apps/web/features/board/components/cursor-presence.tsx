"use client";

import { useMemo } from "react";
import { MousePointer2 } from "lucide-react";

import { useBoardStore } from "@/features/board/store/use-board-store";

export function CursorPresence() {
  const cursorMap = useBoardStore((state) => state.cursors);
  const cursors = useMemo(() => Object.values(cursorMap), [cursorMap]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-transform duration-75"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          }}
        >
          <div className="flex items-start gap-2">
            <MousePointer2 className="h-5 w-5" style={{ color: cursor.color }} />
            <span
              className="rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.username}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
