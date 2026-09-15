import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CourseCard } from "@/components/student/course-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireStudent } from "@/lib/auth";
import { getStudentHome } from "@/lib/queries";
import { courseWorkItems, tally } from "@/lib/student-work";

export const metadata: Metadata = {
  title: "My courses",
};

export default async function StudentCoursesPage() {
  const student = await requireStudent();
  const home = await getStudentHome(student.id);

  if (!home) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          home.batches.length > 0
            ? home.batches.map((batch) => batch.name).join(" · ")
            : (home.batch?.name ?? "Your batch")
        }
        title="My courses"
        description="Every course with work assigned to you, and how far along you are in each."
      />

      {home.courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Nothing assigned yet"
          description="When your teacher assigns class material or an assignment, its course will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {home.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              work={tally(courseWorkItems(course))}
              showDescription
            />
          ))}
        </div>
      )}
    </div>
  );
}
