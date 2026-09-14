import * as React from "react"
import { cn } from "cn"

/** A placeholder block for loading.tsx files. Sized by the caller. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-sunken", className)}
      {...props}
    />
  )
}
