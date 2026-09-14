import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { requireTeacher } from "@/lib/auth";
import { libraryCoursePath } from "@/lib/paths";
import { getTeacherBatches, getTeacherCourses } from "@/lib/queries";
import { plural } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Course library",
};

export default async function CourseLibraryPage() {
  const teacher = await requireTeacher();
  const [courses, batches] = await Promise.all([getTeacherCourses(teacher.id), getTeacherBatches(teacher.id)]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Teach"
        title="Course library"
        description="Write a course's chapters once and share it with any number of batches. Each batch still gets its own PDFs."
        actions={
          <Button asChild size="lg">
            <Link href="/dashboard/courses/new">
              <Plus data-icon="inline-start" />
              New course
            </Link>
          </Button>
        }
      />

      {courses.length === 0 ? (
        <EmptyState
          icon={<BookMarked />}
          title="No courses yet"
          description="Create a course, add its chapters, then attach it to a batch."
          action={
            <Button asChild size="lg">
              <Link href="/dashboard/courses/new">Create your first course</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => {
            const usedBy = batches.filter((batch) => batch.course?.id === course.id);
            return (
              <li key={course.id} className="animate-rise" style={{ animationDelay: `${index * 50}ms` }}>
                <Link
                  href={libraryCoursePath(course.id)}
                  className="group flex h-full flex-col gap-4 rounded-xl bg-surface p-5 ring-1 ring-line transition-[box-shadow,transform] duration-(--dur-base) ease-out-quart hover:-translate-y-0.5 hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
                      <BookMarked aria-hidden="true" className="size-5" />
                    </span>
                    <StatusPill tone={course.chapterCount === 0 ? "warning" : "neutral"}>
                      {course.chapterCount === 0 ? "No chapters" : plural(course.chapterCount, "chapter")}
                    </StatusPill>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-title-2 font-semibold group-hover:underline">{course.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-content-muted">
                      {course.description || "No description yet."}
                    </p>
                  </div>
                  <p className="mt-auto border-t border-line pt-3 text-sm text-content-muted">
                    {usedBy.length === 0 ? (
                      <span className="text-content-subtle">Not used by a batch yet</span>
                    ) : (
                      <>
                        Used by <span className="font-medium text-content">{usedBy.map((batch) => batch.name).join(", ")}</span>
                      </>
                    )}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
