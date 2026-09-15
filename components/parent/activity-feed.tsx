import Link from "next/link";
import { Award, BookOpenCheck, FileCheck2, Sparkles } from "lucide-react";
import { cn } from "cn";
import {
  firstName,
  formatNumber,
  groupByRecency,
  relativeDay,
  type ActivityEvent,
} from "@/lib/parent-insights";
import { parentChildPath } from "@/lib/paths";

const kinds = {
  revised: { icon: BookOpenCheck, verb: "revised", label: "Revised", tint: "bg-success-subtle text-success-subtle-fg" },
  submitted: { icon: FileCheck2, verb: "submitted", label: "Submitted", tint: "bg-info-subtle text-info-subtle-fg" },
  mark: { icon: Award, verb: "logged marks for", label: "Marks for", tint: "bg-highlight-subtle text-highlight-subtle-fg" },
} as const;

/** What each child did recently, newest first, grouped Today / This week / Earlier. */
export function ActivityFeed({
  events,
  showChild,
  emptyLabel = "Nothing yet. Revisions, submissions and marks will show up here as they happen.",
}: {
  events: ActivityEvent[];
  showChild: boolean;
  emptyLabel?: string;
}) {
  if (events.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-sunken p-4 text-sm text-content-muted">
        <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-content-subtle" />
        <p className="text-pretty">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupByRecency(events).map((group) => (
        <section key={group.label} aria-label={group.label}>
          <p className="text-xs font-medium tracking-wide text-content-subtle uppercase">
            {group.label}
          </p>
          <ol className="relative mt-2 space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[1.1875rem] before:w-px before:bg-line">
            {group.events.map((event) => {
              const kind = kinds[event.type];
              const Icon = kind.icon;
              const body = (
                <>
                  <span
                    className={cn(
                      "relative flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-surface",
                      kind.tint,
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block text-pretty">
                      {showChild ? (
                        <>
                          <span className="font-medium">{firstName(event.childName)} </span>
                          <span className="text-content-muted">{kind.verb} </span>
                        </>
                      ) : (
                        <span className="text-content-muted">{kind.label} </span>
                      )}
                      <span className="font-medium">{event.title}</span>
                    </span>
                    <span className="block truncate text-xs text-content-subtle">
                      {event.detail} · {relativeDay(event.at)}
                    </span>
                  </span>
                  {event.marks ? (
                    <span className="font-heading tabular shrink-0 text-title-3 font-semibold">
                      {formatNumber(event.marks.value)}
                      {event.marks.outOf ? (
                        <span className="text-content-subtle">/{formatNumber(event.marks.outOf)}</span>
                      ) : null}
                    </span>
                  ) : null}
                </>
              );

              return (
                <li key={event.id}>
                  {showChild ? (
                    <Link
                      href={parentChildPath(event.childId, {
                        tab: event.type === "mark" ? "marks" : "chapters",
                      })}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 py-1.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
