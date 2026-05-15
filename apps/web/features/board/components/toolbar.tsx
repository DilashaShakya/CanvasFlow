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

const colors = ["#5D3521", "#7B4A2D", "#A2663A", "#D8943B", "#2F241B", "#8A6A43"];

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
          className="h-12 w-full rounded-2xl px-0"
          onClick={() => setTool(item.id)}
          title={item.label}
        >
          <item.icon className="h-5 w-5" />
        </Button>
      ))}

      <div className="mt-3 border-t border-[#E7C494]/15 pt-3">
        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={`h-8 rounded-xl border ${stroke === color ? "border-[#F8E8C8]" : "border-transparent"}`}
              style={{ backgroundColor: color }}
              onClick={() => setStyle({ stroke: color, fill: `${color}22` })}
            />
          ))}
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs text-[#C8AA82]">Stroke</label>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-[#BFA07B]" />
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
