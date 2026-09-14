import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTeacher } from "@/lib/auth";
import { libraryCoursePath } from "@/lib/paths";
import { getTeacherCourses } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Courses",
};

export default async function CoursesLibraryPage() {
  const teacher = await requireTeacher();
  const courseList = await getTeacherCourses(teacher.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Shared library</p>
          <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
            Your courses
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Chapters stay the same everywhere. Attach a course to a batch, then
            upload PDFs that belong only to that batch.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/courses/new">
            <Plus data-icon="inline-start" />
            New course
          </Link>
        </Button>
      </div>

      {courseList.length === 0 ? (
        <Card className="items-center py-16 text-center">
          <CardHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <BookMarked className="size-5" />
            </div>
            <CardTitle className="font-heading text-2xl">No courses yet</CardTitle>
            <CardDescription className="max-w-md">
              Create a shared course, add chapters, then attach it to one or more
              batches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/courses/new">Create your first course</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courseList.map((course) => (
            <Link key={course.id} href={libraryCoursePath(course.id)}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="font-heading text-2xl">
                      {course.title}
                    </CardTitle>
                    <Badge variant="secondary">
                      {course.chapterCount}{" "}
                      {course.chapterCount === 1 ? "chapter" : "chapters"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {course.description || "No description yet."}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
