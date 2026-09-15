import type { Metadata } from "next";
import { History } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StudentMarksEditor } from "@/components/student-marks-editor";
import { StudentMarksFilter } from "@/components/student-marks-filter";
import { MarkRow } from "@/components/student/mark-row";
import { MarksTabs } from "@/components/student/marks-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { defaultExamPaper, optionLabel, parseOption } from "@/lib/academics";
import { requireStudent } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { getCourseChapters, getStudentMarksWorkspace } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Marks",
};

export default async function StudentMarksPage({
  searchParams,
}: {
  searchParams: Promise<{
    batchId?: string | string[];
    courseId?: string | string[];
    syllabus?: string | string[];
    examPaper?: string | string[];
  }>;
}) {
  const student = await requireStudent();
  const query = await searchParams;
  const [workspace, catalog] = await Promise.all([
    getStudentMarksWorkspace(student.id),
    getLookupCatalog(),
  ]);
  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);
  const examPapers = lookupChoices(catalog.exam_paper);

  const batchId = firstValue(query.batchId) ?? workspace.batches[0]?.id ?? "";
  const selectedBatch = workspace.batches.find((batch) => batch.id === batchId);
  const requestedCourse = firstValue(query.courseId);
  // A batch with a single course needs no choosing, so pick it.
  const courseId = selectedBatch?.courses.some((course) => course.id === requestedCourse)
    ? (requestedCourse ?? "")
    : selectedBatch?.courses.length === 1
      ? selectedBatch.courses[0].id
      : "";
  const syllabus =
    parseOption(syllabuses, firstValue(query.syllabus) ?? student.syllabus) ?? "";
  const examPaper =
    parseOption(examPapers, firstValue(query.examPaper)) ??
    parseOption(examPapers, defaultExamPaper(student.exam)) ??
    "";

  const selectedCourse = selectedBatch?.courses.find(
    (course) => course.id === courseId,
  );
  const chapters =
    selectedBatch && selectedCourse
      ? await getCourseChapters(selectedCourse.id)
      : [];
  const ready = Boolean(selectedBatch && selectedCourse && syllabus && examPaper);
  const entries = workspace.marks.filter(
    (entry) =>
      entry.batchId === batchId &&
      entry.courseId === courseId &&
      entry.syllabus === syllabus &&
      entry.examPaper === examPaper,
  );

  const byCourse = new Map<string, { title: string; entries: typeof workspace.marks }>();
  for (const entry of workspace.marks) {
    const group = byCourse.get(entry.courseId) ?? { title: entry.courseTitle, entries: [] };
    group.entries.push(entry);
    byCourse.set(entry.courseId, group);
  }

  const history =
    workspace.marks.length === 0 ? (
      <EmptyState
        icon={<History />}
        title="No marks logged yet"
        description="After each written exam, log your score in “Log an exam”. Your marks build up here, newest first, so you can see how each course is going."
      />
    ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        {[...byCourse.entries()].map(([id, group]) => (
          <Surface key={id} pad="none">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="font-heading text-title-2 font-semibold">{group.title}</h2>
              <span className="text-sm text-content-subtle">
                <span className="tabular">{group.entries.length}</span>{" "}
                {group.entries.length === 1 ? "exam" : "exams"}
              </span>
            </div>
            <ul className="divide-y divide-line px-5">
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <MarkRow entry={entry} syllabuses={syllabuses} examPapers={examPapers} />
                </li>
              ))}
            </ul>
          </Surface>
        ))}
      </div>
    );

  const log =
    workspace.batches.length === 0 ? (
      <EmptyState
        title="You're not in a batch yet"
        description="Once your teacher enrols you in a batch, you can log marks for its courses here."
      />
    ) : (
      <div className="space-y-6">
        <Surface className="space-y-4">
          <div>
            <h2 className="font-heading text-title-2 font-semibold">Which exam?</h2>
            <p className="text-sm text-content-muted">
              We&apos;ve filled in what we could from your profile.
            </p>
          </div>
          <StudentMarksFilter
            batches={workspace.batches}
            syllabuses={syllabuses}
            examPapers={examPapers}
            selected={{ batchId, courseId, syllabus, examPaper }}
          />
        </Surface>

        {ready ? (
          chapters.length === 0 ? (
            <Surface>
              <p className="text-sm text-content-muted">
                {selectedCourse?.title} has no chapters yet. Ask your teacher to add
                them, then you can log marks against them.
              </p>
            </Surface>
          ) : (
            <StudentMarksEditor
              // Remount after a save so a fresh blank line is ready for the next exam.
              key={`${courseId}-${syllabus}-${examPaper}-${entries.length}`}
              batchId={batchId}
              courseId={courseId}
              syllabus={syllabus}
              examPaper={examPaper}
              chapters={chapters}
              entries={entries}
              syllabuses={syllabuses}
              examPapers={examPapers}
            />
          )
        ) : (
          <p className="px-1 text-sm text-content-subtle">
            Choose the remaining options above to start logging.
          </p>
        )}
      </div>
    );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Marks"
        title="Your exam marks"
        description="Log your score after each written exam and see every result in one place."
        actions={
          student.syllabus && student.exam ? (
            <StatusPill tone="brand">
              {optionLabel(syllabuses, student.syllabus)} · {optionLabel(exams, student.exam)}
            </StatusPill>
          ) : null
        }
      />

      <MarksTabs
        defaultTab={
          firstValue(query.courseId) || workspace.marks.length === 0 ? "log" : "history"
        }
        historyCount={workspace.marks.length}
        history={history}
        log={log}
      />
    </div>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
