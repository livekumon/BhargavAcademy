import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { FormPage } from "@/components/teacher/form-page";
import { updateCourse } from "@/lib/actions/courses";
import { requireTeacher } from "@/lib/auth";
import { coursePath } from "@/lib/paths";
import { getOwnedCourse } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit course",
};

export default async function EditCoursePage({
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

  return (
    <FormPage
      crumbs={[{ label: "Batches", href: "/dashboard/batches" }, { label: owned.batch.name, href: `/dashboard/batches/${owned.batch.id}?tab=chapters` }, { label: "Edit course" }]}
      title={<>Edit course</>}
      description={<>This updates the shared course for every batch it is attached to.</>}
    >
        <CourseForm
          action={updateCourse.bind(null, owned.batch.id, owned.course.id)}
          defaultValues={{
            title: owned.course.title,
            description: owned.course.description,
          }}
          submitLabel="Save changes"
          cancelHref={coursePath(owned.batch.id, owned.course.id)}
        />
      </FormPage>
  );
}
