import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, ClipboardList } from "lucide-react";
import { MarksTimeline } from "@/components/marks-timeline";
import { ActivityFeed } from "@/components/parent/activity-feed";
import { AttentionList } from "@/components/parent/attention-list";
import { ChapterList } from "@/components/parent/chapter-list";
import { ChildAvatar } from "@/components/parent/child-avatar";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { ChildTabs } from "@/components/parent/child-tabs";
import { MarksTrend } from "@/components/parent/marks-trend";
import { ProgressRing } from "@/components/parent/progress-ring";
import { WelcomeCard } from "@/components/parent/welcome-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { optionLabel, type LookupChoice } from "@/lib/academics";
import { requireParent } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import {
  activityFor,
  childSentence,
  childStatus,
  firstName,
  outstandingWork,
  trendPoints,
} from "@/lib/parent-insights";
import { parseParentChildTab } from "@/lib/paths";
import { getParentFamily, type ParentChild } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ studentId: string }>;
}): Promise<Metadata> {
  const { studentId } = await params;
  const parent = await requireParent();
  const family = await getParentFamily(parent.id);
  const child = family.find(
    (member) => member.student.id === decodeURIComponent(studentId),
  );
  return { title: child?.student.name ?? "Child progress" };
}

export default async function ParentChildPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const parent = await requireParent();
  const tab = parseParentChildTab(query.tab);
  const [family, catalog] = await Promise.all([
    getParentFamily(parent.id),
    getLookupCatalog(),
  ]);

  const index = family.findIndex(
    (member) => member.student.id === decodeURIComponent(studentId),
  );
  const child = family[index];
  if (!child) {
    notFound();
  }

  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);
  const examPapers = lookupChoices(catalog.exam_paper);
  const status = childStatus(child);
  const open = outstandingWork(child.materials).total;
  const batchLabel =
    child.batches.map((batch) => batch.name).join(" · ") || "No batches yet";
  const profileBits = [
    optionLabel(syllabuses, child.student.syllabus),
    optionLabel(exams, child.student.exam),
  ].filter(Boolean);

  return (
    <div className="space-y-8 pb-20 sm:pb-0">
      <ChildSwitcher family={family} currentId={child.student.id} tab={tab} />

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <ChildAvatar name={child.student.name} index={index} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand">{batchLabel}</p>
            <h1 className="font-heading mt-1 text-display-3 font-semibold text-balance">
              {child.student.name}
            </h1>
            <p className="mt-2 max-w-2xl text-content-muted text-pretty">
              <span className="font-medium text-content">
                {firstName(child.student.name)}
              </span>{" "}
              {childSentence(child)}
            </p>
            {profileBits.length > 0 ? (
              <p className="mt-1 text-sm text-content-subtle">
                {profileBits.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={status.tone} dot>
            {status.label}
          </StatusPill>
          <ChildTabs
            studentId={child.student.id}
            current={tab}
            counts={{ chapters: open, marks: child.marks.length }}
          />
        </div>
      </header>

      {tab === "overview" ? (
        <OverviewTab child={child} />
      ) : tab === "chapters" ? (
        <ChaptersTab child={child} />
      ) : (
        <MarksTab
          child={child}
          syllabuses={syllabuses}
          examPapers={examPapers}
        />
      )}
    </div>
  );
}

function OverviewTab({ child }: { child: ParentChild }) {
  const { progress } = child;
  const submittedPercent =
    progress.assignmentAssigned === 0
      ? 0
      : Math.round(
          (progress.assignmentCompleted / progress.assignmentAssigned) * 100,
        );

  return (
    <div className="space-y-10">
      <WelcomeCard />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="attention-heading" className="min-w-0 space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="attention-heading" className="text-title-1 font-semibold">
              Needs attention
            </h2>
          </div>
          <AttentionList items={[child]} />
        </section>

        <aside className="space-y-6" aria-label={`${child.student.name}'s progress`}>
          <Surface className="space-y-4">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={progress.classMaterialPercent}
                label={`${child.student.name}: class material revised`}
              >
                <span className="font-heading tabular block text-title-3 font-semibold leading-none">
                  {progress.classMaterialPercent}%
                </span>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-content-muted">
                  Class material revised
                </p>
                <p className="tabular font-semibold">
                  {progress.classMaterialCompleted} of{" "}
                  {progress.classMaterialAssigned}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 text-sm text-content-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ClipboardList aria-hidden="true" className="size-4" />
                  Assignments submitted
                </span>
                <span className="tabular font-medium text-content">
                  {progress.assignmentCompleted} of {progress.assignmentAssigned}
                </span>
              </div>
              <ProgressMeter
                value={submittedPercent}
                label={`${child.student.name}: assignments submitted`}
                tone="highlight"
                size="sm"
                className="mt-1.5"
              />
            </div>
          </Surface>
        </aside>
      </div>

      <section aria-labelledby="activity-heading" className="space-y-4">
        <h2 id="activity-heading" className="text-title-1 font-semibold">
          Recent activity
        </h2>
        <ActivityFeed
          events={activityFor([child], 10)}
          showChild={false}
          emptyLabel={`Nothing yet for ${firstName(child.student.name)}. Revisions, submissions and marks will show up here.`}
        />
      </section>
    </div>
  );
}

function ChaptersTab({ child }: { child: ParentChild }) {
  const courses = child.batches.flatMap((batch) =>
    child.batches.length > 1
      ? batch.courses.map((course) => ({
          ...course,
          title: `${course.title} · ${batch.name}`,
        }))
      : batch.courses,
  );

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen />}
        title="Nothing assigned yet"
        description={`When the teacher assigns class material or assignments, they will appear here by chapter for ${firstName(child.student.name)}.`}
      />
    );
  }

  return <ChapterList courses={courses} />;
}

function MarksTab({
  child,
  syllabuses,
  examPapers,
}: {
  child: ParentChild;
  syllabuses: LookupChoice[];
  examPapers: LookupChoice[];
}) {
  const trend = trendPoints(child.marks, (value) =>
    optionLabel(examPapers, value),
  );

  if (child.marks.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="No marks logged yet"
        description={`${firstName(child.student.name)} can log written-exam scores from the student portal. They will show up here.`}
      />
    );
  }

  return (
    <div className="space-y-8">
      {trend.points.length > 0 ? (
        <Surface className="space-y-3">
          <h2 className="text-title-2 font-semibold">Trend</h2>
          <MarksTrend points={trend.points} percent={trend.percent} />
        </Surface>
      ) : null}
      <section aria-labelledby="marks-heading" className="space-y-4">
        <h2 id="marks-heading" className="text-title-1 font-semibold">
          Every test
        </h2>
        <MarksTimeline
          entries={child.marks}
          showContext
          syllabuses={syllabuses}
          examPapers={examPapers}
        />
      </section>
    </div>
  );
}
