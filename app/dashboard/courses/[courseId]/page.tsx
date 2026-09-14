import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteCourse } from "@/lib/actions/courses";
import { requireTeacher } from "@/lib/auth";
import { batchPath, libraryChapterPath, libraryCoursePath } from "@/lib/paths";
import {
  getCourseBatches,
  getCourseChapters,
  getOwnedCourseForTeacher,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Course",
};

export default async function LibraryCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const teacher = await requireTeacher();
  const course = await getOwnedCourseForTeacher(teacher.id, courseId);

  if (!course) {
    notFound();
  }

  const [chapterList, attachedBatches] = await Promise.all([
    getCourseChapters(course.id),
    getCourseBatches(teacher.id, course.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href="/dashboard/courses">Back to courses</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Shared course</p>
            <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
              {course.title}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {course.description || "No description yet."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`${libraryCoursePath(course.id)}/edit`}>Edit course</Link>
            </Button>
            <form action={deleteCourse.bind(null, course.id)}>
              <ConfirmSubmitButton message="Delete this shared course, its chapters, and every batch PDF attached to it?">
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-semibold">Attached batches</h2>
        {attachedBatches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This course is not attached to a batch yet. Open a batch and attach
            it there to upload PDFs.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attachedBatches.map((batch) => (
              <Button key={batch.id} asChild variant="outline" size="sm">
                <Link href={`${batchPath(batch.id)}/courses/${course.id}`}>
                  {batch.name}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold">Chapters</h2>
          <p className="text-sm text-muted-foreground">
            These chapters are shared. Upload PDFs from a batch, not here.
          </p>
        </div>
        <Button asChild>
          <Link href={`${libraryCoursePath(course.id)}/chapters/new`}>
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
              Add the shared lessons for this course. Batch PDFs are uploaded
              later.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {chapterList.map((chapter, index) => (
            <Link
              key={chapter.id}
              href={libraryChapterPath(course.id, chapter.id)}
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
                  <Badge variant="secondary">Shared</Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
