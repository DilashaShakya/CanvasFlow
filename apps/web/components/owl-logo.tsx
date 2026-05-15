import { cn } from "@/lib/utils";

type OwlLogoProps = {
  className?: string;
  markClassName?: string;
  showText?: boolean;
};

export function OwlLogo({ className, markClassName, showText = true }: OwlLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-900/20 bg-[#E7C494] shadow-lg shadow-amber-950/15",
          markClassName,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="h-8 w-8" role="img">
          <path d="M13 7c7 5 14 4 19 4s12 1 19-4c-1 8 0 13 3 19 3 18-8 32-22 32S7 44 10 26c3-6 4-11 3-19Z" fill="#6B3F24" />
          <path d="M17 25c0-9 7-15 15-15s15 6 15 15c0 16-7 27-15 27S17 41 17 25Z" fill="#CFA676" />
          <circle cx="24" cy="25" r="11" fill="#F7E8C8" />
          <circle cx="40" cy="25" r="11" fill="#F7E8C8" />
          <circle cx="24" cy="25" r="6" fill="#2B160E" />
          <circle cx="40" cy="25" r="6" fill="#2B160E" />
          <circle cx="27" cy="22" r="1.5" fill="#FFF7E8" />
          <circle cx="43" cy="22" r="1.5" fill="#FFF7E8" />
          <path d="M28 32h8l-4 7-4-7Z" fill="#D97724" />
          <path d="M20 39c3 3 6 3 9 0M35 39c3 3 6 3 9 0M25 47c3 3 6 3 9 0" fill="none" stroke="#6B3F24" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
      {showText ? (
        <div>
          <p className="text-sm font-semibold tracking-wide text-[#F8E8C8]">CanvasFlow</p>
          <p className="text-xs text-[#BFA07B]">Brown sketchbook collaboration</p>
        </div>
      ) : null}
    </div>
  );
}
