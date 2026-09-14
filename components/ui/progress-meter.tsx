import * as React from "react"
import { cn } from "cn"

const tones = {
  brand: "bg-brand",
  highlight: "bg-highlight",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
} as const

/**
 * An accessible progress bar. Always announces its value — the bare divs
 * this replaces were invisible to assistive tech.
 */
export function ProgressMeter({
  value,
  label,
  tone = "brand",
  size = "default",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** 0–100. Clamped. */
  value: number
  label: string
  tone?: keyof typeof tones
  size?: "sm" | "default" | "lg"
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div
      data-slot="progress-meter"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full bg-sunken",
        size === "sm" && "h-1.5",
        size === "default" && "h-2",
        size === "lg" && "h-2.5",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-(--dur-slow) ease-out-quart",
          tones[tone]
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
