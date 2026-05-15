"use client";

import { useState } from "react";

type Splash = {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
};

const splashColors = ["#D8943B", "#A2663A", "#6B3F24", "#E58A3A", "#C7563A", "#6E8B4F"];

export function SplashPlayground() {
  const [splashes, setSplashes] = useState<Splash[]>([
    { id: 1, x: 24, y: 30, color: "#D8943B", size: 92 },
    { id: 2, x: 68, y: 58, color: "#6B3F24", size: 70 },
  ]);

  function addSplash(event: React.MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const color = splashColors[Math.floor(Math.random() * splashColors.length)] ?? "#D8943B";

    setSplashes((current) => [
      ...current.slice(-11),
      {
        id: Date.now(),
        x: ((event.clientX - bounds.left) / bounds.width) * 100,
        y: ((event.clientY - bounds.top) / bounds.height) * 100,
        color,
        size: 54 + Math.random() * 78,
      },
    ]);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={addSplash}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          const color = splashColors[Math.floor(Math.random() * splashColors.length)] ?? "#D8943B";
          setSplashes((current) => [
            ...current.slice(-11),
            { id: Date.now(), x: 35 + Math.random() * 30, y: 30 + Math.random() * 36, color, size: 70 + Math.random() * 70 },
          ]);
        }
      }}
      className="group relative h-[440px] cursor-crosshair overflow-hidden rounded-[2rem] border-[5px] border-[#4B2B19] bg-white shadow-[14px_14px_0_#6B3F24] outline-none transition hover:-translate-y-1 hover:shadow-[18px_18px_0_#6B3F24] focus-visible:ring-4 focus-visible:ring-[#D8943B]/35"
      aria-label="Click to splash color on the demo board"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#C9BCA8_1px,transparent_1px)] bg-[size:18px_18px]" />
      <div className="absolute left-8 top-7 rounded-full border-2 border-[#4B2B19] bg-[#FFF7E8] px-4 py-2 text-sm font-semibold text-[#4B2B19] shadow-[4px_4px_0_#E7C494]">
        Click anywhere
      </div>
      {splashes.map((splash) => (
        <div
          key={splash.id}
          className="absolute animate-[splash-pop_280ms_ease-out] rounded-[48%_52%_43%_57%/52%_44%_56%_48%] opacity-85 mix-blend-multiply"
          style={{
            left: `${splash.x}%`,
            top: `${splash.y}%`,
            width: splash.size,
            height: splash.size * 0.82,
            backgroundColor: splash.color,
            transform: "translate(-50%, -50%) rotate(-10deg)",
          }}
        />
      ))}
      <div className="absolute bottom-8 left-8 right-8 rounded-3xl border-2 border-dashed border-[#6B3F24]/35 bg-[#FFF7E8]/82 p-5 text-[#4B2B19] backdrop-blur-sm">
        <p className="text-sm font-bold uppercase tracking-[0.26em] text-[#A2663A]">Interactive sketchbook</p>
        <p className="mt-2 text-2xl font-semibold">Splash ideas before opening a live room.</p>
      </div>
      <div className="absolute right-8 top-8 rotate-3 rounded-2xl bg-[#F3D9AA] px-4 py-3 text-sm font-medium text-[#5D3521] shadow-[5px_5px_0_#6B3F24]/40">
        color notes
      </div>
    </div>
  );
}
