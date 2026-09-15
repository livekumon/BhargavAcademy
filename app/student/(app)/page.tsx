import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, PartyPopper, PenLine } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CourseCard } from "@/components/student/course-card";
import { WorkItemRow } from "@/components/student/work-item-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { Surface } from "@/components/ui/surface";
import { requireStudent } from "@/lib/auth";
import { formatDateInput, toDateInput } from "@/lib/dates";
import { studentMarksPath } from "@/lib/paths";
import { getStudentHome, getStudentMarkEntries } from "@/lib/queries";
import {
  courseWorkItems,
  summarizeOpenWork,
  tally,
  upNext,
} from "@/lib/student-work";

export const metadata: Metadata = {
  title: "Today",
};

const UP_NEXT_LIMIT = 5;

export default async function StudentTodayPage() {
  const student = await requireStudent();
  const [home, marks] = await Promise.all([
    getStudentHome(student.id),
    getStudentMarkEntries(student.id),
  ]);

  if (!home) {
    return null;
  }

  const firstName = home.student.name.split(/\s+/)[0] || home.student.name;
  const batchLabel =
    home.batches.length > 0
      ? home.batches.map((batch) => batch.name).join(" · ")
      : (home.batch?.name ?? "Your batch");

  if (home.courses.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow={batchLabel} title={`Hello, ${firstName}`} />
        <EmptyState
          icon={<BookOpen />}
          title="Nothing assigned yet"
          description="When your teacher assigns class material or an assignment, it will show up here with what to do first."
        />
      </div>
    );
  }

  const work = tally(home.courses.flatMap(courseWorkItems));
  const queue = upNext(home.courses);
  const caughtUp = queue.length === 0;
  const recentMarks = marks.slice(0, 3);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={batchLabel}
        title={`Hello, ${firstName}`}
        description={
          caughtUp
            ? "You're all caught up. Revisit anything below whenever you like."
            : `Here's what's waiting for you: ${summarizeOpenWork(work)}.`
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="up-next-heading" className="min-w-0">
          {caughtUp ? (
            <Surface
              tone="transparent"
              border="none"
              pad="lg"
              className="flex animate-rise flex-col items-start gap-3 bg-highlight-subtle ring-1 ring-highlight-line"
            >
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-xl bg-highlight text-highlight-fg"
              >
                <PartyPopper className="size-5" />
              </span>
              <h2 id="up-next-heading" className="font-heading text-title-1 font-semibold">
                All caught up
              </h2>
              <p className="max-w-prose text-content-muted text-pretty">
                Every assignment is submitted and all your class material is
                revised. New work from your teacher will appear here first.
              </p>
            </Surface>
          ) : (
            <Surface pad="none" className="overflow-hidden">
              <div className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-2 sm:px-6">
                <h2 id="up-next-heading" className="font-heading text-title-2 font-semibold">
                  Up next
                </h2>
                <span className="tabular text-sm text-content-subtle">
                  {queue.length} open
                </span>
              </div>
              <p className="px-5 pb-3 text-sm text-content-muted sm:px-6">
                Assignments to submit come first, then material to revise.
              </p>
              <ol className="px-2 pb-2 sm:px-3">
                {queue.slice(0, UP_NEXT_LIMIT).map((item) => (
                  <li key={item.id}>
                    <WorkItemRow item={item} context="course" />
                  </li>
                ))}
              </ol>
              {queue.length > UP_NEXT_LIMIT ? (
                <p className="border-t border-line px-5 py-3 text-sm text-content-muted sm:px-6">
                  <span className="tabular">{queue.length - UP_NEXT_LIMIT}</span>{" "}
                  more open — you&apos;ll find them in each course below.
                </p>
              ) : null}
            </Surface>
          )}
        </section>

        <aside className="flex flex-col gap-6" aria-label="Your progress">
          <Surface className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-content-muted">Overall progress</h2>
              <span className="font-heading tabular text-title-1 font-semibold">
                {work.percent}%
              </span>
            </div>
            <ProgressMeter
              value={work.percent}
              tone={caughtUp ? "success" : "brand"}
              size="lg"
              label="Overall progress"
            />
            <dl className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-sunken px-3 py-2.5">
                <dt className="text-xs text-content-subtle">Submitted</dt>
                <dd className="tabular font-semibold">
                  {work.submitted}
                  <span className="font-normal text-content-subtle"> / {work.assignments}</span>
                </dd>
              </div>
              <div className="rounded-lg bg-sunken px-3 py-2.5">
                <dt className="text-xs text-content-subtle">Revised</dt>
                <dd className="tabular font-semibold">
                  {work.revised}
                  <span className="font-normal text-content-subtle"> / {work.classMaterials}</span>
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-medium text-content-muted">Latest marks</h2>
              {recentMarks.length > 0 ? (
                <Link
                  href={studentMarksPath()}
                  className="rounded text-sm font-medium text-brand hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  View all
                </Link>
              ) : null}
            </div>
            {recentMarks.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-content-muted text-pretty">
                  Log a written exam to start tracking how you&apos;re doing.
                </p>
                <Link
                  href={studentMarksPath()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ring-1 ring-line-strong transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <PenLine aria-hidden="true" className="size-4" />
                  Log marks
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {recentMarks.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {entry.courseTitle}
                      </span>
                      <span className="block truncate text-xs text-content-subtle">
                        {formatDateInput(toDateInput(entry.recordedAt))}
                        {entry.chapterTitles.length > 0
                          ? ` · ${entry.chapterTitles.join(", ")}`
                          : ""}
                      </span>
                    </span>
                    <span className="font-mono tabular text-lg font-semibold">
                      {entry.marks}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </aside>
      </div>

      <section aria-labelledby="courses-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="courses-heading" className="font-heading text-title-1 font-semibold">
            Your courses
          </h2>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-1 rounded text-sm font-medium text-brand hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            All courses
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {home.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              work={tally(courseWorkItems(course))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
