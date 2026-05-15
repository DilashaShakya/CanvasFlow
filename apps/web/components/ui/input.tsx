"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-[#E7C494]/20 bg-[#160C08]/60 px-3 text-sm text-[#FFF5DF] outline-none transition placeholder:text-[#BFA07B] focus:border-[#D8943B] focus:ring-2 focus:ring-[#D8943B]/20 dark:bg-[#160C08]/60",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
