import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, PartyPopper } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { isAssignment } from "@/lib/materials";
import { firstName, outstandingWork } from "@/lib/parent-insights";
import { parentChildPath } from "@/lib/paths";
import type { ParentChild } from "@/lib/queries";

const LIMIT = 5;

/**
 * The open work for one or more children, assignments first. This is the
 * first thing a parent needs to see, so it leads the page.
 */
export function AttentionList({
  items,
  showChild = false,
}: {
  items: ParentChild[];
  showChild?: boolean;
}) {
  const rows = items.flatMap((child) => {
    const { toSubmit, toRevise } = outstandingWork(child.materials);
    return [...toSubmit, ...toRevise].map((material) => ({ child, material }));
  });

  if (rows.length === 0) {
    const allEmpty = items.every((child) => child.materials.length === 0);
    return (
      <div className="flex items-center gap-4 rounded-xl bg-success-subtle/60 p-4 ring-1 ring-success-line">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-success">
          <PartyPopper aria-hidden="true" className="size-5" />
        </span>
        <div className="text-sm">
          <p className="font-medium text-success-subtle-fg">
            {allEmpty ? "Nothing assigned yet" : "All caught up"}
          </p>
          <p className="text-content-muted text-pretty">
            {allEmpty
              ? "Work will appear here once the teacher assigns it."
              : "Every class material is revised and every assignment is submitted."}
          </p>
        </div>
      </div>
    );
  }

  const visible = rows.slice(0, LIMIT);
  const hidden = rows.length - visible.length;

  return (
    <div>
      <ul className="divide-y divide-line overflow-hidden rounded-xl ring-1 ring-line">
        {visible.map(({ child, material }) => {
          const assignment = isAssignment(material.kind);
          const Icon = assignment ? ClipboardList : BookOpen;
          return (
            <li key={`${child.student.id}:${material.id}`} className="flex items-center gap-3 bg-surface px-4 py-3">
              <span
                className={
                  assignment
                    ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-warning-subtle text-warning-subtle-fg"
                    : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info-subtle-fg"
                }
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {showChild ? `${firstName(child.student.name)} · ` : ""}
                  {material.chapterTitle}
                </span>
                <span className="block truncate text-xs text-content-subtle">
                  {assignment ? "Assignment" : "Class material"} · {material.name}
                </span>
              </span>
              <StatusPill tone={assignment ? "warning" : "info"}>
                {assignment ? "To submit" : "To revise"}
              </StatusPill>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && items.length === 1 ? (
        <Link
          href={parentChildPath(items[0].student.id, { tab: "chapters" })}
          className="mt-3 inline-flex items-center gap-1 rounded-lg text-sm font-medium text-brand hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {hidden} more in Chapters
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : hidden > 0 ? (
        <p className="mt-3 text-sm text-content-muted">
          and {hidden} more. Open a child to see everything.
        </p>
      ) : null}
    </div>
  );
}
