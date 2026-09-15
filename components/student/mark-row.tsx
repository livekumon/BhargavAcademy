import { StatusPill } from "@/components/ui/status-pill"
import { optionLabel, type LookupChoice } from "@/lib/academics"
import { startOfDateInput, toDateInput } from "@/lib/dates"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** One logged exam: a date tile, the chapters it covered, and the score. */
export function MarkRow({
  entry,
  syllabuses,
  examPapers,
}: {
  entry: {
    marks: number
    syllabus: string
    examPaper: string
    recordedAt: Date
    chapterTitles: string[]
  }
  syllabuses: LookupChoice[]
  examPapers: LookupChoice[]
}) {
  const date = startOfDateInput(toDateInput(entry.recordedAt))

  return (
    <div className="flex items-center gap-4 py-3">
      <time
        dateTime={toDateInput(entry.recordedAt)}
        className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-sunken py-1.5 leading-none ring-1 ring-line"
      >
        <span className="tabular text-lg font-semibold">{date.getDate()}</span>
        <span className="mt-0.5 text-[0.6875rem] text-content-subtle uppercase">
          {MONTHS[date.getMonth()]} {String(date.getFullYear()).slice(2)}
        </span>
      </time>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-sm font-medium text-pretty">
          {entry.chapterTitles.length > 0 ? entry.chapterTitles.join(", ") : "No chapters recorded"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill size="sm">{optionLabel(syllabuses, entry.syllabus)}</StatusPill>
          <StatusPill size="sm">{optionLabel(examPapers, entry.examPaper)}</StatusPill>
        </div>
      </div>
      <span className="shrink-0 text-right">
        <span className="block font-mono tabular text-2xl font-semibold">{entry.marks}</span>
        <span className="block text-[0.6875rem] text-content-subtle">marks</span>
      </span>
    </div>
  )
}
