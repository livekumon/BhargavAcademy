import Link from "next/link";
import { Award, LayoutDashboard, ListChecks, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { parentChildPath, type ParentChildTab } from "@/lib/paths";

const tabs: { id: ParentChildTab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "chapters", label: "Chapters", icon: ListChecks },
  { id: "marks", label: "Marks", icon: Award },
];

/**
 * Section links for a child. Real links with the tab in the URL, so back,
 * refresh and sharing all land on the same view. Inline pills from `sm` up;
 * below that a bottom bar where thumbs actually reach.
 */
export function ChildTabs({
  studentId,
  current,
  counts,
}: {
  studentId: string;
  current: ParentChildTab;
  counts?: Partial<Record<ParentChildTab, number>>;
}) {
  return (
    <>
      <nav aria-label="Child sections" className="hidden sm:block">
        <ul className="inline-flex items-center gap-1 rounded-full bg-sunken p-1 ring-1 ring-line">
          {tabs.map((tab) => {
            const active = tab.id === current;
            return (
              <li key={tab.id}>
                <Link
                  href={parentChildPath(studentId, { tab: tab.id })}
                  aria-current={active ? "page" : undefined}
                  scroll={false}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    active
                      ? "bg-brand text-brand-fg shadow-elevation-sm"
                      : "text-content-muted hover:text-content",
                  )}
                >
                  <tab.icon aria-hidden="true" className="size-4" />
                  {tab.label}
                  {counts?.[tab.id] ? (
                    <span
                      className={cn(
                        "tabular rounded-full px-1.5 text-xs",
                        active ? "bg-white/20" : "bg-surface ring-1 ring-line",
                      )}
                    >
                      {counts[tab.id]}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Child sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
      >
        <ul className="grid grid-cols-3">
          {tabs.map((tab) => {
            const active = tab.id === current;
            return (
              <li key={tab.id}>
                <Link
                  href={parentChildPath(studentId, { tab: tab.id })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-(--dur-fast) focus-visible:bg-sunken focus-visible:outline-none",
                    active ? "text-brand" : "text-content-muted",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-(--dur-base)",
                      active && "bg-brand-subtle",
                    )}
                  >
                    <tab.icon aria-hidden="true" className="size-5" />
                    {counts?.[tab.id] ? (
                      <span className="tabular absolute -top-1 right-1 min-w-4 rounded-full bg-warning px-1 text-[0.625rem] leading-4 text-white">
                        {counts[tab.id]}
                      </span>
                    ) : null}
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
