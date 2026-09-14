import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AttachCourseForm } from "@/components/attach-course-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          Choose a course
        </CardTitle>
        <CardDescription>
          A batch can only have one course. After you attach it, you upload
          material from the batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
