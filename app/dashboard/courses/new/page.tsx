import type { Metadata } from "next";
import { CourseForm } from "@/components/course-form";
import { FormPage } from "@/components/teacher/form-page";
import { createCourse } from "@/lib/actions/courses";

export const metadata: Metadata = {
  title: "New course",
};

export default function NewLibraryCoursePage() {
  return (
    <FormPage
      crumbs={[{ label: "Course library", href: "/dashboard/courses" }, { label: "New course" }]}
      title={<>Create a course</>}
      description={<>This course can be attached to any batch. Add chapters here; upload PDFs from inside a batch.</>}
    >
        <CourseForm
          action={createCourse.bind(null, null)}
          submitLabel="Create course"
          cancelHref="/dashboard/courses"
        />
      </FormPage>
  );
}
