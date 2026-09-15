import Link from "next/link"
import { ChevronRight, ClipboardList, FileText } from "lucide-react"
import { cn } from "cn"
import { StatusPill } from "@/components/ui/status-pill"
import type { WorkItem } from "@/lib/student-work"

/**
 * One piece of assigned work as a single tap target. The whole row is the
 * link, so the status and chevron are plain spans — nothing interactive nests.
 */
export function WorkItemRow({
  item,
  context = "chapter",
  className,
}: {
  item: WorkItem
  /** What to show under the title: the chapter, or course and chapter. */
  context?: "chapter" | "course"
  className?: string
}) {
  const Icon = item.kind === "assignment" ? ClipboardList : FileText

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex min-h-14 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1",
          item.done
            ? "bg-success-subtle text-success-subtle-fg ring-success-line"
            : "bg-brand-subtle text-brand-subtle-fg ring-brand-line"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-medium",
            item.done ? "text-content-muted" : "text-content"
          )}
        >
          {item.title}
        </span>
        <span className="block truncate text-sm text-content-subtle">
          {item.kind === "assignment" ? "Assignment" : "Class material"}
          {" · "}
          {context === "course"
            ? `${item.courseTitle} · ${item.chapterTitle}`
            : item.chapterTitle}
        </span>
      </span>
      <StatusPill tone={item.status.tone} dot className="hidden sm:inline-flex">
        {item.status.label}
      </StatusPill>
      <StatusPill tone={item.status.tone} size="sm" className="sm:hidden">
        {item.status.label}
      </StatusPill>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-content-subtle transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
      />
    </Link>
  )
}
