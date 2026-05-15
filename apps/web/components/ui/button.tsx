"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#8A552F] text-[#FFF5DF] shadow-lg shadow-amber-950/25 hover:bg-[#A2663A]",
        variant === "secondary" &&
          "border border-[#E7C494]/20 bg-[#3A2115]/65 text-[#F8E8C8] hover:border-[#D8943B]/50 hover:bg-[#5D3521]/70",
        variant === "ghost" && "text-[#EAD3AD] hover:bg-[#E7C494]/10",
        className,
      )}
      {...props}
    />
  );
}
