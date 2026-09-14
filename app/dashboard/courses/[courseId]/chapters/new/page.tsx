import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterForm } from "@/components/chapter-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createLibraryChapter } from "@/lib/actions/chapters";
import { requireTeacher } from "@/lib/auth";
import { libraryCoursePath } from "@/lib/paths";
import { getOwnedCourseForTeacher } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New chapter",
};

export default async function NewLibraryChapterPage({
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

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Add a chapter</CardTitle>
        <CardDescription>
          This chapter will appear in every batch that uses {course.title}.
          Upload PDFs from inside a batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChapterForm
          action={createLibraryChapter.bind(null, course.id)}
          submitLabel="Create chapter"
          cancelHref={libraryCoursePath(course.id)}
          showPdf={false}
        />
      </CardContent>
    </Card>
  );
}
