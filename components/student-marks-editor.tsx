"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddChapterMarkForm } from "@/components/add-chapter-mark-form";
import { type MarkEntry } from "@/components/marks-timeline";
import { MarkRow } from "@/components/student/mark-row";
import { type LookupChoice } from "@/lib/academics";

export function StudentMarksEditor({
  batchId,
  courseId,
  syllabus,
  examPaper,
  chapters,
  entries,
  syllabuses,
  examPapers,
}: {
  batchId: string;
  courseId: string;
  syllabus: string;
  examPaper: string;
  chapters: { id: string; title: string }[];
  entries: MarkEntry[];
  syllabuses: LookupChoice[];
  examPapers: LookupChoice[];
}) {
  // Start with one blank line open — the student came here to log an exam.
  // The first id is fixed so server and client render the same input ids.
  const [lineIds, setLineIds] = useState<string[]>(["first"]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {lineIds.map((lineId, index) => (
          <AddChapterMarkForm
            key={lineId}
            lineId={lineId}
            heading={lineIds.length > 1 ? `Exam ${index + 1}` : "New exam"}
            batchId={batchId}
            courseId={courseId}
            syllabus={syllabus}
            examPaper={examPaper}
            chapters={chapters}
            onRemove={
              lineIds.length > 1
                ? () => setLineIds((current) => current.filter((id) => id !== lineId))
                : undefined
            }
          />
        ))}
        <button
          type="button"
          onClick={() => setLineIds((current) => [...current, crypto.randomUUID()])}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong px-4 text-sm font-medium text-content-muted transition-colors duration-(--dur-fast) hover:border-brand hover:text-brand focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add another exam
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-content-muted">
          Already logged for this course and paper
        </h3>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-content-subtle">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <li key={entry.id}>
                <MarkRow entry={entry} syllabuses={syllabuses} examPapers={examPapers} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
