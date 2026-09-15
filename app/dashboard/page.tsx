import type { Metadata } from "next";
import Link from "next/link";
import {
  AlarmClock,
  ArrowRight,
  Award,
  BookOpenCheck,
  Check,
  FileCheck2,
  FileUp,
  HeartHandshake,
  Inbox,
  Sparkles,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { BatchUploadSheet } from "@/components/batch-upload-sheet";
import { ProgressRing } from "@/components/teacher/progress-ring";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { requireTeacher } from "@/lib/auth";
import { getBatchOverviews, type BatchOverview } from "@/lib/batch-overview";
import { listLeads } from "@/lib/leads";
import { batchPath, chapterPath, submissionPath } from "@/lib/paths";
import { getTeacherCourses, getTeacherParents, getTeacherStudents } from "@/lib/queries";
import {
  daysAgo,
  daysBefore,
  dueState,
  firstName,
  formatScore,
  greeting,
  longToday,
  percent,
  plural,
  relativeDay,
} from "@/lib/teacher-format";
import {
  getTeacherOverdueAssignments,
  getTeacherRecentMarks,
  getTeacherRecentWork,
  type RecentWork,
} from "@/lib/teacher-queries";

export const metadata: Metadata = {
  title: "Today",
};

export default async function TodayPage() {
  const teacher = await requireTeacher();
  const since = daysBefore(7);
  const [batches, recent, marks, leads, parents, courses, students, overdue] = await Promise.all([
    getBatchOverviews(teacher.id),
    getTeacherRecentWork(teacher.id, 40),
    getTeacherRecentMarks(teacher.id, since),
    listLeads().catch(() => []),
    getTeacherParents(teacher.id),
    getTeacherCourses(teacher.id),
    getTeacherStudents(teacher.id),
    getTeacherOverdueAssignments(teacher.id),
  ]);

  const submissions = recent.filter((item) => item.type === "submitted" && item.at >= since);
  const behind = batches.reduce((total, batch) => total + batch.outstanding, 0);
  const newLeads = leads.filter((lead) => lead.status === "new");
  const pendingParents = parents.filter((parent) => parent.mustChangePassword);
  const needsSetup = batches.length === 0 || students.length === 0;

  const lateStudents = overdue.reduce((total, item) => total + item.lateStudents, 0);
  const summary = [
    lateStudents > 0 ? `${plural(lateStudents, "late assignment")} to chase` : null,
    submissions.length > 0 ? plural(submissions.length, "new submission") + " this week" : null,
    behind > 0 ? `${plural(behind, "student")} behind across your batches` : null,
    newLeads.length > 0 ? plural(newLeads.length, "new lead") : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-10">
      <header className="animate-rise space-y-2">
        <p className="text-sm font-medium text-brand">{longToday()}</p>
        <h1 className="text-display-3 font-semibold text-balance">
          {greeting()}, {firstName(teacher.name)}
        </h1>
        <p className="max-w-3xl text-lead text-content-muted text-pretty">
          {needsSetup
            ? "Let's get your academy set up. A few short steps and your students can start revising."
            : summary.length > 0
              ? `${summary.join(", ")}.`
              : "Everything is quiet. Every student is caught up and there are no new leads."}
        </p>
      </header>

      {needsSetup ? (
        <SetupChecklist
          steps={[
            { label: "Create a course with chapters", done: courses.length > 0, href: "/dashboard/courses/new" },
            { label: "Create a batch for that course", done: batches.length > 0, href: "/dashboard/batches/new" },
            { label: "Add your students", done: students.length > 0, href: "/dashboard/students/new" },
            {
              label: "Upload the first class material",
              done: batches.some((batch) => (batch.course?.chaptersWithMaterial ?? 0) > 0),
              href: batches[0] ? `${batchPath(batches[0].id)}?tab=chapters` : "/dashboard/batches",
            },
            { label: "Give parents a login", done: parents.length > 0, href: "/dashboard/parents/new" },
          ]}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <FocusTile
            href="#activity"
            icon={FileCheck2}
            value={submissions.length}
            label="Submissions this week"
            hint={submissions[0] ? `Latest ${relativeDay(submissions[0].at)}` : "None yet"}
            tone="info"
          />
          <FocusTile
            href="/dashboard/batches"
            icon={UserRoundX}
            value={behind}
            label="Students behind"
            hint={behind > 0 ? "Open a batch to see who" : "Everyone is caught up"}
            tone={behind > 0 ? "warning" : "success"}
          />
          <FocusTile
            href="/dashboard/leads"
            icon={Inbox}
            value={newLeads.length}
            label="New leads"
            hint={newLeads.length > 0 ? "Waiting for a call back" : "Inbox clear"}
            tone={newLeads.length > 0 ? "highlight" : "neutral"}
          />
          <FocusTile
            href="/dashboard/parents"
            icon={HeartHandshake}
            value={pendingParents.length}
            label="Parents not signed in"
            hint={pendingParents.length > 0 ? "Share their login details" : "All parents are active"}
            tone={pendingParents.length > 0 ? "highlight" : "neutral"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8">
        <section aria-labelledby="batches-heading" className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="batches-heading" className="text-title-1 font-semibold">
              Your batches
            </h2>
            <Link
              href="/dashboard/batches"
              className="inline-flex items-center gap-1 rounded text-sm font-medium text-brand hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              All batches
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {batches.length === 0 ? (
            <Surface className="text-sm text-content-muted">
              No batches yet.{" "}
              <Link href="/dashboard/batches/new" className="font-medium text-brand hover:underline">
                Create your first batch
              </Link>
              .
            </Surface>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
              {batches.map((batch) => (
                <BatchRow key={batch.id} batch={batch} />
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-10">
        {overdue.length > 0 ? (
          <section aria-labelledby="overdue-heading" className="space-y-4">
            <h2 id="overdue-heading" className="text-title-1 font-semibold">
              Overdue
            </h2>
            <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-danger-line">
              {overdue.slice(0, 4).map((item) => (
                <li key={item.materialId}>
                  <Link
                    href={`${chapterPath(item.batchId, item.courseId, item.chapterId)}?material=${item.materialId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-sunken/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-danger-subtle text-danger-subtle-fg">
                      <AlarmClock aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.chapterTitle}</span>
                      <span className="block truncate text-xs text-content-subtle">
                        {item.batchName} · {dueState(item.dueAt)?.label}
                      </span>
                    </span>
                    <StatusPill tone="danger">{plural(item.lateStudents, "student")} late</StatusPill>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="submissions-heading" className="space-y-4">
          <h2 id="submissions-heading" className="text-title-1 font-semibold">
            Submissions to open
          </h2>
          {submissions.length === 0 ? (
            <Quiet>New assignment uploads from students will appear here.</Quiet>
          ) : (
            <ul className="space-y-2">
              {submissions.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <Surface pad="none" className="flex items-center gap-3 px-4 py-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info-subtle-fg">
                      <FileCheck2 aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.studentName}</span>
                      <Link
                        href={chapterPath(item.batchId, item.courseId, item.chapterId)}
                        className="block truncate text-xs text-content-subtle hover:text-content hover:underline"
                      >
                        {item.chapterTitle} · {item.batchName} · {relativeDay(item.at)}
                      </Link>
                    </span>
                    {item.hasSubmission ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={submissionPath(item.materialId, item.studentId)} target="_blank" rel="noreferrer">
                          Open
                          <span className="sr-only"> {item.studentName}&apos;s upload</span>
                        </a>
                      </Button>
                    ) : null}
                  </Surface>
                </li>
              ))}
            </ul>
          )}
        </section>
        </div>
      </div>

      <section id="activity" aria-labelledby="activity-heading" className="scroll-mt-24 space-y-4">
        <h2 id="activity-heading" className="text-title-1 font-semibold">
          Recent activity
        </h2>
        <ActivityFeed recent={recent.slice(0, 12)} marks={marks.slice(0, 6)} />
      </section>
    </div>
  );
}

const tileTones = {
  info: "bg-info-subtle text-info-subtle-fg",
  warning: "bg-warning-subtle text-warning-subtle-fg",
  success: "bg-success-subtle text-success-subtle-fg",
  highlight: "bg-highlight-subtle text-highlight-subtle-fg",
  neutral: "bg-sunken text-content-muted",
} as const;

function FocusTile({
  href,
  icon: Icon,
  value,
  label,
  hint,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  value: number;
  label: string;
  hint: string;
  tone: keyof typeof tileTones;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl bg-surface p-4 ring-1 ring-line transition-[box-shadow,transform] duration-(--dur-base) ease-out-quart hover:-translate-y-0.5 hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-5"
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn("flex size-9 items-center justify-center rounded-lg", tileTones[tone])}>
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 text-content-subtle transition-transform duration-(--dur-base) group-hover:translate-x-0.5"
        />
      </span>
      <span>
        <span className="font-heading tabular block text-title-1 font-semibold">{value}</span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-content-subtle">{hint}</span>
      </span>
    </Link>
  );
}

function BatchRow({ batch }: { batch: BatchOverview }) {
  const done = batch.revised + batch.submitted;
  const total = batch.revisable + batch.submittable;

  return (
    <li className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
      <ProgressRing value={percent(done, total)} label={`${batch.name}: work completed`} size={48}>
        <span className="tabular text-[0.6875rem] font-semibold">{percent(done, total)}%</span>
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <Link
          href={batchPath(batch.id)}
          className="block truncate font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {batch.name}
        </Link>
        <p className="truncate text-sm text-content-muted">
          {batch.course?.title ?? "No course"} · {plural(batch.studentCount, "student")}
        </p>
      </div>
      {total === 0 ? (
        <StatusPill tone="neutral" className="hidden sm:inline-flex">
          Nothing assigned
        </StatusPill>
      ) : batch.outstanding === 0 ? (
        <StatusPill tone="success" dot className="hidden sm:inline-flex">
          All caught up
        </StatusPill>
      ) : (
        <StatusPill tone="warning" dot className="hidden sm:inline-flex">
          {batch.outstanding} behind
        </StatusPill>
      )}
      {batch.course ? (
        <BatchUploadSheet
          batchId={batch.id}
          batchName={batch.name}
          courseId={batch.course.id}
          courseTitle={batch.course.title}
          chapters={batch.course.chapters}
          trigger={
            <Button variant="outline" size="icon-lg" aria-label={`Upload material to ${batch.name}`}>
              <FileUp />
            </Button>
          }
        />
      ) : null}
    </li>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-xl bg-sunken p-4 text-sm text-content-muted">
      <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-content-subtle" />
      <span className="text-pretty">{children}</span>
    </p>
  );
}

type FeedItem =
  | { kind: "work"; at: Date; item: RecentWork }
  | { kind: "mark"; at: Date; item: Awaited<ReturnType<typeof getTeacherRecentMarks>>[number] };

function ActivityFeed({
  recent,
  marks,
}: {
  recent: RecentWork[];
  marks: Awaited<ReturnType<typeof getTeacherRecentMarks>>;
}) {
  const items: FeedItem[] = [
    ...recent.map((item) => ({ kind: "work" as const, at: item.at, item })),
    ...marks.map((item) => ({ kind: "mark" as const, at: item.createdAt, item })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  if (items.length === 0) {
    return <Quiet>When students revise material, submit work or log marks, it shows up here.</Quiet>;
  }

  const groups = [
    { label: "Today", items: items.filter((entry) => daysAgo(entry.at) <= 0) },
    { label: "This week", items: items.filter((entry) => daysAgo(entry.at) > 0 && daysAgo(entry.at) < 7) },
    { label: "Earlier", items: items.filter((entry) => daysAgo(entry.at) >= 7) },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-medium tracking-wide text-content-subtle uppercase">{group.label}</p>
          <ol className="mt-2 space-y-1">
            {group.items.map((entry) => {
              if (entry.kind === "mark") {
                return (
                  <li key={`mark-${entry.item.id}`} className="flex items-center gap-3 py-1.5">
                    <FeedIcon icon={Award} className="bg-highlight-subtle text-highlight-subtle-fg" />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block truncate">
                        <span className="font-medium">{firstName(entry.item.studentName)}</span>{" "}
                        <span className="text-content-muted">logged a mark</span>
                      </span>
                      <span className="block truncate text-xs text-content-subtle">
                        {entry.item.batchName} · {relativeDay(entry.at)}
                      </span>
                    </span>
                    <span className="font-heading tabular text-title-3 font-semibold">
                      {formatScore(entry.item.marks)}
                    </span>
                  </li>
                );
              }
              const work = entry.item;
              const submitted = work.type === "submitted";
              return (
                <li key={`work-${work.id}`}>
                  <Link
                    href={chapterPath(work.batchId, work.courseId, work.chapterId)}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <FeedIcon
                      icon={submitted ? FileCheck2 : BookOpenCheck}
                      className={submitted ? "bg-info-subtle text-info-subtle-fg" : "bg-success-subtle text-success-subtle-fg"}
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block truncate">
                        <span className="font-medium">{firstName(work.studentName)}</span>{" "}
                        <span className="text-content-muted">{submitted ? "submitted" : "revised"}</span>{" "}
                        <span className="font-medium">{work.chapterTitle}</span>
                      </span>
                      <span className="block truncate text-xs text-content-subtle">
                        {work.batchName} · {relativeDay(work.at)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

function FeedIcon({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", className)}>
      <Icon aria-hidden="true" className="size-4" />
    </span>
  );
}

function SetupChecklist({ steps }: { steps: { label: string; done: boolean; href: string }[] }) {
  const done = steps.filter((step) => step.done).length;
  const next = steps.find((step) => !step.done);

  return (
    <Surface pad="lg" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-title-2 font-semibold">Get your academy ready</h2>
          <p className="tabular text-sm text-content-muted">
            {done} of {steps.length} done
          </p>
        </div>
        {next ? (
          <Button asChild size="lg">
            <Link href={next.href}>
              {next.label}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : null}
      </div>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={cn(
                "flex h-full items-start gap-3 rounded-xl p-3 text-sm ring-1 transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                step.done
                  ? "bg-success-subtle/50 text-content-muted ring-success-line"
                  : "bg-surface ring-line hover:bg-sunken",
              )}
            >
              <span
                className={cn(
                  "tabular flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step.done ? "bg-success text-white" : "bg-sunken text-content-muted ring-1 ring-line",
                )}
              >
                {step.done ? <Check aria-hidden="true" className="size-3.5" /> : index + 1}
              </span>
              <span className={cn("font-medium", step.done && "line-through decoration-content-subtle")}>
                {step.label}
                {step.done ? <span className="sr-only"> (done)</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Surface>
  );
}
