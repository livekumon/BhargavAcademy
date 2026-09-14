import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttachCourseForm } from "@/components/attach-course-form";
import { FormPage } from "@/components/teacher/form-page";
import { attachCourseToBatch } from "@/lib/actions/courses";
import { requireTeacher } from "@/lib/auth";
import { batchPath } from "@/lib/paths";
import { getBatchCourse, getOwnedBatch, getUnattachedCourses } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Choose course",
};

export default async function AttachCoursePage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const teacher = await requireTeacher();
  const batch = await getOwnedBatch(teacher.id, batchId);

  if (!batch) {
    notFound();
  }

  const linked = await getBatchCourse(batch.id);
  if (linked) {
    redirect(batchPath(batch.id));
  }

  const availableCourses = await getUnattachedCourses(teacher.id, batch.id);

  return (
    <FormPage
      crumbs={[{ label: "Batches", href: "/dashboard/batches" }, { label: batch.name, href: `/dashboard/batches/${batch.id}` }, { label: "Choose a course" }]}
      title={<>Choose a course</>}
      description={<>A batch can only have one course. After you attach it, you upload material from the batch.</>}
    >
        {availableCourses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every course is already used, or your library is empty. Create a
            course in the library first.
          </p>
        ) : (
          <AttachCourseForm
            action={attachCourseToBatch.bind(null, batch.id)}
            courses={availableCourses}
            cancelHref={batchPath(batch.id)}
          />
        )}
      </FormPage>
  );
}
