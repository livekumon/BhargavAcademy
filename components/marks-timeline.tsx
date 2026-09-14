import { Badge } from "@/components/ui/badge";
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
    return (
      <p className="text-sm text-muted-foreground">No marks logged yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-3 py-2"
        >
          <div>
            <p className="font-semibold">
              {entry.marks}
              {entry.chapterTitles.length > 0 ? (
                <span className="ml-2 font-normal text-muted-foreground">
                  {entry.chapterTitles.join(", ")}
                </span>
              ) : null}
            </p>
            <p className="text-xs text-muted-foreground">
              {showContext && entry.batchName
                ? `${entry.batchName} · ${entry.courseTitle} · `
                : ""}
              Exam date {formatDateInput(toDateInput(entry.recordedAt))}
              {formatDateTime(entry.createdAt)
                ? ` · logged ${formatDateTime(entry.createdAt)}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {optionLabel(syllabuses, entry.syllabus)}
            </Badge>
            <Badge variant="secondary">
              {optionLabel(examPapers, entry.examPaper)}
            </Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}
