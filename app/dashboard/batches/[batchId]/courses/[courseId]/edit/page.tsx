import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Edit course</CardTitle>
        <CardDescription>
          This updates the shared course for every batch it is attached to.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CourseForm
          action={updateCourse.bind(null, owned.batch.id, owned.course.id)}
          defaultValues={{
            title: owned.course.title,
            description: owned.course.description,
          }}
          submitLabel="Save changes"
          cancelHref={coursePath(owned.batch.id, owned.course.id)}
        />
      </CardContent>
    </Card>
  );
}
