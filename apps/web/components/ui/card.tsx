import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-2xl border border-[#E7C494]/18 bg-[#24130C]/78 p-6 shadow-2xl shadow-amber-950/25", className)}>
      {children}
    </div>
  );
}
