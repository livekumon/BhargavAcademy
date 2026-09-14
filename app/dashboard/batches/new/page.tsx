import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked } from "lucide-react";
import { CreateBatchWizard } from "@/components/create-batch-wizard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTeacher } from "@/lib/auth";
import { getTeacherCourses, getTeacherStudents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New batch",
};

export default async function NewBatchPage() {
  const teacher = await requireTeacher();
  const [courses, students] = await Promise.all([
    getTeacherCourses(teacher.id),
    getTeacherStudents(teacher.id),
  ]);

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<BookMarked />}
        title="Create a course first"
        description="Every batch needs one course from your library. Add the chapters there, then come back to create the batch."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href="/dashboard/courses/new">Create a course</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Back to batches</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Create a batch</CardTitle>
        <CardDescription>
          Pick the course first. Students can wait until you are ready to enroll
          them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateBatchWizard
          courses={courses.map((course) => ({
            id: course.id,
            title: course.title,
            chapterCount: course.chapterCount,
          }))}
          students={students}
          cancelHref="/dashboard"
        />
      </CardContent>
    </Card>
  );
}
