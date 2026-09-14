import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  BookMarked,
  FileUp,
  LayoutList,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { BatchUploadSheet } from "@/components/batch-upload-sheet";
import { BatchWindowForm } from "@/components/batch-window-form";
import { PageHeader } from "@/components/layout/page-header";
import { CopyButton } from "@/components/teacher/copy-button";
import { MoreMenu } from "@/components/teacher/more-menu";
import { FilterChips, PageTabs } from "@/components/teacher/page-tabs";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill, completionTone } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { optionLabel } from "@/lib/academics";
import { detachCourse } from "@/lib/actions/courses";
import { deleteBatch } from "@/lib/actions/batches";
import { deleteStudent } from "@/lib/actions/students";
import { requireTeacher } from "@/lib/auth";
import { resolveBatchWindow } from "@/lib/dates";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import {
  batchPath,
  chapterPath,
  coursePath,
  enrollBatchStudentsPath,
  libraryCoursePath,
  newStudentPath,
  studentManagePath,
} from "@/lib/paths";
import {
  getBatchCourse,
  getBatchCourseChapters,
  getBatchProgressMatrix,
  getOwnedBatch,
} from "@/lib/queries";
import {
  firstName,
  firstQueryValue,
  formatScore,
  initials,
  percent,
  plural,
  relativeDay,
} from "@/lib/teacher-format";
import { getBatchChapterProgress, getBatchStudentSignals } from "@/lib/teacher-queries";

export const metadata: Metadata = {
  title: "Batch",
};

type Tab = "progress" | "chapters" | "students";
type Show = "all" | "behind" | "done";
type Sort = "name" | "revised" | "submitted";

