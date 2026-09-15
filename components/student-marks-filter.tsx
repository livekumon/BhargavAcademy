"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { type LookupChoice } from "@/lib/academics";
import { studentMarksPath } from "@/lib/paths";

const SELECT =
  "h-11 w-full appearance-none rounded-lg bg-surface pr-9 pl-3 text-sm ring-1 ring-line-strong outline-none transition-shadow duration-(--dur-fast) hover:ring-content-subtle focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-sunken disabled:text-content-subtle";

export function StudentMarksFilter({
  batches,
  selected,
  syllabuses,
  examPapers,
}: {
  batches: {
    id: string;
    name: string;
    courses: { id: string; title: string }[];
  }[];
  syllabuses: LookupChoice[];
  examPapers: LookupChoice[];
  selected: {
    batchId: string;
    courseId: string;
    syllabus: string;
    examPaper: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const selectedBatch = batches.find((batch) => batch.id === selected.batchId);
  const courses = selectedBatch?.courses ?? [];

  function go(next: Partial<typeof selected>) {
    const batchId = next.batchId ?? selected.batchId;
    const courseStillValid = batches
      .find((batch) => batch.id === batchId)
      ?.courses.some((course) => course.id === (next.courseId ?? selected.courseId));
    startTransition(() => {
      router.push(
        studentMarksPath({
          batchId,
          courseId: courseStillValid ? (next.courseId ?? selected.courseId) : "",
          syllabus: next.syllabus ?? selected.syllabus,
          examPaper: next.examPaper ?? selected.examPaper,
        }),
        { scroll: false },
      );
    });
  }

  const fields = [
    // With a single batch there is nothing to choose, so the field is left out.
    batches.length > 1
      ? {
          id: "batchId",
          label: "Batch",
          value: selected.batchId,
          placeholder: "Choose a batch",
          options: batches.map((batch) => ({ value: batch.id, label: batch.name })),
          onChange: (value: string) => go({ batchId: value, courseId: "" }),
        }
      : null,
    {
      id: "courseId",
      label: "Course",
      value: selected.courseId,
      placeholder: "Choose a course",
      disabled: !selected.batchId,
      options: courses.map((course) => ({ value: course.id, label: course.title })),
      onChange: (value: string) => go({ courseId: value }),
    },
    {
      id: "syllabus",
      label: "Syllabus",
      value: selected.syllabus,
      placeholder: "Choose a syllabus",
      options: syllabuses,
      onChange: (value: string) => go({ syllabus: value }),
    },
    {
      id: "examPaper",
      label: "Paper",
      value: selected.examPaper,
      placeholder: "Choose a paper",
      options: examPapers,
      onChange: (value: string) => go({ examPaper: value }),
    },
  ].filter((field) => field !== null);

  return (
    <div className="space-y-2">
      <div
        className={
          fields.length === 4
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            : "grid gap-4 sm:grid-cols-3"
        }
      >
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <div className="relative">
              <select
                id={field.id}
                name={field.id}
                required
                className={SELECT}
                value={field.value}
                disabled={field.disabled}
                onChange={(event) => field.onChange(event.target.value)}
              >
                <option value="">{field.placeholder}</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-content-subtle"
              />
            </div>
          </div>
        ))}
      </div>
      <p aria-live="polite" className="flex h-5 items-center gap-1.5 text-xs text-content-subtle">
        {pending ? (
          <>
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            Loading chapters…
          </>
        ) : null}
      </p>
    </div>
  );
}
