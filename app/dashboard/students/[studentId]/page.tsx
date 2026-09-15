import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  FileCheck2,
  HeartHandshake,
  LayoutList,
  MessageCircle,
  Phone,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { EnrollStudentForm } from "@/components/enroll-student-form";
import { PageHeader } from "@/components/layout/page-header";
import { MarksTimeline } from "@/components/marks-timeline";
import { StudentForm } from "@/components/student-form";
import { MoreMenu } from "@/components/teacher/more-menu";
import { PageTabs } from "@/components/teacher/page-tabs";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { optionLabel } from "@/lib/academics";
import { deleteDirectoryStudent, deleteStudent, updateDirectoryStudent } from "@/lib/actions/students";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { isAssignment } from "@/lib/materials";
import { batchPath, chapterPath, parentManagePath, studentManagePath, studentsPath, submissionPath } from "@/lib/paths";
import { getOwnedStudentForTeacher, getStudentMarkEntries, getTeacherBatches } from "@/lib/queries";
import {
  dueState,
  firstQueryValue,
  formatScore,
  initials,
  percent,
  plural,
  relativeDay,
  whatsappNumber,
} from "@/lib/teacher-format";
import { getTeacherStudentWork } from "@/lib/teacher-queries";

export const metadata: Metadata = {
  title: "Student",
};

