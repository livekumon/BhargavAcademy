import * as React from "react"
import { cn } from "cn"
import { Container } from "./container"

const spacing = {
  sm: "py-10 sm:py-14",
  md: "py-14 sm:py-20",
  lg: "py-20 sm:py-28",
} as const

/**
 * A vertical band of the page. Owns its own rhythm so sibling sections
 * never disagree about spacing.
 */
export function Section({
  className,
  innerClassName,
  space = "md",
  width = "lg",
  bleed = false,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  space?: keyof typeof spacing
  width?: React.ComponentProps<typeof Container>["width"]
  innerClassName?: string
  /** Skip the Container when the section paints edge to edge itself. */
  bleed?: boolean
}) {
  return (
    <section
      data-slot="section"
      className={cn(spacing[space], className)}
      {...props}
    >
      {bleed ? (
        children
      ) : (
        <Container width={width} className={innerClassName}>
          {children}
        </Container>
      )}
    </section>
  )
}

/** Eyebrow + heading + lead, centred or left aligned. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  lead?: React.ReactNode
  align?: "left" | "center"
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow ? (
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium tracking-wide text-brand-subtle-fg uppercase">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-heading text-display-3 font-semibold text-balance">
        {title}
      </h2>
      {lead ? (
        <p
          className={cn(
            "text-lead text-content-muted text-pretty",
            align === "center" ? "max-w-2xl" : "max-w-xl"
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  )
}
