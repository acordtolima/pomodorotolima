import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Phase } from "@/lib/pomodoro-logic";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressRing({
  progress,
  phase,
  label,
  children,
}: {
  progress: number;
  phase: Phase;
  label: string;
  children: ReactNode;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const shown = clamped <= 0 ? 0.012 : clamped;
  const offset = CIRCUMFERENCE * (1 - shown);

  return (
    <div
      className="relative size-56 sm:size-72"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={label}
    >
      <svg
        viewBox="0 0 120 120"
        className={cn("size-full -rotate-90", phase === "focus" ? "text-focus" : "text-rest")}
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="6" className="stroke-line" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="ring-arc stroke-current"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center px-10">{children}</div>
    </div>
  );
}
