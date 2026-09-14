import * as React from "react"
import { cn } from "cn"
import { Surface } from "./surface"

/**
 * A single number with its label. Figures are tabular so a row of these
 * never shifts as values change.
 */
export function StatCard({
  value,
  label,
  hint,
  icon,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Surface>, "children"> & {
  value: React.ReactNode
  label: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <Surface
      pad="sm"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-content-muted">{label}</span>
        {icon ? (
          <span aria-hidden="true" className="text-content-subtle">
            {icon}
          </span>
        ) : null}
      </div>
      <span className="font-heading tabular text-title-1 font-semibold">
        {value}
      </span>
      {hint ? (
        <span className="text-sm text-content-subtle text-pretty">{hint}</span>
      ) : null}
    </Surface>
  )
}
