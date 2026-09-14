import * as React from "react"
import { cn } from "cn"
import { Surface } from "./surface"

/**
 * The one empty state for the whole app. Replaces the card that was
 * copy-pasted across the teacher, student, and parent home pages.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Surface>, "title" | "children"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <Surface
      pad="lg"
      className={cn(
        "flex flex-col items-center gap-3 py-14 text-center sm:py-16",
        className
      )}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand [&_svg]:size-5"
        >
          {icon}
        </span>
      ) : null}
      <h2 className="font-heading text-title-2 font-semibold">{title}</h2>
      {description ? (
        <p className="max-w-md text-content-muted text-pretty">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Surface>
  )
}
