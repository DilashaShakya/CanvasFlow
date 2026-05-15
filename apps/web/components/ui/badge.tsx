import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export function Badge({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-[#E7C494]/20 bg-[#E7C494]/10 px-3 py-1 text-xs text-[#F8E8C8]", className)}>
      {children}
    </span>
  );
}
