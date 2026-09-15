import type { ReactNode } from "react";
import { cn } from "cn";

const tones = {
  brand: "stroke-brand",
  highlight: "stroke-highlight",
  success: "stroke-success",
} as const;

/** A circular progressbar for places where a bar would get lost. */
export function ProgressRing({
  value,
  label,
  tone = "brand",
  size = 72,
  children,
  className,
}: {
  value: number;
  label: string;
  tone?: keyof typeof tones;
  size?: number;
  children?: ReactNode;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-sunken" />
        {clamped > 0 ? (
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - clamped}
            className={cn("animate-draw", tones[tone])}
          />
        ) : null}
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
