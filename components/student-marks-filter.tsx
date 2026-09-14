"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { SELECT_CLASS_NAME, type LookupChoice } from "@/lib/academics";
import { studentMarksPath } from "@/lib/paths";

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
  const selectedBatch = batches.find((batch) => batch.id === selected.batchId);
  const courses = selectedBatch?.courses ?? [];

  function go(next: Partial<typeof selected>) {
    const batchId = next.batchId ?? selected.batchId;
    const courseStillValid = batches
      .find((batch) => batch.id === batchId)
      ?.courses.some((course) => course.id === (next.courseId ?? selected.courseId));
    router.push(
      studentMarksPath({
        batchId,
        courseId: courseStillValid
          ? (next.courseId ?? selected.courseId)
          : "",
        syllabus: next.syllabus ?? selected.syllabus,
        examPaper: next.examPaper ?? selected.examPaper,
      }),
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="batchId">Batch</Label>
        <select
          id="batchId"
          name="batchId"
          required
          className={SELECT_CLASS_NAME}
          value={selected.batchId}
          onChange={(event) => go({ batchId: event.target.value, courseId: "" })}
        >
          <option value="">Choose a batch</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="courseId">Course</Label>
        <select
          id="courseId"
          name="courseId"
          required
          className={SELECT_CLASS_NAME}
          value={selected.courseId}
          disabled={!selected.batchId}
          onChange={(event) => go({ courseId: event.target.value })}
        >
          <option value="">Choose a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="syllabus">Syllabus</Label>
        <select
          id="syllabus"
          name="syllabus"
          required
          className={SELECT_CLASS_NAME}
          value={selected.syllabus}
          onChange={(event) => go({ syllabus: event.target.value })}
        >
          <option value="">Choose a syllabus</option>
          {syllabuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="examPaper">Paper</Label>
        <select
          id="examPaper"
          name="examPaper"
          required
          className={SELECT_CLASS_NAME}
          value={selected.examPaper}
          onChange={(event) => go({ examPaper: event.target.value })}
        >
          <option value="">Choose a paper</option>
          {examPapers.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
