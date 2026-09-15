import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { cn } from "cn";
import { ReassignBatchForm } from "@/components/admin/lead-forms";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill, completionTone } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { SELECT_CLASS_NAME } from "@/lib/academics";
import { relativeDay } from "@/lib/admin/format";
import { listAllBatches, listTeacherOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Batches",
};

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ teacherId?: string; stale?: string }>;
}) {
  await requireAdmin();
  const { teacherId, stale } = await searchParams;
  const [batches, teachers] = await Promise.all([
    listAllBatches({ teacherId: teacherId || undefined, stale: stale === "1" }),
    listTeacherOptions(),
  ]);
  const activeTeachers = teachers.filter((teacher) => teacher.active);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Academy"
        title="All batches"
        description="Every batch across every teacher, with how its students are keeping up. Hand a batch to another teacher without losing its students, material, or marks."
      />

      <Surface pad="sm">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-col gap-1.5">
            <label htmlFor="batch-teacher" className="text-sm font-medium">Teacher</label>
            <select id="batch-teacher" name="teacherId" defaultValue={teacherId ?? ""} className={cn(SELECT_CLASS_NAME, "h-9")}>
              <option value="">All teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" name="stale" value="1" defaultChecked={stale === "1"} className="size-4 accent-primary" />
            Only batches with no new material in 14 days
          </label>
          <Button type="submit" variant="secondary" size="lg" className="h-9">Apply</Button>
        </form>
      </Surface>

      {batches.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid />}
          title="No batches match"
          description="Batches are created by teachers in their own workspace."
          action={
            <Button asChild variant="outline">
              <Link href="/admin/batches">Show all batches</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => {
            const pct = batch.assigned ? Math.round((batch.completed / batch.assigned) * 100) : 0;
            return (
              <li key={batch.id}>
                <Surface className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-heading text-title-3 font-semibold">{batch.name}</h2>
                      <p className="text-sm text-content-muted">{batch.courseTitle ?? "No course attached"}</p>
                    </div>
                    {batch.stale ? (
                      <StatusPill tone="warning" size="sm">Quiet 14+ days</StatusPill>
                    ) : (
                      <StatusPill tone={completionTone(batch.completed, batch.assigned)} size="sm">
                        {batch.assigned === 0 ? "Nothing assigned" : `${pct}% done`}
                      </StatusPill>
                    )}
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-content-subtle">Students</dt>
                      <dd className="tabular font-medium">
                        <Link href={`/admin/people?role=student&batchId=${batch.id}`} className="hover:underline">
                          {batch.studentCount}
                        </Link>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-content-subtle">Files</dt>
                      <dd className="tabular font-medium">{batch.materialCount}</dd>
                    </div>
                    <div>
                      <dt className="text-content-subtle">Last upload</dt>
                      <dd className="font-medium">{relativeDay(batch.lastMaterialAt) ?? "Never"}</dd>
                    </div>
                  </dl>
                  {batch.assigned > 0 ? (
                    <ProgressMeter value={pct} label={`${batch.name}: ${batch.completed} of ${batch.assigned} items completed`} size="sm" tone={pct >= 75 ? "success" : pct >= 50 ? "info" : "warning"} />
                  ) : null}
                  <div className="mt-auto border-t border-line pt-4">
                    <p className="mb-2 text-sm">
                      Teacher:{" "}
                      <Link href={`/admin/teachers/${batch.teacherId}`} className="font-medium hover:underline">
                        {batch.teacherName}
                      </Link>
                    </p>
                    <ReassignBatchForm
                      batchId={batch.id}
                      fromTeacherId={batch.teacherId}
                      teachers={activeTeachers.filter((teacher) => teacher.id !== batch.teacherId)}
                    />
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
