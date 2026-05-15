"use client";

import { Circle, Eraser, Minus, MousePointer2, Pencil, Square, Type } from "lucide-react";

import type { ShapeTool } from "@canvasflow/shared";

import { Button } from "@/components/ui/button";
import { useBoardStore } from "@/features/board/store/use-board-store";

const tools: { id: ShapeTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pencil", label: "Pencil", icon: Pencil },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "ellipse", label: "Circle", icon: Circle },
  { id: "text", label: "Text", icon: Type },
  { id: "eraser", label: "Eraser", icon: Eraser },
];

const colors = ["#18181B", "#52525B", "#8B5CF6", "#0EA5E9", "#22C55E", "#F43F5E"];

export function Toolbar() {
  const tool = useBoardStore((state) => state.tool);
  const stroke = useBoardStore((state) => state.stroke);
  const strokeWidth = useBoardStore((state) => state.strokeWidth);
  const setTool = useBoardStore((state) => state.setTool);
  const setStyle = useBoardStore((state) => state.setStyle);

  return (
    <aside className="glass-panel flex w-[88px] flex-col gap-3 rounded-3xl p-3">
      {tools.map((item) => (
        <Button
          key={item.id}
          variant={tool === item.id ? "primary" : "ghost"}
          className={
            tool === item.id
              ? "h-12 w-full rounded-2xl bg-violet-500 px-0 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400"
              : "h-12 w-full rounded-2xl px-0 text-zinc-200 hover:bg-white/5"
          }
          onClick={() => setTool(item.id)}
          title={item.label}
        >
          <item.icon className="h-5 w-5" />
        </Button>
      ))}

      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-8 rounded-xl border ${stroke === color ? "border-white" : "border-transparent"}`}
              style={{ backgroundColor: color }}
              onClick={() => setStyle({ stroke: color, fill: `${color}22` })}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs text-zinc-300">Stroke</label>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-zinc-400" />
            <input
              type="range"
              min={1}
              max={12}
              value={strokeWidth}
              onChange={(event) => setStyle({ strokeWidth: Number(event.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
