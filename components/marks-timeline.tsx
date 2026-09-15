import { StatusPill } from "@/components/ui/status-pill";
import { optionLabel, type LookupChoice } from "@/lib/academics";
import { formatDateTime, toDateInput, formatDateInput } from "@/lib/dates";

export type MarkEntry = {
  id: string;
  marks: number;
  syllabus: string;
  examPaper: string;
  recordedAt: Date;
  createdAt: Date;
  batchName?: string;
  courseTitle?: string;
  chapterTitles: string[];
};

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MarksTimeline({
  entries,
  showContext = false,
  syllabuses,
  examPapers,
}: {
  entries: MarkEntry[];
  showContext?: boolean;
  syllabuses: LookupChoice[];
  examPapers: LookupChoice[];
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-content-muted">No marks logged yet.</p>;
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
      {entries.map((entry) => {
        const logged = formatDateTime(entry.createdAt);
        return (
          <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <span className="font-heading tabular min-w-14 text-title-2 font-semibold">
              {formatScore(entry.marks)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-pretty">
                {entry.chapterTitles.join(", ") || "Marks"}
              </p>
              <p className="text-xs text-content-subtle">
                {showContext && entry.batchName
                  ? `${entry.batchName} · ${entry.courseTitle} · `
                  : ""}
                Exam date {formatDateInput(toDateInput(entry.recordedAt))}
                {logged ? ` · logged ${logged}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatusPill tone="neutral">{optionLabel(syllabuses, entry.syllabus)}</StatusPill>
              <StatusPill tone="brand">{optionLabel(examPapers, entry.examPaper)}</StatusPill>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
