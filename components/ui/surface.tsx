import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const surfaceVariants = cva("rounded-xl", {
  variants: {
    tone: {
      surface: "bg-surface",
      raised: "bg-raised",
      sunken: "bg-sunken",
      brand: "bg-brand-subtle",
      inverse: "bg-inverse-surface text-content-inverse",
      transparent: "bg-transparent",
    },
    border: {
      none: "",
      hairline: "ring-1 ring-line",
      strong: "ring-1 ring-line-strong",
    },
    elevation: {
      none: "",
      sm: "shadow-elevation-sm",
      md: "shadow-elevation-md",
      lg: "shadow-elevation-lg",
      xl: "shadow-elevation-xl",
    },
    pad: {
      none: "",
      sm: "p-4",
      default: "p-5 sm:p-6",
      lg: "p-6 sm:p-8",
    },
  },
  defaultVariants: {
    tone: "surface",
    border: "hairline",
    elevation: "none",
    pad: "default",
  },
})

/**
 * A neutral panel. Use this instead of hand-rolling
 * `rounded-* border bg-card p-*` on every page.
 */
function Surface({
  className,
  tone,
  border,
  elevation,
  pad,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof surfaceVariants>) {
  return (
    <div
      data-slot="surface"
      className={cn(
        surfaceVariants({ tone, border, elevation, pad }),
        className
      )}
      {...props}
    />
  )
}

export { Surface, surfaceVariants }
