import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Edit course</CardTitle>
        <CardDescription>
          This updates the shared course for every batch it is attached to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CourseForm
          action={updateCourse.bind(null, null, course.id)}
          defaultValues={{
            title: course.title,
            description: course.description,
          }}
          submitLabel="Save changes"
          cancelHref={libraryCoursePath(course.id)}
        />
      </CardContent>
    </Card>
  );
}
