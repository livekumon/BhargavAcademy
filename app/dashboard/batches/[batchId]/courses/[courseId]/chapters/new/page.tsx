import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterForm } from "@/components/chapter-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createChapter } from "@/lib/actions/chapters";
import { requireTeacher } from "@/lib/auth";
import { coursePath } from "@/lib/paths";
import { getBatchStudents, getOwnedCourse } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New chapter",
};

export default async function NewChapterPage({
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

  const students = await getBatchStudents(owned.batch.id);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Add a chapter</CardTitle>
        <CardDescription>
          This chapter will appear in every batch that uses {owned.course.title}.
          You can attach a first PDF for {owned.batch.name} now, then add more
          later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChapterForm
          action={createChapter.bind(null, owned.batch.id, owned.course.id)}
          submitLabel="Create chapter"
          cancelHref={coursePath(owned.batch.id, owned.course.id)}
          students={students}
        />
      </CardContent>
    </Card>
  );
}
