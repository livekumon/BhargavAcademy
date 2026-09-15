import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProgressMeter } from "@/components/ui/progress-meter"
import { StatusPill } from "@/components/ui/status-pill"
import { studentCoursePath } from "@/lib/paths"
import { summarizeOpenWork, type WorkTally } from "@/lib/student-work"

/** A course as one link: how far along it is and what is still open. */
export function CourseCard({
  course,
  work,
  showDescription = false,
}: {
  course: { id: string; title: string; description: string }
  work: WorkTally
  showDescription?: boolean
}) {
  const caughtUp = work.total > 0 && work.done === work.total
  const open = summarizeOpenWork(work)

  return (
    <Link
      href={studentCoursePath(course.id)}
      className="group flex h-full flex-col gap-4 rounded-xl bg-surface p-5 ring-1 ring-line transition-[box-shadow,transform] duration-(--dur-base) ease-out-quart hover:-translate-y-0.5 hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-title-2 font-semibold text-balance">
          {course.title}
        </h3>
        <StatusPill
          tone={work.total === 0 ? "neutral" : caughtUp ? "success" : work.toSubmit > 0 ? "warning" : "info"}
          dot
        >
          {work.total === 0 ? "Nothing assigned" : caughtUp ? "All caught up" : open}
        </StatusPill>
      </div>

      {showDescription && course.description ? (
        <p className="line-clamp-2 text-sm text-content-muted text-pretty">
          {course.description}
        </p>
      ) : null}

      <div className="mt-auto space-y-2">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-content-muted">
            <span className="tabular font-semibold text-content">{work.done}</span>
            {" of "}
            <span className="tabular">{work.total}</span> done
          </span>
          <span className="tabular text-content-subtle">{work.percent}%</span>
        </div>
        <ProgressMeter
          value={work.percent}
          tone={caughtUp ? "success" : "brand"}
          label={`${course.title} progress`}
        />
      </div>

      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
        {caughtUp ? "Review course" : "Continue"}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  )
}
