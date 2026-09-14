import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ClipboardList, FileText, Plus, Upload } from "lucide-react";
import { BatchUploadSheet } from "@/components/batch-upload-sheet";
import { BatchWindowForm } from "@/components/batch-window-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteBatch } from "@/lib/actions/batches";
import { deleteStudent } from "@/lib/actions/students";
import { requireTeacher } from "@/lib/auth";
import { formatDateInput, resolveBatchWindow } from "@/lib/dates";
import { optionLabel } from "@/lib/academics";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import {
  batchPath,
  coursePath,
  enrollBatchStudentsPath,
  studentManagePath,
} from "@/lib/paths";
import {
  getBatchCourse,
  getBatchCourseChapters,
  getBatchProgressMatrix,
  getLatestBatchCompletionDate,
  getOwnedBatch,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Batch dashboard",
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    all?: string | string[];
  }>;
}) {
  const { batchId } = await params;
  const rawQuery = await searchParams;
  const query = {
    from: firstQueryValue(rawQuery.from),
    to: firstQueryValue(rawQuery.to),
    all: firstQueryValue(rawQuery.all),
  };
  const teacher = await requireTeacher();
  const [batch, catalog] = await Promise.all([
    getOwnedBatch(teacher.id, batchId),
    getLookupCatalog(),
  ]);

  if (!batch) {
    notFound();
  }

  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);

  const latestDate = await getLatestBatchCompletionDate(batch.id);
  const window = resolveBatchWindow(query, latestDate);
  const [progress, course] = await Promise.all([
    getBatchProgressMatrix(batch.id, window.from, window.to),
    getBatchCourse(batch.id),
  ]);
  const chapters = course
    ? await getBatchCourseChapters(batch.id, course.id)
    : [];

  const windowLabel =
    window.preset === "all"
      ? "All time"
      : window.from === window.to
        ? formatDateInput(window.from ?? "")
        : `${formatDateInput(window.from ?? "")} – ${formatDateInput(window.to ?? "")}`;

  return (
    <div className="space-y-10">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href="/dashboard">Back to batches</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Batch dashboard</p>
            <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
              {batch.name}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {batch.description || "No description yet."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={enrollBatchStudentsPath(batch.id)}>
                <Plus data-icon="inline-start" />
                Add student
              </Link>
            </Button>
            {course ? (
              <BatchUploadSheet
                batchId={batch.id}
                batchName={batch.name}
                courseId={course.id}
                courseTitle={course.title}
                chapters={chapters}
                trigger={
                  <Button variant="secondary">
                    <Upload data-icon="inline-start" />
                    Upload material
                  </Button>
                }
              />
            ) : null}
            <Button asChild variant="outline">
              <Link href={`${batchPath(batch.id)}/edit`}>Edit batch</Link>
            </Button>
            <form action={deleteBatch.bind(null, batch.id)}>
              <ConfirmSubmitButton message="Delete this batch and its students? Shared courses stay in your library. PDFs uploaded for this batch will be removed.">
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Student progress</h2>
          <p className="text-sm text-muted-foreground">
            Completions in this window: {windowLabel}. Assigned totals stay the
            same; only work marked done in the selected dates is counted.
          </p>
        </div>

        <BatchWindowForm
          batchId={batch.id}
          from={window.from}
          to={window.to}
          latestDate={latestDate}
        />

        {progress.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No students yet</CardTitle>
              <CardDescription>
                Select an existing student to start seeing reading and
                assignment progress. New students are added from the Students
                tab.
              </CardDescription>
              <CardAction>
                <Button asChild size="icon" aria-label="Add existing students">
                  <Link href={enrollBatchStudentsPath(batch.id)}>
                    <Plus />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Class material</th>
                  <th className="px-4 py-3 font-medium">Assignments</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((row) => {
                  const readingDone =
                    row.classMaterialAssigned > 0 &&
                    row.classMaterialCompleted === row.classMaterialAssigned;
                  return (
                    <tr key={row.student.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.student.email}
                          {row.student.syllabus || row.student.exam
                            ? ` · ${optionLabel(syllabuses, row.student.syllabus) || "No syllabus"} · ${optionLabel(exams, row.student.exam) || "No exam"}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <BookOpen className="size-4 text-muted-foreground" />
                          <span className="font-medium">
                            {row.classMaterialCompleted} of{" "}
                            {row.classMaterialAssigned}
                          </span>
                          <Badge
                            variant={readingDone ? "default" : "secondary"}
                          >
                            {row.classMaterialAssigned === 0
                              ? "No material"
                              : readingDone
                                ? "Revision completed"
                                : "Revision pending"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <ClipboardList className="size-4 text-muted-foreground" />
                          <span className="font-medium">
                            {row.assignmentCompleted} of {row.assignmentAssigned}{" "}
                            revision completed
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`${studentManagePath(row.student.id)}#marks`}
                            >
                              Marks
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={studentManagePath(row.student.id)}
                            >
                              Edit
                            </Link>
                          </Button>
                          <form
                            action={deleteStudent.bind(
                              null,
                              batch.id,
                              row.student.id,
                            )}
                          >
                            <ConfirmSubmitButton
                              message={`Remove ${row.student.name} from this batch?`}
                              variant="outline"
                            >
                              Remove
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Course</h2>
            <p className="text-sm text-muted-foreground">
              This batch uses one course. Upload PDFs from here; manage chapter
              structure in the library.
            </p>
          </div>
          {course ? (
            <BatchUploadSheet
              batchId={batch.id}
              batchName={batch.name}
              courseId={course.id}
              courseTitle={course.title}
              chapters={chapters}
              trigger={
                <Button size="icon" aria-label="Upload material">
                  <Upload />
                </Button>
              }
            />
          ) : null}
        </div>

        {!course ? (
          <Card>
            <CardHeader>
              <CardTitle>No course linked</CardTitle>
              <CardDescription>
                New batches pick a course when they are created. Attach one from
                your library to start uploading material.
              </CardDescription>
              <CardAction>
                <Button asChild>
                  <Link href={`${batchPath(batch.id)}/courses/new`}>
                    Choose course
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-3">
            <Link href={coursePath(batch.id, course.id)}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="font-heading text-xl">
                      {course.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      <FileText />
                      {course.chapterCount}{" "}
                      {course.chapterCount === 1 ? "chapter" : "chapters"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {course.description || "No description yet."}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {chapters.length > 0 ? (
              <ul className="divide-y divide-line overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                {chapters.map((chapter) => (
                  <li
                    key={chapter.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{chapter.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.pdfCount === 0
                          ? "No material yet"
                          : `${chapter.pdfCount} PDF${chapter.pdfCount === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${coursePath(batch.id, course.id)}/chapters/${chapter.id}`}>
                        Open
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
