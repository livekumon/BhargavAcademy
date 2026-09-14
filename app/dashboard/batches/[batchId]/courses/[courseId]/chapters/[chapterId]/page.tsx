import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ClipboardList, ExternalLink, FileText, Trash2 } from "lucide-react";
import { cn } from "cn";
import { ChapterForm } from "@/components/chapter-form";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialForm } from "@/components/material-form";
import { MoreMenu } from "@/components/teacher/more-menu";
import { SideSheet } from "@/components/teacher/side-sheet";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill, completionTone } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import {
  addChapterPdf,
  deleteChapter,
  removeChapterPdf,
  updateChapter,
  updateChapterPdfAssignments,
} from "@/lib/actions/chapters";
import { requireTeacher } from "@/lib/auth";
import { asMaterialKind, isAssignment, splitMaterials } from "@/lib/materials";
import { batchPath, chapterPath, materialPath, submissionPath } from "@/lib/paths";
import { getBatchStudents, getCourseBatches, getOwnedChapter } from "@/lib/queries";
import { dueDateInput, dueState, firstQueryValue, percent, plural, relativeDay } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Chapter",
};

type Material = NonNullable<Awaited<ReturnType<typeof getOwnedChapter>>>["materials"][number];

export default async function ChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string; courseId: string; chapterId: string }>;
  searchParams: Promise<{ material?: string | string[] }>;
}) {
  const [{ batchId, courseId, chapterId }, query] = await Promise.all([params, searchParams]);
  const teacher = await requireTeacher();
  const owned = await getOwnedChapter(teacher.id, batchId, courseId, chapterId);

  if (!owned) {
    notFound();
  }

  const { batch, course, chapter, materials } = owned;
  const [students, sharedBatches] = await Promise.all([
    getBatchStudents(batch.id),
    getCourseBatches(teacher.id, course.id),
  ]);
  const studentOptions = students.map((student) => ({ id: student.id, name: student.name }));
  const { classMaterials, assignments } = splitMaterials(materials);
  const requested = firstQueryValue(query.material);
  const selected = materials.find((material) => material.id === requested) ?? materials[0] ?? null;
  const here = chapterPath(batch.id, course.id, chapter.id);
  const otherBatches = sharedBatches.filter((item) => item.id !== batch.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Batches", href: "/dashboard/batches" },
              { label: batch.name, href: batchPath(batch.id) },
              { label: "Chapters", href: `${batchPath(batch.id)}?tab=chapters` },
              { label: chapter.title },
            ]}
          />
        }
        eyebrow={`${course.title} · ${batch.name}`}
        title={chapter.title}
        description={chapter.description || undefined}
        actions={
          <>
            <SideSheet
              label="Add material"
              icon="plus"
              variant="default"
              eyebrow={`${chapter.title} · ${batch.name}`}
              title="Add material"
              description="Upload a PDF and choose who gets it. Assignments include instructions."
            >
              <MaterialForm
                action={addChapterPdf.bind(null, batch.id, course.id, chapter.id)}
                students={studentOptions}
                submitLabel="Upload"
              />
            </SideSheet>
            <SideSheet
              label="Edit chapter"
              icon="pencil"
              eyebrow="Shared chapter"
              title="Edit chapter"
              description={
                otherBatches.length > 0
                  ? `The title and summary also change for ${otherBatches.map((item) => item.name).join(", ")}.`
                  : "The title and summary are shared by every batch that uses this course."
              }
            >
              <ChapterForm
                action={updateChapter.bind(null, batch.id, course.id, chapter.id)}
                defaultValues={{ title: chapter.title, description: chapter.description }}
                submitLabel="Save chapter"
                cancelHref={here}
                showPdf={false}
              />
            </SideSheet>
            <MoreMenu
              label="More chapter actions"
              dangers={[
                {
                  label: "Delete chapter",
                  icon: <Trash2 aria-hidden="true" />,
                  title: `Delete ${chapter.title}?`,
                  message: "This chapter is shared, so it's removed from the course everywhere.",
                  consequences: [
                    otherBatches.length > 0
                      ? `It disappears from ${plural(sharedBatches.length, "batch", "batches")}: ${sharedBatches.map((item) => item.name).join(", ")}.`
                      : `It disappears from ${course.title}.`,
                    "Every PDF in it, in every batch, is deleted along with students' submitted work.",
                  ],
                  confirmText: chapter.title,
                  action: deleteChapter.bind(null, batch.id, course.id, chapter.id),
                },
              ]}
            />
          </>
        }
      />

      {materials.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="No material in this chapter yet"
          description={`Upload the first class material or assignment for ${batch.name}. Use "Add material" above.`}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
          <nav aria-label="Materials in this chapter" className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <MaterialList title="Class material" icon={BookOpen} materials={classMaterials} selectedId={selected?.id} here={here} />
            <MaterialList title="Assignments" icon={ClipboardList} materials={assignments} selectedId={selected?.id} here={here} />
          </nav>

          {selected ? (
            <MaterialDetail
              key={selected.id}
              material={selected}
              batchId={batch.id}
              courseId={course.id}
              chapterId={chapter.id}
              studentOptions={studentOptions}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function MaterialList({
  title,
  icon: Icon,
  materials,
  selectedId,
  here,
}: {
  title: string;
  icon: typeof BookOpen;
  materials: Material[];
  selectedId?: string;
  here: string;
}) {
  const assignment = title === "Assignments";

  return (
    <div>
      <p className="flex items-center gap-2 px-1 pb-2 text-xs font-medium tracking-wide text-content-subtle uppercase">
        <Icon aria-hidden="true" className="size-3.5" />
        {title}
        <span className="tabular">{materials.length}</span>
      </p>
      {materials.length === 0 ? (
        <p className="px-1 text-sm text-content-subtle">None yet.</p>
      ) : (
        <ul className="space-y-1">
          {materials.map((material) => {
            const done = material.assignedStudents.filter((student) => student.completedAt).length;
            const total = material.assignedStudents.length;
            const active = material.id === selectedId;
            return (
              <li key={material.id}>
                <Link
                  href={`${here}?material=${material.id}`}
                  scroll={false}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    active ? "bg-brand-subtle ring-brand-line" : "bg-surface ring-line hover:bg-sunken",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm font-medium", active && "text-brand-subtle-fg")}>
                      {material.pdfOriginalName ?? "Untitled PDF"}
                    </span>
                    <span className="tabular block text-xs text-content-subtle">
                      {total === 0 ? "Not assigned" : `${done} of ${total} ${assignment ? "submitted" : "revised"}`}
                      {assignment && material.dueAt && done < total ? ` · ${dueState(material.dueAt)?.label}` : ""}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      total === 0 ? "bg-line-strong" : done === total ? "bg-success" : assignment ? "bg-warning" : "bg-info",
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MaterialDetail({
  material,
  batchId,
  courseId,
  chapterId,
  studentOptions,
}: {
  material: Material;
  batchId: string;
  courseId: string;
  chapterId: string;
  studentOptions: { id: string; name: string }[];
}) {
  const assignment = isAssignment(material.kind);
  const assigned = material.assignedStudents;
  const done = assigned.filter((student) => student.completedAt).length;
  const submissions = assigned.filter((student) => student.submissionFileName).length;
  const pdfUrl = materialPath(material.id);
  const due = assignment ? dueState(material.dueAt) : null;
  const late = due?.tone === "danger";

  return (
    <section aria-label={material.pdfOriginalName ?? "Material"} className="min-w-0 space-y-5">
      <Surface className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <StatusPill tone={assignment ? "highlight" : "brand"}>
                {assignment ? "Assignment" : "Class material"}
              </StatusPill>
              {due ? (
                <StatusPill tone={done === assigned.length ? "neutral" : due.tone}>{due.label}</StatusPill>
              ) : null}
            </span>
            <h2 className="mt-2 text-title-1 font-semibold break-words">
              {material.pdfOriginalName ?? "Untitled PDF"}
            </h2>
            <p className="mt-1 text-sm text-content-muted">
              Assigned to {plural(assigned.length, "student")} · uploaded {relativeDay(material.updatedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {material.pdfFileName ? (
              <Button asChild variant="outline" size="lg">
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  <ExternalLink data-icon="inline-start" />
                  Open PDF
                </a>
              </Button>
            ) : null}
            <MoreMenu
              label="More material actions"
              dangers={[
                {
                  label: "Remove PDF",
                  icon: <Trash2 aria-hidden="true" />,
                  title: `Remove ${material.pdfOriginalName ?? "this PDF"}?`,
                  message: "Other material in this chapter stays.",
                  consequences: [
                    `${plural(assigned.length, "student")} lose access to it.`,
                    submissions > 0
                      ? `${plural(submissions, "submitted upload")} from students ${submissions === 1 ? "is" : "are"} deleted.`
                      : "Progress recorded against it is cleared.",
                  ],
                  action: removeChapterPdf.bind(null, batchId, courseId, chapterId, material.id),
                },
              ]}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{assignment ? "Submitted" : "Revised"}</span>
            <span className="tabular text-content-muted">
              {done} of {assigned.length}
            </span>
          </div>
          <ProgressMeter
            value={percent(done, assigned.length)}
            label={assignment ? "Assignments submitted" : "Class material revised"}
            tone={assignment ? "highlight" : "brand"}
            className="mt-2"
          />
        </div>

        {assignment && material.instructions ? (
          <div className="rounded-xl bg-sunken/70 p-4">
            <p className="text-xs font-medium tracking-wide text-content-subtle uppercase">Instructions</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{material.instructions}</p>
          </div>
        ) : null}
      </Surface>

      <Surface pad="none" className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h3 className="font-sans text-sm font-medium">Students</h3>
          <StatusPill tone={completionTone(done, assigned.length)} className="tabular">
            {assigned.length === 0 ? "Nobody assigned" : done === assigned.length ? "Everyone done" : `${assigned.length - done} to go`}
          </StatusPill>
        </div>
        {assigned.length === 0 ? (
          <p className="px-5 py-6 text-sm text-content-muted">
            Nobody has this yet. Choose students under &ldquo;Edit who gets it&rdquo; below.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {assigned.map((student) => (
              <li key={student.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{student.name}</span>
                {student.completedAt ? (
                  <span className="text-xs text-content-subtle">{relativeDay(student.completedAt)}</span>
                ) : null}
                <StatusPill tone={student.completedAt ? "success" : assignment ? (late ? "danger" : "warning") : "info"}>
                  {student.completedAt
                    ? assignment && material.dueAt && student.completedAt > material.dueAt
                      ? "Submitted late"
                      : assignment
                        ? "Submitted"
                        : "Revised"
                    : assignment
                      ? late
                        ? "Late"
                        : "To submit"
                      : "To revise"}
                </StatusPill>
                {student.submissionFileName ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={submissionPath(material.id, student.id)} target="_blank" rel="noreferrer">
                      Open upload
                      <span className="sr-only"> from {student.name}</span>
                    </a>
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Surface>

      {material.pdfFileName ? (
        <details className="group rounded-xl bg-surface ring-1 ring-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            Preview PDF
            <span className="text-xs text-content-subtle group-open:hidden">Show</span>
            <span className="hidden text-xs text-content-subtle group-open:inline">Hide</span>
          </summary>
          <iframe
            title={material.pdfOriginalName ?? "Chapter PDF"}
            src={pdfUrl}
            loading="lazy"
            className="h-[32rem] w-full border-t border-line bg-raised"
          />
        </details>
      ) : null}

      <details className="group rounded-xl bg-surface ring-1 ring-line">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          Edit who gets it, category, instructions and due date
          <span className="text-xs text-content-subtle group-open:hidden">Show</span>
          <span className="hidden text-xs text-content-subtle group-open:inline">Hide</span>
        </summary>
        <div className="border-t border-line p-5">
          <MaterialForm
            action={updateChapterPdfAssignments.bind(null, batchId, courseId, chapterId, material.id)}
            students={studentOptions}
            assignedStudentIds={assigned.map((student) => student.id)}
            defaultKind={asMaterialKind(material.kind)}
            defaultInstructions={material.instructions}
            defaultDueAt={dueDateInput(material.dueAt)}
            submitLabel="Save changes"
            showFile={false}
          />
        </div>
      </details>
    </section>
  );
}
