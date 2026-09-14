import type { Metadata } from "next";
import { StudentMarksEditor } from "@/components/student-marks-editor";
import { StudentMarksFilter } from "@/components/student-marks-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultExamPaper, optionLabel, parseOption } from "@/lib/academics";
import { requireStudent } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { getCourseChapters, getStudentMarksWorkspace } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Chapter marks",
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
  const courseId =
    selectedBatch?.courses.some((course) => course.id === firstValue(query.courseId))
      ? (firstValue(query.courseId) ?? "")
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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Marks</p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          Log chapter marks
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Choose a batch, course, syllabus, and paper. Then add a line for each
          written exam, select the chapters it covered, and enter the marks.
        </p>
        {student.syllabus && student.exam ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your profile: {optionLabel(syllabuses, student.syllabus)} ·{" "}
            {optionLabel(exams, student.exam)}
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Select what to score</CardTitle>
          <CardDescription>
            After you choose a paper, add a line to pick chapters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workspace.batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You are not enrolled in a batch yet.
            </p>
          ) : (
            <StudentMarksFilter
              batches={workspace.batches}
              syllabuses={syllabuses}
              examPapers={examPapers}
              selected={{ batchId, courseId, syllabus, examPaper }}
            />
          )}
        </CardContent>
      </Card>

      {ready ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {selectedCourse?.title}
            </CardTitle>
            <CardDescription>
              One line is one exam attempt. Select every chapter that paper
              included, then enter the marks and exam date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chapters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ask your teacher to add chapters to {selectedCourse?.title}.
              </p>
            ) : (
              <StudentMarksEditor
                batchId={batchId}
                courseId={courseId}
                syllabus={syllabus}
                examPaper={examPaper}
                chapters={chapters}
                entries={entries}
                syllabuses={syllabuses}
                examPapers={examPapers}
              />
            )}
          </CardContent>
        </Card>
      ) : workspace.batches.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Select a batch, course, syllabus, and paper to add marks.
        </p>
      ) : null}
    </div>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