type Tab = "overview" | "profile" | "batches" | "marks";

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [{ studentId }, query] = await Promise.all([params, searchParams]);
  const teacher = await requireTeacher();
  const [owned, catalog, batchList] = await Promise.all([
    getOwnedStudentForTeacher(teacher.id, studentId),
    getLookupCatalog(),
    getTeacherBatches(teacher.id),
  ]);

  if (!owned) {
    notFound();
  }

  const { student, parent } = owned;
  const [marks, work] = await Promise.all([
    getStudentMarkEntries(student.id),
    getTeacherStudentWork(teacher.id, student.id),
  ]);
  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);
  const examPapers = lookupChoices(catalog.exam_paper);
  const requested = firstQueryValue(query.tab);
  const tab: Tab = requested === "profile" || requested === "batches" || requested === "marks" ? requested : "overview";
  const base = studentManagePath(student.id);
  const tabHref = (id: Tab) => (id === "overview" ? base : `${base}?tab=${id}`);

  const classMaterial = work.filter((item) => !isAssignment(item.kind));
  const assignments = work.filter((item) => isAssignment(item.kind));
  const revised = classMaterial.filter((item) => item.completedAt).length;
  const submitted = assignments.filter((item) => item.completedAt).length;
  // Overdue first, then anything with a due date, then the rest.
  const open = [...assignments, ...classMaterial]
    .filter((item) => !item.completedAt)
    .sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity));
  const recent = work
    .filter((item) => item.completedAt)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
    .slice(0, 8);
  const latest = marks[0];
  const previous = marks[1];
  const delta = latest && previous ? Math.round((latest.marks - previous.marks) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Students", href: studentsPath() }, { label: student.name }]} />}
        title={
          <span className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="font-heading flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-title-2 font-semibold text-brand-subtle-fg ring-1 ring-brand-line"
            >
              {initials(student.name)}
            </span>
            <span className="min-w-0">{student.name}</span>
          </span>
        }
        description={
          [optionLabel(syllabuses, student.syllabus), optionLabel(exams, student.exam)].filter(Boolean).join(" · ") ||
          undefined
        }
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${student.contactNumber}`}>
                <Phone data-icon="inline-start" />
                Call
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`https://wa.me/${whatsappNumber(student.contactNumber)}`} target="_blank" rel="noreferrer">
                <MessageCircle data-icon="inline-start" />
                WhatsApp
              </a>
            </Button>
            <MoreMenu
              label={`More actions for ${student.name}`}
              links={[{ label: "Edit profile", href: tabHref("profile"), icon: <UserRound aria-hidden="true" /> }]}
              dangers={[
                {
                  label: "Delete student",
                  icon: <Trash2 aria-hidden="true" />,
                  title: `Delete ${student.name}?`,
                  message: "They're removed from every batch and can no longer sign in.",
                  consequences: [
                    `${plural(owned.batches.length, "batch", "batches")}: ${owned.batches.map((batch) => batch.name).join(", ")}.`,
                    "Their progress, submitted work and marks are deleted.",
                    parent ? `${parent.name}'s parent login stays, but won't show ${student.name}.` : "No parent login is linked.",
                  ],
                  confirmText: student.name,
                  action: deleteDirectoryStudent.bind(null, student.id),
                },
              ]}
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {owned.batches.map((batch) => (
          <Link
            key={batch.id}
            href={batchPath(batch.id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 font-medium ring-1 ring-line hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Users aria-hidden="true" className="size-3.5 text-content-subtle" />
            {batch.name}
          </Link>
        ))}
        {parent ? (
          <Link
            href={parentManagePath(parent.id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 font-medium ring-1 ring-line hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <HeartHandshake aria-hidden="true" className="size-3.5 text-content-subtle" />
            Parent: {parent.name}
          </Link>
        ) : (
          <StatusPill tone="neutral">No parent login</StatusPill>
        )}
        <span className="font-mono text-xs text-content-subtle">{student.email}</span>
      </div>

      <PageTabs
        label="Student sections"
        current={tab}
        tabs={[
          { id: "overview", label: "Overview", href: tabHref("overview"), icon: LayoutList },
          { id: "marks", label: "Marks", href: tabHref("marks"), icon: Award, count: marks.length },
          { id: "batches", label: "Batches", href: tabHref("batches"), icon: Users, count: owned.batches.length },
          { id: "profile", label: "Profile", href: tabHref("profile"), icon: UserRound },
        ]}
      />

      {tab === "overview" ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            <dl className="grid gap-3 sm:grid-cols-3">
              <Surface pad="sm" className="flex flex-col gap-1">
                <dt className="flex items-center gap-1.5 text-sm text-content-muted">
                  <BookOpenCheck aria-hidden="true" className="size-4" />
                  Revised
                </dt>
                <dd className="font-heading tabular text-title-1 font-semibold">
                  {revised}
                  <span className="text-content-subtle">/{classMaterial.length}</span>
                </dd>
                <dd>
                  <ProgressMeter value={percent(revised, classMaterial.length)} label="Class material revised" size="sm" />
                </dd>
              </Surface>
              <Surface pad="sm" className="flex flex-col gap-1">
                <dt className="flex items-center gap-1.5 text-sm text-content-muted">
                  <FileCheck2 aria-hidden="true" className="size-4" />
                  Submitted
                </dt>
                <dd className="font-heading tabular text-title-1 font-semibold">
                  {submitted}
                  <span className="text-content-subtle">/{assignments.length}</span>
                </dd>
                <dd>
                  <ProgressMeter value={percent(submitted, assignments.length)} label="Assignments submitted" tone="highlight" size="sm" />
                </dd>
              </Surface>
              <Surface pad="sm" className="flex flex-col gap-1">
                <dt className="flex items-center gap-1.5 text-sm text-content-muted">
                  <Award aria-hidden="true" className="size-4" />
                  Latest mark
                </dt>
                <dd className="font-heading tabular text-title-1 font-semibold">{latest ? formatScore(latest.marks) : "—"}</dd>
                <dd className="text-xs text-content-subtle">
                  {delta ? (
                    <span className={delta > 0 ? "font-medium text-success" : "font-medium text-danger"}>
                      {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} vs previous test
                    </span>
                  ) : latest ? (
                    latest.chapterTitles.join(", ")
                  ) : (
                    "No marks yet"
                  )}
                </dd>
              </Surface>
            </dl>

            <section aria-labelledby="open-heading" className="space-y-3">
              <h2 id="open-heading" className="text-title-1 font-semibold">
                Outstanding work
              </h2>
              {open.length === 0 ? (
                <p className="rounded-xl bg-success-subtle/60 p-4 text-sm text-success-subtle-fg ring-1 ring-success-line">
                  {work.length === 0 ? "Nothing has been assigned yet." : "All caught up. Every assigned PDF is done."}
                </p>
              ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
                  {open.slice(0, 8).map((item) => {
                    const assignment = isAssignment(item.kind);
                    return (
                      <li key={item.id}>
                        <Link
                          href={`${chapterPath(item.batchId, item.courseId, item.chapterId)}?material=${item.materialId}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-sunken/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                          <span
                            className={
                              assignment
                                ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-subtle text-warning-subtle-fg"
                                : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info-subtle-fg"
                            }
                          >
                            {assignment ? (
                              <ClipboardList aria-hidden="true" className="size-4" />
                            ) : (
                              <BookOpen aria-hidden="true" className="size-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{item.chapterTitle}</span>
                            <span className="block truncate text-xs text-content-subtle">
                              {item.materialName} · {item.batchName}
                            </span>
                          </span>
                          {assignment && dueState(item.dueAt) ? (
                            <StatusPill tone={dueState(item.dueAt)!.tone === "neutral" ? "warning" : dueState(item.dueAt)!.tone}>
                              {dueState(item.dueAt)!.label}
                            </StatusPill>
                          ) : (
                            <StatusPill tone={assignment ? "warning" : "info"}>{assignment ? "To submit" : "To revise"}</StatusPill>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              {open.length > 8 ? <p className="text-sm text-content-muted">and {open.length - 8} more.</p> : null}
            </section>
          </div>

          <section aria-labelledby="recent-heading" className="space-y-3">
            <h2 id="recent-heading" className="text-title-1 font-semibold">
              Recent work
            </h2>
            {recent.length === 0 ? (
              <p className="rounded-xl bg-sunken p-4 text-sm text-content-muted">Nothing finished yet.</p>
            ) : (
              <ol className="space-y-1">
                {recent.map((item) => {
                  const assignment = isAssignment(item.kind);
                  return (
                    <li key={item.id} className="flex items-center gap-3 py-1.5">
                      <span
                        className={
                          assignment
                            ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-info-subtle text-info-subtle-fg"
                            : "flex size-9 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success-subtle-fg"
                        }
                      >
                        {assignment ? <FileCheck2 aria-hidden="true" className="size-4" /> : <BookOpenCheck aria-hidden="true" className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block truncate">
                          <span className="text-content-muted">{assignment ? "Submitted" : "Revised"}</span>{" "}
                          <span className="font-medium">{item.chapterTitle}</span>
                        </span>
                        <span className="block truncate text-xs text-content-subtle">
                          {item.batchName} · {relativeDay(item.completedAt!)}
                        </span>
                      </span>
                      {item.hasSubmission ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={submissionPath(item.materialId, student.id)} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      ) : tab === "marks" ? (
        <section aria-label="Marks" className="space-y-4">
          {marks.length > 0 ? (
            <dl className="grid grid-cols-3 gap-3">
              <Surface pad="sm">
                <dt className="text-sm text-content-muted">Latest</dt>
                <dd className="font-heading tabular text-title-1 font-semibold">{formatScore(marks[0].marks)}</dd>
              </Surface>
              <Surface pad="sm">
                <dt className="text-sm text-content-muted">Best</dt>
                <dd className="font-heading tabular text-title-1 font-semibold">
                  {formatScore(Math.max(...marks.map((mark) => mark.marks)))}
                </dd>
              </Surface>
              <Surface pad="sm">
                <dt className="text-sm text-content-muted">Average</dt>
                <dd className="font-heading tabular text-title-1 font-semibold">
                  {formatScore(Math.round((marks.reduce((sum, mark) => sum + mark.marks, 0) / marks.length) * 10) / 10)}
                </dd>
              </Surface>
            </dl>
          ) : null}
          <MarksTimeline entries={marks} showContext syllabuses={syllabuses} examPapers={examPapers} />
          <p className="text-xs text-content-subtle">Students log their own marks from the student portal after each test.</p>
        </section>
      ) : tab === "batches" ? (
        <section aria-label="Batches" className="max-w-2xl space-y-4">
          <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
            {owned.batches.map((batch) => (
              <li key={batch.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link href={batchPath(batch.id)} className="font-medium hover:underline">
                  {batch.name}
                </Link>
                <MoreMenu
                  label={`Actions for ${batch.name}`}
                  variant="ghost"
                  links={[{ label: "Open batch", href: batchPath(batch.id), icon: <Users aria-hidden="true" /> }]}
                  dangers={[
                    {
                      label: "Remove from batch",
                      icon: <Trash2 aria-hidden="true" />,
                      title: `Remove ${student.name} from ${batch.name}?`,
                      message: "They lose access to this batch's material.",
                      consequences: [
                        "Their progress and submitted work for this batch are deleted.",
                        owned.batches.length === 1
                          ? "This is their only batch, so their student login is deleted too."
                          : "They stay in their other batches.",
                      ],
                      action: deleteStudent.bind(null, batch.id, student.id),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
          <Surface>
            <EnrollStudentForm
              studentId={student.id}
              batches={batchList
                .filter((batch) => !owned.batches.some((enrolled) => enrolled.id === batch.id))
                .map((batch) => ({ id: batch.id, name: batch.name }))}
            />
          </Surface>
        </section>
      ) : (
        <Surface pad="lg" className="max-w-3xl">
          <StudentForm
            action={updateDirectoryStudent.bind(null, student.id)}
            syllabuses={syllabuses}
            exams={exams}
            next={tabHref("profile")}
            defaultValues={{
              name: student.name,
              contactNumber: student.contactNumber,
              email: student.email,
              parentName: parent?.name,
              parentEmail: parent?.email,
              syllabus: student.syllabus,
              exam: student.exam,
            }}
            submitLabel="Save student"
            cancelHref={base}
          />
        </Surface>
      )}
    </div>
  );
}
