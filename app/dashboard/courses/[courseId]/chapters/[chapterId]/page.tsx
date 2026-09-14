import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ChapterForm } from "@/components/chapter-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteLibraryChapter, updateLibraryChapter } from "@/lib/actions/chapters";
import { requireTeacher } from "@/lib/auth";
import { libraryCoursePath } from "@/lib/paths";
import { getOwnedLibraryChapter } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Chapter",
};

export default async function LibraryChapterPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const { courseId, chapterId } = await params;
  const teacher = await requireTeacher();
  const owned = await getOwnedLibraryChapter(teacher.id, courseId, chapterId);

  if (!owned) {
    notFound();
  }

  const { course, chapter } = owned;

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href={libraryCoursePath(course.id)}>Back to {course.title}</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Shared chapter</p>
            <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
              {chapter.title}
            </h1>
          </div>
          <form action={deleteLibraryChapter.bind(null, course.id, chapter.id)}>
            <ConfirmSubmitButton message="This chapter is shared. Deleting it removes it from every batch that uses this course, including their PDFs.">
              Delete chapter
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Chapter details</CardTitle>
          <CardDescription>
            Title and summary are shared. Upload PDFs from a batch so each class
            can have its own file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChapterForm
            action={updateLibraryChapter.bind(null, course.id, chapter.id)}
            defaultValues={{
              title: chapter.title,
              description: chapter.description,
            }}
            submitLabel="Save chapter"
            cancelHref={libraryCoursePath(course.id)}
            showPdf={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
