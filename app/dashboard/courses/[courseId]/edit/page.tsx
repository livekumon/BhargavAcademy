import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { FormPage } from "@/components/teacher/form-page";
import { updateCourse } from "@/lib/actions/courses";
import { requireTeacher } from "@/lib/auth";
import { libraryCoursePath } from "@/lib/paths";
import { getOwnedCourseForTeacher } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit course",
};

export default async function EditLibraryCoursePage({
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
    <FormPage
      crumbs={[{ label: "Course library", href: "/dashboard/courses" }, { label: course.title, href: libraryCoursePath(course.id) }, { label: "Edit" }]}
      title={<>Edit course</>}
      description={<>This updates the shared course for every batch it is attached to.</>}
    >
        <CourseForm
          action={updateCourse.bind(null, null, course.id)}
          defaultValues={{
            title: course.title,
            description: course.description,
          }}
          submitLabel="Save changes"
          cancelHref={libraryCoursePath(course.id)}
        />
      </FormPage>
  );
}
