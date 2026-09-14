import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { detachCourse } from "@/lib/actions/courses";
import { requireTeacher } from "@/lib/auth";
import { batchPath, chapterPath, coursePath, libraryCoursePath } from "@/lib/paths";
import { getBatchCourseChapters, getOwnedCourse } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Course",
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ batchId: string; courseId: string }>;
}) {
  const { batchId, courseId } = await params;
  const teacher = await requireTeacher();
  const owned = await getOwnedCourse(teacher.id, batchId, courseId);

  if (!owned) {
    notFound();
  }

  const { batch, course } = owned;
  const chapterList = await getBatchCourseChapters(batch.id, course.id);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href={batchPath(batch.id)}>Back to {batch.name}</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">{batch.name}</p>
            <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
              {course.title}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {course.description || "No description yet."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Chapters are shared. PDFs on this page belong only to {batch.name}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`${coursePath(batch.id, course.id)}/edit`}>
                Edit course
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={libraryCoursePath(course.id)}>Open in library</Link>
            </Button>
            <form action={detachCourse.bind(null, batch.id, course.id)}>
              <ConfirmSubmitButton message="Detach this course from the batch? PDFs uploaded for this batch will be removed. The shared course stays in your library.">
                Detach
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Chapters</h2>
          <p className="text-sm text-muted-foreground">
            New chapters appear in every batch that uses this course. Each
            chapter can have several PDFs for this batch.
          </p>
        </div>
        <Button asChild>
          <Link href={`${coursePath(batch.id, course.id)}/chapters/new`}>
            <Plus data-icon="inline-start" />
            Add chapter
          </Link>
        </Button>
      </div>

      {chapterList.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No chapters yet</CardTitle>
            <CardDescription>
              Add a shared chapter, then upload a PDF for this batch.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {chapterList.map((chapter, index) => (
            <Link
              key={chapter.id}
              href={chapterPath(batch.id, course.id, chapter.id)}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Chapter {index + 1}
                    </p>
                    <CardTitle className="font-heading mt-1 text-xl">
                      {chapter.title}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {chapter.description || "No summary yet."}
                    </CardDescription>
                  </div>
                  <Badge variant={chapter.pdfCount > 0 ? "default" : "secondary"}>
                    <FileText />
                    {chapter.pdfCount > 0
                      ? `${chapter.classMaterialCount} class · ${chapter.assignmentCount} assignment${chapter.assignmentCount === 1 ? "" : "s"}`
                      : "No PDF yet"}
                  </Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
