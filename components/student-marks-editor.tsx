"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddChapterMarkForm } from "@/components/add-chapter-mark-form";
import { MarksTimeline, type MarkEntry } from "@/components/marks-timeline";
import { Button } from "@/components/ui/button";
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
  const [lineIds, setLineIds] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <MarksTimeline
        entries={entries}
        syllabuses={syllabuses}
        examPapers={examPapers}
      />
      {lineIds.map((lineId) => (
        <AddChapterMarkForm
          key={lineId}
          lineId={lineId}
          batchId={batchId}
          courseId={courseId}
          syllabus={syllabus}
          examPaper={examPaper}
          chapters={chapters}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => setLineIds((current) => [...current, crypto.randomUUID()])}
      >
        <Plus />
        Add a new line
      </Button>
    </div>
  );
}
