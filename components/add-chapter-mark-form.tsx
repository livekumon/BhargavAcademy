"use client";

import { useActionState } from "react";
import { Check, Loader2, X } from "lucide-react";
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
  heading = "New exam",
  onRemove,
}: {
  batchId: string;
  courseId: string;
  syllabus: string;
  examPaper: string;
  chapters: { id: string; title: string }[];
  lineId: string;
  heading?: string;
  onRemove?: () => void;
}) {
  const [state, formAction, pending] = useActionState<MarksState, FormData>(
    addChapterMarks,
    {},
  );

  return (
    <form
      action={formAction}
      aria-label={heading}
      className="space-y-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5"
    >
      <input type="hidden" name="batchId" value={batchId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="syllabus" value={syllabus} />
      <input type="hidden" name="examPaper" value={examPaper} />

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-title-3 font-semibold">{heading}</h3>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${heading}`}
            className="flex size-9 items-center justify-center rounded-lg text-content-subtle transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium">Chapters in this exam</legend>
        <p className="text-xs text-content-subtle">Tap every chapter the paper covered.</p>
        <div className="flex flex-wrap gap-2">
          {chapters.map((chapter) => (
            <label key={chapter.id} className="group relative">
              <input
                type="checkbox"
                name="chapterIds"
                value={chapter.id}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm ring-1 ring-line-strong transition-colors duration-(--dur-fast) select-none hover:bg-sunken peer-checked:bg-brand-subtle peer-checked:text-brand-subtle-fg peer-checked:ring-brand peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 [&>svg]:hidden peer-checked:[&>svg]:block">
                <Check aria-hidden="true" className="size-3.5" />
                {chapter.title}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor={`marks-${lineId}`}>Marks obtained</Label>
          <Input
            id={`marks-${lineId}`}
            name="marks"
            type="number"
            inputMode="decimal"
            min={0}
            max={500}
            step={0.5}
            placeholder="e.g. 81"
            required
            className="h-11 font-mono tabular"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`recordedAt-${lineId}`}>Exam date</Label>
          <Input
            id={`recordedAt-${lineId}`}
            name="recordedAt"
            type="date"
            defaultValue={todayDateInput()}
            max={todayDateInput()}
            required
            className="h-11"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-brand-fg shadow-elevation-sm transition-[background-color,box-shadow] duration-(--dur-fast) hover:bg-brand-hover hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save marks"
          )}
        </button>
      </div>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
