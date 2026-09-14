import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, GraduationCap, LayoutGrid, Plus, Users } from "lucide-react";
import { BatchCard } from "@/components/batch-card";
import { PageHeader } from "@/components/layout/page-header";
import { PrototypeBanner } from "@/components/prototype-banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { requireTeacher } from "@/lib/auth";
import { getBatchProgressMatrix, getTeacherBatches, getTeacherCourses } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Batches",
};

export default async function DashboardPage() {
  const teacher = await requireTeacher();
  const [batchList, courseList] = await Promise.all([
    getTeacherBatches(teacher.id),
    getTeacherCourses(teacher.id),
  ]);

  // All-time progress per batch, so each card can say where the batch stands.
  const batches = await Promise.all(
    batchList.map(async (batch) => {
      const rows = await getBatchProgressMatrix(batch.id, null, null);
      const sum = (pick: (row: (typeof rows)[number]) => number) =>
        rows.reduce((total, row) => total + pick(row), 0);
      return {
        ...batch,
        revised: sum((row) => row.classMaterialCompleted),
        revisable: sum((row) => row.classMaterialAssigned),
        submitted: sum((row) => row.assignmentCompleted),
        submittable: sum((row) => row.assignmentAssigned),
        outstanding: rows.filter(
          (row) =>
            row.classMaterialCompleted < row.classMaterialAssigned ||
            row.assignmentCompleted < row.assignmentAssigned,
        ).length,
      };
    }),
  );

  const enrolments = batches.reduce((total, batch) => total + batch.studentCount, 0);
  const outstanding = batches.reduce((total, batch) => total + batch.outstanding, 0);
  const firstName = teacher.name.split(/\s+/)[0] ?? teacher.name;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`Welcome back, ${firstName}`}
        title="Your batches"
        description="Each batch has one course. Upload material from here — that is the daily job."
        actions={
          <Button asChild size="lg">
            <Link href="/dashboard/batches/new">
              <Plus data-icon="inline-start" />
              New batch
            </Link>
          </Button>
        }
      />

      {batches.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Batches"
            value={batches.length}
            icon={<LayoutGrid className="size-4" />}
          />
          <StatCard
            label="Enrolments"
            value={enrolments}
            hint="A student in two batches counts twice."
            icon={<Users className="size-4" />}
          />
          <StatCard
            label="Courses in library"
            value={courseList.length}
            icon={<BookMarked className="size-4" />}
          />
          <StatCard
            label="Behind on work"
            value={outstanding}
            hint="Counted per batch, like enrolments."
            icon={<GraduationCap className="size-4" />}
          />
        </div>
      ) : null}

      <PrototypeBanner />

      {batches.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No batches yet"
          description="Create a batch with a course. You can enroll students now or after you start uploading material."
          action={
            <Button asChild size="lg">
              <Link href="/dashboard/batches/new">Create your first batch</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <li key={batch.id}>
              <BatchCard batch={batch} />
            </li>
          ))}

          <li>
            <Link
              href="/dashboard/batches/new"
              className="flex h-full min-h-56 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-6 text-center text-content-muted transition-colors duration-(--dur-base) hover:border-brand-line hover:bg-brand-subtle/50 hover:text-brand focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-sunken">
                <Plus aria-hidden="true" className="size-5" />
              </span>
              <span className="font-medium">Create a batch</span>
              <span className="max-w-56 text-sm text-content-subtle">
                One course, optional students, then upload material.
              </span>
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
