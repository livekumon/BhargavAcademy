import * as React from "react"
import { cn } from "cn"

const widths = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const

/**
 * The single source of truth for page gutters and measure.
 * Never hand-write `mx-auto max-w-* px-*` again.
 */
export function Container({
  className,
  width = "lg",
  ...props
}: React.ComponentProps<"div"> & { width?: keyof typeof widths }) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        widths[width],
        className
      )}
      {...props}
    />
  )
}
