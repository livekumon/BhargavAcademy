"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addChapterMarks, type MarksState } from "@/lib/actions/marks";
import { todayDateInput } from "@/lib/dates";

export function AddChapterMarkForm({
  batchId,
  courseId,
  syllabus,
  examPaper,
  chapters,
  lineId,
}: {
  batchId: string;
  courseId: string;
  syllabus: string;
  examPaper: string;
  chapters: { id: string; title: string }[];
  lineId: string;
}) {
  const [state, formAction, pending] = useActionState<MarksState, FormData>(
    addChapterMarks,
    {},
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <input type="hidden" name="batchId" value={batchId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="syllabus" value={syllabus} />
      <input type="hidden" name="examPaper" value={examPaper} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Chapters</legend>
        <p className="text-xs text-muted-foreground">
          Select every chapter covered in this written exam.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {chapters.map((chapter) => (
            <label
              key={chapter.id}
              className="flex items-start gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name="chapterIds"
                value={chapter.id}
                className="mt-1 size-4 accent-primary"
              />
              <span>{chapter.title}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor={`marks-${lineId}`}>Marks obtained</Label>
          <Input
            id={`marks-${lineId}`}
            name="marks"
            type="number"
            min={0}
            max={500}
            step={0.5}
            placeholder="81"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`recordedAt-${lineId}`}>Exam date</Label>
          <Input
            id={`recordedAt-${lineId}`}
            name="recordedAt"
            type="date"
            defaultValue={todayDateInput()}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save line"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
