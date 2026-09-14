import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ChapterForm } from "@/components/chapter-form";
import { MaterialForm } from "@/components/material-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addChapterPdf,
  deleteChapter,
  removeChapterPdf,
  updateChapter,
  updateChapterPdfAssignments,
} from "@/lib/actions/chapters";
import { requireTeacher } from "@/lib/auth";
import {
  asMaterialKind,
  isAssignment,
  materialKindLabel,
  splitMaterials,
} from "@/lib/materials";
import { coursePath, materialPath, submissionPath } from "@/lib/paths";
import { formatCompletedAt } from "@/lib/submissions";
import type { StudentOption } from "@/components/student-assignment-fields";
import { getBatchStudents, getOwnedChapter } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Chapter",
};

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ batchId: string; courseId: string; chapterId: string }>;
}) {
  const { batchId, courseId, chapterId } = await params;
  const teacher = await requireTeacher();
  const owned = await getOwnedChapter(teacher.id, batchId, courseId, chapterId);

  if (!owned) {
    notFound();
  }

  const { batch, course, chapter, materials } = owned;
  const students = await getBatchStudents(batch.id);
  const { classMaterials, assignments } = splitMaterials(materials);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href={coursePath(batch.id, course.id)}>Back to {course.title}</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">
              {batch.name} · {course.title}
            </p>
            <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
              {chapter.title}
            </h1>
          </div>
          <form action={deleteChapter.bind(null, batch.id, course.id, chapter.id)}>
            <ConfirmSubmitButton message="This chapter is shared. Deleting it removes it from every batch that uses this course, including their PDFs.">
              Delete chapter
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Chapter details</CardTitle>
          <CardDescription>
            The title and summary are shared. PDFs below belong only to{" "}
            {batch.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChapterForm
            action={updateChapter.bind(null, batch.id, course.id, chapter.id)}
            defaultValues={{
              title: chapter.title,
              description: chapter.description,
            }}
            submitLabel="Save chapter"
            cancelHref={coursePath(batch.id, course.id)}
            showPdf={false}
          />
        </CardContent>
      </Card>

      <section className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold">
            PDFs for {batch.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload class material or assignments. Students see those as two
            separate lists.
          </p>
        </div>

        {materials.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No PDFs yet</CardTitle>
              <CardDescription>
                Upload the first class material or assignment for this chapter
                in {batch.name}.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <MaterialGroup
              title="Class material"
              emptyLabel="No class material uploaded yet."
              materials={classMaterials}
              batchId={batch.id}
              courseId={course.id}
              chapterId={chapter.id}
              students={students}
            />
            <MaterialGroup
              title="Assignments"
              emptyLabel="No assignments uploaded yet."
              materials={assignments}
              batchId={batch.id}
              courseId={course.id}
              chapterId={chapter.id}
              students={students}
            />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Add another PDF</CardTitle>
            <CardDescription>
              Choose Class material or Assignment. Assignments include
              instructions for students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MaterialForm
              action={addChapterPdf.bind(null, batch.id, course.id, chapter.id)}
              students={students}
              submitLabel="Upload PDF"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type ChapterMaterialItem = NonNullable<
  Awaited<ReturnType<typeof getOwnedChapter>>
>["materials"][number];

function MaterialGroup({
  title,
  emptyLabel,
  materials,
  batchId,
  courseId,
  chapterId,
  students,
}: {
  title: string;
  emptyLabel: string;
  materials: ChapterMaterialItem[];
  batchId: string;
  courseId: string;
  chapterId: string;
  students: StudentOption[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-xl font-semibold">{title}</h3>
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => {
            const pdfUrl = materialPath(material.id);
            return (
              <Card key={material.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-heading text-xl">
                        {material.pdfOriginalName ?? "Untitled PDF"}
                      </CardTitle>
                      <CardDescription>
                        Assigned to {material.assignedStudents.length} of{" "}
                        {students.length} students
                        {material.assignedStudents.length > 0
                          ? `: ${material.assignedStudents.map((student) => student.name).join(", ")}`
                          : "."}
                      </CardDescription>
                    </div>
                    <Badge>{materialKindLabel(material.kind)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {isAssignment(material.kind) && material.instructions ? (
                    <div className="rounded-xl border bg-muted/40 p-4">
                      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Instructions
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {material.instructions}
                      </p>
                    </div>
                  ) : null}
                  {material.pdfFileName ? (
                    <iframe
                      title={material.pdfOriginalName ?? "Chapter PDF"}
                      src={pdfUrl}
                      className="h-[28rem] w-full rounded-xl border bg-background"
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <a href={pdfUrl} target="_blank" rel="noreferrer">
                        Open PDF
                      </a>
                    </Button>
                    <form
                      action={removeChapterPdf.bind(
                        null,
                        batchId,
                        courseId,
                        chapterId,
                        material.id,
                      )}
                    >
                      <ConfirmSubmitButton
                        message="Remove this PDF from the chapter? Other files stay."
                        variant="outline"
                      >
                        Remove PDF
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                    {material.assignedStudents.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Student progress</p>
                        <ul className="space-y-2">
                          {material.assignedStudents.map((student) => {
                            const completed = Boolean(student.completedAt);
                            return (
                              <li
                                key={student.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                              >
                                <span>{student.name}</span>
                                <span className="flex flex-wrap items-center gap-2">
                                  <Badge variant={completed ? "default" : "secondary"}>
                                    {completed
                                      ? `Revision completed${formatCompletedAt(student.completedAt) ? ` · ${formatCompletedAt(student.completedAt)}` : ""}`
                                      : "Not completed"}
                                  </Badge>
                                  {student.submissionFileName ? (
                                    <Button asChild variant="outline" size="sm">
                                      <a
                                        href={submissionPath(material.id, student.id)}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Open upload
                                      </a>
                                    </Button>
                                  ) : null}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                    <MaterialForm
                      action={updateChapterPdfAssignments.bind(
                        null,
                        batchId,
                        courseId,
                        chapterId,
                        material.id,
                      )}
                      students={students}
                      assignedStudentIds={material.assignedStudents.map(
                        (student) => student.id,
                      )}
                      defaultKind={asMaterialKind(material.kind)}
                      defaultInstructions={material.instructions}
                      submitLabel="Save details"
                      showFile={false}
                    />
                  </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
