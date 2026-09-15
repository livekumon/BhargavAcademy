import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterForm } from "@/components/chapter-form";
import { FormPage } from "@/components/teacher/form-page";
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
    <FormPage
      crumbs={[{ label: "Batches", href: "/dashboard/batches" }, { label: owned.batch.name, href: `/dashboard/batches/${owned.batch.id}?tab=chapters` }, { label: "New chapter" }]}
      title={<>Add a chapter</>}
      description={<>This chapter will appear in every batch that uses {owned.course.title}. You can attach a first PDF for {owned.batch.name} now, then add more later.</>}
    >
        <ChapterForm
          action={createChapter.bind(null, owned.batch.id, owned.course.id)}
          submitLabel="Create chapter"
          cancelHref={coursePath(owned.batch.id, owned.course.id)}
          students={students}
        />
      </FormPage>
  );
}