export default async function BatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ batchId }, raw] = await Promise.all([params, searchParams]);
  const teacher = await requireTeacher();
  const [batch, catalog] = await Promise.all([getOwnedBatch(teacher.id, batchId), getLookupCatalog()]);

  if (!batch) {
    notFound();
  }

  const query = {
    tab: firstQueryValue(raw.tab),
    from: firstQueryValue(raw.from),
    to: firstQueryValue(raw.to),
    all: firstQueryValue(raw.all),
    show: firstQueryValue(raw.show),
    sort: firstQueryValue(raw.sort),
  };
  const tab: Tab = query.tab === "chapters" || query.tab === "students" ? query.tab : "progress";
  const show: Show = query.show === "behind" || query.show === "done" ? query.show : "all";
  const sort: Sort = query.sort === "revised" || query.sort === "submitted" ? query.sort : "name";
  // All time unless the teacher picked dates: a fresh visit should show the whole picture.
  const window = resolveBatchWindow(
    query.from || query.to ? query : { all: "1" },
    null,
  );

  const [progress, allTime, course, signals, chapterProgress] = await Promise.all([
    getBatchProgressMatrix(batch.id, window.from, window.to),
    getBatchProgressMatrix(batch.id, null, null),
    getBatchCourse(batch.id),
    getBatchStudentSignals(batch.id),
    getBatchChapterProgress(batch.id),
  ]);
  const chapters = course ? await getBatchCourseChapters(batch.id, course.id) : [];
  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);

  const isBehind = (row: (typeof allTime)[number]) =>
    row.classMaterialCompleted < row.classMaterialAssigned || row.assignmentCompleted < row.assignmentAssigned;
  const behindIds = new Set(allTime.filter(isBehind).map((row) => row.student.id));
  const totals = allTime.reduce(
    (sum, row) => ({
      revised: sum.revised + row.classMaterialCompleted,
      revisable: sum.revisable + row.classMaterialAssigned,
      submitted: sum.submitted + row.assignmentCompleted,
      submittable: sum.submittable + row.assignmentAssigned,
    }),
    { revised: 0, revisable: 0, submitted: 0, submittable: 0 },
  );
  const uploadChapters = chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    pdfCount: chapter.pdfCount,
  }));

  const base = batchPath(batch.id);
  const tabHref = (id: Tab) => (id === "progress" ? base : `${base}?tab=${id}`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Batches", href: "/dashboard/batches" }, { label: batch.name }]} />}
        eyebrow={course ? course.title : "No course attached"}
        title={batch.name}
        description={batch.description || undefined}
        actions={
          <>
            {course ? (
              <BatchUploadSheet
                batchId={batch.id}
                batchName={batch.name}
                courseId={course.id}
                courseTitle={course.title}
                chapters={uploadChapters}
                trigger={
                  <Button size="lg">
                    <FileUp data-icon="inline-start" />
                    Upload material
                  </Button>
                }
              />
            ) : null}
            <Button asChild variant="outline" size="lg">
              <Link href={enrollBatchStudentsPath(batch.id)}>
                <UserPlus data-icon="inline-start" />
                Add students
              </Link>
            </Button>
            <MoreMenu
              label="More batch actions"
              links={[{ label: "Edit batch details", href: `${base}/edit`, icon: <Pencil aria-hidden="true" /> }]}
              dangers={[
                {
                  label: "Delete batch",
                  icon: <Trash2 aria-hidden="true" />,
                  title: `Delete ${batch.name}?`,
                  message: "This can't be undone.",
                  consequences: [
                    `${plural(allTime.length, "student")} leave this batch. Students who aren't in any other batch are deleted, with their logins.`,
                    "Every PDF uploaded for this batch, and the work students submitted for it, is deleted.",
                    "The shared course and its chapters stay in your library.",
                  ],
                  confirmText: batch.name,
                  action: deleteBatch.bind(null, batch.id),
                },
              ]}
            />
          </>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Students" value={allTime.length} hint={behindIds.size > 0 ? `${behindIds.size} behind` : "All caught up"} />
        <Stat
          label="Class material revised"
          value={`${percent(totals.revised, totals.revisable)}%`}
          hint={`${totals.revised} of ${totals.revisable}`}
          meter={{ value: percent(totals.revised, totals.revisable), tone: "brand" }}
        />
        <Stat
          label="Assignments submitted"
          value={`${percent(totals.submitted, totals.submittable)}%`}
          hint={`${totals.submitted} of ${totals.submittable}`}
          meter={{ value: percent(totals.submitted, totals.submittable), tone: "highlight" }}
        />
        <Stat
          label="Chapters with material"
          value={`${chapters.filter((chapter) => chapter.pdfCount > 0).length}/${chapters.length}`}
          hint={course ? course.title : "Attach a course"}
        />
      </dl>

      <PageTabs
        label="Batch sections"
        current={tab}
        tabs={[
          { id: "progress", label: "Progress", href: tabHref("progress"), icon: LayoutList },
          { id: "chapters", label: "Chapters", href: tabHref("chapters"), icon: ListChecks, count: chapters.length },
          { id: "students", label: "Students", href: tabHref("students"), icon: Users, count: allTime.length },
        ]}
      />

      {tab === "progress" ? (
        <ProgressTab
          batchId={batch.id}
          batchName={batch.name}
          rows={progress}
          behindIds={behindIds}
          signals={signals}
          window={window}
          show={show}
          sort={sort}
          query={query}
          syllabuses={syllabuses}
          exams={exams}
        />
      ) : tab === "chapters" ? (
        course ? (
          <section className="space-y-4">
            <Surface className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-content-subtle uppercase">Course</p>
                <p className="font-heading text-title-2 font-semibold">{course.title}</p>
                <p className="mt-0.5 text-sm text-content-muted text-pretty">
                  Chapters are shared with every batch using this course. PDFs here belong only to {batch.name}.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="lg">
                  <Link href={`${coursePath(batch.id, course.id)}/chapters/new`}>
                    <Plus data-icon="inline-start" />
                    Add chapter
                  </Link>
                </Button>
                <MoreMenu
                  label="More course actions"
                  links={[
                    { label: "Edit course details", href: `${coursePath(batch.id, course.id)}/edit`, icon: <Pencil aria-hidden="true" /> },
                    { label: "Open in course library", href: libraryCoursePath(course.id), icon: <BookMarked aria-hidden="true" /> },
                  ]}
                  dangers={[
                    {
                      label: "Detach course",
                      icon: <Trash2 aria-hidden="true" />,
                      title: `Detach ${course.title} from ${batch.name}?`,
                      message: "The course stays in your library, but this batch loses its material.",
                      consequences: [
                        "Every PDF uploaded for this batch is deleted.",
                        "Work students submitted for those PDFs is deleted.",
                      ],
                      action: detachCourse.bind(null, batch.id, course.id),
                    },
                  ]}
                />
              </div>
            </Surface>

            {chapters.length === 0 ? (
              <EmptyState
                icon={<ListChecks />}
                title="No chapters yet"
                description="Add the first chapter, then upload a PDF for it."
                action={
                  <Button asChild size="lg">
                    <Link href={`${coursePath(batch.id, course.id)}/chapters/new`}>Add a chapter</Link>
                  </Button>
                }
              />
            ) : (
              <ol className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
                {chapters.map((chapter, index) => {
                  const stats = chapterProgress.get(chapter.id);
                  return (
                    <li key={chapter.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-xs font-semibold text-content-muted">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={chapterPath(batch.id, course.id, chapter.id)}
                            className="font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          >
                            {chapter.title}
                          </Link>
                          <p className="mt-0.5 text-sm text-content-muted">
                            {chapter.pdfCount === 0
                              ? "No material yet"
                              : [
                                  chapter.classMaterialCount > 0 ? plural(chapter.classMaterialCount, "class material") : null,
                                  chapter.assignmentCount > 0 ? plural(chapter.assignmentCount, "assignment") : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                          </p>
                        </div>
                      </div>

                      {stats ? (
                        <div className="grid w-full grid-cols-2 gap-4 sm:w-64">
                          <MiniMeter
                            label="Revised"
                            done={stats.classMaterialCompleted}
                            total={stats.classMaterialAssigned}
                            tone="brand"
                          />
                          <MiniMeter
                            label="Submitted"
                            done={stats.assignmentCompleted}
                            total={stats.assignmentAssigned}
                            tone="highlight"
                          />
                        </div>
                      ) : (
                        <StatusPill tone="warning" className="self-start sm:self-auto">
                          Needs material
                        </StatusPill>
                      )}

                      <div className="flex items-center gap-2">
                        <BatchUploadSheet
                          batchId={batch.id}
                          batchName={batch.name}
                          courseId={course.id}
                          courseTitle={course.title}
                          chapters={uploadChapters}
                          defaultChapterId={chapter.id}
                          trigger={
                            <Button variant="outline" size="lg">
                              <FileUp data-icon="inline-start" />
                              Upload
                              <span className="sr-only"> to {chapter.title}</span>
                            </Button>
                          }
                        />
                        <Button asChild variant="ghost" size="lg">
                          <Link href={chapterPath(batch.id, course.id, chapter.id)}>
                            Open
                            <span className="sr-only"> {chapter.title}</span>
                          </Link>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ) : (
          <EmptyState
            icon={<BookMarked />}
            title="No course attached"
            description="Attach a course from your library to start uploading material for this batch."
            action={
              <Button asChild size="lg">
                <Link href={`${base}/courses/new`}>Choose a course</Link>
              </Button>
            }
          />
        )
      ) : (
        <StudentsTab
          batchId={batch.id}
          batchName={batch.name}
          rows={allTime}
          behindIds={behindIds}
          syllabuses={syllabuses}
          exams={exams}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  meter,
}: {
  label: string;
  value: string | number;
  hint: string;
  meter?: { value: number; tone: "brand" | "highlight" };
}) {
  return (
    <Surface pad="sm" className="flex flex-col gap-1">
      <dt className="text-sm text-content-muted">{label}</dt>
      <dd className="font-heading tabular text-title-1 font-semibold">{value}</dd>
      <dd className="tabular text-xs text-content-subtle">{hint}</dd>
      {meter ? <ProgressMeter value={meter.value} label={label} tone={meter.tone} size="sm" className="mt-1" /> : null}
    </Surface>
  );
}

function MiniMeter({
  label,
  done,
  total,
  tone,
  compact = false,
}: {
  label: string;
  done: number;
  total: number;
  tone: "brand" | "highlight";
  /** In a table the column header already names the measure. */
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={compact ? "tabular text-content-subtle" : "text-content-muted"}>
          {compact ? `${percent(done, total)}%` : label}
        </span>
        <span className="tabular font-medium">{total === 0 ? "—" : `${done}/${total}`}</span>
      </div>
      <ProgressMeter value={percent(done, total)} label={`${label}: ${done} of ${total}`} tone={tone} size="sm" className="mt-1" />
    </div>
  );
}

type Row = Awaited<ReturnType<typeof getBatchProgressMatrix>>[number];

function ProgressTab({
  batchId,
  batchName,
  rows,
  behindIds,
  signals,
  window,
  show,
  sort,
  query,
  syllabuses,
  exams,
}: {
  batchId: string;
  batchName: string;
  rows: Row[];
  behindIds: Set<string>;
  signals: Awaited<ReturnType<typeof getBatchStudentSignals>>;
  window: ReturnType<typeof resolveBatchWindow>;
  show: Show;
  sort: Sort;
  query: Record<string, string | undefined>;
  syllabuses: { value: string; label: string }[];
  exams: { value: string; label: string }[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No students in this batch yet"
        description="Add students from your directory and their progress shows up here."
        action={
          <Button asChild size="lg">
            <Link href={enrollBatchStudentsPath(batchId)}>Add students</Link>
          </Button>
        }
      />
    );
  }

  const base = batchPath(batchId);
  const keep = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { from: query.from, to: query.to, all: query.all, show, sort, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (!value || (key === "show" && value === "all") || (key === "sort" && value === "name")) continue;
      params.set(key, value);
    }
    const search = params.toString();
    return search ? `${base}?${search}` : base;
  };

  const visible = rows
    .filter((row) => (show === "behind" ? behindIds.has(row.student.id) : show === "done" ? !behindIds.has(row.student.id) : true))
    .sort((a, b) => {
      if (sort === "revised") {
        return percent(a.classMaterialCompleted, a.classMaterialAssigned) - percent(b.classMaterialCompleted, b.classMaterialAssigned);
      }
      if (sort === "submitted") {
        return percent(a.assignmentCompleted, a.assignmentAssigned) - percent(b.assignmentCompleted, b.assignmentAssigned);
      }
      return a.student.name.localeCompare(b.student.name);
    });

  const behindRows = rows.filter((row) => behindIds.has(row.student.id));
  const reminder = [
    `Reminder from Bhargav Academy (${batchName}):`,
    ...behindRows.map((row) => {
      const toRevise = row.classMaterialAssigned - row.classMaterialCompleted;
      const toSubmit = row.assignmentAssigned - row.assignmentCompleted;
      const parts = [
        toRevise > 0 ? `${plural(toRevise, "class material")} to revise` : null,
        toSubmit > 0 ? `${plural(toSubmit, "assignment")} to submit` : null,
      ].filter(Boolean);
      return `• ${firstName(row.student.name)}: ${parts.join(", ")}`;
    }),
    "Please finish these in the student portal before the next class.",
  ].join("\n");

  const windowNote =
    window.preset === "all" ? null : "Counts show work finished in the selected dates. Assigned totals don't change.";

  return (
    <section aria-label="Student progress" className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <BatchWindowForm batchId={batchId} from={window.from} to={window.to} preset={window.preset} show={show} />
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips
            label="Filter students"
            current={show}
            chips={[
              { id: "all", label: "All", href: keep({ show: "all" }), count: rows.length },
              { id: "behind", label: "Behind", href: keep({ show: "behind" }), count: behindIds.size },
              { id: "done", label: "Caught up", href: keep({ show: "done" }), count: rows.length - behindIds.size },
            ]}
          />
          {behindRows.length > 0 ? (
            <CopyButton text={reminder} label="Copy reminder" copiedMessage="Reminder copied. Paste it into your class WhatsApp group." size="default" />
          ) : null}
        </div>
      </div>
      {windowNote ? <p className="text-sm text-content-muted">{windowNote}</p> : null}

      {visible.length === 0 ? (
        <Surface className="text-center text-sm text-content-muted">
          {show === "behind" ? "Nobody is behind. Nice." : "No students match this filter."}
        </Surface>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl bg-surface ring-1 ring-line md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-sunken/60 text-left text-xs font-medium tracking-wide text-content-subtle uppercase">
                <tr>
                  <SortHeader label="Student" active={sort === "name"} href={keep({ sort: "name" })} />
                  <SortHeader label="Class material revised" active={sort === "revised"} href={keep({ sort: "revised" })} />
                  <SortHeader label="Assignments submitted" active={sort === "submitted"} href={keep({ sort: "submitted" })} />
                  <th scope="col" className="px-4 py-3 font-medium">Latest mark</th>
                  <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Last active</th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((row) => {
                  const signal = signals.get(row.student.id);
                  return (
                    <tr key={row.student.id} className="transition-colors duration-(--dur-fast) hover:bg-sunken/40">
                      <td className="px-4 py-3">
                        <StudentCell
                          student={row.student}
                          behind={behindIds.has(row.student.id)}
                          detail={[optionLabel(syllabuses, row.student.syllabus), optionLabel(exams, row.student.exam)].filter(Boolean).join(" · ")}
                        />
                      </td>
                      <td className="w-48 px-4 py-3">
                        <MiniMeter label="Revised" done={row.classMaterialCompleted} total={row.classMaterialAssigned} tone="brand" compact />
                      </td>
                      <td className="w-48 px-4 py-3">
                        <MiniMeter label="Submitted" done={row.assignmentCompleted} total={row.assignmentAssigned} tone="highlight" compact />
                      </td>
                      <td className="px-4 py-3">
                        {signal?.latestMark ? (
                          <span className="font-heading tabular text-title-3 font-semibold">{formatScore(signal.latestMark.marks)}</span>
                        ) : (
                          <span className="text-content-subtle">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-content-muted">
                        {signal?.lastActive ? relativeDay(signal.lastActive) : <span className="text-content-subtle">Not yet</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RowMenu batchId={batchId} batchName={batchName} student={row.student} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {visible.map((row) => {
              const signal = signals.get(row.student.id);
              return (
                <li key={row.student.id}>
                  <Surface pad="sm" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <StudentCell student={row.student} behind={behindIds.has(row.student.id)} />
                      <RowMenu batchId={batchId} batchName={batchName} student={row.student} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <MiniMeter label="Revised" done={row.classMaterialCompleted} total={row.classMaterialAssigned} tone="brand" />
                      <MiniMeter label="Submitted" done={row.assignmentCompleted} total={row.assignmentAssigned} tone="highlight" />
                    </div>
                    <p className="text-xs text-content-subtle">
                      {signal?.latestMark ? `Latest mark ${formatScore(signal.latestMark.marks)} · ` : ""}
                      {signal?.lastActive ? `Active ${relativeDay(signal.lastActive)}` : "No activity yet"}
                    </p>
                  </Surface>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

function SortHeader({ label, active, href }: { label: string; active: boolean; href: string }) {
  return (
    <th scope="col" aria-sort={active ? "ascending" : undefined} className="px-4 py-3 font-medium">
      <Link
        href={href}
        scroll={false}
        className={cn(
          "inline-flex items-center gap-1 rounded hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          active && "text-content",
        )}
      >
        {label}
        <ArrowDown aria-hidden="true" className={cn("size-3", active ? "opacity-100" : "opacity-0")} />
      </Link>
    </th>
  );
}

function StudentCell({
  student,
  behind,
  detail,
}: {
  student: Row["student"];
  behind: boolean;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-subtle-fg"
      >
        {initials(student.name)}
      </span>
      <div className="min-w-0">
        <Link
          href={studentManagePath(student.id)}
          className="flex items-center gap-2 font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="truncate">{student.name}</span>
          {behind ? <span className="size-2 shrink-0 rounded-full bg-warning" title="Behind" /> : null}
          {behind ? <span className="sr-only">(behind)</span> : null}
        </Link>
        <p className="truncate text-xs text-content-subtle">{detail || student.email}</p>
      </div>
    </div>
  );
}

function RowMenu({
  batchId,
  batchName,
  student,
}: {
  batchId: string;
  batchName: string;
  student: Row["student"];
}) {
  return (
    <MoreMenu
      label={`Actions for ${student.name}`}
      links={[
        { label: "Open profile", href: studentManagePath(student.id), icon: <UserRound aria-hidden="true" /> },
        { label: "View marks", href: `${studentManagePath(student.id)}?tab=marks`, icon: <LayoutList aria-hidden="true" /> },
      ]}
      dangers={[
        {
          label: "Remove from batch",
          icon: <Trash2 aria-hidden="true" />,
          title: `Remove ${student.name} from ${batchName}?`,
          message: "They lose access to this batch's material.",
          consequences: [
            "Their progress and submitted work for this batch are deleted.",
            "If this is their only batch, their student login is deleted too.",
          ],
          action: deleteStudent.bind(null, batchId, student.id),
        },
      ]}
      variant="ghost"
    />
  );
}

function StudentsTab({
  batchId,
  batchName,
  rows,
  behindIds,
  syllabuses,
  exams,
}: {
  batchId: string;
  batchName: string;
  rows: Row[];
  behindIds: Set<string>;
  syllabuses: { value: string; label: string }[];
  exams: { value: string; label: string }[];
}) {
  return (
    <section aria-label="Students in this batch" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-content-muted">
          {plural(rows.length, "student")} in {batchName}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href={newStudentPath(batchId)}>
              <Plus data-icon="inline-start" />
              New student
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href={enrollBatchStudentsPath(batchId)}>
              <UserPlus data-icon="inline-start" />
              Add from directory
            </Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No students yet"
          description="Create a new student or add existing ones from your directory."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <li key={row.student.id}>
              <Surface pad="sm" className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <StudentCell student={row.student} behind={behindIds.has(row.student.id)} />
                  <RowMenu batchId={batchId} batchName={batchName} student={row.student} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {row.student.syllabus ? (
                    <StatusPill tone="brand">{optionLabel(syllabuses, row.student.syllabus)}</StatusPill>
                  ) : null}
                  {row.student.exam ? (
                    <StatusPill tone="highlight">{optionLabel(exams, row.student.exam)}</StatusPill>
                  ) : null}
                  <StatusPill tone={completionTone(
                    row.classMaterialCompleted + row.assignmentCompleted,
                    row.classMaterialAssigned + row.assignmentAssigned,
                  )}>
                    {behindIds.has(row.student.id) ? "Behind" : row.classMaterialAssigned + row.assignmentAssigned === 0 ? "Nothing assigned" : "Caught up"}
                  </StatusPill>
                </div>
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-sm">
                  <a href={`tel:${row.student.contactNumber}`} className="text-content-muted hover:text-content hover:underline">
                    {row.student.contactNumber}
                  </a>
                  <span className="truncate font-mono text-xs leading-5 text-content-subtle">{row.student.email}</span>
                </div>
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
