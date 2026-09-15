import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, FileText, PartyPopper } from "lucide-react";
import { CompleteClassMaterialForm } from "@/components/complete-class-material-form";
import { PageHeader } from "@/components/layout/page-header";
import { SubmitAssignmentForm } from "@/components/submit-assignment-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { requireStudent } from "@/lib/auth";
import { isAssignment } from "@/lib/materials";
import { materialPath, studentCoursePath, submissionPath } from "@/lib/paths";
import { getStudentAssignedMaterial, getStudentHome } from "@/lib/queries";
import {
  materialStatus,
  materialTitle,
  nextOpenItem,
} from "@/lib/student-work";
import { formatCompletedAt } from "@/lib/submissions";

export const metadata: Metadata = {
  title: "Material",
};

export default async function StudentMaterialPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await params;
  const student = await requireStudent();
  const [owned, home] = await Promise.all([
    getStudentAssignedMaterial(student.id, decodeURIComponent(materialId)),
    getStudentHome(student.id),
  ]);

  if (!owned) {
    notFound();
  }

  const { material, assignment, course, chapter } = owned;
  const assignmentWork = isAssignment(material.kind);
  const title = materialTitle(material);
  const status = materialStatus(material.kind, assignment.completedAt);
  const completed = Boolean(assignment.completedAt);
  const completedLabel = formatCompletedAt(assignment.completedAt);
  const pdfUrl = material.pdfFileName ? materialPath(material.id) : null;
  const workUrl = assignment.submissionFileName
    ? submissionPath(material.id, student.id)
    : null;
  const next = home ? nextOpenItem(home.courses, material.id) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "My courses", href: "/student/courses" },
              { label: course.title, href: studentCoursePath(course.id) },
              { label: title },
            ]}
          />
        }
        eyebrow={`${assignmentWork ? "Assignment" : "Class material"} · ${chapter.title}`}
        title={title}
        actions={
          <StatusPill tone={status.tone} dot>
            {status.label}
            {completed && completedLabel ? ` · ${completedLabel}` : ""}
          </StatusPill>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Surface pad="none" className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
            <FileText aria-hidden="true" className="size-4 shrink-0 text-content-subtle" />
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-content-muted">
              {material.pdfOriginalName ?? "PDF material"}
            </span>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand transition-colors duration-(--dur-fast) hover:bg-brand-subtle focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">Open in new tab</span>
                <span className="sm:hidden">Open</span>
              </a>
            ) : null}
          </div>

          {pdfUrl ? (
            <>
              {/* Embedded PDFs are unreliable on phones, so small screens get a full-screen link instead. */}
              <iframe
                title={material.pdfOriginalName ?? "Assigned PDF"}
                src={pdfUrl}
                className="hidden h-[min(78vh,56rem)] w-full bg-sunken md:block"
              />
              <div className="flex flex-col items-center gap-3 px-5 py-10 text-center md:hidden">
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-2xl bg-brand-subtle text-brand"
                >
                  <FileText className="size-5" />
                </span>
                <p className="text-sm text-content-muted">
                  Opens full screen so it&apos;s easy to read and zoom.
                </p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-brand-fg shadow-elevation-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Read the PDF
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              </div>
            </>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-content-muted">
              This file is missing. Let your teacher know so they can upload it
              again.
            </p>
          )}
        </Surface>

        <aside
          aria-label={assignmentWork ? "Submit your work" : "Your progress"}
          className="flex flex-col gap-4 lg:sticky lg:top-24"
        >
          <Surface className="space-y-5">
            <div className="space-y-1">
              <h2 className="font-heading text-title-2 font-semibold">
                {assignmentWork ? "Submit your work" : "Revise this material"}
              </h2>
              <p className="text-sm text-content-muted text-pretty">
                {assignmentWork
                  ? "Scan or export your completed work as one PDF and upload it here."
                  : "Read through the PDF, then mark it revised so your teacher and parents can see."}
              </p>
            </div>

            {assignmentWork && material.instructions ? (
              <div className="rounded-lg bg-sunken p-4">
                <h3 className="mb-1.5 text-xs font-medium tracking-wide text-content-subtle uppercase">
                  Instructions from your teacher
                </h3>
                <p className="text-sm leading-6 whitespace-pre-wrap">
                  {material.instructions}
                </p>
              </div>
            ) : null}

            {assignmentWork ? (
              <SubmitAssignmentForm
                // A new submission remounts the form, closing the replace picker.
                key={assignment.submissionFileName ?? "none"}
                materialId={material.id}
                completed={completed}
                submissionName={assignment.submissionOriginalName}
                submissionUrl={workUrl}
                submittedLabel={completedLabel}
              />
            ) : (
              <CompleteClassMaterialForm
                materialId={material.id}
                completed={completed}
                completedLabel={completedLabel}
              />
            )}
          </Surface>

          {next ? (
            <Link
              href={next.href}
              className="group flex items-center gap-3 rounded-xl bg-surface p-4 ring-1 ring-line transition-[box-shadow] duration-(--dur-base) hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium tracking-wide text-content-subtle uppercase">
                  {completed ? "Up next" : "After this"}
                </span>
                <span className="block truncate font-medium">{next.title}</span>
                <span className="block truncate text-sm text-content-subtle">
                  {next.courseId === course.id ? next.chapterTitle : next.courseTitle}
                  {" · "}
                  {next.status.label}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 text-brand transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
              />
            </Link>
          ) : completed ? (
            <Surface
              tone="transparent"
              border="none"
              pad="sm"
              className="flex items-center gap-3 bg-highlight-subtle ring-1 ring-highlight-line"
            >
              <PartyPopper aria-hidden="true" className="size-5 shrink-0 text-highlight-subtle-fg" />
              <p className="text-sm text-highlight-subtle-fg">
                That was the last open item. You&apos;re all caught up.
              </p>
            </Surface>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
