import * as React from "react"
import { cn } from "cn"

/**
 * The standard top block of every in-app page: optional breadcrumb,
 * eyebrow, title, description, and right-aligned actions.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {breadcrumb ? <div>{breadcrumb}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-sm font-medium text-brand">{eyebrow}</p>
          ) : null}
          <h1 className="font-heading mt-1 text-display-3 font-semibold text-balance">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-content-muted text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
