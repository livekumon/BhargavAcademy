import Link from "next/link";
import { Upload, Users } from "lucide-react";
import { BatchUploadSheet } from "@/components/batch-upload-sheet";
import { Button } from "@/components/ui/button";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill, completionTone } from "@/components/ui/status-pill";
import { batchPath } from "@/lib/paths";
import type { BatchCourseSummary } from "@/lib/queries";

function percent(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export function BatchCard({
  batch,
}: {
  batch: {
    id: string;
    name: string;
    description: string;
    studentCount: number;
    course: BatchCourseSummary | null;
    revised: number;
    revisable: number;
    submitted: number;
    submittable: number;
    outstanding: number;
  };
}) {
  const tone = completionTone(
    batch.revised + batch.submitted,
    batch.revisable + batch.submittable,
  );

  return (
    <article className="flex h-full flex-col gap-5 rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading truncate text-title-2 font-semibold">
            <Link
              href={batchPath(batch.id)}
              className="rounded-sm hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {batch.name}
            </Link>
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-content-muted">
            {batch.description || "No description yet."}
          </p>
        </div>
        {batch.revisable + batch.submittable === 0 ? (
          <StatusPill tone="neutral">Nothing assigned</StatusPill>
        ) : batch.outstanding === 0 ? (
          <StatusPill tone="success" dot>
            All caught up
          </StatusPill>
        ) : (
          <StatusPill tone={tone === "success" ? "warning" : tone} dot>
            {batch.outstanding} outstanding
          </StatusPill>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill tone="brand">
          <Users />
          {plural(batch.studentCount, "student")}
        </StatusPill>
        {batch.course ? (
          <StatusPill tone="info">
            {batch.course.chaptersWithMaterial} of {batch.course.chapterCount}{" "}
            {batch.course.chapterCount === 1 ? "chapter" : "chapters"} have
            material
          </StatusPill>
        ) : (
          <StatusPill tone="warning">No course</StatusPill>
        )}
      </div>

      {batch.course ? (
        <p className="text-sm text-content-muted">
          <span className="font-medium text-content">{batch.course.title}</span>
        </p>
      ) : null}

      <div className="mt-auto flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-content-muted">Class material revised</span>
            <span className="tabular font-medium">
              {batch.revised} of {batch.revisable}
            </span>
          </div>
          <ProgressMeter
            value={percent(batch.revised, batch.revisable)}
            label={`${batch.name} class material revised`}
            size="sm"
            className="mt-1.5"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-content-muted">Assignments submitted</span>
            <span className="tabular font-medium">
              {batch.submitted} of {batch.submittable}
            </span>
          </div>
          <ProgressMeter
            value={percent(batch.submitted, batch.submittable)}
            label={`${batch.name} assignments submitted`}
            tone="highlight"
            size="sm"
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
        <Button asChild variant="outline">
          <Link href={batchPath(batch.id)}>Open</Link>
        </Button>
        {batch.course ? (
          <BatchUploadSheet
            batchId={batch.id}
            batchName={batch.name}
            courseId={batch.course.id}
            courseTitle={batch.course.title}
            chapters={batch.course.chapters}
            trigger={
              <Button size="icon" aria-label={`Upload material to ${batch.name}`}>
                <Upload />
              </Button>
            }
          />
        ) : null}
      </div>
    </article>
  );
}
