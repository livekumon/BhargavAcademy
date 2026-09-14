import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const statusPillVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      tone: {
        neutral: "border-line bg-sunken text-content-muted",
        brand: "border-brand-line bg-brand-subtle text-brand-subtle-fg",
        highlight:
          "border-highlight-line bg-highlight-subtle text-highlight-subtle-fg",
        success: "border-success-line bg-success-subtle text-success-subtle-fg",
        warning: "border-warning-line bg-warning-subtle text-warning-subtle-fg",
        info: "border-info-line bg-info-subtle text-info-subtle-fg",
        danger: "border-danger-line bg-danger-subtle text-danger-subtle-fg",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.6875rem]",
        default: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "default" },
  }
)

export type StatusTone = NonNullable<
  VariantProps<typeof statusPillVariants>["tone"]
>

function StatusPill({
  className,
  tone,
  size,
  dot = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof statusPillVariants> & { dot?: boolean }) {
  return (
    <span
      data-slot="status-pill"
      data-tone={tone}
      className={cn(statusPillVariants({ tone, size }), className)}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current opacity-70"
        />
      ) : null}
      {props.children}
    </span>
  )
}

/**
 * Maps a completion count onto a tone so every screen reports progress
 * the same way: nothing assigned is neutral, all done is success,
 * partial is warning.
 */
export function completionTone(completed: number, total: number): StatusTone {
  if (total === 0) return "neutral"
  if (completed >= total) return "success"
  if (completed === 0) return "warning"
  return "info"
}

export { StatusPill, statusPillVariants }
