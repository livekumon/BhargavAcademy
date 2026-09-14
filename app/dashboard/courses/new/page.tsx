import type { Metadata } from "next";
import { CourseForm } from "@/components/course-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCourse } from "@/lib/actions/courses";

export const metadata: Metadata = {
  title: "New course",
};

export default function NewLibraryCoursePage() {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Create a course</CardTitle>
        <CardDescription>
          This course can be attached to any batch. Add chapters here; upload
          PDFs from inside a batch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CourseForm
          action={createCourse.bind(null, null)}
          submitLabel="Create course"
          cancelHref="/dashboard/courses"
        />
      </CardContent>
    </Card>
  );
}
