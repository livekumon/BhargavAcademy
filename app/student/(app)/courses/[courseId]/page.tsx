import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CourseChapters } from "@/components/student/course-chapters";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { requireStudent } from "@/lib/auth";
import { getStudentHome } from "@/lib/queries";
import { courseWorkItems, tally } from "@/lib/student-work";

export const metadata: Metadata = {
  title: "Course",
};

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const student = await requireStudent();
  const home = await getStudentHome(student.id);
  const course = home?.courses.find((item) => item.id === courseId);

  if (!home || !course) {
    notFound();
  }

  const items = courseWorkItems(course);
  const work = tally(items);
  const next =
    items.find((item) => !item.done && item.kind === "assignment") ??
    items.find((item) => !item.done);
  const caughtUp = work.total > 0 && !next;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "My courses", href: "/student/courses" },
              { label: course.title },
            ]}
          />
        }
        eyebrow={
          home.batches.length > 0
            ? home.batches.map((batch) => batch.name).join(" · ")
            : (home.batch?.name ?? "Your batch")
        }
        title={course.title}
        description={course.description || undefined}
      />

      <Surface className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-heading tabular text-title-1 font-semibold">
              {work.percent}%
            </span>
            <span className="text-content-muted">
              <span className="tabular">{work.done}</span> of{" "}
              <span className="tabular">{work.total}</span> done
            </span>
          </div>
          <ProgressMeter
            value={work.percent}
            tone={caughtUp ? "success" : "brand"}
            size="lg"
            label={`${course.title} progress`}
          />
          <div className="flex flex-wrap gap-2">
            {work.toSubmit > 0 ? (
              <StatusPill tone="warning" dot>
                <span className="tabular">{work.toSubmit}</span> to submit
              </StatusPill>
            ) : null}
            {work.toRevise > 0 ? (
              <StatusPill tone="info" dot>
                <span className="tabular">{work.toRevise}</span> to revise
              </StatusPill>
            ) : null}
            {caughtUp ? (
              <StatusPill tone="success" dot>
                All caught up
              </StatusPill>
            ) : null}
          </div>
        </div>

        {next ? (
          <Link
            href={next.href}
            className="group flex min-h-14 items-center gap-3 rounded-xl bg-brand px-4 py-3 text-brand-fg shadow-elevation-sm transition-[background-color,box-shadow] duration-(--dur-fast) hover:bg-brand-hover hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:max-w-xs"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-xs opacity-80">
                {next.kind === "assignment" ? "Submit next" : "Revise next"}
              </span>
              <span className="block truncate font-medium">{next.title}</span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
            />
          </Link>
        ) : null}
      </Surface>

      <CourseChapters
        chapters={course.chapters.map((chapter, index) => ({
          id: chapter.id,
          number: index + 1,
          title: chapter.title,
          description: chapter.description,
          items: items.filter((item) => item.chapterNumber === index + 1),
        }))}
      />
    </div>
  );
}
