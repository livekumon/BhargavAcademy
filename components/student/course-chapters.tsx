"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "cn"
import { WorkItemRow } from "@/components/student/work-item-row"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StatusPill, completionTone } from "@/components/ui/status-pill"
import { Surface } from "@/components/ui/surface"
import type { WorkItem } from "@/lib/student-work"

type Filter = "all" | "open" | "done"

const filters: { value: Filter; label: string }[] = [
  { value: "open", label: "To do" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
]

export type ChapterWork = {
  id: string
  number: number
  title: string
  description: string
  items: WorkItem[]
}

/**
 * A course's chapters as collapsible groups, filterable to what is left.
 * The first chapter with open work starts expanded so the student lands on it.
 */
export function CourseChapters({ chapters }: { chapters: ChapterWork[] }) {
  const all = chapters.flatMap((chapter) => chapter.items)
  const openCount = all.filter((item) => !item.done).length
  const doneCount = all.length - openCount

  const [filter, setFilter] = useState<Filter>(openCount > 0 ? "open" : "all")
  const [expanded, setExpanded] = useState<string[]>(() => {
    const firstOpen = chapters.find((chapter) =>
      chapter.items.some((item) => !item.done)
    )
    return [(firstOpen ?? chapters[0])?.id].filter(Boolean) as string[]
  })

  const visible = chapters
    .map((chapter) => ({
      ...chapter,
      shown: chapter.items.filter((item) =>
        filter === "all" ? true : filter === "open" ? !item.done : item.done
      ),
    }))
    .filter((chapter) => filter === "all" || chapter.shown.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-title-1 font-semibold">Chapters</h2>
        <div
          role="group"
          aria-label="Show"
          className="inline-flex items-center gap-1 rounded-full bg-sunken p-1 ring-1 ring-line"
        >
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors duration-(--dur-base) outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                filter === option.value
                  ? "bg-brand text-brand-fg shadow-elevation-sm"
                  : "text-content-muted hover:text-content"
              )}
            >
              {option.label}
              {option.value !== "all" ? (
                <span className="tabular opacity-80">
                  {option.value === "open" ? openCount : doneCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <Surface className="flex flex-col items-center gap-2 py-10 text-center">
          <CheckCircle2 aria-hidden="true" className="size-6 text-success" />
          <p className="font-medium">
            {filter === "open" ? "Nothing left to do here" : "Nothing finished yet"}
          </p>
          <p className="text-sm text-content-muted">
            {filter === "open"
              ? "Every item in this course is done."
              : "Items move here as you revise and submit them."}
          </p>
        </Surface>
      ) : (
        <Surface pad="none" className="px-4 sm:px-6">
          <Accordion type="multiple" value={expanded} onValueChange={setExpanded}>
            {visible.map((chapter) => {
              const done = chapter.items.filter((item) => item.done).length
              return (
                <AccordionItem key={chapter.id} value={chapter.id}>
                  <AccordionTrigger className="items-center py-4">
                    <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium tracking-wide text-content-subtle uppercase">
                          Chapter {chapter.number}
                        </span>
                        <span className="block text-balance">{chapter.title}</span>
                      </span>
                      <span className="flex items-center gap-3 sm:w-48">
                        {/* Decorative: a progressbar role cannot live inside a button. The pill carries the value. */}
                        <span aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                          <span
                            className={cn(
                              "block h-full rounded-full transition-[width] duration-(--dur-slow) ease-out-quart",
                              done === chapter.items.length && done > 0 ? "bg-success" : "bg-brand"
                            )}
                            style={{
                              width: `${chapter.items.length === 0 ? 0 : Math.round((done / chapter.items.length) * 100)}%`,
                            }}
                          />
                        </span>
                        <StatusPill tone={completionTone(done, chapter.items.length)} size="sm">
                          <span className="tabular">
                            {done} of {chapter.items.length} done
                          </span>
                        </StatusPill>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pr-0 pb-4">
                    {chapter.description ? (
                      <p className="mb-2 px-3 text-sm text-content-muted">{chapter.description}</p>
                    ) : null}
                    {chapter.shown.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-content-subtle">
                        Nothing assigned to you in this chapter yet.
                      </p>
                    ) : (
                      <ul className="-mx-3">
                        {chapter.shown.map((item) => (
                          <li key={item.id}>
                            <WorkItemRow item={item} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </Surface>
      )}
    </div>
  )
}
