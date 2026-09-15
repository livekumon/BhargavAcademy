import Link from "next/link";
import { ArrowRight, Award, Clock } from "lucide-react";
import { ChildAvatar } from "@/components/parent/child-avatar";
import { ProgressRing } from "@/components/parent/progress-ring";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import {
  childStatus,
  formatMark,
  lastActive,
  relativeDay,
} from "@/lib/parent-insights";
import { parentChildPath } from "@/lib/paths";
import type { ParentChild } from "@/lib/queries";

function percent(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

/**
 * A whole-card link to one child. Nothing inside is interactive, so the
 * "Open" affordance is a span, not a button.
 */
export function ChildCard({ child, index }: { child: ParentChild; index: number }) {
  const { progress } = child;
  const status = childStatus(child);
  const active = lastActive(child);
  const [latestMark] = child.marks;
  const submittedPercent = percent(progress.assignmentCompleted, progress.assignmentAssigned);

  return (
    <Link
      href={parentChildPath(child.student.id)}
      className="group block rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <article className="flex h-full flex-col gap-5 rounded-2xl bg-surface p-5 ring-1 ring-line transition-[box-shadow,transform] duration-(--dur-base) ease-out-quart group-hover:-translate-y-0.5 group-hover:shadow-elevation-md sm:p-6">
        <header className="flex items-start gap-3">
          <ChildAvatar name={child.student.name} index={index} />
          <div className="min-w-0 flex-1">
            <h3 className="font-heading truncate text-title-2 font-semibold">
              {child.student.name}
            </h3>
            <p className="truncate text-sm text-content-muted">
              {child.batches.length === 0
                ? "Not enrolled in a batch yet"
                : child.batches.map((batch) => batch.name).join(" · ")}
            </p>
          </div>
          <StatusPill tone={status.tone} dot>
            {status.label}
          </StatusPill>
        </header>

        <div className="flex items-center gap-5">
          <ProgressRing
            value={progress.classMaterialPercent}
            label={`${child.student.name}: class material revised`}
          >
            <span className="font-heading tabular block text-title-3 font-semibold leading-none">
              {progress.classMaterialPercent}%
            </span>
          </ProgressRing>
          <dl className="grid min-w-0 flex-1 gap-3 text-sm">
            <div>
              <dt className="text-content-muted">Class material revised</dt>
              <dd className="tabular font-medium">
                {progress.classMaterialCompleted} of {progress.classMaterialAssigned}
              </dd>
            </div>
            <div>
              <dt className="flex items-center justify-between gap-2 text-content-muted">
                Assignments submitted
                <span className="tabular font-medium text-content">
                  {progress.assignmentCompleted} of {progress.assignmentAssigned}
                </span>
              </dt>
              <dd className="mt-1.5">
                <ProgressMeter
                  value={submittedPercent}
                  label={`${child.student.name}: assignments submitted`}
                  tone="highlight"
                  size="sm"
                />
              </dd>
            </div>
          </dl>
        </div>

        <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-sm text-content-muted">
          {latestMark ? (
            <span className="inline-flex items-center gap-1.5">
              <Award aria-hidden="true" className="size-4 text-highlight" />
              Latest mark
              <span className="tabular font-semibold text-content">{formatMark(latestMark)}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            {active ? `Active ${relativeDay(active)}` : "No activity yet"}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-medium text-brand">
            Open
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-(--dur-base) ease-out-quart group-hover:translate-x-0.5"
            />
          </span>
        </footer>
      </article>
    </Link>
  );
}
