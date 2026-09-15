import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { BatchCard } from "@/components/batch-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTeacher } from "@/lib/auth";
import { getBatchOverviews } from "@/lib/batch-overview";

export const metadata: Metadata = {
  title: "Batches",
};

export default async function BatchesPage() {
  const teacher = await requireTeacher();
  const batches = await getBatchOverviews(teacher.id);
  const students = batches.reduce((total, batch) => total + batch.studentCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Teach"
        title="Batches"
        description={
          batches.length > 0
            ? `${batches.length} ${batches.length === 1 ? "batch" : "batches"} · ${students} enrollments. Each batch has one course and its own PDFs.`
            : "Each batch has one course and its own PDFs."
        }
        actions={
          <Button asChild size="lg">
            <Link href="/dashboard/batches/new">
              <Plus data-icon="inline-start" />
              New batch
            </Link>
          </Button>
        }
      />

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
          {batches.map((batch, index) => (
            <li key={batch.id} className="animate-rise" style={{ animationDelay: `${index * 50}ms` }}>
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
